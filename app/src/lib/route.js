// Разбор адреса. Единственное место, где живёт знание о путях анкет.
//
// Тип анкеты определяется ПУТЁМ, а не фрагментом и не параметром:
//  • фрагмент (#/visitor) срезают сокращатели ссылок, трекеры рассылок
//    и превью в мессенджерах — человек молча получил бы анкету работника;
//  • путь /visitor осмыслен и без ?id — значит на него можно напечатать
//    QR-код, а id только уточняет получателей письма.
//
// Все адреса строятся от import.meta.env.BASE_URL: в боевой сборке это '/',
// в тестовой — '/preview/'. Абсолютный '/visitor' увёл бы с превью на прод.

const BASE = import.meta.env.BASE_URL || '/';

export const VISITOR_SEGMENT = 'visitor';

/** Путь относительно базы: '' для анкеты работника, 'visitor' для визитёра */
// Адрес сравниваем без учёта регистра: ссылку визитёра печатают на плакате
// и набирают руками, а «/Visitor» вместо «/visitor» молча открывал бы
// анкету работника — человек заполнил бы не ту форму и не заметил этого
export function currentRoute(pathname = window.location.pathname) {
  const relative = pathname.toLowerCase().startsWith(BASE.toLowerCase())
    ? pathname.slice(BASE.length)
    : pathname;
  return relative.replace(/^\/+|\/+$/g, '').toLowerCase();
}

// Смотрим только первый участок пути: «/visitor/» с лишним хвостом должен
// вести туда же, куда и «/visitor», а не молча отдавать анкету работника
function firstSegment(pathname) {
  return currentRoute(pathname).split('/')[0];
}

export function isVisitorRoute(pathname) {
  return firstSegment(pathname) === VISITOR_SEGMENT;
}

/** Идентификатор ссылки. Лежит в query, а не в хэше — его читает и фронт, и бэкенд */
export function getLinkId(search = window.location.search) {
  return new URLSearchParams(search).get('id');
}

/**
 * Собирает ссылку на анкету — ей же кормится генератор QR-кодов.
 * @param {'employee'|'visitor'} kind
 * @param {string} [linkId] без него получится постоянный адрес анкеты
 */
export function buildFormUrl(kind, linkId, origin = window.location.origin) {
  const path = kind === 'visitor' ? `${BASE}${VISITOR_SEGMENT}` : BASE;
  return `${origin}${path}${linkId ? `?id=${linkId}` : ''}`;
}
