// Направления посещения объектов.
//
// Справочник общий: сейчас его использует анкета визитёра, позже те же
// направления появятся в анкете работника — поэтому список лежит отдельно.
//
// ВАЖНО про подписи. Два направления из трёх — это «строительство ВЛ», и если
// показать вид работ первой строкой, варианты станут визуально одинаковыми,
// а различие уедет в скобки. Поэтому первой строкой идёт то, что их различает
// (заказчик и участок), а вид работ — второй.
//
// code           — то, что уходит в таблицу и в письмо
// isPolarExpress — признак объектов Полярного Экспресса. По нему письмо
//                  позже будет уходить на дополнительные адреса.

export const DIRECTIONS = [
  {
    code: 'ПЭ-дорога',
    isPolarExpress: true,
    ru: { primary: 'Объекты Полярного Экспресса', secondary: 'Строительство дороги' },
    en: { primary: 'Polar Express facilities', secondary: 'Road construction' },
  },
  {
    code: 'АСК-ВЛ',
    isPolarExpress: false,
    ru: { primary: 'Объекты АСК — север, Билибино — Порт Чаун', secondary: 'Строительство ВЛ' },
    en: { primary: 'ASK facilities — north, Bilibino — Port Chaun', secondary: 'Overhead power line construction' },
  },
  {
    code: 'НЭ-ВЛ',
    isPolarExpress: false,
    ru: { primary: 'Объекты Нева Энерго — юг, Билибино — Песчанка', secondary: 'Строительство ВЛ' },
    en: { primary: 'Neva Energo facilities — south, Bilibino — Peschanka', secondary: 'Overhead power line construction' },
  },
];

/** Подписи для карточки выбора: две строки, различающая — первой */
export function directionLines(direction, lang) {
  return lang === 'ru' ? direction.ru : direction.en;
}

/** Одной строкой — для таблицы, письма и отправки на сервер (всегда по-русски) */
export function directionFullLabel(direction) {
  return `${direction.ru.secondary} (${direction.ru.primary})`;
}

export function getDirection(code) {
  return DIRECTIONS.find((d) => d.code === code) || null;
}

/** Выбрано ли хотя бы одно направление Полярного Экспресса */
export function hasPolarExpress(codes) {
  return (codes || []).some((code) => {
    const direction = getDirection(code);
    return direction ? direction.isPolarExpress : false;
  });
}

/* ------------------------------------------------------------------ */
/* Характер предполагаемых работ                                       */
/* ------------------------------------------------------------------ */
export const VISIT_MODES = [
  {
    code: 'самостоятельно',
    ru: 'Самостоятельный выезд на площадку',
    en: 'Independent site visit',
  },
  {
    code: 'в сопровождении',
    ru: 'Только в сопровождении',
    en: 'Escorted visits only',
  },
];

export function visitModeLabel(mode, lang) {
  return lang === 'ru' ? mode.ru : mode.en;
}

export function getVisitMode(code) {
  return VISIT_MODES.find((m) => m.code === code) || null;
}
