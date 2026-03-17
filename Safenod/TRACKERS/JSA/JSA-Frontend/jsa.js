console.log('🚀 Job Safety Analysis Tracker');

const JSA_STORAGE_KEY = 'jsaTrackerData';
const JSA_COUNTER_KEY = 'jsaTrackerCounter';

const jsaData = [];
let jsaCounter = 1;
let currentEditIndex = null;

const aiSuggestions = [
    "Show me all open JSA records",
    "Find JSA by job title",
    "Which JSAs have height work?",
    "Display all closed JSAs",
    "Show JSAs created this month",
    "Find JSAs by contractor",
    "List all JSAs with hazards",
    "Show pending JSA approvals"
];
let typingInterval = null;
let currentSuggestionIndex = 0;
let currentCharIndex = 0;
let isTyping = false;

// ── STORAGE ──
function save() {
    localStorage.setItem(JSA_STORAGE_KEY, JSON.stringify(jsaData));
    localStorage.setItem(JSA_COUNTER_KEY, String(jsaCounter));
}
function load() {
    try {
        const saved = localStorage.getItem(JSA_STORAGE_KEY);
        const savedCounter = localStorage.getItem(JSA_COUNTER_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            jsaData.length = 0;
            parsed.forEach(r => jsaData.push(r));
        }
        if (savedCounter) {
            jsaCounter = parseInt(savedCounter, 10);
        } else if (jsaData.length > 0) {
            const max = Math.max(...jsaData.map(r => {
                const m = r.jsaNo && r.jsaNo.match(/JSA-(\d+)/);
                return m ? parseInt(m[1]) : 0;
            }));
            jsaCounter = max + 1;
        }
    } catch(e) { jsaData.length = 0; jsaCounter = 1; }
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── TEAM ROWS (Create Modal) ──
function addTeamRow() {
    const container = document.getElementById('teamContainer');
    const rows = container.querySelectorAll('.team-row');
    const div = document.createElement('div');
    div.className = 'team-row';
    div.innerHTML = `
        <div class="team-row-fields">
            <div class="form-group"><label>Name</label><input type="text" class="input-field team-name" placeholder="Enter name..."></div>
            <div class="form-group">
                <label>Role</label>
                <select class="select-field team-role">
                    <option value="">-- Select Role --</option>
                    <option value="Originator/Team Member">Originator / Team Member</option>
                    <option value="Approver/Dept. Incharge">Approver / Dept. Incharge</option>
                    <option value="Safety">Safety</option>
                </select>
            </div>
        </div>
        <button type="button" class="person-remove-btn" onclick="removeTeamRow(this)">−</button>`;
    container.appendChild(div);
    updateTeamRemoveButtons();
}

function removeTeamRow(btn) {
    btn.closest('.team-row').remove();
    updateTeamRemoveButtons();
}

function updateTeamRemoveButtons() {
    const rows = document.querySelectorAll('#teamContainer .team-row');
    rows.forEach(row => {
        const btn = row.querySelector('.person-remove-btn');
        if (btn) btn.style.display = rows.length > 1 ? '' : 'none';
    });
}

function getTeamMembers() {
    const out = [];
    document.querySelectorAll('#teamContainer .team-row').forEach(row => {
        const name = row.querySelector('.team-name')?.value?.trim();
        const role = row.querySelector('.team-role')?.value?.trim();
        if (name || role) out.push({ name: name || '', role: role || '' });
    });
    return out;
}

// ── STEP ROWS (Create Modal) ──
function addStepRow() {
    const tbody = document.getElementById('stepsBody');
    const tr = document.createElement('tr');
    tr.className = 'step-row';
    tr.innerHTML = `
        <td><textarea class="step-input" placeholder="Describe job step..."></textarea></td>
        <td><textarea class="step-input" placeholder="Identify hazard/risk..."></textarea></td>
        <td><textarea class="step-input" placeholder="Enter control measures..."></textarea></td>
        <td><input type="text" class="step-input-sm" placeholder="Person responsible..."></td>
        <td><button type="button" class="step-remove-btn" onclick="removeStepRow(this)">−</button></td>`;
    tbody.appendChild(tr);
    updateStepRemoveButtons();
}

function removeStepRow(btn) {
    btn.closest('tr').remove();
    updateStepRemoveButtons();
}

function updateStepRemoveButtons() {
    const rows = document.querySelectorAll('#stepsBody .step-row');
    rows.forEach(row => {
        const btn = row.querySelector('.step-remove-btn');
        if (btn) btn.style.display = rows.length > 1 ? '' : 'none';
    });
}

function getSteps() {
    const out = [];
    document.querySelectorAll('#stepsBody .step-row').forEach(row => {
        const inputs = row.querySelectorAll('.step-input, .step-input-sm');
        const step = inputs[0]?.value?.trim();
        const hazard = inputs[1]?.value?.trim();
        const control = inputs[2]?.value?.trim();
        const resp = inputs[3]?.value?.trim();
        if (step || hazard || control || resp) out.push({ step: step||'', hazard: hazard||'', control: control||'', responsibility: resp||'' });
    });
    return out;
}

// ── DETAIL TEAM ROWS ──
function addDetailTeamRow() {
    const container = document.getElementById('detailTeamContainer');
    const div = document.createElement('div');
    div.className = 'team-row';
    div.innerHTML = `
        <div class="team-row-fields">
            <div class="form-group"><label>Name</label><input type="text" class="input-field d-team-name" placeholder="Enter name..."></div>
            <div class="form-group">
                <label>Role</label>
                <select class="select-field d-team-role">
                    <option value="">-- Select Role --</option>
                    <option value="Originator/Team Member">Originator / Team Member</option>
                    <option value="Approver/Dept. Incharge">Approver / Dept. Incharge</option>
                    <option value="Safety">Safety</option>
                </select>
            </div>
        </div>
        <button type="button" class="person-remove-btn" onclick="removeDetailTeamRow(this)">−</button>`;
    container.appendChild(div);
    updateDetailTeamButtons();
}

function removeDetailTeamRow(btn) {
    btn.closest('.team-row').remove();
    updateDetailTeamButtons();
}

function updateDetailTeamButtons() {
    const rows = document.querySelectorAll('#detailTeamContainer .team-row');
    rows.forEach(row => {
        const btn = row.querySelector('.person-remove-btn');
        if (btn) btn.style.display = rows.length > 1 ? '' : 'none';
    });
}

function getDetailTeamMembers() {
    const out = [];
    document.querySelectorAll('#detailTeamContainer .team-row').forEach(row => {
        const name = row.querySelector('.d-team-name')?.value?.trim();
        const role = row.querySelector('.d-team-role')?.value?.trim();
        if (name || role) out.push({ name: name || '', role: role || '' });
    });
    return out;
}

// ── DETAIL STEP ROWS ──
function addDetailStepRow() {
    const tbody = document.getElementById('detailStepsBody');
    const tr = document.createElement('tr');
    tr.className = 'step-row';
    tr.innerHTML = `
        <td><textarea class="step-input" placeholder="Describe job step..."></textarea></td>
        <td><textarea class="step-input" placeholder="Identify hazard/risk..."></textarea></td>
        <td><textarea class="step-input" placeholder="Enter control measures..."></textarea></td>
        <td><input type="text" class="step-input-sm" placeholder="Person responsible..."></td>
        <td><button type="button" class="step-remove-btn" onclick="removeDetailStepRow(this)">−</button></td>`;
    tbody.appendChild(tr);
    updateDetailStepButtons();
}

function removeDetailStepRow(btn) {
    btn.closest('tr').remove();
    updateDetailStepButtons();
}

function updateDetailStepButtons() {
    const rows = document.querySelectorAll('#detailStepsBody .step-row');
    rows.forEach(row => {
        const btn = row.querySelector('.step-remove-btn');
        if (btn) btn.style.display = rows.length > 1 ? '' : 'none';
    });
}

function getDetailSteps() {
    const out = [];
    document.querySelectorAll('#detailStepsBody .step-row').forEach(row => {
        const inputs = row.querySelectorAll('.step-input, .step-input-sm');
        const step = inputs[0]?.value?.trim();
        const hazard = inputs[1]?.value?.trim();
        const control = inputs[2]?.value?.trim();
        const resp = inputs[3]?.value?.trim();
        if (step || hazard || control || resp) out.push({ step: step||'', hazard: hazard||'', control: control||'', responsibility: resp||'' });
    });
    return out;
}

// ── STATUS COUNTERS ──
function updateStatusCounters() {
    document.getElementById('totalCount').textContent = jsaData.length;
    document.getElementById('openCount').textContent = jsaData.filter(d => d.status === 'Open').length;
    document.getElementById('closedCount').textContent = jsaData.filter(d => d.status === 'Closed').length;
}

// ── BUILD TABLE ROW ──
function buildRowHTML(d, index) {
    const status = d.status || 'Open';
    const statusBadge = status === 'Open'
        ? `<span class="badge status-open">OPEN</span>`
        : `<span class="badge status-closed">CLOSED</span>`;
    const teamNames = (d.team || []).map(t => t.name).filter(Boolean).join(', ') || '—';
    const stepsCount = (d.steps || []).length;

    return `
        <td class="sticky-col sticky-col-0"><input type="checkbox" class="row-checkbox" onchange="updateBulkDeleteBar()"></td>
        <td class="sticky-col sticky-col-1"><a href="javascript:void(0)" class="task-id" onclick="openDetailPanel(${index})">${d.jsaNo}</a></td>
        <td class="sticky-col sticky-col-2">${d.date || '—'}</td>
        <td class="sticky-col sticky-col-3">${escHtml(d.plant||'—')}</td>
        <td data-column-index="4">${escHtml(d.jobTitle||'—')}</td>
        <td data-column-index="5">${escHtml(d.jobLocation||'—')}</td>
        <td data-column-index="6">${escHtml(d.performedBy||'—')}</td>
        <td data-column-index="7">${escHtml(d.orderNo||'—')}</td>
        <td data-column-index="8"><div class="persons-list">${escHtml(teamNames)}</div></td>
        <td data-column-index="9">${escHtml(d.genName||'—')}${d.genCompany ? '<br><small style="color:#5e6c84">'+escHtml(d.genCompany)+'</small>' : ''}</td>
        <td data-column-index="10">${escHtml(d.valName||'—')}${d.valSafety ? '<br><small style="color:#5e6c84">'+escHtml(d.valSafety)+'</small>' : ''}</td>
        <td data-column-index="11">${stepsCount > 0 ? `<span class="badge badge-risk">${stepsCount} step${stepsCount>1?'s':''}</span>` : '—'}</td>
        <td data-column-index="12">${escHtml(d.contractorSign||'—')}</td>
        <td data-column-index="13">${d.alVerification ? escHtml(d.alVerification).substring(0,40)+(d.alVerification.length>40?'...':'') : '—'}</td>
        <td data-column-index="14">${escHtml(d.alSign||'—')}</td>
        <td data-column-index="15">${d.alSafetyComments ? escHtml(d.alSafetyComments).substring(0,40)+(d.alSafetyComments.length>40?'...':'') : '—'}</td>
        <td data-column-index="16">
            <div class="status-cell">
                <select class="inline-dropdown status-dropdown-inline" onchange="updateInlineField(${index},'status',this.value)">
                    <option value="Open" ${status==='Open'?'selected':''}>Open</option>
                    <option value="Closed" ${status==='Closed'?'selected':''}>Closed</option>
                </select>
            </div>
        </td>`;
}

// ── ADD ROW TO TABLE ──
function addJSAToTable(d, index) {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('jsaTable').style.display = 'table';
    const tbody = document.getElementById('jsaTableBody');
    const row = document.createElement('tr');
    row.setAttribute('data-index', index);
    row.setAttribute('data-status', d.status || 'Open');
    row.innerHTML = buildRowHTML(d, index);
    tbody.insertBefore(row, tbody.firstChild);
}

// ── INLINE EDIT ──
function updateInlineField(index, field, value) {
    if (!jsaData[index]) return;
    jsaData[index][field] = value.trim();
    save();
    if (field === 'status') {
        updateStatusCounters();
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
}

// ── REBUILD TABLE ──
function rebuildTable() {
    document.getElementById('jsaTableBody').innerHTML = '';
    jsaData.forEach((d, i) => addJSAToTable(d, i));
    updateStatusCounters();
}

// ── DETAIL PANEL ──
function openDetailPanel(index) {
    index = parseInt(index);
    if (isNaN(index) || !jsaData[index]) return;
    const d = jsaData[index];
    currentEditIndex = index;

    document.getElementById('detailPanelTitle').textContent = d.jsaNo;
    document.getElementById('detailJsaNo').value = d.jsaNo || '';
    document.getElementById('detailPlant').value = d.plant || '';
    document.getElementById('detailJobTitle').value = d.jobTitle || '';
    document.getElementById('detailJobLocation').value = d.jobLocation || '';
    document.getElementById('detailPerformedBy').value = d.performedBy || '';
    document.getElementById('detailOrderNo').value = d.orderNo || '';
    document.getElementById('detailDate').value = d.date || '';

    // Team members
    const teamContainer = document.getElementById('detailTeamContainer');
    teamContainer.innerHTML = '';
    const teamList = (d.team && d.team.length) ? d.team : [{ name: '', role: '' }];
    teamList.forEach(t => {
        const div = document.createElement('div');
        div.className = 'team-row';
        div.innerHTML = `
            <div class="team-row-fields">
                <div class="form-group"><label>Name</label><input type="text" class="input-field d-team-name" value="${escHtml(t.name||'')}" placeholder="Enter name..."></div>
                <div class="form-group">
                    <label>Role</label>
                    <select class="select-field d-team-role">
                        <option value="">-- Select Role --</option>
                        <option value="Originator/Team Member" ${t.role==='Originator/Team Member'?'selected':''}>Originator / Team Member</option>
                        <option value="Approver/Dept. Incharge" ${t.role==='Approver/Dept. Incharge'?'selected':''}>Approver / Dept. Incharge</option>
                        <option value="Safety" ${t.role==='Safety'?'selected':''}>Safety</option>
                    </select>
                </div>
            </div>
            <button type="button" class="person-remove-btn" onclick="removeDetailTeamRow(this)" style="display:none;">−</button>`;
        teamContainer.appendChild(div);
    });
    updateDetailTeamButtons();

    document.getElementById('detailGenName').value = d.genName || '';
    document.getElementById('detailGenCompany').value = d.genCompany || '';
    document.getElementById('detailValName').value = d.valName || '';
    document.getElementById('detailValSafety').value = d.valSafety || '';

    // Steps
    const stepsBody = document.getElementById('detailStepsBody');
    stepsBody.innerHTML = '';
    const stepList = (d.steps && d.steps.length) ? d.steps : [{ step:'', hazard:'', control:'', responsibility:'' }];
    stepList.forEach(s => {
        const tr = document.createElement('tr');
        tr.className = 'step-row';
        tr.innerHTML = `
            <td><textarea class="step-input" placeholder="Describe job step...">${escHtml(s.step||'')}</textarea></td>
            <td><textarea class="step-input" placeholder="Identify hazard/risk...">${escHtml(s.hazard||'')}</textarea></td>
            <td><textarea class="step-input" placeholder="Enter control measures...">${escHtml(s.control||'')}</textarea></td>
            <td><input type="text" class="step-input-sm" value="${escHtml(s.responsibility||'')}" placeholder="Person responsible..."></td>
            <td><button type="button" class="step-remove-btn" onclick="removeDetailStepRow(this)" style="display:none;">−</button></td>`;
        stepsBody.appendChild(tr);
    });
    updateDetailStepButtons();

    document.getElementById('detailContractorSign').value = d.contractorSign || '';
    document.getElementById('detailAlVerification').value = d.alVerification || '';
    document.getElementById('detailAlSign').value = d.alSign || '';
    document.getElementById('detailAlSafetyComments').value = d.alSafetyComments || '';
    document.getElementById('detailStatus').value = d.status || 'Open';

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
    const prev = jsaData[currentEditIndex];
    jsaData[currentEditIndex] = {
        ...prev,
        plant: document.getElementById('detailPlant').value,
        jobTitle: document.getElementById('detailJobTitle').value,
        jobLocation: document.getElementById('detailJobLocation').value,
        performedBy: document.getElementById('detailPerformedBy').value,
        orderNo: document.getElementById('detailOrderNo').value,
        date: document.getElementById('detailDate').value,
        team: getDetailTeamMembers(),
        genName: document.getElementById('detailGenName').value,
        genCompany: document.getElementById('detailGenCompany').value,
        valName: document.getElementById('detailValName').value,
        valSafety: document.getElementById('detailValSafety').value,
        steps: getDetailSteps(),
        contractorSign: document.getElementById('detailContractorSign').value,
        alVerification: document.getElementById('detailAlVerification').value,
        alSign: document.getElementById('detailAlSign').value,
        alSafetyComments: document.getElementById('detailAlSafetyComments').value,
        status: document.getElementById('detailStatus').value,
    };
    save();
    rebuildTable();
    showSuccessMessage('✅ JSA updated: ' + jsaData[currentEditIndex].jsaNo);
    closeDetailPanel();
}

function deleteCurrentJSA() {
    if (currentEditIndex === null) return;
    const rec = jsaData[currentEditIndex];
    if (!confirm(`Delete ${rec.jsaNo}? This cannot be undone.`)) return;
    jsaData.splice(currentEditIndex, 1);
    save();
    rebuildTable();
    if (!jsaData.length) {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('jsaTable').style.display = 'none';
    }
    showSuccessMessage('✅ JSA deleted!');
    closeDetailPanel();
}

// ── MODAL ──
function openCreateModal() {
    document.getElementById('createModalOverlay').classList.add('active');
    document.getElementById('jsaNo').value = `JSA-${String(jsaCounter).padStart(3,'0')}`;
}

function closeCreateModal() {
    document.getElementById('createModalOverlay').classList.remove('active');
    document.getElementById('jsaForm').reset();
    document.getElementById('jsaNo').value = `JSA-${String(jsaCounter).padStart(3,'0')}`;
    // Reset team to 1 row
    const tc = document.getElementById('teamContainer');
    if (tc) {
        tc.innerHTML = `<div class="team-row">
            <div class="team-row-fields">
                <div class="form-group"><label>Name</label><input type="text" class="input-field team-name" placeholder="Enter name..."></div>
                <div class="form-group">
                    <label>Role</label>
                    <select class="select-field team-role">
                        <option value="">-- Select Role --</option>
                        <option value="Originator/Team Member">Originator / Team Member</option>
                        <option value="Approver/Dept. Incharge">Approver / Dept. Incharge</option>
                        <option value="Safety">Safety</option>
                    </select>
                </div>
            </div>
            <button type="button" class="person-remove-btn" onclick="removeTeamRow(this)" style="display:none;">−</button>
        </div>`;
    }
    // Reset steps to 1 row
    const sb = document.getElementById('stepsBody');
    if (sb) {
        sb.innerHTML = `<tr class="step-row">
            <td><textarea class="step-input" placeholder="Describe job step..."></textarea></td>
            <td><textarea class="step-input" placeholder="Identify hazard/risk..."></textarea></td>
            <td><textarea class="step-input" placeholder="Enter control measures..."></textarea></td>
            <td><input type="text" class="step-input-sm" placeholder="Person responsible..."></td>
            <td><button type="button" class="step-remove-btn" onclick="removeStepRow(this)" style="display:none;">−</button></td>
        </tr>`;
    }
}

function toggleFullscreen() { document.getElementById('createModal').classList.toggle('fullscreen'); }

// ── FORM SUBMIT ──
document.addEventListener('DOMContentLoaded', function() {
    load();
    if (jsaData.length > 0) {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('jsaTable').style.display = 'table';
        for (let i = jsaData.length - 1; i >= 0; i--) addJSAToTable(jsaData[i], i);
        updateStatusCounters();
    }

    document.getElementById('jsaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            jsaNo: document.getElementById('jsaNo').value,
            plant: document.getElementById('plant').value,
            jobTitle: document.getElementById('jobTitle').value,
            jobLocation: document.getElementById('jobLocation').value,
            performedBy: document.getElementById('performedBy').value,
            orderNo: document.getElementById('orderNo').value,
            date: document.getElementById('jsaDate').value,
            team: getTeamMembers(),
            genName: document.getElementById('genName').value,
            genCompany: document.getElementById('genCompany').value,
            valName: document.getElementById('valName').value,
            valSafety: document.getElementById('valSafety').value,
            steps: getSteps(),
            contractorSign: document.getElementById('contractorSign').value,
            alVerification: document.getElementById('alVerification').value,
            alSign: document.getElementById('alSign').value,
            alSafetyComments: document.getElementById('alSafetyComments').value,
            status: document.getElementById('statusJSA').value || 'Open',
        };

        jsaData.unshift(formData);
        jsaCounter++;
        save();
        rebuildTable();
        showSuccessMessage('✅ JSA created: ' + formData.jsaNo);

        if (document.getElementById('createAnother').checked) {
            document.getElementById('jsaForm').reset();
            document.getElementById('jsaNo').value = `JSA-${String(jsaCounter).padStart(3,'0')}`;
            // Reset team & steps
            closeCreateModal();
            openCreateModal();
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
    const rows = document.querySelectorAll('#jsaTableBody tr');
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
    const rows = document.querySelectorAll('#jsaTableBody tr');
    if (!checked.length) { rows.forEach(r => r.style.display=''); return; }
    const statusF = [];
    checked.forEach(cb => {
        const sid = cb.closest('.filter-submenu')?.id;
        if (sid==='statusSubmenu') statusF.push(cb.value.toLowerCase());
    });
    rows.forEach(r => {
        let show = true;
        if (statusF.length) show = show && statusF.includes((r.dataset.status||'').toLowerCase());
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
    indices.sort((a,b) => b-a).forEach(i => { if(!isNaN(i)) jsaData.splice(i,1); });
    save();
    rebuildTable();
    document.getElementById('bulkDeleteBar').classList.remove('show');
    const sa = document.getElementById('selectAll');
    if(sa) { sa.checked=false; sa.indeterminate=false; }
    if (!jsaData.length) {
        document.getElementById('emptyState').style.display='block';
        document.getElementById('jsaTable').style.display='none';
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
    if (!jsaData.length) { alert('No data'); return; }
    const cols = ['jsaNo','date','plant','jobTitle','jobLocation','performedBy','orderNo','genName','valName','status'];
    let csv = cols.join(',') + '\n';
    jsaData.forEach(d => {
        csv += [d.jsaNo,d.date,d.plant,d.jobTitle,d.jobLocation,d.performedBy,d.orderNo,d.genName,d.valName,d.status
        ].map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',') + '\n';
    });
    dlFile(csv,'job_safety_analysis.csv','text/csv');
    showSuccessMessage('Exported to CSV');
}
function exportExcel() {
    if (!jsaData.length) { alert('No data'); return; }
    let html='<table border="1"><thead><tr><th>JSA No</th><th>Date</th><th>Plant</th><th>Job Title</th><th>Job Location</th><th>Performed By</th><th>Steps</th><th>Status</th></tr></thead><tbody>';
    jsaData.forEach(d => { html+=`<tr><td>${d.jsaNo||''}</td><td>${d.date||''}</td><td>${d.plant||''}</td><td>${d.jobTitle||''}</td><td>${d.jobLocation||''}</td><td>${d.performedBy||''}</td><td>${(d.steps||[]).length}</td><td>${d.status||''}</td></tr>`; });
    html+='</tbody></table>';
    dlFile(html,'job_safety_analysis.xls','application/vnd.ms-excel');
    showSuccessMessage('Exported to Excel');
}
function exportXML() {
    if (!jsaData.length) { alert('No data'); return; }
    let xml='<?xml version="1.0" encoding="UTF-8"?>\n<JSARecords>\n';
    jsaData.forEach(d => {
        xml+=`  <JSA>\n    <JSANo>${xesc(d.jsaNo)}</JSANo>\n    <Date>${xesc(d.date)}</Date>\n    <JobTitle>${xesc(d.jobTitle)}</JobTitle>\n    <Plant>${xesc(d.plant)}</Plant>\n    <Status>${xesc(d.status)}</Status>\n  </JSA>\n`;
    });
    xml+='</JSARecords>';
    dlFile(xml,'job_safety_analysis.xml','text/xml');
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
function openDashboard() { alert('JSA Dashboard - coming soon!'); }

console.log('✅ JSA Tracker Ready!');

// ── DIGITAL TIME PICKER ──
let _tpTarget = null;

function tpOpen(inputEl) {
    _tpTarget = inputEl;
    const popup = document.getElementById('tpPopup');
    const overlay = document.getElementById('tpOverlay');
    const val = inputEl.value;
    let h = 12, m = 0, period = 'AM';
    const match = val.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) { h = parseInt(match[1]); m = parseInt(match[2]); period = match[3].toUpperCase(); }
    document.getElementById('tpHourInput').value = String(h).padStart(2, '0');
    document.getElementById('tpMinInput').value = String(m).padStart(2, '0');
    tpSetPeriod(period, true);
    tpFocus('hour');
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
    if (field === 'hour') { v = ((v - 1 + dir + 12) % 12) + 1; inp.value = String(v).padStart(2, '0'); }
    else { v = (v + dir + 60) % 60; inp.value = String(v).padStart(2, '0'); }
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
    if (_tpTarget) { _tpTarget.value = tpGetValue(); _tpTarget.dispatchEvent(new Event('change')); }
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