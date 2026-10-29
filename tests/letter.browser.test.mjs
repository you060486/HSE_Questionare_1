// Браузерная проверка: анкета заполняется, отправляется, и в ответ браузер
// получает файл письма — именно его работник открывает и отправляет сам.
//
// Анкета рисуется в jsdom по-настоящему: это ловит расхождения между тем,
// что делает форма, и тем, что отдаёт сервер.
//
// Сборка бандла (из корня репозитория):
//   npx esbuild ../app/src/main.jsx --bundle --format=iife --jsx=automatic \
//     --outfile=tests/app-bundle.js --loader:.jsx=jsx --loader:.css=empty \
//     --loader:.png=dataurl --loader:.svg=dataurl \
//     --define:process.env.NODE_ENV='"production"' \
//     '--define:import.meta.env.BASE_URL="/"'
// Запуск: node tests/letter.browser.test.mjs

import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const bundlePath = new URL('./app-bundle.js', import.meta.url);
if (!fs.existsSync(bundlePath)) {
  console.error('Нет tests/app-bundle.js — соберите бандл командой из шапки файла.');
  process.exit(2);
}
const bundle = fs.readFileSync(bundlePath, 'utf8');

let ok = 0;
let bad = 0;
const check = (n, c, d = '') => {
  c ? (ok++, console.log('  ok   ' + n)) : (bad++, console.log('  FAIL ' + n + (d ? '\n       ' + d : '')));
};

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  url: 'https://newcomer.hse-vd.online/?id=0123456789abcdef',
});
const { window } = dom;
window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.scrollTo = () => {};
window.scrollBy = () => {};
window.Element.prototype.scrollIntoView = () => {};

/* --- что отдаёт «сервер»: тот же файл письма, что и настоящий --- */
const EML = Buffer.from(
  'MIME-Version: 1.0\r\nX-Unsent: 1\r\nTo: hse@example.invalid\r\nSubject: test\r\n\r\nтело',
  'utf8'
);
let submitted = null;
window.fetch = (url, options = {}) => {
  const u = String(url);
  if (u.includes('/api/session/')) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ employees: [] }) });
  }
  if (u.includes('/api/submit')) {
    submitted = options.body;
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: {
        get: (name) =>
          name.toLowerCase() === 'content-disposition'
            ? "attachment; filename=\"Anketa.eml\"; filename*=UTF-8''%D0%90%D0%BD%D0%BA%D0%B5%D1%82%D0%B0_%D0%98%D0%B2%D0%B0%D0%BD%D0%BE%D0%B2.eml"
            : null,
      },
      blob: () => Promise.resolve(new window.Blob([EML], { type: 'message/rfc822' })),
    });
  }
  return Promise.reject(new Error('неожиданный запрос: ' + u));
};

/* --- перехватываем скачивание --- */
const downloads = [];
window.URL.createObjectURL = () => 'blob:stub';
window.URL.revokeObjectURL = () => {};
const realCreate = window.document.createElement.bind(window.document);
window.document.createElement = (tag) => {
  const el = realCreate(tag);
  if (tag === 'a') {
    el.click = () => downloads.push({ name: el.download, href: el.href });
  }
  return el;
};

const errs = [];
window.console.error = (...a) => {
  const s = a.map(String).join(' ');
  if (!s.includes('not wrapped in act')) errs.push(s.slice(0, 200));
};

const tick = (ms = 90) => new Promise((r) => setTimeout(r, ms));
const $$ = (s) => [...window.document.querySelectorAll(s)];
const text = () => window.document.body.textContent || '';
const byText = (sel, needle) => $$(sel).find((el) => (el.textContent || '').includes(needle));
const click = (el) => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
const setValue = (el, v) => {
  const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  el.dispatchEvent(new window.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
};

/* Что вписываем в поля. Выбраны самые простые ответы: при них анкета
   не требует загрузки сканов, и проверка остаётся про письмо, а не про файлы */
const VALUES = {
  employeeName: 'Проверкин Тест Письмович',
  positionRu: 'Мастер СМР',
  positionEn: 'Site foreman',
  birthDate: '01.01.1990',
  rotationStart: '01.11.2026',
  personalId: '123-456-789 00',
  phone_0: '+7 900 000-00-00',
  personalEmail: 'worker@example.invalid',
  workEmail: 'worker@vegadevelopment.com',
};
// В группах выбора берём вариант «не требуется» — он не тянет за собой
// ни удостоверений, ни фотографий. «Пока не знаю» выбирать нельзя:
// с ним анкета намеренно не отправляется
const CHOICES = {
  promStatus: 'Не нужно по моей работе',
  electroStatus: 'Не нужно по моей работе',
  height: 'С высотой не работаю',
  confined: 'В замкнутых пространствах не',
  drive: 'Транспортом управлять не пла',
};

function fillField(wrap) {
  const field = wrap.getAttribute('data-field');
  const inputs = [...wrap.querySelectorAll('input, select, textarea')];
  for (const input of inputs) {
    if (input.type === 'file') continue;

    if (input.type === 'radio' || input.type === 'checkbox') {
      const wanted = CHOICES[field];
      const label = (input.closest('label') || {}).textContent || '';
      if (wanted) {
        if (label.includes(wanted) && !input.checked) click(input);
      } else if (!input.checked) {
        click(input); // согласие и прочие одиночные галочки
      }
      continue;
    }

    if (input.tagName === 'SELECT') {
      if (input.value) continue;
      const option = [...input.options].find((o) => o.value && !/друг|other/i.test(o.value + o.textContent));
      if (option) setValue(input, option.value);
      continue;
    }

    if (!input.value) setValue(input, VALUES[field] || 'Проверка');
  }
}

window.eval(bundle);
await tick(350);
click(byText('button', 'Русский'));
await tick(500);

console.log('\n[Заполнение анкеты]');
check('анкета работника открылась', text().includes('Анкета нового работника'), text().slice(0, 120));

// Заполняем всё, что видим, и повторяем проход: часть полей появляется
// только после выбора в предыдущих
// Несколько проходов: часть полей появляется только после выбора в предыдущих
for (let pass = 0; pass < 6; pass += 1) {
  for (const wrap of $$('[data-field]')) fillField(wrap);
  await tick(130);
}
const progress = (text().match(/Заполнено (\d+)%/) || [])[1];
check('полоса заполнения дошла до конца', progress === '100', 'заполнено ' + progress + '%');

console.log('\n[Отправка]');
const submit = byText('button', 'Отправить анкету');
check('кнопка отправки на месте', !!submit);
click(submit);
await tick(600);

check('запрос ушёл на сервер', !!submitted);
check('данные отправлены как multipart с полем data',
  !!submitted && typeof submitted.get === 'function' && typeof submitted.get('data') === 'string',
  submitted ? typeof submitted : 'нет');

console.log('\n[Письмо скачалось]');
check('файл скачан ровно один раз', downloads.length === 1, 'скачиваний: ' + downloads.length);
check('имя файла взято из ответа сервера и с кириллицей',
  downloads[0] && downloads[0].name === 'Анкета_Иванов.eml', downloads[0] && downloads[0].name);
check('скачан именно файл из ответа, а не ссылка', downloads[0] && downloads[0].href === 'blob:stub');

console.log('\n[Что видит работник]');
check('сказано, что письмо готово', text().includes('Письмо готово'), text().slice(-200));
check('объяснено, что надо нажать «Отправить»', /нажать «Отправить»/.test(text()));
check('предупреждено, что без этого анкета не дойдёт', /не дойд/.test(text()));
check('нет обещания, что анкета уже отправлена', !text().includes('Анкета отправлена'));

const again = byText('button', 'Скачать письмо снова');
check('есть кнопка повторного скачивания', !!again);
click(again);
await tick(150);
check('повторное скачивание отдаёт тот же файл',
  downloads.length === 2 && downloads[1].name === downloads[0].name, 'скачиваний: ' + downloads.length);

console.log('\n[Ошибки]');
check('консоль чистая', errs.length === 0, errs.slice(0, 2).join(' / '));

console.log(`\nПройдено: ${ok}, провалено: ${bad}`);
process.exit(bad ? 1 : 0);
