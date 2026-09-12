// Сводная таблица работника: ровно 52 колонки в заданном порядке.
// Здесь же считаются производные колонки (К47–К52), чтобы и Excel,
// и Word, и письмо строились из одного набора данных.

const PROTOCOL_SLOTS = 5; // К27–К41
const TRAINING_SLOTS = 5; // К42–К46
const ATTESTATION_VALID_YEARS = 5;

// Отделы, работникам которых программа «В» нужна независимо от других ответов
const DEPARTMENTS_REQUIRING_GROUP_V = ['CM', 'HSES'];

/* ------------------------------------------------------------------ */
/* Работа с датами                                                     */
/* ------------------------------------------------------------------ */
function parseRuDate(value) {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(value || '').trim());
    if (!match) return null;
    const day = +match[1];
    const month = +match[2];
    const year = +match[3];
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCDate() !== day || date.getUTCMonth() !== month - 1) return null;
    return date;
}

/** Сколько дней осталось до конца пятилетнего срока действия протокола */
// Объекты стоят на Чукотке (Билибино, Порт Чаун, Песчанка) — это UTC+12,
// а сервер может жить в любом поясе. Без явного пояса «сегодня» на сервере
// десять часов в сутки не совпадает с «сегодня» на площадке, и остаток срока
// действия удостоверения выходит на день больше или меньше.
const SITE_TIME_ZONE = 'Asia/Anadyr';

function todayOnSite(timeZone = SITE_TIME_ZONE) {
    // en-CA даёт ровно ГГГГ-ММ-ДД — разбирать нечего
    let parts;
    try {
        parts = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
            .format(new Date())
            .split('-')
            .map(Number);
    } catch {
        const now = new Date(); // пояс неизвестен системе — считаем по серверу
        parts = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
    }
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
}

function daysLeft(dateString, years = ATTESTATION_VALID_YEARS) {
    const issued = parseRuDate(dateString);
    if (!issued) return null;
    const expires = Date.UTC(issued.getUTCFullYear() + years, issued.getUTCMonth(), issued.getUTCDate());
    return Math.round((expires - todayOnSite()) / 86400000);
}

/* ------------------------------------------------------------------ */
/* Транслитерация — если английское имя не пришло из админки           */
/* ------------------------------------------------------------------ */
const TRANSLIT = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y',
    ь: '', э: 'e', ю: 'yu', я: 'ya'
};

function transliterate(text) {
    if (!text) return '';
    return String(text)
        .split('')
        .map((ch) => {
            const lower = ch.toLowerCase();
            const replacement = TRANSLIT[lower];
            if (replacement === undefined) return ch;
            return ch === lower ? replacement : replacement.toUpperCase();
        })
        .join('')
        .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Описание колонок                                                    */
/* ------------------------------------------------------------------ */
// number — номер колонки из согласованного списка (К1…К52)
// group  — смысловой блок, по нему собирается Word-досье
const COLUMNS = [
    { n: 1, key: 'status', header: 'Статус', width: 10, group: 'meta' },
    { n: 2, key: 'employer', header: 'Основное место работы', width: 16, group: 'employee' },
    { n: 3, key: 'fullName', header: 'ФИО', width: 24, group: 'employee' },
    { n: 4, key: 'nameLatin', header: 'Name', width: 20, group: 'employee' },
    { n: 5, key: 'positionRu', header: 'Должность', width: 20, group: 'employee' },
    { n: 6, key: 'positionEn', header: 'Position', width: 20, group: 'employee' },
    { n: 7, key: 'department', header: 'Отдел', width: 9, group: 'employee' },
    { n: 8, key: 'rotationStart', header: 'Дата заезда на вахту', width: 11, group: 'employee' },
    { n: 9, key: 'birthDate', header: 'Дата рождения', width: 11, group: 'employee' },
    { n: 10, key: 'rotation', header: 'Длительность вахты', width: 10, group: 'employee' },
    { n: 11, key: 'workEmail', header: 'Рабочая почта', width: 24, group: 'employee' },
    { n: 12, key: 'personalEmail', header: 'Личная почта', width: 22, group: 'employee' },
    { n: 13, key: 'snils', header: 'СНИЛС', width: 14, group: 'employee' },
    { n: 14, key: 'citizenship', header: 'Гражданство', width: 12, group: 'employee' },
    { n: 15, key: 'phone', header: 'Телефон', width: 18, group: 'employee' },
    { n: 16, key: 'inn', header: 'ИНН', width: 14, group: 'employee' },
    { n: 17, key: 'education', header: 'Образование (для ЭБ)', width: 22, group: 'employee' },

    { n: 18, key: 'passportNumber', header: 'Серия номер', width: 14, group: 'passport' },
    { n: 19, key: 'passportIssuedBy', header: 'Кем выдан', width: 26, group: 'passport' },
    { n: 20, key: 'passportDate', header: 'Когда выдан', width: 11, group: 'passport' },
    { n: 21, key: 'passportCode', header: 'Код подразделения', width: 10, group: 'passport' },

    { n: 22, key: 'licenceNumber', header: 'Номер', width: 13, group: 'licence' },
    { n: 23, key: 'licenceDate', header: 'Дата выдачи', width: 11, group: 'licence' },
    { n: 24, key: 'licenceCategories', header: 'Категории', width: 13, group: 'licence' },

    { n: 25, key: 'electroGroup', header: 'Эл. Без. Гр', width: 9, group: 'existing' },
    { n: 26, key: 'electroDate', header: 'Эл. Без. Дата', width: 11, group: 'existing' },
];

// К27–К41: по три колонки на каждый из пяти протоколов
for (let i = 1; i <= PROTOCOL_SLOTS; i += 1) {
    const base = 27 + (i - 1) * 3;
    COLUMNS.push(
        { n: base, key: `protocol${i}Number`, header: `Пром. Без протокол ${i} №`, width: 16, group: 'protocols' },
        { n: base + 1, key: `protocol${i}Areas`, header: `Пром. Без протокол ${i} литеры`, width: 16, group: 'protocols' },
        { n: base + 2, key: `protocol${i}Date`, header: `Пром. Без протокол ${i} дата`, width: 11, group: 'protocols' }
    );
}

// К42–К46: другие обучения
for (let i = 1; i <= TRAINING_SLOTS; i += 1) {
    COLUMNS.push({ n: 41 + i, key: `training${i}`, header: `Другие ${i}`, width: 24, group: 'trainings' });
}

COLUMNS.push(
    { n: 47, key: 'height', header: 'Высота', width: 10, group: 'needs' },
    { n: 48, key: 'confined', header: 'ОЗП', width: 10, group: 'needs' },
    { n: 49, key: 'electro', header: 'Эл. Без.', width: 28, group: 'needs' },
    { n: 50, key: 'prom', header: 'Пром. Без.', width: 34, group: 'needs' },
    { n: 51, key: 'groupV', header: 'Группа В', width: 22, group: 'needs' },
    { n: 52, key: 'svp', header: 'SVP', width: 12, group: 'needs' }
);

function buildColumns() {
    return COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
}


/* ------------------------------------------------------------------ */
/* Строка для вставки в таблицу                                        */
/* ------------------------------------------------------------------ */
// Только значения, без заголовков, все 52 ячейки — включая пустые.
// Пустые ячейки обязательны: без них колонки при вставке съедут.
// Один код на анкету работника и на заявку визитёра, чтобы формат совпадал.

const escapeHtml = (value) =>
    String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

/** Одна строка HTML-таблицы: 52 ячейки значений */
// Колонки нарочно очень узкие: строку из 52 значений надо уметь выделить
// одним движением и вставить в Excel. Текст в ячейках остаётся полным —
// он копируется целиком, даже если на экране не виден.
function buildCopyRowHtml(row) {
    const cells = COLUMNS.map(
        (c) =>
            `<td style="font:8px Arial;color:#16203A;padding:1px 2px;border:1px solid #DDE3EC;` +
            `width:12px;max-width:12px;overflow:hidden;white-space:nowrap;vertical-align:top;">${escapeHtml(
                row[c.key]
            )}</td>`
    ).join('');
    return `<table style="border-collapse:collapse;table-layout:fixed;"><tr>${cells}</tr></table>`;
}

// В теле письма имя пишем сокращённо: «Иванов И.И.» вместо полного ФИО
function shortName(fullName) {
    const parts = String(fullName || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (!parts.length) return '';
    const [surname, ...rest] = parts;
    const initials = rest.map((word) => `${word[0].toUpperCase()}.`).join('');
    return initials ? `${surname} ${initials}` : surname;
}

/** Та же строка через табуляцию — ею кормится кнопка копирования */
function buildCopyRowTsv(row) {
    return COLUMNS.map((c) => {
        const value = row[c.key];
        // Табуляции и переводы строк внутри значения разорвали бы строку на ячейки
        return String(value === undefined || value === null ? '' : value).replace(/[\t\r\n]+/g, ' ');
    }).join('\t');
}

/** Порядок колонок подписью — рядом с таблицей, но не внутри неё */
function columnOrderHint() {
    return COLUMNS.map((c, i) => `${i + 1}. ${c.header}`).join(' · ');
}

/* ------------------------------------------------------------------ */
/* Совместимость со старым форматом анкеты                             */
/* ------------------------------------------------------------------ */
/**
 * Боевая и тестовая версии анкеты работают с одним бэкендом, а старая версия
 * присылает поля по-другому. Пока обе живут параллельно, разбираем оба варианта.
 * После переключения прода этот блок можно удалить.
 */
function normalizePayload(raw) {
    const data = { ...raw };

    if (!Array.isArray(data.phones)) {
        data.phones = data.phone ? [data.phone] : [];
    }

    if (!data.passport && data.passportSeriesNumber) {
        data.passport = {
            number: data.passportSeriesNumber,
            issuedBy: data.passportIssuedBy || '',
            issueDate: data.passportIssueDate || '',
            deptCode: data.passportDeptCode || ''
        };
    }

    if (!Array.isArray(data.protocols)) {
        data.protocols = [];
        // В старой версии протоколы приходили одной строкой
        if (data.promDetails) data.legacyPromDetails = data.promDetails;
    }

    if (!data.electroGroup && !data.electroEducation && data.electroDetails) {
        data.electroEducation = data.electroDetails;
    }

    if (!Array.isArray(data.trainings)) {
        data.trainings = String(data.otherTrainingsDetails || '')
            .split(';')
            .map((title) => title.trim())
            .filter(Boolean)
            .map((title) => ({ code: '', title, issueDate: '' }));
    }

    if (!data.personalIdValue && data.snils) {
        data.personalIdValue = data.snils;
    }

    return data;
}

/* ------------------------------------------------------------------ */
/* Сборка строки                                                       */
/* ------------------------------------------------------------------ */
function groupText(work, approve) {
    if (work && approve) return '2, 3 гр.';
    if (work) return '2 гр.';
    if (approve) return '3 гр.';
    return 'не требуется';
}

function buildSummaryRow(data) {
    const protocols = Array.isArray(data.protocols) ? data.protocols : [];
    const trainings = Array.isArray(data.trainings) ? data.trainings : [];
    const phones = Array.isArray(data.phones) ? data.phones : data.phone ? [data.phone] : [];
    const passport = data.passport || {};
    const licence = data.licence || {};

    const row = {};
    COLUMNS.forEach((c) => {
        row[c.key] = '';
    });

    // Заявка визитёра идёт тем же набором из 52 колонок, чтобы строку можно было
    // вставить в ту же таблицу. Заполняется только то, что у визитёра спросили;
    // направления посещения и характер работ в колонки не кладём — их место
    // в теле письма. Обучения не трогаем вовсе: у визитёра про них не спрашивали,
    // и «не требуется» было бы выдумкой.
    if (data.formType === 'visitor') {
        row.status = 'Visitor';
        row.fullName = String(data.fullName || '').trim();
        row.nameLatin = transliterate(row.fullName);
        row.positionRu = String(data.position || '').trim();
        row.birthDate = String(data.birthDate || '').trim();
        row.personalEmail = String(data.email || '').trim();
        row.phone = String(data.phone || '').trim();
        return row;
    }

    /* --- К1–К17: работник --- */
    row.status = 'Employed';
    row.employer = data.employer || '';
    // Колонка ФИО остаётся кириллической даже тогда, когда анкету заполняли
    // на английском и в видимом поле стояла латиница. Старые анкеты поля
    // fioRu не присылают — для них поведение прежнее.
    row.fullName = data.fioRu || data.employeeName || '';
    row.nameLatin =
        data.nameEn || data.surnameEn
            ? `${data.nameEn || ''} ${data.surnameEn || ''}`.trim().toUpperCase()
            : transliterate(data.employeeName);
    row.positionRu = data.positionRu || '';
    row.positionEn = data.positionEn || '';
    row.department = data.department || '';
    row.rotationStart = data.rotationStart || '';
    row.birthDate = data.birthDate || '';
    row.rotation = data.rotation || '';
    row.workEmail = data.workEmail || '';
    row.personalEmail = data.personalEmail || '';
    // Для иностранцев в этой колонке лежит ИИН или личный номер
    row.snils = data.snils || data.personalIdValue || '';
    row.citizenship = data.citizenship || '';
    row.phone = phones.filter(Boolean).join('; ');
    row.inn = data.inn || '';
    row.education = data.electroEducation || '';

    /* --- К18–К21: паспорт --- */
    row.passportNumber = passport.number || '';
    row.passportIssuedBy = passport.issuedBy || '';
    row.passportDate = passport.issueDate || '';
    row.passportCode = passport.deptCode || '';

    /* --- К22–К24: водительское удостоверение --- */
    row.licenceNumber = licence.number || '';
    row.licenceDate = licence.date || '';
    row.licenceCategories = (licence.categories || []).join(', ');

    /* --- К25–К26: действующая группа по электробезопасности --- */
    row.electroGroup = data.electroGroup || '';
    row.electroDate = data.electroDate || '';

    /* --- К27–К41: протоколы промышленной безопасности --- */
    for (let i = 1; i <= PROTOCOL_SLOTS; i += 1) {
        const protocol = protocols[i - 1];
        if (!protocol) continue;
        const venue = protocol.venue ? ` (${protocol.venue})` : '';
        row[`protocol${i}Number`] = `${protocol.number || ''}${venue}`.trim();
        row[`protocol${i}Areas`] = (protocol.areas || []).join(', ');
        row[`protocol${i}Date`] = protocol.date || '';
    }

    /* --- К42–К46: другие обучения --- */
    trainings.slice(0, TRAINING_SLOTS).forEach((training, index) => {
        if (!training.title) return;
        row[`training${index + 1}`] = training.issueDate
            ? `${training.title} (от ${training.issueDate})`
            : training.title;
    });

    /* --- К47–К48: высота и замкнутые пространства --- */
    row.height = groupText(data.heightClimb, data.heightApprove);
    row.confined = groupText(data.confinedWork, data.confinedApprove);

    /* --- К49: электробезопасность --- */
    if (data.electroStatusRaw === 'dont_need') {
        row.electro = 'не требуется';
    } else if (data.electroStatusRaw === 'need') {
        row.electro = 'Требуется';
    } else if (data.electroStatusRaw === 'have') {
        const group = data.electroGroup ? `${data.electroGroup} группа` : 'группа не указана';
        row.electro = `требуется + имеется с предыдущего места работы (${group})`;
    }

    /* --- К50: промышленная безопасность со сроком действия --- */
    if (data.promStatusRaw === 'dont_need') {
        row.prom = 'не требуется';
    } else if (data.promStatusRaw === 'need') {
        row.prom = 'Требуется';
    } else if (data.promStatusRaw === 'have') {
        const areas = [...new Set(protocols.flatMap((p) => p.areas || []))];
        let areasText = 'литеры не указаны';
        if (areas.length) areasText = `${areas.join(', ')} литеры`;
        else if (data.legacyPromDetails) areasText = data.legacyPromDetails;

        // Берём ближайший к окончанию протокол — он определяет, когда нужно переобучение
        const remaining = protocols
            .map((p) => daysLeft(p.date))
            .filter((value) => value !== null);
        const soonest = remaining.length ? Math.min(...remaining) : null;

        let validity = '';
        if (soonest !== null) {
            validity = soonest >= 0 ? `, действ. ${soonest} дней` : `, ПРОСРОЧЕН на ${Math.abs(soonest)} дней`;
        }
        row.prom = `имеется с предыдущего места работы (${areasText})${validity}`;
    }

    /* --- К51: программа «В» --- */
    const reasons = [];
    if (DEPARTMENTS_REQUIRING_GROUP_V.includes(row.department)) reasons.push(row.department);
    if (data.heightClimb || data.heightApprove) reasons.push('высота');
    if (data.confinedWork || data.confinedApprove) reasons.push('ОЗП');
    if (['have', 'need'].includes(data.electroStatusRaw)) reasons.push('ЭБ');
    if (['have', 'need'].includes(data.promStatusRaw)) reasons.push('ПБ');
    row.groupV = reasons.length ? `Требуется (${reasons.join(', ')})` : '';

    /* --- К52 --- */
    row.svp = data.driveWill ? 'требуется' : 'не требуется';

    return row;
}

module.exports = {
    COLUMNS,
    buildCopyRowHtml,
    buildCopyRowTsv,
    shortName,
    columnOrderHint,
    escapeHtml,
    normalizePayload,
    PROTOCOL_SLOTS,
    TRAINING_SLOTS,
    buildColumns,
    buildSummaryRow,
    transliterate,
    daysLeft,
    todayOnSite,
    SITE_TIME_ZONE,
    parseRuDate,
};
