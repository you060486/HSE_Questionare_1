// Проверка логики поиска, масок и правил по гражданству.
// Запуск: node src/lib/__smoke.mjs

import assert from 'node:assert/strict';
import { searchItems, normalize, queryVariants } from './search.js';
import { MASKS, isValidDate } from './format.js';
import { ATTESTATION_AREAS } from '../data/attestation.js';
import { TRAININGS } from '../data/trainings.js';
import { LICENCE_CATEGORIES } from '../data/licence.js';
import { COUNTRIES, getCountry } from '../data/countries.js';

let passed = 0;
const check = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log('  ok   ' + name);
  } catch (e) {
    console.log('  FAIL ' + name + '\n       ' + e.message);
    process.exitCode = 1;
  }
};

const first = (query) => searchItems(ATTESTATION_AREAS, query)[0]?.code;

console.log('\n[Поиск литер]');
check('«б83» находит Б.8.3', () => assert.equal(first('б83'), 'Б.8.3'));
check('«Б 8.3» находит Б.8.3', () => assert.equal(first('Б 8.3'), 'Б.8.3'));
check('«Б.8.3» находит Б.8.3', () => assert.equal(first('Б.8.3'), 'Б.8.3'));
check('«b8.3» (латиница) находит Б.8.3', () => assert.equal(first('b8.3'), 'Б.8.3'));
check('«b83» (латиница) находит Б.8.3', () => assert.equal(first('b83'), 'Б.8.3'));
check('«B 8 3» находит Б.8.3', () => assert.equal(first('B 8 3'), 'Б.8.3'));
check('«а1» находит А.1', () => assert.equal(first('а1'), 'А.1'));
check('«a1» латиницей находит А.1', () => assert.equal(first('a1'), 'А.1'));
check('«г11» находит Г.1.1', () => assert.equal(first('г11'), 'Г.1.1'));
check('«в5» находит В.5', () => assert.equal(first('в5'), 'В.5'));
check('«б9» показывает группу Б.9', () => {
  const codes = searchItems(ATTESTATION_AREAS, 'б9').map((x) => x.code);
  assert.ok(codes.includes('Б.9.1') && codes.includes('Б.9.10'), 'ожидались Б.9.x, получено: ' + codes.slice(0, 5));
});
check('поиск по слову «котлы» работает', () => {
  const codes = searchItems(ATTESTATION_AREAS, 'котлы').map((x) => x.code);
  assert.ok(codes.includes('Б.8.1'), 'не нашлось Б.8.1, получено: ' + codes.slice(0, 5));
});
check('поиск по слову «краном» ничего не ломает', () => {
  assert.doesNotThrow(() => searchItems(ATTESTATION_AREAS, 'подъёмными'));
});
check('мусорный запрос даёт пустой список', () => {
  assert.equal(searchItems(ATTESTATION_AREAS, 'zzzzqqq').length, 0);
});
check('пустой запрос возвращает весь список', () => {
  assert.equal(searchItems(ATTESTATION_AREAS, '').length, ATTESTATION_AREAS.length);
});
check('коды литер уникальны', () => {
  const codes = ATTESTATION_AREAS.map((x) => x.code);
  assert.equal(new Set(codes).size, codes.length, 'есть повторяющиеся коды');
});

console.log('\n[Поиск обучений и категорий ВУ]');
check('«первая помощь» находит инструктора', () => {
  const titles = searchItems(TRAININGS, 'первая').map((x) => x.title);
  assert.ok(titles.some((x) => x.includes('Первая помощь')), 'получено: ' + titles.slice(0, 3));
});
check('«допог» находит ДОПОГ', () => {
  const codes = searchItems(TRAININGS, 'допог').map((x) => x.code);
  assert.ok(codes.includes('ADR-DRIVER'), 'получено: ' + codes.slice(0, 5));
});
check('«строп» находит стропальщика', () => {
  assert.equal(searchItems(TRAININGS, 'строп')[0].code, 'STROP');
});
check('коды обучений уникальны', () => {
  const codes = TRAININGS.map((x) => x.code);
  assert.equal(new Set(codes).size, codes.length);
});
check('«ce» находит категорию CE', () => {
  const items = LICENCE_CATEGORIES.map((c) => ({ code: c.code, title: c.title }));
  assert.equal(searchItems(items, 'ce')[0].code, 'CE');
});

console.log('\n[Маски ввода]');
check('дата: 01012024 -> 01.01.2024', () => assert.equal(MASKS.date('01012024'), '01.01.2024'));
check('дата: лишние цифры отбрасываются', () => assert.equal(MASKS.date('010120249999'), '01.01.2024'));
check('СНИЛС: 12345678900 -> 123-456-789 00', () => assert.equal(MASKS.snils('12345678900'), '123-456-789 00'));
check('ИНН: 123456789012 -> 1234-5678-9012', () => assert.equal(MASKS.inn('123456789012'), '1234-5678-9012'));
check('ИИН: только 12 цифр', () => assert.equal(MASKS.iin('88031530012345'), '880315300123'));
check('телефон РФ: 89991234567 -> +7 (999) 123 45-67', () =>
  assert.equal(MASKS.phoneRu('89991234567'), '+7 (999) 123 45-67'));
check('телефон РФ: 79991234567 -> +7 (999) 123 45-67', () =>
  assert.equal(MASKS.phoneRu('79991234567'), '+7 (999) 123 45-67'));
check('телефон международный: +998 90 123 45 67', () =>
  assert.equal(MASKS.phoneIntl('+998 90 123 45 67'), '+998901234567'));
check('паспорт РФ: 1234567890 -> 12 34 567890', () =>
  assert.equal(MASKS.passportRu('1234567890'), '12 34 567890'));
check('паспорт КЗ: n12345678 -> N12345678', () => assert.equal(MASKS.passportKz('n12345678'), 'N12345678'));
check('паспорт КЗ: удостоверение 9 цифр', () => assert.equal(MASKS.passportKz('123456789'), '123456789'));
check('паспорт РБ: mp1234567 -> MP1234567', () => assert.equal(MASKS.passportBy('mp1234567'), 'MP1234567'));
check('личный номер РБ: 14 символов', () =>
  assert.equal(MASKS.belarusPersonal('3140987a001pb5'), '3140987A001PB5'));
check('код подразделения: 770001 -> 770-001', () => assert.equal(MASKS.deptCode('770001'), '770-001'));
check('номер ВУ: 9988776655 -> 99 88 776655', () =>
  assert.equal(MASKS.licenceNumber('9988776655'), '99 88 776655'));
check('свободный ввод документа не пускает кириллицу-мусор', () =>
  assert.equal(MASKS.passportFree('ab-12/34!@#'), 'AB-12/34'));

console.log('\n[Проверка дат]');
check('01.01.1990 — корректная', () => assert.ok(isValidDate('01.01.1990')));
check('31.02.2024 — некорректная', () => assert.ok(!isValidDate('31.02.2024')));
check('29.02.2024 — корректная (високосный)', () => assert.ok(isValidDate('29.02.2024')));
check('29.02.2023 — некорректная', () => assert.ok(!isValidDate('29.02.2023')));
check('01.13.2024 — некорректная', () => assert.ok(!isValidDate('01.13.2024')));
check('неполная дата — некорректная', () => assert.ok(!isValidDate('01.01.20')));

console.log('\n[Правила по гражданству]');
check('четыре варианта гражданства', () => assert.equal(COUNTRIES.length, 4));
check('РФ: паспорт «12 34 567890» проходит', () =>
  assert.ok(getCountry('RU').passport.validate('12 34 567890')));
check('РФ: короткий номер не проходит', () => assert.ok(!getCountry('RU').passport.validate('12 34 5678')));
check('РФ: «кем выдан» и код обязательны', () => {
  const ru = getCountry('RU');
  assert.ok(ru.issuedBy.required && ru.deptCode.required);
});
check('КЗ: N12345678 проходит', () => assert.ok(getCountry('KZ').passport.validate('N12345678')));
check('КЗ: 9 цифр проходит', () => assert.ok(getCountry('KZ').passport.validate('123456789')));
check('КЗ: «кем выдан» необязателен, кода подразделения нет', () => {
  const kz = getCountry('KZ');
  assert.ok(!kz.issuedBy.required && !kz.deptCode.show);
});
check('КЗ: ИИН из 12 цифр проходит', () => assert.ok(getCountry('KZ').personalId.validate('880315300123')));
check('КЗ: ИНН отдельно не спрашивается', () => assert.equal(getCountry('KZ').taxId, null));
check('РБ: MP1234567 проходит', () => assert.ok(getCountry('BY').passport.validate('MP1234567')));
check('РБ: цифры без букв не проходят', () => assert.ok(!getCountry('BY').passport.validate('123456789')));
check('РБ: личный номер из 14 символов проходит', () =>
  assert.ok(getCountry('BY').personalId.validate('3140987A001PB5')));
check('Другое: свободный ввод от 4 символов проходит', () =>
  assert.ok(getCountry('OTHER').passport.validate('AB123456')));
check('Другое: идентификатор необязателен', () => assert.ok(!getCountry('OTHER').personalId.required));
check('Другое: «кем выдан» и код необязательны', () => {
  const other = getCountry('OTHER');
  assert.ok(!other.issuedBy.required && !other.deptCode.required);
});

console.log('\n[Служебное]');
check('normalize убирает точки и пробелы', () => assert.equal(normalize('Б 8.3'), 'Б83'));
check('queryVariants раскрывает латиницу', () => assert.ok(queryVariants('b83').includes('Б83')));

console.log(`\nПройдено проверок: ${passed}${process.exitCode ? ' — ЕСТЬ ОШИБКИ' : ' — все успешно'}\n`);
