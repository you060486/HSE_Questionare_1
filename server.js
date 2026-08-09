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

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ADMIN_PASS = process.env.ADMIN_PASS;
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

    const trainingsText = [1, 2, 3, 4, 5]
        .map((i) => row[`training${i}`])
        .filter(Boolean)
        .join('; ');

    const summaryPairs = [
        ['Сотрудник', row.fullName],
        ['Отдел', row.department],
        ['Должность', row.positionRu],
        ['Место работы', row.employer],
        ['Вахта', [row.rotationStart, row.rotation].filter(Boolean).join(', ')],
        ['Гражданство', row.citizenship],
        ['Телефон', row.phone],
        ['Почта', [row.personalEmail, row.workEmail].filter(Boolean).join(', ')],
        ['Промышленная безопасность', row.prom],
        ['Электробезопасность', row.electro],
        ['Высота / ОЗП', `${row.height} / ${row.confined}`],
        ['Программа «В»', row.groupV],
        ['Транспорт (SVP)', row.svp + (row.licenceCategories ? ` (${row.licenceCategories})` : '')],
        ['Другие обучения', trainingsText]
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

    <div style="font:11px Arial;color:#6A7A93;border-top:1px solid #DDE3EC;margin-top:20px;padding-top:12px;">
      Во вложении: сводная таблица Excel и все загруженные сканы.
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
