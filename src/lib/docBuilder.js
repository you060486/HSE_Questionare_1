// Сборка Word-анкеты прямо в браузере: строим HTML-таблицу и отдаём её
// как .doc — Word такой файл открывает как обычный документ.

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export function buildSurveyDoc(payload, t) {
  const rows = [];

  const section = (title) => {
    rows.push(`<tr><td colspan="2" class="section">${escapeHtml(title)}</td></tr>`);
  };

  const row = (label, value) => {
    if (value === undefined || value === null || value === '') return;
    rows.push(`<tr><td class="label">${escapeHtml(label)}</td><td class="value">${escapeHtml(value)}</td></tr>`);
  };

  const rowHtml = (label, html) => {
    rows.push(`<tr><td class="label">${escapeHtml(label)}</td><td class="value">${html}</td></tr>`);
  };

  // --- Общее ---
  section(t.generalInfo);
  row(t.employerLabel, payload.employer);
  row(t.fullName, payload.employeeName);
  if (payload.positionRu) row('Должность', payload.positionRu);
  row(t.citizenshipLabel, payload.citizenship);
  row(t.birthDateLabel, payload.birthDate);
  if (payload.personalIdValue) row(payload.personalIdLabel, payload.personalIdValue);
  if (payload.inn) row('ИНН', payload.inn);

  // --- Контакты ---
  section(t.contactsTitle);
  payload.phones.forEach((phone, index) => {
    row(payload.phones.length > 1 ? `${t.phoneLabel} ${index + 1}` : t.phoneLabel, phone);
  });
  row(t.personalEmailLabel, payload.personalEmail);
  row(t.workEmailLabel, payload.workEmail);

  // --- Документ ---
  if (payload.passport && payload.passport.number) {
    section(t.passportTitle);
    row(payload.passportNumberLabel || 'Серия и номер', payload.passport.number);
    row(t.passportIssueDate, payload.passport.issueDate);
    row(t.passportIssuedBy, payload.passport.issuedBy);
    row(t.passportCode, payload.passport.deptCode);
  }

  // --- Промышленная безопасность ---
  section(t.promSafety);
  row('Статус', payload.promStatus);
  if (payload.protocols && payload.protocols.length) {
    const items = payload.protocols
      .map(
        (p, i) =>
          `<li><b>${escapeHtml(t.protocol)} ${i + 1}:</b> № ${escapeHtml(p.number)} от ${escapeHtml(
            p.date
          )}, области: ${escapeHtml(p.areasText)}</li>`
      )
      .join('');
    rowHtml(t.protocolsTitle, `<ul>${items}</ul>`);
  }

  // --- Электробезопасность ---
  section(t.electroSafety);
  row('Статус', payload.electroStatus);
  row(t.education, payload.electroEducation);
  row(t.specifyGroup, payload.electroGroup);
  row(t.dateOfCheck, payload.electroDate);

  // --- Высота и ОЗП ---
  section(t.heightSafety);
  row('Статус', payload.heightStatus);

  section(t.confinedSafety);
  row('Статус', payload.confinedStatus);

  // --- Транспорт ---
  section(t.drivingSafety);
  row('Статус', payload.driveStatus);
  if (payload.licence && payload.licence.number) {
    row(t.licenceNumber, payload.licence.number);
    row(t.licenceDate, payload.licence.date);
    row(t.licenceCategories, (payload.licence.categories || []).join(', '));
  }

  // --- Другие обучения ---
  if (payload.trainings && payload.trainings.length) {
    section(t.otherSafety);
    const items = payload.trainings.map((tr) => `<li>${escapeHtml(tr.title)}</li>`).join('');
    rowHtml(t.otherSafety, `<ul>${items}</ul>`);
  }

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>${escapeHtml(t.title)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 10.5pt; color: #16203a; }
  .head { font-size: 15pt; font-weight: bold; text-transform: uppercase; color: #16255c; margin-bottom: 2px; }
  .sub { font-size: 9.5pt; color: #6a7a93; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; }
  td { border: 1px solid #d5dde8; padding: 4px 8px; vertical-align: top; }
  .section { background-color: #16255c; color: #ffffff; font-weight: bold; text-transform: uppercase; font-size: 9.5pt; letter-spacing: 0.06em; }
  .label { width: 34%; font-weight: bold; color: #16255c; }
  .value { width: 66%; }
  ul { margin: 0; padding-left: 16px; }
  li { margin-bottom: 2px; }
  .consent { margin-top: 14px; padding-top: 8px; border-top: 1px solid #d5dde8; font-size: 8.5pt; font-style: italic; color: #6a7a93; }
</style></head>
<body>
  <div class="head">${escapeHtml(t.title)}</div>
  <div class="sub">${escapeHtml(t.subtitle)}</div>
  <table>${rows.join('')}</table>
  <div class="consent">* ${escapeHtml(t.consentText)}</div>
</body></html>`;

  return new Blob([html], { type: 'application/msword;charset=utf-8' });
}
