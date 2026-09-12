const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const {
    buildColumns,
    buildSummaryRow,
    normalizePayload,
    buildCopyRowHtml,
    shortName,
    escapeHtml,
} = require('./table.js');
const { buildVisitorEmailHtml, buildVisitorEmailText } = require('./visitor.js');

/** Лог с отметкой времени — без него разбирать «письмо не пришло» невозможно */
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ADMIN_PASS = process.env.ADMIN_PASS;
// Microsoft 365 на стороне получателя отклоняет письма примерно от 25 МБ,
// а base64 раздувает вложения на треть. Держим запас.
const MAX_ATTACHMENTS_BYTES = 18 * 1024 * 1024;

const DEFAULT_RECIPIENTS = 'Andrey.Ryzhov@vegadevelopment.com, Viktoriya.Novikova@vegadevelopment.com';
// Заявки визитёров по умолчанию идут отдельным адресом, чтобы не смешиваться
// с анкетами работников в ящике отдела охраны труда
const DEFAULT_VISITOR_RECIPIENTS = process.env.VISITOR_RECIPIENTS || 'Andrey.Ryzhov@vegadevelopment.com';

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
    // Пишем во временный файл и переименовываем: rename в пределах одной
    // файловой системы атомарен. Прямая запись поверх живого файла означала,
    // что обрыв (диск, kill, рестарт) оставит битый JSON — а тогда getSessions
    // вернёт {} и ВСЕ выданные ссылки разом станут недействительными.
    const tmp = `${SESSIONS_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, SESSIONS_FILE);
}

/* ------------------------------------------------------------------ */
/* Эндпоинты админки                                                   */
/* ------------------------------------------------------------------ */
app.post('/api/admin/create-link', (req, res) => {
    const { password, recipients, employees, kind } = req.body;

    if (password !== ADMIN_PASS) {
        return res.status(403).json({ error: 'Неверный пароль' });
    }

    // Ссылка визитёра — та же запись, но с другим типом и без списка работников
    if (kind === 'visitor') {
        const linkId = crypto.randomBytes(8).toString('hex');
        const sessions = getSessions();
        sessions[linkId] = {
            createdAt: new Date().toISOString(),
            kind: 'visitor',
            recipients: recipients || DEFAULT_VISITOR_RECIPIENTS,
            // Пишем всегда, даже пустым: когда в админке появятся доп. адреса
            // для Полярного Экспресса, старые записи не придётся переносить
            polarRecipients: '',
            employees: []
        };
        saveSessions(sessions);
        log(`создана ссылка визитёра ${linkId} | получатели: ${sessions[linkId].recipients}`);
        return res.json({ linkId, kind: 'visitor' });
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
    // У старых записей поля kind нет — они считаются ссылками работника
    if (session.kind === 'visitor') {
        return res.status(404).json({ error: 'Это ссылка для визитёра' });
    }
    res.json({ employees: session.employees });
});

/** Проверка ссылки визитёра. Данных из сессии анкете визитёра не нужно —
 *  нужен только ответ, действительна ссылка или нет. */
app.get('/api/visitor/session/:linkId', (req, res) => {
    const sessions = getSessions();
    const session = sessions[req.params.linkId];
    if (!session || session.kind !== 'visitor') {
        return res.status(404).json({ error: 'Ссылка недействительна или устарела' });
    }
    res.json({ ok: true });
});

/** Заголовки колонок для страницы копирования — единственный источник истины */
app.get('/api/columns', (req, res) => {
    res.json({ headers: buildColumns().map((c) => c.header) });
});

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
        { header: 'Где сдавал', key: 'venue', width: 10 },
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
                venue: protocol.venue || '',
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
// В теле письма — минимум: фамилия с инициалами, должность и потребности
// в обучении. Полные персональные данные не пишем: они нужны только в строке
// для вставки в таблицу и в приложенном файле, которые уходят получателю
// и на сервере не остаются.
function buildEmailHtml(data) {
    const row = buildSummaryRow(data);

    const trainingsText = [1, 2, 3, 4, 5]
        .map((i) => row[`training${i}`])
        .filter(Boolean)
        .join('; ');

    const needPairs = [
        ['Промышленная безопасность', row.prom],
        ['Электробезопасность', row.electro],
        ['Высота / ОЗП', `${row.height} / ${row.confined}`],
        ['Группа В', row.groupV],
        ['Транспорт (SVP)', row.svp],
        ['Другие обучения', trainingsText],
    ];

    const needRows = needPairs
        .filter(([, value]) => String(value || '').trim())
        .map(
            ([label, value]) =>
                `<tr><td style="font:bold 11px Arial;color:#16255C;padding:1px 8px 1px 0;vertical-align:top;white-space:nowrap;line-height:1.35;">${escapeHtml(
                    label
                )}</td><td style="font:11px Arial;color:#16203A;padding:1px 0;line-height:1.35;">${escapeHtml(value)}</td></tr>`
        )
        .join('');

    return `<!doctype html><html><body style="margin:0;padding:16px;background:#F4F6FA;font-family:Arial,sans-serif;">
  <div style="max-width:1100px;margin:0 auto;background:#fff;border-top:3px solid #1B85CE;padding:18px 20px;">
    <div style="font:bold 19px Arial;color:#16255C;margin:0 0 12px;">${escapeHtml(
        [shortName(row.fullName), row.positionRu].filter(Boolean).join(' — ')
    )}</div>

    <div style="font:bold 11px Arial;letter-spacing:1px;color:#16255C;text-transform:uppercase;margin-bottom:4px;">
      Потребность в обучении
    </div>
    <table style="border-collapse:collapse;margin-bottom:16px;max-width:520px;">${needRows}</table>

    <div style="font:bold 11px Arial;letter-spacing:1px;color:#16255C;text-transform:uppercase;border-top:1px solid #DDE3EC;padding-top:12px;margin-bottom:6px;">
      Строка для вставки в таблицу
    </div>
    <div style="font:10px Arial;color:#6A7A93;margin-bottom:6px;">
      Выделите строку целиком и вставьте в свою таблицу.
    </div>

    <div style="max-width:1060px;overflow-x:auto;">
      ${buildCopyRowHtml(row)}
    </div>

    <div style="font:11px Arial;color:#6A7A93;border-top:1px solid #DDE3EC;margin-top:20px;padding-top:12px;">
      Во вложении: сводная таблица Excel и все загруженные сканы.
      Файлы с сервера удалены сразу после отправки этого письма.
    </div>
  </div>
</body></html>`;
}

function buildEmailText(data) {
    const row = buildSummaryRow(data);
    const lines = [
        [shortName(row.fullName), row.positionRu].filter(Boolean).join(' — '),
        '',
        'Анкета нового работника. Сводная таблица во вложении .xlsx',
        '',
        'Потребность в обучении:',
    ];
    [
        ['Промышленная безопасность', row.prom],
        ['Электробезопасность', row.electro],
        ['Высота / ОЗП', `${row.height} / ${row.confined}`],
        ['Группа В', row.groupV],
        ['Транспорт (SVP)', row.svp],
    ].forEach(([label, value]) => {
        if (String(value || '').trim()) lines.push(`  ${label}: ${value}`);
    });
    [1, 2, 3, 4, 5].forEach((i) => {
        if (row[`training${i}`]) lines.push(`  Другое обучение: ${row[`training${i}`]}`);
    });
    return lines.join('\n');
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
            if (typeof req.body.data !== 'string' || !req.body.data.trim()) {
                cleanup();
                return res.status(400).json({ error: 'no-data' });
            }
            const data = normalizePayload(JSON.parse(req.body.data));
            const sessions = getSessions();
            const session = sessions[data.linkId];
            // Ссылка визитёра не годится для анкеты работника: её получатели —
            // другие люди. Такую анкету отправляем по адресам охраны труда,
            // а расхождение пишем в лог. У старых ссылок поля kind нет —
            // для них ничего не меняется
            const isEmployeeLink = !!session && session.kind !== 'visitor';
            const recipients = isEmployeeLink ? session.recipients : DEFAULT_RECIPIENTS;
            if (session && !isEmployeeLink) {
                log(`ВНИМАНИЕ: анкета работника пришла по ссылке визитёра ${data.linkId}, отправляю на ${recipients}`);
            }

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

            // Считаем вес письма заранее: если не влезет — честно скажем работнику,
            // а не отчитаемся об успехе, которого не было
            const totalBytes = attachments.reduce((sum, a) => {
                if (a.content) return sum + a.content.length;
                try {
                    return sum + fs.statSync(a.path).size;
                } catch {
                    return sum;
                }
            }, 0);

            // ФИО в лог не пишем: это персональные данные, а лог лежит на диске
            log(`анкета принята | получатели: ${recipients} | вложений: ${attachments.length} | вес: ${(totalBytes / 1048576).toFixed(1)} МБ`);

            if (totalBytes > MAX_ATTACHMENTS_BYTES) {
                log(`ОТКАЗ: вложения слишком тяжёлые (${(totalBytes / 1048576).toFixed(1)} МБ)`);
                cleanup();
                return res.status(413).json({ error: 'too-large' });
            }

            const info = await transporter.sendMail({
                // Имя отправителя и обратный адрес заметно улучшают доставляемость:
                // без них почта организации охотнее отправляет письмо в спам
                from: `Анкета нового работника <${SMTP_USER}>`,
                replyTo: data.personalEmail || SMTP_USER,
                to: recipients,
                subject: `Анкета ОТ — ${data.employeeName}`,
                html: buildEmailHtml(data),
                text: buildEmailText(data),
                attachments
            });

            log(`отправлено: ${info.messageId} | принято: ${JSON.stringify(info.accepted)} | отклонено: ${JSON.stringify(info.rejected)} | ответ: ${info.response}`);

            cleanup();
            res.status(200).json({ success: true });
        } catch (error) {
            log(`ОШИБКА: ${error.message || error}`);
            if (error.response) log(`  ответ SMTP: ${error.response}`);
            if (error.stack) log(`  ${error.stack.split('\n').slice(1, 3).join(' | ')}`);
            cleanup();
            if (!res.headersSent) res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    // Без этого одна упавшая отправка навсегда обрывает очередь
    // и все следующие анкеты молча перестают обрабатываться
    }).catch((error) => {
        log(`СБОЙ ОЧЕРЕДИ: ${error && error.message ? error.message : error}`);
    });
});

/* ------------------------------------------------------------------ */
/* Приём заявки визитёра                                               */
/* ------------------------------------------------------------------ */
/** Excel заявки визитёра: одна строка, свои десять колонок */
async function generateVisitorExcelBuffer(data) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vega Development — заявка визитёра';
    workbook.created = new Date();

    // Та же раскладка, что у анкеты работника: строку можно вставить в ту же базу
    const sheet = workbook.addWorksheet('Сводная', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = buildColumns();

    const header = sheet.getRow(1);
    header.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
    header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    header.height = 28;
    header.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16255C' } };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFBFC9D9' } },
            left: { style: 'thin', color: { argb: 'FFBFC9D9' } },
            bottom: { style: 'thin', color: { argb: 'FFBFC9D9' } },
            right: { style: 'thin', color: { argb: 'FFBFC9D9' } }
        };
    });

    const dataRow = sheet.addRow(buildSummaryRow({ ...data, formType: 'visitor' }));
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

    return workbook.xlsx.writeBuffer();
}

// Очередь та же, что у анкеты работника: одно соединение к SMTP и
// гарантированный порядок отправки. Своей очереди визитёр не заводит.
app.post('/api/visitor/submit', upload.any(), (req, res) => {
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
            // Форма присылает multipart с полем data, но на всякий случай
            // разбираем и обычный JSON: express.json() подключён глобально
            const raw = req.body && typeof req.body.data === 'string' && req.body.data.trim()
                ? req.body.data
                : null;
            const data = raw ? JSON.parse(raw) : req.body || {};

            // Без ФИО и даты рождения заявка бесполезна: по ней не оформить
            // пропуск и не найти человека в реестре. Такое тело — либо чужой
            // запрос, либо сбой, и отвечать на него «успешно» нельзя.
            // Остальное (направления, характер работ, контакты) может
            // отсутствовать — заявку всё равно доставляем, в письме будет
            // «не указаны», а пропуск оформят по уточнению
            const missing = ['fullName', 'birthDate'].filter(
                (key) => !String(data[key] || '').trim()
            );
            if (missing.length) {
                log(`ОТКАЗ: заявка визитёра без обязательных полей (${missing.join(', ')})`);
                cleanup();
                return res.status(400).json({ error: 'missing-fields', missing });
            }

            const sessions = getSessions();
            const session = data.linkId ? sessions[data.linkId] : null;

            let recipients = DEFAULT_VISITOR_RECIPIENTS;
            if (session && session.kind === 'visitor' && session.recipients) {
                recipients = session.recipients;
            } else if (data.linkId) {
                // Данные человека важнее строгости: отправляем на адрес по умолчанию,
                // а расхождение фиксируем в логе
                log(`ВНИМАНИЕ: заявка визитёра по неизвестной ссылке ${data.linkId}, отправляю на ${recipients}`);
            }

            const visitorName = String(data.fullName || 'без_имени').trim();
            const safeName = visitorName.replace(/\s+/g, '_');
            const excelBuffer = await generateVisitorExcelBuffer(data);
            const attachments = [{ filename: `Визитёр_${safeName}.xlsx`, content: excelBuffer }];
            const visitorRow = buildSummaryRow({ ...data, formType: 'visitor' });

            const totalBytes = attachments.reduce((sum, a) => sum + (a.content ? a.content.length : 0), 0);
            // ФИО в лог не пишем: это персональные данные, а лог лежит на диске
            log(`заявка визитёра принята | получатели: ${recipients} | вес: ${(totalBytes / 1048576).toFixed(2)} МБ`);

            if (totalBytes > MAX_ATTACHMENTS_BYTES) {
                log(`ОТКАЗ: вложение слишком тяжёлое (${(totalBytes / 1048576).toFixed(1)} МБ)`);
                cleanup();
                return res.status(413).json({ error: 'too-large' });
            }

            const info = await transporter.sendMail({
                from: `Заявка визитёра <${SMTP_USER}>`,
                replyTo: data.email || SMTP_USER,
                to: recipients,
                subject: `Заявка визитёра — ${visitorName}`,
                html: buildVisitorEmailHtml(data),
                text: buildVisitorEmailText(data),
                attachments
            });

            log(`отправлено: ${info.messageId} | принято: ${JSON.stringify(info.accepted)} | отклонено: ${JSON.stringify(info.rejected)} | ответ: ${info.response}`);

            cleanup();
            res.status(200).json({ success: true });
        } catch (error) {
            log(`ОШИБКА заявки визитёра: ${error.message || error}`);
            if (error.response) log(`  ответ SMTP: ${error.response}`);
            if (error.stack) log(`  ${error.stack.split('\n').slice(1, 3).join(' | ')}`);
            cleanup();
            if (!res.headersSent) res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }).catch((error) => {
        log(`СБОЙ ОЧЕРЕДИ: ${error && error.message ? error.message : error}`);
    });
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Newcomer Backend запущен на порту ${PORT}`);
});
