// Отделы компании.
//
// Работник видит расшифровку на своём языке («Строительный отдел»),
// а в сводную таблицу уходит только аббревиатура («CM»).
// Для варианта «Другое» в таблицу попадает то, что человек вписал руками.

export const DEPARTMENTS = [
  { code: 'CM', ru: 'Строительный отдел', en: 'Construction Management' },
  { code: 'HR', ru: 'Отдел кадров', en: 'Human Resources' },
  { code: 'DC', ru: 'Контроль документации', en: 'Document Control' },
  { code: 'BA', ru: 'Администрирование', en: 'Business Administration' },
  { code: 'FE', ru: 'Филд-инжиниринг', en: 'Field Engineering' },
  { code: 'HSES', ru: 'ОТ, ПБ и ООС', en: 'Health, Safety, Environment and Sustainability' },
  { code: 'IT', ru: 'Информационные технологии', en: 'Information Technology' },
  { code: 'PL', ru: 'Планирование', en: 'Planning' },
  { code: 'QA/QC', ru: 'Отдел контроля качества', en: 'Quality Assurance and Quality Control' },
];

export const DEPARTMENT_OTHER = 'OTHER';

// Отделы, работникам которых нужна программа «В»
// (работы повышенной опасности) независимо от остальных ответов
export const DEPARTMENTS_REQUIRING_GROUP_V = ['CM', 'HSES'];

/** Длительность вахты. Для «Другое» в таблицу ничего не пишем. */
export const ROTATIONS = ['42/42', '42/21', '30/30'];
export const ROTATION_OTHER = 'OTHER';

/** Где проходила аттестация по промышленной безопасности */
export const PROTOCOL_VENUES = [
  { code: 'ЕПТ', ru: 'ЕПТ — внутренняя комиссия', en: 'EPT — internal commission' },
  { code: 'РТН', ru: 'РТН — Ростехнадзор', en: 'RTN — Rostechnadzor' },
];
