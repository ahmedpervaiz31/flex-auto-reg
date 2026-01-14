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

/* --- Helpers --- */
const log = (...args) => console.log("[AutoReg]", ...args);
const normalize = (t) => (t || "").replace(/\s+/g, ' ').trim().toLowerCase();

function dispatchChange(el) {
    if (!el) return;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    if (window.jQuery) jQuery(el).trigger('change');
}

function extractSection(text) {
    if (!text) return null;
    // Matches "Section A", "(A)", "BCS-3A", or "A (17)"
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

/* --- Core Logic --- */
function registerCourses(courses) {
    if (isProcessing) return;
    
    // Flexible registration open checker
    const pageText = document.body ? document.body.innerText : '';
    const closedPatterns = [
        /offering not complete yet contact academics\.?/i,
        /registration not open yet/i,
        /registration.*not active yet/i,
        /registration.*not started/i,
        /not active yet/i,
        /not started yet/i,
        /registration.*closed/i
    ];
    if (closedPatterns.some(re => re.test(pageText))) {
        log(`⏳ Registration not open yet, refreshing after ${DEFAULT_REFRESH_SEC} seconds...`);
        isProcessing = false;
        setTimeout(() => {
            location.reload();
        }, refreshIntervalMs);
        return;
    }

    // FIX 3: Check course limits
    const crslimitEl = document.getElementById('crslimit');
    const alreadyregEl = document.getElementById('alreadyreg');
    const selecrslimitEl = document.getElementById('selecrslimit');
    
    if (crslimitEl && alreadyregEl && selecrslimitEl) {
        const maxLimit = parseInt(crslimitEl.textContent.trim()) || 99;
        const alreadyRegistered = parseInt(alreadyregEl.textContent.trim()) || 0;
        const currentlySelected = parseInt(selecrslimitEl.textContent.split('+')[0].trim()) || 0;
        const totalCourses = alreadyRegistered + currentlySelected;
        
        log(`📊 Status: ${totalCourses}/${maxLimit}`);
        
        if (totalCourses >= maxLimit) {
            log(`Limit reached`);
            isProcessing = false;
            return;
        }
    }
    
    const table = document.querySelector("table.searchable-table") || 
                  Array.from(document.querySelectorAll("table"))
                      .find(t => t.querySelector("select") && t.querySelector("input[type='checkbox']"));
    
    if (!table) {
        log("❌ Table not found");
        return;
    }

    isProcessing = true;
    let anyMarked = false;
    const rows = Array.from(table.querySelectorAll('tbody tr'));

    courses.forEach(course => {
        const want = normalize(course.course_name);
        
        // ✅ SAFER: Try multiple methods to find the course
        const row = rows.find(r => {
            // Method 1: Look for .course-code element (most specific)
            const codeEl = r.querySelector('.course-code');
            if (codeEl && normalize(codeEl.textContent) === want) {
                return true;
            }
            
            // Method 2: Check first td or any td with course-like content
            const cells = r.querySelectorAll('td');
            for (const cell of cells) {
                const cellText = normalize(cell.textContent);
                // Match course code pattern like "CS4037-Introduction to Cloud Computing"
                if (cellText === want || cellText.includes(want)) {
                    return true;
                }
            }
            
            // Method 3: Fallback to full row text (original method)
            return normalize(r.innerText).includes(want);
        });
        
        if (!row) {
            log(`Not found: ${course.course_name}`);
            return;
        }

        const select = row.querySelector('select') || row.querySelector('select.section');
        const checkbox = row.querySelector('input[type="checkbox"]') || 
                        row.querySelector('input[type="checkbox"].RegisterChkbox');
        
        if (!select || !checkbox) {
            log(`Missing controls for ${course.course_name}`);
            return;
        }

        let chosen = null;
        
        // Try preferences
        for (const pref of course.section_preferences || []) {
            const opt = Array.from(select.options).find(o => 
                extractSection(o.text) === pref.toUpperCase()
            );
            if (opt) {
                const seats = parseSeats(opt.text);
                if (seats === null || seats > 0) {
                    chosen = opt;
                    break;
                }
            }
        }
        
        // Fallback
        if (!chosen) {
            chosen = Array.from(select.options).find(o => {
                const s = parseSeats(o.text);
                return s === null || s > 0;
            });
        }

        if (chosen) {
            select.value = chosen.value;
            dispatchChange(select);
            
            // FIX 2: Capture section ID (try both 'id' and 'Id')
            const sectionId = chosen.getAttribute('id') || 
                            chosen.getAttribute('Id') || 
                            chosen.id;
            
            if (sectionId) {
                checkbox.setAttribute('value', sectionId);
                checkbox.value = sectionId; // Also set value property
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
        const btn = document.getElementById("submit") || 
                    Array.from(document.querySelectorAll("button,input[type=submit]"))
                    .find(b => /submit|register/i.test(b.innerText || b.value));
        
        if (btn) {
            log("Submitting...");
            btn.click();
        }
        setTimeout(() => { window.confirm = realConfirm; }, 2000);
    }
    isProcessing = false;
}

/* --- Initialization Fix --- */
function init() {
    // Check Chrome storage for the saved interval, otherwise use default
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['refreshInterval'], data => {
            // Convert seconds from storage to milliseconds
            const savedInterval = data.refreshInterval ? data.refreshInterval * 1000 : DEFAULT_REFRESH_SEC * 1000;
            start(savedInterval);
        });
    } else {
        const i = parseInt(localStorage.getItem('refreshInterval') || DEFAULT_REFRESH_SEC);
        start(i * 1000);
    }
}

function start(interval) {
    // Assign to the existing global variable refreshIntervalMs
    refreshIntervalMs = Math.max(interval, 3000); 
    log("Watcher active. Interval:", refreshIntervalMs, "ms");
    
    // Use a single controlled loop instead of overlapping setInterval/MutationObserver
    const runLoop = () => {
        if (!isProcessing) {
            autoRegisterWrapper();
        }
        setTimeout(runLoop, refreshIntervalMs);
    };
    runLoop();
}

init();
