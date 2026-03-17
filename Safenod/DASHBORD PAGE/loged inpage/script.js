const USER_NAME = "Suresh";
const VISIT_KEY = "safenod_last_visit";

function init() {
  const now   = new Date();
  const today = now.toDateString();
  const hour  = now.getHours();
  const last  = localStorage.getItem(VISIT_KEY);

  // Date display
  document.getElementById('todayDate').textContent =
    now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Shift tag
  let shiftIcon = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>`;
  let shiftLabel = 'Morning Shift';

  if (hour >= 12 && hour < 17) {
    shiftLabel = 'Afternoon Shift';
  } else if (hour >= 17 && hour < 21) {
    shiftLabel = 'Evening Shift';
  } else if (hour >= 21 || hour < 5) {
    shiftLabel = 'Night Shift';
    shiftIcon = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>`;
  }
  document.getElementById('shiftTag').innerHTML = shiftIcon + ' ' + shiftLabel;

  // Smart greeting logic
  if (!last) {
    // First time ever
    setGreeting(
      `Good to see you, <span class="name">${USER_NAME}</span>`,
      "Here's your plant risk overview for today. Stay safe, stay sharp."
    );
  } else if (last !== today) {
    // New day
    setGreeting(
      `Good to see you, <span class="name">${USER_NAME}</span>`,
      "Ready for a new day at the plant? Let's keep things safe and under control."
    );
  } else {
    // Already visited today
    setGreeting(
      `Welcome back, <span class="name">${USER_NAME}</span>`,
      "Your risk dashboard is up to date. Pick up where you left off."
    );
  }

  // Save today's date
  localStorage.setItem(VISIT_KEY, today);

  // Set avatar initials
  document.getElementById('avatarInitials').textContent = USER_NAME.substring(0, 2).toUpperCase();
}

function setGreeting(title, sub) {
  document.getElementById('greetingTitle').innerHTML = title;
  document.getElementById('greetingSub').textContent = sub;
}

function toggleStar() {
  const el = document.getElementById('starIcon');
  const filled = el.getAttribute('data-filled') === 'true';
  el.setAttribute('data-filled', !filled);
  el.innerHTML = filled
    ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>`
    : `<svg width="15" height="15" viewBox="0 0 24 24" fill="#ffab00" stroke="#ffab00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>`;
}

function setTab(el) {
  document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

// ── MODULE NAVIGATION ──
// Dashboard location: D:/karanodaka/DASHBORD PAGE/loged inpage/dashboard.html
// Going up 2 levels reaches: D:/karanodaka/
// Then into TRACKERS/...
const MODULE_PATHS = {
  'incident': '../../TRACKERS/incidents/incident-Reporting-and-Investigation-Frontend/irir.html',
  'capa':     '../../TRACKERS/CAPA Tracker/capa.html',
  'hd':       '../../TRACKERS/HD tracker/hd.html',
  'hira':     '../../TRACKERS/HIRA/hira.html',
  'jsa':      '../../TRACKERS/JSA/JSA-Frontend/jsa.html',
  'ptw':      '../../TRACKERS/PTW/ptw.html',
};

function openModule(key) {
  const path = MODULE_PATHS[key];
  if (path) {
    window.location.href = path;
  }
}

function showSuccess(msg) {
  const n = document.createElement('div');
  n.className = 'success-notification';
  n.innerHTML = `<span class="success-icon">✓</span><span>${msg}</span>`;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('show'), 10);
  setTimeout(() => {
    n.classList.remove('show');
    setTimeout(() => n.remove(), 300);
  }, 2500);
}

// ── AVATAR DROPDOWN ──
function toggleDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('avatarDropdown');
  dd.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  const wrapper = document.getElementById('avatarWrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    document.getElementById('avatarDropdown').classList.remove('open');
  }
});

function handleDropdown(action) {
  document.getElementById('avatarDropdown').classList.remove('open');
  const msgs = {
    profile:       'Opening My Profile…',
    settings:      'Opening Settings…',
    password:      'Opening Change Password…',
    notifications: 'Loading Notifications…',
    help:          'Opening Help & Support…',
    about:         'Safenod v2.4.1 — Plant Risk & Safety Platform',
    logout:        'Logging you out safely…'
  };
  showSuccess(msgs[action] || 'Loading…');
}

// Run on load
init();