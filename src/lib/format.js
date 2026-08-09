// Маски ввода. Каждая функция получает то, что человек напечатал,
// и возвращает уже причёсанную строку. Ничего не запрещаем жёстко —
// просто аккуратно раскладываем символы, чтобы поле было приятно заполнять.

const digits = (value) => String(value || '').replace(/\D/g, '');

/** ДД.ММ.ГГГГ */
export function maskDate(value) {
  const d = digits(value).slice(0, 8);
  if (!d) return '';
  return d.slice(0, 2) + (d.length > 2 ? '.' + d.slice(2, 4) : '') + (d.length > 4 ? '.' + d.slice(4, 8) : '');
}

/** СНИЛС: ХХХ-ХХХ-ХХХ ХХ */
export function maskSnils(value) {
  const d = digits(value).slice(0, 11);
  if (!d) return '';
  return (
    d.slice(0, 3) +
    (d.length > 3 ? '-' + d.slice(3, 6) : '') +
    (d.length > 6 ? '-' + d.slice(6, 9) : '') +
    (d.length > 9 ? ' ' + d.slice(9, 11) : '')
  );
}

/** ИНН: 12 цифр, группами по 4 */
export function maskInn(value) {
  const d = digits(value).slice(0, 12);
  if (!d) return '';
  return d.slice(0, 4) + (d.length > 4 ? '-' + d.slice(4, 8) : '') + (d.length > 8 ? '-' + d.slice(8, 12) : '');
}

/** ИИН Казахстана: 12 цифр подряд */
export function maskIin(value) {
  return digits(value).slice(0, 12);
}

/** Личный номер Беларуси: 14 символов, цифры и латинские буквы */
export function maskBelarusPersonal(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, 14);
}

/** Телефон РФ: +7 (ХХХ) ХХХ ХХ-ХХ */
export function maskPhoneRu(value) {
  let d = digits(value);
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (d.startsWith('7')) d = d.slice(1);
  d = d.slice(0, 10);
  let out = '+7';
  if (d.length > 0) out += ' (' + d.slice(0, 3);
  if (d.length >= 4) out += ') ' + d.slice(3, 6);
  if (d.length >= 7) out += ' ' + d.slice(6, 8);
  if (d.length >= 9) out += '-' + d.slice(8, 10);
  return out;
}

/** Телефон в международном формате: + и до 15 цифр */
export function maskPhoneIntl(value) {
  const d = digits(value).slice(0, 15);
  return d ? '+' + d : '';
}

/** Паспорт РФ: ХХ ХХ ХХХХХХ */
export function maskPassportRu(value) {
  const d = digits(value).slice(0, 10);
  if (!d) return '';
  return d.slice(0, 2) + (d.length > 2 ? ' ' + d.slice(2, 4) : '') + (d.length > 4 ? ' ' + d.slice(4, 10) : '');
}

/** Код подразделения: ХХХ-ХХХ */
export function maskDeptCode(value) {
  const d = digits(value).slice(0, 6);
  if (!d) return '';
  return d.slice(0, 3) + (d.length > 3 ? '-' + d.slice(3, 6) : '');
}

/** Паспорт Казахстана: буква N и 8 цифр, либо 9 цифр удостоверения личности */
export function maskPassportKz(value) {
  const raw = String(value || '')
    .toUpperCase()
    .replace(/[^0-9A-ZА-Я]/g, '');
  const letters = raw.replace(/[^A-ZА-Я]/g, '').slice(0, 1);
  const nums = raw.replace(/\D/g, '').slice(0, 9);
  return letters + nums;
}

/** Паспорт Беларуси: две латинские буквы + 7 цифр (например MP1234567) */
export function maskPassportBy(value) {
  const raw = String(value || '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');
  const letters = raw.replace(/[^A-Z]/g, '').slice(0, 2);
  const nums = raw.replace(/\D/g, '').slice(0, 7);
  return letters + nums;
}

/** Свободный ввод документа: цифры, латиница, дефис, косая черта, пробел */
export function maskPassportFree(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^0-9A-ZА-Я\-/ ]/g, '')
    .slice(0, 25);
}

/** Номер водительского удостоверения: 10 цифр, группами 99 99 999999 */
export function maskLicenceNumber(value) {
  const raw = String(value || '')
    .toUpperCase()
    .replace(/[^0-9A-ZА-Я]/g, '')
    .slice(0, 12);
  // Российское ВУ — 10 цифр; иностранное может содержать буквы, тогда не форматируем
  if (/^\d+$/.test(raw)) {
    const d = raw.slice(0, 10);
    return d.slice(0, 2) + (d.length > 2 ? ' ' + d.slice(2, 4) : '') + (d.length > 4 ? ' ' + d.slice(4, 10) : '');
  }
  return raw;
}

export const MASKS = {
  date: maskDate,
  snils: maskSnils,
  inn: maskInn,
  iin: maskIin,
  belarusPersonal: maskBelarusPersonal,
  phoneRu: maskPhoneRu,
  phoneIntl: maskPhoneIntl,
  passportRu: maskPassportRu,
  passportKz: maskPassportKz,
  passportBy: maskPassportBy,
  passportFree: maskPassportFree,
  deptCode: maskDeptCode,
  licenceNumber: maskLicenceNumber,
  none: (v) => v,
};

/** Проверка даты в формате ДД.ММ.ГГГГ на реальность */
export function isValidDate(value) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(value || '').trim());
  if (!m) return false;
  const day = +m[1];
  const month = +m[2];
  const year = +m[3];
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2100) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}
