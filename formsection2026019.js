const scriptURL = 'https://script.google.com/macros/s/AKfycbyd7fw27mrfmrxqUvj-HPcdvYpGg7O2WOAJ-zivKNCsoDkBYBOmpZgk8UNVOdFbizBo/exec';

document.addEventListener("DOMContentLoaded", () => {
  applyLandingStyles();
  bindNavPopups();
  bindAuthLinks();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (isLoggedIn) {
    const savedUsername = localStorage.getItem("axpUsername") || "";
    const savedPassword = localStorage.getItem("axpPassword") || "";
    if (savedUsername && savedPassword) {
      displayDashboard();
      loadDashboardData(savedUsername, savedPassword);
    } else {
      localStorage.removeItem("isLoggedIn");
      _openAuthForm("lg-form");
    }
  }

  const urlParams  = new URLSearchParams(window.location.search);
  const resetEmail = urlParams.get("email");
  const resetToken = urlParams.get("token");
  if (resetEmail && resetToken) {
    _openAuthForm("newSet-form");
    const emailInput = document.querySelector('#new-password-form input[name="email"]');
    const tokenInput = document.querySelector('#new-password-form input[name="token"]');
    if (emailInput) emailInput.value = resetEmail;
    if (tokenInput) tokenInput.value = resetToken;
  }
});

/* ─────────────────────────────────────────────────────
   AUTH OVERLAY  —  a dedicated fullscreen div that sits
   on TOP of the page.
───────────────────────────────────────────────────── */
function _ensureAuthOverlay() {
  if (document.getElementById("axp-auth-overlay")) return;
  applyLandingStyles();

  /* ── NUKE every dead HTML form the template left in the DOM ── */
  document.querySelectorAll(".login-form, .form-container").forEach(el => {
    if (!el.closest("#axp-auth-overlay")) el.remove();
  });
  ["lg-form","sp-form","set-form","newSet-form",
   "login-form","signup-form","reset-form","new-password-form"].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.closest("#axp-auth-overlay")) el.remove();
  });

  /* ── Full-screen overlay ── */
  const ov = document.createElement("div");
  ov.id = "axp-auth-overlay";
  ov.style.cssText = [
    "position:fixed",
    "top:0","left:0",
    "width:100%","height:100%",
    "z-index:2147483647",
    "display:none",
    "box-sizing:border-box",
    "background:transparent",
    "overflow-y:auto",
    "overflow-x:hidden",
    "text-align:left"
  ].join(";");
  document.body.appendChild(ov);

  /* ── login-form wrapper (horizontally centered, natural scroll) ── */
  const loginForm = document.createElement("div");
  loginForm.className = "login-form";
  loginForm.style.cssText = [
    "display:flex",
    "flex-direction:column",
    "align-items:stretch",
    "width:100%",
    "max-width:440px",
    "padding:40px 16px",
    "box-sizing:border-box",
    "position:relative",
    "z-index:10",
    "margin-left:6%",
    "margin-right:auto",
    "margin-top:0",
    "margin-bottom:0"
  ].join(";");
  ov.appendChild(loginForm);

  /* ── Field helpers ── */
  function pwField(name, label) {
    return `
      <div class="axp-field">
        <label>${label}</label>
        <div class="axp-input-wrap">
          <input name="${name}" type="password" required autocomplete="current-password" placeholder="${label}" />
          <i class="axp-eye far fa-eye-slash" onclick="togglePasswordVisibility('${name}')"></i>
        </div>
      </div>`;
  }
  function txtField(name, label, type = "text", ac = "off") {
    return `
      <div class="axp-field">
        <label>${label}</label>
        <div class="axp-input-wrap">
          <input name="${name}" type="${type}" required autocomplete="${ac}" placeholder="${label}" />
        </div>
      </div>`;
  }

  /* ── Brand header shared by all 4 forms ── */
  const brand = `
    <div class="axp-brand">
      <span>ACADEMIX<em>POINT</em></span>
      <p>School Management System</p>
    </div>`;

  /* ════════════════════════════════════════════
     FORM 1 — LOGIN
  ════════════════════════════════════════════ */
  const lgDiv = document.createElement("div");
  lgDiv.className = "form-container";
  lgDiv.id = "lg-form";
  lgDiv.innerHTML = `
    ${brand}
    <h2>Account Login</h2>
    <p class="axp-subtitle">Sign in to your school dashboard</p>
    <div class="message-box"></div>
    <form id="login-form" onsubmit="return false;">
      ${txtField("username","Username","text","username")}
      ${pwField("loginPassword","Password")}
      <button class="axp-btn" id="submit" type="button" onclick="submitForm('login')">
        <i class="bi bi-box-arrow-in-right"></i> Login
      </button>
    </form>
    <div class="axp-links">
      <a href="#" onclick="toggleForms('set-form');return false;">Forgot Password? Reset Here</a>
    </div>
    <div class="axp-divider">or</div>
    <div class="axp-links">
      No account?&nbsp;<a href="#" onclick="toggleForms('sp-form');return false;">Register here</a>
    </div>`;

  /* ════════════════════════════════════════════
     FORM 2 — SIGN UP
  ════════════════════════════════════════════ */
  const spDiv = document.createElement("div");
  spDiv.className = "form-container";
  spDiv.id = "sp-form";
  spDiv.innerHTML = `
    ${brand}
    <h2>Register School</h2>
    <p class="axp-subtitle">Create your school account</p>
    <div class="message-box"></div>
    <form id="signup-form" onsubmit="return false;">
      ${txtField("schoolname","School Name")}
      ${txtField("schoolindex","School Index No")}
      ${txtField("username","Username","text","username")}
      ${txtField("email","Email Address","email","email")}
      ${txtField("phone","Phone Number","tel","tel")}
      ${pwField("password","Password")}
      ${pwField("confirmPassword","Confirm Password")}
      <button class="axp-btn" id="submit1" type="button" onclick="submitForm('signup')">
        <i class="bi bi-person-plus-fill"></i> Sign Up
      </button>
    </form>
    <div class="axp-links">
      Already have an account?&nbsp;<a href="#" onclick="toggleForms('lg-form');return false;">Login here</a>
    </div>`;

  /* ════════════════════════════════════════════
     FORM 3 — FORGOT PASSWORD
  ════════════════════════════════════════════ */
  const setDiv = document.createElement("div");
  setDiv.className = "form-container";
  setDiv.id = "set-form";
  setDiv.innerHTML = `
    ${brand}
    <h2>Reset Password</h2>
    <p class="axp-subtitle">Enter your email to receive a reset link</p>
    <div class="message-box"></div>
    <form id="reset-form" onsubmit="return false;">
      ${txtField("email","Email Address","email","email")}
      <button class="axp-btn" id="submit2" type="button" onclick="submitForm('generateToken')">
        <i class="bi bi-envelope-fill"></i> Send Reset Link
      </button>
    </form>
    <div class="axp-links">
      <a href="#" onclick="toggleForms('lg-form');return false;">&#8592; Back to Login</a>
    </div>`;

  /* ════════════════════════════════════════════
     FORM 4 — SET NEW PASSWORD
  ════════════════════════════════════════════ */
  const newSetDiv = document.createElement("div");
  newSetDiv.className = "form-container";
  newSetDiv.id = "newSet-form";
  newSetDiv.innerHTML = `
    ${brand}
    <h2>Set New Password</h2>
    <p class="axp-subtitle">Choose a strong new password</p>
    <div class="message-box"></div>
    <form id="new-password-form" onsubmit="return false;">
      <input name="email" type="hidden" />
      <input name="token" type="hidden" />
      ${pwField("newPassword","New Password")}
      ${pwField("newConfirmPassword","Confirm New Password")}
      <button class="axp-btn" id="submit3" type="button" onclick="submitForm('resetPassword')">
        <i class="bi bi-shield-lock-fill"></i> Set New Password
      </button>
    </form>
    <div class="axp-links">
      <a href="#" onclick="toggleForms('lg-form');return false;">&#8592; Back to Login</a>
    </div>`;

  loginForm.appendChild(lgDiv);
  loginForm.appendChild(spDiv);
  loginForm.appendChild(setDiv);
  loginForm.appendChild(newSetDiv);
}

function _openAuthForm(formId) {
  _ensureAuthOverlay();
  _injectVideoBackground();

  const ov = document.getElementById("axp-auth-overlay");
  if (ov) {
    ov.style.display = "block";
  }

  /* Show video/canvas bg elements — they stay in body as fixed-position layers */
  ["axp-video-bg","axp-video-overlay","axp-canvas-bg"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "block";
  });

  const loginForm = ov ? ov.querySelector(".login-form") : document.querySelector(".login-form");
  if (loginForm) loginForm.style.display = "flex";
  toggleForms(formId);
}

function _closeAuthForm() {
  const ov = document.getElementById("axp-auth-overlay");
  if (ov) ov.style.display = "none";
  ["axp-video-bg","axp-video-overlay","axp-canvas-bg"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

function applyLandingStyles() {
  if (document.getElementById("axp-landing-styles")) return;
  const style = document.createElement("style");
  style.id = "axp-landing-styles";
  style.textContent = `
    /* ── Prevent body interference ── */
    body::before { content: none; }

    /* Hide any stale login-form divs sitting directly in body */
    body > .login-form { display: none !important; }

    /* ── Auth Overlay ── */
    #axp-auth-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483647;
      background: transparent;
      overflow-y: auto;
      overflow-x: hidden;
      box-sizing: border-box;
    }

    /* Inner wrapper — pushed ~15% from left on desktop */
    #axp-auth-overlay .login-form {
      display: flex !important;
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      max-width: 440px;
      padding: 40px 16px;
      box-sizing: border-box;
      position: relative;
      z-index: 10;
      margin-top: 0;
      margin-bottom: 0;
      margin-left: 6%;
      margin-right: auto;
    }

    /* Mobile: full width, centered, no offset */
    @media (max-width: 768px) {
      #axp-auth-overlay .login-form {
        display: flex !important;
        width: 100%;
        max-width: 100%;
        padding: 24px 0;
        margin: 0 auto;
      }
      #axp-auth-overlay .form-container {
        border-radius: 0;
        border-left: none;
        border-right: none;
        max-width: 100%;
        width: 100%;
      }
    }

    /* Ensure inputs/forms inside overlay are always visible */
    #axp-auth-overlay form        { display: block !important; }
    #axp-auth-overlay .axp-field  { display: block !important; }
    #axp-auth-overlay .axp-input-wrap { display: block !important; position: relative !important; }
    #axp-auth-overlay input       { display: block !important; }
    #axp-auth-overlay select      { display: block !important; }

    /* Video bg inside overlay */
    #axp-video-bg {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 2147483644;
      opacity: 0;
      transition: opacity 2s ease;
      display: none;
      pointer-events: none;
    }
    #axp-video-bg.loaded { opacity: 1; }

    #axp-video-overlay {
      position: fixed;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(4,8,20,0.88) 0%,
        rgba(6,15,40,0.78) 50%,
        rgba(0,60,45,0.50) 100%
      );
      z-index: 2147483645;
      display: none;
      pointer-events: none;
    }

    #axp-canvas-bg {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483644;
      display: none;
      pointer-events: none;
    }

    /* ── Form card ── */
    .form-container {
      background: rgba(255,255,255,0.045);
      backdrop-filter: blur(26px);
      -webkit-backdrop-filter: blur(26px);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 10px;
      width: 100%;
      max-width: 440px;
      box-sizing: border-box;
      display: none; /* hidden by default; toggleForms sets display:flex */
      flex-direction: column;
      padding: clamp(20px, 4vh, 36px) clamp(20px, 4vw, 36px) clamp(18px, 3vh, 30px);
      animation: axpSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
      overflow: visible;
      position: relative;
      z-index: 10;
    }
    @keyframes axpSlideUp {
      from { opacity:0; transform:translateY(24px) scale(0.98); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }

    .form-container .axp-brand {
      text-align: center;
      flex-shrink: 0;
      margin-bottom: clamp(6px, 1.2vh, 18px);
    }
    .form-container .axp-brand span {
      font-size: clamp(15px, 2.2vw, 19px);
      font-weight: 800;
      letter-spacing: 2.5px;
      color: #fff;
      text-transform: uppercase;
    }
    .form-container .axp-brand em {
      font-style: normal;
      color: #4ecca3;
    }
    .form-container .axp-brand p {
      font-size: 10.5px;
      color: rgba(255,255,255,0.38);
      margin: 3px 0 0;
      letter-spacing: 0.3px;
    }

    .form-container h2, .form-container h3 {
      color: #fff;
      font-size: clamp(13px, 2vw, 17px);
      font-weight: 600;
      margin: 0 0 2px;
      text-align: center;
      flex-shrink: 0;
    }
    .form-container .axp-subtitle {
      text-align: center;
      font-size: 12px;
      color: rgba(255,255,255,0.42);
      margin: 0 0 clamp(8px, 1.4vh, 16px);
      flex-shrink: 0;
    }

    /* ── LABELS ── */
    .form-container label {
      display: block;
      font-size: 8.5px;
      font-weight: 600;
      color: #a8f0da;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 3px;
      flex-shrink: 0;
      text-align: left;
    }

    .axp-field {
      margin-bottom: 7px;
      flex-shrink: 0;
    }
    .axp-input-wrap {
      position: relative;
    }
    .axp-input-wrap input,
    .axp-input-wrap select {
      width: 100%;
      background: rgba(255,255,255,0.055);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 4px;
      padding: 7px 36px 7px 11px;
      font-size: 12.5px;
      color: #fff;
      outline: none;
      transition: border-color 0.22s, background 0.22s;
      box-sizing: border-box;
      height: 34px;
      line-height: 1;
    }
    .axp-input-wrap input::placeholder { color: rgba(255,255,255,0.25); }
    .axp-input-wrap input:focus,
    .axp-input-wrap select:focus {
      border-color: rgba(78,204,163,0.65);
      background: rgba(78,204,163,0.06);
    }
    .axp-input-wrap input[style*="red"] {
      border-color: rgba(239,68,68,0.70) !important;
      background: rgba(239,68,68,0.05) !important;
    }
    .axp-input-wrap .axp-eye {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(255,255,255,0.35);
      cursor: pointer;
      font-size: 12px;
    }

    .axp-btn {
      width: 100%;
      background: #4ecca3;
      color: #060c1c;
      border: none;
      border-radius: 4px;
      padding: 0;
      height: 34px;
      font-size: 12.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      margin-top: 4px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      transition: opacity 0.18s;
      box-sizing: border-box;
    }
    .axp-btn:active { opacity: 0.85; }
    .axp-btn:disabled { opacity: 0.48; cursor: not-allowed; }

    .axp-links {
      text-align: center;
      font-size: 12px;
      color: rgba(255,255,255,0.38);
      margin-top: clamp(8px, 1.2vh, 14px);
      flex-shrink: 0;
    }
    .axp-links a {
      color: #4ecca3;
      text-decoration: none;
      font-weight: 500;
    }

    .axp-divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: clamp(8px, 1.2vh, 14px) 0;
      color: rgba(255,255,255,0.2);
      font-size: 11px;
      flex-shrink: 0;
    }
    .axp-divider::before, .axp-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,0.09);
    }

    .message-box {
      display: none;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      margin-bottom: clamp(6px, 1vh, 12px);
      flex-shrink: 0;
      animation: axpFdIn 0.3s ease;
    }
    @keyframes axpFdIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
    .message-box.success {
      background: rgba(78,204,163,0.12);
      border: 1px solid rgba(78,204,163,0.30);
      color: #4ecca3;
    }
    .message-box.error {
      background: rgba(239,68,68,0.11);
      border: 1px solid rgba(239,68,68,0.28);
      color: #f87171;
    }

    .social-btn { display: none !important; }

    /* ── PROCESSING OVERLAY ── */
    #axp-processing-overlay {
      position: fixed;
      inset: 0;
      z-index: 99998;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      background: rgba(6,12,28,0.82);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      animation: axpProcIn 0.25s ease;
    }
    @keyframes axpProcIn  { from{opacity:0} to{opacity:1} }
    @keyframes axpProcOut { from{opacity:1} to{opacity:0} }
    #axp-processing-overlay.axp-proc-out {
      animation: axpProcOut 0.38s ease forwards;
      pointer-events: none;
    }

    .axp-proc-ring {
      width: 52px;
      height: 52px;
    }
    .axp-proc-ring-track {
      stroke-dasharray: 138;
      stroke-dashoffset: 138;
      animation: axpProcArcDraw 0.7s ease forwards, axpProcArcSpin 1.1s linear 0.7s infinite;
      transform-origin: 26px 26px;
    }
    @keyframes axpProcArcDraw {
      to { stroke-dashoffset: 34; }
    }
    @keyframes axpProcArcSpin {
      to { transform: rotate(360deg); }
    }

    .axp-proc-label {
      font-size: 13.5px;
      font-weight: 500;
      color: rgba(255,255,255,0.75);
      letter-spacing: 0.4px;
    }

    .axp-proc-result {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      animation: axpFdIn 0.3s ease;
    }
    .axp-proc-result-icon {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .axp-proc-result-icon.success { background: rgba(78,204,163,0.18); color: #4ecca3; }
    .axp-proc-result-icon.error   { background: rgba(239,68,68,0.18);  color: #f87171; }
    .axp-proc-result-msg {
      font-size: 13.5px;
      font-weight: 500;
      text-align: center;
      max-width: 280px;
      line-height: 1.55;
      padding: 0 16px;
    }
    .axp-proc-result-msg.success { color: #4ecca3; }
    .axp-proc-result-msg.error   { color: #f87171; }
  `;
  document.head.appendChild(style);
}

function _injectVideoBackground() {
  if (document.getElementById("axp-video-bg") || document.getElementById("axp-canvas-bg")) return;

  /* Ensure Bootstrap Icons font is loaded for canvas icon rendering */
  if (!document.getElementById("axp-bi-font")) {
    const link = document.createElement("link");
    link.id   = "axp-bi-font";
    link.rel  = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
    document.head.appendChild(link);
  }

  /* Skip unreliable external video — go straight to the rich canvas animation */
  /* Give the BI font ~400ms to start loading, then launch canvas */
  setTimeout(_startCanvasFallback, 400);
}

function _startCanvasFallback() {
  if (document.getElementById("axp-canvas-bg")) return;
  const existingVid = document.getElementById("axp-video-bg");
  if (existingVid) existingVid.remove();

  const canvas = document.createElement("canvas");
  canvas.id = "axp-canvas-bg";
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:2147483644;display:block;pointer-events:none;";
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let W, H, frame = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  /* ── Bootstrap icon unicode paths (education/school themed) ── */
  const ICONS = [
    "\uF5A4", /* mortarboard-fill */
    "\uF39B", /* book-fill */
    "\uF38F", /* book-half */
    "\uF3A3", /* bookmark-fill */
    "\uF3C5", /* calculator-fill */
    "\uF496", /* clipboard-check-fill */
    "\uF4B2", /* display-fill */
    "\uF584", /* lightbulb-fill */
    "\uF4FF", /* pencil-fill */
    "\uF54E", /* person-fill */
    "\uF4C6", /* globe */
    "\uF62F", /* trophy-fill */
    "\uF65B", /* stars */
    "\uF4CA", /* graph-up */
    "\uF399", /* award-fill */
  ];

  /* ── Floating icon particles ── */
  const ICON_COUNT = 22;
  const icons = Array.from({ length: ICON_COUNT }, () => {
    const size = Math.random() * 22 + 14;
    return {
      x:    Math.random() * W,
      y:    Math.random() * H,
      size,
      icon: ICONS[Math.floor(Math.random() * ICONS.length)],
      dx:   (Math.random() - 0.5) * 0.4,
      dy:   -(Math.random() * 0.5 + 0.15),
      a:    Math.random() * 0.25 + 0.08,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.025 + 0.01,
      hue:  Math.random() > 0.6 ? "78,204,163" : Math.random() > 0.5 ? "100,180,255" : "200,150,255",
      trail: [],
    };
  });

  /* ── Small dot particles ── */
  const DOT_COUNT = 55;
  const dots = Array.from({ length: DOT_COUNT }, () => ({
    x:  Math.random() * W,
    y:  Math.random() * H,
    r:  Math.random() * 1.8 + 0.4,
    dx: (Math.random() - 0.5) * 0.28,
    dy: -(Math.random() * 0.35 + 0.1),
    a:  Math.random() * 0.4 + 0.1,
    hue: "78,204,163",
  }));

  /* ── Slow drifting gradient orbs ── */
  const ORBS = [
    { x: 0.15, y: 0.2,  r: 0.28, c: "rgba(78,204,163,0.07)",  dx: 0.0002, dy: 0.0001  },
    { x: 0.75, y: 0.6,  r: 0.22, c: "rgba(100,130,255,0.06)", dx:-0.0001, dy: 0.00015 },
    { x: 0.5,  y: 0.85, r: 0.2,  c: "rgba(200,100,255,0.05)", dx: 0.00015,dy:-0.0001  },
    { x: 0.88, y: 0.15, r: 0.18, c: "rgba(78,204,163,0.05)",  dx:-0.00015,dy: 0.0002  },
  ];

  const LINK = 120;

  function drawBg() {
    /* Deep gradient background */
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   "#020810");
    bg.addColorStop(0.4, "#050d22");
    bg.addColorStop(1,   "#021510");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* Drifting orbs */
    ORBS.forEach(o => {
      o.x += o.dx; o.y += o.dy;
      if (o.x < -0.3 || o.x > 1.3) o.dx *= -1;
      if (o.y < -0.3 || o.y > 1.3) o.dy *= -1;
      const grad = ctx.createRadialGradient(o.x*W, o.y*H, 0, o.x*W, o.y*H, o.r*Math.min(W,H));
      grad.addColorStop(0, o.c);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    });
  }

  function drawConnections() {
    /* Connect nearby icons to each other with teal lines */
    for (let i = 0; i < ICON_COUNT; i++) {
      for (let j = i + 1; j < ICON_COUNT; j++) {
        const dx = icons[i].x - icons[j].x, dy = icons[i].y - icons[j].y;
        const d  = Math.hypot(dx, dy);
        if (d < LINK) {
          ctx.beginPath();
          ctx.moveTo(icons[i].x, icons[i].y);
          ctx.lineTo(icons[j].x, icons[j].y);
          const alpha = 0.18 * (1 - d / LINK);
          ctx.strokeStyle = `rgba(78,204,163,${alpha})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }
    /* Connect icons to nearby dots */
    icons.forEach(ic => {
      dots.forEach(d => {
        const dx = ic.x - d.x, dy = ic.y - d.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 80) {
          ctx.beginPath();
          ctx.moveTo(ic.x, ic.y);
          ctx.lineTo(d.x, d.y);
          ctx.strokeStyle = `rgba(78,204,163,${0.08 * (1 - dist/80)})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      });
    });
  }

  function drawDots() {
    dots.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      if (p.x < -4) p.x = W + 4;
      if (p.x > W + 4) p.x = -4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue},${p.a})`;
      ctx.fill();
    });
  }

  function drawIcons() {
    icons.forEach(ic => {
      /* Move */
      ic.x += ic.dx; ic.y += ic.dy;
      ic.pulse += ic.pulseSpeed;
      if (ic.y < -40)  { ic.y = H + 40; ic.x = Math.random() * W; }
      if (ic.x < -40)  ic.x = W + 40;
      if (ic.x > W+40) ic.x = -40;

      /* Trail */
      ic.trail.push({ x: ic.x, y: ic.y });
      if (ic.trail.length > 12) ic.trail.shift();

      /* Draw trail */
      ic.trail.forEach((t, i) => {
        const ta = (i / ic.trail.length) * 0.06;
        ctx.beginPath();
        ctx.arc(t.x, t.y, ic.size * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ic.hue},${ta})`;
        ctx.fill();
      });

      /* Pulse glow ring */
      const pulseAlpha = (Math.sin(ic.pulse) * 0.5 + 0.5) * 0.12;
      const pulseR     = ic.size * (1.6 + Math.sin(ic.pulse) * 0.4);
      const glow = ctx.createRadialGradient(ic.x, ic.y, 0, ic.x, ic.y, pulseR);
      glow.addColorStop(0, `rgba(${ic.hue},${pulseAlpha})`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ic.x, ic.y, pulseR, 0, Math.PI * 2);
      ctx.fill();

      /* Icon glyph */
      const iconAlpha = ic.a + Math.sin(ic.pulse) * 0.06;
      ctx.save();
      ctx.font = `${ic.size}px "bootstrap-icons"`;
      ctx.fillStyle = `rgba(${ic.hue},${iconAlpha})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      /* Slight slow rotation */
      ctx.translate(ic.x, ic.y);
      ctx.rotate(Math.sin(ic.pulse * 0.3) * 0.08);
      ctx.fillText(ic.icon, 0, 0);
      ctx.restore();
    });
  }

  /* ── Shooting star effect ── */
  let stars = [];
  function spawnStar() {
    if (Math.random() > 0.015) return;
    stars.push({
      x: Math.random() * W, y: Math.random() * H * 0.5,
      len: Math.random() * 80 + 40,
      speed: Math.random() * 6 + 4,
      a: 0.7,
    });
  }
  function drawStars() {
    stars = stars.filter(s => s.a > 0.02);
    stars.forEach(s => {
      s.x += s.speed * 0.6; s.y += s.speed * 0.3; s.a -= 0.018;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.len * 0.6, s.y - s.len * 0.3);
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len*0.6, s.y - s.len*0.3);
      grad.addColorStop(0, `rgba(255,255,255,${s.a})`);
      grad.addColorStop(1, "transparent");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
  }

  (function draw() {
    frame++;
    drawBg();
    drawConnections();
    drawDots();
    drawIcons();
    spawnStar();
    drawStars();
    requestAnimationFrame(draw);
  })();
}

function applyDashboardStyles() {
  const s = document.createElement("style");
  s.textContent = `
    body {
      position: relative;
      font-family: 'Roboto', Arial, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      overflow-y: auto;
      margin: 0;
    }
    body::before { content: none; }
    #axp-video-bg, #axp-video-overlay { display: none !important; }
  `;
  document.head.appendChild(s);
}

function bindNavPopups() {
  const phoneLink = document.getElementById("phoneLink");
  const popup1    = document.getElementById("contact-popup");
  const overlay1  = document.getElementById("overlay1");
  if (phoneLink && popup1 && overlay1) {
    phoneLink.addEventListener("click", e => { e.preventDefault(); popup1.style.display="block"; overlay1.style.display="block"; });
    overlay1.addEventListener("click", () => { popup1.style.display="none"; overlay1.style.display="none"; });
  }

  const createLoginButton = document.getElementById("createLogin");
  const accountButton     = document.getElementById("accountButton");
  const popup             = document.getElementById("popup");
  const overlay           = document.getElementById("overlay");
  const loginButton       = document.getElementById("loginButton");
  const registerButton    = document.getElementById("registerButton");

  const showAuthPopup = e => {
    e.preventDefault();
    if (popup)   popup.style.display   = "block";
    if (overlay) overlay.style.display = "block";
  };
  if (createLoginButton) createLoginButton.addEventListener("click", showAuthPopup);
  if (accountButton)     accountButton.addEventListener("click",     showAuthPopup);
  if (overlay) {
    overlay.addEventListener("click", () => { popup.style.display="none"; overlay.style.display="none"; });
  }
  if (loginButton) {
    loginButton.addEventListener("click", e => { e.preventDefault(); popup.style.display="none"; overlay.style.display="none"; showFormPage("lg-form"); });
  }
  if (registerButton) {
    registerButton.addEventListener("click", e => { e.preventDefault(); popup.style.display="none"; overlay.style.display="none"; showFormPage("sp-form"); });
  }
}

function bindAuthLinks() {
  const registerLink = document.getElementById("registerLink");
  const loginLink    = document.getElementById("loginLink");
  if (registerLink) registerLink.addEventListener("click", e => { e.preventDefault(); showFormPage("sp-form"); });
  if (loginLink)    loginLink.addEventListener("click",    e => { e.preventDefault(); showFormPage("lg-form"); });
}

function showFormPage(formId) {
  _openAuthForm(formId);
}

function toggleForms(formIdToShow) {
  /* Hide all form-containers inside the overlay */
  const ov = document.getElementById("axp-auth-overlay");
  const containers = ov
    ? ov.querySelectorAll(".form-container")
    : document.querySelectorAll(".form-container");

  containers.forEach(f => f.style.display = "none");

  const sel = document.getElementById(formIdToShow);
  if (sel) sel.style.display = "flex";
}

function togglePasswordVisibility(inputName) {
  const f = document.querySelector(`input[name="${inputName}"]`);
  if (!f) return;
  const eye = f.nextElementSibling;
  if (f.type === "password") {
    f.type = "text";
    if (eye) { eye.classList.remove("fa-eye-slash"); eye.classList.add("fa-eye"); }
  } else {
    f.type = "password";
    if (eye) { eye.classList.remove("fa-eye"); eye.classList.add("fa-eye-slash"); }
  }
}

/* ─────────────────────────────────────────────────────
   PROCESSING OVERLAY helpers
───────────────────────────────────────────────────── */
function _showProcessingOverlay() {
  _removeProcessingOverlay();
  const ov = document.createElement("div");
  ov.id = "axp-processing-overlay";
  ov.innerHTML = `
    <svg class="axp-proc-ring" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="22" stroke="rgba(78,204,163,0.12)" stroke-width="3"/>
      <circle class="axp-proc-ring-track" cx="26" cy="26" r="22"
        stroke="#4ecca3" stroke-width="3" stroke-linecap="round"
        transform="rotate(-90 26 26)"/>
    </svg>
    <span class="axp-proc-label">Processing…</span>
  `;
  document.body.appendChild(ov);
}

function _showProcessingResult(success, message, onDone) {
  const ov = document.getElementById("axp-processing-overlay");
  if (!ov) { if (typeof onDone === "function") onDone(); return; }

  const icon = success ? "bi-check-circle-fill" : "bi-x-circle-fill";
  const cls  = success ? "success" : "error";

  ov.innerHTML = `
    <div class="axp-proc-result">
      <div class="axp-proc-result-icon ${cls}">
        <i class="bi ${icon}"></i>
      </div>
      <p class="axp-proc-result-msg ${cls}">${escapeHtml(message)}</p>
    </div>
  `;

  const delay = success ? 1200 : 2200;
  setTimeout(() => {
    ov.classList.add("axp-proc-out");
    setTimeout(() => {
      _removeProcessingOverlay();
      if (typeof onDone === "function") onDone();
    }, 400);
  }, delay);
}

function _removeProcessingOverlay() {
  const ov = document.getElementById("axp-processing-overlay");
  if (ov) ov.remove();
}

/* ─────────────────────────────────────────────────────
   SUBMIT FORM
───────────────────────────────────────────────────── */
function submitForm(action) {
  const formsAndButtons = {
    signup        : { formId: "signup-form",      buttonId: "submit1" },
    login         : { formId: "login-form",        buttonId: "submit"  },
    generateToken : { formId: "reset-form",        buttonId: "submit2" },
    resetPassword : { formId: "new-password-form", buttonId: "submit3" }
  };

  const config = formsAndButtons[action];
  if (!config) { showMessage("Invalid action specified", false); return; }

  const button = document.getElementById(config.buttonId);

  const form = document.getElementById(config.formId);
  if (!validateForm(form, action)) return;

  if (button) button.disabled = true;
  _showProcessingOverlay();

  const formData = new URLSearchParams(new FormData(form));
  formData.append("action", action);

  fetch(scriptURL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString()
  })
  .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
  .then(data => {
    const isSuccess = data.result === "success";

    if (isSuccess) {
      if (action === "login") {
        const username = form.querySelector('input[name="username"]').value.trim();
        const password = form.querySelector('input[name="loginPassword"]').value.trim();
        localStorage.setItem("isLoggedIn",  "true");
        localStorage.setItem("axpUsername", username);
        localStorage.setItem("axpPassword", password);

        _showProcessingResult(true, "Login successful!", () => {
          _closeAuthForm();
          _showLoadingScreen(() => {
            if (data.dashboardData) _renderDashboard(data.dashboardData);
            else loadDashboardData(username, password);
            displayDashboard();
          });
        });

      } else {
        let extra = "";
        if (action === "signup")        extra = "Registration successful! You can now log in.";
        if (action === "resetPassword") extra = "Password updated. Use your new password to log in.";
        if (action === "generateToken") extra = "Reset link sent! Check your email inbox.";

        _showProcessingResult(true, extra, () => {
          if (button) button.disabled = false;
          showSuccessOverlay(extra, () => toggleForms("lg-form"));
        });
      }
    } else {
      const errMsg = data.message || "An error occurred. Please try again.";
      _showProcessingResult(false, errMsg, () => {
        if (button) button.disabled = false;
        showMessage(errMsg, false);
      });
    }
  })
  .catch(err => {
    console.error("Submit error:", err);
    const errMsg = "Error connecting to server. Please try again.";
    _showProcessingResult(false, errMsg, () => {
      if (button) button.disabled = false;
      showMessage(errMsg, false);
    });
  });
}

function validateForm(form, action) {
  let isValid = true;

  form.querySelectorAll("input[required], select[required]").forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = "red";
      const label = input.previousElementSibling;
      showMessage(`${label ? label.textContent : "A field"} is required.`, false);
      isValid = false;
    } else { input.style.borderColor = ""; }
  });
  if (!isValid) return false;

  if (action === "signup" || action === "resetPassword") {
    const pw  = form.querySelector('input[name="password"], input[name="newPassword"]');
    const cpw = form.querySelector('input[name="confirmPassword"], input[name="newConfirmPassword"]');
    if (pw) {
      if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+={}[\]:;"'<>,.?/\-]{8,}$/.test(pw.value.trim())) {
        pw.style.borderColor = "red";
        showMessage("Password must be at least 8 characters and include letters and numbers.", false);
        isValid = false;
      } else { pw.style.borderColor = ""; }
    }
    if (isValid && pw && cpw && pw.value.trim() !== cpw.value.trim()) {
      cpw.style.borderColor = "red";
      showMessage("Passwords do not match.", false);
      isValid = false;
    } else if (cpw) { cpw.style.borderColor = ""; }
  }

  if (isValid && (action === "signup" || action === "generateToken")) {
    const ef = form.querySelector('input[name="email"]');
    if (ef) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ef.value.trim())) {
        ef.style.borderColor = "red";
        showMessage("Please enter a valid email address.", false);
        isValid = false;
      } else { ef.style.borderColor = ""; }
    }
  }

  if (isValid && action === "signup") {
    const pf = form.querySelector('input[name="phone"]');
    if (pf) {
      const clean = pf.value.replace(/\D/g, "");
      if (clean.length < 10 || clean.length > 15) {
        pf.style.borderColor = "red";
        showMessage("Please enter a valid Tanzanian phone number.", false);
        isValid = false;
      } else { pf.style.borderColor = ""; }
    }
  }

  if (action === "login") {
    const uf = form.querySelector('input[name="username"]');
    const pf = form.querySelector('input[name="loginPassword"]');
    if (!uf || !uf.value.trim()) { if (uf) uf.style.borderColor="red"; showMessage("Username is required.",false); isValid=false; }
    else if (uf) uf.style.borderColor = "";
    if (!pf || !pf.value.trim()) { if (pf) pf.style.borderColor="red"; showMessage("Password is required.",false); isValid=false; }
    else if (pf) pf.style.borderColor = "";
  }

  return isValid;
}

let _dashboardData   = {};
let globalUsername   = "";
let _operatorMessage = "";
let _announcements   = [];

async function loadDashboardData(username, password) {
  try {
    const url     = `${scriptURL}?action=schoolDashboard&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    const res     = await fetch(url);
    const parsed  = JSON.parse(await res.text());
    if (parsed.result === "success" && parsed.dashboardData) {
      _renderDashboard(parsed.dashboardData);
    } else {
      showDashboardError(parsed.message || "Failed to load dashboard data.");
    }
  } catch (e) {
    showDashboardError("Failed to connect to server. Please refresh.");
  }
}

function showDashboardError(msg) {
  const d = document.getElementById("dashboardError") || (() => {
    const el = document.createElement("div");
    el.id = "dashboardError";
    el.style.cssText = "background:#fef2f2;color:#b91c1c;padding:12px 18px;border-radius:4px;margin:15px;font-size:13.5px;border:1px solid #fca5a5;";
    const mc = document.getElementById("mainContent");
    if (mc) mc.prepend(el);
    return el;
  })();
  d.textContent = msg;
  d.style.display = "block";
}

function _renderDashboard(data) {
  _dashboardData   = data;
  globalUsername   = data.username    || "Admin";
  _operatorMessage = data.operatorNote || "";
  _announcements   = Array.isArray(data.announcements) ? data.announcements : [];

  _setText("schoolName", data.schoolname  || "Unknown School");
  _setText("regionName", data.schoolindex || "N/A");
  _setText("userName",   data.username    || "Admin");

  _renderStatusBanner(data.status, data.statusLabel, data.balance, data.lastPaymentDate);

  _setText("messageCount",      _operatorMessage ? 1 : 0);
  _setText("notificationCount", 0);

  if (data.schoolindex && typeof window.setupDynamicMenuLinks === "function") {
    window.setupDynamicMenuLinks(data.schoolindex);
  }
  _setupShareLink(data.schoolindex);
  _renderOperatorMessage(_operatorMessage);
  displayAnnouncements({ announcements: _announcements });
}

function _setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function _renderStatusBanner(status, statusLabel, balance, lastPaymentDate) {
  const existing = document.getElementById("statusBanner");
  if (existing) existing.remove();

  const cfg = {
    ACTIVE          : { bg:"#ecfdf5", border:"#10b981", color:"#065f46", icon:"bi-check-circle-fill",       label:"Account Active" },
    PENDING         : { bg:"#fffbeb", border:"#f59e0b", color:"#92400e", icon:"bi-hourglass-split",          label:"Pending Activation &mdash; please pay the activation fee" },
    INACTIVE        : { bg:"#fdf2f8", border:"#db2777", color:"#831843", icon:"bi-slash-circle-fill",        label:"Account Inactive &mdash; contact support" },
    SUSPENDED       : { bg:"#fef2f2", border:"#ef4444", color:"#991b1b", icon:"bi-ban",                      label:"Account Suspended &mdash; contact support immediately" },
    DORMANT         : { bg:"#faf5ff", border:"#a855f7", color:"#581c87", icon:"bi-moon-fill",                label:"Account Dormant" },
    WARNING         : { bg:"#fff7ed", border:"#f97316", color:"#9a3412", icon:"bi-exclamation-triangle-fill",label:"Warning on Account &mdash; contact support" },
    AWAITING_DELETE : { bg:"#fafaf9", border:"#78716c", color:"#44403c", icon:"bi-trash3-fill",              label:"Account Deletion Requested &mdash; pending operator review" }
  }[status] || { bg:"#fffbeb", border:"#f59e0b", color:"#92400e", icon:"bi-hourglass-split", label: status || "Unknown" };

  let extraInfo = "";
  if (balance !== undefined && balance !== "") {
    extraInfo += `<span style="font-size:13px;opacity:0.85;display:flex;align-items:center;gap:5px;"><i class="bi bi-wallet2"></i> TZS ${Number(balance).toLocaleString()}</span>`;
  }
  if (lastPaymentDate) {
    extraInfo += `<span style="font-size:12px;opacity:0.7;display:flex;align-items:center;gap:5px;"><i class="bi bi-calendar-check"></i> ${lastPaymentDate}</span>`;
  }

  const banner = document.createElement("div");
  banner.id = "statusBanner";
  banner.style.cssText = `background:${cfg.bg};border-left:4px solid ${cfg.border};color:${cfg.color};padding:13px 18px;border-radius:4px;margin:15px 0;font-size:13.5px;font-weight:500;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;`;
  banner.innerHTML = `
    <span style="display:flex;align-items:center;gap:8px;"><i class="bi ${cfg.icon}" style="font-size:15px;"></i>${cfg.label}</span>
    <span style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">${extraInfo}</span>
  `;

  const planBanner  = document.getElementById("planBanner");
  const mainContent = document.getElementById("mainContent");
  if (planBanner)        planBanner.insertAdjacentElement("afterend", banner);
  else if (mainContent)  mainContent.prepend(banner);
}

function _setupShareLink(schoolIndex) {
  const shareLinkSection = document.getElementById("shareLinkSection");
  if (!shareLinkSection || !schoolIndex) return;
  const shareableLink = `https://www.academixpoint.com/p/${schoolIndex.toLowerCase()}-teachers-feeding-area.html`;
  shareLinkSection.innerHTML = `
    <p>Share this link with your teachers:</p>
    <div class='link-text'>
      <i class='bi bi-link-45deg'></i>
      <button id="copyShareBtn" style="background:none;border:none;color:#4ecca3;font-weight:600;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:5px;padding:0;">
        <i class='bi bi-clipboard'></i><span>Copy Link</span>
      </button>
    </div>
  `;
  const copyBtn = document.getElementById("copyShareBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(shareableLink).then(() => {
        const toast = document.getElementById("copyToast");
        if (toast) { toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 3000); }
      }).catch(() => alert("Failed to copy link."));
    });
  }
}

function _renderOperatorMessage(message) {
  const existing = document.getElementById("operatorMessageSection");
  if (existing) existing.remove();
  if (!message || !message.trim()) return;
  const planDiv = document.querySelector(".plan, [class*='plan']");
  if (!planDiv) return;
  const section = document.createElement("div");
  section.id = "operatorMessageSection";
  section.style.cssText = "background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:4px;padding:20px;margin:20px 0;box-shadow:0 4px 15px rgba(102,126,234,0.3);color:white;";
  section.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <i class="bi bi-chat-left-text-fill" style="font-size:19px;color:#ffd700;"></i>
      <h3 style="margin:0;font-size:15.5px;font-weight:600;">Message from AcademixPoint</h3>
    </div>
    <div style="background:rgba(255,255,255,0.12);border-radius:4px;padding:14px;white-space:pre-wrap;line-height:1.6;font-size:13.5px;">
      ${escapeHtml(message)}
    </div>
  `;
  planDiv.insertAdjacentElement("afterend", section);
}

function displayAnnouncements(data) {
  const insertAfter = document.getElementById("operatorMessageSection") || document.getElementById("statusBanner") || document.querySelector(".plan, [class*='plan']");
  if (!insertAfter) return;
  const existing = document.getElementById("announcementsSection");
  if (existing) existing.remove();
  const announcements = data.announcements;
  if (!announcements || !Array.isArray(announcements) || !announcements.length) return;

  const section = document.createElement("div");
  section.id = "announcementsSection";
  section.style.cssText = "background:#fff;border-radius:4px;padding:20px;margin:20px 0;box-shadow:0 2px 12px rgba(0,0,0,0.07);";

  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #f0f0f0;";
  header.innerHTML = `
    <i class="bi bi-megaphone-fill" style="font-size:19px;color:#4ecca3;"></i>
    <h3 style="margin:0;font-size:15.5px;font-weight:600;color:#1e293b;">Announcements</h3>
    <span style="margin-left:auto;background:#4ecca3;color:white;padding:3px 10px;border-radius:3px;font-size:12px;font-weight:600;">${announcements.length} Active</span>
  `;
  section.appendChild(header);

  const list = document.createElement("div");
  list.style.cssText = "display:flex;flex-direction:column;gap:12px;";
  const priorityColors = { High:"#ef4444", Medium:"#f59e0b", Low:"#3b82f6" };

  announcements.forEach(ann => {
    const color = priorityColors[ann.priority] || "#94a3b8";
    const card  = document.createElement("div");
    card.style.cssText = `background:#f8fafc;border-left:4px solid ${color};border-radius:3px;padding:14px;`;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:7px;">
        <h4 style="margin:0;font-size:14px;font-weight:600;color:#1e293b;">${escapeHtml(ann.title)}</h4>
        <span style="background:${color};color:white;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:600;white-space:nowrap;margin-left:8px;">${escapeHtml(ann.priority||"Normal")}</span>
      </div>
      <p style="margin:0 0 9px;color:#475569;line-height:1.6;font-size:13.5px;">${escapeHtml(ann.message)}</p>
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#94a3b8;">
        <i class="bi bi-calendar3"></i>
        <span>${formatAnnouncementDate(ann.date)}</span>
        <span style="margin-left:auto;">ID: ${ann.id||""}</span>
      </div>
    `;
    list.appendChild(card);
  });
  section.appendChild(list);
  insertAfter.insertAdjacentElement("afterend", section);
}

function formatAnnouncementDate(dateString) {
  try {
    const date = new Date(dateString);
    const now  = new Date();
    const d    = Math.floor(Math.abs(now - date) / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 7)  return `${d} days ago`;
    return date.toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" });
  } catch { return dateString; }
}

function displayDashboard() {
  /* Hide homepage elements immediately — before closing overlay — to prevent flash */
  ["#header","#main-id",".footer",".footer-bottom"].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.style.display = "none";
  });
  /* Also hide body-level page content wrappers your template may use */
  ["#home","#landing","#page-wrapper",".page-content",".home-section",
   ".hero","#hero","main","#content"].forEach(sel => {
    const el = document.querySelector(sel);
    /* Only hide if it's NOT the dashboard itself */
    if (el && el.id !== "dashboard" && !el.closest("#dashboard")) {
      el.style.display = "none";
    }
  });

  _closeAuthForm();
  applyDashboardStyles();

  const dashDiv = document.getElementById("dashboard");
  if (dashDiv) dashDiv.style.display = "block";

  const lf = document.querySelector(".login-form");
  if (lf) lf.style.display = "none";

  setupDashboardInteractions();
}

function setupDashboardInteractions() {
  const sidebar        = document.getElementById("sidebar");
  const sidebarToggle  = document.getElementById("sidebarToggle");
  const mainContent    = document.getElementById("mainContent");
  const menuToggle     = document.getElementById("menuToggle");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      mainContent.classList.toggle("expanded");
      const icon = sidebarToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("bi-chevron-left",  !sidebar.classList.contains("collapsed"));
        icon.classList.toggle("bi-chevron-right",  sidebar.classList.contains("collapsed"));
      }
    });
  }
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      if (sidebarOverlay) sidebarOverlay.classList.toggle("active");
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      sidebarOverlay.classList.remove("active");
    });
  }

  const closeBanner = document.getElementById("closeBanner");
  const planBanner  = document.getElementById("planBanner");
  if (closeBanner && planBanner) closeBanner.addEventListener("click", () => planBanner.style.display = "none");

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      ["isLoggedIn","axpUsername","axpPassword"].forEach(k => localStorage.removeItem(k));
      location.reload();
    });
  }

  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach(item => {
    item.addEventListener("click", function(e) {
      if (this.getAttribute("data-section") && !this.id) e.preventDefault();
      menuItems.forEach(mi => mi.classList.remove("active"));
      this.classList.add("active");
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("active");
        if (sidebarOverlay) sidebarOverlay.classList.remove("active");
      }
    });
  });

  const notificationBtn = document.getElementById("notificationBtn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", e => {
      e.stopPropagation();
      _closePopupOfType("message");
      const existing = document.querySelector("[data-popup='notification']");
      if (existing) { existing.remove(); return; }
      document.body.appendChild(_buildPopup("notification","bi-bell","Notifications",[]));
      _ensurePopupStyles();
    });
  }

  const messageBtn = document.getElementById("messageBtn");
  if (messageBtn) {
    messageBtn.addEventListener("click", e => {
      e.stopPropagation();
      _closePopupOfType("notification");
      const existing = document.querySelector("[data-popup='message']");
      if (existing) { existing.remove(); return; }
      const messages = _operatorMessage ? [_operatorMessage] : [];
      document.body.appendChild(_buildPopup("message","bi-chat-dots","Messages",messages,true));
      _ensurePopupStyles();
    });
  }

  document.addEventListener("click", e => {
    if (!e.target.closest("[data-popup]") && !e.target.closest(".icon-btn")) {
      document.querySelectorAll("[data-popup]").forEach(p => p.remove());
    }
  });

  const userProfile = document.getElementById("userProfile");
  if (userProfile) userProfile.addEventListener("click", () => alert("Profile settings coming soon!"));
}

function _closePopupOfType(type) {
  const el = document.querySelector(`[data-popup='${type}']`);
  if (el) el.remove();
}

function _buildPopup(type, icon, title, items, isMessage = false) {
  const popup = document.createElement("div");
  popup.setAttribute("data-popup", type);
  popup.className = "notification-popup";
  let body = items.length > 0
    ? items.map(item => `
        <div class="popup-item">
          <div class="popup-item-icon ${isMessage?"message-icon":""}">
            <i class="bi ${isMessage?"bi-envelope":"bi-info-circle"}"></i>
          </div>
          <div class="popup-item-content">
            <p>${escapeHtml(item)}</p>
            <span class="popup-item-time">From AcademixPoint</span>
          </div>
        </div>`).join("")
    : `<div class="popup-empty">
        <i class="bi ${isMessage?"bi-chat-slash":"bi-bell-slash"}"></i>
        <p>No ${isMessage?"messages":"notifications"} available</p>
       </div>`;
  popup.innerHTML = `
    <div class="popup-header">
      <h4><i class="bi ${icon}"></i> ${title}</h4>
      <button class="popup-close" onclick="this.closest('[data-popup]').remove()"><i class="bi bi-x"></i></button>
    </div>
    <div class="popup-body">${body}</div>
  `;
  return popup;
}

function showMessage(message, success = true) {
  const ov = document.getElementById("axp-auth-overlay");
  const visibleForm = ov
    ? ov.querySelector(".form-container[style*='flex']")
    : document.querySelector(".form-container[style*='flex']");
  if (!visibleForm) return;
  let mb = visibleForm.querySelector(".message-box");
  if (!mb) { mb = document.createElement("div"); mb.className = "message-box"; visibleForm.prepend(mb); }
  mb.style.display = "block";
  mb.className     = `message-box ${success ? "success" : "error"}`;
  mb.textContent   = message;
  setTimeout(() => { mb.style.display = "none"; }, 6000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function _ensureSpinnerStyle() {
  /* kept for backward compatibility */
}

function _showLoadingScreen(onDone) {
  if (document.getElementById("axp-ls")) return;

  const screen = document.createElement("div");
  screen.id = "axp-ls";
  screen.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:#060c1c;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:36px;
  `;

  screen.innerHTML = `
    <div class="axp-ls-brand">
      <div class="axp-ls-logo-ring">
        <svg viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="27" stroke="rgba(78,204,163,0.12)" stroke-width="2"/>
          <circle class="axp-ls-spin-arc" cx="30" cy="30" r="27"
            stroke="#4ecca3" stroke-width="2"
            stroke-dasharray="50 120" stroke-linecap="round"
            transform="rotate(-90 30 30)"/>
        </svg>
        <i class="bi bi-mortarboard-fill" style="
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          font-size:22px;color:#4ecca3;
        "></i>
      </div>
      <div class="axp-ls-wordmark">
        Academix<em>Point</em>
      </div>
      <div class="axp-ls-tagline">School Management System</div>
    </div>

    <div class="axp-ls-track-wrap">
      <div class="axp-ls-track">
        <div id="axp-ls-fill" class="axp-ls-fill"></div>
        <div class="axp-ls-sheen"></div>
      </div>
      <div class="axp-ls-pct" id="axp-ls-pct">0%</div>
    </div>

    <div class="axp-ls-status">
      <span class="axp-ls-dot"></span>
      <span class="axp-ls-dot"></span>
      <span class="axp-ls-dot"></span>
      <p id="axp-ls-msg" class="axp-ls-msg">Initializing...</p>
    </div>
  `;

  if (!document.getElementById("axp-ls-styles")) {
    const s = document.createElement("style");
    s.id = "axp-ls-styles";
    s.textContent = `
      @keyframes axpLsArcSpin {
        to { transform: rotate(270deg); }
      }
      .axp-ls-spin-arc {
        transform-origin: 30px 30px;
        animation: axpLsArcSpin 1.1s linear infinite;
      }
      .axp-ls-brand {
        display:flex;flex-direction:column;align-items:center;gap:14px;
        animation: axpLsBrandIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
      }
      @keyframes axpLsBrandIn {
        from { opacity:0; transform:translateY(18px); }
        to   { opacity:1; transform:translateY(0); }
      }
      .axp-ls-logo-ring {
        position:relative;width:60px;height:60px;
      }
      .axp-ls-logo-ring svg { width:100%;height:100%; }
      .axp-ls-wordmark {
        font-size:22px;font-weight:800;letter-spacing:2.5px;
        color:#fff;text-transform:uppercase;
      }
      .axp-ls-wordmark em {
        font-style:normal;color:#4ecca3;
      }
      .axp-ls-tagline {
        font-size:10.5px;color:rgba(255,255,255,0.28);
        letter-spacing:2px;text-transform:uppercase;
      }

      .axp-ls-track-wrap {
        display:flex;flex-direction:column;align-items:center;gap:10px;
        animation: axpLsBrandIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s both;
      }
      .axp-ls-track {
        position:relative;width:220px;height:2px;
        background:rgba(255,255,255,0.07);overflow:hidden;
      }
      .axp-ls-fill {
        height:100%;width:0%;
        background:linear-gradient(90deg,#4ecca3,#2ecc71);
        transition:width 0.55s cubic-bezier(0.4,0,0.2,1);
      }
      .axp-ls-sheen {
        position:absolute;inset:0;
        background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
        animation:axpLsSheen 1.6s ease infinite;
      }
      @keyframes axpLsSheen {
        0%   { transform:translateX(-100%); }
        100% { transform:translateX(400%); }
      }
      .axp-ls-pct {
        font-size:11px;color:rgba(78,204,163,0.6);
        letter-spacing:0.5px;font-variant-numeric:tabular-nums;
      }

      .axp-ls-status {
        display:flex;align-items:center;gap:8px;
        animation: axpLsBrandIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.3s both;
      }
      .axp-ls-dot {
        width:4px;height:4px;border-radius:50%;background:#4ecca3;opacity:0.35;
        animation:axpLsDotPulse 1.2s ease infinite;
      }
      .axp-ls-dot:nth-child(2) { animation-delay:0.2s; }
      .axp-ls-dot:nth-child(3) { animation-delay:0.4s; }
      @keyframes axpLsDotPulse {
        0%,100% { opacity:0.25;transform:scale(1); }
        50%     { opacity:0.9;transform:scale(1.5); }
      }
      .axp-ls-msg {
        font-size:12.5px;color:rgba(255,255,255,0.38);
        letter-spacing:0.4px;margin:0;
        transition:opacity 0.22s ease;
      }

      .axp-ls-out {
        animation:axpLsFadeOut 0.55s ease forwards !important;
      }
      @keyframes axpLsFadeOut {
        0%   { opacity:1; }
        100% { opacity:0; pointer-events:none; }
      }
    `;
    document.head.appendChild(s);
  }

  document.body.appendChild(screen);

  const fill  = screen.querySelector("#axp-ls-fill");
  const pctEl = screen.querySelector("#axp-ls-pct");
  const msgEl = screen.querySelector("#axp-ls-msg");

  const steps = [
    { pct: 22, msg: "Verifying credentials..."    },
    { pct: 48, msg: "Loading school profile..."   },
    { pct: 74, msg: "Preparing your dashboard..." },
    { pct: 92, msg: "Almost ready..."             },
    { pct: 100, msg: "Done!"                      }
  ];

  let i = 0;
  function next() {
    if (i >= steps.length) return;
    const step = steps[i++];
    fill.style.width    = step.pct + "%";
    pctEl.textContent   = step.pct + "%";
    msgEl.style.opacity = "0";
    setTimeout(() => {
      msgEl.textContent   = step.msg;
      msgEl.style.opacity = "1";
    }, 200);
    if (i < steps.length) setTimeout(next, 620);
  }
  next();

  setTimeout(() => {
    screen.classList.add("axp-ls-out");
    setTimeout(() => {
      if (document.body.contains(screen)) document.body.removeChild(screen);
      if (typeof onDone === "function") onDone();
    }, 560);
  }, 3100);
}

function showSuccessOverlay(message, onComplete) {
  const existingOv = document.getElementById("axp-success-overlay");
  if (existingOv) existingOv.remove();

  if (!document.getElementById("axp-success-styles")) {
    const style = document.createElement("style");
    style.id = "axp-success-styles";
    style.textContent = `
      #axp-success-overlay {
        position:fixed;inset:0;z-index:999999;
        background:#060c1c;
        display:flex;align-items:center;justify-content:center;
        padding:24px;
        animation:axpSoIn 0.4s ease;
      }
      @keyframes axpSoIn  { from{opacity:0} to{opacity:1} }
      @keyframes axpSoOut { from{opacity:1} to{opacity:0;pointer-events:none} }

      .axp-so-canvas {
        position:absolute;inset:0;pointer-events:none;z-index:0;
      }

      .axp-so-box {
        position:relative;z-index:1;
        display:flex;flex-direction:column;align-items:center;gap:22px;
        max-width:320px;width:100%;text-align:center;
        animation:axpSoBoxIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s both;
      }
      @keyframes axpSoBoxIn {
        from { opacity:0;transform:scale(0.90) translateY(20px); }
        to   { opacity:1;transform:scale(1) translateY(0); }
      }

      .axp-so-icon-wrap {
        position:relative;width:110px;height:110px;
      }
      .axp-so-icon-wrap svg {
        width:110px;height:110px;position:absolute;top:0;left:0;
      }

      .axp-so-track {
        stroke-dasharray: 298;
        stroke-dashoffset: 298;
        animation: axpSoCircleDraw 1s cubic-bezier(0.4,0,0.2,1) 0.2s forwards;
      }
      @keyframes axpSoCircleDraw { to { stroke-dashoffset: 0; } }

      .axp-so-tick {
        stroke-dasharray: 60;
        stroke-dashoffset: 60;
        animation: axpSoTickDraw 0.45s ease 1.1s forwards;
      }
      @keyframes axpSoTickDraw { to { stroke-dashoffset: 0; } }

      .axp-so-title {
        margin:0;font-size:26px;font-weight:700;color:#fff;letter-spacing:0.3px;
        animation:axpSoTextIn 0.4s ease 0.65s both;
      }
      .axp-so-msg {
        margin:0;font-size:14px;color:rgba(255,255,255,0.42);line-height:1.65;
        animation:axpSoTextIn 0.4s ease 0.8s both;
      }
      @keyframes axpSoTextIn {
        from { opacity:0;transform:translateY(10px); }
        to   { opacity:1;transform:translateY(0); }
      }

      .axp-so-progress {
        width:140px;height:2px;
        background:rgba(255,255,255,0.07);
        overflow:hidden;
        animation:axpSoTextIn 0.4s ease 1s both;
      }
      .axp-so-progress-fill {
        height:100%;width:100%;
        background:linear-gradient(90deg,#4ecca3,#2ecc71);
        transform-origin:left;
        animation:axpSoProgressDrain 5.8s linear 1.2s forwards;
      }
      @keyframes axpSoProgressDrain {
        from { transform:scaleX(1); }
        to   { transform:scaleX(0); }
      }

      .axp-so-btn {
        background:#4ecca3;color:#060c1c;border:none;border-radius:4px;
        padding:12px 32px;font-size:14px;font-weight:700;letter-spacing:0.4px;
        cursor:pointer;display:flex;align-items:center;gap:8px;
        animation:axpSoTextIn 0.4s ease 1.15s both;
      }
      .axp-so-btn:active { opacity:0.84; }

      @media(max-width:480px){
        .axp-so-icon-wrap { width:88px;height:88px; }
        .axp-so-icon-wrap svg { width:88px;height:88px; }
        .axp-so-title { font-size:22px; }
      }
      @media(prefers-reduced-motion:reduce){
        .axp-so-track,.axp-so-tick,.axp-so-box,
        .axp-so-title,.axp-so-msg,.axp-so-btn,
        .axp-so-progress-fill { animation:none!important; }
        .axp-so-track { stroke-dashoffset:0; }
        .axp-so-tick  { stroke-dashoffset:0; }
        .axp-so-progress-fill { transform:scaleX(0); }
      }
    `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement("div");
  overlay.id = "axp-success-overlay";

  const cvs = document.createElement("canvas");
  cvs.className = "axp-so-canvas";

  overlay.appendChild(cvs);
  overlay.innerHTML += `
    <div class="axp-so-box">
      <div class="axp-so-icon-wrap">
        <svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="55" cy="55" r="47" stroke="rgba(78,204,163,0.10)" stroke-width="2.5"/>
          <circle class="axp-so-track" cx="55" cy="55" r="47"
            stroke="#4ecca3" stroke-width="2.5"
            stroke-linecap="round"
            transform="rotate(-90 55 55)"/>
          <path class="axp-so-tick"
            d="M33 55 L47 70 L77 40"
            stroke="#4ecca3" stroke-width="3.5"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="axp-so-title">Success</h3>
      <p class="axp-so-msg">${escapeHtml(message)}</p>
      <div class="axp-so-progress">
        <div class="axp-so-progress-fill"></div>
      </div>
      <button class="axp-so-btn" id="axp-so-cta">
        <i class="bi bi-arrow-right"></i> Continue
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
  _runSuccessParticles(cvs);

  const close = () => {
    overlay.style.animation = "axpSoOut 0.38s ease forwards";
    setTimeout(() => {
      if (document.body.contains(overlay)) overlay.remove();
      if (typeof onComplete === "function") onComplete();
    }, 380);
  };

  const cta = overlay.querySelector("#axp-so-cta");
  if (cta) cta.addEventListener("click", close);
  setTimeout(close, 7200);
}

function _runSuccessParticles(canvas) {
  const ctx = canvas.getContext("2d");
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  const particles = Array.from({ length: 52 }, (_, i) => {
    const angle = (i / 52) * Math.PI * 2;
    const speed = Math.random() * 3.8 + 1.8;
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r:  Math.random() * 3.2 + 0.8,
      a:  1,
      col: Math.random() > 0.45 ? "78,204,163" : "46,204,113"
    };
  });

  let frame = 0;
  (function tick() {
    if (frame >= 95) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.09;
      p.a  -= 0.012;
      if (p.a <= 0) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.col},${p.a})`;
      ctx.fill();
    });
    frame++;
    requestAnimationFrame(tick);
  })();
}

function _ensurePopupStyles() {
  if (document.getElementById("popup-styles")) return;
  const style = document.createElement("style");
  style.id = "popup-styles";
  style.textContent = `
    .notification-popup {
      position:fixed;top:70px;right:20px;background:white;
      border-radius:4px;box-shadow:0 8px 28px rgba(0,0,0,0.14);
      z-index:100000;max-width:420px;width:calc(100% - 40px);
      max-height:calc(100vh - 100px);overflow:hidden;
      display:flex;flex-direction:column;
      animation:axpPopIn 0.25s cubic-bezier(0.22,1,0.36,1);
    }
    @keyframes axpPopIn {
      from{opacity:0;transform:translateY(-6px) scale(0.97)}
      to{opacity:1;transform:translateY(0) scale(1)}
    }
    .popup-header {
      display:flex;justify-content:space-between;align-items:center;
      padding:16px 20px;border-bottom:1px solid #e9ecef;background:#f8f9fa;
    }
    .popup-header h4 { margin:0;font-size:15.5px;font-weight:600;color:#1e293b;display:flex;align-items:center;gap:10px; }
    .popup-header h4 i { color:#4ecca3;font-size:17px; }
    .popup-close { background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:3px; }
    .popup-body { overflow-y:auto;max-height:calc(100vh - 175px); }
    .popup-item { display:flex;gap:13px;padding:13px 20px;border-bottom:1px solid #f0f0f0;cursor:pointer; }
    .popup-item:last-child { border-bottom:none; }
    .popup-item-icon { width:36px;height:36px;min-width:36px;border-radius:3px;background:#e3f2fd;display:flex;align-items:center;justify-content:center;color:#2088bd;font-size:15px; }
    .popup-item-icon.message-icon { background:#e8f5e9;color:#28a745; }
    .popup-item-content { flex:1;min-width:0; }
    .popup-item-content p { margin:0 0 4px;font-size:13.5px;color:#334155;line-height:1.5;word-wrap:break-word; }
    .popup-item-time { font-size:11.5px;color:#94a3b8; }
    .popup-empty { padding:36px 20px;text-align:center;color:#94a3b8; }
    .popup-empty i { font-size:40px;margin-bottom:10px;opacity:0.4;display:block; }
    .popup-empty p { margin:0;font-size:13px; }
    @media(max-width:768px){
      .notification-popup{top:60px;right:10px;left:10px;width:calc(100% - 20px);}
    }
  `;
  document.head.appendChild(style);
}
