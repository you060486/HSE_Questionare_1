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

const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
});

// --- БАЗА ДАННЫХ ДЛЯ ССЫЛОК (СЕССИЙ) ---
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

function getSessions() {
    if (!fs.existsSync(SESSIONS_FILE)) return {};
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
}

function saveSessions(data) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
}

// Транслитерация (на случай, если Name/Surname на английском не передали)
function transliterate(text) {
    if (!text) return '';
    const ruEn = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh',
        'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
        'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
        'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };
    return text.split('').map(char => ruEn[char] || char).join('').toUpperCase();
}

// --- ENDPOINTS ДЛЯ АДМИНКИ ---
// Создание новой ссылки
app.post('/api/admin/create-link', (req, res) => {
    const { password, recipients, employees } = req.body;
    
    if (password !== ADMIN_PASS) {
        return res.status(403).json({ error: 'Неверный пароль' });
    }

    // Обрабатываем сотрудников (генерируем рабочую почту, если есть имя и фамилия)
    const processedEmployees = (employees || []).map(emp => {
        let workEmail = '';
        if (emp.nameEn && emp.surnameEn) {
            workEmail = `${emp.nameEn}.${emp.surnameEn}@vegadevelopment.com`;
        }
        return { ...emp, workEmail };
    });

    const linkId = crypto.randomBytes(8).toString('hex'); // Генерируем уникальный ID (например, a1b2c3d4)
    const sessions = getSessions();
    
    sessions[linkId] = {
        createdAt: new Date().toISOString(),
        recipients: recipients || 'Andrey.Ryzhov@vegadevelopment.com, Viktoriya.Novikova@vegadevelopment.com',
        employees: processedEmployees
    };
    
    saveSessions(sessions);
    res.json({ linkId });
});

// Получение данных по ссылке (для загрузки на фронтенде)
app.get('/api/session/:linkId', (req, res) => {
    const sessions = getSessions();
    const session = sessions[req.params.linkId];
    if (!session) return res.status(404).json({ error: 'Ссылка недействительна или устарела' });
    
    // Возвращаем только сотрудников, адресатов фронтенду знать не нужно
    res.json({ employees: session.employees });
});

// --- ГЕНЕРАЦИЯ EXCEL ---
async function generateExcelBuffer(userData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Анкета');
    
    worksheet.columns = [
        { header: 'Основное место работы', key: 'employer', width: 25 },
        { header: 'ФИО', key: 'fullName', width: 30 },
        { header: 'NAME', key: 'translitName', width: 30 },
        { header: 'Должность', key: 'positionRu', width: 30 },
        { header: 'Position', key: 'positionEn', width: 30 },
        { header: 'Дата рождения', key: 'birthDate', width: 15 },
        { header: 'Длительность вахты', key: 'vahta', width: 20 },
        { header: 'Рабочая почта', key: 'workEmail', width: 30 },
        { header: 'СНИЛС', key: 'snils', width: 15 },
        { header: 'Гражданство', key: 'citizenship', width: 15 },
        { header: 'Телефон', key: 'phone', width: 20 },
        { header: 'Личная почта', key: 'personalEmail', width: 25 },
        { header: 'ИНН', key: 'inn', width: 20 },
        { header: 'Паспорт', key: 'passport', width: 30 },
        { header: 'Высота', key: 'height', width: 15 },
        { header: 'ОЗП', key: 'confined', width: 15 },
        { header: 'Эл. Без', key: 'electro', width: 20 },
        { header: 'Эл. Без детали', key: 'electroDetails', width: 40 },
        { header: 'Пром. Без', key: 'prom', width: 20 },
        { header: 'Пр. Без детали', key: 'promDetails', width: 40 },
        { header: 'SVP', key: 'svp', width: 15 }
    ];
    worksheet.getRow(1).font = { bold: true };

    // Логика Высоты и ОЗП
    let heightStr = "не требуется";
    if (userData.heightClimb && userData.heightApprove) heightStr = "2, 3 гр.";
    else if (userData.heightClimb) heightStr = "2 гр.";
    else if (userData.heightApprove) heightStr = "3 гр.";

    let confinedStr = "не требуется";
    if (userData.confinedWork && userData.confinedApprove) confinedStr = "2, 3 гр.";
    else if (userData.confinedWork) confinedStr = "2 гр.";
    else if (userData.confinedApprove) confinedStr = "3 гр.";

    // Логика Эл.Без
    let electroStr = "не требуется";
    let electroDet = "";
    if (userData.electroStatusRaw === 'dont_need') {
        electroStr = "I гр.";
    } else if (userData.electroStatusRaw === 'have' || userData.electroStatusRaw === 'need') {
        electroStr = "требуется обучение";
        electroDet = userData.electroDetails || '';
    }

    // Логика Пром.Без
    let promStr = "не требуется";
    let promDet = "";
    if (userData.promStatusRaw === 'have' || userData.promStatusRaw === 'need') {
        promStr = "требуется обучение";
        promDet = userData.promDetails || '';
    }

    // Формируем английское имя: берем заданные nameEn/surnameEn, либо транслитируем ФИО
    let finalEnglishName = '';
    if (userData.nameEn || userData.surnameEn) {
        finalEnglishName = `${userData.nameEn || ''} ${userData.surnameEn || ''}`.trim();
    } else {
        finalEnglishName = transliterate(userData.employeeName);
    }

    worksheet.addRow({
        employer: userData.employer || 'Vega Development',
        fullName: userData.employeeName || '',
        translitName: finalEnglishName,
        positionRu: userData.positionRu || '',
        positionEn: userData.positionEn || '',
        birthDate: userData.birthDate || '',
        vahta: '', // Всегда пустое
        workEmail: userData.workEmail || '',
        snils: userData.snils || '',
        citizenship: userData.citizenship || 'РФ',
        phone: userData.phone || '',
        personalEmail: userData.personalEmail || '',
        inn: userData.inn || '',
        passport: userData.passportSeriesNumber ? `${userData.passportSeriesNumber}, выдан: ${userData.passportIssuedBy} (${userData.passportIssueDate}), код: ${userData.passportDeptCode}` : '',
        height: heightStr,
        confined: confinedStr,
        electro: electroStr,
        electroDetails: electroDet,
        prom: promStr,
        promDetails: promDet,
        svp: userData.driveWill ? "требуется" : "не требуется"
    });

    return await workbook.xlsx.writeBuffer();
}

let submissionQueue = Promise.resolve();

app.post('/api/submit', upload.any(), (req, res) => {
    submissionQueue = submissionQueue.then(async () => {
        try {
            const userData = JSON.parse(req.body.data);
            const linkId = userData.linkId; // ID сессии
            
            // Находим сессию, чтобы понять, кому отправлять
            const sessions = getSessions();
            const session = sessions[linkId];
            
            // Если ссылку не указали или она удалена, ставим дефолтных получателей
            const recipients = session ? session.recipients : 'Andrey.Ryzhov@vegadevelopment.com, Viktoriya.Novikova@vegadevelopment.com';

            const safeName = userData.employeeName.replace(/\s+/g, '_');
            const excelBuffer = await generateExcelBuffer(userData);
            
            const attachments = [
                { filename: `Анкета_${safeName}.xlsx`, content: excelBuffer }
            ];

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
                subject: `Анкета ОТ ${userData.employeeName}`,
                text: `Поступила новая анкета от сотрудника: ${userData.employeeName} (${userData.employer || 'Vega Development'}).\n\nТелефон: ${userData.phone}\nEmail: ${userData.personalEmail}\nРабочая почта: ${userData.workEmail}\n\nВо вложении находится сводная таблица Excel, документ Word и все сканы документов.`,
                attachments: attachments
            });

            if (req.files) req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
            res.status(200).json({ success: true });

        } catch (error) {
            console.error("Ошибка при обработке:", error.message || error);
            if (req.files) req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Newcomer Backend запущен на порту ${PORT}`);
});
