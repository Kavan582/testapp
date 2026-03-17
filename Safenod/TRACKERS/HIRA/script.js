console.log('🚀 HAZARD IDENTIFICATION AND RISK ASSESSMENT System');

// HIRA data array (no localStorage - just frontend)
const hiraData = [];

// HIRA counter for new hazards
let hiraCounter = 1;

// Current editing index
let currentEditIndex = null;

// AI Search Suggestions for HIRA
const aiSuggestions = [
    "Show me all high-risk hazards",
    "Find hazards in welding activity",
    "Which hazards have legal concerns?",
    "Display all hazards with high severity",
    "Show hazards requiring elimination controls",
    "Find hazards with completed status",
    "List all machine operation hazards",
    "Which hazards need engineering controls?",
    "Show hazards with residual risk above 15",
    "Find all painting activity hazards",
    "Display hazards by risk level",
    "Show hazards needing substitution",
    "Which hazards require additional PPE?",
    "Find hazards with ongoing status",
    "List all assembly line hazards",
    "Show hazards with medium risk",
    "Find hazards with commercial feasibility issues",
    "Display chemical exposure hazards",
    "Which hazards have injury cases?",
    "Show all routine activity hazards"
];

let typingInterval = null;
let currentSuggestionIndex = 0;
let currentCharIndex = 0;
let isTyping = false;

// ======================
// STATUS COUNTER UPDATE
// ======================

function updateStatusCounters() {
    const totalCount = hiraData.length;
    const ongoingCount = hiraData.filter(item => item.status === 'Ongoing').length;
    const completedCount = hiraData.filter(item => item.status === 'Completed').length;
    
    // Update counter displays
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('openCount').textContent = ongoingCount;
    document.getElementById('closedCount').textContent = completedCount;
}

// ======================
// RISK CALCULATION FUNCTIONS
// ======================

// Calculate initial risk level
function calculateRisk() {
    const probability = parseInt(document.getElementById('probability')?.value) || 0;
    const severity = parseInt(document.getElementById('severity')?.value) || 0;
    
    if (probability > 0 && severity > 0) {
        const riskValue = probability * severity;
        const riskLevel = getRiskLevel(riskValue);
        
        const riskLevelField = document.getElementById('riskLevel');
        if (riskLevelField) {
            riskLevelField.value = `${riskLevel} (${riskValue})`;
        }
    }
}

// Calculate residual risk
function calculateResidualRisk() {
    const severityResidual = parseInt(document.getElementById('severityResidual')?.value) || 0;
    const probabilityResidual = parseInt(document.getElementById('probabilityResidual')?.value) || 0;
    
    if (severityResidual > 0 && probabilityResidual > 0) {
        const rpvValue = severityResidual * probabilityResidual;
        const residualLevel = getRiskLevel(rpvValue);
        
        const rpvField = document.getElementById('rpv');
        if (rpvField) {
            rpvField.value = rpvValue;
        }
        
        const residualRiskLevelField = document.getElementById('residualRiskLevel');
        if (residualRiskLevelField) {
            residualRiskLevelField.value = `${residualLevel} (${rpvValue})`;
        }
    }
}

// Get risk level based on value
function getRiskLevel(value) {
    if (value >= 15) return 'High';
    if (value >= 8) return 'Medium';
    return 'Low';
}

// ======================
// MODAL FUNCTIONS
// ======================

function openCreateModal() {
    document.getElementById('createModalOverlay').classList.add('active');
    // Set hazard ID
    document.getElementById('hazardId').value = `HIRA-${String(hiraCounter).padStart(3, '0')}`;
}

function closeCreateModal() {
    document.getElementById('createModalOverlay').classList.remove('active');
    document.getElementById('hiraForm').reset();
    
    // Reset auto-calculated fields
    document.getElementById('hazardId').value = `HIRA-${String(hiraCounter).padStart(3, '0')}`;
    document.getElementById('riskLevel').value = 'Not Calculated';
    document.getElementById('rpv').value = '0';
    document.getElementById('residualRiskLevel').value = 'Not Calculated';
}

function toggleFullscreen() {
    const modal = document.getElementById('createModal');
    modal.classList.toggle('fullscreen');
}

// ======================
// FORM SUBMISSION
// ======================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing HIRA form...');
    
    const hiraForm = document.getElementById('hiraForm');
    if (hiraForm) {
        hiraForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted!');
            
            try {
                const formData = {
                    hazardId: document.getElementById('hazardId')?.value || '',
                    activity: document.getElementById('activity')?.value || '',
                    subActivity: document.getElementById('subActivity')?.value || '',
                    routineType: document.getElementById('routineType')?.value || 'Routine',
                    hazard: document.getElementById('hazard')?.value || '',
                    potentialCause: document.getElementById('potentialCause')?.value || '',
                    legalConcern: document.getElementById('legalConcern')?.value || 'No',
                    riskConsequences: document.getElementById('riskConsequences')?.value || '',
                    engineeringControls: document.getElementById('engineeringControls')?.value || '',
                    administrativeControls: document.getElementById('administrativeControls')?.value || '',
                    ppes: document.getElementById('ppes')?.value || '',
                    probability: document.getElementById('probability')?.value || '',
                    severity: document.getElementById('severity')?.value || '',
                    riskLevel: document.getElementById('riskLevel')?.value || '',
                    elimination: document.getElementById('elimination')?.value || '',
                    substitution: document.getElementById('substitution')?.value || '',
                    engineeringControlsFurther: document.getElementById('engineeringControlsFurther')?.value || '',
                    administrativeControlFurther: document.getElementById('administrativeControlFurther')?.value || '',
                    ppeFurther: document.getElementById('ppeFurther')?.value || '',
                    technical: document.getElementById('technical')?.value || '',
                    commercial: document.getElementById('commercial')?.value || '',
                    feasibility: document.getElementById('feasibility')?.value || '',
                    severityResidual: document.getElementById('severityResidual')?.value || '',
                    probabilityResidual: document.getElementById('probabilityResidual')?.value || '',
                    rpv: document.getElementById('rpv')?.value || '',
                    residualRiskLevel: document.getElementById('residualRiskLevel')?.value || '',
                    residualRisks: document.getElementById('residualRisks')?.value || '',
                    ocpRef: document.getElementById('ocpRef')?.value || '',
                    status: document.getElementById('status')?.value || 'Ongoing',
                    remarks: document.getElementById('remarks')?.value || ''
                };

                console.log('Hazard Created:', formData);
                
                // Add to table
                addHazardToTable(formData);
                
                // Add to hiraData array
                hiraData.push(formData);
                
                // Update status counters
                updateStatusCounters();
                
                alert('✅ Hazard assessment created successfully!\n\nHazard ID: ' + formData.hazardId);
                
                // Increment counter for next hazard
                hiraCounter++;
                
                // Check if "Create another" is checked
                const createAnother = document.getElementById('createAnother').checked;
                
                if (createAnother) {
                    // Reset form but keep modal open
                    document.getElementById('hiraForm').reset();
                    document.getElementById('hazardId').value = `HIRA-${String(hiraCounter).padStart(3, '0')}`;
                    document.getElementById('riskLevel').value = 'Not Calculated';
                    document.getElementById('rpv').value = '0';
                    document.getElementById('residualRiskLevel').value = 'Not Calculated';
                } else {
                    // Close modal and reset form
                    closeCreateModal();
                }
                
            } catch (error) {
                console.error('Error creating hazard:', error);
                alert('❌ Error: ' + error.message);
            }
        });
    } else {
        console.error('ERROR: HIRA form element not found!');
    }
    
    // Start AI typing animation
    startAITyping();
});

// ======================
// ADD HAZARD TO TABLE
// ======================

function addHazardToTable(formData) {
    // Hide empty state and show table
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('hiraTable').style.display = 'table';
    
    const tbody = document.getElementById('hiraTableBody');
    const newRow = document.createElement('tr');
    
    // Set data attributes for filtering
    newRow.setAttribute('data-activity', formData.activity);
    newRow.setAttribute('data-risklevel', formData.riskLevel.split(' ')[0]); // Extract "High", "Medium", "Low"
    newRow.setAttribute('data-status', formData.status);
    
    // Extract risk level for badge class
    const riskLevelText = formData.riskLevel.split(' ')[0]; // "High", "Medium", "Low"
    const riskBadgeClass = 'badge risk-' + riskLevelText.toLowerCase();
    
    const residualRiskLevelText = formData.residualRiskLevel.split(' ')[0];
    const residualRiskBadgeClass = 'badge risk-' + residualRiskLevelText.toLowerCase();
    
    // Status badge class
    const statusClass = 'status-badge status-' + formData.status.toLowerCase();
    
    // Build row HTML with ALL columns
    newRow.innerHTML = `
        <td><input type="checkbox" class="row-checkbox"></td>
        <td>${hiraData.length}</td>
        <td><a href="#" class="task-id" onclick="showDetail(${hiraData.length - 1}); return false;">${formData.activity}</a></td>
        <td>${formData.subActivity || 'N/A'}</td>
        <td>${formData.routineType}</td>
        <td><strong>${formData.hazardId}</strong></td>
        <td>${formData.hazard}</td>
        <td>${formData.potentialCause}</td>
        <td>${formData.legalConcern}</td>
        <td>${formData.riskConsequences || 'N/A'}</td>
        <td>${formData.engineeringControls || 'N/A'}</td>
        <td>${formData.administrativeControls || 'N/A'}</td>
        <td>${formData.ppes || 'N/A'}</td>
        <td>${formData.probability || 'N/A'}</td>
        <td>${formData.severity || 'N/A'}</td>
        <td><span class="${riskBadgeClass}">${formData.riskLevel}</span></td>
        <td>${formData.elimination || 'N/A'}</td>
        <td>${formData.substitution || 'N/A'}</td>
        <td>${formData.engineeringControlsFurther || 'N/A'}</td>
        <td>${formData.administrativeControlFurther || 'N/A'}</td>
        <td>${formData.ppeFurther || 'N/A'}</td>
        <td>${formData.technical || 'N/A'}</td>
        <td>${formData.commercial || 'N/A'}</td>
        <td>${formData.feasibility || 'N/A'}</td>
        <td>${formData.severityResidual || 'N/A'}</td>
        <td>${formData.probabilityResidual || 'N/A'}</td>
        <td>${formData.rpv || 'N/A'}</td>
        <td><span class="${residualRiskBadgeClass}">${formData.residualRiskLevel}</span></td>
        <td>${formData.residualRisks || 'N/A'}</td>
        <td>${formData.ocpRef || 'N/A'}</td>
        <td>
            <div style="position: relative; display: inline-block;">
                <span class="${statusClass}" onclick="toggleStatusDropdown(this)">${formData.status} ▼</span>
                <div class="status-dropdown">
                    <div class="status-dropdown-item" onclick="changeStatus(this, 'Ongoing')">Ongoing</div>
                    <div class="status-dropdown-item" onclick="changeStatus(this, 'Completed')">Completed</div>
                </div>
            </div>
        </td>
        <td>${formData.remarks || 'N/A'}</td>
    `;
    
    tbody.appendChild(newRow);
}

// ======================
// STATUS DROPDOWN FUNCTIONS
// ======================

function toggleStatusDropdown(element) {
    const dropdown = element.nextElementSibling;
    
    // Close all other dropdowns first
    document.querySelectorAll('.status-dropdown').forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('show');
        }
    });
    
    dropdown.classList.toggle('show');
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!element.contains(e.target)) {
                dropdown.classList.remove('show');
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 0);
}

function changeStatus(element, newStatus) {
    const statusBadge = element.closest('.status-dropdown').previousElementSibling;
    const row = element.closest('tr');
    
    // Update status badge
    statusBadge.textContent = newStatus + ' ▼';
    statusBadge.className = 'status-badge status-' + newStatus.toLowerCase();
    
    // Update data attribute
    row.setAttribute('data-status', newStatus);
    
    // Close dropdown
    element.closest('.status-dropdown').classList.remove('show');
    
    // Update in hiraData array
    const rowIndex = Array.from(row.parentElement.children).indexOf(row);
    if (hiraData[rowIndex]) {
        hiraData[rowIndex].status = newStatus;
        
        // Update status counters
        updateStatusCounters();
    }
}

// ======================
// DETAIL PANEL FUNCTIONS
// ======================

function showDetail(index) {
    currentEditIndex = index;
    const data = hiraData[index];
    
    if (!data) {
        console.error('Hazard data not found at index:', index);
        alert('Error: Hazard not found!');
        return;
    }
    
    console.log('Opening edit panel for:', data.hazardId, data);
    
    // Populate edit fields
    document.getElementById('editActivity').value = data.activity || '';
    document.getElementById('editSubActivity').value = data.subActivity || '';
    document.getElementById('editHazard').value = data.hazard || '';
    
    // Show side panel
    document.getElementById('sidePanel').classList.add('open');
    document.getElementById('panelId').textContent = data.hazardId;
}

function closeSidePanel() {
    document.getElementById('sidePanel').classList.remove('open');
    currentEditIndex = null;
}

function saveEdit() {
    if (currentEditIndex === null) return;
    
    // Get updated values
    const updatedData = {
        ...hiraData[currentEditIndex],
        activity: document.getElementById('editActivity').value,
        subActivity: document.getElementById('editSubActivity').value,
        hazard: document.getElementById('editHazard').value
    };
    
    // Update in array
    hiraData[currentEditIndex] = updatedData;
    
    // Update table row
    // (You can add logic to update the specific row here)
    
    alert('Changes saved successfully!');
    closeSidePanel();
}

// ======================
// SEARCH FUNCTION
// ======================

function searchTable(searchTerm) {
    const table = document.getElementById('hiraTable');
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    searchTerm = searchTerm.toLowerCase();
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();
        
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

// ======================
// MORE FILTERS FUNCTIONS
// ======================

function toggleMoreFilters() {
    const dropdown = document.getElementById('moreFiltersDropdown');
    dropdown.classList.toggle('show');
}

function applyMoreFilters() {
    const table = document.getElementById('hiraTable');
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    // Get all checked filters
    const checkedFilters = document.querySelectorAll('.more-filters-dropdown .filter-checkbox:checked');
    
    // If no filters checked, show all rows
    if (checkedFilters.length === 0) {
        for (let i = 0; i < rows.length; i++) {
            rows[i].style.display = '';
        }
        return;
    }
    
    // Collect filter values by type
    const activityFilters = [];
    const riskLevelFilters = [];
    const statusFilters = [];
    
    checkedFilters.forEach(checkbox => {
        const value = checkbox.value;
        const section = checkbox.closest('.filter-section').querySelector('.filter-section-header').textContent;
        
        if (section === 'Activity') {
            activityFilters.push(value.toLowerCase());
        } else if (section === 'Risk Level') {
            riskLevelFilters.push(value.toLowerCase());
        } else if (section === 'Status') {
            statusFilters.push(value.toLowerCase());
        }
    });
    
    // Filter rows
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const activity = row.getAttribute('data-activity')?.toLowerCase() || '';
        const riskLevel = row.getAttribute('data-risklevel')?.toLowerCase() || '';
        const status = row.getAttribute('data-status')?.toLowerCase() || '';
        
        let showRow = true;
        
        // Check activity filter
        if (activityFilters.length > 0) {
            showRow = showRow && activityFilters.some(filter => activity.includes(filter));
        }
        
        // Check risk level filter
        if (riskLevelFilters.length > 0) {
            showRow = showRow && riskLevelFilters.some(filter => riskLevel.includes(filter));
        }
        
        // Check status filter
        if (statusFilters.length > 0) {
            showRow = showRow && statusFilters.includes(status);
        }
        
        row.style.display = showRow ? '' : 'none';
    }
}

function clearAllFilters() {
    // Uncheck all filter checkboxes
    const checkboxes = document.querySelectorAll('.more-filters-dropdown .filter-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    
    // Show all rows
    applyMoreFilters();
    
    // Close dropdown
    document.getElementById('moreFiltersDropdown').classList.remove('show');
}

// Close More Filters dropdown when clicking outside
document.addEventListener('click', function(e) {
    const moreFiltersDropdown = document.getElementById('moreFiltersDropdown');
    const moreFiltersBtn = document.querySelector('.btn-more-filters');
    
    if (moreFiltersDropdown && !e.target.closest('.filter-wrapper')) {
        moreFiltersDropdown.classList.remove('show');
    }
});

// ======================
// FILTER FUNCTIONS
// ======================

function toggleDropdown(dropdownId, button) {
    const dropdown = document.getElementById(dropdownId);
    const isCurrentlyShown = dropdown.classList.contains('show');
    
    // Close all dropdowns
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('show'));
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    
    // Toggle current dropdown
    if (!isCurrentlyShown) {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

function closeDropdown(dropdownId) {
    document.getElementById(dropdownId).classList.remove('show');
}

function applyFilter(filterType, value) {
    console.log(`Applying filter: ${filterType} = ${value}`);
    // Filter logic here
}

// ======================
// HEADER DROPDOWN FUNCTIONS
// ======================

function toggleHeaderDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const isShown = dropdown.classList.contains('show');
    
    // Close all header dropdowns
    document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
    
    if (!isShown) {
        dropdown.classList.add('show');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.btn-wrapper') && !e.target.closest('.filter-wrapper')) {
        document.querySelectorAll('.header-dropdown, .dropdown').forEach(d => {
            d.classList.remove('show');
        });
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    }
});

// ======================
// COLUMN TOGGLE
// ======================

function toggleColumnSelector() {
    const dropdown = document.getElementById('columnSelectorDropdown');
    dropdown.classList.toggle('show');
}

function toggleColumn(checkbox, columnIndex) {
    const table = document.getElementById('hiraTable');
    const isChecked = checkbox.checked;
    
    // Toggle header
    const headers = table.querySelectorAll('th');
    if (headers[columnIndex]) {
        headers[columnIndex].style.display = isChecked ? '' : 'none';
    }
    
    // Toggle cells in all rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells[columnIndex]) {
            cells[columnIndex].style.display = isChecked ? '' : 'none';
        }
    });
}

// ======================
// SELECT ALL FUNCTION
// ======================

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
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
    console.log('AI Search Query:', query);
    alert('AI Search feature coming soon!\nQuery: ' + query);
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
        setTimeout(() => {
            eraseCharacter();
        }, 2000);
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
// EXPORT FUNCTIONS
// ======================

function exportCSV() {
    alert('Export to CSV feature - will be handled by backend team');
}

function exportExcel() {
    alert('Export to Excel feature - will be handled by backend team');
}

function exportXML() {
    alert('Export to XML feature - will be handled by backend team');
}

function printList() {
    window.print();
}

function printDetails() {
    window.print();
}

// ======================
// SHARE FUNCTIONS
// ======================

function openShareModal() {
    document.getElementById('shareModalOverlay').classList.add('show');
}

function closeShareModal() {
    document.getElementById('shareModalOverlay').classList.remove('show');
}

function copyLink() {
    alert('Link copied to clipboard!');
}

function sendShare() {
    alert('Share functionality - will be handled by backend team');
    closeShareModal();
}

// Close share modal when clicking outside
document.getElementById('shareModalOverlay')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeShareModal();
    }
});

// ======================
// MORE OPTIONS FUNCTIONS
// ======================

function viewAsChart() {
    alert('Chart view feature coming soon!');
}

function bulkChange() {
    alert('Bulk change feature coming soon!');
}

function importCSV() {
    alert('Import CSV feature - will be handled by backend team');
}

function giveFeedback() {
    alert('Thank you for your interest in giving feedback!');
}

function openInGoogleSheets() {
    alert('Google Sheets integration - will be handled by backend team');
}

function openInExcel() {
    alert('Excel integration - will be handled by backend team');
}

// ======================
// VIEW TOGGLE
// ======================

function switchView(viewType) {
    const buttons = document.querySelectorAll('.view-toggle-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (viewType === 'list') {
        buttons[0].classList.add('active');
    } else {
        buttons[1].classList.add('active');
    }
    
    console.log('Switched to', viewType, 'view');
}

console.log('✅ HIRA System - All Systems Ready!');