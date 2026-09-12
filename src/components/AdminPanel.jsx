// Админка: создание персональных ссылок на анкету и готового письма для Outlook.
// Логика та же, что и раньше, изменился только внешний вид.

import { useState } from 'react';
import { Plus, Trash2, Lock, Users, FileText, Copy, ArrowLeft, Check } from 'lucide-react';
import { VegaLogo } from './Logo.jsx';
import { Button, Panel, Field, TextInput } from './ui.jsx';
import { buildFormUrl } from '../lib/route.js';

const emptyEmployee = () => ({ nameEn: '', surnameEn: '', fio: '', posRu: '', posEn: '', email: '' });

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [status, setStatus] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const [recipients, setRecipients] = useState([
    'Andrey.Ryzhov@vegadevelopment.com',
    'Viktoriya.Novikova@vegadevelopment.com',
  ]);
  const [employees, setEmployees] = useState([emptyEmployee()]);
  // Какую ссылку генерируем: анкету работника или анкету визитёра
  const [mode, setMode] = useState('employee');
  const isVisitorMode = mode === 'visitor';

  const login = (event) => {
    event.preventDefault();
    if (password) {
      setIsAuthed(true);
      setStatus('');
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setGeneratedLink('');
    setStatus('');
    setCopied(false);
  };

  const updateRecipient = (index, value) =>
    setRecipients((list) => list.map((item, i) => (i === index ? value : item)));
  const updateEmployee = (index, field, value) =>
    setEmployees((list) => list.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const generateEml = (link) => {
    const toEmails = [];
    employees.forEach((emp) => {
      if (emp.email) toEmails.push(emp.email.trim());
      if (emp.nameEn && emp.surnameEn) {
        toEmails.push(`${emp.nameEn.trim()}.${emp.surnameEn.trim()}@vegadevelopment.com`.toLowerCase());
      }
    });

    const subject = 'Анкета: Оценка потребности в обучении по охране труда / HSE Questionnaire';
    const htmlBody = `
      <div style="font-family: 'Aptos', Arial, sans-serif; font-size: 11pt; color: #000;">
        <p>Уважаемые коллеги, добрый день!</p>
        <p>Для обеспечения безопасных условий труда и соблюдения государственных и корпоративных стандартов нам необходимо актуализировать информацию о вашем текущем уровне подготовки в области охраны труда и промышленной безопасности.</p>
        <p><b>Пожалуйста, заполните анкету по ссылке ниже.</b> Это поможет нам своевременно запланировать необходимое обучение или подтвердить ваши действующие допуски.<br>
        👉 <a href="${link}">Ссылка на анкету</a></p>
        <p>Заполнение займет <b>не более 5 минут</b>.<br><b>Прошу предоставить информацию до завтра.</b></p>
        <p>Если у вас возникнут вопросы по заполнению, пожалуйста, обращайтесь.</p>
        <br><hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;"><br>
        <p>Dear colleagues, good afternoon!</p>
        <p>To ensure safe working conditions and comply with state and corporate standards, we need to update the information about your current level of training in Occupational Health and Industrial Safety.</p>
        <p><b>Please fill out the questionnaire using the link below.</b> This will help us to schedule the necessary training in a timely manner or confirm your valid work permits.<br>
        👉 <a href="${link}">Link to the questionnaire</a></p>
        <p>Filling it out will take <b>no more than 5 minutes</b>.<br><b>I kindly ask you to provide the information by tomorrow.</b></p>
        <p>If you have any questions about filling it out, please contact me.</p>
      </div>`;

    const emlContent = [
      'X-Unsent: 1',
      `To: ${[...new Set(toEmails)].join(', ')}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'Content-Type: text/html; charset="utf-8"',
      'Content-Transfer-Encoding: base64',
      '',
      btoa(unescape(encodeURIComponent(htmlBody))),
    ].join('\r\n');

    const url = URL.createObjectURL(new Blob([emlContent], { type: 'message/rfc822' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Анкета_Рассылка.eml';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const createLink = async () => {
    setStatus('Генерация…');
    try {
      const validEmployees = isVisitorMode
        ? []
        : employees.filter((e) => e.fio || e.nameEn || e.surnameEn || e.email);

      const res = await fetch('/api/admin/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          kind: mode,
          recipients: recipients.filter((r) => r.trim()).join(', '),
          employees: validEmployees,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setStatus('Ошибка: ' + data.error);
        return;
      }

      // Адрес собирается от BASE_URL: в тестовой сборке ссылка должна
      // указывать на /preview/, а не уводить на прод
      const link = buildFormUrl(mode, data.linkId);
      setGeneratedLink(link);

      if (isVisitorMode) {
        // Письма-приглашения нет: кому его отправлять, система не знает.
        // Ссылку раздают вручную или печатают QR-кодом
        setStatus('Готово. Ссылку можно отправлять визитёрам или печатать QR-кодом.');
      } else {
        generateEml(link);
        setStatus(`Готово. Сотрудников в ссылке: ${validEmployees.length}. Файл письма скачан.`);
      }
    } catch {
      setStatus('Ошибка: нет связи с сервером');
    }
  };

  const copyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedLink);
      } else {
        const area = document.createElement('textarea');
        area.value = generatedLink;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus('Не удалось скопировать — выдели ссылку вручную');
    }
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(140deg, #0C1633 0%, #16255C 60%, #14548F 100%)' }}>
        <form onSubmit={login} className="bg-white w-full max-w-sm p-7 border-t-2 border-vd-blue vd-anim-sheet">
          <div className="flex justify-center mb-5">
            <span className="vd-diamond w-11 h-11">
              <Lock className="w-4 h-4 text-white" />
            </span>
          </div>
          <h2 className="text-center text-lg font-black text-vd-navy uppercase tracking-wide mb-5">Newcomer Admin</h2>
          <TextInput
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Пароль администратора"
            autoFocus
          />
          {status && <p className="text-red-600 text-[12px] text-center font-medium mt-3">{status}</p>}
          <Button type="submit" className="w-full mt-4">
            Войти
          </Button>
          <a href={import.meta.env.BASE_URL} className="block text-center text-[12px] text-vd-muted hover:text-vd-blue mt-4">
            К анкете
          </a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vd-bg py-5 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white border-t-2 border-vd-blue p-5 sm:p-7 space-y-7">
        <div className="flex items-center justify-between gap-4 border-b border-vd-line pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <VegaLogo className="h-8 text-[13px] hidden sm:flex" />
            <h2 className="text-base sm:text-lg font-black text-vd-navy uppercase tracking-wide flex items-center gap-2">
              <Users className="w-5 h-5 text-vd-blue shrink-0" />
              Генератор анкет
            </h2>
          </div>
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-1.5 text-vd-muted hover:text-vd-blue text-[12px] font-semibold shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Выход
          </a>
        </div>

        {/* Что генерируем */}
        <div>
          <h3 className="vd-marker text-[13px] font-bold text-vd-blue uppercase tracking-wide mb-3">
            Тип ссылки
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { key: 'employee', title: 'Анкета работника', hint: 'Полная: обучения, документы, сканы' },
              { key: 'visitor', title: 'Анкета визитёра', hint: 'Короткая: ФИО, объекты, контакты' },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => switchMode(option.key)}
                className={`text-left border p-3 transition-all vd-sharp ${
                  mode === option.key
                    ? 'border-vd-blue bg-vd-blue-pale'
                    : 'border-vd-line bg-white hover:border-vd-blue/50'
                }`}
              >
                <span className={`block text-[13px] ${mode === option.key ? 'font-bold text-vd-navy' : 'text-vd-ink'}`}>
                  {option.title}
                </span>
                <span className="block text-[11px] text-vd-muted mt-0.5">{option.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Получатели */}
        <div>
          <h3 className="vd-marker text-[13px] font-bold text-vd-blue uppercase tracking-wide mb-3">
            Кому приходят отчёты
          </h3>
          <div className="space-y-2">
            {recipients.map((rec, index) => (
              <div key={index} className="flex items-center gap-2">
                <TextInput type="email" value={rec} onChange={(v) => updateRecipient(index, v)} placeholder="email@example.com" />
                {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRecipients((list) => list.filter((_, i) => i !== index))}
                    className="shrink-0 w-10 h-10 flex items-center justify-center text-vd-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Убрать получателя"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="ghost" onClick={() => setRecipients((list) => [...list, ''])} className="!px-0">
              <Plus className="w-4 h-4" /> Добавить получателя
            </Button>
          </div>
        </div>

        {/* Сотрудники — только для анкеты работника */}
        {!isVisitorMode && (
        <div className="border-t border-vd-line pt-6">
          <h3 className="vd-marker text-[13px] font-bold text-vd-blue uppercase tracking-wide mb-3">
            Сотрудники от HR
          </h3>
          <div className="space-y-3">
            {employees.map((emp, index) => (
              <Panel key={index} tone="soft" className="vd-anim-chip">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-vd-muted">
                    Сотрудник {index + 1}
                  </span>
                  {employees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEmployees((list) => list.filter((_, i) => i !== index))}
                      className="w-9 h-9 flex items-center justify-center text-vd-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Убрать сотрудника"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Name (англ.)">
                    <TextInput value={emp.nameEn} onChange={(v) => updateEmployee(index, 'nameEn', v)} placeholder="Andrey" />
                  </Field>
                  <Field label="Surname (англ.)">
                    <TextInput value={emp.surnameEn} onChange={(v) => updateEmployee(index, 'surnameEn', v)} placeholder="Ryzhov" />
                  </Field>
                  <Field label="ФИО" className="sm:col-span-2">
                    <TextInput value={emp.fio} onChange={(v) => updateEmployee(index, 'fio', v)} placeholder="Рыжов Андрей Михайлович" />
                  </Field>
                  <Field label="Должность">
                    <TextInput value={emp.posRu} onChange={(v) => updateEmployee(index, 'posRu', v)} placeholder="Супервайзер" />
                  </Field>
                  <Field label="Position (англ.)">
                    <TextInput value={emp.posEn} onChange={(v) => updateEmployee(index, 'posEn', v)} placeholder="Supervisor" />
                  </Field>
                  <Field label="Личная почта" className="sm:col-span-2">
                    <TextInput type="email" value={emp.email} onChange={(v) => updateEmployee(index, 'email', v)} placeholder="example@mail.ru" />
                  </Field>
                </div>
              </Panel>
            ))}

            <Button type="button" variant="add" onClick={() => setEmployees((list) => [...list, emptyEmployee()])}>
              <Plus className="w-4 h-4" /> Добавить сотрудника
            </Button>
          </div>
        </div>
        )}

        <Button type="button" onClick={createLink} className="w-full">
          <FileText className="w-4 h-4" /> {isVisitorMode ? 'Создать ссылку для визитёров' : 'Создать ссылку и письмо'}
        </Button>

        {status && (
          <p className={`text-center text-[13px] font-semibold ${status.startsWith('Ошибка') ? 'text-red-600' : 'text-vd-blue'}`}>
            {status}
          </p>
        )}

        {generatedLink && (
          <Panel tone="accent" className="vd-anim-expand space-y-3">
            <p className="text-[12px] font-bold text-vd-navy uppercase tracking-wide">
              {isVisitorMode ? 'Ссылка для визитёров готова' : 'Ссылка готова'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <TextInput value={generatedLink} onChange={() => {}} readOnly />
              <Button type="button" variant="secondary" onClick={copyLink} className="shrink-0 justify-center">
                {copied ? <Check className="w-4 h-4 text-vd-blue" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Скопировано' : 'Копировать'}
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
