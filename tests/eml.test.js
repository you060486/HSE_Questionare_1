// Проверка готового письма, которое скачивает работник.
// Поднимается копия бэкенда на отдельном порту со своим хранилищем ссылок,
// в неё отправляется анкета с вложениями, и разбирается ответ — байт за байтом.
//
// Запуск: node tests/eml.test.js   (из корня репозитория, бэкенд рядом)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const BACKEND = process.env.BACKEND_DIR || '/var/www/newcomer-backend';
const PORT = 3998;
const BASE = `http://127.0.0.1:${PORT}`;

let ok = 0;
let bad = 0;
const check = (name, cond, detail = '') => {
    if (cond) {
        ok += 1;
        console.log('  ok   ' + name);
    } else {
        bad += 1;
        console.log('  FAIL ' + name + (detail ? '\n       ' + detail : ''));
    }
};

/* --- песочница: копия бэкенда со своим портом и пустым хранилищем --- */
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'eml-test-'));
for (const file of ['server.js', 'table.js', 'visitor.js', 'eml.js', 'package.json']) {
    fs.copyFileSync(path.join(BACKEND, file), path.join(sandbox, file));
}
fs.symlinkSync(path.join(BACKEND, 'node_modules'), path.join(sandbox, 'node_modules'));
fs.mkdirSync(path.join(sandbox, 'uploads'));
fs.writeFileSync(path.join(sandbox, 'sessions.json'), '{}');
fs.writeFileSync(
    path.join(sandbox, '.env'),
    'SMTP_USER=sandbox@example.invalid\nSMTP_PASS=none\nADMIN_PASS=test-pass\n'
);
fs.writeFileSync(
    path.join(sandbox, 'server.js'),
    fs.readFileSync(path.join(sandbox, 'server.js'), 'utf8').replace('const PORT = 3002;', `const PORT = ${PORT};`)
);

const server = spawn('node', ['server.js'], { cwd: sandbox, stdio: ['ignore', 'pipe', 'pipe'] });
const serverLog = [];
server.stdout.on('data', (d) => serverLog.push(String(d)));
server.stderr.on('data', (d) => serverLog.push(String(d)));

const stop = () => {
    server.kill();
    fs.rmSync(sandbox, { recursive: true, force: true });
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* --- разбор MIME: ровно то, что увидит почтовая программа --- */
function parseEml(text) {
    const split = text.indexOf('\r\n\r\n');
    const headerLines = text.slice(0, split).split('\r\n');
    const headers = {};
    headerLines.forEach((line) => {
        const i = line.indexOf(':');
        if (i > 0) headers[line.slice(0, i).toLowerCase()] = line.slice(i + 1).trim();
    });
    const boundary = (headers['content-type'] || '').match(/boundary="([^"]+)"/);
    const parts = boundary
        ? text
              .slice(split + 4)
              .split(`--${boundary[1]}`)
              .map((p) => p.replace(/^\r\n/, '').replace(/\r\n$/, ''))
              .filter((p) => p && p !== '--' && p.trim() !== '--')
        : [];
    return { headers, parts };
}

function partInfo(part) {
    const split = part.indexOf('\r\n\r\n');
    const head = part.slice(0, split);
    const body = part.slice(split + 4);
    const type = (head.match(/Content-Type:\s*([^;\r\n]+)/i) || [])[1] || '';
    const nameRaw = (head.match(/filename="([^"]+)"/i) || [])[1] || '';
    const name = nameRaw.startsWith('=?UTF-8?B?')
        ? Buffer.from(nameRaw.replace(/^=\?UTF-8\?B\?/, '').replace(/\?=$/, ''), 'base64').toString('utf8')
        : nameRaw;
    const isBase64 = /Content-Transfer-Encoding:\s*base64/i.test(head);
    return { type, name, head, content: isBase64 ? Buffer.from(body.replace(/\r\n/g, ''), 'base64') : Buffer.from(body) };
}

(async () => {
    try {
        await wait(2500);

        /* --- ссылка со своими получателями --- */
        const created = await fetch(`${BASE}/api/admin/create-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: 'test-pass',
                kind: 'employee',
                recipients: 'hse.one@example.invalid, hse.two@example.invalid',
                employees: [],
            }),
        }).then((r) => r.json());
        check('ссылка создана', !!created.linkId, JSON.stringify(created));

        /* --- анкета с двумя вложениями --- */
        const payload = {
            linkId: created.linkId,
            employer: 'Вега Девелопмент',
            employeeName: 'Проверкин Тест Письмович',
            fioRu: 'Проверкин Тест Письмович',
            positionRu: 'Мастер СМР',
            birthDate: '01.01.1990',
            personalEmail: 'worker@example.invalid',
            phones: ['+7 900 000-00-00'],
            department: 'Строительство',
            rotationStart: '01.11.2026',
            rotation: '42/42',
            snils: '111-222-333 44',
            inn: '111122223333',
            passport: { series: '1111 222222', issuedBy: 'ОВД', issueDate: '01.01.2015' },
            hasElectro: true,
            electroGroup: 'III',
            heightClimb: true,
            consent: true,
        };
        const form = new FormData();
        form.append('data', JSON.stringify(payload));
        form.append('scan1', new Blob([Buffer.from('первый скан')], { type: 'image/jpeg' }), 'Удостоверение ОТ.jpg');
        form.append('scan2', new Blob([Buffer.from('второй скан')], { type: 'application/pdf' }), 'Протокол №12-45.pdf');

        const res = await fetch(`${BASE}/api/submit`, { method: 'POST', body: form });
        check('ответ 200', res.status === 200, String(res.status));
        check('отдан файл письма, а не JSON', (res.headers.get('content-type') || '').includes('message/rfc822'),
            res.headers.get('content-type'));
        const disposition = res.headers.get('content-disposition') || '';
        check('браузеру сказано скачать файл', /^attachment/.test(disposition), disposition);
        check('в имени файла кириллица в UTF-8', /filename\*=UTF-8''/.test(disposition), disposition);
        check('имя файла с фамилией и расширением .eml',
            decodeURIComponent((disposition.match(/filename\*=UTF-8''([^;]+)/) || [])[1] || '').includes('Проверкин') &&
                disposition.includes('.eml'),
            disposition);

        const text = Buffer.from(await res.arrayBuffer()).toString('utf8');
        const { headers, parts } = parseEml(text);

        console.log('\n[Заголовки письма]');
        check('X-Unsent: 1 — Outlook откроет как черновик с кнопкой «Отправить»', headers['x-unsent'] === '1', headers['x-unsent']);
        check('получатели подставлены из админки',
            headers.to === 'hse.one@example.invalid, hse.two@example.invalid', headers.to);
        check('тема письма с фамилией',
            Buffer.from((headers.subject || '').replace(/^=\?UTF-8\?B\?/, '').replace(/\?=$/, ''), 'base64')
                .toString('utf8')
                .includes('Проверкин'),
            headers.subject);
        check('письмо составное', /multipart\/mixed/.test(headers['content-type'] || ''), headers['content-type']);
        check('даты и версии MIME на месте', !!headers.date && headers['mime-version'] === '1.0');

        console.log('\n[Состав письма]');
        check('частей: тело, Excel и два скана', parts.length === 4, String(parts.length));
        const body = partInfo(parts[0]);
        check('первая часть — тело в двух видах', /multipart\/alternative/.test(body.type), body.type);
        const bodyText = body.content.toString('utf8');
        check('внутри и простой текст, и HTML',
            /text\/plain/.test(bodyText) && /text\/html/.test(bodyText));

        const decodedHtml = (() => {
            const m = bodyText.split('--').find((p) => /text\/html/.test(p));
            const b64 = m.slice(m.indexOf('\r\n\r\n') + 4).replace(/\r\n/g, '');
            return Buffer.from(b64, 'base64').toString('utf8');
        })();
        check('в теле фамилия с инициалами', /Проверкин Т\.П\./.test(decodedHtml));
        const visible = decodedHtml.replace(/<td style="font:8px[\s\S]*?<\/table>/, '');
        check('полного ФИО в видимой части нет', !visible.includes('Проверкин Тест Письмович'));
        check('персональных данных в теле нет',
            !visible.includes('111-222-333') && !visible.includes('1111 222222') && !visible.includes('+7 900 000-00-00'));
        check('подсказка с адресами на случай потери получателей', /Письмо адресовано/.test(decodedHtml));
        check('строка для вставки в таблицу на месте', (decodedHtml.match(/<td /g) || []).length >= 52);

        const files = [partInfo(parts[1]), partInfo(parts[2]), partInfo(parts[3])];
        check('первое вложение — сводная таблица Excel',
            files[0].name.endsWith('.xlsx') && files[0].type.includes('spreadsheetml'),
            files[0].name + ' / ' + files[0].type);
        check('Excel не пустой и это настоящий zip-контейнер',
            files[0].content.length > 5000 && files[0].content.slice(0, 2).toString() === 'PK',
            String(files[0].content.length));
        const scanNames = [files[1].name, files[2].name];
        check('оба скана приложены с кириллическими именами',
            scanNames.includes('Удостоверение ОТ.jpg') && scanNames.includes('Протокол №12-45.pdf'),
            scanNames.join(' | '));
        check('содержимое сканов дошло без искажений',
            files[1].content.toString('utf8') === 'первый скан' && files[2].content.toString('utf8') === 'второй скан',
            files[1].content.toString('utf8') + ' | ' + files[2].content.toString('utf8'));
        check('типы сканов сохранены',
            files[1].type.includes('image/jpeg') && files[2].type.includes('application/pdf'),
            files[1].type + ' | ' + files[2].type);

        console.log('\n[Сервер ничего не хранит и никому не пишет]');
        check('папка вложений пуста', fs.readdirSync(path.join(sandbox, 'uploads')).length === 0,
            fs.readdirSync(path.join(sandbox, 'uploads')).join(', '));
        const logText = serverLog.join('');
        check('в логе нет ФИО', !logText.includes('Проверкин'), (logText.match(/.{0,60}Проверкин.{0,20}/) || [''])[0]);
        check('в логе отмечена сборка письма', /анкета собрана/.test(logText));
        check('письмо через SMTP не отправлялось', !/отправлено:/.test(logText));

        console.log('\n[Край]');
        const empty = new FormData();
        empty.append('data', '');
        const emptyRes = await fetch(`${BASE}/api/submit`, { method: 'POST', body: empty });
        check('пустое тело даёт 400', emptyRes.status === 400, String(emptyRes.status));

        console.log(`\nПройдено: ${ok}, провалено: ${bad}`);
        stop();
        process.exit(bad ? 1 : 0);
    } catch (error) {
        console.error('Тест упал:', error);
        console.error(serverLog.join('').slice(-800));
        stop();
        process.exit(1);
    }
})();
