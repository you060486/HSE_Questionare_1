// Анкета работника в Word: досье, разбитое на смысловые блоки.
// Строится из той же строки таблицы, что уходит в Excel, — расхождений между
// файлами быть не может. Пустые строки и целые блоки не выводятся.

const { COLUMNS, PROTOCOL_SLOTS, TRAINING_SLOTS } = require('./table.js');

const escapeHtml = (value) =>
    String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

const byKey = {};
COLUMNS.forEach((c) => {
    byKey[c.key] = c;
});

/** Подписи в досье читаются человеком, поэтому местами отличаются от шапки таблицы */
const DOC_LABELS = {
    employer: 'Основное место работы',
    fullName: 'ФИО',
    nameLatin: 'Name (латиницей)',
    positionRu: 'Должность',
    positionEn: 'Position',
    department: 'Отдел',
    rotationStart: 'Дата заезда на вахту',
    birthDate: 'Дата рождения',
    rotation: 'Длительность вахты',
    workEmail: 'Рабочая почта',
    personalEmail: 'Личная почта',
    snils: 'СНИЛС / ИИН / личный номер',
    citizenship: 'Гражданство',
    phone: 'Телефон',
    inn: 'ИНН',
    education: 'Образование (для электробезопасности)',

    passportNumber: 'Серия и номер',
    passportIssuedBy: 'Кем выдан',
    passportDate: 'Когда выдан',
    passportCode: 'Код подразделения',

    licenceNumber: 'Номер удостоверения',
    licenceDate: 'Дата выдачи',
    licenceCategories: 'Открытые категории',

    electroGroup: 'Группа по электробезопасности',
    electroDate: 'Дата последней проверки знаний',

    height: 'Работы на высоте',
    confined: 'Работы в замкнутом пространстве',
    electro: 'Электробезопасность',
    prom: 'Промышленная безопасность',
    groupV: 'Программа «В» (работы повышенной опасности)',
    svp: 'Управление транспортом (SVP)',
};

function buildWordDoc(row, options = {}) {
    const consentText = options.consentText || '';
    const blocks = [];

    /** Пара «подпись — значение»; пустые не выводим */
    const pair = (key) => {
        const value = row[key];
        if (value === undefined || value === null || String(value).trim() === '') return '';
        const label = DOC_LABELS[key] || (byKey[key] ? byKey[key].header : key);
        const number = byKey[key] ? byKey[key].n : '';
        return `<tr>
      <td class="num">К${number}</td>
      <td class="label">${escapeHtml(label)}</td>
      <td class="value">${escapeHtml(value)}</td>
    </tr>`;
    };

    const section = (title, rowsHtml, note) => {
        if (!rowsHtml.trim()) return;
        blocks.push(`
      <div class="section">
        <div class="section-title">${escapeHtml(title)}</div>
        ${note ? `<div class="section-note">${escapeHtml(note)}</div>` : ''}
        <table class="grid">${rowsHtml}</table>
      </div>`);
    };

    /* --- Данные работника: К2–К17 --- */
    section(
        'Данные работника',
        ['employer', 'fullName', 'nameLatin', 'positionRu', 'positionEn', 'department', 'rotationStart',
            'birthDate', 'rotation', 'workEmail', 'personalEmail', 'snils', 'citizenship', 'phone', 'inn', 'education']
            .map(pair)
            .join('')
    );

    /* --- Документы: паспорт К18–К21, ВУ К22–К24 --- */
    const passportRows = ['passportNumber', 'passportIssuedBy', 'passportDate', 'passportCode'].map(pair).join('');
    const licenceRows = ['licenceNumber', 'licenceDate', 'licenceCategories'].map(pair).join('');

    if (passportRows.trim() || licenceRows.trim()) {
        let html = '<div class="section"><div class="section-title">Документы</div>';
        if (passportRows.trim()) {
            html += `<div class="sub-title">Документ, удостоверяющий личность</div><table class="grid">${passportRows}</table>`;
        }
        if (licenceRows.trim()) {
            html += `<div class="sub-title">Водительское удостоверение</div><table class="grid">${licenceRows}</table>`;
        }
        html += '</div>';
        blocks.push(html);
    }

    /* --- Имеющиеся обучения: К25–К46 --- */
    const electroRows = ['electroGroup', 'electroDate'].map(pair).join('');

    const protocolRows = [];
    for (let i = 1; i <= PROTOCOL_SLOTS; i += 1) {
        const number = row[`protocol${i}Number`];
        const areas = row[`protocol${i}Areas`];
        const date = row[`protocol${i}Date`];
        if (!String(number || '').trim() && !String(areas || '').trim()) continue;
        protocolRows.push(`<tr>
      <td class="num">${i}</td>
      <td>${escapeHtml(number)}</td>
      <td>${escapeHtml(areas)}</td>
      <td>${escapeHtml(date)}</td>
    </tr>`);
    }

    const trainingRows = [];
    for (let i = 1; i <= TRAINING_SLOTS; i += 1) {
        const value = row[`training${i}`];
        if (!String(value || '').trim()) continue;
        trainingRows.push(`<li>${escapeHtml(value)}</li>`);
    }

    if (electroRows.trim() || protocolRows.length || trainingRows.length) {
        let html = '<div class="section"><div class="section-title">Имеющиеся обучения</div>';
        if (electroRows.trim()) {
            html += `<div class="sub-title">Электробезопасность</div><table class="grid">${electroRows}</table>`;
        }
        if (protocolRows.length) {
            html += `<div class="sub-title">Промышленная безопасность — протоколы аттестации</div>
        <table class="grid protocols">
          <tr class="head"><td class="num">№</td><td>Протокол и где сдавал</td><td>Области аттестации</td><td>Дата</td></tr>
          ${protocolRows.join('')}
        </table>`;
        }
        if (trainingRows.length) {
            html += `<div class="sub-title">Другие обучения</div><ul>${trainingRows.join('')}</ul>`;
        }
        html += '</div>';
        blocks.push(html);
    }

    /* --- Потребности в обучении: К47–К52 --- */
    section(
        'Потребность в обучении',
        ['height', 'confined', 'electro', 'prom', 'groupV', 'svp'].map(pair).join(''),
        'Итог по анкете: что нужно оформить работнику'
    );

    return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Анкета ${escapeHtml(row.fullName)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 10.5pt; color: #16203a; }
  .head { font-size: 16pt; font-weight: bold; text-transform: uppercase; color: #16255c; letter-spacing: 0.04em; }
  .person { font-size: 13pt; font-weight: bold; color: #16203a; margin-top: 4px; }
  .sub { font-size: 9.5pt; color: #6a7a93; margin-top: 2px; margin-bottom: 16px; }
  .rule { border-bottom: 2px solid #1b85ce; margin-bottom: 16px; }
  .section { margin-bottom: 18px; }
  .section-title { background-color: #16255c; color: #ffffff; font-weight: bold; text-transform: uppercase;
                   font-size: 10pt; letter-spacing: 0.06em; padding: 5px 8px; }
  .section-note { font-size: 8.5pt; color: #6a7a93; font-style: italic; padding: 4px 8px 0; }
  .sub-title { font-size: 9.5pt; font-weight: bold; color: #1b85ce; text-transform: uppercase;
               letter-spacing: 0.04em; margin: 10px 0 4px; }
  table.grid { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.grid td { border: 1px solid #d5dde8; padding: 4px 8px; vertical-align: top; }
  td.num { width: 8%; color: #9aa8bd; font-size: 8.5pt; text-align: center; }
  td.label { width: 32%; font-weight: bold; color: #16255c; }
  td.value { width: 60%; }
  table.protocols td { font-size: 10pt; }
  table.protocols tr.head td { background-color: #eaf3fa; font-weight: bold; color: #16255c; font-size: 9pt; }
  ul { margin: 4px 0 0; padding-left: 18px; }
  li { margin-bottom: 3px; }
  .consent { margin-top: 18px; padding-top: 10px; border-top: 1px solid #d5dde8;
             font-size: 8.5pt; font-style: italic; color: #6a7a93; }
</style></head>
<body>
  <div class="head">Анкета нового работника</div>
  <div class="person">${escapeHtml(row.fullName)}</div>
  <div class="sub">Охрана труда и промышленная безопасность${row.department ? ' · отдел ' + escapeHtml(row.department) : ''}</div>
  <div class="rule"></div>
  ${blocks.join('')}
  ${consentText ? `<div class="consent">* ${escapeHtml(consentText)}</div>` : ''}
</body></html>`;
}

module.exports = { buildWordDoc };
