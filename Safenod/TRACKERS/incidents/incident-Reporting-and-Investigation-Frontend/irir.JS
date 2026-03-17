// ============================================================
// TABLE OF CONTENTS
// 1.  API CONFIGURATION & TOKEN MANAGEMENT
// 2.  DROPDOWN CODE MAPS
// 3.  LOCALSTORAGE PERSISTENCE
// 4.  STATE VARIABLES
// 5.  APP INIT & BACKEND SYNC
// 6.  BACKEND → FRONTEND DATA MAPPER
// 7.  TIME UTILITIES
// 8.  FORM SUBMISSION
// 9.  FORM RESET & HELPERS
// 10. DYNAMIC CORRECTIVE ACTIONS TABLE (Create Modal)
// 11. AUTO-CREATE CAPAs FROM IRIR
// 12. COST CALCULATION
// 13. TABLE RENDERING
// 14. ADD ROW / STATUS BADGE
// 15. INLINE EDITING (Table Cells)
// 16. STATUS COUNTERS
// 17. COLUMN TOGGLE
// 18. CHECKBOXES & BULK DELETE
// 19. SEARCH
// 20. FILTERS
// 21. HEADER DROPDOWNS
// 22. DETAIL SIDE PANEL
// 23. DETAIL PANEL — SAVE CHANGES (Full + Part A/B/C/D)
// 24. DETAIL PANEL — DELETE
// 25. MODAL OPEN / CLOSE
// 26. SHARE MODAL
// 27. EXPORT FUNCTIONS
// 28. HELPERS (download, escapeXml)
// 29. PART SAVE BUTTONS (Create Form)
// 30. SUCCESS NOTIFICATION
// 31. GLOBAL CLICK HANDLER (close dropdowns)
// 32. TIME PICKER
// 33. AI SEARCH
// 34. FIELD CHANGE HANDLERS
// 35. DYNAMIC EFFECTIVENESS MONTHS (Create Modal)
// 36. DYNAMIC EFFECTIVENESS MONTHS (Detail Panel)
// 37. DYNAMIC CAPA CARDS (Detail Panel)
// 38. NAV BUTTONS
// ============================================================


// ============================================================
// 1. API CONFIGURATION & TOKEN MANAGEMENT
// ============================================================

console.log('🛡️ IRIR Tracker - Starting...');

const API_BASE_URL = "http://localhost:8000/api"; // 🔧 Change to live URL when deploying

async function autoLogin() {
    try {
        const response = await fetch("http://127.0.0.1:8000/api/token/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "admin@safenod",
                password: "admin1234"
            })
        });
        const data = await response.json();
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        console.log("✅ IRIR Auto login success");
    } catch (error) {
        console.error("❌ IRIR login failed:", error);
    }
}

function getApiHeaders() {
    const token = localStorage.getItem('access');
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    };
}

// Reads token from localStorage — backend team sets this directly
async function getValidToken() {
    const access = localStorage.getItem('access');
    if (!access || access === 'null' || access === 'undefined' || access.trim() === '') {
        console.warn('⚠️ No token found in localStorage. Backend team please set access token.');
        return null;
    }
    return access;
}


// NOTE: Remove hardcoded credentials from autoLogin() before deploying to production

// ============================================================
// 2. DROPDOWN CODE MAPS
// ============================================================

const DROPDOWN_MAPS = {
    // ✅ Exact codes verified against backend spec
    accident_incident: {
        'Reportable':     'REPORTABLE',
        'Non-reportable': 'NON_REPORTABLE',
        'First Aid':      'FIRST_AID',
        'Nearmiss':       'NEARMISS',   // HTML form value
        'Near miss':      'NEARMISS',   // backend spec label
        'Near Miss':      'NEARMISS',   // capitalisation variant
        'Environment':    'ENVIRONMENT',
        'Fire':           'FIRE'
    },
    employee_category: {
        'Executive':            'EXECUTIVE',
        'Permanent Associate':  'PERMANENT_ASSOCIATE',
        'Casual Labour':        'CASUAL_LABOUR',
        'Apprentice':           'APPRENTICE',
        'Contractor':           'CONTRACTOR',
        'Others':               'OTHERS'
    },
    shift: {
        'A (01:00 am – 08:00 am)': 'A',
        'B (08:00 am – 04:30 pm)': 'B',
        'C (04:30 pm – 01:00 am)': 'C'
    },
    gender: {
        'Male':        'MALE',
        'Female':      'FEMALE',
        'Transgender': 'TRANSGENDER'
    },
    activity: {
        'Routine':     'ROUTINE',
        'Non-Routine': 'NON_ROUTINE', // HTML form uses capital R
        'Non-routine': 'NON_ROUTINE'  // backend spec uses lowercase r
    },
    injury_type: {
        'Cut / Laceration':      'CUT_LACERATION',
        'Fracture':              'FRACTURE',
        'Burn':                  'BURN',
        'Crush Injury':          'CRUSH_INJURY',
        'Sprain / Strain':       'SPRAIN_STRAIN',
        'Abrasion':              'ABRASION',
        'Eye Injury':            'EYE_INJURY',
        'Chemical Exposure':     'CHEMICAL_EXPOSURE',
        'Electric Shock':        'ELECTRIC_SHOCK',
        'No Injury (Near Miss)': 'NO_INJURY', // HTML form text
        'No Injury':             'NO_INJURY'  // backend spec label
    },
    body_part: {
        'Head':   'HEAD',
        'Eye':    'EYE',
        'Face':   'FACE',
        'Hand':   'HAND',
        'Finger': 'FINGER',
        'Arm':    'ARM',
        'Leg':    'LEG',
        'Foot':   'FOOT',
        'Back':   'BACK',
        'Chest':  'CHEST'
    },
    shop: {
        'Production':  'PRODUCTION',
        'Assembly':    'ASSEMBLY',
        'Maintenance': 'MAINTENANCE',
        'Quality':     'QUALITY',
        'Warehouse':   'WAREHOUSE',
        'Utility':     'UTILITY',
        'Packing':     'PACKING',
        'Others':      'OTHERS'
    },
    work_permit: {
        'Yes': 'YES',
        'No':  'NO'
    },
    capa_type: {
        'Elimination':             'ELIMINATION',
        'Substitution':            'SUBSTITUTION',
        'Engineering Controls':    'ENGINEERING_CONTROLS',
        'Administrative Controls': 'ADMINISTRATIVE_CONTROLS',
        'PPE':                     'PPE'
    },
    capa_status: {
        'Open':   'OPEN',
        'Close':  'CLOSED', // HTML CAPA row uses 'Close'
        'Closed': 'CLOSED'  // detail panel uses 'Closed'
    },
    yes_no: {
        'Yes': 'YES',
        'No':  'NO'
    },
    reoccurrence: {
        'Yes': 'YES',
        'No':  'NO'
    }
};

function mapCode(mapKey, value) {
    if (!value) return '';
    const map = DROPDOWN_MAPS[mapKey];
    if (!map) {
        console.warn('⚠️ mapCode: unknown map key:', mapKey);
        return value;
    }
    const code = map[value];
    if (code === undefined) {
        console.warn(`⚠️ mapCode: no mapping for "${value}" in "${mapKey}" — sending raw value. CHECK SPELLINGS!`);
        return value;
    }
    return code;
}


// ============================================================
// 3. LOCALSTORAGE PERSISTENCE
// ============================================================

const STORAGE_KEY = 'irirTrackerData';
const COUNTER_KEY = 'irirTrackerCounter';

function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allIrirs));
        localStorage.setItem(COUNTER_KEY, String(irirCounter));
    } catch (e) {
        console.error('❌ Failed to save:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const savedCounter = localStorage.getItem(COUNTER_KEY);
        if (saved) allIrirs = JSON.parse(saved);
        if (savedCounter) irirCounter = parseInt(savedCounter, 10);
    } catch (e) {
        allIrirs = [];
        irirCounter = 1;
    }
}


// ============================================================
// 4. STATE VARIABLES
// ============================================================

let allIrirs = [];
let irirCounter = 1;
let currentDetailIrirId = null;
const whyWhyState = {};  // 6M Why-Why chains — declared here so all functions can access it

const aiSuggestions = [
    "Show me all open incidents",
    "Find reportable incidents",
    "Which incidents need CAPA approval?",
    "Display all closed incidents",
    "Show incidents for Alwar plant",
    "Find near miss incidents",
    "List all first aid cases",
    "Show overdue CAPA target dates"
];
let typingInterval = null;
let currentSuggestionIndex = 0;
let currentCharIndex = 0;
let isTyping = false;


// ============================================================
// 5. APP INIT & BACKEND SYNC
// ============================================================

// Single init — always wait for DOM, never call twice
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already ready (script loaded with defer), call once
    initApp();
}

async function initApp() {
    await autoLogin();
    // Show empty state while loading
    document.getElementById('emptyState').style.display = '';
    document.getElementById('irirTable').style.display = 'none';
    // Attach form listener exactly once — remove old one first to prevent stacking on re-runs
    const form = document.getElementById('irirForm');
    if (form) {
        form.removeEventListener('submit', handleFormSubmit);
        form.addEventListener('submit', handleFormSubmit);
        console.log('✅ Form listener attached successfully');
    } else {
        console.error('❌ Form not found!');
    }
    // Delegate everything to the single refresh function
    await refreshTableFromBackend();
}

async function refreshTableFromBackend() {
    try {
        const token = localStorage.getItem("access");

        if (!token) {
            console.warn("⚠️ No token — using localStorage mode.");
            loadFromLocalStorage();
            renderTable();
            return;
        }

        const response = await fetch("http://127.0.0.1:8000/api/incidents/", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        // ✅ READ BODY ONLY ONCE
        const responseData = await response.json();

        if (!response.ok) {
            console.error("Backend error:", responseData);
            loadFromLocalStorage();
            renderTable();
            return;
        }

        console.log("✅ Loaded from backend:", responseData);

        allIrirs.length = 0;
        responseData.forEach(item => {
            allIrirs.push(mapBackendToFrontend(item));
        });

        renderTable();

    } catch (error) {
        console.warn("⚠️ Backend unreachable — using localStorage.", error);
        loadFromLocalStorage();
        renderTable();
    }
}

function generateIrirId() {
    // Use max existing ID number + 1 to guarantee no duplicates even after backend sync
    let maxNum = 0;
    allIrirs.forEach(irir => {
        const match = String(irir.irirId || '').match(/INC-(\d+)/i);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
    });
    const nextNum = Math.max(maxNum + 1, irirCounter);
    return `INC-${String(nextNum).padStart(3, '0')}`;
}

// ✅ Re-render table from allIrirs (localStorage). When backend is ready, this will fetch from API too.
function renderTable() {
    document.getElementById('irirTableBody').innerHTML = '';
    if (allIrirs.length > 0) {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('irirTable').style.display = 'table';
        [...allIrirs].reverse().forEach(irir => addIrirToTable(irir));
    } else {
        document.getElementById('emptyState').style.display = '';
        document.getElementById('irirTable').style.display = 'none';
    }
    updateStatusCounters();
    makeTableCellsEditable();
}


// ============================================================
// 6. BACKEND → FRONTEND DATA MAPPER
// ============================================================

function mapBackendToFrontend(b) {

    // 🔁 Reverse dropdown mapping helper
    const reverseMap = (map, code) => {
        const entry = Object.entries(map || {}).find(
            ([k, v]) => v === (code || '').toUpperCase()
        );
        return entry ? entry[0] : (code || '');
    };

    // 🔥 Parse 6M JSON safely
    const parseSixM = (val) => {
        try { return JSON.parse(val || '{}'); }
        catch (e) { return {}; }
    };

    // 🔥 Parse each 6M category
    const manObj         = parseSixM(b.six_m_man);
    const machineObj     = parseSixM(b.six_m_machine);
    const materialObj    = parseSixM(b.six_m_material);
    const methodObj      = parseSixM(b.six_m_method);
    const measurementObj = parseSixM(b.six_m_measurement);
    const natureObj      = parseSixM(b.six_m_mother_nature);

    return {

        // =========================
        // BASIC
        // =========================
        id:               b.id,
        incId:            b.inc_id || '',
        plant:            b.plant || '',
        type:             reverseMap(DROPDOWN_MAPS.accident_incident, b.accident_incident),
        employeeCategory: reverseMap(DROPDOWN_MAPS.employee_category, b.employee_category_involved),
        date:             b.date || '',
        time:             b.time || '',
        shift:            reverseMap(DROPDOWN_MAPS.shift, b.shift),
        gender:           reverseMap(DROPDOWN_MAPS.gender, b.gender),
        experienceYears:  b.experience_years || 0,
        experienceMonths: b.experience_months || 0,
        injuredName:      b.name_of_injured_person || '',
        employeeNo:       b.employee_no || '',
        injuryType:       reverseMap(DROPDOWN_MAPS.injury_type, b.injury_type),
        bodyPart:         reverseMap(DROPDOWN_MAPS.body_part, b.body_part_injured),
        department:       reverseMap(DROPDOWN_MAPS.shop, b.name_of_shop),
        location:         b.exact_location || '',

        // =========================
        // 5W1H
        // =========================
        narWhat:             b.what || '',
        narWhen:             b.when || '',
        narWhere:            b.where || '',
        narWho:              b.who || '',
        narWhich:            b.which || '',
        narHow:              b.how || '',
        immediateActions:    b.immediate_actions || '',
        preparedBy:          b.prepared_by || '',
        preparedDate:        b.prepared_date || '',
        workPermit:          reverseMap(DROPDOWN_MAPS.work_permit, b.work_permit_followed),
        workPermitDetails:   b.work_permit_details || '',
        activity:            reverseMap(DROPDOWN_MAPS.activity, b.activity),
        teamMemberName:      b.team_member_name || '',
        teamMemberDesignation: b.team_member_designation || '',
        witnessStatement:    b.witness_statement || '',

        // =========================
        // 6M CATEGORY (Inference)
        // =========================
        man:         manObj.category || '',
        machine:     machineObj.category || '',
        material:    materialObj.category || '',
        method:      methodObj.category || '',
        measurement: measurementObj.category || '',
        motherNature: natureObj.category || '',

        // =========================
        // WHY-WHY (Man)
        // =========================
        wwMan1: manObj.why1 || '', wwMan2: manObj.why2 || '', wwMan3: manObj.why3 || '',
        wwMan4: manObj.why4 || '', wwMan5: manObj.why5 || '', wwManRoot: manObj.root || '',

        // =========================
        // WHY-WHY (Machine)
        // =========================
        wwMachine1: machineObj.why1 || '', wwMachine2: machineObj.why2 || '', wwMachine3: machineObj.why3 || '',
        wwMachine4: machineObj.why4 || '', wwMachine5: machineObj.why5 || '', wwMachineRoot: machineObj.root || '',

        // =========================
        // WHY-WHY (Material)
        // =========================
        wwMaterial1: materialObj.why1 || '', wwMaterial2: materialObj.why2 || '', wwMaterial3: materialObj.why3 || '',
        wwMaterial4: materialObj.why4 || '', wwMaterial5: materialObj.why5 || '', wwMaterialRoot: materialObj.root || '',

        // =========================
        // WHY-WHY (Method)
        // =========================
        wwMethod1: methodObj.why1 || '', wwMethod2: methodObj.why2 || '', wwMethod3: methodObj.why3 || '',
        wwMethod4: methodObj.why4 || '', wwMethod5: methodObj.why5 || '', wwMethodRoot: methodObj.root || '',

        // =========================
        // WHY-WHY (Measurement)
        // =========================
        wwMeasurement1: measurementObj.why1 || '', wwMeasurement2: measurementObj.why2 || '', wwMeasurement3: measurementObj.why3 || '',
        wwMeasurement4: measurementObj.why4 || '', wwMeasurement5: measurementObj.why5 || '', wwMeasurementRoot: measurementObj.root || '',

        // =========================
        // WHY-WHY (Mother Nature)
        // =========================
        wwNature1: natureObj.why1 || '', wwNature2: natureObj.why2 || '', wwNature3: natureObj.why3 || '',
        wwNature4: natureObj.why4 || '', wwNature5: natureObj.why5 || '', wwNatureRoot: natureObj.root || '',

        // =========================
        // ROOT CAUSE
        // =========================
        rootCause: b.root_cause || '',

        // =========================
        // CAPA
        // =========================
        capaRows: Array.isArray(b.capa_actions) && b.capa_actions.length
            ? b.capa_actions.map(function(ca) {
                return {
                    capaId: ca.capa_id || '',
                    action: ca.action || '',
                    resp:   ca.responsibility || '',
                    tdc:    ca.target_date || '',
                    type:   ca.capa_type || '',
                    status: ca.status || ''
                };
            })
            : (b.capa_action || b.capa_responsibility) ? [{
                capaId: '',
                action: b.capa_action || '',
                resp:   b.capa_responsibility || '',
                tdc:    b.capa_target_date || '',
                type:   b.capa_type || '',
                status: b.capa_status || ''
            }] : [],

        // =========================
        // FINAL
        // =========================
        status:         b.status || 'Open',
        unsafeActBrief: b.brief_of_unsafe_act || '',
        syscHiraRef:    b.hira_reference || '',
        createdAt:      b.created_at || ''
    };
}


// ============================================================
// 7. TIME UTILITIES
// ============================================================

function convertTo24Hour(timeStr) {
    if (!timeStr) return null;
    const trimmed = timeStr.trim();
    const m12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m12) {
        let hours = parseInt(m12[1], 10);
        const minutes = m12[2];
        const modifier = m12[3].toUpperCase();
        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        return `${String(hours).padStart(2, "0")}:${minutes}:00`;
    }
    // Already 24hr format
    const m24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) return `${m24[1].padStart(2, "0")}:${m24[2]}:00`;
    return null;
}


// ============================================================
// 8. FORM SUBMISSION
// ============================================================

// handleFormSubmit (section 8 — replaced by section 45 below)


// ============================================================
// 9. FORM RESET & HELPERS
// ============================================================

function resetForm() {
    document.getElementById('irirForm').reset();
    document.getElementById('irirId').value = generateIrirId();
    document.getElementById('modalTotalCost').textContent = '0.00';
    const timeInput = document.getElementById('irirTime');
    if (timeInput) { timeInput.value = ''; timeInput.classList.remove('autofilled'); timeInput.title = ''; }
    document.querySelectorAll('.irir-custom-input').forEach(el => { el.style.display = 'none'; el.value = ''; });
    const tmName = document.getElementById('irirTeamMemberName');
    const tmDesig = document.getElementById('irirTeamMemberDesignation');
    if (tmName) tmName.value = '';
    if (tmDesig) tmDesig.value = '';
    initCATable();
    // New: clear 6M checkboxes, Why-Why, sub-groups
    ['man','machine','material','method','measurement','motherNature'].forEach(key => {
        const dd = document.getElementById(key + 'MultiDropdown');
        if (dd) dd.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        const lbl = document.getElementById(key + 'MultiLabel');
        if (lbl) lbl.textContent = '-- Select (multiple) --';
        const ww = document.getElementById('whyWhyContainer_' + key);
        if (ww) ww.innerHTML = '';
    });
    Object.keys(whyWhyState).forEach(k => delete whyWhyState[k]);
    const sfDd = document.getElementById('shopfloorMultiDropdown');
    if (sfDd) sfDd.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    const sfLbl = document.getElementById('shopfloorMultiLabel');
    if (sfLbl) sfLbl.textContent = '-- Select shopfloor(s) --';
    // Reset single-select custom dropdowns
    const ssResets = [
        { dd:'irirTypeDd',       lbl:'irirTypeLabel',       hid:'irirType',            def:'-- Select --' },
        { dd:'irirEmpCatDd',     lbl:'irirEmpCatLabel',     hid:'irirEmployeeCategory',def:'-- Select --' },
        { dd:'irirInjuryTypeDd', lbl:'irirInjuryTypeLabel', hid:'irirInjuryType',      def:'-- Select Injury Type --' },
        { dd:'irirBodyPartDd',   lbl:'irirBodyPartLabel',   hid:'irirBodyPart',        def:'-- Select Body Part --' },
        { dd:'irirDeptDd',       lbl:'irirDeptLabel',       hid:'irirDepartment',      def:'-- Select --' },
        { dd:'irirPtwDd',        lbl:'irirPtwLabel',        hid:'irirPtwId',           def:'-- Select PTW ID --' },
        { dd:'irirWitnessDd',    lbl:'irirWitnessLabel',    hid:'irirWitnessType',     def:'-- Select Witness Type --' },
        { dd:'syscWisDd',        lbl:'syscWisLabel',        hid:'syscWisRef',          def:'-- Select --' }
    ];
    ssResets.forEach(function(r) {
        const lbl = document.getElementById(r.lbl); if (lbl) lbl.textContent = r.def;
        const hid = document.getElementById(r.hid); if (hid) hid.value = '';
        const dd  = document.getElementById(r.dd);
        if (dd) {
            dd.classList.remove('open');
            dd.querySelectorAll('.ss-option').forEach(function(o) { o.classList.remove('ss-selected'); });
        }
    });
    const reoccGroup = document.getElementById('reoccurrenceIncidentGroup');
    if (reoccGroup) reoccGroup.style.display = 'none';
    const md = document.getElementById('irirMandaysLost'); if (md) md.value = '';
    const smsg = document.getElementById('statusBlockMsg'); if (smsg) smsg.style.display = 'none';
    ['workPermitDetailsGroup','hiraYesGroup','hiraNoGroup','eaiYesGroup','eaiNoGroup','ocpSopGroup','capaShopfloorGroup'].forEach(id => {
        const el = document.getElementById(id); if (el) el.style.display = 'none';
    });
    const noRadio = document.querySelector('input[name="capaShopfloor"][value="No"]');
    if (noRadio) noRadio.checked = true;
    if (typeof setCapaIdDisplay === 'function') setCapaIdDisplay();
}

// Others / custom input handler
function handleIrirOthers(selectEl, customInputId) {
    const customInput = document.getElementById(customInputId);
    if (!customInput) return;
    if (selectEl.value === 'Others') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        customInput.value = '';
    }
}

function getIrirFinalValue(selectId, customInputId) {
    const sel = document.getElementById(selectId);
    const inp = document.getElementById(customInputId);
    if (!sel) return '';
    if (sel.value === 'Others' && inp && inp.value.trim()) return inp.value.trim();
    return sel.value;
}


// ============================================================
// 10. DYNAMIC CORRECTIVE ACTIONS TABLE (Create Modal)
// ============================================================

let nextCapaNum = 1;

function loadCapaCounterFromTracker() {
    try {
        const savedCounter = localStorage.getItem('capaTrackerCounter');
        if (savedCounter) { nextCapaNum = parseInt(savedCounter, 10); return; }
        const savedData = localStorage.getItem('capaTrackerData');
        if (savedData) {
            const capas = JSON.parse(savedData);
            if (capas.length > 0) {
                const maxNum = Math.max(...capas.map(c => {
                    const m = c.capaId && c.capaId.match(/CAPA-(\d+)/);
                    return m ? parseInt(m[1]) : 0;
                }));
                nextCapaNum = maxNum + 1;
                return;
            }
        }
        nextCapaNum = 1;
    } catch (e) {
        console.error('IRIR: Failed to read CAPA counter:', e);
        nextCapaNum = 1;
    }
}

function saveCapaCounterToTracker(num) {
    try { localStorage.setItem('capaTrackerCounter', String(num)); }
    catch (e) { console.error('IRIR: Failed to write CAPA counter:', e); }
}

function formatCapaId(num) {
    return 'CAPA-' + String(num).padStart(3, '0');
}

function addCARow() {
    const tbody = document.getElementById('caTableBody');
    if (!tbody) return;
    const rowNum = tbody.rows.length + 1;
    const rowId  = 'caRow_' + Date.now();
    const tr     = document.createElement('tr');
    tr.id = rowId;
    tr.innerHTML = `
        <td style="text-align:center;color:#5e6c84;font-size:12px;font-weight:600;">${rowNum}</td>
        <td><input type="text" class="ca-input" placeholder="Describe corrective action" style="width:100%;"></td>
        <td><input type="text" class="ca-input" placeholder="Responsible person" style="width:100%;"></td>
        <td>
            <select class="ca-select" style="width:100%;">
                <option value="">— Status —</option>
                <option value="Open">Open</option>
                <option value="Close">Close</option>
            </select>
        </td>
        <td style="text-align:center;white-space:nowrap;">
            <button type="button" class="ca-add-btn" onclick="addCARow()" title="Add row">➕</button>
            <button type="button" class="ca-del-btn" onclick="removeCARow('${rowId}')" title="Delete row">🗑️</button>
        </td>`;
    tbody.appendChild(tr);
}

function removeCARow(rowId) {
    const tbody = document.getElementById('caTableBody');
    if (!tbody) return;
    if (tbody.rows.length <= 1) return;
    const row = document.getElementById(rowId);
    if (row) row.remove();
}

function collectCARows() {
    const tbody = document.getElementById('caTableBody');
    if (!tbody) return {};
    const result = {};
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, i) => {
        const n      = i + 1;
        const inputs = row.querySelectorAll('input, select');
        // New structure: col0=#(no input), col1=Action input, col2=Resp input, col3=Status select
        result['caAction' + n]  = inputs[0] ? inputs[0].value : '';
        result['caResp' + n]    = inputs[1] ? inputs[1].value : '';
        result['caTdc' + n]     = (document.getElementById('capaTargetDate') || {}).value || '';
        result['caType' + n]    = mapCode('capa_type', (document.getElementById('irirCapaType') || {}).value || '');
        result['caStatus' + n]  = inputs[2] ? mapCode('capa_status', inputs[2].value) : '';
        result['capaIdRef' + n] = '';
    });
    result['caTotalRows'] = rows.length;
    return result;
}

function initCATable() {
    loadCapaCounterFromTracker();
    const tbody = document.getElementById('caTableBody');
    if (tbody) tbody.innerHTML = '';
    addCARow();
}


// ============================================================
// 11. AUTO-CREATE CAPAs FROM IRIR
// ============================================================

function autoCreateCAPAsFromIRIR(irir) {
    console.log('🚀 autoCreateCAPAsFromIRIR called for:', irir.irirId);

    const typeMap = {
        'Reportable':     'R',
        'Non-reportable': 'NR',
        'First Aid':      'FA',
        'Nearmiss':       'NM',
        'Fire':           'Fire',
        'Environment':    'NR'
    };
    const capaCategory = typeMap[irir.type] || irir.type || 'NR';
    const rootCauseParts = [
        irir.man, irir.machine, irir.material,
        irir.method, irir.measurement, irir.motherNature
    ].filter(Boolean);
    const rootCauseSummary = rootCauseParts.length > 0 ? rootCauseParts[0] : '';
    const rootCauseVal = irir.rootCause && irir.rootCause !== ''
        ? irir.rootCause
        : (rootCauseSummary
            ? (rootCauseSummary.toLowerCase().includes('unsafe') ? 'Unsafe Act' : 'Unsafe Condition')
            : 'Unsafe Act');

    let existingCapas = [];
    try {
        const saved = localStorage.getItem('capaTrackerData');
        if (saved) existingCapas = JSON.parse(saved);
    } catch (e) { console.error('Failed to load CAPA data:', e); }

    const existingIrirCapas = existingCapas.filter(c => c.irirRef === irir.irirId);
    if (existingIrirCapas.length > 0) {
        console.log('CAPAs already exist for ' + irir.irirId + ', skipping');
        return 0;
    }

    const totalRows = irir.caTotalRows || 6;
    const actions = [];
    for (let i = 1; i <= totalRows; i++) {
        const action = irir['caAction' + i];
        if (action && action.trim() !== '') {
            actions.push({
                rowIndex: i,
                action:   action,
                resp:     irir['caResp' + i] || '',
                tdc:      irir['caTdc' + i] || '',
                caType:   irir['caType' + i] || '',
                status:   irir['caStatus' + i] || ''
            });
        }
    }

    if (actions.length === 0) {
        showSuccessMessage('⚠️ No corrective actions found! Please add actions in the CAPA table before approving.');
        return 0;
    }

    loadCapaCounterFromTracker();

    const newCapas = actions.map(a => {
        const realCapaId = formatCapaId(nextCapaNum);
        nextCapaNum++;
        saveCapaCounterToTracker(nextCapaNum);
        irir['capaIdRef' + a.rowIndex] = realCapaId;

        return {
            capaId:                    realCapaId,
            irirRef:                   irir.irirId,
            plant:                     irir.plant,
            date:                      irir.date,
            category:                  capaCategory,
            incidentDetails:           [irir.narWhat, irir.narHow].filter(Boolean).join(' | ') || irir.location || '',
            employeeCategory:          irir.employeeCategory || '',
            activity:                  irir.activity || '',
            bodyPart:                  irir.bodyPart || '',
            natureOfInjury:            irir.injuryType || '',
            rootCause:                 rootCauseVal,
            briefUnsafeAct:            rootCauseSummary || '',
            disciplinaryProcedure:     irir.disciplinary || '',
            personName:                irir.injuredName || '',
            capaByPlant:               a.action,
            responsibility:            a.resp,
            tdc:                       a.tdc || '',
            capaType:                  a.caType || '',
            statusOfCAPA:              (a.status && a.status.trim() !== '') ? a.status : 'Open',
            horizontalDeploymentStatus: 'No'
        };
    });

    saveToLocalStorage();

    try {
        localStorage.setItem('capaTrackerData', JSON.stringify([...newCapas, ...existingCapas]));
        saveCapaCounterToTracker(nextCapaNum);
        console.log('✅ Created ' + newCapas.length + ' CAPA(s) from ' + irir.irirId);
    } catch (e) { console.error('Failed to save CAPA data:', e); }

    return newCapas.length;
}


// ============================================================
// 12. COST CALCULATION
// ============================================================

function calcModalTotal() {
    const ids = ['costMan', 'costMachine', 'costMaterial', 'costMethod', 'costManagement', 'costNature'];
    let total = 0;
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) total += parseFloat(el.value) || 0;
    });
    const el = document.getElementById('modalTotalCost');
    if (el) el.textContent = total.toFixed(2);
    return total;
}

function calcDetailTotal() {
    const ids = ['dCostMan', 'dCostMachine', 'dCostMaterial', 'dCostMethod', 'dCostManagement', 'dCostNature'];
    let total = 0;
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) total += parseFloat(el.value) || 0;
    });
    const el = document.getElementById('detailTotalCost');
    if (el) el.textContent = total.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    return total;
}


// ============================================================
// 13. TABLE RENDERING
// ============================================================

function getTypeBadgeClass(type) {
    const map = {
        'Reportable':     'severity-r',
        'Non-reportable': 'severity-nr',
        'First Aid':      'severity-fa',
        'Nearmiss':       'severity-nm',
        'Environment':    'severity-env',
        'Fire':           'severity-fire'
    };
    return map[type] || 'severity-custom';
}

function buildRowHTML(data) {

    // ── Helpers ──────────────────────────────────────────────
    const v = val => (val && String(val).trim() !== '') ? String(val) : 'N/A';

    // Truncate long text with styled tooltip
    const truncate = (val, len) => {
        const s = v(val);
        if (s === 'N/A') return '<span class="cell-na">—</span>';
        if (s.length > len) return `<span class="cell-text cell-tooltip" data-tip="${s.replace(/"/g,'&quot;')}">${s.substring(0,len)}…</span>`;
        return `<span class="cell-text">${s}</span>`;
    };

    // Multi-select chips: colored per 6M category, show first 2, then +N with tooltip
    const chips = (val, colorClass) => {
        if (!val || String(val).trim() === '') return '<span class="cell-na">—</span>';
        const arr = Array.isArray(val) ? val : String(val).split(',').map(s => s.trim()).filter(Boolean);
        if (!arr.length) return '<span class="cell-na">—</span>';
        const cls = colorClass || 'chip-default';
        const visible = arr.slice(0, 2).map(a => `<span class="cell-chip ${cls}" title="${a.replace(/"/g,'&quot;')}">${a}</span>`).join('');
        const extra = arr.length > 2 ? `<span class="cell-chip cell-chip-more" title="${arr.join(', ')}">+${arr.length - 2}</span>` : '';
        return `<span class="cell-chips">${visible}${extra}</span>`;
    };

    // Format date DD-MMM-YYYY
    const fmtDate = (val) => {
        if (!val || val === 'N/A') return '<span class="cell-na">—</span>';
        try {
            const d = new Date(val);
            if (isNaN(d)) return val;
            return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
        } catch(e) { return val; }
    };

    // Format currency
    const fmtCost = (val) => {
        const n = parseFloat(val);
        if (!val || isNaN(n) || n === 0) return '<span class="cell-na">—</span>';
        return '₹ ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    };

    // Yes/No with icon
    const yesno = (val) => {
        if (!val || val === 'N/A') return '<span class="cell-na">—</span>';
        if (val === 'Yes') return '<span class="cell-yesno cell-yes">✓ Yes</span>';
        if (val === 'No')  return '<span class="cell-yesno cell-no">✕ No</span>';
        return val;
    };

    // Accident / Incident type icon
    const typeIcon = {
        'Reportable':     '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
        'Non-reportable': '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6zm4 8h-4l-1-2H7V6h5l1 2h5v6z"/></svg>',
        'First Aid':      '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>',
        'Nearmiss':       '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>',
        'Environment':    '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2-1.13 0-1.9.16-2.53.33C14.28 11.85 17 8 17 8z"/></svg>',
        'Fire':           '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>'
    };

    // Status icon
    const statusIcon = (val) => {
        if (val === 'Open')               return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px;opacity:0.6"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
        if (val === 'Under Investigation') return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
        if (val === 'Closed')             return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
        return '';
    };

    // Root cause icon
    const rootCauseIcon = (val) => {
        if (val === 'Unsafe Act')       return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
        if (val === 'Unsafe Condition') return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
        return '';
    };

    // Reoccurrence icon
    const reoccIcon = (val) => {
        if (val === 'Yes') return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>';
        if (val === 'No')  return '✕ ';
        return '';
    };

    // Shift icon
    const shiftIcon = (val) => {
        if (!val || val === 'N/A') return '<span class="cell-na">—</span>';
        const letter = val.charAt(0);
        const icons = { A: '🌙', B: '☀️', C: '🌆' };
        return `<span class="cell-text">${icons[letter] || ''} ${val}</span>`;
    };

    // Incident type badge — colored per type
    const typeBadge = (val) => {
        if (!val || val === 'N/A') return '<span class="cell-na">—</span>';
        const icon = typeIcon[val] || '';
        const colorClass = {
            'Reportable':     'type-badge-reportable',
            'Non-reportable': 'type-badge-nonreportable',
            'First Aid':      'type-badge-firstaid',
            'Nearmiss':       'type-badge-nearmiss',
            'Environment':    'type-badge-environment',
            'Fire':           'type-badge-fire'
        }[val] || 'type-badge-default';
        return `<span class="cell-type-chip ${colorClass}">${icon}${val}</span>`;
    };

    // Total cost
    const totalCostDisplay = data.totalCost
        ? parseFloat(data.totalCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })
        : '0.00';

    return `
        <td class="sticky-column sticky-checkbox"><input type="checkbox" class="row-checkbox" onchange="updateBulkDeleteBar()"></td>
        <td class="sticky-column sticky-col-1"><a href="#" class="task-id" onclick="event.preventDefault(); openDetailPanel('${data.irirId}')">${data.irirId}</a></td>
        <td class="sticky-column sticky-col-2">${v(data.plant)}</td>

        <!-- Part A -->
        <td data-column-index="3">${typeBadge(data.type)}</td>
        <td data-column-index="4">${truncate(data.employeeCategory, 20)}</td>
        <td data-column-index="5">${fmtDate(data.date)}</td>
        <td data-column-index="6">${v(data.time) !== 'N/A' ? `<span class="cell-text">${data.time}</span>` : '<span class="cell-na">—</span>'}</td>
        <td data-column-index="7">${shiftIcon(data.shift)}</td>
        <td data-column-index="8">${v(data.gender) !== 'N/A' ? `<span class="cell-text">${data.gender}</span>` : '<span class="cell-na">—</span>'}</td>
        <td data-column-index="9">${(data.experienceYears || data.experienceMonths) ? `<span class="cell-text">${data.experienceYears||'0'} Yrs ${data.experienceMonths||'0'} Mos</span>` : '<span class="cell-na">—</span>'}</td>
        <td data-column-index="10">${v(data.activity) !== 'N/A' ? `<span class="cell-text">${data.activity}</span>` : '<span class="cell-na">—</span>'}</td>
        <td data-column-index="11">${truncate(data.injuredName, 22)}</td>
        <td data-column-index="12">${truncate(data.employeeNo, 15)}</td>
        <td data-column-index="13">${truncate(data.injuryType, 20)}</td>
        <td data-column-index="14">${truncate(data.bodyPart, 15)}</td>
        <td data-column-index="15">${truncate(data.department, 20)}</td>
        <td data-column-index="16">${truncate(data.location, 30)}</td>
        <td data-column-index="17">${truncate(data.narWhat, 40)}</td>
        <td data-column-index="18">${truncate(data.narWhen, 40)}</td>
        <td data-column-index="19">${truncate(data.narWhere, 40)}</td>
        <td data-column-index="20">${truncate(data.narWho, 40)}</td>
        <td data-column-index="21">${truncate(data.narWhich, 40)}</td>
        <td data-column-index="22">${truncate(data.narHow, 40)}</td>
        <td data-column-index="23">${truncate(data.immediateActions, 40)}</td>
        <td data-column-index="24">${truncate(data.preparedBy, 22)}</td>
        <td data-column-index="25">${fmtDate(data.preparedDate)}</td>
        <td data-column-index="26">${yesno(data.workPermit)}</td>

        <!-- Part B -->
        <td data-column-index="27">${truncate(data.teamMemberName, 22)}</td>
        <td data-column-index="27b">${truncate(data.teamMemberDesignation, 22)}</td>
        <td data-column-index="28">${truncate(data.witnessStatement, 40)}</td>
        <td data-column-index="29">${chips(data.man,         'chip-man')}</td>
        <td data-column-index="35">${truncate(data.wwManRoot, 35)}</td>
        <td data-column-index="30">${chips(data.machine,     'chip-machine')}</td>
        <td data-column-index="36">${truncate(data.wwMachineRoot, 35)}</td>
        <td data-column-index="31">${chips(data.material,    'chip-material')}</td>
        <td data-column-index="37">${truncate(data.wwMaterialRoot, 35)}</td>
        <td data-column-index="32">${chips(data.method,      'chip-method')}</td>
        <td data-column-index="38">${truncate(data.wwMethodRoot, 35)}</td>
        <td data-column-index="33">${chips(data.measurement, 'chip-measurement')}</td>
        <td data-column-index="39">${truncate(data.wwMeasurementRoot, 35)}</td>
        <td data-column-index="34">${chips(data.motherNature,'chip-nature')}</td>
        <td data-column-index="40">${truncate(data.wwNatureRoot, 35)}</td>
        <td data-column-index="42">${data.rootCause ? `<span class="cell-text">${rootCauseIcon(data.rootCause)}${data.rootCause}</span>` : '<span class="cell-na">—</span>'}</td>
        <td data-column-index="43">${truncate(data.unsafeActBrief, 40)}</td>
        <td data-column-index="52">${truncate(data.syscHiraRef, 20)}</td>
        <td data-column-index="53">${truncate(data.syscEaiRef, 20)}</td>
        <td data-column-index="51">${truncate(data.syscWisRef, 20)}</td>
        <td data-column-index="54">${truncate(data.syscResp, 22)}</td>
        <td data-column-index="55">${fmtDate(data.syscTargetDate)}</td>
        <td data-column-index="56">${truncate(data.partBPreparedBy, 22)}</td>
        <td data-column-index="57">${fmtDate(data.partBPreparedDate)}</td>
        <td data-column-index="58">${truncate(data.partBApprovedBy, 22)}</td>
        <td data-column-index="59">${fmtDate(data.partBApprovedDate)}</td>

        <!-- Part C -->
        <td data-column-index="60">${truncate(data.sourceSituation, 40)}</td>
        <td data-column-index="61">${truncate(data.otherRemarks, 40)}</td>
        <td data-column-index="62">${fmtDate(data.returnDate)}</td>
        <td data-column-index="63">${v(data.mandaysLost) !== 'N/A' ? `<span class="cell-text">${data.mandaysLost} days</span>` : '<span class="cell-na">—</span>'}</td>
        <td data-column-index="64">${data.reoccurrence ? `<span class="cell-text">${reoccIcon(data.reoccurrence)}${data.reoccurrence}</span>` : '<span class="cell-na">—</span>'}</td>

        <!-- Part D -->
        <td data-column-index="65">${fmtCost(data.costMan)}</td>
        <td data-column-index="66">${fmtCost(data.costMachine)}</td>
        <td data-column-index="67">${fmtCost(data.costMaterial)}</td>
        <td data-column-index="68">${fmtCost(data.costMethod)}</td>
        <td data-column-index="69">${fmtCost(data.costManagement)}</td>
        <td data-column-index="70">${fmtCost(data.costNature)}</td>
        <td data-column-index="71">${(data.totalCost && parseFloat(data.totalCost) > 0) ? `<span class="cell-text cell-total-cost">₹ ${totalCostDisplay}</span>` : '<span class="cell-na">—</span>'}</td>
        <td data-column-index="75">${fmtDate(data.incidentTargetDate)}</td>
        <td data-column-index="72">${(data.effMonths||[]).length ? `<span class="month-dots">${(data.effMonths||[]).map((m,i) => {
            const ok = m.status && m.status.toLowerCase() !== 'pending' && m.status !== '—' && m.status !== '';
            return `<span class="month-dot-item ${ok ? 'dot-done' : 'dot-pending'}" title="M${i+1}: ${m.status||'Pending'}"><span class="month-dot"></span><span class="month-dot-label">M${i+1}</span></span>`;
        }).join('')}</span>` : '<span class="cell-na">—</span>'}</td>
        <td data-column-index="73">${(data.effMonths||[]).length ? (data.effMonths||[]).map((m,i) => `<span class="cell-text">M${i+1}: ${m.date ? new Date(m.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</span>`).join('<br>') : '<span class="cell-na">—</span>'}</td>
        <td data-column-index="74">${(data.effMonths||[]).length ? (data.effMonths||[]).map((m,i) => `<span class="cell-text">M${i+1}: ${m.name||'—'}</span>`).join('<br>') : '<span class="cell-na">—</span>'}</td>
        <td data-column-index="81">
            <select class="inline-status-select" onchange="updateInlineStatus('${data.irirId}', this)">
                <option ${data.status==='Open'?'selected':''}>Open</option>
                <option ${data.status==='Under Investigation'?'selected':''}>Under Investigation</option>
                <option ${data.status==='Closed'?'selected':''}>Closed</option>
            </select>
        </td>
        <td data-column-index="82">${truncate(data.unsafeActBrief, 40)}</td>`;
}



// ============================================================
// 14. ADD ROW / STATUS BADGE
// ============================================================

function addIrirToTable(data) {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('irirTable').style.display = 'table';
    const tbody = document.getElementById('irirTableBody');
    const row = document.createElement('tr');
    row.setAttribute('data-type', data.type);
    row.setAttribute('data-status', data.status);
    row.setAttribute('data-dept', data.department);
    row.setAttribute('data-plant', data.plant);
    row.setAttribute('data-irir-id', data.irirId);
    row.innerHTML = buildRowHTML(data);
    tbody.insertBefore(row, tbody.firstChild);
    const sel = row.querySelector('.inline-status-select');
    if (sel) setStatusBadgeColor(sel);
}

function setStatusBadgeColor(dropdown) {
    dropdown.classList.remove('badge-style', 'badge-status-open', 'badge-status-investigation', 'badge-status-closed');
    if (dropdown.value) {
        dropdown.classList.add('badge-style');
        if (dropdown.value === 'Open') dropdown.classList.add('badge-status-open');
        else if (dropdown.value === 'Under Investigation') dropdown.classList.add('badge-status-investigation');
        else if (dropdown.value === 'Closed') dropdown.classList.add('badge-status-closed');
    }
}

function updateInlineField(irirId, field, value) {
    const irir = allIrirs.find(i => i.irirId === irirId);
    if (irir) { irir[field] = value.trim(); saveToLocalStorage(); }
}

function updateInlineStatus(irirId, select) {
    updateInlineField(irirId, 'status', select.value);
    setStatusBadgeColor(select);
    const row = select.closest('tr');
    if (row) row.setAttribute('data-status', select.value);
    updateStatusCounters();
}


// ============================================================
// 15. INLINE EDITING (Table Cells)
// ============================================================

function makeTableCellsEditable() {
    const tbody = document.getElementById('irirTableBody');
    if (!tbody) return;
    tbody.addEventListener('click', function(e) {
        const cell = e.target.closest('td');
        if (!cell) return;
        if (cell.classList.contains('sticky-column') || cell.classList.contains('sticky-checkbox')) return;
        if (cell.querySelector('input, select, textarea')) return;
        const colIndex = cell.getAttribute('data-column-index');
        if (!colIndex) return;
        const row = cell.closest('tr');
        const irirId = row.getAttribute('data-irir-id');
        if (!irirId) return;
        const irir = allIrirs.find(i => i.irirId === irirId);
        if (!irir) return;
        const fieldMap = {
            '11': { field: 'injuredName',    type: 'text' },
            '12': { field: 'employeeNo',     type: 'text' },
            '13': { field: 'injuryType',     type: 'text' },
            '14': { field: 'bodyPart',       type: 'text' },
            '16': { field: 'location',       type: 'textarea' },
            '60': { field: 'sourceSituation',type: 'textarea' },
            '61': { field: 'otherRemarks',   type: 'textarea' },
            '62': { field: 'returnDate',     type: 'date' },
            '63': { field: 'mandaysLost',    type: 'number' },
            '64': { field: 'reoccurrence',   type: 'select', options: ['Yes', 'No'] },
            '81': { field: 'status',         type: 'select', options: ['Open', 'Under Investigation', 'Closed'] },
            '82': { field: 'unsafeActBrief', type: 'textarea' }
        };
        const fieldConfig = fieldMap[colIndex];
        if (!fieldConfig) return;
        enableInlineEdit(cell, irir, fieldConfig);
    });
}

function enableInlineEdit(cell, irir, fieldConfig) {
    if (fieldConfig.type !== 'select') return;
    const originalValue = irir[fieldConfig.field] || '';
    let input;

    input = document.createElement('select');
    input.className = 'inline-edit-select';

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Select --';
    input.appendChild(emptyOption);

    (fieldConfig.options || []).forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        option.selected = originalValue === opt;
        input.appendChild(option);
    });

    const originalHTML = cell.innerHTML;
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();

    function saveEdit() {
        const newValue = input.value.trim();
        irir[fieldConfig.field] = newValue;
        saveToLocalStorage();
        cell.innerHTML = newValue || 'N/A';
        cell.classList.remove('editing');
    }

    function cancelEdit() {
        cell.innerHTML = originalHTML;
        cell.classList.remove('editing');
    }

    if (fieldConfig.type === 'select') {
        input.addEventListener('change', saveEdit);
    } else {
        input.addEventListener('blur', saveEdit);
    }

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && fieldConfig.type !== 'textarea') saveEdit();
        else if (e.key === 'Escape') cancelEdit();
    });
}


// ============================================================
// 16. STATUS COUNTERS
// ============================================================

function updateStatusCounters() {
    const total  = allIrirs.length;
    const open   = allIrirs.filter(i => i.status === 'Open').length;
    const inv    = allIrirs.filter(i => i.status === 'Under Investigation').length;
    const closed = allIrirs.filter(i => i.status === 'Closed').length;
    document.getElementById('totalCount').textContent         = total;
    document.getElementById('openCount').textContent          = open;
    document.getElementById('investigationCount').textContent = inv;
    document.getElementById('closedCount').textContent        = closed;
}


// ============================================================
// 17. COLUMN TOGGLE
// ============================================================

function toggleColumnSelector() {
    document.getElementById('columnSelectorDropdown').classList.toggle('show');
}

function toggleColumn(checkbox, columnIndex) {
    const table = document.getElementById('irirTable');
    const show = checkbox.checked ? '' : 'none';
    table.querySelectorAll(`th[data-column-index="${columnIndex}"], td[data-column-index="${columnIndex}"]`)
        .forEach(el => el.style.display = show);
}


// ============================================================
// 18. CHECKBOXES & BULK DELETE
// ============================================================

function toggleAllCheckboxes() {
    const master = document.getElementById('masterCheckbox');
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = master.checked);
    updateBulkDeleteBar();
}

function updateBulkDeleteBar() {
    const checked  = document.querySelectorAll('.row-checkbox:checked');
    const total    = document.querySelectorAll('.row-checkbox').length;
    const bar      = document.getElementById('irirBulkDeleteBar');
    const countEl  = document.getElementById('irirBulkSelectedCount');
    const masterCb = document.getElementById('masterCheckbox');
    if (checked.length > 0) {
        countEl.textContent = `${checked.length}/${total} selected`;
        bar.classList.add('show');
    } else {
        bar.classList.remove('show');
    }
    if (masterCb) {
        if (checked.length === 0)     { masterCb.checked = false; masterCb.indeterminate = false; }
        else if (checked.length === total) { masterCb.checked = true;  masterCb.indeterminate = false; }
        else                          { masterCb.checked = false; masterCb.indeterminate = true; }
    }
}

async function deleteSelectedIrirs() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    const count = checkedBoxes.length;
    const total = document.querySelectorAll('.row-checkbox').length;
    const msg = count === total
        ? `Delete ALL ${count}/${total} records? This cannot be undone.`
        : `Delete ${count} selected record(s)? This cannot be undone.`;
    if (!confirm(msg)) return;

    const idsToDelete = [];
    checkedBoxes.forEach(cb => {
        const row = cb.closest('tr');
        if (row) {
            const irirId = row.getAttribute('data-irir-id');
            const irir = allIrirs.find(i => i.irirId === irirId);
            idsToDelete.push({ irirId, backendId: irir ? irir.id : null });
        }
    });

    // ✅ Delete each from backend
    let token = null;
    try { token = await getValidToken(); } catch (e) {}

    if (token) {
        const failedIds = [];
        await Promise.all(idsToDelete.map(async ({ irirId, backendId }) => {
            const id = backendId || irirId;
            try {
                const res = await fetch(`${API_BASE_URL}/incidents/${id}/`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
                });
                if (!res.ok && res.status !== 404) {
                    failedIds.push(id);
                    console.warn('❌ Failed to delete from backend:', id, res.status);
                } else {
                    console.log('✅ Deleted from backend:', id);
                }
            } catch (e) {
                console.warn('⚠️ Backend unreachable for:', id);
            }
        }));
        if (failedIds.length > 0) {
            alert(`⚠️ ${failedIds.length} record(s) could not be deleted from server. They were removed locally only.`);
        }
    } else {
        console.warn('⚠️ No token — deleting locally only.');
    }

    // ✅ Always delete locally regardless of backend result
    idsToDelete.forEach(({ irirId }) => {
        const idx = allIrirs.findIndex(i => i.irirId === irirId);
        if (idx !== -1) allIrirs.splice(idx, 1);
    });
    saveToLocalStorage();

    document.getElementById('irirBulkDeleteBar').classList.remove('show');
    const masterCb = document.getElementById('masterCheckbox');
    if (masterCb) { masterCb.checked = false; masterCb.indeterminate = false; }
    showSuccessMessage(`✅ ${count} record(s) deleted successfully!`);
    renderTable();
}

function cancelBulkSelection() {
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('irirBulkDeleteBar').classList.remove('show');
    const masterCb = document.getElementById('masterCheckbox');
    if (masterCb) { masterCb.checked = false; masterCb.indeterminate = false; }
}


// ============================================================
// 19. SEARCH
// ============================================================

function searchTable(term) {
    const rows = document.querySelectorAll('#irirTableBody tr');
    term = term.toLowerCase();
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
}


// ============================================================
// 20. FILTERS
// ============================================================

function toggleMoreFilters() {
    document.getElementById('moreFiltersDropdown').classList.toggle('show');
}

function showSubmenu(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
}

function hideSubmenu(id) {
    const el = document.getElementById(id);
    if (el) setTimeout(() => {
        if (!el.matches(':hover') && !el.parentElement.matches(':hover')) el.style.display = 'none';
    }, 100);
}

function applyMoreFilters() {
    const rows = document.querySelectorAll('#irirTableBody tr');
    const checked = document.querySelectorAll('.more-filters-dropdown .filter-checkbox:checked');
    if (checked.length === 0) { rows.forEach(r => r.style.display = ''); return; }
    const typeFilters = [], deptFilters = [], statusFilters = [], plantFilters = [];
    checked.forEach(cb => {
        const pid = cb.closest('.filter-submenu')?.id;
        if (pid === 'categorySubmenu') typeFilters.push(cb.value);
        else if (pid === 'deptSubmenu') deptFilters.push(cb.value);
        else if (pid === 'statusSubmenu') statusFilters.push(cb.value);
        else if (pid === 'plantSubmenu') plantFilters.push(cb.value);
    });
    rows.forEach(row => {
        let show = true;
        if (typeFilters.length   && !typeFilters.includes(row.getAttribute('data-type')))     show = false;
        if (deptFilters.length   && !deptFilters.includes(row.getAttribute('data-dept')))     show = false;
        if (statusFilters.length && !statusFilters.includes(row.getAttribute('data-status'))) show = false;
        if (plantFilters.length  && !plantFilters.includes(row.getAttribute('data-plant')))   show = false;
        row.style.display = show ? '' : 'none';
    });
}

function clearAllFilters() {
    document.querySelectorAll('.more-filters-dropdown .filter-checkbox').forEach(cb => cb.checked = false);
    applyMoreFilters();
    document.getElementById('moreFiltersDropdown').classList.remove('show');
    showSuccessMessage('All filters cleared');
}


// ============================================================
// 21. HEADER DROPDOWNS
// ============================================================

function toggleHeaderDropdown(id) {
    const dropdown = document.getElementById(id);
    const isShown = dropdown.classList.contains('show');
    document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
    if (!isShown) dropdown.classList.add('show');
}


// ============================================================
// 22. DETAIL SIDE PANEL
// ============================================================

function openDetailPanel(irirId) {
    const irir = allIrirs.find(i => i.irirId === irirId);
    if (!irir) return;
    currentDetailIrirId = irirId;
    document.getElementById('detailPanelTitle').textContent = irir.irirId + ' — ' + (irir.injuredName || 'Incident');
    const body = document.getElementById('detailPanelBody');
    const esc = v => String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const selOpts = (opts, cur) => opts.map(o=>`<option ${cur===o?'selected':''}>${o}</option>`).join('');

    // Build 6M checkbox options (restore checked state from saved array or string)
    const sixMOpts = (key, opts, saved) => {
        const arr = Array.isArray(saved) ? saved : (saved ? saved.split(',').map(s=>s.trim()).filter(Boolean) : []);
        return opts.map(o=>`<label class="ms-option"><input type="checkbox" value="${esc(o)}" onchange="dpOnSixMChange('${key}')" ${arr.includes(o)?'checked':''}> ${esc(o)}</label>`).join('');
    };
    const savedLabel = saved => {
        const arr = Array.isArray(saved) ? saved : (saved ? saved.split(',').map(s=>s.trim()).filter(Boolean) : []);
        return arr.filter(v=>v&&v!=='Not applicable').join(', ') || '-- Select (multiple) --';
    };

    body.innerHTML = `
        <div class="irir-form-group">
            <label>INC ID</label>
            <input type="text" class="irir-input-field irir-auto-id-field" value="${esc(irir.irirId)}" disabled>
            <p class="irir-helper-text">Auto-generated unique identifier</p>
        </div>
        <div class="irir-form-group">
            <label>Plant</label>
            <select class="irir-select-field" id="dPlant">
                <option value="">-- Select Plant --</option>
                ${selOpts(['Plant1','Plant2','Plant3','Plant4','Plant5','Plant6','Plant7','Plant8'], irir.plant)}
            </select>
        </div>

        <!-- PART A -->
        <div class="form-section-banner">
            <span class="section-letter">A</span>
            <div>
                <div class="section-title-text">PART A — Initial Incident Reporting</div>
                <div class="section-note-text">Complete this part and forward within the same shift of accident / incident to Department Head &amp; Safety Officer</div>
            </div>
        </div>
        <div class="irir-form-group">
            <label>Accident / Incident</label>
            <select class="irir-select-field" id="dType">
                <option value="">-- Select --</option>
                ${selOpts(['Reportable','Non-reportable','First Aid','Nearmiss','Environment','Fire'], irir.type)}
            </select>
        </div>
        <div class="irir-form-group">
            <label>Employee Category Involved</label>
            <select class="irir-select-field" id="dEmpCat">
                <option value="">-- Select --</option>
                ${selOpts(['Executive','Permanent Associate','Casual Labour','Apprentice','Contractor','Others'], irir.employeeCategory)}
            </select>
        </div>
        <div class="irir-form-group">
            <label>Date</label>
            <input type="date" class="irir-input-field" id="dDate" value="${esc(irir.date)}">
        </div>
        <div class="irir-form-group">
            <label>Time</label>
            <div class="tp-trigger-wrap">
                <input type="text" class="irir-input-field tp-trigger-input" id="dTime"
                       placeholder="Select time…" value="${esc(irir.time)}"
                       onclick="openTimePicker('dTime')" autocomplete="off">
                <svg class="tp-trigger-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                </svg>
            </div>
        </div>
        <div class="irir-form-group">
            <label>Shift</label>
            <select class="irir-select-field" id="dShift">
                <option value="">-- Select --</option>
                ${selOpts(['A (01:00 am \u2013 08:00 am)','B (08:00 am \u2013 04:30 pm)','C (04:30 pm \u2013 01:00 am)'], irir.shift)}
            </select>
        </div>
        <div class="irir-form-group">
            <label>Gender</label>
            <select class="irir-select-field" id="dGender">
                <option value="">-- Select --</option>
                ${selOpts(['Male','Female','Transgender'], irir.gender)}
            </select>
        </div>
        <div class="irir-form-group">
            <label>Experience in current job (in which he/she was involved at the time of injury)</label>
            <div style="border:1px solid #ccc;border-radius:4px;padding:8px;background:#fff;">
                <div style="margin-bottom:8px;">
                    <label style="font-size:11px;font-weight:600;color:#5e6c84;display:block;margin-bottom:4px;">Years</label>
                    <input type="number" class="irir-input-field" id="dExperienceYears" placeholder="0" min="0" value="${esc(irir.experienceYears||'')}" style="border:1px solid #dfe1e6;">
                </div>
                <div>
                    <label style="font-size:11px;font-weight:600;color:#5e6c84;display:block;margin-bottom:4px;">Months</label>
                    <input type="number" class="irir-input-field" id="dExperienceMonths" placeholder="0" min="0" max="11" value="${esc(irir.experienceMonths||'')}" style="border:1px solid #dfe1e6;">
                </div>
            </div>
        </div>
        <div class="irir-form-group">
            <label>Activity: Routine / Non-Routine</label>
            <select class="irir-select-field" id="dActivity">
                <option value="">-- Select --</option>
                ${selOpts(['Routine','Non-Routine'], irir.activity)}
            </select>
        </div>
        <div class="irir-form-group">
            <label>Name of the Injured Person(s)</label>
            <input type="text" class="irir-input-field" id="dInjuredName" placeholder="Full name(s)" value="${esc(irir.injuredName)}">
        </div>
        <div class="irir-form-group">
            <label>Employee No.</label>
            <input type="text" class="irir-input-field" id="dEmployeeNo" placeholder="Employee number" value="${esc(irir.employeeNo)}">
        </div>
        <div class="irir-form-group">
            <label>Injury Type &amp; Body Part Injured</label>
            <div class="irir-form-group" style="margin-bottom:12px;">
                <label style="font-weight:normal;font-size:12px;color:#5e6c84;">Injury Type</label>
                <div class="multiselect-wrapper single-select-wrapper">
                    <div class="multiselect-trigger" onclick="toggleSingleSelect('dInjuryTypeDd','dInjuryTypeLabel')" id="dInjuryTypeTrigger">
                        <span id="dInjuryTypeLabel">${irir.injuryType || '-- Select Injury Type --'}</span>
                        <span class="ms-arrow">&#9660;</span>
                    </div>
                    <div class="multiselect-dropdown" id="dInjuryTypeDd">
                        <div class="ss-option${irir.injuryType==='Cut / Laceration'?' ss-selected':''}" onclick="setSingleSelect('dInjuryTypeDd','dInjuryTypeLabel','dInjuryType','Cut / Laceration')">Cut / Laceration</div>
                        <div class="ss-option${irir.injuryType==='Fracture'?' ss-selected':''}" onclick="setSingleSelect('dInjuryTypeDd','dInjuryTypeLabel','dInjuryType','Fracture')">Fracture</div>
                        <div class="ss-option${irir.injuryType==='Burn'?' ss-selected':''}" onclick="setSingleSelect('dInjuryTypeDd','dInjuryTypeLabel','dInjuryType','Burn')">Burn</div>
                        <div class="ss-option${irir.injuryType==='Crush Injury'?' ss-selected':''}" onclick="setSingleSelect('dInjuryTypeDd','dInjuryTypeLabel','dInjuryType','Crush Injury')">Crush Injury</div>
                        <div class="ss-option${irir.injuryType==='Sprain / Strain'?' ss-selected':''}" onclick="setSingleSelect('dInjuryTypeDd','dInjuryTypeLabel','dInjuryType','Sprain / Strain')">Sprain / Strain</div>
                        <div class="ss-option${irir.injuryType==='Abrasion'?' ss-selected':''}" onclick="setSingleSelect('dInjuryTypeDd','dInjuryTypeLabel','dInjuryType','Abrasion')">Abrasion</div>
                        <div class="ss-option${irir.injuryType==='Eye Injury'?' ss-selected':''}" onclick="setSingleSelect('dInjuryTypeDd','dInjuryTypeLabel','dInjuryType','Eye Injury')">Eye Injury</div>
                        <div class="ss-option${irir.injuryType==='Chemical Exposure'?' ss-selected':''}" onclick="setSingleSelect('dInjuryTypeDd','dInjuryTypeLabel','dInjuryType','Chemical Exposure')">Chemical Exposure</div>
                        <div class="ss-option${irir.injuryType==='Electric Shock'?' ss-selected':''}" onclick="setSingleSelect('dInjuryTypeDd','dInjuryTypeLabel','dInjuryType','Electric Shock')">Electric Shock</div>
                        <div class="ss-option${irir.injuryType==='No Injury (Near Miss)'?' ss-selected':''}" onclick="setSingleSelect('dInjuryTypeDd','dInjuryTypeLabel','dInjuryType','No Injury (Near Miss)')">No Injury (Near Miss)</div>
                        <div class="ms-add-row">
                            <input type="text" class="ms-add-input" id="dInjuryTypeCustomInput" placeholder="Add option…">
                            <button type="button" class="ms-add-btn" onclick="addSingleSelectOption('dInjuryTypeDd','dInjuryTypeCustomInput','dInjuryType','dInjuryTypeLabel')">Add</button>
                        </div>
                    </div>
                    <input type="hidden" id="dInjuryType" value="${esc(irir.injuryType||'')}">
                </div>
            </div>
            <div class="irir-form-group" style="margin-bottom:0;">
                <label style="font-weight:normal;font-size:12px;color:#5e6c84;">Body Part Injured</label>
                <div class="multiselect-wrapper single-select-wrapper">
                    <div class="multiselect-trigger" onclick="toggleSingleSelect('dBodyPartDd','dBodyPartLabel')" id="dBodyPartTrigger">
                        <span id="dBodyPartLabel">${irir.bodyPart || '-- Select Body Part --'}</span>
                        <span class="ms-arrow">&#9660;</span>
                    </div>
                    <div class="multiselect-dropdown" id="dBodyPartDd">
                        <div class="ss-option${irir.bodyPart==='Head'?' ss-selected':''}" onclick="setSingleSelect('dBodyPartDd','dBodyPartLabel','dBodyPart','Head')">Head</div>
                        <div class="ss-option${irir.bodyPart==='Eye'?' ss-selected':''}" onclick="setSingleSelect('dBodyPartDd','dBodyPartLabel','dBodyPart','Eye')">Eye</div>
                        <div class="ss-option${irir.bodyPart==='Face'?' ss-selected':''}" onclick="setSingleSelect('dBodyPartDd','dBodyPartLabel','dBodyPart','Face')">Face</div>
                        <div class="ss-option${irir.bodyPart==='Hand'?' ss-selected':''}" onclick="setSingleSelect('dBodyPartDd','dBodyPartLabel','dBodyPart','Hand')">Hand</div>
                        <div class="ss-option${irir.bodyPart==='Finger'?' ss-selected':''}" onclick="setSingleSelect('dBodyPartDd','dBodyPartLabel','dBodyPart','Finger')">Finger</div>
                        <div class="ss-option${irir.bodyPart==='Arm'?' ss-selected':''}" onclick="setSingleSelect('dBodyPartDd','dBodyPartLabel','dBodyPart','Arm')">Arm</div>
                        <div class="ss-option${irir.bodyPart==='Leg'?' ss-selected':''}" onclick="setSingleSelect('dBodyPartDd','dBodyPartLabel','dBodyPart','Leg')">Leg</div>
                        <div class="ss-option${irir.bodyPart==='Foot'?' ss-selected':''}" onclick="setSingleSelect('dBodyPartDd','dBodyPartLabel','dBodyPart','Foot')">Foot</div>
                        <div class="ss-option${irir.bodyPart==='Back'?' ss-selected':''}" onclick="setSingleSelect('dBodyPartDd','dBodyPartLabel','dBodyPart','Back')">Back</div>
                        <div class="ss-option${irir.bodyPart==='Chest'?' ss-selected':''}" onclick="setSingleSelect('dBodyPartDd','dBodyPartLabel','dBodyPart','Chest')">Chest</div>
                        <div class="ms-add-row">
                            <input type="text" class="ms-add-input" id="dBodyPartCustomInput" placeholder="Add option…">
                            <button type="button" class="ms-add-btn" onclick="addSingleSelectOption('dBodyPartDd','dBodyPartCustomInput','dBodyPart','dBodyPartLabel')">Add</button>
                        </div>
                    </div>
                    <input type="hidden" id="dBodyPart" value="${esc(irir.bodyPart||'')}">
                </div>
            </div>
        </div>
        <div class="irir-form-group">
            <label>Name of shop where the accident / incident has happened</label>
            <div class="multiselect-wrapper single-select-wrapper">
                <div class="multiselect-trigger" onclick="toggleSingleSelect('dDepartmentDd','dDepartmentLabel')" id="dDepartmentTrigger">
                    <span id="dDepartmentLabel">${irir.department || '-- Select --'}</span>
                    <span class="ms-arrow">&#9660;</span>
                </div>
                <div class="multiselect-dropdown" id="dDepartmentDd">
                    <div class="ss-option${irir.department==='Production'?' ss-selected':''}" onclick="setSingleSelect('dDepartmentDd','dDepartmentLabel','dDepartment','Production')">Production</div>
                    <div class="ss-option${irir.department==='Assembly'?' ss-selected':''}" onclick="setSingleSelect('dDepartmentDd','dDepartmentLabel','dDepartment','Assembly')">Assembly</div>
                    <div class="ss-option${irir.department==='Maintenance'?' ss-selected':''}" onclick="setSingleSelect('dDepartmentDd','dDepartmentLabel','dDepartment','Maintenance')">Maintenance</div>
                    <div class="ss-option${irir.department==='Quality'?' ss-selected':''}" onclick="setSingleSelect('dDepartmentDd','dDepartmentLabel','dDepartment','Quality')">Quality</div>
                    <div class="ss-option${irir.department==='Warehouse'?' ss-selected':''}" onclick="setSingleSelect('dDepartmentDd','dDepartmentLabel','dDepartment','Warehouse')">Warehouse</div>
                    <div class="ss-option${irir.department==='Utility'?' ss-selected':''}" onclick="setSingleSelect('dDepartmentDd','dDepartmentLabel','dDepartment','Utility')">Utility</div>
                    <div class="ss-option${irir.department==='Packing'?' ss-selected':''}" onclick="setSingleSelect('dDepartmentDd','dDepartmentLabel','dDepartment','Packing')">Packing</div>
                    <div class="ss-option${irir.department==='Others'?' ss-selected':''}" onclick="setSingleSelect('dDepartmentDd','dDepartmentLabel','dDepartment','Others')">Others</div>
                    <div class="ms-add-row">
                        <input type="text" class="ms-add-input" id="dDepartmentCustomInput" placeholder="Add option…">
                        <button type="button" class="ms-add-btn" onclick="addSingleSelectOption('dDepartmentDd','dDepartmentCustomInput','dDepartment','dDepartmentLabel')">Add</button>
                    </div>
                </div>
                <input type="hidden" id="dDepartment" value="${esc(irir.department||'')}">
            </div>
        </div>
        <div class="irir-form-group">
            <label>Exact location where the accident / incident has happened</label>
            <input type="text" class="irir-input-field" id="dLocation" placeholder="Describe exact location…" value="${esc(irir.location)}">
        </div>
        <div class="irir-form-group">
            <label>Brief Narration of Accident / Incident : (5W+1H)</label>
            <div class="narration-table">
                <div class="narration-row"><span class="narration-label">What :</span><textarea class="irir-textarea-field narration-ta" id="dNarWhat" placeholder="What happened?">${esc(irir.narWhat)}</textarea></div>
                <div class="narration-row"><span class="narration-label">When :</span><textarea class="irir-textarea-field narration-ta" id="dNarWhen" placeholder="When did it happen?">${esc(irir.narWhen)}</textarea></div>
                <div class="narration-row"><span class="narration-label">Where :</span><textarea class="irir-textarea-field narration-ta" id="dNarWhere" placeholder="Where did it happen?">${esc(irir.narWhere)}</textarea></div>
                <div class="narration-row"><span class="narration-label">Who :</span><textarea class="irir-textarea-field narration-ta" id="dNarWho" placeholder="Who was involved?">${esc(irir.narWho)}</textarea></div>
                <div class="narration-row"><span class="narration-label">Which :</span><textarea class="irir-textarea-field narration-ta" id="dNarWhich" placeholder="Which machine / tool / process?">${esc(irir.narWhich)}</textarea></div>
                <div class="narration-row"><span class="narration-label">How :</span><textarea class="irir-textarea-field narration-ta" id="dNarHow" placeholder="How did it happen?">${esc(irir.narHow)}</textarea></div>
            </div>
        </div>
        <div class="irir-form-group">
            <label>Immediate Actions :</label>
            <textarea class="irir-textarea-field" id="dImmediateActions" placeholder="Describe immediate actions taken…">${esc(irir.immediateActions)}</textarea>
        </div>
        <div class="irir-form-group">
            <label>Prepared by Frontline Supervisor/Manager (Name &amp; Signature)</label>
            <input type="text" class="irir-input-field" id="dPreparedBy" placeholder="Name &amp; Signature" value="${esc(irir.preparedBy)}">
        </div>
        <div class="irir-form-group">
            <label>Date :</label>
            <input type="date" class="irir-input-field" id="dPreparedDate" value="${esc(irir.preparedDate)}">
        </div>
        <div class="irir-form-group">
            <label>Work Permit or any system followed</label>
            <select class="irir-select-field" id="dWorkPermit" onchange="dpWorkPermitChange()">
                <option value="">-- Select --</option>
                ${selOpts(['Yes','No'], irir.workPermit)}
            </select>
        </div>
        <div class="irir-form-group" id="dWorkPermitDetailsGroup" style="${irir.workPermit==='Yes'?'':'display:none;'}">
            <label style="font-size:12px;font-weight:600;color:#5e6c84;">Select PTW ID</label>
            <select class="irir-select-field" id="dPtwId">
                <option value="">-- Select PTW ID --</option>
                <option ${irir.workPermitDetails==='PTW-001'?'selected':''}>PTW-001</option>
                <option ${irir.workPermitDetails==='PTW-002'?'selected':''}>PTW-002</option>
                <option ${irir.workPermitDetails==='PTW-003'?'selected':''}>PTW-003</option>
                <option ${irir.workPermitDetails==='PTW-004'?'selected':''}>PTW-004</option>
            </select>
        </div>
        <div class="part-save-row"><button type="button" class="part-save-btn" onclick="saveDetailPartA()">&#128190; Save Part A</button></div>

        <!-- PART B -->
        <div class="form-section-banner" style="margin-top:16px;">
            <span class="section-letter">B</span>
            <div>
                <div class="section-title-text">PART B — Incident Investigation</div>
                <div class="section-note-text">Complete this part within 24 hours from the time of accident / incident and initiate corrective action</div>
            </div>
        </div>
        <div class="irir-form-group">
            <label>1. Team Members (should consist of Shop Manager, Worker, EHS, Maintenance) :</label>
            <div style="gap:10px;">
                <div class="irir-form-group" style="margin-bottom:8px;">
                    <label style="font-weight:normal;font-size:12px;color:#5e6c84;">Name</label>
                    <input type="text" class="irir-input-field" id="dTeamMemberName" placeholder="Team member name" value="${esc(irir.teamMemberName||'')}">
                </div>
                <div class="irir-form-group" style="margin-bottom:0;">
                    <label style="font-weight:normal;font-size:12px;color:#5e6c84;">Designation</label>
                    <input type="text" class="irir-input-field" id="dTeamMemberDesignation" placeholder="Designation" value="${esc(irir.teamMemberDesignation||'')}">
                </div>
            </div>
        </div>
        <div class="irir-form-group">
            <label>2. Witness Statement (Co worker/Supervisor/Manager/Shift Incharge/Injured Person) :</label>
            <select class="irir-select-field" id="dWitnessType">
                <option value="">-- Select Witness Type --</option>
                ${selOpts(['Co-worker','Supervisor','Manager','Shift Incharge','Injured Person','Others'], irir.witnessType||'')}
            </select>
            <textarea class="irir-textarea-field" id="dWitnessStatement" placeholder="Summarise witness statement…" style="margin-top:8px;">${esc(irir.witnessStatement)}</textarea>
        </div>

        <div class="sixm-label">Accident / Incident Investigation &amp; Analysis (6M &amp; Why-Why Analysis)</div>

        <!-- MAN -->
        <div class="irir-form-group">
            <label>Man</label>
            <div class="multiselect-wrapper">
                <div class="multiselect-trigger" onclick="toggleMultiSelect('dpManDd')" id="dpManTrigger">
                    <span id="dpManLabel">${savedLabel(irir.man)}</span><span class="ms-arrow">&#9660;</span>
                </div>
                <div class="multiselect-dropdown" id="dpManDd">
                    ${sixMOpts('dpMan',['Not aware of requirement','Bypassing safety equipment','Violation of defined rule','Use of wrong tools','Failed to check','Failed to use controls','Unsafe body position','Horseplay','Unauthorized operation','Not followed the procedure','Action of co-employee','Over confidence','Diverted attention','Fatigue','Overtime working','Not applicable'], irir.man)}
                    <div class="ms-add-row"><input type="text" class="ms-add-input" id="dpManCustom" placeholder="Add option…"><button type="button" class="ms-add-btn" onclick="dpAddCustom('dpMan','dpManCustom','dpManDd')">Add</button></div>
                </div>
            </div>
        </div>
        <div id="dpWwContainer_dpMan"></div>

        <!-- MACHINE -->
        <div class="irir-form-group">
            <label>Machine</label>
            <div class="multiselect-wrapper">
                <div class="multiselect-trigger" onclick="toggleMultiSelect('dpMachineDd')" id="dpMachineTrigger">
                    <span id="dpMachineLabel">${savedLabel(irir.machine)}</span><span class="ms-arrow">&#9660;</span>
                </div>
                <div class="multiselect-dropdown" id="dpMachineDd">
                    ${sixMOpts('dpMachine',['Inadequate guarding','Failure of interlock','Failure of photo sensor','Failure of machine controls','Malfunction of controls','Non-standard equipment','No lockout provision','No interlock','No sensor','No Safety guard','Unearthed machine','Static charge','Damaged machine / tools / equipment','Sharp Machine Part / Tool','No Lifting arrangement','Not applicable'], irir.machine)}
                    <div class="ms-add-row"><input type="text" class="ms-add-input" id="dpMachineCustom" placeholder="Add option…"><button type="button" class="ms-add-btn" onclick="dpAddCustom('dpMachine','dpMachineCustom','dpMachineDd')">Add</button></div>
                </div>
            </div>
        </div>
        <div id="dpWwContainer_dpMachine"></div>

        <!-- MATERIAL -->
        <div class="irir-form-group">
            <label>Material</label>
            <div class="multiselect-wrapper">
                <div class="multiselect-trigger" onclick="toggleMultiSelect('dpMaterialDd')" id="dpMaterialTrigger">
                    <span id="dpMaterialLabel">${savedLabel(irir.material)}</span><span class="ms-arrow">&#9660;</span>
                </div>
                <div class="multiselect-dropdown" id="dpMaterialDd">
                    ${sixMOpts('dpMaterial',['Hot / cold object','Hazardous chemical','Non-standard material','Reworked material','Oily material','Heavy accumulation of vapor / gas / dust','Wrong selection of material','Sharp edges','Adverse physical / chemical properties','Heavy Object','Not applicable'], irir.material)}
                    <div class="ms-add-row"><input type="text" class="ms-add-input" id="dpMaterialCustom" placeholder="Add option…"><button type="button" class="ms-add-btn" onclick="dpAddCustom('dpMaterial','dpMaterialCustom','dpMaterialDd')">Add</button></div>
                </div>
            </div>
        </div>
        <div id="dpWwContainer_dpMaterial"></div>

        <!-- METHOD -->
        <div class="irir-form-group">
            <label>Method</label>
            <div class="multiselect-wrapper">
                <div class="multiselect-trigger" onclick="toggleMultiSelect('dpMethodDd')" id="dpMethodTrigger">
                    <span id="dpMethodLabel">${savedLabel(irir.method)}</span><span class="ms-arrow">&#9660;</span>
                </div>
                <div class="multiselect-dropdown" id="dpMethodDd">
                    ${sixMOpts('dpMethod',['Improper loading height','Manual handling','No safe procedure','Non-standard methods','Inadequate maintenance','Absence of planning','Inadequate contractor management','Not applicable'], irir.method)}
                    <div class="ms-add-row"><input type="text" class="ms-add-input" id="dpMethodCustom" placeholder="Add option…"><button type="button" class="ms-add-btn" onclick="dpAddCustom('dpMethod','dpMethodCustom','dpMethodDd')">Add</button></div>
                </div>
            </div>
        </div>
        <div id="dpWwContainer_dpMethod"></div>

        <!-- MEASUREMENT -->
        <div class="irir-form-group">
            <label>Measurement</label>
            <div class="multiselect-wrapper">
                <div class="multiselect-trigger" onclick="toggleMultiSelect('dpMeasurementDd')" id="dpMeasurementTrigger">
                    <span id="dpMeasurementLabel">${savedLabel(irir.measurement)}</span><span class="ms-arrow">&#9660;</span>
                </div>
                <div class="multiselect-dropdown" id="dpMeasurementDd">
                    ${sixMOpts('dpMeasurement',['Inadequate monitoring','Low illumination','Heavy dust / fume at work place','Congested Layout','Inadequate risk assessment','Uneven floor / surface','Excess vibration','Blind corner','Poor housekeeping','Poor access / inadequate space','Lack of visual displays at work place','Not applicable'], irir.measurement)}
                    <div class="ms-add-row"><input type="text" class="ms-add-input" id="dpMeasurementCustom" placeholder="Add option…"><button type="button" class="ms-add-btn" onclick="dpAddCustom('dpMeasurement','dpMeasurementCustom','dpMeasurementDd')">Add</button></div>
                </div>
            </div>
        </div>
        <div id="dpWwContainer_dpMeasurement"></div>

        <!-- MOTHER NATURE -->
        <div class="irir-form-group">
            <label>Mother Nature</label>
            <div class="multiselect-wrapper">
                <div class="multiselect-trigger" onclick="toggleMultiSelect('dpMotherNatureDd')" id="dpMotherNatureTrigger">
                    <span id="dpMotherNatureLabel">${savedLabel(irir.motherNature)}</span><span class="ms-arrow">&#9660;</span>
                </div>
                <div class="multiselect-dropdown" id="dpMotherNatureDd">
                    ${sixMOpts('dpMotherNature',['Ambient temperature','Earthquake','Heavy Rain','Storm','Radiations','Dense population','Sound pollution','Water pollution','Air pollution','Poor Visibility / sunlight / Fog','Slippery land / surface','Not applicable'], irir.motherNature)}
                    <div class="ms-add-row"><input type="text" class="ms-add-input" id="dpMotherNatureCustom" placeholder="Add option…"><button type="button" class="ms-add-btn" onclick="dpAddCustom('dpMotherNature','dpMotherNatureCustom','dpMotherNatureDd')">Add</button></div>
                </div>
            </div>
        </div>
        <div id="dpWwContainer_dpMotherNature"></div>

        <!-- CAPA -->
        <div class="irir-form-group" style="margin-top:20px;">
            <label>Corrective Actions :</label>
            <div class="capa-id-row">
                <span class="capa-id-label">CAPA ID :</span>
                <span class="capa-id-value irir-auto-id-field" id="dpCapaIdDisplay">${esc(irir.capaId||irir.capaIdRef1||'Auto on Save')}</span>
            </div>
            <div class="ca-table-wrapper">
                <table class="ca-table" id="dpCaTable">
                    <thead><tr>
                        <th style="width:40px;">#</th>
                        <th style="width:220px;">Corrective Action</th>
                        <th style="width:130px;">Responsibility</th>
                        <th style="width:110px;">Status</th>
                        <th style="width:60px;text-align:center;">+/&#8722;</th>
                    </tr></thead>
                    <tbody id="dpCaTableBody"></tbody>
                </table>
            </div>
            <div class="irir-form-group" style="margin-top:12px;">
                <label>Is this corrective action needed for any other shopfloor?</label>
                <div class="radio-group">
                    <label class="radio-label"><input type="radio" name="dpCapaShopfloor" value="Yes" onchange="dpCapaShopfloorChange(this)"> Yes</label>
                    <label class="radio-label"><input type="radio" name="dpCapaShopfloor" value="No" onchange="dpCapaShopfloorChange(this)" checked> No</label>
                </div>
                <div id="dpCapaShopfloorGroup" style="display:none;margin-top:8px;">
                    <label style="font-size:12px;font-weight:600;color:#5e6c84;display:block;margin-bottom:4px;">Select Shopfloor(s)</label>
                    <div class="multiselect-wrapper">
                        <div class="multiselect-trigger" onclick="toggleMultiSelect('dpShopfloorDd')" id="dpShopfloorTrigger">
                            <span id="dpShopfloorLabel">-- Select shopfloor(s) --</span><span class="ms-arrow">&#9660;</span>
                        </div>
                        <div class="multiselect-dropdown" id="dpShopfloorDd">
                            <label class="ms-option"><input type="checkbox" value="Production"> Production</label>
                            <label class="ms-option"><input type="checkbox" value="Assembly"> Assembly</label>
                            <label class="ms-option"><input type="checkbox" value="Maintenance"> Maintenance</label>
                            <label class="ms-option"><input type="checkbox" value="Quality"> Quality</label>
                            <label class="ms-option"><input type="checkbox" value="Warehouse"> Warehouse</label>
                            <label class="ms-option"><input type="checkbox" value="Utility"> Utility</label>
                            <label class="ms-option"><input type="checkbox" value="Packing"> Packing</label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="irir-form-group" style="margin-top:8px;">
                <label>Target Date of CAPA</label>
                <input type="date" class="irir-input-field" id="dpCapaTargetDate" value="${esc(irir.capaTargetDate||'')}">
            </div>
            <div class="irir-form-group" style="margin-top:8px;">
                <label>CAPA Type</label>
                <select class="irir-select-field" id="dpCapaType">
                    <option value="">-- Select CAPA Type --</option>
                    ${selOpts(['Elimination','Substitution','Engineering Controls','Administrative Controls','PPE'], irir.capaType||'')}
                </select>
            </div>
            <div class="irir-form-group" style="margin-top:12px;">
                <label>OCP/WI &#8212; WIS modified &amp; new startup check sheet introduced</label>
                <input type="text" class="irir-input-field" id="dSyscWisRef" value="${esc(irir.syscWisRef||'')}" placeholder="OCP/WI reference">
            </div>
            <div class="irir-form-group" style="margin-top:8px;">
                <label>Status of CAPA</label>
                <select class="irir-select-field" id="dpCapaStatus">
                    <option value="">-- Select --</option>
                    ${selOpts(['Open','Close'], irir.capaStatus||'')}
                </select>
            </div>
        </div>

        <!-- Root Cause -->
        <div class="irir-form-group">
            <label>Root Cause (Act / Condition) :</label>
            <select class="irir-select-field" id="dRootCause" onchange="dpRootCauseChange()">
                <option value="">-- Select Root Cause --</option>
                ${selOpts(['Unsafe Act','Unsafe Condition'], irir.rootCause)}
            </select>
        </div>
        <div class="irir-form-group" id="dpUnsafeActGroup" style="${irir.rootCause?'':'display:none;'}">
            <label id="dpUnsafeActLabel">${irir.rootCause==='Unsafe Condition'?'Brief of the unsafe condition':'Brief of the unsafe act'}</label>
            <textarea class="irir-textarea-field" id="dUnsafeActBrief" placeholder="Brief description…">${esc(irir.unsafeActBrief||'')}</textarea>
        </div>

        <!-- System Corrections -->
        <div class="sys-corrections-box">
            <div class="sixm-label" style="margin-bottom:14px;">System Corrections</div>
            <div class="irir-form-group">
                <label>HIRA Study — HIRA revisited and updated</label>
                <select class="irir-select-field" id="dSyscHiraYesNo" onchange="dpHiraChange()">
                    <option value="">-- Select --</option>
                    ${selOpts(['Yes','No'], irir.syscHiraYesNo)}
                </select>
                <div id="dpHiraYesGroup" style="${irir.syscHiraYesNo==='Yes'?'margin-top:8px;':'display:none;margin-top:8px;'}">
                    <div class="irir-form-group" style="margin-bottom:8px;">
                        <label style="font-size:12px;font-weight:600;color:#5e6c84;">HIRA Number</label>
                        <select class="irir-select-field" id="dSyscHiraRef">
                            <option value="">-- Select HIRA No. --</option>
                            <option ${irir.syscHiraRef==='HIRA-001'?'selected':''}>HIRA-001</option>
                            <option ${irir.syscHiraRef==='HIRA-002'?'selected':''}>HIRA-002</option>
                            <option ${irir.syscHiraRef==='HIRA-003'?'selected':''}>HIRA-003</option>
                        </select>
                    </div>
                    <div class="irir-form-group" style="margin-bottom:8px;">
                        <label style="font-size:12px;font-weight:600;color:#5e6c84;">Risk Modified Date &amp; Time</label>
                        <input type="date" class="irir-input-field" id="dSyscHiraDate" value="${esc(irir.syscHiraDate||'')}">
                    </div>
                    <div class="irir-form-group" style="margin-bottom:0;">
                        <label style="font-size:12px;font-weight:600;color:#5e6c84;">Any New Action Amended</label>
                        <textarea class="irir-textarea-field" id="dpHiraNewAction" placeholder="Describe new action if any…" style="min-height:60px;">${esc(irir.hiraNewAction||'')}</textarea>
                    </div>
                </div>
                <div id="dpHiraNoGroup" style="${irir.syscHiraYesNo==='No'?'margin-top:8px;':'display:none;margin-top:8px;'}">
                    <label style="font-size:12px;font-weight:600;color:#5e6c84;display:block;margin-bottom:4px;">Target Date of Completion (HIRA)</label>
                    <input type="date" class="irir-input-field" id="dpHiraTdc" value="${esc(irir.hiraTdc||'')}">
                </div>
            </div>
            <div class="irir-form-group">
                <label>EAI Study</label>
                <select class="irir-select-field" id="dSyscEaiYesNo" onchange="dpEaiChange()">
                    <option value="">-- Select --</option>
                    ${selOpts(['Yes','No','Not applicable'], irir.syscEaiYesNo)}
                </select>
                <div id="dpEaiYesGroup" style="${irir.syscEaiYesNo==='Yes'?'margin-top:8px;':'display:none;margin-top:8px;'}">
                    <label style="font-size:12px;font-weight:600;color:#5e6c84;display:block;margin-bottom:4px;">EAI Reference Number</label>
                    <input type="text" class="irir-input-field" id="dSyscEaiRef" value="${esc(irir.syscEaiRef||'')}" placeholder="Reference EAI no.">
                </div>
                <div id="dpEaiNoGroup" style="${irir.syscEaiYesNo==='No'?'margin-top:8px;':'display:none;margin-top:8px;'}">
                    <div class="irir-form-group" style="margin-bottom:0;">
                        <label style="font-size:12px;font-weight:600;color:#5e6c84;">Responsible Person</label>
                        <input type="text" class="irir-input-field" id="dpEaiNoResp" value="${esc(irir.eaiNoResp||'')}" placeholder="Responsible person">
                    </div>
                    <div class="irir-form-group" style="margin-bottom:0;margin-top:8px;">
                        <label style="font-size:12px;font-weight:600;color:#5e6c84;">Target Date of Completion</label>
                        <input type="date" class="irir-input-field" id="dpEaiNoTdc" value="${esc(irir.eaiNoTdc||'')}">
                    </div>
                </div>
            </div>
            <div class="irir-form-group">
                <label>Responsibility :</label>
                <input type="text" class="irir-input-field" id="dSyscResp" value="${esc(irir.syscResp||'')}" placeholder="Responsible person">
            </div>
            <div class="irir-form-group">
                <label>Target Date of Completion :</label>
                <input type="date" class="irir-input-field" id="dSyscTargetDate" value="${esc(irir.syscTargetDate||'')}">
            </div>
        </div>

        <div class="irir-form-group" style="margin-top:16px;">
            <label>Prepared By Front-line Supervisor / Manager (Name &amp; Signature) :</label>
            <input type="text" class="irir-input-field" id="dPartBPreparedBy" value="${esc(irir.partBPreparedBy||'')}" placeholder="Name &amp; Signature">
        </div>
        <div class="irir-form-group">
            <label>Date :</label>
            <input type="date" class="irir-input-field" id="dPartBPreparedDate" value="${esc(irir.partBPreparedDate||'')}">
        </div>
        <div class="irir-form-group">
            <label>Approved By Department Head (Name &amp; Signature) :</label>
            <input type="text" class="irir-input-field" id="dPartBApprovedBy" value="${esc(irir.partBApprovedBy||'')}" placeholder="Name &amp; Signature">
        </div>
        <div class="irir-form-group">
            <label>Date :</label>
            <input type="date" class="irir-input-field" id="dPartBApprovedDate" value="${esc(irir.partBApprovedDate||'')}">
        </div>
        <div class="part-save-row"><button type="button" class="part-save-btn" onclick="saveDetailPartB()">&#128190; Save Part B</button></div>

        <!-- PART C -->
        <div class="form-section-banner" style="margin-top:16px;">
            <span class="section-letter">C</span>
            <div><div class="section-title-text">PART C — To be filled by Safety Officer</div></div>
        </div>
        <div class="irir-form-group">
            <label>Source/Situation of Injury / Incident :</label>
            <textarea class="irir-textarea-field" id="dSourceSituation" placeholder="Describe source or situation…">${esc(irir.sourceSituation||'')}</textarea>
        </div>
        <div class="irir-form-group">
            <label>Other Remarks :</label>
            <textarea class="irir-textarea-field" id="dOtherRemarks" placeholder="Any other remarks…">${esc(irir.otherRemarks||'')}</textarea>
        </div>
        <div class="irir-form-group">
            <label>Date of return to work :</label>
            <input type="date" class="irir-input-field" id="dReturnDate" value="${esc(irir.returnDate||'')}" onchange="dpCalcMandays()">
        </div>
        <div class="irir-form-group">
            <label>Man-days Lost :</label>
            <input type="text" class="irir-input-field irir-auto-id-field" id="dMandaysLost" disabled placeholder="Auto-calculated" value="${esc(irir.mandaysLost||'')}">
            <p class="irir-helper-text">If person left today, tomorrow counts as Day 1</p>
        </div>
        <div class="irir-form-group">
            <label>Reoccurrence of similar accident / incident :</label>
            <select class="irir-select-field" id="dReoccurrence" onchange="dpHandleReoccurrenceChange()">
                <option value="">-- Select --</option>
                ${selOpts(['Yes','No'], irir.reoccurrence)}
            </select>
            <div id="dpReoccurrenceIncidentGroup" style="${irir.reoccurrence==='Yes'?'margin-top:8px;':'display:none;margin-top:8px;'}">
                <label style="font-size:12px;font-weight:600;color:#5e6c84;display:block;margin-bottom:4px;">Select Previous Incident ID</label>
                <select class="irir-select-field" id="dpReoccurrenceIncidentId">
                    <option value="">-- Select Incident ID --</option>
                </select>
            </div>
        </div>
        <div class="part-save-row"><button type="button" class="part-save-btn" onclick="saveDetailPartC()">&#128190; Save Part C</button></div>

        <!-- PART D -->
        <div class="form-section-banner" style="margin-top:16px;">
            <span class="section-letter">D</span>
            <div>
                <div class="section-title-text">PART D — Cost Impact</div>
                <div class="section-note-text">Total Cost Impact in Rupees is auto-calculated</div>
            </div>
        </div>
        <div class="cost-grid-modal">
            <div class="cost-item"><label>Man (&#8377;)</label><input type="number" class="irir-input-field cost-inp" id="dCostMan" min="0" placeholder="0" value="${esc(irir.costMan||'')}" oninput="dpCalcTotal()"></div>
            <div class="cost-item"><label>Machine (&#8377;)</label><input type="number" class="irir-input-field cost-inp" id="dCostMachine" min="0" placeholder="0" value="${esc(irir.costMachine||'')}" oninput="dpCalcTotal()"></div>
            <div class="cost-item"><label>Material (&#8377;)</label><input type="number" class="irir-input-field cost-inp" id="dCostMaterial" min="0" placeholder="0" value="${esc(irir.costMaterial||'')}" oninput="dpCalcTotal()"></div>
            <div class="cost-item"><label>Method (&#8377;)</label><input type="number" class="irir-input-field cost-inp" id="dCostMethod" min="0" placeholder="0" value="${esc(irir.costMethod||'')}" oninput="dpCalcTotal()"></div>
            <div class="cost-item"><label>Management (&#8377;)</label><input type="number" class="irir-input-field cost-inp" id="dCostManagement" min="0" placeholder="0" value="${esc(irir.costManagement||'')}" oninput="dpCalcTotal()"></div>
            <div class="cost-item"><label>Mother Nature (&#8377;)</label><input type="number" class="irir-input-field cost-inp" id="dCostNature" min="0" placeholder="0" value="${esc(irir.costNature||'')}" oninput="dpCalcTotal()"></div>
        </div>
        <div class="cost-total-modal">
            <span>Total Cost Impact in Rupees</span>
            <span class="cost-total-val">&#8377; <span id="dpTotalCost">${parseFloat(irir.totalCost||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></span>
        </div>

        <div class="sixm-label" style="margin-top:20px;">Corrective Actions — Effectiveness Monitoring</div>
        <div id="dpEffContainer"></div>

        <div class="irir-form-group" style="margin-top:12px;">
            <label>Incident Status</label>
            <select class="irir-select-field" id="dStatus">
                <option value="">-- Select Status --</option>
                ${selOpts(['Open','Under Investigation','Closed'], irir.status)}
            </select>
        </div>
        <div class="part-save-row" style="margin-top:14px;"><button type="button" class="part-save-btn" onclick="saveDetailPartD()">&#128190; Save Part D</button></div>
    `;

    // Init dynamic sections
    dpInitCaTable(irir.capaRows || []);
    dpInitEffMonths(irir.effMonths || []);
    dpRestoreWhyWhy(irir);

    document.getElementById('detailSidePanel').classList.add('open');
    document.getElementById('detailPanelOverlay').classList.add('show');
}

// ── dp helpers ──────────────────────────────────────────────

function dpWorkPermitChange() {
    var v = document.getElementById('dWorkPermit').value;
    var g = document.getElementById('dWorkPermitDetailsGroup');
    if (g) g.style.display = v==='Yes' ? '' : 'none';
}
function dpRootCauseChange() {
    var v = document.getElementById('dRootCause').value;
    var g = document.getElementById('dpUnsafeActGroup');
    var l = document.getElementById('dpUnsafeActLabel');
    if (g) g.style.display = v ? '' : 'none';
    if (l) l.textContent = v==='Unsafe Condition' ? 'Brief of the unsafe condition' : 'Brief of the unsafe act';
}
function dpHiraChange() {
    var v = document.getElementById('dSyscHiraYesNo').value;
    var y = document.getElementById('dpHiraYesGroup');
    var n = document.getElementById('dpHiraNoGroup');
    if (y) y.style.display = v==='Yes' ? '' : 'none';
    if (n) n.style.display = v==='No'  ? '' : 'none';
}
function dpEaiChange() {
    var v = document.getElementById('dSyscEaiYesNo').value;
    var y = document.getElementById('dpEaiYesGroup');
    var n = document.getElementById('dpEaiNoGroup');
    if (y) y.style.display = v==='Yes' ? '' : 'none';
    if (n) n.style.display = v==='No'  ? '' : 'none';
}
function dpCapaShopfloorChange(el) {
    var g = document.getElementById('dpCapaShopfloorGroup');
    if (g) g.style.display = el.value==='Yes' ? '' : 'none';
}
function dpCalcMandays() {
    var rd = document.getElementById('dReturnDate');
    var ml = document.getElementById('dMandaysLost');
    if (!rd||!ml||!rd.value) return;
    var ret = new Date(rd.value); var today = new Date(); today.setHours(0,0,0,0);
    var diff = Math.ceil((ret - today) / 86400000);
    ml.value = diff > 0 ? diff : 0;
}
function dpCalcTotal() {
    var ids = ['dCostMan','dCostMachine','dCostMaterial','dCostMethod','dCostManagement','dCostNature'];
    var total = ids.reduce(function(s,id){ var el=document.getElementById(id); return s+(el?parseFloat(el.value)||0:0); }, 0);
    var el = document.getElementById('dpTotalCost');
    if (el) el.textContent = total.toLocaleString('en-IN',{minimumFractionDigits:2});
    return total;
}

// 6M multiselect
function dpOnSixMChange(key) {
    var dd = document.getElementById(key+'Dd');
    var lbl = document.getElementById(key+'Label');
    var con = document.getElementById('dpWwContainer_'+key);
    if (!dd||!con) return;
    var checked = Array.from(dd.querySelectorAll('input[type="checkbox"]:checked')).map(function(cb){return cb.value;}).filter(function(v){return v!=='Not applicable';});
    if (lbl) lbl.textContent = checked.length ? checked.join(', ') : '-- Select (multiple) --';
    con.innerHTML = '';
    checked.forEach(function(val) {
        var card = document.createElement('div'); card.className='ww-value-card';
        card.innerHTML = '<div class="ww-value-card-head">'+val+'</div><div class="ww-value-card-body"></div>';
        con.appendChild(card);
        dpBuildWhyChain(card.querySelector('.ww-value-card-body'), {});
    });
}
function dpBuildWhyChain(bodyEl, saved) {
    bodyEl.innerHTML = '';
    for (var i=1; i<=5; i++) {
        var row = document.createElement('div'); row.className='ww-chain-row';
        var sfx = ['st','nd','rd','th','th'][i-1];
        row.innerHTML = '<div class="ww-chain-q">'+i+sfx+' Why?</div>'
            +'<input type="text" class="ww-chain-input" value="'+(saved['w'+i]||'')+'" placeholder="Enter '+i+sfx+' why…">'
            +(i===5 ? '<input type="text" class="ww-chain-input ww-root-inp" placeholder="Root cause" value="'+(saved.root||'')+'">':'');
        bodyEl.appendChild(row);
    }
}
function dpAddCustom(key, inputId, ddId) {
    var inp=document.getElementById(inputId); var dd=document.getElementById(ddId);
    if (!inp||!dd||!inp.value.trim()) return;
    var val=inp.value.trim();
    var lbl=document.createElement('label'); lbl.className='ms-option';
    lbl.innerHTML='<input type="checkbox" value="'+val+'" checked onchange="dpOnSixMChange(\''+key+'\')"> '+val;
    dd.insertBefore(lbl,dd.querySelector('.ms-add-row'));
    inp.value=''; dpOnSixMChange(key);
}
function dpRestoreWhyWhy(irir) {
    var map = [
        {key:'dpMan',          iKey:'man',          p:'Man'},
        {key:'dpMachine',      iKey:'machine',      p:'Machine'},
        {key:'dpMaterial',     iKey:'material',     p:'Material'},
        {key:'dpMethod',       iKey:'method',       p:'Method'},
        {key:'dpMeasurement',  iKey:'measurement',  p:'Measurement'},
        {key:'dpMotherNature', iKey:'motherNature', p:'Nature'}
    ];
    map.forEach(function(m) {
        var saved = irir[m.iKey];
        if (!saved) return;
        var arr = Array.isArray(saved) ? saved : saved.split(',').map(function(s){return s.trim();}).filter(Boolean);
        var vals = arr.filter(function(v){return v&&v!=='Not applicable';});
        if (!vals.length) return;
        var lbl = document.getElementById(m.key+'Label');
        if (lbl) lbl.textContent = vals.join(', ');
        var con = document.getElementById('dpWwContainer_'+m.key);
        if (!con) return;
        con.innerHTML = '';
        vals.forEach(function(val) {
            var card = document.createElement('div'); card.className='ww-value-card';
            card.innerHTML='<div class="ww-value-card-head">'+val+'</div><div class="ww-value-card-body"></div>';
            con.appendChild(card);
            var savedData = {
                w1:irir['ww'+m.p+'1']||'', w2:irir['ww'+m.p+'2']||'',
                w3:irir['ww'+m.p+'3']||'', w4:irir['ww'+m.p+'4']||'',
                w5:irir['ww'+m.p+'5']||'', root:irir['ww'+m.p+'Root']||''
            };
            dpBuildWhyChain(card.querySelector('.ww-value-card-body'), savedData);
        });
    });
}

// CAPA table
var dpCapaCount = 0;
function dpInitCaTable(rows) {
    var tbody=document.getElementById('dpCaTableBody'); if(!tbody) return;
    tbody.innerHTML=''; dpCapaCount=0;
    if (!rows||!rows.length) rows=[{}];
    rows.forEach(function(r){ dpAddCaRow(r.action||'',r.resp||'',r.status||''); });
}
function dpAddCaRow(action,resp,status) {
    var tbody=document.getElementById('dpCaTableBody'); if(!tbody) return;
    dpCapaCount++;
    var n=dpCapaCount;
    var tr=document.createElement('tr'); tr.id='dpCaRow'+n;
    tr.innerHTML='<td>'+n+'</td>'
        +'<td><input type="text" class="inline-input" id="dpCaAction'+n+'" value="'+action+'" placeholder="Action…"></td>'
        +'<td><input type="text" class="inline-input" id="dpCaResp'+n+'" value="'+resp+'" placeholder="Person…"></td>'
        +'<td><select class="inline-dropdown" id="dpCaStatus'+n+'"><option value="">—</option>'
        +'<option '+(status==='Open'?'selected':'')+'>Open</option>'
        +'<option '+(status==='Close'?'selected':'')+'>Close</option></select></td>'
        +'<td style="text-align:center;">'
        +'<button type="button" onclick="dpAddCaRow(\'\',\'\',\'\')" style="background:#0052cc;color:#fff;border:none;border-radius:3px;padding:2px 7px;cursor:pointer;font-size:14px;margin-right:3px;">+</button>'
        +(n>1?'<button type="button" onclick="dpRemoveCaRow('+n+')" style="background:#de350b;color:#fff;border:none;border-radius:3px;padding:2px 7px;cursor:pointer;font-size:14px;">&#8722;</button>':'')
        +'</td>';
    tbody.appendChild(tr);
}
function dpRemoveCaRow(n) { var r=document.getElementById('dpCaRow'+n); if(r) r.remove(); }
function dpGetCaData() {
    var rows=[];
    document.querySelectorAll('#dpCaTableBody tr').forEach(function(tr){
        var n=tr.id.replace('dpCaRow','');
        var a=document.getElementById('dpCaAction'+n); var r=document.getElementById('dpCaResp'+n); var s=document.getElementById('dpCaStatus'+n);
        if(a) rows.push({action:a.value,resp:r?r.value:'',status:s?s.value:''});
    });
    return rows;
}

// Effectiveness Monitoring
var dpEffCount=0;
function dpInitEffMonths(months) {
    var con=document.getElementById('dpEffContainer'); if(!con) return;
    con.innerHTML=''; dpEffCount=0;
    if (!months||!months.length) months=[{}];
    months.forEach(function(m){ dpAddEffMonth(m.status||'',m.date||'',m.name||''); });
}
function dpAddEffMonth(status,date,name) {
    var con=document.getElementById('dpEffContainer'); if(!con) return;
    dpEffCount++; var n=dpEffCount;
    var div=document.createElement('div'); div.className='eff-card-modal'; div.id='dpEffCard'+n; div.style.marginBottom='12px';
    div.innerHTML='<div class="eff-card-head"><span>Month '+n+' \u2014 Ok / Not OK</span>'
        +'<div class="eff-month-btns">'
        +'<button type="button" class="eff-btn-add" onclick="dpAddEffMonth(\'\',\'\',\'\')" title="Add Month">＋</button>'
        +(n>1?'<button type="button" class="eff-btn-remove" onclick="dpRemoveEffMonth('+n+')" title="Remove">－</button>':'')
        +'</div></div>'
        +'<div class="eff-card-body">'
        +'<div class="irir-form-group" style="margin-bottom:6px;"><label>Status</label>'
        +'<select class="irir-select-field" id="dpEff'+n+'Status"><option value="">-- Select --</option>'
        +'<option '+(status==='Ok'?'selected':'')+'>Ok</option>'
        +'<option '+(status==='Not OK'?'selected':'')+'>Not OK</option></select></div>'
        +'<div class="irir-form-group" style="margin-bottom:6px;"><label>Date</label>'
        +'<input type="date" class="irir-input-field" id="dpEff'+n+'Date" value="'+date+'"></div>'
        +'<div class="irir-form-group" style="margin-bottom:0;"><label>EHS Verification</label>'
        +'<input type="text" class="irir-input-field" id="dpEff'+n+'Name" value="'+name+'" placeholder="Name / Sign"></div>'
        +'</div>';
    con.appendChild(div);
}
function dpRemoveEffMonth(n) { var el=document.getElementById('dpEffCard'+n); if(el){el.remove(); dpEffCount--;} }
function dpGetEffData() {
    var out=[];
    for(var i=1;i<=dpEffCount+20;i++){
        var s=document.getElementById('dpEff'+i+'Status');
        if(s) out.push({status:s.value,date:(document.getElementById('dpEff'+i+'Date')||{}).value||'',name:(document.getElementById('dpEff'+i+'Name')||{}).value||''});
    }
    return out;
}
function dpGetSixMArr(key) {
    var dd=document.getElementById(key+'Dd'); if(!dd) return '';
    return Array.from(dd.querySelectorAll('input[type="checkbox"]:checked')).map(function(cb){return cb.value;}).filter(function(v){return v!=='Not applicable';}).join(', ');
}

// ── Updated save functions ───────────────────────────────────

function saveDetailPartA() {
    if (!currentDetailIrirId) return;
    var irir=allIrirs.find(function(i){return i.irirId===currentDetailIrirId;}); if(!irir) return;
    var g=function(id){var el=document.getElementById(id);return el?el.value:'';};
    irir.plant=g('dPlant'); irir.type=g('dType'); irir.employeeCategory=g('dEmpCat');
    irir.date=g('dDate'); irir.time=g('dTime'); irir.shift=g('dShift');
    irir.gender=g('dGender'); irir.experienceYears=g('dExperienceYears'); irir.experienceMonths=g('dExperienceMonths');
    irir.activity=g('dActivity'); irir.injuredName=g('dInjuredName'); irir.employeeNo=g('dEmployeeNo');
    irir.injuryType=g('dInjuryType'); irir.bodyPart=g('dBodyPart');
    irir.department=g('dDepartment'); irir.location=g('dLocation');
    irir.narWhat=g('dNarWhat'); irir.narWhen=g('dNarWhen'); irir.narWhere=g('dNarWhere');
    irir.narWho=g('dNarWho'); irir.narWhich=g('dNarWhich'); irir.narHow=g('dNarHow');
    irir.immediateActions=g('dImmediateActions'); irir.preparedBy=g('dPreparedBy'); irir.preparedDate=g('dPreparedDate');
    irir.workPermit=g('dWorkPermit'); irir.workPermitDetails=g('dPtwId');
    saveToLocalStorage(); renderTable();
    showSuccessMessage('&#10003; Part A saved!');
}

function saveDetailPartB() {
    if (!currentDetailIrirId) return;
    var irir=allIrirs.find(function(i){return i.irirId===currentDetailIrirId;}); if(!irir) return;
    var g=function(id){var el=document.getElementById(id);return el?el.value:'';};
    irir.teamMemberName=g('dTeamMemberName'); irir.teamMemberDesignation=g('dTeamMemberDesignation');
    irir.witnessType=g('dWitnessType'); irir.witnessStatement=g('dWitnessStatement');
    irir.man=dpGetSixMArr('dpMan'); irir.machine=dpGetSixMArr('dpMachine');
    irir.material=dpGetSixMArr('dpMaterial'); irir.method=dpGetSixMArr('dpMethod');
    irir.measurement=dpGetSixMArr('dpMeasurement'); irir.motherNature=dpGetSixMArr('dpMotherNature');
    // Save Why-Why inputs from DOM
    ['Man','Machine','Material','Method','Measurement','Nature'].forEach(function(p,idx){
        var dpKey=['dpMan','dpMachine','dpMaterial','dpMethod','dpMeasurement','dpMotherNature'][idx];
        var con=document.getElementById('dpWwContainer_'+dpKey); if(!con) return;
        var inputs=con.querySelectorAll('.ww-chain-input');
        if(inputs[0]) irir['ww'+p+'1']=inputs[0].value;
        if(inputs[1]) irir['ww'+p+'2']=inputs[1].value;
        if(inputs[2]) irir['ww'+p+'3']=inputs[2].value;
        if(inputs[3]) irir['ww'+p+'4']=inputs[3].value;
        if(inputs[4]) irir['ww'+p+'5']=inputs[4].value;
        var root=con.querySelector('.ww-root-inp'); if(root) irir['ww'+p+'Root']=root.value;
    });
    irir.capaRows=dpGetCaData(); irir.capaTargetDate=g('dpCapaTargetDate'); irir.capaType=g('dpCapaType'); irir.capaStatus=g('dpCapaStatus');
    irir.syscWisRef=g('dSyscWisRef'); irir.rootCause=g('dRootCause'); irir.unsafeActBrief=g('dUnsafeActBrief');
    irir.syscHiraYesNo=g('dSyscHiraYesNo'); irir.syscHiraRef=g('dSyscHiraRef'); irir.syscHiraDate=g('dSyscHiraDate'); irir.hiraNewAction=g('dpHiraNewAction'); irir.hiraTdc=g('dpHiraTdc');
    irir.syscEaiYesNo=g('dSyscEaiYesNo'); irir.syscEaiRef=g('dSyscEaiRef'); irir.eaiNoResp=g('dpEaiNoResp'); irir.eaiNoTdc=g('dpEaiNoTdc');
    irir.syscResp=g('dSyscResp'); irir.syscTargetDate=g('dSyscTargetDate');
    irir.partBPreparedBy=g('dPartBPreparedBy'); irir.partBPreparedDate=g('dPartBPreparedDate');
    irir.partBApprovedBy=g('dPartBApprovedBy'); irir.partBApprovedDate=g('dPartBApprovedDate');
    saveToLocalStorage(); renderTable();
    showSuccessMessage('&#10003; Part B saved!');
}

function saveDetailPartC() {
    if (!currentDetailIrirId) return;
    var irir=allIrirs.find(function(i){return i.irirId===currentDetailIrirId;}); if(!irir) return;
    var g=function(id){var el=document.getElementById(id);return el?el.value:'';};
    irir.sourceSituation=g('dSourceSituation'); irir.otherRemarks=g('dOtherRemarks');
    irir.returnDate=g('dReturnDate'); irir.mandaysLost=g('dMandaysLost'); irir.reoccurrence=g('dReoccurrence');
    saveToLocalStorage(); renderTable();
    showSuccessMessage('&#10003; Part C saved!');
}

function saveDetailPartD() {
    if (!currentDetailIrirId) return;
    var irir=allIrirs.find(function(i){return i.irirId===currentDetailIrirId;}); if(!irir) return;
    var g=function(id){var el=document.getElementById(id);return el?el.value:'';};
    irir.costMan=g('dCostMan'); irir.costMachine=g('dCostMachine'); irir.costMaterial=g('dCostMaterial');
    irir.costMethod=g('dCostMethod'); irir.costManagement=g('dCostManagement'); irir.costNature=g('dCostNature');
    irir.totalCost=dpCalcTotal();
    irir.effMonths=dpGetEffData();
    irir.status=g('dStatus');
    saveToLocalStorage(); renderTable();
    showSuccessMessage('&#10003; Part D saved!');
}

async function saveDetailChanges() {
    if (!currentDetailIrirId) return;
    const irir = allIrirs.find(i => i.irirId === currentDetailIrirId);
    if (!irir) return;
    const g = id => { const el = document.getElementById(id); return el ? el.value : ''; };
    const prefixes = ['Man', 'Machine', 'Material', 'Method', 'Measurement', 'Nature'];

    irir.plant = g('dPlant'); irir.type = g('dType'); irir.employeeCategory = g('dEmpCat');
    irir.date = g('dDate'); irir.time = g('dTime'); irir.shift = g('dShift');
    irir.gender = g('dGender'); irir.experienceYears = g('dExperienceYears'); irir.experienceMonths = g('dExperienceMonths');
    irir.activity = g('dActivity'); irir.injuredName = g('dInjuredName'); irir.employeeNo = g('dEmployeeNo');
    irir.injuryType = g('dInjuryType'); irir.bodyPart = g('dBodyPart');
    irir.department = g('dDepartment'); irir.location = g('dLocation');
    irir.narWhat = g('dNarWhat'); irir.narWhen = g('dNarWhen'); irir.narWhere = g('dNarWhere');
    irir.narWhich = g('dNarWhich'); irir.narWho = g('dNarWho'); irir.narHow = g('dNarHow');
    irir.immediateActions = g('dImmediateActions'); irir.preparedBy = g('dPreparedBy');
    irir.preparedDate = g('dPreparedDate'); irir.workPermit = g('dWorkPermit');
    irir.workPermitDetails = g('dWorkPermitDetails'); irir.teamMemberName = g('dTeamMemberName');
    irir.teamMemberDesignation = g('dTeamMemberDesignation'); irir.witnessStatement = g('dWitnessStatement');
    irir.man = g('dMan'); irir.machine = g('dMachine'); irir.material = g('dMaterial');
    irir.method = g('dMethod'); irir.measurement = g('dMeasurement'); irir.motherNature = g('dMotherNature');
    prefixes.forEach(p => {
        for (let i = 1; i <= 5; i++) irir['ww' + p + i] = g('d' + p + 'W' + i);
        irir['ww' + p + 'Root'] = g('d' + p + 'Root');
    });
    irir.rootCause = g('dRootCause');
    irir.capaRows = getDetailCapaData();
    irir.syscWisRef = g('dSyscWisRef');
    irir.syscHiraYesNo = g('dSyscHiraYesNo'); irir.syscHiraRef = g('dSyscHiraRef'); irir.syscHiraDate = g('dSyscHiraDate');
    irir.syscEaiYesNo = g('dSyscEaiYesNo'); irir.syscEaiRef = g('dSyscEaiRef'); irir.syscResp = g('dSyscResp'); irir.syscTargetDate = g('dSyscTargetDate');
    irir.partBPreparedBy = g('dPartBPreparedBy'); irir.partBPreparedDate = g('dPartBPreparedDate');
    irir.partBApprovedBy = g('dPartBApprovedBy'); irir.partBApprovedDate = g('dPartBApprovedDate');
    irir.sourceSituation = g('dSourceSituation'); irir.otherRemarks = g('dOtherRemarks');
    irir.returnDate = g('dReturnDate'); irir.mandaysLost = g('dMandaysLost'); irir.reoccurrence = g('dReoccurrence');
    irir.costMan = g('dCostMan'); irir.costMachine = g('dCostMachine'); irir.costMaterial = g('dCostMaterial');
    irir.costMethod = g('dCostMethod'); irir.costManagement = g('dCostManagement'); irir.costNature = g('dCostNature');
    irir.totalCost = calcDetailTotal();
    irir.effMonths = getDetailEffMonthsData();
    irir.unsafeActBrief = g('dUnsafeActBrief');
    irir.status = g('dStatus');

    saveToLocalStorage();

    // 🔥 UPDATE BACKEND ALSO
    try {
        const token = localStorage.getItem("access");
        if (token) {
            const apiPayload = {
                plant:                              irir.plant,
                accident_incident:                  mapCode('accident_incident', irir.type),
                employee_category_involved:         mapCode('employee_category', irir.employeeCategory),
                date:                               irir.date,
                time:                               convertTo24Hour(irir.time),
                shift:                              mapCode('shift', irir.shift),
                gender:                             mapCode('gender', irir.gender),
                experience_years:                   parseInt(irir.experienceYears) || 0,
                experience_months:                  parseInt(irir.experienceMonths) || 0,
                name_of_injured_person:             irir.injuredName,
                employee_no:                        irir.employeeNo || '',
                injury_type:                        mapCode('injury_type', irir.injuryType),
                body_part_injured:                  mapCode('body_part', irir.bodyPart),
                name_of_shop:                       mapCode('shop', irir.department),
                exact_location:                     irir.location,
                what:                               irir.narWhat || '',
                when:                               irir.narWhen || '',
                where:                              irir.narWhere || '',
                who:                                irir.narWho || '',
                which:                              irir.narWhich || '',
                how:                                irir.narHow || '',
                immediate_actions:                  irir.immediateActions || '',
                prepared_by:                        irir.preparedBy || '',
                prepared_date:                      irir.preparedDate || null,
                work_permit_followed:               mapCode('work_permit', irir.workPermit),
                work_permit_details:                irir.workPermitDetails || '',
                activity:                           mapCode('activity', irir.activity),
                team_member_name:                   irir.teamMemberName || '',
                team_member_designation:            irir.teamMemberDesignation || '',
                witness_statement:                  irir.witnessStatement || '',
                six_m_man: JSON.stringify({ category: irir.man || '', why1: irir.wwMan1 || '', why2: irir.wwMan2 || '', why3: irir.wwMan3 || '', why4: irir.wwMan4 || '', why5: irir.wwMan5 || '', root: irir.wwManRoot || '' }),
                six_m_machine: JSON.stringify({ category: irir.machine || '', why1: irir.wwMachine1 || '', why2: irir.wwMachine2 || '', why3: irir.wwMachine3 || '', why4: irir.wwMachine4 || '', why5: irir.wwMachine5 || '', root: irir.wwMachineRoot || '' }),
                six_m_material: JSON.stringify({ category: irir.material || '', why1: irir.wwMaterial1 || '', why2: irir.wwMaterial2 || '', why3: irir.wwMaterial3 || '', why4: irir.wwMaterial4 || '', why5: irir.wwMaterial5 || '', root: irir.wwMaterialRoot || '' }),
                six_m_method: JSON.stringify({ category: irir.method || '', why1: irir.wwMethod1 || '', why2: irir.wwMethod2 || '', why3: irir.wwMethod3 || '', why4: irir.wwMethod4 || '', why5: irir.wwMethod5 || '', root: irir.wwMethodRoot || '' }),
                six_m_measurement: JSON.stringify({ category: irir.measurement || '', why1: irir.wwMeasurement1 || '', why2: irir.wwMeasurement2 || '', why3: irir.wwMeasurement3 || '', why4: irir.wwMeasurement4 || '', why5: irir.wwMeasurement5 || '', root: irir.wwMeasurementRoot || '' }),
                six_m_mother_nature: JSON.stringify({ category: irir.motherNature || '', why1: irir.wwNature1 || '', why2: irir.wwNature2 || '', why3: irir.wwNature3 || '', why4: irir.wwNature4 || '', why5: irir.wwNature5 || '', root: irir.wwNatureRoot || '' }),
                root_cause:                         irir.rootCause || '',
                ocp_wi_reference:                   irir.syscWisRef || '',
                hira_yes_no:                        irir.syscHiraYesNo || '',
                hira_study_reference:               irir.syscHiraRef || '',
                hira_study_date:                    irir.syscHiraDate || null,
                eai_yes_no:                         irir.syscEaiYesNo || '',
                eai_study_reference:                irir.syscEaiRef || '',
                system_corrections_responsibility:  irir.syscResp || '',
                system_corrections_target_date:     irir.syscTargetDate || null,
                prepared_by_part_b:                 irir.partBPreparedBy || '',
                prepared_date_part_b:               irir.partBPreparedDate || null,
                approved_by_dept_head:              irir.partBApprovedBy || '',
                approved_date_part_b:               irir.partBApprovedDate || null,
                source_situation_of_injury:         irir.sourceSituation || '',
                other_remarks:                      irir.otherRemarks || '',
                date_of_return_to_work:             irir.returnDate || null,
                man_days_lost:                      parseInt(irir.mandaysLost) || 0,
                reoccurrence:                       mapCode('reoccurrence', irir.reoccurrence),
                cost_man:                           parseFloat(irir.costMan) || 0,
                cost_machine:                       parseFloat(irir.costMachine) || 0,
                cost_material:                      parseFloat(irir.costMaterial) || 0,
                cost_method:                        parseFloat(irir.costMethod) || 0,
                cost_management:                    parseFloat(irir.costManagement) || 0,
                cost_mother_nature:                 parseFloat(irir.costNature) || 0,
                total_cost_impact:                  parseFloat(irir.totalCost) || 0,
                eff_months:                         JSON.stringify(irir.effMonths || []),
                brief_of_unsafe_act:                irir.unsafeActBrief || '',
                hira_reference:                     irir.syscHiraRef || '',
                capa_actions: (irir.capaRows || []).map(function(ca) {
                    return {
                        capa_id:        ca.capaId || '',
                        action:         ca.action || '',
                        responsibility: ca.resp || '',
                        target_date:    ca.tdc || null,
                        capa_type:      ca.type || '',
                        status:         ca.status || ''
                    };
                }),
                status: irir.status
            };

            const res = await fetch(`${API_BASE_URL}/incidents/${irir.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify(apiPayload)
            });

            if (!res.ok) { console.error("❌ Backend update failed"); }
            else          { console.log("✅ Backend updated successfully"); }
        }
    } catch (e) {
        console.warn("⚠️ Backend unreachable while updating", e);
    }

    // ✅ Always persist to localStorage so changes survive refresh
    saveToLocalStorage();

    const row = document.querySelector(`tr[data-irir-id="${currentDetailIrirId}"]`);
    if (row) {
        const newRow = document.createElement('tr');
        newRow.setAttribute('data-type', irir.type);
        newRow.setAttribute('data-status', irir.status);
        newRow.setAttribute('data-dept', irir.department);
        newRow.setAttribute('data-plant', irir.plant);
        newRow.setAttribute('data-irir-id', irir.irirId);
        newRow.innerHTML = buildRowHTML(irir);
        row.replaceWith(newRow);
        const sel = newRow.querySelector('.inline-status-select');
        if (sel) setStatusBadgeColor(sel);
    } else {
        addIrirToTable(irir);
    }
    updateStatusCounters();
    showSuccessMessage('✅ Changes saved successfully!');
    closeDetailPanel();
}


// ============================================================
// 24. DETAIL PANEL — DELETE
// ============================================================

function closeDetailPanel() {
    document.getElementById('detailSidePanel').classList.remove('open');
    document.getElementById('detailPanelOverlay').classList.remove('show');
    currentDetailIrirId = null;
}

async function deleteCurrentIrir() {
    if (!currentDetailIrirId) return;
    if (!confirm('Are you sure you want to delete this Incident Report? This cannot be undone.')) return;

    const irirStringId = currentDetailIrirId;
    const irirObj = allIrirs.find(i => i.irirId === irirStringId);
    const idToDelete = (irirObj && irirObj.id) ? irirObj.id : irirStringId;

    // ✅ Delete from backend first
    try {
        const token = await getValidToken();
        if (token) {
            const res = await fetch(`${API_BASE_URL}/incidents/${idToDelete}/`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok && res.status !== 404) {
                console.warn('⚠️ Backend delete failed:', res.status);
            } else {
                console.log('✅ Deleted from backend:', idToDelete);
            }
        }
    } catch (e) {
        console.warn('⚠️ Backend unreachable — deleting locally only.', e);
    }

    // ✅ Always delete locally regardless of backend result
    const idx = allIrirs.findIndex(i => i.irirId === irirStringId);
    if (idx !== -1) allIrirs.splice(idx, 1);
    saveToLocalStorage();

    showSuccessMessage('✅ Incident Report deleted successfully!');
    closeDetailPanel();
    renderTable();
}


// ============================================================
// 25. MODAL OPEN / CLOSE
// ============================================================

function openIrirModal() {
    document.getElementById('irirModalOverlay').classList.add('active');
    document.getElementById('irirId').value = generateIrirId();
    document.getElementById('modalTotalCost').textContent = '0.00';
    initCATable();
    initEffMonths();
    // New: reset 6M + sub-groups + CAPA ID
    if (typeof setCapaIdDisplay === 'function') setCapaIdDisplay();
    ['workPermitDetailsGroup','hiraYesGroup','hiraNoGroup','eaiYesGroup','eaiNoGroup','ocpSopGroup','capaShopfloorGroup'].forEach(function(id) {
        var el = document.getElementById(id); if (el) el.style.display = 'none';
    });
    ['man','machine','material','method','measurement','motherNature'].forEach(function(key) {
        var dd = document.getElementById(key + 'MultiDropdown');
        if (dd) dd.querySelectorAll('input[type="checkbox"]').forEach(function(cb) { cb.checked = false; });
        var lbl = document.getElementById(key + 'MultiLabel');
        if (lbl) lbl.textContent = '-- Select (multiple) --';
        var ww = document.getElementById('whyWhyContainer_' + key);
        if (ww) ww.innerHTML = '';
    });
    Object.keys(whyWhyState).forEach(function(k) { delete whyWhyState[k]; });
    var smsg = document.getElementById('statusBlockMsg');
    if (smsg) smsg.style.display = 'none';
    var noRadio = document.querySelector('input[name="capaShopfloor"][value="No"]');
    if (noRadio) noRadio.checked = true;
}

function closeIrirModal() {
    document.getElementById('irirModalOverlay').classList.remove('active');
    document.getElementById('irirModal').classList.remove('fullscreen');
    resetForm();
}

function toggleFullscreenModal() {
    document.getElementById('irirModal').classList.toggle('fullscreen');
}


// ============================================================
// 26. SHARE MODAL
// ============================================================

function openShareModal() {
    document.getElementById('shareModal').classList.add('show');
}

function closeShareModal(e) {
    if (e && e.target === document.getElementById('shareModal'))
        document.getElementById('shareModal').classList.remove('show');
}

function copyShareLink() {
    navigator.clipboard.writeText(window.location.href)
        .then(() => showSuccessMessage('Link copied to clipboard!'))
        .catch(() => alert('Failed to copy link'));
}

function shareRecord() {
    const names = document.getElementById('shareNames').value;
    if (!names.trim()) { alert('Please enter at least one email address'); return; }
    showSuccessMessage('Shared with: ' + names);
    document.getElementById('shareModal').classList.remove('show');
    document.getElementById('shareNames').value = '';
    document.getElementById('shareMessage').value = '';
}


// ============================================================
// 27. EXPORT FUNCTIONS
// ============================================================

function exportCSV() {
    toggleHeaderDropdown('exportDropdown');
    if (allIrirs.length === 0) { alert('No data to export'); return; }
    const headers = Object.keys(allIrirs[0]);
    let csv = headers.join(',') + '\n';
    allIrirs.forEach(irir => {
        csv += headers.map(h => `"${String(irir[h] || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    downloadFile(csv, 'irir_export.csv', 'text/csv');
    showSuccessMessage(`Exported ${allIrirs.length} records to CSV`);
}

function exportExcel() {
    toggleHeaderDropdown('exportDropdown');
    if (allIrirs.length === 0) { alert('No data to export'); return; }
    const headers = Object.keys(allIrirs[0]);
    let html = '<table border="1"><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    allIrirs.forEach(irir => {
        html += '<tr>' + headers.map(h => `<td>${irir[h] || ''}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    downloadFile(html, 'irir_export.xls', 'application/vnd.ms-excel');
    showSuccessMessage(`Exported ${allIrirs.length} records to Excel`);
}

function exportXML() {
    toggleHeaderDropdown('exportDropdown');
    if (allIrirs.length === 0) { alert('No data to export'); return; }
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<IRIRs>\n';
    allIrirs.forEach(irir => {
        xml += '  <IRIR>\n';
        for (let k in irir) xml += `    <${k}>${escapeXml(String(irir[k] || ''))}</${k}>\n`;
        xml += '  </IRIR>\n';
    });
    xml += '</IRIRs>';
    downloadFile(xml, 'irir_export.xml', 'text/xml');
    showSuccessMessage(`Exported ${allIrirs.length} records to XML`);
}

function printList()    { toggleHeaderDropdown('exportDropdown'); window.print(); }
function printDetails() { toggleHeaderDropdown('exportDropdown'); window.print(); }

function openInGoogleSheets() {
    toggleHeaderDropdown('appsDropdown');
    if (allIrirs.length === 0) { alert('No data to open'); return; }
    exportCSV();
    setTimeout(() => window.open('https://sheets.google.com', '_blank'), 500);
    alert('CSV file downloaded. Please upload it to Google Sheets.');
}

function openInMicrosoftExcel() {
    toggleHeaderDropdown('appsDropdown');
    if (allIrirs.length === 0) { alert('No data to open'); return; }
    exportExcel();
    alert('Excel file downloaded. Please open it in Microsoft Excel.');
}

function viewAsChart()  { alert('Chart view feature coming soon!'); }
function bulkChange()   { alert('Bulk change feature coming soon!'); }
function importCSV()    { alert('Import CSV feature coming soon!'); }
function giveFeedback() { alert('Thank you for your feedback!'); }


// ============================================================
// 28. HELPERS
// ============================================================

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeXml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}


// ============================================================
// 29. PART SAVE BUTTONS (Create Form)
// ============================================================

function getCreateFormData() {
    const g = id => { const el = document.getElementById(id); return el ? el.value : ''; };
    return g;
}

function savePartA() {
    const g = getCreateFormData();
    const partAData = {
        plant: g('irirPlant'), type: g('irirType'), employeeCategory: g('irirEmployeeCategory'),
        date: g('irirDate'), time: g('irirTime'), shift: g('irirShift'), gender: g('irirGender'),
        experienceYears: g('irirExperienceYears'), experienceMonths: g('irirExperienceMonths'),
        activity: g('irirActivity'), injuredName: g('irirInjuredName'), employeeNo: g('irirEmployeeNo'),
        injuryType: g('irirInjuryType'), bodyPart: g('irirBodyPart'),
        department: g('irirDepartment'), location: g('irirLocation'),
        narWhat: g('narWhat'), narWhen: g('narWhen'), narWhere: g('narWhere'),
        narWhich: g('narWhich'), narWho: g('narWho'), narHow: g('narHow'),
        immediateActions: g('irirImmediateActions'), preparedBy: g('irirPreparedBy'),
        preparedDate: g('irirPreparedDate'), workPermit: g('irirWorkPermit'),
        workPermitDetails: g('irirWorkPermitDetails')
    };
    sessionStorage.setItem('irir_partA_draft', JSON.stringify(partAData));
    showSuccessMessage('✅ Part A saved! You can continue with Part B or click Save All & Create.');
}

function savePartB() {
    const g = getCreateFormData();
    const partBData = {
        teamMemberName: g('irirTeamMemberName'), teamMemberDesignation: g('irirTeamMemberDesignation'),
        witnessStatement: g('irirWitnessStatement'),
        man: g('irirMan'), machine: g('irirMachine'), material: g('irirMaterial'),
        method: g('irirMethod'), measurement: g('irirMeasurement'), motherNature: g('irirMotherNature'),
        rootCause: g('irirRootCause'), unsafeActBrief: g('irirUnsafeActBrief'),
        partBPreparedBy: g('partBPreparedBy'), partBPreparedDate: g('partBPreparedDate'),
        partBApprovedBy: g('partBApprovedBy'), partBApprovedDate: g('partBApprovedDate'),
        syscWisRef: g('syscWisRef'),
        syscHiraYesNo: g('syscHiraYesNo'), syscHiraRef: g('syscHiraRef'), syscHiraDate: g('syscHiraDate'),
        syscEaiYesNo: g('syscEaiYesNo'), syscEaiRef: g('syscEaiRef'), syscResp: g('syscResp'), syscTargetDate: g('syscTargetDate')
    };
    sessionStorage.setItem('irir_partB_draft', JSON.stringify(partBData));
    showSuccessMessage('✅ Part B saved! You can continue with Part C.');
}

function savePartC() {
    const g = getCreateFormData();
    const partCData = {
        sourceSituation: g('irirSourceSituation'), otherRemarks: g('irirOtherRemarks'),
        returnDate: g('irirReturnDate'), mandaysLost: g('irirMandaysLost'),
        reoccurrence: g('irirReoccurrence')
    };
    sessionStorage.setItem('irir_partC_draft', JSON.stringify(partCData));
    showSuccessMessage('✅ Part C saved! You can continue with Part D.');
}

function savePartD() {
    const g = getCreateFormData();
    const partDData = {
        costMan: g('costMan'), costMachine: g('costMachine'), costMaterial: g('costMaterial'),
        costMethod: g('costMethod'), costManagement: g('costManagement'), costNature: g('costNature'),
        status: g('irirStatus')
    };
    sessionStorage.setItem('irir_partD_draft', JSON.stringify(partDData));
    showSuccessMessage('✅ Part D saved! Click "Save All & Create" to create the full INC.');
}


// ============================================================
// 30. SUCCESS NOTIFICATION
// ============================================================

function showSuccessMessage(msg) {
    const n = document.createElement('div');
    n.className = 'success-notification';
    n.innerHTML = `<span class="success-icon">✓</span><span class="success-text">${msg}</span>`;
    document.body.appendChild(n);
    setTimeout(() => n.classList.add('show'), 10);
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
}


// ============================================================
// 31. GLOBAL CLICK HANDLER (close dropdowns)
// ============================================================

document.addEventListener('click', function(e) {
    if (!e.target.closest('.filter-wrapper') && !e.target.closest('.btn-wrapper'))
        document.querySelectorAll('.header-dropdown, .more-filters-dropdown').forEach(d => d.classList.remove('show'));
});


// ============================================================
// 32. TIME PICKER
// ============================================================

let _tp = { targetId: null, hour: 12, min: 0, ampm: 'AM', focus: 'hour', mode: 'keyboard' };
let _tpDragging = false;

const TP_CLOCK_R       = 116;
const TP_NUM_R         = 92;
const TP_HAND_LEN_HOUR = 60;
const TP_HAND_LEN_MIN  = 80;

function openTimePicker(targetId) {
    _tp.targetId = targetId;
    const val = document.getElementById(targetId)?.value || '';
    _tpParse(val);
    _tp.mode = 'keyboard';
    _tpRenderMode();
    _tpSyncAll();
    document.getElementById('timepickerOverlay').classList.add('active');
    setTimeout(() => {
        document.getElementById('tpHourInput')?.select();
        document.getElementById('tpHourInput')?.focus();
    }, 120);
}

function tpClose() {
    document.getElementById('timepickerOverlay').classList.remove('active');
    _tp.targetId = null;
}

function tpConfirm() {
    if (!_tp.targetId) return;
    const h = String(_tp.hour).padStart(2, '0');
    const m = String(_tp.min).padStart(2, '0');
    const el = document.getElementById(_tp.targetId);
    if (el) { el.value = `${h}:${m} ${_tp.ampm}`; el.classList.remove('autofilled'); }
    tpClose();
}

function onTpOverlayClick(e) {
    if (e.target === document.getElementById('timepickerOverlay')) tpClose();
}

function tpToggleMode() {
    _tp.mode = _tp.mode === 'keyboard' ? 'analog' : 'keyboard';
    _tpRenderMode();
    _tpSyncAll();
}

function _tpRenderMode() {
    const kb   = document.getElementById('tpKeyboard');
    const an   = document.getElementById('tpAnalog');
    const lbl  = document.getElementById('tpModeLabel');
    const btnLbl = document.getElementById('tpModeLabelBtn');
    const icon = document.getElementById('tpModeIcon');
    if (_tp.mode === 'keyboard') {
        kb.style.display = 'block';
        an.classList.remove('show');
        lbl.textContent    = 'ENTER TIME';
        btnLbl.textContent = 'Analog';
        icon.innerHTML = '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>';
    } else {
        kb.style.display = 'none';
        an.classList.add('show');
        lbl.textContent    = 'SELECT TIME';
        btnLbl.textContent = 'Keyboard';
        icon.innerHTML = '<path d="M20 9h-3.17L15 7h-6L7.17 9H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V11c0-1.1-.9-2-2-2zm0 13H4V11h4.05l1.83-2h4.24l1.83 2H20v11z"/>';
        _tpBuildClock();
    }
}

function tpFocusField(f) {
    _tp.focus = f;
    document.getElementById('tpHourInput').classList.toggle('active-field', f === 'hour');
    document.getElementById('tpMinInput').classList.toggle('active-field', f === 'min');
}

function onTpHourInput(inp) {
    let v = inp.value.replace(/\D/g, '').slice(0, 2);
    inp.value = v;
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 1 && n <= 12) {
        _tp.hour = n;
        _tpSyncDisplay();
        if (v.length === 2) { tpFocusField('min'); document.getElementById('tpMinInput').select(); }
    }
}

function onTpHourKey(e) {
    if (e.key === ':' || e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault();
        tpFocusField('min');
        document.getElementById('tpMinInput').select();
    }
}

function onTpMinInput(inp) {
    let v = inp.value.replace(/\D/g, '').slice(0, 2);
    inp.value = v;
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 0 && n <= 59) { _tp.min = n; _tpSyncDisplay(); }
}

function onTpMinKey(e) {
    if (e.key === 'Backspace' && e.target.value === '') {
        e.preventDefault();
        tpFocusField('hour');
        document.getElementById('tpHourInput').select();
    }
    if (e.key === 'Enter') tpConfirm();
}

function tpSetAmPm(v) { _tp.ampm = v; _tpSyncAmPm(); }

function _tpBuildClock() {
    const face = document.getElementById('tpClockFace');
    face.innerHTML = '';
    for (let i = 0; i < 60; i++) {
        const tick = document.createElement('div');
        tick.className = 'tp-min-tick' + (i % 5 === 0 ? ' major' : '');
        tick.style.height = (i % 5 === 0 ? 8 : 5) + 'px';
        tick.style.transform = `rotate(${i * 6}deg) translateY(-${TP_CLOCK_R - 8}px)`;
        face.appendChild(tick);
    }
    if (_tp.focus === 'hour') _tpDrawHourNums(face);
    else _tpDrawMinNums(face);
    const hand = document.createElement('div');
    hand.className = 'tp-hand';
    hand.id = 'tpHand';
    face.appendChild(hand);
    _tpPositionHand();
    face.onmousedown  = tpClockStart;
    face.ontouchstart = tpClockStart;
}

function _tpDrawHourNums(face) {
    for (let h = 1; h <= 12; h++) {
        const angle = (h * 30 - 90) * Math.PI / 180;
        const el = document.createElement('div');
        el.className = 'tp-clock-num' + (h === _tp.hour ? ' selected' : '');
        el.textContent = h;
        el.style.left = (TP_CLOCK_R + TP_NUM_R * Math.cos(angle)) + 'px';
        el.style.top  = (TP_CLOCK_R + TP_NUM_R * Math.sin(angle)) + 'px';
        el.dataset.val = h;
        face.appendChild(el);
    }
}

function _tpDrawMinNums(face) {
    [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].forEach(m => {
        const angle = (m * 6 - 90) * Math.PI / 180;
        const el = document.createElement('div');
        el.className = 'tp-clock-num' + (m === _tp.min ? ' selected' : '');
        el.textContent = String(m).padStart(2, '0');
        el.style.left = (TP_CLOCK_R + TP_NUM_R * Math.cos(angle)) + 'px';
        el.style.top  = (TP_CLOCK_R + TP_NUM_R * Math.sin(angle)) + 'px';
        el.dataset.val = m;
        face.appendChild(el);
    });
}

function _tpPositionHand() {
    const hand = document.getElementById('tpHand');
    if (!hand) return;
    const angle = _tp.focus === 'hour' ? _tp.hour * 30 - 90 : _tp.min * 6 - 90;
    const len   = _tp.focus === 'hour' ? TP_HAND_LEN_HOUR : TP_HAND_LEN_MIN;
    hand.style.height    = len + 'px';
    hand.style.transform = `rotate(${angle + 90}deg)`;
}

function tpClockSelectHour() {
    _tp.focus = 'hour';
    document.getElementById('tpAdHour').classList.add('active');
    document.getElementById('tpAdMin').classList.remove('active');
    document.getElementById('tpSelectingLabel').textContent = 'SELECT HOUR';
    _tpBuildClock();
}

function tpClockSelectMin() {
    _tp.focus = 'min';
    document.getElementById('tpAdMin').classList.add('active');
    document.getElementById('tpAdHour').classList.remove('active');
    document.getElementById('tpSelectingLabel').textContent = 'SELECT MINUTE';
    _tpBuildClock();
}

function tpClockStart(e) {
    _tpDragging = true;
    tpClockMove(e);
    document.addEventListener('mousemove', tpClockMove);
    document.addEventListener('mouseup', tpClockEnd);
    document.addEventListener('touchmove', tpClockMove, { passive: false });
    document.addEventListener('touchend', tpClockEnd);
}

function tpClockEnd() {
    _tpDragging = false;
    document.removeEventListener('mousemove', tpClockMove);
    document.removeEventListener('mouseup', tpClockEnd);
    document.removeEventListener('touchmove', tpClockMove);
    document.removeEventListener('touchend', tpClockEnd);
    if (_tp.focus === 'hour') setTimeout(() => tpClockSelectMin(), 250);
}

function tpClockMove(e) {
    if (!_tpDragging && e.type !== 'click') return;
    e.preventDefault && e.preventDefault();
    const face = document.getElementById('tpClockFace');
    const rect = face.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    let angle = Math.atan2(
        pt.clientY - (rect.top + rect.height / 2),
        pt.clientX - (rect.left + rect.width / 2)
    ) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    if (_tp.focus === 'hour') { let h = Math.round(angle / 30); if (h === 0) h = 12; _tp.hour = h; }
    else { _tp.min = Math.round(angle / 6) % 60; }
    _tpSyncAll();
    _tpPositionHand();
    document.querySelectorAll('.tp-clock-num').forEach(el => {
        el.classList.toggle('selected',
            _tp.focus === 'hour'
                ? parseInt(el.dataset.val) === _tp.hour
                : parseInt(el.dataset.val) === _tp.min
        );
    });
}

function _tpSyncAll()     { _tpSyncDisplay(); _tpSyncInputs(); _tpSyncAmPm(); }

function _tpSyncDisplay() {
    const h  = String(_tp.hour).padStart(2, '0');
    const m  = String(_tp.min).padStart(2, '0');
    const ah = document.getElementById('tpAdHour');
    const am = document.getElementById('tpAdMin');
    if (ah) ah.textContent = h;
    if (am) am.textContent = m;
}

function _tpSyncInputs() {
    const hi = document.getElementById('tpHourInput');
    const mi = document.getElementById('tpMinInput');
    if (hi) hi.value = String(_tp.hour).padStart(2, '0');
    if (mi) mi.value = String(_tp.min).padStart(2, '0');
}

function _tpSyncAmPm() {
    ['AM', 'PM'].forEach(v => {
        const kb = document.getElementById('tpKb' + v);
        const cl = document.getElementById('tpCl' + v);
        if (kb) kb.classList.toggle('active', _tp.ampm === v);
        if (cl) cl.classList.toggle('active', _tp.ampm === v);
    });
}

function _tpParse(val) {
    const m12 = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    const m24 = val.match(/^(\d{1,2}):(\d{2})$/);
    if (m12) {
        _tp.hour = parseInt(m12[1], 10);
        _tp.min  = parseInt(m12[2], 10);
        _tp.ampm = m12[3].toUpperCase();
    } else if (m24) {
        let h    = parseInt(m24[1], 10);
        _tp.min  = parseInt(m24[2], 10);
        _tp.ampm = h >= 12 ? 'PM' : 'AM';
        if (h === 0) h = 12; else if (h > 12) h -= 12;
        _tp.hour = h;
    } else {
        _tp.hour = 12; _tp.min = 0; _tp.ampm = 'AM';
    }
}

console.log('✅ IRIR Tracker - All Systems Ready!');


// ============================================================
// 33. AI SEARCH
// ============================================================

// Only start typing animation if AI search container is already open
document.addEventListener("DOMContentLoaded", function() {
    const aiContainer = document.getElementById('aiSearchContainer');
    if (aiContainer && aiContainer.classList.contains('show')) {
        startAITyping();
    }
});

function toggleAISearch() {
    const container     = document.getElementById('aiSearchContainer');
    const searchSection = document.getElementById('searchSection');
    if (container.classList.contains('show')) {
        container.classList.remove('show');
        searchSection.style.display = 'block';
        stopAITyping();
    } else {
        container.classList.add('show');
        searchSection.style.display = 'none';
        startAITyping();
        document.getElementById('aiSearchInput').focus();
    }
}

function closeAISearch() {
    document.getElementById('aiSearchContainer').classList.remove('show');
    document.getElementById('searchSection').style.display = 'block';
    stopAITyping();
}

function executeAISearch() { alert('AI Search coming soon!'); }

function startAITyping() {
    if (isTyping) return;
    isTyping = true;
    currentSuggestionIndex = Math.floor(Math.random() * aiSuggestions.length);
    currentCharIndex = 0;
    typeNextCharacter();
}

function typeNextCharacter() {
    const input = document.getElementById('aiSearchInput');
    if (!input) return;
    const currentSuggestion = aiSuggestions[currentSuggestionIndex];
    if (currentCharIndex < currentSuggestion.length) {
        input.placeholder = currentSuggestion.substring(0, currentCharIndex + 1);
        currentCharIndex++;
        typingInterval = setTimeout(typeNextCharacter, 50);
    } else {
        setTimeout(eraseCharacter, 2000);
    }
}

function eraseCharacter() {
    const input = document.getElementById('aiSearchInput');
    if (!input) return;
    if (currentCharIndex > 0) {
        input.placeholder = aiSuggestions[currentSuggestionIndex].substring(0, currentCharIndex - 1);
        currentCharIndex--;
        typingInterval = setTimeout(eraseCharacter, 30);
    } else {
        currentSuggestionIndex = (currentSuggestionIndex + 1) % aiSuggestions.length;
        setTimeout(typeNextCharacter, 500);
    }
}

function stopAITyping() {
    isTyping = false;
    if (typingInterval) { clearTimeout(typingInterval); typingInterval = null; }
}


// ============================================================
// 34. FIELD CHANGE HANDLERS
// ============================================================

function handleShiftChange(selectEl) {
    const timeInput = document.getElementById('irirTime');
    if (!timeInput) return;
    const shiftMap = {
        'A (01:00 am – 08:00 am)': { h: 1, m: 0,  ap: 'AM' },
        'B (08:00 am – 04:30 pm)': { h: 8, m: 0,  ap: 'AM' },
        'C (04:30 pm – 01:00 am)': { h: 4, m: 30, ap: 'PM' }
    };
    const t = shiftMap[selectEl.value];
    if (t) {
        if (!timeInput.value) {
            const h = String(t.h).padStart(2, '0');
            const m = String(t.m).padStart(2, '0');
            timeInput.value = `${h}:${m} ${t.ap}`;
            timeInput.classList.add('autofilled');
            timeInput.title = 'Auto-filled from shift — click to change';
        }
    } else {
        timeInput.classList.remove('autofilled');
        timeInput.title = '';
    }
}

function handleWorkPermitChange() {
    const workPermit   = document.getElementById('irirWorkPermit').value;
    const detailsGroup = document.getElementById('workPermitDetailsGroup');
    detailsGroup.style.display = workPermit === 'Yes' ? 'block' : 'none';
}

function handleSyscHiraChange() {
    const val    = document.getElementById('syscHiraYesNo').value;
    const refEl  = document.getElementById('syscHiraRef');
    const dateEl = document.getElementById('syscHiraDate');
    refEl.style.display  = val === 'Yes' ? 'block' : 'none';
    dateEl.style.display = val === 'No'  ? 'block' : 'none';
}

function handleSyscEaiChange() {
    const val   = document.getElementById('syscEaiYesNo').value;
    const refEl = document.getElementById('syscEaiRef');
    refEl.style.display = val === 'Yes' ? 'block' : 'none';
}

function handleDSyscEaiChange() {
    const val   = document.getElementById('dSyscEaiYesNo').value;
    const refEl = document.getElementById('dSyscEaiRef');
    refEl.style.display = val === 'Yes' ? 'block' : 'none';
}

function handleRootCauseChange() {
    const val   = document.getElementById('irirRootCause').value;
    const group = document.getElementById('unsafeActBriefGroup');
    const label = document.getElementById('unsafeActBriefLabel');
    if (val === 'Unsafe Act') {
        group.style.display = 'block';
        label.textContent   = 'Brief of the unsafe act';
    } else if (val === 'Unsafe Condition') {
        group.style.display = 'block';
        label.textContent   = 'Brief of the unsafe condition';
    } else {
        group.style.display = 'none';
    }
}


// ============================================================
// 35. DYNAMIC EFFECTIVENESS MONTHS (Create Modal)
// ============================================================

let effMonthCount = 1;

function initEffMonths() {
    effMonthCount = 1;
    const container = document.getElementById('effMonthsContainer');
    if (!container) return;
    container.innerHTML = '';
    addEffMonthCard(1);
}

function addEffMonthCard(num) {
    const container = document.getElementById('effMonthsContainer');
    const isFirst = num === 1;
    const card = document.createElement('div');
    card.className = 'eff-card-modal';
    card.id = 'effMonthCard' + num;
    card.style.marginBottom = '12px';
    card.innerHTML = `
        <div class="eff-card-head">
            <span>Month ${num} — Ok / Not OK</span>
            <div class="eff-month-btns">
                <button type="button" class="eff-btn-add" onclick="addNewEffMonth()" title="Add Month">＋</button>
                ${!isFirst ? `<button type="button" class="eff-btn-remove" onclick="removeEffMonth(${num})" title="Remove">－</button>` : ''}
            </div>
        </div>
        <div class="eff-card-body">
            <div class="irir-form-group" style="margin-bottom:8px;"><label>Status</label><select class="irir-select-field" id="effMonth${num}Status"><option value="">-- Select --</option><option>Ok</option><option>Not OK</option></select></div>
            <div class="irir-form-group" style="margin-bottom:8px;"><label>Date</label><input type="date" class="irir-input-field" id="effMonth${num}Date"></div>
            <div class="irir-form-group" style="margin-bottom:0;"><label>Verification by EHS / Safety Manager</label><input type="text" class="irir-input-field" id="effMonth${num}Name" placeholder="Name / Sign"></div>
        </div>`;
    container.appendChild(card);
}

function addNewEffMonth() {
    effMonthCount++;
    addEffMonthCard(effMonthCount);
}

function removeEffMonth(num) {
    const card = document.getElementById('effMonthCard' + num);
    if (card) card.remove();
    effMonthCount--;
    renumberEffMonths();
}

function renumberEffMonths() {
    const container = document.getElementById('effMonthsContainer');
    const cards = container.querySelectorAll('.eff-card-modal');
    effMonthCount = cards.length;
    cards.forEach((card, i) => {
        const n = i + 1;
        card.id = 'effMonthCard' + n;
        card.querySelector('.eff-card-head span').textContent = `Month ${n} — Ok / Not OK`;
        card.querySelector('select').id = 'effMonth' + n + 'Status';
        card.querySelector('input[type="date"]').id = 'effMonth' + n + 'Date';
        card.querySelector('input[type="text"]').id = 'effMonth' + n + 'Name';
        const removeBtn = card.querySelector('.eff-btn-remove');
        if (removeBtn) removeBtn.setAttribute('onclick', `removeEffMonth(${n})`);
    });
}

function getEffMonthsData() {
    const months = [];
    for (let i = 1; i <= effMonthCount; i++) {
        const status = document.getElementById('effMonth' + i + 'Status');
        const date   = document.getElementById('effMonth' + i + 'Date');
        const name   = document.getElementById('effMonth' + i + 'Name');
        if (status) months.push({
            status: status.value,
            date:   date ? date.value : '',
            name:   name ? name.value : ''
        });
    }
    return months;
}


// ============================================================
// 36. DYNAMIC EFFECTIVENESS MONTHS (Detail Panel)
// ============================================================

let detailEffMonthCount = 1;

function detailAddEffMonth() {
    detailEffMonthCount++;
    const n         = detailEffMonthCount;
    const container = document.getElementById('detailEffMonthsContainer');
    const card      = document.createElement('div');
    card.className  = 'eff-card-modal';
    card.id         = 'detailEffCard' + n;
    card.style.marginBottom = '12px';
    card.innerHTML  = `
        <div class="eff-card-head">
            <span>Month ${n} — Ok / Not OK</span>
            <div class="eff-month-btns">
                <button type="button" class="eff-btn-add" onclick="detailAddEffMonth()">＋</button>
                <button type="button" class="eff-btn-remove" onclick="detailRemoveEffMonth(${n})">－</button>
            </div>
        </div>
        <div class="eff-card-body">
            <div class="detail-field-group" style="margin-bottom:6px;"><label class="detail-field-label">Status</label><select class="detail-field-select" id="dEff${n}Status"><option value="">-- Select --</option><option>Ok</option><option>Not OK</option></select></div>
            <div class="detail-field-group" style="margin-bottom:6px;"><label class="detail-field-label">Date</label><input type="date" class="detail-field-input" id="dEff${n}Date"></div>
            <div class="detail-field-group" style="margin-bottom:0;"><label class="detail-field-label">EHS Verification</label><input type="text" class="detail-field-input" id="dEff${n}Name" placeholder="Name / Sign"></div>
        </div>`;
    container.appendChild(card);
}

function detailRemoveEffMonth(num) {
    const card = document.getElementById('detailEffCard' + num);
    if (card) card.remove();
    detailEffMonthCount--;
    detailRenumberEffMonths();
}

function detailRenumberEffMonths() {
    const container = document.getElementById('detailEffMonthsContainer');
    if (!container) return;
    const cards = container.querySelectorAll('.eff-card-modal');
    detailEffMonthCount = cards.length;
    cards.forEach((card, i) => {
        const n = i + 1;
        card.id = 'detailEffCard' + n;
        card.querySelector('.eff-card-head span').textContent = 'Month ' + n + ' — Ok / Not OK';
        card.querySelector('select').id = 'dEff' + n + 'Status';
        card.querySelector('input[type="date"]').id = 'dEff' + n + 'Date';
        card.querySelector('input[type="text"]').id = 'dEff' + n + 'Name';
        const removeBtn = card.querySelector('.eff-btn-remove');
        if (removeBtn) removeBtn.setAttribute('onclick', 'detailRemoveEffMonth(' + n + ')');
    });
}

function getDetailEffMonthsData() {
    const months    = [];
    const container = document.getElementById('detailEffMonthsContainer');
    if (!container) return months;
    const cards = container.querySelectorAll('.eff-card-modal');
    cards.forEach((card, i) => {
        const n      = i + 1;
        const status = document.getElementById('dEff' + n + 'Status');
        const date   = document.getElementById('dEff' + n + 'Date');
        const name   = document.getElementById('dEff' + n + 'Name');
        if (status) months.push({
            status: status.value,
            date:   date ? date.value : '',
            name:   name ? name.value : ''
        });
    });
    return months;
}


// ============================================================
// 37. DYNAMIC CAPA CARDS (Detail Panel)
// ============================================================

let detailCapaCount = 1;

function detailAddCapa() {
    detailCapaCount++;
    const n         = detailCapaCount;
    const container = document.getElementById('detailCAPAContainer');
    const card      = document.createElement('div');
    card.className  = 'detail-field-group';
    card.id         = 'detailCapaCard' + n;
    card.style.cssText = 'background:#f8faff;border-radius:6px;padding:8px;margin-bottom:8px;';
    card.innerHTML  = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <label class="detail-field-label">CAPA Sr. No. ${n}</label>
            <div style="display:flex;gap:6px;">
                <button type="button" onclick="detailAddCapa()" style="background:#0052cc;color:white;border:none;border-radius:3px;padding:2px 8px;cursor:pointer;font-size:14px;">＋</button>
                <button type="button" onclick="detailRemoveCapa(${n})" style="background:#de350b;color:white;border:none;border-radius:3px;padding:2px 8px;cursor:pointer;font-size:14px;">－</button>
            </div>
        </div>
        <div style="margin-bottom:4px;"><label style="font-size:11px;color:#5e6c84;">Action</label><input type="text" class="detail-field-input" id="dcaAction${n}" placeholder="Describe action"></div>
        <div style="display:flex;flex-direction:column;gap:4px;">
            <div><label style="font-size:10px;color:#5e6c84;">Responsibility</label><input class="detail-field-input" id="dcaResp${n}" placeholder="Person" style="font-size:11px;"></div>
            <div><label style="font-size:10px;color:#5e6c84;">Target Date</label><input type="date" class="detail-field-input" id="dcaTdc${n}" style="font-size:11px;"></div>
            <div><label style="font-size:10px;color:#5e6c84;">CAPA Type</label>
                <select class="detail-field-select" id="dcaType${n}" style="font-size:11px;">
                    <option value="">— Type —</option>
                    <option>Elimination</option><option>Substitution</option>
                    <option>Engineering Controls</option><option>Administrative Controls</option><option>PPE</option>
                </select>
            </div>
            <div><label style="font-size:10px;color:#5e6c84;">Status</label>
                <select class="detail-field-select" id="dcaStatus${n}" style="font-size:11px;">
                    <option value="">— Status —</option>
                    <option>Open</option><option>Closed</option>
                </select>
            </div>
        </div>`;
    container.appendChild(card);
}

function detailRemoveCapa(num) {
    const card = document.getElementById('detailCapaCard' + num);
    if (card) card.remove();
    detailCapaCount--;
    detailRenumberCapa();
}

function detailRenumberCapa() {
    const container = document.getElementById('detailCAPAContainer');
    if (!container) return;
    const cards = container.querySelectorAll('.detail-field-group');
    detailCapaCount = cards.length;
    cards.forEach((card, i) => {
        const n = i + 1;
        card.id = 'detailCapaCard' + n;
        const lbl = card.querySelector('.detail-field-label');
        if (lbl) lbl.textContent = 'CAPA Sr. No. ' + n;
        const inputs = card.querySelectorAll('input, select');
        if (inputs[0]) inputs[0].id = 'dcaAction' + n;
        if (inputs[1]) inputs[1].id = 'dcaResp' + n;
        if (inputs[2]) inputs[2].id = 'dcaTdc' + n;
        if (inputs[3]) inputs[3].id = 'dcaType' + n;
        if (inputs[4]) inputs[4].id = 'dcaStatus' + n;
        const removeBtn = card.querySelector('button:last-child');
        if (removeBtn && n > 1) removeBtn.setAttribute('onclick', 'detailRemoveCapa(' + n + ')');
    });
}

function getDetailCapaData() {
    const rows      = [];
    const container = document.getElementById('detailCAPAContainer');
    if (!container) return rows;
    const cards = container.querySelectorAll('.detail-field-group');
    cards.forEach((card, i) => {
        const n = i + 1;
        rows.push({
            action: (document.getElementById('dcaAction' + n) || {}).value || '',
            resp:   (document.getElementById('dcaResp' + n)   || {}).value || '',
            tdc:    (document.getElementById('dcaTdc' + n)    || {}).value || '',
            type:   (document.getElementById('dcaType' + n)   || {}).value || '',
            status: (document.getElementById('dcaStatus' + n) || {}).value || ''
        });
    });
    return rows;
}


// ============================================================
// 38. NAV BUTTONS
// ============================================================

function openCAPATracker()   { window.location.href = '../capa/capa.html'; }
function openIRIRDashboard() { alert('🚧 IRIR Dashboard coming soon! Big work in progress... 🔥'); }

// ============================================================
// 39. MULTI-SELECT CHECKBOX DROPDOWN (6M)
// ============================================================

// Toggle open/close a multiselect dropdown
function toggleMultiSelect(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains('open');

    // Close all other open multiselect dropdowns first
    document.querySelectorAll('.multiselect-dropdown.open').forEach(d => {
        if (d.id !== dropdownId) {
            d.classList.remove('open');
            const t = d.closest('.multiselect-wrapper');
            if (t) t.querySelector('.multiselect-trigger').classList.remove('ms-open');
        }
    });

    if (isOpen) {
        dropdown.classList.remove('open');
        const trigger = dropdown.closest('.multiselect-wrapper').querySelector('.multiselect-trigger');
        if (trigger) trigger.classList.remove('ms-open');
    } else {
        dropdown.classList.add('open');
        const trigger = dropdown.closest('.multiselect-wrapper').querySelector('.multiselect-trigger');
        if (trigger) trigger.classList.add('ms-open');
    }
}

// Called whenever a 6M checkbox changes
// key: 'man' | 'machine' | 'material' | 'method' | 'measurement' | 'motherNature'
function onSixMChange(key) {
    const dropdownId = key + 'MultiDropdown';
    const labelId    = key + 'MultiLabel';
    const dropdown   = document.getElementById(dropdownId);
    const label      = document.getElementById(labelId);
    if (!dropdown || !label) return;

    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    const naCheckbox = dropdown.querySelector('input[value="Not applicable"]');

    // If "Not applicable" just got checked, uncheck everything else
    if (naCheckbox && naCheckbox.checked) {
        checkboxes.forEach(cb => { if (cb.value !== 'Not applicable') cb.checked = false; });
    }
    // If any other checkbox got checked, uncheck "Not applicable"
    const hasOtherChecked = Array.from(checkboxes).some(cb => cb.checked && cb.value !== 'Not applicable');
    if (hasOtherChecked && naCheckbox) naCheckbox.checked = false;

    // Update trigger label
    const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    if (selected.length === 0) {
        label.textContent = '-- Select (multiple) --';
    } else if (selected.length === 1) {
        label.textContent = selected[0];
    } else {
        label.textContent = selected.length + ' selected';
    }

    // Rebuild Why-Why cards for this 6M key
    renderWhyWhyCards(key, selected);
}

// Get currently selected values for a 6M key
function getSixMSelected(key) {
    const dropdown = document.getElementById(key + 'MultiDropdown');
    if (!dropdown) return [];
    return Array.from(dropdown.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
}

// Add a custom option to a 6M multiselect
function addCustomSixMOption(key, inputId, dropdownId) {
    const input    = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;
    const val = input.value.trim();
    if (!val) return;

    // Check if already exists
    const existing = Array.from(dropdown.querySelectorAll('input[type="checkbox"]')).map(cb => cb.value);
    if (existing.includes(val)) { input.value = ''; return; }

    // Insert new label before the ms-add-row div
    const addRow = dropdown.querySelector('.ms-add-row');
    const label  = document.createElement('label');
    label.className = 'ms-option';
    label.innerHTML = `<input type="checkbox" value="${val}" onchange="onSixMChange('${key}')"> ${val}`;
    dropdown.insertBefore(label, addRow);
    input.value = '';
}

// + Add option (for non-6M selects: injury type, body part, PTW, witness, OCP)
function toggleCustomInput(inputId, selectId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isShowing = input.style.display !== 'none';
    if (isShowing) {
        const val = input.value.trim();
        if (val) {
            const select = document.getElementById(selectId);
            if (select) {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                select.appendChild(opt);
                select.value = val;
            }
        }
        input.style.display = 'none';
        input.value = '';
        btn.textContent = btn.textContent.replace('Save', '').trim().replace('+ Save', '+ Add option');
    } else {
        input.style.display = 'block';
        input.focus();
        btn.textContent = '✓ Save';
    }
}


// ============================================================
// 40. DYNAMIC WHY-WHY ENGINE
// ============================================================

// State: whyWhyState[key][value] = { whys: ['','','','',''], root: '' }
// whyWhyState declared in section 4

function renderWhyWhyCards(key, selectedValues) {
    const container = document.getElementById('whyWhyContainer_' + key);
    if (!container) return;

    // Filter out "Not applicable"
    const values = selectedValues.filter(v => v !== 'Not applicable');

    // If Not applicable selected or nothing selected, clear and return
    if (values.length === 0) {
        container.innerHTML = '';
        // Clean state
        if (whyWhyState[key]) delete whyWhyState[key];
        return;
    }

    // Init state for this key if not present
    if (!whyWhyState[key]) whyWhyState[key] = {};

    // Preserve existing answers for values that are still checked
    const currentValues = Object.keys(whyWhyState[key]);
    currentValues.forEach(v => {
        if (!values.includes(v)) delete whyWhyState[key][v];
    });
    values.forEach(v => {
        if (!whyWhyState[key][v]) {
            whyWhyState[key][v] = { whyCount: 1, whys: [''], root: '' };
        }
    });

    // Re-render all cards
    container.innerHTML = '';
    values.forEach(val => {
        container.appendChild(buildWhyWhyCard(key, val));
    });
}

function buildWhyWhyCard(key, val) {
    const state = whyWhyState[key][val];
    const card  = document.createElement('div');
    card.className = 'ww-value-card';
    card.id = 'wwCard_' + key + '_' + val.replace(/[^a-zA-Z0-9]/g, '_');

    const safeKey = key;
    const safeVal = val;

    // Header
    const header = document.createElement('div');
    header.className = 'ww-value-card-header';
    header.innerHTML = `
        <span>${getKeyLabel(key)} — Why-Why Analysis</span>
        <span class="ww-inference-tag">${val}</span>`;
    card.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'ww-value-card-body';

    // Why rows
    const chainWrap = document.createElement('div');
    chainWrap.id = 'wwChain_' + key + '_' + val.replace(/[^a-zA-Z0-9]/g, '_');
    rebuildWhyRows(chainWrap, key, val, state);
    body.appendChild(chainWrap);

    // + Add Why button (only if < 5 whys)
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'ww-add-why-btn';
    addBtn.textContent = '+ Add Why';
    addBtn.id = 'wwAddBtn_' + key + '_' + val.replace(/[^a-zA-Z0-9]/g, '_');
    if (state.whyCount >= 5) addBtn.style.display = 'none';
    addBtn.onclick = () => addWhyRow(key, val, addBtn);
    body.appendChild(addBtn);

    // Root cause row
    const rootRow = document.createElement('div');
    rootRow.className = 'ww-rootcause-row';
    rootRow.innerHTML = `
        <span class="ww-rootcause-label">Root Cause</span>
        <input type="text" class="ww-chain-input ww-root-inp"
               id="wwRoot_${key}_${val.replace(/[^a-zA-Z0-9]/g, '_')}"
               placeholder="Enter root cause…"
               value="${state.root || ''}"
               oninput="saveWhyState('${safeKey}','${safeVal}')">`;
    body.appendChild(rootRow);

    card.appendChild(body);
    return card;
}

function rebuildWhyRows(container, key, val, state) {
    container.innerHTML = '';
    for (let i = 0; i < state.whyCount; i++) {
        const row = document.createElement('div');
        row.className = 'ww-chain-row';

        // Previous answer for question
        const prevAns = i === 0
            ? val  // First why: "Why <value>?"
            : (state.whys[i - 1] || '(previous answer)');

        const qText = i === 0
            ? `Why "${shortenLabel(val)}"?`
            : `Why "${shortenLabel(prevAns)}"?`;

        const safeId = key + '_' + val.replace(/[^a-zA-Z0-9]/g, '_') + '_' + i;

        row.innerHTML = `
            <div class="ww-chain-q">${i + 1}${getOrdSuffix(i + 1)} Why?<br><span style="font-weight:400;font-size:10px;opacity:0.8">${qText}</span></div>
            <input type="text" class="ww-chain-input"
                   id="wwWhy_${safeId}"
                   placeholder="Enter answer…"
                   value="${state.whys[i] || ''}"
                   oninput="saveWhyState('${key}','${val}')">`;
        container.appendChild(row);
    }
}

function addWhyRow(key, val, btn) {
    const state = whyWhyState[key] && whyWhyState[key][val];
    if (!state) return;
    if (state.whyCount >= 5) return;

    // Save current answer before rebuilding
    saveWhyState(key, val);

    state.whyCount++;
    state.whys.push('');

    const safeKey = key;
    const safeVal = val;
    const chainId = 'wwChain_' + key + '_' + val.replace(/[^a-zA-Z0-9]/g, '_');
    const container = document.getElementById(chainId);
    if (container) rebuildWhyRows(container, key, val, state);

    if (state.whyCount >= 5) btn.style.display = 'none';
}

function saveWhyState(key, val) {
    const state = whyWhyState[key] && whyWhyState[key][val];
    if (!state) return;
    for (let i = 0; i < state.whyCount; i++) {
        const safeId = key + '_' + val.replace(/[^a-zA-Z0-9]/g, '_') + '_' + i;
        const el = document.getElementById('wwWhy_' + safeId);
        if (el) state.whys[i] = el.value;
    }
    const rootEl = document.getElementById('wwRoot_' + key + '_' + val.replace(/[^a-zA-Z0-9]/g, '_'));
    if (rootEl) state.root = rootEl.value;
}

// Collect all why-why data for a key into a flat object for form submission
function collectWhyWhyForKey(key) {
    const state  = whyWhyState[key];
    const result = { category: '', why1:'', why2:'', why3:'', why4:'', why5:'', root:'' };
    if (!state) return result;
    const vals = Object.keys(state);
    if (vals.length === 0) return result;
    // category = comma-joined selected values
    result.category = vals.join(', ');
    // Use first selected value's chain (standard single-chain export)
    const first = state[vals[0]];
    if (!first) return result;
    saveWhyState(key, vals[0]);
    first.whys.forEach((w, i) => { result['why' + (i + 1)] = w || ''; });
    result.root = first.root || '';
    // If multiple values, store all chains as JSON in why1
    if (vals.length > 1) {
        const allChains = {};
        vals.forEach(v => {
            saveWhyState(key, v);
            allChains[v] = { whys: state[v].whys, root: state[v].root };
        });
        result.why1 = JSON.stringify(allChains);
        result.why2 = result.why3 = result.why4 = result.why5 = '';
        result.root = Object.values(allChains).map(c => c.root).filter(Boolean).join(' | ');
    }
    return result;
}

function getKeyLabel(key) {
    const map = { man:'Man', machine:'Machine', material:'Material', method:'Method', measurement:'Measurement', motherNature:'Mother Nature' };
    return map[key] || key;
}

function shortenLabel(str) {
    if (!str) return '';
    return str.length > 30 ? str.substring(0, 30) + '…' : str;
}

function getOrdSuffix(n) {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return s[(v-20)%10] || s[v] || s[0];
}


// ============================================================
// 41. SINGLE CAPA ID LOGIC
// ============================================================

// Generate one CAPA ID for the whole incident (not per row)
function generateCapaId() {
    loadCapaCounterFromTracker();
    return formatCapaId(nextCapaNum);
}

// addCARow + collectCARows (section 41) — originals at section 10 are now the canonical versions (updated in-place below)

// Set CAPA ID display when modal opens
function setCapaIdDisplay() {
    const el = document.getElementById('capaIdDisplay');
    if (el) el.textContent = generateCapaId();
}

// Shopfloor change handler
function handleCapaShopfloorChange(radio) {
    const group = document.getElementById('capaShopfloorGroup');
    if (!group) return;
    group.style.display = radio.value === 'Yes' ? 'block' : 'none';
}

// OCP/WI SOP sub-dropdown
function handleOcpWiChange() {
    const val = document.getElementById('syscWisRef') ? document.getElementById('syscWisRef').value : '';
    const grp = document.getElementById('ocpSopGroup');
    if (grp) grp.style.display = (val === 'modified SOP' || val === 'Modified SOP') ? 'block' : 'none';
}


// ============================================================
// 42. MAN-DAYS AUTO-CALCULATION
// ============================================================

// Spec: if person left today, tomorrow is Day 1
function calcMandaysLost() {
    const incidentDateStr = document.getElementById('irirDate')    ? document.getElementById('irirDate').value    : '';
    const returnDateStr   = document.getElementById('irirReturnDate') ? document.getElementById('irirReturnDate').value : '';
    const outEl           = document.getElementById('irirMandaysLost');
    if (!outEl) return;

    if (!incidentDateStr || !returnDateStr) {
        outEl.value = '';
        return;
    }

    const incidentDate = new Date(incidentDateStr);
    const returnDate   = new Date(returnDateStr);

    // Day after incident = first lost day
    const firstLostDay = new Date(incidentDate);
    firstLostDay.setDate(firstLostDay.getDate() + 1);

    if (returnDate < firstLostDay) {
        outEl.value = '0';
        return;
    }

    // man-days = (returnDate - firstLostDay) in days + 1
    const msPerDay  = 1000 * 60 * 60 * 24;
    const mandays   = Math.round((returnDate - firstLostDay) / msPerDay) + 1;
    outEl.value     = mandays > 0 ? String(mandays) : '0';
}


// ============================================================
// 43. INCIDENT STATUS BLOCK VALIDATION
// ============================================================

// Block "Closed" if any CAPA row still has Open status
function handleStatusChange(selectEl) {
    const msgEl = document.getElementById('statusBlockMsg');
    if (selectEl.value !== 'Closed') {
        if (msgEl) msgEl.style.display = 'none';
        return;
    }

    // Check CAPA status select in the create form
    const capaStatus = document.getElementById('irirCapaStatus');
    if (capaStatus && capaStatus.value === 'Open') {
        selectEl.value = '';  // Reset the selection
        if (msgEl) msgEl.style.display = 'block';
        return;
    }

    // Also check each CA table row status
    const tbody = document.getElementById('caTableBody');
    if (tbody) {
        const rows   = tbody.querySelectorAll('tr');
        let hasOpen  = false;
        rows.forEach(row => {
            const statusSel = row.querySelector('select');
            if (statusSel && statusSel.value === 'Open') hasOpen = true;
        });
        if (hasOpen) {
            selectEl.value = '';
            if (msgEl) msgEl.style.display = 'block';
            return;
        }
    }

    if (msgEl) msgEl.style.display = 'none';
}


// ============================================================
// 44. UPDATED HIRA / EAI CHANGE HANDLERS
// ============================================================

// Override section 34's handleSyscHiraChange with new sub-group logic
function handleSyscHiraChange() {
    const val      = document.getElementById('syscHiraYesNo').value;
    const yesGroup = document.getElementById('hiraYesGroup');
    const noGroup  = document.getElementById('hiraNoGroup');
    if (yesGroup) yesGroup.style.display = val === 'Yes' ? 'block' : 'none';
    if (noGroup)  noGroup.style.display  = val === 'No'  ? 'block' : 'none';
}

// Override section 34's handleSyscEaiChange with new sub-group logic
function handleSyscEaiChange() {
    const val      = document.getElementById('syscEaiYesNo').value;
    const yesGroup = document.getElementById('eaiYesGroup');
    const noGroup  = document.getElementById('eaiNoGroup');
    if (yesGroup) yesGroup.style.display = val === 'Yes' ? 'block' : 'none';
    if (noGroup)  noGroup.style.display  = val === 'No'  ? 'block' : 'none';
}


// ============================================================
// 45. UPDATED FORM SUBMISSION (6M multi-select + new fields)
// ============================================================

async function handleFormSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log("🔥 handleFormSubmit triggered (patched v2)");

    const totalCost = calcModalTotal();
    const g = id => { const el = document.getElementById(id); return el ? el.value : ''; };

    // Collect 6M multi-select values
    const sixMKeys = ['man','machine','material','method','measurement','motherNature'];
    const sixMData = {};
    sixMKeys.forEach(key => { sixMData[key] = getSixMSelected(key).filter(v => v !== 'Not applicable').join(', '); });

    // Collect Why-Why chains
    const wwData = {};
    sixMKeys.forEach(key => {
        const chain = collectWhyWhyForKey(key);
        Object.assign(wwData, {
            ['ww' + capitalize(key) + 'Root']: chain.root,
            ['ww' + capitalize(key) + '1']:    chain.why1,
            ['ww' + capitalize(key) + '2']:    chain.why2,
            ['ww' + capitalize(key) + '3']:    chain.why3,
            ['ww' + capitalize(key) + '4']:    chain.why4,
            ['ww' + capitalize(key) + '5']:    chain.why5,
        });
    });

    // Collect shopfloor multi-select
    const shopfloorChecked = document.querySelectorAll('#shopfloorMultiDropdown input[type="checkbox"]:checked');
    const capaShopfloors   = Array.from(shopfloorChecked).map(cb => cb.value).join(', ');

    const data = {
        irirId:               g('irirId'),
        plant:                g('irirPlant'),
        type:                 g('irirType'),
        employeeCategory:     g('irirEmployeeCategory'),
        date:                 g('irirDate'),
        time:                 g('irirTime'),
        shift:                g('irirShift'),
        gender:               g('irirGender'),
        experienceYears:      g('irirExperienceYears'),
        experienceMonths:     g('irirExperienceMonths'),
        activity:             g('irirActivity'),
        injuredName:          g('irirInjuredName'),
        employeeNo:           g('irirEmployeeNo'),
        injuryType:           g('irirInjuryType'),
        bodyPart:             g('irirBodyPart'),
        department:           g('irirDepartment'),
        location:             g('irirLocation'),
        narWhat:              g('narWhat'),
        narWhen:              g('narWhen'),
        narWhere:             g('narWhere'),
        narWhich:             g('narWhich'),
        narWho:               g('narWho'),
        narHow:               g('narHow'),
        immediateActions:     g('irirImmediateActions'),
        preparedBy:           g('irirPreparedBy'),
        preparedDate:         g('irirPreparedDate'),
        workPermit:           g('irirWorkPermit'),
        workPermitDetails:    g('irirPtwId'),           // Now PTW ID
        witnessType:          g('irirWitnessType'),
        teamMemberName:       g('irirTeamMemberName'),
        teamMemberDesignation: g('irirTeamMemberDesignation'),
        witnessStatement:     g('irirWitnessStatement'),

        // 6M multi-select
        man:         sixMData.man,
        machine:     sixMData.machine,
        material:    sixMData.material,
        method:      sixMData.method,
        measurement: sixMData.measurement,
        motherNature: sixMData.motherNature,

        // Why-Why
        ...wwData,

        rootCause:          g('irirRootCause'),
        unsafeActBrief:     g('irirUnsafeActBrief'),

        // CAPA (single ID + multiple actions)
        capaId:             g('capaIdDisplay') || generateCapaId(),
        capaTargetDate:     g('capaTargetDate'),
        capaType:           g('irirCapaType'),
        capaStatus:         g('irirCapaStatus'),
        capaShopfloorNeeded: document.querySelector('input[name="capaShopfloor"]:checked')
                                ? document.querySelector('input[name="capaShopfloor"]:checked').value : 'No',
        capaShopfloors:     capaShopfloors,
        ocpWisRef:          g('syscWisRef'),
        ocpSopId:           g('ocpSopId'),
        ...collectCARows(),
        capaRows: (function() {
            const tbody = document.getElementById('caTableBody');
            if (!tbody) return [];
            return Array.from(tbody.querySelectorAll('tr')).map(row => {
                const inputs = row.querySelectorAll('input, select');
                const action = inputs[0] ? inputs[0].value : '';
                if (!action.trim()) return null;
                return {
                    capaId: g('capaIdDisplay') || '',
                    action: action,
                    resp:   inputs[1] ? inputs[1].value : '',
                    tdc:    g('capaTargetDate'),
                    type:   g('irirCapaType'),
                    status: inputs[2] ? inputs[2].value : ''
                };
            }).filter(Boolean);
        })(),

        syscWisRef:         g('syscWisRef'),
        syscHiraYesNo:      g('syscHiraYesNo'),
        syscHiraRef:        g('syscHiraRef'),
        syscHiraDate:       g('syscHiraDate'),
        hiraRpnBefore:      g('hiraRpnBefore'),
        hiraRpnAfter:       g('hiraRpnAfter'),
        hiraNewAction:      g('hiraNewAction'),
        hiraTdc:            g('hiraTdc'),
        syscEaiYesNo:       g('syscEaiYesNo'),
        syscEaiRef:         g('syscEaiRef'),
        eaiNoResp:          g('eaiNoResp'),
        eaiNoTdc:           g('eaiNoTdc'),
        syscResp:           g('syscResp'),
        syscTargetDate:     g('syscTargetDate'),
        partBPreparedBy:    g('partBPreparedBy'),
        partBPreparedDate:  g('partBPreparedDate'),
        partBApprovedBy:    g('partBApprovedBy'),
        partBApprovedDate:  g('partBApprovedDate'),
        sourceSituation:    g('irirSourceSituation'),
        otherRemarks:       g('irirOtherRemarks'),
        returnDate:         g('irirReturnDate'),
        mandaysLost:        g('irirMandaysLost'),
        reoccurrence:       g('irirReoccurrence'),
        costMan:            g('costMan'),
        costMachine:        g('costMachine'),
        costMaterial:       g('costMaterial'),
        costMethod:         g('costMethod'),
        costManagement:     g('costManagement'),
        costNature:         g('costNature'),
        totalCost:          totalCost,
        effMonths:          getEffMonthsData(),
        incidentTargetDate: g('irirIncidentTargetDate'),
        status:             g('irirStatus')
    };

    // Build API payload — extend existing with new fields
    const apiPayload = {
        plant:                              data.plant,
        accident_incident:                  mapCode('accident_incident', data.type),
        employee_category_involved:         mapCode('employee_category', data.employeeCategory),
        date:                               data.date,
        time:                               convertTo24Hour(data.time),
        shift:                              mapCode('shift', data.shift),
        gender:                             mapCode('gender', data.gender),
        experience_years:                   parseInt(data.experienceYears) || 0,
        experience_months:                  parseInt(data.experienceMonths) || 0,
        name_of_injured_person:             data.injuredName,
        employee_no:                        data.employeeNo || '',
        injury_type:                        mapCode('injury_type', data.injuryType),
        body_part_injured:                  mapCode('body_part', data.bodyPart),
        name_of_shop:                       mapCode('shop', data.department),
        exact_location:                     data.location,
        what:                               data.narWhat || '',
        when:                               data.narWhen || '',
        where:                              data.narWhere || '',
        who:                                data.narWho || '',
        which:                              data.narWhich || '',
        how:                                data.narHow || '',
        immediate_actions:                  data.immediateActions || '',
        prepared_by:                        data.preparedBy || '',
        prepared_date:                      data.preparedDate || null,
        work_permit_followed:               mapCode('work_permit', data.workPermit),
        work_permit_details:                data.workPermitDetails || '',
        activity:                           mapCode('activity', data.activity),
        team_member_name:                   data.teamMemberName || '',
        team_member_designation:            data.teamMemberDesignation || '',
        witness_type:                       data.witnessType || '',
        witness_statement:                  data.witnessStatement || '',
        six_m_man:           JSON.stringify(collectWhyWhyForKey('man')),
        six_m_machine:       JSON.stringify(collectWhyWhyForKey('machine')),
        six_m_material:      JSON.stringify(collectWhyWhyForKey('material')),
        six_m_method:        JSON.stringify(collectWhyWhyForKey('method')),
        six_m_measurement:   JSON.stringify(collectWhyWhyForKey('measurement')),
        six_m_mother_nature: JSON.stringify(collectWhyWhyForKey('motherNature')),
        root_cause:                         data.rootCause || '',
        brief_of_unsafe_act:                data.unsafeActBrief || '',
        capa_id:                            data.capaId || '',
        capa_target_date:                   data.capaTargetDate || null,
        capa_type:                          mapCode('capa_type', data.capaType),
        capa_status:                        mapCode('capa_status', data.capaStatus),
        capa_shopfloor_needed:              data.capaShopfloorNeeded || 'No',
        capa_shopfloors:                    data.capaShopfloors || '',
        ocp_wi_reference:                   data.ocpWisRef || '',
        ocp_sop_id:                         data.ocpSopId || '',
        hira_yes_no:                        data.syscHiraYesNo || '',
        hira_study_reference:               data.syscHiraRef || '',
        hira_study_date:                    data.syscHiraDate || null,
        hira_rpn_before:                    parseInt(data.hiraRpnBefore) || null,
        hira_rpn_after:                     parseInt(data.hiraRpnAfter) || null,
        hira_new_action:                    data.hiraNewAction || '',
        hira_tdc:                           data.hiraTdc || null,
        eai_yes_no:                         data.syscEaiYesNo || '',
        eai_study_reference:                data.syscEaiRef || '',
        eai_no_responsible:                 data.eaiNoResp || '',
        eai_no_tdc:                         data.eaiNoTdc || null,
        system_corrections_responsibility:  data.syscResp || '',
        system_corrections_target_date:     data.syscTargetDate || null,
        prepared_by_part_b:                 data.partBPreparedBy || '',
        prepared_date_part_b:               data.partBPreparedDate || null,
        approved_by_dept_head:              data.partBApprovedBy || '',
        approved_date_part_b:               data.partBApprovedDate || null,
        source_situation_of_injury:         data.sourceSituation || '',
        other_remarks:                      data.otherRemarks || '',
        date_of_return_to_work:             data.returnDate || null,
        man_days_lost:                      parseInt(data.mandaysLost) || 0,
        cost_man:                           parseFloat(data.costMan) || 0,
        cost_machine:                       parseFloat(data.costMachine) || 0,
        cost_material:                      parseFloat(data.costMaterial) || 0,
        cost_method:                        parseFloat(data.costMethod) || 0,
        cost_management:                    parseFloat(data.costManagement) || 0,
        cost_mother_nature:                 parseFloat(data.costNature) || 0,
        total_cost_impact:                  parseFloat(data.totalCost) || 0,
        eff_months:                         JSON.stringify(data.effMonths || []),
        incident_target_date:               data.incidentTargetDate || null,
        status:                             data.status || 'Open',
        reoccurrence:                       mapCode('reoccurrence', data.reoccurrence),
        capa_actions: (function() {
            const rows = [];
            const total = parseInt(data.caTotalRows) || 0;
            for (let i = 1; i <= total; i++) {
                const action = data['caAction' + i] || '';
                if (!action.trim()) continue;
                rows.push({
                    capa_id:        data.capaId || '',
                    action:         action,
                    responsibility: data['caResp' + i] || '',
                    target_date:    data.capaTargetDate || null,
                    capa_type:      mapCode('capa_type', data.capaType),
                    status:         data['caStatus' + i] || ''
                });
            }
            return rows;
        })()
    };

    // Try POST to backend
    const token = localStorage.getItem('access');
    if (token) {
        try {
            const res = await fetch(`${API_BASE_URL}/incidents/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify(apiPayload)
            });
            if (res.status === 401) {
                console.warn('⚠️ 401 Unauthorized — token issue.');
                return;
            }
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const errMsg = Object.entries(errData)
                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                    .join('\n');
                alert('❌ Validation failed:\n' + errMsg);
                return;
            }
            const result = await res.json();
            if (result.inc_id || result.id) data.incId = result.inc_id || result.id;
            console.log('✅ Saved to backend:', result);
        } catch (err) {
            console.warn('⚠️ Backend unreachable — saving locally only.', err);
        }
    }

    // Save locally and re-render
    allIrirs.unshift(data);
    let maxNum = 0;
    allIrirs.forEach(irir => {
        const match = String(irir.irirId || '').match(/INC-(\d+)/i);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
    });
    irirCounter = maxNum + 1;
    saveToLocalStorage();
    renderTable();

    if (!document.getElementById('createAnother').checked) {
        closeIrirModal();
        resetForm();
    } else {
        resetForm();
        document.getElementById('irirId').value = generateIrirId();
    }

    showSuccessMessage('✅ Incident Report created! ID: ' + data.irirId);
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}


// Section 46 merged into resetForm (section 9) — duplicate removed


// Section 47 merged into openIrirModal (section 25) — duplicate removed

// ============================================================
// 49. SINGLE-SELECT CUSTOM DROPDOWN HELPERS
// (Used by Accident/Incident, Employee Category, Injury Type,
//  Body Part, Name of Shop, PTW ID, Witness, OCP/WI)
// ============================================================

function toggleSingleSelect(dropdownId, labelId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains('open');

    // Close all other open dropdowns first
    document.querySelectorAll('.multiselect-dropdown.open').forEach(d => {
        if (d.id !== dropdownId) {
            d.classList.remove('open');
            const w = d.closest('.multiselect-wrapper');
            if (w) w.querySelector('.multiselect-trigger').classList.remove('ms-open');
        }
    });

    if (isOpen) {
        dropdown.classList.remove('open');
        const trigger = dropdown.closest('.multiselect-wrapper').querySelector('.multiselect-trigger');
        if (trigger) trigger.classList.remove('ms-open');
    } else {
        dropdown.classList.add('open');
        const trigger = dropdown.closest('.multiselect-wrapper').querySelector('.multiselect-trigger');
        if (trigger) trigger.classList.add('ms-open');
    }
}

function setSingleSelect(dropdownId, labelId, hiddenId, value) {
    // Update label
    const label = document.getElementById(labelId);
    if (label) label.textContent = value;

    // Update hidden input value
    const hidden = document.getElementById(hiddenId);
    if (hidden) hidden.value = value;

    // Mark selected option
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.querySelectorAll('.ss-option').forEach(opt => {
            opt.classList.toggle('ss-selected', opt.textContent.trim() === value);
        });
        // Close dropdown
        dropdown.classList.remove('open');
        const trigger = dropdown.closest('.multiselect-wrapper').querySelector('.multiselect-trigger');
        if (trigger) trigger.classList.remove('ms-open');
    }
}

function addSingleSelectOption(dropdownId, inputId, hiddenId, labelId) {
    const input    = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown || !input.value.trim()) return;
    const val = input.value.trim();

    // Check duplicate
    const existing = Array.from(dropdown.querySelectorAll('.ss-option')).map(o => o.textContent.trim());
    if (existing.includes(val)) { input.value = ''; return; }

    // Insert before ms-add-row
    const addRow = dropdown.querySelector('.ms-add-row');
    const div    = document.createElement('div');
    div.className = 'ss-option';
    div.textContent = val;
    div.onclick = function() { setSingleSelect(dropdownId, labelId, hiddenId, val); };
    dropdown.insertBefore(div, addRow);

    // Auto-select the new option
    setSingleSelect(dropdownId, labelId, hiddenId, val);
    input.value = '';
}

// Special handler for OCP/WI — also shows SOP sub-group when Modified SOP selected
function setSingleSelectOcp(value) {
    setSingleSelect('syscWisDd', 'syscWisLabel', 'syscWisRef', value);
    const sopGroup = document.getElementById('ocpSopGroup');
    if (sopGroup) sopGroup.style.display = value === 'Modified SOP' ? 'block' : 'none';
}

// ============================================================
// 50. REOCCURRENCE SUB-DROPDOWN — POPULATE FROM allIrirs
// ============================================================

function handleReoccurrenceChange() {
    const val   = document.getElementById('irirReoccurrence').value;
    const group = document.getElementById('reoccurrenceIncidentGroup');
    if (!group) return;
    if (val === 'Yes') {
        group.style.display = 'block';
        // Populate the incident ID dropdown from existing records
        const select = document.getElementById('irirReoccurrenceIncidentId');
        if (select) {
            select.innerHTML = '<option value="">-- Select Incident ID --</option>';
            allIrirs.forEach(function(irir) {
                if (irir.irirId) {
                    const opt = document.createElement('option');
                    opt.value = irir.irirId;
                    opt.textContent = irir.irirId + (irir.injuredName ? ' — ' + irir.injuredName : '');
                    select.appendChild(opt);
                }
            });
        }
    } else {
        group.style.display = 'none';
    }
}

// Also handle reoccurrence in detail panel
function dpHandleReoccurrenceChange() {
    const val   = document.getElementById('dReoccurrence') ? document.getElementById('dReoccurrence').value : '';
    const group = document.getElementById('dpReoccurrenceIncidentGroup');
    if (!group) return;
    if (val === 'Yes') {
        group.style.display = 'block';
        const select = document.getElementById('dpReoccurrenceIncidentId');
        if (select) {
            select.innerHTML = '<option value="">-- Select Incident ID --</option>';
            allIrirs.forEach(function(irir) {
                if (irir.irirId && irir.irirId !== currentDetailIrirId) {
                    const opt = document.createElement('option');
                    opt.value = irir.irirId;
                    opt.textContent = irir.irirId + (irir.injuredName ? ' — ' + irir.injuredName : '');
                    select.appendChild(opt);
                }
            });
        }
    } else {
        group.style.display = 'none';
    }
}



document.addEventListener('click', function(e) {
    if (!e.target.closest('.multiselect-wrapper')) {
        document.querySelectorAll('.multiselect-dropdown.open').forEach(d => {
            d.classList.remove('open');
            const wrapper = d.closest('.multiselect-wrapper');
            if (wrapper) {
                const trigger = wrapper.querySelector('.multiselect-trigger');
                if (trigger) trigger.classList.remove('ms-open');
            }
        });
    }
}, true);

// ============================================================
// 39. AVATAR DROPDOWN
// ============================================================

function irirToggleDropdown(e) {
    e.stopPropagation();
    const dd = document.getElementById('irirAvatarDropdown');
    dd.classList.toggle('open');
}

document.addEventListener('click', function(e) {
    const wrapper = document.getElementById('irirAvatarWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        const dd = document.getElementById('irirAvatarDropdown');
        if (dd) dd.classList.remove('open');
    }
});

function irirHandleDropdown(action) {
    document.getElementById('irirAvatarDropdown').classList.remove('open');
    const msgs = {
        profile:       'Opening My Profile…',
        settings:      'Opening Settings…',
        password:      'Opening Change Password…',
        notifications: 'Loading Notifications…',
        help:          'Opening Help & Support…',
        about:         'Safenod v2.4.1 — Plant Risk & Safety Platform',
        logout:        'Logging you out safely…'
    };
    showNotification(msgs[action] || 'Loading…');
}