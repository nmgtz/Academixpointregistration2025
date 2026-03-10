
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

const SchoolInfoStorage = {
    STORAGE_KEY: 'school_info_by_class',

    getAllData() {
        try { const d = localStorage.getItem(this.STORAGE_KEY); return d ? JSON.parse(d) : {}; }
        catch (e) { return {}; }
    },
    getClassData(className) { return this.getAllData()[className] || null; },
    saveClassData(className, data) {
        try {
            const all = this.getAllData();
            all[className] = { ...data, lastUpdated: new Date().toISOString(), className };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
            return true;
        } catch (e) { return false; }
    },
    deleteClassData(className) {
        try {
            const all = this.getAllData();
            delete all[className];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
            return true;
        } catch (e) { return false; }
    },

    // Extra header rows (array of {label, value} objects, stored per-class)
    getHeaderRows(className) {
        const d = this.getClassData(className);
        return (d && d._headerRows) ? d._headerRows : [];
    },
    saveHeaderRows(className, rows) {
        const d = this.getClassData(className) || {};
        d._headerRows = rows;
        return this.saveClassData(className, d);
    },

    // Extra requirements (array of strings beyond requirement1/2/3)
    getExtraReqs(className) {
        const d = this.getClassData(className);
        return (d && d._extraReqs) ? d._extraReqs : [];
    },
    saveExtraReqs(className, reqs) {
        const d = this.getClassData(className) || {};
        d._extraReqs = reqs;
        return this.saveClassData(className, d);
    },

    // Result header lines — ordered array of plain strings shown as header rows
    getHeaderLines(className) {
        const d = this.getClassData(className);
        if (d && d._headerLines && d._headerLines.length) return d._headerLines;
        // Default 5 lines built from saved school data
        // Read from _dashboardData (same keys as renderSettingsSection)
        const dd2  = (typeof _dashboardData !== 'undefined') ? _dashboardData : {};
        const _dd_fd2 = dd2;   // alias for district access below
        const sd2  = (typeof window !== 'undefined' && window.currentSchoolData) ? window.currentSchoolData : {};
        const autoName = (dd2.schoolname || sd2.schoolName || '').trim();
        const autoIdx  = (dd2.schoolindex || sd2.indexNumber || '').trim();
        const year     = (typeof _schoolMeta !== 'undefined' && _schoolMeta && _schoolMeta.year) ? _schoolMeta.year : new Date().getFullYear();
        // Auto-detect school type for line 4
        const si2  = (typeof _axpSchoolInfo === 'function') ? _axpSchoolInfo('en') : null;
        const fullName = si2 ? si2.displayLine1.toUpperCase() : (autoName ? autoName.toUpperCase() : 'SCHOOL NAME');
        const line4 = (autoIdx ? autoIdx.toUpperCase() + ' - ' : '') + fullName;
        const line5 = 'EXAMINATION - ' + year;  // exam type added at render time
        return [
            "PRESIDENT'S OFFICE",
            "REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT",
            (_dd_fd2.district ? (_dd_fd2.district.toUpperCase()+' DISTRICT COUNCIL') : 'DISTRICT COUNCIL'),
            line4,
            line5
        ];
    },
    saveHeaderLines(className, lines) {
        const d = this.getClassData(className) || {};
        d._headerLines = lines;
        return this.saveClassData(className, d);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// CLASS INFO PANEL — shown inside Results & Reports when user clicks a folder.
// Allows entering/editing all class-level data inline without a modal wizard.
// Data is saved to localStorage via SchoolInfoStorage immediately on blur.
// ─────────────────────────────────────────────────────────────────────────────
function _axpRenderClassInfoPanel(className, container) {
    // container = a div inside axpRRContent where the panel will be placed
    const saved = SchoolInfoStorage.getClassData(className) || {};

    // Helper: get value from saved data or live DOM input
    const gv = (key) => (saved[key] || '');

    // Helper: autosave on any input change
    function _autosave() {
        const current = SchoolInfoStorage.getClassData(className) || {};
        const panel = document.getElementById('axpClassInfoPanel');
        if (!panel) return;
        [
            'openingDateInput','monthInput',
            'closingDateInput','classTeacherInput','headmasterInput',
            'requirement1','requirement2','requirement3'
        ].forEach(id => {
            const el = panel.querySelector(`[data-field="${id}"]`);
            if (el) current[id] = el.value;
        });
        // Extra requirements
        const extraReqEls = panel.querySelectorAll('[data-extrareq]');
        const extraReqs = [...extraReqEls].map(e => e.value).filter(Boolean);
        current._extraReqs = extraReqs;
        // Header lines (new simple array)
        const hdrLineEls = panel.querySelectorAll('[data-hdrline]');
        current._headerLines = [...hdrLineEls].map(i => i.value);
        SchoolInfoStorage.saveClassData(className, current);
    }

    // Load extra reqs
    const extraReqs = SchoolInfoStorage.getExtraReqs(className);

    const panel = document.createElement('div');
    panel.id = 'axpClassInfoPanel';
    panel.style.cssText = 'background:#fff;border:1.5px solid #1a3a5c;margin-bottom:14px;font-family:Arial,sans-serif;';

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.style.cssText = 'background:#1a3a5c;color:#fff;padding:8px 14px;font-size:12.5px;font-weight:700;display:flex;align-items:center;justify-content:space-between;';
    titleBar.innerHTML = `<span><i class="bi bi-pencil-square" style="margin-right:6px;"></i>Class Information — <em>${escapeHtml(className)}</em></span>
        <span style="font-size:10px;opacity:0.7;font-weight:400;">Auto-saved to device</span>`;
    panel.appendChild(titleBar);

    // Grid of fields
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0;border-top:1px solid #ddd;';

    const fieldDefs = [
        { key:'monthInput',       label:'Month / Period', icon:'bi-calendar-month',  type:'text'  },
        { key:'openingDateInput', label:'Opening Date',   icon:'bi-calendar-check',  type:'date'  },
        { key:'closingDateInput', label:'Closing Date',   icon:'bi-calendar-x',      type:'date'  },
        { key:'classTeacherInput',label:'Class Teacher',  icon:'bi-person-badge',    type:'text'  },
        { key:'headmasterInput',  label:'Head of School', icon:'bi-person-workspace',type:'text'  },
        { key:'requirement1',     label:'Requirement 1',  icon:'bi-clipboard-check', type:'text'  },
        { key:'requirement2',     label:'Requirement 2',  icon:'bi-clipboard-check', type:'text'  },
        { key:'requirement3',     label:'Requirement 3',  icon:'bi-clipboard-check', type:'text'  },
    ];

    fieldDefs.forEach((f, i) => {
        const cell = document.createElement('div');
        cell.style.cssText = `border-right:1px solid #e0e0e0;border-bottom:1px solid #e0e0e0;padding:7px 10px;`;
        cell.innerHTML = `
            <div style="font-size:10px;color:#888;font-weight:600;margin-bottom:3px;display:flex;align-items:center;gap:4px;">
                <i class="bi ${f.icon}" style="color:#1a3a5c;"></i>${f.label}
            </div>
            <input type="${f.type}" data-field="${f.key}"
                value="${escapeHtml ? escapeHtml(gv(f.key)) : (gv(f.key)||'').replace(/"/g,'&quot;')}"
                style="width:100%;border:none;border-bottom:1.5px solid #ccc;padding:3px 0;font-size:12px;color:#111;outline:none;background:transparent;box-sizing:border-box;"
                placeholder="Enter ${f.label.toLowerCase()}…">`;
        grid.appendChild(cell);
    });

    panel.appendChild(grid);

    // Extra requirements section
    const extraReqSection = document.createElement('div');
    extraReqSection.id = 'axpExtraReqSection';
    extraReqSection.style.cssText = 'border-top:1px solid #e0e0e0;padding:8px 12px;';
    const extraReqTitle = document.createElement('div');
    extraReqTitle.style.cssText = 'font-size:10.5px;font-weight:700;color:#1a3a5c;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;';
    extraReqTitle.innerHTML = `<span><i class="bi bi-list-ul" style="margin-right:5px;"></i>Additional Requirements</span>
        <button id="axpAddReqBtn" style="background:#1a3a5c;color:#fff;border:none;padding:3px 10px;font-size:10.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <i class="bi bi-plus"></i> Add
        </button>`;
    extraReqSection.appendChild(extraReqTitle);

    const extraReqList = document.createElement('div');
    extraReqList.id = 'axpExtraReqList';
    extraReqList.style.cssText = 'display:flex;flex-direction:column;gap:5px;';

    function _addReqRow(val) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;';
        row.innerHTML = `
            <i class="bi bi-dot" style="color:#1a3a5c;font-size:1.1em;flex-shrink:0;"></i>
            <input type="text" data-extrareq="1" value="${val||''}"
                style="flex:1;border:none;border-bottom:1.5px solid #ccc;padding:3px 0;font-size:12px;color:#111;outline:none;background:transparent;"
                placeholder="Enter requirement…">
            <button style="background:none;border:none;color:#b00;cursor:pointer;font-size:14px;padding:0 2px;flex-shrink:0;" title="Remove">
                <i class="bi bi-x-lg"></i>
            </button>`;
        row.querySelector('button').onclick = () => { row.remove(); _autosave(); };
        row.querySelector('input').oninput = _autosave;
        extraReqList.appendChild(row);
    }

    extraReqs.forEach(r => _addReqRow(r));
    extraReqSection.appendChild(extraReqList);
    panel.appendChild(extraReqSection);

    // ── Results Header Lines section ─────────────────────────────────────────
    // Shows 5 default lines (editable). User can add more or delete any line.
    // Each line renders as one centred row in the printed results page header.
    const hdrSection = document.createElement('div');
    hdrSection.style.cssText = 'border-top:1.5px solid #1a3a5c;padding:8px 12px;background:#f7f9fc;';

    const hdrTitle = document.createElement('div');
    hdrTitle.style.cssText = 'font-size:10.5px;font-weight:700;color:#1a3a5c;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;';
    hdrTitle.innerHTML = `
        <span><i class="bi bi-layout-text-window-reverse" style="margin-right:5px;"></i>
            Results Page Header Lines
            <span style="font-weight:400;color:#888;font-size:9px;margin-left:6px;">Each line = one centred row in the printed header. Edit, delete or add.</span>
        </span>
        <button id="axpAddHdrLineBtn" style="background:#1a3a5c;color:#fff;border:none;padding:3px 12px;font-size:10.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <i class="bi bi-plus"></i> Add Line
        </button>`;
    hdrSection.appendChild(hdrTitle);

    const hdrLineList = document.createElement('div');
    hdrLineList.id = 'axpHdrLineList';
    hdrLineList.style.cssText = 'display:flex;flex-direction:column;gap:4px;';

    function _saveHdrLines() {
        const lines = [...hdrLineList.querySelectorAll('[data-hdrline]')]
            .map(i => i.value);
        SchoolInfoStorage.saveHeaderLines(className, lines);
    }

    function _addHdrLine(val, isDefault) {
        const idx = hdrLineList.children.length + 1;
        const row = document.createElement('div');
        row.className = 'axp-hdr-line-row';
        row.style.cssText = 'display:flex;align-items:center;gap:6px;';
        row.innerHTML = `
            <span style="font-size:10px;color:#aaa;width:14px;text-align:right;flex-shrink:0;">${idx}</span>
            <input type="text" data-hdrline="1"
                value="${(val||'').replace(/"/g,'&quot;')}"
                style="flex:1;border:none;border-bottom:1.5px solid ${isDefault?'#1a3a5c':'#ccc'};padding:4px 0;font-size:12px;font-weight:${isDefault?'700':'500'};color:#111;outline:none;background:transparent;letter-spacing:0.3px;"
                placeholder="Enter header line…">
            <button data-delhdr style="background:none;border:none;color:#b00;cursor:pointer;font-size:13px;padding:0 2px;flex-shrink:0;display:inline-flex;align-items:center;" title="Remove this line">
                <i class="bi bi-x-lg"></i>
            </button>`;
        row.querySelector('[data-delhdr]').onclick = () => {
            row.remove();
            // Re-number
            hdrLineList.querySelectorAll('.axp-hdr-line-row').forEach((r,i) => {
                const numSpan = r.querySelector('span');
                if (numSpan) numSpan.textContent = i+1;
            });
            _saveHdrLines();
        };
        row.querySelector('[data-hdrline]').oninput = _saveHdrLines;
        hdrLineList.appendChild(row);
    }

    // Load saved lines or defaults
    const savedLines = SchoolInfoStorage.getHeaderLines(className);
    savedLines.forEach((ln, i) => _addHdrLine(ln, i < 5));

    hdrSection.appendChild(hdrLineList);
    panel.appendChild(hdrSection);

    // Footer bar: status + collapse button
    const footer = document.createElement('div');
    footer.style.cssText = 'border-top:1px solid #e0e0e0;padding:6px 12px;display:flex;align-items:center;justify-content:space-between;background:#fafafa;';
    footer.innerHTML = `
        <span id="axpClassInfoStatus" style="font-size:10.5px;color:#888;"><i class="bi bi-check-circle" style="color:#006400;margin-right:4px;"></i>Auto-saved</span>
        <button id="axpClassInfoToggle" style="background:none;border:1px solid #ccc;padding:3px 10px;font-size:10.5px;cursor:pointer;color:#555;display:inline-flex;align-items:center;gap:4px;">
            <i class="bi bi-chevron-up"></i> Collapse
        </button>`;
    panel.appendChild(footer);

    container.appendChild(panel);

    // Wire add buttons
    document.getElementById('axpAddReqBtn').onclick = () => { _addReqRow(''); };
    document.getElementById('axpAddHdrLineBtn').onclick = () => { _addHdrLine('', false); };

    // Autosave on all field inputs
    panel.querySelectorAll('input[data-field]').forEach(inp => {
        inp.oninput = () => {
            _autosave();
            const statusEl = document.getElementById('axpClassInfoStatus');
            if (statusEl) statusEl.innerHTML = '<i class="bi bi-check-circle" style="color:#006400;margin-right:4px;"></i>Saved';
        };
    });

    // Collapse toggle
    document.getElementById('axpClassInfoToggle').onclick = () => {
        const isCollapsed = grid.style.display === 'none';
        [grid, extraReqSection, hdrSection].forEach(el => el.style.display = isCollapsed ? '' : 'none');
        const btn = document.getElementById('axpClassInfoToggle');
        btn.innerHTML = isCollapsed
            ? '<i class="bi bi-chevron-up"></i> Collapse'
            : '<i class="bi bi-chevron-down"></i> Expand';
    };
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: School Info Wizard
// Guides user to enter school name, dates, staff, requirements.
// Stored per-class in localStorage via SchoolInfoStorage.
// Triggered by toggleExtraFields() which already exists in File 1's HTML.
// ─────────────────────────────────────────────────────────────────────────────

function toggleExtraFields() {
    const r1 = document.getElementById('moreOptionsRow1');
    const r2 = document.getElementById('moreOptionsRow2');
    if (r1) r1.style.display = 'none';
    if (r2) r2.style.display = 'none';
    openSchoolInfoWizard();
}

function openSchoolInfoWizard() {
    const selectedClass = document.getElementById('classType') ? document.getElementById('classType').value : '';
    const existingData = SchoolInfoStorage.getClassData(selectedClass);
    if (existingData) {
        _showRestorePrompt(selectedClass, existingData);
    } else {
        _startWizard(selectedClass, null);
    }
}

function _showRestorePrompt(className, existingData) {
    const modal = document.createElement('div');
    modal.id = 'axpRestoreModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(6,12,28,0.85);display:flex;justify-content:center;align-items:center;z-index:99999999998;';

    const lastUpdated = new Date(existingData.lastUpdated).toLocaleString();
    const box = document.createElement('div');
    box.className = 'axp-section-card';
    box.style.cssText = 'max-width:480px;width:90%;padding:2em;animation:axpSlideUp 0.3s;';
    box.innerHTML = `
        <div style="text-align:center;margin-bottom:1.5em;">
            <i class="bi bi-database-fill-check" style="font-size:3em;color:var(--axp-primary,#4ecca3);"></i>
            <h3 style="margin:0.5em 0;color:var(--axp-primary,#4ecca3);">Previous Data Found!</h3>
            <p style="color:#aaa;margin:0;">Saved info for <strong style="color:#fff;">${className}</strong></p>
            <p style="color:#666;font-size:0.85em;margin-top:0.5em;"><i class="bi bi-clock-history"></i> ${lastUpdated}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.8em;">
            <button id="_axpRestoreEdit" class="axp-btn-secondary" style="display:flex;align-items:center;justify-content:center;gap:0.6em;padding:0.9em;">
                <i class="bi bi-pencil-square"></i> Restore &amp; Edit
            </button>
            <button id="_axpRestorePreview" class="axp-btn-primary" style="display:flex;align-items:center;justify-content:center;gap:0.6em;padding:0.9em;">
                <i class="bi bi-eye-fill"></i> Proceed to Preview
            </button>
            <button id="_axpRestoreFresh" class="axp-btn-secondary" style="display:flex;align-items:center;justify-content:center;gap:0.6em;padding:0.7em;opacity:0.7;">
                <i class="bi bi-arrow-clockwise"></i> Start Fresh
            </button>
            <button id="_axpRestoreCancel" style="background:none;border:none;color:#555;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5em;padding:0.5em;">
                <i class="bi bi-x-circle"></i> Cancel
            </button>
        </div>`;
    modal.appendChild(box);
    document.body.appendChild(modal);

    box.querySelector('#_axpRestoreEdit').onclick = () => { modal.remove(); _startWizard(className, SchoolInfoStorage.getClassData(className)); };
    box.querySelector('#_axpRestorePreview').onclick = () => { modal.remove(); _showPreviewScreen(className, SchoolInfoStorage.getClassData(className)); };
    box.querySelector('#_axpRestoreFresh').onclick = async () => {
        if (await _axpPopup.confirm(`Clear all saved data for ${className} and start fresh?`, 'Clear Data')) {
            SchoolInfoStorage.deleteClassData(className);
            modal.remove();
            _axpToast('Previous data cleared.', 'info');
            setTimeout(() => _startWizard(className, null), 400);
        }
    };
    box.querySelector('#_axpRestoreCancel').onclick = () => modal.remove();
}

function _startWizard(className, existingData) {
    const modal = document.createElement('div');
    modal.id = 'axpWizardModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(6,12,28,0.85);display:flex;justify-content:center;align-items:center;z-index:99999999998;';

    const box = document.createElement('div');
    box.className = 'axp-section-card';
    box.style.cssText = 'max-width:500px;width:90%;max-height:90vh;overflow-y:auto;padding:2em;animation:axpSlideUp 0.3s;';

    const steps = [
        {
            title: 'School Basic Information',
            icon: 'bi-building',
            description: "Let's start with your school's basic details",
            fields: [

            ]
        },
        {
            title: 'Term Dates',
            icon: 'bi-calendar3',
            description: 'Enter the important dates for this term',
            fields: [
                { id: 'openingDateInput', label: 'Opening Date',  type: 'date', placeholder: '', icon: 'bi-calendar-check' },
                { id: 'monthInput',       label: 'Month',         type: 'text', placeholder: 'e.g. May 2025', icon: 'bi-calendar-month' },
                { id: 'closingDateInput', label: 'Closing Date',  type: 'date', placeholder: '', icon: 'bi-calendar-x' }
            ]
        },
        {
            title: 'Staff Information',
            icon: 'bi-people',
            description: 'Who are the key staff members?',
            fields: [
                { id: 'classTeacherInput', label: 'Class Teacher', type: 'text', placeholder: 'e.g. Mr. John M.', icon: 'bi-person-badge' },
                { id: 'headmasterInput',   label: 'Headmaster',    type: 'text', placeholder: 'e.g. Mrs. Grace N.', icon: 'bi-person-workspace' }
            ]
        },
        {
            title: 'Requirements (Optional)',
            icon: 'bi-clipboard-check',
            description: 'List any requirements for the next term',
            fields: [
                { id: 'requirement1', label: 'Requirement 1', type: 'text', placeholder: 'Optional', icon: 'bi-clipboard-check' },
                { id: 'requirement2', label: 'Requirement 2', type: 'text', placeholder: 'Optional', icon: 'bi-clipboard-check' },
                { id: 'requirement3', label: 'Requirement 3', type: 'text', placeholder: 'Optional', icon: 'bi-clipboard-check' }
            ]
        }
    ];

    let currentStep = 0;
    const collected = {};

    // Pre-fill from existingData or live DOM
    steps.forEach(s => s.fields.forEach(f => {
        collected[f.id] = (existingData && existingData[f.id])
            ? existingData[f.id]
            : (document.getElementById(f.id) ? document.getElementById(f.id).value : '');
    }));

    function saveStep() {
        steps[currentStep].fields.forEach(f => {
            const el = box.querySelector(`#_wiz_${f.id}`);
            if (el) collected[f.id] = el.value;
        });
    }

    function render() {
        const step = steps[currentStep];
        const progress = ((currentStep + 1) / steps.length) * 100;
        box.innerHTML = `
            <div style="margin-bottom:1.5em;">
                <div class="axp-form-row" style="justify-content:space-between;align-items:center;margin-bottom:1em;">
                    <h3 style="margin:0;color:var(--axp-primary,#4ecca3);display:flex;align-items:center;gap:0.5em;">
                        <i class="bi ${step.icon}"></i> ${step.title}
                    </h3>
                    <span class="axp-badge">${currentStep + 1}/${steps.length}</span>
                </div>
                <div style="background:#0d0d1a;height:6px;border-radius:3px;overflow:hidden;">
                    <div style="background:var(--axp-primary,#4ecca3);height:100%;width:${progress}%;transition:width 0.3s;"></div>
                </div>
                <p style="color:#888;margin-top:0.8em;font-size:0.9em;display:flex;align-items:center;gap:0.4em;">
                    <i class="bi bi-lightbulb" style="color:var(--axp-primary,#4ecca3);"></i> ${step.description}
                </p>
                ${existingData ? '<p class="axp-alert" style="font-size:0.85em;margin-top:0.5em;padding:0.5em 0.8em;"><i class="bi bi-info-circle"></i> Previous data restored — you can modify it</p>' : ''}
            </div>
            <div style="margin-bottom:1.5em;">
                ${step.fields.map(f => `
                    <div class="axp-field-group">
                        <label style="display:flex;align-items:center;gap:0.4em;color:#ccc;font-weight:500;margin-bottom:0.4em;">
                            <i class="bi ${f.icon}" style="color:var(--axp-primary,#4ecca3);"></i> ${f.label}
                        </label>
                        <input type="${f.type}" id="_wiz_${f.id}" class="axp-input"
                            placeholder="${f.placeholder || ''}"
                            value="${(collected[f.id] || '').replace(/"/g, '&quot;')}">
                    </div>`).join('')}
            </div>
            <div class="axp-form-row" style="gap:0.8em;">
                <button id="_wizPrev" class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;${currentStep === 0 ? 'visibility:hidden;' : ''}">
                    <i class="bi bi-arrow-left"></i> Previous
                </button>
                <button id="_wizNext" class="axp-btn-primary" style="flex:1;display:flex;align-items:center;justify-content:center;gap:0.4em;">
                    ${currentStep === steps.length - 1
                        ? '<i class="bi bi-eye-fill"></i> Preview &amp; Save'
                        : 'Next <i class="bi bi-arrow-right"></i>'}
                </button>
            </div>
            <button id="_wizCancel" style="margin-top:0.8em;width:100%;background:none;border:1px solid #2a2a3e;color:#555;border-radius:6px;cursor:pointer;padding:0.6em;display:flex;align-items:center;justify-content:center;gap:0.4em;">
                <i class="bi bi-x-circle"></i> Cancel
            </button>`;

        box.querySelector('#_wizPrev').onclick = () => { saveStep(); if (currentStep > 0) { currentStep--; render(); } };
        box.querySelector('#_wizNext').onclick = () => {
            saveStep();
            if (currentStep < steps.length - 1) {
                _axpToast(`✓ ${steps[currentStep].title} saved`, 'success');
                currentStep++;
                render();
            } else {
                // Final step — collect all, mirror to DOM, save, show preview
                const allData = {};
                steps.forEach(s => s.fields.forEach(f => { allData[f.id] = collected[f.id] || ''; }));
                Object.entries(allData).forEach(([id, val]) => {
                    const el = document.getElementById(id);
                    if (el) el.value = val;
                });
                SchoolInfoStorage.saveClassData(className, allData);
                modal.remove();
                _axpToast('✓ School info saved!', 'success');
                setTimeout(() => _showPreviewScreen(className, allData), 400);
            }
        };
        box.querySelector('#_wizCancel').onclick = () => modal.remove();
    }

    modal.appendChild(box);
    document.body.appendChild(modal);
    render();
}

function _showPreviewScreen(className, data) {
    const modal = document.createElement('div');
    modal.id = 'axpPreviewModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(6,12,28,0.85);display:flex;justify-content:center;align-items:center;z-index:99999999998;';

    const box = document.createElement('div');
    box.className = 'axp-section-card';
    box.style.cssText = 'max-width:560px;width:90%;max-height:90vh;overflow-y:auto;padding:2em;animation:axpSlideUp 0.3s;';

    const rows = Object.entries(data)
        .filter(([k, v]) => v && k !== 'lastUpdated' && k !== 'className')
        .map(([k, v]) => {
            const label = k.replace(/Input$/, '').replace(/([A-Z])/g, ' $1').trim();
            return `<div style="margin-bottom:0.9em;padding-bottom:0.8em;border-bottom:1px solid #2a2a3e;">
                <div style="font-size:0.82em;color:#666;margin-bottom:0.2em;text-transform:capitalize;">${label}</div>
                <div style="font-weight:500;color:#fff;">${escapeHtml(v)}</div>
            </div>`;
        }).join('');

    box.innerHTML = `
        <div style="text-align:center;margin-bottom:1.5em;">
            <i class="bi bi-check-circle-fill" style="font-size:3em;color:var(--axp-primary,#4ecca3);"></i>
            <h3 style="margin:0.5em 0;color:var(--axp-primary,#4ecca3);">Information Preview</h3>
            <p style="color:#aaa;margin:0;">Review your <strong style="color:#fff;">${escapeHtml(className)}</strong> info</p>
        </div>
        <div style="background:#0d0d1a;border-radius:8px;padding:1.2em;margin-bottom:1.5em;">${rows}</div>
        <div style="display:flex;flex-direction:column;gap:0.8em;">
            <button id="_prevOk" class="axp-btn-primary" style="display:flex;align-items:center;justify-content:center;gap:0.6em;padding:0.9em;">
                <i class="bi bi-check-circle-fill"></i> Looks Good! Continue
            </button>
            <button id="_prevEdit" class="axp-btn-secondary" style="display:flex;align-items:center;justify-content:center;gap:0.6em;padding:0.8em;">
                <i class="bi bi-pencil-square"></i> Edit Information
            </button>
        </div>`;

    modal.appendChild(box);
    document.body.appendChild(modal);

    box.querySelector('#_prevOk').onclick = () => modal.remove();
    box.querySelector('#_prevEdit').onclick = () => {
        modal.remove();
        _startWizard(className, SchoolInfoStorage.getClassData(className));
    };
}

// Auto-populate DOM fields when class selector changes
function _axpAutoLoadClassData() {
    const classSelect = document.getElementById('classType');
    if (!classSelect) return;

    const FIELD_IDS = [
        'openingDateInput',
        'monthInput', 'closingDateInput', 'classTeacherInput',
        'headmasterInput', 'requirement1', 'requirement2', 'requirement3'
    ];

    function populate(className) {
        const saved = SchoolInfoStorage.getClassData(className);
        FIELD_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = (saved && saved[id]) ? saved[id] : '';
        });
    }

    classSelect.addEventListener('change', function() { populate(this.value); });
    populate(classSelect.value);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _axpAutoLoadClassData);
} else {
    _axpAutoLoadClassData();
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: School Logo Upload + Crop
// Self-contained IIFE. Uses File 1's _axpToast() and axp-* CSS classes.
// ─────────────────────────────────────────────────────────────────────────────

(function _axpLogoSystem() {
    const LOGO_KEY = 'school_logo_data';
    const LOGO_W = 150, LOGO_H = 150;
    let _cropData = null;

    function _injectStyles() {
        if (document.getElementById('axp-logo-styles')) return;
        const s = document.createElement('style');
        s.id = 'axp-logo-styles';
        s.textContent = `
            .axp-logo-upload-area {
                border: 2px dashed var(--axp-primary, #4ecca3);
                border-radius: 8px; padding: 2em; text-align: center;
                background: #0d0d1a; cursor: pointer; transition: background 0.3s;
            }
            .axp-logo-upload-area:hover { background: rgba(78,204,163,0.05); }
            .axp-logo-upload-area input[type="file"] { display: none; }
            .axp-logo-crop-wrap { display: none; margin-bottom: 1.2em; }
            .axp-logo-crop-wrap.active { display: block; }
            .axp-logo-crop-canvas { max-width: 100%; display: block; margin: 0 auto; }
            .axp-logo-preview-card {
                background: #1a1a2e; border: 1px solid rgba(78,204,163,0.2);
                border-radius: 8px; padding: 1em; display: inline-block;
            }
            .axp-logo-preview-img {
                max-width: 150px; max-height: 150px;
                border: 2px solid rgba(78,204,163,0.3); border-radius: 8px;
                display: block; margin-bottom: 0.5em;
            }
            .axp-logo-preview-actions { display: flex; gap: 0.5em; justify-content: center; }
            .axp-logo-view-overlay {
                display: none; position: fixed; z-index: 10001; left: 0; top: 0;
                width: 100%; height: 100%; background: rgba(0,0,0,0.95);
                justify-content: center; align-items: center;
            }
            .axp-logo-view-overlay.active { display: flex; }
            .axp-logo-view-img {
                max-width: 90%; max-height: 80vh;
                border: 3px solid var(--axp-primary, #4ecca3); border-radius: 8px;
            }
            .axp-logo-view-close {
                position: absolute; top: 20px; right: 30px;
                color: var(--axp-primary, #4ecca3); font-size: 2.5em; cursor: pointer;
            }
        `;
        document.head.appendChild(s);
    }

    function _buildModals() {
        // Upload modal
        const m = document.createElement('div');
        m.id = 'axpLogoModal';
        m.className = 'axp-section-card';
        m.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(6,12,28,0.85);z-index:10000;justify-content:center;align-items:center;';
        m.innerHTML = `
            <div class="axp-section-card" style="max-width:540px;width:90%;max-height:90vh;overflow-y:auto;padding:2em;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2em;border-bottom:1px solid #2a2a3e;padding-bottom:0.8em;">
                    <h3 class="axp-section-title" style="margin:0;display:flex;align-items:center;gap:0.5em;">
                        <i class="bi bi-image"></i> <span id="axpLogoModalTitle">Upload School Logo</span>
                    </h3>
                    <button id="axpLogoCloseX" style="background:none;border:none;color:#666;font-size:1.4em;cursor:pointer;">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="axp-alert" style="margin-bottom:1em;display:flex;gap:0.5em;align-items:flex-start;">
                    <i class="bi bi-rulers"></i>
                    <div><strong>Required size:</strong> ${LOGO_W}×${LOGO_H}px — upload any image and it will be auto-cropped.</div>
                </div>
                <div class="axp-logo-upload-area" id="axpLogoUploadArea">
                    <i class="bi bi-camera" style="font-size:3em;color:var(--axp-primary,#4ecca3);display:block;margin-bottom:0.5em;"></i>
                    <p style="margin:0;"><strong>Click to upload</strong> or drag and drop</p>
                    <p style="font-size:0.85em;color:#666;margin:0.3em 0 0;">JPG, PNG, GIF supported</p>
                    <input type="file" id="axpLogoFileInput" accept="image/*">
                </div>
                <div class="axp-logo-crop-wrap" id="axpLogoCropWrap">
                    <canvas id="axpLogoCropCanvas" class="axp-logo-crop-canvas"></canvas>
                </div>
                <div class="axp-form-row" style="justify-content:flex-end;gap:0.8em;margin-top:1.2em;">
                    <button id="axpLogoCancelBtn" class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;">
                        <i class="bi bi-x-circle"></i> Cancel
                    </button>
                    <button id="axpLogoSaveBtn" class="axp-btn-primary" disabled style="display:flex;align-items:center;gap:0.4em;">
                        <i class="bi bi-check-circle"></i> Save Logo
                    </button>
                </div>
            </div>`;
        m.style.display = 'none';
        document.body.appendChild(m);

        // View overlay
        const v = document.createElement('div');
        v.id = 'axpLogoViewOverlay';
        v.className = 'axp-logo-view-overlay';
        v.innerHTML = `
            <span class="axp-logo-view-close" id="axpLogoViewClose"><i class="bi bi-x-lg"></i></span>
            <img id="axpLogoViewImg" class="axp-logo-view-img" src="" alt="School Logo">`;
        document.body.appendChild(v);
    }

    function _openModal() {
        const m = document.getElementById('axpLogoModal');
        m.style.display = 'flex';
        document.getElementById('axpLogoUploadArea').style.display = 'block';
        document.getElementById('axpLogoCropWrap').classList.remove('active');
        document.getElementById('axpLogoSaveBtn').disabled = true;
        _cropData = null;
    }
    window.openLogoModal = _openModal;

    window.getSchoolLogo = () => { try { return localStorage.getItem(LOGO_KEY); } catch (e) { return null; } };

    function _initCrop(imageData) {
        const canvas = document.getElementById('axpLogoCropCanvas');
        const ctx = canvas.getContext('2d');
        document.getElementById('axpLogoUploadArea').style.display = 'none';
        document.getElementById('axpLogoCropWrap').classList.add('active');
        document.getElementById('axpLogoSaveBtn').disabled = false;

        const img = new Image();
        img.onload = function() {
            const scale = Math.min(500 / img.width, 500 / img.height, 1);
            const dW = img.width * scale, dH = img.height * scale;
            canvas.width = dW; canvas.height = dH;
            const cs = Math.min(dW, dH);
            const cx = (dW - cs) / 2, cy = (dH - cs) / 2;
            ctx.drawImage(img, 0, 0, dW, dH);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, dW, dH);
            ctx.clearRect(cx, cy, cs, cs);
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, dW, dH);
            ctx.strokeStyle = 'var(--axp-primary, #4ecca3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx, cy, cs, cs);
            _cropData = { img, dW, dH, cx, cy, cs };
        };
        img.src = imageData;
    }

    function _cropAndResize() {
        if (!_cropData) return null;
        const { img, dW, dH, cx, cy, cs } = _cropData;
        const tmp = document.createElement('canvas');
        tmp.width = LOGO_W; tmp.height = LOGO_H;
        const tc = tmp.getContext('2d');
        tc.drawImage(img, cx * (img.width / dW), cy * (img.height / dH),
            cs * (img.width / dW), cs * (img.height / dH), 0, 0, LOGO_W, LOGO_H);
        return tmp.toDataURL('image/png');
    }

    function _updatePreview() {
        const saved = localStorage.getItem(LOGO_KEY);
        const container = document.getElementById('axpLogoPreviewContainer');
        const uploadBtn = document.getElementById('axpLogoUploadBtn');
        if (!container) return;
        if (saved) {
            if (uploadBtn) uploadBtn.style.display = 'none';
            container.innerHTML = `
                <div class="axp-logo-preview-card">
                    <img src="${saved}" class="axp-logo-preview-img" alt="School Logo">
                    <div class="axp-logo-preview-actions">
                        <button id="_logoView" class="axp-btn-secondary" style="padding:0.4em 0.8em;font-size:0.85em;display:flex;align-items:center;gap:0.3em;">
                            <i class="bi bi-eye"></i> View
                        </button>
                        <button id="_logoEdit" class="axp-btn-secondary" style="padding:0.4em 0.8em;font-size:0.85em;display:flex;align-items:center;gap:0.3em;">
                            <i class="bi bi-pencil-square"></i> Edit
                        </button>
                        <button id="_logoDel" class="axp-btn-secondary" style="padding:0.4em 0.8em;font-size:0.85em;display:flex;align-items:center;gap:0.3em;color:#ef4444;">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </div>`;
            container.querySelector('#_logoView').onclick = () => {
                document.getElementById('axpLogoViewImg').src = saved;
                document.getElementById('axpLogoViewOverlay').classList.add('active');
            };
            container.querySelector('#_logoEdit').onclick = _openModal;
            container.querySelector('#_logoDel').onclick = async () => {
                if (await _axpPopup.confirm('Delete the school logo?', 'Delete Logo')) {
                    localStorage.removeItem(LOGO_KEY);
                    if (uploadBtn) uploadBtn.style.display = 'inline-flex';
                    container.innerHTML = '';
                    _axpToast('Logo deleted', 'info');
                }
            };
        } else {
            if (uploadBtn) uploadBtn.style.display = 'inline-flex';
            container.innerHTML = '';
        }
    }

    function _init() {
        _injectStyles();
        _buildModals();

        // Inject upload button after the first axp-form-row in the results section
        const anchor = document.querySelector('.axp-form-row, .form-row');
        if (anchor && !document.getElementById('axpLogoUploadBtn')) {
            const wrap = document.createElement('div');
            wrap.style.marginTop = '1em';
            wrap.innerHTML = `
                <button type="button" id="axpLogoUploadBtn" class="axp-btn-secondary"
                    style="display:inline-flex;align-items:center;gap:0.5em;" onclick="openLogoModal()">
                    <i class="bi bi-cloud-upload"></i> Upload School Logo
                </button>
                <div id="axpLogoPreviewContainer" style="margin-top:0.8em;"></div>`;
            anchor.insertAdjacentElement('afterend', wrap);
        }

        _updatePreview();

        const fileInput = document.getElementById('axpLogoFileInput');
        const uploadArea = document.getElementById('axpLogoUploadArea');

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => _initCrop(ev.target.result);
            reader.readAsDataURL(file);
        });
        uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.background = 'rgba(78,204,163,0.08)'; });
        uploadArea.addEventListener('dragleave', () => { uploadArea.style.background = '#0d0d1a'; });
        uploadArea.addEventListener('drop', e => {
            e.preventDefault(); uploadArea.style.background = '#0d0d1a';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader(); reader.onload = ev => _initCrop(ev.target.result); reader.readAsDataURL(file);
            }
        });

        document.getElementById('axpLogoSaveBtn').addEventListener('click', () => {
            const cropped = _cropAndResize();
            if (!cropped) { _axpToast('Please select an image first', 'error'); return; }
            try {
                localStorage.setItem(LOGO_KEY, cropped);
                document.getElementById('axpLogoModal').style.display = 'none';
                _updatePreview();
                _axpToast('Logo saved!', 'success');
            } catch (e) { _axpToast('Failed to save — image may be too large', 'error'); }
        });

        const closeModal = () => { document.getElementById('axpLogoModal').style.display = 'none'; };
        document.getElementById('axpLogoCloseX').onclick = closeModal;
        document.getElementById('axpLogoCancelBtn').onclick = closeModal;
        document.getElementById('axpLogoModal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
        document.getElementById('axpLogoViewClose').onclick = () => document.getElementById('axpLogoViewOverlay').classList.remove('active');
        document.getElementById('axpLogoViewOverlay').addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', _init); }
    else { _init(); }
})();


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: Excel Export
// Uses File 1's XLSX library (already loaded in the page).
// Uses File 1's window.currentSchoolData for school index number.
// ─────────────────────────────────────────────────────────────────────────────

async function createExcelFile(students, examType, selectedClass) {
    try {
        if (!students || !students.length) { _axpToast('No student data to export', 'warning'); return; }

        const allSubjects = new Set();
        students.forEach(s => { if (s.scores) Object.keys(s.scores).forEach(sub => allSubjects.add(sub)); });
        const subjectsList = Array.from(allSubjects).sort();

        const headers = ['S/N', 'Student Name', 'Gender', ...subjectsList];
        const rows = students.map((s, i) => {
            const candNum = window.currentSchoolData?.indexNumber
                ? `${window.currentSchoolData.indexNumber}-${i + 1}` : i + 1;
            const row = [candNum, s.name || `Student ${i + 1}`, s.gender || '-'];
            subjectsList.forEach(sub => {
                const sd = s.scores && s.scores[sub];
                row.push(sd && sd.mark != null ? sd.mark : 'X');
            });
            return row;
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        ws['!cols'] = [{ wch: 6 }, { wch: 40 }, { wch: 10 }, ...subjectsList.map(() => ({ wch: 12 }))];

        // Header row style
        for (let c = 0; c < headers.length; c++) {
            const cell = XLSX.utils.encode_cell({ r: 0, c });
            if (!ws[cell]) ws[cell] = {};
            ws[cell].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '0D6E5E' } }, alignment: { horizontal: 'center' } };
        }
        const colColors = ['E8F4FD', 'F0F8E8', 'FFF2E8', 'F8E8F8', 'E8F8F8', 'F8F8E8'];
        for (let r = 1; r <= rows.length; r++) {
            for (let c = 0; c < headers.length; c++) {
                const cell = XLSX.utils.encode_cell({ r, c });
                if (!ws[cell]) ws[cell] = {};
                ws[cell].s = {
                    alignment: { horizontal: c === 1 ? 'left' : 'center', vertical: 'center' },
                    fill: { fgColor: { rgb: colColors[c % colColors.length] } }
                };
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, `${examType || 'Exam'} Results`);
        XLSX.writeFile(wb, `${selectedClass || 'Class'}_${examType || 'Exam'}_Results_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
        console.error('[AXP] Excel export error:', e);
        _axpToast('Error creating Excel file', 'error');
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4b: Student Data Normalizer
//
// PURPOSE:
//   The server sends student records that may already include pre-computed
//   point, division, and per-subject grade values.  This function PRESERVES
//   those server values and only fills in missing fields as a fallback.
//
//   Priority order (highest → lowest):
//     1. Server-sent value  (s.point, s.division, sc.grade)   ← ALWAYS kept
//     2. Locally derived    (only when the server field is absent/null/empty)
//
//   The ONLY unconditional change is uppercasing student names for display
//   consistency.
//
// Server record shape (known variants):
//   { name, gender, point, division, scores: { SUBJECT: { mark, grade } } }
//   { name, gender, aggregate, division, scores: { SUBJECT: { mark, grade } } }
//   { name, gender, scores: { SUBJECT: { mark } } }   ← marks-only fallback
// ─────────────────────────────────────────────────────────────────────────────

function _axpNormalizeStudents(students) {
    if (!Array.isArray(students)) return students;

    // ── Exact mirrors of server-side functions ─────────────────────────────

    // Server: gradeAndPoint(mark)
    function _gradeAndPoint(mark) {
        const m = parseInt(mark, 10);
        if (m >= 75) return { grade:'A', point:1 };
        if (m >= 65) return { grade:'B', point:2 };
        if (m >= 45) return { grade:'C', point:3 };
        if (m >= 30) return { grade:'D', point:4 };
        return { grade:'F', point:5 };
    }

    // Server: calcDivision(total)
    function _calcDivision(total) {
        const t = Number(total);
        if (t <= 17) return 'I';
        if (t <= 21) return 'II';
        if (t <= 25) return 'III';
        if (t <= 33) return 'IV';
        return 'O';
    }

    // Server: calculateGradeScore(scores)
    function _calcGradeScore(scores) {
        const w = { A:5, B:4, C:3, D:2, F:1 };
        let s = 0;
        for (const sub in scores) s += w[(scores[sub]||{}).grade] || 0;
        return s;
    }

    // Server: sortAndAssignPositions(results)
    function _assignPositions(results) {
        const sorted = results.slice().sort((a, b) => {
            const pa = typeof a.point === 'number' ? a.point : Infinity;
            const pb = typeof b.point === 'number' ? b.point : Infinity;
            if (pa !== pb) return pa - pb;
            return _calcGradeScore(b.scores) - _calcGradeScore(a.scores);
        });
        let position = 0, lastPoint = null, lastGS = null, lastPos = 0;
        sorted.forEach(s => {
            if (s.division === 'ABS' || s.division === 'INC') { s.position = ''; return; }
            const cp = typeof s.point === 'number' ? s.point : Infinity;
            const cg = _calcGradeScore(s.scores);
            if (cp === lastPoint && cg === lastGS) {
                s.position = lastPos;
            } else {
                position = lastPos + 1;
                s.position = position;
                lastPos = position; lastPoint = cp; lastGS = cg;
            }
        });
        const posMap = {};
        sorted.forEach(s => { posMap[s.name] = s.position; });
        results.forEach(s => { s.position = posMap[s.name] !== undefined ? posMap[s.name] : ''; });
    }

    // ── Normalise each student ─────────────────────────────────────────────
    students.forEach(s => {
        // Ensure scores object
        if (!s.scores || typeof s.scores !== 'object') s.scores = {};

        // ── Accept all server-side point field names ───────────────────────
        const rawPoint = s.point ?? s.points ?? s.aggregate ?? s.aggregates ?? s.total ?? null;
        const hasServerPoint = rawPoint !== null && rawPoint !== '' && rawPoint !== undefined;

        // ── Accept server division (normalise format) ──────────────────────
        const rawDiv = s.division ?? s.div ?? null;
        const hasServerDiv = rawDiv !== null && String(rawDiv).trim() !== '';

        if (hasServerPoint && hasServerDiv) {
            // ── Server sent both point and division — trust completely ──────
            // Normalise point to Number (but keep 'X'/'-' strings for ABS/INC)
            s.point    = (rawPoint === 'X' || rawPoint === '-') ? rawPoint : Number(rawPoint);
            // Normalise division string format
            s.division = String(rawDiv).trim()
                .replace(/^div(ision)?\s*/i, '')
                .replace(/^(\d)$/, n => ({'1':'I','2':'II','3':'III','4':'IV'}[n] || n))
                .toUpperCase();

            // Per-subject: keep server grades; fill only if missing
            Object.values(s.scores).forEach(sc => {
                if (!sc) return;
                if (!sc.grade && sc.mark != null && sc.mark !== '') {
                    sc.grade = _gradeAndPoint(sc.mark).grade;
                }
            });

        } else {
            // ── Fallback: compute exactly as server does ───────────────────

            // Step 1 — grade every subject from raw mark (server: gradeAndPoint)
            const gradePoints = [];
            Object.values(s.scores).forEach(sc => {
                if (!sc || sc.mark == null || sc.mark === '') return;
                const gp = _gradeAndPoint(sc.mark);
                sc.grade = gp.grade;        // fill/overwrite grade
                gradePoints.push(gp.point);
            });

            // Step 2 — best-7 total, division, ABS/INC (server logic exactly)
            gradePoints.sort((a, b) => a - b);
            if (gradePoints.length === 0) {
                s.point    = 'X';
                s.division = 'ABS';
            } else if (gradePoints.length < 7) {
                s.point    = '-';
                s.division = 'INC';
            } else {
                s.point    = gradePoints.slice(0, 7).reduce((a, v) => a + v, 0);
                s.division = _calcDivision(s.point);
            }
        }

        // ── Name: always uppercase ─────────────────────────────────────────
        if (s.name) s.name = s.name.trim().toUpperCase();
    });

    // ── Assign positions exactly as server does ────────────────────────────
    // Only recalculate if server did not already send positions
    const missingPositions = students.some(s => s.position === undefined || s.position === null);
    if (missingPositions) _assignPositions(students);

    return students;
}

// ── jsPDF loader — tries existing globals first, falls back to CDN ────────────
function _axpGetJsPDF() {
    return new Promise((resolve, reject) => {
        // Try all known global locations
        const ctor = (window.jspdf && window.jspdf.jsPDF)
                  || window.jsPDF
                  || (window.jsPDFAPI && window.jsPDFAPI.jsPDF);
        if (ctor) { resolve(ctor); return; }
        // Not found — load from CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            const c = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
            if (c) resolve(c);
            else reject(new Error('jsPDF loaded but constructor not found'));
        };
        script.onerror = () => reject(new Error('Failed to load jsPDF from CDN'));
        document.head.appendChild(script);
    });
}

// ── html2canvas loader ────────────────────────────────────────────────────────
function _axpGetHtml2Canvas() {
    return new Promise((resolve, reject) => {
        if (window.html2canvas) { resolve(window.html2canvas); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => window.html2canvas ? resolve(window.html2canvas) : reject(new Error('html2canvas not found after load'));
        script.onerror = () => reject(new Error('Failed to load html2canvas from CDN'));
        document.head.appendChild(script);
    });
}

// ── Preload PDF libs as soon as this script runs ────────────────────────────────
(function _axpPreloadPdfLibs() {
    // Load both silently in background so they're cached when user clicks Download
    if (!window.jspdf && !window.jsPDF) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.async = true;
        document.head.appendChild(s);
    }
    if (!window.html2canvas) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.async = true;
        document.head.appendChild(s);
    }
})();

// Expose loaders on window so any closure (Blogger, inner functions) can reach them
window._axpGetJsPDF       = _axpGetJsPDF;
window._axpGetHtml2Canvas = _axpGetHtml2Canvas;


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: Main Results Section
// Replaces renderResultsReportsSection() + all _axpRRRender* functions.
// Data is fetched via File 1's _apiGet() using window._axpRRCache as before.
// The section container used is the one File 1 already renders in navigateToSection().
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// AXP POPUP SYSTEM — replaces all alert/prompt/confirm and progress messages
// No border-radius, no animation, no box-shadow, no hover effects.
// Always on top with z-index:99999999999.
// ─────────────────────────────────────────────────────────────────────────────
const _axpPopup = (() => {
    let _overlay = null;

    function _ensureOverlay() {
        if (document.getElementById('_axpPopupOverlay')) return;
        const ov = document.createElement('div');
        ov.id = '_axpPopupOverlay';
        ov.style.cssText = [
            'position:fixed','top:0','left:0','width:100vw','height:100vh',
            'background:rgba(0,0,0,0.55)','z-index:99999999998',
            'display:none','align-items:center','justify-content:center',
            'font-family:Arial,sans-serif'
        ].join(';');
        document.body.appendChild(ov);
        _overlay = ov;
    }

    function _box(content, opts) {
        _ensureOverlay();
        const ov = document.getElementById('_axpPopupOverlay');
        ov.innerHTML = '';
        const w = document.createElement('div');
        w.style.cssText = [
            'background:#fff','color:#000',
            'min-width:320px','max-width:460px','width:90%',
            'padding:0','border:1.5px solid #222',
            'z-index:99999999999','position:relative'
        ].join(';');

        // Header bar
        const hdr = document.createElement('div');
        hdr.style.cssText = `background:${opts.headerBg||'#1a3a5c'};color:#fff;padding:11px 16px;font-size:13px;font-weight:700;letter-spacing:0.4px;display:flex;align-items:center;gap:8px;`;
        hdr.innerHTML = `<i class="bi ${opts.icon||'bi-info-circle'}"></i> ${opts.title||'Notice'}`;
        w.appendChild(hdr);

        // Body
        const body = document.createElement('div');
        body.style.cssText = 'padding:16px 18px;font-size:13px;line-height:1.6;color:#111;';
        body.innerHTML = content;
        w.appendChild(body);

        // Footer buttons
        if (opts.buttons && opts.buttons.length) {
            const foot = document.createElement('div');
            foot.style.cssText = 'padding:10px 18px 14px;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #eee;';
            opts.buttons.forEach(btn => {
                const b = document.createElement('button');
                b.textContent = btn.label;
                b.style.cssText = `background:${btn.bg||'#1a3a5c'};color:${btn.fg||'#fff'};border:1.5px solid ${btn.border||btn.bg||'#1a3a5c'};padding:7px 18px;font-size:12.5px;font-weight:600;cursor:pointer;letter-spacing:0.3px;`;
                b.onmouseenter = null; b.onmouseleave = null; // no hover effects
                b.onclick = () => { _close(); if (btn.cb) btn.cb(); };
                foot.appendChild(b);
            });
            w.appendChild(foot);
        }

        ov.style.display = 'flex';
        ov.appendChild(w);
        _overlay = ov;
    }

    function _close() {
        const ov = document.getElementById('_axpPopupOverlay');
        if (ov) { ov.style.display = 'none'; ov.innerHTML = ''; }
    }

    // Progress popup — no close button, updated via returned handle
    function progress(title, message) {
        _ensureOverlay();
        _box(`<div id="_axpProgressMsg" style="display:flex;gap:10px;align-items:flex-start;">
            <i class="bi bi-hourglass-split" id="_axpProgressIcon" style="font-size:1.4em;color:#1a3a5c;flex-shrink:0;margin-top:1px;"></i>
            <span id="_axpProgressText">${message}</span>
        </div>`, { title, icon:'bi-hourglass-split', headerBg:'#1a3a5c', buttons:[] });
        return {
            update(msg) { const t=document.getElementById('_axpProgressText'); if(t) t.innerHTML=msg; },
            done(msg, delay) {
                const t=document.getElementById('_axpProgressText');
                const ic=document.getElementById('_axpProgressIcon');
                if(t) t.innerHTML=msg||'Done.';
                if(ic){ ic.className='bi bi-check-circle'; ic.style.color='#006400'; }
                setTimeout(_close, delay||1800);
            },
            error(msg) {
                const t=document.getElementById('_axpProgressText');
                const ic=document.getElementById('_axpProgressIcon');
                if(t) t.innerHTML=msg||'An error occurred.';
                if(ic){ ic.className='bi bi-x-circle'; ic.style.color='#c00'; }
                // add close button
                const ov=document.getElementById('_axpPopupOverlay');
                if(ov){
                    const foot=document.createElement('div');
                    foot.style.cssText='padding:8px 18px 12px;display:flex;justify-content:flex-end;border-top:1px solid #eee;';
                    const b=document.createElement('button');
                    b.textContent='Close';
                    b.style.cssText='background:#1a3a5c;color:#fff;border:1.5px solid #1a3a5c;padding:6px 16px;font-size:12px;font-weight:600;cursor:pointer;';
                    b.onclick=_close;
                    foot.appendChild(b);
                    const w=ov.querySelector('div');
                    if(w) w.appendChild(foot);
                }
            },
            close: _close
        };
    }

    // alert() replacement
    function alert(message, type) {
        const map = {
            success:{ bg:'#006400', icon:'bi-check-circle' },
            error:  { bg:'#b00',    icon:'bi-x-circle' },
            warning:{ bg:'#b06000', icon:'bi-exclamation-triangle' },
            info:   { bg:'#1a3a5c', icon:'bi-info-circle' }
        };
        const t = map[type||'info'] || map.info;
        _box(`<p style="margin:0;">${message}</p>`, {
            title: type ? type.charAt(0).toUpperCase()+type.slice(1) : 'Notice',
            icon: t.icon, headerBg: t.bg,
            buttons:[{ label:'OK', bg: t.bg, cb:null }]
        });
    }

    // confirm() replacement — returns a Promise
    function confirm(message, title) {
        return new Promise(resolve => {
            _box(`<p style="margin:0;">${message}</p>`, {
                title: title||'Confirm',
                icon: 'bi-question-circle', headerBg:'#1a3a5c',
                buttons:[
                    { label:'Cancel', bg:'#f5f5f5', fg:'#333', border:'#ccc', cb:()=>resolve(false) },
                    { label:'Confirm', bg:'#1a3a5c', cb:()=>resolve(true) }
                ]
            });
        });
    }

    return { alert, confirm, progress, close:_close };
})();


// Called by navigateToSection() in File 1 — same name as the deleted function
function renderResultsReportsSection(containerEl) {
    // ── Scoped container resolution ──────────────────────────────────────────
    // Priority 1: whatever File 1 passed in directly
    // Priority 2: the dedicated section panel for results-reports
    // Priority 3: the currently *active* section panel (never the whole body)
    // We deliberately avoid generic IDs like mainContent / main-content because
    // those point at the full page wrapper which includes the header and sidebar.
    // navigateToSection() renders into #axpSectionWrapper (already cleared before calling us).
    // We just need to find that wrapper — or whatever container was passed directly.
    const cont = containerEl
        || document.getElementById('axpSectionWrapper')
        || document.querySelector('.dashboard-content')
        || document.getElementById('mainContent')
        || document.getElementById('section-content');

    if (!cont) {
        console.error('[AXP] renderResultsSection: could not find #axpSectionWrapper');
        return;
    }

    const meta = _schoolMeta; // File 1's global
    if (!meta || !meta.classes || !meta.classes.length) {
        cont.innerHTML = `
            <div class="axp-section-card">
                <div class="axp-empty-state">
                    <i class="bi bi-exclamation-circle" style="font-size:2.5em;"></i>
                    <p>No classes configured. Please complete school setup first.</p>
                </div>
            </div>`;
        return;
    }

    // Inject one-time styles
    _axpInjectResultsStyles();

    // Hidden input to hold selected class (set when folder is clicked)
    cont.innerHTML = `
        <div class="axp-section-card">
            <h2 class="axp-section-title"><i class="bi bi-bar-chart-line"></i> Results &amp; Reports</h2>

            <!-- MODERN PILL SELECTORS (no native <select>) -->
            <div id="axpRRControls" style="display:flex;flex-direction:column;gap:10px;margin-bottom:1.4em;">

                <!-- Row 1: Exam type (dynamic pills) -->
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <span style="font-size:11.5px;font-weight:600;color:#555;white-space:nowrap;min-width:88px;"><i class="bi bi-journal-text" style="margin-right:4px;"></i>Exam Type</span>
                    <div id="axpRRExamPills" style="display:flex;flex-wrap:wrap;gap:6px;">
                        <button class="axp-pill" data-group="exam" data-val="" style="background:#f0f0f0;color:#777;border:1.5px solid #ddd;">— Any —</button>
                        ${(meta.examTypes||[]).map(e=>`<button class="axp-pill" data-group="exam" data-val="${escapeHtml(e)}" style="background:#f0f0f0;color:#333;border:1.5px solid #ddd;">${escapeHtml(e)}</button>`).join('')}
                    </div>
                </div>

                <!-- Row 2: Show marks as -->
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <span style="font-size:11.5px;font-weight:600;color:#555;white-space:nowrap;min-width:88px;"><i class="bi bi-list-ol" style="margin-right:4px;"></i>Show As</span>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                        <button class="axp-pill axp-pill--active" data-group="display" data-val="both"  style="">Mark + Grade</button>
                        <button class="axp-pill"                  data-group="display" data-val="raw"   style="">Raw Marks</button>
                        <button class="axp-pill"                  data-group="display" data-val="grade" style="">Grades Only</button>
                    </div>
                </div>

                <!-- Row 3: Position -->
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <span style="font-size:11.5px;font-weight:600;color:#555;white-space:nowrap;min-width:88px;"><i class="bi bi-sort-numeric-down" style="margin-right:4px;"></i>Position</span>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                        <button class="axp-pill axp-pill--active" data-group="pos" data-val="show" style="">Show</button>
                        <button class="axp-pill"                  data-group="pos" data-val="hide" style="">Hide</button>
                    </div>
                </div>

                <!-- Row 4: Template -->
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <span style="font-size:11.5px;font-weight:600;color:#555;white-space:nowrap;min-width:88px;"><i class="bi bi-layout-text-window" style="margin-right:4px;"></i>Template</span>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                        <button class="axp-pill axp-pill--active" data-group="tpl" data-val="A" style="">Template A — Standard</button>
                        <button class="axp-pill"                  data-group="tpl" data-val="B" style="">Template B — Grid</button>
                    </div>
                </div>

            </div>

            <!-- Hidden value holders (read by the rest of the JS via .value) -->
            <input type="hidden" id="axpRRExamSel"      value="">
            <input type="hidden" id="axpRRDisplaySel"   value="both">
            <input type="hidden" id="axpRRPosSel"       value="show">
            <input type="hidden" id="axpRRResultTplSel" value="A">

            <!-- HIDDEN class value holder (updated when folder is clicked) -->
            <input type="hidden" id="axpRRClassSel" value="">

            <!-- CLASS FOLDER GRID -->
            <div style="margin-bottom:1.2em;">
                <p style="font-size:0.85em;color:#888;margin-bottom:0.6em;"><i class="bi bi-folder2-open"></i> Click a class folder to load its results:</p>
                <div id="axpRRFolderGrid" style="display:flex;flex-wrap:wrap;gap:0.7em;">
                    ${meta.classes.map(c => `
                    <button class="axp-rr-folder-btn" data-class="${escapeHtml(c)}"
                        style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 16px;
                               border:2px solid #dee2e6;border-radius:8px;background:#fff;cursor:pointer;
                               min-width:90px;max-width:120px;transition:all 0.2s;font-size:0.82em;color:#333;">
                        <i class="bi bi-folder2" style="font-size:1.8em;color:#f5a623;"></i>
                        <span style="text-align:center;font-weight:600;word-break:break-word;">${escapeHtml(c)}</span>
                    </button>`).join('')}
                </div>
            </div>

            <div id="axpRRSelectedBanner" style="display:none;margin-bottom:1em;padding:7px 12px;background:#e8f4fd;border:1px solid #b3d7f5;border-radius:6px;font-size:0.88em;color:#0d6efd;display:none;align-items:center;gap:0.5em;">
                <i class="bi bi-folder2-open"></i>
                <span id="axpRRSelectedLabel">No class selected</span>
                <button id="axpRRRefreshBtn" class="axp-btn-secondary" style="margin-left:auto;padding:3px 10px;font-size:0.82em;display:inline-flex;align-items:center;gap:0.4em;">
                    <i class="bi bi-arrow-clockwise"></i> Refresh
                </button>
            </div>

            <!-- Tab bar (hidden until data loads) -->
            <div id="axpRRTabs" style="display:none;margin-bottom:0;border-bottom:2px solid #dee2e6;overflow-x:auto;white-space:nowrap;">
                ${['Results','Student Report','Analysis','Top 10','Least 10','General','Subject Wise','Subject Ranking']
                    .map((t, i) => `<button class="axp-rr-tab ${i===0?'axp-rr-tab--active':''}"
                        data-tab="${t.toLowerCase().replace(/ /g,'-')}"
                        style="display:inline-flex;align-items:center;gap:0.4em;">
                        <i class="bi ${_axpRRTabIcon(t)}"></i> ${t}
                    </button>`).join('')}
            </div>

            <!-- Contextual action toolbar — shown/hidden per active tab -->
            <div id="axpRRActions" style="display:none;margin:0 0 1em;padding:6px 8px;background:#f8f9fa;border:1px solid #dee2e6;border-top:none;border-radius:0 0 4px 4px;flex-wrap:wrap;gap:0.5em;align-items:center;">
                <!-- Results-tab actions -->
                <span class="axp-act-results" style="display:none;gap:0.4em;flex-wrap:wrap;">
                    <button id="axpRRExcelBtn" class="axp-btn-secondary" style="display:inline-flex;align-items:center;gap:0.4em;font-size:0.85em;padding:5px 10px;">
                        <i class="bi bi-file-earmark-excel"></i> Export Excel
                    </button>
                    <button id="axpRRPdfBtn" class="axp-btn-secondary" style="display:inline-flex;align-items:center;gap:0.4em;font-size:0.85em;padding:5px 10px;">
                        <i class="bi bi-file-earmark-pdf"></i> Download PDF
                    </button>
                    <button id="axpRRPreviewBtn" class="axp-btn-secondary" style="display:inline-flex;align-items:center;gap:0.4em;font-size:0.85em;padding:5px 10px;">
                        <i class="bi bi-eye"></i> Preview PDF
                    </button>
                </span>
                <!-- Analysis/Ranking tabs actions -->
                <span class="axp-act-analysis" style="display:none;gap:0.4em;flex-wrap:wrap;">
                    <button id="axpRRAnalysisPdfBtn" class="axp-btn-secondary" style="display:inline-flex;align-items:center;gap:0.4em;font-size:0.85em;padding:5px 10px;">
                        <i class="bi bi-file-earmark-pdf"></i> Download PDF
                    </button>
                    <button id="axpRRTop10PdfBtn" class="axp-btn-secondary axp-tab-btn" data-for="top-10" style="display:none;align-items:center;gap:0.4em;font-size:0.85em;padding:5px 10px;">
                        <i class="bi bi-file-earmark-pdf"></i> Download Top 10 PDF
                    </button>
                    <button id="axpRRLeast10PdfBtn" class="axp-btn-secondary axp-tab-btn" data-for="least-10" style="display:none;align-items:center;gap:0.4em;font-size:0.85em;padding:5px 10px;">
                        <i class="bi bi-file-earmark-pdf"></i> Download Least 10 PDF
                    </button>
                    <button id="axpRRGeneralPdfBtn" class="axp-btn-secondary axp-tab-btn" data-for="general" style="display:none;align-items:center;gap:0.4em;font-size:0.85em;padding:5px 10px;">
                        <i class="bi bi-file-earmark-pdf"></i> Download General PDF
                    </button>
                    <button id="axpRRSubjWisePdfBtn" class="axp-btn-secondary axp-tab-btn" data-for="subject-wise" style="display:none;align-items:center;gap:0.4em;font-size:0.85em;padding:5px 10px;">
                        <i class="bi bi-file-earmark-pdf"></i> Download Subject PDF
                    </button>
                    <button id="axpRRSubjRankPdfBtn" class="axp-btn-secondary axp-tab-btn" data-for="subject-ranking" style="display:none;align-items:center;gap:0.4em;font-size:0.85em;padding:5px 10px;">
                        <i class="bi bi-file-earmark-pdf"></i> Download Ranking PDF
                    </button>
                </span>
                <!-- Report-tab action (shown only on Report tab) -->
                <span class="axp-act-report" style="display:none;gap:0.4em;flex-wrap:wrap;">
                    <button id="axpRRCertBtn" class="axp-btn-secondary" style="display:inline-flex;align-items:center;gap:0.4em;font-size:0.85em;padding:5px 10px;">
                        <i class="bi bi-award"></i> Certificates
                    </button>
                </span>
            </div>

            <div id="axpRRMsg"></div>
            <div id="axpRRContent"></div>
        </div>`;

    // State
    let _currentStudents = null;
    let _currentTab = 'results';

    // ── Wire pill selectors ───────────────────────────────────────────────────
    // Each pill group syncs to a hidden <input> with the matching id
    const _pillMap = { exam:'axpRRExamSel', display:'axpRRDisplaySel', pos:'axpRRPosSel', tpl:'axpRRResultTplSel' };
    cont.querySelectorAll('.axp-pill').forEach(pill => {
        // Style inactive state
        if (!pill.classList.contains('axp-pill--active')) {
            pill.style.background = '#f0f0f0';
            pill.style.color = '#444';
            pill.style.border = '1.5px solid #ddd';
        } else {
            pill.style.background = '#1a3a5c';
            pill.style.color = '#fff';
            pill.style.border = '1.5px solid #1a3a5c';
        }
        pill.style.cssText += ';padding:5px 13px;font-size:12px;font-weight:600;cursor:pointer;outline:none;';
        pill.onmouseenter = null; pill.onmouseleave = null; // no hover

        pill.onclick = () => {
            const group = pill.dataset.group;
            const val   = pill.dataset.val;
            // Deactivate siblings
            cont.querySelectorAll(`.axp-pill[data-group="${group}"]`).forEach(p => {
                p.classList.remove('axp-pill--active');
                p.style.background = '#f0f0f0';
                p.style.color = '#444';
                p.style.border = '1.5px solid #ddd';
            });
            // Activate clicked
            pill.classList.add('axp-pill--active');
            pill.style.background = '#1a3a5c';
            pill.style.color = '#fff';
            pill.style.border = '1.5px solid #1a3a5c';
            // Sync hidden input
            const inputId = _pillMap[group];
            if (inputId) {
                const el = document.getElementById(inputId);
                if (el) el.value = val;
            }
            // If results already loaded, re-render current tab
            if (group !== 'exam' && document.getElementById('axpRRTabs') &&
                document.getElementById('axpRRTabs').style.display !== 'none') {
                _axpRRRenderTab(_currentTab);
            }
        };
    });

    // Wire folder buttons
    document.getElementById('axpRRFolderGrid').querySelectorAll('.axp-rr-folder-btn').forEach(btn => {
        btn.onclick = () => {
            const cls = btn.dataset.class;
            // Highlight selected folder
            document.getElementById('axpRRFolderGrid').querySelectorAll('.axp-rr-folder-btn').forEach(b => {
                b.style.borderColor = '#dee2e6';
                b.style.background = '#fff';
                b.querySelector('i').style.color = '#f5a623';
            });
            btn.style.borderColor = '#0d6efd';
            btn.style.background = '#e8f4fd';
            btn.querySelector('i').style.color = '#0d6efd';
            // Set hidden value
            document.getElementById('axpRRClassSel').value = cls;
            // Show banner
            const banner = document.getElementById('axpRRSelectedBanner');
            banner.style.display = 'flex';
            document.getElementById('axpRRSelectedLabel').textContent = `Class: ${cls}`;

            // Render class info panel into axpRRContent immediately
            const contentDiv = document.getElementById('axpRRContent');
            if (contentDiv) {
                contentDiv.innerHTML = '';
                _axpRenderClassInfoPanel(cls, contentDiv);
                // Add a load results button below the panel
                const loadRow = document.createElement('div');
                loadRow.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
                loadRow.innerHTML = `
                    <button id="axpRRLoadFromPanel" style="background:#1a3a5c;color:#fff;border:1.5px solid #1a3a5c;padding:7px 20px;font-size:12.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                        <i class="bi bi-search"></i> Load Results for ${escapeHtml(cls)}
                    </button>`;
                contentDiv.appendChild(loadRow);
                document.getElementById('axpRRLoadFromPanel').onclick = () => _axpRRLoad(false);
            } else {
                _axpRRLoad(false);
            }
        };
    });
    document.getElementById('axpRRRefreshBtn').onclick = () => _axpRRLoad(true);

    function _axpRRLoad(forceRefresh) {
        const cls      = document.getElementById('axpRRClassSel').value;
        const examType = document.getElementById('axpRRExamSel').value;
        if (!cls || !examType) {
            _showSectionMsg('axpRRMsg', 'Please select both an exam type and a class folder.', 'warning');
            return;
        }

        // Update banner
        const banner = document.getElementById('axpRRSelectedBanner');
        if (banner) { banner.style.display = 'flex'; }
        const lbl = document.getElementById('axpRRSelectedLabel');
        if (lbl) {
            const _bl = _axpExamLabel(examType,'en');
            const _cl = _axpClassLabel(cls,'en');
            lbl.textContent = `${_cl}  |  ${_bl}`;
        }

        const cacheKey = `${cls}::${examType}`;
        if (!forceRefresh && window._axpRRCache && window._axpRRCache[cacheKey]) {
            _currentStudents = window._axpRRCache[cacheKey];
            _axpRRShowTabs();
            _axpRRRenderTab(_currentTab);
            return;
        }

        document.getElementById('axpRRContent').innerHTML = `
            <div style="text-align:center;padding:2em;color:#888;">
                <i class="bi bi-hourglass-split" style="font-size:2em;display:block;margin-bottom:0.5em;animation:spin 1s linear infinite;"></i>
                Loading results for <strong>${escapeHtml(cls)}</strong> — <strong>${escapeHtml(examType)}</strong>…
            </div>`;

        _apiGet({ schoolId: _appScriptSchoolId, year: _schoolMeta.year, class: cls, examType })
            .then(res => {
                const students = _axpNormalizeStudents(res.students || res.data || []);
                if (!students.length) {
                    _showSectionMsg('axpRRMsg', 'No results found for the selected class and exam.', 'info');
                    document.getElementById('axpRRContent').innerHTML = '';
                    return;
                }
                if (!window._axpRRCache) window._axpRRCache = {};
                window._axpRRCache[cacheKey] = students;
                _currentStudents = students;
                _axpRRShowTabs();
                _axpRRRenderTab(_currentTab);
            })
            .catch(err => {
                _showSectionMsg('axpRRMsg', `Failed to load results: ${err.message}`, 'error');
                document.getElementById('axpRRContent').innerHTML = '';
            });
    }

    // Helper: set button to loading state and return restore function
    function _axpBtnLoading(btnId, loadingText) {
        const btn = document.getElementById(btnId);
        if (!btn) return () => {};
        const orig = btn.innerHTML;
        const origDisabled = btn.disabled;
        btn.disabled = true;
        btn.innerHTML = `<i class="bi bi-hourglass-split" style="animation:axp-spin 1s linear infinite;display:inline-block;"></i> ${loadingText}`;
        btn.style.opacity = '0.7';
        return () => { btn.disabled = origDisabled; btn.innerHTML = orig; btn.style.opacity = ''; };
    }

    function _axpRRShowTabs() {
        const tabsEl   = document.getElementById('axpRRTabs');
        const actionsEl = document.getElementById('axpRRActions');
        const cls      = document.getElementById('axpRRClassSel').value;
        const examType = document.getElementById('axpRRExamSel').value;

        tabsEl.style.display = 'block';
        actionsEl.style.display = 'flex';

        // Keep class info panel above content — re-render if not present
        const rrContent = document.getElementById('axpRRContent');
        if (rrContent && !document.getElementById('axpClassInfoPanel')) {
            const panelWrap = document.createElement('div');
            rrContent.insertBefore(panelWrap, rrContent.firstChild);
            _axpRenderClassInfoPanel(document.getElementById('axpRRClassSel').value, panelWrap);
        }

        // Wire up tab clicks
        tabsEl.querySelectorAll('.axp-rr-tab').forEach(btn => {
            btn.onclick = () => {
                tabsEl.querySelectorAll('.axp-rr-tab').forEach(b => b.classList.remove('axp-rr-tab--active'));
                btn.classList.add('axp-rr-tab--active');
                _currentTab = btn.dataset.tab;
                _axpRRUpdateActionBar(_currentTab);
                _axpRRRenderTab(_currentTab);
            };
        });

        // Wire action buttons with loading states
        document.getElementById('axpRRExcelBtn').onclick = () => {
            const restore = _axpBtnLoading('axpRRExcelBtn', 'Exporting…');
            try { createExcelFile(_currentStudents, examType, cls); } catch(e) { console.error(e); }
            setTimeout(restore, 2500);
        };
        document.getElementById('axpRRPdfBtn').onclick = () => {
            const restore = _axpBtnLoading('axpRRPdfBtn', 'Preparing PDF…');
            _axpRRGeneratePDF('download', cls, examType).finally ? 
                _axpRRGeneratePDF('download', cls, examType).finally(restore) :
                (restore(), _axpRRGeneratePDF('download', cls, examType));
        };
        document.getElementById('axpRRPreviewBtn').onclick = () => {
            const restore = _axpBtnLoading('axpRRPreviewBtn', 'Opening…');
            _axpRRGeneratePDF('preview', cls, examType);
            setTimeout(restore, 2000);
        };
        document.getElementById('axpRRCertBtn').onclick = () => {
            _axpRRStartCerts(_currentStudents);
        };

        // Wire analysis/ranking/etc download PDF buttons
        ['axpRRAnalysisPdfBtn','axpRRTop10PdfBtn','axpRRLeast10PdfBtn',
         'axpRRGeneralPdfBtn','axpRRSubjWisePdfBtn','axpRRSubjRankPdfBtn'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.onclick = () => {
                    const restore = _axpBtnLoading(id, 'Preparing PDF…');
                    _axpRRGeneratePDF('download', cls, examType).finally ?
                        _axpRRGeneratePDF('download', cls, examType).finally(restore) :
                        (restore(), _axpRRGeneratePDF('download', cls, examType));
                };
            }
        });

        // Show correct actions for the initial tab
        _axpRRUpdateActionBar(_currentTab);
    }

    // Show/hide action buttons based on which tab is active
    function _axpRRUpdateActionBar(tab) {
        const actionsEl = document.getElementById('axpRRActions');
        if (!actionsEl) return;

        actionsEl.querySelectorAll('.axp-act-results').forEach(el => {
            el.style.display = (tab === 'results') ? 'inline-flex' : 'none';
        });
        actionsEl.querySelectorAll('.axp-act-report').forEach(el => {
            el.style.display = (tab === 'student-report') ? 'inline-flex' : 'none';
        });
        actionsEl.querySelectorAll('.axp-act-analysis').forEach(el => {
            const show = ['analysis','top-10','least-10','general','subject-wise','subject-ranking'].includes(tab);
            el.style.display = show ? 'inline-flex' : 'none';
        });

        // Always show toolbar — each tab has at least one action
        actionsEl.style.display = 'flex';
    }

    function _axpRRRenderTab(tab) {
        document.getElementById('axpRRMsg').innerHTML = '';
        const cont        = document.getElementById('axpRRContent');
        const students    = _currentStudents;
        const displayMode = document.getElementById('axpRRDisplaySel').value;
        const showPos     = document.getElementById('axpRRPosSel').value === 'show';

        switch (tab) {
            case 'results': {
                const tplSel = document.getElementById('axpRRResultTplSel');
                const tpl = tplSel ? tplSel.value : 'A';
                cont.innerHTML = '';
                cont.appendChild(_buildSchoolHeader());
                if (tpl === 'B') {
                    cont.appendChild(buildDivisionTable(students));
                    cont.appendChild(buildStudentTableB(students, displayMode, showPos));
                    cont.appendChild(buildSubjectTable(students));
                } else {
                    cont.appendChild(buildDivisionTable(students));
                    cont.appendChild(buildStudentTable(students, displayMode, showPos));
                    cont.appendChild(buildSubjectTable(students));
                }
                break;
            }
            case 'student-report':
                // Render student reports inline — nav + report card appear inside axpRRContent
                cont.innerHTML = '';
                _axpRRStartReports(students);
                break;
            case 'analysis':       cont.innerHTML = ''; cont.appendChild(_buildAnalysisView(students));           break;
            case 'top-10':         cont.innerHTML = ''; cont.appendChild(_buildRankingView(students,'top',10));   break;
            case 'least-10':       cont.innerHTML = ''; cont.appendChild(_buildRankingView(students,'least',10)); break;
            case 'general':        cont.innerHTML = ''; cont.appendChild(_buildGeneralView(students));            break;
            case 'subject-wise':   cont.innerHTML = ''; cont.appendChild(_buildSubjectWiseView(students));        break;
            case 'subject-ranking':cont.innerHTML = ''; cont.appendChild(_buildSubjectRankingView(students));     break;
            default: cont.innerHTML = '';
        }
    }

    function _buildSchoolHeader() {
        const schoolLogo = window.getSchoolLogo ? window.getSchoolLogo() : null;
        const cls        = document.getElementById('axpRRClassSel').value;
        const rawExam    = document.getElementById('axpRRExamSel') ? document.getElementById('axpRRExamSel').value : '';
        const year       = (typeof _schoolMeta !== 'undefined' && _schoolMeta && _schoolMeta.year)
                           ? _schoolMeta.year : new Date().getFullYear();

        // Read header lines from live panel first, then localStorage
        const panel = document.getElementById('axpClassInfoPanel');
        let lines = [];
        if (panel) {
            lines = [...panel.querySelectorAll('[data-hdrline]')].map(i => i.value.trim()).filter(Boolean);
        }
        if (!lines.length) {
            lines = SchoolInfoStorage.getHeaderLines(cls).filter(Boolean);
        }
        // Always auto-set lines from live server data — school info is never manual
        const _si_bsh  = _axpSchoolInfo('en');
        const _dd_bsh  = (typeof _dashboardData !== 'undefined') ? _dashboardData : {};
        const _dist    = _dd_bsh.district ? _dd_bsh.district.toUpperCase() + ' DISTRICT COUNCIL' : (lines[2] || 'DISTRICT COUNCIL');
        // Override lines 0-4 with live data every time
        lines[0] = "PRESIDENT'S OFFICE";
        lines[1] = "REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT";
        lines[2] = _dist;
        lines[3] = (_si_bsh.displayLine2 ? _si_bsh.displayLine2.toUpperCase() + ' — ' : '') + _si_bsh.displayName.toUpperCase();
        {
            const _eL=_axpExamLabel(rawExam,'en').toUpperCase();
            const _cL=_axpClassLabel(cls,'en').toUpperCase();
            lines[4]=`${_cL} ${_eL} RESULTS — ${year}`;
        }

        // Font hierarchy: line1=tiny govt, line2=small regional, line3=medium district, line4=large school name, line5=medium exam title
        const fontSizes    = ['9px',  '9.5px', '10.5px', '14px',  '11px' ];
        const fontWeights  = ['400',  '400',   '600',    '800',   '700'  ];
        const letterSpaces = ['1px',  '0.5px', '0.3px',  '0.6px', '0.5px'];
        const margins      = ['0px',  '0px',   '1px',    '3px',   '2px'  ];

        const linesHtml = lines.map((ln, i) => {
            const fs = fontSizes[i]    || '10.5px';
            const fw = fontWeights[i]  || '600';
            const ls = letterSpaces[i] || '0.3px';
            const mg = margins[i]      || '1px';
            return `<p style="margin:${mg} 0;font-size:${fs};font-weight:${fw};text-transform:uppercase;color:#000;letter-spacing:${ls};">${escapeHtml(ln)}</p>`;
        }).join('');

        const div = document.createElement('div');
        div.className = 'school-header';
        div.style.cssText = [
            'page-break-after:avoid',
            'break-after:avoid',
            'page-break-inside:avoid',
            'break-inside:avoid',
            'text-align:center',
            'padding:10px 0 8px',
            'margin-bottom:6px',
            'border-bottom:2.5px solid #000',
            'background:#fff',
            'color:#000',
            'font-family:Arial,sans-serif',
            '-webkit-print-color-adjust:exact',
            'print-color-adjust:exact'
        ].join(';');

        const centerBlock = `<div style="text-align:center;flex:1;">${linesHtml}</div>`;

        if (schoolLogo) {
            div.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:0 1rem;">
                    <img src="${schoolLogo}" style="width:55px;height:55px;object-fit:contain;flex-shrink:0;">
                    ${centerBlock}
                    <img src="${schoolLogo}" style="width:55px;height:55px;object-fit:contain;flex-shrink:0;">
                </div>`;
        } else {
            div.innerHTML = centerBlock;
        }
        return div;
    }

// ─── DIRECT jsPDF GENERATOR (replaces _axpRRGeneratePDF) ─────────────────────
// Builds the results PDF entirely in jsPDF — no html2canvas, no html2pdf.
// Layout: A4 landscape, 297×210mm, margins 8mm each side.
//
// Page structure:
//   Page 1:  School header + Division summary table
//   Page 2…N: Student results table (rows wrap naturally)
//   Last page: Centre Summary + Overall Analysis + Subject Table
//
// jsPDF is available globally as window.jspdf.jsPDF (from the html2pdf bundle).

    function _axpRRGeneratePDF(action, cls, examType) {
        if (!_currentStudents || !_currentStudents.length) {
            _axpToast('Load results first before downloading PDF.', 'warning');
            return Promise.resolve();
        }

        return new Promise(async (resolve) => {
            try {
                // ── Setup ──────────────────────────────────────────────────────
                const jsPDFCtor = await _axpGetJsPDF().catch(e => { _axpToast('jsPDF not available: '+e.message,'error'); return null; });
                if (!jsPDFCtor) { resolve(); return; }

                const doc = new jsPDFCtor({unit:'mm',format:'a4',orientation:'landscape',compress:false,precision:4,putOnlyUsedFonts:true});
                const PW = doc.internal.pageSize.getWidth();   // 297
                const PH = doc.internal.pageSize.getHeight();  // 210
                const ML = 8, MR = 8, MT = 8, MB = 10;
                const CW = PW - ML - MR;   // content width = 281mm
                const si = _axpSchoolInfo('en');
                const year = (typeof _schoolMeta!=='undefined'&&_schoolMeta&&_schoolMeta.year)?_schoolMeta.year:new Date().getFullYear();
                const examLabel = _axpExamLabel(examType,'en');
                const classLabel = _axpClassLabel(cls,'en');
                const sanitize = s => s.replace(/[^a-z0-9]/gi,'_').replace(/_+/g,'_');
                const filename = `${sanitize(si.rawName||'School')}_${sanitize(cls)}_${sanitize(examType)}.pdf`;

                // ── Grade/Division colour maps ─────────────────────────────────
                const gradeCol = { A:[0,100,0], B:[0,170,0], C:[173,255,47], D:[255,165,0], F:[255,0,0] };
                const gradeFg  = { A:[255,255,255], B:[255,255,255], C:[0,0,0], D:[0,0,0], F:[255,255,255] };
                const divCol   = { I:[0,100,0], II:[0,170,0], III:[173,255,47], IV:[255,165,0], O:[255,0,0] };
                const divFg    = { I:[255,255,255], II:[255,255,255], III:[0,0,0], IV:[0,0,0], O:[255,255,255] };
                const gpaToColour = gpa => {
                    if (gpa<=1.6) return { bg:[0,100,0],   fg:[255,255,255], grade:'A', label:'Excellent' };
                    if (gpa<=2.6) return { bg:[0,170,0],   fg:[255,255,255], grade:'B', label:'Very Good' };
                    if (gpa<=3.6) return { bg:[173,255,47],fg:[0,0,0],       grade:'C', label:'Good' };
                    if (gpa<=4.6) return { bg:[255,165,0], fg:[0,0,0],       grade:'D', label:'Satisfactory' };
                    return            { bg:[255,0,0],   fg:[255,255,255], grade:'F', label:'Fail' };
                };
                const gp = {A:1,B:2,C:3,D:4,F:5};

                // ── Drawing helpers ────────────────────────────────────────────
                let curY = MT;
                let pageNum = 0;

                const newPage = () => {
                    doc.addPage();
                    pageNum++;
                    curY = MT + 6; // leave room for running header
                };

                // Draw running header (pages 2+) and footer on current page
                const drawHeaderFooter = (pg, total) => {
                    // footer — all pages
                    doc.setDrawColor(180,180,180); doc.setLineWidth(0.2);
                    doc.line(ML, PH-MB+2, PW-MR, PH-MB+2);
                    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(120,120,120);
                    doc.text(`Page ${pg} of ${total}`, PW/2, PH-MB+5, {align:'center'});
                    // header — pages 2+
                    if (pg > 1) {
                        doc.setDrawColor(51,51,51); doc.setLineWidth(0.25);
                        doc.line(ML, MT+3, PW-MR, MT+3);
                        doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(26,58,92);
                        doc.text(si.displayName||si.rawName||'', ML, MT+2);
                        doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(85,85,85);
                        doc.text(`${classLabel} ${examLabel} | ${year}`, PW-MR, MT+2, {align:'right'});
                    }
                };

                // Draw a cell: x,y,w,h, text, opts={bold,bg,fg,align,fontSize,wrap}
                const cell = (x,y,w,h,text,opts={}) => {
                    const bg = opts.bg||[255,255,255];
                    const fg = opts.fg||[0,0,0];
                    doc.setFillColor(...bg); doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
                    doc.rect(x,y,w,h,'FD');
                    doc.setTextColor(...fg);
                    doc.setFont('helvetica', opts.bold?'bold':'normal');
                    doc.setFontSize(opts.fontSize||7);
                    const pad = 1.2;
                    const align = opts.align||'center';
                    const tx = align==='center' ? x+w/2 : align==='right' ? x+w-pad : x+pad;
                    const ty = y+h/2+1.5;
                    if (opts.wrap && text) {
                        const lines = doc.splitTextToSize(String(text), w-pad*2);
                        const lineH = (opts.fontSize||7)*0.4;
                        lines.forEach((ln,i) => doc.text(ln, tx, y+pad*2+i*lineH, {align}));
                    } else {
                        doc.text(String(text??''), tx, ty, {align});
                    }
                };

                // ── Compute student data ───────────────────────────────────────
                const students = _currentStudents;
                const displayMode = (document.getElementById('axpRRDisplaySel')||{value:'both'}).value;
                const showPos = ((document.getElementById('axpRRPosSel')||{value:'show'}).value)==='show';
                const schoolIdx = (si.rawIndex||'').replace(/[.\\/\s]/g,'').toUpperCase();

                const eligible = students.filter(s=>s.point>=7&&s.point<=35).sort((a,b)=>a.point-b.point);
                eligible.forEach((s,i)=>{ s._pos=i+1; });

                const subjectSet = new Set();
                students.forEach(s=>Object.keys(s.scores||{}).forEach(sub=>subjectSet.add(sub)));
                const subjects = [...subjectSet];

                // Division counts
                const divCount={I:{F:0,M:0},II:{F:0,M:0},III:{F:0,M:0},IV:{F:0,M:0},O:{F:0,M:0}};
                students.forEach(s=>{
                    const g=s.gender==='F'?'F':'M';
                    if(divCount[s.division])divCount[s.division][g]++;
                });
                const subjTot={},subjCnt={};
                students.forEach(s=>Object.entries(s.scores||{}).forEach(([sub,sc])=>{
                    if(gp[sc.grade]){subjTot[sub]=(subjTot[sub]||0)+gp[sc.grade];subjCnt[sub]=(subjCnt[sub]||0)+1;}
                }));
                const avgSubGPA=Object.keys(subjTot).length?Object.keys(subjTot).reduce((a,s)=>a+subjTot[s]/subjCnt[s],0)/Object.keys(subjTot).length:0;
                const dp={I:1,II:2,III:3,IV:4,O:5};
                let dPts=0,dCnt=0;
                students.forEach(s=>{if(dp[s.division]){dPts+=dp[s.division];dCnt++;}});
                const schoolGPA=dCnt?(avgSubGPA+dPts/dCnt)/2:null;

                // ════════════════════════════════════════════════════════════════
                // PAGE 1 — School Header + Division Table
                // ════════════════════════════════════════════════════════════════
                pageNum = 1;
                curY = MT;

                // School header lines
                const hLines = [
                    "PRESIDENT'S OFFICE",
                    "REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT",
                    si.displayLine2 ? si.displayLine2.toUpperCase()+' DISTRICT COUNCIL' : '',
                    (si.displayLine2?si.displayLine2.toUpperCase()+' — ':'')+si.displayName.toUpperCase(),
                    `${classLabel.toUpperCase()} ${examLabel.toUpperCase()} RESULTS — ${year}`
                ].filter(Boolean);
                const hFonts = [
                    {size:8,  bold:false},
                    {size:8,  bold:false},
                    {size:10, bold:true},
                    {size:14, bold:true},
                    {size:10, bold:true}
                ];
                hLines.forEach((ln,i)=>{
                    const f=hFonts[i]||{size:8,bold:false};
                    doc.setFont('helvetica',f.bold?'bold':'normal');
                    doc.setFontSize(f.size); doc.setTextColor(0,0,0);
                    doc.text(ln, PW/2, curY+f.size*0.35, {align:'center'});
                    curY += f.size*0.45+1;
                });
                // Border under header
                doc.setDrawColor(0,0,0); doc.setLineWidth(0.5);
                doc.line(ML, curY+1, PW-MR, curY+1);
                curY += 4;

                // ── Division Table (centred, 100mm wide) ──────────────────────
                const divKeys = ['I','II','III','IV','O'];
                const DW = 100; // total table width mm
                const DX = ML + (CW-DW)/2;
                const DCW = DW/(divKeys.length+1);
                const RH = 6;

                // Header row
                ['DIVISION',...divKeys].forEach((h,i)=>{
                    cell(DX+i*DCW, curY, DCW, RH, h==='O'?'0':h, {bold:true, fontSize:7.5});
                });
                curY+=RH;
                // F, M, T rows
                ['F','M'].forEach(g=>{
                    cell(DX, curY, DCW, RH, g, {bold:true});
                    divKeys.forEach((d,i)=>cell(DX+(i+1)*DCW, curY, DCW, RH, divCount[d][g]||0));
                    curY+=RH;
                });
                // Totals
                cell(DX, curY, DCW, RH, 'T', {bold:true});
                divKeys.forEach((d,i)=>cell(DX+(i+1)*DCW, curY, DCW, RH, (divCount[d].F||0)+(divCount[d].M||0), {bold:true}));
                curY+=RH;

                // School GPA row (coloured, spans full table width)
                if (schoolGPA) {
                    const gc = gpaToColour(schoolGPA);
                    cell(DX, curY, DW, RH+1,
                        `SCHOOL GPA: ${schoolGPA.toFixed(4)}   Grade: ${gc.grade}   (${gc.label})`,
                        {bold:true, bg:gc.bg, fg:gc.fg, fontSize:8});
                    curY+=RH+1;
                }
                curY += 4;

                // ════════════════════════════════════════════════════════════════
                // STUDENT TABLE
                // ════════════════════════════════════════════════════════════════
                // Columns: NO, NAME, SEX, AGG, DIV, [POS], SUBJECTS
                const fixedCols = showPos
                    ? [{l:"CAND'S NO",w:18},{l:"CAND'S NAME",w:38},{l:'SEX',w:8},{l:'AGG',w:10},{l:'DIV',w:10},{l:'POS',w:10}]
                    : [{l:"CAND'S NO",w:18},{l:"CAND'S NAME",w:38},{l:'SEX',w:8},{l:'AGG',w:10},{l:'DIV',w:10}];
                const fixedW = fixedCols.reduce((a,c)=>a+c.w,0);
                const subjColW = CW - fixedW; // remaining width for subjects

                const SRH = 5.5; // student row height
                const THH = 6;   // table header height

                // Draw student table header
                const drawStudentHeader = () => {
                    let x = ML;
                    fixedCols.forEach(c=>{ cell(x,curY,c.w,THH,c.l,{bold:true,fontSize:6.5}); x+=c.w; });
                    cell(x,curY,subjColW,THH,'DETAILED SUBJECTS',{bold:true,fontSize:6.5});
                    curY+=THH;
                };

                drawStudentHeader();

                students.forEach((s,i)=>{
                    // Check if we need a new page
                    if (curY + SRH > PH - MB - 6) {
                        newPage();
                        drawStudentHeader();
                    }

                    const cNum = schoolIdx?`${schoolIdx}-${String(i+1).padStart(4,'0')}`:`S000-${String(i+1).padStart(4,'0')}`;
                    const summary = Object.entries(s.scores||{}).map(([sub,sc])=>{
                        if(sc.mark==null||sc.mark==='') return '';
                        if(displayMode==='both')  return `${sub}-${sc.mark}(${sc.grade})`;
                        if(displayMode==='raw')   return `${sub}-${sc.mark}`;
                        if(displayMode==='grade') return `${sub}(${sc.grade})`;
                        return '';
                    }).filter(Boolean).join('  ');

                    const dBg = [255,255,255];
                    const dFg = [0,0,0];

                    let x = ML;
                    // Calculate row height based on wrapped subject text
                    const subLines = doc.splitTextToSize(summary, subjColW-2);
                    const rowH = Math.max(SRH, subLines.length * 3.2 + 2);

                    cell(x,curY,fixedCols[0].w,rowH,cNum,{fontSize:5.5}); x+=fixedCols[0].w;
                    cell(x,curY,fixedCols[1].w,rowH,s.name||'',{fontSize:6,align:'left'}); x+=fixedCols[1].w;
                    cell(x,curY,fixedCols[2].w,rowH,s.gender||'-',{fontSize:7}); x+=fixedCols[2].w;
                    cell(x,curY,fixedCols[3].w,rowH,s.point,{fontSize:6.5}); x+=fixedCols[3].w;
                    cell(x,curY,fixedCols[4].w,rowH,s.division||'-',{fontSize:7,bold:true,bg:dBg,fg:dFg}); x+=fixedCols[4].w;
                    if (showPos) { cell(x,curY,fixedCols[5].w,rowH,s._pos||'',{fontSize:6.5}); x+=fixedCols[5].w; }

                    // Subject cell with wrapped text
                    doc.setFillColor(255,255,255); doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
                    doc.rect(x,curY,subjColW,rowH,'FD');
                    doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(0,0,0);
                    subLines.forEach((ln,li)=>doc.text(ln, x+1.2, curY+2.5+li*3.2));

                    curY += rowH;
                });

                // ════════════════════════════════════════════════════════════════
                // LAST PAGE — Analysis Tables
                // ════════════════════════════════════════════════════════════════
                newPage();

                // ── Centre Summary — full content width ───────────────────
                const passed=['I','II','III','IV'].reduce((s,d)=>(s+(divCount[d]?.F||0)+(divCount[d]?.M||0)),0);
                const total=students.length;
                const perfPct=total?((passed/total)*100).toFixed(2):'0.00';
                const csRH=7, csHdrH=9;
                const csLW=CW*0.65, csVW=CW*0.35; // label 65%, value 35%

                // Title — full width
                cell(ML,curY,CW,csHdrH,'EXAMINATION CENTRE OVERALL PERFORMANCE',{bold:true,fontSize:9});
                curY+=csHdrH;
                const csRows=[
                    ['TOTAL PASSED CANDIDATES (DIV I–IV)', String(passed)],
                    ['PERFORMANCE PERCENTAGE', perfPct+'%'],
                ];
                csRows.forEach(([lbl,val])=>{
                    cell(ML,curY,csLW,csRH,lbl,{bold:true,align:'left',fontSize:8});
                    cell(ML+csLW,curY,csVW,csRH,val,{bold:true,fontSize:8});
                    curY+=csRH;
                });
                if (schoolGPA) {
                    const gc=gpaToColour(schoolGPA);
                    cell(ML,curY,csLW,csRH,'SCHOOL GPA',{bold:true,align:'left',fontSize:8});
                    cell(ML+csLW,curY,csVW,csRH,`${schoolGPA.toFixed(4)} — ${gc.grade} (${gc.label})`,{bold:true,fontSize:8,bg:gc.bg,fg:gc.fg});
                    curY+=csRH;
                }
                curY+=5;

                // ── Overall Analysis Table ────────────────────────────────────
                const overall={registered:{F:0,M:0},sat:{F:0,M:0},clean:{F:0,M:0},absent:{F:0,M:0},INC:{F:0,M:0}};
                students.forEach(s=>{
                    const g=s.gender==='F'?'F':'M';
                    overall.registered[g]++;
                    if(Object.keys(s.scores||{}).length>0)overall.sat[g]++;
                    if(s.point>=7&&s.point<=35)overall.clean[g]++;
                    if(!Object.keys(s.scores||{}).length)overall.absent[g]++;
                    if(s.division==='INC')overall.INC[g]++;
                });

                const oCols=['REGISTERED','SAT','CLEAN','ABSENT','INC','DIV I','DIV II','DIV III','DIV IV','DIV 0'];
                const oFW=22, oSubW=(CW-oFW)/oCols.length/3; // width per F/M/T sub-col
                const oRH=5, oHH=5;

                // Row 1 header: CANDIDATES + col groups
                cell(ML,curY,oFW,oHH*2,'CANDIDATES',{bold:true,fontSize:6.5,align:'left'});
                let ox=ML+oFW;
                oCols.forEach(h=>{ cell(ox,curY,oSubW*3,oHH,h,{bold:true,fontSize:5.5}); ox+=oSubW*3; });
                curY+=oHH;
                // Row 2 header: F M T for each group
                ox=ML+oFW;
                oCols.forEach(()=>['F','M','T'].forEach(l=>{ cell(ox,curY,oSubW,oHH,l,{bold:true,fontSize:5.5}); ox+=oSubW; }));
                curY+=oHH;
                // Data row
                cell(ML,curY,oFW,oRH,'No. of Candidates',{bold:true,align:'left',fontSize:5.5});
                ox=ML+oFW;
                ['registered','sat','clean','absent','INC'].forEach(k=>{
                    const f=overall[k].F,m=overall[k].M;
                    [f,m,f+m].forEach(v=>{ cell(ox,curY,oSubW,oRH,v,{fontSize:5.5}); ox+=oSubW; });
                });
                ['I','II','III','IV','O'].forEach(d=>{
                    const f=divCount[d]?.F||0,m=divCount[d]?.M||0;
                    [f,m,f+m].forEach(v=>{ cell(ox,curY,oSubW,oRH,v,{fontSize:5.5}); ox+=oSubW; });
                });
                curY+=oRH+6;

                // ── Subject Table ─────────────────────────────────────────────
                // Compute per-subject stats
                const subStats={};
                subjects.forEach(sub=>{
                    subStats[sub]={counts:{A:{F:0,M:0},B:{F:0,M:0},C:{F:0,M:0},D:{F:0,M:0},F:{F:0,M:0}},satF:0,satM:0,tot:0,gpaSum:0};
                });
                students.forEach(s=>{
                    const g=s.gender==='F'?'F':'M';
                    Object.entries(s.scores||{}).forEach(([sub,sc])=>{
                        if(!subStats[sub])return;
                        if(g==='F')subStats[sub].satF++;else subStats[sub].satM++;
                        subStats[sub].tot++;
                        if(sc.grade&&subStats[sub].counts[sc.grade]){
                            subStats[sub].counts[sc.grade][g]++;
                            subStats[sub].gpaSum+=gp[sc.grade]||0;
                        }
                    });
                });
                // Compute avg and positions
                const subGPAs={};
                subjects.forEach(sub=>{ subGPAs[sub]=subStats[sub].tot?subStats[sub].gpaSum/subStats[sub].tot:5; });
                const sorted=[...subjects].sort((a,b)=>subGPAs[a]-subGPAs[b]);
                const subPos={};sorted.forEach((s,i)=>subPos[s]=i+1);

                // Subject table — fill full content width
                // Fixed proportions that sum to CW=281mm
                const sTH=5.5, sTR=5.5;
                const sSubW=Math.round(CW*0.14);  // ~14% subject name
                const sSatW=Math.round(CW*0.03);  // ~3% each satF/satM/tot
                const sGrFMT=Math.round(CW*0.02); // ~2% each F/M/T per grade (5 grades × 3 = 30%)
                const sGrpW=sGrFMT*3;
                const sAverW=Math.round(CW*0.05);
                const sGpaW=Math.round(CW*0.07);
                const sPosW=Math.round(CW*0.04);
                const sGradeW=CW-sSubW-sSatW*3-sGrpW*5-sAverW-sGpaW-sPosW; // remainder
                const sX=ML;

                // Header row 1
                let sx=sX;
                cell(sx,curY,sSubW,sTH*2,'SUBJECT',{bold:true,fontSize:6,align:'left'}); sx+=sSubW;
                ['SAT-F','SAT-M','TOTAL'].forEach(h=>{ cell(sx,curY,sSatW,sTH*2,h,{bold:true,fontSize:5}); sx+=sSatW; });
                ['A','B','C','D','F'].forEach(gr=>{ cell(sx,curY,sGrpW,sTH,gr,{bold:true,fontSize:6}); sx+=sGrpW; });
                ['AVER','GPA','POS','GRADE'].forEach(h=>{ cell(sx,curY,h==='GPA'?sGpaW:h==='GRADE'?sGradeW:h==='POS'?sPosW:sAverW,sTH*2,h,{bold:true,fontSize:5.5}); sx+=h==='GPA'?sGpaW:h==='GRADE'?sGradeW:h==='POS'?sPosW:sAverW; });
                curY+=sTH;
                // Header row 2 — F/M/T for each grade
                sx=sX+sSubW+sSatW*3;
                ['A','B','C','D','F'].forEach(()=>['F','M','T'].forEach(l=>{ cell(sx,curY,sGrFMT,sTH,l,{bold:true,fontSize:5}); sx+=sGrFMT; }));
                curY+=sTH;

                // Subject rows
                subjects.forEach(sub=>{
                    if(curY+sTR>PH-MB-6){ newPage(); }
                    const st=subStats[sub];
                    const gpaVal=subGPAs[sub];
                    const gc=gpaToColour(gpaVal);
                    const aver=st.tot?(st.gpaSum/st.tot*(100/5)).toFixed(1):'0.0'; // rough avg mark proxy
                    sx=sX;
                    cell(sx,curY,sSubW,sTR,sub,{bold:true,fontSize:6,align:'left'}); sx+=sSubW;
                    [st.satF,st.satM,st.tot].forEach(v=>{ cell(sx,curY,sSatW,sTR,v,{fontSize:5.5}); sx+=sSatW; });
                    ['A','B','C','D','F'].forEach(gr=>{
                        const f=st.counts[gr].F,m=st.counts[gr].M;
                        [f,m,f+m].forEach(v=>{ cell(sx,curY,sGrFMT,sTR,v,{fontSize:5.5}); sx+=sGrFMT; });
                    });
                    cell(sx,curY,sAverW,sTR,aver,{fontSize:5.5}); sx+=sAverW;
                    cell(sx,curY,sGpaW,sTR,gpaVal.toFixed(4),{bold:true,fontSize:5.5,bg:gc.bg,fg:gc.fg}); sx+=sGpaW;
                    cell(sx,curY,sPosW,sTR,subPos[sub],{fontSize:5.5}); sx+=sPosW;
                    cell(sx,curY,sGradeW,sTR,`${gc.grade} (${gc.label})`,{bold:true,fontSize:5.5,bg:gc.bg,fg:gc.fg});
                    curY+=sTR;
                });

                // ── Draw header/footer on all pages ───────────────────────────
                const totalPages = doc.internal.getNumberOfPages();
                for (let pg=1; pg<=totalPages; pg++) {
                    doc.setPage(pg);
                    drawHeaderFooter(pg, totalPages);
                }

                // ── Save or preview ────────────────────────────────────────────
                if (action==='download') {
                    doc.save(filename);
                } else {
                    window.open(doc.output('bloburl'), '_blank');
                }
                resolve();
            } catch(err) {
                console.error('[AXP PDF direct]', err);
                _axpToast('PDF generation failed: '+err.message, 'error');
                resolve();
            }
        });
    }

    function _axpRRStartReports(students) {
        const cont = document.getElementById('axpRRContent');
        if (!cont) return;
        cont.innerHTML = '';
        renderStudentReports(students, cont);
    }

    function _axpRRStartCerts(students) {
        // Hands off to Section 7 (renderStudentCertificates)
        renderStudentCertificates(students);
    }
}

function _axpRRTabIcon(tab) {
    const map = {
        'Results': 'bi-table', 'Student Report': 'bi-file-earmark-text',
        'Analysis': 'bi-graph-up', 'Top 10': 'bi-trophy',
        'Least 10': 'bi-arrow-down-circle', 'General': 'bi-clipboard-data',
        'Subject Wise': 'bi-book', 'Subject Ranking': 'bi-bar-chart'
    };
    return map[tab] || 'bi-circle';
}

function _axpInjectResultsStyles() {
    if (document.getElementById('axp-results-styles')) return;
    const s = document.createElement('style');
    s.id = 'axp-results-styles';
    s.textContent = `
        /* ── Tab bar ── */
        .axp-rr-tab {
            background: none; border: none; border-bottom: 3px solid transparent;
            color: #555; padding: 0.6em 1em; cursor: pointer; font-size: 0.9em;
            transition: all 0.2s; white-space: nowrap;
        }
        .axp-rr-tab:hover { color: #0d6efd; }
        .axp-rr-tab--active {
            color: #0d6efd;
            border-bottom-color: #0d6efd;
            font-weight: 600;
        }

        /* ── School header (print-ready) ── */
        .school-header {
            text-align: center;
            padding: 10px 0 8px;
            margin-bottom: 6px;
            border-bottom: 2.5px solid #000;
            background: #fff;
            color: #000;
        }
        .school-header h1 {
            font-size: clamp(13px, 1.8vw, 19px);
            font-weight: bold;
            margin: 4px 0;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .school-header p {
            font-size: clamp(10px, 1.1vw, 13px);
            margin: 2px 0;
            color: #333;
        }

        /* ── All result tables — clean, A4-ready ── */
        table.axp-results-table, table.axp-rr-table {
            width: 100%;
            border-collapse: collapse;
            font-size: clamp(7px, 0.78vw, 11.5px);
            margin-bottom: 10px;
            table-layout: auto;
            font-family: Arial, sans-serif;
            background: #fff;
            color: #000;
        }
        table.axp-results-table th, table.axp-results-table td,
        table.axp-rr-table th, table.axp-rr-table td {
            border: 0.5px solid #000;
            padding: 3px 5px;
            white-space: nowrap;
            overflow: hidden;
            color: #000;
        }
        /* Header rows — black text on white for clean print */
        table.axp-results-table thead tr,
        table.axp-rr-table thead tr {
            background: #fff !important;
            color: #000 !important;
            font-weight: 700;
        }
        table.axp-results-table thead th,
        table.axp-rr-table thead th {
            color: #000 !important;
            border: 0.5px solid #000;
        }
        /* No alternating bg on body rows — pure white */
        table.axp-results-table tbody tr,
        table.axp-rr-table tbody tr {
            background: #fff !important;
        }
        table.axp-results-table tbody td,
        table.axp-rr-table tbody td {
            background: #fff;
            color: #000;
        }
        /* Division summary table */
        table.summary-table th,
        table.summary-table td { text-align: center; border: 0.5px solid #000; padding: 3px 5px; background: #fff; color: #000; vertical-align: middle; }

        /* GPA highlight row */
        .axp-gpa-row td { font-weight: bold; text-align: center; font-size: clamp(8px, 0.9vw, 12px); }

        /* Analysis section heading */
        .axp-analysis-heading {
            margin: 14px 0 4px;
            font-size: clamp(10px, 1.1vw, 13px);
            font-weight: bold;
            color: #1a3a5c;
            border-bottom: 1.5px solid #1a3a5c;
            padding-bottom: 3px;
            text-transform: uppercase;
        }

        /* Content wrapper for PDF — respects margins */
        #axpRRContent {
            padding: 0 4px;
        }

        /* ── Modern pill selector ── */
        .axp-pill {
            display: inline-flex;
            align-items: center;
            padding: 5px 13px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            outline: none;
            background: #f0f0f0;
            color: #444;
            border: 1.5px solid #ddd;
            transition: none;
            user-select: none;
        }
        .axp-pill--active {
            background: #1a3a5c !important;
            color: #fff !important;
            border-color: #1a3a5c !important;
        }

        /* Spin animation for loading buttons */
        @keyframes axp-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }

        @media print {
            table.axp-results-table th, table.axp-results-table td,
            table.axp-rr-table th, table.axp-rr-table td,
            table.summary-table th, table.summary-table td {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                border: 0.5px solid #000 !important;
            }
            .school-header { page-break-after: avoid; }
            #axpRRContent { padding: 4mm; }
        }`;
    document.head.appendChild(s);
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5a: Division Table
// ─────────────────────────────────────────────────────────────────────────────

function buildDivisionTable(students) {
    const divCount = { I: 0, II: 0, III: 0, IV: 0, O: 0 };
    const divGender = { I: { M:0,F:0 }, II: { M:0,F:0 }, III: { M:0,F:0 }, IV: { M:0,F:0 }, O: { M:0,F:0 } };

    students.forEach(s => {
        const d = s.division, g = s.gender === 'F' ? 'F' : 'M';
        if (divCount[d] !== undefined) divCount[d]++;
        if (divGender[d]) divGender[d][g]++;
    });

    // Division table: 40% wide, centred; never split across pages
    const outer = document.createElement('div');
    outer.style.cssText = 'width:60%;margin:0 auto 10px;page-break-inside:avoid;break-inside:avoid;page-break-before:avoid;break-before:avoid;';

    const tbl = document.createElement('table');
    tbl.className = 'axp-rr-table summary-table';
    tbl.style.cssText = 'width:100%;border-collapse:collapse;font-size:clamp(8px,0.85vw,12px);table-layout:auto;';

    // Head — no bg color
    const hRow = document.createElement('tr');
    [document.createElement('th'), ...Object.keys(divCount).map(d => {
        const th = document.createElement('th'); th.textContent = d === 'O' ? '0' : d; return th;
    })].forEach(th => {
        th.style.cssText = 'border:0.5px solid #000;padding:4px 6px;text-align:center;font-weight:bold;background:#fff;color:#000;';
        hRow.appendChild(th);
    });
    hRow.firstChild.textContent = 'DIVISION';
    const thead = document.createElement('thead'); thead.appendChild(hRow); tbl.appendChild(thead);

    // Body — no alternating bg, everything centered
    const tbody = document.createElement('tbody');
    ['F','M'].forEach(g => {
        const row = document.createElement('tr');
        const td0 = document.createElement('td');
        td0.textContent = g;
        td0.style.cssText = 'border:0.5px solid #000;padding:4px 6px;text-align:center;font-weight:bold;background:#fff;color:#000;';
        row.appendChild(td0);
        Object.keys(divCount).forEach(d => {
            const td = document.createElement('td');
            td.textContent = divGender[d][g];
            td.style.cssText = 'border:0.5px solid #000;padding:4px 6px;text-align:center;background:#fff;color:#000;';
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    const totRow = document.createElement('tr');
    const td0t = document.createElement('td');
    td0t.textContent = 'T';
    td0t.style.cssText = 'border:0.5px solid #000;padding:4px 6px;text-align:center;font-weight:bold;background:#fff;color:#000;';
    totRow.appendChild(td0t);
    Object.keys(divCount).forEach(d => {
        const td = document.createElement('td');
        td.textContent = divCount[d];
        td.style.cssText = 'border:0.5px solid #000;padding:4px 6px;text-align:center;font-weight:bold;background:#fff;color:#000;';
        totRow.appendChild(td);
    });
    tbody.appendChild(totRow);

    // GPA row — no background color
    const gp = { A:1,B:2,C:3,D:4,F:5 }, dp = { I:1,II:2,III:3,IV:4,O:5 };
    const subjTot = {}, subjCnt = {};
    students.forEach(s => Object.entries(s.scores||{}).forEach(([sub,sc]) => {
        if (gp[sc.grade]) { subjTot[sub] = (subjTot[sub]||0)+gp[sc.grade]; subjCnt[sub] = (subjCnt[sub]||0)+1; }
    }));
    const avgSubGPA = Object.keys(subjTot).reduce((acc,sub) => acc + subjTot[sub]/subjCnt[sub], 0) / (Object.keys(subjTot).length||1);
    let divPts = 0, divCnt = 0;
    students.forEach(s => { if (dp[s.division]) { divPts += dp[s.division]; divCnt++; } });
    const schoolGPA = divCnt ? (avgSubGPA + divPts/divCnt) / 2 : null;

    if (schoolGPA) {
        let grade='F', comment='Fail', gpaBg='#FF0000', gpaFg='#fff';
        if (schoolGPA <= 1.6)  { grade='A'; comment='Excellent';      gpaBg='#006400'; gpaFg='#fff'; }
        else if (schoolGPA <= 2.6) { grade='B'; comment='Very Good';  gpaBg='#00AA00'; gpaFg='#fff'; }
        else if (schoolGPA <= 3.6) { grade='C'; comment='Good';       gpaBg='#ADFF2F'; gpaFg='#000'; }
        else if (schoolGPA <= 4.6) { grade='D'; comment='Satisfactory'; gpaBg='#FFA500'; gpaFg='#000'; }
        const gpaRow = document.createElement('tr');
        const gpaCell = document.createElement('td');
        gpaCell.colSpan = Object.keys(divCount).length + 1;
        gpaCell.style.cssText = `text-align:center;font-weight:bold;padding:6px 4px;border:0.5px solid #000;font-size:11px;letter-spacing:0.5px;vertical-align:middle;background:${gpaBg};color:${gpaFg};-webkit-print-color-adjust:exact;print-color-adjust:exact;`;
        gpaCell.textContent = `SCHOOL GPA: ${schoolGPA.toFixed(4)}   Grade: ${grade}   (${comment})`;
        gpaRow.appendChild(gpaCell); tbody.appendChild(gpaRow);
    }

    tbl.appendChild(tbody);
    outer.appendChild(tbl);
    return outer;
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5b: Student Results Table
// ─────────────────────────────────────────────────────────────────────────────

function buildStudentTable(students, displayMode, showPosition) {
    displayMode  = displayMode  || 'both';
    showPosition = showPosition !== undefined ? showPosition : true;

    const _siT = _axpSchoolInfo('en');
    const schoolIdx = (_siT.rawIndex || '').replace(/[.\/\\\s]/g, '').toUpperCase();

    // Assign positions to eligible students
    const eligible = students.filter(s => s.point >= 7 && s.point <= 35).sort((a,b) => a.point - b.point);
    eligible.forEach((s,i) => { s.position = i+1; });

    // Column widths:
    // With position:  col1=7%, col2=13%, col3-5=5% each, col6(pos)=5%, col7=60%  (total=95%+5%=100%)
    // No position:    col1=7%, col2=13%, col3-5=5% each,              col6=65%   (total=35%+65%=100%)
    const colWidths = showPosition
        ? ['7%','13%','5%','5%','5%','5%','60%']
        : ['7%','13%','5%','5%','5%','65%'];

    const tbl = document.createElement('table');
    tbl.className = 'axp-rr-table student-results-table';
    // Fixed layout fits A4 landscape; rows paginate cleanly
    tbl.style.cssText = [
        'width:100%',
        'border-collapse:collapse',
        'font-size:clamp(7px,0.78vw,11px)',
        'table-layout:fixed',   // MUST be fixed so colgroup widths are enforced
        'font-family:Arial,sans-serif',
        'page-break-inside:auto',
        'word-wrap:break-word'
    ].join(';') + ';';

    // colgroup — enforces exact widths for html2pdf
    const colgroup = document.createElement('colgroup');
    colWidths.forEach(w => {
        const col = document.createElement('col');
        col.style.width = w;
        colgroup.appendChild(col);
    });
    tbl.appendChild(colgroup);

    // thead
    const headers = ["CAND'S NO", "CAND'S NAME", 'SEX', 'AGG', 'DIV'];
    if (showPosition) headers.push('POS');
    headers.push('DETAILED SUBJECTS');

    const thStyle = 'border:0.5px solid #000;padding:3px 4px;text-align:center;font-weight:bold;background:#fff;color:#000;overflow:hidden;white-space:nowrap;vertical-align:middle;';
    const thead = document.createElement('thead');
    const hRow  = document.createElement('tr');
    headers.forEach((h,i) => {
        const th = document.createElement('th');
        th.textContent = h;
        th.style.cssText = thStyle + (i===1 ? 'text-align:left;' : '');
        hRow.appendChild(th);
    });
    thead.appendChild(hRow); tbl.appendChild(thead);

    // tbody — each row must NOT be split across pages
    const tdStyle    = 'border:0.5px solid #000;padding:3px 4px;text-align:center;background:#fff;color:#000;overflow:hidden;white-space:nowrap;vertical-align:middle;max-width:0;';
    const tdNameStyle= 'border:0.5px solid #000;padding:3px 4px;text-align:left;background:#fff;color:#000;overflow:hidden;white-space:nowrap;vertical-align:middle;max-width:0;';
    const tdLastStyle= 'border:0.5px solid #000;padding:3px 4px;text-align:left;background:#fff;color:#000;overflow:hidden;white-space:normal;word-break:break-word;word-wrap:break-word;vertical-align:middle;font-size:clamp(6px,0.68vw,9px);max-width:0;';

    const tbody = document.createElement('tbody');

    const _A_RPP  = 25;
    // Runner header (pages 2+) and page footer drawn by jsPDF — not in content

    students.forEach((s, i) => {
        // page-break triggered by jsPDF header/footer — just let rows flow
        const tr = document.createElement('tr');
        tr.style.cssText = 'page-break-inside:avoid;break-inside:avoid;';
        const cNum = schoolIdx ? `${schoolIdx}-${String(i+1).padStart(4,'0')}` : `S000-${String(i+1).padStart(4,'0')}`;
        const summary = Object.entries(s.scores||{}).map(([sub,sc]) => {
            if (sc.mark == null || sc.mark === '') return '';
            if (displayMode === 'both')  return `${sub}-${sc.mark}'${sc.grade}'`;
            if (displayMode === 'raw')   return `${sub}-${sc.mark}`;
            if (displayMode === 'grade') return `${sub}-'${sc.grade}'`;
            return '';
        }).filter(Boolean).join('  ');

        // Colour division cell by division (I=dark green, II=green, III=yellow-green, IV=orange, O=red)
        const divBg = '#fff';
        const divFg = '#000';
        const cells = [
            `<td style="${tdStyle}">${escapeHtml(cNum)}</td>`,
            `<td style="${tdNameStyle}">${escapeHtml(s.name)}</td>`,
            `<td style="${tdStyle}">${escapeHtml(s.gender||'-')}</td>`,
            `<td style="${tdStyle}">${s.point}</td>`,
            `<td style="${tdStyle}font-weight:bold;">${escapeHtml(s.division||'-')}</td>`,
            showPosition ? `<td style="${tdStyle}">${s.position||''}</td>` : '',
            `<td style="${tdLastStyle}">${escapeHtml(summary)}</td>`
        ];
        tr.innerHTML = cells.join('');
        tbody.appendChild(tr);
    });
    // Final page footer
    // No final page footer row — page numbers handled by real PDF footer (didDrawPage)

    tbl.appendChild(tbody);
    return tbl;
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5b-B: Student Results Table — Template B (Compact Grid)
// Subjects spread across columns (one col per subject), no long text column.
// Better for smaller classes where subjects fit across A4 landscape.
// ─────────────────────────────────────────────────────────────────────────────

function buildStudentTableB(students, displayMode, showPosition) {
    displayMode  = displayMode  || 'both';
    showPosition = showPosition !== undefined ? showPosition : true;

    const _siB = _axpSchoolInfo('en');
    const schoolIdx = (_siB.rawIndex || '').replace(/[.\/\\\s]/g, '').toUpperCase();

    const eligible = students.filter(s => s.point >= 7 && s.point <= 35).sort((a,b) => a.point - b.point);
    eligible.forEach((s,i) => { s.position = i+1; });

    // Collect all subjects in order
    const subjectSet = new Set();
    students.forEach(s => Object.keys(s.scores||{}).forEach(sub => subjectSet.add(sub)));
    const subjects = [...subjectSet];

    const tbl = document.createElement('table');
    tbl.className = 'axp-rr-table student-results-table-b';
    tbl.style.cssText = 'width:100%;border-collapse:collapse;font-size:clamp(6px,0.7vw,10px);table-layout:fixed;font-family:Arial,sans-serif;page-break-inside:auto;word-wrap:break-word;';

    // colgroup: fixed cols then one per subject
    const cg = document.createElement('colgroup');
    const fixedCols = showPosition ? ['7%','13%','4%','5%','5%','5%'] : ['7%','13%','4%','5%','5%'];
    const remaining = 100 - fixedCols.reduce((a,c) => a + parseFloat(c), 0);
    const subW = subjects.length ? Math.max(3, Math.floor(remaining / subjects.length)) + '%' : '0%';
    [...fixedCols, ...subjects.map(() => subW)].forEach(w => {
        const c = document.createElement('col'); c.style.width = w; cg.appendChild(c);
    });
    tbl.appendChild(cg);

    // thead — two rows: row1 fixed headers + subject group header, row2 subject names
    const thead = document.createElement('thead');
    const hr1 = document.createElement('tr');
    const hr2 = document.createElement('tr');

    const thSt = 'border:0.5px solid #000;padding:3px 4px;text-align:center;font-weight:bold;background:#fff;color:#000;vertical-align:middle;';
    const fixedHeaders = ["CAND'S NO","CAND'S NAME","SEX","AGG","DIV",...(showPosition?["POS"]:[])];
    fixedHeaders.forEach((h,i) => {
        const th = document.createElement('th');
        th.textContent = h;
        th.style.cssText = thSt + (i===1?'text-align:left;':'text-align:center;') + 'vertical-align:middle;border:0.5px solid #000;padding:3px 4px;';
        th.rowSpan = 2;
        hr1.appendChild(th);
    });

    if (subjects.length) {
        const subGrpTh = document.createElement('th');
        subGrpTh.textContent = displayMode==='grade' ? 'GRADES PER SUBJECT' :
                               displayMode==='raw'   ? 'MARKS PER SUBJECT' : 'MARK (GRADE) PER SUBJECT';
        subGrpTh.colSpan = subjects.length;
        subGrpTh.style.cssText = thSt + 'border:0.5px solid #000;vertical-align:middle;text-align:center;';
        hr1.appendChild(subGrpTh);

        subjects.forEach(sub => {
            const th = document.createElement('th');
            th.textContent = sub;
            th.style.cssText = thSt + 'font-size:clamp(5px,0.65vw,9px);white-space:normal;word-break:break-word;font-weight:bold;color:#000;background:#fff;border:0.5px solid #000;';
            hr2.appendChild(th);
        });
    }

    thead.appendChild(hr1);
    if (subjects.length) thead.appendChild(hr2);
    tbl.appendChild(thead);

    // tbody
    const tbody = document.createElement('tbody');
    const tdSt  = 'border:0.5px solid #000;padding:2px 3px;text-align:center;background:#fff;color:#000;vertical-align:middle;white-space:nowrap;overflow:hidden;max-width:0;';

    const _B_RPP  = 25;
    // Runner header (pages 2+) and page footer drawn by jsPDF — not in content

    students.forEach((s, i) => {
        // page-break triggered by jsPDF header/footer — just let rows flow
        const tr = document.createElement('tr');
        tr.style.cssText = 'page-break-inside:avoid;break-inside:avoid;';
        const cNum = schoolIdx ? `${schoolIdx}-${String(i+1).padStart(4,'0')}` : `S000-${String(i+1).padStart(4,'0')}`;

        tr.innerHTML = [
            `<td style="${tdSt}">${escapeHtml(cNum)}</td>`,
            `<td style="${tdSt}text-align:left;">${escapeHtml(s.name)}</td>`,
            `<td style="${tdSt}">${escapeHtml(s.gender||'-')}</td>`,
            `<td style="${tdSt}font-weight:bold;">${s.point}</td>`,
            `<td style="${tdSt}font-weight:bold;">${escapeHtml(s.division||'-')}</td>`,
            showPosition ? `<td style="${tdSt}">${s.position||''}</td>` : '',
        ].join('');

        subjects.forEach(sub => {
            const sc = s.scores?.[sub];
            let cell = '-';
            if (sc && sc.mark != null && sc.mark !== '') {
                if (displayMode === 'both')  cell = `${sc.mark}(${sc.grade})`;
                else if (displayMode === 'raw')   cell = String(sc.mark);
                else if (displayMode === 'grade') cell = String(sc.grade);
            }
            tr.insertAdjacentHTML('beforeend',
                `<td style="${tdSt}">${escapeHtml(cell)}</td>`);
        });

        tbody.appendChild(tr);
    });
    // Final page footer
    // No final page footer row — page numbers handled by real PDF footer (didDrawPage)

    tbl.appendChild(tbody);
    return tbl;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5c: Subject Analysis Table (Centre Summary + Overall + Subject-wise)
// ─────────────────────────────────────────────────────────────────────────────

function buildSubjectTable(students) {
    const subjectStats = {}, subjectGPAs = {}, subjectAverages = {}, subjectCounts = {};
    const gv = { A:1,B:2,C:3,D:4,F:5 };

    students.forEach(s => {
        const g = s.gender || 'U';
        Object.entries(s.scores||{}).forEach(([sub,sc]) => {
            if (!sc.grade || typeof sc.mark !== 'number') return;
            if (!subjectStats[sub]) subjectStats[sub] = { A:{F:0,M:0},B:{F:0,M:0},C:{F:0,M:0},D:{F:0,M:0},F:{F:0,M:0} };
            if (subjectStats[sub][sc.grade] && subjectStats[sub][sc.grade][g] !== undefined) subjectStats[sub][sc.grade][g]++;
            if (!subjectGPAs[sub]) subjectGPAs[sub] = { tot:0,cnt:0 };
            subjectGPAs[sub].tot += gv[sc.grade]; subjectGPAs[sub].cnt++;
            if (!subjectAverages[sub]) subjectAverages[sub] = { tot:0,cnt:0 };
            subjectAverages[sub].tot += sc.mark; subjectAverages[sub].cnt++;
            if (!subjectCounts[sub]) subjectCounts[sub] = { F:0,M:0 };
            if (g==='F'||g==='M') subjectCounts[sub][g]++;
        });
    });

    const finalGPAs={}, finalAvgs={}, finalGrades={}, positions={};
    Object.keys(subjectStats).forEach(sub => {
        const g = subjectGPAs[sub];
        const avgGPA = g.cnt ? g.tot/g.cnt : null;
        finalGPAs[sub] = avgGPA ? avgGPA.toFixed(4) : 'N/A';
        const a = subjectAverages[sub];
        finalAvgs[sub] = a.cnt ? (a.tot/a.cnt).toFixed(4) : 'N/A';
        let comment = 'N/A';
        if (avgGPA!==null) {
            if (avgGPA<1.6) comment='A (Excell)';
            else if (avgGPA<2.6) comment='B (V.Good)';
            else if (avgGPA<3.6) comment='C (Good)';
            else if (avgGPA<4.6) comment='D (Satisf)';
            else comment='F (Fail)';
        }
        finalGrades[sub] = comment;
    });
    Object.keys(subjectStats)
        .map(s=>({s,gpa:parseFloat(finalGPAs[s])}))
        .filter(x=>!isNaN(x.gpa)).sort((a,b)=>a.gpa-b.gpa)
        .forEach((x,i)=>{positions[x.s]=i+1;});

    // Centre summary calculations
    const dp={I:1,II:2,III:3,IV:4,O:5}, gp={A:1,B:2,C:3,D:4,F:5};
    const divCount={I:{F:0,M:0},II:{F:0,M:0},III:{F:0,M:0},IV:{F:0,M:0},O:{F:0,M:0}};
    const overall={registered:{F:0,M:0},sat:{F:0,M:0},clean:{F:0,M:0},absent:{F:0,M:0},INC:{F:0,M:0}};
    students.forEach(s => {
        const g = s.gender==='F'?'F':'M';
        overall.registered[g]++;
        if (Object.keys(s.scores||{}).length>0) overall.sat[g]++;
        if (s.point>=7&&s.point<=35) overall.clean[g]++;
        if (!Object.keys(s.scores||{}).length) overall.absent[g]++;
        if (s.division==='INC') overall.INC[g]++;
        if (divCount[s.division]) divCount[s.division][g]++;
    });
    const passed = ['I','II','III','IV'].reduce((sum,d)=>sum+divCount[d].F+divCount[d].M,0);
    const total  = passed + divCount.O.F + divCount.O.M;
    const perfPct = total ? ((passed/total)*100).toFixed(2) : '0.00';

    const subjTot={},subjCnt={};
    students.forEach(s=>Object.entries(s.scores||{}).forEach(([sub,sc])=>{
        if(gp[sc.grade]){subjTot[sub]=(subjTot[sub]||0)+gp[sc.grade];subjCnt[sub]=(subjCnt[sub]||0)+1;}
    }));
    const avgSGPA = Object.keys(subjTot).length
        ? Object.keys(subjTot).reduce((acc,s)=>acc+subjTot[s]/subjCnt[s],0)/Object.keys(subjTot).length : 0;
    let divPts=0,divCntV=0;
    students.forEach(s=>{if(dp[s.division]){divPts+=dp[s.division];divCntV++;}});
    const avgDGPA = divCntV ? divPts/divCntV : 0;
    const schoolGPAVal = (avgSGPA>0&&avgDGPA>0) ? (avgSGPA+avgDGPA)/2 : null;
    const schoolGPA = schoolGPAVal!==null ? schoolGPAVal.toFixed(4) : 'N/A';
    let schoolGradeComment='N/A', schoolGPABg='';
    if (schoolGPAVal!==null) {
        if (schoolGPAVal<1.6){schoolGradeComment='A (Excell)';schoolGPABg='#006400';}
        else if(schoolGPAVal<2.6){schoolGradeComment='B (V.Good)';schoolGPABg='#00AA00';}
        else if(schoolGPAVal<3.6){schoolGradeComment='C (Good)';schoolGPABg='#ADFF2F';}
        else if(schoolGPAVal<4.6){schoolGradeComment='D (Satisf)';schoolGPABg='#FFA500';}
        else{schoolGradeComment='F (Fail)';schoolGPABg='#FF0000';}
    }

    // ── Build tables ──────────────────────────────────────────────────────────
    function mkTbl(className) {
        const t = document.createElement('table');
        t.className = `axp-rr-table ${className}`;
        // No background color — all cells white; fixed borders for clean PDF rendering
        t.style.cssText = 'width:100%;border-collapse:collapse;font-size:clamp(7px,0.80vw,12px);margin-top:8px;table-layout:auto;background:#fff;color:#000;';
        return t;
    }

    // Centre Summary
    const csT = mkTbl('center-summary-table');
    csT.style.cssText = 'width:50%;border-collapse:collapse;font-size:13px;margin:12px auto;table-layout:auto;background:#fff;color:#000;';
    csT.innerHTML = `<thead><tr>
        <th colspan="2" style="text-align:center;background:#fff;color:#000;font-weight:bold;padding:5px 8px;border:0.5px solid #000;">EXAMINATION CENTRE OVERALL PERFORMANCE</th>
    </tr></thead>
        <tbody>
            <tr>
                <td style="font-weight:bold;padding:4px 8px;border:0.5px solid #000;width:65%;">TOTAL PASSED CANDIDATES (DIV I–IV)</td>
                <td style="text-align:left;font-weight:bold;padding:4px 8px;border:0.5px solid #000;">${passed}</td>
            </tr>
            <tr>
                <td style="font-weight:bold;padding:4px 8px;border:0.5px solid #000;">PERFORMANCE PERCENTAGE</td>
                <td style="text-align:left;font-weight:bold;padding:4px 8px;border:0.5px solid #000;">${perfPct}%</td>
            </tr>
            <tr>
                <td style="font-weight:bold;padding:4px 8px;border:0.5px solid #000;">SCHOOL GPA</td>
                <td style="text-align:left;font-weight:bold;padding:5px 8px;border:0.5px solid #000;font-size:11px;background:${schoolGPABg||'#fff'};color:${schoolGPABg&&['#006400','#00AA00','#FF0000'].includes(schoolGPABg)?'#fff':schoolGPABg?'#000':'#000'};-webkit-print-color-adjust:exact;print-color-adjust:exact;">
                    ${schoolGPA} — ${schoolGradeComment}
                </td>
            </tr>
        </tbody>`;

    // Overall Analysis — first col wide, F/M/T sub-cols narrow
    const oT = mkTbl('overall-analysis-table');
    // colgroup for width control
    const oCG = document.createElement('colgroup');
    const oColWidths = ['18%', ...Array(30).fill('2.7%')];
    oColWidths.forEach(w=>{ const c=document.createElement('col'); c.style.width=w; oCG.appendChild(c); });
    oT.appendChild(oCG);
    const oThead = document.createElement('thead');
    const oHR1 = document.createElement('tr');
    const oHR2 = document.createElement('tr');
    const thStyle = 'border:0.5px solid #000;padding:3px 4px;text-align:center;font-weight:bold;background:#fff;color:#000;';
    const thFirst = document.createElement('th');
    thFirst.textContent = 'CANDIDATES'; thFirst.rowSpan=2;
    thFirst.style.cssText = thStyle + 'text-align:left;vertical-align:middle;border:0.5px solid #000;';
    oHR1.appendChild(thFirst);
    ['REGISTERED','SAT','CLEAN','ABSENT','INC','DIV I','DIV II','DIV III','DIV IV','DIV 0']
        .forEach(h=>{ const th=document.createElement('th'); th.textContent=h; th.colSpan=3; th.style.cssText=thStyle+'vertical-align:middle;text-align:center;border:0.5px solid #000;'; oHR1.appendChild(th); });
    ['F','M','T'].concat(...Array(9).fill(['F','M','T'])).forEach(l=>{
        const th=document.createElement('th'); th.textContent=l;
        th.style.cssText=thStyle+'font-size:9px;padding:2px 1px;border:0.5px solid #000;';
        oHR2.appendChild(th);
    });
    oThead.appendChild(oHR1); oThead.appendChild(oHR2); oT.appendChild(oThead);
    const oTbody=document.createElement('tbody'); const oDR=document.createElement('tr');
    const catTd=document.createElement('td');
    catTd.textContent='No. of Candidates';
    catTd.style.cssText='border:0.5px solid #000;padding:3px 6px;font-weight:bold;text-align:left;background:#fff;color:#000;';
    oDR.appendChild(catTd);
    const tdSubStyle='border:0.5px solid #000;padding:2px 2px;text-align:center;vertical-align:middle;background:#fff;color:#000;font-size:10px;';
    ['registered','sat','clean','absent','INC'].forEach(key=>{
        const f=overall[key].F, m=overall[key].M;
        [f,m,f+m].forEach(v=>{ const td=document.createElement('td'); td.textContent=v; td.style.cssText=tdSubStyle; oDR.appendChild(td); });
    });
    ['I','II','III','IV','O'].forEach(d=>{
        const f=divCount[d].F, m=divCount[d].M;
        [f,m,f+m].forEach(v=>{ const td=document.createElement('td'); td.textContent=v; td.style.cssText=tdSubStyle; oDR.appendChild(td); });
    });
    oTbody.appendChild(oDR); oT.appendChild(oTbody);

    // Subject Table — wide subject col, narrow F/M/T, 2dp avg, coloured grade
    const sT = mkTbl('subject-table');
    // colgroup: subject=22%, sat cols=4% each, grade A-F (each 3 subcols @ 2%)=30%, aver=5%, gpa=5%, pos=4%, grade=6%
    const sCG = document.createElement('colgroup');
    const sColW = ['22%','4%','4%','5%',  // subject, satF, satM, total
        '2%','2%','3%', '2%','2%','3%', '2%','2%','3%', '2%','2%','3%', '2%','2%','3%', // A,B,C,D,F FMT
        '5%','5%','4%','7%']; // aver, gpa, pos, grade
    sColW.forEach(w=>{ const c=document.createElement('col'); c.style.width=w; sCG.appendChild(c); });
    sT.appendChild(sCG);
    const sThead=document.createElement('thead');
    const sHR1=document.createElement('tr'), sHR2=document.createElement('tr');
    const sTHStyle='border:0.5px solid #000;padding:3px 4px;text-align:center;font-weight:bold;background:#fff;color:#000;';
    const thS=document.createElement('th'); thS.textContent='SUBJECT'; thS.rowSpan=2; thS.style.cssText=sTHStyle+'text-align:left;vertical-align:middle;border:0.5px solid #000;'; sHR1.appendChild(thS);
    const satCols = [{t:'SAT-F',rs:2},{t:'SAT-M',rs:2},{t:'TOTAL',rs:2}];
    satCols.forEach(({t,rs})=>{ const th=document.createElement('th'); th.textContent=t; th.rowSpan=rs; th.style.cssText=sTHStyle+'font-size:9px;vertical-align:middle;border:0.5px solid #000;'; sHR1.appendChild(th); });
    ['A','B','C','D','F'].forEach(gr=>{ const th=document.createElement('th'); th.textContent=gr; th.colSpan=3; th.style.cssText=sTHStyle+'vertical-align:middle;text-align:center;border:0.5px solid #000;'; sHR1.appendChild(th); });
    ['AVER','GPA','POS','GRADE'].forEach(h=>{ const th=document.createElement('th'); th.textContent=h; th.rowSpan=2; th.style.cssText=sTHStyle+'vertical-align:middle;border:0.5px solid #000;'; sHR1.appendChild(th); });
    ['A','B','C','D','F'].forEach(()=>['F','M','T'].forEach(l=>{
        const th=document.createElement('th'); th.textContent=l; th.style.cssText=sTHStyle+'font-size:8px;padding:2px 1px;border:0.5px solid #000;'; sHR2.appendChild(th);
    }));
    sThead.appendChild(sHR1); sThead.appendChild(sHR2); sT.appendChild(sThead);
    const sTbody=document.createElement('tbody');
    const sTDBase='border:0.5px solid #000;padding:2px 3px;text-align:center;vertical-align:middle;background:#fff;color:#000;';
    Object.keys(subjectStats).forEach(sub=>{
        const row=document.createElement('tr'); row.style.pageBreakInside='avoid';
        const sTd=document.createElement('td'); sTd.textContent=sub;
        sTd.style.cssText=sTDBase+'text-align:left;font-weight:bold;font-size:10px;white-space:nowrap;overflow:hidden;';
        row.appendChild(sTd);
        const satF=subjectCounts[sub]?.F||0, satM=subjectCounts[sub]?.M||0;
        [satF,satM,satF+satM].forEach(v=>{ const td=document.createElement('td'); td.textContent=v; td.style.cssText=sTDBase+'font-size:10px;'; row.appendChild(td); });
        ['A','B','C','D','F'].forEach(gr=>{
            const gF=subjectStats[sub][gr]['F']||0, gM=subjectStats[sub][gr]['M']||0;
            [gF,gM,gF+gM].forEach(v=>{ const td=document.createElement('td'); td.textContent=v; td.style.cssText=sTDBase+'font-size:9px;padding:2px 1px;'; row.appendChild(td); });
        });
        // Average — 2dp only
        const avgVal = finalAvgs[sub]!=='N/A' ? parseFloat(finalAvgs[sub]).toFixed(2) : 'N/A';
        const tdA=document.createElement('td'); tdA.textContent=avgVal; tdA.style.cssText=sTDBase; row.appendChild(tdA);
        const tdG=document.createElement('td'); tdG.textContent=finalGPAs[sub];
        { const gv=parseFloat(finalGPAs[sub]); const gpaBg=gv<1.6?'#006400':gv<2.6?'#00AA00':gv<3.6?'#ADFF2F':gv<4.6?'#FFA500':'#FF0000'; const gpaFg=(gv<1.6||gv>=1.6&&gv<2.6||gv>=4.6)?'#fff':'#000'; tdG.style.cssText=isNaN(gv)?sTDBase:`${sTDBase}background:${gpaBg};color:${gpaFg};font-weight:bold;-webkit-print-color-adjust:exact;print-color-adjust:exact;`; }
        row.appendChild(tdG);
        // Position — centred
        const tdP=document.createElement('td'); tdP.textContent=positions[sub]||''; tdP.style.cssText=sTDBase+'font-weight:bold;'; row.appendChild(tdP);
        // Grade cell — align LEFT, background coloured by GPA grade
        const tdC=document.createElement('td');
        const gt=finalGrades[sub];
        const gradeLabel = gt.startsWith('A')?'A':gt.startsWith('B')?'B':gt.startsWith('C')?'C':gt.startsWith('D')?'D':'F';
        const grBg = gradeLabel==='A'?'#006400':gradeLabel==='B'?'#00AA00':gradeLabel==='C'?'#ADFF2F':gradeLabel==='D'?'#FFA500':'#FF0000';
        const grFg = (gradeLabel==='A'||gradeLabel==='B'||gradeLabel==='F') ? '#fff' : '#000';
        tdC.textContent=gt;
        tdC.style.cssText=`${sTDBase}text-align:left;padding-left:5px;font-weight:bold;background:${grBg};color:${grFg};-webkit-print-color-adjust:exact;print-color-adjust:exact;`;
        row.appendChild(tdC);
        sTbody.appendChild(row);
    });
    sT.appendChild(sTbody);

    // ── All analysis tables on one single last page ─────────────────────────
    const lastPage = document.createElement('div');
    lastPage.style.cssText = 'page-break-before:always;break-before:page;padding:8px 0 0;';
    lastPage.appendChild(csT);
    lastPage.appendChild(oT);
    lastPage.appendChild(sT);

    const wrapper = document.createElement('div');
    wrapper.appendChild(lastPage);
    return wrapper;
}


// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5d: Analysis, Ranking, General, Subject-wise, Subject Ranking views
//   All views produce clean, formal, print-ready document tables — no widgets,
//   no dashboard colours, no progress bars. White background, black borders.
// ─────────────────────────────────────────────────────────────────────────────

// Shared helper — builds a formal document wrapper with school header + title
function _axpFormalDoc(titleText) {
    const si       = _axpSchoolInfo('en');
    const rawExam  = document.getElementById('axpRRExamSel') ? document.getElementById('axpRRExamSel').value : '';
    const rawCls   = document.getElementById('axpRRClassSel') ? document.getElementById('axpRRClassSel').value : '';
    const logo     = window.getSchoolLogo ? window.getSchoolLogo() : null;

    // Translated labels
    const examLabel = _axpExamLabel(rawExam, 'en');
    const clsLabel  = _axpClassLabel(rawCls, 'en');
    const year      = (typeof _schoolMeta !== 'undefined' && _schoolMeta && _schoolMeta.year)
                      ? _schoolMeta.year : new Date().getFullYear();

    const headerMeta = `${clsLabel.toUpperCase()}  |  ${examLabel.toUpperCase()}  |  ${year}`;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'background:#fff;color:#000;font-family:Arial,sans-serif;padding:10px;';

    // School header — logo left + identity centre + logo right
    const hdr = document.createElement('div');
    hdr.style.cssText = 'text-align:center;border-bottom:2.5px solid #000;padding-bottom:8px;margin-bottom:8px;';
    const _dd_fd   = (typeof _dashboardData !== 'undefined') ? _dashboardData : {};
    const _districtLine = _dd_fd.district
        ? `<div style="font-size:9px;color:#555;text-transform:uppercase;">${escapeHtml(_dd_fd.district.toUpperCase())} DISTRICT COUNCIL</div>`
        : '';
    const centreHtml = `
        <div style="font-size:8px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;color:#555;">
            PRESIDENT'S OFFICE — REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT
        </div>
        ${_districtLine}
        <div style="font-size:15px;font-weight:900;text-transform:uppercase;margin:3px 0;letter-spacing:0.5px;">${escapeHtml(si.displayName)}</div>
        <div style="font-size:10px;color:#555;">${escapeHtml(si.displayLine2)}</div>
        <div style="font-size:10.5px;font-weight:bold;margin-top:4px;letter-spacing:0.5px;border-top:1px solid #ccc;padding-top:3px;">${escapeHtml(headerMeta)}</div>`;
    hdr.innerHTML = logo
        ? `<div style="display:flex;align-items:center;gap:10px;padding:0 8px;">
               <img src="${logo}" style="width:52px;height:52px;object-fit:contain;flex-shrink:0;">
               <div style="flex:1;">${centreHtml}</div>
               <img src="${logo}" style="width:52px;height:52px;object-fit:contain;flex-shrink:0;">
           </div>`
        : centreHtml;
    wrap.appendChild(hdr);

    // Section title bar
    const ttl = document.createElement('div');
    ttl.style.cssText = 'background:#fff;color:#000;font-size:12px;font-weight:bold;text-align:center;padding:5px 0;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;border-bottom:1.5px solid #000;';
    ttl.textContent = titleText;
    wrap.appendChild(ttl);

    return wrap;
}

// Shared helper — returns a clean formal <table> element
function _axpFormalTable(colWidths) {
    const t = document.createElement('table');
    t.style.cssText = 'width:100%;border-collapse:collapse;font-size:11px;font-family:Arial,sans-serif;margin-bottom:12px;table-layout:fixed;';
    if (colWidths && colWidths.length) {
        const cg = document.createElement('colgroup');
        colWidths.forEach(w => { const c = document.createElement('col'); c.style.width = w; cg.appendChild(c); });
        t.appendChild(cg);
    }
    return t;
}

// Shared helper — creates a <th> cell
function _axpTH(text, opts) {
    opts = opts || {};
    const th = document.createElement('th');
    th.textContent = text;
    th.style.cssText = `border:0.5px solid #000;padding:4px 6px;text-align:${opts.align||'center'};font-weight:bold;background:#fff;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact;${opts.extra||''}`;
    if (opts.colspan) th.colSpan = opts.colspan;
    if (opts.rowspan) th.rowSpan = opts.rowspan;
    return th;
}

// Shared helper — creates a <td> cell
function _axpTD(text, opts) {
    opts = opts || {};
    const td = document.createElement('td');
    td.textContent = text == null ? '' : String(text);
    td.style.cssText = `border:0.5px solid #000;padding:3px 5px;text-align:${opts.align||'center'};background:#fff;color:#000;${opts.extra||''}`;
    if (opts.bold)    td.style.fontWeight = 'bold';
    if (opts.colspan) td.colSpan = opts.colspan;
    return td;
}


// ── ANALYSIS VIEW ─────────────────────────────────────────────────────────────
function _buildAnalysisView(students) {
    const cls      = document.getElementById('axpRRClassSel') ? document.getElementById('axpRRClassSel').value : '';
    const examType = document.getElementById('axpRRExamSel')  ? document.getElementById('axpRRExamSel').value  : '';

    // Compute stats
    let mCnt=0, fCnt=0, mPts=0, fPts=0;
    const divCount = { I:0, II:0, III:0, IV:0, O:0 };
    const divGender = { I:{M:0,F:0}, II:{M:0,F:0}, III:{M:0,F:0}, IV:{M:0,F:0}, O:{M:0,F:0} };
    students.forEach(s => {
        const g = s.gender === 'F' ? 'F' : 'M';
        if (g==='M') { mCnt++; mPts += s.point||0; } else { fCnt++; fPts += s.point||0; }
        if (divCount[s.division]!==undefined) { divCount[s.division]++; divGender[s.division][g]++; }
    });
    const total   = students.length;
    const passed  = divCount.I + divCount.II + divCount.III + divCount.IV;
    const failed  = divCount.O;
    const passRate = total ? ((passed/total)*100).toFixed(1) : '0.0';
    const mAvgPts  = mCnt ? (mPts/mCnt).toFixed(2) : 'N/A';
    const fAvgPts  = fCnt ? (fPts/fCnt).toFixed(2) : 'N/A';

    // Subject averages
    const sTot={}, sCnt={};
    students.forEach(s => Object.entries(s.scores||{}).forEach(([sub,sc]) => {
        if (typeof sc.mark==='number') { sTot[sub]=(sTot[sub]||0)+sc.mark; sCnt[sub]=(sCnt[sub]||0)+1; }
    }));
    const subjRows = Object.keys(sTot).map(sub => {
        const avg = sTot[sub]/sCnt[sub];
        const g   = _axpGrade(avg);
        return { sub, avg: avg.toFixed(2), grade: g.grade };
    }).sort((a,b) => parseFloat(b.avg)-parseFloat(a.avg));

    const _siA   = _axpSchoolInfo('en');
    const _rawExA = document.getElementById('axpRRExamSel') ? document.getElementById('axpRRExamSel').value : '';
    const _yearA  = (typeof _schoolMeta!=='undefined'&&_schoolMeta&&_schoolMeta.year) ? _schoolMeta.year : new Date().getFullYear();
    const _titleA = `ACADEMIC PERFORMANCE ANALYSIS — ${_axpClassLabel(cls,'en').toUpperCase()} | ${_axpExamLabel(_rawExA,'en').toUpperCase()} | ${_yearA}`;
    const wrap = _axpFormalDoc(_titleA);

    // Summary stats table
    const sumT = _axpFormalTable(['25%','15%','15%','15%','15%','15%']);
    const sumThead = document.createElement('thead');
    const sumHR = document.createElement('tr');
    [
        {t:'CATEGORY', a:'left'},
        {t:'MALE'},   {t:'FEMALE'}, {t:'TOTAL'},
        {t:'PASS %'}, {t:'REMARK', a:'left'}
    ].forEach(h => sumHR.appendChild(_axpTH(h.t, {align:h.a||'center'})));
    sumThead.appendChild(sumHR);
    sumT.appendChild(sumThead);

    const sumTbody = document.createElement('tbody');
    const rows = [
        ['Registered Students', mCnt, fCnt, total, passRate+'%', `${passed} passed, ${failed} failed`],
        ['Division I',   divGender.I.M,   divGender.I.F,   divCount.I,   total?(divCount.I/total*100).toFixed(1)+'%':'0%',   'Excellent'],
        ['Division II',  divGender.II.M,  divGender.II.F,  divCount.II,  total?(divCount.II/total*100).toFixed(1)+'%':'0%',  'Very Good'],
        ['Division III', divGender.III.M, divGender.III.F, divCount.III, total?(divCount.III/total*100).toFixed(1)+'%':'0%', 'Good'],
        ['Division IV',  divGender.IV.M,  divGender.IV.F,  divCount.IV,  total?(divCount.IV/total*100).toFixed(1)+'%':'0%',  'Satisfactory'],
        ['Division 0',   divGender.O.M,   divGender.O.F,   divCount.O,   total?(divCount.O/total*100).toFixed(1)+'%':'0%',   'Fail'],
        ['Average Points', mAvgPts, fAvgPts, '-', '-', `Class avg (M/F)`],
    ];
    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.appendChild(_axpTD(r[0], {align:'left', bold:true}));
        [r[1],r[2],r[3],r[4]].forEach(v => tr.appendChild(_axpTD(v)));
        tr.appendChild(_axpTD(r[5], {align:'left'}));
        sumTbody.appendChild(tr);
    });
    sumT.appendChild(sumTbody);
    wrap.appendChild(sumT);

    // Subject averages table
    const subHdr = document.createElement('div');
    subHdr.style.cssText = 'font-size:11px;font-weight:bold;color:#1a3a5c;border-bottom:1.5px solid #1a3a5c;padding-bottom:2px;margin:10px 0 4px;text-transform:uppercase;';
    subHdr.textContent = 'Subject Performance Summary';
    wrap.appendChild(subHdr);

    const subT = _axpFormalTable(['5%','40%','15%','15%','25%']);
    const subThead = document.createElement('thead');
    const subHR = document.createElement('tr');
    [{t:'#'},{t:'SUBJECT', a:'left'},{t:'AVG MARK'},{t:'GRADE'},{t:'PERFORMANCE LEVEL', a:'left'}].forEach(h =>
        subHR.appendChild(_axpTH(h.t, {align:h.a||'center'})));
    subThead.appendChild(subHR);
    subT.appendChild(subThead);

    const subTbody = document.createElement('tbody');
    subjRows.forEach((r,i) => {
        const tr = document.createElement('tr');
        const perf = parseFloat(r.avg)>=75?'Excellent':parseFloat(r.avg)>=60?'Very Good':parseFloat(r.avg)>=50?'Good':parseFloat(r.avg)>=40?'Satisfactory':'Needs Improvement';
        tr.appendChild(_axpTD(i+1));
        tr.appendChild(_axpTD(r.sub, {align:'left', bold:true}));
        tr.appendChild(_axpTD(r.avg));
        tr.appendChild(_axpTD(r.grade, {bold:true}));
        tr.appendChild(_axpTD(perf, {align:'left'}));
        subTbody.appendChild(tr);
    });
    subT.appendChild(subTbody);
    wrap.appendChild(subT);

    return wrap;
}


// ── TOP 10 / LEAST 10 RANKING VIEW ────────────────────────────────────────────
function _buildRankingView(students, direction, limit) {
    const eligible = students.filter(s => s.point>=7 && s.point<=35).sort((a,b) => a.point-b.point);
    eligible.forEach((s,i) => { s.position=i+1; s.total=eligible.length; });

    const ranked = direction==='top'
        ? eligible.slice(0, limit)
        : [...eligible].reverse().slice(0, limit);

    const _rawClsR  = document.getElementById('axpRRClassSel') ? document.getElementById('axpRRClassSel').value : '';
    const _rawExR   = document.getElementById('axpRRExamSel')  ? document.getElementById('axpRRExamSel').value  : '';
    const _yearR    = (typeof _schoolMeta!=='undefined'&&_schoolMeta&&_schoolMeta.year) ? _schoolMeta.year : new Date().getFullYear();
    const _sfxR     = ` — ${_axpClassLabel(_rawClsR,'en').toUpperCase()} | ${_axpExamLabel(_rawExR,'en').toUpperCase()} | ${_yearR}`;
    const title = direction==='top'
        ? `TOP ${limit} PERFORMING STUDENTS${_sfxR}`
        : `LEAST ${limit} PERFORMING STUDENTS${_sfxR}`;

    const _siR = _axpSchoolInfo('en');
    const schoolIdx = (_siR.rawIndex || '').replace(/[.\/\\\s]/g, '').toUpperCase();

    const wrap = _axpFormalDoc(title);

    // Intro paragraph
    const intro = document.createElement('p');
    intro.style.cssText = 'font-size:10px;color:#333;margin-bottom:8px;line-height:1.6;';
    intro.textContent = direction==='top'
        ? `The following ${ranked.length} students achieved the highest academic performance in this examination, ranked by aggregate points (lowest = best).`
        : `The following ${ranked.length} students recorded the lowest academic performance in this examination. Their performance requires attention and support.`;
    wrap.appendChild(intro);

    const tbl = _axpFormalTable(['6%','8%','30%','6%','8%','8%','7%','27%']);
    const thead = document.createElement('thead');
    const hrow = document.createElement('tr');
    [{t:'RANK'},{t:'CAND NO.',a:'left'},{t:'FULL NAME',a:'left'},{t:'SEX'},
     {t:'POINTS'},{t:'DIVISION'},{t:'POSITION'},{t:'SUBJECTS SUMMARY',a:'left'}]
    .forEach(h => hrow.appendChild(_axpTH(h.t, {align:h.a||'center'})));
    thead.appendChild(hrow);
    tbl.appendChild(thead);

    const tbody = document.createElement('tbody');
    ranked.forEach((s, i) => {
        const tr = document.createElement('tr');
        tr.style.cssText = 'page-break-inside:avoid;break-inside:avoid;';
        const candNum = schoolIdx ? `${schoolIdx}-${String(students.indexOf(s)+1).padStart(4,'0')}` : `S000-${String(i+1).padStart(4,'0')}`;
        const summary = Object.entries(s.scores||{})
            .filter(([,sc]) => sc.mark!=null && sc.mark!=='')
            .map(([sub,sc]) => `${sub}:${sc.mark}(${sc.grade})`).join('  ');
        tr.appendChild(_axpTD(i+1, {bold:true}));
        tr.appendChild(_axpTD(candNum, {align:'left'}));
        tr.appendChild(_axpTD(s.name, {align:'left', bold:true}));
        tr.appendChild(_axpTD(s.gender||'-'));
        tr.appendChild(_axpTD(s.point, {bold:true}));
        tr.appendChild(_axpTD(s.division, {bold:true}));
        tr.appendChild(_axpTD(s.position ? `${s.position}/${s.total}` : '-'));
        tr.appendChild(_axpTD(summary, {align:'left', extra:'white-space:normal;word-break:break-word;font-size:9px;'}));
        tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);

    // Summary footer
    const foot = document.createElement('p');
    foot.style.cssText = 'font-size:9.5px;color:#555;margin-top:6px;border-top:1px solid #ccc;padding-top:4px;';
    foot.textContent = `Total eligible candidates: ${eligible.length}  |  Showing: ${ranked.length} ${direction==='top'?'highest':'lowest'} performing students`;
    wrap.appendChild(foot);

    return wrap;
}


// ── GENERAL RESULT VIEW ────────────────────────────────────────────────────────
function _buildGeneralView(students) {
    const eligible = students.filter(s => s.point>=7 && s.point<=35);
    const divCount = { I:0, II:0, III:0, IV:0, O:0 };
    const divGender = { I:{M:0,F:0}, II:{M:0,F:0}, III:{M:0,F:0}, IV:{M:0,F:0}, O:{M:0,F:0} };
    let mReg=0, fReg=0;
    students.forEach(s => {
        const g = s.gender==='F' ? 'F' : 'M';
        if (g==='M') mReg++; else fReg++;
        if (divCount[s.division]!==undefined) { divCount[s.division]++; divGender[s.division][g]++; }
    });
    const total  = students.length;
    const passed = ['I','II','III','IV'].reduce((sum,d) => sum+divCount[d], 0);

    const _rawClsG = document.getElementById('axpRRClassSel') ? document.getElementById('axpRRClassSel').value : '';
    const _rawExG  = document.getElementById('axpRRExamSel')  ? document.getElementById('axpRRExamSel').value  : '';
    const _yearG   = (typeof _schoolMeta!=='undefined'&&_schoolMeta&&_schoolMeta.year) ? _schoolMeta.year : new Date().getFullYear();
    const _titleG  = `GENERAL EXAMINATION RESULTS SUMMARY — ${_axpClassLabel(_rawClsG,'en').toUpperCase()} | ${_axpExamLabel(_rawExG,'en').toUpperCase()} | ${_yearG}`;
    const wrap = _axpFormalDoc(_titleG);

    // Registered/Passed/Failed summary
    const sumT = _axpFormalTable(['40%','20%','20%','20%']);
    const sumHead = document.createElement('thead');
    const sumHR = document.createElement('tr');
    [{t:'DESCRIPTION',a:'left'},{t:'MALE'},{t:'FEMALE'},{t:'TOTAL'}].forEach(h =>
        sumHR.appendChild(_axpTH(h.t, {align:h.a||'center'})));
    sumHead.appendChild(sumHR);
    sumT.appendChild(sumHead);

    const sumBody = document.createElement('tbody');
    [
        ['Total Registered Candidates', mReg, fReg, total],
        ['Total Passed (Div I–IV)',
            ['I','II','III','IV'].reduce((s,d)=>s+divGender[d].M,0),
            ['I','II','III','IV'].reduce((s,d)=>s+divGender[d].F,0),
            passed],
        ['Total Failed (Div 0)',
            divGender.O.M, divGender.O.F, divCount.O],
        ['Pass Rate', '-', '-', total ? (passed/total*100).toFixed(2)+'%' : '0.00%'],
    ].forEach(r => {
        const tr = document.createElement('tr');
        tr.appendChild(_axpTD(r[0], {align:'left', bold:true}));
        [r[1],r[2],r[3]].forEach(v => tr.appendChild(_axpTD(v, {bold: r[0]==='Pass Rate'})));
        sumBody.appendChild(tr);
    });
    sumT.appendChild(sumBody);
    wrap.appendChild(sumT);

    // Division breakdown
    const divHdr = document.createElement('div');
    divHdr.style.cssText = 'font-size:11px;font-weight:bold;color:#1a3a5c;border-bottom:1.5px solid #1a3a5c;padding-bottom:2px;margin:10px 0 4px;text-transform:uppercase;';
    divHdr.textContent = 'Division Breakdown';
    wrap.appendChild(divHdr);

    const divT = _axpFormalTable(['20%','15%','15%','15%','20%','15%']);
    const divHead = document.createElement('thead');
    const divHR = document.createElement('tr');
    [{t:'DIVISION',a:'left'},{t:'MALE'},{t:'FEMALE'},{t:'TOTAL'},{t:'% OF CLASS'},{t:'REMARK',a:'left'}].forEach(h =>
        divHR.appendChild(_axpTH(h.t, {align:h.a||'center'})));
    divHead.appendChild(divHR);
    divT.appendChild(divHead);

    const divBody = document.createElement('tbody');
    const divLabels = {I:'Division I',II:'Division II',III:'Division III',IV:'Division IV',O:'Division 0 (Fail)'};
    const divRemarks = {I:'Excellent',II:'Very Good',III:'Good',IV:'Satisfactory',O:'Fail'};
    ['I','II','III','IV','O'].forEach(d => {
        const tr = document.createElement('tr');
        tr.appendChild(_axpTD(divLabels[d], {align:'left', bold:true}));
        tr.appendChild(_axpTD(divGender[d].M));
        tr.appendChild(_axpTD(divGender[d].F));
        tr.appendChild(_axpTD(divCount[d], {bold:true}));
        tr.appendChild(_axpTD(total ? (divCount[d]/total*100).toFixed(2)+'%' : '0.00%'));
        tr.appendChild(_axpTD(divRemarks[d], {align:'left'}));
        divBody.appendChild(tr);
    });
    // Total row
    const totTR = document.createElement('tr');
    totTR.appendChild(_axpTD('TOTAL', {align:'left', bold:true}));
    totTR.appendChild(_axpTD(mReg, {bold:true}));
    totTR.appendChild(_axpTD(fReg, {bold:true}));
    totTR.appendChild(_axpTD(total, {bold:true}));
    totTR.appendChild(_axpTD('100.00%', {bold:true}));
    totTR.appendChild(_axpTD(''));
    divBody.appendChild(totTR);
    divT.appendChild(divBody);
    wrap.appendChild(divT);

    return wrap;
}


// ── SUBJECT WISE VIEW ──────────────────────────────────────────────────────────
function _buildSubjectWiseView(students) {
    const subjects = [...new Set(students.flatMap(s => Object.keys(s.scores||{})))].sort();
    const _siSW = _axpSchoolInfo('en');
    const schoolIdx = (_siSW.rawIndex || '').replace(/[.\/\\\s]/g, '').toUpperCase();
    const _rawClsSW = document.getElementById('axpRRClassSel') ? document.getElementById('axpRRClassSel').value : '';
    const _rawExSW  = document.getElementById('axpRRExamSel')  ? document.getElementById('axpRRExamSel').value  : '';
    const _yearSW   = (typeof _schoolMeta!=='undefined'&&_schoolMeta&&_schoolMeta.year) ? _schoolMeta.year : new Date().getFullYear();
    const _titleSW  = `SUBJECT-WISE STUDENT PERFORMANCE — ${_axpClassLabel(_rawClsSW,'en').toUpperCase()} | ${_axpExamLabel(_rawExSW,'en').toUpperCase()} | ${_yearSW}`;
    const wrap = _axpFormalDoc(_titleSW);

    subjects.forEach(sub => {
        const subStudents = students
            .filter(s => s.scores&&s.scores[sub]&&s.scores[sub].mark!=null&&s.scores[sub].mark!=='')
            .sort((a,b) => (b.scores[sub].mark||0) - (a.scores[sub].mark||0));

        if (!subStudents.length) return;

        // Subject section heading
        const subHdr = document.createElement('div');
        subHdr.style.cssText = 'background:#fff;color:#000;font-weight:bold;font-size:11px;padding:4px 8px;margin-bottom:0;text-transform:uppercase;border-bottom:1px solid #333;';
        subHdr.textContent = `Subject: ${sub}`;
        wrap.appendChild(subHdr);

        // Stats row (total sat, highest, lowest, avg)
        const marks = subStudents.map(s => s.scores[sub].mark);
        const highest = Math.max(...marks), lowest = Math.min(...marks);
        const avg = (marks.reduce((a,b)=>a+b,0)/marks.length).toFixed(2);
        const gradeCount = {A:0,B:0,C:0,D:0,F:0};
        subStudents.forEach(s => { if (gradeCount[s.scores[sub].grade]!==undefined) gradeCount[s.scores[sub].grade]++; });

        const statsRow = document.createElement('div');
        statsRow.style.cssText = 'font-size:9.5px;color:#333;padding:3px 8px 4px;border:1px solid #ccc;border-top:none;margin-bottom:0;background:#f8f9fa;-webkit-print-color-adjust:exact;print-color-adjust:exact;';
        statsRow.innerHTML = `Sat: <b>${subStudents.length}</b> &nbsp;|&nbsp; Highest: <b>${highest}</b> &nbsp;|&nbsp; Lowest: <b>${lowest}</b> &nbsp;|&nbsp; Average: <b>${avg}</b> &nbsp;|&nbsp; A:${gradeCount.A} &nbsp;B:${gradeCount.B} &nbsp;C:${gradeCount.C} &nbsp;D:${gradeCount.D} &nbsp;F:${gradeCount.F}`;
        wrap.appendChild(statsRow);

        // Student marks table
        const tbl = _axpFormalTable(['6%','8%','46%','8%','8%','8%','16%']);
        const thead = document.createElement('thead');
        const hrow = document.createElement('tr');
        [{t:'#'},{t:'CAND NO.',a:'left'},{t:'STUDENT NAME',a:'left'},{t:'SEX'},{t:'MARK'},{t:'GRADE'},{t:'PERFORMANCE',a:'left'}].forEach(h =>
            hrow.appendChild(_axpTH(h.t, {align:h.a||'center'})));
        thead.appendChild(hrow);
        tbl.appendChild(thead);

        const tbody = document.createElement('tbody');
        subStudents.forEach((s, i) => {
            const tr = document.createElement('tr');
            tr.style.cssText = 'page-break-inside:avoid;break-inside:avoid;';
            const candNum = schoolIdx ? `${schoolIdx}-${String(students.indexOf(s)+1).padStart(4,'0')}` : `S000-${String(i+1).padStart(4,'0')}`;
            const mark  = s.scores[sub].mark;
            const grade = s.scores[sub].grade || _axpGrade(mark).grade;
            const perf  = mark>=75?'Excellent':mark>=60?'Very Good':mark>=50?'Good':mark>=40?'Satisfactory':'Needs Improvement';
            tr.appendChild(_axpTD(i+1));
            tr.appendChild(_axpTD(candNum, {align:'left'}));
            tr.appendChild(_axpTD(s.name, {align:'left', bold:true}));
            tr.appendChild(_axpTD(s.gender||'-'));
            tr.appendChild(_axpTD(mark, {bold:true}));
            tr.appendChild(_axpTD(grade, {bold:true}));
            tr.appendChild(_axpTD(perf, {align:'left'}));
            tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        wrap.appendChild(tbl);

        // Spacer between subjects
        const spacer = document.createElement('div');
        spacer.style.cssText = 'height:10px;';
        wrap.appendChild(spacer);
    });

    return wrap;
}


// ── SUBJECT RANKING VIEW ───────────────────────────────────────────────────────
function _buildSubjectRankingView(students) {
    const gv = {A:1,B:2,C:3,D:4,F:5};
    const subjData = {};

    students.forEach(s => Object.entries(s.scores||{}).forEach(([sub,sc]) => {
        if (!subjData[sub]) subjData[sub] = { gpaSum:0, cnt:0, markSum:0, markCnt:0, A:0,B:0,C:0,D:0,F:0, F_cnt:0, M_cnt:0 };
        const g = s.gender==='F' ? 'F' : 'M';
        if (gv[sc.grade]) {
            subjData[sub].gpaSum += gv[sc.grade];
            subjData[sub].cnt++;
            if (subjData[sub][sc.grade]!==undefined) subjData[sub][sc.grade]++;
        }
        if (typeof sc.mark==='number') {
            subjData[sub].markSum += sc.mark;
            subjData[sub].markCnt++;
        }
        if (g==='F') subjData[sub].F_cnt++; else subjData[sub].M_cnt++;
    }));

    const ranked = Object.keys(subjData).map(sub => {
        const d = subjData[sub];
        const gpa = d.cnt ? d.gpaSum/d.cnt : 99;
        const avg = d.markCnt ? d.markSum/d.markCnt : 0;
        let grade='F', perf='Fail';
        if (gpa<1.6){grade='A';perf='Excellent';}
        else if(gpa<2.6){grade='B';perf='Very Good';}
        else if(gpa<3.6){grade='C';perf='Good';}
        else if(gpa<4.6){grade='D';perf='Satisfactory';}
        return { sub, gpa: gpa.toFixed(4), avg: avg.toFixed(2), grade, perf,
            total: d.cnt, A:d.A, B:d.B, C:d.C, D:d.D, F:d.F,
            fCnt: d.F_cnt, mCnt: d.M_cnt };
    }).sort((a,b) => parseFloat(a.gpa)-parseFloat(b.gpa));

    const _rawClsRk = document.getElementById('axpRRClassSel') ? document.getElementById('axpRRClassSel').value : '';
    const _rawExRk  = document.getElementById('axpRRExamSel')  ? document.getElementById('axpRRExamSel').value  : '';
    const _yearRk   = (typeof _schoolMeta!=='undefined'&&_schoolMeta&&_schoolMeta.year) ? _schoolMeta.year : new Date().getFullYear();
    const _titleRk  = `SUBJECT RANKING BY ACADEMIC PERFORMANCE — ${_axpClassLabel(_rawClsRk,'en').toUpperCase()} | ${_axpExamLabel(_rawExRk,'en').toUpperCase()} | ${_yearRk}`;
    const wrap = _axpFormalDoc(_titleRk);

    // Intro
    const intro = document.createElement('p');
    intro.style.cssText = 'font-size:10px;color:#333;margin-bottom:8px;line-height:1.6;';
    intro.textContent = `Subjects are ranked from best to weakest performance based on GPA (Grade Point Average). Lower GPA = better performance. Rankings are based on ${students.length} registered students.`;
    wrap.appendChild(intro);

    const tbl = _axpFormalTable(['5%','20%','8%','8%','8%','6%','6%','6%','6%','6%','11%','10%']);
    const thead = document.createElement('thead');
    const hr1 = document.createElement('tr');
    const hr2 = document.createElement('tr');

    // Row 1 headers
    [{t:'RANK'},{t:'SUBJECT',a:'left'},{t:'SAT',extra:'border-bottom:none'},{t:'AVG'},{t:'GPA'},{t:'A',extra:'border-bottom:none'},
     {t:'B',extra:'border-bottom:none'},{t:'C',extra:'border-bottom:none'},{t:'D',extra:'border-bottom:none'},{t:'F',extra:'border-bottom:none'},
     {t:'PERFORMANCE',a:'left'},{t:'GRADE'}].forEach(h =>
        hr1.appendChild(_axpTH(h.t, {align:h.a||'center'})));
    thead.appendChild(hr1);
    tbl.appendChild(thead);

    const tbody = document.createElement('tbody');
    ranked.forEach((r, i) => {
        const tr = document.createElement('tr');
        tr.appendChild(_axpTD(i+1, {bold:true}));
        tr.appendChild(_axpTD(r.sub, {align:'left', bold:true}));
        tr.appendChild(_axpTD(r.total));
        tr.appendChild(_axpTD(r.avg));
        tr.appendChild(_axpTD(r.gpa));
        [r.A, r.B, r.C, r.D, r.F].forEach(v => tr.appendChild(_axpTD(v)));
        tr.appendChild(_axpTD(r.perf, {align:'left'}));
        tr.appendChild(_axpTD(r.grade, {bold:true}));
        tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);

    // Footer note
    const note = document.createElement('p');
    note.style.cssText = 'font-size:9px;color:#555;margin-top:6px;border-top:1px solid #ccc;padding-top:4px;font-style:italic;';
    note.textContent = 'GPA Scale: A=1 (Excellent), B=2 (Very Good), C=3 (Good), D=4 (Satisfactory), F=5 (Fail). Lower GPA indicates better overall performance.';
    wrap.appendChild(note);

    return wrap;
}




// SECTION 6: Individual Student Progress Reports
// Replaces renderStudentsReportSection + axpLoadStudentsReport + _renderStudentsReport
// ─────────────────────────────────────────────────────────────────────────────

// Called by navigateToSection() in File 1 — same name as the deleted function
function renderStudentsReportSection(containerEl) {
    // Accept a container passed directly from navigateToSection(containerEl)
    // — 'students-report' is NOT in the sidebar, so this is called via the
    // "Student Reports" button inside the Results section, NOT from the nav.
    // When called from the nav routing, it falls through to renderResultsSection().
    const cont = containerEl
        || document.getElementById('axpSectionWrapper')
        || document.querySelector('.dashboard-content')
        || document.getElementById('mainContent')
        || document.getElementById('section-content');

    if (!cont) return;

    const meta = _schoolMeta;
    if (!meta || !meta.classes || !meta.classes.length) {
        cont.innerHTML = `<div class="axp-section-card"><div class="axp-empty-state"><i class="bi bi-exclamation-circle" style="font-size:2em;"></i><p>No classes configured.</p></div></div>`;
        return;
    }

    cont.innerHTML = `
        <div class="axp-section-card">
            <h2 class="axp-section-title"><i class="bi bi-file-person"></i> Student Progress Reports</h2>
            <div class="axp-form-row" style="gap:0.8em;flex-wrap:wrap;margin-bottom:1.5em;">
                <div class="axp-field-group">
                    <label class="axp-label"><i class="bi bi-collection"></i> Class</label>
                    <select id="axpRepClassSel" class="axp-select">
                        <option value="">— Select Class —</option>
                        ${meta.classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
                    </select>
                </div>
                <div class="axp-field-group">
                    <label class="axp-label"><i class="bi bi-journal-text"></i> Exam Type</label>
                    <select id="axpRepExamSel" class="axp-select">
                        <option value="">— Select Exam —</option>
                        ${(meta.examTypes||[]).map(e=>`<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`).join('')}
                    </select>
                </div>
                <div style="display:flex;align-items:flex-end;">
                    <button id="axpRepLoadBtn" class="axp-btn-primary" style="display:flex;align-items:center;gap:0.5em;">
                        <i class="bi bi-search"></i> Load Reports
                    </button>
                </div>
            </div>
            <div id="axpRepMsg"></div>
            <div id="axpRepContainer"></div>
        </div>`;

    document.getElementById('axpRepLoadBtn').onclick = () => {
        const cls = document.getElementById('axpRepClassSel').value;
        const examType = document.getElementById('axpRepExamSel').value;
        if (!cls||!examType) { _showSectionMsg('axpRepMsg','Please select both a class and exam type.','warning'); return; }

        document.getElementById('axpRepContainer').innerHTML = `
            <div style="text-align:center;padding:2em;color:#888;">
                <i class="bi bi-hourglass-split" style="font-size:2em;display:block;margin-bottom:0.5em;"></i> Loading…
            </div>`;

        _apiGet({ schoolId: _appScriptSchoolId, year: _schoolMeta.year, class: cls, examType })
            .then(res => {
                // Normalise: derive grade/point/division from raw marks on the frontend
                const students = _axpNormalizeStudents(res.students||res.data||[]);
                if (!students.length) { _showSectionMsg('axpRepMsg','No students found.','info'); document.getElementById('axpRepContainer').innerHTML=''; return; }
                renderStudentReports(students, document.getElementById('axpRepContainer'));
            })
            .catch(err => { _showSectionMsg('axpRepMsg',`Error: ${err.message}`,'error'); });
    };
}

function renderStudentReports(students, container) {
    container = container || document.getElementById('section-students-report');
    container.innerHTML = '';

    const eligible = students.filter(s=>s.point>=7&&s.point<=35).sort((a,b)=>a.point-b.point);
    eligible.forEach((s,i)=>{ s.position=i+1; s.total=eligible.length; });

    let isDownloadingAll = false;

    // Nav bar — full controls for navigating, downloading, merging
    const nav = document.createElement('div');
    nav.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.5em;margin-bottom:1em;padding:8px;background:#f8f9fa;border-radius:6px;border:1px solid #dee2e6;';
    nav.innerHTML = `
        <button id="axpRepPrev"     class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-chevron-left"></i> Back</button>
        <button id="axpRepNext"     class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;">Next <i class="bi bi-chevron-right"></i></button>
        <span id="axpRepCounter"    style="color:#888;font-size:0.9em;align-self:center;margin:0 4px;"></span>
        <div style="width:1px;background:#ccc;margin:0 4px;align-self:stretch;"></div>
        <button id="axpRepPreview"  class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-eye"></i> Preview</button>
        <button id="axpRepDownload" class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-download"></i> Download</button>
        <button id="axpRepDownAll"  class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-cloud-download"></i> Download All</button>
        <button id="axpRepMergeAll" class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;background:#0d6efd;color:#fff;border-color:#0d6efd;"><i class="bi bi-file-earmark-pdf-fill"></i> Merge All to One PDF</button>
        <div style="width:1px;background:#ccc;margin:0 4px;align-self:stretch;"></div>
        <label style="font-size:0.82em;color:#555;align-self:center;white-space:nowrap;"><i class="bi bi-layout-text-window" style="margin-right:3px;"></i>Card Template:</label>
        <select id="axpRepTplSel" style="font-size:0.82em;padding:3px 6px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;">
            <option value="A">Template A — Official (default)</option>
            <option value="B">Template B — Minimalist</option>
        </select>
        <div style="width:1px;background:#ccc;margin:0 4px;align-self:stretch;"></div>
        <button id="axpRepEn" class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-translate"></i> English</button>
        <button id="axpRepSw" class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-globe2"></i> Kiswahili</button>`;
    container.appendChild(nav);

    const reportDiv = document.createElement('div');
    reportDiv.className = 'axp-section-card';
    container.appendChild(reportDiv);

    let currentLang = localStorage.getItem('preferredLang')||'en';
    let currentIndex = 0;

    function highlightLang() {
        document.getElementById('axpRepEn').style.fontWeight = currentLang==='en' ? 'bold' : 'normal';
        document.getElementById('axpRepSw').style.fontWeight = currentLang==='sw' ? 'bold' : 'normal';
    }
    document.getElementById('axpRepEn').onclick = () => { currentLang='en'; localStorage.setItem('preferredLang','en'); render(currentIndex); highlightLang(); };
    document.getElementById('axpRepSw').onclick = () => { currentLang='sw'; localStorage.setItem('preferredLang','sw'); render(currentIndex); highlightLang(); };
    const tplSelEl = document.getElementById('axpRepTplSel');
    if (tplSelEl) tplSelEl.onchange = () => render(currentIndex);
    highlightLang();

    const LANG = _axpReportLang();

    function _getVal(fieldId) {
        // Priority 1: live panel field (user may have just typed)
        const examClass = document.getElementById('axpRepClassSel') ? document.getElementById('axpRepClassSel').value : '';
        const panel = document.getElementById('axpClassInfoPanel');
        if (panel) {
            const panelEl = panel.querySelector(`[data-field="${fieldId}"]`);
            if (panelEl && panelEl.value) return panelEl.value;
        }
        // Priority 2: SchoolInfoStorage
        const saved = SchoolInfoStorage.getClassData(examClass);
        if (saved && saved[fieldId]) return saved[fieldId];
        // Priority 3: legacy DOM inputs (File 1 wizard fields)
        const el = document.getElementById(fieldId);
        if (el && el.value) return el.value;
        return '';
    }

    function _getAllReqs() {
        const examClass = document.getElementById('axpRepClassSel') ? document.getElementById('axpRepClassSel').value : '';
        const base = [_getVal('requirement1'), _getVal('requirement2'), _getVal('requirement3')].filter(Boolean);
        const extras = SchoolInfoStorage.getExtraReqs(examClass);
        return [...base, ...extras];
    }

    function render(index) {
        const tplSelEl2 = document.getElementById('axpRepTplSel');
        const cardTpl   = tplSelEl2 ? tplSelEl2.value : 'A';
        if (cardTpl === 'B') { renderTemplateB(index); return; }

        const lang         = LANG[currentLang];
        const student      = students[index];
        const eligStudent  = eligible.find(s=>s.name===student.name&&s.point===student.point);
        const posInfo      = eligStudent ? `<strong>${eligStudent.position} ${lang.outOf} ${eligStudent.total}</strong>` : '';

        const examClass    = document.getElementById('axpRepClassSel') ? document.getElementById('axpRepClassSel').value : '';
        const examType     = document.getElementById('axpRepExamSel') ? document.getElementById('axpRepExamSel').value : '';
        const sd           = window.currentSchoolData;
        const normClass    = examClass.replace(/-/g,' ').toUpperCase();
        const translClass  = lang.classLevels[normClass]||examClass;

        // ── School identity from server data ────────────────────────────────
        const si           = _axpSchoolInfo(currentLang);   // lang-aware name
        const schoolDisplay = si.displayName;               // e.g. "NEWALA SECONDARY SCHOOL"
        const schoolIndex  = si.displayLine2;               // index number
        const schoolLogo   = window.getSchoolLogo ? window.getSchoolLogo() : null;

        const openingDate  = _getVal('openingDateInput')  || '';
        const month        = _getVal('monthInput')        || '';
        const closingDate  = _getVal('closingDateInput')  || '';
        const classTeacher = _getVal('classTeacherInput') || '';
        const headmaster   = _getVal('headmasterInput')   || '';
        // Exam + class labels (language-aware)
        const examLabel    = _axpExamLabel(examType, currentLang);
        const clsLabel     = _axpClassLabel(examClass, currentLang);
        const reqs         = _getAllReqs().map(r=>`<li style="margin-bottom:1px;color:#000;">${escapeHtml(r)}</li>`).join('');

        const _cleanIdx = (si.rawIndex||'').replace(/[.\/\\\s]/g,'').toUpperCase();
        const candNum = _cleanIdx
            ? `${_cleanIdx}-${String(index+1).padStart(4,'0')}`
            : `S000-${String(index+1).padStart(4,'0')}`;

        const reportTitle = currentLang==='en'
            ? `${clsLabel} — ${lang.reportTitle} — ${examLabel}${month ? ' — '+month.toUpperCase() : ''}`
            : `${lang.reportTitle} — ${clsLabel} — ${examLabel}${month ? ' — '+month.toUpperCase() : ''}`;

        let disc='C',coop='C',learn='C',sports='B',part='C',punct='C',lead='C',neat='C',resp='C',creat='C';
        let remark = lang.remarksList.followup;
        const pt = Number(student.point);
        if (pt<=17){disc='A';coop='A';learn='A';sports='C';part='A';punct='A';lead='A';neat='A';resp='A';creat='B';remark=lang.remarksList.outstanding;}
        else if(pt<=21){disc='B';coop='B';learn='B';sports='C';part='B';punct='B';lead='B';neat='B';resp='B';creat='B';remark=lang.remarksList.commendable;}
        else if(pt<=30){disc='C';coop='C';learn='C';sports='A';part='C';punct='C';lead='C';neat='C';resp='C';creat='C';remark=lang.remarksList.satisfactory;}

        if (!eligStudent) {
            reportDiv.innerHTML = `
                <div class="axp-alert" style="text-align:center;padding:1.5em;">
                    <i class="bi bi-exclamation-triangle-fill" style="font-size:2em;display:block;margin-bottom:0.5em;"></i>
                    <strong>${lang.noDataHeader}:</strong> ${lang.noDataText.replace('{name}',escapeHtml(student.name))}<br>
                    <small style="color:#888;">${lang.noDataReason}</small>
                </div>`;
        } else {
            const year = (typeof _schoolMeta!=='undefined'&&_schoolMeta&&_schoolMeta.year)?_schoolMeta.year:new Date().getFullYear();
            const _fullDesc = lang.reportDescription(
                escapeHtml(student.name), examLabel, clsLabel, year,
                student.division, student.point,
                eligStudent?eligStudent.position:null,
                eligStudent?eligStudent.total:null
            );

            reportDiv.innerHTML = `
                <div style="width:210mm;height:297mm;margin:0 auto;background:#fff;box-sizing:border-box;font-family:Arial,sans-serif;font-size:10px;color:#000;position:relative;overflow:hidden;page-break-after:always;page-break-inside:avoid;">

                    <!-- decorative frames -->
                    <div style="position:absolute;inset:4mm;border:2px solid #1a3a5c;pointer-events:none;z-index:0;"></div>
                    <div style="position:absolute;inset:6.5mm;border:0.5px solid #aac4e0;pointer-events:none;z-index:0;"></div>
                    <!-- corner ornaments -->
                    ${['top:4mm;left:4mm;border-top:3px solid #1a3a5c;border-left:3px solid #1a3a5c','top:4mm;right:4mm;border-top:3px solid #1a3a5c;border-right:3px solid #1a3a5c','bottom:4mm;left:4mm;border-bottom:3px solid #1a3a5c;border-left:3px solid #1a3a5c','bottom:4mm;right:4mm;border-bottom:3px solid #1a3a5c;border-right:3px solid #1a3a5c'].map(s=>`<div style="position:absolute;${s};width:9mm;height:9mm;pointer-events:none;z-index:1;"></div>`).join('')}
                    <!-- watermarks -->
                    ${[{t:'50%',l:'50%',fs:'52px'},{t:'22%',l:'25%',fs:'24px'},{t:'75%',l:'75%',fs:'24px'}].map(p=>`<div style="position:absolute;top:${p.t};left:${p.l};transform:translate(-50%,-50%) rotate(-35deg);font-size:${p.fs};font-weight:bold;color:rgba(26,58,92,0.035);white-space:nowrap;pointer-events:none;z-index:0;">${escapeHtml(student.name.toUpperCase())}</div>`).join('')}
                    <div style="position:absolute;top:8mm;left:9mm;font-size:8px;font-weight:bold;color:#888;z-index:2;">${escapeHtml(candNum)}</div>
                    <div style="position:absolute;top:8mm;right:9mm;font-size:8px;font-weight:bold;color:#888;z-index:2;">${escapeHtml(candNum)}</div>

                    <!-- CONTENT LAYER -->
                    <div style="position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;padding:11mm 11mm 8mm;box-sizing:border-box;">

                        <!-- ── HEADER ── -->
                        <div style="flex-shrink:0;text-align:center;border-bottom:2px solid #1a3a5c;padding-bottom:2mm;margin-bottom:2mm;">
                            <div style="font-size:9px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#1a3a5c;">${lang.governmentHeader}</div>
                            <div style="font-size:8.5px;color:#555;margin:0.5mm 0;">${lang.localGov}</div>
                            <div style="display:flex;align-items:center;justify-content:center;gap:7px;margin:1.5mm 0;">
                                ${schoolLogo?`<img src="${schoolLogo}" style="width:42px;height:42px;object-fit:contain;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;">`:'' }
                                <div>
                                    <div style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#1a3a5c;">${escapeHtml(si.displayLine1)}</div>
                                    <div style="font-size:8.5px;color:#555;">${escapeHtml(si.displayLine2)}</div>
                                </div>
                                ${schoolLogo?`<img src="${schoolLogo}" style="width:42px;height:42px;object-fit:contain;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;">`:'' }
                            </div>
                            <div style="display:inline-block;border:2px solid #1a3a5c;padding:2px 14px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#1a3a5c;margin-top:1mm;">
                                ${escapeHtml(clsLabel.toUpperCase())} ${escapeHtml(examLabel.toUpperCase())} ${lang.reportTitle.toUpperCase()} — ${year}
                            </div>
                        </div>

                        <!-- ── STUDENT INFO ── -->
                        <div style="flex-shrink:0;display:flex;border:1.5px solid #1a3a5c;font-size:9.5px;margin-bottom:2mm;">
                            <div style="flex:2.5;padding:3px 6px;border-right:0.5px solid #aac4e0;"><strong>${lang.studentName||'Name'}:</strong> ${escapeHtml(student.name)}</div>
                            <div style="flex:1;padding:3px 6px;border-right:0.5px solid #aac4e0;"><strong>${lang.class||'Class'}:</strong> ${escapeHtml(clsLabel)}</div>
                            <div style="padding:3px 6px;border-right:0.5px solid #aac4e0;"><strong>${lang.sex||'Sex'}:</strong> ${escapeHtml(student.gender||'-')}</div>
                            <div style="flex:1.3;padding:3px 6px;"><strong>No:</strong> ${escapeHtml(candNum)}</div>
                        </div>

                        <!-- ── DESCRIPTION ── -->
                        <div style="flex-shrink:0;font-size:9.5px;line-height:1.7;padding:2.5mm 3mm;border:1px solid #dce8f5;background:#f7faff;margin-bottom:2mm;border-radius:1px;">
                            ${_fullDesc}
                        </div>

                        <!-- ── MAIN TABLES (~30% height minimum, flex:1) ── -->
                        <div style="flex:1;min-height:0;display:flex;gap:5px;overflow:hidden;">

                            <!-- Academic (flex:2) -->
                            <div style="flex:2;min-width:0;display:flex;flex-direction:column;">
                                <div style="font-size:9.5px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #1a3a5c;padding-bottom:1.5px;margin-bottom:2px;color:#1a3a5c;">${lang.performanceTitle}</div>
                                <table style="width:100%;border-collapse:collapse;font-size:9px;table-layout:fixed;">
                                    <colgroup><col style="width:36%;"><col style="width:13%;"><col style="width:11%;"><col style="width:40%;"></colgroup>
                                    <thead>
                                        <tr>
                                            <th style="border:0.5px solid #aac4e0;padding:3px 4px;text-align:left;background:#dce8f5;color:#1a3a5c;font-weight:bold;font-size:9px;">${lang.subject}</th>
                                            <th style="border:0.5px solid #aac4e0;padding:3px 4px;background:#dce8f5;color:#1a3a5c;font-weight:bold;font-size:9px;">${lang.mark}</th>
                                            <th style="border:0.5px solid #aac4e0;padding:3px 4px;background:#dce8f5;color:#1a3a5c;font-weight:bold;font-size:9px;">Gr</th>
                                            <th style="border:0.5px solid #aac4e0;padding:3px 4px;background:#dce8f5;color:#1a3a5c;font-weight:bold;font-size:9px;">${lang.comment}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Object.entries(student.scores||{}).map(([sub,sc])=>{
                                            if(sc.mark==null||sc.mark==='') return '';
                                            const gBg={A:'#006400',B:'#00AA00',C:'#ADFF2F',D:'#FFA500',F:'#FF0000'};
                                            const gFg={A:'#fff',B:'#fff',C:'#000',D:'#000',F:'#fff'};
                                            const bg=gBg[sc.grade]||'#fff',fg=gFg[sc.grade]||'#000';
                                            return `<tr>
                                                <td style="border:0.5px solid #ccd;padding:2px 4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:9px;">${escapeHtml(sub)}</td>
                                                <td style="border:0.5px solid #ccd;padding:2px 4px;text-align:center;font-weight:bold;font-size:9px;">${sc.mark}</td>
                                                <td style="border:0.5px solid #ccd;padding:2px 4px;text-align:center;font-weight:bold;font-size:9px;background:${bg};color:${fg};-webkit-print-color-adjust:exact;print-color-adjust:exact;">${sc.grade}</td>
                                                <td style="border:0.5px solid #ccd;padding:2px 4px;font-style:italic;color:#444;overflow:hidden;white-space:nowrap;font-size:8.5px;">${lang.comments[sc.grade]||'-'}</td>
                                            </tr>`;
                                        }).join('')}
                                    </tbody>
                                    <tfoot>
                                        <tr style="background:#dce8f5;">
                                            <td colspan="4" style="border:0.5px solid #aac4e0;padding:3px 5px;font-weight:bold;font-size:9.5px;">
                                                ${lang.points}: <strong style="color:#b71c1c;">${student.point}</strong>
                                                &nbsp;|&nbsp; ${lang.division}: <strong style="color:#b71c1c;">${student.division}</strong>
                                                &nbsp;|&nbsp; ${lang.position}: ${posInfo}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <!-- Behaviour (flex:1) -->
                            <div style="flex:1;min-width:0;display:flex;flex-direction:column;">
                                <div style="font-size:9.5px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #1a3a5c;padding-bottom:1.5px;margin-bottom:2px;color:#1a3a5c;">${lang.behavior}</div>
                                <table style="width:100%;border-collapse:collapse;font-size:9px;">
                                    <thead>
                                        <tr>
                                            <th style="border:0.5px solid #aac4e0;padding:3px 4px;text-align:left;background:#dce8f5;color:#1a3a5c;">${lang.aspect}</th>
                                            <th style="border:0.5px solid #aac4e0;padding:3px 4px;background:#dce8f5;color:#1a3a5c;width:24px;">${lang.rating}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Object.entries({discipline:disc,cooperation:coop,learning:learn,sports,participation:part,punctuality:punct,leadership:lead,neatness:neat,respect:resp,creativity:creat})
                                            .map(([key,val])=>{const bBg={A:'#006400',B:'#00AA00',C:'#ADFF2F',D:'#FFA500',F:'#FF0000'};const bFg={A:'#fff',B:'#fff',C:'#000',D:'#000',F:'#fff'};return `<tr>
                                                <td style="border:0.5px solid #ccd;padding:2px 4px;font-size:9px;">${lang.behaviorAspects[key]}</td>
                                                <td style="border:0.5px solid #ccd;padding:2px 4px;text-align:center;font-weight:bold;font-size:9px;background:${bBg[val]||'#fff'};color:${bFg[val]||'#000'};-webkit-print-color-adjust:exact;print-color-adjust:exact;">${val}</td>
                                            </tr>`;}).join('')}
                                        <tr><td colspan="2" style="border:0.5px solid #ccd;padding:2px 4px;font-style:italic;font-size:8.5px;">${escapeHtml(remark)}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div><!-- end main tables -->

                        <!-- ── REQUIREMENTS ── -->
                        ${reqs ? `<div style="flex-shrink:0;font-size:9px;border-top:1px solid #aac4e0;padding-top:2mm;margin-top:2mm;">
                            <strong style="color:#1a3a5c;">${lang.requirements}:</strong>
                            <ul style="margin:1mm 0 0 10px;padding:0;line-height:1.7;">${reqs}</ul>
                        </div>` : ''}

                        <!-- ── TERM DATES ── -->
                        <div style="flex-shrink:0;font-size:9.5px;border-top:1px solid #aac4e0;padding-top:2mm;margin-top:2mm;display:flex;gap:10mm;">
                            <span>${lang.closes||'School Closes'}: <strong>${escapeHtml(closingDate)||'—'}</strong></span>
                            <span>${lang.reopens||'School Opens'}: <strong>${escapeHtml(openingDate)||'—'}</strong></span>
                        </div>

                        <!-- ── CLASS TEACHER ── -->
                        <div style="flex-shrink:0;border-top:1.5px solid #1a3a5c;margin-top:2.5mm;padding-top:2mm;">
                            <div style="font-size:9.5px;color:#222;margin-bottom:2mm;line-height:1.6;">
                                <strong style="color:#1a3a5c;font-size:10px;">${lang.classComment}:</strong>
                                ${lang.classCommentIntro(`<em>${escapeHtml(student.name.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()))}</em>`)}
                                ${pt<=12?lang.performanceLevels.strong:pt<=21?lang.performanceLevels.moderate:lang.performanceLevels.weak}
                                ${lang.academicPerformance} ${lang.thisTerm}
                                ${pt<=28?lang.encouragement.encouraged:lang.encouragement.necessary}
                            </div>
                            <!-- Signature row -->
                            <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:4mm;margin-top:1mm;">
                                <!-- Left: signature line + name + role -->
                                <div style="flex:1;min-width:0;">
                                    <div style="font-size:8px;color:#888;margin-bottom:0.5mm;">${lang.classComment?.replace(/:.*/,'')||'Class Teacher'}:</div>
                                    <div style="border-bottom:1.5px solid #1a3a5c;min-width:60mm;height:7mm;display:flex;align-items:flex-end;padding-bottom:1px;">
                                        <span style="font-size:10px;font-weight:bold;color:#000;letter-spacing:0.3px;">${escapeHtml(classTeacher||'')}</span>
                                    </div>
                                    <div style="font-size:8px;color:#555;margin-top:0.5mm;">${escapeHtml(classTeacher||'___________________________')}</div>
                                    <div style="font-size:7.5px;color:#888;letter-spacing:0.3px;">${lang.classComment?.replace(/:.*/,'')||'Class Teacher'}</div>
                                </div>
                                <!-- Right: date -->
                                <div style="flex-shrink:0;text-align:right;">
                                    <div style="font-size:8px;color:#888;margin-bottom:0.5mm;">${lang.date||'Date'}:</div>
                                    <div style="border-bottom:1.5px solid #1a3a5c;min-width:35mm;height:7mm;display:flex;align-items:flex-end;justify-content:flex-end;padding-bottom:1px;">
                                        <span style="font-size:10px;font-weight:bold;color:#000;">${escapeHtml(closingDate||'')}</span>
                                    </div>
                                    <div style="font-size:8px;color:#555;margin-top:0.5mm;">${escapeHtml(closingDate||'_______________')}</div>
                                </div>
                            </div>
                        </div>

                        <!-- ── HEAD OF SCHOOL ── -->
                        <div style="flex-shrink:0;border-top:1.5px solid #1a3a5c;margin-top:2.5mm;padding-top:2mm;">
                            <div style="font-size:9.5px;color:#222;margin-bottom:2mm;line-height:1.6;">
                                <strong style="color:#1a3a5c;font-size:10px;">${lang.headComment}:</strong>
                                ${pt<=13?lang.remarksList.outstanding:pt<=17?lang.remarksList.commendable:pt<=24?lang.remarksList.satisfactory:lang.remarksList.followup}
                                ${lang.headSupportNote}
                            </div>
                            <!-- Signature row -->
                            <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:4mm;margin-top:1mm;">
                                <div style="flex:1;min-width:0;">
                                    <div style="font-size:8px;color:#888;margin-bottom:0.5mm;">${lang.headComment?.replace(/:.*/,'')||'Head of School'}:</div>
                                    <div style="border-bottom:1.5px solid #1a3a5c;min-width:60mm;height:7mm;display:flex;align-items:flex-end;padding-bottom:1px;">
                                        <span style="font-size:10px;font-weight:bold;color:#000;letter-spacing:0.3px;">${escapeHtml(headmaster||'')}</span>
                                    </div>
                                    <div style="font-size:8px;color:#555;margin-top:0.5mm;">${escapeHtml(headmaster||'___________________________')}</div>
                                    <div style="font-size:7.5px;color:#888;letter-spacing:0.3px;">${lang.headComment?.replace(/:.*/,'')||'Head of School'}</div>
                                </div>
                                <div style="flex-shrink:0;text-align:right;">
                                    <div style="font-size:8px;color:#888;margin-bottom:0.5mm;">${lang.date||'Date'}:</div>
                                    <div style="border-bottom:1.5px solid #1a3a5c;min-width:35mm;height:7mm;display:flex;align-items:flex-end;justify-content:flex-end;padding-bottom:1px;">
                                        <span style="font-size:10px;font-weight:bold;color:#000;">${escapeHtml(closingDate||'')}</span>
                                    </div>
                                    <div style="font-size:8px;color:#555;margin-top:0.5mm;">${escapeHtml(closingDate||'_______________')}</div>
                                </div>
                            </div>
                        </div>

                    </div><!-- end content layer -->
                </div>`;
        }

        document.getElementById('axpRepPrev').disabled = index===0;
        document.getElementById('axpRepNext').disabled = index===students.length-1;
        document.getElementById('axpRepCounter').textContent = `${index+1} / ${students.length}`;
    }

    render(currentIndex);

    document.getElementById('axpRepPrev').onclick = () => { if(currentIndex>0){ currentIndex--; render(currentIndex); } };
    document.getElementById('axpRepNext').onclick = () => { if(currentIndex<students.length-1){ currentIndex++; render(currentIndex); } };

    // ── Report Card Template B — Minimalist clean table layout ─────────────────
    // Clean two-column layout: left = academic table, right = behaviour + summary
    // No decorative borders/watermarks. Easier for schools that want plain output.
    function renderTemplateB(index) {
        const lang         = LANG[currentLang];
        const student      = students[index];
        const eligStudent  = eligible.find(s=>s.name===student.name&&s.point===student.point);
        const posInfo      = eligStudent ? `${eligStudent.position}/${eligStudent.total}` : 'N/A';

        const examClass    = document.getElementById('axpRepClassSel') ? document.getElementById('axpRepClassSel').value : '';
        const examType     = document.getElementById('axpRepExamSel')  ? document.getElementById('axpRepExamSel').value  : '';
        const schoolLogo   = window.getSchoolLogo ? window.getSchoolLogo() : null;

        // ── School identity from server data ────────────────────────────────
        const si           = _axpSchoolInfo(currentLang);
        const month        = _getVal('monthInput')        || '';
        const closingDate  = _getVal('closingDateInput')  || '';
        const openingDate  = _getVal('openingDateInput')  || '';
        const classTeacher = _getVal('classTeacherInput') || '';
        const headmaster   = _getVal('headmasterInput')   || '';
        // Language-aware exam + class labels (Template B)
        const examLabel    = _axpExamLabel(examType, currentLang);
        const clsLabel     = _axpClassLabel(examClass, currentLang);

        const _cleanIdxB = (si.rawIndex||'').replace(/[.\/\\\s]/g,'').toUpperCase();
        const candNum = _cleanIdxB
            ? `${_cleanIdxB}-${String(index+1).padStart(4,'0')}`
            : `S000-${String(index+1).padStart(4,'0')}`;

        const pt = Number(student.point);
        let disc='C',coop='C',learn='C',sports='B',part='C',punct='C',lead='C',neat='C',resp='C',creat='C';
        let remark = lang.remarksList.followup;
        if (pt<=17){disc='A';coop='A';learn='A';sports='C';part='A';punct='A';lead='A';neat='A';resp='A';creat='B';remark=lang.remarksList.outstanding;}
        else if(pt<=21){disc='B';coop='B';learn='B';sports='C';part='B';punct='B';lead='B';neat='B';resp='B';creat='B';remark=lang.remarksList.commendable;}
        else if(pt<=30){disc='C';coop='C';learn='C';sports='A';part='C';punct='C';lead='C';neat='C';resp='C';creat='C';remark=lang.remarksList.satisfactory;}

        if (!eligStudent) {
            reportDiv.innerHTML = `<div class="axp-alert" style="text-align:center;padding:1.5em;">
                <i class="bi bi-exclamation-triangle-fill" style="font-size:2em;display:block;margin-bottom:0.5em;"></i>
                <strong>${lang.noDataHeader}:</strong> ${lang.noDataText.replace('{name}',escapeHtml(student.name))}<br>
                <small style="color:#888;">${lang.noDataReason}</small></div>`;
        } else {
            const subjectRows = Object.entries(student.scores||{})
                .filter(([,sc]) => sc.mark!=null&&sc.mark!=='')
                .map(([sub,sc]) => {
                    const gBg={A:'#006400',B:'#00AA00',C:'#ADFF2F',D:'#FFA500',F:'#FF0000'};
                    const gFg={A:'#fff',B:'#fff',C:'#000',D:'#000',F:'#fff'};
                    const bg=gBg[sc.grade]||'#fff', fg=gFg[sc.grade]||'#000';
                    return `<tr>
                        <td style="border:0.5px solid #bbb;padding:2px 4px;font-size:8px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${escapeHtml(sub)}</td>
                        <td style="border:0.5px solid #bbb;padding:2px 4px;text-align:center;font-weight:bold;font-size:8px;">${sc.mark}</td>
                        <td style="border:0.5px solid #bbb;padding:2px 4px;text-align:center;font-weight:bold;font-size:8px;background:${bg};color:${fg};-webkit-print-color-adjust:exact;print-color-adjust:exact;">${sc.grade}</td>
                        <td style="border:0.5px solid #bbb;padding:2px 4px;font-size:7.5px;color:#444;font-style:italic;">${lang.comments[sc.grade]||'-'}</td>
                    </tr>`;
                }).join('');

            const behavRows = Object.entries({discipline:disc,cooperation:coop,learning:learn,sports,participation:part,punctuality:punct,leadership:lead,neatness:neat,respect:resp,creativity:creat})
                .map(([key,val])=>{const bBg={A:'#006400',B:'#00AA00',C:'#ADFF2F',D:'#FFA500',F:'#FF0000'};const bFg={A:'#fff',B:'#fff',C:'#000',D:'#000',F:'#fff'};return `<tr style="background:#fff;">
                    <td style="border:0.5px solid #bbb;padding:2px 5px;font-size:9px;background:#fff;">${lang.behaviorAspects[key]}</td>
                    <td style="border:0.5px solid #bbb;padding:2px 5px;text-align:center;font-weight:bold;font-size:9px;background:${bBg[val]||'#fff'};color:${bFg[val]||'#000'};-webkit-print-color-adjust:exact;print-color-adjust:exact;">${val}</td>
                </tr>`;}).join('');

            const yearB = (typeof _schoolMeta!=='undefined'&&_schoolMeta&&_schoolMeta.year)?_schoolMeta.year:new Date().getFullYear();
            const reqsB = _getAllReqs().map(r=>`<li style="margin-bottom:2px;">${escapeHtml(r)}</li>`).join('');
            const _fullDescB = lang.reportDescription(
                escapeHtml(student.name), examLabel, clsLabel, yearB,
                student.division, student.point,
                eligStudent?eligStudent.position:null,
                eligStudent?eligStudent.total:null
            );

            reportDiv.innerHTML = `
                <div style="width:210mm;height:297mm;margin:0 auto;background:#fff;box-sizing:border-box;font-family:Arial,sans-serif;font-size:10px;color:#000;position:relative;overflow:hidden;page-break-after:always;page-break-inside:avoid;">
                    <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:8mm 10mm 7mm;box-sizing:border-box;">

                        <!-- HEADER -->
                        <div style="flex-shrink:0;display:flex;align-items:center;gap:6px;border-bottom:2.5px solid #000;padding-bottom:3mm;margin-bottom:2.5mm;">
                            ${schoolLogo?`<img src="${schoolLogo}" style="width:44px;height:44px;object-fit:contain;flex-shrink:0;">`:`` }
                            <div style="flex:1;text-align:center;">
                                <div style="font-size:9px;font-weight:bold;letter-spacing:0.4px;">${lang.governmentHeader}</div>
                                <div style="font-size:8.5px;color:#555;margin:0.5mm 0;">${lang.localGov}</div>
                                <div style="font-size:14px;font-weight:bold;text-transform:uppercase;margin:1.5mm 0;">${escapeHtml(si.displayLine1)}</div>
                                <div style="font-size:8.5px;color:#444;margin-bottom:2mm;">${escapeHtml(si.displayLine2)}</div>
                                <div style="background:#000;color:#fff;font-size:11px;font-weight:bold;letter-spacing:1px;padding:3px 12px;display:inline-block;">
                                    ${escapeHtml(clsLabel.toUpperCase())} ${escapeHtml(examLabel.toUpperCase())} ${lang.reportTitle.toUpperCase()} — ${yearB}
                                </div>
                            </div>
                            ${schoolLogo?`<img src="${schoolLogo}" style="width:44px;height:44px;object-fit:contain;flex-shrink:0;">`:`` }
                        </div>

                        <!-- STUDENT INFO -->
                        <div style="flex-shrink:0;display:flex;border:1.5px solid #333;font-size:9.5px;margin-bottom:2mm;">
                            <div style="flex:2.5;padding:3px 5px;border-right:0.5px solid #bbb;"><strong>${lang.studentName||'Name'}:</strong> ${escapeHtml(student.name)}</div>
                            <div style="flex:1;padding:3px 5px;border-right:0.5px solid #bbb;"><strong>${lang.class||'Class'}:</strong> ${escapeHtml(clsLabel)}</div>
                            <div style="padding:3px 5px;border-right:0.5px solid #bbb;"><strong>${lang.sex||'Sex'}:</strong> ${escapeHtml(student.gender||'-')}</div>
                            <div style="flex:1.2;padding:3px 5px;border-right:0.5px solid #bbb;"><strong>No:</strong> ${escapeHtml(candNum)}</div>
                            <div style="padding:3px 5px;border-right:0.5px solid #bbb;"><strong>${lang.points||'Pts'}:</strong> <strong style="color:#b71c1c;">${student.point}</strong></div>
                            <div style="padding:3px 5px;border-right:0.5px solid #bbb;"><strong>${lang.division||'Div'}:</strong> <strong style="color:#b71c1c;">${escapeHtml(student.division||'-')}</strong></div>
                            <div style="padding:3px 5px;"><strong>${lang.position||'Pos'}:</strong> ${posInfo}</div>
                        </div>

                        <!-- DESCRIPTION -->
                        <div style="flex-shrink:0;font-size:9.5px;line-height:1.7;padding:2.5mm 3mm;border:1px solid #ddd;background:#fafafa;margin-bottom:2mm;">
                            ${_fullDescB}
                        </div>

                        <!-- MAIN TABLES (flex:1, ≥30% height) -->
                        <div style="flex:1;min-height:0;display:flex;gap:5px;">

                            <!-- Academic (flex:2.2) -->
                            <div style="flex:2.2;min-width:0;display:flex;flex-direction:column;">
                                <div style="font-size:9.5px;font-weight:bold;border-bottom:2px solid #000;padding-bottom:1.5px;margin-bottom:2px;text-transform:uppercase;">${lang.performanceTitle}</div>
                                <table style="width:100%;border-collapse:collapse;font-size:9px;table-layout:fixed;">
                                    <colgroup><col style="width:35%;"><col style="width:13%;"><col style="width:12%;"><col style="width:40%;"></colgroup>
                                    <thead><tr style="background:#f0f0f0;">
                                        <th style="border:0.5px solid #bbb;padding:3px 4px;text-align:left;font-weight:bold;font-size:9px;">${lang.subject||'Subject'}</th>
                                        <th style="border:0.5px solid #bbb;padding:3px 4px;font-weight:bold;font-size:9px;">${lang.mark||'Mark'}</th>
                                        <th style="border:0.5px solid #bbb;padding:3px 4px;font-weight:bold;font-size:9px;">Gr</th>
                                        <th style="border:0.5px solid #bbb;padding:3px 4px;font-weight:bold;font-size:9px;">${lang.comment||'Remark'}</th>
                                    </tr></thead>
                                    <tbody>${subjectRows}</tbody>
                                    <tfoot><tr style="background:#f0f0f0;">
                                        <td colspan="4" style="border:0.5px solid #bbb;padding:3px 5px;font-size:9.5px;font-weight:bold;">
                                            ${lang.points||'Points'}: ${student.point} &nbsp;|&nbsp; ${lang.division||'Division'}: ${escapeHtml(student.division||'-')} &nbsp;|&nbsp; ${lang.position||'Position'}: ${posInfo}
                                        </td>
                                    </tr></tfoot>
                                </table>
                            </div>

                            <!-- Behaviour (flex:1.1) -->
                            <div style="flex:1.1;min-width:0;display:flex;flex-direction:column;">
                                <div style="font-size:9.5px;font-weight:bold;border-bottom:2px solid #000;padding-bottom:1.5px;margin-bottom:2px;text-transform:uppercase;">${lang.behavior}</div>
                                <table style="width:100%;border-collapse:collapse;font-size:9px;">
                                    <thead><tr style="background:#f0f0f0;">
                                        <th style="border:0.5px solid #bbb;padding:3px 4px;text-align:left;font-size:9px;">${lang.aspect||'Aspect'}</th>
                                        <th style="border:0.5px solid #bbb;padding:3px 4px;width:26px;font-size:9px;">${lang.rating||'Rating'}</th>
                                    </tr></thead>
                                    <tbody>${behavRows}</tbody>
                                </table>
                                <div style="border:0.5px solid #bbb;padding:3px 5px;font-size:9px;margin-top:1px;">
                                    <strong>${lang.overall||'Overall'}:</strong> <span style="font-style:italic;">${escapeHtml(remark)}</span>
                                </div>
                            </div>
                        </div><!-- end main tables -->

                        <!-- REQUIREMENTS -->
                        ${reqsB?`<div style="flex-shrink:0;font-size:9px;border-top:1px solid #ccc;padding-top:2mm;margin-top:2mm;">
                            <strong>${lang.requirements}:</strong>
                            <ul style="margin:1mm 0 0 10px;padding:0;line-height:1.7;">${reqsB}</ul>
                        </div>`:''}

                        <!-- TERM DATES -->
                        <div style="flex-shrink:0;font-size:9.5px;border-top:1.5px solid #000;padding-top:2mm;margin-top:2mm;display:flex;gap:10mm;">
                            <span>${lang.closes||'School Closes'}: <strong>${escapeHtml(closingDate)||'—'}</strong></span>
                            <span>${lang.reopens||'School Opens'}: <strong>${escapeHtml(openingDate)||'—'}</strong></span>
                        </div>

                        <!-- CLASS TEACHER -->
                        <div style="flex-shrink:0;border-top:1.5px solid #000;margin-top:2.5mm;padding-top:2mm;">
                            <div style="font-size:9.5px;color:#222;margin-bottom:2mm;line-height:1.6;">
                                <strong style="font-size:10px;">${lang.classComment||'Class Teacher Comment'}:</strong>
                                ${lang.classCommentIntro(`<em>${escapeHtml(student.name.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()))}</em>`)}
                                ${pt<=12?lang.performanceLevels.strong:pt<=21?lang.performanceLevels.moderate:lang.performanceLevels.weak}
                                ${lang.academicPerformance} ${lang.thisTerm}
                                ${pt<=28?lang.encouragement.encouraged:lang.encouragement.necessary}
                            </div>
                            <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:4mm;margin-top:1mm;">
                                <div style="flex:1;min-width:0;">
                                    <div style="font-size:8px;color:#888;margin-bottom:0.5mm;">${lang.classComment?.replace(/:.*/,'')||'Class Teacher'}:</div>
                                    <div style="border-bottom:1.5px solid #000;min-width:60mm;height:7mm;display:flex;align-items:flex-end;padding-bottom:1px;">
                                        <span style="font-size:10px;font-weight:bold;color:#000;">${escapeHtml(classTeacher||'')}</span>
                                    </div>
                                    <div style="font-size:8px;color:#555;margin-top:0.5mm;">${escapeHtml(classTeacher||'___________________________')}</div>
                                    <div style="font-size:7.5px;color:#888;">${lang.classComment?.replace(/:.*/,'')||'Class Teacher'}</div>
                                </div>
                                <div style="flex-shrink:0;text-align:right;">
                                    <div style="font-size:8px;color:#888;margin-bottom:0.5mm;">${lang.date||'Date'}:</div>
                                    <div style="border-bottom:1.5px solid #000;min-width:35mm;height:7mm;display:flex;align-items:flex-end;justify-content:flex-end;padding-bottom:1px;">
                                        <span style="font-size:10px;font-weight:bold;color:#000;">${escapeHtml(closingDate||'')}</span>
                                    </div>
                                    <div style="font-size:8px;color:#555;margin-top:0.5mm;">${escapeHtml(closingDate||'_______________')}</div>
                                </div>
                            </div>
                        </div>

                        <!-- HEAD OF SCHOOL -->
                        <div style="flex-shrink:0;border-top:1.5px solid #000;margin-top:2.5mm;padding-top:2mm;">
                            <div style="font-size:9.5px;color:#222;margin-bottom:2mm;line-height:1.6;">
                                <strong style="font-size:10px;">${lang.headComment||'Head of School Comment'}:</strong>
                                ${pt<=13?lang.remarksList.outstanding:pt<=17?lang.remarksList.commendable:pt<=24?lang.remarksList.satisfactory:lang.remarksList.followup}
                                ${lang.headSupportNote||''}
                            </div>
                            <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:4mm;margin-top:1mm;">
                                <div style="flex:1;min-width:0;">
                                    <div style="font-size:8px;color:#888;margin-bottom:0.5mm;">${lang.headComment?.replace(/:.*/,'')||'Head of School'}:</div>
                                    <div style="border-bottom:1.5px solid #000;min-width:60mm;height:7mm;display:flex;align-items:flex-end;padding-bottom:1px;">
                                        <span style="font-size:10px;font-weight:bold;color:#000;">${escapeHtml(headmaster||'')}</span>
                                    </div>
                                    <div style="font-size:8px;color:#555;margin-top:0.5mm;">${escapeHtml(headmaster||'___________________________')}</div>
                                    <div style="font-size:7.5px;color:#888;">${lang.headComment?.replace(/:.*/,'')||'Head of School'}</div>
                                </div>
                                <div style="flex-shrink:0;text-align:right;">
                                    <div style="font-size:8px;color:#888;margin-bottom:0.5mm;">${lang.date||'Date'}:</div>
                                    <div style="border-bottom:1.5px solid #000;min-width:35mm;height:7mm;display:flex;align-items:flex-end;justify-content:flex-end;padding-bottom:1px;">
                                        <span style="font-size:10px;font-weight:bold;color:#000;">${escapeHtml(closingDate||'')}</span>
                                    </div>
                                    <div style="font-size:8px;color:#555;margin-top:0.5mm;">${escapeHtml(closingDate||'_______________')}</div>
                                </div>
                            </div>
                        </div>

                    </div><!-- end content layer -->
                </div>`;
        }

        document.getElementById('axpRepPrev').disabled = index===0;
        document.getElementById('axpRepNext').disabled = index===students.length-1;
        document.getElementById('axpRepCounter').textContent = `${index+1} / ${students.length}`;
    }

    const _sanitize = s=>s.replace(/[^a-z0-9]/gi,'_').replace(/_+/g,'_');
    const _schoolIdx = () => (window.currentSchoolData?.indexNumber||'').toUpperCase()||'SCH';
    const _examClass = () => document.getElementById('axpRepClassSel')?.value||'';
    const _examType  = () => document.getElementById('axpRepExamSel')?.value||'';

    // Portrait A4: 210×297mm. Render reportDiv via html2canvas → jsPDF image.
    const _REP_W = 794;  // px at 96dpi = 210mm

    async function _repCapturePdf(filename, action) {
        try {
            const jsPDFCtor = await _axpGetJsPDF();
            // ── gather all data the same way render() does ──
            const lang         = LANG[currentLang];
            const student      = students[currentIndex];
            const eligStudent  = eligible.find(s=>s.name===student.name&&s.point===student.point);
            if (!eligStudent) { _axpToast('No eligible data for this student','warning'); return; }

            const examClass   = document.getElementById('axpRepClassSel')?.value||'';
            const examType    = document.getElementById('axpRepExamSel')?.value||'';
            const si          = _axpSchoolInfo(currentLang);
            const examLabel   = _axpExamLabel(examType,currentLang);
            const clsLabel    = _axpClassLabel(examClass,currentLang);
            const month       = _getVal('monthInput')||'';
            const closingDate = _getVal('closingDateInput')||'';
            const openingDate = _getVal('openingDateInput')||'';
            const classTeacher= _getVal('classTeacherInput')||'';
            const headmaster  = _getVal('headmasterInput')||'';
            const reqs        = _getAllReqs();
            const year        = (typeof _schoolMeta!=='undefined'&&_schoolMeta?.year)?_schoolMeta.year:new Date().getFullYear();
            const pt          = Number(student.point);
            const posInfo     = eligStudent?`${eligStudent.position} / ${eligStudent.total}`:'';
            const _cleanIdx   = (si.rawIndex||'').replace(/[.\\/\\\\\s]/g,'').toUpperCase();
            const candNum     = _cleanIdx?`${_cleanIdx}-${String(currentIndex+1).padStart(4,'0')}`:`S000-${String(currentIndex+1).padStart(4,'0')}`;

            // ── Behaviour grades ──
            let disc='C',coop='C',learn='C',sports='B',part='C',punct='C',lead='C',neat='C',resp='C',creat='C';
            let remark=lang.remarksList.followup;
            if(pt<=17){disc='A';coop='A';learn='A';sports='C';part='A';punct='A';lead='A';neat='A';resp='A';creat='B';remark=lang.remarksList.outstanding;}
            else if(pt<=21){disc='B';coop='B';learn='B';sports='C';part='B';punct='B';lead='B';neat='B';resp='B';creat='B';remark=lang.remarksList.commendable;}
            else if(pt<=30){remark=lang.remarksList.satisfactory;}

            // ── jsPDF setup: A4 portrait 210×297mm ──
            const doc = new jsPDFCtor({unit:'mm',format:[210,297],orientation:'portrait',compress:false,precision:4,putOnlyUsedFonts:true});
            const PW=210, PH=297, ML=10, MR=10, MT=10, MB=10;
            const CW=PW-ML-MR; // content width 190mm

            const navy=[26,58,92], gold=[200,168,75], lgrey=[220,232,245], white=[255,255,255], black=[0,0,0], red=[183,28,28];
            const gradeCol={A:[0,100,0],B:[0,170,0],C:[173,255,47],D:[255,165,0],F:[255,0,0]};
            const gradeFg={A:white,B:white,C:black,D:black,F:white};

            function setFill(rgb){doc.setFillColor(rgb[0],rgb[1],rgb[2]);}
            function setDraw(rgb){doc.setDrawColor(rgb[0],rgb[1],rgb[2]);}
            function setTxt(rgb){doc.setTextColor(rgb[0],rgb[1],rgb[2]);}
            function rect(x,y,w,h,fill,stroke){
                if(fill){setFill(fill);doc.setLineWidth(0);}
                if(stroke){setDraw(stroke);doc.setLineWidth(0.3);}
                const style=fill&&stroke?'FD':fill?'F':stroke?'D':'S';
                doc.rect(x,y,w,h,style);
            }
            function cell(x,y,w,h,txt,opts={}){
                const bg=opts.bg||null, fg=opts.fg||black, bd=opts.border!==false?[180,180,200]:null;
                if(bg)rect(x,y,w,h,bg,bd);
                else if(bd){setFill(white);rect(x,y,w,h,white,bd);}
                if(txt==null||txt==='') return;
                doc.setFontSize(opts.fs||8);
                doc.setFont('helvetica',opts.bold?'bold':'normal');
                setTxt(fg);
                const pad=1.5, iw=w-pad*2;
                const lines=doc.splitTextToSize(String(txt),iw);
                const align=opts.align||'center';
                const tx=align==='left'?x+pad:align==='right'?x+w-pad:x+w/2;
                const ty=y+h/2+doc.getFontSize()*0.35;
                doc.text(lines[0],tx,ty,{align});
            }

            let curY=MT;

            // ── Outer border ──
            setDraw(navy); doc.setLineWidth(0.5);
            doc.rect(4,4,PW-8,PH-8,'D');
            doc.setLineWidth(0.2); setDraw([170,196,224]);
            doc.rect(6.5,6.5,PW-13,PH-13,'D');

            // ── Header ──
            doc.setFontSize(8); doc.setFont('helvetica','bold'); setTxt(navy);
            doc.text(si.governmentHeader||'PRESIDENT\'S OFFICE',PW/2,curY+3,{align:'center'});
            curY+=5;
            doc.setFontSize(7); doc.setFont('helvetica','normal'); setTxt([80,80,80]);
            doc.text(si.region||'',PW/2,curY+2,{align:'center'});
            curY+=4;

            // School name
            doc.setFontSize(13); doc.setFont('helvetica','bold'); setTxt(navy);
            doc.text(si.displayLine1.toUpperCase(),PW/2,curY+4,{align:'center'});
            curY+=6;
            doc.setFontSize(7); doc.setFont('helvetica','normal'); setTxt([80,80,80]);
            doc.text(si.displayLine2||'',PW/2,curY+2,{align:'center'});
            curY+=4;

            // Title banner
            setFill(navy); doc.rect(ML,curY,CW,7,'F');
            doc.setFontSize(9); doc.setFont('helvetica','bold'); setTxt(white);
            const titleText = `${clsLabel.toUpperCase()} ${examLabel.toUpperCase()} ${(lang.reportTitle||'RESULTS').toUpperCase()} — ${year}`;
            doc.text(titleText,PW/2,curY+4.5,{align:'center'});
            curY+=8;

            // ── Student info row ──
            const infoH=6;
            setFill(lgrey); setDraw([170,196,224]); doc.setLineWidth(0.2);
            doc.rect(ML,curY,CW,infoH,'FD');
            const cols=[{lbl:(lang.studentName||'Name')+':',val:student.name,w:CW*0.38},{lbl:(lang.class||'Class')+':',val:clsLabel,w:CW*0.2},{lbl:(lang.sex||'Sex')+':',val:student.gender||'-',w:CW*0.12},{lbl:'No:',val:candNum,w:CW*0.3}];
            let ix=ML;
            cols.forEach((c,i)=>{
                doc.setFontSize(8); doc.setFont('helvetica','bold'); setTxt(navy);
                doc.text(c.lbl,ix+1.5,curY+4);
                const lblW=doc.getTextWidth(c.lbl)+2;
                doc.setFont('helvetica','normal'); setTxt(black);
                doc.text(c.val,ix+lblW,curY+4);
                ix+=c.w;
                if(i<cols.length-1){setDraw([170,196,224]);doc.setLineWidth(0.2);doc.line(ix,curY,ix,curY+infoH);}
            });
            curY+=infoH+2;

            // ── Description (plain text lines, no HTML tags) ──
            const descLines=[
                currentLang==='sw'
                    ? `${student.name} alifanya mtihani wa ${examLabel} katika ${clsLabel}, mwaka ${year}.`
                    : `This report certifies the academic performance of ${student.name} who sat for the ${examLabel} examination in ${clsLabel}, ${year}.`,
                currentLang==='sw'
                    ? `Alipata jumla ya pointi ${student.point}, daraja ${student.division}${eligStudent?`, nafasi ${eligStudent.position} kati ya ${eligStudent.total} darasani`:''}. `
                    : `The student scored ${student.point} points, attaining Division ${student.division}${eligStudent?`, ranked ${eligStudent.position} out of ${eligStudent.total} in class`:''}. `,
                currentLang==='sw'
                    ? 'Daraja I (7-17): Bora Sana | Daraja II (18-21): Nzuri | Daraja III (22-25): Ya Kati | Daraja IV (26-33): Hafifu | Daraja 0 (34-35): Kushindwa'
                    : 'Division I (7-17 pts): Excellent | Division II (18-21): Good | Division III (22-25): Average | Division IV (26-33): Poor | Division 0 (34-35): Fail',
                currentLang==='sw'
                    ? 'Matokeo ya kitaaluma na tathmini ya tabia zilizo chini zinaonyesha maendeleo ya mwanafunzi kwa muhula huu.'
                    : 'The academic results and behavioral assessments below reflect the student\'s overall progress this term.',
                currentLang==='sw'
                    ? 'Wazazi na walezi wanashauriwa kupitia ripoti hii pamoja na mwanafunzi na kutoa msaada unaohitajika.'
                    : 'Parents and guardians are encouraged to review this report with the student and provide the necessary support for continued improvement.',
            ];
            rect(ML,curY,CW,descLines.length*4+3,[247,250,255],[220,232,245]);
            doc.setFontSize(8); doc.setFont('helvetica','normal'); setTxt([40,40,40]);
            descLines.forEach((ln,i)=>{
                const wrapped=doc.splitTextToSize(ln,CW-4);
                doc.text(wrapped[0],ML+2,curY+3+i*4);
            });
            curY+=descLines.length*4+5;

            // ── Main body: Academic table (left 57%) + Behaviour table (right 40%) ──
            const bodyTop=curY;
            const acW=CW*0.57, bhW=CW*0.40, gap=CW*0.03;
            const bhX=ML+acW+gap;

            // Academic header
            setFill(lgrey); setDraw(navy); doc.setLineWidth(0.3);
            doc.rect(ML,curY,acW,5,'FD');
            doc.setFontSize(8); doc.setFont('helvetica','bold'); setTxt(navy);
            doc.text((lang.performanceTitle||'ACADEMIC PERFORMANCE').toUpperCase(),ML+acW/2,curY+3.5,{align:'center'});
            curY+=5;

            // Academic table columns
            const sbjW=acW*0.36, mrkW=acW*0.14, grW=acW*0.12, cmtW=acW*0.38;
            // Header row
            [[lang.subject||'Subject','left',sbjW],[lang.mark||'Mark','center',mrkW],['Gr','center',grW],[lang.comment||'Remark','center',cmtW]].reduce((x,[lbl,al,w])=>{
                rect(x,curY,w,5,lgrey,[170,196,224]);
                doc.setFontSize(7.5); doc.setFont('helvetica','bold'); setTxt(navy);
                doc.text(lbl,al==='left'?x+1.5:al==='right'?x+w-1.5:x+w/2,curY+3.5,{align:al});
                return x+w;
            },ML);
            curY+=5;

            // Subject rows
            const subEntries=Object.entries(student.scores||{}).filter(([,sc])=>sc.mark!=null&&sc.mark!=='');
            subEntries.forEach(([sub,sc])=>{
                const rH=4.5;
                let x=ML;
                rect(x,curY,sbjW,rH,white,[200,200,210]);
                doc.setFontSize(7.5); doc.setFont('helvetica','normal'); setTxt(black);
                doc.text(doc.splitTextToSize(sub,sbjW-2)[0],x+1.5,curY+3); x+=sbjW;
                rect(x,curY,mrkW,rH,white,[200,200,210]);
                doc.setFontSize(7.5); doc.setFont('helvetica','bold'); setTxt(black);
                doc.text(String(sc.mark),x+mrkW/2,curY+3,{align:'center'}); x+=mrkW;
                const gBg=gradeCol[sc.grade]||[255,255,255];
                const gFg=gradeFg[sc.grade]||black;
                rect(x,curY,grW,rH,gBg,[200,200,210]);
                doc.setFontSize(7.5); doc.setFont('helvetica','bold'); setTxt(gFg);
                doc.text(sc.grade||'-',x+grW/2,curY+3,{align:'center'}); x+=grW;
                rect(x,curY,cmtW,rH,white,[200,200,210]);
                doc.setFontSize(7); doc.setFont('helvetica','normal'); setTxt([80,80,80]);
                doc.text(doc.splitTextToSize(lang.comments[sc.grade]||'-',cmtW-2)[0],x+1.5,curY+3); 
                curY+=rH;
            });
            // Footer row
            const ftxt=`${lang.points||'Pts'}: ${student.point}  |  ${lang.division||'Div'}: ${student.division}  |  ${lang.position||'Pos'}: ${posInfo}`;
            rect(ML,curY,acW,5,lgrey,[170,196,224]);
            doc.setFontSize(8); doc.setFont('helvetica','bold'); setTxt(red);
            doc.text(ftxt,ML+2,curY+3.5);
            curY+=5;
            const bodyBottom=curY;

            // ── Behaviour table ──
            let by=bodyTop;
            setFill(lgrey); setDraw(navy); doc.setLineWidth(0.3);
            doc.rect(bhX,by,bhW,5,'FD');
            doc.setFontSize(8); doc.setFont('helvetica','bold'); setTxt(navy);
            doc.text((lang.behavior||'BEHAVIOUR').toUpperCase(),bhX+bhW/2,by+3.5,{align:'center'});
            by+=5;
            // header
            rect(bhX,by,bhW*0.75,4.5,lgrey,[170,196,224]);
            rect(bhX+bhW*0.75,by,bhW*0.25,4.5,lgrey,[170,196,224]);
            doc.setFontSize(7.5); doc.setFont('helvetica','bold'); setTxt(navy);
            doc.text(lang.aspect||'Aspect',bhX+1.5,by+3);
            doc.text(lang.rating||'Rate',bhX+bhW*0.75+bhW*0.125,by+3,{align:'center'});
            by+=4.5;
            const behavItems=[['discipline',disc],['cooperation',coop],['learning',learn],['sports',sports],['participation',part],['punctuality',punct],['leadership',lead],['neatness',neat],['respect',resp],['creativity',creat]];
            behavItems.forEach(([key,val])=>{
                const bBg=gradeCol[val]||white, bFg=gradeFg[val]||black;
                rect(bhX,by,bhW*0.75,4,white,[200,200,210]);
                rect(bhX+bhW*0.75,by,bhW*0.25,4,bBg,[200,200,210]);
                doc.setFontSize(7.5); doc.setFont('helvetica','normal'); setTxt(black);
                doc.text(lang.behaviorAspects[key]||key,bhX+1.5,by+3);
                doc.setFont('helvetica','bold'); setTxt(bFg);
                doc.text(val,bhX+bhW*0.75+bhW*0.125,by+3,{align:'center'});
                by+=4;
            });
            // overall remark
            const remarksLines=doc.splitTextToSize(remark,bhW-4);
            rect(bhX,by,bhW,remarksLines.length*3.5+3,[247,250,255],[200,200,210]);
            doc.setFontSize(7.5); doc.setFont('helvetica','italic'); setTxt([80,80,80]);
            doc.text(remarksLines,bhX+2,by+3.5);

            curY=Math.max(curY,by+remarksLines.length*3.5+4)+3;

            // ── Requirements (each item on its own line) ──────────────────────
            if (reqs.length) {
                const reqLabel = lang.requirements || 'Requirements for Next Term';
                // Header row
                const reqHeaderH = 6;
                rect(ML, curY, CW, reqHeaderH, [255,248,220], [200,180,0]);
                doc.setFontSize(8); doc.setFont('helvetica','bold'); setTxt([100,75,0]);
                doc.text(reqLabel + ':', ML+2, curY+4);
                curY += reqHeaderH;
                // Each requirement on its own row
                reqs.forEach((r, i) => {
                    const lineText = `${i+1}.  ${r}`;
                    const wrapped  = doc.splitTextToSize(lineText, CW-6);
                    const rowH     = wrapped.length * 4 + 3;
                    const rowBg    = i % 2 === 0 ? [255,255,245] : [255,252,235];
                    rect(ML, curY, CW, rowH, rowBg, [210,190,120]);
                    doc.setFontSize(8); doc.setFont('helvetica','normal'); setTxt(black);
                    wrapped.forEach((ln, j) => doc.text(ln, ML+4, curY+3.5+j*4));
                    curY += rowH;
                });
                curY += 3;
            }

            // ── Term dates ───────────────────────────────────────────────────
            curY += 1;
            setDraw([170,196,224]); doc.setLineWidth(0.2);
            doc.line(ML, curY, ML+CW, curY); curY += 4;
            doc.setFontSize(8.5); doc.setFont('helvetica','normal'); setTxt([60,60,60]);
            doc.text((lang.closes||'School Closes') + ': ' + (closingDate||'—'), ML, curY+3);
            doc.text((lang.reopens||'School Opens') + ': ' + (openingDate||'—'), ML+CW/2, curY+3);
            curY += 7;

            // ── Class Teacher comment + name + date (no lines, just text) ───
            setDraw(navy); doc.setLineWidth(0.4);
            doc.line(ML, curY, ML+CW, curY); curY += 2;
            doc.setFontSize(9); doc.setFont('helvetica','bold'); setTxt(navy);
            doc.text((lang.classComment||"Class Teacher's Comment") + ':', ML, curY+3.5);
            curY += 6;
            const ctRemark = lang.classCommentIntro
                ? lang.classCommentIntro(student.name)
                  + ' ' + (pt<=12 ? lang.performanceLevels?.strong : pt<=21 ? lang.performanceLevels?.moderate : lang.performanceLevels?.weak)
                  + ' ' + (lang.academicPerformance||'academic performance')
                  + ' ' + (lang.thisTerm||'this term.')
                  + ' ' + (pt<=28 ? lang.encouragement?.encouraged : lang.encouragement?.necessary)
                : remark;
            const ctLines = doc.splitTextToSize(ctRemark, CW-4);
            doc.setFontSize(8.5); doc.setFont('helvetica','normal'); setTxt([40,40,40]);
            doc.text(ctLines, ML, curY+3);
            curY += ctLines.length * 4 + 5;
            // Name (left) | Date (right) — printed directly, NO lines
            const ctRole = lang.classComment?.replace(/:.*/,'') || 'Class Teacher';
            const ctDateX = ML + CW * 0.6;
            doc.setFontSize(7.5); doc.setFont('helvetica','normal'); setTxt([100,100,100]);
            doc.text(ctRole + ':', ML, curY);
            doc.text((lang.date||'Date') + ':', ctDateX, curY);
            curY += 4;
            doc.setFontSize(9); doc.setFont('helvetica','bold'); setTxt(navy);
            if (classTeacher) doc.text(classTeacher, ML, curY);
            if (closingDate)  doc.text(closingDate,  ctDateX, curY);
            curY += 7;

            // ── Head of School comment + name + date (no lines, just text) ──
            setDraw(navy); doc.setLineWidth(0.4);
            doc.line(ML, curY, ML+CW, curY); curY += 2;
            doc.setFontSize(9); doc.setFont('helvetica','bold'); setTxt(navy);
            doc.text((lang.headComment||"Head of School's Comment") + ':', ML, curY+3.5);
            curY += 6;
            const htRemark = (pt<=13 ? lang.remarksList.outstanding : pt<=17 ? lang.remarksList.commendable : pt<=24 ? lang.remarksList.satisfactory : lang.remarksList.followup)
                           + ' ' + (lang.headSupportNote||'');
            const htLines = doc.splitTextToSize(htRemark, CW-4);
            doc.setFontSize(8.5); doc.setFont('helvetica','normal'); setTxt([40,40,40]);
            doc.text(htLines, ML, curY+3);
            curY += htLines.length * 4 + 5;
            // Name (left) | Date (right) — printed directly, NO lines
            const htRole   = lang.headComment?.replace(/:.*/,'') || 'Head of School';
            const htDateX  = ML + CW * 0.6;
            doc.setFontSize(7.5); doc.setFont('helvetica','normal'); setTxt([100,100,100]);
            doc.text(htRole + ':', ML, curY);
            doc.text((lang.date||'Date') + ':', htDateX, curY);
            curY += 4;
            doc.setFontSize(9); doc.setFont('helvetica','bold'); setTxt(navy);
            if (headmaster)   doc.text(headmaster,  ML,      curY);
            if (closingDate)  doc.text(closingDate,  htDateX, curY);
            curY += 7;

            // ── Deliver ──
            if(action==='preview') window.open(doc.output('bloburl'),'_blank');
            else doc.save(filename);
        } catch(err) {
            console.error('[AXP report PDF]', err);
            _axpToast('Report PDF failed: '+err.message,'error');
        }
    }

    // Helper for button loading state in this scope
    function _repBtnLoad(id, text) {
        const b = document.getElementById(id);
        if (!b) return ()=>{};
        const orig=b.innerHTML, origD=b.disabled;
        b.disabled=true; b.innerHTML=`<i class="bi bi-hourglass-split" style="animation:axp-spin 1s linear infinite;display:inline-block;"></i> ${text}`; b.style.opacity='0.7';
        return ()=>{ b.disabled=origD; b.innerHTML=orig; b.style.opacity=''; };
    }

    // Preview current student report
    document.getElementById('axpRepPreview').onclick = () => {
        const restore = _repBtnLoad('axpRepPreview', 'Preparing…');
        const fn = `Report_${String(currentIndex+1).padStart(4,'0')}.pdf`;
        _repCapturePdf(fn, 'preview').then(restore).catch(restore);
    };

    // Download current student report
    document.getElementById('axpRepDownload').onclick = () => {
        const restore = _repBtnLoad('axpRepDownload', 'Downloading…');
        const repNum = String(currentIndex+1).padStart(4,'0');
        const fn = `${_sanitize(_schoolIdx())}_${_sanitize(_examClass())}_${_sanitize(_examType())}_Report_${repNum}.pdf`;
        _repCapturePdf(fn, 'download').then(restore).catch(restore);
    };

    // Download All — each student as their own PDF file
    document.getElementById('axpRepDownAll').addEventListener('click', async () => {
        if (isDownloadingAll) { isDownloadingAll = false; return; }
        isDownloadingAll = true;
        const origIdx = currentIndex;
        const downBtn = document.getElementById('axpRepDownAll');
        const origHtml = downBtn.innerHTML;
        downBtn.disabled = true;
        let downloaded=0, skipped=0;
        const prog = _axpPopup.progress('Downloading Reports', 'Preparing…');
        try {
            for (let i=0; i<eligible.length; i++) {
                if (!isDownloadingAll) break;
                currentIndex = i; render(currentIndex);
                await new Promise(r=>setTimeout(r,700));
                if (!isDownloadingAll) break;
                if (reportDiv.querySelector('.axp-alert')) { skipped++; continue; }
                prog.update(`Downloading report ${downloaded+1} of ${eligible.length}…`);
                const repNum = String(i+1).padStart(4,'0');
                await _repCapturePdf(`${_sanitize(_schoolIdx())}_${_sanitize(_examClass())}_${_sanitize(_examType())}_Report_${repNum}.pdf`, 'download');
                downloaded++;
                await new Promise(r=>setTimeout(r,800));
            }
            prog.done(isDownloadingAll
                ? `Done — Downloaded: ${downloaded}, Skipped: ${skipped}`
                : `Stopped — Downloaded: ${downloaded}`);
        } catch(e) {
            console.error('[AXP] Batch download error:',e);
            prog.error('Download failed: ' + e.message);
        } finally {
            isDownloadingAll=false;
            downBtn.disabled=false;
            downBtn.innerHTML=origHtml;
            currentIndex=origIdx; render(currentIndex);
        }
    });

    // Merge All — every eligible student on their own page in one large PDF
    document.getElementById('axpRepMergeAll').addEventListener('click', async () => {
        if (isDownloadingAll) return;
        isDownloadingAll = true;
        const origIdx = currentIndex;
        const mergeBtn = document.getElementById('axpRepMergeAll');
        const origBtnHtml = mergeBtn.innerHTML;
        mergeBtn.disabled = true;

        const prog = _axpPopup.progress('Merging Reports', 'Building combined PDF…');
        let count = 0;
        try {
            const jsPDFCtor = await _axpGetJsPDF();
            const mergeDoc = new jsPDFCtor({unit:'mm',format:[210,297],orientation:'portrait',compress:false,precision:4,putOnlyUsedFonts:true});
            const fn = `${_sanitize(_schoolIdx())}_${_sanitize(_examClass())}_${_sanitize(_examType())}_AllReports.pdf`;

            // Pure jsPDF draw helper (same logic as _repCapturePdf but draws onto existing doc)
            const _drawReportPage = async (doc, idx) => {
                const lang2        = LANG[currentLang];
                const student2     = students[idx];
                const elig2        = eligible.find(s=>s.name===student2.name&&s.point===student2.point);
                if (!elig2) return false;
                const si2          = _axpSchoolInfo(currentLang);
                const examClass2   = document.getElementById('axpRepClassSel')?.value||'';
                const examType2    = document.getElementById('axpRepExamSel')?.value||'';
                const examLabel2   = _axpExamLabel(examType2,currentLang);
                const clsLabel2    = _axpClassLabel(examClass2,currentLang);
                const month2       = _getVal('monthInput')||'';
                const closingDate2 = _getVal('closingDateInput')||'';
                const openingDate2 = _getVal('openingDateInput')||'';
                const classTeacher2= _getVal('classTeacherInput')||'';
                const headmaster2  = _getVal('headmasterInput')||'';
                const reqs2        = _getAllReqs();
                const year2        = (typeof _schoolMeta!=='undefined'&&_schoolMeta?.year)?_schoolMeta.year:new Date().getFullYear();
                const pt2          = Number(student2.point);
                const posInfo2     = elig2?`${elig2.position} / ${elig2.total}`:'';
                const _ci2         = (si2.rawIndex||'').replace(/[\./\\\s]/g,'').toUpperCase();
                const cNum2        = _ci2?`${_ci2}-${String(idx+1).padStart(4,'0')}`:`S000-${String(idx+1).padStart(4,'0')}`;

                let disc2='C',coop2='C',learn2='C',sports2='B',part2='C',punct2='C',lead2='C',neat2='C',resp2='C',creat2='C';
                let remark2=lang2.remarksList.followup;
                if(pt2<=17){disc2='A';coop2='A';learn2='A';sports2='C';part2='A';punct2='A';lead2='A';neat2='A';resp2='A';creat2='B';remark2=lang2.remarksList.outstanding;}
                else if(pt2<=21){disc2='B';coop2='B';learn2='B';sports2='C';part2='B';punct2='B';lead2='B';neat2='B';resp2='B';creat2='B';remark2=lang2.remarksList.commendable;}
                else if(pt2<=30){remark2=lang2.remarksList.satisfactory;}

                const PW=210,PH=297,ML=10,CW=190;
                const navy=[26,58,92],gold=[200,168,75],lgrey=[220,232,245],white=[255,255,255],black=[0,0,0],red=[183,28,28];
                const gradeCol={A:[0,100,0],B:[0,170,0],C:[173,255,47],D:[255,165,0],F:[255,0,0]};
                const gradeFg={A:white,B:white,C:black,D:black,F:white};
                const sf=(c)=>doc.setFillColor(c[0],c[1],c[2]);
                const sd=(c)=>doc.setDrawColor(c[0],c[1],c[2]);
                const st=(c)=>doc.setTextColor(c[0],c[1],c[2]);
                const rc=(x,y,w,h,fill,stroke)=>{if(fill)sf(fill);if(stroke)sd(stroke);doc.setLineWidth(stroke?0.3:0);doc.rect(x,y,w,h,fill&&stroke?'FD':fill?'F':stroke?'D':'S');};
                let cy=10;

                sd(navy);doc.setLineWidth(0.5);doc.rect(4,4,PW-8,PH-8,'D');
                sd([170,196,224]);doc.setLineWidth(0.2);doc.rect(6.5,6.5,PW-13,PH-13,'D');

                doc.setFontSize(8);doc.setFont('helvetica','bold');st(navy);doc.text(si2.governmentHeader||"PRESIDENT'S OFFICE",PW/2,cy+3,{align:'center'});cy+=5;
                doc.setFontSize(7);doc.setFont('helvetica','normal');st([80,80,80]);doc.text(si2.region||'',PW/2,cy+2,{align:'center'});cy+=4;
                doc.setFontSize(13);doc.setFont('helvetica','bold');st(navy);doc.text(si2.displayLine1.toUpperCase(),PW/2,cy+4,{align:'center'});cy+=6;
                doc.setFontSize(7);doc.setFont('helvetica','normal');st([80,80,80]);doc.text(si2.displayLine2||'',PW/2,cy+2,{align:'center'});cy+=4;
                sf(navy);doc.rect(ML,cy,CW,7,'F');
                doc.setFontSize(9);doc.setFont('helvetica','bold');st(white);
                doc.text(`${clsLabel2.toUpperCase()} ${examLabel2.toUpperCase()} ${(lang2.reportTitle||'RESULTS').toUpperCase()} — ${year2}`,PW/2,cy+4.5,{align:'center'});cy+=8;

                const ih=6;rc(ML,cy,CW,ih,lgrey,[170,196,224]);
                const cols2=[{lbl:(lang2.studentName||'Name')+':',val:student2.name,w:CW*0.38},{lbl:(lang2.class||'Class')+':',val:clsLabel2,w:CW*0.2},{lbl:(lang2.sex||'Sex')+':',val:student2.gender||'-',w:CW*0.12},{lbl:'No:',val:cNum2,w:CW*0.3}];
                let ix=ML;cols2.forEach((c,i)=>{doc.setFontSize(8);doc.setFont('helvetica','bold');st(navy);doc.text(c.lbl,ix+1.5,cy+4);const lw=doc.getTextWidth(c.lbl)+2;doc.setFont('helvetica','normal');st(black);doc.text(c.val,ix+lw,cy+4);ix+=c.w;if(i<cols2.length-1){sd([170,196,224]);doc.setLineWidth(0.2);doc.line(ix,cy,ix,cy+ih);}});cy+=ih+2;

                const dl=[currentLang==='sw'?`${student2.name} alifanya mtihani wa ${examLabel2} katika ${clsLabel2}, mwaka ${year2}.`:`This report certifies the academic performance of ${student2.name} who sat for the ${examLabel2} examination in ${clsLabel2}, ${year2}.`,currentLang==='sw'?`Alipata pointi ${student2.point}, daraja ${student2.division}${elig2?`, nafasi ${elig2.position}/${elig2.total}`:''}.`:`Scored ${student2.point} pts, Division ${student2.division}${elig2?`, ranked ${elig2.position}/${elig2.total} in class`:''}.`,currentLang==='sw'?'Daraja I(7-17):Bora Sana | II(18-21):Nzuri | III(22-25):Ya Kati | IV(26-33):Hafifu | 0:Kushindwa':'Div I(7-17pts):Excellent | II(18-21):Good | III(22-25):Average | IV(26-33):Poor | 0:Fail',currentLang==='sw'?'Matokeo yaliyopo chini yanaonyesha maendeleo ya muhula huu.':'Results below reflect overall progress this term.',currentLang==='sw'?'Wazazi wanashauriwa kushirikiana na mwanafunzi.':'Parents are encouraged to support continued improvement.'];
                rc(ML,cy,CW,dl.length*4+3,[247,250,255],[220,232,245]);doc.setFontSize(8);doc.setFont('helvetica','normal');st([40,40,40]);dl.forEach((ln,i)=>doc.text(doc.splitTextToSize(ln,CW-4)[0],ML+2,cy+3+i*4));cy+=dl.length*4+5;

                const bodyTop2=cy,acW=CW*0.57,bhW=CW*0.40,bhX2=ML+acW+CW*0.03;
                rc(ML,cy,acW,5,lgrey,[170,196,224]);doc.setFontSize(8);doc.setFont('helvetica','bold');st(navy);doc.text((lang2.performanceTitle||'ACADEMIC PERFORMANCE').toUpperCase(),ML+acW/2,cy+3.5,{align:'center'});cy+=5;
                const sbjW=acW*0.36,mrkW=acW*0.14,grW=acW*0.12,cmtW=acW*0.38;
                [[lang2.subject||'Subject','left',sbjW],[lang2.mark||'Mark','center',mrkW],['Gr','center',grW],[lang2.comment||'Remark','center',cmtW]].reduce((x,[lbl,al,w])=>{rc(x,cy,w,5,lgrey,[170,196,224]);doc.setFontSize(7.5);doc.setFont('helvetica','bold');st(navy);doc.text(lbl,al==='left'?x+1.5:x+w/2,cy+3.5,{align:al});return x+w;},ML);cy+=5;
                Object.entries(student2.scores||{}).filter(([,sc])=>sc.mark!=null&&sc.mark!=='').forEach(([sub,sc])=>{const rH=4.5;let x=ML;rc(x,cy,sbjW,rH,white,[200,200,210]);doc.setFontSize(7.5);doc.setFont('helvetica','normal');st(black);doc.text(doc.splitTextToSize(sub,sbjW-2)[0],x+1.5,cy+3);x+=sbjW;rc(x,cy,mrkW,rH,white,[200,200,210]);doc.setFont('helvetica','bold');doc.text(String(sc.mark),x+mrkW/2,cy+3,{align:'center'});x+=mrkW;const gBg=gradeCol[sc.grade]||white,gFg=gradeFg[sc.grade]||black;rc(x,cy,grW,rH,gBg,[200,200,210]);st(gFg);doc.text(sc.grade||'-',x+grW/2,cy+3,{align:'center'});x+=grW;rc(x,cy,cmtW,rH,white,[200,200,210]);doc.setFontSize(7);doc.setFont('helvetica','normal');st([80,80,80]);doc.text(doc.splitTextToSize(lang2.comments[sc.grade]||'-',cmtW-2)[0],x+1.5,cy+3);cy+=rH;});
                rc(ML,cy,acW,5,lgrey,[170,196,224]);doc.setFontSize(8);doc.setFont('helvetica','bold');st(red);doc.text(`${lang2.points||'Pts'}: ${student2.point}  |  ${lang2.division||'Div'}: ${student2.division}  |  ${lang2.position||'Pos'}: ${posInfo2}`,ML+2,cy+3.5);cy+=5;

                let by2=bodyTop2;rc(bhX2,by2,bhW,5,lgrey,[170,196,224]);doc.setFontSize(8);doc.setFont('helvetica','bold');st(navy);doc.text((lang2.behavior||'BEHAVIOUR').toUpperCase(),bhX2+bhW/2,by2+3.5,{align:'center'});by2+=5;
                rc(bhX2,by2,bhW*0.75,4.5,lgrey,[170,196,224]);rc(bhX2+bhW*0.75,by2,bhW*0.25,4.5,lgrey,[170,196,224]);doc.setFontSize(7.5);doc.setFont('helvetica','bold');st(navy);doc.text(lang2.aspect||'Aspect',bhX2+1.5,by2+3);doc.text(lang2.rating||'Rate',bhX2+bhW*0.875,by2+3,{align:'center'});by2+=4.5;
                [[disc2,'discipline'],[coop2,'cooperation'],[learn2,'learning'],[sports2,'sports'],[part2,'participation'],[punct2,'punctuality'],[lead2,'leadership'],[neat2,'neatness'],[resp2,'respect'],[creat2,'creativity']].forEach(([val,key])=>{const bBg=gradeCol[val]||white,bFg=gradeFg[val]||black;rc(bhX2,by2,bhW*0.75,4,white,[200,200,210]);rc(bhX2+bhW*0.75,by2,bhW*0.25,4,bBg,[200,200,210]);doc.setFontSize(7.5);doc.setFont('helvetica','normal');st(black);doc.text(lang2.behaviorAspects[key]||key,bhX2+1.5,by2+3);doc.setFont('helvetica','bold');st(bFg);doc.text(val,bhX2+bhW*0.875,by2+3,{align:'center'});by2+=4;});
                const rl2=doc.splitTextToSize(remark2,bhW-4);rc(bhX2,by2,bhW,rl2.length*3.5+3,[247,250,255],[200,200,210]);doc.setFontSize(7.5);doc.setFont('helvetica','italic');st([80,80,80]);doc.text(rl2,bhX2+2,by2+3.5);

                cy=Math.max(cy,by2+rl2.length*3.5+4)+3;

                // ── Requirements (each on its own row) ──
                if (reqs2.length) {
                    rc(ML,cy,CW,6,[255,248,220],[200,180,0]);
                    doc.setFontSize(8);doc.setFont('helvetica','bold');st([100,75,0]);
                    doc.text((lang2.requirements||'Requirements for Next Term')+':',ML+2,cy+4);
                    cy+=6;
                    reqs2.forEach((r,i)=>{
                        const lnT=`${i+1}.  ${r}`;
                        const lnW=doc.splitTextToSize(lnT,CW-6);
                        const rH=lnW.length*4+3;
                        rc(ML,cy,CW,rH,i%2===0?[255,255,245]:[255,252,235],[210,190,120]);
                        doc.setFontSize(8);doc.setFont('helvetica','normal');st(black);
                        lnW.forEach((ln,j)=>doc.text(ln,ML+4,cy+3.5+j*4));
                        cy+=rH;
                    });
                    cy+=3;
                }

                // ── Term dates ──
                cy+=1;sd([170,196,224]);doc.setLineWidth(0.2);doc.line(ML,cy,ML+CW,cy);cy+=4;
                doc.setFontSize(8.5);doc.setFont('helvetica','normal');st([60,60,60]);
                doc.text((lang2.closes||'School Closes')+': '+(closingDate2||'—'),ML,cy+3);
                doc.text((lang2.reopens||'School Opens')+': '+(openingDate2||'—'),ML+CW/2,cy+3);
                cy+=7;

                // ── Class Teacher comment + name + date (no lines) ──
                sd(navy);doc.setLineWidth(0.4);doc.line(ML,cy,ML+CW,cy);cy+=2;
                doc.setFontSize(9);doc.setFont('helvetica','bold');st(navy);
                doc.text((lang2.classComment||"Class Teacher's Comment")+':',ML,cy+3.5);cy+=6;
                const ctr2=lang2.classCommentIntro?lang2.classCommentIntro(student2.name)+' '+(pt2<=12?lang2.performanceLevels?.strong:pt2<=21?lang2.performanceLevels?.moderate:lang2.performanceLevels?.weak)+' '+(lang2.academicPerformance||'')+' '+(lang2.thisTerm||'')+(pt2<=28?' '+lang2.encouragement?.encouraged:' '+lang2.encouragement?.necessary):remark2;
                const ctl2=doc.splitTextToSize(ctr2,CW-4);
                doc.setFontSize(8.5);doc.setFont('helvetica','normal');st([40,40,40]);doc.text(ctl2,ML,cy+3);
                cy+=ctl2.length*4+5;
                {const ctRole2=lang2.classComment?.replace(/:.*/,'')||'Class Teacher';
                const dx2=ML+CW*0.6;
                doc.setFontSize(7.5);doc.setFont('helvetica','normal');st([100,100,100]);
                doc.text(ctRole2+':',ML,cy);doc.text((lang2.date||'Date')+':',dx2,cy);cy+=4;
                doc.setFontSize(9);doc.setFont('helvetica','bold');st(navy);
                if(classTeacher2)doc.text(classTeacher2,ML,cy);
                if(closingDate2)doc.text(closingDate2,dx2,cy);}
                cy+=7;

                // ── Head of School comment + name + date (no lines) ──
                sd(navy);doc.setLineWidth(0.4);doc.line(ML,cy,ML+CW,cy);cy+=2;
                doc.setFontSize(9);doc.setFont('helvetica','bold');st(navy);
                doc.text((lang2.headComment||"Head of School's Comment")+':',ML,cy+3.5);cy+=6;
                const htr2=(pt2<=13?lang2.remarksList.outstanding:pt2<=17?lang2.remarksList.commendable:pt2<=24?lang2.remarksList.satisfactory:lang2.remarksList.followup)+' '+(lang2.headSupportNote||'');
                const htl2=doc.splitTextToSize(htr2,CW-4);
                doc.setFontSize(8.5);doc.setFont('helvetica','normal');st([40,40,40]);doc.text(htl2,ML,cy+3);
                cy+=htl2.length*4+5;
                {const htRole2=lang2.headComment?.replace(/:.*/,'')||'Head of School';
                const dx2=ML+CW*0.6;
                doc.setFontSize(7.5);doc.setFont('helvetica','normal');st([100,100,100]);
                doc.text(htRole2+':',ML,cy);doc.text((lang2.date||'Date')+':',dx2,cy);cy+=4;
                doc.setFontSize(9);doc.setFont('helvetica','bold');st(navy);
                if(headmaster2)doc.text(headmaster2,ML,cy);
                if(closingDate2)doc.text(closingDate2,dx2,cy);}
                return true;
            };

            for (let i=0; i<eligible.length; i++) {
                if(!isDownloadingAll) break;
                prog.update(`Rendering report ${count+1} of ${eligible.length}…`);
                if(count>0) mergeDoc.addPage([210,297],'portrait');
                const drawn = await _drawReportPage(mergeDoc, i);
                if(drawn) count++;
                await new Promise(r=>setTimeout(r,20));
            }

            if (count === 0) {
                prog.close();
                _axpPopup.alert('No valid reports found to merge.', 'warning');
            } else {
                mergeDoc.save(fn);
                prog.done(`Merged PDF ready — ${count} student reports combined.`);
            }
        } catch(e) {
            console.error('[AXP] Merge error:', e);
            prog.error('Failed to create merged PDF: ' + e.message);
        } finally {
            isDownloadingAll = false;
            mergeBtn.innerHTML = origBtnHtml;
            mergeBtn.disabled = false;
            currentIndex = origIdx; render(currentIndex);
        }
    });
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: Certificate Generation
// ─────────────────────────────────────────────────────────────────────────────

function renderStudentCertificates(students) {
    const container = document.getElementById('section-analytics')
                   || document.querySelector('[data-section="analytics"]')
                   || document.getElementById('axpRRContent');
    if (!container) return;

    container.innerHTML = '';
    let isDownloadingAll = false;

    const allStudents = [...students].sort((a,b)=>(a.name||'').localeCompare(b.name||''));

    if (!allStudents.length) {
        container.innerHTML = `<div class="axp-section-card"><div class="axp-empty-state"><i class="bi bi-exclamation-triangle" style="font-size:2em;"></i><p>No students found.</p></div></div>`;
        return;
    }

    const nav = document.createElement('div');
    nav.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.5em;margin-bottom:1em;';
    nav.innerHTML = `
        <button id="axpCertPrev"    class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-chevron-left"></i> Back</button>
        <button id="axpCertNext"    class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-chevron-right"></i> Next</button>
        <button id="axpCertPreview" class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-eye"></i> Preview</button>
        <button id="axpCertDownload" class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-download"></i> Download</button>
        <button id="axpCertDownAll"  class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-cloud-download"></i> Download All</button>
        <button id="axpCertEn"  class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-translate"></i> English</button>
        <button id="axpCertSw"  class="axp-btn-secondary" style="display:flex;align-items:center;gap:0.4em;"><i class="bi bi-globe2"></i> Kiswahili</button>
        <span id="axpCertCounter" style="color:#888;font-size:0.9em;align-self:center;margin-left:0.5em;"></span>`;
    container.appendChild(nav);

    const certDiv = document.createElement('div');
    certDiv.style.cssText = 'padding:0;margin:0;background:#fff;overflow:hidden;';
    container.appendChild(certDiv);

    let currentLang = localStorage.getItem('preferredLang')||'en';
    let currentIndex = 0;

    const CERT_LANG = {
        en:{ certificate:'CERTIFICATE OF COMPLETION', presentedTo:'This certificate is proudly presented to', recognition:'For successfully completing the academic program', conducted:'At', date:'Date', headTeacher:'Head of School', classTeacher:'Class Teacher', seal:'School Seal' },
        sw:{ certificate:'CHETI CHA KUKAMILISHA', presentedTo:'Cheti hiki kinatokewa kwa', recognition:'Kwa kukamilisha kikamilifu programu ya masomo', conducted:'Katika', date:'Tarehe', headTeacher:'Mkuu wa Shule', classTeacher:'Mwalimu wa Darasa', seal:'Muhuri wa Shule' }
    };

    function highlightLang() {
        document.getElementById('axpCertEn').style.fontWeight = currentLang==='en'?'bold':'normal';
        document.getElementById('axpCertSw').style.fontWeight = currentLang==='sw'?'bold':'normal';
    }
    document.getElementById('axpCertEn').onclick = ()=>{ currentLang='en'; localStorage.setItem('preferredLang','en'); renderCert(currentIndex); highlightLang(); };
    document.getElementById('axpCertSw').onclick = ()=>{ currentLang='sw'; localStorage.setItem('preferredLang','sw'); renderCert(currentIndex); highlightLang(); };
    highlightLang();

    function _getVal(fieldId) {
        const examClass = document.getElementById('axpRepClassSel')?.value||document.getElementById('axpRRClassSel')?.value||'';
        const panel = document.getElementById('axpClassInfoPanel');
        if (panel) {
            const panelEl = panel.querySelector(`[data-field="${fieldId}"]`);
            if (panelEl && panelEl.value) return panelEl.value;
        }
        const saved = SchoolInfoStorage.getClassData(examClass);
        if (saved && saved[fieldId]) return saved[fieldId];
        const el = document.getElementById(fieldId);
        if (el && el.value) return el.value;
        return '';
    }

    function renderCert(index) {
        const lang         = CERT_LANG[currentLang];
        const student      = allStudents[index];
        const sd           = window.currentSchoolData;
        const _siCert      = _axpSchoolInfo(currentLang||'en');
        const schoolName   = _siCert.displayLine1;
        const schoolIndex  = _siCert.displayLine2;
        const headmaster   = _getVal('headmasterInput');
        const classTeacher = _getVal('classTeacherInput');
        const closingDate  = _getVal('closingDateInput');
        const schoolLogo   = window.getSchoolLogo ? window.getSchoolLogo() : null;
        // (Exam type not shown on certificates — they are occasion-based)

        certDiv.innerHTML = `
            <div style="width:297mm;height:210mm;margin:0;padding:0;background:#fff;position:relative;font-family:'Georgia',serif;box-sizing:border-box;overflow:hidden;">

                <!-- ░░ DECORATION LAYER (all position:absolute, pointer-events:none) ░░ -->

                <!-- Subtle radial background glow -->
                <div style="position:absolute;inset:0;background:
                    radial-gradient(ellipse at 15% 50%,rgba(200,168,75,0.06) 0%,transparent 55%),
                    radial-gradient(ellipse at 85% 50%,rgba(200,168,75,0.06) 0%,transparent 55%),
                    radial-gradient(ellipse at 50% 0%,rgba(26,58,92,0.04) 0%,transparent 45%),
                    radial-gradient(ellipse at 50% 100%,rgba(26,58,92,0.04) 0%,transparent 45%);
                    pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>

                <!-- Outer gold border -->
                <div style="position:absolute;top:4mm;left:4mm;right:4mm;bottom:4mm;border:3px solid #c8a84b;pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
                <!-- Inner navy border -->
                <div style="position:absolute;top:6.5mm;left:6.5mm;right:6.5mm;bottom:6.5mm;border:1px solid #1a3a5c;pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>

                <!-- Corner ornaments (4 corners) -->
                <div style="position:absolute;top:4mm;left:4mm;width:12mm;height:12mm;border-top:4px solid #c8a84b;border-left:4px solid #c8a84b;pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
                <div style="position:absolute;top:4mm;right:4mm;width:12mm;height:12mm;border-top:4px solid #c8a84b;border-right:4px solid #c8a84b;pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
                <div style="position:absolute;bottom:4mm;left:4mm;width:12mm;height:12mm;border-bottom:4px solid #c8a84b;border-left:4px solid #c8a84b;pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
                <div style="position:absolute;bottom:4mm;right:4mm;width:12mm;height:12mm;border-bottom:4px solid #c8a84b;border-right:4px solid #c8a84b;pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>

                <!-- Left gold/navy bar -->
                <div style="position:absolute;top:9mm;left:9mm;bottom:9mm;width:3.5mm;background:linear-gradient(180deg,#c8a84b 0%,#1a3a5c 50%,#c8a84b 100%);pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
                <!-- Right gold/navy bar -->
                <div style="position:absolute;top:9mm;right:9mm;bottom:9mm;width:3.5mm;background:linear-gradient(180deg,#c8a84b 0%,#1a3a5c 50%,#c8a84b 100%);pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>

                <!-- Watermark: student name diagonal -->
                ${[{t:'50%',l:'50%',fs:'40px'},{t:'22%',l:'30%',fs:'22px'},{t:'75%',l:'70%',fs:'22px'}]
                    .map(p=>`<div style="position:absolute;top:${p.t};left:${p.l};transform:translate(-50%,-50%) rotate(-25deg);font-size:${p.fs};font-weight:bold;color:rgba(200,168,75,0.05);white-space:nowrap;pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;">${escapeHtml(student.name.toUpperCase())}</div>`).join('')}

                <!-- ░░ CONTENT LAYER — fills full 297×210mm page ░░ -->
                <div style="position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;padding:10mm 17mm 8mm 17mm;box-sizing:border-box;gap:0;">

                    <!-- ── TOP BAND: logo left + school identity centre + logo right ── -->
                    <div style="flex-shrink:0;display:flex;align-items:center;gap:6mm;border-bottom:1.5px solid #c8a84b;padding-bottom:3mm;margin-bottom:3mm;">

                        <!-- Left logo -->
                        <div style="flex-shrink:0;width:16mm;text-align:center;">
                            ${schoolLogo
                                ? `<img src="${schoolLogo}" style="width:14mm;height:14mm;object-fit:contain;display:block;margin:0 auto;-webkit-print-color-adjust:exact;print-color-adjust:exact;">`
                                : `<div style="width:14mm;height:14mm;border-radius:50%;background:#1a3a5c;display:flex;align-items:center;justify-content:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;"><span style="color:#c8a84b;font-size:14px;font-weight:bold;">${(schoolName||'S')[0]}</span></div>`}
                        </div>

                        <!-- Centre: government + school name -->
                        <div style="flex:1;text-align:center;">
                            <div style="font-size:6px;letter-spacing:3px;color:#999;text-transform:uppercase;font-family:Arial,sans-serif;">THE UNITED REPUBLIC OF TANZANIA</div>
                            <div style="font-size:7px;color:#888;font-family:Arial,sans-serif;margin:0.5mm 0;">PRESIDENT'S OFFICE — REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT</div>
                            <div style="font-size:14px;font-weight:bold;color:#1a3a5c;text-transform:uppercase;letter-spacing:1.5px;line-height:1.1;">${escapeHtml((schoolName||'').toUpperCase())}</div>
                            <div style="font-size:7px;color:#777;font-family:Arial,sans-serif;margin-top:0.5mm;">${escapeHtml(schoolIndex.toUpperCase())}</div>
                        </div>

                        <!-- Right logo -->
                        <div style="flex-shrink:0;width:16mm;text-align:center;">
                            ${schoolLogo
                                ? `<img src="${schoolLogo}" style="width:14mm;height:14mm;object-fit:contain;display:block;margin:0 auto;-webkit-print-color-adjust:exact;print-color-adjust:exact;">`
                                : `<div style="width:14mm;height:14mm;border-radius:50%;background:#1a3a5c;display:flex;align-items:center;justify-content:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;"><span style="color:#c8a84b;font-size:14px;font-weight:bold;">${(schoolName||'S')[0]}</span></div>`}
                        </div>
                    </div>

                    <!-- ── TITLE ROW (fixed height) ── -->
                    <div style="flex-shrink:0;text-align:center;margin-bottom:2mm;">
                        <!-- Decorative rule -->
                        <div style="display:flex;align-items:center;gap:5mm;margin:0 auto 2mm;max-width:160mm;">
                            <div style="flex:1;height:1px;background:linear-gradient(90deg,transparent,#c8a84b);"></div>
                            <i class="bi bi-diamond-fill" style="color:#c8a84b;font-size:7px;"></i>
                            <i class="bi bi-diamond-fill" style="color:#1a3a5c;font-size:5px;"></i>
                            <i class="bi bi-diamond-fill" style="color:#c8a84b;font-size:7px;"></i>
                            <div style="flex:1;height:1px;background:linear-gradient(90deg,#c8a84b,transparent);"></div>
                        </div>
                        <div style="font-size:7px;letter-spacing:5px;color:#999;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:1.5mm;">— ${lang.presentedTo} —</div>
                        <div style="font-size:22px;font-weight:bold;color:#1a3a5c;letter-spacing:4px;text-transform:uppercase;line-height:1.1;font-family:'Georgia',serif;">${lang.certificate}</div>
                        <div style="width:50mm;height:2.5px;background:linear-gradient(90deg,transparent,#c8a84b,transparent);margin:2mm auto 0;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
                    </div>

                    <!-- ── RECIPIENT BLOCK (flex:1 — takes all remaining vertical space) ── -->
                    <div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 10mm;">
                        <div style="font-size:8px;letter-spacing:2.5px;color:#bbb;font-style:italic;font-family:Arial,sans-serif;margin-bottom:2mm;">${lang.presentedTo}</div>

                        <!-- Name -->
                        <div style="font-size:24px;font-weight:bold;color:#1a3a5c;letter-spacing:3px;text-transform:uppercase;line-height:1.15;font-family:'Georgia',serif;">${escapeHtml(student.name)}</div>

                        <!-- Name underline rule -->
                        <div style="display:flex;align-items:center;gap:5mm;margin:2.5mm auto;width:55%;">
                            <div style="flex:1;height:1.5px;background:linear-gradient(90deg,transparent,#c8a84b);"></div>
                            <i class="bi bi-stars" style="color:#c8a84b;font-size:8px;"></i>
                            <div style="flex:1;height:1.5px;background:linear-gradient(90deg,#c8a84b,transparent);"></div>
                        </div>

                        <!-- Recognition text -->
                        <div style="font-size:9.5px;color:#444;font-style:italic;line-height:1.9;max-width:150mm;font-family:Arial,sans-serif;">
                            ${lang.recognition}<br>
                            <span style="color:#888;font-size:8.5px;">${lang.conducted} <strong style="color:#1a3a5c;font-style:normal;">${escapeHtml((schoolName||'').toUpperCase())}</strong></span>
                        </div>
                    </div>

                    <!-- ── SIGNATURE ROW (fixed, pinned to bottom) ── -->
                    <div style="flex-shrink:0;border-top:1.5px solid #c8a84b;padding-top:3mm;display:flex;align-items:flex-end;justify-content:space-between;">

                        <!-- Class Teacher -->
                        <div style="flex:1;text-align:center;">
                            <div style="height:9mm;border-bottom:1.5px solid #333;width:38mm;margin:0 auto 2mm;"></div>
                            <div style="font-size:8.5px;font-weight:bold;color:#222;font-family:Arial,sans-serif;">${escapeHtml(classTeacher||'_______________')}</div>
                            <div style="font-size:7px;color:#888;letter-spacing:0.5px;font-family:Arial,sans-serif;">${lang.classTeacher}</div>
                            <div style="font-size:6.5px;color:#aaa;margin-top:1mm;font-family:Arial,sans-serif;">${lang.date}: ${escapeHtml(closingDate)}</div>
                        </div>

                        <!-- Official seal centre -->
                        <div style="flex:0.7;text-align:center;display:flex;flex-direction:column;align-items:center;gap:1.5mm;">
                            <div style="width:18mm;height:18mm;border-radius:50%;border:2px solid #c8a84b;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(200,168,75,0.06);-webkit-print-color-adjust:exact;print-color-adjust:exact;">
                                <i class="bi bi-patch-check-fill" style="font-size:15px;color:#c8a84b;"></i>
                                <div style="font-size:4.5px;color:#1a3a5c;font-weight:bold;letter-spacing:0.3px;font-family:Arial,sans-serif;">${lang.seal||'OFFICIAL SEAL'}</div>
                            </div>
                        </div>

                        <!-- Head Teacher -->
                        <div style="flex:1;text-align:center;">
                            <div style="height:9mm;border-bottom:1.5px solid #333;width:38mm;margin:0 auto 2mm;"></div>
                            <div style="font-size:8.5px;font-weight:bold;color:#222;font-family:Arial,sans-serif;">${escapeHtml(headmaster||'_______________')}</div>
                            <div style="font-size:7px;color:#888;letter-spacing:0.5px;font-family:Arial,sans-serif;">${lang.headTeacher}</div>
                            <div style="font-size:6.5px;color:#aaa;margin-top:1mm;font-family:Arial,sans-serif;">${lang.date}: ${escapeHtml(closingDate)}</div>
                        </div>

                    </div><!-- end signature row -->

                </div><!-- end content layer -->
            </div>`;

        document.getElementById('axpCertPrev').disabled = index===0;
                document.getElementById('axpCertPrev').disabled = index===0;
        document.getElementById('axpCertNext').disabled = index===allStudents.length-1;
        document.getElementById('axpCertCounter').textContent = `${index+1} / ${allStudents.length}`;
    }

    renderCert(currentIndex);

    document.getElementById('axpCertPrev').onclick = ()=>{ if(currentIndex>0){ currentIndex--; renderCert(currentIndex); } };
    document.getElementById('axpCertNext').onclick = ()=>{ if(currentIndex<allStudents.length-1){ currentIndex++; renderCert(currentIndex); } };

    const _sanitize = s=>s.replace(/[^a-z0-9]/gi,'_').replace(/_+/g,'_');
    const _schoolIdx = ()=>((typeof _dashboardData!=='undefined'&&_dashboardData.schoolindex)||window.currentSchoolData?.indexNumber||'SCH').toUpperCase();

    // A4 landscape: 297×210mm. Render certDiv via html2canvas → jsPDF image.
    const _CERT_W = 1122;  // px at 96dpi = 297mm

    async function _certCapturePdf(filename, action) {
        try {
            const jsPDFCtor = await _axpGetJsPDF();

            // ── Gather data ─────────────────────────────────────────────────
            const lang         = CERT_LANG[currentLang] || CERT_LANG.en;
            const student      = allStudents[currentIndex];
            if (!student) { _axpToast('No student selected','warning'); return; }

            const si           = _axpSchoolInfo(currentLang || 'en');
            const schoolName   = si.displayLine1  || '';
            const schoolIndex  = si.displayLine2  || '';
            const govHeader    = si.governmentHeader
                              || "PRESIDENT'S OFFICE — REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT";

            const headmaster   = _getVal('headmasterInput')  || '';
            const classTeacher = _getVal('classTeacherInput')|| '';
            const closingDate  = _getVal('closingDateInput') || '';

            const examClass = (document.getElementById('axpRRClassSel')
                            || document.getElementById('axpRepClassSel')
                            || {}).value || '';
            const clsLabel  = _axpClassLabel(examClass, currentLang) || examClass || '';

            // ── Safe helpers ────────────────────────────────────────────────
            // jsPDF throws "Invalid argument" on empty string in some builds
            const T  = v => (v == null || String(v).trim() === '') ? ' ' : String(v);
            // Colour arrays → individual args (avoids spread issues)
            const sf = c => doc.setFillColor(c[0], c[1], c[2]);
            const sd = c => doc.setDrawColor(c[0], c[1], c[2]);
            const st = c => doc.setTextColor(c[0], c[1], c[2]);
            const tx = (text, x, y, opts) => doc.text(T(text), x, y, opts || {});

            // ── Create document — A4 landscape ──────────────────────────────
            // Use format:'a4' + orientation so jsPDF sets dimensions correctly
            const doc = new jsPDFCtor({ unit:'mm', format:'a4', orientation:'landscape' });
            const PW = 297, PH = 210, cx = PW / 2;

            const NAVY = [26, 58, 92];
            const GOLD = [200, 168, 75];
            const WHITE = [255, 255, 255];

            // ── Gold double border ──────────────────────────────────────────
            sd(GOLD); doc.setLineWidth(3);   doc.rect(4, 4, PW-8,  PH-8,  'D');
            sd(GOLD); doc.setLineWidth(0.5); doc.rect(6.5, 6.5, PW-13, PH-13, 'D');

            // ── Navy header band ────────────────────────────────────────────
            sf(NAVY); doc.rect(0, 0, PW, 30, 'F');

            doc.setFontSize(7); doc.setFont('helvetica','normal'); st(WHITE);
            tx(govHeader.toUpperCase(), cx, 8, {align:'center'});

            doc.setFontSize(15); doc.setFont('helvetica','bold'); st(WHITE);
            tx(schoolName.toUpperCase(), cx, 17, {align:'center'});

            doc.setFontSize(8); doc.setFont('helvetica','normal'); st(WHITE);
            tx(schoolIndex.toUpperCase(), cx, 24, {align:'center'});

            // ── Certificate title ───────────────────────────────────────────
            doc.setFontSize(24); doc.setFont('helvetica','bold'); st(GOLD);
            tx(lang.certificate || 'CERTIFICATE OF COMPLETION', cx, 48, {align:'center'});

            // Decorative rule
            sd(GOLD); doc.setLineWidth(1);   doc.line(cx-55, 52, cx+55, 52);
            sd(GOLD); doc.setLineWidth(0.3); doc.line(cx-65, 54, cx+65, 54);

            // ── "Presented to" ──────────────────────────────────────────────
            doc.setFontSize(10); doc.setFont('helvetica','italic'); st(NAVY);
            tx(lang.presentedTo || 'This certificate is proudly presented to', cx, 64, {align:'center'});

            // ── Student name ────────────────────────────────────────────────
            doc.setFontSize(28); doc.setFont('helvetica','bolditalic'); st(NAVY);
            tx(student.name, cx, 79, {align:'center'});

            // Underline — measure AFTER setting font+size
            const nw = doc.getTextWidth(T(student.name));
            sd(GOLD); doc.setLineWidth(0.8);
            doc.line(cx - nw/2, 82, cx + nw/2, 82);

            // ── Recognition text ────────────────────────────────────────────
            doc.setFontSize(10); doc.setFont('helvetica','normal'); st([60,60,60]);
            tx(lang.recognition || 'For successfully completing the academic program', cx, 93, {align:'center'});

            // ── Class label ─────────────────────────────────────────────────
            if (clsLabel && clsLabel.trim()) {
                doc.setFontSize(12); doc.setFont('helvetica','bold'); st(NAVY);
                tx(clsLabel, cx, 102, {align:'center'});
            }

            // ── School line ─────────────────────────────────────────────────
            doc.setFontSize(9); doc.setFont('helvetica','normal'); st([70,70,70]);
            tx((lang.conducted || 'At') + ': ' + schoolName, cx, 111, {align:'center'});

            // ── Points / Division badge (plain rect — roundedRect not in all builds) ──
            sf([248,244,215]); sd(GOLD); doc.setLineWidth(0.5);
            doc.rect(cx-42, 116, 84, 14, 'FD');
            doc.setFontSize(9); doc.setFont('helvetica','bold'); st(NAVY);
            const ptLbl  = currentLang === 'sw' ? 'Pointi'  : 'Points';
            const divLbl = currentLang === 'sw' ? 'Daraja'  : 'Division';
            tx(ptLbl + ': ' + T(student.point) + '     ' + divLbl + ': ' + T(student.division),
               cx, 125, {align:'center'});

            // ── Closing date ────────────────────────────────────────────────
            doc.setFontSize(9); doc.setFont('helvetica','normal'); st([80,80,80]);
            tx((lang.date || 'Date') + ': ' + (closingDate || '—'), cx, 141, {align:'center'});

            // ── Signature row ───────────────────────────────────────────────
            const sigY     = 153;
            const sig1X    = 52;
            const sig2X    = PW - 52;
            const lineHalf = 36;

            // Left — Class Teacher
            doc.setFontSize(8); doc.setFont('helvetica','normal'); st([90,90,90]);
            tx(lang.classTeacher || 'Class Teacher', sig1X, sigY - 4, {align:'center'});
            sd(NAVY); doc.setLineWidth(0.5);
            doc.line(sig1X - lineHalf, sigY, sig1X + lineHalf, sigY);
            doc.setFontSize(9); doc.setFont('helvetica','bold'); st(NAVY);
            if (classTeacher) tx(classTeacher, sig1X, sigY - 1, {align:'center'});
            doc.setFontSize(7.5); doc.setFont('helvetica','normal'); st([70,70,70]);
            tx('(' + T(classTeacher || '________________') + ')', sig1X, sigY + 5, {align:'center'});
            // Date below CT
            doc.setFontSize(7.5); st([90,90,90]);
            tx(lang.date || 'Date', sig1X, sigY + 13, {align:'center'});
            sd(NAVY); doc.setLineWidth(0.3);
            doc.line(sig1X - 22, sigY + 14, sig1X + 22, sigY + 14);
            doc.setFontSize(8); doc.setFont('helvetica','bold'); st(NAVY);
            if (closingDate) tx(closingDate, sig1X, sigY + 13, {align:'center'});

            // Centre — Seal (use ellipse via two arcs? No — just circle)
            sd(GOLD); doc.setLineWidth(1.5); doc.circle(cx, sigY + 5, 13, 'D');
            sd(GOLD); doc.setLineWidth(0.4); doc.circle(cx, sigY + 5, 10, 'D');
            doc.setFontSize(6); doc.setFont('helvetica','bold'); st(GOLD);
            tx(lang.seal || 'OFFICIAL SEAL', cx, sigY + 3, {align:'center'});
            const sealName  = schoolName.split(' ').slice(0, 3).join(' ');
            const sealLines = doc.splitTextToSize(T(sealName), 17);
            sealLines.forEach((ln, i) => tx(ln, cx, sigY + 7 + i * 3.5, {align:'center'}));

            // Right — Head of School
            doc.setFontSize(8); doc.setFont('helvetica','normal'); st([90,90,90]);
            tx(lang.headTeacher || 'Head of School', sig2X, sigY - 4, {align:'center'});
            sd(NAVY); doc.setLineWidth(0.5);
            doc.line(sig2X - lineHalf, sigY, sig2X + lineHalf, sigY);
            doc.setFontSize(9); doc.setFont('helvetica','bold'); st(NAVY);
            if (headmaster) tx(headmaster, sig2X, sigY - 1, {align:'center'});
            doc.setFontSize(7.5); doc.setFont('helvetica','normal'); st([70,70,70]);
            tx('(' + T(headmaster || '________________') + ')', sig2X, sigY + 5, {align:'center'});
            // Date below HT
            doc.setFontSize(7.5); st([90,90,90]);
            tx(lang.date || 'Date', sig2X, sigY + 13, {align:'center'});
            sd(NAVY); doc.setLineWidth(0.3);
            doc.line(sig2X - 22, sigY + 14, sig2X + 22, sigY + 14);
            doc.setFontSize(8); doc.setFont('helvetica','bold'); st(NAVY);
            if (closingDate) tx(closingDate, sig2X, sigY + 13, {align:'center'});

            // ── Navy footer band ────────────────────────────────────────────
            sf(NAVY); doc.rect(0, PH - 15, PW, 15, 'F');
            doc.setFontSize(8); doc.setFont('helvetica','normal'); st(GOLD);
            const footer = schoolName + (schoolIndex ? '  |  ' + schoolIndex : '');
            tx(footer, cx, PH - 6, {align:'center'});

            // ── Deliver ─────────────────────────────────────────────────────
            if (action === 'preview') window.open(doc.output('bloburl'), '_blank');
            else doc.save(filename);

        } catch (err) {
            console.error('[AXP cert PDF]', err);
            _axpToast('Certificate PDF failed: ' + err.message, 'error');
        }
    }

    function _certBtnLoad(id, text) {
        const b=document.getElementById(id); if(!b) return()=>{};
        const orig=b.innerHTML,origD=b.disabled; b.disabled=true;
        b.innerHTML=`<i class="bi bi-hourglass-split" style="animation:axp-spin 1s linear infinite;display:inline-block;"></i> ${text}`; b.style.opacity='0.7';
        return()=>{ b.disabled=origD; b.innerHTML=orig; b.style.opacity=''; };
    }
    document.getElementById('axpCertPreview').onclick = () => {
        const restore = _certBtnLoad('axpCertPreview','Opening…');
        _certCapturePdf(`Certificate_${currentIndex+1}.pdf`, 'preview').then(restore).catch(restore);
    };
    document.getElementById('axpCertDownload').onclick = () => {
        const restore = _certBtnLoad('axpCertDownload','Downloading…');
        _certCapturePdf(`${_sanitize(_schoolIdx())}_Certificate_${_sanitize(allStudents[currentIndex].name)}.pdf`, 'download')
            .then(restore).catch(e=>{ restore(); console.error('[AXP cert]',e); _axpToast('Certificate download failed','error'); });
    };

    document.getElementById('axpCertDownAll').addEventListener('click', async ()=>{
        if (isDownloadingAll) { isDownloadingAll=false; return; }
        isDownloadingAll=true;
        const origIdx=currentIndex;
        const certDownBtn=document.getElementById('axpCertDownAll');
        const origHtml=certDownBtn.innerHTML;
        certDownBtn.disabled=true;
        let downloaded=0;
        const prog = _axpPopup.progress('Downloading Certificates', 'Preparing…');
        try {
            for(let i=0;i<allStudents.length;i++){
                if(!isDownloadingAll) break;
                currentIndex=i; renderCert(currentIndex);
                await new Promise(r=>setTimeout(r,600));
                if(!isDownloadingAll) break;
                prog.update(`Downloading certificate ${downloaded+1} of ${allStudents.length}…`);
                await _certCapturePdf(`${_sanitize(_schoolIdx())}_Certificate_${String(i+1).padStart(4,'0')}.pdf`, 'download');
                downloaded++;
                await new Promise(r=>setTimeout(r,800));
            }
            prog.done(isDownloadingAll ? `Done — Downloaded ${downloaded} certificates` : `Stopped — Downloaded ${downloaded}`);
        } catch(e){
            console.error('[AXP] Cert batch error:',e);
            prog.error('Certificate download failed: ' + e.message);
        } finally{
            isDownloadingAll=false;
            certDownBtn.disabled=false;
            certDownBtn.innerHTML=origHtml;
            currentIndex=origIdx; renderCert(currentIndex);
        }
    });
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: Language strings (shared by Reports + Certificates)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// _axpSchoolInfo(lang)
// Single source of truth for every school name/type string used across
// report cards, headers, certificates and formal documents.
//
// It reads from window.currentSchoolData (server data) first, then falls
// back to DOM inputs.  It detects the school type from the raw name
// (secondary / primary / high / advanced / vocational / nursery) and
// trims the keywords out to leave a clean "place name".
//
// Returns:
//   { rawName, rawIndex, placeName, schoolType,
//     displayName(lang), displayLine1(lang), displayLine2(lang) }
//
//   displayName  — the full formatted name for the school header
//   displayLine1 — "Shule ya Sekondari Newala"  or  "Newala Secondary School"
//   displayLine2 — index number  (e.g. "S.2345")
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2a: Exam-type label translator
// Converts raw server examType strings (e.g. "MIDTERM", "weekly", "Terminal")
// into language-aware display labels for headers, PDFs, and report cards.
// ─────────────────────────────────────────────────────────────────────────────
function _axpExamLabel(examType, lang) {
    const L = (lang === 'sw') ? 'sw' : 'en';
    const t = (examType || '').trim().toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ');
    const MAP = [
        [/\b(terminal|end[\s]?term|end[\s]?of[\s]?term)\b/,  'Terminal Examination',           'Mtihani wa Mwisho wa Muhula'],
        [/\b(mid[\s]?term|midterm)\b/,                         'Mid-Term Examination',           'Mtihani wa Katikati ya Muhula'],
        [/^(final|final[\s]?exam)$/,                             'Final Examination',              'Mtihani wa Mwisho'],
        [/\b(mock|pre[\s]?exam|pre[\s]?necta|prene)\b/,       'Mock Examination',               'Mtihani wa Mazoezi'],
        [/\b(necta|national[\s]?exam|national)\b/,             'National Examination (NECTA)',   'Mtihani wa Taifa (NECTA)'],
        [/\b(annual|yearly|year[\s]?end|end[\s]?of[\s]?year)\b/,'Annual Examination',          'Mtihani wa Mwaka'],
        [/\b(cat|continuous[\s]?assessment|class[\s]?assessment)\b/,'Continuous Assessment Test','Tathmini Endelevu ya Darasani'],
        [/^(class[\s]?test|ct)$/,                                'Class Test',                     'Mtihani wa Darasa'],
        [/\b(opener|opening[\s]?test|opening[\s]?exam|first[\s]?test)\b/,'Opening Test',       'Mtihani wa Kufungua Muhula'],
        [/\b(week(ly)?[\s]?test|weekly)\b/,                   'Weekly Test',                    'Jaribio la Kila Wiki'],
        [/\b(month(ly)?[\s]?test|monthly)\b/,                 'Monthly Test',                   'Jaribio la Kila Mwezi'],
        [/\b(quarter[\s]?term|quarter|robo)\b/,               'Quarter-Term Examination',       'Mtihani wa Robo Muhula'],
        [/\btest\b/,                                            'Examination Test',               'Mtihani wa Majaribio'],
        [/\bexam(ination)?\b/,                                  'Examination',                    'Mtihani'],
    ];
    for (const [re, en, sw] of MAP) { if (re.test(t)) return L==='sw'?sw:en; }
    return (examType||'').replace(/\b\w/g, c => c.toUpperCase());
}

function _axpClassLabel(cls, lang) {
    const L = (lang === 'sw') ? 'sw' : 'en';
    if (!cls) return '';
    const raw = cls.trim().toUpperCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ');
    const ROMAN = {I:'1',II:'2',III:'3',IV:'4',V:'5',VI:'6'};
    const WORD  = {ONE:'1',TWO:'2',THREE:'3',FOUR:'4',FIVE:'5',SIX:'6',SEVEN:'7',
                   KWANZA:'1',PILI:'2',TATU:'3',NNE:'4',TANO:'5',SITA:'6',SABA:'7'};
    let prefix='', num='';
    const mForm = raw.match(/^(?:FORM|F)\s+(.+)$/);
    const mStd  = raw.match(/^(?:STANDARD|STD|S)\s+(.+)$/);
    const mKid  = raw.match(/^KIDATO\s+(?:CHA\s+)?(.+)$/);
    const mDar  = raw.match(/^DARASA\s+(?:LA\s+)?(.+)$/);
    if (mForm||mKid)  { prefix='FORM';     num=((mForm||mKid)[1]).replace(/^(?:CHA|LA)\s+/,'').trim(); }
    else if (mStd||mDar){ prefix='STANDARD'; num=((mStd||mDar)[1]).replace(/^(?:CHA|LA)\s+/,'').trim(); }
    if (prefix) {
        const digit = ROMAN[num]||WORD[num]||(num.match(/^[1-7]$/)?num:null);
        if (digit) {
            const EN_WORD = {'1':'One','2':'Two','3':'Three','4':'Four','5':'Five','6':'Six','7':'Seven'};
            const SW_FORM = {'1':'Kidato cha Kwanza','2':'Kidato cha Pili','3':'Kidato cha Tatu','4':'Kidato cha Nne','5':'Kidato cha Tano','6':'Kidato cha Sita'};
            const SW_STD  = {'1':'Darasa la Kwanza','2':'Darasa la Pili','3':'Darasa la Tatu','4':'Darasa la Nne','5':'Darasa la Tano','6':'Darasa la Sita','7':'Darasa la Saba'};
            if (L==='sw') return prefix==='FORM'?(SW_FORM[digit]||`Kidato cha ${digit}`):(SW_STD[digit]||`Darasa la ${digit}`);
            return prefix==='FORM'?`Form ${EN_WORD[digit]||digit}`:`Standard ${EN_WORD[digit]||digit}`;
        }
    }
    return cls.replace(/\b\w/g, c=>c.toUpperCase());
}

function _axpSchoolInfo(lang) {
    // Priority: _dashboardData (same object renderSettingsSection uses) → currentSchoolData
    const dd  = (typeof _dashboardData !== 'undefined') ? _dashboardData : {};
    const sd  = window.currentSchoolData || {};
    // schoolname / schoolindex match exactly the keys used in renderSettingsSection
    const raw = (dd.schoolname || sd.schoolName || '').trim();
    const idx = (dd.schoolindex || sd.indexNumber || '').trim();

    // ── Type detection patterns ──────────────────────────────────────────────
    // Order matters: technical must be checked before secondary so that
    // "Technical School" doesn't fall through to plain 'secondary'.
    // advanced (A-level/Form 5-6) also checked before secondary.
    const TYPE_PATTERNS = [
        [/\b(technical|tech\b|ufundi)\b/i,                                       'technical'],
        [/\b(advance[d]?|a[\s-]?level|alevel|form[\s-]?5|form[\s-]?6)\b/i,   'advanced'],
        [/\b(sec(?:ondary)?|sec\.)\b/i,                                          'secondary'],
        [/\b(high[\s-]?school|hs\b)/i,                                           'secondary'],
        [/\b(voc(?:ational)?|voc\.)\b/i,                                         'vocational'],
        [/\b(prim(?:ary)?|std|standard|elem(?:entary)?)\b/i,                      'primary'],
        [/\b(nursery|kindergarten|kinder|pre[\s-]?school|pre\.)\b/i,            'nursery'],
    ];

    // ── Keywords to strip from the raw name to get the place name ───────────
    const STRIP = [
        /\b(secondary|sec\.|sec\b|high[\s-]?school|hs\b)/gi,
        /\b(primary|prim\.|prim\b|elementary|elem\.)\b/gi,
        /\b(advanced|advance[d]?|a[\s-]?level|alevel)\b/gi,
        /\b(technical|tech\b|ufundi)\b/gi,
        /\b(vocational|voc\.|voc\b)\b/gi,
        /\b(nursery|kindergarten|kinder|pre[\s-]?school|pre\.)\b/gi,
        /\b(school|shule|skuli|high|centre|center|training)\b/gi,
        /[,;]+$/g,
    ];

    // Detect type
    let schoolType = 'school';  // default generic
    for (const [re, type] of TYPE_PATTERNS) {
        if (re.test(raw)) { schoolType = type; break; }
    }

    // Extract place name by stripping type keywords
    let placeName = raw;
    for (const re of STRIP) placeName = placeName.replace(re, ' ');
    placeName = placeName.replace(/\s{2,}/g, ' ').trim();
    // Title-case
    placeName = placeName.replace(/\b\w/g, c => c.toUpperCase());

    // ── Type label maps ──────────────────────────────────────────────────────
    // advanced = same label as secondary (no "ya Juu") — requested change
    // technical = "Shule ya Sekondari ya Ufundi" in Swahili
    const TYPE_LABEL = {
        en: {
            secondary:  'Secondary School',
            advanced:   'Secondary School',
            technical:  'Technical Secondary School',
            primary:    'Primary School',
            vocational: 'Vocational Training Centre',
            nursery:    'Nursery School',
            school:     'School',
        },
        sw: {
            secondary:  'Shule ya Sekondari',
            advanced:   'Shule ya Sekondari',
            technical:  'Shule ya Sekondari ya Ufundi',
            primary:    'Shule ya Msingi',
            vocational: 'Kituo cha Mafunzo ya Ufundi',
            nursery:    'Shule ya Awali',
            school:     'Shule',
        }
    };

    const L = (lang === 'sw') ? 'sw' : 'en';
    const typeLabel = TYPE_LABEL[L][schoolType] || TYPE_LABEL[L].school;

    // Build display strings
    // English: "Newala Secondary School"
    // Swahili: "Shule ya Sekondari Newala"
    const displayLine1 = L === 'sw'
        ? `${typeLabel} ${placeName}`
        : `${placeName} ${typeLabel}`;

    const displayName = displayLine1.toUpperCase();

    return {
        rawName:      raw,
        rawIndex:     idx,
        placeName,
        schoolType,
        typeLabel,
        displayLine1,
        displayName,     // upper-case full name for headers
        displayLine2:    idx.toUpperCase(),  // index number line
    };
}

function _axpReportLang() {
    return {
        en: {
            governmentHeader:'President\'s Office', localGov:'Regional Administration and Local Government',
            reportTitle:'Student Progress Report', performanceTitle:'Academic Performance',
            examNotice:'This is to notify that student', satFor:'sat for the', at:'at',
            academicStanding:'Below are their academic and behavioral evaluations:',
            subject:'Subject', mark:'Mark', comment:'Comment',
            points:'Total Points', division:'Division', position:'Position', outOf:'Out of',
            behavior:'Behavioral Assessment', aspect:'Aspect', rating:'Rating', remarks:'Remarks:',
            behaviorAspects:{ discipline:'Discipline', cooperation:'Cooperation', learning:'Learning Effort', sports:'Sportsmanship', participation:'Participation', punctuality:'Punctuality', leadership:'Leadership', neatness:'Neatness', respect:'Respect', creativity:'Creativity' },
            classLevels:{ 'FORM ONE':'FORM ONE','FORM TWO':'FORM TWO','FORM THREE':'FORM THREE','FORM FOUR':'FORM FOUR','FORM FIVE':'FORM FIVE','FORM SIX':'FORM SIX','STANDARD ONE':'STANDARD ONE','STANDARD TWO':'STANDARD TWO','STANDARD THREE':'STANDARD THREE','STANDARD FOUR':'STANDARD FOUR','STANDARD FIVE':'STANDARD FIVE','STANDARD SIX':'STANDARD SIX','STANDARD SEVEN':'STANDARD SEVEN' },
            termDates:'Term Dates', closes:'The term closed on', reopens:'and reopens on',
            requirements:'Requirements for Next Term', classComment:'Class Teacher\'s Comment',
            headComment:'Head of School\'s Comment', signature:'Signature', date:'Date',
            noDataHeader:'Student Not Found', noDataText:'No record was found for {name} in the eligible list.',
            noDataReason:'This may be due to a name mismatch or missing exam data.',
            comments:{ A:'Excellent', B:'Very Good', C:'Good', D:'Satisfactory', F:'Fail' },
            remarksList:{ outstanding:'Outstanding academic achievement and behavior.', commendable:'Commendable effort with good results.', satisfactory:'Satisfactory performance. Keep it up.', followup:'Needs academic and behavioral support.' },
            headSupportNote:'Continued parental support is recommended.',
            classCommentIntro: name=>`${name} has shown`,
            performanceLevels:{ strong:'strong', moderate:'moderate', weak:'weak' },
            academicPerformance:'academic performance', thisTerm:'this term.',
            encouragement:{ encouraged:'Improvement is encouraged.', necessary:'Improvement is necessary.' },
            overall:'Overall Remark',
            reportDescription: (name, examLabel, cls, year, div, pts, pos, tot) =>
                `This report certifies the academic performance of <strong>${name}</strong> who sat for the <strong>${examLabel}</strong> examination in <strong>${cls}</strong> during the academic year <strong>${year}</strong>. ` +
                `The student scored a total of <strong>${pts} points</strong>, attaining <strong>Division ${div}</strong>${pos?`, and was ranked <strong>${pos} out of ${tot}</strong> in class`:''}. ` +
                `Division I (7–17 pts) is Excellent, Division II (18–21) is Good, Division III (22–25) is Average, Division IV (26–33) is Poor, and Division 0 (34–35) is Fail. ` +
                `The academic results and behavioral assessments below reflect the student's overall progress this term. ` +
                `Parents and guardians are encouraged to review this report with the student and provide the necessary support for continued improvement.`
        },
        sw: {
            governmentHeader:'Ofisi ya Rais', localGov:'Tawala za Mikoa na Serikali za Mitaa',
            reportTitle:'Ripoti ya Maendeleo ya Mwanafunzi', performanceTitle:'Utendaji wa Kitaaluma',
            examNotice:'Hii ni kuthibitisha kuwa mwanafunzi', satFor:'alifanya mtihani wa', at:'katika',
            academicStanding:'Chini ni tathmini ya kitaaluma na tabia:',
            subject:'Somo', mark:'Alama', comment:'Maoni',
            points:'Jumla ya Alama', division:'Daraja', position:'Nafasi', outOf:'Kati ya',
            behavior:'Tathmini ya Tabia', aspect:'Kipengele', rating:'Daraja', remarks:'Maoni:',
            behaviorAspects:{ discipline:'Nidhamu', cooperation:'Ushirikiano', learning:'Bidii ya Kujifunza', sports:'Michezo', participation:'Ushiriki', punctuality:'Utimilifu wa Muda', leadership:'Uongozi', neatness:'Usafi', respect:'Heshima', creativity:'Ubunifu' },
            classLevels:{ 'FORM ONE':'KIDATO CHA KWANZA','FORM TWO':'KIDATO CHA PILI','FORM THREE':'KIDATO CHA TATU','FORM FOUR':'KIDATO CHA NNE','FORM FIVE':'KIDATO CHA TANO','FORM SIX':'KIDATO CHA SITA','STANDARD ONE':'DARASA LA KWANZA','STANDARD TWO':'DARASA LA PILI','STANDARD THREE':'DARASA LA TATU','STANDARD FOUR':'DARASA LA NNE','STANDARD FIVE':'DARASA LA TANO','STANDARD SIX':'DARASA LA SITA','STANDARD SEVEN':'DARASA LA SABA' },
            termDates:'Tarehe za Muhula', closes:'Muhula umefungwa tarehe', reopens:'na utafunguliwa tena tarehe',
            requirements:'Vitu vya Kuleta Muhula Ujao', classComment:'Maoni ya Mwalimu wa Darasa',
            headComment:'Maoni ya Mkuu wa Shule', signature:'Sahihi', date:'Tarehe',
            noDataHeader:'Mwanafunzi Hajapatikana', noDataText:'Hakuna rekodi iliyopatikana kwa {name} kwenye orodha ya waliohitimu.',
            noDataReason:'Hii inaweza kuwa kutokana na jina kutolingana au data ya mtihani kupotea.',
            comments:{ A:'Bora Sana', B:'Nzuri Sana', C:'Nzuri', D:'Inaridhisha', F:'Feli' },
            remarksList:{ outstanding:'Ufanisi wa hali ya juu katika masomo na tabia.', commendable:'Juhudi nzuri zenye matokeo mazuri.', satisfactory:'Utendaji wa kuridhisha. Endelea hivyo.', followup:'Anahitaji msaada wa kitaaluma na kitabia.' },
            headSupportNote:'Inashauriwa kuendelea kushirikiana na wazazi.',
            classCommentIntro: name=>`${name} ameonyesha`,
            performanceLevels:{ strong:'utendaji mzuri', moderate:'utendaji wa wastani', weak:'utendaji hafifu' },
            academicPerformance:'Matokeo ya kitaaluma', thisTerm:'kwa muhula huu.',
            encouragement:{ encouraged:'Anahimizwa kuendelea kujitahidi.', necessary:'Ni muhimu kuboresha juhudi zake.' },
            overall:'Maoni ya Jumla',
            reportDescription: (name, examLabel, cls, year, div, pts, pos, tot) =>
                `Ripoti hii inathibitisha utendaji wa kitaaluma wa <strong>${name}</strong> aliyefanya mtihani wa <strong>${examLabel}</strong> katika <strong>${cls}</strong> mwaka wa masomo <strong>${year}</strong>. ` +
                `Mwanafunzi alipata jumla ya pointi <strong>${pts}</strong>, akipata <strong>Daraja ${div}</strong>${pos?`, na alikuwa wa <strong>${pos} kati ya ${tot}</strong> darasani`:''}. ` +
                `Daraja I (pointi 7–17) ni Bora Sana, Daraja II (18–21) ni Nzuri, Daraja III (22–25) ni Ya Kati, Daraja IV (26–33) ni Hafifu, Daraja 0 (34–35) ni Kushindwa. ` +
                `Matokeo ya kitaaluma na tathmini ya tabia zilizo chini zinaonyesha maendeleo ya mwanafunzi kwa muhula huu. ` +
                `Wazazi na walezi wanashauriwa kupitia ripoti hii pamoja na mwanafunzi na kutoa msaada unaohitajika kwa maendeleo zaidi.`
        }
    };
}



// Aliases — so File 1's navigateToSection() calls work without any changes
function renderAnalyticsSection(containerEl)      { renderResultsReportsSection(containerEl); }
function axpLoadAnalytics()                        { renderResultsReportsSection(); }
function axpLoadStudentsReport()                   { renderStudentsReportSection(); }

window._axpRRCache = {};   




function _axpExtractMark(scoreObj) {
  if (scoreObj === undefined || scoreObj === null) return undefined;
  if (typeof scoreObj === "object") return scoreObj.mark;
  return scoreObj;
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
