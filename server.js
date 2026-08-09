const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const { buildColumns, buildSummaryRow, normalizePayload } = require('./table.js');

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
const escapeHtml = (value) =>
    String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

function buildEmailHtml(data) {
    const columns = buildColumns();
    const row = buildSummaryRow(data);

    // Крайние столбцы оставляем читаемыми, средние ужимаем до предела,
    // чтобы все 52 колонки помещались без прокрутки вбок
    const lastIndex = columns.length - 1;
    const edgeWidth = 6.5;
    const middleWidth = (100 - edgeWidth * 2) / (columns.length - 2);
    const widthOf = (i) => (i === 0 || i === lastIndex ? edgeWidth : middleWidth);

    const cellBase = 'padding:1px 2px;word-break:break-word;overflow-wrap:anywhere;vertical-align:top;line-height:1.15;';

    const headerCells = columns
        .map(
            (c, i) =>
                `<th style="width:${widthOf(i).toFixed(2)}%;background:#16255C;color:#fff;font:bold 6px Arial;${cellBase}border:1px solid #BFC9D9;text-align:left;">${escapeHtml(
                    c.header
                )}</th>`
        )
        .join('');

    const valueCells = columns
        .map(
            (c, i) =>
                `<td style="width:${widthOf(i).toFixed(2)}%;font:7px Arial;${cellBase}border:1px solid #DDE3EC;">${escapeHtml(
                    row[c.key]
                )}</td>`
        )
        .join('');

    const trainingsText = [1, 2, 3, 4, 5]
        .map((i) => row[`training${i}`])
        .filter(Boolean)
        .join('; ');

    const summaryPairs = [
        ['Отдел', row.department],
        ['Место работы', row.employer],
        ['Вахта', [row.rotationStart, row.rotation].filter(Boolean).join(', ')],
        ['Гражданство', row.citizenship],
        ['Телефон', row.phone],
        ['Почта', [row.personalEmail, row.workEmail].filter(Boolean).join(', ')],
        ['Промышленная безопасность', row.prom],
        ['Электробезопасность', row.electro],
        ['Высота / ОЗП', `${row.height} / ${row.confined}`],
        ['Транспорт (SVP)', row.svp + (row.licenceCategories ? ` (${row.licenceCategories})` : '')],
        ['Другие обучения', trainingsText]
    ];

    const summaryRows = summaryPairs
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
        [row.fullName, row.positionRu].filter(Boolean).join(' — ')
    )}</div>

    <table style="border-collapse:collapse;margin-bottom:16px;max-width:520px;">${summaryRows}</table>

    <div style="font:bold 11px Arial;letter-spacing:1px;color:#16255C;text-transform:uppercase;border-top:1px solid #DDE3EC;padding-top:12px;margin-bottom:6px;">
      Строка для таблицы
    </div>
    <div style="font:10px Arial;color:#6A7A93;margin-bottom:6px;max-width:520px;">
      Выделите таблицу ниже, скопируйте и вставьте в свою базу — колонки встанут по местам.
      Тот же набор данных лежит во вложении <b>.xlsx</b>: там можно нажать Ctrl+A и скопировать всё целиком.
    </div>

    <div style="max-width:720px;">
      <table style="border-collapse:collapse;table-layout:fixed;width:100%;">
        <tr>${headerCells}</tr>
        <tr>${valueCells}</tr>
      </table>
    </div>

    <div style="font:11px Arial;color:#6A7A93;border-top:1px solid #DDE3EC;margin-top:20px;padding-top:12px;">
      Во вложении: сводная таблица Excel и все загруженные сканы.
      Файлы с сервера удалены сразу после отправки этого письма.
    </div>
  </div>
</body></html>`;
}

/** Простая текстовая версия того же письма */
function buildEmailText(data) {
    const columns = buildColumns();
    const row = buildSummaryRow(data);
    const lines = [
        [row.fullName, row.positionRu].filter(Boolean).join(' — '),
        '',
        'Анкета нового работника. Сводная таблица во вложении .xlsx',
        ''
    ];
    columns.forEach((c) => {
        const value = row[c.key];
        if (value === undefined || value === null || String(value).trim() === '') return;
        lines.push(`${c.header}: ${value}`);
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

            log(`анкета: ${data.employeeName} | получатели: ${recipients} | вложений: ${attachments.length} | вес: ${(totalBytes / 1048576).toFixed(1)} МБ`);

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

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Newcomer Backend запущен на порту ${PORT}`);
});
