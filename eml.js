// Сборка готового письма (.eml), которое работник скачивает и отправляет сам
// со своей почты. Сервер письмо не отправляет: персональные данные не проходят
// через наш ящик, а получатели видят письмо с корпоративного адреса самого
// работника — такое письмо не попадает в спам.
//
// Формат: multipart/mixed → multipart/alternative (текст + HTML) → вложения.
// Заголовок X-Unsent заставляет Outlook открыть файл как НЕотправленное письмо,
// то есть с кнопкой «Отправить», а не как полученное.

const CRLF = '\r\n';

/** Заголовок с не-ASCII символами по RFC 2047 */
function encodeHeader(value) {
    const text = String(value || '');
    if (!text) return '';
    // eslint-disable-next-line no-control-regex
    if (/^[\x20-\x7E]*$/.test(text)) return text;
    return `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`;
}

/** Base64 строками по 76 символов — так требует RFC, и так его читают все клиенты */
function wrapBase64(buffer) {
    const base64 = Buffer.from(buffer).toString('base64');
    const lines = [];
    for (let i = 0; i < base64.length; i += 76) lines.push(base64.slice(i, i + 76));
    return lines.join(CRLF);
}

function part(headers, body) {
    return headers.join(CRLF) + CRLF + CRLF + body;
}

/**
 * @param {object} options
 * @param {string} options.to        получатели через запятую
 * @param {string} options.subject   тема
 * @param {string} options.html      тело письма
 * @param {string} options.text      то же тело простым текстом
 * @param {Array}  options.attachments  [{ filename, content: Buffer, contentType }]
 * @param {Date}   [options.date]
 * @returns {Buffer} содержимое файла .eml
 */
function buildEml({ to, subject, html, text, attachments = [], date = new Date() }) {
    const stamp = Date.now().toString(36);
    const outer = `----=_vd_mixed_${stamp}`;
    const inner = `----=_vd_alt_${stamp}`;

    const bodyParts = [
        part(
            ['Content-Type: text/plain; charset="utf-8"', 'Content-Transfer-Encoding: base64'],
            wrapBase64(Buffer.from(String(text || ''), 'utf8'))
        ),
        part(
            ['Content-Type: text/html; charset="utf-8"', 'Content-Transfer-Encoding: base64'],
            wrapBase64(Buffer.from(String(html || ''), 'utf8'))
        ),
    ];

    const alternative = part(
        [`Content-Type: multipart/alternative; boundary="${inner}"`],
        bodyParts.map((p) => `--${inner}${CRLF}${p}`).join(CRLF) + `${CRLF}--${inner}--`
    );

    const attachmentParts = attachments.map((file) => {
        const name = encodeHeader(file.filename || 'file');
        return part(
            [
                `Content-Type: ${file.contentType || 'application/octet-stream'}; name="${name}"`,
                'Content-Transfer-Encoding: base64',
                `Content-Disposition: attachment; filename="${name}"`,
            ],
            wrapBase64(file.content)
        );
    });

    const headers = [
        'MIME-Version: 1.0',
        // Главное: Outlook открывает такой файл как черновик с кнопкой «Отправить»
        'X-Unsent: 1',
        `Date: ${date.toUTCString()}`,
        `To: ${to}`,
        `Subject: ${encodeHeader(subject)}`,
        `Content-Type: multipart/mixed; boundary="${outer}"`,
    ];

    const body = [alternative, ...attachmentParts]
        .map((p) => `--${outer}${CRLF}${p}`)
        .join(CRLF);

    return Buffer.from(
        headers.join(CRLF) + CRLF + CRLF + body + CRLF + `--${outer}--` + CRLF,
        'utf8'
    );
}

/** Имя файла для скачивания: и старым клиентам, и современным браузерам */
function contentDisposition(filename) {
    const ascii = String(filename).replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '');
    const encoded = encodeURIComponent(filename);
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

module.exports = { buildEml, contentDisposition, encodeHeader };
