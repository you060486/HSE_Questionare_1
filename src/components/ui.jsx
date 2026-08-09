// Базовые элементы интерфейса анкеты. Весь фирменный стиль живёт здесь,
// поэтому экраны остаются читаемыми, а правки внешнего вида делаются в одном месте.

import { useEffect, useState } from 'react';
import { Upload, X, Trash2, AlertTriangle, Info, Check } from 'lucide-react';
import { MASKS } from '../lib/format.js';
import { useReveal } from '../lib/useReveal.js';

/* ------------------------------------------------------------------ */
/* Раздел анкеты                                                       */
/* ------------------------------------------------------------------ */
export function Section({ number, title, subtitle, children }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="vd-reveal">
      <div className="flex items-center gap-3 border-b border-vd-line pb-3 mb-5 sm:pb-4 sm:mb-6">
        <span className="vd-diamond w-8 h-8 sm:w-9 sm:h-9">
          <span className="text-white font-bold text-[11px] sm:text-xs">{number}</span>
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] sm:text-lg font-bold text-vd-navy leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] sm:text-xs text-vd-muted mt-0.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4 sm:space-y-5">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Подзаголовок с треугольным маркером                                 */
/* ------------------------------------------------------------------ */
export function SubHeading({ children, className = '' }) {
  return (
    <h3 className={`vd-marker text-[13px] sm:text-sm font-bold text-vd-blue uppercase tracking-wide ${className}`}>
      {children}
    </h3>
  );
}

/* ------------------------------------------------------------------ */
/* Обёртка поля: подпись, подсказка, ошибка                            */
/* ------------------------------------------------------------------ */
export function Field({ label, hint, required, dim, error, optionalMark, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className={`block text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 ${dim ? 'text-vd-muted' : 'text-vd-navy'}`}>
          {label}
          {required && <span className="text-vd-blue ml-1">*</span>}
          {dim && !required && optionalMark && (
            <span className="ml-2 normal-case tracking-normal font-normal text-[10px] sm:text-[11px] text-vd-muted">
              {optionalMark}
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] text-red-600 mt-1.5 font-medium">{error}</p>
      ) : (
        hint && <p className={`text-[10px] sm:text-[11px] mt-1.5 leading-snug ${dim ? 'text-vd-muted/80' : 'text-vd-muted'}`}>{hint}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Текстовое поле с маской                                             */
/* ------------------------------------------------------------------ */
export function TextInput({ mask = 'none', value, onChange, dim, invalid, className = '', ...rest }) {
  const apply = MASKS[mask] || MASKS.none;
  return (
    <input
      {...rest}
      value={value ?? ''}
      onChange={(e) => onChange(apply(e.target.value))}
      className={`vd-input ${dim ? 'vd-input-dim' : ''} ${invalid ? 'vd-invalid' : ''} ${className}`}
    />
  );
}

export function Select({ value, onChange, children, dim, invalid, className = '', ...rest }) {
  return (
    <select
      {...rest}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={`vd-input vd-select ${dim ? 'vd-input-dim' : ''} ${invalid ? 'vd-invalid' : ''} ${className}`}
    >
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Карточка-вариант (радио или галочка)                                */
/* ------------------------------------------------------------------ */
export function OptionCard({ type = 'checkbox', name, checked, onChange, label, tone = 'blue', invalid }) {
  const active = checked;
  const activeBorder = tone === 'red' ? 'border-red-400 bg-red-50/60' : 'border-vd-blue bg-vd-blue-pale';
  return (
    <label
      className={`flex items-start gap-3 p-3 sm:p-3.5 border cursor-pointer transition-all duration-200 vd-sharp select-none
        ${active ? activeBorder : 'border-vd-line bg-white hover:border-vd-blue/50 hover:bg-vd-blue-pale/40'}
        ${invalid ? 'vd-invalid' : ''}`}
    >
      <input
        type={type}
        name={name}
        checked={!!checked}
        onChange={(e) => onChange(type === 'checkbox' ? e.target.checked : e.target.value)}
        value={type === 'radio' ? name : undefined}
        className={`vd-check mt-px ${type === 'radio' ? 'vd-check-radio' : ''}`}
      />
      <span className={`text-[13px] sm:text-sm leading-snug ${active ? 'text-vd-navy font-semibold' : 'text-vd-ink'}`}>
        {label}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Загрузка файла                                                      */
/* ------------------------------------------------------------------ */
export function FileInput({ file, onSelect, onClear, label, accept = 'image/*,.pdf', invalid, id, removeLabel = 'Убрать файл' }) {
  return (
    <div className={`border border-dashed p-3 transition-colors vd-sharp ${invalid ? 'vd-invalid' : file ? 'border-vd-blue bg-vd-blue-pale/50' : 'border-vd-line bg-white'}`}>
      {file ? (
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 shrink-0 bg-vd-blue/10 flex items-center justify-center vd-sharp">
            <Check className="w-4 h-4 text-vd-blue" />
          </span>
          <span className="flex-1 min-w-0 text-[12px] sm:text-[13px] text-vd-ink font-medium break-all leading-tight">
            {file.name}
          </span>
          <button
            type="button"
            onClick={onClear}
            aria-label={removeLabel}
            className="shrink-0 w-9 h-9 flex items-center justify-center text-vd-muted hover:text-red-600 hover:bg-red-50 transition-colors vd-sharp"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label htmlFor={id} className="flex items-center gap-3 cursor-pointer group">
          <span className="w-9 h-9 shrink-0 bg-vd-navy flex items-center justify-center vd-sharp transition-transform duration-200 group-hover:scale-105">
            <Upload className="w-4 h-4 text-white" />
          </span>
          <span className="text-[12px] sm:text-[13px] font-semibold text-vd-navy">{label}</span>
        </label>
      )}
      <input
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) onSelect(e.target.files[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/* Загрузка нескольких файлов */
export function MultiFileInput({ files = [], onAdd, onRemove, label, accept = 'image/*,.pdf,.doc,.docx', id, removeLabel = 'Убрать файл' }) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="inline-flex items-center gap-2.5 px-3.5 py-2.5 border border-vd-line bg-white cursor-pointer hover:border-vd-blue hover:bg-vd-blue-pale/40 transition-colors vd-sharp"
      >
        <Upload className="w-4 h-4 text-vd-blue" />
        <span className="text-[12px] sm:text-[13px] font-semibold text-vd-navy">{label}</span>
      </label>
      <input
        id={id}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onAdd(Array.from(e.target.files));
          e.target.value = '';
        }}
      />
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-white border border-vd-line-soft px-2.5 py-2 vd-sharp vd-anim-chip">
              <span className="flex-1 min-w-0 text-[11px] sm:text-[12px] text-vd-ink break-all leading-tight">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={removeLabel}
                className="shrink-0 w-8 h-8 flex items-center justify-center text-vd-muted hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Плашки-подсказки                                                    */
/* ------------------------------------------------------------------ */
export function Callout({ tone = 'info', children, className = '' }) {
  const tones = {
    info: 'bg-vd-blue-pale border-vd-blue/30 text-vd-navy',
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
    danger: 'bg-red-50 border-red-300 text-red-900',
  };
  const Icon = tone === 'info' ? Info : AlertTriangle;
  return (
    <div className={`flex items-start gap-2.5 border-l-[3px] px-3 py-2.5 vd-anim-expand ${tones[tone]} ${className}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-[12px] sm:text-[13px] font-medium leading-snug">{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Карточка-контейнер для вложенных блоков                             */
/* ------------------------------------------------------------------ */
export function Panel({ children, tone = 'default', className = '' }) {
  const tones = {
    default: 'bg-white border-vd-line',
    soft: 'bg-[#F8FAFD] border-vd-line-soft',
    accent: 'bg-vd-blue-pale border-vd-blue/25',
  };
  return <div className={`border p-3.5 sm:p-5 vd-sharp ${tones[tone]} ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Кнопки                                                              */
/* ------------------------------------------------------------------ */
export function Button({ variant = 'primary', children, className = '', ...rest }) {
  const base =
    'inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 vd-sharp disabled:cursor-not-allowed';
  const variants = {
    primary:
      'vd-sweep-btn bg-vd-navy text-white px-5 py-3.5 text-sm hover:shadow-lg disabled:bg-vd-line disabled:text-vd-muted disabled:shadow-none',
    secondary:
      'bg-white text-vd-navy border border-vd-line px-4 py-2.5 text-[13px] hover:border-vd-blue hover:text-vd-blue',
    ghost:
      'text-vd-blue px-3 py-2.5 text-[13px] hover:bg-vd-blue-pale',
    add:
      'w-full border border-dashed border-vd-blue/50 text-vd-blue bg-vd-blue-pale/40 px-4 py-3 text-[13px] hover:bg-vd-blue-pale hover:border-vd-blue',
  };
  return (
    <button {...rest} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Кнопка удаления строки в повторяющихся блоках                       */
/* ------------------------------------------------------------------ */
export function RemoveButton({ onClick, label = 'Удалить' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="shrink-0 w-9 h-9 flex items-center justify-center text-vd-muted hover:text-red-600 hover:bg-red-50 transition-colors vd-sharp"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Индикатор заполнения анкеты                                         */
/* ------------------------------------------------------------------ */
export function ProgressBar({ value, label }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-vd-line-soft overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-vd-blue to-vd-navy transition-[width] duration-500 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-[10px] sm:text-[11px] font-bold text-vd-muted tabular-nums shrink-0">
        {label ?? `${Math.round(value)}%`}
      </span>
    </div>
  );
}
