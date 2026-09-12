// Страница с настоящей кнопкой «Копировать».
//
// Зачем отдельная страница: внутри письма кнопка работать не может — почтовые
// клиенты не исполняют скрипты. Поэтому письмо даёт ссылку сюда.
//
// Данные приезжают во фрагменте адреса (после #). Фрагмент не отправляется
// на сервер, не попадает в логи nginx и нигде не сохраняется.
//
// Страница внутренняя, как админка, — только по-русски.

import { useEffect, useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { VegaLogo } from './Logo.jsx';
import { Button, Panel } from './ui.jsx';

/** base64url из фрагмента -> строка UTF-8 */
function decodeFragment(hash) {
  const raw = String(hash || '').replace(/^#/, '');
  if (!raw) return null;
  try {
    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export default function CopyRow() {
  // Фрагмент читаем один раз: он не меняется, пока страница открыта
  const [payload] = useState(() => decodeFragment(window.location.hash));
  const [headers, setHeaders] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    document.title = payload?.title ? `Копирование — ${payload.title}` : 'Копирование строки';
  }, [payload]);

  // Заголовки берём с сервера, чтобы не держать второй список колонок
  useEffect(() => {
    fetch('/api/columns')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.headers)) setHeaders(data.headers);
      })
      .catch(() => {
        /* без заголовков покажем значения по номерам */
      });
  }, []);

  const values = payload?.tsv ? payload.tsv.split('\t') : [];

  const copy = async () => {
    setCopyFailed(false);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(payload.tsv);
      } else {
        // Запасной путь для незащищённого соединения
        const area = document.createElement('textarea');
        area.value = payload.tsv;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const done = document.execCommand('copy');
        document.body.removeChild(area);
        if (!done) throw new Error('execCommand не сработал');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyFailed(true);
    }
  };

  if (!payload || !payload.tsv) {
    return (
      <div className="min-h-screen bg-vd-bg">
        <header className="bg-white border-b border-vd-line">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-3">
            <VegaLogo className="h-9 sm:h-11 text-[13px] sm:text-[16px]" />
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-3 sm:px-8 py-10">
          <Panel tone="accent" className="text-center">
            <AlertTriangle className="w-10 h-10 text-vd-blue mx-auto mb-4" />
            <h1 className="text-vd-navy text-lg font-black uppercase tracking-wide mb-2">Нет данных для копирования</h1>
            <p className="text-[13px] text-vd-muted leading-relaxed">
              Похоже, ссылка скопирована не полностью — в ней должна быть часть после знака&nbsp;#.
              Откройте ссылку из письма целиком.
            </p>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vd-bg pb-16">
      <header className="sticky top-0 z-30 bg-white border-b border-vd-line shadow-[0_1px_3px_rgba(22,37,92,0.06)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-3">
          <VegaLogo className="h-9 sm:h-11 text-[13px] sm:text-[16px]" />
        </div>
      </header>

      <div className="bg-white border-b border-vd-line-soft">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
          <p className="text-vd-blue text-[10px] sm:text-[11px] vd-eyebrow mb-2.5">Строка для реестра</p>
          <h1 className="text-vd-navy text-[20px] sm:text-2xl font-black leading-tight">{payload.title || 'Без имени'}</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-8 py-6 space-y-5">
        <Button type="button" onClick={copy} className="w-full !py-4 !text-[15px]">
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Скопировано — вставляйте в таблицу' : 'Копировать строку'}
        </Button>

        <p className="text-[12px] text-vd-muted leading-relaxed">
          В буфер уйдут только значения — {values.length} ячеек через табуляцию, без заголовков.
          Пустые ячейки сохранены, поэтому колонки не съедут. Вставляйте в первую ячейку нужной строки.
        </p>

        {copyFailed && (
          <Panel tone="accent">
            <p className="text-[12px] text-vd-navy font-semibold mb-2">Браузер не дал скопировать автоматически</p>
            <p className="text-[12px] text-vd-muted mb-2">Выделите содержимое поля ниже и скопируйте вручную.</p>
            <textarea
              readOnly
              value={payload.tsv}
              onFocus={(e) => e.target.select()}
              className="w-full h-24 vd-input font-mono text-[11px]"
            />
          </Panel>
        )}

        {/* Что именно уйдёт в буфер — чтобы можно было проверить глазами */}
        <div>
          <h2 className="vd-marker text-[13px] font-bold text-vd-blue uppercase tracking-wide mb-3">
            Что будет скопировано
          </h2>
          <div className="border border-vd-line bg-white vd-sharp overflow-hidden">
            {values.map((value, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 px-3 py-2 text-[12px] ${
                  index % 2 ? 'bg-[#FAFBFD]' : 'bg-white'
                } ${index ? 'border-t border-vd-line-soft' : ''}`}
              >
                <span className="shrink-0 w-8 text-vd-muted tabular-nums">К{index + 1}</span>
                <span className="shrink-0 w-44 sm:w-56 text-vd-muted leading-snug">
                  {headers ? headers[index] || '' : ''}
                </span>
                <span className={`flex-1 min-w-0 break-words leading-snug ${value ? 'text-vd-navy font-semibold' : 'text-vd-line'}`}>
                  {value || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
