// Умный поиск по справочникам.
// Понимает "б83", "Б 8.3", "b8.3", "b 8 3" как Б.8.3, а "в"/"се" — как категории B/CE.
// Ищет и по коду, и по словам из наименования.

// Буквы, которые человек пишет не в том алфавите. Работает в обе стороны:
// коды литер записаны кириллицей, а категории водительского удостоверения — латиницей,
// при этом набирают их с той раскладки, которая сейчас включена.
const LETTER_ALIASES = {
  // латиница -> кириллица
  A: ['А'],
  B: ['Б', 'В'],
  V: ['В'],
  G: ['Г'],
  D: ['Д'],
  E: ['Е'],
  K: ['К'],
  M: ['М'],
  H: ['Н', 'Х'],
  N: ['Н'],
  O: ['О'],
  P: ['Р'],
  R: ['Р'],
  C: ['С'],
  S: ['С'],
  T: ['Т'],
  U: ['У'],
  Y: ['У'],
  X: ['Х'],
  Z: ['З'],
  I: ['И'],
  L: ['Л'],
  F: ['Ф'],
  // кириллица -> латиница
  А: ['A'],
  Б: ['B'],
  В: ['B', 'V'],
  Г: ['G'],
  Д: ['D'],
  Е: ['E'],
  К: ['K'],
  М: ['M'],
  Н: ['H', 'N'],
  О: ['O'],
  Р: ['P', 'R'],
  С: ['C', 'S'],
  Т: ['T'],
  У: ['U', 'Y'],
  Х: ['X', 'H'],
  Ц: ['C'],
  З: ['Z'],
  И: ['I'],
  Л: ['L'],
  П: ['P'],
  Ф: ['F'],
  Э: ['E'],
};

// Те же буквы, но набранные в чужой раскладке (человек забыл переключить язык):
// f -> а, "," -> б, d -> в, u -> г
const KEYBOARD_TO_CYRILLIC = {
  F: 'А',
  ',': 'Б',
  D: 'В',
  U: 'Г',
  L: 'Д',
};

// Ограничение на перебор: без него длинный запрос из одних «двусмысленных»
// букв породил бы тысячи вариантов
const MAX_VARIANTS = 64;

/** Убирает всё, кроме букв и цифр, и приводит к верхнему регистру: "Б 8.3" -> "Б83" */
export function normalize(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/Ё/g, 'Е')
    .replace(/[^0-9A-ZА-Я]/g, '');
}

/**
 * Возвращает все правдоподобные варианты написания запроса.
 * "b83" -> ["B83", "Б83", "В83"],  "се" -> ["СЕ", "CE", "SE", ...]
 */
export function queryVariants(query) {
  const base = normalize(query);
  if (!base) return [];

  let variants = [''];
  for (const char of base) {
    const options = LETTER_ALIASES[char] ? [char, ...LETTER_ALIASES[char]] : [char];
    const next = [];
    outer: for (const prefix of variants) {
      for (const option of options) {
        next.push(prefix + option);
        if (next.length >= MAX_VARIANTS) break outer;
      }
    }
    variants = next;
  }

  // Вариант «забыл переключить раскладку»
  const keyboardVariant = base
    .split('')
    .map((char) => KEYBOARD_TO_CYRILLIC[char] || char)
    .join('');

  // Исходный запрос добавляем всегда: перебор мог оборваться по лимиту
  return [...new Set([base, keyboardVariant, ...variants])];
}

/**
 * Оценивает, насколько запись подходит под запрос.
 * Чем больше число, тем выше в списке. 0 — не подходит.
 */
export function scoreMatch(item, query) {
  const variants = queryVariants(query);
  if (variants.length === 0) return 1; // пустой запрос — показываем всё

  const code = normalize(item.code);
  const title = normalize(item.title);
  const titleWords = String(item.title || '')
    .toUpperCase()
    .split(/[^0-9A-ZА-ЯЁ]+/)
    .filter(Boolean)
    .map(normalize);

  let best = 0;
  for (const variant of variants) {
    if (!variant) continue;
    if (code === variant) best = Math.max(best, 100);
    else if (code.startsWith(variant)) best = Math.max(best, 80);
    else if (code.includes(variant)) best = Math.max(best, 60);

    // По наименованию ищем только со слова от 3 букв, иначе выдача превращается в кашу
    if (variant.length >= 3) {
      if (titleWords.some((word) => word.startsWith(variant))) best = Math.max(best, 40);
      else if (title.includes(variant)) best = Math.max(best, 20);
    }
  }
  return best;
}

/** Фильтрует и сортирует список по запросу */
export function searchItems(items, query) {
  if (!query || !query.trim()) return items;
  return items
    .map((item, index) => ({ item, index, score: scoreMatch(item, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.code.length - b.item.code.length || a.index - b.index)
    .map((row) => row.item);
}
