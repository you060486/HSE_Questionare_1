const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ADMIN_PASS = process.env.ADMIN_PASS;
const DEFAULT_RECIPIENTS = 'Andrey.Ryzhov@vegadevelopment.com, Viktoriya.Novikova@vegadevelopment.com';

// Сколько протоколов помещается в сводную таблицу
const PROTOCOL_SLOTS = 10;
// Сколько телефонов помещается в сводную таблицу
const PHONE_SLOTS = 4;

const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
});

/* ------------------------------------------------------------------ */
/* Хранилище ссылок (сессий)                                           */
/* ------------------------------------------------------------------ */
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

function getSessions() {
    if (!fs.existsSync(SESSIONS_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    } catch (e) {
        console.error('sessions.json повреждён:', e.message);
        return {};
    }
}

function saveSessions(data) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
}

/* Транслитерация — если английское имя не передали из админки */
function transliterate(text) {
    if (!text) return '';
    const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    return text
        .split('')
        .map((ch) => {
            const lower = ch.toLowerCase();
            const replacement = map[lower];
            if (replacement === undefined) return ch;
            return ch === lower ? replacement : replacement.toUpperCase();
        })
        .join('')
        .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Эндпоинты админки                                                   */
/* ------------------------------------------------------------------ */
app.post('/api/admin/create-link', (req, res) => {
    const { password, recipients, employees } = req.body;

    if (password !== ADMIN_PASS) {
        return res.status(403).json({ error: 'Неверный пароль' });
    }

    const processedEmployees = (employees || []).map((emp) => {
        let workEmail = '';
        if (emp.nameEn && emp.surnameEn) {
            workEmail = `${emp.nameEn.trim()}.${emp.surnameEn.trim()}@vegadevelopment.com`;
        }
        return { ...emp, workEmail };
    });

    const linkId = crypto.randomBytes(8).toString('hex');
    const sessions = getSessions();

    sessions[linkId] = {
        createdAt: new Date().toISOString(),
        recipients: recipients || DEFAULT_RECIPIENTS,
        employees: processedEmployees
    };

    saveSessions(sessions);
    res.json({ linkId });
});

app.get('/api/session/:linkId', (req, res) => {
    const sessions = getSessions();
    const session = sessions[req.params.linkId];
    if (!session) return res.status(404).json({ error: 'Ссылка недействительна или устарела' });
    res.json({ employees: session.employees });
});

/* ------------------------------------------------------------------ */
/* Раскладка сводной таблицы                                           */
/* ------------------------------------------------------------------ */
// width — ширина столбца в Excel. Держим узкой, чтобы таблицу было удобно
// выделить целиком и вставить в свою базу.
function buildColumns() {
    const columns = [
        { header: 'Дата анкеты', key: 'submittedAt', width: 11 },
        { header: 'Место работы', key: 'employer', width: 14 },
        { header: 'ФИО', key: 'fullName', width: 22 },
        { header: 'NAME', key: 'nameLatin', width: 18 },
        { header: 'Должность', key: 'positionRu', width: 18 },
        { header: 'Position', key: 'positionEn', width: 18 },
        { header: 'Дата рожд.', key: 'birthDate', width: 11 },
        { header: 'Гражданство', key: 'citizenship', width: 12 },
        { header: 'Длит. вахты', key: 'rotation', width: 10 },
        { header: 'Рабочая почта', key: 'workEmail', width: 22 },
        { header: 'Личная почта', key: 'personalEmail', width: 22 }
    ];

    for (let i = 1; i <= PHONE_SLOTS; i += 1) {
        columns.push({ header: `Телефон ${i}`, key: `phone${i}`, width: 15 });
    }

    columns.push(
        { header: 'СНИЛС', key: 'snils', width: 13 },
        { header: 'ИИН / Личный №', key: 'foreignId', width: 14 },
        { header: 'ИНН', key: 'inn', width: 13 },
        { header: 'Паспорт серия и №', key: 'passportNumber', width: 14 },
        { header: 'Паспорт дата выдачи', key: 'passportDate', width: 11 },
        { header: 'Паспорт кем выдан', key: 'passportIssuedBy', width: 26 },
        { header: 'Паспорт код подр.', key: 'passportCode', width: 10 },
        { header: 'Высота', key: 'height', width: 9 },
        { header: 'ОЗП', key: 'confined', width: 9 },
        { header: 'Эл. без.', key: 'electro', width: 12 },
        { header: 'ЭБ группа', key: 'electroGroup', width: 8 },
        { header: 'ЭБ дата', key: 'electroDate', width: 11 },
        { header: 'ЭБ образование', key: 'electroEducation', width: 20 },
        { header: 'Пром. без.', key: 'prom', width: 12 },
        { header: 'Все литеры', key: 'allAreas', width: 22 },
        { header: 'Кол-во протоколов', key: 'protocolCount', width: 8 },
        { header: 'SVP (транспорт)', key: 'svp', width: 11 },
        { header: 'ВУ номер', key: 'licenceNumber', width: 13 },
        { header: 'ВУ дата', key: 'licenceDate', width: 11 },
        { header: 'ВУ категории', key: 'licenceCategories', width: 13 },
        { header: 'Другие обучения', key: 'trainings', width: 30 }
    );

    // Место под протоколы: столбцы есть всегда, пустые просто не заполняются
    for (let i = 1; i <= PROTOCOL_SLOTS; i += 1) {
        columns.push(
            { header: `П${i} №`, key: `protocol${i}Number`, width: 12 },
            { header: `П${i} дата`, key: `protocol${i}Date`, width: 11 },
            { header: `П${i} литеры`, key: `protocol${i}Areas`, width: 18 }
        );
    }

    return columns;
}

/**
 * Приводит данные к текущему формату.
 * Боевая и тестовая версии анкеты работают с одним бэкендом, а старая версия
 * присылает поля по-другому. Пока обе живут параллельно, разбираем оба варианта.
 */
function normalizePayload(raw) {
    const data = { ...raw };

    // Телефон: раньше приходил один строкой
    if (!Array.isArray(data.phones)) {
        data.phones = data.phone ? [data.phone] : [];
    }

    // Паспорт: раньше лежал отдельными полями верхнего уровня
    if (!data.passport && data.passportSeriesNumber) {
        data.passport = {
            number: data.passportSeriesNumber,
            issuedBy: data.passportIssuedBy || '',
            issueDate: data.passportIssueDate || '',
            deptCode: data.passportDeptCode || ''
        };
    }

    // Протоколы: раньше приходили одной строкой вида "№12 от 01.01.2024 гр.Б.8.3"
    if (!Array.isArray(data.protocols)) {
        data.protocols = [];
        if (data.promDetails) {
            data.legacyPromDetails = data.promDetails;
        }
    }

    // Электробезопасность: раньше всё лежало в одной строке
    if (!data.electroGroup && !data.electroEducation && data.electroDetails) {
        data.electroEducation = data.electroDetails;
    }

    // Другие обучения: раньше приходили строкой через точку с запятой
    if (!Array.isArray(data.trainings)) {
        data.trainings = String(data.otherTrainingsDetails || '')
            .split(';')
            .map((title) => title.trim())
            .filter(Boolean)
            .map((title) => ({ code: '', title }));
    }

    // Идентификатор: в старой версии всегда СНИЛС
    if (!data.personalIdKey && data.snils) {
        data.personalIdKey = 'snils';
        data.personalIdValue = data.snils;
    }

    return data;
}

/* Готовит плоский объект «одна строка таблицы» из данных анкеты */
function buildSummaryRow(data) {
    const heightStr = (() => {
        if (data.heightClimb && data.heightApprove) return '2, 3 гр.';
        if (data.heightClimb) return '2 гр.';
        if (data.heightApprove) return '3 гр.';
        return 'не требуется';
    })();

    const confinedStr = (() => {
        if (data.confinedWork && data.confinedApprove) return '2, 3 гр.';
        if (data.confinedWork) return '2 гр.';
        if (data.confinedApprove) return '3 гр.';
        return 'не требуется';
    })();

    let electroStr = 'не требуется';
    if (data.electroStatusRaw === 'dont_need') electroStr = 'I гр.';
    else if (data.electroStatusRaw === 'have' || data.electroStatusRaw === 'need') electroStr = 'требуется обучение';

    let promStr = 'не требуется';
    if (data.promStatusRaw === 'have' || data.promStatusRaw === 'need') promStr = 'требуется обучение';

    const nameLatin =
        data.nameEn || data.surnameEn
            ? `${data.nameEn || ''} ${data.surnameEn || ''}`.trim().toUpperCase()
            : transliterate(data.employeeName);

    const protocols = Array.isArray(data.protocols) ? data.protocols : [];
    const allAreas = [...new Set(protocols.flatMap((p) => p.areas || []))];

    const phones = Array.isArray(data.phones) ? data.phones : data.phone ? [data.phone] : [];

    const passport = data.passport || {};
    const licence = data.licence || {};

    const row = {
        submittedAt: new Date().toLocaleDateString('ru-RU'),
        employer: data.employer || '',
        fullName: data.employeeName || '',
        nameLatin,
        positionRu: data.positionRu || '',
        positionEn: data.positionEn || '',
        birthDate: data.birthDate || '',
        citizenship: data.citizenship || '',
        rotation: '',
        workEmail: data.workEmail || '',
        personalEmail: data.personalEmail || '',

        snils: data.snils || '',
        foreignId: data.personalIdKey && data.personalIdKey !== 'snils' ? data.personalIdValue || '' : '',
        inn: data.inn || '',

        passportNumber: passport.number || '',
        passportDate: passport.issueDate || '',
        passportIssuedBy: passport.issuedBy || '',
        passportCode: passport.deptCode || '',

        height: heightStr,
        confined: confinedStr,
        electro: electroStr,
        electroGroup: data.electroGroup || '',
        electroDate: data.electroDate || '',
        electroEducation: data.electroEducation || '',
        prom: promStr,
        allAreas: allAreas.length ? allAreas.join(', ') : data.legacyPromDetails || '',
        protocolCount: protocols.length || '',
        svp: data.driveWill ? 'требуется' : 'не требуется',
        licenceNumber: licence.number || '',
        licenceDate: licence.date || '',
        licenceCategories: (licence.categories || []).join(', '),
        trainings: (data.trainings || []).map((t) => t.title).filter(Boolean).join('; ')
    };

    for (let i = 1; i <= PHONE_SLOTS; i += 1) {
        row[`phone${i}`] = phones[i - 1] || '';
    }

    for (let i = 1; i <= PROTOCOL_SLOTS; i += 1) {
        const protocol = protocols[i - 1];
        row[`protocol${i}Number`] = protocol ? protocol.number || '' : '';
        row[`protocol${i}Date`] = protocol ? protocol.date || '' : '';
        row[`protocol${i}Areas`] = protocol ? (protocol.areas || []).join(', ') : '';
    }

    return row;
}

/* ------------------------------------------------------------------ */
/* Генерация Excel                                                     */
/* ------------------------------------------------------------------ */
async function generateExcelBuffer(data) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vega Development — анкета нового работника';
    workbook.created = new Date();

    const columns = buildColumns();
    const row = buildSummaryRow(data);

    /* --- Лист 1: сводная строка --- */
    const summary = workbook.addWorksheet('Сводная', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });
    summary.columns = columns;

    const headerRow = summary.getRow(1);
    headerRow.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16255C' } };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFBFC9D9' } },
            left: { style: 'thin', color: { argb: 'FFBFC9D9' } },
            bottom: { style: 'thin', color: { argb: 'FFBFC9D9' } },
            right: { style: 'thin', color: { argb: 'FFBFC9D9' } }
        };
    });

    const dataRow = summary.addRow(row);
    dataRow.font = { size: 10 };
    dataRow.alignment = { vertical: 'top', wrapText: false };
    dataRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFDDE3EC' } },
            left: { style: 'thin', color: { argb: 'FFDDE3EC' } },
            bottom: { style: 'thin', color: { argb: 'FFDDE3EC' } },
            right: { style: 'thin', color: { argb: 'FFDDE3EC' } }
        };
    });

    /* --- Лист 2: протоколы построчно (удобно для автоматизации) --- */
    const protocols = Array.isArray(data.protocols) ? data.protocols : [];
    const detail = workbook.addWorksheet('Протоколы', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });
    detail.columns = [
        { header: 'ФИО', key: 'fullName', width: 22 },
        { header: 'NAME', key: 'nameLatin', width: 18 },
        { header: '№ протокола', key: 'number', width: 14 },
        { header: 'Дата', key: 'date', width: 11 },
        { header: 'Литера', key: 'area', width: 10 }
    ];
    const detailHeader = detail.getRow(1);
    detailHeader.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
    detailHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    detailHeader.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16255C' } };
    });

    protocols.forEach((protocol) => {
        const areas = protocol.areas && protocol.areas.length ? protocol.areas : [''];
        areas.forEach((area) => {
            detail.addRow({
                fullName: row.fullName,
                nameLatin: row.nameLatin,
                number: protocol.number || '',
                date: protocol.date || '',
                area
            });
        });
    });

    return workbook.xlsx.writeBuffer();
}

/* ------------------------------------------------------------------ */
/* Тело письма: карточка для чтения + таблица для копирования          */
/* ------------------------------------------------------------------ */
const escapeHtml = (value) =>
    String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

function buildEmailHtml(data) {
    const columns = buildColumns();
    const row = buildSummaryRow(data);

    const headerCells = columns
        .map(
            (c) =>
                `<th style="background:#16255C;color:#fff;font:bold 10px Arial;padding:4px 6px;border:1px solid #BFC9D9;white-space:nowrap;">${escapeHtml(
                    c.header
                )}</th>`
        )
        .join('');

    const valueCells = columns
        .map(
            (c) =>
                `<td style="font:11px Arial;padding:4px 6px;border:1px solid #DDE3EC;white-space:nowrap;">${escapeHtml(
                    row[c.key]
                )}</td>`
        )
        .join('');

    // Тот же набор данных в виде текста с табуляцией — можно скопировать
    // и вставить в Google-таблицу или блокнот
    const tsvHeader = columns.map((c) => c.header).join('\t');
    const tsvValues = columns.map((c) => String(row[c.key] === undefined ? '' : row[c.key])).join('\t');

    const summaryPairs = [
        ['Сотрудник', row.fullName],
        ['Место работы', row.employer],
        ['Должность', row.positionRu],
        ['Гражданство', row.citizenship],
        ['Телефон', [row.phone1, row.phone2, row.phone3, row.phone4].filter(Boolean).join(', ')],
        ['Почта', [row.personalEmail, row.workEmail].filter(Boolean).join(', ')],
        ['Промышленная безопасность', row.prom + (row.allAreas ? ` (${row.allAreas})` : '')],
        ['Электробезопасность', row.electro + (row.electroGroup ? `, гр. ${row.electroGroup}` : '')],
        ['Высота / ОЗП', `${row.height} / ${row.confined}`],
        ['Транспорт', row.svp + (row.licenceCategories ? ` (${row.licenceCategories})` : '')],
        ['Другие обучения', row.trainings || '—']
    ];

    const summaryRows = summaryPairs
        .map(
            ([label, value]) =>
                `<tr><td style="font:bold 12px Arial;color:#16255C;padding:3px 10px 3px 0;vertical-align:top;white-space:nowrap;">${escapeHtml(
                    label
                )}</td><td style="font:12px Arial;color:#16203A;padding:3px 0;">${escapeHtml(value || '—')}</td></tr>`
        )
        .join('');

    return `<!doctype html><html><body style="margin:0;padding:16px;background:#F4F6FA;font-family:Arial,sans-serif;">
  <div style="max-width:1100px;margin:0 auto;background:#fff;border-top:3px solid #1B85CE;padding:18px 20px;">
    <div style="font:bold 11px Arial;letter-spacing:2px;color:#1B85CE;text-transform:uppercase;">Vega Development</div>
    <div style="font:bold 19px Arial;color:#16255C;margin:4px 0 14px;">Анкета нового работника</div>

    <table style="border-collapse:collapse;margin-bottom:20px;">${summaryRows}</table>

    <div style="font:bold 11px Arial;letter-spacing:1px;color:#16255C;text-transform:uppercase;border-top:1px solid #DDE3EC;padding-top:14px;margin-bottom:8px;">
      Строка для таблицы
    </div>
    <div style="font:11px Arial;color:#6A7A93;margin-bottom:8px;">
      Выдели таблицу ниже, скопируй и вставь в свою базу — колонки встанут по местам.
      Тот же набор данных лежит во вложении <b>.xlsx</b>: там можно нажать Ctrl+A и скопировать всё целиком.
    </div>

    <div style="overflow-x:auto;">
      <table style="border-collapse:collapse;">
        <tr>${headerCells}</tr>
        <tr>${valueCells}</tr>
      </table>
    </div>

    <div style="font:bold 11px Arial;letter-spacing:1px;color:#16255C;text-transform:uppercase;border-top:1px solid #DDE3EC;padding-top:14px;margin:20px 0 8px;">
      То же самое текстом
    </div>
    <div style="font:11px Arial;color:#6A7A93;margin-bottom:8px;">
      Для вставки в Google-таблицу: скопируй обе строки ниже.
    </div>
    <pre style="font:11px 'Courier New',monospace;background:#F4F6FA;border:1px solid #DDE3EC;padding:10px;margin:0;white-space:pre;overflow-x:auto;">${escapeHtml(
        tsvHeader
    )}
${escapeHtml(tsvValues)}</pre>

    <div style="font:11px Arial;color:#6A7A93;border-top:1px solid #DDE3EC;margin-top:20px;padding-top:12px;">
      Во вложении: сводная таблица Excel, анкета в Word и все загруженные сканы.
      Файлы с сервера удалены сразу после отправки этого письма.
    </div>
  </div>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* Приём анкеты                                                        */
/* ------------------------------------------------------------------ */
let submissionQueue = Promise.resolve();

app.post('/api/submit', upload.any(), (req, res) => {
    submissionQueue = submissionQueue.then(async () => {
        const cleanup = () => {
            if (req.files) {
                req.files.forEach((f) => {
                    try {
                        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
                    } catch (e) {
                        console.error('Не удалось удалить файл:', f.path, e.message);
                    }
                });
            }
        };

        try {
            const data = normalizePayload(JSON.parse(req.body.data));
            const sessions = getSessions();
            const session = sessions[data.linkId];
            const recipients = session ? session.recipients : DEFAULT_RECIPIENTS;

            const safeName = String(data.employeeName || 'без_имени').replace(/\s+/g, '_');
            const excelBuffer = await generateExcelBuffer(data);

            const attachments = [{ filename: `Анкета_${safeName}.xlsx`, content: excelBuffer }];

            if (req.files) {
                for (const file of req.files) {
                    attachments.push({
                        filename: Buffer.from(file.originalname, 'latin1').toString('utf8'),
                        path: file.path
                    });
                }
            }

            await transporter.sendMail({
                from: SMTP_USER,
                to: recipients,
                subject: `Анкета ОТ — ${data.employeeName}`,
                html: buildEmailHtml(data),
                attachments
            });

            cleanup();
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Ошибка при обработке анкеты:', error.message || error);
            cleanup();
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Newcomer Backend запущен на порту ${PORT}`);
});
