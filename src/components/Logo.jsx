// Логотип Vega Development, воссозданный в векторе.
// Звезда собрана из восьми граней (по две на каждый луч) — это нужно,
// чтобы на заставке лучи могли «прилетать» по одному.
//
// Если появятся оригинальные файлы логотипа, положи их в /opt/newcomer-app/public/
// и замени содержимое VegaStar на <img src="/logo.svg" />.



// Геометрия одного луча, направленного вверх. Остальные три — поворотом на 90°.
// tip — остриё, notch — вырез у центра, valley — точки схождения с соседними лучами.
const RAY = {
  tip: [100, 5],
  leftValley: [70, 72],
  rightValley: [130, 72],
  notch: [100, 62],
};

const p = (pt) => pt.join(',');

const RAY_FACETS = [
  // ведущая грань — светлая
  { points: `${p(RAY.tip)} ${p(RAY.rightValley)} ${p(RAY.notch)}`, tone: 'light' },
  // теневая грань — тёмная
  { points: `${p(RAY.tip)} ${p(RAY.notch)} ${p(RAY.leftValley)}`, tone: 'dark' },
];

/**
 * Звезда из логотипа.
 * @param {boolean} animated — включает поочерёдный прилёт лучей (для заставки)
 */
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

/**
 * Полный логотип: звезда + надпись.
 * @param {'ru'|'en'} lang — «ВЕГА РАЗВИТИЕ» или «VEGA DEVELOPMENT»
 * @param {'light'|'dark'} variant — для тёмной подложки надпись становится белой
 */
export function VegaLogo({ lang = 'ru', variant = 'dark', className = '' }) {
  const top = lang === 'ru' ? 'ВЕГА' : 'VEGA';
  const bottom = lang === 'ru' ? 'РАЗВИТИЕ' : 'DEVELOPMENT';
  const topColor = variant === 'light' ? '#8FD0F5' : '#1B85CE';
  const bottomColor = variant === 'light' ? '#FFFFFF' : '#16255C';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <VegaStar className="h-full w-auto shrink-0" />
      <div className="leading-none">
        <div
          className="font-black tracking-tight"
          style={{ color: topColor, fontSize: '0.92em', letterSpacing: '-0.01em' }}
        >
          {top}
        </div>
        <div
          className="font-black tracking-tight"
          style={{ color: bottomColor, fontSize: '0.62em', letterSpacing: '-0.01em', marginTop: '0.1em' }}
        >
          {bottom}
        </div>
      </div>
    </div>
  );
}

export default VegaLogo;
