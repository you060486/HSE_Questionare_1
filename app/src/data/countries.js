// Правила заполнения документов в зависимости от гражданства.
//
// Для каждой страны описано:
//   passport   — как выглядит номер документа, удостоверяющего личность
//   issuedBy   — нужно ли поле «кем выдан» и обязательно ли оно
//   deptCode   — нужно ли поле «код подразделения» и обязательно ли оно
//   personalId — основной идентификатор человека (СНИЛС / ИИН / личный номер)
//   taxId      — налоговый номер, если он отдельный от personalId
//
// Поля с required: false в интерфейсе показываются приглушённым блоком
// и не мешают отправить анкету.

export const COUNTRIES = [
  {
    id: 'RU',
    nameRu: 'Россия',
    nameEn: 'Russia',
    phoneMask: 'phoneRu',
    passport: {
      labelRu: 'Серия и номер паспорта',
      labelEn: 'Passport series and number',
      placeholder: '12 34 567890',
      hintRu: '10 цифр — как в паспорте',
      hintEn: '10 digits',
      mask: 'passportRu',
      inputMode: 'numeric',
      maxLength: 12,
      validate: (v) => /^\d{2} \d{2} \d{6}$/.test(String(v || '').trim()),
    },
    issuedBy: { show: true, required: true },
    deptCode: {
      show: true,
      required: true,
      placeholder: '123-456',
      mask: 'deptCode',
      inputMode: 'numeric',
      maxLength: 7,
      validate: (v) => /^\d{3}-\d{3}$/.test(String(v || '').trim()),
    },
    personalId: {
      key: 'snils',
      labelRu: 'СНИЛС',
      labelEn: 'SNILS',
      placeholder: '123-456-789 00',
      mask: 'snils',
      inputMode: 'numeric',
      maxLength: 14,
      required: true,
      hintRu: 'Нужен, чтобы подать заявку и внести данные в реестр Минтруда',
      hintEn: 'Required for the Ministry of Labour registry',
      validate: (v) => /^\d{3}-\d{3}-\d{3} \d{2}$/.test(String(v || '').trim()),
    },
    taxId: {
      key: 'inn',
      labelRu: 'ИНН',
      labelEn: 'INN (tax number)',
      placeholder: '1234-5678-9012',
      mask: 'inn',
      inputMode: 'numeric',
      maxLength: 14,
      hintRu: 'Нужен для оформления обучения по промышленной безопасности или электробезопасности',
      hintEn: 'Required for Industrial or Electrical Safety training',
      validate: (v) => /^\d{4}-\d{4}-\d{4}$/.test(String(v || '').trim()),
    },
  },
  {
    id: 'KZ',
    nameRu: 'Казахстан',
    nameEn: 'Kazakhstan',
    phoneMask: 'phoneIntl',
    passport: {
      labelRu: 'Номер паспорта или удостоверения личности',
      labelEn: 'Passport or ID card number',
      placeholder: 'N12345678',
      hintRu: 'Паспорт — буква и 8 цифр (например N12345678). Удостоверение личности — 9 цифр',
      hintEn: 'Passport: letter + 8 digits. ID card: 9 digits',
      mask: 'passportKz',
      inputMode: 'text',
      maxLength: 10,
      validate: (v) => /^([A-ZА-Я]\d{8}|\d{9})$/.test(String(v || '').trim().toUpperCase()),
    },
    issuedBy: { show: true, required: false },
    deptCode: { show: false, required: false },
    personalId: {
      key: 'iin',
      labelRu: 'ИИН',
      labelEn: 'IIN',
      placeholder: '123456789012',
      mask: 'iin',
      inputMode: 'numeric',
      maxLength: 12,
      required: true,
      hintRu: '12 цифр. Заменяет СНИЛС и ИНН',
      hintEn: '12 digits. Replaces SNILS and INN',
      validate: (v) => /^\d{12}$/.test(String(v || '').trim()),
    },
    taxId: null,
  },
  {
    id: 'BY',
    nameRu: 'Беларусь',
    nameEn: 'Belarus',
    phoneMask: 'phoneIntl',
    passport: {
      labelRu: 'Серия и номер паспорта',
      labelEn: 'Passport series and number',
      placeholder: 'MP1234567',
      hintRu: 'Две латинские буквы и 7 цифр — как в паспорте',
      hintEn: 'Two Latin letters and 7 digits',
      mask: 'passportBy',
      inputMode: 'text',
      maxLength: 9,
      validate: (v) => /^[A-Z]{2}\d{7}$/.test(String(v || '').trim().toUpperCase()),
    },
    issuedBy: { show: true, required: false },
    deptCode: { show: false, required: false },
    personalId: {
      key: 'personalNumber',
      labelRu: 'Личный номер',
      labelEn: 'Personal number',
      placeholder: '3140987A001PB5',
      mask: 'belarusPersonal',
      inputMode: 'text',
      maxLength: 14,
      required: true,
      hintRu: '14 символов со страницы с фотографией. Заменяет СНИЛС и ИНН',
      hintEn: '14 characters from the photo page. Replaces SNILS and INN',
      validate: (v) => /^[0-9A-Z]{14}$/.test(String(v || '').trim().toUpperCase()),
    },
    taxId: null,
  },
  {
    id: 'OTHER',
    nameRu: 'Другое',
    nameEn: 'Other',
    isOther: true,
    phoneMask: 'phoneIntl',
    passport: {
      labelRu: 'Номер документа',
      labelEn: 'Document number',
      placeholder: 'Как указано в документе',
      hintRu: 'Впишите так, как написано в Вашем документе',
      hintEn: 'Enter it exactly as printed in your document',
      mask: 'passportFree',
      inputMode: 'text',
      maxLength: 25,
      validate: (v) => String(v || '').trim().length >= 4,
    },
    issuedBy: { show: true, required: false },
    deptCode: { show: true, required: false, placeholder: 'Если есть в документе', mask: 'passportFree', inputMode: 'text', maxLength: 20 },
    personalId: {
      key: 'foreignId',
      labelRu: 'Идентификационный номер',
      labelEn: 'Identification number',
      placeholder: 'Если есть',
      mask: 'passportFree',
      inputMode: 'text',
      maxLength: 25,
      required: false,
      hintRu: 'Аналог СНИЛС в Вашей стране. Если такого номера нет — оставьте поле пустым',
      hintEn: 'Equivalent of SNILS in your country. Leave blank if you do not have one',
    },
    taxId: null,
  },
];

export const DEFAULT_COUNTRY_ID = 'RU';

export function getCountry(id) {
  return COUNTRIES.find((c) => c.id === id) || COUNTRIES[0];
}
