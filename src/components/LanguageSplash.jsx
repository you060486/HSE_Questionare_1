// Экран выбора языка перед анкетой.
// Оформление намеренно спокойное: светлый фон, фирменная типографика,
// без картинок и заливок — они здесь только мешали.

import { useEffect, useState } from 'react';
import { LOGO_FILE } from '../data/logo.js';

export default function LanguageSplash({ onChoose }) {
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Если файла логотипа вдруг нет, покажем название текстом — экран не сломается
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const choose = (lang) => {
    setLeaving(true);
    setTimeout(() => onChoose(lang), 320);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6 py-10 overflow-y-auto transition-opacity duration-300"
      style={{ opacity: leaving ? 0 : 1 }}
    >
      <div className="w-full max-w-sm text-center">
        {/* Фирменный логотип — звезда и надпись одной картинкой */}
        <div style={{ animation: 'vd-fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          {logoFailed ? (
            <>
              <div className="text-vd-blue font-black text-3xl sm:text-4xl leading-none tracking-tight">VEGA</div>
              <div className="text-vd-navy font-black text-lg sm:text-xl leading-none tracking-[0.02em] mt-1.5">
                DEVELOPMENT
              </div>
            </>
          ) : (
            <img
              src={LOGO_FILE}
              alt="Vega Development"
              onError={() => setLogoFailed(true)}
              className="h-28 sm:h-32 w-auto max-w-full object-contain mx-auto"
            />
          )}
          <div className="mx-auto mt-6 h-0.5 w-12 bg-vd-blue" />
        </div>

        {/* Выбор языка */}
        <div
          className="transition-all duration-400 mt-10"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0)' : 'translateY(12px)',
            pointerEvents: ready ? 'auto' : 'none',
          }}
        >
          <p className="text-vd-muted text-[10px] sm:text-[11px] vd-eyebrow mb-5">Выберите язык / Choose language</p>

          <div className="space-y-2.5">
            {[
              { lang: 'ru', label: 'Русский', sub: 'Продолжить на русском' },
              { lang: 'en', label: 'English', sub: 'Continue in English' },
            ].map((option, index) => (
              <button
                key={option.lang}
                type="button"
                onClick={() => choose(option.lang)}
                className="group w-full flex items-center gap-4 px-5 py-4 bg-white border border-vd-line
                           hover:border-vd-navy hover:bg-vd-navy transition-all duration-250 vd-sharp"
                style={{
                  animation: ready
                    ? `vd-fade-up 0.4s cubic-bezier(0.22,1,0.36,1) ${0.05 + index * 0.08}s both`
                    : undefined,
                }}
              >
                <span className="vd-diamond w-7 h-7 shrink-0 transition-transform duration-300 group-hover:rotate-180">
                  <span className="text-[9px] font-black text-white">{option.lang.toUpperCase()}</span>
                </span>
                <span className="text-left min-w-0">
                  <span className="block text-vd-navy font-bold text-[15px] leading-tight group-hover:text-white transition-colors">
                    {option.label}
                  </span>
                  <span className="block text-vd-muted text-[11px] leading-tight mt-0.5 group-hover:text-white/60 transition-colors">
                    {option.sub}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <p className="text-vd-muted/70 text-[10px] leading-snug mt-6">
            Язык можно поменять в любой момент
            <br />
            You can switch the language at any time
          </p>
        </div>
      </div>
    </div>
  );
}
