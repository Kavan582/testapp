console.log('🚀 Permit to Work Tracker');

const PTW_STORAGE_KEY = 'ptwTrackerData';
const PTW_COUNTER_KEY = 'ptwTrackerCounter';

const ptwData = [];
let ptwCounter = 1;
let currentEditIndex = null;

const aiSuggestions = [
    "Show me all open permits",
    "Find permits for height work",
    "Which permits have hot work?",
    "Display all closed permits",
    "Show permits with confined space work",
    "Find permits with HIRA risk assessment",
    "List all electrical work permits",
    "Show permits created this month"
];
let typingInterval = null;
let currentSuggestionIndex = 0;
let currentCharIndex = 0;
let isTyping = false;

// ── STORAGE ──
function save() {
    localStorage.setItem(PTW_STORAGE_KEY, JSON.stringify(ptwData));
    localStorage.setItem(PTW_COUNTER_KEY, String(ptwCounter));
}
function load() {
    try {
        const saved = localStorage.getItem(PTW_STORAGE_KEY);
        const savedCounter = localStorage.getItem(PTW_COUNTER_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            ptwData.length = 0;
            parsed.forEach(r => ptwData.push(r));
        }
        if (savedCounter) {
            ptwCounter = parseInt(savedCounter, 10);
        } else if (ptwData.length > 0) {
            const max = Math.max(...ptwData.map(r => {
                const m = r.permitNo && r.permitNo.match(/PTW-(\d+)/);
                return m ? parseInt(m[1]) : 0;
            }));
            ptwCounter = max + 1;
        }
    } catch(e) { ptwData.length = 0; ptwCounter = 1; }
}

// ── COLLECT FROM FORM ──
function getCheckedTexts(ids) {
    return ids
        .filter(id => { const el = document.getElementById(id); return el && el.checked; })
        .map(id => {
            const el = document.getElementById(id);
            const lbl = el.closest('label');
            return lbl ? lbl.textContent.trim() : id;
        });
}
function getPersons() {
    const out = [];
    document.querySelectorAll('#personsContainer .person-input').forEach(el => {
        if (el.value.trim()) out.push(el.value.trim());
    });
    return out;
}

// ── DYNAMIC PERSON ROWS (Create Form) ──
function addPersonRow() {
    const container = document.getElementById('personsContainer');
    const rows = container.querySelectorAll('.person-row');
    const num = rows.length + 1;
    const div = document.createElement('div');
    div.className = 'form-group person-row';
    div.innerHTML = `<label>Person ${num}</label>
        <div class="person-input-row">
            <input type="text" class="input-field person-input" placeholder="Enter name...">
            <button type="button" class="person-remove-btn" onclick="removePersonRow(this)">−</button>
        </div>`;
    container.appendChild(div);
    updateRemoveButtons('personsContainer');
}

function addDetailPersonRow() {
    const container = document.getElementById('detailPersonsContainer');
    const rows = container.querySelectorAll('.person-row');
    const num = rows.length + 1;
    const div = document.createElement('div');
    div.className = 'detail-form-section person-row';
    div.innerHTML = `<label class="detail-label">Person ${num}</label>
        <div class="person-input-row">
            <input type="text" class="detail-input person-input" placeholder="Enter name...">
            <button type="button" class="person-remove-btn" onclick="removePersonRow(this)">−</button>
        </div>`;
    container.appendChild(div);
    updateRemoveButtons('detailPersonsContainer');
}

function removePersonRow(btn) {
    const row = btn.closest('.person-row');
    const container = row.parentElement;
    row.remove();
    renumberPersonRows(container);
    updateRemoveButtons(container.id);
}

function renumberPersonRows(container) {
    container.querySelectorAll('.person-row').forEach((row, i) => {
        const lbl = row.querySelector('label');
        if (lbl) lbl.textContent = `Person ${i + 1}`;
    });
}

function updateRemoveButtons(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const rows = container.querySelectorAll('.person-row');
    rows.forEach(row => {
        const btn = row.querySelector('.person-remove-btn');
        if (btn) btn.style.display = rows.length > 1 ? '' : 'none';
    });
}
function getWorkTypes() {
    const map = { general:'General', height:'Height', hot:'Hot', electrical:'Electrical', excavation:'Excavation', confined:'Confined' };
    return Object.keys(map).filter(k => {
        const el = document.getElementById('wt_' + k); return el && el.checked;
    }).map(k => map[k]);
}
// ── OTHER EQUIPMENT TOGGLE ──
function toggleOtherEquip(inputId, cbId) {
    const cb = document.getElementById(cbId);
    const wrap = document.getElementById(inputId === 'eq_other' ? 'eq_other_wrap' : 'd_eq_other_wrap');
    if (!wrap) return;
    if (cb && cb.checked) {
        wrap.classList.remove('hidden');
        document.getElementById(inputId)?.focus();
    } else {
        wrap.classList.add('hidden');
        const inp = document.getElementById(inputId);
        if (inp) inp.value = '';
    }
}

function getEquipment() {
    const ids = ['eq_helmet','eq_gloves','eq_goggles','eq_safetybelt','eq_earplugs','eq_scba','eq_mask','eq_lamp','eq_tripod','eq_arcflash'];
    const selected = getCheckedTexts(ids);
    const cb = document.getElementById('eq_other_cb');
    const other = document.getElementById('eq_other');
    if (cb && cb.checked && other && other.value.trim()) selected.push(other.value.trim());
    return selected;
}

// ── A/NA TOGGLE ──
function getANAState(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return '';
    if (btn.classList.contains('active-a')) return 'A';
    if (btn.classList.contains('active-na')) return 'NA';
    return '';
}
function setANAState(btnId, val) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.remove('active-a','active-na');
    if (val === 'A') btn.classList.add('active-a');
    else if (val === 'NA') btn.classList.add('active-na');
}
function toggleANA(btn) {
    if (btn.classList.contains('active-a')) {
        btn.classList.remove('active-a');
        btn.classList.add('active-na');
    } else if (btn.classList.contains('active-na')) {
        btn.classList.remove('active-na');
    } else {
        btn.classList.add('active-a');
    }
}

// ── WORK SECTION TOGGLE (in create modal) ──
function toggleWorkSection(type, checkbox) {
    const sec = document.getElementById('section_' + type);
    if (!sec) return;
    if (checkbox.checked) {
        sec.classList.remove('hidden');
    } else {
        sec.classList.add('hidden');
        sec.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
}

// ── STATUS COUNTERS ──
function updateStatusCounters() {
    document.getElementById('totalCount').textContent = ptwData.length;
    document.getElementById('openCount').textContent = ptwData.filter(d => d.status === 'Open').length;
    document.getElementById('closedCount').textContent = ptwData.filter(d => d.status === 'Closed').length;
}

// ── BUILD TABLE ROW ──
function buildRowHTML(d, index) {
    const workTypes = (d.workTypes || []).length ? d.workTypes.join(', ') : '—';
    const equipment = (d.equipment || []).length ? d.equipment.slice(0,2).join(', ') + (d.equipment.length > 2 ? ` +${d.equipment.length-2}` : '') : '—';
    const status = d.status || 'Open';
    const statusBadge = status === 'Open'
        ? `<span class="badge status-open">OPEN</span>`
        : `<span class="badge status-closed">CLOSED</span>`;

    return `
        <td class="sticky-col sticky-col-0"><input type="checkbox" class="row-checkbox" onchange="updateBulkDeleteBar()"></td>
        <td class="sticky-col sticky-col-1"><a href="javascript:void(0)" class="task-id" onclick="openDetailPanel(${index})">${d.permitNo}</a></td>
        <td class="sticky-col sticky-col-2">${d.date || '—'}</td>
        <td class="sticky-col sticky-col-3">
            <input type="text" class="inline-input" value="${escHtml(d.locationOfWork||'')}"
                placeholder="Enter location..."
                onblur="updateInlineField(${index},'locationOfWork',this.value)">
        </td>
        <td data-column-index="4">${d.time || '—'}</td>
        <td data-column-index="5">
            <input type="text" class="inline-input" value="${escHtml(d.natureOfWork||'')}"
                placeholder="Enter nature of work..."
                onblur="updateInlineField(${index},'natureOfWork',this.value)">
        </td>
        <td data-column-index="6">${escHtml(d.contractName||'—')}</td>
        <td data-column-index="7">${d.riskAssessment ? `<span class="badge badge-risk">${d.riskAssessment}</span>` : '—'}</td>
        <td data-column-index="8"><span class="work-type-text">${workTypes}</span></td>
        <td data-column-index="9"><div class="persons-list">${(d.persons||[]).length ? (d.persons||[]).map((p,i)=>`<div>${i+1}. ${escHtml(p)}</div>`).join('') : '—'}</div></td>
        <td data-column-index="10"><span class="equip-text">${equipment}</span></td>
        <td data-column-index="11">${escHtml(d.safetyInstructions||'—').substring(0,60)}</td>
        <td data-column-index="12">${escHtml(d.auth_orig_name||'—')}</td>
        <td data-column-index="13">${escHtml(d.auth_sp_name||'—')}</td>
        <td data-column-index="14">${escHtml(d.auth_shop_name||'—')}</td>
        <td data-column-index="15">${escHtml(d.auth_elec_name||'—')}</td>
        <td data-column-index="16">${escHtml(d.auth_sec_fw_name||'—')}</td>
        <td data-column-index="17">${escHtml(d.auth_safety_name||'—')}</td>
        <td data-column-index="18">${escHtml(d.closure_sp_name||'—')}</td>
        <td data-column-index="19">${escHtml(d.closure_orig_name||'—')}</td>
        <td data-column-index="20">${escHtml(d.closure_shop_name||'—')}</td>
        <td data-column-index="21">
            <div class="status-cell">
                <select class="inline-dropdown status-dropdown-inline" onchange="updateInlineField(${index},'status',this.value)">
                    <option value="Open" ${status==='Open'?'selected':''}>Open</option>
                    <option value="Closed" ${status==='Closed'?'selected':''}>Closed</option>
                </select>
            </div>
        </td>
        <td style="text-align:center;width:48px;">
            <button class="sp-open-btn" data-permit="${d.permitNo}" onclick="openSidePanel(${index})" title="Comments & Activity">
                💬
                <span class="sp-badge" style="display:none;"></span>
            </button>
        </td>`;
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── ADD ROW TO TABLE ──
function addPTWToTable(d, index) {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('ptwTable').style.display = 'table';

    const tbody = document.getElementById('ptwTableBody');
    const row = document.createElement('tr');
    row.setAttribute('data-index', index);
    row.setAttribute('data-status', d.status || 'Open');
    row.setAttribute('data-risk', d.riskAssessment || '');
    row.setAttribute('data-worktype', (d.workTypes || []).join(','));
    row.innerHTML = buildRowHTML(d, index);
    tbody.insertBefore(row, tbody.firstChild);
    logActivity(d.permitNo, 'create', `<strong>${d.permitNo}</strong> was created`);
    setTimeout(() => updateSPBadge(d.permitNo), 0);
}

// ── INLINE EDIT ──
function updateInlineField(index, field, value) {
    if (!ptwData[index]) return;
    ptwData[index][field] = value.trim();
    save();
    if (field === 'status') {
        updateStatusCounters();
        checkOverduePermits();
        updateSidebarBadges();
        const row = document.querySelector(`tr[data-index="${index}"]`);
        if (row) row.setAttribute('data-status', value);
    }
}

// ── UPDATE TABLE ROW ──
function updateTableRow(index, d) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    if (!row) return;
    row.innerHTML = buildRowHTML(d, index);
    row.setAttribute('data-status', d.status || 'Open');
    row.setAttribute('data-risk', d.riskAssessment || '');
    row.setAttribute('data-worktype', (d.workTypes||[]).join(','));
}

// ── DETAIL PANEL ──
// ── DETAIL WORK SECTION TOGGLE ──
function detailToggleWorkSection(type, checkbox) {
    const sec = document.getElementById('d_section_' + type);
    if (!sec) return;
    if (checkbox.checked) {
        sec.classList.remove('hidden');
    } else {
        sec.classList.add('hidden');
        sec.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
}

// ── DETAIL CHECKLIST HELPERS ──
function detailGetCheckedTexts(ids) {
    return ids
        .filter(id => { const el = document.getElementById(id); return el && el.checked; })
        .map(id => {
            const el = document.getElementById(id);
            const lbl = el.closest('label');
            return lbl ? lbl.textContent.trim() : id;
        });
}

function detailGetEquipment() {
    const ids = ['d_eq_helmet','d_eq_gloves','d_eq_goggles','d_eq_safetybelt','d_eq_earplugs','d_eq_scba','d_eq_mask','d_eq_lamp','d_eq_tripod','d_eq_arcflash'];
    const selected = detailGetCheckedTexts(ids);
    const cb = document.getElementById('d_eq_other_cb');
    const other = document.getElementById('detailEqOther');
    if (cb && cb.checked && other && other.value.trim()) selected.push(other.value.trim());
    return selected;
}

function detailGetWorkTypes() {
    const map = { general:'General', height:'Height', hot:'Hot', electrical:'Electrical', excavation:'Excavation', confined:'Confined' };
    return Object.keys(map).filter(k => {
        const el = document.getElementById('d_wt_' + k); return el && el.checked;
    }).map(k => map[k]);
}

function setDetailCheckboxes(ids, checkedTexts) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const lbl = el.closest('label');
        const txt = lbl ? lbl.textContent.trim() : '';
        el.checked = checkedTexts.some(c => txt.includes(c.substring(0, 20)));
    });
}

function openDetailPanel(index) {
    index = parseInt(index);
    if (isNaN(index) || !ptwData[index]) return;
    const d = ptwData[index];
    currentEditIndex = index;

    // Basic
    document.getElementById('detailPanelTitle').textContent = d.permitNo;
    document.getElementById('detailPermitNo').value = d.permitNo || '';
    document.getElementById('detailDate').value = d.date || '';
    // Split stored time into In/Out
    const timeParts = (d.time || '').split(' - ');
    document.getElementById('detailTimeIn').value = timeParts[0] || '';
    document.getElementById('detailTimeOut').value = timeParts[1] || '';

    // Job
    document.getElementById('detailLocation').value = d.locationOfWork || '';
    document.getElementById('detailNature').value = d.natureOfWork || '';
    document.getElementById('detailContract').value = d.contractName || '';
    document.getElementById('detailRisk').value = d.riskAssessment || '';

    // Common Guidelines checkboxes
    const cgIds = ['d_cg1','d_cg2','d_cg3','d_cg4','d_cg5','d_cg6','d_cg7','d_cg8','d_cg9'];
    setDetailCheckboxes(cgIds, d.commonGuidelines || []);

    // Work Types checkboxes + show/hide sections
    const wtMap = { general:'General', height:'Height', hot:'Hot', electrical:'Electrical', excavation:'Excavation', confined:'Confined' };
    const savedWt = d.workTypes || [];
    Object.keys(wtMap).forEach(k => {
        const cb = document.getElementById('d_wt_' + k);
        if (cb) {
            cb.checked = savedWt.includes(wtMap[k]);
            const sec = document.getElementById('d_section_' + k);
            if (sec) {
                if (cb.checked) sec.classList.remove('hidden');
                else sec.classList.add('hidden');
            }
        }
    });

    // Work type checklists
    setDetailCheckboxes(['d_gw1','d_gw2','d_gw3','d_gw4','d_gw5'], d.generalWorks || []);
    setDetailCheckboxes(['d_hw1','d_hw2','d_hw3','d_hw4','d_hw5','d_hw6','d_hw7'], d.heightWork || []);
    setDetailCheckboxes(['d_hotw1','d_hotw2','d_hotw3','d_hotw4','d_hotw5'], d.hotWork || []);
    setDetailCheckboxes(['d_ew1','d_ew2','d_ew3'], d.electricalWork || []);
    setDetailCheckboxes(['d_exw1','d_exw2','d_exw3','d_exw4','d_exw5','d_exw6'], d.excavationWork || []);
    setDetailCheckboxes(['d_csw1','d_csw2','d_csw3','d_csw4','d_csw5'], d.confinedSpaceWork || []);

    // Persons - dynamic rows
    const persons = d.persons || [];
    const detailPersonsContainer = document.getElementById('detailPersonsContainer');
    detailPersonsContainer.innerHTML = '';
    const personList = persons.length ? persons : [''];
    personList.forEach((name, i) => {
        const div = document.createElement('div');
        div.className = 'form-group person-row';
        div.innerHTML = `<label>Person ${i + 1}</label>
            <div class="person-input-row">
                <input type="text" class="input-field person-input" placeholder="Enter name..." value="${escHtml(name)}">
                <button type="button" class="person-remove-btn" onclick="removePersonRow(this)" style="display:none;">−</button>
            </div>`;
        detailPersonsContainer.appendChild(div);
    });
    updateRemoveButtons('detailPersonsContainer');

    // Safety equipment
    document.getElementById('detailElecEquipDate').value = d.electricalEquipDate || '';
    document.getElementById('detailSafetyBelt').value = d.safetyBeltNo || '';
    document.getElementById('detailLoto').value = d.lotoLockNo || '';
    document.getElementById('detailLadder').value = d.ladderNo || '';
    document.getElementById('detailGlovesDate').value = d.electricalGlovesDate || '';
    document.getElementById('detailMhes').value = d.mhesTested || '';

    // Gas
    document.getElementById('detailO2').value = d.o2Level || '';
    document.getElementById('detailCO').value = d.coLevel || '';
    document.getElementById('detailH2S').value = d.h2sLevel || '';
    document.getElementById('detailFlamGas').value = d.flamGasLevel || '';

    // Equipment checkboxes + Other
    const eqIds = ['d_eq_helmet','d_eq_gloves','d_eq_goggles','d_eq_safetybelt','d_eq_earplugs','d_eq_scba','d_eq_mask','d_eq_lamp','d_eq_tripod','d_eq_arcflash'];
    setDetailCheckboxes(eqIds, d.equipment || []);
    const dEqOtherCb = document.getElementById('d_eq_other_cb');
    const dEqOtherWrap = document.getElementById('d_eq_other_wrap');
    const dEqOtherInp = document.getElementById('detailEqOther');
    if (d.eqOther && d.eqOther.trim()) {
        if (dEqOtherCb) dEqOtherCb.checked = true;
        if (dEqOtherWrap) dEqOtherWrap.classList.remove('hidden');
        if (dEqOtherInp) dEqOtherInp.value = d.eqOther;
    } else {
        if (dEqOtherCb) dEqOtherCb.checked = false;
        if (dEqOtherWrap) dEqOtherWrap.classList.add('hidden');
        if (dEqOtherInp) dEqOtherInp.value = '';
    }

    // Instructions & status
    document.getElementById('detailSafetyInstructions').value = d.safetyInstructions || '';
    document.getElementById('detailStatus').value = d.status || 'Open';

    // Authorization Panel
    document.getElementById('d_auth_orig_name').value = d.auth_orig_name || '';
    document.getElementById('d_auth_orig_dept').value = d.auth_orig_dept || '';
    document.getElementById('d_auth_orig_sign').value = d.auth_orig_sign || '';
    document.getElementById('d_auth_sp_name').value = d.auth_sp_name || '';
    document.getElementById('d_auth_sp_contract').value = d.auth_sp_contract || '';
    document.getElementById('d_auth_sp_sign').value = d.auth_sp_sign || '';
    document.getElementById('d_auth_shop_name').value = d.auth_shop_name || '';
    document.getElementById('d_auth_shop_dept').value = d.auth_shop_dept || '';
    document.getElementById('d_auth_shop_sign').value = d.auth_shop_sign || '';
    setANAState('d_auth_shop_ana', d.auth_shop_ana || '');
    document.getElementById('d_auth_elec_name').value = d.auth_elec_name || '';
    document.getElementById('d_auth_elec_sign').value = d.auth_elec_sign || '';
    setANAState('d_auth_elec_ana', d.auth_elec_ana || '');
    document.getElementById('d_auth_sec_fw_name').value = d.auth_sec_fw_name || '';
    document.getElementById('d_auth_sec_sign').value = d.auth_sec_sign || '';
    setANAState('d_auth_sec_ana', d.auth_sec_ana || '');
    document.getElementById('d_auth_safety_name').value = d.auth_safety_name || '';
    document.getElementById('d_auth_safety_sign').value = d.auth_safety_sign || '';

    // Closure
    document.getElementById('d_closure_contractor_nos').value = d.closure_contractor_nos || '';
    document.getElementById('d_closure_sp_name').value = d.closure_sp_name || '';
    document.getElementById('d_closure_sp_time').value = d.closure_sp_time || '';
    document.getElementById('d_closure_sp_sign').value = d.closure_sp_sign || '';
    document.getElementById('d_closure_orig_name').value = d.closure_orig_name || '';
    document.getElementById('d_closure_orig_time').value = d.closure_orig_time || '';
    document.getElementById('d_closure_orig_sign').value = d.closure_orig_sign || '';
    document.getElementById('d_closure_shop_name').value = d.closure_shop_name || '';
    document.getElementById('d_closure_shop_time').value = d.closure_shop_time || '';
    document.getElementById('d_closure_shop_sign').value = d.closure_shop_sign || '';
    setANAState('d_closure_shop_ana', d.closure_shop_ana || '');

    document.getElementById('detailPanel').classList.add('open');
    document.getElementById('detailPanelOverlay').classList.add('show');
}

function closeDetailPanel() {
    document.getElementById('detailPanel').classList.remove('open');
    document.getElementById('detailPanelOverlay').classList.remove('show');
    currentEditIndex = null;
}

function saveDetail() {
    if (currentEditIndex === null) return;
    const prev = ptwData[currentEditIndex];
    ptwData[currentEditIndex] = {
        ...prev,
        date: document.getElementById('detailDate').value,
        time: [document.getElementById('detailTimeIn').value, document.getElementById('detailTimeOut').value].filter(Boolean).join(' - '),
        locationOfWork: document.getElementById('detailLocation').value,
        natureOfWork: document.getElementById('detailNature').value,
        contractName: document.getElementById('detailContract').value,
        riskAssessment: document.getElementById('detailRisk').value,
        commonGuidelines: detailGetCheckedTexts(['d_cg1','d_cg2','d_cg3','d_cg4','d_cg5','d_cg6','d_cg7','d_cg8','d_cg9']),
        workTypes: detailGetWorkTypes(),
        generalWorks: detailGetCheckedTexts(['d_gw1','d_gw2','d_gw3','d_gw4','d_gw5']),
        heightWork: detailGetCheckedTexts(['d_hw1','d_hw2','d_hw3','d_hw4','d_hw5','d_hw6','d_hw7']),
        hotWork: detailGetCheckedTexts(['d_hotw1','d_hotw2','d_hotw3','d_hotw4','d_hotw5']),
        electricalWork: detailGetCheckedTexts(['d_ew1','d_ew2','d_ew3']),
        excavationWork: detailGetCheckedTexts(['d_exw1','d_exw2','d_exw3','d_exw4','d_exw5','d_exw6']),
        confinedSpaceWork: detailGetCheckedTexts(['d_csw1','d_csw2','d_csw3','d_csw4','d_csw5']),
        electricalEquipDate: document.getElementById('detailElecEquipDate').value,
        safetyBeltNo: document.getElementById('detailSafetyBelt').value,
        lotoLockNo: document.getElementById('detailLoto').value,
        ladderNo: document.getElementById('detailLadder').value,
        electricalGlovesDate: document.getElementById('detailGlovesDate').value,
        mhesTested: document.getElementById('detailMhes').value,
        o2Level: document.getElementById('detailO2').value,
        coLevel: document.getElementById('detailCO').value,
        h2sLevel: document.getElementById('detailH2S').value,
        flamGasLevel: document.getElementById('detailFlamGas').value,
        safetyInstructions: document.getElementById('detailSafetyInstructions').value,
        status: document.getElementById('detailStatus').value,
        persons: (() => {
            const out = [];
            document.querySelectorAll('#detailPersonsContainer .person-input').forEach(el => {
                if (el.value.trim()) out.push(el.value.trim());
            });
            return out;
        })(),
        // Authorization Panel
        auth_orig_name: document.getElementById('d_auth_orig_name').value,
        auth_orig_dept: document.getElementById('d_auth_orig_dept').value,
        auth_orig_sign: document.getElementById('d_auth_orig_sign').value,
        auth_sp_name: document.getElementById('d_auth_sp_name').value,
        auth_sp_contract: document.getElementById('d_auth_sp_contract').value,
        auth_sp_sign: document.getElementById('d_auth_sp_sign').value,
        auth_shop_name: document.getElementById('d_auth_shop_name').value,
        auth_shop_dept: document.getElementById('d_auth_shop_dept').value,
        auth_shop_sign: document.getElementById('d_auth_shop_sign').value,
        auth_shop_ana: getANAState('d_auth_shop_ana'),
        auth_elec_name: document.getElementById('d_auth_elec_name').value,
        auth_elec_sign: document.getElementById('d_auth_elec_sign').value,
        auth_elec_ana: getANAState('d_auth_elec_ana'),
        auth_sec_fw_name: document.getElementById('d_auth_sec_fw_name').value,
        auth_sec_sign: document.getElementById('d_auth_sec_sign').value,
        auth_sec_ana: getANAState('d_auth_sec_ana'),
        auth_safety_name: document.getElementById('d_auth_safety_name').value,
        auth_safety_sign: document.getElementById('d_auth_safety_sign').value,
        equipment: detailGetEquipment(),
        eqOther: document.getElementById('detailEqOther').value,
        // Closure
        closure_contractor_nos: document.getElementById('d_closure_contractor_nos').value,
        closure_sp_name: document.getElementById('d_closure_sp_name').value,
        closure_sp_time: document.getElementById('d_closure_sp_time').value,
        closure_sp_sign: document.getElementById('d_closure_sp_sign').value,
        closure_orig_name: document.getElementById('d_closure_orig_name').value,
        closure_orig_time: document.getElementById('d_closure_orig_time').value,
        closure_orig_sign: document.getElementById('d_closure_orig_sign').value,
        closure_shop_name: document.getElementById('d_closure_shop_name').value,
        closure_shop_time: document.getElementById('d_closure_shop_time').value,
        closure_shop_sign: document.getElementById('d_closure_shop_sign').value,
        closure_shop_ana: getANAState('d_closure_shop_ana'),
    };
    save();
    updateTableRow(currentEditIndex, ptwData[currentEditIndex]);
    updateStatusCounters();
    logActivity(ptwData[currentEditIndex].permitNo, 'edit', `<strong>Permit updated</strong> — status: ${ptwData[currentEditIndex].status}`);
    setTimeout(() => updateSPBadge(ptwData[currentEditIndex].permitNo), 0);
    showSuccessMessage('✅ Saved!');
    closeDetailPanel();
}

function deleteCurrentPTW() {
    if (currentEditIndex === null) return;
    if (!confirm('Delete this permit? This cannot be undone.')) return;
    ptwData.splice(currentEditIndex, 1);
    save();
    rebuildTable();
    if (ptwData.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('ptwTable').style.display = 'none';
    }
    showSuccessMessage('✅ Permit deleted!');
    closeDetailPanel();
}

function rebuildTable() {
    document.getElementById('ptwTableBody').innerHTML = '';
    ptwData.forEach((d, i) => addPTWToTable(d, i));
    updateStatusCounters();
}

// ── MODAL ──
function openCreateModal() {
    document.getElementById('createModalOverlay').classList.add('active');
    document.getElementById('permitNo').value = `PTW-${String(ptwCounter).padStart(3,'0')}`;
}
function closeCreateModal() {
    document.getElementById('createModalOverlay').classList.remove('active');
    document.getElementById('ptwForm').reset();
    document.getElementById('permitNo').value = `PTW-${String(ptwCounter).padStart(3,'0')}`;
    document.getElementById('permitTimeIn').value = '';
    document.getElementById('permitTimeOut').value = '';
    ['general','height','hot','electrical','excavation','confined'].forEach(t => {
        const s = document.getElementById('section_'+t);
        if (s) s.classList.add('hidden');
    });
    // Reset persons to 1 row
    const pc = document.getElementById('personsContainer');
    if (pc) {
        pc.innerHTML = `<div class="form-group person-row">
            <label>Person 1</label>
            <div class="person-input-row">
                <input type="text" class="input-field person-input" placeholder="Enter name...">
                <button type="button" class="person-remove-btn" onclick="removePersonRow(this)" style="display:none;">−</button>
            </div>
        </div>`;
    }
    // Reset other equipment
    const eqOtherWrap = document.getElementById('eq_other_wrap');
    if (eqOtherWrap) eqOtherWrap.classList.add('hidden');
}
function toggleFullscreen() { document.getElementById('createModal').classList.toggle('fullscreen'); }

// ── FORM SUBMIT ──
document.addEventListener('DOMContentLoaded', function() {
    applyStoredTheme();
    applyStoredSidebar();
    load();
    if (ptwData.length > 0) {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('ptwTable').style.display = 'table';
        for (let i = ptwData.length - 1; i >= 0; i--) addPTWToTable(ptwData[i], i);
        updateStatusCounters();
    }
    checkOverduePermits();

    document.getElementById('ptwForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            permitNo: document.getElementById('permitNo').value,
            date: document.getElementById('permitDate').value,
            time: [document.getElementById('permitTimeIn').value, document.getElementById('permitTimeOut').value].filter(Boolean).join(' - '),
            locationOfWork: document.getElementById('locationOfWork').value,
            natureOfWork: document.getElementById('natureOfWork').value,
            contractName: document.getElementById('contractName').value,
            riskAssessment: document.getElementById('riskAssessment').value,
            commonGuidelines: getCheckedTexts(['cg1','cg2','cg3','cg4','cg5','cg6','cg7','cg8','cg9']),
            workTypes: getWorkTypes(),
            generalWorks: getCheckedTexts(['gw1','gw2','gw3','gw4','gw5']),
            heightWork: getCheckedTexts(['hw1','hw2','hw3','hw4','hw5','hw6','hw7']),
            hotWork: getCheckedTexts(['hotw1','hotw2','hotw3','hotw4','hotw5']),
            electricalWork: getCheckedTexts(['ew1','ew2','ew3']),
            excavationWork: getCheckedTexts(['exw1','exw2','exw3','exw4','exw5','exw6']),
            confinedSpaceWork: getCheckedTexts(['csw1','csw2','csw3','csw4','csw5']),
            persons: getPersons(),
            electricalEquipDate: document.getElementById('electricalEquipDate').value,
            safetyBeltNo: document.getElementById('safetyBeltNo').value,
            lotoLockNo: document.getElementById('lotoLockNo').value,
            ladderNo: document.getElementById('ladderNo').value,
            electricalGlovesDate: document.getElementById('electricalGlovesDate').value,
            mhesTested: document.getElementById('mhesTested').value,
            o2Level: document.getElementById('o2Level').value,
            coLevel: document.getElementById('coLevel').value,
            h2sLevel: document.getElementById('h2sLevel').value,
            flamGasLevel: document.getElementById('flamGasLevel').value,
            equipment: getEquipment(),
            safetyInstructions: document.getElementById('safetyInstructions').value,
            // Authorization Panel
            auth_orig_name: document.getElementById('auth_orig_name').value,
            auth_orig_dept: document.getElementById('auth_orig_dept').value,
            auth_orig_sign: document.getElementById('auth_orig_sign').value,
            auth_sp_name: document.getElementById('auth_sp_name').value,
            auth_sp_contract: document.getElementById('auth_sp_contract').value,
            auth_sp_sign: document.getElementById('auth_sp_sign').value,
            auth_shop_name: document.getElementById('auth_shop_name').value,
            auth_shop_dept: document.getElementById('auth_shop_dept').value,
            auth_shop_sign: document.getElementById('auth_shop_sign').value,
            auth_shop_ana: getANAState('auth_shop_ana'),
            auth_elec_name: document.getElementById('auth_elec_name').value,
            auth_elec_sign: document.getElementById('auth_elec_sign').value,
            auth_elec_ana: getANAState('auth_elec_ana'),
            auth_sec_fw_name: document.getElementById('auth_sec_fw_name').value,
            auth_sec_sign: document.getElementById('auth_sec_sign').value,
            auth_sec_ana: getANAState('auth_sec_ana'),
            auth_safety_name: document.getElementById('auth_safety_name').value,
            auth_safety_sign: document.getElementById('auth_safety_sign').value,
            // Closure
            closure_contractor_nos: document.getElementById('closure_contractor_nos').value,
            closure_sp_name: document.getElementById('closure_sp_name').value,
            closure_sp_time: document.getElementById('closure_sp_time').value,
            closure_sp_sign: document.getElementById('closure_sp_sign').value,
            closure_orig_name: document.getElementById('closure_orig_name').value,
            closure_orig_time: document.getElementById('closure_orig_time').value,
            closure_orig_sign: document.getElementById('closure_orig_sign').value,
            closure_shop_name: document.getElementById('closure_shop_name').value,
            closure_shop_time: document.getElementById('closure_shop_time').value,
            closure_shop_sign: document.getElementById('closure_shop_sign').value,
            closure_shop_ana: getANAState('closure_shop_ana'),
            status: document.getElementById('statusPTW').value || 'Open',
        };

        ptwData.unshift(formData);
        ptwCounter++;
        save();
        addPTWToTable(formData, 0);
        // re-index existing rows
        rebuildTable();
        showSuccessMessage('✅ Permit created: ' + formData.permitNo);

        if (document.getElementById('createAnother').checked) {
            document.getElementById('ptwForm').reset();
            document.getElementById('permitNo').value = `PTW-${String(ptwCounter).padStart(3,'0')}`;
            ['general','height','hot','electrical','excavation','confined'].forEach(t => {
                const s = document.getElementById('section_'+t);
                if (s) s.classList.add('hidden');
            });
            const pc = document.getElementById('personsContainer');
            if (pc) {
                pc.innerHTML = `<div class="form-group person-row">
                    <label>Person 1</label>
                    <div class="person-input-row">
                        <input type="text" class="input-field person-input" placeholder="Enter name...">
                        <button type="button" class="person-remove-btn" onclick="removePersonRow(this)" style="display:none;">−</button>
                    </div>
                </div>`;
            }
        } else {
            closeCreateModal();
        }
    });

    document.getElementById('shareModalOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeShareModal();
    });

    startAITyping();
});

// ── SEARCH ──
function searchTable(term) {
    const rows = document.querySelectorAll('#ptwTableBody tr');
    term = term.toLowerCase();
    rows.forEach(r => { r.style.display = r.textContent.toLowerCase().includes(term) ? '' : 'none'; });
}

// ── FILTERS ──
function toggleMoreFilters() { document.getElementById('moreFiltersDropdown').classList.toggle('show'); }
function showSubmenu(id) { const el = document.getElementById(id); if(el) el.style.display='block'; }
function hideSubmenu(id) {
    const el = document.getElementById(id);
    if(el) setTimeout(() => { if(!el.matches(':hover') && !el.parentElement.matches(':hover')) el.style.display='none'; }, 100);
}
function applyMoreFilters() {
    const checked = document.querySelectorAll('.more-filters-dropdown .filter-checkbox:checked');
    const rows = document.querySelectorAll('#ptwTableBody tr');
    if (!checked.length) { rows.forEach(r => r.style.display=''); return; }
    const statusF=[], riskF=[], wtF=[];
    checked.forEach(cb => {
        const sid = cb.closest('.filter-submenu')?.id;
        if (sid==='statusSubmenu') statusF.push(cb.value.toLowerCase());
        else if (sid==='riskSubmenu') riskF.push(cb.value.toLowerCase());
        else if (sid==='workTypeSubmenu') wtF.push(cb.value.toLowerCase());
    });
    rows.forEach(r => {
        let show = true;
        if (statusF.length) show = show && statusF.includes((r.dataset.status||'').toLowerCase());
        if (riskF.length) show = show && riskF.includes((r.dataset.risk||'').toLowerCase());
        if (wtF.length) show = show && wtF.some(w => (r.dataset.worktype||'').toLowerCase().includes(w));
        r.style.display = show ? '' : 'none';
    });
}
function clearAllFilters() {
    document.querySelectorAll('.more-filters-dropdown .filter-checkbox').forEach(cb => cb.checked=false);
    applyMoreFilters();
    document.getElementById('moreFiltersDropdown').classList.remove('show');
    showSuccessMessage('Filters cleared');
}
document.addEventListener('click', function(e) {
    if (!e.target.closest('.filter-wrapper')) document.getElementById('moreFiltersDropdown').classList.remove('show');
});

// ── HEADER DROPDOWNS ──
function toggleHeaderDropdown(id) {
    const dd = document.getElementById(id);
    const wasShown = dd.classList.contains('show');
    document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
    if (!wasShown) dd.classList.add('show');
}
document.addEventListener('click', function(e) {
    if (!e.target.closest('.btn-wrapper')) document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
});
function toggleColumnSelector() { document.getElementById('columnSelectorDropdown').classList.toggle('show'); }
function toggleColumn(checkbox, idx) {
    const show = checkbox.checked;
    document.querySelectorAll(`th[data-column-index="${idx}"],td[data-column-index="${idx}"]`).forEach(el => el.style.display = show ? '' : 'none');
}

// ── BULK SELECT / DELETE ──
function toggleSelectAll(cb) {
    document.querySelectorAll('.row-checkbox').forEach(c => c.checked = cb.checked);
    updateBulkDeleteBar();
}
function updateBulkDeleteBar() {
    const checked = document.querySelectorAll('.row-checkbox:checked');
    const total = document.querySelectorAll('.row-checkbox').length;
    const bar = document.getElementById('bulkDeleteBar');
    if (checked.length) {
        document.getElementById('bulkSelectedCount').textContent = `${checked.length}/${total} selected`;
        bar.classList.add('show');
    } else {
        bar.classList.remove('show');
    }
    const sa = document.getElementById('selectAll');
    if (sa) {
        if (!checked.length) { sa.checked=false; sa.indeterminate=false; }
        else if (checked.length===total) { sa.checked=true; sa.indeterminate=false; }
        else { sa.checked=false; sa.indeterminate=true; }
    }
}
function deleteSelectedRows() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (!checkedBoxes.length) return;
    if (!confirm(`Delete ${checkedBoxes.length} selected record(s)? This cannot be undone.`)) return;
    const indices = [];
    checkedBoxes.forEach(cb => {
        const row = cb.closest('tr');
        if (row) indices.push(parseInt(row.dataset.index));
    });
    indices.sort((a,b) => b-a).forEach(i => { if(!isNaN(i)) ptwData.splice(i,1); });
    save();
    rebuildTable();
    document.getElementById('bulkDeleteBar').classList.remove('show');
    const sa = document.getElementById('selectAll');
    if(sa) { sa.checked=false; sa.indeterminate=false; }
    if (!ptwData.length) {
        document.getElementById('emptyState').style.display='block';
        document.getElementById('ptwTable').style.display='none';
    }
    showSuccessMessage(`✅ Records deleted!`);
}
function cancelBulkSelection() {
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked=false);
    document.getElementById('bulkDeleteBar').classList.remove('show');
    const sa = document.getElementById('selectAll');
    if(sa) { sa.checked=false; sa.indeterminate=false; }
}

// ── AI SEARCH ──
function toggleAISearch() {
    const c = document.getElementById('aiSearchContainer');
    const s = document.getElementById('searchSection');
    if (c.classList.contains('show')) { c.classList.remove('show'); s.style.display='block'; stopAITyping(); }
    else { c.classList.add('show'); s.style.display='none'; startAITyping(); document.getElementById('aiSearchInput').focus(); }
}
function closeAISearch() {
    document.getElementById('aiSearchContainer').classList.remove('show');
    document.getElementById('searchSection').style.display='block';
    stopAITyping();
}
function executeAISearch() { alert('AI Search coming soon!'); }
function startAITyping() {
    if (isTyping) return;
    isTyping = true;
    currentSuggestionIndex = Math.floor(Math.random() * aiSuggestions.length);
    currentCharIndex = 0;
    typeNext();
}
function typeNext() {
    const inp = document.getElementById('aiSearchInput'); if (!inp) return;
    const s = aiSuggestions[currentSuggestionIndex];
    if (currentCharIndex < s.length) {
        inp.placeholder = s.substring(0, ++currentCharIndex);
        typingInterval = setTimeout(typeNext, 50);
    } else { setTimeout(eraseNext, 2000); }
}
function eraseNext() {
    const inp = document.getElementById('aiSearchInput'); if (!inp) return;
    if (currentCharIndex > 0) {
        inp.placeholder = aiSuggestions[currentSuggestionIndex].substring(0, --currentCharIndex);
        typingInterval = setTimeout(eraseNext, 30);
    } else { currentSuggestionIndex = (currentSuggestionIndex+1) % aiSuggestions.length; setTimeout(typeNext, 500); }
}
function stopAITyping() { isTyping=false; if(typingInterval){clearTimeout(typingInterval);typingInterval=null;} }

// ── SUCCESS TOAST ──
function showSuccessMessage(msg) {
    const n = document.createElement('div');
    n.className = 'success-notification';
    n.innerHTML = `<span class="success-icon">✓</span><span class="success-text">${msg}</span>`;
    document.body.appendChild(n);
    setTimeout(() => n.classList.add('show'), 10);
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
}

// ── EXPORT ──
function exportCSV() {
    if (!ptwData.length) { alert('No data'); return; }
    const cols = ['permitNo','date','time','locationOfWork','natureOfWork','contractName','riskAssessment','workTypes','persons','status'];
    let csv = cols.join(',') + '\n';
    ptwData.forEach(d => {
        csv += [d.permitNo,d.date,d.time,d.locationOfWork,d.natureOfWork,d.contractName,d.riskAssessment,
            (d.workTypes||[]).join('|'),(d.persons||[]).join('|'),d.status
        ].map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',') + '\n';
    });
    dlFile(csv,'permit_to_work.csv','text/csv');
    showSuccessMessage('Exported to CSV');
}
function exportExcel() {
    if (!ptwData.length) { alert('No data'); return; }
    let html='<table border="1"><thead><tr><th>Permit No</th><th>Date</th><th>Location</th><th>Nature of Work</th><th>Risk</th><th>Work Types</th><th>Persons</th><th>Status</th></tr></thead><tbody>';
    ptwData.forEach(d => { html+=`<tr><td>${d.permitNo||''}</td><td>${d.date||''}</td><td>${d.locationOfWork||''}</td><td>${d.natureOfWork||''}</td><td>${d.riskAssessment||''}</td><td>${(d.workTypes||[]).join(', ')}</td><td>${(d.persons||[]).length}</td><td>${d.status||''}</td></tr>`; });
    html+='</tbody></table>';
    dlFile(html,'permit_to_work.xls','application/vnd.ms-excel');
    showSuccessMessage('Exported to Excel');
}
function exportXML() {
    if (!ptwData.length) { alert('No data'); return; }
    let xml='<?xml version="1.0" encoding="UTF-8"?>\n<Permits>\n';
    ptwData.forEach(d => {
        xml+=`  <Permit>\n    <PermitNo>${xesc(d.permitNo)}</PermitNo>\n    <Date>${xesc(d.date)}</Date>\n    <Location>${xesc(d.locationOfWork)}</Location>\n    <NatureOfWork>${xesc(d.natureOfWork)}</NatureOfWork>\n    <Status>${xesc(d.status)}</Status>\n  </Permit>\n`;
    });
    xml+='</Permits>';
    dlFile(xml,'permit_to_work.xml','text/xml');
    showSuccessMessage('Exported to XML');
}
function xesc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function dlFile(content, name, mime) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content],{type:mime}));
    a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── OTHER ──
function printList() { window.print(); }
function printDetails() { window.print(); }
function openShareModal() { document.getElementById('shareModalOverlay').classList.add('show'); }
function closeShareModal() { document.getElementById('shareModalOverlay').classList.remove('show'); }
function copyLink() { navigator.clipboard.writeText(window.location.href).then(()=>showSuccessMessage('Link copied!')); }
function sendShare() { showSuccessMessage('Shared!'); closeShareModal(); }
function viewAsChart() { alert('Chart view coming soon!'); }
function bulkChange() { alert('Bulk change coming soon!'); }
function importCSVFile() { alert('Import CSV - will be handled by backend team'); }
function giveFeedback() { alert('Thanks for your feedback!'); }
function openInGoogleSheets() { alert('Google Sheets export - coming soon!'); }
function openInExcel() { alert('Excel export - coming soon!'); }
function openDashboard() { alert('Permit to Work Dashboard - coming soon!'); }

console.log('✅ PTW  Ready!');

// ══════════════════════════════════════════
// PART 1 — FEATURE 1: OVERDUE NOTIFICATIONS
// ══════════════════════════════════════════
function checkOverduePermits() {
    const today = new Date(); today.setHours(0,0,0,0);
    const overdue = ptwData.filter(d => {
        if (d.status !== 'Open') return false;
        if (!d.date) return false;
        const parts = d.date.split('-');
        if (parts.length !== 3) return false;
        const permitDate = new Date(parts[0], parts[1]-1, parts[2]);
        return permitDate < today;
    });

    const badge = document.getElementById('notifBellBadge');
    const banner = document.getElementById('notifBanner');
    const bannerText = document.getElementById('notifBannerText');

    if (badge) {
        badge.textContent = overdue.length;
        badge.style.display = overdue.length > 0 ? 'flex' : 'none';
    }

    if (overdue.length > 0) {
        const dismissed = sessionStorage.getItem('ptw_banner_dismissed');
        if (!dismissed && banner) {
            banner.style.display = 'flex';
            bannerText.textContent = `${overdue.length} permit${overdue.length > 1 ? 's are' : ' is'} overdue and still Open — please review them.`;
        }
    }

    renderNotifDropdown(overdue);
}

function renderNotifDropdown(overdue) {
    const list = document.getElementById('notifDropdownList');
    if (!list) return;
    if (!overdue.length) {
        list.innerHTML = '<div class="notif-empty">✅ No overdue permits!</div>';
        return;
    }
    list.innerHTML = overdue.map((d, i) => {
        const idx = ptwData.indexOf(d);
        return `<div class="notif-item" onclick="openDetailPanel(${idx}); closeNotifDropdown();">
            <div class="notif-item-dot"></div>
            <div class="notif-item-text">
                <div class="notif-item-no">${escHtml(d.permitNo)} — ${escHtml(d.natureOfWork || 'No description')}</div>
                <div class="notif-item-date">📅 Due: ${d.date} · Still Open</div>
            </div>
        </div>`;
    }).join('');
}

function toggleNotifDropdown() {
    const dd = document.getElementById('notifDropdown');
    dd.classList.toggle('show');
    document.addEventListener('click', closeNotifOnOutside, { once: true });
}
function closeNotifDropdown() {
    document.getElementById('notifDropdown')?.classList.remove('show');
}
function closeNotifOnOutside(e) {
    if (!e.target.closest('#notifDropdown') && !e.target.closest('#notifBellBtn')) {
        closeNotifDropdown();
    }
}
function dismissBanner() {
    document.getElementById('notifBanner').style.display = 'none';
    sessionStorage.setItem('ptw_banner_dismissed', '1');
}

// ══════════════════════════════════════════
// PART 1 — FEATURE 2: DARK / LIGHT MODE
// ══════════════════════════════════════════
function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('ptw_theme', newTheme);
    document.getElementById('darkToggleBtn').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}
function applyStoredTheme() {
    const saved = localStorage.getItem('ptw_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('darkToggleBtn');
    if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

// ══════════════════════════════════════════
// PART 1 — FEATURE 3: GLOBAL SEARCH (Ctrl+K)
// ══════════════════════════════════════════
const GS_RECENTS_KEY = 'ptw_search_recents';
let gsActiveIndex = -1;

function openGlobalSearch() {
    document.getElementById('gSearchOverlay').classList.add('show');
    document.getElementById('gSearchModal').classList.add('show');
    const inp = document.getElementById('gSearchInput');
    inp.value = '';
    gsActiveIndex = -1;
    showGSearchRecents();
    setTimeout(() => inp.focus(), 50);
}
function closeGlobalSearch() {
    document.getElementById('gSearchOverlay').classList.remove('show');
    document.getElementById('gSearchModal').classList.remove('show');
    gsActiveIndex = -1;
}
function runGlobalSearch(query) {
    const body = document.getElementById('gSearchBody');
    gsActiveIndex = -1;
    if (!query.trim()) { showGSearchRecents(); return; }

    const q = query.toLowerCase();
    const results = ptwData.map((d, i) => ({ d, i })).filter(({ d }) =>
        (d.permitNo||'').toLowerCase().includes(q) ||
        (d.locationOfWork||'').toLowerCase().includes(q) ||
        (d.natureOfWork||'').toLowerCase().includes(q) ||
        (d.contractName||'').toLowerCase().includes(q) ||
        (d.auth_orig_name||'').toLowerCase().includes(q) ||
        (d.status||'').toLowerCase().includes(q)
    );

    if (!results.length) {
        body.innerHTML = `<div class="gsearch-no-results">😕 No permits found for "<strong>${escHtml(query)}</strong>"</div>`;
        return;
    }

    body.innerHTML = `<div class="gsearch-section-label">Permits (${results.length} found)</div>` +
        results.slice(0, 10).map(({ d, i }) => {
            const badge = d.status === 'Open'
                ? `<span class="gsearch-result-badge status-open">OPEN</span>`
                : `<span class="gsearch-result-badge status-closed">CLOSED</span>`;
            return `<div class="gsearch-result-item" data-index="${i}" onclick="gsSelectResult(${i})">
                <div class="gsearch-result-icon">📄</div>
                <div class="gsearch-result-main">
                    <div class="gsearch-result-title">${escHtml(d.permitNo)} — ${escHtml(d.natureOfWork || 'No description')}</div>
                    <div class="gsearch-result-sub">📍 ${escHtml(d.locationOfWork||'—')} · 👷 ${escHtml(d.contractName||'—')} · 📅 ${d.date||'—'}</div>
                </div>
                ${badge}
            </div>`;
        }).join('');
}

function gsSelectResult(index) {
    const query = document.getElementById('gSearchInput').value.trim();
    if (query) saveGSearchRecent(query);
    closeGlobalSearch();
    openDetailPanel(index);
}

function gSearchKeyNav(e) {
    const items = document.querySelectorAll('.gsearch-result-item');
    if (e.key === 'Escape') { closeGlobalSearch(); return; }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        gsActiveIndex = Math.min(gsActiveIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        gsActiveIndex = Math.max(gsActiveIndex - 1, 0);
    } else if (e.key === 'Enter' && gsActiveIndex >= 0) {
        e.preventDefault();
        const active = items[gsActiveIndex];
        if (active) active.click();
        return;
    }
    items.forEach((el, i) => el.classList.toggle('gs-active', i === gsActiveIndex));
    if (items[gsActiveIndex]) items[gsActiveIndex].scrollIntoView({ block: 'nearest' });
}

function showGSearchRecents() {
    const recents = JSON.parse(localStorage.getItem(GS_RECENTS_KEY) || '[]');
    const body = document.getElementById('gSearchBody');
    if (!recents.length) {
        body.innerHTML = `<div class="gsearch-no-results" style="padding:24px;">Start typing to search permits...</div>`;
        return;
    }
    body.innerHTML = `<div class="gsearch-section-label">Recent Searches</div>` +
        recents.map(r => `<div class="gsearch-recent-item" onclick="document.getElementById('gSearchInput').value='${escHtml(r)}';runGlobalSearch('${escHtml(r)}')">
            🕐 ${escHtml(r)}
        </div>`).join('');
}

function saveGSearchRecent(query) {
    let recents = JSON.parse(localStorage.getItem(GS_RECENTS_KEY) || '[]');
    recents = [query, ...recents.filter(r => r !== query)].slice(0, 5);
    localStorage.setItem(GS_RECENTS_KEY, JSON.stringify(recents));
}

// Ctrl+K shortcut
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openGlobalSearch();
    }
});

// ══════════════════════════════════════════
// PART 1 — FEATURE 4: PRINT PREVIEW & PDF
// ══════════════════════════════════════════
function openPrintModal() {
    document.getElementById('printModalOverlay').classList.add('show');
    // close any open header dropdowns
    document.querySelectorAll('.header-dropdown.show').forEach(d => d.classList.remove('show'));
}
function closePrintModal() {
    document.getElementById('printModalOverlay').classList.remove('show');
}
function executePrint() {
    const type = document.querySelector('input[name="printType"]:checked')?.value || 'list';
    closePrintModal();

    // Filter data based on selection
    let dataToPrint = ptwData;
    if (type === 'open') dataToPrint = ptwData.filter(d => d.status === 'Open');
    if (type === 'closed') dataToPrint = ptwData.filter(d => d.status === 'Closed');

    // Inject print header
    let ph = document.querySelector('.print-header');
    if (!ph) {
        ph = document.createElement('div');
        ph.className = 'print-header';
        document.querySelector('.hd-tracker').prepend(ph);
    }
    const label = type === 'open' ? 'Open Permits' : type === 'closed' ? 'Closed Permits' : 'All Permits';
    ph.innerHTML = `<h2>Permit to Work — ${label}</h2>
        <p>Printed on: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })} · Total: ${dataToPrint.length} permits</p>`;

    window.print();
}
// ── DIGITAL TIME PICKER ──
let _tpTarget = null;

function tpOpen(inputEl) {
    _tpTarget = inputEl;
    const popup = document.getElementById('tpPopup');
    const overlay = document.getElementById('tpOverlay');

    // Parse existing value
    const val = inputEl.value;
    let h = 12, m = 0, period = 'AM';
    const match = val.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
        h = parseInt(match[1]);
        m = parseInt(match[2]);
        period = match[3].toUpperCase();
    }

    document.getElementById('tpHourInput').value = String(h).padStart(2, '0');
    document.getElementById('tpMinInput').value = String(m).padStart(2, '0');
    tpSetPeriod(period, true);
    tpFocus('hour');

    // Position popup near the input
    popup.style.display = 'block';
    overlay.classList.add('show');

    const rect = inputEl.getBoundingClientRect();
    const popW = 320, popH = 210;
    let top = rect.bottom + 6;
    let left = rect.left;

    if (top + popH > window.innerHeight) top = rect.top - popH - 6;
    if (left + popW > window.innerWidth) left = window.innerWidth - popW - 12;
    if (left < 8) left = 8;

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';
    setTimeout(() => document.getElementById('tpHourInput').select(), 50);
}

function tpFocus(field) {
    document.getElementById('tpHourBox').classList.toggle('active', field === 'hour');
    document.getElementById('tpMinBox').classList.toggle('active', field === 'min');
    if (field === 'hour') document.getElementById('tpHourInput').focus();
    else document.getElementById('tpMinInput').focus();
}

function tpSetPeriod(p, silent) {
    document.getElementById('tpAM').classList.toggle('active', p === 'AM');
    document.getElementById('tpPM').classList.toggle('active', p === 'PM');
}

function tpStep(field, dir) {
    const inp = document.getElementById(field === 'hour' ? 'tpHourInput' : 'tpMinInput');
    let v = parseInt(inp.value) || 0;
    if (field === 'hour') {
        v = ((v - 1 + dir + 12) % 12) + 1;
        inp.value = String(v).padStart(2, '0');
    } else {
        v = (v + dir + 60) % 60;
        inp.value = String(v).padStart(2, '0');
    }
}

function tpValidate(field) {
    const inp = document.getElementById(field === 'hour' ? 'tpHourInput' : 'tpMinInput');
    let v = parseInt(inp.value);
    if (isNaN(v)) return;
    if (field === 'hour') { if (v < 1) v = 1; if (v > 12) v = 12; }
    else { if (v < 0) v = 0; if (v > 59) v = 59; }
    inp.value = String(v).padStart(2, '0');
}

function tpKey(e, field) {
    if (e.key === 'Tab') { e.preventDefault(); tpFocus(field === 'hour' ? 'min' : 'hour'); }
    if (e.key === 'Enter') tpOK();
    if (e.key === 'Escape') tpCancel();
    if (e.key === 'ArrowUp') { e.preventDefault(); tpStep(field, 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); tpStep(field, -1); }
}

function tpGetValue() {
    const h = document.getElementById('tpHourInput').value.padStart(2, '0');
    const m = document.getElementById('tpMinInput').value.padStart(2, '0');
    const p = document.getElementById('tpAM').classList.contains('active') ? 'AM' : 'PM';
    return `${h}:${m} ${p}`;
}

function tpOK() {
    if (_tpTarget) {
        _tpTarget.value = tpGetValue();
        _tpTarget.dispatchEvent(new Event('change'));
    }
    tpClose();
}

function tpCancel() { tpClose(); }

function tpClose() {
    document.getElementById('tpPopup').style.display = 'none';
    document.getElementById('tpOverlay').classList.remove('show');
    _tpTarget = null;
}

function tpClickOutside(e) {
    if (e.target === document.getElementById('tpOverlay')) tpClose();
}

// ── SIDE PANEL (Comments & Activity Log) ──
const SP_STORAGE_KEY = 'ptwSidePanelData';
let spCurrentPermitNo = null;

function spLoad() {
    try { return JSON.parse(localStorage.getItem(SP_STORAGE_KEY)) || {}; }
    catch(e) { return {}; }
}
function spSave(data) {
    localStorage.setItem(SP_STORAGE_KEY, JSON.stringify(data));
}
function spGetPermitData(permitNo) {
    const all = spLoad();
    if (!all[permitNo]) all[permitNo] = { comments: [], activity: [] };
    return all[permitNo];
}

function openSidePanel(index) {
    index = parseInt(index);
    if (isNaN(index) || !ptwData[index]) return;
    const d = ptwData[index];
    spCurrentPermitNo = d.permitNo;

    document.getElementById('sidePanelPermitNo').textContent = d.permitNo;
    document.getElementById('sidePanelSubtitle').textContent = (d.natureOfWork || 'Permit Details');

    switchSPTab('comments');
    renderSPComments();
    renderSPActivity();

    document.getElementById('sidePanelOverlay').classList.add('show');
    document.getElementById('sidePanel').classList.add('open');
    document.getElementById('spCommentInput').focus();
}

function closeSidePanel() {
    document.getElementById('sidePanelOverlay').classList.remove('show');
    document.getElementById('sidePanel').classList.remove('open');
    spCurrentPermitNo = null;
}

function switchSPTab(tab) {
    document.getElementById('tabComments').classList.toggle('active', tab === 'comments');
    document.getElementById('tabActivity').classList.toggle('active', tab === 'activity');
    document.getElementById('spComments').classList.toggle('hidden', tab !== 'comments');
    document.getElementById('spActivity').classList.toggle('hidden', tab !== 'activity');
}

function renderSPComments() {
    if (!spCurrentPermitNo) return;
    const data = spGetPermitData(spCurrentPermitNo);
    const list = document.getElementById('spCommentsList');
    const count = document.getElementById('commentsCount');
    count.textContent = data.comments.length;

    if (!data.comments.length) {
        list.innerHTML = '<div class="sp-empty">No comments yet. Be the first to add one!</div>';
        return;
    }
    list.innerHTML = data.comments.map((c, i) => `
        <div class="sp-comment-item">
            <div class="sp-avatar">${c.author.substring(0,2).toUpperCase()}</div>
            <div class="sp-comment-body">
                <div class="sp-comment-meta">
                    <span class="sp-comment-author">${escHtml(c.author)}</span>
                    <span class="sp-comment-time">${c.time}</span>
                    <button class="sp-comment-delete" title="Delete" onclick="deleteComment(${i})">✕</button>
                </div>
                <div class="sp-comment-text">${escHtml(c.text)}</div>
            </div>
        </div>
    `).join('');
    list.scrollTop = list.scrollHeight;
}

function submitComment() {
    if (!spCurrentPermitNo) return;
    const input = document.getElementById('spCommentInput');
    const text = input.value.trim();
    if (!text) return;

    const all = spLoad();
    if (!all[spCurrentPermitNo]) all[spCurrentPermitNo] = { comments: [], activity: [] };

    const now = new Date();
    const timeStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) + ' ' +
        now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });

    all[spCurrentPermitNo].comments.push({ author: 'You', text, time: timeStr });

    // Log to activity
    all[spCurrentPermitNo].activity.unshift({
        type: 'comment', icon: 'dot-comment',
        text: `<strong>You</strong> added a comment`,
        time: timeStr
    });

    spSave(all);
    input.value = '';
    renderSPComments();
    renderSPActivity();
    updateSPBadge(spCurrentPermitNo);
}

function deleteComment(idx) {
    if (!spCurrentPermitNo) return;
    const all = spLoad();
    if (!all[spCurrentPermitNo]) return;
    all[spCurrentPermitNo].comments.splice(idx, 1);
    spSave(all);
    renderSPComments();
    updateSPBadge(spCurrentPermitNo);
}

function renderSPActivity() {
    if (!spCurrentPermitNo) return;
    const data = spGetPermitData(spCurrentPermitNo);
    const list = document.getElementById('spActivityList');
    const count = document.getElementById('activityCount');
    count.textContent = data.activity.length;

    if (!data.activity.length) {
        list.innerHTML = '<div class="sp-empty">No activity recorded yet.</div>';
        return;
    }
    list.innerHTML = data.activity.map(a => `
        <div class="sp-activity-item">
            <div class="sp-activity-dot ${a.icon || ''}"></div>
            <div class="sp-activity-content">
                <div class="sp-activity-text">${a.text}</div>
                <div class="sp-activity-time">${a.time}</div>
            </div>
        </div>
    `).join('');
}

function logActivity(permitNo, type, text) {
    if (!permitNo) return;
    const all = spLoad();
    if (!all[permitNo]) all[permitNo] = { comments: [], activity: [] };
    const now = new Date();
    const timeStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) + ' ' +
        now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
    const iconMap = { create:'dot-create', edit:'dot-edit', status:'dot-status', comment:'dot-comment' };
    all[permitNo].activity.unshift({ type, icon: iconMap[type] || '', text, time: timeStr });
    spSave(all);
}

function updateSPBadge(permitNo) {
    const data = spGetPermitData(permitNo);
    const count = data.comments.length;
    const btns = document.querySelectorAll(`.sp-open-btn[data-permit="${permitNo}"]`);
    btns.forEach(btn => {
        btn.classList.toggle('has-comments', count > 0);
        const badge = btn.querySelector('.sp-badge');
        if (badge) badge.textContent = count > 0 ? count : '';
        if (badge) badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

// Ctrl+Enter to submit comment
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        const panel = document.getElementById('sidePanel');
        if (panel && panel.classList.contains('open')) submitComment();
    }
});
// ══════════════════════════════════════════
// SIDEBAR — Lucide icon version
// ══════════════════════════════════════════
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const collapsed = sb.classList.toggle('collapsed');
    localStorage.setItem('ptw_sidebar_collapsed', collapsed ? '1' : '0');
}

function setActivePage(page) {
    document.querySelectorAll('.sb-item, .sb-sub-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById('nav-' + page) ||
               document.querySelector(`.sb-item[onclick*="'${page}'"], .sb-sub-item[onclick*="'${page}'"]`);
    if (el) el.classList.add('active');
    localStorage.setItem('ptw_active_page', page);
    if (page !== 'ptw') {
        showSuccessMessage(`📌 ${page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g,' ')} — coming soon!`);
    }
}

function toggleSubmenu(subId, itemEl) {
    const sub = document.getElementById(subId);
    if (!sub) return;
    // If collapsed, expand sidebar first
    const sb = document.getElementById('sidebar');
    if (sb.classList.contains('collapsed')) {
        sb.classList.remove('collapsed');
        localStorage.setItem('ptw_sidebar_collapsed', '0');
    }
    const isOpen = sub.classList.toggle('open');
    itemEl.classList.toggle('sub-open', isOpen);
}

function filterSidebarMenu(query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('.sb-item, .sb-sub-item').forEach(el => {
        const label = el.querySelector('.sb-label')?.textContent.toLowerCase() || '';
        el.style.display = (!q || label.includes(q)) ? '' : 'none';
    });
    document.querySelectorAll('.sb-submenu').forEach(sub => {
        if (q) { sub.style.maxHeight = '200px'; }
        else { sub.style.maxHeight = ''; sub.classList.remove('open'); }
    });
}

function updateSidebarThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const icon = document.getElementById('sbThemeIcon');
    if (!icon) return;
    if (isDark) {
        // Sun icon
        icon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>';
    } else {
        // Moon icon
        icon.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>';
    }
}

function applyStoredSidebar() {
    const collapsed = localStorage.getItem('ptw_sidebar_collapsed') === '1';
    if (collapsed) document.getElementById('sidebar')?.classList.add('collapsed');
    updateSidebarThemeIcon();
    setTimeout(updateSidebarBadges, 150);
}

function updateSidebarBadges() {
    const openCount = ptwData.filter(d => d.status === 'Open').length;
    const badge = document.getElementById('sbPtwBadge');
    if (badge) badge.textContent = openCount > 0 ? openCount : '';
}

// Patch toggleDarkMode to update sidebar icon
const _origToggleDark = toggleDarkMode;
toggleDarkMode = function() {
    _origToggleDark();
    updateSidebarThemeIcon();
};