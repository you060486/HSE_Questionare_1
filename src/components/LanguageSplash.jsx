// Заставка перед анкетой: звезда логотипа собирается из четырёх лучей,
// затем появляется предложение выбрать язык.

import { useEffect, useState } from 'react';
import { VegaStar } from './Logo.jsx';

export default function LanguageSplash({ onChoose }) {
  const [stage, setStage] = useState(0); // 0 — собирается звезда, 1 — показываем выбор
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStage(1), 900);
    return () => clearTimeout(timer);
  }, []);

  const choose = (lang) => {
    setLeaving(true);
    setTimeout(() => onChoose(lang), 420);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6 overflow-hidden transition-all duration-[420ms] ease-out"
      style={{
        background: 'linear-gradient(140deg, #0C1633 0%, #16255C 48%, #14548F 100%)',
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'scale(1.04)' : 'scale(1)',
      }}
    >
      {/* Ромбы на фоне — мотив корпоративных слайдов */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -left-24 top-1/4 w-64 h-64 border border-white/10"
          style={{ transform: 'rotate(45deg)', animation: 'vd-fade-in 1.4s ease 0.3s both' }}
        />
        <div
          className="absolute -right-20 bottom-1/4 w-52 h-52 border border-white/10"
          style={{ transform: 'rotate(45deg)', animation: 'vd-fade-in 1.4s ease 0.55s both' }}
        />
        <div
          className="absolute right-1/4 -top-16 w-40 h-40 border border-white/[0.07]"
          style={{ transform: 'rotate(45deg)', animation: 'vd-fade-in 1.4s ease 0.8s both' }}
        />
      </div>

      <div className="relative w-full max-w-sm text-center">
        {/* Звезда */}
        <div className="flex justify-center mb-7">
          <VegaStar className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-2xl" animated />
        </div>

        {/* Название компании */}
        <div
          className="mb-10"
          style={{ animation: 'vd-fade-up 0.6s cubic-bezier(0.22,1,0.36,1) 0.62s both' }}
        >
          <div className="text-[#5FB6EA] font-black text-2xl sm:text-3xl leading-none tracking-tight">VEGA</div>
          <div className="text-white font-black text-base sm:text-lg leading-none tracking-[0.02em] mt-1">
            DEVELOPMENT
          </div>
          <div className="mx-auto mt-5 h-px w-14 bg-white/25" />
        </div>

        {/* Выбор языка */}
        <div
          className="transition-all duration-500"
          style={{
            opacity: stage === 1 ? 1 : 0,
            transform: stage === 1 ? 'translateY(0)' : 'translateY(14px)',
            pointerEvents: stage === 1 ? 'auto' : 'none',
          }}
        >
          <p className="text-white/60 text-[10px] sm:text-[11px] vd-eyebrow mb-5">Выбери язык / Choose language</p>

          <div className="space-y-3">
            {[
              { lang: 'ru', label: 'Русский', sub: 'Продолжить на русском' },
              { lang: 'en', label: 'English', sub: 'Continue in English' },
            ].map((option, index) => (
              <button
                key={option.lang}
                type="button"
                onClick={() => choose(option.lang)}
                className="group w-full flex items-center gap-4 px-5 py-4 bg-white/[0.07] border border-white/20 backdrop-blur-sm
                           hover:bg-white hover:border-white transition-all duration-300 vd-sharp"
                style={{
                  animation:
                    stage === 1
                      ? `vd-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) ${0.08 + index * 0.09}s both`
                      : undefined,
                }}
              >
                <span className="vd-diamond vd-diamond-outline w-7 h-7 shrink-0 transition-transform duration-300 group-hover:rotate-180">
                  <span className="text-[9px] font-black text-white group-hover:text-vd-navy transition-colors">
                    {option.lang.toUpperCase()}
                  </span>
                </span>
                <span className="text-left min-w-0">
                  <span className="block text-white font-bold text-[15px] leading-tight group-hover:text-vd-navy transition-colors">
                    {option.label}
                  </span>
                  <span className="block text-white/50 text-[11px] leading-tight mt-0.5 group-hover:text-vd-muted transition-colors">
                    {option.sub}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <p className="text-white/35 text-[10px] leading-snug mt-6">
            Язык можно поменять в любой момент
            <br />
            You can switch the language at any time
          </p>
        </div>
      </div>
    </div>
  );
}
