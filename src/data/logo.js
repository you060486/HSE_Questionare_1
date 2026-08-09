// Пути к фирменным логотипам.
//
// Файлы кладутся в /opt/newcomer-app/public/ и после сборки попадают в корень сайта:
//   logo-ru.png   — «ВЕГА РАЗВИТИЕ», показывается при русском языке
//   logo-eng.png  — «VEGA DEVELOPMENT», английский язык и экран выбора языка
//
// Если файла нет, интерфейс сам подставит векторную звезду — ничего не сломается.

const BASE = import.meta.env.BASE_URL || '/';

export const LOGO_FILES = {
  ru: `${BASE}logo-ru.png`,
  en: `${BASE}logo-eng.png`,
};

export default LOGO_FILES;
