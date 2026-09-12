// Заявка визитёра: письмо и вспомогательные проверки.
//
// Таблица у визитёра ТА ЖЕ, что у работника — те же 52 колонки из table.js,
// чтобы строку можно было вставить в ту же базу. Заполняется только то, что
// у визитёра спросили (см. ветку formType === 'visitor' в buildSummaryRow).
//
// В теле письма — только фамилия с инициалами, должность и сведения о самом
// посещении: направления, характер работ, признак Полярного Экспресса.
// Персональные данные остаются в строке для таблицы и во вложении.

const { buildSummaryRow, buildCopyRowHtml, shortName, escapeHtml } = require('./table.js');

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
function buildVisitorEmailHtml(data) {
    const row = buildSummaryRow({ ...data, formType: 'visitor' });
    const directions = directionTexts(data);
    const visitMode = String(data.visitModeText || '').trim();
    const isPolar = visitorTouchesPolarExpress(data);

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

    return `<!doctype html><html><body style="margin:0;padding:16px;background:#F4F6FA;font-family:Arial,sans-serif;">
  <div style="max-width:1100px;margin:0 auto;background:#fff;border-top:3px solid #1B85CE;padding:18px 20px;">
    <div style="font:bold 11px Arial;letter-spacing:1.5px;color:#1B85CE;text-transform:uppercase;margin-bottom:6px;">Заявка на посещение объектов</div>
    <div style="font:bold 19px Arial;color:#16255C;margin:0 0 12px;">${escapeHtml(
        [shortName(row.fullName), row.positionRu].filter(Boolean).join(' — ')
    )}</div>

    <div style="font:bold 11px Arial;letter-spacing:1px;color:#16255C;text-transform:uppercase;border-top:1px solid #DDE3EC;padding-top:12px;margin-bottom:4px;">
      Посещение объектов
    </div>
    ${directionsList}
    <div style="font:12px Arial;color:#16203A;margin-top:8px;">
      <b>Характер работ:</b> ${escapeHtml(visitMode || 'не указан')}
    </div>
    ${polarNote}

    <div style="font:bold 11px Arial;letter-spacing:1px;color:#16255C;text-transform:uppercase;border-top:1px solid #DDE3EC;padding-top:12px;margin:16px 0 6px;">
      Строка для вставки в таблицу
    </div>
    <div style="font:10px Arial;color:#6A7A93;margin-bottom:6px;">
      Выделите строку целиком и вставьте в свою таблицу.
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
        [shortName(row.fullName), row.positionRu].filter(Boolean).join(' — '),
        '',
        'Заявка визитёра на посещение объектов. Сводная таблица во вложении .xlsx',
        '',
    ];
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
