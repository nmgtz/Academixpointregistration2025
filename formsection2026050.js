const scriptURL = 'https://script.google.com/macros/s/AKfycbzMgObVVz7NN0Ltczpvh6poH90wNoQVedbni98jwNP6g-VYpuWP6RX0uRRxpu-8PrpR/exec';

/* ─── New global vars for school management ─────────────────── */
let _appScriptSchoolId = null;
let _schoolMeta        = null;

document.addEventListener("DOMContentLoaded", () => {
  applyLandingStyles();
  bindNavPopups();
  bindAuthLinks();

  const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; 

  const isLoggedIn   = localStorage.getItem("isLoggedIn") === "true";
  const loginTime    = parseInt(localStorage.getItem("axpLoginTime") || "0", 10);
  const sessionValid = isLoggedIn && (Date.now() - loginTime < SESSION_DURATION_MS);

  if (!sessionValid && isLoggedIn) {
    // Session expired — clear and force re-login
    ["isLoggedIn","axpUsername","axpPassword","axpLoginTime"].forEach(k => localStorage.removeItem(k));
    _openAuthForm("lg-form");
  } else if (sessionValid) {
    const savedUsername = localStorage.getItem("axpUsername") || "";
    const savedPassword = localStorage.getItem("axpPassword") || "";
    if (savedUsername && savedPassword) {
      ["#header","#main-id",".footer",".footer-bottom",
       "#home","#landing","#page-wrapper",".page-content",
       ".home-section",".hero","#hero","main","#content"].forEach(sel => {
        const el = document.querySelector(sel);
        if (el && el.id !== "dashboard" && !el.closest("#dashboard")) {
          el.style.display = "none";
        }
      });
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

/* ─────────────────────────────────────────────────────────────
   AUTH OVERLAY
───────────────────────────────────────────────────────────── */
function _ensureAuthOverlay() {
  if (document.getElementById("axp-auth-overlay")) return;
  applyLandingStyles();

  document.querySelectorAll(".login-form, .form-container").forEach(el => {
    if (!el.closest("#axp-auth-overlay")) el.remove();
  });
  ["lg-form","sp-form","set-form","newSet-form",
   "login-form","signup-form","reset-form","new-password-form"].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.closest("#axp-auth-overlay")) el.remove();
  });

  const ov = document.createElement("div");
  ov.id = "axp-auth-overlay";
  ov.style.cssText = [
    "position:fixed","top:0","left:0","width:100%","height:100%",
    "z-index:2147483647","display:none","box-sizing:border-box",
    "background:transparent","overflow:hidden","align-items:center",
    "overflow-x:hidden","text-align:left"
  ].join(";");
  document.body.appendChild(ov);

  const loginForm = document.createElement("div");
  loginForm.className = "login-form";
  loginForm.style.cssText = [
    "display:flex","flex-direction:column","align-items:stretch",
    "width:100%","max-width:440px","padding:20px 16px","box-sizing:border-box",
    "position:relative","z-index:10","margin-left:21%","margin-right:auto",
    "margin-top:0","margin-bottom:0"
  ].join(";");
  ov.appendChild(loginForm);

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

  const brand = `
    <div class="axp-brand">
      <span>ACADEMIX<em>POINT</em></span>
      <p>School Management System</p>
    </div>`;

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
      No account?&nbsp;<a href="#" onclick="axpShowRegisterNotice();return false;">Register here</a>
    </div>`;

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
  if (ov) ov.style.display = "flex";

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
    body::before { content: none; }
    body > .login-form { display: none !important; }
    #axp-auth-overlay {
      display: none; position: fixed; top: 0; left: 0;
      width: 100%; height: 100%; z-index: 2147483647;
      background: transparent; overflow: hidden;
      box-sizing: border-box; align-items: center;
    }
    #axp-auth-overlay .login-form {
      display: flex !important; flex-direction: column;
      align-items: stretch; width: 100%; max-width: 440px;
      padding: 0 16px; box-sizing: border-box; position: relative;
      z-index: 10; margin-top: 0; margin-bottom: 0;
      margin-left: 21%; margin-right: auto; flex-shrink: 0;
    }
    @media (max-width: 500px) {
      #axp-auth-overlay { overflow-y: auto; overflow-x: hidden; align-items: flex-start; }
      #axp-auth-overlay .login-form {
        display: flex !important; width: 98% !important; max-width: 98% !important;
        padding: 12px 8px !important; margin: 0 !important;
        position: relative !important; left: -47% !important; box-sizing: border-box !important;
      }
      #axp-auth-overlay .form-container { border-radius: 6px; max-width: 100%; width: 100%; margin: 0; padding: 14px 12px !important; }
      .form-container .axp-brand span { font-size: 13px !important; letter-spacing: 1.5px !important; }
      .form-container .axp-brand p { font-size: 9px !important; }
      .form-container h2 { font-size: 12px !important; margin-bottom: 1px !important; }
      .form-container .axp-subtitle { font-size: 10px !important; margin-bottom: 8px !important; }
      .form-container label { font-size: 7.5px !important; margin-bottom: 2px !important; }
      .axp-field { margin-bottom: 5px !important; }
      .axp-input-wrap input, .axp-input-wrap select { height: 28px !important; padding: 4px 28px 4px 8px !important; font-size: 11px !important; }
      .axp-input-wrap .axp-eye { font-size: 10px !important; right: 8px !important; }
      .axp-btn { height: 28px !important; font-size: 11px !important; gap: 5px !important; margin-top: 3px !important; }
      .axp-links { font-size: 10px !important; margin-top: 6px !important; }
      .axp-divider { font-size: 9px !important; margin: 6px 0 !important; }
      .message-box { font-size: 10px !important; padding: 5px 8px !important; }
    }
    #axp-auth-overlay form { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    #axp-auth-overlay .axp-field { display: block !important; }
    #axp-auth-overlay .axp-input-wrap { display: block !important; position: relative !important; }
    #axp-auth-overlay input { display: block !important; }
    #axp-auth-overlay select { display: block !important; }
    #axp-video-bg {
      position: fixed; inset: 0; width: 100%; height: 100%; object-fit: cover;
      z-index: 2147483644; opacity: 0; transition: opacity 2s ease; display: none; pointer-events: none;
    }
    #axp-video-bg.loaded { opacity: 1; }
    #axp-video-overlay {
      position: fixed; inset: 0;
      background: linear-gradient(135deg, rgba(4,8,20,0.88) 0%, rgba(6,15,40,0.78) 50%, rgba(0,60,45,0.50) 100%);
      z-index: 2147483645; display: none; pointer-events: none;
    }
    #axp-canvas-bg {
      position: fixed; inset: 0; width: 100%; height: 100%;
      z-index: 2147483644; display: none; pointer-events: none;
    }
    .form-container {
      background: rgba(255,255,255,0.045); backdrop-filter: blur(26px);
      -webkit-backdrop-filter: blur(26px); border: 1px solid rgba(255,255,255,0.09);
      border-radius: 10px; width: 100%; max-width: 440px; box-sizing: border-box;
      display: none; flex-direction: column;
      padding: clamp(20px,4vh,36px) clamp(20px,4vw,36px) clamp(18px,3vh,30px);
      animation: axpSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
      overflow: visible; position: relative; z-index: 10;
    }
    @keyframes axpSlideUp {
      from { opacity:0; transform:translateY(24px) scale(0.98); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    .form-container .axp-brand { text-align: center; flex-shrink: 0; margin-bottom: clamp(6px,1.2vh,18px); }
    .form-container .axp-brand span { font-size: clamp(15px,2.2vw,19px); font-weight: 800; letter-spacing: 2.5px; color: #fff; text-transform: uppercase; }
    .form-container .axp-brand em { font-style: normal; color: #4ecca3; }
    .form-container .axp-brand p { font-size: 10.5px; color: rgba(255,255,255,0.38); margin: 3px 0 0; letter-spacing: 0.3px; }
    .form-container h2, .form-container h3 { color: #fff; font-size: clamp(13px,2vw,17px); font-weight: 600; margin: 0 0 2px; text-align: center; flex-shrink: 0; }
    .form-container .axp-subtitle { text-align: center; font-size: 12px; color: rgba(255,255,255,0.42); margin: 0 0 clamp(8px,1.4vh,16px); flex-shrink: 0; }
    .form-container label { display: block; font-size: 8.5px; font-weight: 600; color: #a8f0da; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px; flex-shrink: 0; text-align: left; }
    .axp-field { margin-bottom: 7px; flex-shrink: 0; }
    .axp-input-wrap { position: relative; }
    .axp-input-wrap input, .axp-input-wrap select {
      width: 100%; background: rgba(255,255,255,0.055); border: 1px solid rgba(255,255,255,0.12);
      border-radius: 4px; padding: 7px 36px 7px 11px; font-size: 12.5px; color: #fff;
      outline: none; transition: border-color 0.22s, background 0.22s; box-sizing: border-box; height: 34px; line-height: 1;
    }
    .axp-input-wrap input::placeholder { color: rgba(255,255,255,0.25); }
    .axp-input-wrap input:focus, .axp-input-wrap select:focus { border-color: rgba(78,204,163,0.65); background: rgba(78,204,163,0.06); }
    .axp-input-wrap input[style*="red"] { border-color: rgba(239,68,68,0.70) !important; background: rgba(239,68,68,0.05) !important; }
    .axp-input-wrap .axp-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.35); cursor: pointer; font-size: 12px; }
    .axp-btn {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
      background: #4ecca3; color: #060c1c; border: none; border-radius: 4px; padding: 0; height: 30px;
      font-size: 11.5px; font-weight: 700; letter-spacing: 0.4px; cursor: pointer; margin-top: 6px;
      flex-shrink: 0; transition: opacity 0.18s; box-sizing: border-box;
    }
    .axp-btn:active { opacity: 0.85; }
    .axp-btn:disabled { opacity: 0.48; cursor: not-allowed; }
    .axp-links { text-align: center; font-size: 12px; color: rgba(255,255,255,0.38); margin-top: clamp(8px,1.2vh,14px); flex-shrink: 0; }
    .axp-links a { color: #4ecca3; text-decoration: none; font-weight: 500; }
    .axp-divider { display: flex; align-items: center; gap: 10px; margin: clamp(8px,1.2vh,14px) 0; color: rgba(255,255,255,0.2); font-size: 11px; flex-shrink: 0; }
    .axp-divider::before, .axp-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.09); }
    .message-box { display: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; margin-bottom: clamp(6px,1vh,12px); flex-shrink: 0; animation: axpFdIn 0.3s ease; }
    @keyframes axpFdIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
    .message-box.success { background: rgba(78,204,163,0.12); border: 1px solid rgba(78,204,163,0.30); color: #4ecca3; }
    .message-box.error { background: rgba(239,68,68,0.11); border: 1px solid rgba(239,68,68,0.28); color: #f87171; }
    .social-btn { display: none !important; }
    #axp-processing-overlay {
      position: fixed; inset: 0; z-index: 2147483648; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 20px;
      background: rgba(6,12,28,0.82); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      animation: axpProcIn 0.25s ease;
    }
    @keyframes axpProcIn  { from{opacity:0} to{opacity:1} }
    @keyframes axpProcOut { from{opacity:1} to{opacity:0} }
    #axp-processing-overlay.axp-proc-out { animation: axpProcOut 0.38s ease forwards; pointer-events: none; }
    .axp-proc-ring { width: 52px; height: 52px; }
    .axp-proc-ring-track {
      stroke-dasharray: 138; stroke-dashoffset: 138;
      animation: axpProcArcDraw 0.7s ease forwards, axpProcArcSpin 1.1s linear 0.7s infinite;
      transform-origin: 26px 26px;
    }
    @keyframes axpProcArcDraw { to { stroke-dashoffset: 34; } }
    @keyframes axpProcArcSpin { to { transform: rotate(360deg); } }
    .axp-proc-label { font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.75); letter-spacing: 0.4px; }
    .axp-proc-result { display: flex; flex-direction: column; align-items: center; gap: 14px; animation: axpFdIn 0.3s ease; }
    .axp-proc-result-icon { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .axp-proc-result-icon.success { background: rgba(78,204,163,0.18); color: #4ecca3; }
    .axp-proc-result-icon.error   { background: rgba(239,68,68,0.18);  color: #f87171; }
    .axp-proc-result-msg { font-size: 13.5px; font-weight: 500; text-align: center; max-width: 280px; line-height: 1.55; padding: 0 16px; }
    .axp-proc-result-msg.success { color: #4ecca3; }
    .axp-proc-result-msg.error   { color: #f87171; }

    /* ── Dashboard section styles — flat/utility, no borders/shadows/radius ── */
    .axp-section-card {
      background: #fff;
      padding: 18px 20px;
      margin-bottom: 14px;
    }
    .axp-section-title {
      font-size: 15px; font-weight: 700; color: #1a1a2e;
      margin: 0 0 14px; padding-bottom: 10px;
      border-bottom: 2px solid #4ecca3; display: flex; align-items: center; gap: 8px;
    }
    .axp-section-title i { color: #4ecca3; font-size: 17px; }
    .axp-form-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;
    }
    .axp-form-row.single { grid-template-columns: 1fr; }
    .axp-form-row.triple { grid-template-columns: 1fr 1fr 1fr; }
    @media(max-width:640px) { .axp-form-row, .axp-form-row.triple { grid-template-columns: 1fr; } }
    .axp-field-group { display: flex; flex-direction: column; gap: 4px; }
    .axp-field-group label { font-size: 10px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
    .axp-input {
      border: 1px solid #d0d0d0;
      border-radius: 0;
      padding: 7px 10px;
      font-size: 13px; color: #1e293b; outline: none;
      transition: border-color 0.2s; width: 100%; box-sizing: border-box;
    }
    .axp-input:focus { border-color: #4ecca3; }
    .axp-select {
      border: 1px solid #d0d0d0;
      border-radius: 0;
      padding: 7px 10px;
      font-size: 13px; color: #1e293b; outline: none; background: #fff;
      transition: border-color 0.2s; width: 100%; box-sizing: border-box; cursor: pointer;
    }
    .axp-select:focus { border-color: #4ecca3; }
    .axp-textarea {
      border: 1px solid #d0d0d0;
      border-radius: 0;
      padding: 8px 10px;
      font-size: 13px; color: #1e293b; outline: none; resize: vertical;
      transition: border-color 0.2s; width: 100%; box-sizing: border-box;
      font-family: inherit; min-height: 100px;
    }
    .axp-textarea:focus { border-color: #4ecca3; }
    .axp-btn-primary {
      background: #4ecca3; color: #060c1c; border: none; border-radius: 0;
      padding: 8px 18px; font-size: 12.5px; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 6px; transition: opacity 0.15s;
    }
    .axp-btn-primary:hover { opacity: 0.88; }
    .axp-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
    .axp-btn-secondary {
      background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;
      border-radius: 0; padding: 7px 14px; font-size: 12.5px; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: background 0.15s;
    }
    .axp-btn-secondary:hover { background: #e2e8f0; }
    .axp-btn-danger {
      background: #fff0f0; color: #dc3545; border: 1px solid #fca5a5;
      border-radius: 0; padding: 6px 12px; font-size: 12px; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: background 0.15s;
    }
    .axp-btn-danger:hover { background: #fee2e2; }
    .axp-tag {
      display: inline-flex; align-items: center; gap: 4px;
      background: #e8faf4; color: #065f46; border: 1px solid #a7f3d0;
      border-radius: 0; padding: 3px 8px; font-size: 11.5px; font-weight: 600;
    }
    .axp-tag .remove-tag {
      cursor: pointer; color: #6b7280; font-size: 14px; line-height: 1;
      background: none; border: none; padding: 0; margin-left: 2px;
    }
    .axp-tag .remove-tag:hover { color: #dc3545; }
    .axp-tags-container { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; min-height: 28px; }
    .axp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .axp-table th { background: #f8fafc; padding: 9px 12px; text-align: left; font-weight: 600; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 2px solid #e2e8f0; }
    .axp-table td { padding: 9px 12px; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .axp-table tr:last-child td { border-bottom: none; }
    .axp-badge { padding: 2px 8px; border-radius: 0; font-size: 11px; font-weight: 600; }
    .axp-badge-green  { background: #ecfdf5; color: #065f46; }
    .axp-badge-yellow { background: #fffbeb; color: #92400e; }
    .axp-badge-red    { background: #fef2f2; color: #991b1b; }
    .axp-badge-blue   { background: #eff6ff; color: #1e40af; }
    .axp-badge-gray   { background: #f8fafc; color: #475569; }
    .axp-progress-bar { height: 6px; background: #e2e8f0; overflow: hidden; min-width: 70px; }
    .axp-progress-fill { height: 100%; background: linear-gradient(90deg,#4ecca3,#2ecc71); transition: width 0.5s ease; }
    .axp-empty-state { padding: 30px 16px; text-align: center; color: #94a3b8; }
    .axp-empty-state i { font-size: 36px; display: block; margin-bottom: 8px; opacity: 0.4; }
    .axp-empty-state p { margin: 0; font-size: 13px; }
    .axp-alert { padding: 10px 14px; font-size: 13px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 9px; }
    .axp-alert-info    { background: #eff6ff; border-left: 3px solid #3b82f6; color: #1e40af; }
    .axp-alert-success { background: #ecfdf5; border-left: 3px solid #10b981; color: #065f46; }
    .axp-alert-warning { background: #fffbeb; border-left: 3px solid #f59e0b; color: #92400e; }
    .axp-alert-danger  { background: #fef2f2; border-left: 3px solid #ef4444; color: #991b1b; }
    .axp-divider-line { height: 1px; background: #e2e8f0; margin: 16px 0; }
    .axp-spinner-sm {
      display: inline-block; width: 16px; height: 16px;
      border: 2px solid #e2e8f0; border-top-color: #4ecca3;
      border-radius: 50%; animation: axpSpin 0.8s linear infinite;
    }
    @keyframes axpSpin { to { transform: rotate(360deg); } }
    /* Teacher card — flat */
    .teacher-card {
      border-top: 1px solid #e2e8f0;
      padding: 12px 0;
      background: #fff;
    }
    .teacher-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .teacher-card-name { font-weight: 700; font-size: 13.5px; color: #1e293b; }
    .teacher-card-email { font-size: 12px; color: #64748b; margin-top: 2px; }
    .teacher-card-assignments { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
    /* Subject checklist grid */
    .subject-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px,1fr)); gap: 6px; }
    .subject-check-item { display: flex; align-items: center; gap: 7px; padding: 7px 9px; border: 1px solid #e2e8f0; cursor: pointer; font-size: 12.5px; }
    .subject-check-item input[type=checkbox] { accent-color: #4ecca3; width: 14px; height: 14px; cursor: pointer; }
    .subject-check-item.checked { border-color: #4ecca3; background: #f0fdf9; }
    /* Progress section */
    .progress-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 14px; }
    .progress-card { border: 1px solid #e2e8f0; padding: 14px; background: #fff; }
    .progress-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .progress-card-title { font-weight: 700; font-size: 13px; color: #1e293b; }
    .progress-subject-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; font-size: 12.5px; }
    .progress-subject-name { flex: 1; color: #475569; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .progress-subject-count { font-size: 11px; color: #94a3b8; white-space: nowrap; }
    /* student table */
    .student-entry-row { display: grid; grid-template-columns: 1fr auto; gap: 7px; align-items: center; margin-bottom: 5px; }
    .student-entry-row input { padding: 6px 9px; border: 1px solid #e2e8f0; font-size: 12.5px; outline: none; }
    .student-entry-row input:focus { border-color: #4ecca3; }
  `;
  document.head.appendChild(style);
}

function _injectVideoBackground() {
  if (document.getElementById("axp-video-bg") || document.getElementById("axp-canvas-bg")) return;
  if (!document.getElementById("axp-bi-font")) {
    const link = document.createElement("link");
    link.id   = "axp-bi-font";
    link.rel  = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
    document.head.appendChild(link);
  }
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
  let W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize);

  const ACADEMIC_ICONS = ["","","","","","","","","","","","",""];
  const DIR_X = 0.38, DIR_Y = -0.42;

  function makeParticle(type) {
    const speed = type==="icon" ? Math.random()*0.5+0.25 : type==="word" ? Math.random()*0.3+0.15 : Math.random()*0.6+0.2;
    return {
      x: Math.random()*W, y: Math.random()*H, type,
      icon: ACADEMIC_ICONS[Math.floor(Math.random()*ACADEMIC_ICONS.length)],
      size: type==="icon" ? Math.random()*10+8 : type==="word" ? Math.random()*7+6 : Math.random()*1.4+0.5,
      dx: DIR_X*speed*(0.8+Math.random()*0.4), dy: DIR_Y*speed*(0.8+Math.random()*0.4),
      a: type==="dot" ? Math.random()*0.35+0.1 : Math.random()*0.18+0.06,
      pulse: Math.random()*Math.PI*2, pSpd: Math.random()*0.018+0.006
    };
  }

  const particles = [
    ...Array.from({length:35},()=>makeParticle("icon")),
    ...Array.from({length:18},()=>makeParticle("word")),
    ...Array.from({length:80},()=>makeParticle("dot")),
  ];

  const ORBS = [
    {x:0.1,y:0.15,r:0.32,c:"rgba(78,204,163,0.07)",dx:0.00018,dy:-0.00012},
    {x:0.8,y:0.55,r:0.25,c:"rgba(60,120,220,0.055)",dx:-0.00012,dy:0.00015},
    {x:0.45,y:0.88,r:0.22,c:"rgba(78,204,163,0.05)",dx:0.00015,dy:-0.0001},
    {x:0.9,y:0.1,r:0.2,c:"rgba(100,200,180,0.045)",dx:-0.00014,dy:0.00018},
  ];

  function drawBg() {
    const bg = ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,"#020810"); bg.addColorStop(0.45,"#050d22"); bg.addColorStop(1,"#021510");
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    ORBS.forEach(o=>{
      o.x+=o.dx; o.y+=o.dy;
      if(o.x<-0.3||o.x>1.3)o.dx*=-1; if(o.y<-0.3||o.y>1.3)o.dy*=-1;
      const g=ctx.createRadialGradient(o.x*W,o.y*H,0,o.x*W,o.y*H,o.r*Math.min(W,H));
      g.addColorStop(0,o.c); g.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    });
  }

  function wrap(p) {
    const pad=60;
    if(p.x>W+pad){p.x=-pad;p.y=Math.random()*H;}
    if(p.y<-pad){p.y=H+pad;p.x=Math.random()*W;}
    if(p.x<-pad)p.x=W+pad;
  }

  (function draw() {
    drawBg();
    particles.forEach(p => {
      p.x+=p.dx; p.y+=p.dy; p.pulse+=p.pSpd; wrap(p);
      if(p.type==="dot"){
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle=`rgba(78,204,163,${p.a})`; ctx.fill();
      } else if(p.type==="icon"){
        const alpha=p.a+Math.sin(p.pulse)*0.03;
        ctx.save(); ctx.font=`${p.size}px "bootstrap-icons"`;
        ctx.fillStyle=`rgba(78,204,163,${alpha})`; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.translate(p.x,p.y); ctx.fillText(p.icon,0,0); ctx.restore();
      } else if(p.type==="word"){
        const alpha=p.a+Math.sin(p.pulse)*0.025;
        ctx.save(); ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.translate(p.x,p.y);
        const fs=p.size; ctx.font=`700 ${fs}px "Arial Narrow",Arial,sans-serif`;
        const w1=ctx.measureText("ACADEMIX").width; const w2=ctx.measureText("POINT").width; const total=w1+w2;
        ctx.fillStyle=`rgba(255,255,255,${alpha})`; ctx.fillText("ACADEMIX",-total/2+w1/2,0);
        ctx.fillStyle=`rgba(78,204,163,${alpha})`; ctx.fillText("POINT",-total/2+w1+w2/2,0);
        ctx.restore();
      }
    });
    requestAnimationFrame(draw);
  })();
}

function applyDashboardStyles() {
  const s = document.createElement("style");
  s.textContent = `
    body { position:relative; font-family:'Roboto',Arial,sans-serif; background:#f1f5f9; color:#1e293b; overflow-y:auto; margin:0; }
    body::before { content:none; }
    #axp-video-bg, #axp-video-overlay { display:none !important; }
    /* Remove vertical scrollbar inside mainContent */
    #mainContent { overflow:visible !important; overflow-y:visible !important; overflow-x:visible !important; }
    /* Messaging app styles */
    .axp-msg-list { display:flex; flex-direction:column; gap:0; }
    .axp-msg-item { display:flex; gap:12px; padding:12px 16px; border-bottom:1px solid #f0f0f0; cursor:pointer; transition:background .15s; }
    .axp-msg-item:hover { background:#f8fafc; }
    .axp-msg-item.unread { background:#f0fdf9; }
    .axp-msg-item.unread .axp-msg-sender { font-weight:800; color:#065f46; }
    .axp-msg-item.unread .axp-msg-preview { font-weight:600; color:#334155; }
    .axp-msg-avatar { width:40px;height:40px;min-width:40px;background:#4ecca3;display:flex;align-items:center;justify-content:center;color:#060c1c;font-weight:800;font-size:16px; }
    .axp-msg-body { flex:1;min-width:0; }
    .axp-msg-sender { font-size:13.5px;font-weight:600;color:#1a1a2e;margin-bottom:2px; }
    .axp-msg-preview { font-size:12.5px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .axp-msg-meta { display:flex;flex-direction:column;align-items:flex-end;gap:4px;min-width:60px; }
    .axp-msg-time { font-size:11px;color:#94a3b8; }
    .axp-msg-unread-dot { width:8px;height:8px;background:#4ecca3;border-radius:50%; }
    .axp-msg-reading { padding:20px;background:#fff; }
    .axp-msg-reading-header { padding-bottom:14px;border-bottom:2px solid #4ecca3;margin-bottom:16px; }
    .axp-msg-reading-title { font-size:16px;font-weight:800;color:#1a1a2e;margin-bottom:4px; }
    .axp-msg-reading-from { font-size:12px;color:#64748b; }
    .axp-msg-reading-body { font-size:13.5px;line-height:1.75;color:#334155;white-space:pre-wrap; }
    /* Analytics styles */
    .axp-analytics-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:18px; }
    .axp-stat-box { background:#fff;padding:16px;border-left:3px solid #4ecca3; }
    .axp-stat-box-val { font-size:26px;font-weight:900;color:#1a1a2e;margin:4px 0; }
    .axp-stat-box-lbl { font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px; }
    .axp-ranking-table { width:100%;border-collapse:collapse;font-size:12.5px; }
    .axp-ranking-table th { padding:8px 10px;background:#f8fafc;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #e2e8f0;text-align:left; }
    .axp-ranking-table td { padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle; }
    .axp-ranking-table tr:last-child td { border-bottom:none; }
    .axp-rank-1 { color:#f59e0b;font-weight:800;font-size:14px; }
    .axp-rank-last { color:#ef4444;font-weight:800;font-size:14px; }
    /* Excel upload styles */
    .axp-excel-drop { border:2px dashed #cbd5e1;padding:24px;text-align:center;cursor:pointer;transition:all .2s; }
    .axp-excel-drop:hover, .axp-excel-drop.dragover { border-color:#4ecca3;background:#f0fdf9; }
    .axp-excel-drop i { font-size:32px;color:#4ecca3;display:block;margin-bottom:8px; }
    .axp-excel-drop p { margin:0;font-size:13px;color:#64748b; }
    .axp-excel-drop small { font-size:11px;color:#94a3b8; }
     /* ── Mobile < 500px — full width, no overflow ── */
@media(max-width:500px){
  body { overflow-x:hidden !important; }
  #mainContent { padding:0 !important; overflow-x:hidden !important; }
  #axpSectionWrapper { padding:8px 0 !important; overflow-x:hidden !important; }
  .axp-section-card { padding:10px 8px !important; margin-bottom:8px !important; overflow-x:hidden !important; }
  .axp-section-title { font-size:13px !important; gap:6px !important; }
  .axp-form-row { grid-template-columns:1fr !important; gap:7px !important; }
  .axp-form-row.triple { grid-template-columns:1fr !important; }
  .axp-analytics-grid { grid-template-columns:1fr 1fr !important; gap:7px !important; }
  .axp-stat-box { padding:10px 10px !important; }
  .axp-stat-box-val { font-size:20px !important; }
  .axp-table { font-size:11px !important; }
  .axp-table th, .axp-table td { padding:6px 7px !important; }
  .axp-ranking-table th, .axp-ranking-table td { padding:5px 6px !important; font-size:11px !important; }
  .axp-btn-primary, .axp-btn-secondary, .axp-btn-danger { font-size:11.5px !important; padding:6px 10px !important; }
  .axp-field-group label { font-size:9.5px !important; }
  .axp-input, .axp-select, .axp-textarea { font-size:12px !important; padding:6px 8px !important; }
  .axp-alert { font-size:11.5px !important; padding:8px 10px !important; }
  .axp-tags-container { gap:4px !important; }
  .axp-tag { font-size:10.5px !important; padding:2px 6px !important; }
  .teacher-card { padding:8px 0 !important; }
  .teacher-card-name { font-size:12.5px !important; }
  .progress-grid { grid-template-columns:1fr !important; }
  .subject-grid { grid-template-columns:repeat(auto-fill,minmax(130px,1fr)) !important; }
  #statusBanner { font-size:11.5px !important; padding:8px 10px !important; }
  #announcementsSection, #operatorMessageSection { padding:10px 8px !important; margin:8px 0 !important; }
  /* Dashboard stat cards */
  #axp-enhanced-stats > div:first-child { grid-template-columns:1fr 1fr !important; gap:7px !important; }
  /* Teacher activity monitor */
  .axp-msg-item { padding:8px 10px !important; gap:8px !important; }
  .axp-msg-avatar { width:34px !important; height:34px !important; min-width:34px !important; font-size:14px !important; }
  .axp-msg-sender { font-size:12.5px !important; }
  .axp-msg-preview { font-size:11.5px !important; }
  /* Demo panel */
  #axpDemoPanelStudents, #axpDemoPanelTeachers, #axpDemoPanelResults { padding:8px !important; }
  /* Setup popup inside overlay */
  #axpSetupPopupBox { max-height:95vh !important; }
  /* Overflow fix for tables */
  [style*="overflow-x:auto"] { max-width:100vw !important; }
}
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
  const showAuthPopup = e => { e.preventDefault(); if(popup)popup.style.display="block"; if(overlay)overlay.style.display="block"; };
  if (createLoginButton) createLoginButton.addEventListener("click", showAuthPopup);
  if (accountButton)     accountButton.addEventListener("click", showAuthPopup);
  if (overlay) { overlay.addEventListener("click", () => { popup.style.display="none"; overlay.style.display="none"; }); }
  if (loginButton)    loginButton.addEventListener("click", e => { e.preventDefault(); popup.style.display="none"; overlay.style.display="none"; showFormPage("lg-form"); });
  if (registerButton) registerButton.addEventListener("click", e => { e.preventDefault(); popup.style.display="none"; overlay.style.display="none"; axpShowRegisterNotice(); });
}

function bindAuthLinks() {
  const registerLink = document.getElementById("registerLink");
  const loginLink    = document.getElementById("loginLink");
  if (registerLink) registerLink.addEventListener("click", e => { e.preventDefault(); axpShowRegisterNotice(); });
  if (loginLink)    loginLink.addEventListener("click",    e => { e.preventDefault(); showFormPage("lg-form"); });
}

function showFormPage(formId) { _openAuthForm(formId); }

function toggleForms(formIdToShow) {
  const ov = document.getElementById("axp-auth-overlay");
  const containers = ov ? ov.querySelectorAll(".form-container") : document.querySelectorAll(".form-container");
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

/* ─────────────────────────────────────────────────────────────
   PROCESSING OVERLAY
───────────────────────────────────────────────────────────── */
function _showProcessingOverlay() {
  _removeProcessingOverlay();
  const ov = document.createElement("div");
  ov.id = "axp-processing-overlay";
  ov.innerHTML = `
    <svg class="axp-proc-ring" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="22" stroke="rgba(78,204,163,0.12)" stroke-width="3"/>
      <circle class="axp-proc-ring-track" cx="26" cy="26" r="22"
        stroke="#4ecca3" stroke-width="3" stroke-linecap="round" transform="rotate(-90 26 26)"/>
    </svg>
    <span class="axp-proc-label">Processing…</span>`;
  document.body.appendChild(ov);
}

function _showProcessingResult(success, message, onDone) {
  const ov = document.getElementById("axp-processing-overlay");
  if (!ov) { if (typeof onDone === "function") onDone(); return; }
  const icon = success ? "bi-check-circle-fill" : "bi-x-circle-fill";
  const cls  = success ? "success" : "error";
  ov.innerHTML = `
    <div class="axp-proc-result">
      <div class="axp-proc-result-icon ${cls}"><i class="bi ${icon}"></i></div>
      <p class="axp-proc-result-msg ${cls}">${escapeHtml(message)}</p>
    </div>`;
  const delay = success ? 1200 : 2200;
  setTimeout(() => {
    ov.classList.add("axp-proc-out");
    setTimeout(() => { _removeProcessingOverlay(); if (typeof onDone === "function") onDone(); }, 400);
  }, delay);
}

function _removeProcessingOverlay() {
  const ov = document.getElementById("axp-processing-overlay");
  if (ov) ov.remove();
}

/* ─────────────────────────────────────────────────────────────
   SUBMIT FORM
───────────────────────────────────────────────────────────── */
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
  const form   = document.getElementById(config.formId);
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
        localStorage.setItem("axpLoginTime", Date.now().toString()); 
        const loginFormCard   = document.querySelector("#axp-auth-overlay .form-container");
        if (loginFormCard) { loginFormCard.style.transition="opacity 0.25s ease"; loginFormCard.style.opacity="0"; loginFormCard.style.pointerEvents="none"; }
        const loginWrapper    = document.querySelector("#axp-auth-overlay .login-form");
        if (loginWrapper) loginWrapper.style.visibility="hidden";
        _showProcessingResult(true, "Login successful!", () => {
          ["#header","#main-id",".footer",".footer-bottom","#home","#landing",
           "#page-wrapper",".page-content",".home-section",".hero","#hero","main","#content"].forEach(sel => {
            const el = document.querySelector(sel);
            if (el && el.id !== "dashboard" && !el.closest("#dashboard")) el.style.display = "none";
          });
          const authOv = document.getElementById("axp-auth-overlay");
          if (authOv) { authOv.style.transition="opacity 0.5s ease"; authOv.style.opacity="0"; }
          const dashPromise = new Promise(resolve => {
            if (data.dashboardData) { _renderDashboard(data.dashboardData); resolve(); }
            else { loadDashboardData(username, password).then(resolve).catch(resolve); }
          });
          setTimeout(() => {
            if (authOv) authOv.style.display = "none";
            _showLoadingScreen(() => { dashPromise.then(() => displayDashboard()); });
          }, 350);
        });
      } else {
        let extra = "";
        if (action === "signup")        extra = "Registration successful! You can now log in.";
        if (action === "resetPassword") extra = "Password updated. Use your new password to log in.";
        if (action === "generateToken") extra = "Reset link sent! Check your email inbox.";
        _showProcessingResult(true, extra, () => {
          if (button) button.disabled = false;
          showSuccessOverlay(extra, () => { _openAuthForm("lg-form"); });
        });
      }
    } else {
      const errMsg = data.message || "An error occurred. Please try again.";
      _showProcessingResult(false, errMsg, () => { if (button) button.disabled = false; showMessage(errMsg, false); });
    }
  })
  .catch(err => {
    console.error("Submit error:", err);
    const errMsg = "Error connecting to server. Please try again.";
    _showProcessingResult(false, errMsg, () => { if (button) button.disabled = false; showMessage(errMsg, false); });
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
        pw.style.borderColor = "red"; showMessage("Password must be at least 8 characters and include letters and numbers.", false); isValid = false;
      } else { pw.style.borderColor = ""; }
    }
    if (isValid && pw && cpw && pw.value.trim() !== cpw.value.trim()) {
      cpw.style.borderColor = "red"; showMessage("Passwords do not match.", false); isValid = false;
    } else if (cpw) { cpw.style.borderColor = ""; }
  }
  if (isValid && (action === "signup" || action === "generateToken")) {
    const ef = form.querySelector('input[name="email"]');
    if (ef) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ef.value.trim())) { ef.style.borderColor="red"; showMessage("Please enter a valid email address.", false); isValid=false; }
      else { ef.style.borderColor=""; }
    }
  }
  if (isValid && action === "signup") {
    const pf = form.querySelector('input[name="phone"]');
    if (pf) {
      const clean = pf.value.replace(/\D/g,"");
      if (clean.length < 10 || clean.length > 15) { pf.style.borderColor="red"; showMessage("Please enter a valid Tanzanian phone number.", false); isValid=false; }
      else { pf.style.borderColor=""; }
    }
  }
  if (action === "login") {
    const uf = form.querySelector('input[name="username"]');
    const pf = form.querySelector('input[name="loginPassword"]');
    if (!uf||!uf.value.trim()){if(uf)uf.style.borderColor="red";showMessage("Username is required.",false);isValid=false;}
    else if(uf)uf.style.borderColor="";
    if (!pf||!pf.value.trim()){if(pf)pf.style.borderColor="red";showMessage("Password is required.",false);isValid=false;}
    else if(pf)pf.style.borderColor="";
  }
  return isValid;
}

/* ─────────────────────────────────────────────────────────────
   DASHBOARD DATA
───────────────────────────────────────────────────────────── */
let _dashboardData   = {};
let globalUsername   = "";
let _operatorMessage = "";
let _announcements   = [];

async function loadDashboardData(username, password) {
  try {
    const url    = `${scriptURL}?action=schoolDashboard&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    const res    = await fetch(url);
    const parsed = JSON.parse(await res.text());
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
    el.style.cssText = "background:#fef2f2;color:#b91c1c;padding:10px 16px;margin:12px;font-size:13px;border-left:3px solid #ef4444;";
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
  _setText("notificationCount", _announcements.length || 0);
   
_startWelcomeClock();
_setText("welcomeSchoolName", data.schoolname || "Your School");

  _setupShareLink(data.schoolindex);
  _renderOperatorMessage(_operatorMessage);
  displayAnnouncements({ announcements: _announcements });

  setTimeout(() => {
    _loadSchoolSetupStatus();
    if (!localStorage.getItem(_getSchoolStorageKey()) && _dashboardData.status === "ACTIVE") {
      setTimeout(() => axpOpenSetupPopup(), 1200);
    }
  }, 300);
}

function _setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function _startWelcomeClock() {
  if (window._axpClockInterval) clearInterval(window._axpClockInterval);

  function _tick() {
    const now = new Date();
    const h = now.getHours();

    // Greeting logic
    let greeting = "Good Morning";
    if (h >= 12 && h < 17) greeting = "Good Afternoon";
    else if (h >= 17 && h < 21) greeting = "Good Evening";
    else if (h >= 21 || h < 5) greeting = "Good Night";

    // Time string
    const time = now.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });

    // Date string
    const date = now.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    _setText("welcomeGreeting", greeting);
    _setText("welcomeTime", time);
    _setText("welcomeDate", date);
  }

  _tick(); // run immediately
  window._axpClockInterval = setInterval(_tick, 1000);
}

function _renderStatusBanner(status, statusLabel, balance, lastPaymentDate) {
  const existing = document.getElementById("statusBanner");
  if (existing) existing.remove();
  const cfg = {
    ACTIVE          : { bg:"#ecfdf5", border:"#10b981", color:"#065f46", icon:"bi-check-circle-fill",       label:"Account Active" },
    PENDING         : { bg:"#fffbeb", border:"#f59e0b", color:"#92400e", icon:"bi-hourglass-split",          label:"Pending Activation — please pay the activation fee" },
    INACTIVE        : { bg:"#fdf2f8", border:"#db2777", color:"#831843", icon:"bi-slash-circle-fill",        label:"Account Inactive — contact support" },
    SUSPENDED       : { bg:"#fef2f2", border:"#ef4444", color:"#991b1b", icon:"bi-ban",                      label:"Account Suspended — contact support immediately" },
    DORMANT         : { bg:"#faf5ff", border:"#a855f7", color:"#581c87", icon:"bi-moon-fill",                label:"Account Dormant" },
    WARNING         : { bg:"#fff7ed", border:"#f97316", color:"#9a3412", icon:"bi-exclamation-triangle-fill",label:"Warning on Account — contact support" },
    AWAITING_DELETE : { bg:"#fafaf9", border:"#78716c", color:"#44403c", icon:"bi-trash3-fill",              label:"Account Deletion Requested — pending operator review" }
  }[status] || { bg:"#fffbeb", border:"#f59e0b", color:"#92400e", icon:"bi-hourglass-split", label: status || "Unknown" };

  let extraInfo = "";
  if (balance !== undefined && balance !== "") extraInfo += `<span style="font-size:12px;opacity:0.85;display:flex;align-items:center;gap:4px;"><i class="bi bi-wallet2"></i> TZS ${Number(balance).toLocaleString()}</span>`;
  if (lastPaymentDate) extraInfo += `<span style="font-size:11px;opacity:0.7;display:flex;align-items:center;gap:4px;"><i class="bi bi-calendar-check"></i> ${lastPaymentDate}</span>`;

  const banner = document.createElement("div");
  banner.id = "statusBanner";
  banner.style.cssText = `background:${cfg.bg};border-left:3px solid ${cfg.border};color:${cfg.color};padding:10px 16px;margin:12px 0;font-size:13px;font-weight:500;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;`;
  banner.innerHTML = `
    <span style="display:flex;align-items:center;gap:7px;"><i class="bi ${cfg.icon}" style="font-size:14px;"></i>${cfg.label}</span>
    <span style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">${extraInfo}</span>`;
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
    </div>`;
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
  section.style.cssText = "background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:18px;margin:16px 0;color:white;";
  section.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
      <i class="bi bi-chat-left-text-fill" style="font-size:17px;color:#ffd700;"></i>
      <h3 style="margin:0;font-size:14.5px;font-weight:600;">Message from AcademixPoint</h3>
    </div>
    <div style="background:rgba(255,255,255,0.12);padding:12px;white-space:pre-wrap;line-height:1.6;font-size:13px;">
      ${escapeHtml(message)}
    </div>`;
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
  section.style.cssText = "background:#fff;padding:18px;margin:16px 0;";
  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #f0f0f0;";
  header.innerHTML = `
    <i class="bi bi-megaphone-fill" style="font-size:17px;color:#4ecca3;"></i>
    <h3 style="margin:0;font-size:14.5px;font-weight:600;color:#1e293b;">Announcements</h3>
    <span style="margin-left:auto;background:#4ecca3;color:white;padding:2px 8px;font-size:11.5px;font-weight:600;">${announcements.length} Active</span>`;
  section.appendChild(header);
  const list = document.createElement("div");
  list.style.cssText = "display:flex;flex-direction:column;gap:10px;";
  const priorityColors = { High:"#ef4444", Medium:"#f59e0b", Low:"#3b82f6" };
  announcements.forEach(ann => {
    const color = priorityColors[ann.priority] || "#94a3b8";
    const card  = document.createElement("div");
    card.style.cssText = `background:#f8fafc;border-left:3px solid ${color};padding:12px;`;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">
        <h4 style="margin:0;font-size:13.5px;font-weight:600;color:#1e293b;">${escapeHtml(ann.title)}</h4>
        <span style="background:${color};color:white;padding:2px 6px;font-size:10.5px;font-weight:600;white-space:nowrap;margin-left:8px;">${escapeHtml(ann.priority||"Normal")}</span>
      </div>
      <p style="margin:0 0 7px;color:#475569;line-height:1.6;font-size:13px;">${escapeHtml(ann.message)}</p>
      <div style="display:flex;align-items:center;gap:7px;font-size:11.5px;color:#94a3b8;">
        <i class="bi bi-calendar3"></i>
        <span>${formatAnnouncementDate(ann.date)}</span>
        <span style="margin-left:auto;">ID: ${ann.id||""}</span>
      </div>`;
    list.appendChild(card);
  });
  section.appendChild(list);
  insertAfter.insertAdjacentElement("afterend", section);
}

function formatAnnouncementDate(dateString) {
  try {
    const date = new Date(dateString); const now = new Date();
    const d = Math.floor(Math.abs(now-date)/86400000);
    if (d===0) return "Today"; if (d===1) return "Yesterday"; if (d<7) return `${d} days ago`;
    return date.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});
  } catch { return dateString; }
}

/* ─────────────────────────────────────────────────────────────
   DISPLAY DASHBOARD
───────────────────────────────────────────────────────────── */
function displayDashboard() {
  ["#header","#main-id",".footer",".footer-bottom"].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.style.display = "none";
  });
  ["#home","#landing","#page-wrapper",".page-content",".home-section",".hero","#hero","main","#content"].forEach(sel => {
    const el = document.querySelector(sel);
    if (el && el.id !== "dashboard" && !el.closest("#dashboard")) el.style.display = "none";
  });
  _closeAuthForm();
  applyDashboardStyles();
  const dashDiv = document.getElementById("dashboard");
  if (dashDiv) dashDiv.style.display = "block";
  const lf = document.querySelector(".login-form");
  if (lf) lf.style.display = "none";
  setupDashboardInteractions();

  if (!window.axpPageLoader) {
    window.axpPageLoader = new AxpDynamicPageLoader();
  }
}

/* ─────────────────────────────────────────────────────────────
   SETUP DASHBOARD INTERACTIONS
───────────────────────────────────────────────────────────── */
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
      ["isLoggedIn","axpUsername","axpPassword","axpLoginTime"].forEach(k => localStorage.removeItem(k));
      location.reload();
    });
  }

  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach(item => {
    item.addEventListener("click", function(e) {
      const section = this.getAttribute("data-section") || this.getAttribute("data-load-page");

      if (section) {
        e.preventDefault();
        menuItems.forEach(mi => mi.classList.remove("active"));
        this.classList.add("active");
        const targetSection = this.getAttribute("data-section") || "demo";
        navigateToSection(targetSection);
      }

      if (window.innerWidth <= 768) {
        if (sidebar) sidebar.classList.remove("active");
        if (sidebarOverlay) sidebarOverlay.classList.remove("active");
      }
    });
  });

  const notificationBtn = document.getElementById("notificationBtn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", e => {
      e.stopPropagation();
      navigateToSection("notifications");
    });
  }

  const messageBtn = document.getElementById("messageBtn");
  if (messageBtn) {
    messageBtn.addEventListener("click", e => {
      e.stopPropagation();
      navigateToSection("messages");
    });
  }

  document.addEventListener("click", e => {
    if (!e.target.closest("[data-popup]") && !e.target.closest(".icon-btn")) {
      document.querySelectorAll("[data-popup]").forEach(p => p.remove());
    }
  });

  const userProfile = document.getElementById("userProfile");
  if (userProfile) userProfile.addEventListener("click", () => navigateToSection("settings"));
}

function _closePopupOfType(type) {
  const el = document.querySelector(`[data-popup='${type}']`);
  if (el) el.remove();
}

function _buildPopup(type, icon, title, items, isMessage=false) {
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
    <div class="popup-body">${body}</div>`;
  return popup;
}

function showMessage(message, success=true) {
  const ov = document.getElementById("axp-auth-overlay");
  const visibleForm = ov ? ov.querySelector(".form-container[style*='flex']") : document.querySelector(".form-container[style*='flex']");
  if (!visibleForm) return;
  let mb = visibleForm.querySelector(".message-box");
  if (!mb) { mb=document.createElement("div"); mb.className="message-box"; visibleForm.prepend(mb); }
  mb.style.display="block"; mb.className=`message-box ${success?"success":"error"}`; mb.textContent=message;
  setTimeout(() => { mb.style.display="none"; }, 6000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function _ensureSpinnerStyle() {}

/* ─────────────────────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────────────────────── */
function _showLoadingScreen(onDone) {
  if (document.getElementById("axp-ls")) return;
  if (typeof onDone === "function") { setTimeout(onDone, 80); onDone = null; }
  const screen = document.createElement("div");
  screen.id = "axp-ls";
  screen.style.cssText = "position:fixed;inset:0;z-index:2147483649;background:#060c1c;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:36px;";
  screen.innerHTML = `
    <div class="axp-ls-brand">
      <div class="axp-ls-logo-ring">
        <svg viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="27" stroke="rgba(78,204,163,0.12)" stroke-width="2"/>
          <circle class="axp-ls-spin-arc" cx="30" cy="30" r="27" stroke="#4ecca3" stroke-width="2" stroke-dasharray="50 120" stroke-linecap="round" transform="rotate(-90 30 30)"/>
        </svg>
        <i class="bi bi-mortarboard-fill" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:22px;color:#4ecca3;"></i>
      </div>
      <div class="axp-ls-wordmark">Academix<em>Point</em></div>
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
      <span class="axp-ls-dot"></span><span class="axp-ls-dot"></span><span class="axp-ls-dot"></span>
      <p id="axp-ls-msg" class="axp-ls-msg">Initializing...</p>
    </div>`;
  if (!document.getElementById("axp-ls-styles")) {
    const s = document.createElement("style");
    s.id = "axp-ls-styles";
    s.textContent = `
      @keyframes axpLsArcSpin { to { transform: rotate(270deg); } }
      .axp-ls-spin-arc { transform-origin:30px 30px; animation:axpLsArcSpin 1.1s linear infinite; }
      .axp-ls-brand { display:flex;flex-direction:column;align-items:center;gap:14px; animation:axpLsBrandIn 0.6s cubic-bezier(0.22,1,0.36,1) both; }
      @keyframes axpLsBrandIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      .axp-ls-logo-ring { position:relative;width:60px;height:60px; }
      .axp-ls-logo-ring svg { width:100%;height:100%; }
      .axp-ls-wordmark { font-size:22px;font-weight:800;letter-spacing:2.5px;color:#fff;text-transform:uppercase; }
      .axp-ls-wordmark em { font-style:normal;color:#4ecca3; }
      .axp-ls-tagline { font-size:10.5px;color:rgba(255,255,255,0.28);letter-spacing:2px;text-transform:uppercase; }
      .axp-ls-track-wrap { display:flex;flex-direction:column;align-items:center;gap:10px; animation:axpLsBrandIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
      .axp-ls-track { position:relative;width:220px;height:2px;background:rgba(255,255,255,0.07);overflow:hidden; }
      .axp-ls-fill { height:100%;width:0%;background:linear-gradient(90deg,#4ecca3,#2ecc71);transition:width 0.55s cubic-bezier(0.4,0,0.2,1); }
      .axp-ls-sheen { position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent); animation:axpLsSheen 1.6s ease infinite; }
      @keyframes axpLsSheen { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
      .axp-ls-pct { font-size:11px;color:rgba(78,204,163,0.6);letter-spacing:0.5px;font-variant-numeric:tabular-nums; }
      .axp-ls-status { display:flex;align-items:center;gap:8px; animation:axpLsBrandIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.3s both; }
      .axp-ls-dot { width:4px;height:4px;border-radius:50%;background:#4ecca3;opacity:0.35; animation:axpLsDotPulse 1.2s ease infinite; }
      .axp-ls-dot:nth-child(2){animation-delay:0.2s} .axp-ls-dot:nth-child(3){animation-delay:0.4s}
      @keyframes axpLsDotPulse { 0%,100%{opacity:0.25;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.5)} }
      .axp-ls-msg { font-size:12.5px;color:rgba(255,255,255,0.38);letter-spacing:0.4px;margin:0;transition:opacity 0.22s ease; }
      .axp-ls-out { animation:axpLsFadeOut 0.55s ease forwards !important; }
      @keyframes axpLsFadeOut { 0%{opacity:1} 100%{opacity:0;pointer-events:none} }`;
    document.head.appendChild(s);
  }
  document.body.appendChild(screen);
  const fill  = screen.querySelector("#axp-ls-fill");
  const pctEl = screen.querySelector("#axp-ls-pct");
  const msgEl = screen.querySelector("#axp-ls-msg");
  const msgs  = [
    {from:1,to:25,msg:"Verifying credentials..."},
    {from:25,to:55,msg:"Loading school profile..."},
    {from:55,to:80,msg:"Preparing your dashboard..."},
    {from:80,to:95,msg:"Almost ready..."},
    {from:95,to:100,msg:"Opening dashboard..."},
  ];
  const TOTAL_MS=3000, INTERVAL=28;
  let pct=1, lastMsg="";
  fill.style.transition="width 0.03s linear"; fill.style.width="1%"; pctEl.textContent="1%";
  const ticker = setInterval(() => {
    pct = Math.min(100, pct + (100/(TOTAL_MS/INTERVAL)));
    const p = Math.floor(pct);
    fill.style.width=p+"%"; pctEl.textContent=p+"%";
    const stage = msgs.find(m=>p>=m.from&&p<m.to) || msgs[msgs.length-1];
    if (stage.msg !== lastMsg) {
      lastMsg=stage.msg; msgEl.style.opacity="0";
      setTimeout(()=>{msgEl.textContent=stage.msg;msgEl.style.opacity="1";},180);
    }
    if (pct>=100) {
      clearInterval(ticker);
      setTimeout(()=>{
        screen.classList.add("axp-ls-out");
        setTimeout(()=>{
          if(document.body.contains(screen))document.body.removeChild(screen);
          if(typeof onDone==="function")onDone();
        },560);
      },300);
    }
  },INTERVAL);
}

/* ─────────────────────────────────────────────────────────────
   SUCCESS OVERLAY
───────────────────────────────────────────────────────────── */
function showSuccessOverlay(message, onComplete) {
  const existingOv = document.getElementById("axp-success-overlay");
  if (existingOv) existingOv.remove();
  if (!document.getElementById("axp-success-styles")) {
    const style = document.createElement("style");
    style.id = "axp-success-styles";
    style.textContent = `
      #axp-success-overlay{position:fixed;inset:0;z-index:2147483649;background:#060c1c;display:flex;align-items:center;justify-content:center;padding:24px;animation:axpSoIn 0.4s ease}
      @keyframes axpSoIn{from{opacity:0}to{opacity:1}} @keyframes axpSoOut{from{opacity:1}to{opacity:0;pointer-events:none}}
      .axp-so-canvas{position:absolute;inset:0;pointer-events:none;z-index:0}
      .axp-so-box{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:22px;max-width:320px;width:100%;text-align:center;animation:axpSoBoxIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s both}
      @keyframes axpSoBoxIn{from{opacity:0;transform:scale(0.90) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
      .axp-so-icon-wrap{position:relative;width:110px;height:110px} .axp-so-icon-wrap svg{width:110px;height:110px;position:absolute;top:0;left:0}
      .axp-so-track{stroke-dasharray:298;stroke-dashoffset:298;animation:axpSoCircleDraw 1s cubic-bezier(0.4,0,0.2,1) 0.2s forwards}
      @keyframes axpSoCircleDraw{to{stroke-dashoffset:0}}
      .axp-so-tick{stroke-dasharray:60;stroke-dashoffset:60;animation:axpSoTickDraw 0.45s ease 1.1s forwards}
      @keyframes axpSoTickDraw{to{stroke-dashoffset:0}}
      .axp-so-title{margin:0;font-size:26px;font-weight:700;color:#fff;letter-spacing:0.3px;animation:axpSoTextIn 0.4s ease 0.65s both}
      .axp-so-msg{margin:0;font-size:14px;color:rgba(255,255,255,0.42);line-height:1.65;animation:axpSoTextIn 0.4s ease 0.8s both}
      @keyframes axpSoTextIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      .axp-so-progress{width:140px;height:2px;background:rgba(255,255,255,0.07);overflow:hidden;animation:axpSoTextIn 0.4s ease 1s both}
      .axp-so-progress-fill{height:100%;width:100%;background:linear-gradient(90deg,#4ecca3,#2ecc71);transform-origin:left;animation:axpSoProgressDrain 5.8s linear 1.2s forwards}
      @keyframes axpSoProgressDrain{from{transform:scaleX(1)}to{transform:scaleX(0)}}
      .axp-so-btn{background:#4ecca3;color:#060c1c;border:none;border-radius:0;padding:12px 32px;font-size:14px;font-weight:700;letter-spacing:0.4px;cursor:pointer;display:flex;align-items:center;gap:8px;animation:axpSoTextIn 0.4s ease 1.15s both}
      .axp-so-btn:active{opacity:0.84}
      @media(max-width:480px){.axp-so-icon-wrap{width:88px;height:88px} .axp-so-icon-wrap svg{width:88px;height:88px} .axp-so-title{font-size:22px}}`;
    document.head.appendChild(style);
  }
  const overlay = document.createElement("div");
  overlay.id = "axp-success-overlay";
  const cvs = document.createElement("canvas"); cvs.className="axp-so-canvas";
  overlay.appendChild(cvs);
  overlay.innerHTML += `
    <div class="axp-so-box">
      <div class="axp-so-icon-wrap">
        <svg viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="47" stroke="rgba(78,204,163,0.10)" stroke-width="2.5"/>
          <circle class="axp-so-track" cx="55" cy="55" r="47" stroke="#4ecca3" stroke-width="2.5" stroke-linecap="round" transform="rotate(-90 55 55)"/>
          <path class="axp-so-tick" d="M33 55 L47 70 L77 40" stroke="#4ecca3" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="axp-so-title">Success</h3>
      <p class="axp-so-msg">${escapeHtml(message)}</p>
      <div class="axp-so-progress"><div class="axp-so-progress-fill"></div></div>
      <button class="axp-so-btn" id="axp-so-cta"><i class="bi bi-arrow-right"></i> Continue</button>
    </div>`;
  document.body.appendChild(overlay);
  _runSuccessParticles(cvs);
  const close = () => {
    overlay.style.animation="axpSoOut 0.38s ease forwards";
    setTimeout(()=>{ if(document.body.contains(overlay))overlay.remove(); if(typeof onComplete==="function")onComplete(); },380);
  };
  const cta = overlay.querySelector("#axp-so-cta");
  if (cta) cta.addEventListener("click", close);
  setTimeout(close, 7200);
}

function _runSuccessParticles(canvas) {
  const ctx = canvas.getContext("2d");
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const cx=canvas.width/2, cy=canvas.height/2;
  const particles = Array.from({length:52},(_,i)=>{
    const angle=(i/52)*Math.PI*2, speed=Math.random()*3.8+1.8;
    return {x:cx,y:cy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:Math.random()*3.2+0.8,a:1,col:Math.random()>0.45?"78,204,163":"46,204,113"};
  });
  let frame=0;
  (function tick(){
    if(frame>=95)return; ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.09;p.a-=0.012;if(p.a<=0)return;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(${p.col},${p.a})`;ctx.fill();});
    frame++; requestAnimationFrame(tick);
  })();
}

function _ensurePopupStyles() {
  if (document.getElementById("popup-styles")) return;
  const style = document.createElement("style");
  style.id = "popup-styles";
  style.textContent = `
    .notification-popup{position:fixed;top:70px;right:20px;background:white;box-shadow:0 8px 28px rgba(0,0,0,0.14);z-index:100000;max-width:420px;width:calc(100% - 40px);max-height:calc(100vh - 100px);overflow:hidden;display:flex;flex-direction:column;animation:axpPopIn 0.25s cubic-bezier(0.22,1,0.36,1)}
    @keyframes axpPopIn{from{opacity:0;transform:translateY(-6px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
    .popup-header{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #e9ecef;background:#f8f9fa}
    .popup-header h4{margin:0;font-size:14.5px;font-weight:600;color:#1e293b;display:flex;align-items:center;gap:8px}
    .popup-header h4 i{color:#4ecca3;font-size:16px}
    .popup-close{background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;width:28px;height:28px;display:flex;align-items:center;justify-content:center;}
    .popup-body{overflow-y:auto;max-height:calc(100vh - 175px)}
    .popup-item{display:flex;gap:12px;padding:12px 18px;border-bottom:1px solid #f0f0f0;cursor:pointer}
    .popup-item:last-child{border-bottom:none}
    .popup-item-icon{width:34px;height:34px;min-width:34px;background:#e3f2fd;display:flex;align-items:center;justify-content:center;color:#2088bd;font-size:14px}
    .popup-item-icon.message-icon{background:#e8f5e9;color:#28a745}
    .popup-item-content{flex:1;min-width:0}
    .popup-item-content p{margin:0 0 3px;font-size:13px;color:#334155;line-height:1.5;word-wrap:break-word}
    .popup-item-time{font-size:11px;color:#94a3b8}
    .popup-empty{padding:32px 18px;text-align:center;color:#94a3b8}
    .popup-empty i{font-size:38px;margin-bottom:8px;opacity:0.4;display:block}
    .popup-empty p{margin:0;font-size:13px}
    @media(max-width:768px){.notification-popup{top:60px;right:10px;left:10px;width:calc(100% - 20px)}}`;
  document.head.appendChild(style);
}


/* ══════════════════════════════════════════════════════════════
   API HELPERS
══════════════════════════════════════════════════════════════ */
async function _apiPost(params) {
  const formData = new URLSearchParams(params);
  const res = await fetch(scriptURL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString()
  });
  return await res.json();
}

async function _apiGet(params) {
  const query = new URLSearchParams(params).toString();
  const res   = await fetch(`${scriptURL}?${query}`);
  return await res.json();
}

/* ─────────────────────────────────────────────────────────────
   SCHOOL SETUP STATUS
───────────────────────────────────────────────────────────── */
function _getSchoolStorageKey() {
  return `axpSchoolId_${(_dashboardData.schoolindex || "").toLowerCase()}`;
}
function _getSchoolMetaKey() {
  return `axpSchoolMeta_${(_dashboardData.schoolindex || "").toLowerCase()}`;
}

function _loadSchoolSetupStatus() {
  const storedId   = localStorage.getItem(_getSchoolStorageKey());
  const storedMeta = localStorage.getItem(_getSchoolMetaKey());
  if (storedId) {
    _appScriptSchoolId = storedId;
    if (storedMeta) { try { _schoolMeta = JSON.parse(storedMeta); } catch(e){} }
    _updateStatCards();
  }
  _updateSetupNotice();
}

function _saveSchoolSetup(schoolId, meta) {
  _appScriptSchoolId = schoolId;
  _schoolMeta        = meta;
  localStorage.setItem(_getSchoolStorageKey(), schoolId);
  localStorage.setItem(_getSchoolMetaKey(), JSON.stringify(meta));
  _updateStatCards();
  _updateSetupNotice();
}

function _updateSetupNotice() {
  const existing = document.getElementById("axp-setup-notice");
  if (existing) existing.remove();

  /* If account not active, lock everything and show payment notice */
  if (!_dashboardData || _dashboardData.status !== "ACTIVE") {
    _lockSidebarButtons();
    _showInactiveNotice();
    return;
  }

  if (_appScriptSchoolId) { _unlockSidebarButtons(); return; }

  _lockSidebarButtons();

  const dc = document.querySelector(".dashboard-content");
  if (!dc) return;
  const notice = document.createElement("div");
  notice.id = "axp-setup-notice";
  notice.className = "axp-alert axp-alert-warning";
  notice.style.cssText = "margin-bottom:16px;cursor:pointer;";
  notice.innerHTML = `
    <i class="bi bi-exclamation-triangle-fill" style="font-size:16px;flex-shrink:0;"></i>
    <div>
      <strong>School not yet set up in the results system.</strong>
      Click here or the <em>Setup</em> button in the sidebar to configure your school — this unlocks all features.
    </div>
    <button onclick="axpOpenSetupPopup()" style="margin-left:auto;white-space:nowrap;background:#4ecca3;color:#060c1c;border:none;padding:6px 14px;font-weight:700;font-size:12px;cursor:pointer;flex-shrink:0;">
      <i class="bi bi-gear-fill"></i> Setup Now
    </button>`;
  notice.addEventListener("click", e => { if (!e.target.closest("button")) axpOpenSetupPopup(); });
  dc.insertBefore(notice, dc.firstChild);
}

function _showInactiveNotice() {
  const dc = document.querySelector(".dashboard-content");
  if (!dc) return;
  const existing = document.getElementById("axp-inactive-notice");
  if (existing) existing.remove();
  const notice = document.createElement("div");
  notice.id = "axp-inactive-notice";
  notice.style.cssText = "background:#fef2f2;border-left:4px solid #ef4444;padding:16px 20px;margin-bottom:16px;";
  notice.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <i class="bi bi-lock-fill" style="font-size:20px;color:#ef4444;"></i>
      <strong style="font-size:14.5px;color:#991b1b;">Account Not Activated</strong>
    </div>
    <p style="font-size:13px;color:#7f1d1d;margin:0 0 10px;line-height:1.7;">
      Your account is pending activation. To unlock all features (Assign Tasks, Push Student Names, Task Progress),
      please pay the activation fee. Contact us using the details below:
    </p>
    <div style="background:#fff;padding:12px;border:1px solid #fca5a5;margin-bottom:10px;">
      <div style="font-size:13px;font-weight:700;color:#1a1a2e;margin-bottom:6px;"><i class="bi bi-telephone-fill" style="color:#4ecca3;"></i> Contact for Activation:</div>
      <div style="font-size:14px;font-weight:800;color:#4ecca3;letter-spacing:0.5px;">+255677819173</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px;">Call or WhatsApp — available Mon–Sat, 8am–6pm</div>
    </div>
    <p style="font-size:12px;color:#94a3b8;margin:0;">
      Once payment is confirmed and your account is activated, all features will be unlocked automatically.
    </p>`;
  dc.insertBefore(notice, dc.firstChild);
}

function _axpInactiveBlock() {
  return `
    <div class="axp-section-card" style="text-align:center;padding:40px 24px;">
      <i class="bi bi-lock-fill" style="font-size:40px;color:#ef4444;display:block;margin-bottom:16px;"></i>
      <h3 style="font-size:16px;font-weight:800;color:#991b1b;margin:0 0 10px;">Account Not Activated</h3>
      <p style="font-size:13px;color:#64748b;max-width:380px;margin:0 auto 18px;line-height:1.7;">
        This feature is locked. Please pay the activation fee to unlock all features.
        Contact us to activate your account:
      </p>
      <div style="background:#fef2f2;border:1px solid #fca5a5;padding:14px 20px;display:inline-block;margin-bottom:18px;">
        <div style="font-size:15px;font-weight:800;color:#4ecca3;letter-spacing:0.5px;">
          <i class="bi bi-telephone-fill"></i> +255677819173
        </div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">Call or WhatsApp for activation</div>
      </div>
      <br>
      <p style="font-size:11.5px;color:#94a3b8;">Once activated, all features unlock automatically.</p>
    </div>`;
}

function _lockSidebarButtons() {
  ["assign-tasks","push-names","task-progress"].forEach(sec => {
    const btn = document.querySelector(`.menu-item[data-section="${sec}"]`);
    if (!btn) return;
    btn.style.opacity = "0.45";
    btn.style.pointerEvents = "none";
    btn.title = _dashboardData && _dashboardData.status !== "ACTIVE"
      ? "Activate your account to unlock this feature"
      : "Complete school setup to unlock";
    if (!btn.querySelector(".axp-lock-badge")) {
      const badge = document.createElement("span");
      badge.className = "axp-lock-badge";
      badge.innerHTML = ' <i class="bi bi-lock-fill" style="font-size:11px;opacity:0.7;"></i>';
      btn.appendChild(badge);
    }
  });
}

function _unlockSidebarButtons() {
  ["assign-tasks","push-names","task-progress"].forEach(sec => {
    const btn = document.querySelector(`.menu-item[data-section="${sec}"]`);
    if (!btn) return;
    btn.style.opacity = "";
    btn.style.pointerEvents = "";
    btn.title = "";
    const badge = btn.querySelector(".axp-lock-badge");
    if (badge) badge.remove();
  });
}

/* ─────────────────────────────────────────────────────────────
   SCHOOL SETUP POPUP MODAL — z-index fixed to 999999999
───────────────────────────────────────────────────────────── */
window.axpOpenSetupPopup = function() {
  if (!_dashboardData || _dashboardData.status !== "ACTIVE") {
    _axpToast("Account not activated. Please pay the activation fee and call +255677819173 to activate.", "danger");
    const existing = document.getElementById("axp-inactive-notice");
    if (existing) existing.scrollIntoView({ behavior:"smooth" });
    return;
  }

  const existingOv = document.getElementById("axpSetupPopupOverlay");
  if (existingOv) existingOv.remove();

  const presetExamTypes = ["WEEKLY","MONTHLY","MIDTERM","MIDTERM2","TERMINAL","JOINT","ANNUAL","PREMOCK","MOCK","PRENECTA","PRENECTA2"];

  const overlay = document.createElement("div");
  overlay.id = "axpSetupPopupOverlay";
  /* FIXED: very high z-index to ensure it shows above everything */
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(6,12,28,0.88);z-index:999999999;display:flex;align-items:center;justify-content:center;padding:16px;";

  overlay.innerHTML = `
    <div id="axpSetupPopupBox" style="background:#fff;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,0.5);">
      <style>@keyframes axpPopIn{from{opacity:0;transform:scale(.92) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}</style>

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#060c1c,#0f2248);padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:38px;height:38px;background:rgba(78,204,163,0.15);display:flex;align-items:center;justify-content:center;">
            <i class="bi bi-building-gear" style="font-size:18px;color:#4ecca3;"></i>
          </div>
          <div>
            <div style="font-size:15px;font-weight:800;color:#fff;letter-spacing:.5px;">School Setup</div>
            <div style="font-size:11.5px;color:rgba(255,255,255,0.45);">Configure your school in the results system once</div>
          </div>
        </div>
        <button onclick="document.getElementById('axpSetupPopupOverlay').remove()" style="background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.6);width:30px;height:30px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button>
      </div>

      <!-- Steps progress bar -->
      <div style="padding:16px 24px 0;">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:18px;">
          ${["Year & Type","Classes","Exam Types","Subjects","Confirm"].map((s,i)=>`
            <div style="display:flex;align-items:center;gap:4px;flex:1;">
              <div class="axp-setup-step-dot" data-step="${i}" style="width:26px;height:26px;min-width:26px;background:${i===0?'#4ecca3':'#e2e8f0'};color:${i===0?'#060c1c':'#94a3b8'};font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;transition:all .25s;">${i+1}</div>
              ${i<4?'<div class="axp-setup-step-line" data-after="'+i+'" style="height:2px;flex:1;background:#e2e8f0;transition:background .25s;"></div>':''}
            </div>`).join("")}
        </div>
      </div>

      <!-- Step panels -->
      <div style="padding:0 24px 24px;">

        <!-- Step 0: Year & Type -->
        <div class="axp-setup-panel" data-panel="0">
          <p style="font-size:13px;color:#475569;margin:0 0 16px;line-height:1.6;">Enter the academic year and select your school level.</p>
          <div class="axp-form-row">
            <div class="axp-field-group">
              <label>Academic Year</label>
              <input id="axpPopYear" class="axp-input" placeholder="e.g. 2026" maxlength="4" style="font-size:20px;font-weight:700;text-align:center;letter-spacing:4px;" />
            </div>
            <div class="axp-field-group">
              <label>School Level</label>
              <select id="axpPopSchoolType" class="axp-select">
                <option value="SECONDARY">Secondary School</option>
                <option value="PRIMARY">Primary School</option>
                <option value="TERTIARY">Tertiary Institution</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Step 1: Classes -->
        <div class="axp-setup-panel" data-panel="1" style="display:none;">
          <p style="font-size:13px;color:#475569;margin:0 0 12px;line-height:1.6;">Add each class or stream. Press Enter or click Add after each one.</p>
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <input id="axpPopClassInput" class="axp-input" placeholder="e.g. Form I, Form II, S1A…" style="flex:1;" />
            <button onclick="axpPopAddClass()" class="axp-btn-secondary"><i class="bi bi-plus"></i> Add</button>
          </div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;">
            ${["Form I","Form II","Form III","Form IV","Form V","Form VI"].map(c=>`
              <button onclick="axpPopQuickClass('${c}')" style="font-size:11px;padding:4px 9px;background:#f0fdf9;color:#065f46;border:1px solid #4ecca3;cursor:pointer;">${c}</button>`).join("")}
          </div>
          <div id="axpPopClassTags" class="axp-tags-container"></div>
        </div>

        <!-- Step 2: Exam Types -->
<div class="axp-setup-panel" data-panel="2" style="display:none;">
  <p style="font-size:13px;color:#475569;margin:0 0 12px;line-height:1.6;">Select at least <strong>one</strong> exam type to start. You can add more later from your dashboard at any time.</p>
  <div class="subject-grid" id="axpPopExamGrid">
    ${presetExamTypes.map(et=>`
      <label class="subject-check-item" id="axpPopEt_${et}">
        <input type="checkbox" value="${et}" onchange="axpPopToggleExamType('${et}',this.checked)" />
        ${et}
      </label>`).join("")}
  </div>
  <div style="margin-top:10px;display:flex;gap:7px;align-items:center;">
    <input id="axpPopCustomExamInput" class="axp-input" style="flex:1;max-width:220px;" placeholder="Custom exam name e.g. QUIZ1" />
    <button onclick="axpPopAddCustomExamType()" class="axp-btn-secondary" style="font-size:12px;padding:6px 12px;">
      <i class="bi bi-plus"></i> Add Custom
    </button>
  </div>
  <div id="axpPopSelectedExamTypes" class="axp-tags-container" style="margin-top:8px;"></div>
  <p style="font-size:11px;color:#94a3b8;margin:8px 0 0;"><i class="bi bi-info-circle"></i> You don't need to select all now — add more exam types later from Settings.</p>
</div>

        <!-- Step 3: Subjects per Class -->
        <div class="axp-setup-panel" data-panel="3" style="display:none;">
          <p style="font-size:13px;color:#475569;margin:0 0 12px;line-height:1.6;">Select subjects for each class.</p>
          <div id="axpPopSubjectsTabs" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;"></div>
          <div id="axpPopSubjectsContent"></div>
        </div>

        <!-- Step 4: Confirm -->
        <div class="axp-setup-panel" data-panel="4" style="display:none;">
          <div style="background:#f0fdf9;border-left:3px solid #4ecca3;padding:16px;margin-bottom:14px;">
            <div style="font-size:13.5px;font-weight:700;color:#065f46;margin-bottom:10px;display:flex;align-items:center;gap:7px;">
              <i class="bi bi-check-circle-fill"></i> Ready to Create
            </div>
            <div id="axpPopConfirmSummary" style="font-size:12.5px;color:#374151;line-height:1.8;"></div>
          </div>
          <div class="axp-alert axp-alert-warning">
            <i class="bi bi-info-circle-fill"></i>
            <span>This will create database for each class and exam type in academixPoint Data Center.</span>
          </div>
          <div id="axpSetupPopupMsg" style="margin-top:10px;"></div>
        </div>

        <!-- Navigation -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding-top:14px;border-top:1px solid #e2e8f0;">
          <button id="axpPopPrevBtn" onclick="axpPopStep(-1)" class="axp-btn-secondary" style="display:none;"><i class="bi bi-chevron-left"></i> Back</button>
          <div style="margin-left:auto;display:flex;gap:8px;">
            <button id="axpPopNextBtn" onclick="axpPopStep(1)" class="axp-btn-primary"><i class="bi bi-chevron-right"></i> Next</button>
            <button id="axpPopSubmitBtn" onclick="axpPopSubmitSchool()" class="axp-btn-primary" style="display:none;"><i class="bi bi-rocket"></i> Create My School</button>
          </div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  window._axpPopStep       = 0;
  window._axpPopClasses    = [];
  window._axpPopExamTypes  = [];
  window._axpPopSubjects   = {};
  window._axpPopActiveTab  = null;

  setTimeout(() => {
    const ci = document.getElementById("axpPopClassInput");
    if (ci) ci.addEventListener("keydown", e => { if (e.key==="Enter") { e.preventDefault(); axpPopAddClass(); } });
    _axpPopRenderStep(0);
  }, 50);
};

/* ── Popup step helpers ───────────────────────────────── */
window._axpPopStep = 0;
window._axpPopClasses = [];
window._axpPopExamTypes = [];
window._axpPopSubjects = {};
window._axpPopActiveTab = null;
const _presetSubjectsList_popup = ["MATHEMATICS","ENGLISH","KISWAHILI","BIOLOGY","CHEMISTRY","PHYSICS","HISTORY","GEOGRAPHY","CIVICS","BOOK KEEPING","COMMERCE","AGRICULTURE","COMPUTER SCIENCE","FINE ART","MUSIC","FRENCH","ARABIC","RELIGION","PHYSICAL EDUCATION","LITERATURE IN ENGLISH"];

function _axpPopRenderStep(step) {
  document.querySelectorAll(".axp-setup-panel").forEach(p => p.style.display = "none");
  const panel = document.querySelector(`.axp-setup-panel[data-panel="${step}"]`);
  if (panel) panel.style.display = "block";

  document.querySelectorAll(".axp-setup-step-dot").forEach((dot, i) => {
    dot.style.background = i <= step ? "#4ecca3" : "#e2e8f0";
    dot.style.color      = i <= step ? "#060c1c" : "#94a3b8";
  });
  document.querySelectorAll(".axp-setup-step-line").forEach((line, i) => {
    line.style.background = i < step ? "#4ecca3" : "#e2e8f0";
  });

  const prevBtn   = document.getElementById("axpPopPrevBtn");
  const nextBtn   = document.getElementById("axpPopNextBtn");
  const submitBtn = document.getElementById("axpPopSubmitBtn");
  if (prevBtn)   prevBtn.style.display   = step > 0 ? "inline-flex" : "none";
  if (nextBtn)   nextBtn.style.display   = step < 4 ? "inline-flex" : "none";
  if (submitBtn) submitBtn.style.display = step === 4 ? "inline-flex" : "none";

  if (step === 3) _axpPopRenderSubjectsTabs();
  if (step === 4) _axpPopRenderConfirm();
}

window.axpPopStep = function(dir) {
  const cur = window._axpPopStep;
  if (dir > 0) {
    if (cur === 0) {
      const y = (document.getElementById("axpPopYear") || {}).value || "";
      if (!/^\d{4}$/.test(y.trim())) { alert("Please enter a valid 4-digit year."); return; }
    }
    if (cur === 1 && window._axpPopClasses.length === 0) { alert("Add at least one class."); return; }
    if (cur === 2 && window._axpPopExamTypes.length === 0) { alert("Select at least one exam type."); return; }
    if (cur === 3) {
      const empty = window._axpPopClasses.filter(c => !window._axpPopSubjects[c] || window._axpPopSubjects[c].length === 0);
      if (empty.length > 0) { alert(`Please select subjects for: ${empty.join(", ")}`); return; }
    }
  }
  window._axpPopStep = Math.max(0, Math.min(4, cur + dir));
  _axpPopRenderStep(window._axpPopStep);
};

window.axpPopAddClass = function() {
  const inp = document.getElementById("axpPopClassInput");
  const val = inp.value.trim().toUpperCase();
  if (!val || window._axpPopClasses.includes(val)) { inp.value=""; return; }
  window._axpPopClasses.push(val);
  window._axpPopSubjects[val] = [];
  inp.value = "";
  _axpPopRenderClassTags();
};

window.axpPopQuickClass = function(cls) {
  const val = cls.toUpperCase();
  if (window._axpPopClasses.includes(val)) return;
  window._axpPopClasses.push(val);
  window._axpPopSubjects[val] = [];
  _axpPopRenderClassTags();
};

window.axpPopRemoveClass = function(cls) {
  window._axpPopClasses = window._axpPopClasses.filter(c => c !== cls);
  delete window._axpPopSubjects[cls];
  _axpPopRenderClassTags();
};

function _axpPopRenderClassTags() {
  const cont = document.getElementById("axpPopClassTags");
  if (!cont) return;
  cont.innerHTML = window._axpPopClasses.map(c => `
    <span class="axp-tag">
      ${escapeHtml(c)}
      <button class="remove-tag" onclick="axpPopRemoveClass('${c.replace(/'/g,"\\'")}')">×</button>
    </span>`).join("");
}

window.axpPopToggleExamType = function(et, checked) {
  if (checked) { if (!window._axpPopExamTypes.includes(et)) window._axpPopExamTypes.push(et); }
  else         { window._axpPopExamTypes = window._axpPopExamTypes.filter(e => e !== et); }
  const cont = document.getElementById("axpPopSelectedExamTypes");
  if (cont) cont.innerHTML = window._axpPopExamTypes.map(e => `<span class="axp-tag">${e}</span>`).join("");
};

function _axpPopRenderSubjectsTabs() {
  const tabsCont = document.getElementById("axpPopSubjectsTabs");
  const content  = document.getElementById("axpPopSubjectsContent");
  if (!tabsCont || !content) return;

  if (!window._axpPopActiveTab || !window._axpPopClasses.includes(window._axpPopActiveTab)) {
    window._axpPopActiveTab = window._axpPopClasses[0] || null;
  }

  tabsCont.innerHTML = window._axpPopClasses.map(c => `
    <button onclick="axpPopSwitchSubjectTab('${c.replace(/'/g,"\\'")}' )"
      style="padding:6px 14px;border:1px solid ${c===window._axpPopActiveTab?'#4ecca3':'#e2e8f0'};background:${c===window._axpPopActiveTab?'#f0fdf9':'#fff'};color:${c===window._axpPopActiveTab?'#065f46':'#334155'};font-weight:600;font-size:12.5px;cursor:pointer;">
      ${escapeHtml(c)}
    </button>`).join("");

  const active   = window._axpPopActiveTab;
  const selected = active ? (window._axpPopSubjects[active] || []) : [];

  content.innerHTML = active ? `
    <p style="font-size:13px;color:#64748b;margin:0 0 8px;">Subjects for <strong>${escapeHtml(active)}</strong>:</p>
    <div class="subject-grid">
      ${_presetSubjectsList_popup.map(s => `
        <label class="subject-check-item ${selected.includes(s) ? "checked" : ""}">
          <input type="checkbox" value="${s}" ${selected.includes(s) ? "checked" : ""}
            onchange="axpPopToggleSubject('${active.replace(/'/g,"\\'")}','${s}',this.checked)" />
          ${s}
        </label>`).join("")}
    </div>
    <div style="display:flex;gap:7px;margin-top:8px;">
      <button onclick="axpPopSelectAllSubjects('${active.replace(/'/g,"\\'")}' )" class="axp-btn-secondary" style="font-size:12px;padding:5px 10px;">Select All</button>
      <button onclick="axpPopClearSubjects('${active.replace(/'/g,"\\'")}' )" class="axp-btn-secondary" style="font-size:12px;padding:5px 10px;">Clear All</button>
    </div>` : "<p>No classes added.</p>";
}

window.axpPopSwitchSubjectTab = function(cls) {
  window._axpPopActiveTab = cls;
  _axpPopRenderSubjectsTabs();
};
window.axpPopToggleSubject = function(cls, sub, checked) {
  if (!window._axpPopSubjects[cls]) window._axpPopSubjects[cls] = [];
  if (checked) { if (!window._axpPopSubjects[cls].includes(sub)) window._axpPopSubjects[cls].push(sub); }
  else         { window._axpPopSubjects[cls] = window._axpPopSubjects[cls].filter(s => s !== sub); }
  const lbl = document.querySelector(`#axpPopSubjectsContent .subject-check-item input[value="${sub}"]`);
  if (lbl) lbl.closest(".subject-check-item").classList.toggle("checked", checked);
};
window.axpPopSelectAllSubjects = function(cls) { window._axpPopSubjects[cls] = [..._presetSubjectsList_popup]; _axpPopRenderSubjectsTabs(); };
window.axpPopClearSubjects     = function(cls) { window._axpPopSubjects[cls] = []; _axpPopRenderSubjectsTabs(); };

function _axpPopRenderConfirm() {
  const el = document.getElementById("axpPopConfirmSummary");
  if (!el) return;
  const year = (document.getElementById("axpPopYear") || {}).value || "?";
  const type = (document.getElementById("axpPopSchoolType") || {}).value || "?";
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;">
      <div><span style="color:#94a3b8;">School:</span> <strong>${escapeHtml(_dashboardData.schoolname||"Your School")}</strong></div>
      <div><span style="color:#94a3b8;">Year:</span> <strong>${escapeHtml(year)}</strong></div>
      <div><span style="color:#94a3b8;">Level:</span> <strong>${escapeHtml(type)}</strong></div>
      <div><span style="color:#94a3b8;">Classes:</span> <strong>${window._axpPopClasses.length}</strong></div>
      <div><span style="color:#94a3b8;">Exam Types:</span> <strong>${window._axpPopExamTypes.join(", ")}</strong></div>
      <div><span style="color:#94a3b8;">Total Subjects:</span> <strong>${Object.values(window._axpPopSubjects).reduce((a,v)=>a+v.length,0)}</strong></div>
    </div>`;
}

window.axpPopSubmitSchool = async function() {
  const btn = document.getElementById("axpPopSubmitBtn");
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = '<span class="axp-spinner-sm"></span> Creating...';

  const year = (document.getElementById("axpPopYear") || {}).value || "";
  const type = (document.getElementById("axpPopSchoolType") || {}).value || "SECONDARY";

  const msgEl = document.getElementById("axpSetupPopupMsg");
  if (msgEl) {
    msgEl.innerHTML = `
      <div style="background:#f8fafc;padding:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:13px;font-weight:600;color:#374151;" id="axpPopProgressLabel">Preparing structure...</span>
          <span style="font-size:13px;font-weight:800;color:#4ecca3;" id="axpPopProgressPct">0%</span>
        </div>
        <div class="axp-progress-bar" style="height:8px;">
          <div class="axp-progress-fill" id="axpPopProgressFill" style="width:0%;transition:width .4s ease;"></div>
        </div>
      </div>`;
  }

  let fakeP = 0;
  const labels = ["Validating data...","Connecting to AcademixPoint Data Center...","Setting up exam records...","Saving school profile...","Almost done..."];
  const ticker = setInterval(() => {
    fakeP = Math.min(fakeP + (Math.random() * 8 + 2), 90);
    const pct = Math.floor(fakeP);
    const fill = document.getElementById("axpPopProgressFill");
    const pctEl = document.getElementById("axpPopProgressPct");
    const labelEl = document.getElementById("axpPopProgressLabel");
    if (fill)   fill.style.width   = pct + "%";
    if (pctEl)  pctEl.textContent  = pct + "%";
    if (labelEl) labelEl.textContent = labels[Math.min(Math.floor(pct/20), labels.length-1)];
  }, 300);

  try {
    const res = await _apiPost({
      mode      : "createSchool",
      adminEmail: _dashboardData.email,
      schoolName: _dashboardData.schoolname,
      year,
      schoolType: type,
      classes   : window._axpPopClasses.join(","),
      examTypes : window._axpPopExamTypes.join(","),
      subjects  : JSON.stringify(window._axpPopSubjects)
    });

    clearInterval(ticker);

    if (res.status === "success" && res.schoolId) {
      ["axpPopProgressFill","axpPopProgressPct","axpPopProgressLabel"].forEach((id) => {
        const el2 = document.getElementById(id);
        if (!el2) return;
        if (id === "axpPopProgressFill") { el2.style.width = "100%"; el2.style.background = "#10b981"; }
        if (id === "axpPopProgressPct")  el2.textContent = "100%";
        if (id === "axpPopProgressLabel") el2.textContent = "School created successfully!";
      });

      const meta = {
        year,
        schoolType: type,
        classes   : window._axpPopClasses,
        examTypes : window._axpPopExamTypes,
        subjects  : window._axpPopSubjects
      };
      _saveSchoolSetup(res.schoolId, meta);

      setTimeout(() => {
        const ov = document.getElementById("axpSetupPopupOverlay");
        if (ov) ov.remove();
        _updateSetupNotice();
        _axpToast("School configured! All features are now unlocked.", "success");
      }, 1200);
    } else {
      clearInterval(ticker);
      const fill2 = document.getElementById("axpPopProgressFill");
      if (fill2) { fill2.style.width="100%"; fill2.style.background="#ef4444"; }
      if (msgEl) {
        const prevContent = msgEl.innerHTML;
        msgEl.innerHTML = prevContent + `<div class="axp-alert axp-alert-danger" style="margin-top:8px;"><i class="bi bi-x-circle-fill"></i><span>${escapeHtml(res.message||"Failed. Please try again.")}</span></div>`;
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-rocket"></i> Retry';
    }
  } catch(err) {
    clearInterval(ticker);
    if (msgEl) msgEl.innerHTML += `<div class="axp-alert axp-alert-danger" style="margin-top:8px;"><i class="bi bi-x-circle-fill"></i><span>Network error. Please check your connection.</span></div>`;
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-rocket"></i> Retry';
  }
};

function _axpToast(message, type="info") {
  const colors = { success:"#10b981", danger:"#ef4444", warning:"#f59e0b", info:"#4ecca3" };
  const toast  = document.createElement("div");
  toast.style.cssText = `position:fixed;bottom:28px;right:24px;background:#1a1a2e;color:#fff;padding:12px 18px;border-left:3px solid ${colors[type]||colors.info};box-shadow:0 8px 24px rgba(0,0,0,.35);z-index:9999999;font-size:13.5px;font-weight:500;max-width:340px;line-height:1.5;animation:axpToastIn .3s ease;`;
  toast.innerHTML = `<style>@keyframes axpToastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}</style>${escapeHtml(message)}`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.transition="opacity .4s"; toast.style.opacity="0"; setTimeout(()=>toast.remove(),400); }, 4000);
}

async function _updateStatCards() {
  if (!_schoolMeta) return;
  _injectEnhancedStats(); // render skeleton first

  const classes   = _schoolMeta.classes   || [];
  const examTypes = _schoolMeta.examTypes || [];
  if (!classes.length || !examTypes.length) return;

  // Use first available exam type — same pattern as Task Progress
  const examType = examTypes[0];

  let totalStudents = 0, qualified = 0, disqualified = 0, notAdmitted = 0;

  try {
    for (const cls of classes) {
      const res = await _apiGet({
        schoolId : _appScriptSchoolId,
        year     : _schoolMeta.year,
        class    : cls,
        examType : examType
      });

      const students = res.students || res.data || [];
      totalStudents += students.length;

      students.forEach(s => {
        const avg = parseFloat(s.average || s.avg || 0);
        if (avg >= 45)      qualified++;
        else if (avg > 0)   disqualified++;
        else                notAdmitted++;
      });
    }
  } catch(e) {
    console.warn("Stats fetch error:", e);
  }

  _injectEnhancedStats({ totalStudents, qualified, disqualified, notAdmitted });
}
function _injectEnhancedStats(stats = {}) {
  const existing = document.getElementById("axp-enhanced-stats");
  if (existing) existing.remove();

  const dc = document.querySelector(".dashboard-content");
  if (!dc) return;

  const {
    totalStudents = "—",
    qualified     = "—",
    disqualified  = "—",
    notAdmitted   = "—"
  } = stats;

  const statsEl = document.createElement("div");
  statsEl.id = "axp-enhanced-stats";
  statsEl.style.cssText = "margin-bottom:16px;";
  statsEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:12px;">
      ${[
        { label:"Exam Centres",   val:"1",           icon:"bi-building",          color:"#3b82f6" },
        { label:"Qualified",      val:qualified,     icon:"bi-person-check-fill", color:"#10b981" },
        { label:"Disqualified",   val:disqualified,  icon:"bi-person-x-fill",     color:"#ef4444" },
        { label:"Not Admitted",   val:notAdmitted,   icon:"bi-person-dash-fill",  color:"#f59e0b" },
        { label:"Total Students", val:totalStudents, icon:"bi-people-fill",       color:"#4ecca3" },
        { label:"Classes",        val:(_schoolMeta && _schoolMeta.classes) ? _schoolMeta.classes.length : "—",
          icon:"bi-journal-bookmark-fill", color:"#8b5cf6" }
      ].map(s => `
        <div style="background:#fff;padding:14px 16px;border-left:3px solid ${s.color};display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;background:${s.color}18;display:flex;align-items:center;justify-content:center;">
            <i class="bi ${s.icon}" style="font-size:17px;color:${s.color};"></i>
          </div>
          <div>
            <div style="font-size:20px;font-weight:900;color:#1a1a2e;">${s.val}</div>
            <div style="font-size:10.5px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.4px;">${s.label}</div>
          </div>
        </div>`).join("")}
    </div>
    <div style="background:#fff;padding:14px 18px;border-left:3px solid #4ecca3;display:flex;flex-wrap:wrap;gap:16px;align-items:center;">
      <span style="font-size:12px;font-weight:700;color:#1a1a2e;">
        <i class="bi bi-bar-chart-fill" style="color:#4ecca3;margin-right:5px;"></i>Quick Analytics
      </span>
      <button onclick="navigateToSection('analytics')" class="axp-btn-secondary" style="font-size:12px;padding:5px 12px;">
        <i class="bi bi-graph-up"></i> View Full Analytics
      </button>
      <button onclick="navigateToSection('students-report')" class="axp-btn-secondary" style="font-size:12px;padding:5px 12px;">
        <i class="bi bi-trophy"></i> Best &amp; Least Students
      </button>
    </div>`;

  dc.insertBefore(statsEl, dc.firstChild);
}
/* ─────────────────────────────────────────────────────────────
   SECTION NAVIGATION ENGINE
───────────────────────────────────────────────────────────── */
let _currentSection = "dashboard";

function navigateToSection(sectionName) {
  _currentSection = sectionName;

  const dashContent  = document.querySelector(".dashboard-content");
  const sectionWrap  = _ensureSectionWrapper();

  if (sectionName === "dashboard") {
    sectionWrap.style.display = "none";
    if (dashContent) dashContent.style.display = "";
    return;
  }

  if (dashContent) dashContent.style.display = "none";
  sectionWrap.style.display = "block";
  /* No inner scroll — let main dashboard scroll */
  sectionWrap.style.overflow = "visible";
  /* Scroll main content to top */
  const mc = document.getElementById("mainContent");
  if (mc) mc.scrollTop = 0;
  sectionWrap.innerHTML = "";

  switch (sectionName) {
    case "assign-tasks":    renderAssignTeachersSection();   break;
    case "push-names":      renderPushStudentsSection();     break;
    case "task-progress":   renderTaskProgressSection();     break;
    case "demo":            renderDemoSection();             break;
    case "notifications":   renderNotificationsSectionFull(); break;
    case "messages":        renderMessagesSectionFull();     break;
    case "settings":        renderSettingsSection();         break;
    case "help":            renderHelpSection();             break;
    case "analytics":       renderAnalyticsSection();        break;
    case "students-report": renderStudentsReportSection();   break;
    case "results-reports": renderResultsReportsSection(); break;
    case "data-audit":      renderDataAuditSection();       break;
    default:
      sectionWrap.innerHTML = `
        <div class="axp-section-card">
          <div class="axp-empty-state">
            <i class="bi bi-tools"></i>
            <p>This section is coming soon.</p>
          </div>
        </div>`;
  }
}

function _ensureSectionWrapper() {
  let sw = document.getElementById("axpSectionWrapper");
  if (!sw) {
    sw = document.createElement("div");
    sw.id = "axpSectionWrapper";
    sw.style.cssText = "padding:20px;display:none;overflow:visible;";
    const dc = document.querySelector(".dashboard-content");
    if (dc) dc.parentNode.insertBefore(sw, dc);
    else {
      const mc = document.getElementById("mainContent");
      if (mc) mc.appendChild(sw);
    }
  }
  return sw;
}

/* ─────────────────────────────────────────────────────────────
   SECTION: ASSIGN TASKS TO TEACHERS
───────────────────────────────────────────────────────────── */
function renderAssignTeachersSection() {
  const sw = document.getElementById("axpSectionWrapper");

  if (_dashboardData && _dashboardData.status !== "ACTIVE") {
    sw.innerHTML = _axpInactiveBlock();
    return;
  }
  if (!_appScriptSchoolId) {
    sw.innerHTML = `
      <div class="axp-section-card" style="text-align:center;padding:40px 24px;">
        <i class="bi bi-lock-fill" style="font-size:36px;color:#4ecca3;display:block;margin-bottom:14px;"></i>
        <h3 style="font-size:16px;font-weight:800;color:#1a1a2e;margin:0 0 8px;">Feature Locked</h3>
        <p style="font-size:13px;color:#64748b;max-width:360px;margin:0 auto 20px;line-height:1.6;">
          Configure your school first to unlock teacher assignment.
        </p>
        <button onclick="axpOpenSetupPopup()" class="axp-btn-primary" style="font-size:13.5px;padding:10px 24px;">
          <i class="bi bi-gear-fill"></i> Setup School Now
        </button>
      </div>`;
    return;
  }

  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-person-badge"></i> Assign Tasks to Teachers</div>
      <div class="axp-alert axp-alert-info" style="margin-bottom:18px;">
        <i class="bi bi-info-circle"></i>
        <span>Add teachers and assign them classes and subjects they will enter marks for.</span>
      </div>

      <!-- Mode toggle -->
      <div style="display:flex;gap:0;border:1px solid #e2e8f0;margin-bottom:18px;width:fit-content;">
        <button onclick="axpTchSetMode('simple')" id="axpTchModeSimple"
          style="padding:8px 18px;border:none;font-size:12.5px;font-weight:700;cursor:pointer;background:#4ecca3;color:#060c1c;">
          <i class="bi bi-lightning-charge"></i> Quick Add
        </button>
        <button onclick="axpTchSetMode('detailed')" id="axpTchModeDetailed"
          style="padding:8px 18px;border:none;font-size:12.5px;font-weight:700;cursor:pointer;background:#f1f5f9;color:#334155;">
          <i class="bi bi-card-list"></i> Detailed Add
        </button>
        <button onclick="axpTchSetMode('excel')" id="axpTchModeExcel"
          style="padding:8px 18px;border:none;font-size:12.5px;font-weight:700;cursor:pointer;background:#f1f5f9;color:#334155;">
          <i class="bi bi-file-earmark-excel"></i> Excel Upload
        </button>
      </div>

      <!-- SIMPLE MODE -->
      <div id="axpTchFormSimple" style="background:#f8fafc;padding:18px;margin-bottom:20px;">
        <h4 style="font-size:13.5px;font-weight:700;color:#1a1a2e;margin:0 0 14px;display:flex;align-items:center;gap:7px;">
          <i class="bi bi-lightning-charge" style="color:#4ecca3;"></i> Quick Add Teacher
        </h4>
        <div class="axp-form-row">
          <div class="axp-field-group">
            <label>Teacher Full Name *</label>
            <input id="axpTchName" class="axp-input" placeholder="e.g. John Mwangi" />
          </div>
          <div class="axp-field-group">
            <label>Phone (Optional)</label>
            <input id="axpTchPhone" class="axp-input" type="tel" placeholder="e.g. 0712345678" />
          </div>
        </div>
        <div style="margin-bottom:10px;">
          <label style="font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:7px;">Subject Assignments</label>
          <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:7px;">
            <select id="axpTchClassSimple" class="axp-select" style="flex:1;min-width:120px;max-width:180px;" onchange="axpTchPopulateSubject('axpTchClassSimple','axpTchSubjectSimple')">
              <option value="">Select Class</option>
              ${(_schoolMeta && _schoolMeta.classes ? _schoolMeta.classes : []).map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
            </select>
            <select id="axpTchSubjectSimple" class="axp-select" style="flex:1;min-width:140px;max-width:200px;">
              <option value="">Select Subject</option>
            </select>
            <button onclick="axpAddTeacherAssignment()" class="axp-btn-secondary">
              <i class="bi bi-plus"></i> Add
            </button>
          </div>
          <div id="axpTchAssignments" class="axp-tags-container"></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button onclick="axpSaveTeacher()" class="axp-btn-primary" id="axpSaveTeacherBtn">
            <i class="bi bi-floppy"></i> Save Teacher
          </button>
          <button onclick="axpClearTeacherForm()" class="axp-btn-secondary">
            <i class="bi bi-x-circle"></i> Clear
          </button>
        </div>
        <div id="axpTeacherFormMsg" style="margin-top:8px;"></div>
      </div>

      <!-- DETAILED MODE -->
      <div id="axpTchFormDetailed" style="background:#f8fafc;padding:18px;margin-bottom:20px;display:none;">
        <h4 style="font-size:13.5px;font-weight:700;color:#1a1a2e;margin:0 0 14px;display:flex;align-items:center;gap:7px;">
          <i class="bi bi-card-list" style="color:#4ecca3;"></i> Detailed Teacher Entry
        </h4>
        <div class="axp-form-row">
          <div class="axp-field-group">
            <label>Teacher Full Name *</label>
            <input id="axpTchNameD" class="axp-input" placeholder="e.g. John Mwangi" />
          </div>
          <div class="axp-field-group">
            <label>Teacher Email (Gmail) *</label>
            <input id="axpTchEmailD" class="axp-input" type="email" placeholder="e.g. john@gmail.com" />
          </div>
        </div>
        <div class="axp-form-row">
          <div class="axp-field-group">
            <label>Phone Number (Optional)</label>
            <input id="axpTchPhoneD" class="axp-input" type="tel" placeholder="e.g. 0712345678" />
          </div>
          <div class="axp-field-group">
            <label>National ID / TSC No (Optional)</label>
            <input id="axpTchIdD" class="axp-input" placeholder="e.g. TSC-12345" />
          </div>
        </div>
        <div class="axp-form-row">
          <div class="axp-field-group">
            <label>Qualification (Optional)</label>
            <input id="axpTchQualD" class="axp-input" placeholder="e.g. B.Ed, Diploma" />
          </div>
          <div class="axp-field-group">
            <label>Years of Experience (Optional)</label>
            <input id="axpTchExpD" class="axp-input" type="number" placeholder="e.g. 5" />
          </div>
        </div>
        <div style="margin-bottom:10px;">
          <label style="font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:7px;">Subject Assignments</label>
          <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:7px;">
            <select id="axpTchClass" class="axp-select" style="flex:1;min-width:120px;max-width:180px;" onchange="axpTchPopulateSubject('axpTchClass','axpTchSubject')">
              <option value="">Select Class</option>
              ${(_schoolMeta && _schoolMeta.classes ? _schoolMeta.classes : []).map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
            </select>
            <select id="axpTchSubject" class="axp-select" style="flex:1;min-width:140px;max-width:200px;">
              <option value="">Select Subject</option>
            </select>
            <button onclick="axpAddTeacherAssignmentFrom('axpTchClass','axpTchSubject')" class="axp-btn-secondary">
              <i class="bi bi-plus"></i> Add
            </button>
          </div>
          <div id="axpTchAssignmentsD" class="axp-tags-container"></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button onclick="axpSaveTeacherDetailed()" class="axp-btn-primary" id="axpSaveTeacherBtnD">
            <i class="bi bi-floppy"></i> Save Teacher
          </button>
          <button onclick="axpClearTeacherFormDetailed()" class="axp-btn-secondary">
            <i class="bi bi-x-circle"></i> Clear
          </button>
        </div>
        <div id="axpTeacherFormMsgD" style="margin-top:8px;"></div>
      </div>

      <!-- EXCEL MODE -->
      <div id="axpTchFormExcel" style="background:#f8fafc;padding:18px;margin-bottom:20px;display:none;">
        <h4 style="font-size:13.5px;font-weight:700;color:#1a1a2e;margin:0 0 10px;display:flex;align-items:center;gap:7px;">
          <i class="bi bi-file-earmark-excel" style="color:#217346;"></i> Bulk Teacher Upload via Excel
        </h4>
        <div class="axp-alert axp-alert-info" style="margin-bottom:12px;">
          <i class="bi bi-info-circle"></i>
          <span>Download the template, fill in teacher data, then upload to the AcademixPoint Data Center. Required columns: <strong>Name, Email, Class, Subject</strong>. Optional: Phone, Qualification, Years of Experience.</span>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <button onclick="axpDownloadTeacherTemplate()" class="axp-btn-secondary">
            <i class="bi bi-download"></i> Download Template
          </button>
        </div>
        <label class="axp-excel-drop" id="axpTchExcelDrop" for="axpTchExcelFile" ondragover="this.classList.add('dragover');event.preventDefault()" ondragleave="this.classList.remove('dragover')" ondrop="axpHandleTeacherExcelDrop(event)">
          <i class="bi bi-cloud-upload"></i>
          <p>Drag & drop your Excel file here or click to browse</p>
          <small>Supports .xlsx, .xls, .csv</small>
        </label>
        <input type="file" id="axpTchExcelFile" accept=".xlsx,.xls,.csv" style="display:none;" onchange="axpHandleTeacherExcelFile(this)" />
        <div id="axpTchExcelPreview" style="margin-top:12px;"></div>
        <div id="axpTchExcelMsg" style="margin-top:8px;"></div>
      </div>

      <!-- Tab navigation -->
      <div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:16px;">
        <button onclick="axpTchViewTab('list')" id="axpTchTabList"
          style="padding:9px 18px;border:none;background:none;font-weight:700;font-size:12.5px;color:#4ecca3;border-bottom:2px solid #4ecca3;margin-bottom:-2px;cursor:pointer;">
          <i class="bi bi-people"></i> Teacher List
        </button>
        <button onclick="axpTchViewTab('edit')" id="axpTchTabEdit"
          style="padding:9px 18px;border:none;background:none;font-weight:700;font-size:12.5px;color:#94a3b8;border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;">
          <i class="bi bi-pencil-square"></i> View & Edit
        </button>
      </div>

      <!-- Teacher List Panel -->
      <div id="axpTchPanelList">
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
          <button onclick="axpLoadTeachers()" class="axp-btn-secondary">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
        <div id="axpTeachersList">
          <div class="axp-empty-state">
            <div class="axp-spinner-sm" style="margin:0 auto 8px;"></div>
            <p>Loading teachers...</p>
          </div>
        </div>
      </div>

      <!-- View & Edit Panel -->
      <div id="axpTchPanelEdit" style="display:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="font-size:12.5px;font-weight:700;color:#1a1a2e;">
            <i class="bi bi-pencil-square" style="color:#4ecca3;"></i> Edit Teacher Records
          </span>
          <button onclick="axpLoadEditableTeachers()" class="axp-btn-secondary">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
        <div id="axpTchEditContent">
          <div class="axp-empty-state">
            <i class="bi bi-people"></i>
            <p>Click Refresh to load teachers for editing.</p>
          </div>
        </div>
        <div id="axpTchEditMsg" style="margin-top:8px;"></div>
      </div>
    </div>`;

  document.getElementById("axpTchClass") && document.getElementById("axpTchClass").addEventListener("change", function() {
    axpTchPopulateSubject("axpTchClass","axpTchSubject");
  });
  document.getElementById("axpTchClassSimple") && document.getElementById("axpTchClassSimple").addEventListener("change", function() {
    axpTchPopulateSubject("axpTchClassSimple","axpTchSubjectSimple");
  });

  axpLoadTeachers();
}

/* Teacher mode toggle */
window.axpTchSetMode = function(mode) {
  ["simple","detailed","excel"].forEach(m => {
    const form = document.getElementById(`axpTchForm${m.charAt(0).toUpperCase()+m.slice(1)}`);
    const btn  = document.getElementById(`axpTchMode${m.charAt(0).toUpperCase()+m.slice(1)}`);
    if (form) form.style.display = m === mode ? "block" : "none";
    if (btn)  { btn.style.background = m === mode ? "#4ecca3" : "#f1f5f9"; btn.style.color = m === mode ? "#060c1c" : "#334155"; }
  });
};

window.axpTchPopulateSubject = function(classId, subjectId) {
  const cls = (document.getElementById(classId)||{}).value;
  const sub = document.getElementById(subjectId);
  if (!sub) return;
  sub.innerHTML = '<option value="">Select Subject</option>';
  if (cls && _schoolMeta && _schoolMeta.subjects && _schoolMeta.subjects[cls]) {
    _schoolMeta.subjects[cls].forEach(s => {
      sub.innerHTML += `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`;
    });
  }
};

window._axpTchAssignmentsList = [];
window._axpTchAssignmentsListD = [];

window.axpAddTeacherAssignment = function() {
  const cls = (document.getElementById("axpTchClassSimple")||{}).value;
  const sub = (document.getElementById("axpTchSubjectSimple")||{}).value;
  if (!cls || !sub) { _showSectionMsg("axpTeacherFormMsg","Please select both a class and subject.","warning"); return; }
  const key = `${cls}::${sub}`;
  if (window._axpTchAssignmentsList.find(a=>a.key===key)) { _showSectionMsg("axpTeacherFormMsg","Already added.","warning"); return; }
  window._axpTchAssignmentsList.push({key,class:cls,subject:sub});
  _renderTeacherAssignmentTags();
};

window.axpAddTeacherAssignmentFrom = function(classId, subjectId) {
  const cls = (document.getElementById(classId)||{}).value;
  const sub = (document.getElementById(subjectId)||{}).value;
  if (!cls || !sub) { _showSectionMsg("axpTeacherFormMsgD","Please select both a class and subject.","warning"); return; }
  const key = `${cls}::${sub}`;
  if (window._axpTchAssignmentsListD.find(a=>a.key===key)) { _showSectionMsg("axpTeacherFormMsgD","Already added.","warning"); return; }
  window._axpTchAssignmentsListD.push({key,class:cls,subject:sub});
  _renderTeacherAssignmentTagsD();
};

window.axpRemoveTeacherAssignment = function(key) {
  window._axpTchAssignmentsList = window._axpTchAssignmentsList.filter(a=>a.key!==key);
  _renderTeacherAssignmentTags();
};

window.axpRemoveTeacherAssignmentD = function(key) {
  window._axpTchAssignmentsListD = window._axpTchAssignmentsListD.filter(a=>a.key!==key);
  _renderTeacherAssignmentTagsD();
};

function _renderTeacherAssignmentTagsD() {
  const cont = document.getElementById("axpTchAssignmentsD");
  if (!cont) return;
  cont.innerHTML = window._axpTchAssignmentsListD.map(a => `
    <span class="axp-tag">
      ${escapeHtml(a.class)} — ${escapeHtml(a.subject)}
      <button class="remove-tag" onclick="axpRemoveTeacherAssignmentD('${a.key.replace(/'/g,"\\'")}')">×</button>
    </span>`).join("");
}

function _renderTeacherAssignmentTags() {
  const cont = document.getElementById("axpTchAssignments");
  if (!cont) return;
  cont.innerHTML = window._axpTchAssignmentsList.map(a => `
    <span class="axp-tag">
      ${escapeHtml(a.class)} — ${escapeHtml(a.subject)}
      <button class="remove-tag" onclick="axpRemoveTeacherAssignment('${a.key.replace(/'/g,"\\'")}')">×</button>
    </span>`).join("");
}

window.axpClearTeacherForm = function() {
  const n = document.getElementById("axpTchName"); if (n) n.value = "";
  const p = document.getElementById("axpTchPhone"); if (p) p.value = "";
  const c = document.getElementById("axpTchClassSimple"); if (c) c.value = "";
  const s = document.getElementById("axpTchSubjectSimple"); if (s) s.innerHTML = '<option value="">Select Subject</option>';
  window._axpTchAssignmentsList = [];
  _renderTeacherAssignmentTags();
  const m = document.getElementById("axpTeacherFormMsg"); if (m) m.innerHTML = "";
};

window.axpClearTeacherFormDetailed = function() {
  ["axpTchNameD","axpTchEmailD","axpTchPhoneD","axpTchIdD","axpTchQualD","axpTchExpD"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const s = document.getElementById("axpTchSubject"); if (s) s.innerHTML = '<option value="">Select Subject</option>';
  window._axpTchAssignmentsListD = [];
  _renderTeacherAssignmentTagsD();
  const m = document.getElementById("axpTeacherFormMsgD"); if (m) m.innerHTML = "";
};

window.axpSaveTeacher = async function() {
  const name  = (document.getElementById("axpTchName")||{}).value.trim();
  const phone = (document.getElementById("axpTchPhone")||{}).value.trim();
  if (!name)  { _showSectionMsg("axpTeacherFormMsg","Teacher name is required.","danger"); return; }
  if (window._axpTchAssignmentsList.length === 0) { _showSectionMsg("axpTeacherFormMsg","Add at least one subject assignment.","danger"); return; }

  const btn = document.getElementById("axpSaveTeacherBtn");
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="axp-spinner-sm"></span> Saving...'; }

  try {
    const res = await _apiPost({
      mode        : "saveTeacher",
      adminEmail  : _dashboardData.email,
      schoolId    : _appScriptSchoolId,
      year        : _schoolMeta ? _schoolMeta.year : "",
      teacherName : name,
      teacherPhone: phone,
      teacherEmail: "",
      assignments : JSON.stringify(window._axpTchAssignmentsList.map(a=>({class:a.class,subject:a.subject})))
    });
    if (res.status === "success") {
      _showSectionMsg("axpTeacherFormMsg", `Teacher "${name}" saved successfully!`, "success");
      axpClearTeacherForm();
      axpLoadTeachers();
    } else {
      _showSectionMsg("axpTeacherFormMsg", res.message || "Failed to save teacher.", "danger");
    }
  } catch (err) {
    _showSectionMsg("axpTeacherFormMsg", "Network error. Please try again.", "danger");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-floppy"></i> Save Teacher'; }
  }
};

window.axpSaveTeacherDetailed = async function() {
  const name  = (document.getElementById("axpTchNameD")||{}).value.trim();
  const email = (document.getElementById("axpTchEmailD")||{}).value.trim();
  if (!name)  { _showSectionMsg("axpTeacherFormMsgD","Teacher name is required.","danger"); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { _showSectionMsg("axpTeacherFormMsgD","Valid email is required.","danger"); return; }
  if (window._axpTchAssignmentsListD.length === 0) { _showSectionMsg("axpTeacherFormMsgD","Add at least one subject assignment.","danger"); return; }

  const btn = document.getElementById("axpSaveTeacherBtnD");
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="axp-spinner-sm"></span> Saving...'; }

  const extras = {
    phone:   (document.getElementById("axpTchPhoneD")||{}).value.trim(),
    idNo:    (document.getElementById("axpTchIdD")||{}).value.trim(),
    qual:    (document.getElementById("axpTchQualD")||{}).value.trim(),
    exp:     (document.getElementById("axpTchExpD")||{}).value.trim()
  };

  try {
    const res = await _apiPost({
      mode        : "saveTeacher",
      adminEmail  : _dashboardData.email,
      schoolId    : _appScriptSchoolId,
      year        : _schoolMeta ? _schoolMeta.year : "",
      teacherName : name,
      teacherEmail: email,
      teacherExtra: JSON.stringify(extras),
      assignments : JSON.stringify(window._axpTchAssignmentsListD.map(a=>({class:a.class,subject:a.subject})))
    });
    if (res.status === "success") {
      _showSectionMsg("axpTeacherFormMsgD", `Teacher "${name}" saved successfully!`, "success");
      axpClearTeacherFormDetailed();
      axpLoadTeachers();
    } else {
      _showSectionMsg("axpTeacherFormMsgD", res.message || "Failed to save teacher.", "danger");
    }
  } catch (err) {
    _showSectionMsg("axpTeacherFormMsgD", "Network error. Please try again.", "danger");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-floppy"></i> Save Teacher'; }
  }
};

/* Excel teacher upload */
window.axpDownloadTeacherTemplate = function() {
  const csvContent = "Name,Email,Phone,Class,Subject,Qualification,YearsExperience\nJohn Mwangi,john@gmail.com,0712345678,Form I,MATHEMATICS,B.Ed,5\nJane Doe,,0787654321,Form II,ENGLISH,,";
  const blob = new Blob([csvContent], {type:"text/csv"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "teachers_template.csv"; a.click();
};

window.axpHandleTeacherExcelDrop = function(e) {
  e.preventDefault();
  document.getElementById("axpTchExcelDrop").classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) _parseTeacherFile(file);
};

window.axpHandleTeacherExcelFile = function(input) {
  const file = input.files[0];
  if (file) _parseTeacherFile(file);
};

function _parseTeacherFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { _showSectionMsg("axpTchExcelMsg","File appears empty.","danger"); return; }
    const headers = lines[0].split(",").map(h=>h.trim().toLowerCase());
    const rows = lines.slice(1).map(line => {
      const cols = line.split(",").map(c=>c.trim());
      const obj = {};
      headers.forEach((h,i) => obj[h] = cols[i] || "");
      return obj;
    }).filter(r => r.name);

    const prev = document.getElementById("axpTchExcelPreview");
    if (!prev) return;
    if (rows.length === 0) { _showSectionMsg("axpTchExcelMsg","No valid rows found.","danger"); return; }

    prev.innerHTML = `
      <div style="margin-bottom:10px;font-size:13px;font-weight:700;color:#1a1a2e;">${rows.length} teachers found:</div>
      <div style="overflow-x:auto;">
        <table class="axp-table" style="min-width:500px;">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Class</th><th>Subject</th></tr></thead>
          <tbody>
            ${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.email||'—')}</td><td>${escapeHtml(r.phone||'—')}</td><td>${escapeHtml(r.class||r['class']||'—')}</td><td>${escapeHtml(r.subject||'—')}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;">
        <button onclick="axpBulkSaveTeachers()" class="axp-btn-primary"><i class="bi bi-cloud-upload"></i> Upload All Teachers</button>
      </div>`;
    window._axpExcelTeachers = rows;
  };
  reader.readAsText(file);
}

window.axpBulkSaveTeachers = async function() {
  const rows = window._axpExcelTeachers || [];
  if (!rows.length) return;
  _showSectionMsg("axpTchExcelMsg", `Uploading ${rows.length} teachers...`, "info");
  let saved = 0, failed = 0;
  for (const r of rows) {
    try {
      const res = await _apiPost({
        mode:"saveTeacher", adminEmail:_dashboardData.email, schoolId:_appScriptSchoolId,
        year: _schoolMeta ? _schoolMeta.year : "",
        teacherName:r.name, teacherEmail:r.email||"", teacherPhone:r.phone||"",
        assignments: JSON.stringify([{class:r.class||r['class']||"", subject:r.subject||""}])
      });
      if (res.status === "success") saved++; else failed++;
    } catch { failed++; }
  }
  _showSectionMsg("axpTchExcelMsg", `Done! ${saved} saved, ${failed} failed.`, saved>0?"success":"danger");
  axpLoadTeachers();
};

window.axpLoadTeachers = async function() {
  const cont = document.getElementById("axpTeachersList");
  if (!cont) return;
  cont.innerHTML = `<div class="axp-empty-state"><div class="axp-spinner-sm" style="margin:0 auto 8px;"></div><p>Loading...</p></div>`;
  try {
    const res = await _apiGet({ mode:"teachers", schoolId:_appScriptSchoolId });
    if (res.status === "success" && res.teachers && res.teachers.length > 0) {
      cont.innerHTML = res.teachers.map(t => `
        <div class="teacher-card">
          <div class="teacher-card-header">
            <div>
              <div class="teacher-card-name"><i class="bi bi-person-fill" style="color:#4ecca3;"></i> ${escapeHtml(t.name)}</div>
              <div class="teacher-card-email">${escapeHtml(t.email)}</div>
            </div>
            <span class="axp-badge axp-badge-green">${(t.assignments||[]).length} subjects</span>
          </div>
          <div class="teacher-card-assignments">
            ${(t.assignments||[]).map(a=>`<span class="axp-tag">${escapeHtml(a.class)} — ${escapeHtml(a.subject)}</span>`).join("")}
          </div>
        </div>`).join("");
    } else {
      cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-person-x"></i><p>No teachers added yet.</p></div>`;
    }
  } catch (e) {
    cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load teachers.</p></div>`;
  }
};

function renderSetupSchoolSection() {
  axpOpenSetupPopup();
}


window.axpTchViewTab = function(tab) {
  const listPanel = document.getElementById("axpTchPanelList");
  const editPanel = document.getElementById("axpTchPanelEdit");
  const listBtn   = document.getElementById("axpTchTabList");
  const editBtn   = document.getElementById("axpTchTabEdit");

  if (listPanel) listPanel.style.display = tab === "list" ? "block" : "none";
  if (editPanel) editPanel.style.display = tab === "edit" ? "block" : "none";
  if (listBtn) {
    listBtn.style.color            = tab === "list" ? "#4ecca3" : "#94a3b8";
    listBtn.style.borderBottomColor = tab === "list" ? "#4ecca3" : "transparent";
  }
  if (editBtn) {
    editBtn.style.color            = tab === "edit" ? "#4ecca3" : "#94a3b8";
    editBtn.style.borderBottomColor = tab === "edit" ? "#4ecca3" : "transparent";
  }
  if (tab === "edit") axpLoadEditableTeachers();
};

window.axpLoadEditableTeachers = async function() {
  const cont = document.getElementById("axpTchEditContent");
  if (!cont) return;
  cont.innerHTML = `<div class="axp-empty-state"><div class="axp-spinner-sm" style="margin:0 auto 8px;"></div><p>Loading...</p></div>`;
  try {
    const res = await _apiGet({ mode:"teachers", schoolId:_appScriptSchoolId });
    if (res.status === "success" && res.teachers && res.teachers.length > 0) {
      window._axpEditableTeachers = res.teachers.map((t,i) => ({...t, _idx:i}));
      _axpRenderEditableTeachers();
    } else {
      cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-person-x"></i><p>No teachers found.</p></div>`;
    }
  } catch(e) {
    cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load teachers.</p></div>`;
  }
};

function _axpRenderEditableTeachers() {
  const cont = document.getElementById("axpTchEditContent");
  if (!cont) return;
  const teachers = window._axpEditableTeachers || [];
  if (!teachers.length) {
    cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-person-x"></i><p>No teachers to edit.</p></div>`;
    return;
  }

  cont.innerHTML = teachers.map((t, i) => `
    <div style="border:1px solid #e2e8f0;margin-bottom:12px;background:#fff;" id="axpTchEditCard_${i}">

      <!-- Card header -->
      <div style="background:#f8fafc;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:32px;height:32px;background:#4ecca318;display:flex;align-items:center;justify-content:center;">
            <i class="bi bi-person-fill" style="color:#4ecca3;font-size:16px;"></i>
          </div>
          <div>
            <div style="font-size:13.5px;font-weight:700;color:#1a1a2e;" id="axpTchEditLabel_${i}">${escapeHtml(t.name||"—")}</div>
            <div style="font-size:11.5px;color:#64748b;">${escapeHtml(t.email||"No email")}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button onclick="axpTchEditToggle(${i})" class="axp-btn-secondary" style="font-size:11.5px;padding:5px 10px;" id="axpTchEditToggleBtn_${i}">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button onclick="axpTchEditDelete(${i},'${escapeHtml((t.teacherId||t.email||t.name||"").replace(/'/g,"\\'"))}')" class="axp-btn-danger" style="font-size:11.5px;padding:5px 10px;">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>

      <!-- Editable form (hidden by default) -->
      <div id="axpTchEditForm_${i}" style="display:none;padding:14px;">
        <div class="axp-form-row">
          <div class="axp-field-group">
            <label>Teacher Name</label>
            <input id="axpTchEName_${i}" class="axp-input" value="${escapeHtml(t.name||"")}" />
          </div>
          <div class="axp-field-group">
            <label>Email</label>
            <input id="axpTchEEmail_${i}" class="axp-input" type="email" value="${escapeHtml(t.email||"")}" />
          </div>
        </div>
        <div class="axp-form-row">
          <div class="axp-field-group">
            <label>Phone</label>
            <input id="axpTchEPhone_${i}" class="axp-input" value="${escapeHtml(t.phone||t.teacherPhone||"")}" />
          </div>
          <div class="axp-field-group">
            <label>Qualification</label>
            <input id="axpTchEQual_${i}" class="axp-input" value="${escapeHtml((t.extra||{}).qual||t.qualification||"")}" />
          </div>
        </div>

        <!-- Assignments editor -->
        <div style="margin-bottom:10px;">
          <label style="font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:7px;">
            Subject Assignments
          </label>
          <div id="axpTchEAssignTags_${i}" class="axp-tags-container" style="margin-bottom:8px;">
            ${(t.assignments||[]).map(a=>`
              <span class="axp-tag" id="axpTchETag_${i}_${escapeHtml(a.class)}_${escapeHtml(a.subject)}">
                ${escapeHtml(a.class)} — ${escapeHtml(a.subject)}
                <button class="remove-tag" onclick="axpTchERemoveAssign(${i},'${escapeHtml(a.class.replace(/'/g,"\\'"))}','${escapeHtml(a.subject.replace(/'/g,"\\'"))}')">×</button>
              </span>`).join("")}
          </div>
          <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;">
            <select id="axpTchEClass_${i}" class="axp-select" style="flex:1;min-width:120px;max-width:180px;"
              onchange="axpTchEPopulateSubject(${i})">
              <option value="">Select Class</option>
              ${(_schoolMeta && _schoolMeta.classes ? _schoolMeta.classes : []).map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
            </select>
            <select id="axpTchESubject_${i}" class="axp-select" style="flex:1;min-width:140px;max-width:200px;">
              <option value="">Select Subject</option>
            </select>
            <button onclick="axpTchEAddAssign(${i})" class="axp-btn-secondary" style="font-size:12px;">
              <i class="bi bi-plus"></i> Add
            </button>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-top:12px;">
          <button onclick="axpTchEditSave(${i},'${escapeHtml((t.teacherId||t.email||t.name||"").replace(/'/g,"\\'"))}')" class="axp-btn-primary" style="font-size:12.5px;">
            <i class="bi bi-floppy"></i> Save Changes
          </button>
          <button onclick="axpTchEditToggle(${i})" class="axp-btn-secondary" style="font-size:12.5px;">
            <i class="bi bi-x-circle"></i> Cancel
          </button>
        </div>
      </div>

      <!-- Assignments display (visible by default) -->
      <div id="axpTchEditAssignDisplay_${i}" style="padding:10px 14px;">
        <div style="display:flex;flex-wrap:wrap;gap:5px;">
          ${(t.assignments||[]).map(a=>`
            <span class="axp-tag">${escapeHtml(a.class)} — ${escapeHtml(a.subject)}</span>`).join("")}
          ${!(t.assignments||[]).length ? '<span style="font-size:12px;color:#94a3b8;font-style:italic;">No assignments</span>' : ""}
        </div>
      </div>
    </div>`).join("");
}

window.axpTchEditToggle = function(i) {
  const form    = document.getElementById(`axpTchEditForm_${i}`);
  const display = document.getElementById(`axpTchEditAssignDisplay_${i}`);
  const btn     = document.getElementById(`axpTchEditToggleBtn_${i}`);
  if (!form) return;
  const isOpen = form.style.display !== "none";
  form.style.display    = isOpen ? "none" : "block";
  display.style.display = isOpen ? "block" : "none";
  if (btn) btn.innerHTML = isOpen
    ? '<i class="bi bi-pencil"></i> Edit'
    : '<i class="bi bi-x"></i> Close';
};

window.axpTchEPopulateSubject = function(i) {
  const cls = (document.getElementById(`axpTchEClass_${i}`)||{}).value;
  const sel = document.getElementById(`axpTchESubject_${i}`);
  if (!sel) return;
  sel.innerHTML = '<option value="">Select Subject</option>';
  if (cls && _schoolMeta && _schoolMeta.subjects && _schoolMeta.subjects[cls]) {
    _schoolMeta.subjects[cls].forEach(s => {
      sel.innerHTML += `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`;
    });
  }
};

window.axpTchEAddAssign = function(i) {
  const cls = (document.getElementById(`axpTchEClass_${i}`)||{}).value;
  const sub = (document.getElementById(`axpTchESubject_${i}`)||{}).value;
  if (!cls || !sub) return;
  const teacher = window._axpEditableTeachers[i];
  if (!teacher.assignments) teacher.assignments = [];
  if (teacher.assignments.find(a => a.class===cls && a.subject===sub)) return;
  teacher.assignments.push({ class:cls, subject:sub });
  _axpRefreshTchEAssignTags(i);
};

window.axpTchERemoveAssign = function(i, cls, sub) {
  const teacher = window._axpEditableTeachers[i];
  if (!teacher) return;
  teacher.assignments = (teacher.assignments||[]).filter(a => !(a.class===cls && a.subject===sub));
  _axpRefreshTchEAssignTags(i);
};

function _axpRefreshTchEAssignTags(i) {
  const cont = document.getElementById(`axpTchEAssignTags_${i}`);
  if (!cont) return;
  const teacher = window._axpEditableTeachers[i];
  cont.innerHTML = (teacher.assignments||[]).map(a=>`
    <span class="axp-tag">
      ${escapeHtml(a.class)} — ${escapeHtml(a.subject)}
      <button class="remove-tag" onclick="axpTchERemoveAssign(${i},'${a.class.replace(/'/g,"\\'")}','${a.subject.replace(/'/g,"\\'")}')">×</button>
    </span>`).join("");
}

window.axpTchEditSave = async function(i, teacherId) {
  const teacher = window._axpEditableTeachers[i];
  if (!teacher) return;

  const name  = (document.getElementById(`axpTchEName_${i}`)||{}).value.trim();
  const email = (document.getElementById(`axpTchEEmail_${i}`)||{}).value.trim();
  const phone = (document.getElementById(`axpTchEPhone_${i}`)||{}).value.trim();
  const qual  = (document.getElementById(`axpTchEQual_${i}`)||{}).value.trim();

  if (!name) { _showSectionMsg("axpTchEditMsg","Teacher name is required.","danger"); return; }

  const saveBtn = document.querySelector(`#axpTchEditCard_${i} .axp-btn-primary`);
  if (saveBtn) { saveBtn.disabled=true; saveBtn.innerHTML='<span class="axp-spinner-sm"></span> Saving...'; }

  try {
    const res = await _apiPost({
      mode        : "updateTeacher",
      adminEmail  : _dashboardData.email,
      schoolId    : _appScriptSchoolId,
      year        : _schoolMeta ? _schoolMeta.year : "",
      teacherId   : teacherId,
      teacherName : name,
      teacherEmail: email,
      teacherPhone: phone,
      teacherExtra: JSON.stringify({ qual }),
      assignments : JSON.stringify(teacher.assignments||[])
    });

    if (res.status === "success") {
      /* Update local cache */
      teacher.name  = name;
      teacher.email = email;
      teacher.phone = phone;

      /* Update card header label */
      const label = document.getElementById(`axpTchEditLabel_${i}`);
      if (label) label.textContent = name;

      /* Update assignment display */
      const display = document.getElementById(`axpTchEditAssignDisplay_${i}`);
      if (display) {
        display.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:5px;">
          ${(teacher.assignments||[]).map(a=>`<span class="axp-tag">${escapeHtml(a.class)} — ${escapeHtml(a.subject)}</span>`).join("")}
          ${!(teacher.assignments||[]).length ? '<span style="font-size:12px;color:#94a3b8;font-style:italic;">No assignments</span>' : ""}
        </div>`;
      }

      axpTchEditToggle(i);
      _showSectionMsg("axpTchEditMsg", `Teacher "${name}" updated successfully!`, "success");
      _axpToast(`Teacher "${name}" updated!`, "success");
    } else {
      _showSectionMsg("axpTchEditMsg", res.message || "Failed to update teacher.", "danger");
    }
  } catch(err) {
    _showSectionMsg("axpTchEditMsg", "Network error. Please try again.", "danger");
  } finally {
    if (saveBtn) { saveBtn.disabled=false; saveBtn.innerHTML='<i class="bi bi-floppy"></i> Save Changes'; }
  }
};

window.axpTchEditDelete = async function(i, teacherId) {
  const teacher = window._axpEditableTeachers[i];
  if (!teacher) return;
  if (!confirm(`Delete teacher "${teacher.name}"? This cannot be undone.`)) return;

  try {
    const res = await _apiPost({
      mode       : "deleteTeacher",
      adminEmail : _dashboardData.email,
      schoolId   : _appScriptSchoolId,
      teacherId  : teacherId
    });
    if (res.status === "success") {
      window._axpEditableTeachers.splice(i, 1);
      _axpRenderEditableTeachers();
      _showSectionMsg("axpTchEditMsg", "Teacher deleted successfully.", "success");
      _axpToast("Teacher deleted.", "success");
    } else {
      _showSectionMsg("axpTchEditMsg", res.message || "Failed to delete teacher.", "danger");
    }
  } catch(err) {
    _showSectionMsg("axpTchEditMsg", "Network error. Please try again.", "danger");
  }
};
/* ─────────────────────────────────────────────────────────────
   SECTION: PUSH STUDENT NAMES
───────────────────────────────────────────────────────────── */
function renderPushStudentsSection() {
  const sw = document.getElementById("axpSectionWrapper");

  if (_dashboardData && _dashboardData.status !== "ACTIVE") {
    sw.innerHTML = _axpInactiveBlock();
    return;
  }
  if (!_appScriptSchoolId) {
    sw.innerHTML = `
      <div class="axp-section-card" style="text-align:center;padding:40px 24px;">
        <i class="bi bi-lock-fill" style="font-size:36px;color:#4ecca3;display:block;margin-bottom:14px;"></i>
        <h3 style="font-size:16px;font-weight:800;color:#1a1a2e;margin:0 0 8px;">Feature Locked</h3>
        <p style="font-size:13px;color:#64748b;max-width:360px;margin:0 auto 20px;line-height:1.6;">
          Configure your school first to unlock Students enrollment.
        </p>
        <button onclick="axpOpenSetupPopup()" class="axp-btn-primary" style="font-size:13.5px;padding:10px 24px;">
          <i class="bi bi-gear-fill"></i> Setup School Now
        </button>
      </div>`;
    return;
  }

  const classes   = (_schoolMeta && _schoolMeta.classes)   ? _schoolMeta.classes   : [];
  const examTypes = (_schoolMeta && _schoolMeta.examTypes) ? _schoolMeta.examTypes : [];

  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-people-fill"></i> Push Student Names</div>

      <!-- Tab navigation -->
      <div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:16px;">
        <button onclick="axpStuViewTab('push')" id="axpStuTabPush"
          style="padding:9px 18px;border:none;background:none;font-weight:700;font-size:12.5px;color:#4ecca3;border-bottom:2px solid #4ecca3;margin-bottom:-2px;cursor:pointer;">
          <i class="bi bi-cloud-upload"></i> Push Names
        </button>
        <button onclick="axpStuViewTab('edit')" id="axpStuTabEdit"
          style="padding:9px 18px;border:none;background:none;font-weight:700;font-size:12.5px;color:#94a3b8;border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;">
          <i class="bi bi-pencil-square"></i> View & Edit
        </button>
      </div>

      <!-- Push panel wrapper -->
      <div id="axpStuPanelPush">

      <div style="background:#060c1c;padding:16px 20px;margin-bottom:18px;color:#fff;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:12.5px;font-weight:600;opacity:.8;">Enrollment Progress</span>
          <span style="font-size:20px;font-weight:800;color:#4ecca3;" id="axpEnrollPct">—</span>
        </div>
        <div class="axp-progress-bar" style="height:6px;background:rgba(255,255,255,0.1);">
          <div class="axp-progress-fill" id="axpEnrollFill" style="width:0%;transition:width .6s ease;"></div>
        </div>
        <div style="font-size:11.5px;opacity:.5;margin-top:5px;" id="axpEnrollSubLabel">Select a class to see enrollment status</div>
      </div>

      <div class="axp-form-row">
        <div class="axp-field-group">
          <label>Select Class</label>
          <select id="axpPushClass" class="axp-select" onchange="axpRenderStudentInputs()">
            <option value="">— Select a class —</option>
            ${classes.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
          </select>
        </div>
        <div class="axp-field-group">
          <label>Exam Type to Sync</label>
          <select id="axpPushExamType" class="axp-select">
            <option value="">All exam types</option>
            ${examTypes.map(et => `<option value="${escapeHtml(et)}">${escapeHtml(et)}</option>`).join("")}
          </select>
        </div>
      </div>

      <div id="axpStudentInputSection" style="display:none;">
        <div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:14px;">
          <button onclick="axpStudentTab('names')" id="axpTabNames" style="padding:9px 18px;border:none;background:none;font-weight:700;font-size:12.5px;color:#4ecca3;border-bottom:2px solid #4ecca3;margin-bottom:-2px;cursor:pointer;">
            <i class="bi bi-list-ol"></i> Student Names
          </button>
          <button onclick="axpStudentTab('subjects')" id="axpTabSubjects" style="padding:9px 18px;border:none;background:none;font-weight:700;font-size:12.5px;color:#94a3b8;border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;">
            <i class="bi bi-book"></i> Subject Assignment
          </button>
        </div>

        <!-- Tab: Names -->
        <div id="axpStudentTabNames">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <label style="font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:.5px;">Student List</label>
            <div style="display:flex;gap:7px;">
              <button onclick="axpAddStudentRow()" class="axp-btn-secondary" style="font-size:12px;padding:5px 10px;"><i class="bi bi-plus"></i> Add Row</button>
              <button onclick="axpBulkPasteToggle()" class="axp-btn-secondary" style="font-size:12px;padding:5px 10px;"><i class="bi bi-clipboard"></i> Bulk Paste</button>
              <button onclick="axpStudentExcelToggle()" class="axp-btn-secondary" style="font-size:12px;padding:5px 10px;"><i class="bi bi-file-earmark-excel" style="color:#217346;"></i> Excel</button>
            </div>
          </div>

          <div style="background:#f8fafc;padding:9px 12px;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
            <div style="flex:1;">
              <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">Names filled</div>
              <div class="axp-progress-bar" style="height:5px;">
                <div class="axp-progress-fill" id="axpNamesFill" style="width:0%;transition:width .3s;"></div>
              </div>
            </div>
            <span id="axpNamesCount" style="font-size:18px;font-weight:800;color:#4ecca3;min-width:44px;text-align:right;">0/0</span>
          </div>

          <div id="axpBulkPasteArea" style="display:none;margin-bottom:12px;">
            <div class="axp-alert axp-alert-info" style="margin-bottom:7px;">
              <i class="bi bi-info-circle"></i>
              <span>One student per line: <code>STUDENT NAME,M</code> or <code>STUDENT NAME,F</code></span>
            </div>
            <textarea id="axpBulkPasteInput" class="axp-textarea" placeholder="JOHN DOE,M&#10;JANE SMITH,F&#10;PETER JONES,M"></textarea>
            <div style="margin-top:7px;display:flex;gap:7px;">
              <button onclick="axpParseBulkPaste()" class="axp-btn-primary" style="font-size:12px;"><i class="bi bi-arrow-right"></i> Parse Names</button>
              <button onclick="axpBulkPasteToggle()" class="axp-btn-secondary" style="font-size:12px;">Cancel</button>
            </div>
          </div>

          <div id="axpStudentExcelArea" style="display:none;margin-bottom:12px;background:#f8fafc;padding:14px;">
            <div class="axp-alert axp-alert-info" style="margin-bottom:10px;">
              <i class="bi bi-info-circle"></i>
              <span>Download the template, fill in student data (Name, Gender), then upload. Gender: M or F.</span>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:10px;">
              <button onclick="axpDownloadStudentTemplate()" class="axp-btn-secondary" style="font-size:12px;"><i class="bi bi-download"></i> Download Template</button>
              <button onclick="axpStudentExcelToggle()" class="axp-btn-secondary" style="font-size:12px;">Cancel</button>
            </div>
            <label class="axp-excel-drop" for="axpStuExcelFile" ondragover="this.classList.add('dragover');event.preventDefault()" ondragleave="this.classList.remove('dragover')" ondrop="axpHandleStudentExcelDrop(event)">
              <i class="bi bi-cloud-upload"></i>
              <p>Drag & drop Excel/CSV or click to browse</p>
              <small>Columns: Name, Gender (M/F)</small>
            </label>
            <input type="file" id="axpStuExcelFile" accept=".xlsx,.xls,.csv" style="display:none;" onchange="axpHandleStudentExcelFile(this)" />
            <div id="axpStuExcelMsg" style="margin-top:8px;"></div>
          </div>

          <div id="axpStudentRows"></div>
        </div>

        <!-- Tab: Subject Assignment -->
        <div id="axpStudentTabSubjects" style="display:none;">
          <div class="axp-alert axp-alert-info" style="margin-bottom:12px;">
            <i class="bi bi-info-circle"></i>
            <span>Assign which subjects each student takes. Uncheck if a student doesn't take a subject.</span>
          </div>
          <div id="axpStudentSubjectMatrix" style="overflow-x:auto;"></div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
          <button onclick="axpSubmitStudentNames()" class="axp-btn-primary" id="axpPushStudentsBtn">
            <i class="bi bi-cloud-upload"></i> Push Names to System
          </button>
          <button onclick="axpSyncStudents()" class="axp-btn-secondary" id="axpSyncStudentsBtn">
            <i class="bi bi-arrow-repeat"></i> Sync to Exam Database
          </button>
        </div>
        <div id="axpPushMsg" style="margin-top:8px;"></div>

        <div id="axpPushProgress" style="display:none;margin-top:12px;background:#f8fafc;padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span id="axpPushProgressLabel" style="font-size:13px;font-weight:600;color:#374151;">Uploading...</span>
            <span id="axpPushProgressPct" style="font-size:13px;font-weight:800;color:#4ecca3;">0%</span>
          </div>
          <div class="axp-progress-bar" style="height:8px;">
            <div class="axp-progress-fill" id="axpPushProgressFill" style="width:0%;transition:width .4s ease;"></div>
          </div>
          
        </div>
      </div>
      </div>
<div id="axpStuPanelEdit" style="display:none;">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap;">
          <div class="axp-field-group" style="flex:1;min-width:140px;max-width:220px;">
            <label style="font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Select Class</label>
            <select id="axpStuEditClass" class="axp-select" onchange="axpLoadEditableStudents()">
              <option value="">— Select Class —</option>
              ${(_schoolMeta && _schoolMeta.classes ? _schoolMeta.classes : []).map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
            </select>
          </div>
          <button onclick="axpLoadEditableStudents()" class="axp-btn-secondary" style="margin-top:14px;">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
        <div id="axpStuEditContent">
          <div class="axp-empty-state">
            <i class="bi bi-people"></i>
            <p>Select a class to view and edit students.</p>
          </div>
        </div>
        <div id="axpStuEditMsg" style="margin-top:8px;"></div>
      </div>
    </div>`;

  window._axpStudentRows    = [];
  window._axpStudentSubjects = {};
}

window.axpStuViewTab = function(tab) {
  const pushPanel = document.getElementById("axpStuPanelPush");
  const editPanel = document.getElementById("axpStuPanelEdit");
  const pushBtn   = document.getElementById("axpStuTabPush");
  const editBtn   = document.getElementById("axpStuTabEdit");

  if (pushPanel) pushPanel.style.display = tab === "push" ? "block" : "none";
  if (editPanel) editPanel.style.display = tab === "edit" ? "block" : "none";
  if (pushBtn) {
    pushBtn.style.color            = tab === "push" ? "#4ecca3" : "#94a3b8";
    pushBtn.style.borderBottomColor = tab === "push" ? "#4ecca3" : "transparent";
  }
  if (editBtn) {
    editBtn.style.color            = tab === "edit" ? "#4ecca3" : "#94a3b8";
    editBtn.style.borderBottomColor = tab === "edit" ? "#4ecca3" : "transparent";
  }
  if (tab === "edit") axpLoadEditableStudents();
};

window.axpLoadEditableStudents = async function() {
  const cont = document.getElementById("axpStuEditContent");
  const cls  = (document.getElementById("axpStuEditClass")||{}).value;
  if (!cont) return;
  if (!cls) {
    cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-people"></i><p>Select a class first.</p></div>`;
    return;
  }

  cont.innerHTML = `<div class="axp-empty-state"><div class="axp-spinner-sm" style="margin:0 auto 8px;"></div><p>Loading students...</p></div>`;

  try {
    const examType = (_schoolMeta && _schoolMeta.examTypes) ? _schoolMeta.examTypes[0] : null;
    if (!examType) {
      cont.innerHTML = `<div class="axp-alert axp-alert-warning"><i class="bi bi-exclamation-triangle"></i><span>No exam types configured.</span></div>`;
      return;
    }

    const res = await _apiGet({
      schoolId : _appScriptSchoolId,
      year     : _schoolMeta.year,
      class    : cls,
      examType : examType
    });

    const students = res.students || res.data || [];
    if (!students.length) {
      cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-inbox"></i><p>No students found in ${escapeHtml(cls)}.</p></div>`;
      return;
    }

    window._axpEditableStudents = students.map((s,i) => ({
      ...s,
      _idx    : i,
      _cls    : cls,
      _edited : false
    }));

    _axpRenderEditableStudents(cls);

  } catch(e) {
    cont.innerHTML = `<div class="axp-alert axp-alert-danger"><i class="bi bi-exclamation-circle"></i><span>Failed to load students.</span></div>`;
  }
};

function _axpRenderEditableStudents(cls) {
  const cont = document.getElementById("axpStuEditContent");
  if (!cont) return;
  const students = window._axpEditableStudents || [];
  const subjects = (_schoolMeta && _schoolMeta.subjects && _schoolMeta.subjects[cls]) ? _schoolMeta.subjects[cls] : [];

  cont.innerHTML = `
    <!-- Bulk save bar -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
      <span style="font-size:12.5px;font-weight:700;color:#1a1a2e;">
        <i class="bi bi-people-fill" style="color:#4ecca3;"></i> ${students.length} students in ${escapeHtml(cls)}
      </span>
      <div style="display:flex;gap:7px;">
        <button onclick="axpStuEditSaveAll('${cls.replace(/'/g,"\\'")}' )" class="axp-btn-primary" style="font-size:12px;background:#10b981;">
          <i class="bi bi-floppy"></i> Save All Changes
        </button>
      </div>
    </div>

    <!-- Table -->
    <div style="overflow-x:auto;">
      <table class="axp-table" style="min-width:520px;">
        <thead>
          <tr>
            <th style="width:32px;">#</th>
            <th style="min-width:80px;">Exam No</th>
            <th style="min-width:180px;">Name</th>
            <th style="width:70px;">Gender</th>
            <th style="min-width:120px;">Subjects</th>
            <th style="width:60px;"></th>
          </tr>
        </thead>
        <tbody>
          ${students.map((s, i) => {
            const examNo  = s.examNo || s.exam_no || "";
            const name    = s.name || "";
            const gender  = s.gender || s.sex || "M";
            const taken   = s.subjects ? Object.keys(s.subjects).filter(k => s.subjects[k]) : subjects;

            return `<tr id="axpStuEditRow_${i}">
              <td style="color:#94a3b8;font-size:11px;">${i+1}</td>
              <td>
                <input id="axpStuEExamNo_${i}" class="axp-input" style="padding:5px 8px;font-size:12px;width:90px;"
                  value="${escapeHtml(examNo)}"
                  oninput="_axpStuMarkEdited(${i})" />
              </td>
              <td>
                <input id="axpStuEName_${i}" class="axp-input" style="padding:5px 8px;font-size:12.5px;"
                  value="${escapeHtml(name)}"
                  oninput="_axpStuMarkEdited(${i})" />
              </td>
              <td>
                <select id="axpStuEGender_${i}" class="axp-select" style="padding:5px 7px;font-size:12px;"
                  onchange="_axpStuMarkEdited(${i})">
                  <option value="M" ${gender.toUpperCase().startsWith("M")?"selected":""}>M</option>
                  <option value="F" ${gender.toUpperCase().startsWith("F")?"selected":""}>F</option>
                </select>
              </td>
              <td>
                <button onclick="axpStuEditSubjectsToggle(${i})" class="axp-btn-secondary" style="font-size:11px;padding:4px 8px;">
                  <i class="bi bi-book"></i> ${taken.length}/${subjects.length}
                </button>
              </td>
              <td>
                <button onclick="axpStuEditDelete(${i},'${escapeHtml(examNo.replace(/'/g,"\\'"))}','${cls.replace(/'/g,"\\'")}' )"
                  class="axp-btn-danger" style="font-size:11px;padding:4px 7px;">
                  <i class="bi bi-trash3"></i>
                </button>
              </td>
            </tr>
            <!-- Subject assignment row (hidden) -->
            <tr id="axpStuEditSubRow_${i}" style="display:none;">
              <td colspan="6" style="padding:0 10px 10px;">
                <div style="background:#f8fafc;padding:10px;border:1px solid #e2e8f0;">
                  <div style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;margin-bottom:8px;">
                    Subjects for ${escapeHtml(name||"this student")}
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    ${subjects.map(sub => {
                      const checked = taken.includes(sub);
                      return `<label style="display:flex;align-items:center;gap:5px;font-size:12px;padding:5px 9px;border:1px solid ${checked?"#4ecca3":"#e2e8f0"};background:${checked?"#f0fdf9":"#fff"};cursor:pointer;"
                        id="axpStuESubLbl_${i}_${sub.replace(/\s+/g,"_")}">
                        <input type="checkbox" ${checked?"checked":""}
                          onchange="axpStuEToggleSubject(${i},'${escapeHtml(sub.replace(/'/g,"\\'"))}',this.checked)"
                          style="accent-color:#4ecca3;width:13px;height:13px;cursor:pointer;" />
                        ${escapeHtml(sub)}
                      </label>`;
                    }).join("")}
                  </div>
                </div>
              </td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

window._axpStuMarkEdited = function(i) {
  const row = document.getElementById(`axpStuEditRow_${i}`);
  if (row) row.style.background = "#fffbeb";
  if (window._axpEditableStudents && window._axpEditableStudents[i]) {
    window._axpEditableStudents[i]._edited = true;
  }
};

window.axpStuEditSubjectsToggle = function(i) {
  const row = document.getElementById(`axpStuEditSubRow_${i}`);
  if (row) row.style.display = row.style.display === "none" ? "table-row" : "none";
};

window.axpStuEToggleSubject = function(i, sub, checked) {
  const student = window._axpEditableStudents && window._axpEditableStudents[i];
  if (!student) return;
  if (!student.subjects) student.subjects = {};
  student.subjects[sub] = checked;
  student._edited = true;

  const lbl = document.getElementById(`axpStuESubLbl_${i}_${sub.replace(/\s+/g,"_")}`);
  if (lbl) {
    lbl.style.borderColor  = checked ? "#4ecca3" : "#e2e8f0";
    lbl.style.background   = checked ? "#f0fdf9" : "#fff";
  }

  /* Update the subject count button */
  const cls      = student._cls;
  const subjects = (_schoolMeta && _schoolMeta.subjects && _schoolMeta.subjects[cls]) ? _schoolMeta.subjects[cls] : [];
  const takenCount = subjects.filter(s => student.subjects[s] !== false).length;
  const btn = document.querySelector(`#axpStuEditRow_${i} .axp-btn-secondary`);
  if (btn) btn.innerHTML = `<i class="bi bi-book"></i> ${takenCount}/${subjects.length}`;

  _axpStuMarkEdited(i);
};

window.axpStuEditSaveAll = async function(cls) {
  const students = window._axpEditableStudents || [];
  const edited   = students.filter(s => s._edited);
  if (!edited.length) {
    _showSectionMsg("axpStuEditMsg", "No changes to save.", "warning"); return;
  }

  _showSectionMsg("axpStuEditMsg", `Saving ${edited.length} updated student records...`, "info");

  let saved = 0, failed = 0;

  for (const s of edited) {
    const i       = s._idx;
    const examNo  = (document.getElementById(`axpStuEExamNo_${i}`)||{}).value.trim() || s.examNo || s.exam_no || "";
    const name    = (document.getElementById(`axpStuEName_${i}`)||{}).value.trim()   || s.name || "";
    const gender  = (document.getElementById(`axpStuEGender_${i}`)||{}).value        || s.gender || "M";

    const subjects = (_schoolMeta && _schoolMeta.subjects && _schoolMeta.subjects[cls]) ? _schoolMeta.subjects[cls] : [];
    const subjectsMap = {};
    subjects.forEach(sub => {
      subjectsMap[sub] = s.subjects ? (s.subjects[sub] !== false) : true;
    });

    try {
      const res = await _apiPost({
        mode      : "updateStudent",
        adminEmail: _dashboardData.email,
        schoolId  : _appScriptSchoolId,
        year      : _schoolMeta ? _schoolMeta.year : "",
        class     : cls,
        examNo    : examNo,
        name,
        gender,
        subjects  : JSON.stringify(subjectsMap)
      });

      if (res.status === "success") {
        saved++;
        s._edited = false;
        const row = document.getElementById(`axpStuEditRow_${i}`);
        if (row) {
          row.style.background = "#ecfdf5";
          setTimeout(() => { if (row) row.style.background = ""; }, 2000);
        }
      } else { failed++; }
    } catch(e) { failed++; }
  }

  _showSectionMsg("axpStuEditMsg",
    `Done! ${saved} saved${failed ? `, ${failed} failed` : ""}.`,
    saved > 0 ? "success" : "danger"
  );
  if (saved > 0) _axpToast(`${saved} student records updated!`, "success");
};

window.axpStuEditDelete = async function(i, examNo, cls) {
  const student = window._axpEditableStudents && window._axpEditableStudents[i];
  if (!student) return;
  const name = (document.getElementById(`axpStuEName_${i}`)||{}).value.trim() || student.name || examNo;
  if (!confirm(`Delete student "${name}"? This cannot be undone.`)) return;

  try {
    const res = await _apiPost({
      mode      : "deleteStudent",
      adminEmail: _dashboardData.email,
      schoolId  : _appScriptSchoolId,
      year      : _schoolMeta ? _schoolMeta.year : "",
      class     : cls,
      examNo    : examNo
    });

    if (res.status === "success") {
      window._axpEditableStudents.splice(i, 1);
      /* Re-index */
      window._axpEditableStudents.forEach((s, idx) => s._idx = idx);
      _axpRenderEditableStudents(cls);
      _showSectionMsg("axpStuEditMsg", "Student deleted successfully.", "success");
      _axpToast("Student deleted.", "success");
    } else {
      _showSectionMsg("axpStuEditMsg", res.message || "Failed to delete student.", "danger");
    }
  } catch(err) {
    _showSectionMsg("axpStuEditMsg", "Network error. Please try again.", "danger");
  }
};
window.axpStudentTab = function(tab) {
  document.getElementById("axpStudentTabNames").style.display    = tab === "names"    ? "block" : "none";
  document.getElementById("axpStudentTabSubjects").style.display = tab === "subjects" ? "block" : "none";
  document.getElementById("axpTabNames").style.color             = tab === "names"    ? "#4ecca3" : "#94a3b8";
  document.getElementById("axpTabNames").style.borderBottomColor = tab === "names"    ? "#4ecca3" : "transparent";
  document.getElementById("axpTabSubjects").style.color          = tab === "subjects" ? "#4ecca3" : "#94a3b8";
  document.getElementById("axpTabSubjects").style.borderBottomColor = tab === "subjects" ? "#4ecca3" : "transparent";
  if (tab === "subjects") _axpRenderSubjectMatrix();
};

function _axpUpdateNamesProgress() {
  const total  = window._axpStudentRows.length;
  const filled = window._axpStudentRows.filter(r => r.name && r.name.trim()).length;
  const pct    = total > 0 ? Math.round(filled / total * 100) : 0;
  const fill   = document.getElementById("axpNamesFill");
  const count  = document.getElementById("axpNamesCount");
  if (fill)  fill.style.width = pct + "%";
  if (count) count.textContent = `${filled}/${total}`;
}

function _axpRenderSubjectMatrix() {
  const cont = document.getElementById("axpStudentSubjectMatrix");
  if (!cont) return;
  const cls  = (document.getElementById("axpPushClass") || {}).value;
  const subjects = (_schoolMeta && _schoolMeta.subjects && cls && _schoolMeta.subjects[cls]) ? _schoolMeta.subjects[cls] : [];
  const names    = window._axpStudentRows.filter(r => r.name && r.name.trim()).map(r => r.name.trim());

  if (names.length === 0) {
    cont.innerHTML = `<div class="axp-alert axp-alert-warning"><i class="bi bi-exclamation-triangle"></i><span>Add student names first in the "Student Names" tab.</span></div>`;
    return;
  }
  if (subjects.length === 0) {
    cont.innerHTML = `<div class="axp-alert axp-alert-warning"><i class="bi bi-exclamation-triangle"></i><span>No subjects configured for this class.</span></div>`;
    return;
  }

  names.forEach(n => {
    if (!window._axpStudentSubjects[n]) window._axpStudentSubjects[n] = [...subjects];
  });

  /* Fixed cell width — same for BOTH header and body */
  const CELL_W = 38;
  const cellStyle  = `width:${CELL_W}px;min-width:${CELL_W}px;max-width:${CELL_W}px;height:38px;display:flex;align-items:center;justify-content:center;border-right:1px solid #e2e8f0;box-sizing:border-box;flex-shrink:0;`;
  const hdrStyle   = `width:${CELL_W}px;min-width:${CELL_W}px;max-width:${CELL_W}px;text-align:center;font-size:10px;font-weight:700;color:#64748b;padding:0 2px;writing-mode:vertical-lr;transform:rotate(180deg);height:80px;display:flex;align-items:center;justify-content:center;border-right:1px solid #e2e8f0;word-break:break-all;overflow:hidden;box-sizing:border-box;flex-shrink:0;`;
  const NAME_W     = 190;
  const COUNT_W    = 64;

  cont.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
      <p style="font-size:12px;color:#64748b;margin:0;flex:1;">Check subjects each student takes.</p>
      <button onclick="axpCheckAllSubjects()" class="axp-btn-secondary" style="font-size:11.5px;padding:5px 10px;"><i class="bi bi-check2-all"></i> Check All</button>
      <button onclick="axpUncheckAllSubjects()" class="axp-btn-secondary" style="font-size:11.5px;padding:5px 10px;"><i class="bi bi-square"></i> Uncheck All</button>
    </div>
    <div style="overflow-x:auto;padding-bottom:4px;">
      <div style="min-width:max-content;">

        <!-- HEADER ROW -->
        <div style="display:flex;align-items:flex-end;border-bottom:2px solid #e2e8f0;padding-bottom:3px;">
          <div style="width:${NAME_W}px;min-width:${NAME_W}px;max-width:${NAME_W}px;font-size:11px;font-weight:700;color:#64748b;padding:0 8px;flex-shrink:0;box-sizing:border-box;">Student Name</div>
          ${subjects.map(s => `<div style="${hdrStyle}" title="${escapeHtml(s)}">${escapeHtml(s.length > 10 ? s.slice(0,10)+'…' : s)}</div>`).join("")}
          <div style="width:${COUNT_W}px;min-width:${COUNT_W}px;font-size:11px;font-weight:700;color:#64748b;text-align:center;padding:0 8px;flex-shrink:0;">Count</div>
        </div>

        <!-- STUDENT ROWS -->
        ${names.map((name, ni) => {
          const taken = window._axpStudentSubjects[name] || [];
          const takesCount = subjects.filter(s => taken.includes(s)).length;
          return `
            <div style="display:flex;align-items:center;border-bottom:1px solid #f1f5f9;${ni % 2 === 0 ? 'background:#fff;' : 'background:#fafbfc;'}">
              <div style="width:${NAME_W}px;min-width:${NAME_W}px;max-width:${NAME_W}px;font-size:12.5px;font-weight:500;color:#1a1a2e;padding:7px 8px;flex-shrink:0;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(name)}</div>
              ${subjects.map(s => `
                <div style="${cellStyle}">
                  <input type="checkbox" data-student="${escapeHtml(name)}" data-subject="${escapeHtml(s)}" ${taken.includes(s) ? "checked" : ""}
                    onchange="_axpMatrixToggle(this)"
                    style="width:15px;height:15px;accent-color:#4ecca3;cursor:pointer;" />
                </div>`).join("")}
              <div style="width:${COUNT_W}px;min-width:${COUNT_W}px;text-align:center;flex-shrink:0;">
                <span id="axpSubCount_${ni}" style="font-size:12px;font-weight:700;color:#4ecca3;">${takesCount}</span>
              </div>
            </div>`;
        }).join("")}

        <!-- TOGGLE-ALL FOOTER ROW -->
        <div style="display:flex;align-items:center;border-top:2px solid #e2e8f0;padding:5px 0;background:#f8fafc;">
          <div style="width:${NAME_W}px;min-width:${NAME_W}px;font-size:11px;color:#94a3b8;padding:0 8px;font-style:italic;flex-shrink:0;">Toggle all ↓</div>
          ${subjects.map(s => `
            <div style="${cellStyle}">
              <input type="checkbox" checked title="Toggle all for ${escapeHtml(s)}"
                data-toggle-subject="${escapeHtml(s)}"
                onchange="_axpMatrixToggleAll(this)"
                style="width:13px;height:13px;accent-color:#94a3b8;cursor:pointer;opacity:.6;" />
            </div>`).join("")}
          <div style="width:${COUNT_W}px;min-width:${COUNT_W}px;flex-shrink:0;"></div>
        </div>

      </div>
    </div>`;
}

/* ── Single cell toggle — updates count live without full re-render ── */
window._axpMatrixToggle = function(checkbox) {
  const name    = checkbox.getAttribute("data-student");
  const subject = checkbox.getAttribute("data-subject");
  const checked = checkbox.checked;

  if (!window._axpStudentSubjects[name]) window._axpStudentSubjects[name] = [];
  if (checked) {
    if (!window._axpStudentSubjects[name].includes(subject))
      window._axpStudentSubjects[name].push(subject);
  } else {
    window._axpStudentSubjects[name] = window._axpStudentSubjects[name].filter(s => s !== subject);
  }

  /* Update ONLY the count cell for this student row — no full re-render */
  const cls      = (document.getElementById("axpPushClass") || {}).value;
  const subjects = (_schoolMeta && _schoolMeta.subjects && cls && _schoolMeta.subjects[cls]) ? _schoolMeta.subjects[cls] : [];
  const names    = window._axpStudentRows.filter(r => r.name && r.name.trim()).map(r => r.name.trim());
  const ni       = names.indexOf(name);
  if (ni !== -1) {
    const countEl = document.getElementById(`axpSubCount_${ni}`);
    if (countEl) {
      const newCount = subjects.filter(s => (window._axpStudentSubjects[name] || []).includes(s)).length;
      countEl.textContent = newCount;
    }
  }
};

/* ── Toggle entire column (all students for one subject) ── */
window._axpMatrixToggleAll = function(checkbox) {
  const subject = checkbox.getAttribute("data-toggle-subject");
  const checked = checkbox.checked;
  const cls     = (document.getElementById("axpPushClass") || {}).value;
  const subjects = (_schoolMeta && _schoolMeta.subjects && cls && _schoolMeta.subjects[cls]) ? _schoolMeta.subjects[cls] : [];
  const names   = window._axpStudentRows.filter(r => r.name && r.name.trim()).map(r => r.name.trim());

  names.forEach((name, ni) => {
    if (!window._axpStudentSubjects[name]) window._axpStudentSubjects[name] = [];
    if (checked) {
      if (!window._axpStudentSubjects[name].includes(subject))
        window._axpStudentSubjects[name].push(subject);
    } else {
      window._axpStudentSubjects[name] = window._axpStudentSubjects[name].filter(s => s !== subject);
    }

    /* Update individual checkboxes in this column */
    const cb = document.querySelector(`input[data-student="${name}"][data-subject="${subject}"]`);
    if (cb) cb.checked = checked;

    /* Update count for this student */
    const countEl = document.getElementById(`axpSubCount_${ni}`);
    if (countEl) {
      const newCount = subjects.filter(s => (window._axpStudentSubjects[name] || []).includes(s)).length;
      countEl.textContent = newCount;
    }
  });
};

window.axpToggleStudentSubject = function(name, sub, checked) {
  if (!window._axpStudentSubjects[name]) window._axpStudentSubjects[name] = [];
  if (checked) { if (!window._axpStudentSubjects[name].includes(sub)) window._axpStudentSubjects[name].push(sub); }
  else         { window._axpStudentSubjects[name] = window._axpStudentSubjects[name].filter(s => s !== sub); }
};

window.axpToggleSubjectForAll = function(sub, checked) {
  window._axpStudentRows.filter(r => r.name && r.name.trim()).forEach(r => {
    const n = r.name.trim();
    if (!window._axpStudentSubjects[n]) window._axpStudentSubjects[n] = [];
    if (checked) { if (!window._axpStudentSubjects[n].includes(sub)) window._axpStudentSubjects[n].push(sub); }
    else         { window._axpStudentSubjects[n] = window._axpStudentSubjects[n].filter(s => s !== sub); }
  });
  _axpRenderSubjectMatrix();
};

window.axpCheckAllSubjects = function() {
  const cls      = (document.getElementById("axpPushClass") || {}).value;
  const subjects = (_schoolMeta && _schoolMeta.subjects && cls && _schoolMeta.subjects[cls]) ? _schoolMeta.subjects[cls] : [];
  const names    = window._axpStudentRows.filter(r => r.name && r.name.trim()).map(r => r.name.trim());
  names.forEach(n => { window._axpStudentSubjects[n] = [...subjects]; });
  _axpRenderSubjectMatrix();
};

window.axpUncheckAllSubjects = function() {
  const names = window._axpStudentRows.filter(r => r.name && r.name.trim()).map(r => r.name.trim());
  names.forEach(n => { window._axpStudentSubjects[n] = []; });
  _axpRenderSubjectMatrix();
};

window.axpRenderStudentInputs = function() {
  const cls = document.getElementById("axpPushClass").value;
  const sec = document.getElementById("axpStudentInputSection");
  if (!cls) { sec.style.display="none"; return; }
  sec.style.display = "block";
  window._axpStudentRows    = [];
  window._axpStudentSubjects = {};
  _axpRenderStudentRows();
  axpLoadExistingStudents(cls);

  const pctEl  = document.getElementById("axpEnrollPct");
  const fillEl = document.getElementById("axpEnrollFill");
  const lblEl  = document.getElementById("axpEnrollSubLabel");
  if (pctEl)  pctEl.textContent  = "Loading…";
  if (fillEl) fillEl.style.width = "10%";
  if (lblEl)  lblEl.textContent  = `Loading enrollment data for ${cls}…`;
};

async function axpLoadExistingStudents(cls) {
  try {
    const examType = ((_schoolMeta && _schoolMeta.examTypes) ? _schoolMeta.examTypes[0] : null);
    if (!examType) return;
    const res = await _apiGet({ mode:"examRoster", schoolId:_appScriptSchoolId, year:_schoolMeta.year, examType, class:cls });
    if (res.status==="success" && res.roster && res.roster.length > 0) {
      window._axpStudentRows = res.roster.map(s=>({name:s.name||"",gender:(s.gender||"M").toUpperCase()}));
      _axpRenderStudentRows();
      _showSectionMsg("axpPushMsg",`Loaded ${res.roster.length} existing students.`,"success");
      _axpUpdateEnrollProgress(res.roster.length, cls);
    } else {
      window._axpStudentRows = Array.from({length:5},()=>({name:"",gender:"M"}));
      _axpRenderStudentRows();
      _axpUpdateEnrollProgress(0, cls);
    }
  } catch(e) {
    window._axpStudentRows = Array.from({length:5},()=>({name:"",gender:"M"}));
    _axpRenderStudentRows();
    _axpUpdateEnrollProgress(0, cls);
  }
}

function _axpUpdateEnrollProgress(count, cls) {
  const pctEl  = document.getElementById("axpEnrollPct");
  const fillEl = document.getElementById("axpEnrollFill");
  const lblEl  = document.getElementById("axpEnrollSubLabel");
  const expected = 40;
  const pct = count > 0 ? Math.min(100, Math.round(count / expected * 100)) : 0;
  if (pctEl)  pctEl.textContent  = count > 0 ? `${count} students` : "0 students";
  if (fillEl) { fillEl.style.width = pct + "%"; fillEl.style.background = pct >= 80 ? "#10b981" : "#4ecca3"; }
  if (lblEl)  lblEl.textContent  = count > 0 ? `${count} students enrolled in ${cls}` : `No students yet in ${cls} — add names below`;
}

function _axpRenderStudentRows() {
  const cont = document.getElementById("axpStudentRows");
  if (!cont) return;
  cont.innerHTML = `
    <div style="display:grid;grid-template-columns:28px 1fr 75px auto;gap:5px;align-items:center;padding:5px 3px 7px;border-bottom:1px solid #e2e8f0;margin-bottom:5px;">
      <span style="font-size:10.5px;color:#94a3b8;">#</span>
      <span style="font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Student Name</span>
      <span style="font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Gender</span>
      <span></span>
    </div>
    ${window._axpStudentRows.map((s,i)=>`
      <div style="display:grid;grid-template-columns:28px 1fr 75px auto;gap:5px;align-items:center;margin-bottom:5px;">
        <span style="font-size:11.5px;color:#94a3b8;text-align:center;">${i+1}</span>
        <input class="axp-input" style="padding:6px 9px;font-size:12.5px;" value="${escapeHtml(s.name)}"
          oninput="window._axpStudentRows[${i}].name=this.value;_axpUpdateNamesProgress()" placeholder="Full Name" />
        <select class="axp-select" style="padding:6px 7px;font-size:12.5px;" onchange="window._axpStudentRows[${i}].gender=this.value">
          <option value="M" ${s.gender==="M"?"selected":""}>M</option>
          <option value="F" ${s.gender==="F"?"selected":""}>F</option>
        </select>
        <button onclick="axpRemoveStudentRow(${i})" style="background:none;border:none;color:#dc3545;cursor:pointer;font-size:16px;padding:2px 5px;" title="Remove">×</button>
      </div>`).join("")}`;
  _axpUpdateNamesProgress();
}

window.axpAddStudentRow = function() {
  window._axpStudentRows.push({name:"",gender:"M"});
  _axpRenderStudentRows();
};

window.axpRemoveStudentRow = function(idx) {
  window._axpStudentRows.splice(idx,1);
  _axpRenderStudentRows();
};

window.axpBulkPasteToggle = function() {
  const area = document.getElementById("axpBulkPasteArea");
  area.style.display = area.style.display==="none" ? "block" : "none";
};

window.axpParseBulkPaste = function() {
  const raw = document.getElementById("axpBulkPasteInput").value.trim();
  if (!raw) return;
  const lines = raw.split("\n").map(l=>l.trim()).filter(Boolean);
  const parsed = lines.map(line => {
    const parts = line.split(",").map(p=>p.trim());
    const name   = parts[0] || "";
    const gender = (parts[1] || "M").toUpperCase().startsWith("F") ? "F" : "M";
    return {name, gender};
  }).filter(r=>r.name);
  window._axpStudentRows = parsed;
  _axpRenderStudentRows();
  document.getElementById("axpBulkPasteArea").style.display = "none";
  _showSectionMsg("axpPushMsg",`Parsed ${parsed.length} student names.`,"success");
};

window.axpStudentExcelToggle = function() {
  const area = document.getElementById("axpStudentExcelArea");
  if (area) area.style.display = area.style.display === "none" ? "block" : "none";
};

window.axpDownloadStudentTemplate = function() {
  const csv = "Name,Gender\nJohn Doe,M\nJane Smith,F\nPeter Jones,M";
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "students_template.csv"; a.click();
};

window.axpHandleStudentExcelDrop = function(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) _parseStudentExcelFile(file);
};

window.axpHandleStudentExcelFile = function(input) {
  const file = input.files[0];
  if (file) _parseStudentExcelFile(file);
};

function _parseStudentExcelFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { _showSectionMsg("axpStuExcelMsg","File appears empty.","danger"); return; }
    const rows = lines.slice(1).map(line => {
      const cols = line.split(",");
      const name   = (cols[0]||"").trim();
      const gender = ((cols[1]||"M").trim().toUpperCase().startsWith("F")) ? "F" : "M";
      return { name, gender };
    }).filter(r => r.name);
    if (rows.length === 0) { _showSectionMsg("axpStuExcelMsg","No valid rows found.","danger"); return; }
    window._axpStudentRows = rows;
    _axpRenderStudentRows();
    document.getElementById("axpStudentExcelArea").style.display = "none";
    _showSectionMsg("axpPushMsg", `${rows.length} students loaded from file!`, "success");
  };
  reader.readAsText(file);
}

window.axpSubmitStudentNames = async function() {
  const cls = document.getElementById("axpPushClass").value;
  if (!cls) { _showSectionMsg("axpPushMsg","Select a class first.","danger"); return; }

  const rows = document.getElementById("axpStudentRows");
  if (rows) {
    rows.querySelectorAll("div[style*='grid']").forEach((row, ri) => {
      if (ri === 0) return;
      const idx = ri - 1;
      const inp = row.querySelector("input");
      const sel = row.querySelector("select");
      if (inp && window._axpStudentRows[idx] !== undefined) window._axpStudentRows[idx].name = inp.value.trim();
      if (sel && window._axpStudentRows[idx] !== undefined) window._axpStudentRows[idx].gender = sel.value;
    });
  }

  const valid = window._axpStudentRows.filter(r => r.name.trim());
  if (valid.length === 0) { _showSectionMsg("axpPushMsg","No student names entered.","danger"); return; }

  const progDiv  = document.getElementById("axpPushProgress");
  const progFill = document.getElementById("axpPushProgressFill");
  const progPct  = document.getElementById("axpPushProgressPct");
  const progLbl  = document.getElementById("axpPushProgressLabel");
  if (progDiv) progDiv.style.display = "block";

  let fakeP = 0;
  const steps = ["Preparing headers…","Uploading student names…","Saving to Database…","Finalizing…"];
  const ticker = setInterval(() => {
    fakeP = Math.min(fakeP + (Math.random() * 12 + 4), 88);
    const pct = Math.floor(fakeP);
    if (progFill) progFill.style.width = pct + "%";
    if (progPct)  progPct.textContent  = pct + "%";
    if (progLbl)  progLbl.textContent  = steps[Math.min(Math.floor(pct / 25), steps.length - 1)];
  }, 280);

  const btn = document.getElementById("axpPushStudentsBtn");
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="axp-spinner-sm"></span> Pushing…'; }

  try {
    const subjectList = (_schoolMeta && _schoolMeta.subjects && _schoolMeta.subjects[cls]) ? _schoolMeta.subjects[cls] : [];

    const headerParams = { mode:"header", schoolId:_appScriptSchoolId, year:_schoolMeta.year };
    subjectList.forEach((s, i) => { headerParams[`subject${i+1}`] = s; });
    await _apiPost(headerParams);

    const dataPayload = valid.map(s => {
      const takenList = window._axpStudentSubjects[s.name] || subjectList;
      const subjectsMap = {};
      subjectList.forEach(sub => {
        subjectsMap[sub] = takenList.includes(sub);
      });
      return { name: s.name, gender: s.gender, subjects: subjectsMap };
    });

    await _apiPost({ mode:"data", schoolId:_appScriptSchoolId, year:_schoolMeta.year, class:cls, data:JSON.stringify(dataPayload) });

    clearInterval(ticker);
    if (progFill) { progFill.style.width = "100%"; progFill.style.background = "#10b981"; }
    if (progPct)  progPct.textContent  = "100%";
    if (progLbl)  progLbl.textContent  = `${valid.length} students uploaded successfully!`;
    _showSectionMsg("axpPushMsg",`${valid.length} student names pushed! Click "Sync to Exam database" to propagate.`,"success");
    _axpUpdateEnrollProgress(valid.length, cls);
    setTimeout(() => { if (progDiv) progDiv.style.display = "none"; }, 4000);
  } catch(e) {
    clearInterval(ticker);
    if (progFill) { progFill.style.width = "100%"; progFill.style.background = "#ef4444"; }
    if (progLbl)  progLbl.textContent = "Upload failed. Please retry.";
    _showSectionMsg("axpPushMsg","Failed to push names. Please try again.","danger");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-cloud-upload"></i> Push Names to System'; }
  }
};

window.axpSyncStudents = async function() {
  const cls      = document.getElementById("axpPushClass").value;
  const examType = document.getElementById("axpPushExamType").value;
  const btn      = document.getElementById("axpSyncStudentsBtn");
  btn.disabled=true; btn.innerHTML='<span class="axp-spinner-sm"></span> Syncing...';
  try {
    const params = { mode:"syncStudents", schoolId:_appScriptSchoolId, year:_schoolMeta.year };
    if (examType) params.examType = examType;
    const res = await _apiPost(params);
    if (res.status === "success") {
      _showSectionMsg("axpPushMsg",`Sync complete! Records updated in: ${(res.synced||[]).join(", ") || "all exam records"}`,"success");
    } else {
      _showSectionMsg("axpPushMsg", res.message || "Sync failed.","danger");
    }
  } catch(e) {
    _showSectionMsg("axpPushMsg","Sync failed. Check your connection.","danger");
  } finally {
    btn.disabled=false; btn.innerHTML='<i class="bi bi-arrow-repeat"></i> Sync to Exam Database';
  }
};



/* ─────────────────────────────────────────────────────────────
   SECTION: TASK PROGRESS
───────────────────────────────────────────────────────────── */
function renderTaskProgressSection() {
  const sw = document.getElementById("axpSectionWrapper");

  if (_dashboardData && _dashboardData.status !== "ACTIVE") {
    sw.innerHTML = _axpInactiveBlock();
    return;
  }
  if (!_appScriptSchoolId) {
    sw.innerHTML = `
      <div class="axp-section-card" style="text-align:center;padding:40px 24px;">
        <i class="bi bi-lock-fill" style="font-size:36px;color:#4ecca3;display:block;margin-bottom:14px;"></i>
        <h3 style="font-size:16px;font-weight:800;color:#1a1a2e;margin:0 0 8px;">Feature Locked</h3>
        <p style="font-size:13px;color:#64748b;max-width:360px;margin:0 auto 20px;line-height:1.6;">
          Configure your school first to unlock progress tracking.
        </p>
        <button onclick="axpOpenSetupPopup()" class="axp-btn-primary" style="font-size:13.5px;padding:10px 24px;">
          <i class="bi bi-gear-fill"></i> Setup School Now
        </button>
      </div>`;
    return;
  }

  const classes   = (_schoolMeta && _schoolMeta.classes)   ? _schoolMeta.classes   : [];
  const examTypes = (_schoolMeta && _schoolMeta.examTypes) ? _schoolMeta.examTypes : [];

  
  window._axpTPChanges   = {};   
  window._axpTPOriginal  = {};  
  window._axpTPStudents  = [];   
  window._axpTPSubjects  = [];   

  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title">
        <i class="bi bi-pencil-square"></i> Task Progress — Raw Marks Editor
      </div>

      <div class="axp-alert axp-alert-info" style="margin-bottom:16px;">
        <i class="bi bi-info-circle"></i>
        <span>Load marks for any exam and class. Edit directly in the table, then save changes back to the server.</span>
      </div>

      <!-- Filter bar -->
      <div style="background:#f8fafc;padding:14px;margin-bottom:0;">
        <div class="axp-form-row">
          <div class="axp-field-group">
            <label>Exam Type</label>
            <select id="axpTPExamType" class="axp-select" onchange="axpTPOnFilterChange()">
              <option value="">— Select Exam —</option>
              ${examTypes.map(et => `<option value="${escapeHtml(et)}">${escapeHtml(et)}</option>`).join("")}
            </select>
          </div>
          <div class="axp-field-group">
            <label>Class</label>
            <select id="axpTPClass" class="axp-select" onchange="axpTPOnFilterChange()">
              <option value="">— Select Class —</option>
              ${classes.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button onclick="axpTPLoadMarks()" class="axp-btn-primary" id="axpTPLoadBtn">
            <i class="bi bi-cloud-download"></i> Load Marks
          </button>
          <button onclick="axpTPSaveChanges()" class="axp-btn-primary"
            id="axpTPSaveBtn"
            style="background:#10b981;display:none;">
            <i class="bi bi-floppy"></i> Save Changes
            <span id="axpTPChangeBadge"
              style="background:rgba(255,255,255,0.25);padding:1px 7px;font-size:11px;margin-left:4px;">0</span>
          </button>
          <button onclick="axpTPDiscardChanges()" class="axp-btn-secondary"
            id="axpTPDiscardBtn"
            style="display:none;">
            <i class="bi bi-x-circle"></i> Discard
          </button>
          <span id="axpTPStatusLabel" style="font-size:12px;color:#94a3b8;margin-left:4px;"></span>
        </div>
      </div>

      <!-- Change summary bar (hidden until edits made) -->
      <div id="axpTPChangeSummary"
        style="display:none;background:#fffbeb;border-left:3px solid #f59e0b;
        padding:8px 14px;font-size:12.5px;color:#92400e;
        display:none;align-items:center;gap:8px;">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <span id="axpTPChangeSummaryText">You have unsaved changes.</span>
      </div>

      <!-- Save progress bar (hidden until saving) -->
      <div id="axpTPSaveProgress" style="display:none;background:#f8fafc;padding:10px 14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
          <span id="axpTPSaveLabel" style="font-size:12.5px;font-weight:600;color:#374151;">Saving...</span>
          <span id="axpTPSavePct" style="font-size:13px;font-weight:800;color:#4ecca3;">0%</span>
        </div>
        <div class="axp-progress-bar" style="height:6px;">
          <div class="axp-progress-fill" id="axpTPSaveFill" style="width:0%;transition:width .4s;"></div>
        </div>
      </div>

      <!-- Marks table -->
      <div id="axpTPContent">
        <div class="axp-empty-state" style="padding:50px 16px;">
          <i class="bi bi-table" style="font-size:38px;"></i>
          <p>Select an exam type and class, then click <strong>Load Marks</strong>.</p>
        </div>
      </div>

      <div id="axpTPMsg" style="margin-top:10px;padding:0 0 4px;"></div>
    </div>`;

  _axpTPInjectStyles();
}

function _axpTPInjectStyles() {
  if (document.getElementById("axp-tp-styles")) return;
  const s = document.createElement("style");
  s.id = "axp-tp-styles";
  s.textContent = `
    .axp-tp-table { width:100%; border-collapse:collapse; font-size:12.5px; }
    .axp-tp-table th {
      background:#060c1c; color:#fff; padding:9px 10px;
      font-size:10.5px; font-weight:700; text-align:center;
      letter-spacing:.4px; white-space:nowrap; position:sticky; top:0; z-index:2;
    }
    .axp-tp-table th.axp-tp-th-name { text-align:left; min-width:160px; }
    .axp-tp-table td { padding:4px 5px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
    .axp-tp-table tr:nth-child(even) td { background:#fafbfc; }
    .axp-tp-table tr:hover td { background:#f0fdf9; }
    .axp-tp-cell {
      width:60px; min-width:60px; max-width:60px;
      height:32px; border:1px solid transparent; background:transparent;
      font-size:13px; font-weight:700; text-align:center;
      color:#1a1a2e; padding:0 4px; box-sizing:border-box;
      transition:border-color .15s, background .15s;
    }
    .axp-tp-cell:focus {
      outline:none; border-color:#4ecca3; background:#f0fdf9;
    }
    .axp-tp-cell.changed {
      border-color:#f59e0b !important; background:#fffbeb !important; color:#92400e;
    }
    .axp-tp-cell.saved {
      border-color:#10b981 !important; background:#ecfdf5 !important; color:#065f46;
    }
    .axp-tp-grade {
      font-size:11px; font-weight:700; text-align:center;
      padding:2px 0; min-width:24px; display:inline-block;
    }
    .axp-tp-sticky-col {
      position:sticky; left:0; z-index:1; background:#fff;
      border-right:2px solid #e2e8f0;
    }
    .axp-tp-table tr:nth-child(even) .axp-tp-sticky-col { background:#fafbfc; }
    .axp-tp-table tr:hover .axp-tp-sticky-col { background:#f0fdf9; }
    .axp-tp-examno {
      font-size:11.5px; font-weight:700; color:#4ecca3;
      white-space:nowrap; min-width:80px; text-align:center;
    }
    @media(max-width:500px){
      .axp-tp-table { font-size:11px; }
      .axp-tp-cell { width:48px; min-width:48px; max-width:48px; font-size:12px; }
    }
  `;
  document.head.appendChild(s);
}

window.axpTPOnFilterChange = function() {
  /* If there are unsaved changes, warn user */
  if (Object.keys(window._axpTPChanges || {}).length > 0) {
    if (!confirm("You have unsaved changes. Switching will discard them. Continue?")) {
      return;
    }
  }
  window._axpTPChanges  = {};
  window._axpTPOriginal = {};
  window._axpTPStudents = [];
  _axpTPHideActionBtns();
  document.getElementById("axpTPContent").innerHTML = `
    <div class="axp-empty-state" style="padding:40px 16px;">
      <i class="bi bi-table" style="font-size:38px;"></i>
      <p>Click <strong>Load Marks</strong> to fetch data.</p>
    </div>`;
  document.getElementById("axpTPMsg").innerHTML = "";
};

window.axpTPLoadMarks = async function() {
  const examType = (document.getElementById("axpTPExamType") || {}).value;
  const cls      = (document.getElementById("axpTPClass")    || {}).value;

  if (!examType || !cls) {
    _showSectionMsg("axpTPMsg", "Please select both an Exam Type and a Class.", "warning");
    return;
  }

  const cont   = document.getElementById("axpTPContent");
  const loadBtn = document.getElementById("axpTPLoadBtn");
  if (loadBtn) { loadBtn.disabled = true; loadBtn.innerHTML = '<span class="axp-spinner-sm"></span> Loading…'; }

  cont.innerHTML = `
    <div class="axp-empty-state" style="padding:40px 16px;">
      <div class="axp-spinner-sm" style="margin:0 auto 10px;width:28px;height:28px;border-width:3px;"></div>
      <p>Fetching marks from server…</p>
    </div>`;

  window._axpTPChanges  = {};
  window._axpTPOriginal = {};
  _axpTPHideActionBtns();

  try {
    /* Same fetch pattern as _axpRRFetchAndRender */
    const res = await _apiGet({
      schoolId : _appScriptSchoolId,
      year     : _schoolMeta.year,
      class    : cls,
      examType : examType
    });

    const students = res.students || res.data || [];
    const subjects  = (_schoolMeta.subjects || {})[cls] || [];

    if (!students.length) {
      cont.innerHTML = `
        <div class="axp-empty-state" style="padding:40px 16px;">
          <i class="bi bi-inbox"></i>
          <p>No data found for <strong>${escapeHtml(cls)}</strong> — <strong>${escapeHtml(examType)}</strong>.</p>
          <p style="font-size:12px;color:#94a3b8;margin-top:6px;">Teachers may not have entered marks yet.</p>
        </div>`;
      return;
    }

    window._axpTPStudents = students;
    window._axpTPSubjects = subjects;

    /* Build original values map for change tracking */
    students.forEach(s => {
      const examNo = s.examNo || s.exam_no || "";
      subjects.forEach(sub => {
        const raw = _axpExtractMark((s.marks || s.scores || {})[sub]);
        const key = `${examNo}::${sub}`;
        window._axpTPOriginal[key] = (raw !== undefined && raw !== null) ? String(raw) : "";
      });
    });

    _axpTPRenderTable(students, subjects, cls, examType, cont);
    _axpTPSetStatus(`Loaded ${students.length} students · ${subjects.length} subjects`);

  } catch(err) {
    cont.innerHTML = `
      <div class="axp-alert axp-alert-danger">
        <i class="bi bi-exclamation-circle"></i>
        <span>Failed to load marks. Check your connection and try again.</span>
      </div>`;
  } finally {
    if (loadBtn) { loadBtn.disabled = false; loadBtn.innerHTML = '<i class="bi bi-cloud-download"></i> Load Marks'; }
  }
};

function _axpTPRenderTable(students, subjects, cls, examType, cont) {
  if (!subjects.length) {
    cont.innerHTML = `<div class="axp-alert axp-alert-warning"><i class="bi bi-info-circle"></i><span>No subjects configured for ${escapeHtml(cls)}.</span></div>`;
    return;
  }

  /* Truncate subject headers */
  const subHeaders = subjects.map(s =>
    `<th title="${escapeHtml(s)}" style="max-width:70px;">
      ${escapeHtml(s.length > 8 ? s.slice(0,8)+'…' : s)}
     </th>`
  ).join("");

  const rows = students.map((s, i) => {
    const examNo = s.examNo || s.exam_no || `S${String(i+1).padStart(4,"0")}`;
    const name   = s.name || "—";
    const gender = s.gender || s.sex || "—";

    const cells = subjects.map(sub => {
      const raw  = _axpExtractMark((s.marks || s.scores || {})[sub]);
      const val  = (raw !== undefined && raw !== null) ? String(raw) : "";
      const { grade, color } = _axpGrade(raw);
      const key  = `${examNo}::${sub}`;

      return `
        <td style="text-align:center;padding:3px 4px;">
          <input
            class="axp-tp-cell"
            type="number" min="0" max="100"
            value="${escapeHtml(val)}"
            data-key="${escapeHtml(key)}"
            data-original="${escapeHtml(val)}"
            oninput="axpTPOnCellChange(this)"
            onblur="axpTPOnCellBlur(this)"
            title="${escapeHtml(sub)}: ${val || '—'}"
          />
          <div class="axp-tp-grade" style="color:${color};">${val ? grade : '—'}</div>
        </td>`;
    }).join("");

    return `
      <tr>
        <td class="axp-tp-sticky-col" style="min-width:26px;text-align:center;color:#94a3b8;font-size:11px;padding:5px 7px;">${i+1}</td>
        <td class="axp-tp-sticky-col axp-tp-examno" style="left:38px;padding:5px 8px;">${escapeHtml(examNo)}</td>
        <td class="axp-tp-sticky-col" style="left:118px;font-weight:600;font-size:12.5px;color:#1a1a2e;white-space:nowrap;padding:5px 10px;">${escapeHtml(name)}</td>
        <td style="text-align:center;font-size:12px;color:#64748b;">${gender}</td>
        ${cells}
        <td style="text-align:center;font-size:12px;font-weight:700;color:#64748b;" id="axpTPAvg_${i}">${s.average || s.avg || '—'}</td>
      </tr>`;
  }).join("");

  cont.innerHTML = `
    <!-- Info strip -->
    <div style="background:#060c1c;color:#fff;padding:10px 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:12.5px;">
      <span><i class="bi bi-journal-bookmark" style="color:#4ecca3;"></i> <strong>${escapeHtml(cls)}</strong></span>
      <span style="opacity:.5;">·</span>
      <span><i class="bi bi-file-earmark-text" style="color:#4ecca3;"></i> ${escapeHtml(examType)}</span>
      <span style="opacity:.5;">·</span>
      <span><i class="bi bi-people" style="color:#4ecca3;"></i> ${students.length} students</span>
      <span style="opacity:.5;">·</span>
      <span><i class="bi bi-book" style="color:#4ecca3;"></i> ${subjects.length} subjects</span>
      <span style="margin-left:auto;font-size:11px;opacity:.5;">Click any cell to edit · Tab to move</span>
    </div>

    <!-- Scrollable table wrapper -->
    <div style="overflow-x:auto;overflow-y:auto;max-height:65vh;position:relative;">
      <table class="axp-tp-table">
        <thead>
          <tr>
            <th class="axp-tp-sticky-col" style="left:0;min-width:26px;">#</th>
            <th class="axp-tp-sticky-col" style="left:38px;min-width:80px;">Exam No</th>
            <th class="axp-tp-sticky-col axp-tp-th-name" style="left:118px;">Name</th>
            <th>Sex</th>
            ${subHeaders}
            <th>Avg</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ── Cell change handler — live grade preview + track changes ── */
window.axpTPOnCellChange = function(input) {
  const key      = input.getAttribute("data-key");
  const original = input.getAttribute("data-original");
  const newVal   = input.value.trim();

  /* Live grade preview */
  const gradeEl = input.nextElementSibling;
  if (gradeEl && gradeEl.classList.contains("axp-tp-grade")) {
    if (newVal === "") {
      gradeEl.textContent = "—"; gradeEl.style.color = "#94a3b8";
    } else {
      const { grade, color } = _axpGrade(parseInt(newVal));
      gradeEl.textContent = grade; gradeEl.style.color = color;
    }
  }

  /* Track change */
  if (newVal !== original) {
    window._axpTPChanges[key] = newVal;
    input.classList.add("changed");
    input.classList.remove("saved");
  } else {
    delete window._axpTPChanges[key];
    input.classList.remove("changed");
    input.classList.remove("saved");
  }

  _axpTPUpdateChangeBadge();
};


window.axpTPOnCellBlur = function(input) {
  const val = input.value.trim();
  if (val === "") return;
  const n = parseInt(val);
  if (isNaN(n) || n < 0 || n > 100) {
    input.style.borderColor = "#ef4444";
    input.style.background  = "#fef2f2";
    input.title = "Score must be 0–100";
  } else {
    if (input.classList.contains("changed")) {
      input.style.borderColor = "";
      input.style.background  = "";
    }
    input.title = val;
  }
};

function _axpTPUpdateChangeBadge() {
  const count   = Object.keys(window._axpTPChanges || {}).length;
  const badge   = document.getElementById("axpTPChangeBadge");
  const saveBtn = document.getElementById("axpTPSaveBtn");
  const discBtn = document.getElementById("axpTPDiscardBtn");
  const summary = document.getElementById("axpTPChangeSummary");
  const sumText = document.getElementById("axpTPChangeSummaryText");

  if (badge)   badge.textContent = count;
  if (saveBtn) saveBtn.style.display = count > 0 ? "inline-flex" : "none";
  if (discBtn) discBtn.style.display = count > 0 ? "inline-flex" : "none";

  if (summary) {
    summary.style.display = count > 0 ? "flex" : "none";
    if (sumText) sumText.textContent = `${count} unsaved change${count !== 1 ? "s" : ""} — click Save Changes to update the server.`;
  }
}

function _axpTPHideActionBtns() {
  ["axpTPSaveBtn","axpTPDiscardBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const summary = document.getElementById("axpTPChangeSummary");
  if (summary) summary.style.display = "none";
  _axpTPSetStatus("");
}

function _axpTPSetStatus(msg) {
  const el = document.getElementById("axpTPStatusLabel");
  if (el) el.textContent = msg;
}

/* ── Discard all changes ─────────────────────────────────────── */
window.axpTPDiscardChanges = function() {
  if (!confirm("Discard all unsaved changes?")) return;

  /* Reset all changed cells to their original values */
  document.querySelectorAll(".axp-tp-cell.changed").forEach(input => {
    const original = input.getAttribute("data-original");
    input.value = original;
    input.classList.remove("changed");

    /* Re-render grade */
    const gradeEl = input.nextElementSibling;
    if (gradeEl && gradeEl.classList.contains("axp-tp-grade")) {
      if (!original) {
        gradeEl.textContent = "—"; gradeEl.style.color = "#94a3b8";
      } else {
        const { grade, color } = _axpGrade(parseInt(original));
        gradeEl.textContent = grade; gradeEl.style.color = color;
      }
    }
  });

  window._axpTPChanges = {};
  _axpTPUpdateChangeBadge();
  _showSectionMsg("axpTPMsg", "All changes discarded.", "warning");
};

/* ── Save changes to server ──────────────────────────────────── */
window.axpTPSaveChanges = async function() {
  const changes = window._axpTPChanges || {};
  const count   = Object.keys(changes).length;
  if (count === 0) { _showSectionMsg("axpTPMsg", "No changes to save.", "warning"); return; }

  const examType = (document.getElementById("axpTPExamType") || {}).value;
  const cls      = (document.getElementById("axpTPClass")    || {}).value;

  /* Validate: no out-of-range values */
  const invalid = Object.entries(changes).filter(([k, v]) => {
    if (v === "") return false; /* allow clearing */
    const n = parseInt(v);
    return isNaN(n) || n < 0 || n > 100;
  });
  if (invalid.length > 0) {
    _showSectionMsg("axpTPMsg", `${invalid.length} cell(s) have invalid values (must be 0–100 or blank). Fix them before saving.`, "danger");
    return;
  }

  /* Build payload: array of { examNo, subject, oldValue, newValue } */
  const updates = Object.entries(changes).map(([key, newVal]) => {
    const [examNo, ...subParts] = key.split("::");
    const subject  = subParts.join("::");
    const oldVal   = window._axpTPOriginal[key] || "";
    return { examNo, subject, oldValue: oldVal, newValue: newVal };
  });

  /* Show progress */
  const saveBtn  = document.getElementById("axpTPSaveBtn");
  const discBtn  = document.getElementById("axpTPDiscardBtn");
  const progDiv  = document.getElementById("axpTPSaveProgress");
  const progFill = document.getElementById("axpTPSaveFill");
  const progPct  = document.getElementById("axpTPSavePct");
  const progLbl  = document.getElementById("axpTPSaveLabel");

  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<span class="axp-spinner-sm"></span> Saving…'; }
  if (discBtn)  discBtn.disabled = true;
  if (progDiv)  progDiv.style.display = "block";

  let fakeP = 0;
  const ticker = setInterval(() => {
    fakeP = Math.min(fakeP + Math.random() * 15 + 5, 88);
    const p = Math.floor(fakeP);
    if (progFill) progFill.style.width = p + "%";
    if (progPct)  progPct.textContent  = p + "%";
    if (progLbl)  progLbl.textContent  = p < 40 ? "Sending updates…" : p < 75 ? "Writing to database…" : "Finalizing…";
  }, 250);

  try {
    const res = await _apiPost({
      mode      : "updateMarks",
      adminEmail: _dashboardData.email,
      schoolId  : _appScriptSchoolId,
      year      : _schoolMeta.year,
      class     : cls,
      examType  : examType,
      updates   : JSON.stringify(updates)
    });

    clearInterval(ticker);

    if (res.status === "success") {
      /* Mark all saved cells green, update originals */
      Object.keys(changes).forEach(key => {
        const input = document.querySelector(`.axp-tp-cell[data-key="${key}"]`);
        if (input) {
          input.setAttribute("data-original", changes[key]);
          input.classList.remove("changed");
          input.classList.add("saved");
          /* Fade back to normal after 2.5s */
          setTimeout(() => input.classList.remove("saved"), 2500);
        }
        window._axpTPOriginal[key] = changes[key];
      });

      window._axpTPChanges = {};
      _axpTPUpdateChangeBadge();

      if (progFill) { progFill.style.width = "100%"; progFill.style.background = "#10b981"; }
      if (progPct)  progPct.textContent = "100%";
      if (progLbl)  progLbl.textContent = `${count} mark${count !== 1 ? "s" : ""} updated successfully!`;
      setTimeout(() => { if (progDiv) progDiv.style.display = "none"; }, 3000);

      _showSectionMsg("axpTPMsg", `${count} mark${count !== 1 ? "s" : ""} saved to server successfully.`, "success");
      _axpTPSetStatus(`Last saved: ${new Date().toLocaleTimeString()}`);
      _axpToast(`${count} marks updated!`, "success");

    } else {
      clearInterval(ticker);
      if (progFill) { progFill.style.width = "100%"; progFill.style.background = "#ef4444"; }
      if (progLbl)  progLbl.textContent = "Save failed.";
      setTimeout(() => { if (progDiv) progDiv.style.display = "none"; }, 3000);
      _showSectionMsg("axpTPMsg", res.message || "Failed to save changes. Please try again.", "danger");
    }

  } catch(err) {
    clearInterval(ticker);
    if (progFill) { progFill.style.width = "100%"; progFill.style.background = "#ef4444"; }
    if (progLbl)  progLbl.textContent = "Network error.";
    setTimeout(() => { if (progDiv) progDiv.style.display = "none"; }, 3000);
    _showSectionMsg("axpTPMsg", "Network error. Check your connection and try again.", "danger");
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="bi bi-floppy"></i> Save Changes <span id="axpTPChangeBadge" style="background:rgba(255,255,255,0.25);padding:1px 7px;font-size:11px;margin-left:4px;">0</span>'; }
    if (discBtn)  discBtn.disabled = false;
  }
};

function renderResultsReportsSection() {
  const sw = document.getElementById("axpSectionWrapper");

  if (_dashboardData && _dashboardData.status !== "ACTIVE") {
    sw.innerHTML = _axpInactiveBlock();
    return;
  }
  if (!_appScriptSchoolId) {
    sw.innerHTML = `
      <div class="axp-section-card" style="text-align:center;padding:40px 24px;">
        <i class="bi bi-lock-fill" style="font-size:36px;color:#4ecca3;display:block;margin-bottom:14px;"></i>
        <h3 style="font-size:16px;font-weight:800;color:#1a1a2e;margin:0 0 8px;">Feature Locked</h3>
        <p style="font-size:13px;color:#64748b;max-width:360px;margin:0 auto 20px;line-height:1.6;">
          Configure your school first to unlock Results & Reports.
        </p>
        <button onclick="axpOpenSetupPopup()" class="axp-btn-primary" style="font-size:13.5px;padding:10px 24px;">
          <i class="bi bi-gear-fill"></i> Setup School Now
        </button>
      </div>`;
    return;
  }

  const classes   = (_schoolMeta && _schoolMeta.classes)   ? _schoolMeta.classes   : [];
  const examTypes = (_schoolMeta && _schoolMeta.examTypes) ? _schoolMeta.examTypes : [];

  // Build class folder cards
  const classFolders = classes.map(cls => `
    <div class="axp-rr-folder" onclick="axpRROpenClass('${cls.replace(/'/g,"\\'")}')">
      <div class="axp-rr-folder-icon">
        <i class="bi bi-folder-fill"></i>
      </div>
      <div class="axp-rr-folder-label">${escapeHtml(cls)}</div>
      <div class="axp-rr-folder-meta">
        ${((_schoolMeta.subjects || {})[cls] || []).length} subjects
      </div>
    </div>`).join("");

  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title">
        <i class="bi bi-folder2-open"></i> Results &amp; Reports
      </div>
      <div class="axp-alert axp-alert-info" style="margin-bottom:18px;">
        <i class="bi bi-info-circle"></i>
        <span>Click a class folder to open results, reports, rankings, and analysis for that class.</span>
      </div>

      <!-- Exam type filter -->
      <div class="axp-form-row" style="margin-bottom:18px;">
        <div class="axp-field-group">
          <label>Exam Type</label>
          <select id="axpRRExamType" class="axp-select" onchange="axpRRRefreshClass()">
            ${examTypes.map(et => `<option value="${escapeHtml(et)}">${escapeHtml(et)}</option>`).join("")}
          </select>
        </div>
        <div class="axp-field-group">
          <label>Academic Year</label>
          <input id="axpRRYear" class="axp-input" value="${(_schoolMeta && _schoolMeta.year) || new Date().getFullYear()}" readonly />
        </div>
      </div>

      <!-- Class folders grid -->
      <div style="margin-bottom:10px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">
        <i class="bi bi-grid-3x3-gap-fill" style="color:#4ecca3;"></i> Class Folders
      </div>
      <div class="axp-rr-folders-grid" id="axpRRFoldersGrid">
        ${classFolders.length > 0 ? classFolders : `<div class="axp-empty-state"><i class="bi bi-folder-x"></i><p>No classes configured.</p></div>`}
      </div>
    </div>

    <!-- Class results panel (hidden until folder clicked) -->
    <div id="axpRRClassPanel" style="display:none;">
      <!-- Breadcrumb -->
      <div style="display:flex;align-items:center;gap:8px;padding:12px 0 0;font-size:13px;color:#64748b;margin-bottom:14px;">
        <button onclick="axpRRCloseClass()" style="background:none;border:none;color:#4ecca3;cursor:pointer;font-weight:700;font-size:13px;display:flex;align-items:center;gap:5px;">
          <i class="bi bi-arrow-left"></i> Back to Folders
        </button>
        <span>›</span>
        <strong id="axpRRBreadcrumbClass" style="color:#1a1a2e;">Class</strong>
        <span>›</span>
        <span id="axpRRBreadcrumbExam" style="color:#4ecca3;font-weight:700;">Exam</span>
      </div>

      <!-- Sub-action tabs -->
      <div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:0;background:#fff;flex-wrap:wrap;">
        ${[
          { key:"results",  icon:"bi-table",          label:"Results"          },
          { key:"report",   icon:"bi-file-text",       label:"Report"           },
          { key:"analysis", icon:"bi-bar-chart-line",  label:"Analysis"         },
          { key:"top10",    icon:"bi-trophy",          label:"Top 10"           },
          { key:"least10",  icon:"bi-arrow-down-circle",label:"Least 10"        },
          { key:"general",  icon:"bi-clipboard-data",  label:"General"          },
          { key:"subjectwise", icon:"bi-book",         label:"Subject Wise"     },
          { key:"subjectrank", icon:"bi-bar-chart-steps",label:"Subject Ranking"},
        ].map((t,i) => `
          <button onclick="axpRRSwitchTab('${t.key}')" id="axpRRTab_${t.key}"
            style="padding:10px 14px;border:none;background:none;font-size:12px;font-weight:700;
            color:${i===0?'#4ecca3':'#94a3b8'};border-bottom:${i===0?'2px solid #4ecca3':'2px solid transparent'};
            margin-bottom:-2px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px;">
            <i class="bi ${t.icon}"></i> ${t.label}
          </button>`).join("")}
      </div>

      <!-- Tab content -->
      <div id="axpRRTabContent" class="axp-section-card" style="margin-top:0;">
        <div class="axp-empty-state">
          <i class="bi bi-folder-symlink"></i>
          <p>Click a class folder above to load data.</p>
        </div>
      </div>
    </div>`;

  // Add CSS for folders if not already injected
  _axpInjectRRStyles();
}

function _axpInjectRRStyles() {
  if (document.getElementById("axp-rr-styles")) return;
  const s = document.createElement("style");
  s.id = "axp-rr-styles";
  s.textContent = `
    .axp-rr-folders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }
    .axp-rr-folder {
      background: #fff;
      border: 1px solid #e2e8f0;
      padding: 18px 12px 14px;
      text-align: center;
      cursor: pointer;
      transition: all .2s ease;
    }
    .axp-rr-folder:hover {
      border-color: #4ecca3;
      background: #f0fdf9;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(78,204,163,0.15);
    }
    .axp-rr-folder-icon {
      font-size: 38px;
      color: #f59e0b;
      margin-bottom: 8px;
      line-height: 1;
    }
    .axp-rr-folder-label {
      font-size: 13px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    .axp-rr-folder-meta {
      font-size: 11px;
      color: #94a3b8;
    }
    @media (max-width: 500px) {
      .axp-rr-folders-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .axp-rr-folder { padding: 12px 8px; }
      .axp-rr-folder-icon { font-size: 28px; }
    }
  `;
  document.head.appendChild(s);
}
window._axpRRCache = {};   

window.axpRROpenClass = function(cls) {
  window._axpRRActiveClass = cls;
  window._axpRRActiveTab   = "results";

  const examType = (document.getElementById("axpRRExamType") || {}).value || "";

  document.getElementById("axpRRClassPanel").style.display = "block";
  document.getElementById("axpRRBreadcrumbClass").textContent = cls;
  document.getElementById("axpRRBreadcrumbExam").textContent  = examType;

  document.getElementById("axpRRClassPanel").scrollIntoView({ behavior: "smooth" });

  axpRRSwitchTab("results");
};

window.axpRRCloseClass = function() {
  document.getElementById("axpRRClassPanel").style.display = "none";
  window._axpRRActiveClass = null;
};

window.axpRRRefreshClass = function() {
  
  const cls      = window._axpRRActiveClass;
  const examType = (document.getElementById("axpRRExamType") || {}).value || "";
  if (cls && examType) delete window._axpRRCache[`${cls}::${examType}`];
  if (cls) axpRROpenClass(cls);
};

window.axpRRSwitchTab = function(tabKey) {
  window._axpRRActiveTab = tabKey;

  const tabs = ["results","report","analysis","top10","least10","general","subjectwise","subjectrank"];
  tabs.forEach(t => {
    const btn = document.getElementById(`axpRRTab_${t}`);
    if (btn) {
      btn.style.color             = t === tabKey ? "#4ecca3" : "#94a3b8";
      btn.style.borderBottomColor = t === tabKey ? "#4ecca3" : "transparent";
    }
  });

  const cont = document.getElementById("axpRRTabContent");
  if (!cont) return;

  const cls      = window._axpRRActiveClass;
  const examType = (document.getElementById("axpRRExamType") || {}).value || "";

  if (!cls || !examType) {
    cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-folder-symlink"></i><p>Select a class folder and exam type first.</p></div>`;
    return;
  }

  cont.innerHTML = `<div class="axp-empty-state"><div class="axp-spinner-sm" style="margin:0 auto 8px;"></div><p>Loading...</p></div>`;

  
  _axpRRFetchAndRender(cls, examType, tabKey, cont);
};

async function _axpRRFetchAndRender(cls, examType, tabKey, cont) {
  const cacheKey = `${cls}::${examType}`;

  try {
    
    if (!window._axpRRCache[cacheKey]) {
      
      const res = await _apiGet({
        schoolId : _appScriptSchoolId,
        year     : _schoolMeta.year,
        class    : cls,
        examType : examType
      });

      if (res.status === "success" || res.students || res.result === "success") {
        window._axpRRCache[cacheKey] = res;
      } else {
        cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-inbox"></i>
          <p>No data found for <strong>${escapeHtml(cls)}</strong> — <strong>${escapeHtml(examType)}</strong>.</p>
          <p style="font-size:12px;color:#94a3b8;margin-top:6px;">Results are entered by teachers through their feeding link.</p>
        </div>`;
        return;
      }
    }

    const data = window._axpRRCache[cacheKey];

    
    switch (tabKey) {
      case "results":     _axpRRRenderResults(data, cls, examType, cont);     break;
      case "report":      _axpRRRenderReport(data, cls, examType, cont);      break;
      case "analysis":    _axpRRRenderAnalysis(data, cls, examType, cont);    break;
      case "top10":       _axpRRRenderRanking(data, cls, examType, "top",   10, cont); break;
      case "least10":     _axpRRRenderRanking(data, cls, examType, "least", 10, cont); break;
      case "general":     _axpRRRenderGeneral(data, cls, examType, cont);     break;
      case "subjectwise": _axpRRRenderSubjectWise(data, cls, examType, cont); break;
      case "subjectrank": _axpRRRenderSubjectRanking(data, cls, examType, cont); break;
      default:
        cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-tools"></i><p>Coming soon.</p></div>`;
    }
  } catch(e) {
    cont.innerHTML = `<div class="axp-alert axp-alert-danger">
      <i class="bi bi-exclamation-circle"></i>
      <span>Failed to load data. Check your connection and try again.</span>
    </div>`;
  }
}

function _axpExtractMark(scoreObj) {
  if (scoreObj === undefined || scoreObj === null) return undefined;
  if (typeof scoreObj === "object") return scoreObj.mark;
  return scoreObj;
}


function _axpRRRenderResults(data, cls, examType, cont) {
  const students = data.students || data.data || [];
  if (!students.length) {
    cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-inbox"></i>
      <p>No results found for ${escapeHtml(cls)} — ${escapeHtml(examType)}.</p>
      <p style="font-size:12px;color:#94a3b8;margin-top:6px;">Results are entered by teachers through their feeding link.</p>
    </div>`;
    return;
  }

  const subjects = (_schoolMeta.subjects || {})[cls] || [];

  cont.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
      <strong style="font-size:13.5px;color:#1a1a2e;">${escapeHtml(cls)} — ${escapeHtml(examType)} Results</strong>
      <span class="axp-badge axp-badge-blue">${students.length} students</span>
    </div>
    <div style="overflow-x:auto;">
      <table class="axp-table" style="min-width:500px;">
        <thead>
          <tr>
            <th>#</th><th>Exam No</th><th>Name</th><th>Sex</th>
            ${subjects.map(s => `<th style="max-width:70px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
              title="${escapeHtml(s)}">${escapeHtml(s.length > 7 ? s.slice(0,7)+'…' : s)}</th>`).join("")}
            <th>Total</th><th>Avg</th><th>Grade</th><th>Div</th><th>Pos</th>
          </tr>
        </thead>
        <tbody>
          ${students.map((s, i) => {
            const avg   = parseFloat(s.average || s.avg || 0);
            const { grade, color } = _axpGrade(avg);
            return `<tr>
              <td style="color:#94a3b8;">${i+1}</td>
              <td style="color:#4ecca3;font-weight:700;">${escapeHtml(s.examNo || s.exam_no || "—")}</td>
              <td style="font-weight:500;">${escapeHtml(s.name || "—")}</td>
              <td>${s.gender || s.sex || "—"}</td>
              ${subjects.map(sub => {
                const mark = _axpExtractMark((s.marks || s.scores || {})[sub]);
                const { color: mc } = _axpGrade(mark);
                return `<td style="color:${mc};font-weight:600;">${mark !== undefined && mark !== null ? mark : "—"}</td>`;
              }).join("")}
              <td style="font-weight:700;">${s.total || "—"}</td>
              <td style="font-weight:700;">${s.average || s.avg || "—"}</td>
              <td><strong style="color:${color};font-size:14px;">${grade}</strong></td>
              <td style="font-weight:700;color:#3b82f6;">${s.division || "—"}</td>
              <td style="font-weight:700;color:#1a1a2e;">${s.position || s.pos || (i+1)}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}
function _axpRRRenderReport(data, cls, examType, cont) {
  
  const students = data.students || data.data || [];
  const summary  = data.summary || data.report || {};

  const total   = students.length || summary.total || 0;
  const passed  = summary.passed  || students.filter(s => parseFloat(s.average||s.avg||0) >= 45).length;
  const failed  = summary.failed  || (total - passed);
  const passRate = total > 0 ? summary.passRate || Math.round(passed / total * 100) : 0;
  const scores  = students.map(s => parseFloat(s.average||s.avg||0)).filter(n => !isNaN(n));
  const avg     = summary.average  || (scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : "—");
  const highest = summary.highest  || (scores.length ? Math.max(...scores) : "—");
  const lowest  = summary.lowest   || (scores.length ? Math.min(...scores) : "—");

  
  const gradeDist = summary.gradeDistribution || { A:0,B:0,C:0,D:0,F:0 };
  if (!summary.gradeDistribution) {
    students.forEach(s => { const g = _axpGrade(parseFloat(s.average||s.avg||0)).grade; if(gradeDist[g]!==undefined) gradeDist[g]++; });
  }

  cont.innerHTML = `
    <div style="background:#060c1c;color:#fff;padding:16px 20px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
      <div>
        <div style="font-size:11px;opacity:.5;text-transform:uppercase;letter-spacing:.5px;">Class Report</div>
        <div style="font-size:18px;font-weight:800;">${escapeHtml(cls)} — ${escapeHtml(examType)}</div>
      </div>
      <div style="margin-left:auto;background:rgba(78,204,163,.12);border:1px solid rgba(78,204,163,.3);padding:8px 16px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:#4ecca3;">${passRate}%</div>
        <div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.5px;">Pass Rate</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:18px;">
      ${[
        {l:"Total Students", v:total,        c:"#4ecca3"},
        {l:"Passed",         v:passed,        c:"#10b981"},
        {l:"Failed",         v:failed,        c:"#ef4444"},
        {l:"School Average", v:avg+"%",        c:"#3b82f6"},
        {l:"Highest Score",  v:highest,        c:"#f59e0b"},
        {l:"Lowest Score",   v:lowest,         c:"#f97316"},
      ].map(s => `
        <div style="background:#f8fafc;padding:12px;border-left:3px solid ${s.c};">
          <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.4px;">${s.l}</div>
          <div style="font-size:20px;font-weight:900;color:${s.c};margin-top:4px;">${s.v}</div>
        </div>`).join("")}
    </div>
    <h4 style="font-size:13px;font-weight:700;color:#1a1a2e;margin:0 0 10px;">Grade Distribution</h4>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px;">
      ${["A","B","C","D","F"].map(g => {
        const colors = {A:"#10b981",B:"#4ecca3",C:"#f59e0b",D:"#f97316",F:"#ef4444"};
        const count  = gradeDist[g] || 0;
        const pct    = total > 0 ? Math.round(count/total*100) : 0;
        return `<div style="background:#fff;border:1px solid #e2e8f0;padding:12px;text-align:center;">
          <div style="font-size:22px;font-weight:900;color:${colors[g]};">${count}</div>
          <div style="font-size:11px;font-weight:700;color:${colors[g]};margin:3px 0;">Grade ${g}</div>
          <div class="axp-progress-bar" style="height:4px;"><div style="height:100%;width:${pct}%;background:${colors[g]};"></div></div>
          <div style="font-size:10.5px;color:#94a3b8;margin-top:3px;">${pct}%</div>
        </div>`;
      }).join("")}
    </div>`;
}

function _axpRRRenderAnalysis(data, cls, examType, cont) {
  const students = data.students || data.data || [];
  const analysis = data.analysis || {};

  const genderBreakdown = analysis.genderBreakdown || { M:{}, F:{} };
  if (!analysis.genderBreakdown && students.length) {
    ["M","F"].forEach(g => {
      const group = students.filter(s => (s.gender||s.sex||"M").toUpperCase().startsWith(g));
      const avgs  = group.map(s => parseFloat(s.average||s.avg||0)).filter(n=>!isNaN(n));
      genderBreakdown[g] = {
        count:    group.length,
        average:  avgs.length ? (avgs.reduce((a,b)=>a+b,0)/avgs.length).toFixed(1) : "—",
        passRate: avgs.length ? Math.round(avgs.filter(a=>a>=45).length/avgs.length*100) : 0
      };
    });
  }

  const subjects       = (_schoolMeta.subjects || {})[cls] || [];
  const subjectAverages = analysis.subjectAverages || subjects.map(sub => {
    /* FIX: extract .mark from each score object before parsing */
    const marks = students.map(s => {
      const raw = _axpExtractMark((s.marks||s.scores||{})[sub]);
      return parseFloat(raw);
    }).filter(n=>!isNaN(n));

    return {
      subject:  sub,
      average:  marks.length ? (marks.reduce((a,b)=>a+b,0)/marks.length).toFixed(1) : "—",
      highest:  marks.length ? Math.max(...marks) : "—",
      lowest:   marks.length ? Math.min(...marks) : "—",
      passRate: marks.length ? Math.round(marks.filter(m=>m>=45).length/marks.length*100) : 0
    };
  }).filter(s => s.average !== "—");

  cont.innerHTML = `
    <strong style="font-size:13.5px;color:#1a1a2e;display:block;margin-bottom:14px;">
      ${escapeHtml(cls)} — ${escapeHtml(examType)} Analysis
    </strong>
    <h4 style="font-size:12.5px;font-weight:700;color:#1a1a2e;margin:0 0 10px;">Gender Performance</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
      <div style="background:#eff6ff;padding:14px;border-left:3px solid #3b82f6;">
        <div style="font-size:11px;font-weight:700;color:#1e40af;margin-bottom:4px;">MALE</div>
        <div style="font-size:22px;font-weight:900;color:#1e40af;">${genderBreakdown.M.count||0}</div>
        <div style="font-size:12px;color:#3b82f6;">Avg: ${genderBreakdown.M.average||"—"} &nbsp;·&nbsp; Pass: ${genderBreakdown.M.passRate||0}%</div>
      </div>
      <div style="background:#fce7f3;padding:14px;border-left:3px solid #db2777;">
        <div style="font-size:11px;font-weight:700;color:#831843;margin-bottom:4px;">FEMALE</div>
        <div style="font-size:22px;font-weight:900;color:#831843;">${genderBreakdown.F.count||0}</div>
        <div style="font-size:12px;color:#db2777;">Avg: ${genderBreakdown.F.average||"—"} &nbsp;·&nbsp; Pass: ${genderBreakdown.F.passRate||0}%</div>
      </div>
    </div>
    ${subjectAverages.length > 0 ? `
      <h4 style="font-size:12.5px;font-weight:700;color:#1a1a2e;margin:0 0 10px;">Subject Averages</h4>
      <div style="overflow-x:auto;">
        <table class="axp-table">
          <thead><tr><th>Subject</th><th>Average</th><th>Highest</th><th>Lowest</th><th>Pass Rate</th></tr></thead>
          <tbody>
            ${subjectAverages.map(s => `
              <tr>
                <td style="font-weight:600;">${escapeHtml(s.subject||"")}</td>
                <td><strong style="color:#4ecca3;">${s.average}</strong></td>
                <td style="color:#10b981;font-weight:600;">${s.highest}</td>
                <td style="color:#ef4444;font-weight:600;">${s.lowest}</td>
                <td>${s.passRate}%</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>` : `<div class="axp-alert axp-alert-warning"><i class="bi bi-info-circle"></i><span>No subject data to analyse yet.</span></div>`}`;
}

function _axpRRRenderRanking(data, cls, examType, direction, limit, cont) {
  const students = [...(data.students || data.data || [])];
  const isTop    = direction === "top";

  if (!students.length) {
    cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-inbox"></i><p>No ranking data yet.</p></div>`;
    return;
  }

  
  const sorted = students
    .filter(s => s.average !== undefined || s.avg !== undefined)
    .sort((a, b) => parseFloat(b.average||b.avg||0) - parseFloat(a.average||a.avg||0));
  const slice = isTop ? sorted.slice(0, limit) : sorted.slice(-limit).reverse();

  cont.innerHTML = `
    <strong style="font-size:13.5px;color:#1a1a2e;display:block;margin-bottom:14px;">
      <i class="bi ${isTop ? 'bi-trophy-fill' : 'bi-arrow-down-circle-fill'}"
        style="color:${isTop?'#f59e0b':'#ef4444'};"></i>
      ${isTop ? "Top" : "Least"} ${limit} Students — ${escapeHtml(cls)} (${escapeHtml(examType)})
    </strong>
    <div style="overflow-x:auto;">
      <table class="axp-ranking-table">
        <thead><tr><th>Pos</th><th>Exam No</th><th>Name</th><th>Sex</th><th>Total</th><th>Avg</th><th>Grade</th><th>Div</th></tr></thead>
        <tbody>
          ${slice.map((s, i) => {
            const avg   = parseFloat(s.average||s.avg||0);
            const { grade, color } = _axpGrade(avg);
            const posColor = i === 0 && isTop ? "#f59e0b" : i === 0 && !isTop ? "#ef4444" : "#475569";
            return `<tr>
              <td style="font-size:16px;font-weight:900;color:${posColor};">${s.position || s.pos || (isTop ? i+1 : students.length-i)}</td>
              <td style="color:#4ecca3;font-weight:700;">${escapeHtml(s.examNo||s.exam_no||"—")}</td>
              <td style="font-weight:700;color:#1a1a2e;">${escapeHtml(s.name||"—")}</td>
              <td>${s.gender||s.sex||"—"}</td>
              <td style="font-weight:700;">${s.total||"—"}</td>
              <td style="font-weight:700;">${s.average||s.avg||"—"}</td>
              <td><strong style="font-size:15px;color:${color};">${grade}</strong></td>
              <td style="color:#3b82f6;font-weight:700;">${s.division||"—"}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function _axpRRRenderGeneral(data, cls, examType, cont) {
  const students = data.students || data.data || [];
  const general  = data.general  || data.summary || {};

  const total        = general.total        || students.length;
  const qualified    = general.qualified    || students.filter(s=>parseFloat(s.average||s.avg||0)>=45).length;
  const disqualified = general.disqualified || (total - qualified);
  const passRate     = total > 0 ? general.passRate || Math.round(qualified/total*100) : 0;

  
  const divSummary = general.divisionSummary || data.divisionSummary || {};
  if (!Object.keys(divSummary).length && students.length) {
    students.forEach(s => {
      const d = s.division || "—";
      divSummary[d] = (divSummary[d] || 0) + 1;
    });
  }

  cont.innerHTML = `
    <strong style="font-size:13.5px;color:#1a1a2e;display:block;margin-bottom:14px;">
      General Result — ${escapeHtml(cls)} (${escapeHtml(examType)})
    </strong>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:18px;">
      ${[
        {l:"Registered",   v:total,            c:"#4ecca3"},
        {l:"Qualified",    v:qualified,         c:"#10b981"},
        {l:"Disqualified", v:disqualified,      c:"#ef4444"},
        {l:"Pass Rate",    v:passRate+"%",       c:"#8b5cf6"},
        {l:"Absent",       v:general.absent||0, c:"#f59e0b"},
        {l:"Sat Exam",     v:general.sat||total,c:"#3b82f6"},
      ].map(s => `
        <div style="background:#fff;padding:13px;border-left:3px solid ${s.c};">
          <div style="font-size:10.5px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.4px;">${s.l}</div>
          <div style="font-size:22px;font-weight:900;color:${s.c};margin-top:4px;">${s.v}</div>
        </div>`).join("")}
    </div>
    ${Object.keys(divSummary).length > 0 ? `
      <h4 style="font-size:13px;font-weight:700;color:#1a1a2e;margin:0 0 10px;">Division Summary</h4>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${Object.entries(divSummary).sort().map(([div, count]) => `
          <div style="background:#f8fafc;border-left:3px solid #4ecca3;padding:10px 16px;text-align:center;">
            <div style="font-size:20px;font-weight:900;color:#4ecca3;">${count}</div>
            <div style="font-size:11px;font-weight:700;color:#64748b;">DIV ${escapeHtml(div)}</div>
          </div>`).join("")}
      </div>` : ""}`;
}

function _axpRRRenderSubjectWise(data, cls, examType, cont) {
  const students = data.students || data.data || [];
  const subjects  = (_schoolMeta.subjects || {})[cls] || [];

  if (!students.length || !subjects.length) {
    cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-book"></i><p>No subject-wise data yet.</p></div>`;
    return;
  }

  cont.innerHTML = `
    <strong style="font-size:13.5px;color:#1a1a2e;display:block;margin-bottom:14px;">
      Subject-Wise Results — ${escapeHtml(cls)} (${escapeHtml(examType)})
    </strong>
    ${subjects.map(sub => {
      /* FIX: extract .mark before sorting/displaying */
      const subStudents = students
        .map(s => {
          const mark = _axpExtractMark((s.marks || s.scores || {})[sub]);
          return {
            examNo: s.examNo || s.exam_no || "—",
            name:   s.name || "—",
            score:  mark
          };
        })
        .filter(s => s.score !== undefined && s.score !== null)
        .sort((a,b) => parseFloat(b.score||0) - parseFloat(a.score||0));

      const scores   = subStudents.map(s=>parseFloat(s.score)).filter(n=>!isNaN(n));
      const subAvg   = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : "—";
      const subPass  = scores.length ? Math.round(scores.filter(m=>m>=45).length/scores.length*100) : 0;

      return `
        <div style="margin-bottom:18px;">
          <div style="background:#060c1c;color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:13px;">${escapeHtml(sub)}</strong>
            <div style="display:flex;gap:12px;font-size:12px;">
              <span>Avg: <strong style="color:#4ecca3;">${subAvg}</strong></span>
              <span>Pass: <strong style="color:#10b981;">${subPass}%</strong></span>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table class="axp-table" style="min-width:280px;">
              <thead><tr><th>Exam No</th><th>Name</th><th>Score</th><th>Grade</th></tr></thead>
              <tbody>
                ${subStudents.map(s => {
                  const {grade,color} = _axpGrade(s.score);
                  return `<tr>
                    <td style="color:#4ecca3;font-weight:700;">${escapeHtml(s.examNo)}</td>
                    <td>${escapeHtml(s.name)}</td>
                    <td style="font-weight:700;">${s.score}</td>
                    <td><strong style="color:${color};">${grade}</strong></td>
                  </tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>`;
    }).join("")}`;
}

function _axpRRRenderSubjectRanking(data, cls, examType, cont) {
  const students = data.students || data.data || [];
  const subjects  = (_schoolMeta.subjects || {})[cls] || [];

  if (!students.length || !subjects.length) {
    cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-bar-chart-steps"></i><p>No subject ranking data yet.</p></div>`;
    return;
  }

  const ranking = subjects.map(sub => {
    /* FIX: extract .mark before parseFloat */
    const marks = students
      .map(s => {
        const raw = _axpExtractMark((s.marks||s.scores||{})[sub]);
        return { name: s.name||"—", examNo: s.examNo||s.exam_no||"—", score: parseFloat(raw) };
      })
      .filter(s => !isNaN(s.score))
      .sort((a,b) => b.score - a.score);

    const scores   = marks.map(m=>m.score);
    const average  = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : "—";
    const passRate = scores.length ? Math.round(scores.filter(s=>s>=45).length/scores.length*100) : 0;

    return {
      subject:      sub,
      average:      parseFloat(average) || 0,
      averageStr:   average,
      highest:      scores.length ? Math.max(...scores) : "—",
      lowest:       scores.length ? Math.min(...scores) : "—",
      passRate,
      bestStudent:  marks[0]   || null,
      leastStudent: marks[marks.length-1] || null
    };
  }).filter(s => s.average > 0).sort((a,b) => b.average - a.average);

  cont.innerHTML = `
    <strong style="font-size:13.5px;color:#1a1a2e;display:block;margin-bottom:14px;">
      Subject Ranking &amp; Analysis — ${escapeHtml(cls)} (${escapeHtml(examType)})
    </strong>
    <div style="overflow-x:auto;">
      <table class="axp-ranking-table">
        <thead>
          <tr>
            <th>Rank</th><th>Subject</th><th>Avg</th>
            <th>Highest</th><th>Lowest</th><th>Pass%</th>
            <th><i class="bi bi-trophy-fill" style="color:#f59e0b;"></i> Best</th>
            <th><i class="bi bi-arrow-down-circle-fill" style="color:#ef4444;"></i> Least</th>
          </tr>
        </thead>
        <tbody>
          ${ranking.map((s, i) => `
            <tr>
              <td style="font-size:15px;font-weight:900;color:${i===0?'#f59e0b':i===ranking.length-1?'#ef4444':'#475569'};">${i+1}</td>
              <td style="font-weight:700;color:#1a1a2e;">${escapeHtml(s.subject)}</td>
              <td><strong style="color:#4ecca3;">${s.averageStr}</strong></td>
              <td style="color:#10b981;font-weight:600;">${s.highest}</td>
              <td style="color:#ef4444;font-weight:600;">${s.lowest}</td>
              <td>${s.passRate}%</td>
              <td style="font-weight:600;color:#065f46;">
                ${escapeHtml((s.bestStudent||{}).name||"—")}
                ${s.bestStudent ? `<span style="color:#94a3b8;font-size:11px;">(${s.bestStudent.score})</span>` : ""}
              </td>
              <td style="font-weight:600;color:#991b1b;">
                ${escapeHtml((s.leastStudent||{}).name||"—")}
                ${s.leastStudent ? `<span style="color:#94a3b8;font-size:11px;">(${s.leastStudent.score})</span>` : ""}
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

window.axpLoadProgress = async function() {
  const examType  = document.getElementById("axpProgExamType").value;
  const className = document.getElementById("axpProgClass").value;
  const cont      = document.getElementById("axpProgressResults");
  const classes   = (_schoolMeta && _schoolMeta.classes) ? _schoolMeta.classes : [];

  cont.innerHTML = `<div class="axp-empty-state"><div class="axp-spinner-sm" style="margin:0 auto 8px;"></div><p>Loading progress data...</p></div>`;

  const classesToLoad = className ? [className] : classes;
  if (classesToLoad.length === 0) { cont.innerHTML=`<div class="axp-empty-state"><i class="bi bi-exclamation-triangle"></i><p>No classes configured.</p></div>`; return; }

  try {
    const results = await Promise.all(classesToLoad.map(async cls => {
      const res = await _apiGet({ mode:"subjectProgress", schoolId:_appScriptSchoolId, year:_schoolMeta.year, examType, class:cls });
      return { class:cls, progress: res.status==="success" ? res.progress : {} };
    }));

    if (results.every(r=>Object.keys(r.progress).length===0)) {
      cont.innerHTML=`<div class="axp-empty-state"><i class="bi bi-inbox"></i><p>No progress data yet for ${examType}.</p></div>`;
      return;
    }

    let totalSubjects=0, completedSubjects=0;
    results.forEach(r=>{ Object.keys(r.progress).forEach(s=>{ totalSubjects++; if(r.progress[s].completed) completedSubjects++; }); });
    const pct = totalSubjects > 0 ? Math.round(completedSubjects/totalSubjects*100) : 0;

    cont.innerHTML = `
      <div style="background:#f8fafc;padding:14px;margin-bottom:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
          <strong style="font-size:13.5px;color:#1a1a2e;">Overall Progress — ${examType}</strong>
          <span style="font-size:18px;font-weight:800;color:${pct===100?'#10b981':'#f59e0b'};">${pct}%</span>
        </div>
        <div class="axp-progress-bar" style="height:10px;">
          <div class="axp-progress-fill" style="width:${pct}%;"></div>
        </div>
        <div style="font-size:11.5px;color:#64748b;margin-top:5px;">${completedSubjects} of ${totalSubjects} subjects completed</div>
      </div>
      <div class="progress-grid">
        ${results.map(r => `
          <div class="progress-card">
            <div class="progress-card-header">
              <span class="progress-card-title"><i class="bi bi-people-fill" style="color:#4ecca3;"></i> ${escapeHtml(r.class)}</span>
              ${_computeClassCompletionBadge(r.progress)}
            </div>
            ${Object.keys(r.progress).length === 0
              ? '<div style="font-size:13px;color:#94a3b8;font-style:italic;">No data yet</div>'
              : Object.keys(r.progress).map(sub => {
                  const p = r.progress[sub];
                  const pPct = p.expected > 0 ? Math.round((p.submitted||0)/p.expected*100) : 0;
                  return `
                    <div class="progress-subject-row">
                      <div class="progress-subject-name" title="${escapeHtml(sub)}">${escapeHtml(sub)}</div>
                      <div class="axp-progress-bar" style="width:56px;">
                        <div class="axp-progress-fill" style="width:${pPct}%;background:${pPct===100?'#10b981':'#4ecca3'};"></div>
                      </div>
                      <div class="progress-subject-count">${p.submitted||0}/${p.expected||0}</div>
                      <span class="axp-badge ${p.completed?'axp-badge-green':pPct>0?'axp-badge-yellow':'axp-badge-gray'}" style="font-size:10px;">
                        ${p.completed ? '✓' : pPct > 0 ? `${pPct}%` : 'Pending'}
                      </span>
                    </div>`;
                }).join("")
            }
          </div>`).join("")}
      </div>`;
  } catch(e) {
    cont.innerHTML=`<div class="axp-empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load progress. Check connection.</p></div>`;
  }
};



function _computeClassCompletionBadge(progress) {
  const keys = Object.keys(progress);
  if (keys.length === 0) return `<span class="axp-badge axp-badge-gray">No data</span>`;
  const done = keys.filter(k=>progress[k].completed).length;
  const pct  = Math.round(done/keys.length*100);
  if (pct===100) return `<span class="axp-badge axp-badge-green">Complete</span>`;
  if (pct>0)     return `<span class="axp-badge axp-badge-yellow">${pct}% done</span>`;
  return `<span class="axp-badge axp-badge-gray">Not started</span>`;
}

/* ─────────────────────────────────────────────────────────────
   SECTION: NOTIFICATIONS (messaging-app style)
───────────────────────────────────────────────────────────── */
function renderNotificationsSectionFull() {
  const sw = document.getElementById("axpSectionWrapper");
  const items = _announcements.map((ann, i) => ({
    id: i,
    sender: "AcademixPoint",
    subject: ann.title || "Notification",
    preview: ann.message || "",
    time: formatAnnouncementDate(ann.date),
    priority: ann.priority || "Normal",
    read: !!ann._read,
    full: ann.message || "",
    color: { High:"#ef4444", Medium:"#f59e0b", Low:"#3b82f6" }[ann.priority] || "#94a3b8"
  }));

  const unreadCount = items.filter(i => !i.read).length;

  sw.innerHTML = `
    <div class="axp-section-card" style="padding:0;">
      <div style="display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:2px solid #4ecca3;">
        <i class="bi bi-bell-fill" style="font-size:18px;color:#4ecca3;"></i>
        <div class="axp-section-title" style="margin:0;border:none;padding:0;flex:1;">Notifications</div>
        ${unreadCount > 0 ? `<span style="background:#ef4444;color:#fff;padding:2px 9px;font-size:11.5px;font-weight:800;">${unreadCount} Unread</span>` : `<span style="background:#ecfdf5;color:#065f46;padding:2px 9px;font-size:11.5px;font-weight:700;">All read</span>`}
      </div>
      <div id="axpNotifListPane" style="min-height:200px;">
        ${items.length === 0
          ? `<div class="axp-empty-state"><i class="bi bi-bell-slash"></i><p>No notifications yet.</p></div>`
          : `<div class="axp-msg-list">
              ${items.map(item => `
                <div class="axp-msg-item ${!item.read ? 'unread' : ''}" onclick="axpOpenNotification(${item.id})" id="axpNotifItem_${item.id}">
                  <div class="axp-msg-avatar" style="background:${item.color};color:#fff;">${item.sender.charAt(0)}</div>
                  <div class="axp-msg-body">
                    <div class="axp-msg-sender">${escapeHtml(item.sender)}</div>
                    <div class="axp-msg-preview">${escapeHtml(item.subject)} — ${escapeHtml(item.preview.slice(0,70))}${item.preview.length>70?'…':''}</div>
                  </div>
                  <div class="axp-msg-meta">
                    <span class="axp-msg-time">${item.time}</span>
                    ${!item.read ? '<span class="axp-msg-unread-dot"></span>' : ''}
                  </div>
                </div>`).join("")}
            </div>`}
      </div>
      <div id="axpNotifReadingPane" style="display:none;border-top:2px solid #e2e8f0;"></div>
    </div>`;

  window._axpNotifItems = items;
}

window.axpOpenNotification = function(id) {
  const item = (window._axpNotifItems || [])[id];
  if (!item) return;
  /* Mark as read */
  item.read = true;
  if (_announcements[id]) _announcements[id]._read = true;
  const itemEl = document.getElementById(`axpNotifItem_${id}`);
  if (itemEl) {
    itemEl.classList.remove("unread");
    itemEl.querySelector(".axp-msg-unread-dot") && itemEl.querySelector(".axp-msg-unread-dot").remove();
  }
  const pane = document.getElementById("axpNotifReadingPane");
  if (!pane) return;
  pane.style.display = "block";
  pane.innerHTML = `
    <div class="axp-msg-reading">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <button onclick="document.getElementById('axpNotifReadingPane').style.display='none'" class="axp-btn-secondary" style="font-size:12px;padding:5px 10px;">
          <i class="bi bi-arrow-left"></i> Back
        </button>
        <span style="font-size:11px;color:#94a3b8;">${item.time}</span>
        <span style="margin-left:auto;background:${item.color};color:#fff;padding:2px 7px;font-size:11px;font-weight:700;">${escapeHtml(item.priority)}</span>
      </div>
      <div class="axp-msg-reading-header">
        <div class="axp-msg-reading-title">${escapeHtml(item.subject)}</div>
        <div class="axp-msg-reading-from"><i class="bi bi-person-fill"></i> From: ${escapeHtml(item.sender)}</div>
      </div>
      <div class="axp-msg-reading-body">${escapeHtml(item.full)}</div>
    </div>`;
  pane.scrollIntoView({ behavior: "smooth" });
};

window._axpRRActiveClass = null;
window._axpRRActiveTab   = "results";







/* ─────────────────────────────────────────────────────────────
   SECTION: MESSAGES (messaging-app style)
───────────────────────────────────────────────────────────── */
function renderMessagesSectionFull() {
  const sw = document.getElementById("axpSectionWrapper");

  /* Build message list — operator messages + future messages */
  const messages = [];
  if (_operatorMessage) {
    messages.push({
      id: 0,
      sender: "AcademixPoint Admin",
      subject: "Message from AcademixPoint",
      preview: _operatorMessage,
      time: "Recent",
      read: !!(window._axpMsgRead && window._axpMsgRead[0]),
      full: _operatorMessage,
      avatar: "A",
      avatarColor: "#4ecca3"
    });
  }

  const unreadCount = messages.filter(m => !m.read).length;

  sw.innerHTML = `
    <div class="axp-section-card" style="padding:0;">
      <div style="display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:2px solid #4ecca3;">
        <i class="bi bi-chat-dots-fill" style="font-size:18px;color:#4ecca3;"></i>
        <div class="axp-section-title" style="margin:0;border:none;padding:0;flex:1;">Messages</div>
        ${unreadCount > 0 ? `<span style="background:#ef4444;color:#fff;padding:2px 9px;font-size:11.5px;font-weight:800;">${unreadCount} New</span>` : ''}
        <span style="font-size:12px;color:#64748b;">${messages.length} total</span>
      </div>
      <div id="axpMsgListPane">
        ${messages.length === 0
          ? `<div class="axp-empty-state"><i class="bi bi-chat-slash"></i><p>No messages yet.</p></div>`
          : `<div class="axp-msg-list">
              ${messages.map(msg => `
                <div class="axp-msg-item ${!msg.read ? 'unread' : ''}" onclick="axpOpenMessage(${msg.id})" id="axpMsgItem_${msg.id}">
                  <div class="axp-msg-avatar" style="background:${msg.avatarColor};">${msg.avatar}</div>
                  <div class="axp-msg-body">
                    <div class="axp-msg-sender">${escapeHtml(msg.sender)}</div>
                    <div class="axp-msg-preview">${escapeHtml(msg.subject)} — ${escapeHtml((msg.preview||'').slice(0,80))}${(msg.preview||'').length>80?'…':''}</div>
                  </div>
                  <div class="axp-msg-meta">
                    <span class="axp-msg-time">${msg.time}</span>
                    ${!msg.read ? '<span class="axp-msg-unread-dot"></span>' : ''}
                  </div>
                </div>`).join("")}
            </div>`}
      </div>
      <div id="axpMsgReadingPane" style="display:none;border-top:2px solid #e2e8f0;"></div>
    </div>`;

  window._axpMessages = messages;
}

window.axpOpenMessage = function(id) {
  if (!window._axpMsgRead) window._axpMsgRead = {};
  window._axpMsgRead[id] = true;
  const msg = (window._axpMessages || [])[id];
  if (!msg) return;
  msg.read = true;
  const itemEl = document.getElementById(`axpMsgItem_${id}`);
  if (itemEl) {
    itemEl.classList.remove("unread");
    const dot = itemEl.querySelector(".axp-msg-unread-dot");
    if (dot) dot.remove();
    const sender = itemEl.querySelector(".axp-msg-sender");
    if (sender) sender.style.fontWeight = "600";
  }
  const pane = document.getElementById("axpMsgReadingPane");
  if (!pane) return;
  pane.style.display = "block";
  pane.innerHTML = `
    <div class="axp-msg-reading">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <button onclick="document.getElementById('axpMsgReadingPane').style.display='none'" class="axp-btn-secondary" style="font-size:12px;padding:5px 10px;">
          <i class="bi bi-arrow-left"></i> Back
        </button>
        <span style="font-size:11px;color:#94a3b8;">${msg.time}</span>
      </div>
      <div class="axp-msg-reading-header">
        <div class="axp-msg-reading-title">${escapeHtml(msg.subject)}</div>
        <div class="axp-msg-reading-from" style="margin-top:4px;">
          <span class="axp-msg-avatar" style="background:${msg.avatarColor};display:inline-flex;width:28px;height:28px;font-size:13px;margin-right:8px;vertical-align:middle;">${msg.avatar}</span>
          <strong>${escapeHtml(msg.sender)}</strong>
        </div>
      </div>
      <div class="axp-msg-reading-body">${escapeHtml(msg.full)}</div>
    </div>`;
  pane.scrollIntoView({ behavior: "smooth" });
};

/* ─────────────────────────────────────────────────────────────
   SECTION: ANALYTICS
───────────────────────────────────────────────────────────── */
function renderAnalyticsSection() {
  const sw = document.getElementById("axpSectionWrapper");
  const classes   = (_schoolMeta && _schoolMeta.classes)   ? _schoolMeta.classes   : [];
  const examTypes = (_schoolMeta && _schoolMeta.examTypes) ? _schoolMeta.examTypes : [];
  const subjects  = (_schoolMeta && _schoolMeta.subjects)  ? _schoolMeta.subjects  : {};

  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-bar-chart-fill"></i> School Analytics & Reports</div>

      <div class="axp-alert axp-alert-info" style="margin-bottom:16px;">
        <i class="bi bi-info-circle"></i>
        <span>Track performance by class, gender, subject, and exam. Monitor teachers and identify top &amp; least performing students.</span>
      </div>

      <!-- Filter bar -->
      <div style="background:#f8fafc;padding:14px;margin-bottom:18px;">
        <div class="axp-form-row axp-form-row triple">
          <div class="axp-field-group">
            <label>Class</label>
            <select id="axpAnClass" class="axp-select" onchange="axpLoadAnalytics()">
              <option value="">All Classes</option>
              ${classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
            </select>
          </div>
          <div class="axp-field-group">
            <label>Exam Type</label>
            <select id="axpAnExam" class="axp-select" onchange="axpLoadAnalytics()">
              <option value="">All Exams</option>
              ${examTypes.map(e=>`<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`).join("")}
            </select>
          </div>
          <div class="axp-field-group">
            <label>Gender Filter</label>
            <select id="axpAnGender" class="axp-select" onchange="axpLoadAnalytics()">
              <option value="">All Genders</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
        </div>
        <button onclick="axpLoadAnalytics()" class="axp-btn-primary" style="margin-top:6px;">
          <i class="bi bi-search"></i> Load Analytics
        </button>
      </div>

      <!-- Summary stat boxes -->
      <div class="axp-analytics-grid" id="axpAnStatGrid">
        ${[
          {label:"Total Classes",    val:classes.length||"—",  icon:"bi-journal-bookmark",   color:"#4ecca3"},
          {label:"Total Subjects",   val:Object.values(subjects).reduce((a,v)=>a+v.length,0)||"—", icon:"bi-book-fill", color:"#3b82f6"},
          {label:"Exam Types",       val:examTypes.length||"—",icon:"bi-file-earmark-text",  color:"#8b5cf6"},
          {label:"Exam Centres",     val:"1",                   icon:"bi-building",           color:"#f59e0b"},
        ].map(s=>`
          <div class="axp-stat-box">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <i class="bi ${s.icon}" style="color:${s.color};font-size:18px;"></i>
              <span class="axp-stat-box-lbl">${s.label}</span>
            </div>
            <div class="axp-stat-box-val" style="color:${s.color};">${s.val}</div>
          </div>`).join("")}
      </div>

      <div id="axpAnContent">
        <div class="axp-empty-state" style="padding:40px 16px;">
          <i class="bi bi-bar-chart-line" style="font-size:40px;"></i>
          <p>Select filters above and click "Load Analytics" to view school performance data.</p>
        </div>
      </div>
    </div>

    <!-- Teacher Behaviour Monitor -->
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-person-badge"></i> Teacher Activity Monitor</div>
      <div class="axp-alert axp-alert-warning" style="margin-bottom:14px;">
        <i class="bi bi-exclamation-triangle"></i>
        <span>Track which teachers have submitted marks, which are pending, and submission timeliness.</span>
      </div>
      <div id="axpTeacherBehaviourContent">
        <button onclick="axpLoadTeacherBehaviour()" class="axp-btn-primary">
          <i class="bi bi-search"></i> Load Teacher Activity
        </button>
        <div id="axpTeacherBehaviourResult" style="margin-top:14px;"></div>
      </div>
    </div>`;
}

window.axpLoadAnalytics = async function() {
  const cont = document.getElementById("axpAnContent");
  if (!cont) return;
  const cls    = (document.getElementById("axpAnClass")||{}).value;
  const exam   = (document.getElementById("axpAnExam")||{}).value;
  const gender = (document.getElementById("axpAnGender")||{}).value;

  cont.innerHTML = `<div class="axp-empty-state"><div class="axp-spinner-sm" style="margin:0 auto 8px;"></div><p>Loading analytics...</p></div>`;

  try {
    const res = await _apiGet({
      mode:"analytics", schoolId:_appScriptSchoolId,
      year:_schoolMeta.year, class:cls, examType:exam, gender
    });
    if (res.status === "success" && res.data) {
      _renderAnalyticsData(res.data, cls, exam, gender);
    } else {
      cont.innerHTML = `<div class="axp-alert axp-alert-warning"><i class="bi bi-info-circle"></i><span>${escapeHtml(res.message||"No analytics data available yet.")}</span></div>`;
    }
  } catch(e) {
    cont.innerHTML = `<div class="axp-alert axp-alert-danger"><i class="bi bi-exclamation-circle"></i><span>Failed to load analytics. Please check your connection.</span></div>`;
  }
};

function _renderAnalyticsData(data, cls, exam, gender) {
  const cont = document.getElementById("axpAnContent");
  if (!cont) return;

  const summary = data.summary || {};
  const byClass = data.byClass || {};
  const byGender = data.byGender || {};

  cont.innerHTML = `
    <!-- Overview stats -->
    <div class="axp-analytics-grid" style="margin-bottom:18px;">
      ${[
        {label:"Total Students",   val:summary.totalStudents||"0",  color:"#4ecca3"},
        {label:"Qualified",        val:summary.qualified||"0",      color:"#10b981"},
        {label:"Disqualified",     val:summary.disqualified||"0",   color:"#ef4444"},
        {label:"Not Admitted",     val:summary.notAdmitted||"0",    color:"#f59e0b"},
        {label:"School Average",   val:summary.average?summary.average+"%" :"—", color:"#3b82f6"},
        {label:"Pass Rate",        val:summary.passRate?summary.passRate+"%" :"—", color:"#8b5cf6"},
      ].map(s=>`
        <div class="axp-stat-box" style="border-color:${s.color};">
          <div class="axp-stat-box-lbl">${s.label}</div>
          <div class="axp-stat-box-val" style="color:${s.color};">${s.val}</div>
        </div>`).join("")}
    </div>

    <!-- Gender breakdown -->
    ${byGender.M || byGender.F ? `
      <h4 style="font-size:13.5px;font-weight:700;color:#1a1a2e;margin:0 0 10px;">Gender Breakdown</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">
        <div style="background:#eff6ff;padding:14px;border-left:3px solid #3b82f6;">
          <div style="font-size:11px;font-weight:700;color:#1e40af;margin-bottom:4px;">MALE STUDENTS</div>
          <div style="font-size:22px;font-weight:900;color:#1e40af;">${(byGender.M||{}).count||0}</div>
          <div style="font-size:12px;color:#3b82f6;">Avg: ${(byGender.M||{}).average||"—"}</div>
        </div>
        <div style="background:#fce7f3;padding:14px;border-left:3px solid #db2777;">
          <div style="font-size:11px;font-weight:700;color:#831843;margin-bottom:4px;">FEMALE STUDENTS</div>
          <div style="font-size:22px;font-weight:900;color:#831843;">${(byGender.F||{}).count||0}</div>
          <div style="font-size:12px;color:#db2777;">Avg: ${(byGender.F||{}).average||"—"}</div>
        </div>
      </div>` : ""}

    <!-- Per-class table -->
    ${Object.keys(byClass).length > 0 ? `
      <h4 style="font-size:13.5px;font-weight:700;color:#1a1a2e;margin:0 0 10px;">Per-Class Performance</h4>
      <div style="overflow-x:auto;">
        <table class="axp-ranking-table">
          <thead><tr><th>Class</th><th>Students</th><th>Average</th><th>Pass Rate</th><th>Top Grade</th></tr></thead>
          <tbody>
            ${Object.entries(byClass).map(([c,d])=>`
              <tr>
                <td style="font-weight:700;color:#1a1a2e;">${escapeHtml(c)}</td>
                <td>${d.students||0}</td>
                <td style="font-weight:700;">${d.average||"—"}</td>
                <td>${d.passRate||"—"}</td>
                <td><strong style="color:#10b981;">${d.topGrade||"—"}</strong></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>` : ""}`;
}

window.axpLoadTeacherBehaviour = async function() {
  const res_el = document.getElementById("axpTeacherBehaviourResult");
  if (!res_el) return;
  res_el.innerHTML = `<div class="axp-empty-state"><div class="axp-spinner-sm" style="margin:0 auto 8px;"></div><p>Loading...</p></div>`;
  try {
    const res = await _apiGet({ mode:"teacherActivity", schoolId:_appScriptSchoolId });
    if (res.status === "success" && res.teachers) {
      res_el.innerHTML = `
        <table class="axp-ranking-table">
          <thead><tr><th>Teacher</th><th>Class</th><th>Subject</th><th>Status</th><th>Last Submitted</th><th>Completion</th></tr></thead>
          <tbody>
            ${res.teachers.map(t=>{
              const pct = t.completionPct||0;
              const color = pct>=80?"#10b981":pct>=40?"#f59e0b":"#ef4444";
              return `<tr>
                <td style="font-weight:700;">${escapeHtml(t.name||"—")}</td>
                <td>${escapeHtml(t.class||"—")}</td>
                <td>${escapeHtml(t.subject||"—")}</td>
                <td><span style="background:${pct>=80?"#ecfdf5":pct>=40?"#fffbeb":"#fef2f2"};color:${color};padding:2px 8px;font-size:11px;font-weight:700;">${pct>=80?"Completed":pct>=40?"In Progress":"Pending"}</span></td>
                <td style="font-size:12px;color:#64748b;">${escapeHtml(t.lastSubmitted||"—")}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div style="flex:1;height:6px;background:#e2e8f0;min-width:60px;"><div style="height:100%;width:${pct}%;background:${color};transition:width .3s;"></div></div>
                    <span style="font-size:11px;font-weight:700;color:${color};">${pct}%</span>
                  </div>
                </td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>`;
    } else {
      res_el.innerHTML = `<div class="axp-alert axp-alert-warning"><i class="bi bi-info-circle"></i><span>${escapeHtml(res.message||"No teacher activity data found.")}</span></div>`;
    }
  } catch(e) {
    res_el.innerHTML = `<div class="axp-alert axp-alert-danger"><i class="bi bi-exclamation-circle"></i><span>Failed to load teacher activity.</span></div>`;
  }
};

/* ─────────────────────────────────────────────────────────────
   SECTION: BEST & LEAST STUDENTS REPORT
───────────────────────────────────────────────────────────── */
function renderStudentsReportSection() {
  const sw = document.getElementById("axpSectionWrapper");
  const classes   = (_schoolMeta && _schoolMeta.classes)   ? _schoolMeta.classes   : [];
  const examTypes = (_schoolMeta && _schoolMeta.examTypes) ? _schoolMeta.examTypes : [];

  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-trophy"></i> Best &amp; Least Students Report</div>
      <div class="axp-alert axp-alert-info" style="margin-bottom:16px;">
        <i class="bi bi-info-circle"></i>
        <span>Identify the best and least performing student per class, per subject, and per exam type. This gives a full academic picture to the school.</span>
      </div>
      <div style="background:#f8fafc;padding:14px;margin-bottom:16px;">
        <div class="axp-form-row">
          <div class="axp-field-group">
            <label>Class</label>
            <select id="axpRptClass" class="axp-select">
              <option value="">All Classes</option>
              ${classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
            </select>
          </div>
          <div class="axp-field-group">
            <label>Exam Type</label>
            <select id="axpRptExam" class="axp-select">
              <option value="">All Exams</option>
              ${examTypes.map(e=>`<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`).join("")}
            </select>
          </div>
        </div>
        <button onclick="axpLoadStudentsReport()" class="axp-btn-primary">
          <i class="bi bi-search"></i> Generate Report
        </button>
      </div>
      <div id="axpRptContent">
        <div class="axp-empty-state"><i class="bi bi-trophy"></i><p>Select filters and generate the report.</p></div>
      </div>
    </div>`;
}

window.axpLoadStudentsReport = async function() {
  const cont = document.getElementById("axpRptContent");
  if (!cont) return;
  const cls  = (document.getElementById("axpRptClass")||{}).value;
  const exam = (document.getElementById("axpRptExam")||{}).value;
  cont.innerHTML = `<div class="axp-empty-state"><div class="axp-spinner-sm" style="margin:0 auto 8px;"></div><p>Generating report...</p></div>`;
  try {
    const res = await _apiGet({ mode:"studentsReport", schoolId:_appScriptSchoolId, year:_schoolMeta.year, class:cls, examType:exam });
    if (res.status === "success" && res.report) {
      _renderStudentsReport(res.report);
    } else {
      cont.innerHTML = `<div class="axp-alert axp-alert-warning"><i class="bi bi-info-circle"></i><span>${escapeHtml(res.message||"No report data yet.")}</span></div>`;
    }
  } catch(e) {
    cont.innerHTML = `<div class="axp-alert axp-alert-danger"><i class="bi bi-exclamation-circle"></i><span>Failed to generate report.</span></div>`;
  }
};

function _renderStudentsReport(report) {
  const cont = document.getElementById("axpRptContent");
  if (!cont) return;
  const sections = [];
  (report || []).forEach(classReport => {
    sections.push(`
      <div style="margin-bottom:20px;">
        <h4 style="font-size:14px;font-weight:800;color:#1a1a2e;margin:0 0 10px;padding:10px 14px;background:#060c1c;color:#fff;">
          <i class="bi bi-journal-bookmark-fill" style="color:#4ecca3;margin-right:6px;"></i> ${escapeHtml(classReport.class||"")}
          ${classReport.exam ? `<span style="font-size:11px;font-weight:400;color:rgba(255,255,255,0.5);margin-left:8px;">— ${escapeHtml(classReport.exam)}</span>` : ""}
        </h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
          <div style="background:#ecfdf5;padding:14px;border-left:3px solid #10b981;">
            <div style="font-size:10px;font-weight:700;color:#065f46;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;"><i class="bi bi-trophy-fill" style="color:#f59e0b;"></i> Best Student (Class)</div>
            ${classReport.best ? `
              <div style="font-size:15px;font-weight:800;color:#065f46;">${escapeHtml(classReport.best.name||"—")}</div>
              <div style="font-size:12px;color:#10b981;">${escapeHtml(classReport.best.examNo||"")} &nbsp;·&nbsp; Score: <strong>${classReport.best.score||"—"}</strong></div>` : `<div style="font-size:13px;color:#94a3b8;">No data</div>`}
          </div>
          <div style="background:#fef2f2;padding:14px;border-left:3px solid #ef4444;">
            <div style="font-size:10px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;"><i class="bi bi-arrow-down-circle-fill" style="color:#ef4444;"></i> Least Student (Class)</div>
            ${classReport.least ? `
              <div style="font-size:15px;font-weight:800;color:#991b1b;">${escapeHtml(classReport.least.name||"—")}</div>
              <div style="font-size:12px;color:#ef4444;">${escapeHtml(classReport.least.examNo||"")} &nbsp;·&nbsp; Score: <strong>${classReport.least.score||"—"}</strong></div>` : `<div style="font-size:13px;color:#94a3b8;">No data</div>`}
          </div>
        </div>
        ${(classReport.bySubject && classReport.bySubject.length > 0) ? `
          <h5 style="font-size:12.5px;font-weight:700;color:#1a1a2e;margin:10px 0 8px;">Per-Subject Rankings</h5>
          <div style="overflow-x:auto;">
            <table class="axp-ranking-table">
              <thead><tr><th>Subject</th><th>🏆 Best Student</th><th>Score</th><th>⬇ Least Student</th><th>Score</th></tr></thead>
              <tbody>
                ${classReport.bySubject.map(s=>`
                  <tr>
                    <td style="font-weight:700;color:#4ecca3;">${escapeHtml(s.subject||"")}</td>
                    <td style="font-weight:700;color:#065f46;">${escapeHtml((s.best||{}).name||"—")}</td>
                    <td><span class="axp-rank-1">${(s.best||{}).score||"—"}</span></td>
                    <td style="font-weight:700;color:#991b1b;">${escapeHtml((s.least||{}).name||"—")}</td>
                    <td><span class="axp-rank-last">${(s.least||{}).score||"—"}</span></td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>` : ""}
      </div>`);
  });
  cont.innerHTML = sections.join("") || `<div class="axp-empty-state"><i class="bi bi-info-circle"></i><p>No report data found.</p></div>`;
}

/* ─────────────────────────────────────────────────────────────
   SECTION: SETTINGS
───────────────────────────────────────────────────────────── */
function renderSettingsSection() {
  const sw = document.getElementById("axpSectionWrapper");
  const d  = _dashboardData;
  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-gear"></i> Account Settings</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
        <div style="background:#f8fafc;padding:15px;">
          <div style="font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">School Name</div>
          <div style="font-size:14px;font-weight:600;color:#1e293b;">${escapeHtml(d.schoolname||"—")}</div>
        </div>
        <div style="background:#f8fafc;padding:15px;">
          <div style="font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">School Index</div>
          <div style="font-size:14px;font-weight:600;color:#1e293b;">${escapeHtml(d.schoolindex||"—")}</div>
        </div>
        <div style="background:#f8fafc;padding:15px;">
          <div style="font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Email</div>
          <div style="font-size:14px;font-weight:600;color:#1e293b;">${escapeHtml(d.email||"—")}</div>
        </div>
        <div style="background:#f8fafc;padding:15px;">
          <div style="font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Username</div>
          <div style="font-size:14px;font-weight:600;color:#1e293b;">${escapeHtml(d.username||"—")}</div>
        </div>
      </div>

      ${_schoolMeta ? `
        <div class="axp-alert axp-alert-success" style="margin-bottom:14px;">
          <i class="bi bi-check-circle-fill"></i>
          <span>Results system configured: <strong>${_schoolMeta.year}</strong> · ${(_schoolMeta.classes||[]).length} classes · ${(_schoolMeta.examTypes||[]).length} exam types</span>
        </div>
        <div style="background:#f8fafc;padding:14px;margin-bottom:14px;">
          <div style="font-size:12.5px;font-weight:700;color:#1a1a2e;margin-bottom:8px;"><i class="bi bi-plus-circle" style="color:#4ecca3;"></i> Add More Exam Types</div>
          <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px;">
            ${["WEEKLY","MONTHLY","MIDTERM","MIDTERM2","TERMINAL","JOINT","ANNUAL","PREMOCK","MOCK","PRENECTA","PRENECTA2"].map(et=>`
              <button onclick="axpSettingsQuickAddExam('${et}')" style="font-size:11px;padding:4px 9px;background:#f0fdf9;color:#065f46;border:1px solid #4ecca3;cursor:pointer;">${et}</button>`).join("")}
          </div>
          <div style="display:flex;gap:7px;align-items:center;margin-bottom:8px;">
            <input id="axpSettingsCustomExam" class="axp-input" style="flex:1;max-width:200px;" placeholder="Custom exam type e.g. QUIZ1" />
            <button onclick="axpSettingsAddCustomExam()" class="axp-btn-secondary" style="font-size:12px;">
              <i class="bi bi-plus"></i> Add Custom
            </button>
          </div>
          <div id="axpSettingsExamMsg" style="margin-top:6px;"></div>
        </div>` : ""}

      <div class="axp-divider-line"></div>
      <h4 style="font-size:13.5px;font-weight:700;color:#1e293b;margin:14px 0 10px;">Danger Zone</h4>
      <button onclick="axpRequestDelete()" class="axp-btn-danger">
        <i class="bi bi-trash3"></i> Request Account Deletion
      </button>
      <p style="font-size:11.5px;color:#94a3b8;margin:6px 0 0;">This will flag your account for deletion. An operator will review and process your request.</p>
    </div>`;
}

window.axpSettingsQuickAddExam = async function(examType) {
  if (!_appScriptSchoolId) { _showSectionMsg("axpSettingsExamMsg","School not configured yet.","danger"); return; }
  if (_schoolMeta && (_schoolMeta.examTypes||[]).includes(examType)) {
    _showSectionMsg("axpSettingsExamMsg", `${examType} already exists.`, "warning"); return;
  }
  await _axpDoAddExamType(examType);
};

window.axpSettingsAddCustomExam = async function() {
  const inp = document.getElementById("axpSettingsCustomExam");
  if (!inp) return;
  const val = inp.value.trim().toUpperCase().replace(/\s+/g,"_");
  if (!val) { _showSectionMsg("axpSettingsExamMsg","Enter a custom exam type name.","warning"); return; }
  if (!_appScriptSchoolId) { _showSectionMsg("axpSettingsExamMsg","School not configured yet.","danger"); return; }
  if (_schoolMeta && (_schoolMeta.examTypes||[]).includes(val)) {
    _showSectionMsg("axpSettingsExamMsg", `${val} already exists.`, "warning"); return;
  }
  inp.value = "";
  await _axpDoAddExamType(val);
};

function renderDataAuditSection() {
  const sw = document.getElementById("axpSectionWrapper");

  if (_dashboardData && _dashboardData.status !== "ACTIVE") {
    sw.innerHTML = _axpInactiveBlock();
    return;
  }
  if (!_appScriptSchoolId) {
    sw.innerHTML = `
      <div class="axp-section-card" style="text-align:center;padding:40px 24px;">
        <i class="bi bi-lock-fill" style="font-size:36px;color:#4ecca3;display:block;margin-bottom:14px;"></i>
        <h3 style="font-size:16px;font-weight:800;color:#1a1a2e;margin:0 0 8px;">Feature Locked</h3>
        <p style="font-size:13px;color:#64748b;max-width:360px;margin:0 auto 20px;line-height:1.6;">
          Configure your school first to unlock Data Audit.
        </p>
        <button onclick="axpOpenSetupPopup()" class="axp-btn-primary" style="font-size:13.5px;padding:10px 24px;">
          <i class="bi bi-gear-fill"></i> Setup School Now
        </button>
      </div>`;
    return;
  }

  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title">
        <i class="bi bi-journal-text"></i> Data Audit Log
      </div>
      <div class="axp-alert axp-alert-info" style="margin-bottom:16px;">
        <i class="bi bi-info-circle"></i>
        <span>Full record of all data actions: marks submitted, corrections, student pushes, and more. You can delete individual entries or filter by type.</span>
      </div>

      <!-- Filters -->
      <div style="background:#f8fafc;padding:14px;margin-bottom:16px;">
        <div class="axp-form-row">
          <div class="axp-field-group">
            <label>Action Type</label>
            <select id="axpAuditFilterAction" class="axp-select">
              <option value="">All Actions</option>
              <option value="MARKS_SUBMITTED">Marks Submitted</option>
              <option value="MARK_CORRECTED">Mark Corrected</option>
              <option value="STUDENT_PUSHED">Student Pushed</option>
              <option value="TEACHER_SAVED">Teacher Saved</option>
            </select>
          </div>
          <div class="axp-field-group">
            <label>Limit</label>
            <select id="axpAuditFilterLimit" class="axp-select">
              <option value="50">Last 50</option>
              <option value="100">Last 100</option>
              <option value="200" selected>Last 200</option>
              <option value="500">Last 500</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button onclick="axpLoadAuditLog()" class="axp-btn-primary">
            <i class="bi bi-search"></i> Load Audit Log
          </button>
          <button onclick="axpExportAuditLog()" class="axp-btn-secondary">
            <i class="bi bi-download"></i> Export CSV
          </button>
          <button onclick="axpClearAuditSelection()" class="axp-btn-secondary">
            <i class="bi bi-x-circle"></i> Clear Selection
          </button>
          <button onclick="axpDeleteSelectedAuditEntries()" class="axp-btn-danger" id="axpAuditDeleteSelectedBtn" style="display:none;">
            <i class="bi bi-trash3"></i> Delete Selected (<span id="axpAuditSelectedCount">0</span>)
          </button>
        </div>
      </div>

      <!-- Stats bar -->
      <div id="axpAuditStats" style="display:none;background:#060c1c;color:#fff;padding:12px 16px;margin-bottom:14px;display:none;flex-wrap:wrap;gap:16px;align-items:center;">
        <span style="font-size:12px;opacity:.6;">Total entries:</span>
        <strong style="font-size:18px;color:#4ecca3;" id="axpAuditTotalCount">—</strong>
        <span style="font-size:12px;opacity:.6;margin-left:10px;">Selected:</span>
        <strong style="font-size:16px;color:#f59e0b;" id="axpAuditSelCountBar">0</strong>
      </div>

      <!-- Table -->
      <div id="axpAuditContent">
        <div class="axp-empty-state">
          <i class="bi bi-journal-text"></i>
          <p>Click "Load Audit Log" to view data actions.</p>
        </div>
      </div>
    </div>`;

  window._axpAuditLog = [];
  window._axpAuditSelected = new Set();
}

window.axpLoadAuditLog = async function() {
  const cont   = document.getElementById("axpAuditContent");
  const action = (document.getElementById("axpAuditFilterAction") || {}).value || "";
  const limit  = parseInt((document.getElementById("axpAuditFilterLimit") || {}).value || "200");

  cont.innerHTML = `<div class="axp-empty-state">
    <div class="axp-spinner-sm" style="margin:0 auto 8px;"></div>
    <p>Loading audit log...</p>
  </div>`;

  if (!_appScriptSchoolId) {
    cont.innerHTML = `<div class="axp-alert axp-alert-warning">
      <i class="bi bi-exclamation-triangle"></i>
      <span>School not configured yet. Complete school setup first.</span>
    </div>`;
    return;
  }

  try {
    const classes   = (_schoolMeta && _schoolMeta.classes)   || [];
    const examTypes = (_schoolMeta && _schoolMeta.examTypes) || [];

    // Collect all student records across classes & exam types
    // Same fetch pattern as Task Progress — no mode parameter
    const allEntries = [];

    for (const examType of examTypes) {
      for (const cls of classes) {
        try {
          const res = await _apiGet({
            schoolId : _appScriptSchoolId,
            year     : _schoolMeta.year,
            class    : cls,
            examType : examType
          });

          const students = res.students || res.data || [];

          students.forEach(s => {
            const subjects = (_schoolMeta.subjects || {})[cls] || [];
            subjects.forEach(sub => {
              const scoreObj = (s.marks || s.scores || {})[sub];
              const mark     = _axpExtractMark(scoreObj);
              if (mark === undefined || mark === null) return;

              // Build audit-style entry from available data
              allEntries.push({
                auditId     : `${cls}_${examType}_${sub}_${s.examNo || s.exam_no || ""}`,
                timestamp   : scoreObj && scoreObj.submittedAt ? scoreObj.submittedAt : (res.lastUpdated || "—"),
                actionType  : scoreObj && scoreObj.corrected   ? "MARK_CORRECTED" : "MARKS_SUBMITTED",
                className   : cls,
                examType    : examType,
                subject     : sub,
                studentName : s.name     || "—",
                performedBy : scoreObj && scoreObj.submittedBy ? scoreObj.submittedBy : (res.submittedBy || "—"),
                newValue    : String(mark),
                oldValue    : scoreObj && scoreObj.oldValue ? String(scoreObj.oldValue) : "—"
              });
            });
          });
        } catch(innerErr) {
          // skip failed class/exam combos silently
        }
      }
    }

    // Apply action filter
    const filtered = action
      ? allEntries.filter(e => e.actionType === action)
      : allEntries;

    // Apply limit
    const sliced = filtered.slice(0, limit);

    window._axpAuditLog      = sliced;
    window._axpAuditSelected = new Set();

    _axpRenderAuditTable();

    const statsEl = document.getElementById("axpAuditStats");
    const totalEl = document.getElementById("axpAuditTotalCount");
    if (statsEl) statsEl.style.display = "flex";
    if (totalEl) totalEl.textContent   = filtered.length;

    if (sliced.length === 0) {
      cont.innerHTML = `<div class="axp-empty-state">
        <i class="bi bi-inbox"></i>
        <p>No audit entries found${action ? " for action: " + escapeHtml(action) : ""}.</p>
        <p style="font-size:12px;color:#94a3b8;margin-top:5px;">Marks must be entered by teachers before audit data appears.</p>
      </div>`;
    }

  } catch(err) {
    cont.innerHTML = `<div class="axp-alert axp-alert-danger">
      <i class="bi bi-exclamation-circle"></i>
      <span>Failed to load audit data. Check your connection.</span>
    </div>`;
  }
};

function _axpRenderAuditTable() {
  const cont = document.getElementById("axpAuditContent");
  if (!cont) return;
  const log = window._axpAuditLog || [];

  if (log.length === 0) {
    cont.innerHTML = `<div class="axp-empty-state">
      <i class="bi bi-inbox" style="font-size:2rem;opacity:.4;"></i>
      <p>No audit entries found.</p>
    </div>`;
    return;
  }

  const actionColors = {
    MARKS_SUBMITTED : "#10b981",
    MARK_CORRECTED  : "#f59e0b",
    STUDENT_PUSHED  : "#3b82f6",
    TEACHER_SAVED   : "#8b5cf6",
    TEACHER_UPDATED : "#8b5cf6"
  };

  cont.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="axp-table" style="min-width:720px;">
        <thead>
          <tr>
            <th style="width:32px;">
              <input type="checkbox" id="axpAuditCheckAll"
                onchange="axpAuditToggleAll(this.checked)"
                style="width:14px;height:14px;accent-color:#4ecca3;cursor:pointer;" />
            </th>
            <th>Time</th>
            <th>Action</th>
            <th>Class</th>
            <th>Exam</th>
            <th>Subject</th>
            <th>Student</th>
            <th>By</th>
            <th>New Value</th>
            <th style="width:60px;"></th>
          </tr>
        </thead>
        <tbody>
          ${log.map((entry, i) => {
            // DIRECT field access — matches backend exactly
            const auditId     = entry.auditId     || "";
            const timestamp   = entry.timestamp   || "";
            const actionType  = entry.actionType  || "—";
            const className   = entry.className   || "—";
            const examType    = entry.examType    || "—";
            const subject     = entry.subject     || "—";
            const studentName = entry.studentName || "—";
            const performedBy = entry.performedBy || "—";
            const newValue    = entry.newValue    || "";

            const color   = actionColors[actionType] || "#94a3b8";
            const checked = window._axpAuditSelected && window._axpAuditSelected.has(auditId);

            return `<tr id="axpAuditRow_${i}" style="${checked ? "background:#fffbeb;" : ""}">
              <td>
                <input type="checkbox" ${checked ? "checked" : ""}
                  onchange="axpAuditToggleRow('${escapeHtml(auditId)}', ${i}, this.checked)"
                  style="width:14px;height:14px;accent-color:#4ecca3;cursor:pointer;" />
              </td>
              <td style="font-size:11px;color:#64748b;white-space:nowrap;">${escapeHtml(String(timestamp))}</td>
              <td>
                <span style="background:${color}18;color:${color};padding:2px 8px;border-radius:4px;font-size:10.5px;font-weight:700;letter-spacing:.3px;white-space:nowrap;">
                  ${escapeHtml(actionType)}
                </span>
              </td>
              <td style="font-weight:500;">${escapeHtml(className)}</td>
              <td style="font-size:12px;">${escapeHtml(examType)}</td>
              <td style="font-size:12px;">${escapeHtml(subject)}</td>
              <td style="font-weight:500;">${escapeHtml(studentName)}</td>
              <td style="font-size:11.5px;color:#64748b;">
                ${escapeHtml(String(performedBy).split("@")[0])}
              </td>
              <td style="font-size:12px;color:#475569;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                title="${escapeHtml(String(newValue))}">
                ${escapeHtml(String(newValue).slice(0, 45))}
              </td>
              <td>
                <button onclick="axpAuditDeleteOne('${escapeHtml(auditId)}', ${i})"
                  class="axp-btn-danger" style="font-size:11px;padding:3px 7px;">
                  <i class="bi bi-trash3"></i>
                </button>
              </td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

window.axpAuditToggleAll = function(checked) {
  const log = window._axpAuditLog || [];
  window._axpAuditSelected = new Set();
  if (checked) log.forEach(e => { if (e.auditId) window._axpAuditSelected.add(e.auditId); });
  // re-render rows highlight only (avoid full re-render)
  log.forEach((entry, i) => {
    const row = document.getElementById("axpAuditRow_" + i);
    if (row) row.style.background = checked ? "#fffbeb" : "";
    const cb = row && row.querySelector("input[type=checkbox]");
    if (cb) cb.checked = checked;
  });
};

window.axpAuditToggleRow = function(auditId, idx, checked) {
  if (!window._axpAuditSelected) window._axpAuditSelected = new Set();
  checked ? window._axpAuditSelected.add(auditId) : window._axpAuditSelected.delete(auditId);
  const row = document.getElementById("axpAuditRow_" + idx);
  if (row) row.style.background = checked ? "#fffbeb" : "";
};

window.axpAuditDeleteOne = async function(auditId, rowIdx) {
  if (!auditId) return;
  if (!confirm("Delete this audit entry? This cannot be undone.")) return;
  try {
    // deleteAuditEntry is POST via mode=deleteAuditEntry
    const res = await _apiPost({
      mode      : "deleteAuditEntry",
      adminEmail: _dashboardData.email,
      auditId   : auditId
    });
    if (res.status === "success") {
      window._axpAuditLog = (window._axpAuditLog || []).filter(e => e.auditId !== auditId);
      window._axpAuditSelected && window._axpAuditSelected.delete(auditId);
      _axpRenderAuditTable();
      // update count
      const totalEl = document.getElementById("axpAuditTotalCount");
      if (totalEl) totalEl.textContent = window._axpAuditLog.length;
      _axpToast("Audit entry deleted.", "success");
    } else {
      _axpToast(res.message || "Delete failed.", "danger");
    }
  } catch(err) {
    _axpToast("Network error. Try again.", "danger");
  }
};

window.axpAuditDeleteSelected = async function() {
  const selected = [...(window._axpAuditSelected || [])];
  if (selected.length === 0) { _axpToast("No entries selected.", "warning"); return; }
  if (!confirm(`Delete ${selected.length} selected audit entries?`)) return;

  let deleted = 0, failed = 0;
  for (const auditId of selected) {
    try {
      const res = await _apiPost({
        mode      : "deleteAuditEntry",
        adminEmail: _dashboardData.email,
        auditId   : auditId
      });
      if (res.status === "success") {
        deleted++;
        window._axpAuditLog = (window._axpAuditLog || []).filter(e => e.auditId !== auditId);
        window._axpAuditSelected.delete(auditId);
      } else { failed++; }
    } catch(e) { failed++; }
  }
  _axpRenderAuditTable();
  const totalEl = document.getElementById("axpAuditTotalCount");
  if (totalEl) totalEl.textContent = window._axpAuditLog.length;
  _axpToast(`Deleted ${deleted} entries${failed ? `, ${failed} failed` : ""}.`, deleted > 0 ? "success" : "danger");
};

window.axpExportAuditLog = function() {
  const log = window._axpAuditLog || [];
  if (log.length === 0) { _axpToast("No data to export.", "warning"); return; }

  const headers = ["Audit ID","Timestamp","Action","School ID","School Name","Class","Exam","Subject","Student","Old Value","New Value","Performed By","IP Note"];
  const rows = log.map(e => [
    e.auditId, e.timestamp, e.actionType, e.schoolId, e.schoolName,
    e.className, e.examType, e.subject, e.studentName,
    e.oldValue, e.newValue, e.performedBy, e.ipNote
  ].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));

  const csv  = [headers.map(h => `"${h}"`).join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = `audit_log_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  _axpToast("Audit log exported.", "success");
};




function _axpUpdateAuditSelectionUI() {
  const count   = window._axpAuditSelected.size;
  const btn     = document.getElementById("axpAuditDeleteSelectedBtn");
  const countEl = document.getElementById("axpAuditSelectedCount");
  const barEl   = document.getElementById("axpAuditSelCountBar");
  if (btn)     btn.style.display   = count > 0 ? "inline-flex" : "none";
  if (countEl) countEl.textContent = count;
  if (barEl)   barEl.textContent   = count;
}

window.axpClearAuditSelection = function() {
  window._axpAuditSelected.clear();
  _axpUpdateAuditSelectionUI();
  _axpRenderAuditTable();
};






async function _axpDoAddExamType(examType) {
  _showSectionMsg("axpSettingsExamMsg", `Adding ${examType}...`, "info");
  try {
    const res = await _apiPost({
      mode: "addExamType",
      adminEmail: _dashboardData.email,
      schoolId: _appScriptSchoolId,
      examType
    });
    if (res.status === "success") {
      if (_schoolMeta) {
        if (!_schoolMeta.examTypes) _schoolMeta.examTypes = [];
        _schoolMeta.examTypes.push(examType);
        localStorage.setItem(_getSchoolMetaKey(), JSON.stringify(_schoolMeta));
      }
      _showSectionMsg("axpSettingsExamMsg", `${examType} added successfully!`, "success");
      _axpToast(`Exam type "${examType}" added to your school.`, "success");
    } else {
      _showSectionMsg("axpSettingsExamMsg", res.message || "Failed to add exam type.", "danger");
    }
  } catch(e) {
    _showSectionMsg("axpSettingsExamMsg", "Network error. Please try again.", "danger");
  }
}

window.axpRequestDelete = async function() {
  if (!confirm("Are you sure you want to request account deletion? This cannot be undone.")) return;
  try {
    const res = await _apiPost({ action:"requestDelete", username:_dashboardData.username, password:localStorage.getItem("axpPassword")||"" });
    alert(res.result==="success" ? "Deletion request submitted. An operator will review." : (res.message||"Request failed."));
  } catch(e) { alert("Network error."); }
};

window.axpShowRegisterNotice = function() {
  const existing = document.getElementById('axpRegNoticeOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'axpRegNoticeOverlay';
  overlay.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%;
    background:rgba(6,12,28,0.92); z-index:2147483647;
    display:flex; align-items:center; justify-content:center;
    padding:20px; box-sizing:border-box;
  `;

  overlay.innerHTML = `
    <div style="
      background:#0d1b35; border:1.5px solid #4ecca3; border-radius:12px;
      max-width:480px; width:100%; padding:36px 32px 28px;
      box-shadow:0 8px 40px rgba(78,204,163,0.15);
      font-family:Roboto,Arial,sans-serif; color:#e2e8f0;
      animation: axpSlideUp 0.3s ease;
    ">
      <div style="text-align:center; margin-bottom:22px;">
        <div style="margin-bottom:10px;">
          <i class="bi bi-building" style="font-size:42px; color:#4ecca3;"></i>
        </div>
        <h2 style="color:#4ecca3; margin:0 0 6px; font-size:20px; font-weight:700;">
          Before You Create an Account
        </h2>
        <p style="color:#94a3b8; font-size:13px; margin:0;">
          Please read this carefully
        </p>
      </div>

      <div style="
        background:#060c1c; border-left:3px solid #4ecca3;
        border-radius:6px; padding:16px 18px; margin-bottom:20px;
      ">
        <p style="margin:0 0 4px; font-size:13px; color:#94a3b8; line-height:1.6;">
          AcademixPoint offers many free tools — lesson plans, schemes of work, notes, and more —
          <strong style="color:#f1f5f9;">no account needed</strong> for those.
        </p>
        <p style="margin:0 0 14px; font-size:13px; color:#94a3b8; line-height:1.6;">
          <strong style="color:#4ecca3;">This registration</strong> is specifically for schools that want to manage
          their exam results system online.
        </p>

        <p style="margin:0 0 10px; font-size:14px; font-weight:700; color:#f1f5f9; display:flex; align-items:center; gap:8px;">
          <i class="bi bi-check-circle-fill" style="color:#4ecca3; font-size:15px; flex-shrink:0;"></i>
          This account covers:
        </p>
        <ul style="margin:0 0 18px; padding-left:0; font-size:13.5px; color:#cbd5e1; line-height:2; list-style:none;">
          <li style="display:flex; align-items:center; gap:8px;">
            <i class="bi bi-check2" style="color:#4ecca3; flex-shrink:0;"></i> School exam results management
          </li>
          <li style="display:flex; align-items:center; gap:8px;">
            <i class="bi bi-check2" style="color:#4ecca3; flex-shrink:0;"></i> Student enrollment &amp; tracking
          </li>
          <li style="display:flex; align-items:center; gap:8px;">
            <i class="bi bi-check2" style="color:#4ecca3; flex-shrink:0;"></i> Exam performance monitoring
          </li>
          <li style="display:flex; align-items:center; gap:8px;">
            <i class="bi bi-check2" style="color:#4ecca3; flex-shrink:0;"></i> Academic analytics &amp; reports
          </li>
        </ul>

        <p style="margin:0 0 10px; font-size:14px; font-weight:700; color:#f87171; display:flex; align-items:center; gap:8px;">
          <i class="bi bi-info-circle-fill" style="color:#f87171; font-size:15px; flex-shrink:0;"></i>
          No account needed for:
        </p>
        <ul style="margin:0; padding-left:0; font-size:13.5px; color:#94a3b8; line-height:2; list-style:none;">
          <li style="display:flex; align-items:center; gap:8px;">
            <i class="bi bi-arrow-right" style="color:#64748b; flex-shrink:0;"></i> Lesson plans &amp; schemes of work — free &amp; open
          </li>
          <li style="display:flex; align-items:center; gap:8px;">
            <i class="bi bi-arrow-right" style="color:#64748b; flex-shrink:0;"></i> Teaching notes &amp; personal documents — free &amp; open
          </li>
          <li style="display:flex; align-items:center; gap:8px;">
            <i class="bi bi-arrow-right" style="color:#64748b; flex-shrink:0;"></i> Any other school activity not involving results — free &amp; open
          </li>
        </ul>
      </div>

      <label style="
        display:flex; align-items:flex-start; gap:12px;
        cursor:pointer; margin-bottom:22px; font-size:13.5px; color:#cbd5e1; line-height:1.5;
      ">
        <input type="checkbox" id="axpRegNoticeCheck" style="
          margin-top:3px; width:16px; height:16px; accent-color:#4ecca3;
          flex-shrink:0; cursor:pointer;
        ">
        I understand that this account is <strong style="color:#4ecca3;">&nbsp;for managing school exam results&nbsp;</strong>
        and I am registering for that purpose.
      </label>

      <div style="display:flex; gap:12px;">
        <button onclick="document.getElementById('axpRegNoticeOverlay').remove();" style="
          flex:1; padding:11px; border:1.5px solid #334155;
          background:transparent; color:#94a3b8; border-radius:7px;
          font-size:13.5px; cursor:pointer; font-family:inherit;
          display:flex; align-items:center; justify-content:center; gap:6px;
        ">
          <i class="bi bi-x-lg"></i> Cancel
        </button>
        <button id="axpRegNoticeProceedBtn" onclick="axpRegNoticeProceed()" style="
          flex:2; padding:11px; background:#4ecca3; color:#060c1c;
          border:none; border-radius:7px; font-size:14px; font-weight:700;
          cursor:pointer; font-family:inherit; opacity:0.4; pointer-events:none;
          display:flex; align-items:center; justify-content:center; gap:6px;
        ">
          <i class="bi bi-shield-check"></i> I Understand — Create Account
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('axpRegNoticeCheck').addEventListener('change', function() {
    const btn = document.getElementById('axpRegNoticeProceedBtn');
    btn.style.opacity = this.checked ? '1' : '0.4';
    btn.style.pointerEvents = this.checked ? 'auto' : 'none';
  });
};

window.axpRegNoticeProceed = function() {
  document.getElementById('axpRegNoticeOverlay').remove();
  _openAuthForm('sp-form');
};
/* ─────────────────────────────────────────────────────────────
   SECTION: HELP
───────────────────────────────────────────────────────────── */
function renderHelpSection() {
  const sw = document.getElementById("axpSectionWrapper");
  const faqs = [
    {
      icon:"bi-building-gear", color:"#4ecca3", title:"How do I set up my school?",
      body:`When you first log in and your account is ACTIVE, a <strong>Setup popup</strong> will appear automatically. If it doesn't, click <em>Assign Tasks</em> in the sidebar — you'll be prompted to set up.
<br><br>In the setup, you'll enter:
<br>1. <strong>Academic Year</strong> — e.g. 2026
<br>2. <strong>Classes</strong> — e.g. Form I, Form II (you can click quick-add buttons)
<br>3. <strong>Exam Types</strong> — Monthly, Midterm, Terminal, etc.
<br>4. <strong>Subjects per class</strong> — tick which subjects each class takes
<br><br>Once done, click <strong>Create My School</strong>. This is done only once.`
    },
    {
      icon:"bi-people-fill", color:"#3b82f6", title:"How do I add students?",
      body:`Go to <strong>Student Names</strong> in the sidebar. Select a class, then add students in one of three ways:
<br><br>• <strong>Add Row</strong> — add students one by one (type name, select gender)
<br>• <strong>Bulk Paste</strong> — paste a list in format: <code>JOHN DOE,M</code> (one per line)
<br>• <strong>Excel Upload</strong> — download the template, fill it, then upload. Columns: Name, Gender.
<br><br>When done, click <strong>Push Names to System</strong>. Then use <strong>Subject Assignment</strong> tab to confirm which subjects each student takes. Use <em>Check All</em> or <em>Uncheck All</em> for quick selection.`
    },
    {
      icon:"bi-person-badge", color:"#8b5cf6", title:"How do I add teachers?",
      body:`Go to <strong>Assign Tasks</strong> in the sidebar. You have three modes:
<br><br>• <strong>Quick Add</strong> — enter name, phone (optional), then select class and subject assignments. No email needed.
<br>• <strong>Detailed Add</strong> — enter full details: name, email, phone, qualification, experience, and multiple class-subject pairs.
<br>• <strong>Excel Upload</strong> — download the template, fill it in, then upload for bulk entry.
<br><br>Each teacher is assigned specific subjects for specific classes. This controls what marks they can enter.`
    },
    {
      icon:"bi-pencil-square", color:"#f59e0b", title:"How do teachers enter marks?",
      body:`After you add teachers, they get a special link (share it from your dashboard). When they open that link, they:
<br><br>1. Select their class, subject, and exam type
<br>2. Students appear one by one — they type the score (0–100) and press <strong>Next</strong>
<br>3. They can go <strong>Back</strong>, <strong>Skip</strong> a student, or <strong>Submit All</strong> at once
<br><br>Marks are securely saved to the AcademixPoint Data Center in real time.`
    },
    {
      icon:"bi-chat-dots-fill", color:"#10b981", title:"How do Messages & Notifications work?",
      body:`Click the <strong>bell icon</strong> for Notifications or the <strong>chat icon</strong> for Messages in the top bar.
<br><br>• <strong>Messages</strong> — messages from AcademixPoint (system messages, account updates)
<br>• <strong>Notifications</strong> — announcements and important notices
<br><br>Unread items appear in <strong>bold</strong> with a green dot. Click any item to open and read it. The unread count shows in the header.`
    },
    {
      icon:"bi-bar-chart-fill", color:"#ef4444", title:"How do Analytics & Reports work?",
      body:`Go to <strong>Analytics</strong> (accessible from the dashboard quick buttons).
<br><br>You can view:
<br>• Total students, qualified, disqualified, not admitted
<br>• Performance by class and gender
<br>• Average scores and pass rates
<br><br>The <strong>Best & Least Students</strong> report shows the top and bottom student for each class, subject, and exam — giving you a complete academic picture.`
    },
    {
      icon:"bi-person-check-fill", color:"#f97316", title:"How do I monitor teachers?",
      body:`In the <strong>Analytics</strong> section, scroll down to <strong>Teacher Activity Monitor</strong>. Click <em>Load Teacher Activity</em>.
<br><br>You'll see:
<br>• Which teachers have completed submitting marks
<br>• Which are still in progress or haven't started
<br>• Their last submission date
<br>• A completion percentage bar
<br><br>This helps you track accountability and follow up with teachers who haven't entered marks.`
    },
    {
      icon:"bi-play-circle-fill", color:"#64748b", title:"What is the Demo section?",
      body:`The Demo lets you experience all three workflows — student enrollment, teacher assignment, and results feeding — without saving any real data.
<br><br>It uses your actual school structure (classes, subjects) but is completely isolated. Use it to:
<br>• Train new admin staff
<br>• Test how the system works
<br>• Preview what teachers see when entering marks`
    },
    {
      icon:"bi-gear-fill", color:"#94a3b8", title:"How do I change my school settings?",
      body:`Click your <strong>username</strong> or the <strong>user icon</strong> at the top of the dashboard. This opens Settings.
<br><br>You can view:
<br>• School name, index number, email, username
<br>• Results system configuration (year, classes, exam types)
<br><br>To change your school structure (e.g. add a new class or exam type), contact support or use the Setup button again.`
    },
    {
      icon:"bi-file-earmark-excel", color:"#217346", title:"Can I upload data via Excel?",
      body:`Yes! Excel/CSV upload is supported for:
<br>• <strong>Students</strong> — in the Student Names section, click <em>Excel</em> button, download template, fill it, upload.
<br>• <strong>Teachers</strong> — in Assign Tasks section, click <em>Excel Upload</em> tab, download template, fill it, upload.
<br><br>Templates have the exact columns needed. Just fill them in and upload. The system will preview your data before saving, then it is securely transmitted to the AcademixPoint Data Center.`
    }
  ];

  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-question-circle"></i> Help &amp; Support</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px;">
        <div style="background:linear-gradient(135deg,#4ecca3,#2ecc71);padding:18px;color:#060c1c;">
          <i class="bi bi-telephone-fill" style="font-size:26px;margin-bottom:7px;display:block;"></i>
          <strong style="font-size:14px;">Call Support</strong>
          <p style="margin:5px 0 0;font-size:12.5px;opacity:0.85;">+255677819173</p>
        </div>
        <div style="background:#1a1a2e;padding:18px;color:#fff;">
          <i class="bi bi-globe" style="font-size:26px;margin-bottom:7px;display:block;color:#4ecca3;"></i>
          <strong style="font-size:14px;">Website</strong>
          <p style="margin:5px 0 0;font-size:12.5px;opacity:0.7;">www.academixpoint.com</p>
        </div>
      </div>

      <h4 style="font-size:14px;font-weight:800;color:#1a1a2e;margin:0 0 14px;">Frequently Asked Questions</h4>
      <div style="display:flex;flex-direction:column;gap:1px;">
        ${faqs.map((faq, i) => `
          <div style="border:1px solid #e2e8f0;margin-bottom:4px;">
            <button onclick="axpToggleFaq(${i})" style="width:100%;display:flex;align-items:center;gap:12px;padding:13px 16px;background:#f8fafc;border:none;cursor:pointer;text-align:left;">
              <div style="width:34px;height:34px;min-width:34px;background:${faq.color}18;display:flex;align-items:center;justify-content:center;">
                <i class="bi ${faq.icon}" style="font-size:16px;color:${faq.color};"></i>
              </div>
              <span style="font-size:13.5px;font-weight:700;color:#1a1a2e;flex:1;">${faq.title}</span>
              <i class="bi bi-chevron-down" id="axpFaqChevron_${i}" style="font-size:14px;color:#94a3b8;transition:transform .2s;"></i>
            </button>
            <div id="axpFaqBody_${i}" style="display:none;padding:14px 16px 16px 62px;font-size:13px;line-height:1.75;color:#475569;">
              ${faq.body}
            </div>
          </div>`).join("")}
      </div>
    </div>`;
}

window.axpToggleFaq = function(i) {
  const body    = document.getElementById(`axpFaqBody_${i}`);
  const chevron = document.getElementById(`axpFaqChevron_${i}`);
  if (!body) return;
  const isOpen = body.style.display !== "none";
  body.style.display = isOpen ? "none" : "block";
  if (chevron) chevron.style.transform = isOpen ? "" : "rotate(180deg)";
};

/* ─────────────────────────────────────────────────────────────
   SHARED SECTION HELPER
───────────────────────────────────────────────────────────── */
function _showSectionMsg(elId, text, type="info") {
  const el = document.getElementById(elId);
  if (!el) return;
  const typeMap = { success:"axp-alert-success", danger:"axp-alert-danger", warning:"axp-alert-warning", info:"axp-alert-info" };
  const iconMap = { success:"bi-check-circle-fill", danger:"bi-x-circle-fill", warning:"bi-exclamation-triangle-fill", info:"bi-info-circle-fill" };
  el.innerHTML = `
    <div class="axp-alert ${typeMap[type]||typeMap.info}">
      <i class="bi ${iconMap[type]||iconMap.info}" style="flex-shrink:0;font-size:14px;"></i>
      <span>${escapeHtml(text)}</span>
    </div>`;
  if (type === "success") setTimeout(() => { if (el) el.innerHTML=""; }, 5000);
}


/* ══════════════════════════════════════════════════════════════
   DEMO SECTION — Full interactive: Students, Teachers, Results
══════════════════════════════════════════════════════════════ */

/* Grading helper */
function _axpGrade(score) {
  if (score === null || score === undefined || score === "") return { grade: "—", color: "#94a3b8" };
  const s = parseInt(score);
  if (isNaN(s)) return { grade: "—", color: "#94a3b8" };
  if (s >= 75) return { grade: "A", color: "#10b981" };
  if (s >= 65) return { grade: "B", color: "#4ecca3" };
  if (s >= 45) return { grade: "C", color: "#f59e0b" };
  if (s >= 30) return { grade: "D", color: "#f97316" };
  return { grade: "F", color: "#ef4444" };
}

function renderDemoSection() {
  const sw = document.getElementById("axpSectionWrapper");

  /* Build demo data from actual school meta or fallback */
  const demoClasses   = (_schoolMeta && _schoolMeta.classes)   ? _schoolMeta.classes   : ["Form I","Form II","Form III"];
  const demoExamTypes = (_schoolMeta && _schoolMeta.examTypes) ? _schoolMeta.examTypes : ["MONTHLY","MIDTERM","TERMINAL"];
  const demoSubjectsMap = (_schoolMeta && _schoolMeta.subjects) ? _schoolMeta.subjects :
    {
      "Form I":   ["MATHEMATICS","ENGLISH","KISWAHILI","BIOLOGY","CHEMISTRY"],
      "Form II":  ["MATHEMATICS","ENGLISH","PHYSICS","HISTORY","GEOGRAPHY"],
      "Form III": ["MATHEMATICS","ENGLISH","KISWAHILI","CIVICS","COMMERCE"]
    };

  /* Generate fake student list for demo */
  const allFakeStudents = [
    "AMINA HASSAN","BARAKA JOHN","CECILIA MWANGI","DAVID JOSEPH","ESTHER PETER",
    "FRANK OMARI","GRACE MUTUA","HENRY SALIM","IRENE KATO","JAMES NDEGE",
    "KHADIJA SAID","LEONARD PETER","MARY NJOROGE","NOAH OCHIENG","OLIVIA TEMBO",
    "PAUL KAMAU","QUEEN ACHOLA","ROBERT WAWERU","SARAH OMONDI","THOMAS MWENDA"
  ];

  /* Fake teacher list */
  const allFakeTeachers = [
    { name: "Mr. James Odhiambo", email: "odhiambo@gmail.com", class: demoClasses[0], subject: (demoSubjectsMap[demoClasses[0]]||[])[0]||"MATHEMATICS" },
    { name: "Mrs. Grace Mwenda",  email: "mwenda@gmail.com",   class: demoClasses[0], subject: (demoSubjectsMap[demoClasses[0]]||[])[1]||"ENGLISH" },
    { name: "Mr. Salim Hamisi",   email: "hamisi@gmail.com",   class: demoClasses[1] || demoClasses[0], subject: (demoSubjectsMap[demoClasses[1]||demoClasses[0]]||[])[0]||"MATHEMATICS" },
    { name: "Ms. Fatuma Said",    email: "fatuma@gmail.com",   class: demoClasses[1] || demoClasses[0], subject: (demoSubjectsMap[demoClasses[1]||demoClasses[0]]||[])[1]||"KISWAHILI" },
  ];

  /* Init global demo state */
  window._axpDemo = {
    classes:     demoClasses,
    examTypes:   demoExamTypes,
    subjectsMap: demoSubjectsMap,
    students:    {}, /* { "Form I": [{name, gender, examNo}] } */
    teachers:    [...allFakeTeachers],
    results:     {}, /* { "Form I::MONTHLY::MATHEMATICS": { "S0553/0001": 78, ... } } */
    allStudents: allFakeStudents,
    activeTab:   "students"
  };

  /* Pre-populate some students */
  demoClasses.forEach((cls, ci) => {
    const slice = allFakeStudents.slice(ci * 6, ci * 6 + 8);
    window._axpDemo.students[cls] = slice.map((name, i) => ({
      name,
      gender: i % 3 === 0 ? "F" : "M",
      examNo: `S${(_dashboardData.schoolindex||"0553").replace(/\D/g,"").slice(0,4).padStart(4,"0")}/${String(i+1).padStart(4,"0")}`
    }));
  });

  sw.innerHTML = `
    <!-- Demo header banner -->
    <div style="background:linear-gradient(135deg,#060c1c,#0f2248);padding:18px 22px;margin-bottom:0;color:#fff;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <div style="width:38px;height:38px;background:rgba(78,204,163,0.15);display:flex;align-items:center;justify-content:center;">
          <i class="bi bi-play-circle-fill" style="font-size:20px;color:#4ecca3;"></i>
        </div>
        <div>
          <div style="font-size:16px;font-weight:800;letter-spacing:.3px;">Interactive Demo</div>
          <div style="font-size:11.5px;opacity:.5;">All three workflows — Students, Teachers, Results feeding — no real data saved</div>
        </div>
        <span style="margin-left:auto;background:rgba(78,204,163,0.15);color:#4ecca3;padding:4px 12px;font-size:11px;font-weight:700;">DEMO MODE</span>
      </div>
      <div style="background:rgba(78,204,163,0.08);border-left:2px solid #4ecca3;padding:8px 12px;font-size:12.5px;color:rgba(255,255,255,0.65);">
        <i class="bi bi-shield-check" style="color:#4ecca3;"></i> Uses your school structure. No changes are saved to the database.
      </div>
    </div>

    <!-- Tab navigation -->
    <div style="display:flex;background:#fff;border-bottom:2px solid #e2e8f0;margin-bottom:0;">
      <button onclick="axpDemoSwitchTab('students')" id="axpDemoTabStudents"
        style="flex:1;padding:13px;border:none;background:none;font-size:13px;font-weight:700;color:#4ecca3;border-bottom:3px solid #4ecca3;margin-bottom:-2px;cursor:pointer;">
        <i class="bi bi-people-fill"></i> Student Names
      </button>
      <button onclick="axpDemoSwitchTab('teachers')" id="axpDemoTabTeachers"
        style="flex:1;padding:13px;border:none;background:none;font-size:13px;font-weight:700;color:#94a3b8;border-bottom:3px solid transparent;margin-bottom:-2px;cursor:pointer;">
        <i class="bi bi-person-badge"></i> Teachers
      </button>
      <button onclick="axpDemoSwitchTab('results')" id="axpDemoTabResults"
        style="flex:1;padding:13px;border:none;background:none;font-size:13px;font-weight:700;color:#94a3b8;border-bottom:3px solid transparent;margin-bottom:-2px;cursor:pointer;">
        <i class="bi bi-pencil-square"></i> Results Feeding
      </button>
    </div>

    <!-- Students Tab -->
    <div id="axpDemoPanelStudents" class="axp-section-card" style="margin-top:0;">
      ${_axpDemoBuildStudentsPanel(demoClasses, demoSubjectsMap)}
    </div>

    <!-- Teachers Tab -->
    <div id="axpDemoPanelTeachers" class="axp-section-card" style="margin-top:0;display:none;">
      ${_axpDemoBuildTeachersPanel(demoClasses, demoSubjectsMap, allFakeTeachers)}
    </div>

    <!-- Results Tab -->
    <div id="axpDemoPanelResults" class="axp-section-card" style="margin-top:0;display:none;">
      ${_axpDemoBuildResultsPanel(demoClasses, demoExamTypes, demoSubjectsMap)}
    </div>
  `;
}

/* ── Demo: Students Panel ────────────────────────────────────── */
function _axpDemoBuildStudentsPanel(demoClasses, demoSubjectsMap) {
  return `
    <div class="axp-section-title"><i class="bi bi-people-fill"></i> Add Student Names (Demo)</div>
    <div class="axp-alert axp-alert-info" style="margin-bottom:16px;">
      <i class="bi bi-info-circle"></i>
      <span>Pre-populated with demo students. Edit, add or remove names to see how enrollment works.</span>
    </div>
    <div class="axp-form-row">
      <div class="axp-field-group">
        <label>Select Class</label>
        <select id="axpDemoStuClass" class="axp-select" onchange="axpDemoRenderStudentList()">
          ${demoClasses.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
        </select>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <span style="font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:.5px;">Student List</span>
      <div style="display:flex;gap:7px;">
        <button onclick="axpDemoAddStuRow()" class="axp-btn-secondary" style="font-size:12px;padding:5px 10px;"><i class="bi bi-plus"></i> Add</button>
        <button onclick="axpDemoPushStudents()" class="axp-btn-primary" style="font-size:12px;padding:5px 12px;"><i class="bi bi-cloud-upload"></i> Push (Demo)</button>
        <button onclick="axpDemoExcelStudentToggle()" class="axp-btn-secondary" style="font-size:12px;padding:5px 10px;"><i class="bi bi-file-earmark-excel" style="color:#217346;"></i> Excel</button>
      </div>
    </div>
    <div id="axpDemoStuExcelArea" style="display:none;background:#f8fafc;padding:12px;margin-bottom:10px;">
      <p style="font-size:12.5px;color:#64748b;margin:0 0 8px;">Download the template, fill it, then upload. Columns: Name, Gender (M/F).</p>
      <div style="display:flex;gap:7px;margin-bottom:8px;">
        <button onclick="axpDownloadDemoStudentTemplate()" class="axp-btn-secondary" style="font-size:12px;"><i class="bi bi-download"></i> Template</button>
        <button onclick="axpDemoExcelStudentToggle()" class="axp-btn-secondary" style="font-size:12px;">Cancel</button>
      </div>
      <input type="file" id="axpDemoStuExcelFile" accept=".csv,.xlsx,.xls" style="margin-bottom:6px;" onchange="axpHandleDemoStudentExcel(this)" />
    </div>
    <div id="axpDemoStuRows"></div>
    <div id="axpDemoStuMsg" style="margin-top:8px;"></div>`;
}

window.axpDemoRenderStudentList = function() {
  const cls  = (document.getElementById("axpDemoStuClass")||{}).value;
  const cont = document.getElementById("axpDemoStuRows");
  if (!cls || !cont) return;
  const students = window._axpDemo.students[cls] || [];
  cont.innerHTML = `
    <div style="display:grid;grid-template-columns:36px 40px 1fr 70px 70px auto;gap:5px;align-items:center;padding:5px 3px 7px;border-bottom:1px solid #e2e8f0;margin-bottom:5px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">
      <span>#</span><span>Exam No</span><span>Name</span><span>Gender</span><span style="text-align:center;">Subjects</span><span></span>
    </div>
    ${students.map((s,i)=>`
      <div style="display:grid;grid-template-columns:36px 40px 1fr 70px 70px auto;gap:5px;align-items:center;margin-bottom:4px;${i%2===0?'background:#fafbfc;':''} padding:3px 0;">
        <span style="font-size:11px;color:#94a3b8;text-align:center;">${i+1}</span>
        <span style="font-size:10.5px;color:#4ecca3;font-weight:700;">${escapeHtml(s.examNo)}</span>
        <input class="axp-input" style="padding:5px 8px;font-size:12.5px;" value="${escapeHtml(s.name)}"
          oninput="window._axpDemo.students['${cls}'][${i}].name=this.value" placeholder="Full Name" />
        <select class="axp-select" style="padding:5px 7px;font-size:12px;" onchange="window._axpDemo.students['${cls}'][${i}].gender=this.value">
          <option value="M" ${s.gender==="M"?"selected":""}>M</option>
          <option value="F" ${s.gender==="F"?"selected":""}>F</option>
        </select>
        <span style="font-size:11.5px;text-align:center;color:#4ecca3;font-weight:700;">${((window._axpDemo.subjectsMap[cls]||[]).length)}</span>
        <button onclick="axpDemoRemoveStu('${cls}',${i})" style="background:none;border:none;color:#dc3545;cursor:pointer;font-size:16px;padding:1px 5px;">×</button>
      </div>`).join("")}`;
};

window.axpDemoAddStuRow = function() {
  const cls = (document.getElementById("axpDemoStuClass")||{}).value;
  if (!cls) return;
  if (!window._axpDemo.students[cls]) window._axpDemo.students[cls] = [];
  const idx = window._axpDemo.students[cls].length + 1;
  const schoolCode = (_dashboardData.schoolindex||"0553").replace(/\D/g,"").slice(0,4).padStart(4,"0");
  window._axpDemo.students[cls].push({ name:"", gender:"M", examNo:`S${schoolCode}/${String(idx).padStart(4,"0")}` });
  axpDemoRenderStudentList();
};

window.axpDemoRemoveStu = function(cls, idx) {
  if (window._axpDemo.students[cls]) window._axpDemo.students[cls].splice(idx,1);
  axpDemoRenderStudentList();
};

window.axpDemoPushStudents = function() {
  const cls = (document.getElementById("axpDemoStuClass")||{}).value;
  const count = (window._axpDemo.students[cls]||[]).filter(s=>s.name.trim()).length;
  if (count === 0) { _showSectionMsg("axpDemoStuMsg","No student names to push.","warning"); return; }
  _showSectionMsg("axpDemoStuMsg", `${count} students for ${cls} pushed to demo system successfully! In live mode, names are securely stored in the AcademixPoint Data Center.`, "success");
};

window.axpDemoExcelStudentToggle = function() {
  const a = document.getElementById("axpDemoStuExcelArea");
  if (a) a.style.display = a.style.display === "none" ? "block" : "none";
};

window.axpDownloadDemoStudentTemplate = function() {
  const csv = "Name,Gender\nJohn Doe,M\nJane Smith,F";
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download="demo_students_template.csv"; a.click();
};

window.axpHandleDemoStudentExcel = function(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const lines = e.target.result.split(/\r?\n/).filter(l=>l.trim());
    const rows = lines.slice(1).map(line => {
      const cols = line.split(",");
      const name = (cols[0]||"").trim();
      const gender = ((cols[1]||"M").trim().toUpperCase().startsWith("F")) ? "F" : "M";
      return { name, gender };
    }).filter(r=>r.name);
    if (!rows.length) { _showSectionMsg("axpDemoStuMsg","No valid rows.","danger"); return; }
    const cls = (document.getElementById("axpDemoStuClass")||{}).value;
    const schoolCode = (_dashboardData.schoolindex||"0553").replace(/\D/g,"").slice(0,4).padStart(4,"0");
    if (cls) {
      window._axpDemo.students[cls] = rows.map((r,i)=>({...r, examNo:`S${schoolCode}/${String(i+1).padStart(4,"0")}`}));
      document.getElementById("axpDemoStuExcelArea").style.display = "none";
      axpDemoRenderStudentList();
      _showSectionMsg("axpDemoStuMsg", `${rows.length} students loaded from file!`, "success");
    }
  };
  reader.readAsText(file);
};

function _axpDemoBuildTeachersPanel(demoClasses, demoSubjectsMap, initialTeachers) {
  return `
    <div class="axp-section-title"><i class="bi bi-person-badge"></i> Teacher Assignment (Demo)</div>
    <div class="axp-alert axp-alert-info" style="margin-bottom:16px;">
      <i class="bi bi-info-circle"></i>
      <span>Pre-loaded with demo teachers. Add new ones or modify assignments. Try Quick Add or Detailed Add.</span>
    </div>

    <!-- Mode toggle -->
    <div style="display:flex;gap:0;border:1px solid #e2e8f0;margin-bottom:16px;width:fit-content;">
      <button onclick="axpDemoTchModeSet('quick')" id="axpDemoTchModeQuick"
        style="padding:7px 16px;border:none;font-size:12px;font-weight:700;cursor:pointer;background:#4ecca3;color:#060c1c;">
        <i class="bi bi-lightning-charge"></i> Quick Add
      </button>
      <button onclick="axpDemoTchModeSet('detailed')" id="axpDemoTchModeDetailed"
        style="padding:7px 16px;border:none;font-size:12px;font-weight:700;cursor:pointer;background:#f1f5f9;color:#334155;">
        <i class="bi bi-card-list"></i> Detailed
      </button>
    </div>

    <!-- Quick Add Form -->
    <div id="axpDemoTchFormQuick" style="background:#f8fafc;padding:16px;margin-bottom:18px;">
      <h4 style="font-size:13px;font-weight:700;color:#1a1a2e;margin:0 0 12px;display:flex;align-items:center;gap:6px;">
        <i class="bi bi-lightning-charge" style="color:#4ecca3;"></i> Quick Add Demo Teacher
      </h4>
      <div class="axp-form-row">
        <div class="axp-field-group">
          <label>Teacher Name *</label>
          <input id="axpDemoTchName" class="axp-input" placeholder="e.g. Mr. John Doe" />
        </div>
        <div class="axp-field-group">
          <label>Phone (Optional)</label>
          <input id="axpDemoTchPhone" class="axp-input" placeholder="e.g. 0712345678" />
        </div>
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:flex-end;margin-bottom:8px;">
        <div class="axp-field-group" style="flex:1;min-width:120px;">
          <label>Class</label>
          <select id="axpDemoTchClass" class="axp-select" onchange="axpDemoTchPopulateSubjects()">
            <option value="">Select Class</option>
            ${demoClasses.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
          </select>
        </div>
        <div class="axp-field-group" style="flex:1;min-width:140px;">
          <label>Subject</label>
          <select id="axpDemoTchSubject" class="axp-select">
            <option value="">Select Subject</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:7px;">
        <button onclick="axpDemoSaveTeacher()" class="axp-btn-primary" style="font-size:12.5px;">
          <i class="bi bi-floppy"></i> Save Teacher (Demo)
        </button>
      </div>
      <div id="axpDemoTchMsg" style="margin-top:8px;"></div>
    </div>

    <!-- Detailed Add Form -->
    <div id="axpDemoTchFormDetailed" style="background:#f8fafc;padding:16px;margin-bottom:18px;display:none;">
      <h4 style="font-size:13px;font-weight:700;color:#1a1a2e;margin:0 0 12px;display:flex;align-items:center;gap:6px;">
        <i class="bi bi-card-list" style="color:#4ecca3;"></i> Detailed Add Demo Teacher
      </h4>
      <div class="axp-form-row">
        <div class="axp-field-group">
          <label>Teacher Name *</label>
          <input id="axpDemoTchNameD" class="axp-input" placeholder="e.g. Mr. John Doe" />
        </div>
        <div class="axp-field-group">
          <label>Email *</label>
          <input id="axpDemoTchEmailD" class="axp-input" type="email" placeholder="teacher@gmail.com" />
        </div>
      </div>
      <div class="axp-form-row">
        <div class="axp-field-group">
          <label>Phone</label>
          <input id="axpDemoTchPhoneD" class="axp-input" placeholder="0712345678" />
        </div>
        <div class="axp-field-group">
          <label>Qualification</label>
          <input id="axpDemoTchQualD" class="axp-input" placeholder="e.g. B.Ed" />
        </div>
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:flex-end;margin-bottom:8px;">
        <div class="axp-field-group" style="flex:1;min-width:120px;">
          <label>Class</label>
          <select id="axpDemoTchClassD" class="axp-select" onchange="axpDemoTchPopulateSubjectsD()">
            <option value="">Select Class</option>
            ${demoClasses.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
          </select>
        </div>
        <div class="axp-field-group" style="flex:1;min-width:140px;">
          <label>Subject</label>
          <select id="axpDemoTchSubjectD" class="axp-select">
            <option value="">Select Subject</option>
          </select>
        </div>
      </div>
      <button onclick="axpDemoSaveTeacherDetailed()" class="axp-btn-primary" style="font-size:12.5px;">
        <i class="bi bi-floppy"></i> Save Teacher (Demo)
      </button>
      <div id="axpDemoTchMsgD" style="margin-top:8px;"></div>
    </div>

    <!-- Teacher cards -->
    <h4 style="font-size:13px;font-weight:700;color:#1a1a2e;margin:0 0 10px;">Teacher List</h4>
    <div id="axpDemoTeacherCards"></div>`;
}

window.axpDemoTchPopulateSubjects = function() {
  const cls = (document.getElementById("axpDemoTchClass")||{}).value;
  const sel = document.getElementById("axpDemoTchSubject");
  sel.innerHTML = '<option value="">Select Subject</option>';
  if (cls && window._axpDemo.subjectsMap[cls]) {
    window._axpDemo.subjectsMap[cls].forEach(s => {
      sel.innerHTML += `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`;
    });
  }
};

window.axpDemoTchModeSet = function(mode) {
  const quick    = document.getElementById("axpDemoTchFormQuick");
  const detailed = document.getElementById("axpDemoTchFormDetailed");
  const btnQ     = document.getElementById("axpDemoTchModeQuick");
  const btnD     = document.getElementById("axpDemoTchModeDetailed");
  if (quick)    quick.style.display    = mode === "quick"    ? "block" : "none";
  if (detailed) detailed.style.display = mode === "detailed" ? "block" : "none";
  if (btnQ) { btnQ.style.background = mode==="quick"?"#4ecca3":"#f1f5f9"; btnQ.style.color = mode==="quick"?"#060c1c":"#334155"; }
  if (btnD) { btnD.style.background = mode==="detailed"?"#4ecca3":"#f1f5f9"; btnD.style.color = mode==="detailed"?"#060c1c":"#334155"; }
};

window.axpDemoTchPopulateSubjectsD = function() {
  const cls = (document.getElementById("axpDemoTchClassD")||{}).value;
  const sel = document.getElementById("axpDemoTchSubjectD");
  if (!sel) return;
  sel.innerHTML = '<option value="">Select Subject</option>';
  if (cls && window._axpDemo.subjectsMap[cls]) {
    window._axpDemo.subjectsMap[cls].forEach(s => {
      sel.innerHTML += `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`;
    });
  }
};

window.axpDemoSaveTeacherDetailed = function() {
  const name    = (document.getElementById("axpDemoTchNameD")||{}).value.trim();
  const email   = (document.getElementById("axpDemoTchEmailD")||{}).value.trim();
  const cls     = (document.getElementById("axpDemoTchClassD")||{}).value;
  const subject = (document.getElementById("axpDemoTchSubjectD")||{}).value;
  const phone   = (document.getElementById("axpDemoTchPhoneD")||{}).value.trim();
  const qual    = (document.getElementById("axpDemoTchQualD")||{}).value.trim();

  if (!name)  { _showSectionMsg("axpDemoTchMsgD","Name is required.","danger"); return; }
  if (!email) { _showSectionMsg("axpDemoTchMsgD","Email is required.","danger"); return; }
  if (!cls || !subject) { _showSectionMsg("axpDemoTchMsgD","Select class and subject.","danger"); return; }

  window._axpDemo.teachers.push({ name, email, phone, qual, class:cls, subject });
  _showSectionMsg("axpDemoTchMsgD", `Teacher "${name}" saved to demo!`, "success");
  ["axpDemoTchNameD","axpDemoTchEmailD","axpDemoTchPhoneD","axpDemoTchQualD"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
  axpDemoRenderTeacherCards();
};

window.axpDemoSaveTeacher = function() {
  const name    = (document.getElementById("axpDemoTchName")||{}).value.trim();
  const cls     = (document.getElementById("axpDemoTchClass")||{}).value;
  const subject = (document.getElementById("axpDemoTchSubject")||{}).value;
  const phone   = (document.getElementById("axpDemoTchPhone")||{}).value.trim();

  if (!name)  { _showSectionMsg("axpDemoTchMsg","Name is required.","danger"); return; }
  if (!cls || !subject) { _showSectionMsg("axpDemoTchMsg","Select class and subject.","danger"); return; }

  window._axpDemo.teachers.push({ name, email:"", phone, class:cls, subject });
  _showSectionMsg("axpDemoTchMsg", `Teacher "${name}" saved to demo!`, "success");
  const nEl = document.getElementById("axpDemoTchName"); if (nEl) nEl.value="";
  const pEl = document.getElementById("axpDemoTchPhone"); if (pEl) pEl.value="";
  axpDemoRenderTeacherCards();
};

window.axpDemoRemoveTeacher = function(idx) {
  window._axpDemo.teachers.splice(idx, 1);
  axpDemoRenderTeacherCards();
};

window.axpDemoRenderTeacherCards = function() {
  const cont = document.getElementById("axpDemoTeacherCards");
  if (!cont) return;
  if (window._axpDemo.teachers.length === 0) {
    cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-person-x"></i><p>No teachers added yet.</p></div>`;
    return;
  }
  cont.innerHTML = window._axpDemo.teachers.map((t,i) => `
    <div class="teacher-card">
      <div class="teacher-card-header">
        <div>
          <div class="teacher-card-name"><i class="bi bi-person-fill" style="color:#4ecca3;"></i> ${escapeHtml(t.name)}</div>
          <div class="teacher-card-email">${escapeHtml(t.email)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="axp-badge axp-badge-green">${escapeHtml(t.class||"")} — ${escapeHtml(t.subject||"")}</span>
          <button onclick="axpDemoRemoveTeacher(${i})" style="background:none;border:none;color:#dc3545;cursor:pointer;font-size:15px;padding:2px 5px;">×</button>
        </div>
      </div>
    </div>`).join("");
};

/* ── Demo: Results Feeding Panel ─────────────────────────────── */
function _axpDemoBuildResultsPanel(demoClasses, demoExamTypes, demoSubjectsMap) {
  return `
    <div class="axp-section-title"><i class="bi bi-pencil-square"></i> Results Feeding (Demo)</div>
    <div class="axp-alert axp-alert-info" style="margin-bottom:16px;">
      <i class="bi bi-info-circle"></i>
      <span>Select class and subject. Navigate students one by one with Prev / Next / Skip / Submit.</span>
    </div>

    <!-- Select teacher assignment -->
    <div style="background:#f8fafc;padding:14px;margin-bottom:16px;">
      <h4 style="font-size:12.5px;font-weight:700;color:#1a1a2e;margin:0 0 10px;">Select Assignment</h4>
      <div class="axp-form-row">
        <div class="axp-field-group">
          <label>Class</label>
          <select id="axpDemoResClass" class="axp-select" onchange="axpDemoResPopulateSubjects()">
            <option value="">Select Class</option>
            ${demoClasses.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
          </select>
        </div>
        <div class="axp-field-group">
          <label>Subject</label>
          <select id="axpDemoResSubject" class="axp-select">
            <option value="">Select Subject</option>
          </select>
        </div>
        <div class="axp-field-group">
          <label>Exam Type</label>
          <select id="axpDemoResExam" class="axp-select">
            ${demoExamTypes.map(et=>`<option value="${escapeHtml(et)}">${escapeHtml(et)}</option>`).join("")}
          </select>
        </div>
      </div>
      <button onclick="axpDemoStartFeeding()" class="axp-btn-primary" style="font-size:12.5px;">
        <i class="bi bi-play-fill"></i> Start Feeding
      </button>
    </div>

    <!-- Teacher label -->
    <div id="axpDemoResTeacherLabel" style="display:none;background:#060c1c;color:#fff;padding:10px 14px;margin-bottom:14px;font-size:12.5px;font-weight:600;display:none;align-items:center;gap:8px;">
      <i class="bi bi-person-fill" style="color:#4ecca3;"></i>
      <span id="axpDemoResTeacherName">—</span>
      <span style="margin-left:auto;color:#4ecca3;" id="axpDemoResAssignment">—</span>
    </div>

    <!-- Student card -->
    <div id="axpDemoResStudentCard" style="display:none;">
      <!-- Progress bar -->
      <div style="background:#f8fafc;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
        <div style="flex:1;">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;" id="axpDemoResProgressLabel">0 of 0 students</div>
          <div class="axp-progress-bar" style="height:5px;">
            <div class="axp-progress-fill" id="axpDemoResProgressFill" style="width:0%;transition:width .3s;"></div>
          </div>
        </div>
        <span style="font-size:18px;font-weight:800;color:#4ecca3;" id="axpDemoResProgressPct">0%</span>
      </div>

      <!-- Student info card -->
      <div style="border-left:4px solid #4ecca3;padding:14px 16px;background:#f0fdf9;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div>
            <div style="font-size:10px;font-weight:700;color:#4ecca3;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;">Exam Number</div>
            <div style="font-size:17px;font-weight:800;color:#060c1c;letter-spacing:1px;" id="axpDemoResExamNo">—</div>
          </div>
          <div style="margin-left:12px;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;">Name</div>
            <div style="font-size:15px;font-weight:700;color:#1a1a2e;" id="axpDemoResName">—</div>
          </div>
          <div style="margin-left:12px;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;">Sex</div>
            <div style="font-size:14px;font-weight:700;color:#1a1a2e;" id="axpDemoResSex">—</div>
          </div>
          <div style="margin-left:auto;">
            <span id="axpDemoResGradeBadge" style="font-size:28px;font-weight:900;color:#94a3b8;">—</span>
          </div>
        </div>
      </div>

      <!-- Mark input -->
      <div style="margin-bottom:14px;">
        <label style="font-size:10px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px;">
          Score (0 – 100)
        </label>
        <div style="display:flex;align-items:center;gap:10px;">
          <input id="axpDemoResMarkInput" type="number" min="0" max="100"
            class="axp-input" style="font-size:26px;font-weight:800;text-align:center;letter-spacing:2px;width:130px;padding:10px;"
            placeholder="—"
            oninput="axpDemoResScoreChange(this.value)"
            onkeydown="if(event.key==='Enter') axpDemoResNext()" />
          <div style="font-size:12px;color:#64748b;line-height:1.7;">
            <div>A ≥ 75 &nbsp; B ≥ 65</div>
            <div>C ≥ 45 &nbsp; D ≥ 30</div>
            <div>F &lt; 30</div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <button onclick="axpDemoResPrev()" class="axp-btn-secondary" id="axpDemoResPrevBtn">
          <i class="bi bi-chevron-left"></i> Prev
        </button>
        <button onclick="axpDemoResNext()" class="axp-btn-primary" id="axpDemoResNextBtn">
          Next <i class="bi bi-chevron-right"></i>
        </button>
        <button onclick="axpDemoResSkip()" class="axp-btn-secondary">
          <i class="bi bi-skip-forward"></i> Skip
        </button>
        <button onclick="axpDemoResSubmitAll()" class="axp-btn-primary" style="background:#10b981;margin-left:auto;" id="axpDemoResSubmitBtn">
          <i class="bi bi-send-fill"></i> Submit All
        </button>
      </div>
      <div id="axpDemoResMsg" style="margin-top:10px;"></div>
    </div>

    <!-- Results summary table (shown after submit) -->
    <div id="axpDemoResSummary" style="display:none;margin-top:18px;">
      <h4 style="font-size:13px;font-weight:700;color:#1a1a2e;margin:0 0 10px;border-bottom:2px solid #4ecca3;padding-bottom:8px;">
        <i class="bi bi-table" style="color:#4ecca3;"></i> Submitted Results
      </h4>
      <div id="axpDemoResTable"></div>
    </div>`;
}

window.axpDemoResPopulateSubjects = function() {
  const cls = (document.getElementById("axpDemoResClass")||{}).value;
  const sel = document.getElementById("axpDemoResSubject");
  sel.innerHTML = '<option value="">Select Subject</option>';
  if (cls && window._axpDemo.subjectsMap[cls]) {
    window._axpDemo.subjectsMap[cls].forEach(s => {
      sel.innerHTML += `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`;
    });
  }
};

window.axpDemoStartFeeding = function() {
  const cls     = (document.getElementById("axpDemoResClass")||{}).value;
  const subject = (document.getElementById("axpDemoResSubject")||{}).value;
  const exam    = (document.getElementById("axpDemoResExam")||{}).value;

  if (!cls || !subject || !exam) {
    _showSectionMsg("axpDemoResMsg","Select class, subject, and exam type.","danger"); return;
  }

  const students = window._axpDemo.students[cls] || [];
  if (students.length === 0) {
    _showSectionMsg("axpDemoResMsg","No students in this class. Add students in the Students tab first.","warning"); return;
  }

  /* Find matching teacher */
  const teacher = window._axpDemo.teachers.find(t => t.class === cls && t.subject === subject);
  const teacherLabel = document.getElementById("axpDemoResTeacherLabel");
  const teacherName  = document.getElementById("axpDemoResTeacherName");
  const teacherAsgn  = document.getElementById("axpDemoResAssignment");
  if (teacherLabel) teacherLabel.style.display = "flex";
  if (teacherName)  teacherName.textContent  = teacher ? teacher.name : "No teacher assigned";
  if (teacherAsgn)  teacherAsgn.textContent  = `${cls} — ${subject} — ${exam}`;

  /* Init results key */
  const rKey = `${cls}::${exam}::${subject}`;
  if (!window._axpDemo.results[rKey]) window._axpDemo.results[rKey] = {};

  window._axpDemo.feedState = {
    cls, subject, exam, rKey,
    students: students.map(s => ({ ...s })),
    currentIdx: 0
  };

  document.getElementById("axpDemoResStudentCard").style.display = "block";
  document.getElementById("axpDemoResSummary").style.display = "none";
  axpDemoResRenderCurrent();
};

function axpDemoResRenderCurrent() {
  const fs = window._axpDemo.feedState;
  if (!fs) return;

  const { students, currentIdx, rKey } = fs;
  const total   = students.length;
  const filled  = students.filter(s => window._axpDemo.results[rKey] && window._axpDemo.results[rKey][s.examNo] !== undefined).length;
  const pct     = total > 0 ? Math.round(filled / total * 100) : 0;

  const fill  = document.getElementById("axpDemoResProgressFill");
  const pctEl = document.getElementById("axpDemoResProgressPct");
  const lbl   = document.getElementById("axpDemoResProgressLabel");
  if (fill)  { fill.style.width = pct + "%"; fill.style.background = pct === 100 ? "#10b981" : "#4ecca3"; }
  if (pctEl) pctEl.textContent = pct + "%";
  if (lbl)   lbl.textContent   = `${filled} of ${total} students`;

  if (currentIdx >= total) {
    /* All done */
    document.getElementById("axpDemoResStudentCard").style.display = "none";
    axpDemoResShowSummary();
    return;
  }

  const student = students[currentIdx];
  const existingMark = (window._axpDemo.results[rKey] || {})[student.examNo];

  document.getElementById("axpDemoResExamNo").textContent = student.examNo;
  document.getElementById("axpDemoResName").textContent   = student.name || "—";
  document.getElementById("axpDemoResSex").textContent    = student.gender === "F" ? "Female" : "Male";

  const inp = document.getElementById("axpDemoResMarkInput");
  inp.value = existingMark !== undefined ? existingMark : "";
  axpDemoResScoreChange(inp.value);

  const prevBtn = document.getElementById("axpDemoResPrevBtn");
  const nextBtn = document.getElementById("axpDemoResNextBtn");
  if (prevBtn) prevBtn.disabled = currentIdx === 0;
  if (nextBtn) nextBtn.textContent = currentIdx === total - 1 ? " Finish " : "";
  if (nextBtn) nextBtn.innerHTML   = currentIdx === total - 1
    ? '<i class="bi bi-check2"></i> Finish'
    : 'Next <i class="bi bi-chevron-right"></i>';

  inp.focus();
}

window.axpDemoResScoreChange = function(val) {
  const badge = document.getElementById("axpDemoResGradeBadge");
  if (!badge) return;
  if (!val && val !== 0) { badge.textContent = "—"; badge.style.color = "#94a3b8"; return; }
  const { grade, color } = _axpGrade(val);
  badge.textContent = grade;
  badge.style.color = color;
};

window.axpDemoResNext = function() {
  const fs = window._axpDemo.feedState;
  if (!fs) return;
  const student = fs.students[fs.currentIdx];
  const inp     = document.getElementById("axpDemoResMarkInput");
  const val     = inp.value.trim();

  if (val !== "") {
    const score = parseInt(val);
    if (isNaN(score) || score < 0 || score > 100) {
      _showSectionMsg("axpDemoResMsg","Enter a valid score between 0 and 100.","danger"); return;
    }
    if (!window._axpDemo.results[fs.rKey]) window._axpDemo.results[fs.rKey] = {};
    window._axpDemo.results[fs.rKey][student.examNo] = score;
  }

  const total = fs.students.length;
  if (fs.currentIdx >= total - 1) {
    /* Finish */
    document.getElementById("axpDemoResStudentCard").style.display = "none";
    axpDemoResShowSummary();
  } else {
    fs.currentIdx++;
    axpDemoResRenderCurrent();
  }
  document.getElementById("axpDemoResMsg").innerHTML = "";
};

window.axpDemoResPrev = function() {
  const fs = window._axpDemo.feedState;
  if (!fs || fs.currentIdx <= 0) return;
  fs.currentIdx--;
  axpDemoResRenderCurrent();
};

window.axpDemoResSkip = function() {
  const fs = window._axpDemo.feedState;
  if (!fs) return;
  const total = fs.students.length;
  if (fs.currentIdx < total - 1) {
    fs.currentIdx++;
    axpDemoResRenderCurrent();
    _showSectionMsg("axpDemoResMsg","Student skipped.","warning");
  } else {
    /* End after last skip */
    document.getElementById("axpDemoResStudentCard").style.display = "none";
    axpDemoResShowSummary();
  }
};

window.axpDemoResSubmitAll = function() {
  /* Save current input before submitting bulk */
  const fs      = window._axpDemo.feedState;
  const student = fs ? fs.students[fs.currentIdx] : null;
  const inp     = document.getElementById("axpDemoResMarkInput");
  if (student && inp && inp.value.trim() !== "") {
    const score = parseInt(inp.value.trim());
    if (!isNaN(score) && score >= 0 && score <= 100) {
      if (!window._axpDemo.results[fs.rKey]) window._axpDemo.results[fs.rKey] = {};
      window._axpDemo.results[fs.rKey][student.examNo] = score;
    }
  }
  document.getElementById("axpDemoResStudentCard").style.display = "none";
  axpDemoResShowSummary();
  _axpToast("Results submitted to demo system!", "success");
};

window.axpPopAddCustomExamType = function() {
  const inp = document.getElementById("axpPopCustomExamInput");
  if (!inp) return;
  const val = inp.value.trim().toUpperCase().replace(/\s+/g,"_");
  if (!val) return;
  if (window._axpPopExamTypes.includes(val)) {
    alert("Already added: " + val); return;
  }
  window._axpPopExamTypes.push(val);
  inp.value = "";
  const cont = document.getElementById("axpPopSelectedExamTypes");
  if (cont) cont.innerHTML = window._axpPopExamTypes.map(e => `<span class="axp-tag">${e}</span>`).join("");
};

function axpDemoResShowSummary() {
  const fs = window._axpDemo.feedState;
  if (!fs) return;
  const summaryEl = document.getElementById("axpDemoResSummary");
  const tableEl   = document.getElementById("axpDemoResTable");
  if (!summaryEl || !tableEl) return;
  summaryEl.style.display = "block";

  const records = fs.students.map(s => ({
    examNo: s.examNo,
    name:   s.name,
    gender: s.gender,
    score:  (window._axpDemo.results[fs.rKey] || {})[s.examNo]
  }));

  const gradeCounts = { A:0, B:0, C:0, D:0, F:0, "—":0 };
  records.forEach(r => { gradeCounts[_axpGrade(r.score).grade] = (gradeCounts[_axpGrade(r.score).grade]||0)+1; });

  tableEl.innerHTML = `
    <!-- Summary stats -->
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:14px;">
      ${["A","B","C","D","F","—"].map(g => {
        const colors = { A:"#10b981",B:"#4ecca3",C:"#f59e0b",D:"#f97316",F:"#ef4444","—":"#94a3b8" };
        return `<div style="background:#f8fafc;padding:10px;text-align:center;">
          <div style="font-size:20px;font-weight:900;color:${colors[g]};">${gradeCounts[g]||0}</div>
          <div style="font-size:10px;font-weight:700;color:${colors[g]};margin-top:2px;">Grade ${g}</div>
        </div>`;
      }).join("")}
    </div>
    <!-- Table -->
    <table class="axp-table">
      <thead><tr>
        <th>#</th><th>Exam No</th><th>Name</th><th>Sex</th><th>Score</th><th>Grade</th>
      </tr></thead>
      <tbody>
        ${records.map((r,i) => {
          const { grade, color } = _axpGrade(r.score);
          return `<tr>
            <td style="color:#94a3b8;">${i+1}</td>
            <td style="color:#4ecca3;font-weight:700;">${escapeHtml(r.examNo)}</td>
            <td style="font-weight:500;">${escapeHtml(r.name||"—")}</td>
            <td>${r.gender === "F" ? "F" : "M"}</td>
            <td style="font-weight:700;">${r.score !== undefined ? r.score : "—"}</td>
            <td><strong style="font-size:14px;font-weight:900;color:${color};">${grade}</strong></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
    <div style="margin-top:12px;display:flex;gap:8px;">
      <button onclick="axpDemoRestartFeeding()" class="axp-btn-secondary" style="font-size:12px;">
        <i class="bi bi-arrow-counterclockwise"></i> Re-enter Marks
      </button>
    </div>`;
}

window.axpDemoRestartFeeding = function() {
  const summaryEl = document.getElementById("axpDemoResSummary");
  if (summaryEl) summaryEl.style.display = "none";
  const card = document.getElementById("axpDemoResStudentCard");
  if (card) card.style.display = "block";
  const fs = window._axpDemo.feedState;
  if (fs) { fs.currentIdx = 0; axpDemoResRenderCurrent(); }
};

/* ── Demo: Tab switching ─────────────────────────────────────── */
window.axpDemoSwitchTab = function(tab) {
  ["students","teachers","results"].forEach(t => {
    const panel = document.getElementById(`axpDemoPanelStudents`.replace("students",t).replace("axpDemoPanel","axpDemoPanel"));
    /* Use proper id */
  });

  ["students","teachers","results"].forEach(t => {
    const panelId = `axpDemoPanel${t.charAt(0).toUpperCase()+t.slice(1)}`;
    const btnId   = `axpDemoTab${t.charAt(0).toUpperCase()+t.slice(1)}`;
    const panel = document.getElementById(panelId);
    const btn   = document.getElementById(btnId);
    const isActive = t === tab;
    if (panel) panel.style.display = isActive ? "block" : "none";
    if (btn) {
      btn.style.color            = isActive ? "#4ecca3" : "#94a3b8";
      btn.style.borderBottomColor = isActive ? "#4ecca3" : "transparent";
    }
  });

  window._axpDemo.activeTab = tab;

  /* Initialize panels on first open */
  if (tab === "students") {
    const cls = (document.getElementById("axpDemoStuClass")||{}).value || window._axpDemo.classes[0];
    if (cls && !document.getElementById("axpDemoStuClass").value) {
      document.getElementById("axpDemoStuClass").value = cls;
    }
    axpDemoRenderStudentList();
  }
  if (tab === "teachers") {
    axpDemoRenderTeacherCards();
  }
};

/* End of AcademixPoint Dashboard JS */
