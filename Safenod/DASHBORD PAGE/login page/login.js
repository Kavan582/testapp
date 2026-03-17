// ── EYE TOGGLE ──
function toggleEye() {
  const pw = document.getElementById('password');
  const icon = document.getElementById('eyeIcon');
  const isPassword = pw.type === 'password';
  pw.type = isPassword ? 'text' : 'password';
  icon.innerHTML = isPassword
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
}

// ── SIGN IN HANDLER ──
function handleSignIn() {
  const email    = document.getElementById('email').value.trim();
  const pass     = document.getElementById('password').value.trim();
  const emailEl  = document.getElementById('email');
  const passEl   = document.getElementById('password');
  const emailErr = document.getElementById('emailError');
  const passErr  = document.getElementById('passError');
  const btn      = document.getElementById('signinBtn');

  let valid = true;

  // Reset errors
  emailEl.classList.remove('error'); emailErr.classList.remove('show');
  passEl.classList.remove('error');  passErr.classList.remove('show');

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailEl.classList.add('error');
    emailErr.classList.add('show');
    valid = false;
  }

  // Validate password
  if (pass.length < 8) {
    passEl.classList.add('error');
    passErr.classList.add('show');
    valid = false;
  }

  if (!valid) return;

  // Loading state
  btn.classList.add('loading');
  btn.disabled = true;

  setTimeout(() => {
    btn.classList.remove('loading');
    btn.disabled = false;
    // ── REDIRECT HERE ──
    window.location.href = '../loged inpage/index.html';
  }, 1800);
}

// ── ENTER KEY SUPPORT ──
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') handleSignIn();
});