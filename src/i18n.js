// Все тексты анкеты. Формулировки простые и человеческие, но без панибратства:
// работник должен понять вопрос с первого раза и ответить точно.

export const translations = {
  ru: {
    // --- Заставка ---
    splashTitle: 'Анкета нового работника',
    splashSubtitle: 'Выбери язык, на котором тебе удобно заполнять',
    splashRu: 'Русский',
    splashEn: 'English',
    splashHint: 'Язык можно поменять в любой момент — переключатель вверху страницы',

    // --- Шапка ---
    title: 'Анкета нового работника',
    subtitle: 'Охрана труда и промышленная безопасность',
    intro:
      'Заполнение занимает около 5 минут. Данные нужны, чтобы понять, какое обучение тебе потребуется, и вовремя его организовать.',
    progressLabel: 'Заполнено',

    // --- Выбор сотрудника ---
    chooseEmployee: 'Найди себя в списке',
    chooseEmployeeHint: 'Часть полей заполнится автоматически — тебе останется только проверить',
    choosePlaceholder: 'Выбери себя',
    manualEntry: 'Меня нет в списке — заполню сам',

    // --- Общая информация ---
    generalInfo: 'О тебе',
    employerLabel: 'Основное место работы',
    employerOtherPlaceholder: 'Название организации',
    citizenshipLabel: 'Гражданство',
    citizenshipOtherLabel: 'Укажи страну',
    citizenshipOtherPlaceholder: 'Например: Узбекистан',
    citizenshipHint: 'От гражданства зависит, какие документы у тебя спросят дальше',
    fullName: 'Фамилия, имя и отчество',
    fullNamePlaceholder: 'Иванов Иван Иванович',
    birthDateLabel: 'Дата рождения',
    datePlaceholder: 'ДД.ММ.ГГГГ',

    // --- Контакты ---
    contactsTitle: 'Как с тобой связаться',
    phoneLabel: 'Телефон',
    phoneLabelMain: 'Основной телефон',
    phoneLabelExtra: 'Дополнительный телефон',
    phoneAdd: 'Добавить ещё телефон',
    phoneHint: 'Хотя бы один номер обязателен. Добавь второй, если на первом бываешь недоступен',
    personalEmailLabel: 'Личная почта',
    personalEmailPlaceholder: 'example@mail.ru',
    workEmailLabel: 'Рабочая почта',
    workEmailHint: 'Мы подставили её автоматически — проверь, всё ли верно, и поправь при необходимости',
    checkPrefilled: 'Проверь, что подставилось верно',

    // --- Паспорт ---
    passportTitle: 'Документ, удостоверяющий личность',
    passportComment: 'Нужен, чтобы подать заявку в учебный центр и внести данные в реестр Ростехнадзора',
    passportIssuedBy: 'Кем выдан',
    passportIssuedByPlaceholder: 'Название органа, выдавшего документ',
    passportIssueDate: 'Дата выдачи',
    passportCode: 'Код подразделения',
    passportOptionalNote: 'Эти поля заполняются, только если такие данные есть в твоём документе',

    // --- Статусы ---
    statusHave: 'Есть действующее удостоверение',
    statusNeed: 'Удостоверения нет, но по работе нужно',
    statusDontNeed: 'Не нужно по моей работе',
    statusUnknown: 'Пока не знаю',
    unknownWarning:
      'Уточни у своего руководителя и посмотри должностную инструкцию. С ответом «пока не знаю» анкету отправить не получится.',

    // --- 1. Промышленная безопасность ---
    promSafety: 'Промышленная безопасность',
    promSubtitle: 'Аттестация Ростехнадзора',
    protocolsTitle: 'Протоколы аттестации',
    protocolsHint: 'Добавь каждый протокол отдельно. В одном протоколе может быть несколько областей аттестации',
    protocol: 'Протокол',
    protocolNumber: 'Номер протокола',
    protocolNumberPlaceholder: 'Например: 24-15-1234',
    protocolDate: 'Дата протокола',
    protocolAreas: 'Области аттестации (литеры)',
    protocolAreasPlaceholder: 'Нажми и начни печатать: б83',
    protocolAreasSearch: 'Код или название: б83, Б 8.3, котлы',
    protocolAreasHint: 'Выбери все области, которые указаны в этом протоколе',
    protocolFile: 'Скан или фото протокола',
    addMoreProtocols: 'Добавить ещё протокол',
    protocolLimit: 'Больше 10 протоколов в анкету не поместится. Остальные принесёшь в отдел охраны труда',

    // --- 2. Электробезопасность ---
    electroSafety: 'Электробезопасность',
    electroSubtitle: 'II группа и выше',
    electroWarning: 'Нужна тем, кто работает с электроинструментом',
    education: 'Образование',
    selectEducation: 'Выбери из списка',
    eduBasic: 'Основное общее (9 классов)',
    eduSecondary: 'Среднее общее (11 классов)',
    eduVocational: 'Среднее профессиональное или высшее техническое',
    eduHigher: 'Высшее техническое в области электроэнергетики',
    specifyGroup: 'Группа по электробезопасности',
    selectGroup: 'Выбери группу',
    dateOfCheck: 'Дата последней проверки знаний',
    electroFile: 'Скан или фото удостоверения',

    // --- 3. Работы на высоте ---
    heightSafety: 'Работы на высоте',
    heightClimb: 'Буду подниматься на высоту',
    heightApprove: 'Буду согласовывать документы (ППР, наряды-допуски, планы эвакуации) или войду в комиссию по проверке знаний',
    heightWontDo: 'С высотой не работаю',

    // --- 4. Замкнутые пространства ---
    confinedSafety: 'Работы в замкнутом пространстве',
    confinedWork: 'Буду выполнять работы в замкнутом пространстве',
    confinedApprove: 'Буду согласовывать документы (ППР, наряды-допуски, планы эвакуации) или войду в комиссию по проверке знаний',
    confinedWontDo: 'В замкнутых пространствах не работаю',

    // --- Фотография ---
    photoTitle: 'Фотография для удостоверения',
    photoComment:
      'Нужна для допусков на высоту и в замкнутые пространства. Подойдёт обычное фото на светлом фоне: лицо крупно, как на паспорт',
    photoUpload: 'Загрузить фотографию',

    // --- 5. Транспорт ---
    drivingSafety: 'Управление транспортом компании',
    driveWill: 'Буду управлять транспортом компании',
    driveWont: 'Транспортом управлять не планирую',
    licenceTitle: 'Водительское удостоверение',
    licenceNumber: 'Номер удостоверения',
    licenceNumberPlaceholder: '99 99 999999',
    licenceDate: 'Дата выдачи',
    licenceCategories: 'Открытые категории',
    licenceCategoriesPlaceholder: 'Нажми и выбери: B, C, CE',
    licenceCategoriesSearch: 'Категория или тип техники',
    licenceCategoriesHint: 'Отметь все категории, открытые в твоём удостоверении',
    licenceFile: 'Скан или фото удостоверения (обе стороны)',

    // --- 6. Другие обучения ---
    otherSafety: 'Другие обучения',
    otherLabel:
      'Отметь обучения, которые ты уже проходил и которые остаются действующими на новом месте работы. Если ничего нет — просто пропусти раздел',
    otherTrainingTitle: 'Вид обучения',
    otherTrainingPlaceholder: 'Нажми и начни печатать: первая помощь',
    otherTrainingSearch: 'Название обучения',
    otherTrainingCustom: 'Впиши название обучения',
    otherTrainingCustomPlaceholder: 'Как написано в удостоверении',
    otherFilesLabel: 'Приложить удостоверение',
    addMoreTrainings: 'Добавить ещё обучение',

    // --- Отправка ---
    consentText:
      'Я согласен на обработку моих персональных данных (152-ФЗ) и на передачу их в учебный центр, а также в реестры Минтруда и Ростехнадзора.',
    submitBtn: 'Отправить анкету',
    submitGenerating: 'Отправляем…',
    submitError: 'Не получилось отправить. Проверь интернет и попробуй ещё раз. Если не выходит — напиши в отдел охраны труда',
    validationError: 'Проверь выделенные поля — там чего-то не хватает',

    // --- Успех ---
    modalSuccessTitle: 'Спасибо',
    modalSuccessSubtitle: 'Анкета отправлена. Если потребуется что-то уточнить, мы свяжемся с тобой',
    modalSuccessBtn: 'Закрыть',

    // --- Служебное ---
    chooseFile: 'Выбрать файл',
    fileHint: 'Фото с телефона тоже подойдёт, главное — чтобы текст читался',
    notSpecified: 'Не указано',
    remove: 'Удалить',
    required: 'Заполни это поле',
    invalidFormat: 'Проверь формат',
    fileRequired: 'Приложи файл',
    selectAtLeastOne: 'Выбери хотя бы один вариант',
    mailFileNameProtocol: 'протокол_ПБ',
    mailFileNameElectro: 'удостоверение_ЭБ',
    mailFileNameLicence: 'водительское',
    mailFileNameOther: 'обучение',
  },

  en: {
    // --- Splash ---
    splashTitle: 'New Employee Questionnaire',
    splashSubtitle: 'Choose the language you prefer',
    splashRu: 'Русский',
    splashEn: 'English',
    splashHint: 'You can switch the language at any time using the toggle at the top',

    // --- Header ---
    title: 'New Employee Questionnaire',
    subtitle: 'Occupational Health and Industrial Safety',
    intro:
      'This takes about 5 minutes. We need this information to work out which training you will need and arrange it in good time.',
    progressLabel: 'Completed',

    // --- Employee selection ---
    chooseEmployee: 'Find yourself in the list',
    chooseEmployeeHint: 'Some fields will be filled in automatically — you only need to check them',
    choosePlaceholder: 'Select your name',
    manualEntry: 'I am not on the list — I will fill it in myself',

    // --- General ---
    generalInfo: 'About you',
    employerLabel: 'Main place of work',
    employerOtherPlaceholder: 'Company name',
    citizenshipLabel: 'Citizenship',
    citizenshipOtherLabel: 'Specify the country',
    citizenshipOtherPlaceholder: 'For example: Uzbekistan',
    citizenshipHint: 'Your citizenship determines which documents we will ask for next',
    fullName: 'Full name',
    fullNamePlaceholder: 'John Michael Smith',
    birthDateLabel: 'Date of birth',
    datePlaceholder: 'DD.MM.YYYY',

    // --- Contacts ---
    contactsTitle: 'How to reach you',
    phoneLabel: 'Phone',
    phoneLabelMain: 'Main phone',
    phoneLabelExtra: 'Additional phone',
    phoneAdd: 'Add another phone',
    phoneHint: 'At least one number is required. Add a second one if the first is not always available',
    personalEmailLabel: 'Personal email',
    personalEmailPlaceholder: 'example@mail.com',
    workEmailLabel: 'Work email',
    workEmailHint: 'We filled this in automatically — please check it and correct if needed',
    checkPrefilled: 'Please check the pre-filled value',

    // --- Passport ---
    passportTitle: 'Identity document',
    passportComment: 'Required to apply to the training centre and register you with Rostechnadzor',
    passportIssuedBy: 'Issued by',
    passportIssuedByPlaceholder: 'Name of the issuing authority',
    passportIssueDate: 'Date of issue',
    passportCode: 'Department code',
    passportOptionalNote: 'Fill these in only if your document contains such details',

    // --- Statuses ---
    statusHave: 'I have a valid certificate',
    statusNeed: 'I do not have one, but my job requires it',
    statusDontNeed: 'Not required for my job',
    statusUnknown: 'I am not sure yet',
    unknownWarning:
      'Please check with your manager and your job description. The form cannot be submitted while the answer is "not sure yet".',

    // --- 1. Industrial safety ---
    promSafety: 'Industrial safety',
    promSubtitle: 'Rostechnadzor certification',
    protocolsTitle: 'Certification protocols',
    protocolsHint: 'Add each protocol separately. One protocol may cover several certification areas',
    protocol: 'Protocol',
    protocolNumber: 'Protocol number',
    protocolNumberPlaceholder: 'For example: 24-15-1234',
    protocolDate: 'Protocol date',
    protocolAreas: 'Certification areas',
    protocolAreasPlaceholder: 'Tap and start typing: b83',
    protocolAreasSearch: 'Code or name: b83, B 8.3, boilers',
    protocolAreasHint: 'Select every area listed in this protocol',
    protocolFile: 'Scan or photo of the protocol',
    addMoreProtocols: 'Add another protocol',
    protocolLimit: 'The form holds up to 10 protocols. Bring the rest to the HSE department',

    // --- 2. Electrical safety ---
    electroSafety: 'Electrical safety',
    electroSubtitle: 'Group II and above',
    electroWarning: 'Required for anyone working with power tools',
    education: 'Education',
    selectEducation: 'Select from the list',
    eduBasic: 'Basic general (9 years)',
    eduSecondary: 'Secondary general (11 years)',
    eduVocational: 'Vocational or higher technical',
    eduHigher: 'Higher technical in power engineering',
    specifyGroup: 'Electrical safety group',
    selectGroup: 'Select a group',
    dateOfCheck: 'Date of the last knowledge check',
    electroFile: 'Scan or photo of the certificate',

    // --- 3. Work at height ---
    heightSafety: 'Work at height',
    heightClimb: 'I will be working at height',
    heightApprove: 'I will approve documents (work plans, permits, evacuation plans) or sit on the knowledge review board',
    heightWontDo: 'I do not work at height',

    // --- 4. Confined spaces ---
    confinedSafety: 'Work in confined spaces',
    confinedWork: 'I will be working in confined spaces',
    confinedApprove: 'I will approve documents (work plans, permits, evacuation plans) or sit on the knowledge review board',
    confinedWontDo: 'I do not work in confined spaces',

    // --- Photo ---
    photoTitle: 'Photo for your permit card',
    photoComment:
      'Required for work at height and confined space permits. A normal photo on a light background will do: face close-up, passport style',
    photoUpload: 'Upload a photo',

    // --- 5. Driving ---
    drivingSafety: 'Driving company vehicles',
    driveWill: 'I will drive company vehicles',
    driveWont: 'I will not be driving',
    licenceTitle: 'Driving licence',
    licenceNumber: 'Licence number',
    licenceNumberPlaceholder: '99 99 999999',
    licenceDate: 'Date of issue',
    licenceCategories: 'Categories held',
    licenceCategoriesPlaceholder: 'Tap and select: B, C, CE',
    licenceCategoriesSearch: 'Category or vehicle type',
    licenceCategoriesHint: 'Select every category open on your licence',
    licenceFile: 'Scan or photo of the licence (both sides)',

    // --- 6. Other training ---
    otherSafety: 'Other training',
    otherLabel:
      'Select the training you have already completed that stays valid at a new employer. If you have none, simply skip this section',
    otherTrainingTitle: 'Type of training',
    otherTrainingPlaceholder: 'Tap and start typing: first aid',
    otherTrainingSearch: 'Training name',
    otherTrainingCustom: 'Enter the name of the training',
    otherTrainingCustomPlaceholder: 'As written on your certificate',
    otherFilesLabel: 'Attach the certificate',
    addMoreTrainings: 'Add another training',

    // --- Submit ---
    consentText:
      'I consent to the processing of my personal data (Federal Law 152-FZ) and to its transfer to the training centre and to the registries of the Ministry of Labour and Rostechnadzor.',
    submitBtn: 'Submit the form',
    submitGenerating: 'Sending…',
    submitError: 'Could not send. Check your connection and try again. If it still fails, contact the HSE department',
    validationError: 'Please check the highlighted fields — something is missing',

    // --- Success ---
    modalSuccessTitle: 'Thank you',
    modalSuccessSubtitle: 'Your form has been sent. We will contact you if anything needs clarifying',
    modalSuccessBtn: 'Close',

    // --- Misc ---
    chooseFile: 'Choose a file',
    fileHint: 'A phone photo is fine as long as the text is readable',
    notSpecified: 'Not specified',
    remove: 'Remove',
    required: 'Please fill this in',
    invalidFormat: 'Check the format',
    fileRequired: 'Please attach a file',
    selectAtLeastOne: 'Select at least one option',
    mailFileNameProtocol: 'protocol_IndSafety',
    mailFileNameElectro: 'cert_ElecSafety',
    mailFileNameLicence: 'driving_licence',
    mailFileNameOther: 'training',
  },
};

export default translations;
