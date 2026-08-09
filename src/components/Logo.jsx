// Логотип Vega Development.
//
// Основной вариант — фирменные PNG из /public:
//   logo-ru.png   — «ВЕГА РАЗВИТИЕ» (показывается при русском языке)
//   logo-eng.png  — «VEGA DEVELOPMENT» (английский язык и экран выбора языка)
//
// Если файлов на месте нет, автоматически подставляется векторная звезда —
// анкета не ломается и выглядит прилично, пока картинки не загрузили.

import { useState } from 'react';
import { LOGO_FILES } from '../data/logo.js';

/* ------------------------------------------------------------------ */
/* Запасной вариант: звезда, собранная из восьми граней                */
/* ------------------------------------------------------------------ */
const RAY = {
  tip: [100, 5],
  leftValley: [70, 72],
  rightValley: [130, 72],
  notch: [100, 62],
};

const p = (pt) => pt.join(',');

const RAY_FACETS = [
  { points: `${p(RAY.tip)} ${p(RAY.rightValley)} ${p(RAY.notch)}`, tone: 'light' },
  { points: `${p(RAY.tip)} ${p(RAY.notch)} ${p(RAY.leftValley)}`, tone: 'dark' },
];

export function VegaStar({ className = '', animated = false, title = 'Vega Development' }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id="vd-star-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3AA7E6" />
          <stop offset="100%" stopColor="#1477BE" />
        </linearGradient>
        <linearGradient id="vd-star-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#26386F" />
          <stop offset="100%" stopColor="#0B1430" />
        </linearGradient>
      </defs>

      {[0, 90, 180, 270].map((angle, rayIndex) =>
        RAY_FACETS.map((facet, facetIndex) => (
          <polygon
            key={`${angle}-${facet.tone}`}
            points={facet.points}
            fill={facet.tone === 'light' ? 'url(#vd-star-light)' : 'url(#vd-star-dark)'}
            transform={`rotate(${angle} 100 100)`}
            style={
              animated
                ? {
                    animation: 'vd-ray-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
                    animationDelay: `${rayIndex * 0.11 + facetIndex * 0.05}s`,
                    transformOrigin: '100px 100px',
                  }
                : undefined
            }
          />
        ))
      )}
    </svg>
  );
}

/* Текстовая часть запасного варианта */
function FallbackWordmark({ lang, variant }) {
  const top = lang === 'ru' ? 'ВЕГА' : 'VEGA';
  const bottom = lang === 'ru' ? 'РАЗВИТИЕ' : 'DEVELOPMENT';
  return (
    <div className="leading-none">
      <div
        className="font-black tracking-tight"
        style={{ color: variant === 'light' ? '#8FD0F5' : '#1B85CE', fontSize: '0.92em', letterSpacing: '-0.01em' }}
      >
        {top}
      </div>
      <div
        className="font-black tracking-tight"
        style={{
          color: variant === 'light' ? '#FFFFFF' : '#16255C',
          fontSize: '0.62em',
          letterSpacing: '-0.01em',
          marginTop: '0.1em',
        }}
      >
        {bottom}
      </div>
    </div>
  );
}

/**
 * Логотип компании.
 * @param {'ru'|'en'} lang     — какой файл брать: без пометки eng или с ней
 * @param {'light'|'dark'} variant — на тёмной подложке логотип кладётся на белую плашку
 * @param {string} className   — задаёт высоту, например h-10
 */
export function VegaLogo({ lang = 'ru', variant = 'dark', className = '' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = LOGO_FILES[lang] || LOGO_FILES.ru;
  const alt = lang === 'ru' ? 'Вега Развитие' : 'Vega Development';

  if (imageFailed) {
    // Файлов ещё нет — показываем векторный запасной вариант
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <VegaStar className="h-full w-auto shrink-0" />
        <FallbackWordmark lang={lang} variant={variant} />
      </div>
    );
  }

  // Логотип нарисован тёмно-синим по светлому фону, поэтому на тёмной шапке
  // кладём его на белую плашку — так он читается при любой прозрачности файла
  const onDark = variant === 'light';

  return (
    <span className={`inline-flex items-center shrink-0 ${onDark ? 'bg-white px-2.5 py-1.5' : ''} ${className}`}>
      <img
        src={src}
        alt={alt}
        onError={() => setImageFailed(true)}
        className="h-full w-auto object-contain"
        style={{ maxWidth: '100%' }}
      />
    </span>
  );
}

export default VegaLogo;
