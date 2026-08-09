// Умный поиск по справочникам: понимает "б83", "Б 8.3", "b8.3", "b 8 3" как Б.8.3,
// а также ищет по словам из наименования.

// Латинские буквы, которые люди пишут вместо кириллических.
// Одна латинская буква может означать две разные кириллические (B -> Б или В),
// поэтому раскладываем в несколько вариантов запроса.
const LATIN_TO_CYRILLIC = {
  A: ['А'],
  B: ['Б', 'В'],
  V: ['В'],
  G: ['Г'],
  D: ['Д'],
  E: ['Е'],
  K: ['К'],
  M: ['М'],
  H: ['Н'],
  O: ['О'],
  P: ['Р'],
  C: ['С'],
  T: ['Т'],
  Y: ['У'],
  X: ['Х'],
};

// Те же буквы, но набранные в английской раскладке на русской клавиатуре
// (человек забыл переключить язык): f -> а, "," -> б, d -> в, u -> г
const KEYBOARD_TO_CYRILLIC = {
  F: 'А',
  ',': 'Б',
  D: 'В',
  U: 'Г',
  L: 'Д',
};

/** Убирает всё, кроме букв и цифр, и приводит к верхнему регистру: "Б 8.3" -> "Б83" */
export function normalize(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/Ё/g, 'Е')
    .replace(/[^0-9A-ZА-Я]/g, '');
}

/**
 * Возвращает все правдоподобные варианты написания запроса кириллицей.
 * "b83" -> ["B83", "Б83", "В83"]
 */
export function queryVariants(query) {
  const base = normalize(query);
  if (!base) return [];

  const variants = new Set([base]);

  // Замена латиницы на кириллицу (перебираем все сочетания для первых букв)
  const expand = (str, index, acc) => {
    if (index >= str.length) {
      variants.add(acc);
      return;
    }
    const char = str[index];
    const options = LATIN_TO_CYRILLIC[char];
    if (options) {
      options.forEach((cyr) => expand(str, index + 1, acc + cyr));
    }
    // всегда оставляем и исходный символ
    expand(str, index + 1, acc + char);
  };
  // Ограничиваем перебор: буквы стоят только в начале кода, дальше цифры
  if (base.length <= 12) expand(base, 0, '');

  // Вариант "забыл переключить раскладку"
  const keyboardVariant = base
    .split('')
    .map((char) => KEYBOARD_TO_CYRILLIC[char] || char)
    .join('');
  variants.add(keyboardVariant);

  return [...variants];
}

/**
 * Оценивает, насколько запись подходит под запрос.
 * Возвращает число: чем больше, тем выше в списке. 0 — не подходит.
 */
export function scoreMatch(item, query) {
  const variants = queryVariants(query);
  if (variants.length === 0) return 1; // пустой запрос — показываем всё

  const code = normalize(item.code);
  const title = normalize(item.title);
  const titleWords = String(item.title || '')
    .toUpperCase()
    .split(/[^0-9A-ZА-ЯЁ]+/)
    .filter(Boolean);

  let best = 0;
  for (const variant of variants) {
    if (!variant) continue;
    if (code === variant) best = Math.max(best, 100);
    else if (code.startsWith(variant)) best = Math.max(best, 80);
    else if (code.includes(variant)) best = Math.max(best, 60);

    // поиск по наименованию имеет смысл только для слов от 3 букв
    if (variant.length >= 3) {
      if (titleWords.some((word) => normalize(word).startsWith(variant))) best = Math.max(best, 40);
      else if (title.includes(variant)) best = Math.max(best, 20);
    }
  }
  return best;
}

/** Фильтрует и сортирует список по запросу */
export function searchItems(items, query) {
  if (!query || !query.trim()) return items;
  return items
    .map((item) => ({ item, score: scoreMatch(item, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.item);
}
