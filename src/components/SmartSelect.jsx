// Поле с умным поиском по справочнику.
//
// Как работает: человек нажимает на поле — открывается окно со строкой поиска
// и списком. Можно писать «б83», «Б 8.3» или «b8.3» — найдётся Б.8.3.
// Ищет и по коду, и по словам из наименования. Выбранное складывается в «плашки»,
// можно писать дальше и добавлять ещё. Руками вписать несуществующий код нельзя.
//
// На телефоне окно открывается снизу на весь экран, на компьютере — выпадающим списком.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Check, ChevronDown, Plus } from 'lucide-react';
import { searchItems } from '../lib/search.js';

export default function SmartSelect({
  items,
  value = [],
  onChange,
  multiple = true,
  placeholder = 'Нажми и начни печатать',
  searchPlaceholder = 'Например: б83 или котлы',
  emptyText = 'Ничего не нашлось. Проверь написание',
  chipsLabel,
  invalid = false,
  allowOther = false,
  otherLabel = 'Другое (вписать вручную)',
  otherCode = 'OTHER',
  id,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selected = Array.isArray(value) ? value : value ? [value] : [];

  const optionList = useMemo(() => {
    const base = allowOther ? [...items, { code: otherCode, title: otherLabel, group: '' }] : items;
    return base;
  }, [items, allowOther, otherCode, otherLabel]);

  const results = useMemo(() => searchItems(optionList, query), [optionList, query]);

  // Заголовки групп показываем только когда человек ещё ничего не искал
  const grouped = useMemo(() => {
    if (query.trim()) return [{ group: null, rows: results }];
    const map = new Map();
    results.forEach((item) => {
      const key = item.group || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()].map(([group, rows]) => ({ group, rows }));
  }, [results, query]);

  const byCode = useMemo(() => {
    const map = new Map();
    optionList.forEach((item) => map.set(item.code, item));
    return map;
  }, [optionList]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  // Закрытие: клик мимо поля и клавиша Esc
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) close();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const toggle = (code) => {
    if (!multiple) {
      onChange([code]);
      close();
      return;
    }
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
      setQuery('');
      inputRef.current?.focus();
    }
  };

  const remove = (code) => onChange(selected.filter((c) => c !== code));

  const chips = selected.map((code) => byCode.get(code) || { code, title: '' });

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Поле с выбранным */}
      <button
        type="button"
        id={id}
        onClick={() => (open ? close() : setOpen(true))}
        className={`vd-input flex items-start gap-2 text-left min-h-[48px] ${invalid ? 'vd-invalid' : ''} ${
          open ? 'border-vd-blue shadow-[0_0_0_3px_rgba(27,133,206,0.14)]' : ''
        }`}
      >
        <span className="flex-1 min-w-0 flex flex-wrap gap-1.5">
          {chips.length === 0 ? (
            <span className="text-[#9aa8bd] text-[15px] leading-6">{placeholder}</span>
          ) : (
            chips.map((item) => (
              <span
                key={item.code}
                className="vd-anim-chip inline-flex items-center gap-1.5 bg-vd-navy text-white text-[12px] font-bold pl-2 pr-1 py-1 vd-sharp"
              >
                {item.code}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Убрать ${item.code}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(item.code);
                  }}
                  className="w-5 h-5 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-vd-navy mt-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {chipsLabel && chips.length > 0 && (
        <p className="text-[10px] sm:text-[11px] text-vd-muted mt-1.5">
          {chipsLabel}: {chips.map((c) => c.code).join(', ')}
        </p>
      )}

      {open && (
        <>
          {/* Затемнение — только на телефоне */}
          <div className="fixed inset-0 bg-vd-navy-deep/50 z-40 sm:hidden vd-anim-fade-in" onClick={close} />

          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] flex flex-col bg-white border-t-2 border-vd-blue shadow-2xl vd-anim-sheet
                       sm:absolute sm:inset-x-0 sm:bottom-auto sm:top-[calc(100%+4px)] sm:z-40 sm:max-h-[22rem] sm:border sm:border-vd-blue sm:shadow-xl sm:vd-sharp"
          >
            {/* Строка поиска */}
            <div className="p-3 border-b border-vd-line-soft bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vd-muted pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="vd-input pl-9 pr-9"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        inputRef.current?.focus();
                      }}
                      aria-label="Очистить"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-vd-muted hover:text-vd-navy"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="sm:hidden shrink-0 px-3.5 py-3 bg-vd-navy text-white text-[13px] font-bold vd-sharp"
                >
                  Готово
                </button>
              </div>
              {multiple && (
                <p className="text-[10px] text-vd-muted mt-2 leading-snug">
                  Можно выбрать несколько. Написал — выбрал — пиши следующее.
                </p>
              )}
            </div>

            {/* Список */}
            <div className="overflow-y-auto vd-scroll overscroll-contain flex-1">
              {results.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-vd-muted">{emptyText}</p>}

              {grouped.map(({ group, rows }) => (
                <div key={group || 'all'}>
                  {group && (
                    <div className="sticky top-0 px-3.5 py-1.5 bg-[#F4F6FA] border-y border-vd-line-soft text-[10px] font-bold uppercase tracking-wider text-vd-muted">
                      {group}
                    </div>
                  )}
                  {rows.map((item) => {
                    const isSelected = selected.includes(item.code);
                    const isOther = allowOther && item.code === otherCode;
                    return (
                      <button
                        type="button"
                        key={item.code}
                        onClick={() => toggle(item.code)}
                        className={`w-full text-left flex items-start gap-3 px-3.5 py-3 border-b border-vd-line-soft transition-colors
                          ${isSelected ? 'bg-vd-blue-pale' : 'bg-white hover:bg-[#F7FAFD] active:bg-vd-blue-pale'}`}
                      >
                        <span
                          className={`w-5 h-5 shrink-0 mt-px flex items-center justify-center border transition-colors
                            ${isSelected ? 'bg-vd-navy border-vd-navy' : 'border-vd-line bg-white'}`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-white" />
                          ) : (
                            isOther && <Plus className="w-3.5 h-3.5 text-vd-blue" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          {!isOther && (
                            <span className="block text-[13px] font-bold text-vd-navy leading-tight">{item.code}</span>
                          )}
                          <span
                            className={`block text-[12px] leading-snug ${
                              isOther ? 'text-vd-blue font-bold' : 'text-vd-muted mt-0.5'
                            }`}
                          >
                            {item.title}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
