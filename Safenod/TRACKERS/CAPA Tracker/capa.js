console.log('🚀 CAPA Tracker - System Starting...');

// ====================== 
// LOCALSTORAGE PERSISTENCE
// ======================

const STORAGE_KEY = 'capaTrackerData';
const COUNTER_KEY = 'capaTrackerCounter';
const INCIDENT_COUNTER_KEY = 'capaIncidentCounter';

function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allCapas));
        localStorage.setItem(COUNTER_KEY, String(capaCounter));
        localStorage.setItem(INCIDENT_COUNTER_KEY, String(incidentCounter));
        console.log('💾 Saved to localStorage:', allCapas.length, 'CAPAs');
    } catch (e) {
        console.error('❌ Failed to save to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const savedCounter = localStorage.getItem(COUNTER_KEY);
        const savedIncidentCounter = localStorage.getItem(INCIDENT_COUNTER_KEY);

        if (saved) {
            allCapas = JSON.parse(saved);
            console.log('📂 Loaded from localStorage:', allCapas.length, 'CAPAs');
        }
        if (savedCounter) {
            capaCounter = parseInt(savedCounter, 10);
        }
        if (savedIncidentCounter) {
            incidentCounter = parseInt(savedIncidentCounter, 10);
        }
        // Recalculate capaCounter from actual data to prevent duplicate/wrong IDs
        if (allCapas.length > 0) {
            const maxId = Math.max(...allCapas.map(c => {
                const match = c.capaId && c.capaId.match(/CAPA-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            }));
            if (maxId >= capaCounter) {
                capaCounter = maxId + 1;
            }
        }
    } catch (e) {
        console.error('❌ Failed to load from localStorage:', e);
        allCapas = [];
        capaCounter = 1;
        incidentCounter = 1;
    }
}

// Store all CAPAs globally
let allCapas = [];

// CAPA ID Counter
let capaCounter = 1;

// Incident ID Counter
let incidentCounter = 1;

// Current editing CAPA ID
let currentDetailCapaId = null;

// AI Search Suggestions for CAPA
const aiSuggestions = [
    "Show me all Fire category incidents",
    "Find open CAPAs from Alwar plant",
    "Which incidents are Reportable?",
    "Display all Near Miss cases",
    "Show CAPAs with Engineering Controls",
    "List all closed CAPAs",
    "Find CAPAs with PPE type",
    "Show CAPAs pending closure",
    "Which CAPAs need Elimination controls?",
    "Display incidents by plant",
    "Find overdue CAPAs",
    "Show all First Aid cases",
    "List CAPAs by target date",
    "Display Horizontal Deployment CAPAs",
    "Find Non-Reportable incidents",
    "Show Environment incidents",
    "List CAPAs approved for HD",
    "Show Administrative Controls CAPAs"
];

let typingInterval = null;
let currentSuggestionIndex = 0;
let currentCharIndex = 0;
let isTyping = false;

// ======================
// STATUS COUNTER UPDATE
// ======================

function updateStatusCounters() {
    const totalCount = allCapas.length;
    const openCount = allCapas.filter(item => item.statusOfCAPA === 'Open').length;
    const closedCount = allCapas.filter(item => item.statusOfCAPA === 'Closed').length;
    
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('openCount').textContent = openCount;
    document.getElementById('closedCount').textContent = closedCount;
}

// ======================
// GENERATE CAPA ID
// ======================

function generateCapaId() {
    const id = String(capaCounter).padStart(3, '0');
    return `CAPA-${id}`;
}

// ======================
// GENERATE INCIDENT ID
// ======================

function generateIncidentId() {
    const id = String(incidentCounter).padStart(3, '0');
    return `INC-${id}`;
}

// ======================
// TOGGLE INCIDENT ID N/A
// ======================

function toggleIncidentIdNA(checkbox) {
    const incidentField = document.getElementById('capaIncidentId');
    if (checkbox.checked) {
        incidentField.value = 'N/A';
        incidentField.classList.add('na-value');
    } else {
        incidentField.value = generateIncidentId();
        incidentField.classList.remove('na-value');
    }
}

// ======================
// INLINE EDITING FUNCTIONS
// ======================

function updateInlineField(capaId, fieldName, value) {
    const capa = allCapas.find(c => c.capaId === capaId);
    if (capa) {
        capa[fieldName] = value.trim();
        
        if (fieldName === 'statusOfCAPA') {
            updateStatusCounters();
            const row = document.querySelector(`tr[data-capa-id="${capaId}"]`);
            if (row) {
                row.setAttribute('data-status', value);
            }
        }

        if (fieldName === 'approvalHD' && value === 'Yes') {
            const existingHDs = JSON.parse(localStorage.getItem('hdTrackerData') || '[]');
            const alreadyCreated = existingHDs.some(hd => hd.capaId === capaId);
            if (!alreadyCreated) {
                createHorizontalDeployments(capa.capaId, capa.date, 'Yes');
                showSuccessMessage('✅ Approval set to Yes — 4 HD records created for all plants!');
            }
            const row = document.querySelector(`tr[data-capa-id="${capaId}"]`);
            if (row) row.setAttribute('data-approval-hd', value.toLowerCase());
        }
        
        saveToLocalStorage();
        console.log(`✅ Updated ${fieldName} for ${capaId}:`, value);
    }
}

// ======================
// INITIALIZE ON PAGE LOAD
// ======================

window.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Loaded - Initializing CAPA Tracker...');

    loadFromLocalStorage();
    
    const capaIdField = document.getElementById('capaId');
    if (capaIdField) {
        capaIdField.value = generateCapaId();
    }

    const incidentIdField = document.getElementById('capaIncidentId');
    if (incidentIdField) {
        incidentIdField.value = generateIncidentId();
    }
    
    const capaForm = document.getElementById('capaForm');
    if (capaForm) {
        capaForm.addEventListener('submit', handleFormSubmit);
    }
    
    if (allCapas.length > 0) {
        const orderedCapas = [...allCapas].reverse();
        orderedCapas.forEach(capa => addCapaToTable(capa));
    }

    updateStatusCounters();
    startAITyping();
});

// ======================
// HANDLE FORM SUBMISSION
// ======================

function handleFormSubmit(e) {
    e.preventDefault();
    console.log('📝 Form submitted!');

    const incidentIdValue = document.getElementById('capaIncidentId').value || generateIncidentId();

    const formData = {
        capaId: document.getElementById('capaId').value,
        plant: document.getElementById('capaPlant').value,
        date: document.getElementById('capaDate').value,
        category: document.getElementById('capaCategory').value,
        incidentId: incidentIdValue,
        capaByPlant: document.getElementById('capaByPlant').value,
        tdc: document.getElementById('capaTDC').value,
        capaType: document.getElementById('capaType').value,
        statusOfCAPA: document.getElementById('capaStatus').value,
        approvalHD: document.getElementById('capaApprovalHD').value,
        horizontalDeploymentStatus: document.getElementById('capaApprovalHD').value === 'Yes' ? 'Yes' : 'No'
    };

    console.log('📊 CAPA Data:', formData);
    
    allCapas.unshift(formData);
    saveToLocalStorage();
    addCapaToTable(formData);
    updateStatusCounters();
    
    // Increment incident counter only if not N/A
    if (incidentIdValue !== 'N/A') {
        incidentCounter++;
    }

    const shouldCreateHD = formData.approvalHD === 'Yes';
    if (shouldCreateHD) {
        createHorizontalDeployments(formData.capaId, formData.date, formData.approvalHD);
    }
    
    capaCounter++;
    saveToLocalStorage();
    
    const successMsg = shouldCreateHD
        ? '✅ CAPA created! ID: ' + formData.capaId + ' — 4 HD records created for all plants'
        : '✅ CAPA created successfully! ID: ' + formData.capaId;
    showSuccessMessage(successMsg);
    
    if (!document.getElementById('createAnother').checked) {
        closeCapaModal();
        resetFormCompletely();
    } else {
        resetFormCompletely();
        document.getElementById('capaId').value = generateCapaId();
        document.getElementById('capaIncidentId').value = generateIncidentId();
    }
    
    console.log('✅ Form submission complete!');
}

// ======================
// RESET FORM COMPLETELY
// ======================

function resetFormCompletely() {
    document.getElementById('capaForm').reset();
    document.getElementById('capaId').value = generateCapaId();
    document.getElementById('capaIncidentId').value = generateIncidentId();
    // Reset N/A toggle
    const naToggle = document.getElementById('incidentIdNAToggle');
    if (naToggle) naToggle.checked = false;
    const incidentField = document.getElementById('capaIncidentId');
    if (incidentField) incidentField.classList.remove('na-value');
}

// ======================
// GET CATEGORY BADGE CLASS
// ======================

function getCategoryBadgeClass(category) {
    const map = {
        'Reportable': 'severity-r',
        'Non-Reportable': 'severity-nr',
        'First Aid': 'severity-fa',
        'Near Miss': 'severity-nm',
        'Environment': 'severity-env',
        'Fire': 'severity-fire'
    };
    return map[category] || 'severity-custom';
}

// ======================
// ADD CAPA TO TABLE WITH INLINE EDITING
// ======================

function addCapaToTable(data) {
    console.log('🔨 Adding row to table for:', data.capaId);
    
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('capaTable').style.display = 'table';
    
    const tableBody = document.getElementById('capaTableBody');
    if (!tableBody) {
        console.error('❌ Table body not found!');
        return;
    }
    
    const categoryClass = getCategoryBadgeClass(data.category);
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-category', data.category);
    newRow.setAttribute('data-status', data.statusOfCAPA);
    newRow.setAttribute('data-approval-hd', (data.approvalHD || '').toLowerCase());
    newRow.setAttribute('data-plant', data.plant);
    newRow.setAttribute('data-capa-id', data.capaId);

    const v = (val) => (val && String(val).trim() !== '') ? val : 'N/A';

    newRow.innerHTML = `
        <td class="sticky-column sticky-checkbox"><input type="checkbox" class="row-checkbox" onchange="updateCapaBulkDeleteBar()"></td>
        <td class="sticky-column sticky-col-1"><a href="#" class="task-id" onclick="event.preventDefault(); openDetailPanel('${data.capaId}');">${data.capaId}</a></td>
        <td class="sticky-column sticky-col-2">${data.plant}</td>
        <td class="sticky-column sticky-col-3">${data.date}</td>
        <td class="sticky-column sticky-col-4"><span class="severity-badge ${categoryClass}">${data.category}</span></td>
        <td data-column-index="5">
            <span class="incident-id-badge">${v(data.incidentId)}</span>
        </td>
        <td data-column-index="6">
            <textarea class="inline-textarea" rows="2" onblur="updateInlineField('${data.capaId}', 'capaByPlant', this.value)">${v(data.capaByPlant)}</textarea>
        </td>
        <td data-column-index="7">
            <input type="date" class="inline-input inline-date" value="${data.tdc || ''}" onchange="updateInlineField('${data.capaId}', 'tdc', this.value)">
        </td>
        <td data-column-index="8">
            <select class="inline-dropdown" onchange="updateInlineField('${data.capaId}', 'capaType', this.value)">
                <option value="">-- Select --</option>
                <option value="Elimination" ${data.capaType === 'Elimination' ? 'selected' : ''}>Elimination</option>
                <option value="Substitution" ${data.capaType === 'Substitution' ? 'selected' : ''}>Substitution</option>
                <option value="Engineering Controls" ${data.capaType === 'Engineering Controls' ? 'selected' : ''}>Engineering Controls</option>
                <option value="Administrative Controls" ${data.capaType === 'Administrative Controls' ? 'selected' : ''}>Administrative Controls</option>
                <option value="PPE" ${data.capaType === 'PPE' ? 'selected' : ''}>PPE</option>
            </select>
        </td>
        <td data-column-index="9">
            <select class="inline-dropdown inline-status-select" onchange="updateInlineField('${data.capaId}', 'statusOfCAPA', this.value)">
                <option value="Open" ${data.statusOfCAPA === 'Open' ? 'selected' : ''}>Open</option>
                <option value="Closed" ${data.statusOfCAPA === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
        </td>
        <td data-column-index="10">
            <select class="inline-dropdown" onchange="updateInlineField('${data.capaId}', 'approvalHD', this.value)">
                <option value="" ${!data.approvalHD ? 'selected' : ''}>-- Select --</option>
                <option value="Yes" ${data.approvalHD === 'Yes' ? 'selected' : ''}>Yes</option>
                <option value="No" ${data.approvalHD === 'No' ? 'selected' : ''}>No</option>
            </select>
        </td>
    `;
    
    tableBody.insertBefore(newRow, tableBody.firstChild);
    
    setTimeout(() => {
        const statusSelect = newRow.querySelector('.inline-status-select');
        if (statusSelect) setStatusDropdownBadgeColor(statusSelect);
    }, 0);
    
    console.log('✅ Row inserted into table');
}

// ======================
// SET STATUS DROPDOWN BADGE COLOR
// ======================

function setStatusDropdownBadgeColor(select) {
    if (!select) return;
    select.className = select.className.replace(/\bstatus-open\b|\bstatus-closed\b/g, '').trim();
    if (select.value === 'Open') {
        select.classList.add('status-open');
    } else if (select.value === 'Closed') {
        select.classList.add('status-closed');
    }
}

// ======================
// COLUMN TOGGLE
// ======================

function toggleColumnSelector() {
    const dropdown = document.getElementById('columnSelectorDropdown');
    dropdown.classList.toggle('show');
}

function toggleColumn(checkbox, columnIndex) {
    const table = document.getElementById('capaTable');
    const isChecked = checkbox.checked;
    
    table.querySelectorAll('th[data-column-index]').forEach(header => {
        if (parseInt(header.getAttribute('data-column-index')) === columnIndex) {
            header.style.display = isChecked ? '' : 'none';
        }
    });
    
    table.querySelectorAll('tbody tr').forEach(row => {
        row.querySelectorAll('td[data-column-index]').forEach(cell => {
            if (parseInt(cell.getAttribute('data-column-index')) === columnIndex) {
                cell.style.display = isChecked ? '' : 'none';
            }
        });
    });
}

// ======================
// SELECT ALL / BULK DELETE
// ======================

function toggleAllCheckboxes() {
    const masterCheckbox = document.getElementById('masterCheckbox');
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = masterCheckbox.checked);
    updateCapaBulkDeleteBar();
}

function updateCapaBulkDeleteBar() {
    const checked = document.querySelectorAll('.row-checkbox:checked');
    const total = document.querySelectorAll('.row-checkbox').length;
    const bar = document.getElementById('capaBulkDeleteBar');
    const countEl = document.getElementById('capaBulkSelectedCount');
    const masterCb = document.getElementById('masterCheckbox');

    if (checked.length > 0) {
        countEl.textContent = `${checked.length}/${total} selected`;
        bar.classList.add('show');
    } else {
        bar.classList.remove('show');
    }

    if (masterCb) {
        if (checked.length === 0) {
            masterCb.checked = false;
            masterCb.indeterminate = false;
        } else if (checked.length === total) {
            masterCb.checked = true;
            masterCb.indeterminate = false;
        } else {
            masterCb.checked = false;
            masterCb.indeterminate = true;
        }
    }
}

function deleteSelectedCapas() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    const total = document.querySelectorAll('.row-checkbox').length;
    const count = checkedBoxes.length;
    const isAll = count === total;

    const msg = isAll
        ? `Delete ALL ${count}/${total} records? This cannot be undone.`
        : `Delete ${count} selected record(s)? This cannot be undone.`;

    if (!confirm(msg)) return;

    const capaIdsToDelete = [];
    checkedBoxes.forEach(cb => {
        const row = cb.closest('tr');
        if (row) capaIdsToDelete.push(row.getAttribute('data-capa-id'));
    });

    capaIdsToDelete.forEach(id => {
        const index = allCapas.findIndex(c => c.capaId === id);
        if (index > -1) allCapas.splice(index, 1);
        const row = document.querySelector(`tr[data-capa-id="${id}"]`);
        if (row) row.remove();
    });

    saveToLocalStorage();
    updateStatusCounters();

    document.getElementById('capaBulkDeleteBar').classList.remove('show');
    const masterCb = document.getElementById('masterCheckbox');
    if (masterCb) { masterCb.checked = false; masterCb.indeterminate = false; }

    if (allCapas.length === 0) {
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('capaTable').style.display = 'none';
    }

    showSuccessMessage(`✅ ${count} record(s) deleted successfully!`);
}

function cancelCapaBulkSelection() {
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('capaBulkDeleteBar').classList.remove('show');
    const masterCb = document.getElementById('masterCheckbox');
    if (masterCb) { masterCb.checked = false; masterCb.indeterminate = false; }
}

// ======================
// AI SEARCH FUNCTIONS
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
    const container = document.getElementById('aiSearchContainer');
    const searchSection = document.getElementById('searchSection');
    container.classList.remove('show');
    searchSection.style.display = 'block';
    stopAITyping();
}

function executeAISearch() {
    const query = document.getElementById('aiSearchInput').value;
    if (query.trim()) {
        console.log('AI Search Query:', query);
        alert('AI Search feature coming soon!\nQuery: ' + query);
    }
}

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
        setTimeout(() => eraseCharacter(), 2000);
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
    if (typingInterval) {
        clearTimeout(typingInterval);
        typingInterval = null;
    }
}

// ======================
// SEARCH FUNCTION
// ======================

function searchTable(searchTerm) {
    const table = document.getElementById('capaTable');
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    searchTerm = searchTerm.toLowerCase();
    for (let i = 0; i < rows.length; i++) {
        const text = rows[i].textContent.toLowerCase();
        rows[i].style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

// ======================
// MORE FILTERS FUNCTIONS
// ======================

function toggleMoreFilters() {
    const dropdown = document.getElementById('moreFiltersDropdown');
    dropdown.classList.toggle('show');
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
    const table = document.getElementById('capaTable');
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    const checkedFilters = document.querySelectorAll('.more-filters-dropdown .filter-checkbox:checked');
    
    if (checkedFilters.length === 0) {
        for (let i = 0; i < rows.length; i++) rows[i].style.display = '';
        return;
    }
    
    const categoryFilters = [];
    const plantFilters = [];
    const statusFilters = [];
    const approvalHDFilters = [];
    
    checkedFilters.forEach(checkbox => {
        const submenu = checkbox.closest('.filter-submenu');
        if (!submenu) return;
        const submenuId = submenu.id;
        if (submenuId === 'categorySubmenu') categoryFilters.push(checkbox.value);
        else if (submenuId === 'plantsSubmenu') plantFilters.push(checkbox.value);
        else if (submenuId === 'statusSubmenu') statusFilters.push(checkbox.value);
        else if (submenuId === 'approvalHDSubmenu') approvalHDFilters.push(checkbox.value);
    });
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const category = row.getAttribute('data-category');
        const plant = row.getAttribute('data-plant');
        const status = row.getAttribute('data-status');
        const approvalHD = row.getAttribute('data-approval-hd') || '';
        
        let showRow = true;
        if (categoryFilters.length > 0) showRow = showRow && categoryFilters.includes(category);
        if (plantFilters.length > 0) showRow = showRow && plantFilters.includes(plant);
        if (statusFilters.length > 0) showRow = showRow && statusFilters.includes(status);
        if (approvalHDFilters.length > 0) showRow = showRow && approvalHDFilters.map(v => v.toLowerCase()).includes(approvalHD.toLowerCase());
        
        row.style.display = showRow ? '' : 'none';
    }
}

function clearAllFilters() {
    document.querySelectorAll('.more-filters-dropdown .filter-checkbox').forEach(cb => cb.checked = false);
    applyMoreFilters();
    document.getElementById('moreFiltersDropdown').classList.remove('show');
    showSuccessMessage('All filters cleared');
}

// ======================
// HEADER DROPDOWN FUNCTIONS
// ======================

function toggleHeaderDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const isShown = dropdown.classList.contains('show');
    document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
    if (!isShown) dropdown.classList.add('show');
}

// ======================
// DETAIL PANEL FUNCTIONS
// ======================

function openDetailPanel(capaId) {
    const capa = allCapas.find(c => c.capaId === capaId);
    if (!capa) return;
    
    currentDetailCapaId = capaId;
    
    const panel = document.getElementById('detailSidePanel');
    const panelBody = document.getElementById('detailPanelBody');
    const panelTitle = document.getElementById('detailPanelTitle');
    
    panelTitle.textContent = capa.capaId + ' — ' + capa.plant;
    
    panelBody.innerHTML = `
        <div class="detail-field-group">
            <label class="detail-field-label">CAPA ID</label>
            <input type="text" class="detail-field-input" value="${capa.capaId}" disabled>
        </div>
        
        <div class="detail-field-group">
            <label class="detail-field-label">Plant</label>
            <select class="detail-field-select" id="detailPlant">
                <option value="Alwar" ${capa.plant === 'Alwar' ? 'selected' : ''}>Alwar</option>
                <option value="Bhandara" ${capa.plant === 'Bhandara' ? 'selected' : ''}>Bhandara</option>
                <option value="CPPS" ${capa.plant === 'CPPS' ? 'selected' : ''}>CPPS</option>
                <option value="ENR" ${capa.plant === 'ENR' ? 'selected' : ''}>ENR</option>
            </select>
        </div>
        
        <div class="detail-field-group">
            <label class="detail-field-label">Date</label>
            <input type="date" class="detail-field-input" id="detailDate" value="${capa.date}">
        </div>
        
        <div class="detail-field-group">
            <label class="detail-field-label">Category</label>
            <select class="detail-field-select" id="detailCategory">
                <option value="Reportable" ${capa.category === 'Reportable' ? 'selected' : ''}>Reportable</option>
                <option value="Non-Reportable" ${capa.category === 'Non-Reportable' ? 'selected' : ''}>Non-Reportable</option>
                <option value="First Aid" ${capa.category === 'First Aid' ? 'selected' : ''}>First Aid</option>
                <option value="Near Miss" ${capa.category === 'Near Miss' ? 'selected' : ''}>Near Miss</option>
                <option value="Environment" ${capa.category === 'Environment' ? 'selected' : ''}>Environment</option>
                <option value="Fire" ${capa.category === 'Fire' ? 'selected' : ''}>Fire</option>
            </select>
        </div>
        
        <div class="detail-field-group">
            <label class="detail-field-label">Incident ID</label>
            <input type="text" class="detail-field-input" id="detailIncidentId" value="${capa.incidentId || 'N/A'}">
        </div>

        <div class="detail-section-title">CAPA Details</div>
        
        <div class="detail-field-group">
            <label class="detail-field-label">CAPA by Respective Plant</label>
            <textarea class="detail-field-textarea" id="detailCapaByPlant">${capa.capaByPlant || ''}</textarea>
        </div>
        
        <div class="detail-field-group">
            <label class="detail-field-label">TDC (Target Date of Completion)</label>
            <input type="date" class="detail-field-input" id="detailTDC" value="${capa.tdc || ''}">
        </div>
        
        <div class="detail-field-group">
            <label class="detail-field-label">CAPA TYPE</label>
            <select class="detail-field-select" id="detailCapaType">
                <option value="">-- Select --</option>
                <option value="Elimination" ${capa.capaType === 'Elimination' ? 'selected' : ''}>Elimination</option>
                <option value="Substitution" ${capa.capaType === 'Substitution' ? 'selected' : ''}>Substitution</option>
                <option value="Engineering Controls" ${capa.capaType === 'Engineering Controls' ? 'selected' : ''}>Engineering Controls</option>
                <option value="Administrative Controls" ${capa.capaType === 'Administrative Controls' ? 'selected' : ''}>Administrative Controls</option>
                <option value="PPE" ${capa.capaType === 'PPE' ? 'selected' : ''}>PPE</option>
            </select>
        </div>
        
        <div class="detail-field-group">
            <label class="detail-field-label">Status of CAPA</label>
            <select class="detail-field-select" id="detailStatusOfCAPA">
                <option value="Open" ${capa.statusOfCAPA === 'Open' ? 'selected' : ''}>Open</option>
                <option value="Closed" ${capa.statusOfCAPA === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
        </div>
        
        <div class="detail-field-group">
            <label class="detail-field-label">Approval for HD</label>
            <select class="detail-field-select" id="detailApprovalHD">
                <option value="" ${!capa.approvalHD ? 'selected' : ''}>-- Select --</option>
                <option value="Yes" ${capa.approvalHD === 'Yes' ? 'selected' : ''}>Yes</option>
                <option value="No" ${capa.approvalHD === 'No' ? 'selected' : ''}>No</option>
            </select>
        </div>
    `;
    
    panel.classList.add('open');
    const overlay = document.getElementById('detailPanelOverlay');
    if (overlay) overlay.classList.add('show');
}

function closeDetailPanel() {
    const panel = document.getElementById('detailSidePanel');
    const overlay = document.getElementById('detailPanelOverlay');
    panel.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    currentDetailCapaId = null;
}

function saveDetailChanges() {
    if (!currentDetailCapaId) return;
    const capa = allCapas.find(c => c.capaId === currentDetailCapaId);
    if (!capa) return;
    
    capa.plant = document.getElementById('detailPlant').value;
    capa.date = document.getElementById('detailDate').value;
    capa.category = document.getElementById('detailCategory').value;
    capa.incidentId = document.getElementById('detailIncidentId').value;
    capa.capaByPlant = document.getElementById('detailCapaByPlant').value;
    capa.tdc = document.getElementById('detailTDC').value;
    capa.capaType = document.getElementById('detailCapaType').value;
    capa.statusOfCAPA = document.getElementById('detailStatusOfCAPA').value;

    const prevApprovalHD = capa.approvalHD;
    capa.approvalHD = document.getElementById('detailApprovalHD').value;

    if (capa.approvalHD === 'Yes' && prevApprovalHD !== 'Yes') {
        const existingHDs = JSON.parse(localStorage.getItem('hdTrackerData') || '[]');
        const alreadyCreated = existingHDs.some(hd => hd.capaId === capa.capaId);
        if (!alreadyCreated) {
            createHorizontalDeployments(capa.capaId, capa.date, 'Yes');
            showSuccessMessage('✅ Approval set to Yes — 4 HD records created for all plants!');
        }
    }
    
    updateTableRowFromCapa(capa);
    updateStatusCounters();
    saveToLocalStorage();
    showSuccessMessage('Changes saved successfully!');
    closeDetailPanel();
}

function deleteCurrentCapa() {
    if (!currentDetailCapaId) return;
    if (!confirm('Are you sure you want to delete this CAPA? This action cannot be undone.')) return;
    
    const index = allCapas.findIndex(c => c.capaId === currentDetailCapaId);
    if (index > -1) allCapas.splice(index, 1);
    
    const row = document.querySelector(`tr[data-capa-id="${currentDetailCapaId}"]`);
    if (row) row.remove();
    
    saveToLocalStorage();
    updateStatusCounters();
    showSuccessMessage('CAPA deleted successfully!');
    closeDetailPanel();

    if (allCapas.length === 0) {
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('capaTable').style.display = 'none';
    }
}

function updateTableRowFromCapa(capa) {
    const row = document.querySelector(`tr[data-capa-id="${capa.capaId}"]`);
    if (!row) return;

    const categoryClass = getCategoryBadgeClass(capa.category);
    row.setAttribute('data-category', capa.category);
    row.setAttribute('data-status', capa.statusOfCAPA);
    row.setAttribute('data-plant', capa.plant);
    row.setAttribute('data-approval-hd', (capa.approvalHD || '').toLowerCase());

    const v = (val) => (val && String(val).trim() !== '') ? val : 'N/A';

    row.cells[2].textContent = capa.plant;
    row.cells[3].textContent = capa.date;
    row.cells[4].innerHTML = `<span class="severity-badge ${categoryClass}">${capa.category}</span>`;
    row.cells[5].innerHTML = `<span class="incident-id-badge">${v(capa.incidentId)}</span>`;
    row.cells[6].querySelector('.inline-textarea').value = v(capa.capaByPlant);
    row.cells[7].querySelector('.inline-input').value = capa.tdc || '';
    row.cells[8].querySelector('.inline-dropdown').value = capa.capaType || '';
    row.cells[9].querySelector('.inline-dropdown').value = capa.statusOfCAPA;
    row.cells[10].querySelector('.inline-dropdown').value = capa.approvalHD || '';

    const statusSelect = row.cells[9].querySelector('.inline-dropdown');
    if (statusSelect) setStatusDropdownBadgeColor(statusSelect);
}

// ======================
// CAPA MODAL FUNCTIONS
// ======================

function openCapaModal() {
    document.getElementById('capaModalOverlay').classList.add('active');
    document.getElementById('capaId').value = generateCapaId();
    const naToggle = document.getElementById('incidentIdNAToggle');
    if (naToggle && !naToggle.checked) {
        document.getElementById('capaIncidentId').value = generateIncidentId();
    }
}

function closeCapaModal() {
    document.getElementById('capaModalOverlay').classList.remove('active');
    const modal = document.getElementById('capaModal');
    if (modal) modal.classList.remove('fullscreen');
    resetFormCompletely();
}

function toggleFullscreenCapaModal() {
    const modal = document.getElementById('capaModal');
    if (modal) modal.classList.toggle('fullscreen');
}

// ======================
// SHARE MODAL FUNCTIONS
// ======================

function openShareModal() {
    document.getElementById('shareModal').classList.add('show');
}

function closeShareModal(event) {
    if (event && event.target === document.getElementById('shareModal')) {
        document.getElementById('shareModal').classList.remove('show');
    }
}

function copyShareLink() {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
        showSuccessMessage('Link copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy link');
    });
}

function shareSearchCriteria() {
    const names = document.getElementById('shareNames').value;
    if (!names.trim()) {
        alert('Please enter at least one email address');
        return;
    }
    showSuccessMessage('Shared with: ' + names);
    document.getElementById('shareModal').classList.remove('show');
    document.getElementById('shareNames').value = '';
    document.getElementById('shareMessage').value = '';
}

// ======================
// EXPORT FUNCTIONS
// ======================

function exportCSV() {
    toggleHeaderDropdown('exportDropdown');
    if (allCapas.length === 0) { alert('No data to export'); return; }
    const headers = Object.keys(allCapas[0]);
    let csv = headers.join(',') + '\n';
    allCapas.forEach(capa => {
        const row = headers.map(h => `"${String(capa[h] || '').replace(/"/g, '""')}"`);
        csv += row.join(',') + '\n';
    });
    downloadFile(csv, 'capa_export.csv', 'text/csv');
    showSuccessMessage(`Exported ${allCapas.length} CAPAs to CSV`);
}

function exportExcel() {
    toggleHeaderDropdown('exportDropdown');
    if (allCapas.length === 0) { alert('No data to export'); return; }
    const headers = Object.keys(allCapas[0]);
    let html = '<table border="1"><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    allCapas.forEach(capa => {
        html += '<tr>' + headers.map(h => `<td>${capa[h] || ''}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    downloadFile(html, 'capa_export.xls', 'application/vnd.ms-excel');
    showSuccessMessage(`Exported ${allCapas.length} CAPAs to Excel`);
}

function exportXML() {
    toggleHeaderDropdown('exportDropdown');
    if (allCapas.length === 0) { alert('No data to export'); return; }
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<CAPAs>\n';
    allCapas.forEach(capa => {
        xml += '  <CAPA>\n';
        for (let key in capa) xml += `    <${key}>${escapeXml(capa[key] || '')}</${key}>\n`;
        xml += '  </CAPA>\n';
    });
    xml += '</CAPAs>';
    downloadFile(xml, 'capa_export.xml', 'text/xml');
    showSuccessMessage(`Exported ${allCapas.length} CAPAs to XML`);
}

function printList() {
    toggleHeaderDropdown('exportDropdown');
    window.print();
}

function printDetails() {
    toggleHeaderDropdown('exportDropdown');
    window.print();
}

// ======================
// APPS FUNCTIONS
// ======================

function openInGoogleSheets() {
    toggleHeaderDropdown('appsDropdown');
    if (allCapas.length === 0) { alert('No data to open in Google Sheets'); return; }
    const headers = Object.keys(allCapas[0]);
    let csv = headers.join(',') + '\n';
    allCapas.forEach(capa => {
        const row = headers.map(h => `"${String(capa[h] || '').replace(/"/g, '""')}"`);
        csv += row.join(',') + '\n';
    });
    downloadFile(csv, 'capa_for_google_sheets.csv', 'text/csv');
    setTimeout(() => window.open('https://sheets.google.com', '_blank'), 500);
    alert('CSV file downloaded. Please upload it to Google Sheets.');
}

function openInMicrosoftExcel() {
    toggleHeaderDropdown('appsDropdown');
    if (allCapas.length === 0) { alert('No data to open in Microsoft Excel'); return; }
    const headers = Object.keys(allCapas[0]);
    let html = '<table border="1"><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    allCapas.forEach(capa => {
        html += '<tr>' + headers.map(h => `<td>${capa[h] || ''}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    downloadFile(html, 'capa_for_excel.xls', 'application/vnd.ms-excel');
    alert('Excel file downloaded. Please open it in Microsoft Excel.');
}

// ======================
// MORE OPTIONS FUNCTIONS
// ======================

function viewAsChart() { alert('Chart view feature coming soon!'); }
function bulkChange() { alert('Bulk change feature coming soon!'); }
function importCSV() { alert('Import CSV feature - will be handled by backend team'); }
function giveFeedback() { alert('Thank you for your interest in giving feedback!'); }

// ======================
// ADDITIONAL FUNCTIONS
// ======================

function openCapaDashboard() {
    window.location.href = "https://app.powerbi.com/view?r=eyJrIjoiMWE0YjFhN2YtODk1OC00OThmLWEzMTAtOTBmMmM0MmIxMWFiIiwidCI6IjQxNmU2ZTMyLWQzM2YtNDdmOS1iYzMxLTA3ZjU0NTA0MDE5MiJ9";
}

// ======================
// CREATE HORIZONTAL DEPLOYMENTS
// ======================

function createHorizontalDeployments(capaId, capaDate, approvalHD) {
    console.log('🔄 Creating Horizontal Deployments for CAPA:', capaId);
    const plants = ['Alwar', 'Bhandara', 'CPPS', 'ENR'];
    let existingHDData = [];
    let hdCounter = 1;

    try {
        const saved = localStorage.getItem('hdTrackerData');
        const savedCounter = localStorage.getItem('hdTrackerCounter');
        if (saved) existingHDData = JSON.parse(saved);
        if (savedCounter) {
            hdCounter = parseInt(savedCounter, 10);
        } else if (existingHDData.length > 0) {
            const maxId = Math.max(...existingHDData.map(hd => {
                const match = hd.hdId && hd.hdId.match(/HD-(\d+)/);
                return match ? parseInt(match[1]) : 0;
            }));
            hdCounter = maxId + 1;
        }
    } catch (e) {
        console.error('❌ Failed to load existing HD data:', e);
    }

    const newHDRecords = plants.map(plantName => {
        const hdId = `HD-${String(hdCounter++).padStart(3, '0')}`;
        return {
            hdId, capaId, plant: plantName, date: capaDate,
            areaLocation: '', hdApplicability: 'No', similarActivity: '',
            existingControls: '', actionPlanYN: '', actionDetails: '',
            tdc: '', statusHd: 'Open', approvalShop: ''
        };
    });

    try {
        localStorage.setItem('hdTrackerData', JSON.stringify([...newHDRecords, ...existingHDData]));
        localStorage.setItem('hdTrackerCounter', String(hdCounter));
        console.log('✅ Saved 4 HD records:', newHDRecords.map(r => r.hdId).join(', '));
    } catch (e) {
        console.error('❌ Failed to save HD records:', e);
    }
}

function openHorizontalDeployment() {
    window.location.href = "../HD Tracker/hd.html";
}

// ======================
// CLEAR ALL DATA (DEV UTILITY)
// ======================

function clearAllData() {
    if (!confirm('⚠️ This will permanently delete ALL saved CAPAs. Are you sure?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COUNTER_KEY);
    localStorage.removeItem(INCIDENT_COUNTER_KEY);
    allCapas = [];
    capaCounter = 1;
    incidentCounter = 1;
    document.getElementById('capaTableBody').innerHTML = '';
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('capaTable').style.display = 'none';
    updateStatusCounters();
    showSuccessMessage('All data cleared');
}

// ======================
// HELPER FUNCTIONS
// ======================

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function escapeXml(unsafe) {
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <span class="success-icon">✓</span>
        <span class="success-text">${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ======================
// CLICK OUTSIDE TO CLOSE DROPDOWNS
// ======================

document.addEventListener('click', function(e) {
    if (!e.target.closest('.filter-wrapper') && !e.target.closest('.btn-wrapper')) {
        document.querySelectorAll('.header-dropdown, .more-filters-dropdown').forEach(d => d.classList.remove('show'));
    }
    if (!e.target.closest('.status-badge') && !e.target.closest('.status-dropdown')) {
        document.querySelectorAll('.status-dropdown').forEach(d => d.classList.remove('show'));
    }
});

console.log('✅ CAPA Tracker - All Systems Ready!');