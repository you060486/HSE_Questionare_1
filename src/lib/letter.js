// Скачивание готового письма (.eml), которое собрал сервер.
// Отправляет письмо сам работник из своей почты — поэтому задача браузера
// только сохранить файл и дать возможность скачать его повторно, если
// первое скачивание заблокировал браузер.

/** Сохраняет файл письма на устройство */
export function saveLetter(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Ссылку отпускаем не сразу: Safari успевает начать скачивание только так
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Имя файла из заголовка ответа, с запасным вариантом из ФИО.
 * Сервер присылает и ASCII-имя, и UTF-8 — берём то, что понятнее человеку.
 */
export function emlFileName(disposition, fallbackName = '') {
  const header = String(disposition || '');
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      /* испорченная кодировка — пойдём дальше */
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  if (plain && !/^[_\s]*$/.test(plain[1])) return plain[1].trim();

  const safe = String(fallbackName || 'анкета').trim().replace(/\s+/g, '_');
  return `Анкета_${safe}.eml`;
}
