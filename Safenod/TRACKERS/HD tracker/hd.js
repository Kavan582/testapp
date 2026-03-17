console.log('🚀 Horizontal Deployment Tracker System');

// ======================
// LOCALSTORAGE KEYS
// ======================

const HD_STORAGE_KEY = 'hdTrackerData';
const HD_COUNTER_KEY = 'hdTrackerCounter';

// ======================
// LOCALSTORAGE PERSISTENCE
// ======================

function saveHDToLocalStorage() {
    try {
        localStorage.setItem(HD_STORAGE_KEY, JSON.stringify(hdData));
        localStorage.setItem(HD_COUNTER_KEY, String(hdCounter));
        console.log('💾 Saved to localStorage:', hdData.length, 'HD records');
    } catch (e) {
        console.error('❌ Failed to save to localStorage:', e);
    }
}

function loadHDFromLocalStorage() {
    try {
        const saved = localStorage.getItem(HD_STORAGE_KEY);
        const savedCounter = localStorage.getItem(HD_COUNTER_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);
            hdData.length = 0;
            parsed.forEach(record => {
                if (!record.hdApplicability) record.hdApplicability = 'No';
                if (record.actionPlanYN === undefined) {
                    const hasAction = record.actionDetails && record.actionDetails.trim() !== '' && record.actionDetails !== 'N/A';
                    record.actionPlanYN = hasAction ? 'Yes' : '';
                }
                hdData.push(record);
            });
            console.log('📂 Loaded from localStorage:', hdData.length, 'HD records');
        }

        if (savedCounter) {
            hdCounter = parseInt(savedCounter, 10);
        } else if (hdData.length > 0) {
            const maxId = Math.max(...hdData.map(hd => {
                const match = hd.hdId && hd.hdId.match(/HD-(\d+)/);
                return match ? parseInt(match[1]) : 0;
            }));
            hdCounter = maxId + 1;
        }
    } catch (e) {
        console.error('❌ Failed to load from localStorage:', e);
        hdData.length = 0;
        hdCounter = 1;
    }
}

// HD data array
const hdData = [];

// HD counter for new items
let hdCounter = 1;

// Current editing index
let currentEditIndex = null;

// AI Search Suggestions
const aiSuggestions = [
    "Show me all open horizontal deployments",
    "Find HD items for Alwar plant",
    "Which deployments need action plan?",
    "Display all closed HD items",
    "Show HDs approved for shop floor",
    "Find HDs with Yes applicability",
    "List all Bhandara deployments",
    "Show overdue target dates"
];

let typingInterval = null;
let currentSuggestionIndex = 0;
let currentCharIndex = 0;
let isTyping = false;

// ======================
// HD APPLICABILITY TOGGLE - CREATE MODAL
// ======================

function toggleFieldsBasedOnApplicability() {
    const applicability = document.getElementById('hdApplicability').value;
    const isYes = applicability === 'Yes';

    const fieldsToToggle = ['similarActivity', 'existingControls', 'actionPlanDropdown', 'tdc', 'statusHd'];

    fieldsToToggle.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = !isYes;
            if (!isYes) {
                if (field.tagName === 'TEXTAREA' || field.type === 'text') {
                    if (!field.value || field.value.trim() === '') field.value = 'N/A';
                }
            }
        }
    });

    // Also hide/reset action plan text if disabling
    if (!isYes) {
        document.getElementById('actionPlanTextSection').classList.add('hidden');
        const actionDetails = document.getElementById('actionDetails');
        if (actionDetails) actionDetails.value = '';
    }
}

// ======================
// HD APPLICABILITY TOGGLE - DETAIL PANEL
// ======================

function toggleDetailFieldsBasedOnApplicability() {
    const applicability = document.getElementById('detailHdApplicability').value;
    const isYes = applicability === 'Yes';

    const fieldsToToggle = ['detailSimilarActivity', 'detailExistingControls', 'detailActionPlanDropdown', 'detailTdc', 'detailStatusHd'];

    fieldsToToggle.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = !isYes;
            if (!isYes) {
                field.classList.add('detail-readonly');
                if (field.tagName === 'TEXTAREA' || field.type === 'text') {
                    if (!field.value || field.value.trim() === '') field.value = 'N/A';
                }
            } else {
                field.classList.remove('detail-readonly');
            }
        }
    });

    if (!isYes) {
        document.getElementById('detailActionPlanTextSection').classList.add('hidden');
    }
}

// ======================
// ACTION PLAN CONDITIONAL FIELD - CREATE MODAL
// ======================

function toggleActionPlanField() {
    const dropdown = document.getElementById('actionPlanDropdown');
    const textSection = document.getElementById('actionPlanTextSection');
    const field = document.getElementById('actionDetails');
    if (dropdown.value === 'Yes') {
        textSection.classList.remove('hidden');
        field.required = true;
        field.addEventListener('input', () => clearFieldError(field));
    } else {
        textSection.classList.add('hidden');
        if (field) { field.value = ''; field.required = false; clearFieldError(field); }
    }
}

// ======================
// ACTION PLAN CONDITIONAL FIELD - DETAIL PANEL
// ======================

function toggleDetailActionPlanField() {
    const dropdown = document.getElementById('detailActionPlanDropdown');
    const textSection = document.getElementById('detailActionPlanTextSection');
    const field = document.getElementById('detailActionDetails');
    if (dropdown.value === 'Yes') {
        textSection.classList.remove('hidden');
        if (field) field.addEventListener('input', () => clearFieldError(field));
    } else {
        textSection.classList.add('hidden');
        if (field) { field.value = ''; clearFieldError(field); }
    }
}

// ======================
// VALIDATION HELPERS
// ======================

function showFieldError(field, message) {
    field.classList.add('field-error');
    let existing = field.parentElement.querySelector('.error-message');
    if (!existing) {
        const err = document.createElement('div');
        err.className = 'error-message';
        err.textContent = message;
        field.parentElement.appendChild(err);
    }
}

function clearFieldError(field) {
    field.classList.remove('field-error');
    const err = field.parentElement.querySelector('.error-message');
    if (err) err.remove();
}

// ======================
// STATUS COUNTER UPDATE
// ======================

function updateStatusCounters() {
    const totalCount = hdData.length;
    const openCount = hdData.filter(item => item.statusHd === 'Open').length;
    const closedCount = hdData.filter(item => item.statusHd === 'Closed').length;

    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('openCount').textContent = openCount;
    document.getElementById('closedCount').textContent = closedCount;
}

// ======================
// MODAL FUNCTIONS
// ======================

function openCreateModal() {
    document.getElementById('createModalOverlay').classList.add('active');
    document.getElementById('hdId').value = `HD-${String(hdCounter).padStart(3, '0')}`;
    // capaId stays blank (auto-linked from CAPA tracker)
    document.getElementById('hdApplicability').value = 'No';
    toggleFieldsBasedOnApplicability();
}

function closeCreateModal() {
    document.getElementById('createModalOverlay').classList.remove('active');
    document.getElementById('hdForm').reset();
    document.getElementById('hdId').value = `HD-${String(hdCounter).padStart(3, '0')}`;
    document.getElementById('hdApplicability').value = 'No';
    toggleFieldsBasedOnApplicability();
    document.getElementById('actionPlanTextSection').classList.add('hidden');
}

function toggleFullscreen() {
    document.getElementById('createModal').classList.toggle('fullscreen');
}

// ======================
// FORM SUBMISSION
// ======================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Loaded - Initializing HD Tracker...');

    loadHDFromLocalStorage();

    if (hdData.length > 0) {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('hdTable').style.display = 'table';
        for (let i = hdData.length - 1; i >= 0; i--) {
            addHDToTable(hdData[i], i);
        }
        updateStatusCounters();
    }

    const hdForm = document.getElementById('hdForm');
    if (hdForm) {
        hdForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Validation
            let hasError = false;
            const actionDropdown = document.getElementById('actionPlanDropdown');
            const actionField = document.getElementById('actionDetails');
            if (actionDropdown.value === 'Yes' && !actionField.value.trim()) {
                showFieldError(actionField, 'Please describe the action plan');
                hasError = true;
            }
            if (hasError) {
                const firstError = document.querySelector('#createModal .field-error');
                if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            const formData = {
                hdId: document.getElementById('hdId').value,
                capaId: document.getElementById('capaId').value || '',
                plant: document.getElementById('plant').value,
                date: document.getElementById('date').value,
                areaLocation: document.getElementById('areaLocation').value,
                hdApplicability: document.getElementById('hdApplicability').value || 'No',
                similarActivity: document.getElementById('similarActivity').value,
                existingControls: document.getElementById('existingControls').value,
                actionPlanYN: document.getElementById('actionPlanDropdown').value,
                actionDetails: document.getElementById('actionDetails').value,
                tdc: document.getElementById('tdc').value,
                statusHd: document.getElementById('statusHd').value || 'Open',
                approvalShop: document.getElementById('approvalShop').value,
            };

            hdData.unshift(formData);
            saveHDToLocalStorage();
            addHDToTable(formData, 0);
            updateStatusCounters();

            if (formData.approvalShop === 'Yes') {
                createShopFloorRecords(formData);
            } else {
                showSuccessMessage('✅ HD created: ' + formData.hdId);
            }

            hdCounter++;
            saveHDToLocalStorage();

            if (document.getElementById('createAnother').checked) {
                document.getElementById('hdForm').reset();
                document.getElementById('hdId').value = `HD-${String(hdCounter).padStart(3, '0')}`;
                document.getElementById('hdApplicability').value = 'No';
                toggleFieldsBasedOnApplicability();
                document.getElementById('actionPlanTextSection').classList.add('hidden');
            } else {
                closeCreateModal();
            }
        });
    }

    startAITyping();
});

// ======================
// DROPDOWN BADGE COLORS
// ======================

function setDropdownBadgeColor(dropdown) {
    if (!dropdown) return;
    dropdown.classList.remove('badge-style', 'badge-open', 'badge-closed', 'badge-yes', 'badge-no');
    const value = dropdown.value;
    const onchangeAttr = dropdown.getAttribute('onchange') || '';
    if (onchangeAttr.includes('updateHDApplicability')) return;
    if (onchangeAttr.includes('statusHd') && value) {
        dropdown.classList.add('badge-style');
        if (value === 'Open') dropdown.classList.add('badge-open');
        else if (value === 'Closed') dropdown.classList.add('badge-closed');
    }
}

// ======================
// BUILD TABLE ROW HTML
// ======================

function buildRowHTML(formData, index) {
    const hdApplicability = formData.hdApplicability || 'No';
    const isDisabled = hdApplicability !== 'Yes';
    const v = (val) => (val && String(val).trim() !== '') ? val : 'N/A';

    return `
        <td class="sticky-col sticky-col-0"><input type="checkbox" class="row-checkbox" onchange="updateBulkDeleteBar()"></td>
        <td class="sticky-col sticky-col-1"><a href="javascript:void(0);" class="task-id" onclick="openDetailPanel(${index})">${formData.hdId}</a></td>
        <td class="sticky-col sticky-col-2">${formData.capaId
            ? `<a href="javascript:void(0);" class="task-id" onclick="openCapaDetailPanel('${formData.capaId}')">${formData.capaId}</a>`
            : '<span style="color:#5e6c84">N/A</span>'
        }</td>
        <td class="sticky-col sticky-col-3">${formData.plant}</td>
        <td data-column-index="4">${formData.date || 'N/A'}</td>
        <td data-column-index="5">
            <input type="text" class="inline-input" placeholder="Enter area / location"
                value="${formData.areaLocation || ''}"
                onblur="updateInlineField(${index}, 'areaLocation', this.value)">
        </td>
        <td data-column-index="6">
            <select class="inline-dropdown" onchange="updateHDApplicability(${index}, this.value)">
                <option value="Yes" ${hdApplicability === 'Yes' ? 'selected' : ''}>Yes</option>
                <option value="No" ${hdApplicability === 'No' ? 'selected' : ''}>No</option>
            </select>
        </td>
        <td data-column-index="7">
            <textarea class="inline-textarea" rows="1" placeholder="Similar activity done..."
                onblur="updateInlineField(${index}, 'similarActivity', this.value)"
                oninput="autoGrowTextarea(this)"
                ${isDisabled ? 'disabled' : ''}>${v(formData.similarActivity)}</textarea>
        </td>
        <td data-column-index="8">
            <textarea class="inline-textarea" rows="1" placeholder="Existing control measure..."
                onblur="updateInlineField(${index}, 'existingControls', this.value)"
                oninput="autoGrowTextarea(this)"
                ${isDisabled ? 'disabled' : ''}>${v(formData.existingControls)}</textarea>
        </td>
        <td data-column-index="9">
            <div class="inline-cell-wrap">
                <select class="inline-yesno" onchange="toggleInlineActionPlan(this, ${index})" ${isDisabled ? 'disabled' : ''}>
                    <option value="">-- Select --</option>
                    <option value="No" ${formData.actionPlanYN === 'No' ? 'selected' : ''}>No</option>
                    <option value="Yes" ${formData.actionPlanYN === 'Yes' ? 'selected' : ''}>Yes</option>
                </select>
                ${formData.actionPlanYN === 'Yes' ? `<textarea class="inline-textarea" rows="1"
                    placeholder="If yes, then what..."
                    onblur="updateInlineField(${index}, 'actionDetails', this.value)"
                    oninput="autoGrowTextarea(this)"
                    ${isDisabled ? 'disabled' : ''}>${formData.actionDetails && formData.actionDetails !== 'N/A' ? formData.actionDetails : ''}</textarea>` : ''}
            </div>
        </td>
        <td data-column-index="10">
            <input type="date" class="inline-input"
                value="${formData.tdc || ''}"
                onchange="updateInlineField(${index}, 'tdc', this.value)"
                ${isDisabled ? 'disabled' : ''}>
        </td>
        <td data-column-index="11">
            <select class="inline-dropdown" onchange="updateInlineField(${index}, 'statusHd', this.value)" ${isDisabled ? 'disabled' : ''}>
                <option value="Open" ${formData.statusHd === 'Open' ? 'selected' : ''}>Open</option>
                <option value="Closed" ${formData.statusHd === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
        </td>
        <td data-column-index="12">
            <select class="inline-yesno" onchange="updateInlineField(${index}, 'approvalShop', this.value)">
                <option value="" ${!formData.approvalShop ? 'selected' : ''}>-- Select --</option>
                <option value="Yes" ${formData.approvalShop === 'Yes' ? 'selected' : ''}>Yes</option>
                <option value="No" ${formData.approvalShop === 'No' ? 'selected' : ''}>No</option>
            </select>
        </td>
    `;
}

// ======================
// ADD HD TO TABLE
// ======================

function addHDToTable(formData, index) {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('hdTable').style.display = 'table';

    const tbody = document.getElementById('hdTableBody');
    const newRow = document.createElement('tr');

    newRow.setAttribute('data-plant', formData.plant);
    newRow.setAttribute('data-applicability', formData.hdApplicability || 'No');
    newRow.setAttribute('data-status', formData.statusHd || 'Open');
    newRow.setAttribute('data-approval', formData.approvalShop || '');
    newRow.setAttribute('data-index', index);

    newRow.innerHTML = buildRowHTML(formData, index);
    tbody.insertBefore(newRow, tbody.firstChild);

    setTimeout(() => {
        const dropdowns = newRow.querySelectorAll('.inline-dropdown');
        dropdowns.forEach(dd => setDropdownBadgeColor(dd));
    }, 0);
}

// ======================
// INLINE EDITING
// ======================

function updateInlineField(index, fieldName, value) {
    if (hdData[index]) {
        hdData[index][fieldName] = value.trim();
        saveHDToLocalStorage();

        if (fieldName === 'statusHd') {
            updateStatusCounters();
            const row = document.querySelector(`tr[data-index="${index}"]`);
            if (row) {
                row.setAttribute('data-status', value);
                const statusDropdown = row.querySelector('[data-column-index="11"] select');
                if (statusDropdown) setDropdownBadgeColor(statusDropdown);
            }
        }

        if (fieldName === 'approvalShop' && value === 'Yes') {
            createShopFloorRecords(hdData[index]);
        }
    }
}

function updateHDApplicability(index, value) {
    if (hdData[index]) {
        hdData[index].hdApplicability = value;

        const row = document.querySelector(`tr[data-index="${index}"]`);
        if (row) {
            row.setAttribute('data-applicability', value);
            const isDisabled = value !== 'Yes';

            const fieldsInRow = row.querySelectorAll(
                '[data-column-index="7"] textarea, [data-column-index="8"] textarea, [data-column-index="9"] select, [data-column-index="9"] textarea, [data-column-index="10"] input, [data-column-index="11"] select'
            );

            fieldsInRow.forEach(field => {
                field.disabled = isDisabled;
                if (isDisabled) {
                    if (field.tagName === 'TEXTAREA' || field.type === 'text') {
                        if (!field.value || field.value.trim() === '') field.value = 'N/A';
                    }
                }
            });

            if (isDisabled) {
                if (!hdData[index].similarActivity || hdData[index].similarActivity.trim() === '') hdData[index].similarActivity = 'N/A';
                if (!hdData[index].existingControls || hdData[index].existingControls.trim() === '') hdData[index].existingControls = 'N/A';
                if (!hdData[index].actionDetails || hdData[index].actionDetails.trim() === '') hdData[index].actionDetails = 'N/A';
                if (!hdData[index].statusHd) hdData[index].statusHd = 'Open';
            }
        }

        saveHDToLocalStorage();
        updateStatusCounters();
    }
}

function updateAreaLocation(index, value) {
    updateInlineField(index, 'areaLocation', value);
}

// ======================
// INLINE TEXTAREA AUTO GROW
// ======================

function autoGrowTextarea(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

// ======================
// INLINE ACTION PLAN YES/NO TOGGLE
// ======================

function toggleInlineActionPlan(select, index) {
    const wrap = select.closest('.inline-cell-wrap');
    const isDisabled = select.disabled;
    const value = select.value;

    const existing = wrap.querySelector('.inline-textarea');
    if (existing) existing.remove();

    if (hdData[index]) {
        hdData[index].actionPlanYN = value;
        if (value !== 'Yes') hdData[index].actionDetails = '';
        saveHDToLocalStorage();
    }

    if (value === 'Yes') {
        const ta = document.createElement('textarea');
        ta.className = 'inline-textarea';
        ta.rows = 1;
        ta.placeholder = 'If yes, then what...';
        ta.disabled = isDisabled;
        ta.value = (hdData[index] && hdData[index].actionDetails && hdData[index].actionDetails !== 'N/A')
            ? hdData[index].actionDetails : '';
        ta.addEventListener('input', function() { autoGrowTextarea(this); });
        ta.addEventListener('blur', function() { updateInlineField(index, 'actionDetails', this.value); });
        wrap.appendChild(ta);
        ta.focus();
        autoGrowTextarea(ta);
    }
}

// ======================
// DETAIL PANEL
// ======================

function openDetailPanel(index) {
    index = parseInt(index);
    if (isNaN(index) || index < 0 || index >= hdData.length) return;
    const data = hdData[index];
    if (!data) { alert('Error: Data not found!'); return; }

    currentEditIndex = index;
    const hdApplicability = data.hdApplicability || 'No';
    const v = (val) => (val && String(val).trim() !== '') ? val : '';

    document.getElementById('detailPanelTitle').textContent = data.hdId;
    document.getElementById('detailHdId').value = data.hdId || '';
    document.getElementById('detailCapaId').value = data.capaId || '';
    document.getElementById('detailPlant').value = data.plant || '';
    document.getElementById('detailDate').value = data.date || '';
    document.getElementById('detailAreaLocation').value = data.areaLocation || '';
    document.getElementById('detailHdApplicability').value = hdApplicability;
    document.getElementById('detailSimilarActivity').value = v(data.similarActivity);
    document.getElementById('detailExistingControls').value = v(data.existingControls);
    document.getElementById('detailActionPlanDropdown').value = data.actionPlanYN || '';
    document.getElementById('detailActionDetails').value = v(data.actionDetails);
    document.getElementById('detailTdc').value = data.tdc || '';
    document.getElementById('detailStatusHd').value = data.statusHd || 'Open';
    document.getElementById('detailApprovalShop').value = data.approvalShop || '';

    toggleDetailActionPlanField();
    toggleDetailFieldsBasedOnApplicability();

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

    let hasError = false;
    const actionDropdown = document.getElementById('detailActionPlanDropdown');
    const actionField = document.getElementById('detailActionDetails');
    if (actionDropdown.value === 'Yes' && !actionField.value.trim()) {
        showFieldError(actionField, 'Please describe the action plan');
        hasError = true;
    }
    if (hasError) {
        const firstError = document.querySelector('#detailPanel .field-error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const prevApprovalShop = hdData[currentEditIndex].approvalShop;

    const updatedData = {
        ...hdData[currentEditIndex],
        capaId: hdData[currentEditIndex].capaId, // keep original capaId (readonly)
        plant: document.getElementById('detailPlant').value,
        date: document.getElementById('detailDate').value,
        areaLocation: document.getElementById('detailAreaLocation').value,
        hdApplicability: document.getElementById('detailHdApplicability').value || 'No',
        similarActivity: document.getElementById('detailSimilarActivity').value,
        existingControls: document.getElementById('detailExistingControls').value,
        actionPlanYN: document.getElementById('detailActionPlanDropdown').value,
        actionDetails: document.getElementById('detailActionDetails').value,
        tdc: document.getElementById('detailTdc').value,
        statusHd: document.getElementById('detailStatusHd').value,
        approvalShop: document.getElementById('detailApprovalShop').value,
    };

    hdData[currentEditIndex] = updatedData;

    if (updatedData.approvalShop === 'Yes' && prevApprovalShop !== 'Yes') {
        createShopFloorRecords(updatedData);
    }

    saveHDToLocalStorage();
    updateTableRow(currentEditIndex, updatedData);
    updateStatusCounters();
    showSuccessMessage('✅ Saved!');
    closeDetailPanel();
}

function updateTableRow(index, data) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    if (!row) return;

    row.innerHTML = buildRowHTML(data, index);
    row.setAttribute('data-applicability', data.hdApplicability || 'No');
    row.setAttribute('data-status', data.statusHd || 'Open');
    row.setAttribute('data-approval', data.approvalShop || '');
    row.setAttribute('data-plant', data.plant);

    setTimeout(() => {
        const dropdowns = row.querySelectorAll('.inline-dropdown');
        dropdowns.forEach(dd => setDropdownBadgeColor(dd));
    }, 0);
}

function deleteCurrentHD() {
    if (currentEditIndex === null) return;
    if (!confirm('Delete this HD record? This cannot be undone.')) return;

    hdData.splice(currentEditIndex, 1);
    saveHDToLocalStorage();

    const tbody = document.getElementById('hdTableBody');
    tbody.innerHTML = '';
    hdData.forEach((record, index) => addHDToTable(record, index));
    updateStatusCounters();

    if (hdData.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('hdTable').style.display = 'none';
    }

    showSuccessMessage('✅ HD record deleted!');
    closeDetailPanel();
}

// ======================
// CLEAR ALL DATA (utility)
// ======================

function clearAllHDData() {
    if (!confirm('⚠️ This will permanently delete ALL saved HD records. Are you sure?')) return;
    localStorage.removeItem(HD_STORAGE_KEY);
    localStorage.removeItem(HD_COUNTER_KEY);
    hdData.length = 0;
    hdCounter = 1;
    document.getElementById('hdTableBody').innerHTML = '';
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('hdTable').style.display = 'none';
    updateStatusCounters();
    showSuccessMessage('All HD data cleared');
}

// ======================
// SEARCH
// ======================

function searchTable(searchTerm) {
    const table = document.getElementById('hdTable');
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    searchTerm = searchTerm.toLowerCase();
    for (let i = 0; i < rows.length; i++) {
        rows[i].style.display = rows[i].textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
    }
}

// ======================
// FILTERS
// ======================

function toggleMoreFilters() {
    document.getElementById('moreFiltersDropdown').classList.toggle('show');
}

function showSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    if (submenu) submenu.style.display = 'block';
}

function hideSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    if (submenu) {
        setTimeout(() => {
            if (!submenu.matches(':hover') && !submenu.parentElement.matches(':hover')) {
                submenu.style.display = 'none';
            }
        }, 100);
    }
}

function applyMoreFilters() {
    const table = document.getElementById('hdTable');
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    const checkedFilters = document.querySelectorAll('.more-filters-dropdown .filter-checkbox:checked');

    if (checkedFilters.length === 0) {
        for (let i = 0; i < rows.length; i++) rows[i].style.display = '';
        return;
    }

    const applicabilityFilters = [], statusFilters = [], approvalFilters = [], plantFilters = [];

    checkedFilters.forEach(checkbox => {
        const submenu = checkbox.closest('.filter-submenu');
        if (!submenu) return;
        const submenuId = submenu.id;
        if (submenuId === 'hdApplicabilitySubmenu') applicabilityFilters.push(checkbox.value.toLowerCase());
        else if (submenuId === 'statusHdSubmenu') statusFilters.push(checkbox.value.toLowerCase());
        else if (submenuId === 'approvalShopSubmenu') approvalFilters.push(checkbox.value.toLowerCase());
        else if (submenuId === 'plantsHdSubmenu') plantFilters.push(checkbox.value.toLowerCase());
    });

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const plant = (row.getAttribute('data-plant') || '').toLowerCase();
        const applicability = (row.getAttribute('data-applicability') || '').toLowerCase();
        const status = (row.getAttribute('data-status') || '').toLowerCase();
        const approval = (row.getAttribute('data-approval') || '').toLowerCase();

        let showRow = true;
        if (applicabilityFilters.length > 0) showRow = showRow && applicabilityFilters.includes(applicability);
        if (statusFilters.length > 0) showRow = showRow && statusFilters.includes(status);
        if (approvalFilters.length > 0) showRow = showRow && approvalFilters.includes(approval);
        if (plantFilters.length > 0) showRow = showRow && plantFilters.includes(plant);

        row.style.display = showRow ? '' : 'none';
    }
}

function clearAllFilters() {
    document.querySelectorAll('.more-filters-dropdown .filter-checkbox').forEach(cb => cb.checked = false);
    applyMoreFilters();
    document.getElementById('moreFiltersDropdown').classList.remove('show');
    showSuccessMessage('Filters cleared');
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.filter-wrapper')) {
        const dd = document.getElementById('moreFiltersDropdown');
        if (dd) dd.classList.remove('show');
    }
});

// ======================
// HEADER DROPDOWNS
// ======================

function toggleHeaderDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const isShown = dropdown.classList.contains('show');
    document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
    if (!isShown) dropdown.classList.add('show');
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.btn-wrapper') && !e.target.closest('.filter-wrapper')) {
        document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
    }
});

function toggleColumnSelector() {
    document.getElementById('columnSelectorDropdown').classList.toggle('show');
}

function toggleColumn(checkbox, columnIndex) {
    const table = document.getElementById('hdTable');
    const isChecked = checkbox.checked;
    table.querySelectorAll(`th[data-column-index="${columnIndex}"]`).forEach(h => h.style.display = isChecked ? '' : 'none');
    table.querySelectorAll(`td[data-column-index="${columnIndex}"]`).forEach(c => c.style.display = isChecked ? '' : 'none');
}

// ======================
// BULK SELECT / DELETE
// ======================

function toggleSelectAll(checkbox) {
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = checkbox.checked);
    updateBulkDeleteBar();
}

function updateBulkDeleteBar() {
    const checked = document.querySelectorAll('.row-checkbox:checked');
    const total = document.querySelectorAll('.row-checkbox').length;
    const bar = document.getElementById('bulkDeleteBar');
    const countEl = document.getElementById('bulkSelectedCount');
    const selectAllCb = document.getElementById('selectAll');

    if (checked.length > 0) {
        countEl.textContent = `${checked.length}/${total} selected`;
        bar.classList.add('show');
    } else {
        bar.classList.remove('show');
    }

    if (selectAllCb) {
        if (checked.length === 0) { selectAllCb.checked = false; selectAllCb.indeterminate = false; }
        else if (checked.length === total) { selectAllCb.checked = true; selectAllCb.indeterminate = false; }
        else { selectAllCb.checked = false; selectAllCb.indeterminate = true; }
    }
}

function deleteSelectedRows() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    const total = document.querySelectorAll('.row-checkbox').length;
    const count = checkedBoxes.length;
    const isAll = count === total;

    const msg = isAll
        ? `Delete ALL ${count}/${total} records? This cannot be undone.`
        : `Delete ${count} selected record(s)? This cannot be undone.`;
    if (!confirm(msg)) return;

    const indicesToDelete = [];
    checkedBoxes.forEach(cb => {
        const row = cb.closest('tr');
        if (row) indicesToDelete.push(parseInt(row.getAttribute('data-index')));
    });

    indicesToDelete.sort((a, b) => b - a);
    indicesToDelete.forEach(idx => { if (!isNaN(idx)) hdData.splice(idx, 1); });

    saveHDToLocalStorage();

    const tbody = document.getElementById('hdTableBody');
    tbody.innerHTML = '';
    hdData.forEach((record, index) => addHDToTable(record, index));
    updateStatusCounters();

    document.getElementById('bulkDeleteBar').classList.remove('show');
    const selectAllCb = document.getElementById('selectAll');
    if (selectAllCb) { selectAllCb.checked = false; selectAllCb.indeterminate = false; }

    if (hdData.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('hdTable').style.display = 'none';
    }

    showSuccessMessage(`✅ ${count} record(s) deleted!`);
}

function cancelBulkSelection() {
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('bulkDeleteBar').classList.remove('show');
    const selectAllCb = document.getElementById('selectAll');
    if (selectAllCb) { selectAllCb.checked = false; selectAllCb.indeterminate = false; }
}

// ======================
// AI SEARCH
// ======================

function toggleAISearch() {
    const container = document.getElementById('aiSearchContainer');
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
        const currentSuggestion = aiSuggestions[currentSuggestionIndex];
        input.placeholder = currentSuggestion.substring(0, currentCharIndex - 1);
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

// ======================
// SUCCESS MESSAGE
// ======================

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `<span class="success-icon">✓</span><span class="success-text">${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ======================
// EXPORT / SHARE
// ======================

function exportCSV() {
    if (hdData.length === 0) { alert('No data to export'); return; }
    const headers = Object.keys(hdData[0]);
    let csv = headers.join(',') + '\n';
    hdData.forEach(row => {
        csv += headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    downloadFile(csv, 'hd_export.csv', 'text/csv');
    showSuccessMessage('Exported to CSV');
}

function exportExcel() {
    if (hdData.length === 0) { alert('No data to export'); return; }
    const headers = Object.keys(hdData[0]);
    let html = '<table border="1"><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    hdData.forEach(row => { html += '<tr>' + headers.map(h => `<td>${row[h] || ''}</td>`).join('') + '</tr>'; });
    html += '</tbody></table>';
    downloadFile(html, 'hd_export.xls', 'application/vnd.ms-excel');
    showSuccessMessage('Exported to Excel');
}

function exportXML() {
    if (hdData.length === 0) { alert('No data to export'); return; }
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<HDs>\n';
    hdData.forEach(row => {
        xml += '  <HD>\n';
        for (let key in row) xml += `    <${key}>${escapeXml(row[key] || '')}</${key}>\n`;
        xml += '  </HD>\n';
    });
    xml += '</HDs>';
    downloadFile(xml, 'hd_export.xml', 'text/xml');
    showSuccessMessage('Exported to XML');
}

function escapeXml(unsafe) {
    return String(unsafe).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
}

function printList() { window.print(); }
function printDetails() { window.print(); }
function openShareModal() { document.getElementById('shareModalOverlay').classList.add('show'); }
function closeShareModal() { document.getElementById('shareModalOverlay').classList.remove('show'); }
function copyLink() { navigator.clipboard.writeText(window.location.href).then(() => showSuccessMessage('Link copied!')); }
function sendShare() { showSuccessMessage('Shared!'); closeShareModal(); }
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('shareModalOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeShareModal();
    });
});
function viewAsChart() { alert('Chart view coming soon!'); }
function bulkChange() { alert('Bulk change coming soon!'); }
function importCSV() { alert('Import CSV - will be handled by backend team'); }
function giveFeedback() { alert('Thanks for feedback!'); }
function openInGoogleSheets() { alert('Google Sheets export - coming soon!'); }
function openInExcel() { alert('Excel export - coming soon!'); }

// ======================
// CAPA DETAIL PANEL (VIEW LINKED CAPA)
// ======================

function openCapaDetailPanel(capaId) {
    const capaRecords = JSON.parse(localStorage.getItem('capaTrackerData') || '[]');
    const capaData = capaRecords.find(capa => capa.capaId === capaId);

    if (!capaData) {
        alert('❌ CAPA not found!\n\nCAPA ID: ' + capaId + '\n\nMake sure it was saved in the CAPA Tracker.');
        return;
    }

    // Build a simple read-only panel using existing elements
    const panel = document.getElementById('capaDetailPanel');
    if (!panel) return;

    document.getElementById('capaDetailPanelTitle').textContent = capaData.capaId || 'N/A';
    document.getElementById('capaDetailId').textContent = capaData.capaId || 'N/A';
    document.getElementById('capaDetailPlant').textContent = capaData.plant || 'N/A';
    document.getElementById('capaDetailDate').textContent = capaData.date || 'N/A';
    document.getElementById('capaDetailCapaAction').textContent = capaData.capaByPlant || 'N/A';
    document.getElementById('capaDetailTdc').textContent = capaData.tdc || 'N/A';
    document.getElementById('capaDetailCapaType').textContent = capaData.capaType || 'N/A';
    document.getElementById('capaDetailStatus').textContent = capaData.statusOfCAPA || 'N/A';

    panel.classList.add('open');
    document.getElementById('capaDetailPanelOverlay').classList.add('show');
}

function closeCapaDetailPanel() {
    const panel = document.getElementById('capaDetailPanel');
    if (panel) panel.classList.remove('open');
    const overlay = document.getElementById('capaDetailPanelOverlay');
    if (overlay) overlay.classList.remove('show');
}

function openCapaInNewTab() {
    const capaId = document.getElementById('capaDetailPanelTitle').textContent;
    localStorage.setItem('openCapaId', capaId);
    window.open('../CAPA Tracker/capa.html', '_blank');
}

// ======================
// NAVIGATION
// ======================

function openCapaTracker() {
    window.location.href = '../SF tracker/sf.html';
}

function openHDDashboard() {
    window.location.href = 'https://app.powerbi.com/view?r=eyJrIjoiMWE0YjFhN2YtODk1OC00OThmLWEzMTAtOTBmMmM0MmIxMWFiIiwidCI6IjQxNmU2ZTMyLWQzM2YtNDdmOS1iYzMxLTA3ZjU0NTA0MDE5MiJ9';
}

// ======================
// CREATE SF RECORDS (when Approval for Shop Floor = Yes)
// ======================

const plantShopsMap = {
    'Alwar':    ['Alwar-1', 'Alwar-2', 'Alwar-3'],
    'Bhandara': ['Bhandara-1', 'Bhandara-2'],
    'CPPS':     ['CPPS-1', 'CPPS-2'],
    'ENR':      ['ENR-1', 'ENR-2', 'ENR-3']
};

function createShopFloorRecords(hdRecord) {
    const plant = hdRecord.plant;
    const shops = plantShopsMap[plant];
    if (!shops || shops.length === 0) { console.warn('No shops found for plant:', plant); return; }

    let existingSFData = [];
    let sfCounter = 1;
    try {
        const saved = localStorage.getItem('sfTrackerData');
        const savedCounter = localStorage.getItem('sfTrackerCounter');
        if (saved) existingSFData = JSON.parse(saved);
        if (savedCounter) {
            sfCounter = parseInt(savedCounter, 10);
        } else if (existingSFData.length > 0) {
            const maxId = Math.max(...existingSFData.map(sf => {
                const match = sf.sfId && sf.sfId.match(/SF-(\d+)/);
                return match ? parseInt(match[1]) : 0;
            }));
            sfCounter = maxId + 1;
        }
    } catch (e) { console.error('Failed to load SF data:', e); }

    const alreadyCreated = existingSFData.some(sf => sf.hdId === hdRecord.hdId);
    if (alreadyCreated) { console.log('SF records already exist for HD:', hdRecord.hdId); return; }

    const newSFRecords = shops.map(shop => {
        const sfId = `SF-${String(sfCounter++).padStart(3, '0')}`;
        return {
            uid: 'sf' + Date.now() + Math.random().toString(36).substr(2, 9),
            sfId, hdId: hdRecord.hdId, plant, shop,
            date: hdRecord.date || '',
            hdApplicability: 'No', similarActivity: '', existingControls: '',
            actionPlanYN: '', actionDetails: '', tdc: '', statusHd: 'Open'
        };
    });

    try {
        localStorage.setItem('sfTrackerData', JSON.stringify([...newSFRecords, ...existingSFData]));
        localStorage.setItem('sfTrackerCounter', String(sfCounter));
        showSuccessMessage('✅ ' + newSFRecords.length + ' SF records created for ' + plant + '!');
    } catch (e) { console.error('Failed to save SF records:', e); }
}

console.log('✅ HD Tracker Ready!');