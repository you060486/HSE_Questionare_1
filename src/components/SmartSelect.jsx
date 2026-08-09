// Поле с умным поиском по справочнику.
//
// Как работает: человек нажимает на поле — открывается окно со строкой поиска
// и списком. Можно писать «б83», «Б 8.3» или «b8.3» — найдётся Б.8.3.
// Ищет и по коду, и по словам из наименования. Выбранное складывается в «плашки»,
// можно писать дальше и добавлять ещё. Руками вписать несуществующий код нельзя.
//
// Список раскрывается прямо под полем и не закрывает экран целиком.
// При открытии страница подкручивается так, чтобы одновременно были видны
// и строка поиска, и первые варианты. Высота списка подстраивается под
// свободное место с учётом выехавшей клавиатуры.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Check, ChevronDown, Plus } from 'lucide-react';
import { searchItems } from '../lib/search.js';

export default function SmartSelect({
  items,
  value = [],
  onChange,
  multiple = true,
  placeholder = '',
  searchPlaceholder = '',
  emptyText = 'Ничего не нашлось. Проверьте написание',
  multiHint = 'Можно выбрать несколько: написали — выбрали — пишите следующее',
  doneLabel = 'Готово',
  removeLabel = 'Убрать',
  selectedLabel = 'Выбрано',
  chipsLabel,
  invalid = false,
  allowOther = false,
  otherLabel = 'Другое (вписать вручную)',
  otherCode = 'OTHER',
  id,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [listMaxHeight, setListMaxHeight] = useState(260);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Сколько оставить сверху под липкой полосой прогресса, чтобы поле не уехало под неё
  const TOP_GAP = 84;

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

  // Подгоняем высоту списка под свободное место под полем.
  // visualViewport учитывает выехавшую клавиатуру — обычный innerHeight её не видит.
  useEffect(() => {
    if (!open) return;

    const measure = () => {
      const node = wrapperRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      const spaceBelow = viewportBottom - rect.bottom - 16;
      // Не даём списку ни схлопнуться, ни занять весь экран
      setListMaxHeight(Math.max(150, Math.min(320, spaceBelow)));
    };

    measure();
    // Ещё раз после того, как отработает плавная прокрутка и появится клавиатура
    const first = setTimeout(measure, 320);
    const second = setTimeout(measure, 700);

    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    window.addEventListener('resize', measure);

    return () => {
      clearTimeout(first);
      clearTimeout(second);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [open]);

  /** Открывает список и подкручивает страницу, чтобы поле оказалось вверху экрана */
  const openPanel = () => {
    setOpen(true);
    requestAnimationFrame(() => {
      const node = wrapperRef.current;
      if (!node) return;
      const shift = node.getBoundingClientRect().top - TOP_GAP;
      if (Math.abs(shift) > 8) {
        window.scrollBy({ top: shift, behavior: 'smooth' });
      }
    });
  };

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
    // Пока список открыт, поднимаем блок над соседними разделами и липкой полосой
    <div className={`relative ${open ? 'z-50' : ''}`} ref={wrapperRef}>
      {/* Поле с выбранным */}
      <button
        type="button"
        id={id}
        onClick={() => (open ? close() : openPanel())}
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
                  aria-label={`${removeLabel} ${item.code}`}
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
          {/* Список раскрывается под полем и не перекрывает экран целиком:
              страница остаётся прокручиваемой, поле ввода видно всегда */}
          <div className="absolute inset-x-0 top-[calc(100%+4px)] z-50 flex flex-col bg-white border border-vd-blue shadow-xl vd-sharp vd-anim-expand">
            {/* Шапка окна: сначала выбранное, потом строка поиска */}
            <div className="border-b border-vd-line-soft bg-white shrink-0">
              {/* Выбранное — вверху, чтобы было видно, что уже отмечено */}
              {chips.length > 0 && (
                <div className="px-3 pt-3 pb-2.5 bg-vd-blue-pale/60 border-b border-vd-line-soft">
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-vd-navy">
                      {selectedLabel}
                    </span>
                    <span className="text-[10px] font-bold text-vd-blue tabular-nums shrink-0">{chips.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto vd-scroll">
                    {chips.map((item) => (
                      <span
                        key={item.code}
                        className="vd-anim-chip inline-flex items-center gap-1 bg-vd-navy text-white text-[12px] font-bold pl-2.5 pr-1 py-1 vd-sharp"
                      >
                        {item.code}
                        <button
                          type="button"
                          aria-label={`${removeLabel} ${item.code}`}
                          onClick={() => remove(item.code)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-white/25 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3">
                <div className="flex items-center gap-2">
                  {/* Лупа и поле — соседи во flex-строке, а не наложены друг на друга:
                      так текст никогда не заезжает под значок */}
                  <div
                    className={`flex-1 min-w-0 flex items-center bg-white border transition-all vd-sharp ${
                      searchFocused ? 'border-vd-blue shadow-[0_0_0_3px_rgba(27,133,206,0.14)]' : 'border-vd-line'
                    }`}
                  >
                    <Search className="w-4 h-4 shrink-0 ml-3 mr-2 text-vd-muted" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      placeholder={searchPlaceholder}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="flex-1 min-w-0 bg-transparent border-0 outline-none py-3 pr-2 text-[16px] leading-tight text-vd-ink placeholder:text-[#9aa8bd]"
                    />
                    {query && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setQuery('');
                          inputRef.current?.focus();
                        }}
                        aria-label={removeLabel}
                        className="shrink-0 w-9 h-9 flex items-center justify-center text-vd-muted hover:text-vd-navy transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="shrink-0 px-4 py-3 bg-vd-navy text-white text-[13px] font-bold vd-sharp"
                  >
                    {doneLabel}
                  </button>
                </div>
                {multiple && <p className="text-[10px] text-vd-muted mt-2 leading-snug">{multiHint}</p>}
              </div>
            </div>

            {/* Список: высота подстроена под свободное место на экране */}
            <div className="overflow-y-auto vd-scroll overscroll-contain" style={{ maxHeight: `${listMaxHeight}px` }}>
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
