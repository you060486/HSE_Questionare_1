// Общая оболочка анкет: липкая шапка с логотипом, переключателем языка и
// полосой заполнения, плюс окно успешной отправки.
//
// Вынесено из SurveyForm, потому что теперь этим пользуются две анкеты.
// Держать две копии нельзя: переключатель языка и фирменные отступы
// разъехались бы при первой же правке одной из них.

import { Globe, CheckCircle2 } from 'lucide-react';
import { VegaLogo } from './Logo.jsx';
import { Button, ProgressBar } from './ui.jsx';

/**
 * @param {'ru'|'en'} lang
 * @param {(code: string) => void} onLangChange
 * @param {number} [progress] 0-100; полоса рисуется только если передана
 * @param {string} [progressLabel] готовая подпись рядом с полосой
 */
export function FormHeader({ lang, onLangChange, progress, progressLabel }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-vd-line shadow-[0_1px_3px_rgba(22,37,92,0.06)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-4">
          <VegaLogo className="h-9 sm:h-11 text-[13px] sm:text-[16px]" />

          <div className="flex items-center gap-0.5 border border-vd-line p-0.5 shrink-0 vd-sharp">
            <Globe className="w-3.5 h-3.5 text-vd-muted ml-1.5 mr-0.5 hidden sm:block" />
            {['ru', 'en'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onLangChange(code)}
                className={`px-2.5 py-1.5 text-[11px] font-bold uppercase transition-all vd-sharp ${
                  lang === code ? 'bg-vd-navy text-white' : 'text-vd-muted hover:text-vd-navy hover:bg-vd-blue-pale'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {typeof progress === 'number' && (
          <div className="mt-2.5 sm:mt-3">
            <ProgressBar value={progress} label={progressLabel} />
          </div>
        )}
      </div>
    </header>
  );
}

/** Заголовок анкеты под шапкой */
export function FormTitle({ eyebrow, title, intro }) {
  return (
    <div className="bg-white border-b border-vd-line-soft">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {eyebrow && <p className="text-vd-blue text-[10px] sm:text-[11px] vd-eyebrow mb-2.5">{eyebrow}</p>}
        <h1 className="text-vd-navy text-[22px] sm:text-3xl font-black leading-[1.15] mb-3">{title}</h1>
        {intro && <p className="text-vd-muted text-[12px] sm:text-[13px] leading-relaxed max-w-xl">{intro}</p>}
      </div>
    </div>
  );
}

/** Окно «отправлено» */
export function SuccessModal({ title, text, buttonLabel, onClose, secondaryLabel, onSecondary }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-vd-navy-deep/70 backdrop-blur-sm vd-anim-fade-in">
      <div className="bg-white w-full max-w-sm p-7 text-center vd-anim-sheet border-t-2 border-vd-blue">
        <div className="w-16 h-16 mx-auto mb-5 bg-vd-blue-pale flex items-center justify-center vd-anim-pulse">
          <CheckCircle2 className="w-8 h-8 text-vd-blue" />
        </div>
        <h3 className="text-xl font-black text-vd-navy uppercase tracking-wide mb-2">{title}</h3>
        <p className="text-[13px] text-vd-muted leading-relaxed mb-6">{text}</p>
        {secondaryLabel && onSecondary && (
          <Button type="button" variant="secondary" onClick={onSecondary} className="w-full mb-2 justify-center">
            {secondaryLabel}
          </Button>
        )}
        <Button type="button" onClick={onClose} className="w-full">
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
