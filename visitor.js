// Заявка визитёра: письмо и вспомогательные проверки.
//
// Таблица у визитёра ТА ЖЕ, что у работника — те же 52 колонки из table.js,
// чтобы строку можно было вставить в ту же базу. Заполняется только то, что
// у визитёра спросили (см. ветку formType === 'visitor' в buildSummaryRow).
//
// То, чему в 52 колонках места нет — направления посещения, характер работ
// и признак Полярного Экспресса — выводится в ТЕЛЕ письма.

const { buildSummaryRow, buildCopyRowHtml, columnOrderHint, escapeHtml } = require('./table.js');

/** Признак объектов Полярного Экспресса — по кодам, не по присланному тексту */
const POLAR_EXPRESS_CODES = ['ПЭ-дорога'];

function visitorTouchesPolarExpress(data) {
    const directions = Array.isArray(data.directions) ? data.directions : [];
    return directions.some((d) => POLAR_EXPRESS_CODES.includes(d && d.code ? d.code : d));
}

/** Список направлений в виде текста */
function directionTexts(data) {
    const directions = Array.isArray(data.directions) ? data.directions : [];
    return directions.map((d) => String(d && d.ru ? d.ru : d || '').trim()).filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Письмо                                                             */
/* ------------------------------------------------------------------ */
function buildVisitorEmailHtml(data, options = {}) {
    const row = buildSummaryRow({ ...data, formType: 'visitor' });
    const directions = directionTexts(data);
    const visitMode = String(data.visitModeText || '').trim();
    const isPolar = visitorTouchesPolarExpress(data);

    const pairs = [
        ['Дата рождения', row.birthDate],
        ['Телефон', row.phone],
        ['Электронная почта', row.personalEmail],
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

    const directionsList = directions.length
        ? `<ul style="margin:4px 0 0;padding-left:18px;font:12px Arial;color:#16203A;">${directions
              .map((d) => `<li style="margin-bottom:3px;">${escapeHtml(d)}</li>`)
              .join('')}</ul>`
        : '<div style="font:12px Arial;color:#6A7A93;">не указаны</div>';

    const polarNote = isPolar
        ? `<div style="margin-top:10px;padding:8px 10px;background:#EAF3FA;border-left:3px solid #1B85CE;font:bold 12px Arial;color:#16255C;">
             Среди выбранных направлений есть объекты Полярного Экспресса
           </div>`
        : '';

    // Кнопку в письме нажать нельзя — почтовые клиенты не исполняют скрипты.
    // Поэтому даём ссылку на страницу, где кнопка настоящая.
    const copyButton = options.copyUrl
        ? `<div style="margin:14px 0 6px;">
             <a href="${escapeHtml(options.copyUrl)}"
                style="display:inline-block;background:#16255C;color:#ffffff;text-decoration:none;
                       font:bold 12px Arial;padding:10px 16px;border-radius:2px;">
               Скопировать информацию о визитёре для реестра
             </a>
           </div>
           <div style="font:10px Arial;color:#6A7A93;margin-bottom:10px;max-width:620px;">
             Ссылка открывает страницу с кнопкой «Копировать». Данные передаются в самой ссылке
             и на сервере не сохраняются.
           </div>`
        : '';

    return `<!doctype html><html><body style="margin:0;padding:16px;background:#F4F6FA;font-family:Arial,sans-serif;">
  <div style="max-width:1100px;margin:0 auto;background:#fff;border-top:3px solid #1B85CE;padding:18px 20px;">
    <div style="font:bold 11px Arial;letter-spacing:1.5px;color:#1B85CE;text-transform:uppercase;margin-bottom:6px;">Заявка на посещение объектов</div>
    <div style="font:bold 19px Arial;color:#16255C;margin:0 0 12px;">${escapeHtml(
        [row.fullName, row.positionRu].filter(Boolean).join(' — ')
    )}</div>

    <table style="border-collapse:collapse;margin-bottom:16px;max-width:520px;">${summaryRows}</table>

    <div style="font:bold 11px Arial;letter-spacing:1px;color:#16255C;text-transform:uppercase;border-top:1px solid #DDE3EC;padding-top:12px;margin-bottom:4px;">
      Посещение объектов
    </div>
    <div style="font:10px Arial;color:#6A7A93;margin-bottom:4px;">
      Этих сведений в сводной таблице нет — они только здесь
    </div>
    ${directionsList}
    <div style="font:12px Arial;color:#16203A;margin-top:8px;">
      <b>Характер работ:</b> ${escapeHtml(visitMode || 'не указан')}
    </div>
    ${polarNote}

    <div style="font:bold 11px Arial;letter-spacing:1px;color:#16255C;text-transform:uppercase;border-top:1px solid #DDE3EC;padding-top:12px;margin:16px 0 6px;">
      Строка для вставки в таблицу
    </div>
    ${copyButton}
    <div style="font:10px Arial;color:#6A7A93;margin-bottom:6px;max-width:620px;">
      Формат тот же, что у анкеты работника — 52 колонки. Здесь только данные, без заголовков;
      пустые ячейки сохранены, поэтому колонки не съедут.<br>
      Порядок колонок: ${escapeHtml(columnOrderHint())}
    </div>

    <div style="max-width:1060px;overflow-x:auto;">
      ${buildCopyRowHtml(row)}
    </div>

    <div style="font:11px Arial;color:#6A7A93;border-top:1px solid #DDE3EC;margin-top:20px;padding-top:12px;">
      Во вложении сводная таблица Excel. Это заявка визитёра — обучение по охране труда для неё не оформляется.
    </div>
  </div>
</body></html>`;
}

function buildVisitorEmailText(data) {
    const row = buildSummaryRow({ ...data, formType: 'visitor' });
    const lines = [
        [row.fullName, row.positionRu].filter(Boolean).join(' — '),
        '',
        'Заявка визитёра на посещение объектов. Сводная таблица во вложении .xlsx',
        '',
    ];
    if (row.birthDate) lines.push(`Дата рождения: ${row.birthDate}`);
    if (row.phone) lines.push(`Телефон: ${row.phone}`);
    if (row.personalEmail) lines.push(`Электронная почта: ${row.personalEmail}`);

    lines.push('', 'Посещение объектов:');
    const directions = directionTexts(data);
    if (directions.length) directions.forEach((d) => lines.push(`  — ${d}`));
    else lines.push('  не указаны');
    lines.push(`Характер работ: ${data.visitModeText || 'не указан'}`);
    if (visitorTouchesPolarExpress(data)) {
        lines.push('ВНИМАНИЕ: среди направлений есть объекты Полярного Экспресса');
    }
    return lines.join('\n');
}

module.exports = {
    POLAR_EXPRESS_CODES,
    visitorTouchesPolarExpress,
    directionTexts,
    buildVisitorEmailHtml,
    buildVisitorEmailText,
};
