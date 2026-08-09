import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Loader2, CheckCircle2, Plus, Globe, Pencil } from 'lucide-react';

import { translations } from '../i18n.js';
import { COUNTRIES, DEFAULT_COUNTRY_ID, getCountry } from '../data/countries.js';
import { ATTESTATION_AREAS } from '../data/attestation.js';
import { TRAININGS, TRAINING_OTHER_CODE } from '../data/trainings.js';
import { LICENCE_CATEGORIES } from '../data/licence.js';
import { isValidDate } from '../lib/format.js';
import { buildSurveyDoc } from '../lib/docBuilder.js';
import { VegaLogo } from './Logo.jsx';
import SmartSelect from './SmartSelect.jsx';
import {
  Section,
  SubHeading,
  Field,
  TextInput,
  Select,
  OptionCard,
  FileInput,
  MultiFileInput,
  Callout,
  Panel,
  Button,
  RemoveButton,
  ProgressBar,
} from './ui.jsx';

const MAX_PROTOCOLS = 10;
const EMPLOYERS = ['Vega Development', 'Polar Express', 'Другое'];
const STATUSES = ['have', 'need', 'dont_need', 'unknown'];
const ELECTRO_GROUPS = ['I', 'II', 'III', 'IV', 'V'];

const newId = () => Math.random().toString(36).slice(2, 10);
const emptyProtocol = () => ({ id: newId(), number: '', date: '', areas: [], file: null });
const emptyTraining = () => ({ id: newId(), code: '', customTitle: '', issueDate: '', files: [] });

const LICENCE_ITEMS = LICENCE_CATEGORIES.map((c) => ({ code: c.code, title: c.title, group: '' }));

export default function SurveyForm({ lang, onLangChange }) {
  const t = translations[lang];

  /* ---------------------------------------------------------------- */
  /* Состояние                                                         */
  /* ---------------------------------------------------------------- */
  const [linkId] = useState(() => new URLSearchParams(window.location.search).get('id'));
  const [sessionEmployees, setSessionEmployees] = useState([]);
  const [selectedEmpIndex, setSelectedEmpIndex] = useState('');

  const [employer, setEmployer] = useState(EMPLOYERS[0]);
  const [employerOther, setEmployerOther] = useState('');
  const [countryId, setCountryId] = useState(DEFAULT_COUNTRY_ID);
  const [citizenshipOther, setCitizenshipOther] = useState('');

  const [employeeName, setEmployeeName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phones, setPhones] = useState([{ id: newId(), value: '' }]);
  const [personalEmail, setPersonalEmail] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  // Если обе почты подставились из ссылки, показываем их только на подтверждение
  const [emailsPrefilled, setEmailsPrefilled] = useState(false);
  const [emailsConfirmed, setEmailsConfirmed] = useState(false);
  const [emailsEditing, setEmailsEditing] = useState(false);

  // Идентификаторы: ключ зависит от гражданства (СНИЛС / ИИН / личный номер)
  const [personalIdValue, setPersonalIdValue] = useState('');
  const [taxIdValue, setTaxIdValue] = useState('');

  const [passportNumber, setPassportNumber] = useState('');
  const [passportIssuedBy, setPassportIssuedBy] = useState('');
  const [passportIssueDate, setPassportIssueDate] = useState('');
  const [passportDeptCode, setPassportDeptCode] = useState('');

  // Скрытые поля из ссылки — уходят в таблицу
  const [nameEn, setNameEn] = useState('');
  const [surnameEn, setSurnameEn] = useState('');
  const [positionRu, setPositionRu] = useState('');
  const [positionEn, setPositionEn] = useState('');

  const [promStatus, setPromStatus] = useState('');
  const [protocols, setProtocols] = useState([emptyProtocol()]);

  const [electroStatus, setElectroStatus] = useState('');
  const [electroEducation, setElectroEducation] = useState('');
  const [electroGroup, setElectroGroup] = useState('');
  const [electroDate, setElectroDate] = useState('');
  const [electroFile, setElectroFile] = useState(null);

  const [heightClimb, setHeightClimb] = useState(false);
  const [heightApprove, setHeightApprove] = useState(false);
  const [heightWontDo, setHeightWontDo] = useState(false);

  const [confinedWork, setConfinedWork] = useState(false);
  const [confinedApprove, setConfinedApprove] = useState(false);
  const [confinedWontDo, setConfinedWontDo] = useState(false);

  // На каждое удостоверение нужна своя фотография
  const [heightPhoto, setHeightPhoto] = useState(null);
  const [confinedPhoto, setConfinedPhoto] = useState(null);

  const [driveWill, setDriveWill] = useState(false);
  const [driveWont, setDriveWont] = useState(false);
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceDate, setLicenceDate] = useState('');
  const [licenceCategories, setLicenceCategories] = useState([]);
  const [licenceFile, setLicenceFile] = useState(null);

  const [trainings, setTrainings] = useState([]);

  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [sendError, setSendError] = useState('');

  const country = getCountry(countryId);
  const formRef = useRef(null);

  /* ---------------------------------------------------------------- */
  /* Загрузка сессии из ссылки                                         */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    document.title = t.title;
  }, [t.title]);

  useEffect(() => {
    if (!linkId) return;
    fetch(`/api/session/${linkId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.employees && data.employees.length > 0) setSessionEmployees(data.employees);
      })
      .catch(() => {});
  }, [linkId]);

  const handleEmployeeSelect = (index) => {
    setSelectedEmpIndex(index);
    setEmailsConfirmed(false);
    setEmailsEditing(false);

    if (index === '-1' || index === '') {
      setEmployeeName('');
      setPersonalEmail('');
      setWorkEmail('');
      setEmailsPrefilled(false);
      setNameEn('');
      setSurnameEn('');
      setPositionRu('');
      setPositionEn('');
      return;
    }

    const emp = sessionEmployees[index];
    if (!emp) return;
    setEmployeeName(emp.fio || '');
    setPersonalEmail(emp.email || '');
    setWorkEmail(emp.workEmail || '');
    // Режим подтверждения включаем, только если подставились обе почты
    setEmailsPrefilled(Boolean(emp.email && emp.workEmail));
    setNameEn(emp.nameEn || '');
    setSurnameEn(emp.surnameEn || '');
    setPositionRu(emp.posRu || '');
    setPositionEn(emp.posEn || '');
  };

  /* ---------------------------------------------------------------- */
  /* Производные условия                                               */
  /* ---------------------------------------------------------------- */
  const needsTraining = ['have', 'need'].includes(promStatus) || ['have', 'need'].includes(electroStatus);
  const needsPassport = needsTraining;
  const needsTaxId = needsTraining && !!country.taxId;
  const needsHeightPhoto = heightClimb || heightApprove;
  const needsConfinedPhoto = confinedWork || confinedApprove;
  const hasUnknown = promStatus === 'unknown' || electroStatus === 'unknown';
  // Почты показываем на подтверждение, пока человек не решил их править
  const emailsInConfirmMode = emailsPrefilled && !emailsEditing;

  // Гражданство сменилось — идентификаторы и документ больше не подходят
  const prevCountry = useRef(countryId);
  useEffect(() => {
    if (prevCountry.current !== countryId) {
      prevCountry.current = countryId;
      setPersonalIdValue('');
      setTaxIdValue('');
      setPassportNumber('');
      setPassportDeptCode('');
      setPhones((list) => list.map((p) => ({ ...p, value: '' })));
    }
  }, [countryId]);

  /* ---------------------------------------------------------------- */
  /* Работа со списками                                                */
  /* ---------------------------------------------------------------- */
  const updateProtocol = (id, patch) => setProtocols((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const addProtocol = () => setProtocols((list) => (list.length >= MAX_PROTOCOLS ? list : [...list, emptyProtocol()]));
  const removeProtocol = (id) => setProtocols((list) => (list.length > 1 ? list.filter((p) => p.id !== id) : list));

  const updateTraining = (id, patch) => setTrainings((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const addTraining = () => setTrainings((list) => [...list, emptyTraining()]);
  const removeTraining = (id) => setTrainings((list) => list.filter((x) => x.id !== id));

  const updatePhone = (id, value) => setPhones((list) => list.map((p) => (p.id === id ? { ...p, value } : p)));
  const addPhone = () => setPhones((list) => (list.length >= 4 ? list : [...list, { id: newId(), value: '' }]));
  const removePhone = (id) => setPhones((list) => (list.length > 1 ? list.filter((p) => p.id !== id) : list));

  const pickHeight = (setter) => (checked) => {
    setter(checked);
    if (checked) setHeightWontDo(false);
  };
  const pickHeightNone = (checked) => {
    setHeightWontDo(checked);
    if (checked) {
      setHeightClimb(false);
      setHeightApprove(false);
    }
  };
  const pickConfined = (setter) => (checked) => {
    setter(checked);
    if (checked) setConfinedWontDo(false);
  };
  const pickConfinedNone = (checked) => {
    setConfinedWontDo(checked);
    if (checked) {
      setConfinedWork(false);
      setConfinedApprove(false);
    }
  };
  const pickDriveWill = (checked) => {
    setDriveWill(checked);
    if (checked) setDriveWont(false);
  };
  const pickDriveWont = (checked) => {
    setDriveWont(checked);
    if (checked) setDriveWill(false);
  };

  /* ---------------------------------------------------------------- */
  /* Проверка заполнения                                               */
  /* ---------------------------------------------------------------- */
  const checks = useMemo(() => {
    const list = [];
    const need = (key, ok, message = t.required) => list.push({ key, ok: !!ok, message });
    const filled = (value) => String(value || '').trim().length > 0;

    need('employer', employer !== 'Другое' || filled(employerOther));
    if (country.isOther) need('citizenshipOther', filled(citizenshipOther));
    need('employeeName', filled(employeeName) && employeeName.trim().split(/\s+/).length >= 2);
    need('birthDate', isValidDate(birthDate), t.invalidFormat);
    need('phone_0', filled(phones[0]?.value) && phones[0].value.replace(/\D/g, '').length >= 10, t.invalidFormat);
    const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
    if (emailsInConfirmMode) {
      // Обе почты подставлены — достаточно подтвердить галочкой
      need('emailsConfirmed', emailsConfirmed, t.confirmRequired);
    } else {
      need('personalEmail', isEmail(personalEmail), t.invalidFormat);
      if (filled(workEmail)) need('workEmail', isEmail(workEmail), t.invalidFormat);
    }

    const pid = country.personalId;
    if (pid && pid.required) {
      need('personalId', pid.validate ? pid.validate(personalIdValue) : filled(personalIdValue), t.invalidFormat);
    }

    need('promStatus', !!promStatus, t.selectAtLeastOne);
    need('electroStatus', !!electroStatus, t.selectAtLeastOne);

    if (needsPassport) {
      need('passportNumber', country.passport.validate(passportNumber), t.invalidFormat);
      need('passportIssueDate', isValidDate(passportIssueDate), t.invalidFormat);
      if (country.issuedBy.show && country.issuedBy.required) need('passportIssuedBy', filled(passportIssuedBy));
      if (country.deptCode.show && country.deptCode.required) {
        need('passportDeptCode', country.deptCode.validate ? country.deptCode.validate(passportDeptCode) : filled(passportDeptCode), t.invalidFormat);
      }
    }

    if (needsTaxId) {
      need('taxId', country.taxId.validate ? country.taxId.validate(taxIdValue) : filled(taxIdValue), t.invalidFormat);
    }

    if (promStatus === 'have') {
      protocols.forEach((p) => {
        need(`protocol_${p.id}_number`, filled(p.number));
        need(`protocol_${p.id}_date`, isValidDate(p.date), t.invalidFormat);
        need(`protocol_${p.id}_areas`, p.areas.length > 0, t.selectAtLeastOne);
        need(`protocol_${p.id}_file`, !!p.file, t.fileRequired);
      });
    }

    if (electroStatus === 'have' || electroStatus === 'need') {
      need('electroEducation', filled(electroEducation), t.selectAtLeastOne);
    }
    if (electroStatus === 'have') {
      need('electroGroup', filled(electroGroup), t.selectAtLeastOne);
      need('electroDate', isValidDate(electroDate), t.invalidFormat);
      need('electroFile', !!electroFile, t.fileRequired);
    }

    need('height', heightClimb || heightApprove || heightWontDo, t.selectAtLeastOne);
    if (needsHeightPhoto) need('heightPhoto', !!heightPhoto, t.fileRequired);

    need('confined', confinedWork || confinedApprove || confinedWontDo, t.selectAtLeastOne);
    if (needsConfinedPhoto) need('confinedPhoto', !!confinedPhoto, t.fileRequired);

    need('drive', driveWill || driveWont, t.selectAtLeastOne);
    if (driveWill) {
      need('licenceNumber', filled(licenceNumber));
      need('licenceDate', isValidDate(licenceDate), t.invalidFormat);
      need('licenceCategories', licenceCategories.length > 0, t.selectAtLeastOne);
      need('licenceFile', !!licenceFile, t.fileRequired);
    }

    trainings.forEach((item) => {
      need(`training_${item.id}_code`, filled(item.code), t.selectAtLeastOne);
      if (item.code === TRAINING_OTHER_CODE) need(`training_${item.id}_custom`, filled(item.customTitle));
      need(`training_${item.id}_date`, isValidDate(item.issueDate), t.invalidFormat);
    });

    need('consent', consent, t.required);

    return list;
  }, [
    t, country, employer, employerOther, citizenshipOther, employeeName, birthDate, phones, personalEmail, workEmail,
    emailsInConfirmMode, emailsConfirmed,
    personalIdValue, taxIdValue, promStatus, electroStatus, needsPassport, needsTaxId, passportNumber, passportIssueDate,
    passportIssuedBy, passportDeptCode, protocols, electroEducation, electroGroup, electroDate, electroFile,
    heightClimb, heightApprove, heightWontDo, needsHeightPhoto, heightPhoto,
    confinedWork, confinedApprove, confinedWontDo, needsConfinedPhoto, confinedPhoto,
    driveWill, driveWont, licenceNumber, licenceDate, licenceCategories, licenceFile, trainings, consent,
  ]);

  const progress = useMemo(() => {
    if (checks.length === 0) return 0;
    const done = checks.filter((c) => c.ok).length;
    return Math.round((done / checks.length) * 100);
  }, [checks]);

  const scrollToField = (key) => {
    const node = formRef.current?.querySelector(`[data-field="${key}"]`);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  /* ---------------------------------------------------------------- */
  /* Отправка                                                          */
  /* ---------------------------------------------------------------- */
  const statusText = (value) =>
    ({ have: t.statusHave, need: t.statusNeed, dont_need: t.statusDontNeed, unknown: t.statusUnknown }[value] ||
    t.notSpecified);

  const heightStatusText = () => {
    if (heightWontDo) return t.heightWontDo;
    const parts = [];
    if (heightClimb) parts.push(t.heightClimb);
    if (heightApprove) parts.push(t.heightApprove);
    return parts.length ? parts.join('; ') : t.notSpecified;
  };

  const confinedStatusText = () => {
    if (confinedWontDo) return t.confinedWontDo;
    const parts = [];
    if (confinedWork) parts.push(t.confinedWork);
    if (confinedApprove) parts.push(t.confinedApprove);
    return parts.length ? parts.join('; ') : t.notSpecified;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (hasUnknown) {
      setShowErrorBanner(true);
      scrollToField(promStatus === 'unknown' ? 'promStatus' : 'electroStatus');
      return;
    }

    const failed = checks.filter((c) => !c.ok);
    if (failed.length > 0) {
      const map = {};
      failed.forEach((c) => {
        map[c.key] = c.message;
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
      const finalEmployer = employer === 'Другое' ? employerOther.trim() : employer;
      const finalCitizenship = country.isOther ? citizenshipOther.trim() : country.nameRu;
      const phoneList = phones.map((p) => p.value.trim()).filter(Boolean);

      const protocolList =
        promStatus === 'have'
          ? protocols.map((p) => ({
              number: p.number.trim(),
              date: p.date,
              areas: p.areas,
              areasText: p.areas.join(', '),
            }))
          : [];

      const trainingList = trainings
        .filter((item) => item.code)
        .map((item) => ({
          code: item.code,
          title:
            item.code === TRAINING_OTHER_CODE
              ? item.customTitle.trim()
              : TRAININGS.find((x) => x.code === item.code)?.title || item.code,
          issueDate: item.issueDate,
        }));

      const payload = {
        linkId,
        lang,
        employer: finalEmployer,
        citizenship: finalCitizenship,
        countryId: country.id,

        employeeName: employeeName.trim(),
        nameEn,
        surnameEn,
        positionRu,
        positionEn,
        birthDate,

        phones: phoneList,
        phone: phoneList[0] || '',
        personalEmail: personalEmail.trim(),
        workEmail: workEmail.trim(),

        personalIdKey: country.personalId?.key || '',
        personalIdLabel: country.personalId?.labelRu || '',
        personalIdValue: personalIdValue.trim(),
        snils: country.personalId?.key === 'snils' ? personalIdValue.trim() : '',
        inn: needsTaxId ? taxIdValue.trim() : '',

        passportNumberLabel: country.passport.labelRu,
        passport: needsPassport
          ? {
              number: passportNumber.trim(),
              issuedBy: passportIssuedBy.trim(),
              issueDate: passportIssueDate,
              deptCode: passportDeptCode.trim(),
            }
          : null,

        promStatusRaw: promStatus,
        promStatus: statusText(promStatus),
        protocols: protocolList,

        electroStatusRaw: electroStatus,
        electroStatus: statusText(electroStatus),
        electroEducation: ['have', 'need'].includes(electroStatus) ? electroEducation : '',
        electroGroup: electroStatus === 'have' ? electroGroup : '',
        electroDate: electroStatus === 'have' ? electroDate : '',

        heightClimb,
        heightApprove,
        heightWontDo,
        heightStatus: heightStatusText(),
        heightPhotoAttached: needsHeightPhoto && !!heightPhoto,

        confinedWork,
        confinedApprove,
        confinedWontDo,
        confinedStatus: confinedStatusText(),
        confinedPhotoAttached: needsConfinedPhoto && !!confinedPhoto,

        driveWill,
        driveWont,
        driveStatus: driveWill ? t.driveWill : t.driveWont,
        licence: driveWill
          ? { number: licenceNumber.trim(), date: licenceDate, categories: licenceCategories }
          : null,

        trainings: trainingList,
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));

      const safeName = employeeName.trim().replace(/\s+/g, '_');
      formData.append('files', buildSurveyDoc(payload, t), `Анкета_${safeName}.doc`);

      const attach = (file, name) => {
        if (!file || !file.name) return;
        const ext = file.name.split('.').pop();
        formData.append('files', file, `${name}.${ext}`);
      };

      if (promStatus === 'have') {
        protocols.forEach((p, index) => attach(p.file, `${safeName}_${t.mailFileNameProtocol}_${index + 1}`));
      }
      if (electroStatus === 'have') attach(electroFile, `${safeName}_${t.mailFileNameElectro}`);
      if (needsHeightPhoto) attach(heightPhoto, `${t.mailFileNamePhotoHeight}_${safeName}`);
      if (needsConfinedPhoto) attach(confinedPhoto, `${t.mailFileNamePhotoConfined}_${safeName}`);
      if (driveWill) attach(licenceFile, `${safeName}_${t.mailFileNameLicence}`);

      trainings.forEach((item) => {
        const title = (item.code === TRAINING_OTHER_CODE ? item.customTitle : item.code) || t.mailFileNameOther;
        const safeTitle = String(title).replace(/[/\\?%*:|"<>]/g, '-').trim().slice(0, 40);
        item.files.forEach((file, index) => attach(file, `${safeName}_${safeTitle}_${index + 1}`));
      });

      const response = await fetch('/api/submit', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('bad response');
      await response.json();
      setShowSuccess(true);
    } catch {
      setSendError(t.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Вспомогательное для разметки                                      */
  /* ---------------------------------------------------------------- */
  const err = (key) => errors[key];
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

  const formVisible = sessionEmployees.length === 0 || selectedEmpIndex !== '';

  const pid = country.personalId;

  /* ---------------------------------------------------------------- */
  /* Разметка                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-vd-bg pb-24 sm:pb-8">
      {/* Шапка */}
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(130deg, #0C1633 0%, #16255C 55%, #14548F 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -right-10 -top-10 w-48 h-48 border border-white/10" style={{ transform: 'rotate(45deg)' }} />
          <div className="absolute right-24 -bottom-16 w-32 h-32 border border-white/[0.07]" style={{ transform: 'rotate(45deg)' }} />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-8 pt-5 pb-7 sm:pt-7 sm:pb-9">
          <div className="flex items-start justify-between gap-4 mb-7 sm:mb-9">
            <VegaLogo lang={lang} variant="light" className="h-9 sm:h-11 text-[15px] sm:text-[19px]" />

            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm p-0.5 shrink-0 vd-sharp">
              <Globe className="w-3.5 h-3.5 text-white/50 ml-1.5 hidden sm:block" />
              {['ru', 'en'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onLangChange(code)}
                  className={`px-2.5 py-1.5 text-[11px] font-bold uppercase transition-all vd-sharp ${
                    lang === code ? 'bg-white text-vd-navy' : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[#6FBBEA] text-[10px] sm:text-[11px] vd-eyebrow mb-2.5">{t.subtitle}</p>
          <h1 className="text-white text-[22px] sm:text-3xl font-black leading-[1.15] mb-3">{t.title}</h1>
          <p className="text-white/60 text-[12px] sm:text-[13px] leading-relaxed max-w-xl">{t.intro}</p>
        </div>
      </header>

      {/* Индикатор заполнения */}
      {formVisible && (
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-vd-line">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-2.5">
            <ProgressBar value={progress} label={`${t.progressLabel} ${progress}%`} />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-3 sm:px-8 py-5 sm:py-8">
        {/* Выбор себя из списка */}
        {sessionEmployees.length > 0 && (
          <Panel tone="accent" className="mb-6 vd-anim-fade-up">
            <SubHeading className="mb-1">{t.chooseEmployee}</SubHeading>
            <p className="text-[11px] sm:text-xs text-vd-muted mb-3">{t.chooseEmployeeHint}</p>
            <Select value={selectedEmpIndex} onChange={handleEmployeeSelect}>
              <option value="" disabled>
                {t.choosePlaceholder}
              </option>
              {sessionEmployees.map((emp, index) => (
                <option key={index} value={String(index)}>
                  {emp.fio || `${emp.nameEn} ${emp.surnameEn}`.trim() || `#${index + 1}`}
                </option>
              ))}
              <option value="-1">{t.manualEntry}</option>
            </Select>
          </Panel>
        )}

        {formVisible && (
          <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-9 sm:space-y-12">
            {/* ============================== О Вас ============================= */}
            <Section number="01" title={t.generalInfo}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t.employerLabel} required error={err('employer')}>
                  <div data-field="employer">
                    <Select value={employer} onChange={bind('employer', setEmployer)} invalid={!!err('employer')}>
                      {EMPLOYERS.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </Select>
                    {employer === 'Другое' && (
                      <div className="mt-2 vd-anim-expand">
                        <TextInput
                          value={employerOther}
                          onChange={bind('employer', setEmployerOther)}
                          placeholder={t.employerOtherPlaceholder}
                          invalid={!!err('employer')}
                        />
                      </div>
                    )}
                  </div>
                </Field>

                <Field label={t.citizenshipLabel} required hint={t.citizenshipHint} error={err('citizenshipOther')}>
                  <div data-field="citizenshipOther">
                    <Select value={countryId} onChange={setCountryId}>
                      {COUNTRIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {lang === 'ru' ? c.nameRu : c.nameEn}
                        </option>
                      ))}
                    </Select>
                    {country.isOther && (
                      <div className="mt-2 vd-anim-expand">
                        <TextInput
                          value={citizenshipOther}
                          onChange={bind('citizenshipOther', setCitizenshipOther)}
                          placeholder={t.citizenshipOtherPlaceholder}
                          invalid={!!err('citizenshipOther')}
                        />
                      </div>
                    )}
                  </div>
                </Field>

                <Field label={t.fullName} required error={err('employeeName')} className="sm:col-span-2">
                  <div data-field="employeeName">
                    <TextInput
                      value={employeeName}
                      onChange={bind('employeeName', setEmployeeName)}
                      placeholder={t.fullNamePlaceholder}
                      autoComplete="name"
                      invalid={!!err('employeeName')}
                    />
                  </div>
                </Field>

                <Field label={t.birthDateLabel} required error={err('birthDate')}>
                  <div data-field="birthDate">
                    <TextInput
                      mask="date"
                      inputMode="numeric"
                      value={birthDate}
                      onChange={bind('birthDate', setBirthDate)}
                      placeholder={t.datePlaceholder}
                      invalid={!!err('birthDate')}
                    />
                  </div>
                </Field>

                {pid && (
                  <Field
                    label={lang === 'ru' ? pid.labelRu : pid.labelEn}
                    required={pid.required}
                    dim={!pid.required}
                    optionalMark={t.optionalMark}
                    hint={lang === 'ru' ? pid.hintRu : pid.hintEn}
                    error={err('personalId')}
                  >
                    <div data-field="personalId">
                      <TextInput
                        mask={pid.mask}
                        inputMode={pid.inputMode}
                        maxLength={pid.maxLength}
                        value={personalIdValue}
                        onChange={bind('personalId', setPersonalIdValue)}
                        placeholder={pid.placeholder}
                        dim={!pid.required}
                        invalid={!!err('personalId')}
                      />
                    </div>
                  </Field>
                )}
              </div>

              {/* ИНН — только когда потребуется обучение */}
              {needsTaxId && (
                <Panel tone="accent" className="vd-anim-expand">
                  <Field
                    label={lang === 'ru' ? country.taxId.labelRu : country.taxId.labelEn}
                    required
                    hint={lang === 'ru' ? country.taxId.hintRu : country.taxId.hintEn}
                    error={err('taxId')}
                  >
                    <div data-field="taxId">
                      <TextInput
                        mask={country.taxId.mask}
                        inputMode={country.taxId.inputMode}
                        maxLength={country.taxId.maxLength}
                        value={taxIdValue}
                        onChange={bind('taxId', setTaxIdValue)}
                        placeholder={country.taxId.placeholder}
                        invalid={!!err('taxId')}
                      />
                    </div>
                  </Field>
                </Panel>
              )}
            </Section>

            {/* =========================== Контакты =========================== */}
            <Section number="02" title={t.contactsTitle}>
              <Field label={t.phoneLabel} required hint={t.phoneHint} error={err('phone_0')}>
                <div className="space-y-2" data-field="phone_0">
                  {phones.map((phone, index) => (
                    <div key={phone.id} className="flex items-center gap-2 vd-anim-chip">
                      <TextInput
                        mask={country.phoneMask}
                        inputMode="tel"
                        autoComplete={index === 0 ? 'tel' : 'off'}
                        value={phone.value}
                        onChange={(value) => {
                          if (index === 0) clearErr('phone_0');
                          updatePhone(phone.id, value);
                        }}
                        placeholder={country.phoneMask === 'phoneRu' ? '+7 (___) ___ __-__' : '+998 __ ___ __ __'}
                        invalid={index === 0 && !!err('phone_0')}
                      />
                      {phones.length > 1 && <RemoveButton onClick={() => removePhone(phone.id)} label={t.remove} />}
                    </div>
                  ))}
                  {phones.length < 4 && (
                    <Button type="button" variant="ghost" onClick={addPhone} className="!px-0">
                      <Plus className="w-4 h-4" /> {t.phoneAdd}
                    </Button>
                  )}
                </div>
              </Field>

              {emailsInConfirmMode ? (
                /* Обе почты подставлены из данных отдела кадров — их достаточно подтвердить */
                <Panel tone="accent" className="vd-anim-expand space-y-3.5" data-field="emailsConfirmed">
                  <div>
                    <SubHeading className="mb-1">{t.emailsBlockTitle}</SubHeading>
                    <p className="text-[11px] sm:text-xs text-vd-muted">{t.emailsPrefilledHint}</p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: t.personalEmailLabel, value: personalEmail },
                      { label: t.workEmailLabel, value: workEmail },
                    ].map((row) => (
                      <div key={row.label} className="bg-white border border-vd-line px-3 py-2.5 vd-sharp">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-vd-muted mb-0.5">
                          {row.label}
                        </div>
                        <div className="text-[13px] sm:text-sm font-semibold text-vd-navy break-all leading-snug">
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div data-field="emailsConfirmed">
                    <OptionCard
                      checked={emailsConfirmed}
                      onChange={(value) => {
                        clearErr('emailsConfirmed');
                        setEmailsConfirmed(value);
                      }}
                      label={t.emailsConfirmLabel}
                      invalid={!!err('emailsConfirmed')}
                    />
                    {err('emailsConfirmed') && (
                      <p className="text-[11px] text-red-600 mt-1.5 font-medium">{err('emailsConfirmed')}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-0"
                    onClick={() => {
                      setEmailsEditing(true);
                      setEmailsConfirmed(false);
                      clearErr('emailsConfirmed');
                    }}
                  >
                    <Pencil className="w-4 h-4" /> {t.emailsEdit}
                  </Button>
                </Panel>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label={t.personalEmailLabel}
                    required
                    hint={emailsPrefilled ? t.personalEmailHint : undefined}
                    error={err('personalEmail')}
                  >
                    <div data-field="personalEmail">
                      <TextInput
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="off"
                        value={personalEmail}
                        onChange={bind('personalEmail', setPersonalEmail)}
                        placeholder={t.personalEmailPlaceholder}
                        invalid={!!err('personalEmail')}
                      />
                    </div>
                  </Field>

                  <Field label={t.workEmailLabel} hint={t.workEmailHint} error={err('workEmail')}>
                    <div data-field="workEmail">
                      <TextInput
                        type="email"
                        inputMode="email"
                        autoCapitalize="off"
                        value={workEmail}
                        onChange={bind('workEmail', setWorkEmail)}
                        placeholder="name.surname@vegadevelopment.com"
                        invalid={!!err('workEmail')}
                      />
                    </div>
                  </Field>
                </div>
              )}
            </Section>

            {/* =================== Промышленная безопасность =================== */}
            <Section number="03" title={t.promSafety} subtitle={t.promSubtitle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-field="promStatus">
                {STATUSES.map((status) => (
                  <OptionCard
                    key={`prom-${status}`}
                    type="radio"
                    name="prom"
                    checked={promStatus === status}
                    onChange={() => {
                      clearErr('promStatus');
                      setPromStatus(status);
                    }}
                    label={statusText(status)}
                    tone={status === 'unknown' ? 'red' : 'blue'}
                    invalid={!!err('promStatus')}
                  />
                ))}
              </div>

              {promStatus === 'unknown' && <Callout tone="danger">{t.unknownWarning}</Callout>}

              {promStatus === 'have' && (
                <div className="space-y-3 vd-anim-expand">
                  <div>
                    <SubHeading>{t.protocolsTitle}</SubHeading>
                    <p className="text-[11px] sm:text-xs text-vd-muted mt-1">{t.protocolsHint}</p>
                  </div>

                  {protocols.map((protocol, index) => (
                    <Panel key={protocol.id} tone="soft" className="vd-anim-chip">
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-vd-muted">
                          {t.protocol} {index + 1}
                        </span>
                        {protocols.length > 1 && (
                          <RemoveButton onClick={() => removeProtocol(protocol.id)} label={t.remove} />
                        )}
                      </div>

                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <Field label={t.protocolNumber} required error={err(`protocol_${protocol.id}_number`)}>
                            <div data-field={`protocol_${protocol.id}_number`}>
                              <TextInput
                                value={protocol.number}
                                onChange={(value) => {
                                  clearErr(`protocol_${protocol.id}_number`);
                                  updateProtocol(protocol.id, { number: value });
                                }}
                                placeholder={t.protocolNumberPlaceholder}
                                invalid={!!err(`protocol_${protocol.id}_number`)}
                              />
                            </div>
                          </Field>

                          <Field label={t.protocolDate} required error={err(`protocol_${protocol.id}_date`)}>
                            <div data-field={`protocol_${protocol.id}_date`}>
                              <TextInput
                                mask="date"
                                inputMode="numeric"
                                value={protocol.date}
                                onChange={(value) => {
                                  clearErr(`protocol_${protocol.id}_date`);
                                  updateProtocol(protocol.id, { date: value });
                                }}
                                placeholder={t.datePlaceholder}
                                invalid={!!err(`protocol_${protocol.id}_date`)}
                              />
                            </div>
                          </Field>
                        </div>

                        <Field
                          label={t.protocolAreas}
                          required
                          hint={t.protocolAreasHint}
                          error={err(`protocol_${protocol.id}_areas`)}
                        >
                          <div data-field={`protocol_${protocol.id}_areas`}>
                            <SmartSelect
                              items={ATTESTATION_AREAS}
                              value={protocol.areas}
                              onChange={(areas) => {
                                clearErr(`protocol_${protocol.id}_areas`);
                                updateProtocol(protocol.id, { areas });
                              }}
                              placeholder={t.protocolAreasPlaceholder}
                              searchPlaceholder={t.protocolAreasSearch}
                              multiHint={t.searchMultiHint}
                              emptyText={t.searchEmpty}
                              doneLabel={t.searchDone}
                              removeLabel={t.remove}
                              invalid={!!err(`protocol_${protocol.id}_areas`)}
                            />
                          </div>
                        </Field>

                        <Field label={t.protocolFile} required hint={t.fileHint} error={err(`protocol_${protocol.id}_file`)}>
                          <div data-field={`protocol_${protocol.id}_file`}>
                            <FileInput
                              id={`protocol-file-${protocol.id}`}
                              file={protocol.file}
                              onSelect={(file) => {
                                clearErr(`protocol_${protocol.id}_file`);
                                updateProtocol(protocol.id, { file });
                              }}
                              onClear={() => updateProtocol(protocol.id, { file: null })}
                              label={t.chooseFile}
                              removeLabel={t.remove}
                              invalid={!!err(`protocol_${protocol.id}_file`)}
                            />
                          </div>
                        </Field>
                      </div>
                    </Panel>
                  ))}

                  {protocols.length < MAX_PROTOCOLS ? (
                    <Button type="button" variant="add" onClick={addProtocol}>
                      <Plus className="w-4 h-4" /> {t.addMoreProtocols}
                    </Button>
                  ) : (
                    <Callout tone="info">{t.protocolLimit}</Callout>
                  )}
                </div>
              )}
            </Section>

            {/* ====================== Электробезопасность ====================== */}
            <Section number="04" title={t.electroSafety} subtitle={t.electroSubtitle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-field="electroStatus">
                {STATUSES.map((status) => (
                  <OptionCard
                    key={`electro-${status}`}
                    type="radio"
                    name="electro"
                    checked={electroStatus === status}
                    onChange={() => {
                      clearErr('electroStatus');
                      setElectroStatus(status);
                    }}
                    label={statusText(status)}
                    tone={status === 'unknown' ? 'red' : 'blue'}
                    invalid={!!err('electroStatus')}
                  />
                ))}
              </div>

              {electroStatus === 'unknown' && <Callout tone="danger">{t.unknownWarning}</Callout>}
              {electroStatus === 'need' && <Callout tone="warning">{t.electroWarning}</Callout>}

              {(electroStatus === 'have' || electroStatus === 'need') && (
                <Panel tone="soft" className="vd-anim-expand space-y-3.5">
                  <Field label={t.education} required error={err('electroEducation')}>
                    <div data-field="electroEducation">
                      <Select
                        value={electroEducation}
                        onChange={bind('electroEducation', setElectroEducation)}
                        invalid={!!err('electroEducation')}
                      >
                        <option value="" disabled>
                          {t.selectEducation}
                        </option>
                        {['eduBasic', 'eduSecondary', 'eduVocational', 'eduHigher'].map((key) => (
                          <option key={key} value={translations.ru[key]}>
                            {t[key]}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </Field>

                  {electroStatus === 'have' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <Field label={t.specifyGroup} required error={err('electroGroup')}>
                          <div data-field="electroGroup">
                            <Select
                              value={electroGroup}
                              onChange={bind('electroGroup', setElectroGroup)}
                              invalid={!!err('electroGroup')}
                            >
                              <option value="" disabled>
                                {t.selectGroup}
                              </option>
                              {ELECTRO_GROUPS.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </Field>

                        <Field label={t.dateOfCheck} required error={err('electroDate')}>
                          <div data-field="electroDate">
                            <TextInput
                              mask="date"
                              inputMode="numeric"
                              value={electroDate}
                              onChange={bind('electroDate', setElectroDate)}
                              placeholder={t.datePlaceholder}
                              invalid={!!err('electroDate')}
                            />
                          </div>
                        </Field>
                      </div>

                      <Field label={t.electroFile} required hint={t.fileHint} error={err('electroFile')}>
                        <div data-field="electroFile">
                          <FileInput
                            id="electro-file"
                            file={electroFile}
                            onSelect={(file) => {
                              clearErr('electroFile');
                              setElectroFile(file);
                            }}
                            onClear={() => setElectroFile(null)}
                            label={t.chooseFile}
                            removeLabel={t.remove}
                            invalid={!!err('electroFile')}
                          />
                        </div>
                      </Field>
                    </>
                  )}
                </Panel>
              )}
            </Section>

            {/* ========================= Документ ========================= */}
            {needsPassport && (
              <Section number="05" title={t.passportTitle} subtitle={t.passportComment}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label={lang === 'ru' ? country.passport.labelRu : country.passport.labelEn}
                    required
                    hint={lang === 'ru' ? country.passport.hintRu : country.passport.hintEn}
                    error={err('passportNumber')}
                  >
                    <div data-field="passportNumber">
                      <TextInput
                        mask={country.passport.mask}
                        inputMode={country.passport.inputMode}
                        maxLength={country.passport.maxLength}
                        value={passportNumber}
                        onChange={bind('passportNumber', setPassportNumber)}
                        placeholder={country.passport.placeholder}
                        invalid={!!err('passportNumber')}
                      />
                    </div>
                  </Field>

                  <Field label={t.passportIssueDate} required error={err('passportIssueDate')}>
                    <div data-field="passportIssueDate">
                      <TextInput
                        mask="date"
                        inputMode="numeric"
                        value={passportIssueDate}
                        onChange={bind('passportIssueDate', setPassportIssueDate)}
                        placeholder={t.datePlaceholder}
                        invalid={!!err('passportIssueDate')}
                      />
                    </div>
                  </Field>
                </div>

                {/* Необязательные для иностранных документов поля — приглушены */}
                {(country.issuedBy.show || country.deptCode.show) && (
                  <div
                    className={
                      country.issuedBy.required || country.deptCode.required
                        ? ''
                        : 'border border-dashed border-vd-line-soft bg-[#FBFCFE] p-3.5 sm:p-4 vd-sharp'
                    }
                  >
                    {!country.issuedBy.required && !country.deptCode.required && (
                      <p className="text-[10px] sm:text-[11px] text-vd-muted mb-3 leading-snug">
                        {t.passportOptionalNote}
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {country.issuedBy.show && (
                        <Field
                          label={t.passportIssuedBy}
                          required={country.issuedBy.required}
                          dim={!country.issuedBy.required}
                          optionalMark={t.optionalMark}
                          error={err('passportIssuedBy')}
                          className={country.deptCode.show ? '' : 'sm:col-span-2'}
                        >
                          <div data-field="passportIssuedBy">
                            <TextInput
                              value={passportIssuedBy}
                              onChange={bind('passportIssuedBy', setPassportIssuedBy)}
                              placeholder={t.passportIssuedByPlaceholder}
                              dim={!country.issuedBy.required}
                              invalid={!!err('passportIssuedBy')}
                            />
                          </div>
                        </Field>
                      )}

                      {country.deptCode.show && (
                        <Field
                          label={t.passportCode}
                          required={country.deptCode.required}
                          dim={!country.deptCode.required}
                          optionalMark={t.optionalMark}
                          error={err('passportDeptCode')}
                        >
                          <div data-field="passportDeptCode">
                            <TextInput
                              mask={country.deptCode.mask}
                              inputMode={country.deptCode.inputMode}
                              maxLength={country.deptCode.maxLength}
                              value={passportDeptCode}
                              onChange={bind('passportDeptCode', setPassportDeptCode)}
                              placeholder={country.deptCode.placeholder}
                              dim={!country.deptCode.required}
                              invalid={!!err('passportDeptCode')}
                            />
                          </div>
                        </Field>
                      )}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* ======================== Работы на высоте ======================= */}
            <Section number={needsPassport ? '06' : '05'} title={t.heightSafety}>
              <div className="space-y-2" data-field="height">
                <OptionCard
                  checked={heightClimb}
                  onChange={(v) => {
                    clearErr('height');
                    pickHeight(setHeightClimb)(v);
                  }}
                  label={t.heightClimb}
                  invalid={!!err('height')}
                />
                <OptionCard
                  checked={heightApprove}
                  onChange={(v) => {
                    clearErr('height');
                    pickHeight(setHeightApprove)(v);
                  }}
                  label={t.heightApprove}
                  invalid={!!err('height')}
                />
                <OptionCard
                  checked={heightWontDo}
                  onChange={(v) => {
                    clearErr('height');
                    pickHeightNone(v);
                  }}
                  label={t.heightWontDo}
                  tone="red"
                  invalid={!!err('height')}
                />
              </div>

              {needsHeightPhoto && (
                <Panel tone="accent" className="vd-anim-expand">
                  <SubHeading className="mb-1">{t.photoTitleHeight}</SubHeading>
                  <p className="text-[11px] sm:text-xs text-vd-muted mb-1 leading-snug">{t.photoComment}</p>
                  <p className="text-[11px] sm:text-xs text-vd-blue font-semibold mb-3 leading-snug">
                    {t.photoSeparateNote}
                  </p>
                  <div data-field="heightPhoto">
                    <FileInput
                      id="height-photo"
                      file={heightPhoto}
                      onSelect={(file) => {
                        clearErr('heightPhoto');
                        setHeightPhoto(file);
                      }}
                      onClear={() => setHeightPhoto(null)}
                      label={t.photoUpload}
                      accept="image/*"
                      invalid={!!err('heightPhoto')}
                      removeLabel={t.remove}
                    />
                    {err('heightPhoto') && (
                      <p className="text-[11px] text-red-600 mt-1.5 font-medium">{err('heightPhoto')}</p>
                    )}
                  </div>
                </Panel>
              )}
            </Section>

            {/* ==================== Замкнутые пространства ===================== */}
            <Section number={needsPassport ? '07' : '06'} title={t.confinedSafety}>
              <div className="space-y-2" data-field="confined">
                <OptionCard
                  checked={confinedWork}
                  onChange={(v) => {
                    clearErr('confined');
                    pickConfined(setConfinedWork)(v);
                  }}
                  label={t.confinedWork}
                  invalid={!!err('confined')}
                />
                <OptionCard
                  checked={confinedApprove}
                  onChange={(v) => {
                    clearErr('confined');
                    pickConfined(setConfinedApprove)(v);
                  }}
                  label={t.confinedApprove}
                  invalid={!!err('confined')}
                />
                <OptionCard
                  checked={confinedWontDo}
                  onChange={(v) => {
                    clearErr('confined');
                    pickConfinedNone(v);
                  }}
                  label={t.confinedWontDo}
                  tone="red"
                  invalid={!!err('confined')}
                />
              </div>

              {needsConfinedPhoto && (
                <Panel tone="accent" className="vd-anim-expand">
                  <SubHeading className="mb-1">{t.photoTitleConfined}</SubHeading>
                  <p className="text-[11px] sm:text-xs text-vd-muted mb-1 leading-snug">{t.photoComment}</p>
                  <p className="text-[11px] sm:text-xs text-vd-blue font-semibold mb-3 leading-snug">
                    {t.photoSeparateNote}
                  </p>
                  <div data-field="confinedPhoto">
                    <FileInput
                      id="confined-photo"
                      file={confinedPhoto}
                      onSelect={(file) => {
                        clearErr('confinedPhoto');
                        setConfinedPhoto(file);
                      }}
                      onClear={() => setConfinedPhoto(null)}
                      label={t.photoUpload}
                      accept="image/*"
                      invalid={!!err('confinedPhoto')}
                      removeLabel={t.remove}
                    />
                    {err('confinedPhoto') && (
                      <p className="text-[11px] text-red-600 mt-1.5 font-medium">{err('confinedPhoto')}</p>
                    )}
                  </div>
                </Panel>
              )}
            </Section>

            {/* ========================== Транспорт =========================== */}
            <Section number={needsPassport ? '08' : '07'} title={t.drivingSafety}>
              <div className="space-y-2" data-field="drive">
                <OptionCard
                  checked={driveWill}
                  onChange={(v) => {
                    clearErr('drive');
                    pickDriveWill(v);
                  }}
                  label={t.driveWill}
                  invalid={!!err('drive')}
                />
                <OptionCard
                  checked={driveWont}
                  onChange={(v) => {
                    clearErr('drive');
                    pickDriveWont(v);
                  }}
                  label={t.driveWont}
                  tone="red"
                  invalid={!!err('drive')}
                />
              </div>

              {driveWill && (
                <Panel tone="soft" className="vd-anim-expand space-y-3.5">
                  <SubHeading>{t.licenceTitle}</SubHeading>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Field label={t.licenceNumber} required error={err('licenceNumber')}>
                      <div data-field="licenceNumber">
                        <TextInput
                          mask="licenceNumber"
                          inputMode="numeric"
                          value={licenceNumber}
                          onChange={bind('licenceNumber', setLicenceNumber)}
                          placeholder={t.licenceNumberPlaceholder}
                          invalid={!!err('licenceNumber')}
                        />
                      </div>
                    </Field>

                    <Field label={t.licenceDate} required error={err('licenceDate')}>
                      <div data-field="licenceDate">
                        <TextInput
                          mask="date"
                          inputMode="numeric"
                          value={licenceDate}
                          onChange={bind('licenceDate', setLicenceDate)}
                          placeholder={t.datePlaceholder}
                          invalid={!!err('licenceDate')}
                        />
                      </div>
                    </Field>
                  </div>

                  <Field label={t.licenceCategories} required hint={t.licenceCategoriesHint} error={err('licenceCategories')}>
                    <div data-field="licenceCategories">
                      <SmartSelect
                        items={LICENCE_ITEMS}
                        value={licenceCategories}
                        onChange={bind('licenceCategories', setLicenceCategories)}
                        placeholder={t.licenceCategoriesPlaceholder}
                        searchPlaceholder={t.licenceCategoriesSearch}
                        multiHint={t.searchMultiHint}
                        emptyText={t.searchEmpty}
                        doneLabel={t.searchDone}
                        removeLabel={t.remove}
                        invalid={!!err('licenceCategories')}
                      />
                    </div>
                  </Field>

                  <Field label={t.licenceFile} required hint={t.fileHint} error={err('licenceFile')}>
                    <div data-field="licenceFile">
                      <FileInput
                        id="licence-file"
                        file={licenceFile}
                        onSelect={(file) => {
                          clearErr('licenceFile');
                          setLicenceFile(file);
                        }}
                        onClear={() => setLicenceFile(null)}
                        label={t.chooseFile}
                        invalid={!!err('licenceFile')}
                      />
                    </div>
                  </Field>
                </Panel>
              )}
            </Section>

            {/* ======================= Другие обучения ======================== */}
            <Section number={needsPassport ? '09' : '08'} title={t.otherSafety}>
              <p className="text-[12px] sm:text-[13px] text-vd-muted leading-relaxed">{t.otherLabel}</p>

              <div className="space-y-3">
                {trainings.map((item, index) => (
                  <Panel key={item.id} tone="soft" className="vd-anim-chip space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-vd-muted">
                        {t.otherTrainingTitle} {index + 1}
                      </span>
                      <RemoveButton onClick={() => removeTraining(item.id)} label={t.remove} />
                    </div>

                    <Field label={t.otherTrainingTitle} required error={err(`training_${item.id}_code`)}>
                      <div data-field={`training_${item.id}_code`}>
                        <SmartSelect
                          items={TRAININGS}
                          multiple={false}
                          allowOther
                          otherCode={TRAINING_OTHER_CODE}
                          otherLabel={t.otherTrainingCustom}
                          value={item.code ? [item.code] : []}
                          onChange={(codes) => {
                            clearErr(`training_${item.id}_code`);
                            updateTraining(item.id, { code: codes[0] || '' });
                          }}
                          placeholder={t.otherTrainingPlaceholder}
                          searchPlaceholder={t.otherTrainingSearch}
                          emptyText={t.searchEmpty}
                          doneLabel={t.searchDone}
                          removeLabel={t.remove}
                          invalid={!!err(`training_${item.id}_code`)}
                        />
                      </div>
                    </Field>

                    {item.code === TRAINING_OTHER_CODE && (
                      <Field label={t.otherTrainingCustom} required error={err(`training_${item.id}_custom`)}>
                        <div data-field={`training_${item.id}_custom`} className="vd-anim-expand">
                          <TextInput
                            value={item.customTitle}
                            onChange={(value) => {
                              clearErr(`training_${item.id}_custom`);
                              updateTraining(item.id, { customTitle: value });
                            }}
                            placeholder={t.otherTrainingCustomPlaceholder}
                            invalid={!!err(`training_${item.id}_custom`)}
                          />
                        </div>
                      </Field>
                    )}

                    <Field
                      label={t.otherTrainingDate}
                      required
                      hint={t.otherTrainingDateHint}
                      error={err(`training_${item.id}_date`)}
                    >
                      <div data-field={`training_${item.id}_date`}>
                        <TextInput
                          mask="date"
                          inputMode="numeric"
                          value={item.issueDate}
                          onChange={(value) => {
                            clearErr(`training_${item.id}_date`);
                            updateTraining(item.id, { issueDate: value });
                          }}
                          placeholder={t.datePlaceholder}
                          invalid={!!err(`training_${item.id}_date`)}
                        />
                      </div>
                    </Field>

                    <Field label={t.otherFilesLabel} hint={t.fileHint}>
                      <MultiFileInput
                        id={`training-files-${item.id}`}
                        files={item.files}
                        onAdd={(files) => updateTraining(item.id, { files: [...item.files, ...files] })}
                        onRemove={(fileIndex) =>
                          updateTraining(item.id, { files: item.files.filter((_, i) => i !== fileIndex) })
                        }
                        label={t.chooseFile}
                        removeLabel={t.remove}
                      />
                    </Field>
                  </Panel>
                ))}

                <Button type="button" variant="add" onClick={addTraining}>
                  <Plus className="w-4 h-4" /> {t.addMoreTrainings}
                </Button>
              </div>
            </Section>

            {/* ========================== Отправка ============================ */}
            <div className="border-t border-vd-line pt-6 space-y-4">
              <div data-field="consent">
                <OptionCard
                  checked={consent}
                  onChange={(v) => {
                    clearErr('consent');
                    setConsent(v);
                  }}
                  label={t.consentText}
                  invalid={!!err('consent')}
                />
              </div>

              {showErrorBanner && (hasUnknown || Object.keys(errors).length > 0) && (
                <Callout tone="danger">{hasUnknown ? t.unknownWarning : t.validationError}</Callout>
              )}
              {sendError && <Callout tone="danger">{sendError}</Callout>}

              <Button type="submit" disabled={isSubmitting} className="w-full !py-4 !text-[15px]">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSubmitting ? t.submitGenerating : t.submitBtn}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Успешная отправка */}
      {showSuccess && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-vd-navy-deep/70 backdrop-blur-sm vd-anim-fade-in">
          <div className="bg-white w-full max-w-sm p-7 text-center vd-anim-sheet border-t-2 border-vd-blue">
            <div className="w-16 h-16 mx-auto mb-5 bg-vd-blue-pale flex items-center justify-center vd-anim-pulse">
              <CheckCircle2 className="w-8 h-8 text-vd-blue" />
            </div>
            <h3 className="text-xl font-black text-vd-navy uppercase tracking-wide mb-2">{t.modalSuccessTitle}</h3>
            <p className="text-[13px] text-vd-muted leading-relaxed mb-6">{t.modalSuccessSubtitle}</p>
            <Button type="button" onClick={() => setShowSuccess(false)} className="w-full">
              {t.modalSuccessBtn}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
