import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, AlertTriangle, Send, Globe, Info, FileText, CheckCircle2, Loader2, Lock, Link as LinkIcon, Users, Copy, ArrowLeft } from 'lucide-react';

const translations = {
  ru: {
    title: "Анкета обучения",
    subtitle: "Охрана труда и производственная безопасность",
    generalInfo: "Общая информация",
    
    chooseEmployee: "Выберите себя из списка",
    manualEntry: "Внести данные вручную",
    employerLabel: "Основное место работы *",
    employerVega: "Vega Development",
    employerPolar: "Polar Express",
    employerOther: "Другое",
    employerOtherPlaceholder: "Укажите название организации",
    citizenshipLabel: "Гражданство *",
    citizenshipRF: "РФ",
    citizenshipOther: "Другое",
    citizenshipOtherPlaceholder: "Укажите гражданство",

    fullName: "ФИО сотрудника *",
    fullNamePlaceholder: "Иванов Иван Иванович",
    snilsLabel: "СНИЛС *",
    snilsPlaceholder: "ХХХ-ХХХ-ХХХ ХХ",
    snilsComment: "Необходим для подачи заявок и внесения информации в реестр МинТруда.",
    birthDateLabel: "Дата рождения *",
    phoneLabel: "Контактный телефон *",
    phonePlaceholder: "+7 (ХХХ) ХХХ ХХ-ХХ",
    personalEmailLabel: "Личная почта *",
    personalEmailPlaceholder: "example@mail.ru",
    innLabel: "ИНН *",
    innPlaceholder: "ХХХХ-ХХХХ-ХХХХ",
    innComment: "Необходим для оформления обучения по Пром. безопасности или Электробезопасности.",

    promSafety: "1. Промышленная безопасность",
    electroSafety: "2. Электробезопасность (2 гр. и выше)",
    heightSafety: "3. Работы на высоте",
    confinedSafety: "4. Работы в замкнутом пространстве",
    drivingSafety: "5. Управление ТС компании",
    otherSafety: "6. Другие обучения",

    statusHave: "Имеется",
    statusNeed: "Не имеется, но нужна",
    statusDontNeed: "Не имеется, не нужна",
    statusUnknown: "Пока не знаю",

    unknownWarning: "Необходимо уточнить у руководителя и свериться с должностной инструкцией.",
    electroWarning: "Требуется для работников, выполняющих работы с электроинструментом.",

    addProtocols: "Добавленные протоколы",
    protocol: "Протокол",
    protocolNumber: "Номер протокола *",
    protocolDate: "Дата протокола *",
    protocolGroups: "Группы по ПБ (через запятую) *",
    protocolGroupsPlaceholder: "Например: А.1.1, Б.8.3",
    protocolFile: "Скан/фото (обязательно) *",
    chooseFile: "Выбрать файл",
    noFile: "Файл не выбран",
    addMoreProtocols: "Добавить еще протокол",

    education: "Образование *",
    selectEducation: "Выберите...",
    eduBasic: "основное общее образование",
    eduSecondary: "среднее общее образование",
    eduVocational: "среднее профессиональное и высшее (техническое)",
    eduHigher: "высшее (техническое) в области электроэнергетики",

    specifyGroup: "Указать гр. *",
    selectGroup: "Группа",
    dateOfCheck: "Дата последней проверки *",
    electroFile: "Скан/фото удостоверения (обязательно) *",

    heightClimb: "Буду подниматься на высоту",
    heightApprove: "Буду согласовывать НД, ППР, ОР, планы эвакуации, буду членом комиссии по проверке знаний и т.п.",
    heightWontDo: "Не буду выполнять работы, связанные с высотой",

    confinedWork: "Буду выполнять работы в замкнутом пространстве",
    confinedApprove: "Буду согласовывать НД, ППР, ОР, планы эвакуации, буду членом комиссии по проверке знаний и т.п.",
    confinedWontDo: "Не буду выполнять работы в замкнутом пространстве",

    driveWill: "Буду управлять транспортом. Обучение нужно",
    driveWont: "Управление транспортом не планируется",

    otherLabel: "Укажите информацию о других обучениях (ОТ, ПБ, экология, медицина и др.)",
    otherTrainingTitle: "Название обучения",
    otherTrainingPlaceholder: "Например: Оказание первой помощи...",
    otherFilesLabel: "Приложить файлы",
    chooseFiles: "Прикрепить",
    addMoreTrainings: "Добавить еще обучение",

    submitGenerating: "Отправка данных...",
    submitBtn: "Отправить анкету",

    photoTitle: "Фотография для удостоверения *",
    photoComment: "Требуется для оформления допусков на высоту или ОЗП. Прикрепите цветное фото (лицо крупным планом, как на паспорт).",
    consentText: "Я даю согласие на обработку моих персональных данных (ФЗ №152-ФЗ) и подтверждаю их передачу в учебный центр и реестры МинТруда / Ростехнадзора.",

    modalSuccessTitle: "СПАСИБО",
    modalSuccessSubtitle: "Ваши данные успешно отправлены.",
    modalSuccessBtn: "ЗАКРЫТЬ",

    mailNotSpecified: "Не указано",
    mailFileNameProtocol: "протокол_ПромБез",
    mailFileNameElectro: "удостоверение_ЭБ",
    mailFileNameOther: "обучение",

    passportTitle: "Паспортные данные (для оформления)",
    passportSN: "Серия и номер *",
    passportSNPlaceholder: "ХХ ХХ ХХХХХХ",
    passportIssuedBy: "Кем выдан *",
    passportIssuedByPlaceholder: "Наименование органа выдавшего паспорт",
    passportIssueDate: "Дата выдачи *",
    passportCode: "Код подразделения *",
    passportCodePlaceholder: "ХХХ-ХХХ",
    passportComment: "Данные требуются для оформления заявки и внесения в реестр Ростехнадзора.",
  },
  en: {
    title: "Training Questionnaire",
    subtitle: "Occupational Health and Safety",
    generalInfo: "General Information",

    chooseEmployee: "Select your name",
    manualEntry: "Enter data manually",
    employerLabel: "Main Employer *",
    employerVega: "Vega Development",
    employerPolar: "Polar Express",
    employerOther: "Other",
    employerOtherPlaceholder: "Specify employer",
    citizenshipLabel: "Citizenship *",
    citizenshipRF: "Russian Federation",
    citizenshipOther: "Other",
    citizenshipOtherPlaceholder: "Specify citizenship",

    fullName: "Full Name *",
    fullNamePlaceholder: "John Doe",
    snilsLabel: "SNILS *",
    snilsPlaceholder: "XXX-XXX-XXX XX",
    snilsComment: "Required for state registries.",
    birthDateLabel: "Date of Birth *",
    phoneLabel: "Phone *",
    phonePlaceholder: "+7 (XXX) XXX XX-XX",
    personalEmailLabel: "Personal Email *",
    personalEmailPlaceholder: "example@mail.com",
    innLabel: "INN *",
    innPlaceholder: "XXXX-XXXX-XXXX",
    innComment: "Required for Industrial or Electrical Safety.",

    promSafety: "1. Industrial Safety",
    electroSafety: "2. Electrical Safety",
    heightSafety: "3. Work at Height",
    confinedSafety: "4. Confined Space",
    drivingSafety: "5. Driving Company Vehicles",
    otherSafety: "6. Other Trainings",

    statusHave: "Available",
    statusNeed: "Required, not available",
    statusDontNeed: "Not required",
    statusUnknown: "I don't know",

    unknownWarning: "Please verify with your manager.",
    electroWarning: "Required for power tools usage.",

    addProtocols: "Protocols",
    protocol: "Protocol",
    protocolNumber: "Number *",
    protocolDate: "Date *",
    protocolGroups: "Groups (comma-separated) *",
    protocolGroupsPlaceholder: "E.g., A.1.1",
    protocolFile: "Scan (required) *",
    chooseFile: "Browse",
    noFile: "No file",
    addMoreProtocols: "Add another protocol",

    education: "Education *",
    selectEducation: "Select...",
    eduBasic: "Basic general",
    eduSecondary: "Secondary general",
    eduVocational: "Vocational/Higher",
    eduHigher: "Higher electrical",

    specifyGroup: "Group *",
    selectGroup: "Select",
    dateOfCheck: "Date of check *",
    electroFile: "Certificate Scan *",

    heightClimb: "Will perform work at height",
    heightApprove: "Will approve normative documents, work plans, evacuation plans, be a member of the commission, etc.",
    heightWontDo: "No work at height",

    confinedWork: "Will perform work in confined spaces",
    confinedApprove: "Will approve normative documents, work plans, evacuation plans, be a member of the commission, etc.",
    confinedWontDo: "No confined space work",

    driveWill: "Driving required",
    driveWont: "Driving not required",

    otherLabel: "Other trainings (optional):",
    otherTrainingTitle: "Training Name",
    otherTrainingPlaceholder: "E.g., First Aid...",
    otherFilesLabel: "Attach files",
    chooseFiles: "Attach",
    addMoreTrainings: "Add another training",

    submitGenerating: "Sending data...",
    submitBtn: "Submit form",

    photoTitle: "Photo for ID *",
    photoComment: "Required for Work at Height or Confined Space permits. Attach a color photo (passport style, close-up face).",

    consentText: "I consent to the processing of personal data (FZ-152) and its transfer to state registries.",

    modalSuccessTitle: "THANK YOU",
    modalSuccessSubtitle: "Your data has been successfully submitted.",
    modalSuccessBtn: "CLOSE",

    mailNotSpecified: "Not specified",
    mailFileNameProtocol: "protocol_IndSafety",
    mailFileNameElectro: "cert_ElecSafety",
    mailFileNameOther: "training",

    passportTitle: "Passport Details",
    passportSN: "Series & Number *",
    passportSNPlaceholder: "XX XX XXXXXX",
    passportIssuedBy: "Issued By *",
    passportIssuedByPlaceholder: "Authority",
    passportIssueDate: "Issue Date *",
    passportCode: "Code *",
    passportCodePlaceholder: "XXX-XXX",
    passportComment: "Required for state registries.",
  }
};

// --- ФУНКЦИЯ ПАРСИНГА HR ТЕКСТА ---
function parseHRText(text) {
  const blocks = text.split(/\n\s*\n/);
  const results = [];
  
  for (const block of blocks) {
    if (!block.trim()) continue;
    const lines = block.split('\n');
    let currentEmp = {};
    let currentKey = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const lower = trimmed.toLowerCase();
      if (lower.startsWith('name ')) { currentKey = 'nameEn'; currentEmp[currentKey] = trimmed.substring(5).trim(); }
      else if (lower.startsWith('surname ') || lower.startsWith('surnamr ')) { currentKey = 'surnameEn'; currentEmp[currentKey] = trimmed.substring(8).trim(); }
      else if (lower.startsWith('фио ')) { currentKey = 'fio'; currentEmp[currentKey] = trimmed.substring(4).trim(); }
      else if (lower.startsWith('должность ')) { currentKey = 'posRu'; currentEmp[currentKey] = trimmed.substring(10).trim(); }
      else if (lower.startsWith('position ')) { currentKey = 'posEn'; currentEmp[currentKey] = trimmed.substring(9).trim(); }
      else if (lower.startsWith('личная почта ')) { currentKey = 'email'; currentEmp[currentKey] = trimmed.substring(13).trim(); }
      else {
        if (currentKey && currentEmp[currentKey]) currentEmp[currentKey] += ' ' + trimmed;
      }
    }
    
    if (Object.keys(currentEmp).length > 0) {
       results.push({
         nameEn: currentEmp.nameEn || '',
         surnameEn: currentEmp.surnameEn || '',
         fio: currentEmp.fio || '',
         posRu: currentEmp.posRu || '',
         posEn: currentEmp.posEn || '',
         email: currentEmp.email || ''
       });
    }
  }
  return results;
}

// --- АДМИН ПАНЕЛЬ ---
function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  
  const [recipients, setRecipients] = useState([
    'Andrey.Ryzhov@vegadevelopment.com',
    'Viktoriya.Novikova@vegadevelopment.com'
  ]);
  
  const [employees, setEmployees] = useState([
    { nameEn: '', surnameEn: '', fio: '', posRu: '', posEn: '', email: '' }
  ]);
  
  const [status, setStatus] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const login = (e) => {
    e.preventDefault();
    if (password === '123') { setIsAuthed(true); setStatus(''); } 
    else { setStatus('Неверный пароль'); }
  };

  const addRecipient = () => setRecipients([...recipients, '']);
  const removeRecipient = (idx) => setRecipients(recipients.filter((_, i) => i !== idx));
  const updateRecipient = (idx, value) => {
    const newR = [...recipients];
    newR[idx] = value;
    setRecipients(newR);
  };

  const addEmployee = () => setEmployees([...employees, { nameEn: '', surnameEn: '', fio: '', posRu: '', posEn: '', email: '' }]);
  const removeEmployee = (idx) => setEmployees(employees.filter((_, i) => i !== idx));
  const updateEmployee = (idx, field, value) => {
    const newEmps = [...employees];
    newEmps[idx][field] = value;
    setEmployees(newEmps);
  };

  const generateEml = (link) => {
    const toEmails = [];
    employees.forEach(emp => {
      if (emp.email) toEmails.push(emp.email.trim());
      if (emp.nameEn && emp.surnameEn) {
        toEmails.push(`${emp.nameEn.trim()}.${emp.surnameEn.trim()}@vegadevelopment.com`.toLowerCase());
      }
    });
    
    const uniqueToEmails = [...new Set(toEmails)].join(', ');
    const subject = "Анкета: Оценка потребности в обучении по охране труда / HSE Questionaire";
    
    const htmlBody = `
      <div style="font-family: 'Aptos', Arial, sans-serif; font-size: 11pt; color: #000;">
        <p>Уважаемые коллеги, добрый день!</p>
        <p>Для обеспечения безопасных условий труда и соблюдения государственных и корпоративных стандартов нам необходимо актуализировать информацию о вашем текущем уровне подготовки в области охраны труда и промышленной безопасности.</p>
        <p><b>Пожалуйста, заполните анкету по ссылке ниже.</b> Это поможет нам своевременно запланировать необходимое обучение или подтвердить ваши действующие допуски.<br>
        👉 <a href="${link}">Ссылка на анкету</a></p>
        <p>Заполнение займет <b>не более 5 минут</b>.<br>
        <b>Прошу предоставить информацию до завтра.</b></p>
        <p>Если у вас возникнут вопросы по заполнению, пожалуйста, обращайтесь.</p>
        <br>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
        <br>
        <p>Dear colleagues, good afternoon!</p>
        <p>To ensure safe working conditions and comply with state and corporate standards, we need to update the information about your current level of training in Occupational Health and Industrial Safety.</p>
        <p><b>Please fill out the questionnaire using the link below.</b> This will help us to schedule the necessary training in a timely manner or confirm your valid work permits.<br>
        👉 <a href="${link}">Link to the questionnaire</a></p>
        <p>Filling it out will take <b>no more than 5 minutes</b>.<br>
        <b>I kindly ask you to provide the information by tomorrow.</b></p>
        <p>If you have any questions about filling it out, please contact me.</p>
      </div>
    `;

    const encodedSubject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const encodedBody = btoa(unescape(encodeURIComponent(htmlBody)));

    const emlContent = [
      `X-Unsent: 1`, // Флаг для открытия как "Черновик" в Outlook
      `To: ${uniqueToEmails}`,
      `Subject: ${encodedSubject}`,
      `Content-Type: text/html; charset="utf-8"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      encodedBody
    ].join('\r\n');

    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Анкета_Рассылка.eml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const createLinkAndEmail = async () => {
    setStatus('Генерация...');
    try {
      const validEmployees = employees.filter(e => e.fio || e.nameEn || e.surnameEn || e.email);
      const validRecipients = recipients.filter(r => r.trim() !== '').join(', ');
      
      const res = await fetch('/api/admin/create-link', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ password, recipients: validRecipients, employees: validEmployees })
      });
      const data = await res.json();
      
      if (data.error) {
        setStatus('Ошибка: ' + data.error);
      } else {
        const link = `${window.location.origin}/?id=${data.linkId}`;
        setGeneratedLink(link);
        generateEml(link); // Сразу после создания ссылки качаем письмо
        setStatus(`Успешно! Добавлено сотрудников: ${validEmployees.length}. Файл письма скачан.`);
      }
    } catch (e) {
      setStatus('Ошибка соединения с сервером');
    }
  };

  const copyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(generatedLink);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = generatedLink;
      document.body.appendChild(textArea);
      textArea.select();
      try { document.execCommand('copy'); } catch (err) { console.error('Ошибка копирования', err); }
      document.body.removeChild(textArea);
    }
    alert('Ссылка скопирована!');
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <form onSubmit={login} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm space-y-4">
          <div className="flex justify-center mb-4"><Lock className="w-12 h-12 text-blue-600" /></div>
          <h2 className="text-center text-xl font-bold text-gray-800">Newcomer Admin</h2>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль администратора" className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          {status && <p className="text-red-500 text-sm text-center font-medium">{status}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">Войти</button>
          <a href="/" className="block text-center text-sm text-gray-400 hover:text-blue-600 mt-2">К анкете</a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Users className="w-6 h-6 mr-2 text-blue-600"/> Генератор анкет</h2>
          <a href="/" className="flex items-center text-gray-500 hover:text-blue-600 text-sm font-medium"><ArrowLeft className="w-4 h-4 mr-1"/> Выход</a>
        </div>
        
        <div className="space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-4">Получатели Excel-отчетов</label>
            <div className="space-y-3">
              {recipients.map((rec, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input type="email" value={rec} onChange={e => updateRecipient(idx, e.target.value)} className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors" placeholder="email@example.com" />
                  {recipients.length > 1 && (
                    <button type="button" onClick={() => removeRecipient(idx)} className="text-gray-400 hover:text-red-500 p-2.5 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addRecipient} className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 mt-2">
                <Plus className="w-4 h-4 mr-1" /> Добавить получателя
              </button>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <label className="block text-sm font-bold text-gray-700 mb-4">Данные от HR (Сотрудники)</label>
            <div className="space-y-4">
              {employees.map((emp, idx) => (
                <div key={idx} className="p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-2xl relative">
                  {employees.length > 1 && (
                    <button type="button" onClick={() => removeEmployee(idx)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-white p-2 rounded-lg shadow-sm transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Сотрудник {idx + 1}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Name (Имя на англ.)</label>
                      <input type="text" value={emp.nameEn} onChange={e => updateEmployee(idx, 'nameEn', e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="Andrey" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Surname (Фамилия на англ.)</label>
                      <input type="text" value={emp.surnameEn} onChange={e => updateEmployee(idx, 'surnameEn', e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="Obrazhey" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">ФИО (по-русски)</label>
                      <input type="text" value={emp.fio} onChange={e => updateEmployee(idx, 'fio', e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="Ображей Андрей Михайлович" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Должность (по-русски)</label>
                      <input type="text" value={emp.posRu} onChange={e => updateEmployee(idx, 'posRu', e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="Супервайзер..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Position (Должность на англ.)</label>
                      <input type="text" value={emp.posEn} onChange={e => updateEmployee(idx, 'posEn', e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="Supervisor..." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Личная почта</label>
                      <input type="email" value={emp.email} onChange={e => updateEmployee(idx, 'email', e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="example@mail.ru" />
                    </div>
                  </div>
                </div>
              ))}
              
              <button type="button" onClick={addEmployee} className="flex items-center justify-center w-full py-3.5 bg-blue-100/50 text-blue-700 font-bold rounded-2xl hover:bg-blue-100 transition text-sm">
                <Plus className="w-4 h-4 mr-2" /> Добавить еще сотрудника
              </button>
            </div>
          </div>
          
          <div className="pt-2">
            <button type="button" onClick={createLinkAndEmail} className="flex items-center justify-center w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-md transition">
              <FileText className="w-5 h-5 mr-2" /> Сгенерировать ссылку и сформировать письмо
            </button>
          </div>

          {status && <p className={`text-center font-medium ${status.includes('Ошибка') ? 'text-red-500' : 'text-green-600'}`}>{status}</p>}

          {generatedLink && (
            <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl animate-in fade-in zoom-in space-y-4">
              <p className="text-sm text-indigo-800 font-bold">Ссылка готова. Письмо загружено.</p>
              
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input type="text" readOnly value={generatedLink} className="w-full sm:flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-3 outline-none text-indigo-900 font-medium" />
                <button onClick={copyLink} className="w-full sm:w-auto bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-sm transition flex justify-center" title="Скопировать">
                  <Copy className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- ОСНОВНОЕ ПРИЛОЖЕНИЕ ---
export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setCurrentPath(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (currentPath === '#/admin') {
    return <AdminPanel />;
  }

  return <SurveyForm />;
}

function SurveyForm() {
  const [lang, setLang] = useState('ru');
  const t = translations[lang];

  useEffect(() => {
    document.title = t.title;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = "data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 5 L60 40 L50 50 L40 40 Z' fill='%23005b9f'/%3E%3Cpath d='M95 50 L60 60 L50 50 L60 40 Z' fill='%230072c6'/%3E%3Cpath d='M50 95 L40 60 L50 50 L60 60 Z' fill='%23008ce3'/%3E%3Cpath d='M5 50 L40 40 L50 50 L40 60 Z' fill='%23005b9f'/%3E%3C/svg%3E";
  }, [t.title]);

  // Сессии
  const [linkId, setLinkId] = useState(null);
  const [sessionEmployees, setSessionEmployees] = useState([]);
  const [selectedEmpIndex, setSelectedEmpIndex] = useState('');

  // Новые поля
  const [employer, setEmployer] = useState('Vega Development');
  const [employerOther, setEmployerOther] = useState('');
  const [citizenship, setCitizenship] = useState('РФ');
  const [citizenshipOther, setCitizenshipOther] = useState('');

  // Общая информация
  const [employeeName, setEmployeeName] = useState('');
  const [snils, setSnils] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [inn, setInn] = useState('');

  // Скрытые поля для Excel
  const [nameEn, setNameEn] = useState('');
  const [surnameEn, setSurnameEn] = useState('');
  const [positionRu, setPositionRu] = useState('');
  const [positionEn, setPositionEn] = useState('');
  const [workEmail, setWorkEmail] = useState('');

  const [promStatus, setPromStatus] = useState('');
  const [promProtocols, setPromProtocols] = useState([{ id: Date.now(), number: '', date: '', groups: '', file: null }]);

  const [passportSeriesNumber, setPassportSeriesNumber] = useState('');
  const [passportIssuedBy, setPassportIssuedBy] = useState('');
  const [passportIssueDate, setPassportIssueDate] = useState('');
  const [passportDeptCode, setPassportDeptCode] = useState('');

  const [electroStatus, setElectroStatus] = useState('');
  const [electroGroup, setElectroGroup] = useState('');
  const [electroDate, setElectroDate] = useState('');
  const [electroFile, setElectroFile] = useState(null);
  const [electroEducation, setElectroEducation] = useState('');

  const [heightClimb, setHeightClimb] = useState(false);
  const [heightApprove, setHeightApprove] = useState(false);
  const [heightWontDo, setHeightWontDo] = useState(false);

  const [confinedWork, setConfinedWork] = useState(false);
  const [confinedApprove, setConfinedApprove] = useState(false);
  const [confinedWontDo, setConfinedWontDo] = useState(false);
  const [employeePhoto, setEmployeePhoto] = useState(null);

  const [driveWill, setDriveWill] = useState(false);
  const [driveWont, setDriveWont] = useState(false);

  const [otherTrainings, setOtherTrainings] = useState([{ id: Date.now(), title: '', files: [] }]);

  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalStep, setModalStep] = useState(0);

  // Загрузка сессии по URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setLinkId(id);
      fetch(`/api/session/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.employees && data.employees.length > 0) {
            setSessionEmployees(data.employees);
          }
        })
        .catch(err => console.error("Ошибка загрузки сессии", err));
    }
  }, []);

  const handleEmployeeSelect = (e) => {
    const idx = e.target.value;
    setSelectedEmpIndex(idx);
    if (idx === '-1') {
      setEmployeeName('');
      setPersonalEmail('');
      setNameEn(''); setSurnameEn(''); setPositionRu(''); setPositionEn(''); setWorkEmail('');
    } else {
      const emp = sessionEmployees[idx];
      setEmployeeName(emp.fio || '');
      setPersonalEmail(emp.email || '');
      setNameEn(emp.nameEn || '');
      setSurnameEn(emp.surnameEn || '');
      setPositionRu(emp.posRu || '');
      setPositionEn(emp.posEn || '');
      setWorkEmail(emp.workEmail || '');
    }
  };

  const requiresInn = ['have', 'need'].includes(promStatus) || ['have', 'need'].includes(electroStatus);
  const requiresPassportInProm = ['have', 'need'].includes(promStatus);
  const requiresPassportInElectro = ['have', 'need'].includes(electroStatus) && !requiresPassportInProm;
  const requiresPhoto = heightClimb || heightApprove || confinedWork || confinedApprove;

  const addProtocol = () => setPromProtocols([...promProtocols, { id: Date.now(), number: '', date: '', groups: '', file: null }]);
  const removeProtocol = (id) => { if (promProtocols.length > 1) setPromProtocols(promProtocols.filter(p => p.id !== id)); };
  const updateProtocol = (id, field, value) => setPromProtocols(promProtocols.map(p => p.id === id ? { ...p, [field]: value } : p));

  const addOtherTraining = () => setOtherTrainings([...otherTrainings, { id: Date.now(), title: '', files: [] }]);
  const removeOtherTraining = (id) => setOtherTrainings(otherTrainings.filter(t => t.id !== id));
  const updateOtherTrainingTitle = (id, title) => setOtherTrainings(otherTrainings.map(t => t.id === id ? { ...t, title } : t));
  const handleOtherTrainingFiles = (id, e) => {
    if (e.target.files) setOtherTrainings(otherTrainings.map(t => t.id === id ? { ...t, files: [...t.files, ...Array.from(e.target.files)] } : t));
  };
  const removeOtherTrainingFile = (id, fileIndex) => {
    setOtherTrainings(otherTrainings.map(t => t.id === id ? { ...t, files: t.files.filter((_, i) => i !== fileIndex) } : t));
  };

  const handleDateChange = (e, setter) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = val;
    if (val.length > 0) {
      formatted = val.substring(0, 2) + 
        (val.length > 2 ? '.' + val.substring(2, 4) : '') + 
        (val.length > 4 ? '.' + val.substring(4, 8) : '');
    }
    setter(formatted);
  };

  const handleProtocolDateChange = (id, e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = val;
    if (val.length > 0) {
      formatted = val.substring(0, 2) + 
        (val.length > 2 ? '.' + val.substring(2, 4) : '') + 
        (val.length > 4 ? '.' + val.substring(4, 8) : '');
    }
    updateProtocol(id, 'date', formatted);
  };

  const handleSnilsChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    let formatted = val;
    if (val.length > 0) {
      formatted = val.substring(0, 3) + (val.length > 3 ? '-' + val.substring(3, 6) : '') + (val.length > 6 ? '-' + val.substring(6, 9) : '') + (val.length > 9 ? ' ' + val.substring(9, 11) : '');
    }
    setSnils(formatted);
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 0 && (val[0] === '7' || val[0] === '8')) val = val.substring(1);
    let res = '+7';
    if (val.length > 0) res += ' (' + val.substring(0, 3);
    if (val.length >= 4) res += ') ' + val.substring(3, 6);
    if (val.length >= 7) res += ' ' + val.substring(6, 8);
    if (val.length >= 9) res += '-' + val.substring(8, 10);
    setPhone(res);
  };

  const handleInnChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    let formatted = val;
    if (val.length > 0) {
      formatted = val.substring(0, 4) + (val.length > 4 ? '-' + val.substring(4, 8) : '') + (val.length > 8 ? '-' + val.substring(8, 12) : '');
    }
    setInn(formatted);
  };

  const handlePassportSNChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    let formatted = val;
    if (val.length > 0) {
      formatted = val.substring(0, 2) + (val.length > 2 ? ' ' + val.substring(2, 4) : '') + (val.length > 4 ? ' ' + val.substring(4, 10) : '');
    }
    setPassportSeriesNumber(formatted);
  };

  const handleDeptCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    let formatted = val;
    if (val.length > 0) {
      formatted = val.substring(0, 3) + (val.length > 3 ? '-' + val.substring(3, 6) : '');
    }
    setPassportDeptCode(formatted);
  };

  const handleHeightWontDo = (e) => {
    const checked = e.target.checked;
    setHeightWontDo(checked);
    if (checked) { setHeightClimb(false); setHeightApprove(false); }
  };
  const handleHeightAction = (setter) => (e) => { setter(e.target.checked); if (e.target.checked) setHeightWontDo(false); };

  const handleConfinedWontDo = (e) => {
    const checked = e.target.checked;
    setConfinedWontDo(checked);
    if (checked) { setConfinedWork(false); setConfinedApprove(false); }
  };
  const handleConfinedAction = (setter) => (e) => { setter(e.target.checked); if (e.target.checked) setConfinedWontDo(false); };

  const handleDriveWill = (e) => { setDriveWill(e.target.checked); if (e.target.checked) setDriveWont(false); };
  const handleDriveWont = (e) => { setDriveWont(e.target.checked); if (e.target.checked) setDriveWill(false); };

  const getPromStatusText = () => ({ have: t.statusHave, need: t.statusNeed, dont_need: t.statusDontNeed, unknown: t.statusUnknown })[promStatus] || t.mailNotSpecified;
  const getElectroStatusText = () => ({ have: t.statusHave, need: t.statusNeed, dont_need: t.statusDontNeed, unknown: t.statusUnknown })[electroStatus] || t.mailNotSpecified;
  const getHeightStatusText = () => {
    if (heightWontDo) return t.heightWontDo;
    const parts = [];
    if (heightClimb) parts.push(t.heightClimb);
    if (heightApprove) parts.push(t.heightApprove);
    if (parts.length === 0) return t.mailNotSpecified;
    return parts.join(', ');
  };
  const getConfinedSpaceStatusText = () => {
    if (confinedWontDo) return t.confinedWontDo;
    const parts = [];
    if (confinedWork) parts.push(t.confinedWork);
    if (confinedApprove) parts.push(t.confinedApprove);
    if (parts.length === 0) return t.mailNotSpecified;
    return parts.join(', ');
  };
  const getDrivingStatusText = () => {
    if (driveWill) return t.driveWill;
    if (driveWont) return t.driveWont;
    return t.mailNotSpecified;
  };

  const renderPassportBlock = () => (
    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 sm:p-6 mt-4 sm:mt-6 space-y-4 sm:space-y-5 shadow-sm">
      <div className="flex items-start">
        <div className="bg-blue-100 p-2 rounded-lg mr-3 shrink-0"><FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" /></div>
        <div>
          <h3 className="font-bold text-blue-900 text-sm md:text-base">{t.passportTitle}</h3>
          <p className="text-[10px] sm:text-xs text-blue-600 mt-1">{t.passportComment}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div>
          <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">{t.passportSN}</label>
          <input type="text" inputMode="numeric" required value={passportSeriesNumber} onChange={handlePassportSNChange} maxLength="12" placeholder={t.passportSNPlaceholder} className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <div>
          <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">{t.passportIssueDate}</label>
          <input type="text" inputMode="numeric" placeholder="ДД.ММ.ГГГГ" maxLength="10" required value={passportIssueDate} onChange={e => handleDateChange(e, setPassportIssueDate)} className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">{t.passportIssuedBy}</label>
          <input type="text" required value={passportIssuedBy} onChange={e => setPassportIssuedBy(e.target.value)} placeholder={t.passportIssuedByPlaceholder} className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <div>
          <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">{t.passportCode}</label>
          <input type="text" inputMode="numeric" required value={passportDeptCode} onChange={handleDeptCodeChange} maxLength="7" placeholder={t.passportCodePlaceholder} className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasUnknownStatus = promStatus === 'unknown' || electroStatus === 'unknown';

    if (hasUnknownStatus) {
      const warnings = document.querySelectorAll('.unknown-warning-box');
      if (warnings.length > 0) {
        warnings[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        warnings[0].classList.add('ring-4', 'ring-red-200');
        setTimeout(() => warnings[0].classList.remove('ring-4', 'ring-red-200'), 2000);
      }
      return;
    }

    if (!e.target.checkValidity()) {
      const firstInvalid = e.target.querySelector(':invalid');
      if (firstInvalid) {
        const targetToHighlight = firstInvalid.type === 'file' ? firstInvalid.parentElement : firstInvalid;
        targetToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetToHighlight.classList.add('ring-4', 'ring-red-200');
        setTimeout(() => targetToHighlight.classList.remove('ring-4', 'ring-red-200'), 2500);
        e.target.reportValidity();
      }
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const safeText = (str) => str ? String(str) : '';
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return (year && month && day) ? `${day}.${month}.${year}` : dateString;
      };

      const finalEmployer = employer === 'Другое' ? employerOther : employer;
      const finalCitizenship = citizenship === 'Другое' ? citizenshipOther : citizenship;

      const userData = {
        linkId,
        employer: finalEmployer, citizenship: finalCitizenship,
        employeeName, snils, birthDate: formatDate(birthDate), phone, personalEmail, inn,
        passportSeriesNumber, passportIssuedBy, passportIssueDate: formatDate(passportIssueDate), passportDeptCode,
        
        nameEn, surnameEn, positionRu, positionEn, workEmail,

        promStatus: getPromStatusText(), promStatusRaw: promStatus,
        promDetails: promStatus === 'have' ? promProtocols.map(p => `№${p.number} от ${formatDate(p.date)} гр.${p.groups}`).join('; ') : '',
        
        electroStatus: getElectroStatusText(), electroStatusRaw: electroStatus,
        electroDetails: electroStatus === 'have' ? `${electroEducation}, гр.${electroGroup}, от ${formatDate(electroDate)}` : (electroStatus === 'need' ? electroEducation : ''),
        
        heightStatus: getHeightStatusText().replace(/<br\/>/g, ', '), heightClimb, heightApprove,
        confinedStatus: getConfinedSpaceStatusText().replace(/<br\/>/g, ', '), confinedWork, confinedApprove,
        driveStatus: getDrivingStatusText(), driveWill, driveWont,
        
        otherTrainingsDetails: otherTrainings.map(t => t.title).filter(Boolean).join('; ')
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(userData));

      // Генерация Word-анкеты (добавлено место работы, гражданство и раб почта)
      let bodyHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset="utf-8"><title>${safeText(t.title)}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.3; }
            .header-title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; color: #0f172a; }
            .header-subtitle { text-align: center; font-size: 10pt; color: #64748b; margin-top: 0; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            td { border: 1px solid #cbd5e1; padding: 4px 8px; vertical-align: top; }
            .section-header { background-color: #f1f5f9; font-weight: bold; font-size: 11pt; text-transform: uppercase; color: #0f172a; padding: 6px 8px; }
            .label { font-weight: bold; width: 35%; color: #334155; }
            .value { width: 65%; color: #0f172a; }
            .value-italic { font-style: italic; color: #475569; }
            .consent-block { margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            .consent-text { font-size: 9pt; font-style: italic; color: #64748b; text-align: justify; line-height: 1.2; }
            ul { margin: 0; padding-left: 15px; } li { margin-bottom: 2px; }
          </style>
        </head>
        <body>
          <div class="header-title">${safeText(t.title)}</div>
          <div class="header-subtitle">${safeText(t.subtitle)}</div>
          <table>
      `;

      const addSection = (title) => { bodyHtml += `<tr><td colspan="2" class="section-header">${title}</td></tr>`; };
      const addRow = (label, value, italicValue = false) => {
        const valClass = italicValue ? 'value value-italic' : 'value';
        bodyHtml += `<tr><td class="label">${label}</td><td class="${valClass}">${value}</td></tr>`;
      };

      addSection(safeText(t.generalInfo));
      addRow(safeText(t.employerLabel).replace(' *', ''), finalEmployer);
      addRow(safeText(t.fullName).replace(' *', ''), employeeName);
      if (workEmail) addRow("Рабочая почта", workEmail);
      addRow(safeText(t.citizenshipLabel).replace(' *', ''), finalCitizenship);
      addRow(safeText(t.snilsLabel).replace(' *', ''), snils);
      addRow(safeText(t.birthDateLabel).replace(' *', ''), formatDate(birthDate));
      addRow(safeText(t.phoneLabel).replace(' *', ''), phone);
      addRow(safeText(t.personalEmailLabel).replace(' *', ''), personalEmail);
      if (requiresInn && inn) addRow(safeText(t.innLabel).replace(' *', ''), inn);

      addSection(safeText(t.promSafety || "ПРОМЫШЛЕННАЯ БЕЗОПАСНОСТЬ"));
      addRow("Статус", getPromStatusText(), true);
      if (promStatus === 'have') {
        let protocolsHtml = '<ul>';
        promProtocols.forEach((p, idx) => { protocolsHtml += `<li><b>${t.protocol} ${idx + 1}:</b> №${p.number} от ${formatDate(p.date)}, группы: ${p.groups}</li>`; });
        protocolsHtml += '</ul>';
        addRow("Протоколы", protocolsHtml);
      }

      if (requiresPassportInProm || requiresPassportInElectro) {
        addSection(safeText(t.passportTitle).split(' (')[0]);
        addRow(safeText(t.passportSN).replace(' *', ''), passportSeriesNumber);
        addRow(safeText(t.passportIssuedBy).replace(' *', ''), passportIssuedBy);
        addRow(safeText(t.passportIssueDate).replace(' *', ''), formatDate(passportIssueDate));
        addRow(safeText(t.passportCode).replace(' *', ''), passportDeptCode);
      }

      addSection(safeText(t.electroSafety || "ЭЛЕКТРОБЕЗОПАСНОСТЬ"));
      addRow("Статус", getElectroStatusText(), true);
      if (electroStatus === 'have' || electroStatus === 'need') {
        if (electroEducation) { addRow("Образование", electroEducation); }
        if (electroStatus === 'have') {
          addRow("Группа", electroGroup);
          addRow("Дата проверки", formatDate(electroDate));
        }
      }

      addSection(safeText(t.heightSafety || "РАБОТЫ НА ВЫСОТЕ"));
      addRow("Статус", getHeightStatusText(), true);

      addSection(safeText(t.confinedSafety || "РАБОТЫ В ЗАМКНУТОМ ПРОСТРАНСТВЕ"));
      addRow("Статус", getConfinedSpaceStatusText(), true);

      addSection(safeText(t.drivingSafety || "УПРАВЛЕНИЕ ТРАНСПОРТНЫМ СРЕДСТВОМ"));
      addRow("Статус", getDrivingStatusText(), true);

      let hasOther = false;
      let otherHtml = '<ul>';
      otherTrainings.forEach((training) => {
        if (training.title.trim()) { hasOther = true; otherHtml += `<li>${training.title.trim()}</li>`; }
      });
      otherHtml += '</ul>';
      if (hasOther) {
        addSection(safeText(t.otherSafety || "ДРУГИЕ ОБУЧЕНИЯ"));
        addRow("Указанные обучения", otherHtml);
      }

      bodyHtml += `</table><div class="consent-block"><div class="consent-text">* ${safeText(t.consentText)}</div></div></body></html>`;

      const docBlob = new Blob([bodyHtml], { type: 'application/msword;charset=utf-8' });
      formData.append('files', docBlob, `Анкета_${employeeName.replace(/\s+/g, '_')}.doc`);

      if (promStatus === 'have') {
        promProtocols.forEach((p, i) => {
          if (p.file && p.file.name) {
            const ext = p.file.name.split('.').pop();
            formData.append('files', p.file, `${employeeName}_${t.mailFileNameProtocol || 'ПромБез'}_${i + 1}.${ext}`);
          }
        });
      }

      if (electroStatus === 'have' && electroFile && electroFile.name) {
        const ext = electroFile.name.split('.').pop();
        formData.append('files', electroFile, `${employeeName}_${t.mailFileNameElectro || 'ЭБ'}.${ext}`);
      }

      if (requiresPhoto && employeePhoto && employeePhoto.name) {
        const ext = employeePhoto.name.split('.').pop();
        formData.append('files', employeePhoto, `photo_${employeeName.replace(/\s+/g, '_')}.${ext}`);
      }

      otherTrainings.forEach((training) => {
        training.files.forEach((file, fIdx) => {
          if (file && file.name) {
            const ext = file.name.split('.').pop();
            const safeTitle = (training.title || t.mailFileNameOther || 'обучение').replace(/[/\\?%*:|"<>]/g, '-').trim();
            formData.append('files', file, `${employeeName}_${safeTitle}_${fIdx + 1}.${ext}`);
          }
        });
      });

      const response = await fetch('/api/submit', { method: 'POST', body: formData });

      if (!response.ok) throw new Error('Network response was not ok');
      await response.json();
      setModalStep(1);

    } catch (error) {
      console.error(error);
      alert('Ошибка при отправке данных. Проверьте подключение к интернету или обратитесь к администратору.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-8 md:py-12 px-3 sm:px-6 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-gray-100">

        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 sm:p-8 md:p-12 text-white relative">
          <div className="absolute top-6 right-6 flex items-center space-x-2 bg-white/10 backdrop-blur-md p-1 rounded-xl">
            <Globe className="w-4 h-4 text-blue-100 hidden sm:block ml-2" />
            <button type="button" onClick={() => setLang('ru')} className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-bold rounded-lg transition-all ${lang === 'ru' ? 'bg-white text-blue-800 shadow-sm' : 'text-blue-100 hover:bg-white/20'}`}>RU</button>
            <button type="button" onClick={() => setLang('en')} className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-bold rounded-lg transition-all ${lang === 'en' ? 'bg-white text-blue-800 shadow-sm' : 'text-blue-100 hover:bg-white/20'}`}>EN</button>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 pr-16 sm:pr-24 leading-tight">{t.title}</h1>
          <p className="text-blue-100 font-medium text-xs sm:text-sm md:text-base opacity-90">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-8 md:p-12 space-y-8 sm:space-y-12">

          {/* ВЫБОР СОТРУДНИКА (если есть сессия) */}
          {sessionEmployees.length > 0 && (
            <section className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-bold text-blue-900 mb-3">{t.chooseEmployee}</h2>
              <select value={selectedEmpIndex} onChange={handleEmployeeSelect} className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all">
                <option value="" disabled>-- {t.chooseEmployee} --</option>
                <option value="-1">{t.manualEntry}</option>
                {sessionEmployees.map((emp, idx) => (
                  <option key={idx} value={idx}>{emp.fio || emp.nameEn || `Employee ${idx + 1}`}</option>
                ))}
              </select>
            </section>
          )}

          {/* ПОКАЗЫВАЕМ ОСТАЛЬНУЮ АНКЕТУ ТОЛЬКО ЕСЛИ НЕТ СЕССИИ ИЛИ СДЕЛАН ВЫБОР */}
          {(!sessionEmployees.length || selectedEmpIndex !== '') && (
            <>
          {/* Общая информация */}
          <section className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 sm:pb-4 flex items-center">
              <span className="bg-blue-100 text-blue-700 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 text-xs sm:text-sm shrink-0">i</span>
              {t.generalInfo}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.employerLabel}</label>
                  <select required value={employer} onChange={e => setEmployer(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:bg-white focus:border-blue-400 transition-all">
                    <option value={t.employerVega}>{t.employerVega}</option>
                    <option value={t.employerPolar}>{t.employerPolar}</option>
                    <option value="Другое">{t.employerOther}</option>
                  </select>
                  {employer === 'Другое' && (
                    <input type="text" required value={employerOther} onChange={e => setEmployerOther(e.target.value)} placeholder={t.employerOtherPlaceholder} className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:bg-white focus:border-blue-400 transition-all" />
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.citizenshipLabel}</label>
                  <select required value={citizenship} onChange={e => setCitizenship(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:bg-white focus:border-blue-400 transition-all">
                    <option value={t.citizenshipRF}>{t.citizenshipRF}</option>
                    <option value="Другое">{t.citizenshipOther}</option>
                  </select>
                  {citizenship === 'Другое' && (
                    <input type="text" required value={citizenshipOther} onChange={e => setCitizenshipOther(e.target.value)} placeholder={t.citizenshipOtherPlaceholder} className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:bg-white focus:border-blue-400 transition-all" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.fullName}</label>
                <input type="text" required value={employeeName} onChange={e => setEmployeeName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all" placeholder={t.fullNamePlaceholder} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.birthDateLabel}</label>
                <input type="text" inputMode="numeric" placeholder="ДД.ММ.ГГГГ" maxLength="10" required value={birthDate} onChange={e => handleDateChange(e, setBirthDate)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.snilsLabel}</label>
                <input type="text" inputMode="numeric" required value={snils} onChange={handleSnilsChange} maxLength="14" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all" placeholder={t.snilsPlaceholder} />
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 ml-1">{t.snilsComment}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.phoneLabel}</label>
                <input type="text" inputMode="tel" required value={phone} onChange={handlePhoneChange} maxLength="18" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all" placeholder={t.phonePlaceholder} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.personalEmailLabel}</label>
                <input type="email" required value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all" placeholder={t.personalEmailPlaceholder} />
              </div>

              {requiresInn && (
                <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 sm:p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                  <label className="block text-xs sm:text-sm font-bold text-blue-900 mb-2 sm:mb-3">{t.innLabel}</label>
                  <input type="text" inputMode="numeric" required value={inn} onChange={handleInnChange} maxLength="14" className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all" placeholder={t.innPlaceholder} />
                  <div className="flex items-start mt-2 sm:mt-3 text-blue-700">
                    <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] sm:text-xs font-medium leading-relaxed">{t.innComment}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 1. Пром безопасность */}
          <section className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 sm:pb-4 flex items-center">
              <span className="bg-blue-100 text-blue-700 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 text-xs sm:text-sm shrink-0">1</span>
              {t.promSafety}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {['have', 'need', 'dont_need', 'unknown'].map((status) => (
                <label key={`prom-${status}`} className={`flex items-center space-x-3 p-3 sm:p-4 border rounded-xl cursor-pointer transition-all ${promStatus === status ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <input type="radio" name="prom" value={status} required checked={promStatus === status} onChange={e => setPromStatus(e.target.value)} className="w-4 h-4 shrink-0 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <span className="text-xs sm:text-sm font-medium text-gray-800">{status === 'have' ? t.statusHave : status === 'need' ? t.statusNeed : status === 'dont_need' ? t.statusDontNeed : t.statusUnknown}</span>
                </label>
              ))}
            </div>

            {promStatus === 'unknown' && (
              <div className="unknown-warning-box flex items-start bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-r-xl">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 text-red-600" />
                <p className="text-[10px] sm:text-sm font-medium text-red-800">{t.unknownWarning}</p>
              </div>
            )}

            {requiresPassportInProm && renderPassportBlock()}

            {promStatus === 'have' && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
                <h3 className="text-sm sm:text-base font-bold text-gray-900">{t.addProtocols}</h3>
                {promProtocols.map((protocol, index) => (
                  <div key={protocol.id} className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm relative">
                    {promProtocols.length > 1 && (
                      <button type="button" onClick={() => removeProtocol(protocol.id)} className="absolute top-2 sm:top-4 right-2 sm:right-4 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-1.5 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 mb-3 sm:mb-4 uppercase tracking-wider">{t.protocol} {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                      <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5 sm:mb-2">{t.protocolNumber}</label>
                        <input type="text" required value={protocol.number} onChange={e => updateProtocol(protocol.id, 'number', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5 sm:mb-2">{t.protocolDate}</label>
                        <input type="text" inputMode="numeric" placeholder="ДД.ММ.ГГГГ" maxLength="10" required value={protocol.date} onChange={e => handleProtocolDateChange(protocol.id, e)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all" />
                      </div>
                    </div>
                    <div className="mb-4 sm:mb-5">
                      <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5 sm:mb-2">{t.protocolGroups}</label>
                      <input type="text" required value={protocol.groups} onChange={e => updateProtocol(protocol.id, 'groups', e.target.value)} placeholder={t.protocolGroupsPlaceholder} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5 sm:mb-2">{t.protocolFile}</label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                        <label className="relative inline-flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition text-xs sm:text-sm font-medium text-gray-700 shadow-sm w-fit shrink-0">
                          <Upload className="w-4 h-4 mr-2 text-gray-500" /> <span>{t.chooseFile}</span>
                          <input type="file" required onChange={e => updateProtocol(protocol.id, 'file', e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" />
                        </label>
                        <span className="text-xs sm:text-sm text-gray-500 font-medium break-all leading-tight">{protocol.file ? protocol.file.name : t.noFile}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addProtocol} className="flex items-center justify-center w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 text-blue-700 bg-blue-100/50 hover:bg-blue-100 rounded-xl transition text-xs sm:text-sm font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> {t.addMoreProtocols}
                </button>
              </div>
            )}
          </section>

          {/* 2. Электробезопасность */}
          <section className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 sm:pb-4 flex items-center">
              <span className="bg-blue-100 text-blue-700 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 text-xs sm:text-sm shrink-0">2</span>
              {t.electroSafety}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {['have', 'need', 'dont_need', 'unknown'].map((status) => (
                <label key={`electro-${status}`} className={`flex items-center space-x-3 p-3 sm:p-4 border rounded-xl cursor-pointer transition-all ${electroStatus === status ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <input type="radio" name="electro" value={status} required checked={electroStatus === status} onChange={e => setElectroStatus(e.target.value)} className="w-4 h-4 shrink-0 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <span className="text-xs sm:text-sm font-medium text-gray-800">{status === 'have' ? t.statusHave : status === 'need' ? t.statusNeed : status === 'dont_need' ? t.statusDontNeed : t.statusUnknown}</span>
                </label>
              ))}
            </div>

            {electroStatus === 'unknown' && (
              <div className="unknown-warning-box flex items-start bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-r-xl">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 text-red-600" />
                <p className="text-[10px] sm:text-sm font-medium text-red-800">{t.unknownWarning}</p>
              </div>
            )}

            {electroStatus === 'need' && (
              <div className="flex items-start bg-amber-50 p-3 sm:p-4 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-[10px] sm:text-sm font-medium text-amber-800">{t.electroWarning}</p>
              </div>
            )}

            {requiresPassportInElectro && renderPassportBlock()}

            {(electroStatus === 'have' || electroStatus === 'need') && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.education}</label>
                  <select required value={electroEducation} onChange={e => setElectroEducation(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all">
                    <option value="" disabled>{t.selectEducation}</option>
                    <option value={translations.ru.eduBasic}>{t.eduBasic}</option>
                    <option value={translations.ru.eduSecondary}>{t.eduSecondary}</option>
                    <option value={translations.ru.eduVocational}>{t.eduVocational}</option>
                    <option value={translations.ru.eduHigher}>{t.eduHigher}</option>
                  </select>
                </div>
                {electroStatus === 'have' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.specifyGroup}</label>
                        <select required value={electroGroup} onChange={e => setElectroGroup(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all">
                          <option value="" disabled>{t.selectGroup}</option>
                          {['I', 'II', 'III', 'IV', 'V'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.dateOfCheck}</label>
                        <input type="text" inputMode="numeric" placeholder="ДД.ММ.ГГГГ" maxLength="10" required value={electroDate} onChange={e => handleDateChange(e, setElectroDate)} className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.electroFile}</label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                        <label className="relative inline-flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition text-xs sm:text-sm font-medium text-gray-700 shadow-sm w-fit shrink-0">
                          <Upload className="w-4 h-4 mr-2 text-gray-500" /> <span>{t.chooseFile}</span>
                          <input type="file" required onChange={e => setElectroFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" />
                        </label>
                        <span className="text-xs sm:text-sm text-gray-500 font-medium break-all leading-tight">{electroFile ? electroFile.name : t.noFile}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* 3. Работы на высоте */}
          <section className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 sm:pb-4 flex items-center">
              <span className="bg-blue-100 text-blue-700 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 text-xs sm:text-sm shrink-0">3</span>
              {t.heightSafety}
            </h2>
            <div className="flex flex-col space-y-2 sm:space-y-3 pt-1 sm:pt-2">
              <label className="flex items-start space-x-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition shadow-sm bg-white">
                <input type="checkbox" checked={heightClimb} onChange={handleHeightAction(setHeightClimb)} className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">{t.heightClimb}</span>
              </label>
              <label className="flex items-start space-x-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition shadow-sm bg-white">
                <input type="checkbox" checked={heightApprove} onChange={handleHeightAction(setHeightApprove)} className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">{t.heightApprove}</span>
              </label>
              <label className="flex items-start space-x-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-red-50 cursor-pointer transition shadow-sm bg-white">
                <input type="checkbox" checked={heightWontDo} onChange={handleHeightWontDo} className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-red-500 rounded focus:ring-red-500 border-gray-300" />
                <span className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">{t.heightWontDo}</span>
              </label>
            </div>
          </section>

          {/* 4. Замкнутые пространства */}
          <section className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 sm:pb-4 flex items-center">
              <span className="bg-blue-100 text-blue-700 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 text-xs sm:text-sm shrink-0">4</span>
              {t.confinedSafety}
            </h2>
            <div className="flex flex-col space-y-2 sm:space-y-3 pt-1 sm:pt-2">
              <label className="flex items-start space-x-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition shadow-sm bg-white">
                <input type="checkbox" checked={confinedWork} onChange={handleConfinedAction(setConfinedWork)} className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">{t.confinedWork}</span>
              </label>
              <label className="flex items-start space-x-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition shadow-sm bg-white">
                <input type="checkbox" checked={confinedApprove} onChange={handleConfinedAction(setConfinedApprove)} className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">{t.confinedApprove}</span>
              </label>
              <label className="flex items-start space-x-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-red-50 cursor-pointer transition shadow-sm bg-white">
                <input type="checkbox" checked={confinedWontDo} onChange={handleConfinedWontDo} className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-red-500 rounded focus:ring-red-500 border-gray-300" />
                <span className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">{t.confinedWontDo}</span>
              </label>
            </div>
          </section>

          {requiresPhoto && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 sm:p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="font-bold text-indigo-900 text-sm md:text-base mb-1">{t.photoTitle}</h3>
              <p className="text-[10px] sm:text-xs text-indigo-700 mb-4">{t.photoComment}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                <label className="relative inline-flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-indigo-300 rounded-xl cursor-pointer hover:bg-indigo-100 transition text-xs sm:text-sm font-medium text-indigo-800 shadow-sm w-fit shrink-0">
                  <Upload className="w-4 h-4 mr-2 text-indigo-600" /> <span>{t.chooseFile}</span>
                  <input type="file" required={requiresPhoto} onChange={e => setEmployeePhoto(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                </label>
                <span className="text-xs sm:text-sm text-indigo-600 font-medium break-all leading-tight">
                  {employeePhoto ? employeePhoto.name : t.noFile}
                </span>
              </div>
            </div>
          )}

          {/* 5. Управление ТС */}
          <section className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 sm:pb-4 flex items-center">
              <span className="bg-blue-100 text-blue-700 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 text-xs sm:text-sm shrink-0">5</span>
              {t.drivingSafety}
            </h2>
            <div className="flex flex-col space-y-2 sm:space-y-3 pt-1 sm:pt-2">
              <label className="flex items-start space-x-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition shadow-sm bg-white">
                <input type="checkbox" checked={driveWill} onChange={handleDriveWill} className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">{t.driveWill}</span>
              </label>
              <label className="flex items-start space-x-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-red-50 cursor-pointer transition shadow-sm bg-white">
                <input type="checkbox" checked={driveWont} onChange={handleDriveWont} className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-red-500 rounded focus:ring-red-500 border-gray-300" />
                <span className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">{t.driveWont}</span>
              </label>
            </div>
          </section>

          {/* 6. Другие обучения */}
          <section className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 sm:pb-4 flex items-center">
              <span className="bg-blue-100 text-blue-700 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 text-xs sm:text-sm shrink-0">6</span>
              {t.otherSafety}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-2">{t.otherLabel}</p>

            <div className="space-y-3 sm:space-y-4">
              {otherTrainings.map((training, index) => (
                <div key={training.id} className="p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-2xl relative space-y-4 sm:space-y-5">
                  {otherTrainings.length > 1 && (
                    <button type="button" onClick={() => removeOtherTraining(training.id)} className="absolute top-2 sm:top-4 right-2 sm:right-4 text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-1.5 rounded-lg transition shadow-sm">
                       <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className={otherTrainings.length > 1 ? "pr-8" : ""}>
                    <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.otherTrainingTitle}</label>
                    <input type="text" value={training.title} onChange={e => updateOtherTrainingTitle(training.id, e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 bg-white transition-all" placeholder={t.otherTrainingPlaceholder} />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2">{t.otherFilesLabel}</label>
                    <label className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition text-xs sm:text-sm font-medium text-gray-700 shadow-sm w-fit">
                      <Upload className="w-4 h-4 mr-2 text-gray-500" /> <span>{t.chooseFiles}</span>
                      <input type="file" multiple onChange={e => handleOtherTrainingFiles(training.id, e)} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                    </label>

                    {training.files.length > 0 && (
                      <div className="mt-2 sm:mt-3 space-y-2 w-full max-w-full">
                         {training.files.map((file, fIndex) => (
                            <div key={fIndex} className="flex justify-between items-start sm:items-center bg-white p-2 sm:p-3 border border-gray-200 rounded-xl shadow-sm gap-2">
                               <span className="text-[10px] sm:text-sm break-words line-clamp-2 pr-2 text-gray-600 font-medium flex-1 leading-tight">{file.name}</span>
                               <button type="button" onClick={() => removeOtherTrainingFile(training.id, fIndex)} className="text-gray-400 shrink-0 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                            </div>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addOtherTraining} className="flex items-center justify-center w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 text-blue-700 bg-blue-100/50 hover:bg-blue-100 rounded-xl transition font-semibold text-xs sm:text-sm">
                 <Plus className="w-4 h-4 mr-2" /> {t.addMoreTrainings}
              </button>
            </div>
          </section>

          {/* Отправка */}
          <div className="pt-6 sm:pt-8 border-t border-gray-200 flex flex-col space-y-4 sm:space-y-6">
            <label className="flex items-start space-x-3 sm:space-x-4 cursor-pointer p-4 sm:p-5 bg-blue-50/50 border border-blue-100 rounded-2xl transition hover:bg-blue-50">
              <input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-blue-600 rounded focus:ring-blue-500 cursor-pointer border-gray-300" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed">{t.consentText}</span>
            </label>
            <button type="submit" disabled={isSubmitting || !consent} className={`w-full flex items-center justify-center p-4 sm:p-5 font-bold transition-all text-sm sm:text-lg rounded-2xl shadow-md ${isSubmitting || !consent ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5'}`}>
              {isSubmitting ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin shrink-0" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 shrink-0" />}
              {isSubmitting ? t.submitGenerating : t.submitBtn}
            </button>
          </div>
          </>
          )}
        </form>

        {/* МОДАЛЬНОЕ ОКНО УСПЕХА */}
        {modalStep === 1 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white shadow-2xl max-w-sm w-full p-6 sm:p-8 text-center space-y-4 sm:space-y-6 animate-in fade-in zoom-in duration-300 rounded-3xl border border-gray-100 my-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 uppercase tracking-wide">{t.modalSuccessTitle}</h3>
                <p className="text-sm sm:text-base text-gray-600 font-medium mt-2">{t.modalSuccessSubtitle}</p>
              </div>
              <div className="space-y-3 pt-4">
                <button onClick={() => setModalStep(0)} className="w-full py-3 sm:py-4 bg-green-600 text-white text-sm sm:text-base font-bold rounded-2xl hover:bg-green-700 shadow-md transition-colors">
                  {t.modalSuccessBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
