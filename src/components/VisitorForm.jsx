// Анкета визитёра: минимальный набор полей для оформления допуска на объекты.
//
// Открывается по своему адресу /visitor (в тестовой сборке /preview/visitor),
// с необязательным ?id=<hex> — он определяет, кому уйдёт письмо.
//
// Оболочка (шапка, заголовок, окно успеха) общая с анкетой работника,
// примитивы полей — из ui.jsx. Своего CSS у экрана нет.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Loader2, AlertTriangle } from 'lucide-react';

import { translations } from '../i18n.js';
import { DIRECTIONS, VISIT_MODES, directionLines, directionFullLabel, getVisitMode, visitModeLabel } from '../data/directions.js';
import { isValidDate, phoneDigits } from '../lib/format.js';
import { getLinkId } from '../lib/route.js';
import { FormHeader, FormTitle, SuccessModal } from './FormShell.jsx';
import { Section, Field, TextInput, OptionCard, Callout, Panel, Button } from './ui.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function VisitorForm({ lang, onLangChange }) {
  const common = translations[lang];
  const t = common.visitor;

  // Адрес разбираем один раз: внутри страницы переходов нет
  const [linkId] = useState(() => getLinkId());
  // Недействительной ссылку объявляем ТОЛЬКО по явному ответу сервера.
  // Сеть отвалилась или таймаут — форма остаётся заполняемой.
  const [linkDead, setLinkDead] = useState(false);

  const [fio, setFio] = useState('');
  const [position, setPosition] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [directions, setDirections] = useState([]);
  const [visitMode, setVisitMode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [sendError, setSendError] = useState('');
  const formRef = useRef(null);

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  useEffect(() => {
    if (!linkId) return;
    let alive = true;
    fetch(`/api/visitor/session/${linkId}`)
      .then((res) => {
        if (alive && res.status === 404) setLinkDead(true);
      })
      .catch(() => {
        /* нет связи — не запираем форму, человек дозаполнит и отправит */
      });
    return () => {
      alive = false;
    };
  }, [linkId]);

  /* ---------------------------------------------------------------- */
  /* Проверка заполнения                                              */
  /* ---------------------------------------------------------------- */
  const checks = useMemo(() => {
    const list = [];
    // Храним название сообщения, а не текст: при смене языка подписи
    // под полями должны переводиться вместе со всем остальным
    const need = (key, ok, messageKey = 'required') => list.push({ key, ok: !!ok, messageKey });

    // Не требуем «минимум два слова»: мононим или имя без отчества — не ошибка.
    // Двух букв достаточно: «Ли», «Ань» — настоящие фамилии
    need('fio', fio.trim().length >= 2);
    need('position', position.trim().length > 0);
    need('birthDate', isValidDate(birthDate), 'invalidFormat');
    need('directions', directions.length > 0, 'selectAtLeastOne');
    need('visitMode', !!visitMode, 'selectAtLeastOne');
    // Контакты необязательны: пустое поле считается заполненным,
    // иначе полоса заполнения никогда не дойдёт до ста процентов
    need('phone', !phone.trim() || phoneDigits(phone) >= 10, 'invalidFormat');
    need('email', !email.trim() || EMAIL_RE.test(email.trim()), 'invalidFormat');
    need('consent', consent, 'consentRequired');

    return list;
  }, [fio, position, birthDate, directions, visitMode, phone, email, consent]);

  const progress = useMemo(() => {
    if (!checks.length) return 0;
    return Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  }, [checks]);

  // В errors лежит название сообщения — текст берём из текущего языка
  const err = (key) => {
    const messageKey = errors[key];
    return messageKey ? common[messageKey] || common.required : undefined;
  };
  const clearErr = (key) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  const bind = (key, setter) => (value) => {
    clearErr(key);
    setter(value);
  };

  const scrollToField = (key) => {
    const node = formRef.current?.querySelector(`[data-field="${key}"]`);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleDirection = (code) => {
    clearErr('directions');
    setDirections((list) => (list.includes(code) ? list.filter((c) => c !== code) : [...list, code]));
  };

  /* ---------------------------------------------------------------- */
  /* Отправка                                                         */
  /* ---------------------------------------------------------------- */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const failed = checks.filter((c) => !c.ok);
    if (failed.length) {
      const map = {};
      failed.forEach((c) => {
        map[c.key] = c.messageKey;
      });
      setErrors(map);
      setShowErrorBanner(true);
      scrollToField(failed[0].key);
      return;
    }

    setErrors({});
    setShowErrorBanner(false);
    setSendError('');
    setIsSubmitting(true);

    try {
      const mode = getVisitMode(visitMode);
      const payload = {
        linkId,
        lang,
        formType: 'visitor',
        fullName: fio.trim(),
        position: position.trim(),
        birthDate,
        // Расшифровки отдаём готовыми: справочник живёт в одном месте,
        // а серверу остаётся только положить их в таблицу
        directions: directions
          .map((code) => DIRECTIONS.find((d) => d.code === code))
          .filter(Boolean)
          .map((d) => ({ code: d.code, ru: directionFullLabel(d) })),
        visitModeCode: visitMode,
        visitModeText: mode ? mode.ru : '',
        phone: phone.trim(),
        email: email.trim(),
      };

      // Тот же multipart, что у анкеты работника: на сервере подключён
      // express.json(), и обычный JSON сломал бы разбор поля data
      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));

      const response = await fetch('/api/visitor/submit', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('bad response');
      await response.json();
      setShowSuccess(true);
    } catch {
      setSendError(t.sendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Разметка                                                         */
  /* ---------------------------------------------------------------- */
  if (linkDead) {
    return (
      <div className="min-h-screen bg-vd-bg">
        <FormHeader lang={lang} onLangChange={onLangChange} />
        <div className="max-w-3xl mx-auto px-3 sm:px-8 py-10">
          <Panel tone="accent" className="text-center">
            <AlertTriangle className="w-10 h-10 text-vd-blue mx-auto mb-4" />
            <h1 className="text-vd-navy text-lg font-black uppercase tracking-wide mb-2">{t.linkInvalidTitle}</h1>
            <p className="text-[13px] text-vd-muted leading-relaxed">{t.linkInvalidText}</p>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vd-bg pb-24 sm:pb-8">
      <FormHeader
        lang={lang}
        onLangChange={onLangChange}
        progress={progress}
        progressLabel={`${common.progressLabel} ${progress}%`}
      />

      <FormTitle eyebrow={t.eyebrow} title={t.title} intro={t.intro} />

      <div className="max-w-3xl mx-auto px-3 sm:px-8 py-5 sm:py-8">
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-9 sm:space-y-12">
          {/* ============================ О Вас ============================ */}
          <Section number="01" title={t.personTitle}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.fio} required hint={t.fioHint} error={err('fio')} className="sm:col-span-2">
                <div data-field="fio">
                  <TextInput
                    value={fio}
                    onChange={bind('fio', setFio)}
                    placeholder={t.fioPlaceholder}
                    autoComplete="name"
                    invalid={!!err('fio')}
                  />
                </div>
              </Field>

              <Field label={t.position} required error={err('position')}>
                <div data-field="position">
                  <TextInput
                    value={position}
                    onChange={bind('position', setPosition)}
                    placeholder={t.positionPlaceholder}
                    autoComplete="organization-title"
                    invalid={!!err('position')}
                  />
                </div>
              </Field>

              <Field label={t.birthDate} required error={err('birthDate')}>
                <div data-field="birthDate">
                  <TextInput
                    mask="date"
                    inputMode="numeric"
                    value={birthDate}
                    onChange={bind('birthDate', setBirthDate)}
                    placeholder={common.datePlaceholder}
                    invalid={!!err('birthDate')}
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* ========================= Куда поедет ========================= */}
          <Section number="02" title={t.visitTitle}>
            {/* fieldset с legend — иначе в озвучке это просто набор безымянных галочек */}
            <fieldset data-field="directions">
              <legend className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 text-vd-navy">
                {t.directionsLabel}
                <span className="text-vd-blue ml-1">*</span>
              </legend>
              <p className="text-[10px] sm:text-[11px] text-vd-muted mb-2.5">{t.directionsHint}</p>

              <div className="space-y-2">
                {DIRECTIONS.map((direction) => {
                  const lines = directionLines(direction, lang);
                  return (
                    <OptionCard
                      key={direction.code}
                      checked={directions.includes(direction.code)}
                      onChange={() => toggleDirection(direction.code)}
                      invalid={!!err('directions')}
                      label={
                        <>
                          {/* Различающая часть первой строкой: два направления
                              из трёх — «строительство ВЛ», и по виду работ их не отличить */}
                          <span className="block">{lines.primary}</span>
                          <span className="block text-[11px] text-vd-muted mt-0.5 font-normal">{lines.secondary}</span>
                        </>
                      }
                    />
                  );
                })}
              </div>
              {err('directions') && <p className="text-[11px] text-red-600 mt-1.5 font-medium">{err('directions')}</p>}
            </fieldset>

            <fieldset data-field="visitMode">
              <legend className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 text-vd-navy">
                {t.visitModeLabel}
                <span className="text-vd-blue ml-1">*</span>
              </legend>
              <p className="text-[10px] sm:text-[11px] text-vd-muted mb-2.5">{t.visitModeHint}</p>

              <div className="space-y-2">
                {VISIT_MODES.map((mode) => (
                  <OptionCard
                    key={mode.code}
                    type="radio"
                    name="visitMode"
                    checked={visitMode === mode.code}
                    // OptionCard в режиме radio отдаёт в onChange имя группы,
                    // поэтому аргумент игнорируем и ставим код сами
                    onChange={() => {
                      clearErr('visitMode');
                      setVisitMode(mode.code);
                    }}
                    label={visitModeLabel(mode, lang)}
                    invalid={!!err('visitMode')}
                  />
                ))}
              </div>
              {err('visitMode') && <p className="text-[11px] text-red-600 mt-1.5 font-medium">{err('visitMode')}</p>}
            </fieldset>
          </Section>

          {/* ========================== Контакты ========================== */}
          <Section number="03" title={t.contactsTitle} subtitle={t.contactsHint}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.phone} dim optionalMark={common.optionalMark} hint={t.phoneHint} error={err('phone')}>
                <div data-field="phone">
                  <TextInput
                    mask="phoneAny"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={bind('phone', setPhone)}
                    placeholder="+7 999 123-45-67"
                    dim
                    invalid={!!err('phone')}
                  />
                </div>
              </Field>

              <Field label={t.email} dim optionalMark={common.optionalMark} error={err('email')}>
                <div data-field="email">
                  <TextInput
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="off"
                    value={email}
                    onChange={bind('email', setEmail)}
                    placeholder={t.emailPlaceholder}
                    dim
                    invalid={!!err('email')}
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* ========================== Отправка ========================== */}
          <div className="border-t border-vd-line pt-6 space-y-4">
            <div data-field="consent">
              <OptionCard
                checked={consent}
                onChange={(value) => {
                  clearErr('consent');
                  setConsent(value);
                }}
                label={t.consent}
                invalid={!!err('consent')}
              />
              {err('consent') && (
                <p className="text-[11px] text-red-600 mt-1.5 font-medium">{err('consent')}</p>
              )}
            </div>

            {showErrorBanner && Object.keys(errors).length > 0 && (
              <Callout tone="danger">{common.validationError}</Callout>
            )}
            {sendError && <Callout tone="danger">{sendError}</Callout>}

            <Button type="submit" disabled={isSubmitting} className="w-full !py-4 !text-[15px]">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? t.submitting : t.submit}
            </Button>
          </div>
        </form>
      </div>

      {showSuccess && (
        <SuccessModal
          title={t.successTitle}
          text={t.successText}
          buttonLabel={t.successBtn}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
}
