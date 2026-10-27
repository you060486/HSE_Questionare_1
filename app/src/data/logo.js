// Путь к фирменному логотипу.
//
// Используется один файл — английский вариант «VEGA DEVELOPMENT».
// Кладётся в /opt/newcomer-app/public/ и после сборки попадает в корень сайта.
//
// Если файла нет, интерфейс сам подставит векторную звезду — ничего не сломается.

const BASE = import.meta.env.BASE_URL || '/';

export const LOGO_FILE = `${BASE}logo-eng.png`;

export default LOGO_FILE;
