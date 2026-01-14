const COURSES_TO_REGISTER = [
    { 
        course_name: "CS4037-Introduction to Coud Computing", 
        section_preferences: ["A", "B", "C"] 
    },
    { 
        course_name: "CS4037-Introduction to Cloud Computing", 
        section_preferences: ["A", "B", "C"] 
    },
    { 
        course_name: "MG4011-Entrepreneurship", 
        section_preferences: ["B", "A"] 
    },
    { 
        course_name: "CS4104-Applied Machine Learning", 
        section_preferences: ["C", "A"] 
    },
    { 
        course_name: "CS4048-Data Science", 
        section_preferences: ["B", "A"] 
    },
    { 
        course_name: "CS4092-Final Year Project - II", 
        section_preferences: ["A"] 
    }
];

const DEFAULT_REFRESH_SEC = 5;
let isProcessing = false;
const realConfirm = window.confirm;
let refreshIntervalMs = DEFAULT_REFRESH_SEC * 1000;

const log = (...args) => console.log("[AutoReg]", ...args);

const normalize = (t) => (t || "").replace(/\s+/g, ' ').trim().toLowerCase();

function findCourseTable() {
    return document.querySelector("table.searchable-table") ||
        Array.from(document.querySelectorAll("table"))
            .find(t => t.querySelector("select") && t.querySelector("input[type='checkbox']"));
}

function findCourseRow(rows, want) {
    return rows.find(r => {
        const codeEl = r.querySelector('.course-code');
        if (codeEl && normalize(codeEl.textContent) === want) return true;
        const cells = r.querySelectorAll('td');
        for (const cell of cells) {
            const cellText = normalize(cell.textContent);
            if (cellText === want || cellText.includes(want)) return true;
        }
        return normalize(r.innerText).includes(want);
    });
}

function findSectionOption(select, preferences) {
    for (const pref of preferences || []) {
        const opt = Array.from(select.options).find(o =>
            extractSection(o.text) === pref.toUpperCase()
        );
        if (opt) {
            const seats = parseSeats(opt.text);
            if (seats === null || seats > 0) return opt;
        }
    }
    return Array.from(select.options).find(o => {
        const s = parseSeats(o.text);
        return s === null || s > 0;
    });
}

function findRegisterCheckbox(row) {
    return row.querySelector('input[type="checkbox"]') ||
        row.querySelector('input[type="checkbox"].RegisterChkbox');
}

function findSubmitButton() {
    return document.getElementById("submit") ||
        Array.from(document.querySelectorAll("button,input[type=submit]"))
            .find(b => /submit|register/i.test(b.innerText || b.value));
}

function checkCourseLimits() {
    const crslimitEl = document.getElementById('crslimit');
    const alreadyregEl = document.getElementById('alreadyreg');
    const selecrslimitEl = document.getElementById('selecrslimit');
    if (crslimitEl && alreadyregEl && selecrslimitEl) {
        const maxLimit = parseInt(crslimitEl.textContent.trim()) || 99;
        const alreadyRegistered = parseInt(alreadyregEl.textContent.trim()) || 0;
        const currentlySelected = parseInt(selecrslimitEl.textContent.split('+')[0].trim()) || 0;
        const totalCourses = alreadyRegistered + currentlySelected;
        return {
            limitReached: totalCourses >= maxLimit,
            statusStr: `Status: ${totalCourses}/${maxLimit}`
        };
    }
    return { limitReached: false, statusStr: null };
}

function dispatchChange(el) {
    if (!el) return;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    if (window.jQuery) jQuery(el).trigger('change');
}

function extractSection(text) {
    if (!text) return null;
    let m = text.match(/\bsection\s*[:\-]?\s*([A-C])\b/i) || 
            text.match(/[A-Z]-?\d*([A-C])\b/) || 
            text.match(/\b([A-C])\b/);
    return m ? m[1].toUpperCase() : null;
}

function parseSeats(text) {
    const m = text.match(/(\d+)\s*(seat|seats)?/i);
    if (m) return parseInt(m[1], 10);
    if (/no\s*seat|full|0\b/i.test(text)) return 0;
    if (/available|vacant|open/i.test(text)) return Infinity;
    return null; 
}

function isRegistrationClosed(pageText) {
    const closedPatterns = [
        /offering not complete yet contact academics\.?/i,
        /registration not open yet/i,
        /registration.*not active yet/i,
        /registration.*not started/i,
        /not active yet/i,
        /not started yet/i,
        /registration.*closed/i
    ];
    return closedPatterns.some(re => re.test(pageText));
}

function handleAutoRefresh() {
    const pageText = document.body ? document.body.innerText : '';
    if (isRegistrationClosed(pageText)) {
        log(`Registration not open yet, refreshing after ${refreshIntervalMs / 1000} seconds...`);
        setTimeout(() => {
            location.reload();
        }, refreshIntervalMs);
        return true;
    }
    return false;
}

function autoRegisterWrapper() {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['autoRegisterEnabled'], data => {
            if (data.autoRegisterEnabled === false) {
                log('Auto Register is OFF');
                return;
            }
            registerCourses(COURSES_TO_REGISTER);
        });
    } else {
        registerCourses(COURSES_TO_REGISTER);
    }
}

function registerCourses(courses) {
    if (isProcessing) return;

    const { limitReached, statusStr } = checkCourseLimits();
    if (statusStr) log(statusStr);
    if (limitReached) {
        log('Limit reached');
        isProcessing = false;
        return;
    }

    const table = findCourseTable();
    if (!table) {
        log('Table not found');
        return;
    }

    isProcessing = true;
    let anyMarked = false;
    const rows = Array.from(table.querySelectorAll('tbody tr'));

    courses.forEach(course => {
        const want = normalize(course.course_name);
        const row = findCourseRow(rows, want);
        if (!row) {
            log(`Not found: ${course.course_name}`);
            return;
        }
        const select = row.querySelector('select') || row.querySelector('select.section');
        const checkbox = findRegisterCheckbox(row);
        if (!select || !checkbox) {
            log(`Missing controls for ${course.course_name}`);
            return;
        }
        const chosen = findSectionOption(select, course.section_preferences);
        if (chosen) {
            select.value = chosen.value;
            dispatchChange(select);
            const sectionId = chosen.getAttribute('id') || chosen.getAttribute('Id') || chosen.id;
            if (sectionId) {
                checkbox.setAttribute('value', sectionId);
                checkbox.value = sectionId;
            }
            if (!checkbox.checked) {
                checkbox.checked = true;
                dispatchChange(checkbox);
            }
            anyMarked = true;
            log(`${course.course_name} -> ${chosen.text}`);
        } else {
            log(`No available sections for ${course.course_name}`);
        }
    });

    if (anyMarked) {
        window.confirm = () => true;
        const btn = findSubmitButton();
        if (btn) {
            log('Submitting...');
            btn.click();
        }
        setTimeout(() => { window.confirm = realConfirm; }, 2000);
    }
    isProcessing = false;
}

function init() {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['refreshInterval'], data => {
            const savedInterval = data.refreshInterval ? data.refreshInterval * 1000 : DEFAULT_REFRESH_SEC * 1000;
            start(savedInterval);
        });
    } else {
        const i = parseInt(localStorage.getItem('refreshInterval') || DEFAULT_REFRESH_SEC);
        start(i * 1000);
    }
}

function start(interval) {
    refreshIntervalMs = Math.max(interval, 3000); 
    log("Watcher active. Interval:", refreshIntervalMs, "ms");
    
    const runLoop = () => {
        if (handleAutoRefresh()) {
            setTimeout(runLoop, refreshIntervalMs);
            return;
        }
        if (!isProcessing) {
            autoRegisterWrapper();
        }
        setTimeout(runLoop, refreshIntervalMs);
    };
    runLoop();
}

init();
