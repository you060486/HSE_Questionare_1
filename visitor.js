// Анкета визитёра: свой набор колонок, своя строка и своё письмо.
//
// Почему отдельно от table.js: там 52 колонки под работника, жёстко
// проставленный status = 'Employed' и расчёты обучений, которые визитёру
// не нужны. Прогон визитёра через тот же код дал бы строку, где заполнено
// восемь полей из пятидесяти двух, а в трёх графах стояло бы «не требуется».

/* ------------------------------------------------------------------ */
/* Колонки                                                             */
/* ------------------------------------------------------------------ */
const VISITOR_COLUMNS = [
    { n: 1, key: 'status', header: 'Статус', width: 10 },
    { n: 2, key: 'submittedAt', header: 'Дата заявки', width: 12 },
    { n: 3, key: 'fullName', header: 'ФИО', width: 28 },
    { n: 4, key: 'position', header: 'Должность', width: 24 },
    { n: 5, key: 'birthDate', header: 'Дата рождения', width: 13 },
    { n: 6, key: 'directions', header: 'Направления посещения', width: 52 },
    { n: 7, key: 'visitMode', header: 'Характер работ', width: 26 },
    { n: 8, key: 'phone', header: 'Телефон', width: 20 },
    { n: 9, key: 'email', header: 'Электронная почта', width: 26 },
    // Считается из кодов направлений. Нужна, чтобы после включения доп. адресов
    // можно было по таблице проверить, должна ли была сработать рассылка.
    { n: 10, key: 'polarExpress', header: 'Полярный Экспресс', width: 12 },
];

function buildVisitorColumns() {
    return VISITOR_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
}

/** Признак объектов Полярного Экспресса — по кодам, не по тексту */
const POLAR_EXPRESS_CODES = ['ПЭ-дорога'];

function visitorTouchesPolarExpress(data) {
    const directions = Array.isArray(data.directions) ? data.directions : [];
    return directions.some((d) => POLAR_EXPRESS_CODES.includes(d && d.code ? d.code : d));
}

/* ------------------------------------------------------------------ */
/* Строка таблицы                                                      */
/* ------------------------------------------------------------------ */
function buildVisitorRow(data) {
    const row = {};
    VISITOR_COLUMNS.forEach((c) => {
        row[c.key] = '';
    });

    // Отличает визитёра от работника, если строки лягут в одну таблицу
    row.status = 'Visitor';
    row.submittedAt = new Date().toLocaleDateString('ru-RU');
    row.fullName = String(data.fullName || '').trim();
    row.position = String(data.position || '').trim();
    row.birthDate = String(data.birthDate || '').trim();

    // Расшифровки приходят с фронтенда из общего справочника directions.js —
    // так список направлений остаётся в одном месте и не расходится
    const directions = Array.isArray(data.directions) ? data.directions : [];
    row.directions = directions
        .map((d) => String(d && d.ru ? d.ru : d || '').trim())
        .filter(Boolean)
        .join('; ');

    row.visitMode = String(data.visitModeText || '').trim();
    row.phone = String(data.phone || '').trim();
    row.email = String(data.email || '').trim();
    row.polarExpress = visitorTouchesPolarExpress(data) ? 'да' : '';

    return row;
}

/* ------------------------------------------------------------------ */
/* Письмо                                                              */
/* ------------------------------------------------------------------ */
const escapeHtml = (value) =>
    String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

function buildVisitorEmailHtml(data) {
    const columns = buildVisitorColumns();
    const row = buildVisitorRow(data);

    const pairs = [
        ['Должность', row.position],
        ['Дата рождения', row.birthDate],
        ['Направления посещения', row.directions],
        ['Характер работ', row.visitMode],
        ['Телефон', row.phone],
        ['Электронная почта', row.email],
    ];

    const summaryRows = pairs
        .filter(([, value]) => String(value || '').trim())
        .map(
            ([label, value]) =>
                `<tr><td style="font:bold 11px Arial;color:#16255C;padding:1px 8px 1px 0;vertical-align:top;white-space:nowrap;line-height:1.35;">${escapeHtml(
                    label
                )}</td><td style="font:11px Arial;color:#16203A;padding:1px 0;line-height:1.35;">${escapeHtml(
                    value
                )}</td></tr>`
        )
        .join('');

    // Строка для вставки в готовую таблицу: ТОЛЬКО значения, без заголовков.
    // Пустые ячейки обязательно сохраняются — иначе при вставке колонки съедут.
    const valueCells = columns
        .map(
            (c) =>
                `<td style="font:11px Arial;padding:3px 6px;border:1px solid #DDE3EC;vertical-align:top;">${escapeHtml(
                    row[c.key]
                )}</td>`
        )
        .join('');

    // Порядок колонок показываем подписью рядом, а не строкой в таблице,
    // чтобы он не попал в буфер вместе с данными
    const order = columns.map((c, i) => `${i + 1}. ${c.header}`).join(' · ');

    return `<!doctype html><html><body style="margin:0;padding:16px;background:#F4F6FA;font-family:Arial,sans-serif;">
  <div style="max-width:900px;margin:0 auto;background:#fff;border-top:3px solid #1B85CE;padding:18px 20px;">
    <div style="font:bold 11px Arial;letter-spacing:1.5px;color:#1B85CE;text-transform:uppercase;margin-bottom:6px;">Заявка на посещение объектов</div>
    <div style="font:bold 19px Arial;color:#16255C;margin:0 0 12px;">${escapeHtml(
        [row.fullName, row.position].filter(Boolean).join(' — ')
    )}</div>

    <table style="border-collapse:collapse;margin-bottom:16px;max-width:560px;">${summaryRows}</table>

    <div style="font:bold 11px Arial;letter-spacing:1px;color:#16255C;text-transform:uppercase;border-top:1px solid #DDE3EC;padding-top:12px;margin-bottom:6px;">
      Строка для вставки в таблицу
    </div>
    <div style="font:10px Arial;color:#6A7A93;margin-bottom:6px;max-width:620px;">
      Здесь только данные, без заголовков — выделите строку, скопируйте и вставьте в свою таблицу.
      Пустые ячейки сохранены, поэтому колонки не съедут.<br>
      Порядок колонок: ${escapeHtml(order)}
    </div>

    <div style="max-width:860px;">
      <table style="border-collapse:collapse;">
        <tr>${valueCells}</tr>
      </table>
    </div>

    <div style="font:11px Arial;color:#6A7A93;border-top:1px solid #DDE3EC;margin-top:20px;padding-top:12px;">
      Во вложении сводная таблица Excel. Это заявка визитёра — обучение по охране труда для неё не оформляется.
    </div>
  </div>
</body></html>`;
}

function buildVisitorEmailText(data) {
    const columns = buildVisitorColumns();
    const row = buildVisitorRow(data);
    const lines = [
        [row.fullName, row.position].filter(Boolean).join(' — '),
        '',
        'Заявка визитёра на посещение объектов. Сводная таблица во вложении .xlsx',
        '',
    ];
    columns.forEach((c) => {
        const value = row[c.key];
        if (value === undefined || value === null || String(value).trim() === '') return;
        lines.push(`${c.header}: ${value}`);
    });
    return lines.join('\n');
}

module.exports = {
    VISITOR_COLUMNS,
    POLAR_EXPRESS_CODES,
    buildVisitorColumns,
    buildVisitorRow,
    visitorTouchesPolarExpress,
    buildVisitorEmailHtml,
    buildVisitorEmailText,
};
