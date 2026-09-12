import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Loader2, Plus, Pencil } from 'lucide-react';

import { translations } from '../i18n.js';
import { appBase } from '../lib/route.js';
import { COUNTRIES, DEFAULT_COUNTRY_ID, getCountry } from '../data/countries.js';
import { ATTESTATION_AREAS } from '../data/attestation.js';
import { TRAININGS, TRAINING_OTHER_CODE } from '../data/trainings.js';
import { LICENCE_CATEGORIES } from '../data/licence.js';
import { DEPARTMENTS, DEPARTMENT_OTHER, ROTATIONS, ROTATION_OTHER, PROTOCOL_VENUES } from '../data/departments.js';
import { isValidDate } from '../lib/format.js';
import SmartSelect from './SmartSelect.jsx';
import { FormHeader, FormTitle, SuccessModal } from './FormShell.jsx';

/**
 * Как зовут человека на языке анкеты.
 *
 * Русские заполняют кириллицей, англоязычные — латиницей: «Ivanov Ivan» в поле
 * ФИО для англичанина понятнее, чем «Иванов Иван Иванович». Если нужного
 * написания в данных нет, возвращаем то, что есть: пустое поле хуже, чем
 * заполненное на другом языке.
 */
function employeeNameFor(emp, language) {
  const en = `${emp?.nameEn || ''} ${emp?.surnameEn || ''}`.trim();
  const ru = String(emp?.fio || '').trim();
  return language === 'en' ? en || ru : ru || en;
}
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
} from './ui.jsx';

const MAX_PROTOCOLS = 5;
const MAX_TRAININGS = 5;
const EMPLOYERS = ['Vega Development', 'Polar Express', 'Другое'];
const STATUSES = ['have', 'need', 'dont_need', 'unknown'];
const ELECTRO_GROUPS = ['I', 'II', 'III', 'IV', 'V'];

const newId = () => Math.random().toString(36).slice(2, 10);
const emptyProtocol = () => ({ id: newId(), number: '', venue: '', date: '', areas: [], file: null });
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
  const [department, setDepartment] = useState('');
  const [departmentOther, setDepartmentOther] = useState('');
  const [rotationStart, setRotationStart] = useState('');
  const [rotation, setRotation] = useState('');
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

  // Латиница из ссылки — уходит в таблицу, работник её не видит
  const [nameEn, setNameEn] = useState('');
  const [surnameEn, setSurnameEn] = useState('');
  // Русское ФИО из ссылки. В поле его может не быть — англоязычный видит там
  // латиницу, — но в таблице кадров под кириллицу отдельная колонка,
  // и терять её из-за выбранного языка нельзя.
  const [fioRu, setFioRu] = useState('');

  // Должность подставляется из ссылки, но работник её проверяет и подтверждает
  const [positionRu, setPositionRu] = useState('');
  const [positionEn, setPositionEn] = useState('');
  const [positionPrefilled, setPositionPrefilled] = useState(false);
  const [positionEditing, setPositionEditing] = useState(false);

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

  // Одна фотография идёт на оба удостоверения — второй раз грузить не нужно
  const [employeePhoto, setEmployeePhoto] = useState(null);

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
    setPositionEditing(false);

    if (index === '-1' || index === '') {
      setEmployeeName('');
      setPersonalEmail('');
      setWorkEmail('');
      setEmailsPrefilled(false);
      setNameEn('');
      setSurnameEn('');
      setFioRu('');
      setPositionRu('');
      setPositionEn('');
      setPositionPrefilled(false);
      return;
    }

    const emp = sessionEmployees[index];
    if (!emp) return;
    setEmployeeName(employeeNameFor(emp, lang));
    setPersonalEmail(emp.email || '');
    setWorkEmail(emp.workEmail || '');
    // Режим подтверждения включаем, только если подставились обе почты
    setEmailsPrefilled(Boolean(emp.email && emp.workEmail));
    setNameEn(emp.nameEn || '');
    setSurnameEn(emp.surnameEn || '');
    setFioRu(emp.fio || '');
    setPositionRu(emp.posRu || '');
    setPositionEn(emp.posEn || '');
    // Режим подтверждения включаем, только если должность вообще подставилась
    setPositionPrefilled(Boolean(emp.posRu || emp.posEn));
  };

  /* ---------------------------------------------------------------- */
  /* Производные условия                                               */
  /* ---------------------------------------------------------------- */
  const needsTraining = ['have', 'need'].includes(promStatus) || ['have', 'need'].includes(electroStatus);
  const needsPassport = needsTraining;
  const needsTaxId = needsTraining && !!country.taxId;
  const needsHeightPhoto = heightClimb || heightApprove;
  const needsConfinedPhoto = confinedWork || confinedApprove;
  const needsPhoto = needsHeightPhoto || needsConfinedPhoto;
  // Показываем блок с фото только один раз — в первом подходящем разделе
  const showPhotoInHeight = needsHeightPhoto;
  const showPhotoInConfined = needsConfinedPhoto && !needsHeightPhoto;
  const hasUnknown = promStatus === 'unknown' || electroStatus === 'unknown';
  // Почты показываем на подтверждение, пока человек не решил их править
  const emailsInConfirmMode = emailsPrefilled && !emailsEditing;
  const positionInConfirmMode = positionPrefilled && !positionEditing;

  // Как человек назван в списке «найдите себя». На английском люди ищут себя
  // по имени и фамилии латиницей, а не по кириллическому ФИО, поэтому порядок
  // зависит от выбранного языка. Если нужного написания нет — показываем то,
  // что есть: пустая строка в списке хуже, чем строка на другом языке.
  const employeeLabel = (emp, index) => employeeNameFor(emp, lang) || `#${index + 1}`;

  // Должность показываем на языке анкеты. Если на нём её не заполнили —
  // показываем ту, что есть, вместе с её собственной подписью, чтобы не
  // выдавать русскую должность за английскую.
  const positionShown =
    lang === 'en'
      ? positionEn
        ? { label: t.positionLabelEn, value: positionEn }
        : { label: t.positionLabelRu, value: positionRu }
      : positionRu
        ? { label: t.positionLabelRu, value: positionRu }
        : { label: t.positionLabelEn, value: positionEn };

  // Язык переключили уже после того, как человек нашёл себя в списке. Если поле
  // с именем никто не правил, показываем его на новом языке. Если правил руками —
  // не трогаем: иначе исправление молча пропадёт при случайном нажатии RU/EN.
  const prevLang = useRef(lang);
  useEffect(() => {
    const was = prevLang.current;
    prevLang.current = lang;
    if (was === lang) return;
    if (selectedEmpIndex === '' || selectedEmpIndex === '-1') return;
    const emp = sessionEmployees[Number(selectedEmpIndex)];
    if (!emp) return;
    setEmployeeName((current) =>
      current === employeeNameFor(emp, was) ? employeeNameFor(emp, lang) : current,
    );
  }, [lang, selectedEmpIndex, sessionEmployees]);

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
  const addTraining = () => setTrainings((list) => (list.length >= MAX_TRAININGS ? list : [...list, emptyTraining()]));
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
    // Храним не готовый текст, а название сообщения: иначе при смене языка
    // подписи под полями остаются на прежнем языке
    const need = (key, ok, messageKey = 'required') => list.push({ key, ok: !!ok, messageKey });
    const filled = (value) => String(value || '').trim().length > 0;

    need('employer', employer !== 'Другое' || filled(employerOther));
    if (country.isOther) need('citizenshipOther', filled(citizenshipOther));
    need('employeeName', filled(employeeName) && employeeName.trim().split(/\s+/).length >= 2);
    need('birthDate', isValidDate(birthDate), 'invalidFormat');
    need('department', department === DEPARTMENT_OTHER ? filled(departmentOther) : filled(department), 'selectAtLeastOne');
    need('rotationStart', isValidDate(rotationStart), 'invalidFormat');
    need('rotation', filled(rotation), 'selectAtLeastOne');
    need('phone_0', filled(phones[0]?.value) && phones[0].value.replace(/\D/g, '').length >= 10, 'invalidFormat');
    const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
    if (emailsInConfirmMode) {
      // Обе почты подставлены — достаточно подтвердить галочкой
      need('emailsConfirmed', emailsConfirmed, 'confirmRequired');
    } else {
      need('personalEmail', isEmail(personalEmail), 'invalidFormat');
      if (filled(workEmail)) need('workEmail', isEmail(workEmail), 'invalidFormat');
    }

    const pid = country.personalId;
    if (pid && pid.required) {
      need('personalId', pid.validate ? pid.validate(personalIdValue) : filled(personalIdValue), 'invalidFormat');
    }

    need('promStatus', !!promStatus, 'selectAtLeastOne');
    need('electroStatus', !!electroStatus, 'selectAtLeastOne');

    if (needsPassport) {
      need('passportNumber', country.passport.validate(passportNumber), 'invalidFormat');
      need('passportIssueDate', isValidDate(passportIssueDate), 'invalidFormat');
      if (country.issuedBy.show && country.issuedBy.required) need('passportIssuedBy', filled(passportIssuedBy));
      if (country.deptCode.show && country.deptCode.required) {
        need('passportDeptCode', country.deptCode.validate ? country.deptCode.validate(passportDeptCode) : filled(passportDeptCode), 'invalidFormat');
      }
    }

    if (needsTaxId) {
      need('taxId', country.taxId.validate ? country.taxId.validate(taxIdValue) : filled(taxIdValue), 'invalidFormat');
    }

    if (promStatus === 'have') {
      protocols.forEach((p) => {
        need(`protocol_${p.id}_number`, filled(p.number));
        need(`protocol_${p.id}_venue`, filled(p.venue), 'selectAtLeastOne');
        need(`protocol_${p.id}_date`, isValidDate(p.date), 'invalidFormat');
        need(`protocol_${p.id}_areas`, p.areas.length > 0, 'selectAtLeastOne');
        need(`protocol_${p.id}_file`, !!p.file, 'fileRequired');
      });
    }

    if (electroStatus === 'have' || electroStatus === 'need') {
      need('electroEducation', filled(electroEducation), 'selectAtLeastOne');
    }
    if (electroStatus === 'have') {
      need('electroGroup', filled(electroGroup), 'selectAtLeastOne');
      need('electroDate', isValidDate(electroDate), 'invalidFormat');
      need('electroFile', !!electroFile, 'fileRequired');
    }

    need('height', heightClimb || heightApprove || heightWontDo, 'selectAtLeastOne');
    need('confined', confinedWork || confinedApprove || confinedWontDo, 'selectAtLeastOne');
    if (needsPhoto) need('photo', !!employeePhoto, 'fileRequired');

    need('drive', driveWill || driveWont, 'selectAtLeastOne');
    if (driveWill) {
      need('licenceNumber', filled(licenceNumber));
      need('licenceDate', isValidDate(licenceDate), 'invalidFormat');
      need('licenceCategories', licenceCategories.length > 0, 'selectAtLeastOne');
      need('licenceFile', !!licenceFile, 'fileRequired');
    }

    // Раздел «Другие обучения» заполнять не обязательно — он не блокирует отправку.
    // Незаполненные строки просто не попадут ни в письмо, ни в таблицу.

    need('consent', consent, 'consentRequired');

    return list;
  }, [
    country, employer, employerOther, citizenshipOther, employeeName, birthDate, phones, personalEmail, workEmail,
    department, departmentOther, rotationStart, rotation,
    emailsInConfirmMode, emailsConfirmed,
    personalIdValue, taxIdValue, promStatus, electroStatus, needsPassport, needsTaxId, passportNumber, passportIssueDate,
    passportIssuedBy, passportDeptCode, protocols, electroEducation, electroGroup, electroDate, electroFile,
    heightClimb, heightApprove, heightWontDo, confinedWork, confinedApprove, confinedWontDo,
    needsPhoto, employeePhoto,
    driveWill, driveWont, licenceNumber, licenceDate, licenceCategories, licenceFile, consent,
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
      const finalEmployer = employer === 'Другое' ? employerOther.trim() : employer;
      const finalCitizenship = country.isOther ? citizenshipOther.trim() : country.nameRu;
      const phoneList = phones.map((p) => p.value.trim()).filter(Boolean);

      const protocolList =
        promStatus === 'have'
          ? protocols.map((p) => ({
              number: p.number.trim(),
              date: p.date,
              venue: p.venue,
              areas: p.areas,
              areasText: p.areas.join(', '),
            }))
          : [];

      const trainingList = trainings
        .filter((item) => item.code && (item.code !== TRAINING_OTHER_CODE || item.customTitle.trim()))
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
        // Кириллическое ФИО отдельно: у англоязычного в видимом поле латиница,
        // а колонка «ФИО» в таблице кадров должна остаться русской.
        fioRu: fioRu.trim(),
        nameEn,
        surnameEn,
        positionRu: positionRu.trim(),
        positionEn: positionEn.trim(),
        birthDate,

        department: department === DEPARTMENT_OTHER ? departmentOther.trim() : department,
        departmentIsOther: department === DEPARTMENT_OTHER,
        rotationStart,
        // Для варианта «Другое» в таблицу длительность вахты не пишем
        rotation: rotation === ROTATION_OTHER ? '' : rotation,

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

        confinedWork,
        confinedApprove,
        confinedWontDo,
        confinedStatus: confinedStatusText(),
        photoAttached: needsPhoto && !!employeePhoto,

        driveWill,
        driveWont,
        driveStatus: driveWill ? t.driveWill : t.driveWont,
        licence: driveWill
          ? { number: licenceNumber.trim(), date: licenceDate, categories: licenceCategories }
          : null,

        trainings: trainingList,
        consentText: t.consentText,
        // Чтобы ссылка на страницу копирования вела в тот же контур
        appBase: appBase(),
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));

      // Word-досье собирает сервер из той же строки, что уходит в Excel —
      // так расчётные колонки считаются в одном месте
      const safeName = employeeName.trim().replace(/\s+/g, '_');

      const attach = (file, name) => {
        if (!file || !file.name) return;
        const ext = file.name.split('.').pop();
        formData.append('files', file, `${name}.${ext}`);
      };

      if (promStatus === 'have') {
        protocols.forEach((p, index) => attach(p.file, `${safeName}_${t.mailFileNameProtocol}_${index + 1}`));
      }
      if (electroStatus === 'have') attach(electroFile, `${safeName}_${t.mailFileNameElectro}`);
      if (needsPhoto) attach(employeePhoto, `${t.mailFileNamePhoto}_${safeName}`);
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
  // В errors лежит название сообщения — текст берём из текущего языка
  const err = (key) => {
    const messageKey = errors[key];
    return messageKey ? t[messageKey] || t.required : undefined;
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

  const formVisible = sessionEmployees.length === 0 || selectedEmpIndex !== '';

  const pid = country.personalId;

  // Фотография одна на оба удостоверения, поэтому заголовок зависит от того,
  // какие допуски человек отметил
  const photoTitle =
    needsHeightPhoto && needsConfinedPhoto
      ? t.photoTitleBoth
      : needsHeightPhoto
        ? t.photoTitleHeight
        : t.photoTitleConfined;


  /* ---------------------------------------------------------------- */
  /* Разметка                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-vd-bg pb-24 sm:pb-8">
      <FormHeader
        lang={lang}
        onLangChange={onLangChange}
        progress={formVisible ? progress : undefined}
        progressLabel={`${t.progressLabel} ${progress}%`}
      />

      <FormTitle eyebrow={t.subtitle} title={t.title} intro={t.intro} />

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
                  {employeeLabel(emp, index)}
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

                {/* Должность приходит из отдела кадров. Подтверждать её не нужно —
                    показываем на языке анкеты, поправить можно по желанию */}
                <div className="sm:col-span-2">
                  {positionInConfirmMode ? (
                    <Panel tone="accent" className="vd-anim-expand space-y-3">
                      <div>
                        <SubHeading className="mb-1">{t.positionBlockTitle}</SubHeading>
                        <p className="text-[11px] sm:text-xs text-vd-muted">{t.positionPrefilledHint}</p>
                      </div>

                      {positionShown.value && (
                        <div className="bg-white border border-vd-line px-3 py-2.5 vd-sharp">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-vd-muted mb-0.5">
                            {positionShown.label}
                          </div>
                          <div className="text-[13px] sm:text-sm font-semibold text-vd-navy break-words leading-snug">
                            {positionShown.value}
                          </div>
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        className="!px-0"
                        onClick={() => {
                          setPositionEditing(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" /> {t.emailsEdit}
                      </Button>
                    </Panel>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Первым идёт поле на языке анкеты: свою должность человек
                          правит на том языке, на котором заполняет всё остальное.
                          Второе поле остаётся — обе записи нужны отделу кадров. */}
                      {(lang === 'en'
                        ? [
                            { key: 'positionEn', label: t.positionLabelEn, value: positionEn, set: setPositionEn, placeholder: t.positionPlaceholderEn },
                            { key: 'positionRu', label: t.positionLabelRu, value: positionRu, set: setPositionRu, placeholder: t.positionPlaceholderRu },
                          ]
                        : [
                            { key: 'positionRu', label: t.positionLabelRu, value: positionRu, set: setPositionRu, placeholder: t.positionPlaceholderRu },
                            { key: 'positionEn', label: t.positionLabelEn, value: positionEn, set: setPositionEn, placeholder: t.positionPlaceholderEn },
                          ]
                      ).map((row, rowIndex) => (
                        <Field
                          key={row.key}
                          label={row.label}
                          hint={rowIndex === 0 && positionPrefilled ? t.positionPrefilledHint : undefined}
                        >
                          <div data-field={row.key}>
                            <TextInput value={row.value} onChange={row.set} placeholder={row.placeholder} />
                          </div>
                        </Field>
                      ))}
                    </div>
                  )}
                </div>

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

                <Field label={t.departmentLabel} required error={err('department')}>
                  <div data-field="department">
                    {/* Работник видит расшифровку, в таблицу уходит аббревиатура */}
                    <Select value={department} onChange={bind('department', setDepartment)} invalid={!!err('department')}>
                      <option value="" disabled>
                        {t.departmentSelect}
                      </option>
                      {DEPARTMENTS.map((dep) => (
                        <option key={dep.code} value={dep.code}>
                          {lang === 'ru' ? dep.ru : dep.en}
                        </option>
                      ))}
                      <option value={DEPARTMENT_OTHER}>{t.departmentOther}</option>
                    </Select>
                    {department === DEPARTMENT_OTHER && (
                      <div className="mt-2 vd-anim-expand">
                        <TextInput
                          value={departmentOther}
                          onChange={bind('department', setDepartmentOther)}
                          placeholder={t.departmentOtherPlaceholder}
                          invalid={!!err('department')}
                        />
                      </div>
                    )}
                  </div>
                </Field>

                <Field label={t.rotationStartLabel} required hint={t.rotationStartHint} error={err('rotationStart')}>
                  <div data-field="rotationStart">
                    <TextInput
                      mask="date"
                      inputMode="numeric"
                      value={rotationStart}
                      onChange={bind('rotationStart', setRotationStart)}
                      placeholder={t.datePlaceholder}
                      invalid={!!err('rotationStart')}
                    />
                  </div>
                </Field>

                <Field label={t.rotationLabel} required error={err('rotation')}>
                  <div data-field="rotation">
                    <Select value={rotation} onChange={bind('rotation', setRotation)} invalid={!!err('rotation')}>
                      <option value="" disabled>
                        {t.rotationSelect}
                      </option>
                      {ROTATIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value={ROTATION_OTHER}>{t.rotationOther}</option>
                    </Select>
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

                          <Field label={t.protocolVenue} required error={err(`protocol_${protocol.id}_venue`)}>
                            <div data-field={`protocol_${protocol.id}_venue`}>
                              <Select
                                value={protocol.venue}
                                onChange={(value) => {
                                  clearErr(`protocol_${protocol.id}_venue`);
                                  updateProtocol(protocol.id, { venue: value });
                                }}
                                invalid={!!err(`protocol_${protocol.id}_venue`)}
                              >
                                <option value="" disabled>
                                  {t.protocolVenueSelect}
                                </option>
                                {PROTOCOL_VENUES.map((v) => (
                                  <option key={v.code} value={v.code}>
                                    {lang === 'ru' ? v.ru : v.en}
                                  </option>
                                ))}
                              </Select>
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
                              selectedLabel={t.searchSelected}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <Field
                    label={lang === 'ru' ? country.passport.labelRu : country.passport.labelEn}
                    required
                    labelTwoLines
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

                  <Field label={t.passportIssueDate} required labelTwoLines error={err('passportIssueDate')}>
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

              {showPhotoInHeight && (
                <Panel tone="accent" className="vd-anim-expand">
                  <SubHeading className="mb-1">{photoTitle}</SubHeading>
                  <p className="text-[11px] sm:text-xs text-vd-muted mb-3 leading-snug">{t.photoComment}</p>
                  <div data-field="photo">
                    <FileInput
                      id="employee-photo"
                      file={employeePhoto}
                      onSelect={(file) => {
                        clearErr('photo');
                        setEmployeePhoto(file);
                      }}
                      onClear={() => setEmployeePhoto(null)}
                      label={t.photoUpload}
                      accept="image/*"
                      invalid={!!err('photo')}
                      removeLabel={t.remove}
                    />
                    {err('photo') && <p className="text-[11px] text-red-600 mt-1.5 font-medium">{err('photo')}</p>}
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

              {showPhotoInConfined && (
                <Panel tone="accent" className="vd-anim-expand">
                  <SubHeading className="mb-1">{photoTitle}</SubHeading>
                  <p className="text-[11px] sm:text-xs text-vd-muted mb-3 leading-snug">{t.photoComment}</p>
                  <div data-field="photo">
                    <FileInput
                      id="employee-photo"
                      file={employeePhoto}
                      onSelect={(file) => {
                        clearErr('photo');
                        setEmployeePhoto(file);
                      }}
                      onClear={() => setEmployeePhoto(null)}
                      label={t.photoUpload}
                      accept="image/*"
                      invalid={!!err('photo')}
                      removeLabel={t.remove}
                    />
                    {err('photo') && <p className="text-[11px] text-red-600 mt-1.5 font-medium">{err('photo')}</p>}
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
                        selectedLabel={t.searchSelected}
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

                    <Field label={t.otherTrainingTitle} error={err(`training_${item.id}_code`)}>
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
                          selectedLabel={t.searchSelected}
                          removeLabel={t.remove}
                          invalid={!!err(`training_${item.id}_code`)}
                        />
                      </div>
                    </Field>

                    {item.code === TRAINING_OTHER_CODE && (
                      <Field label={t.otherTrainingCustom} error={err(`training_${item.id}_custom`)}>
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

                {trainings.length < MAX_TRAININGS ? (
                  <Button type="button" variant="add" onClick={addTraining}>
                    <Plus className="w-4 h-4" /> {t.addMoreTrainings}
                  </Button>
                ) : (
                  <Callout tone="info">{t.trainingLimit}</Callout>
                )}
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
                {err('consent') && (
                  <p className="text-[11px] text-red-600 mt-1.5 font-medium">{err('consent')}</p>
                )}
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

      {showSuccess && (
        <SuccessModal
          title={t.modalSuccessTitle}
          text={t.modalSuccessSubtitle}
          buttonLabel={t.modalSuccessBtn}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
}
