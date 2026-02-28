const scriptURL = 'https://script.google.com/macros/s/AKfycbyd7fw27mrfmrxqUvj-HPcdvYpGg7O2WOAJ-zivKNCsoDkBYBOmpZgk8UNVOdFbizBo/exec';

/* ─── New global vars for school management ─────────────────── */
let _appScriptSchoolId = null;
let _schoolMeta        = null;

document.addEventListener("DOMContentLoaded", () => {
  applyLandingStyles();
  bindNavPopups();
  bindAuthLinks();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (isLoggedIn) {
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
      No account?&nbsp;<a href="#" onclick="toggleForms('sp-form');return false;">Register here</a>
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
    /* ── School Management section styles ── */
    .axp-section-card {
      background: #fff; border-radius: 6px; padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07); margin-bottom: 20px;
    }
    .axp-section-title {
      font-size: 17px; font-weight: 700; color: #1a1a2e;
      margin: 0 0 18px; padding-bottom: 12px;
      border-bottom: 2px solid #4ecca3; display: flex; align-items: center; gap: 10px;
    }
    .axp-section-title i { color: #4ecca3; font-size: 20px; }
    .axp-form-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;
    }
    .axp-form-row.single { grid-template-columns: 1fr; }
    .axp-form-row.triple { grid-template-columns: 1fr 1fr 1fr; }
    @media(max-width:640px) { .axp-form-row, .axp-form-row.triple { grid-template-columns: 1fr; } }
    .axp-field-group { display: flex; flex-direction: column; gap: 5px; }
    .axp-field-group label { font-size: 11px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
    .axp-input {
      border: 1.5px solid #e0e0e0; border-radius: 4px; padding: 9px 12px;
      font-size: 13.5px; color: #1e293b; outline: none;
      transition: border-color 0.2s; width: 100%; box-sizing: border-box;
    }
    .axp-input:focus { border-color: #4ecca3; }
    .axp-select {
      border: 1.5px solid #e0e0e0; border-radius: 4px; padding: 9px 12px;
      font-size: 13.5px; color: #1e293b; outline: none; background: #fff;
      transition: border-color 0.2s; width: 100%; box-sizing: border-box; cursor: pointer;
    }
    .axp-select:focus { border-color: #4ecca3; }
    .axp-textarea {
      border: 1.5px solid #e0e0e0; border-radius: 4px; padding: 9px 12px;
      font-size: 13px; color: #1e293b; outline: none; resize: vertical;
      transition: border-color 0.2s; width: 100%; box-sizing: border-box;
      font-family: inherit; min-height: 120px;
    }
    .axp-textarea:focus { border-color: #4ecca3; }
    .axp-btn-primary {
      background: #4ecca3; color: #060c1c; border: none; border-radius: 4px;
      padding: 10px 22px; font-size: 13.5px; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 7px; transition: opacity 0.2s;
    }
    .axp-btn-primary:hover { opacity: 0.88; }
    .axp-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
    .axp-btn-secondary {
      background: #f1f5f9; color: #334155; border: 1.5px solid #cbd5e1;
      border-radius: 4px; padding: 9px 18px; font-size: 13px; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;
    }
    .axp-btn-secondary:hover { background: #e2e8f0; border-color: #94a3b8; }
    .axp-btn-danger {
      background: #fff0f0; color: #dc3545; border: 1.5px solid #fca5a5;
      border-radius: 4px; padding: 7px 14px; font-size: 12px; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s;
    }
    .axp-btn-danger:hover { background: #fee2e2; }
    .axp-tag {
      display: inline-flex; align-items: center; gap: 5px;
      background: #e8faf4; color: #065f46; border: 1px solid #a7f3d0;
      border-radius: 20px; padding: 4px 10px; font-size: 12px; font-weight: 600;
    }
    .axp-tag .remove-tag {
      cursor: pointer; color: #6b7280; font-size: 14px; line-height: 1;
      background: none; border: none; padding: 0; margin-left: 2px;
    }
    .axp-tag .remove-tag:hover { color: #dc3545; }
    .axp-tags-container { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; min-height: 32px; }
    .axp-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .axp-table th { background: #f8fafc; padding: 11px 14px; text-align: left; font-weight: 600; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 2px solid #e2e8f0; }
    .axp-table td { padding: 11px 14px; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .axp-table tr:last-child td { border-bottom: none; }
    .axp-table tr:hover td { background: #fafafa; }
    .axp-badge { padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600; }
    .axp-badge-green  { background: #ecfdf5; color: #065f46; }
    .axp-badge-yellow { background: #fffbeb; color: #92400e; }
    .axp-badge-red    { background: #fef2f2; color: #991b1b; }
    .axp-badge-blue   { background: #eff6ff; color: #1e40af; }
    .axp-badge-gray   { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
    .axp-progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; min-width: 80px; }
    .axp-progress-fill { height: 100%; background: linear-gradient(90deg,#4ecca3,#2ecc71); transition: width 0.5s ease; border-radius: 4px; }
    .axp-empty-state { padding: 40px 20px; text-align: center; color: #94a3b8; }
    .axp-empty-state i { font-size: 42px; display: block; margin-bottom: 10px; opacity: 0.4; }
    .axp-empty-state p { margin: 0; font-size: 14px; }
    .axp-alert { padding: 12px 16px; border-radius: 4px; font-size: 13.5px; margin-bottom: 14px; display: flex; align-items: flex-start; gap: 10px; }
    .axp-alert-info    { background: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af; }
    .axp-alert-success { background: #ecfdf5; border-left: 4px solid #10b981; color: #065f46; }
    .axp-alert-warning { background: #fffbeb; border-left: 4px solid #f59e0b; color: #92400e; }
    .axp-alert-danger  { background: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b; }
    .axp-divider-line { height: 1px; background: #e2e8f0; margin: 20px 0; }
    .axp-spinner-sm {
      display: inline-block; width: 18px; height: 18px;
      border: 3px solid #e2e8f0; border-top-color: #4ecca3;
      border-radius: 50%; animation: axpSpin 0.8s linear infinite;
    }
    @keyframes axpSpin { to { transform: rotate(360deg); } }
    /* Teacher card */
    .teacher-card {
      border: 1.5px solid #e2e8f0; border-radius: 6px; padding: 16px;
      margin-bottom: 12px; background: #fafafa; transition: border-color 0.2s;
    }
    .teacher-card:hover { border-color: #4ecca3; }
    .teacher-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .teacher-card-name { font-weight: 700; font-size: 14.5px; color: #1e293b; }
    .teacher-card-email { font-size: 12.5px; color: #64748b; margin-top: 2px; }
    .teacher-card-assignments { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    /* Subject checklist grid */
    .subject-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 8px; }
    .subject-check-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1.5px solid #e2e8f0; border-radius: 4px; cursor: pointer; transition: all 0.15s; font-size: 13px; }
    .subject-check-item:hover { border-color: #4ecca3; background: #f0fdf9; }
    .subject-check-item input[type=checkbox] { accent-color: #4ecca3; width: 15px; height: 15px; cursor: pointer; }
    .subject-check-item.checked { border-color: #4ecca3; background: #f0fdf9; }
    /* Progress section */
    .progress-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 16px; }
    .progress-card { border: 1.5px solid #e2e8f0; border-radius: 6px; padding: 16px; background: #fff; }
    .progress-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .progress-card-title { font-weight: 700; font-size: 13.5px; color: #1e293b; }
    .progress-subject-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 13px; }
    .progress-subject-name { flex: 1; color: #475569; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .progress-subject-count { font-size: 11.5px; color: #94a3b8; white-space: nowrap; }
    /* student table */
    .student-entry-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; margin-bottom: 6px; }
    .student-entry-row input { padding: 7px 10px; border: 1.5px solid #e2e8f0; border-radius: 4px; font-size: 13px; outline: none; }
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
  if (registerButton) registerButton.addEventListener("click", e => { e.preventDefault(); popup.style.display="none"; overlay.style.display="none"; showFormPage("sp-form"); });
}

function bindAuthLinks() {
  const registerLink = document.getElementById("registerLink");
  const loginLink    = document.getElementById("loginLink");
  if (registerLink) registerLink.addEventListener("click", e => { e.preventDefault(); showFormPage("sp-form"); });
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

  _setupShareLink(data.schoolindex);
  _renderOperatorMessage(_operatorMessage);
  displayAnnouncements({ announcements: _announcements });

  /* Load school setup from local cache */
  setTimeout(() => {
    _loadSchoolSetupStatus();
    /* Auto-prompt setup popup if ACTIVE and no school yet */
    if (!localStorage.getItem(_getSchoolStorageKey()) && _dashboardData.status === "ACTIVE") {
      setTimeout(() => axpOpenSetupPopup(), 1200);
    }
  }, 300);
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
    PENDING         : { bg:"#fffbeb", border:"#f59e0b", color:"#92400e", icon:"bi-hourglass-split",          label:"Pending Activation — please pay the activation fee" },
    INACTIVE        : { bg:"#fdf2f8", border:"#db2777", color:"#831843", icon:"bi-slash-circle-fill",        label:"Account Inactive — contact support" },
    SUSPENDED       : { bg:"#fef2f2", border:"#ef4444", color:"#991b1b", icon:"bi-ban",                      label:"Account Suspended — contact support immediately" },
    DORMANT         : { bg:"#faf5ff", border:"#a855f7", color:"#581c87", icon:"bi-moon-fill",                label:"Account Dormant" },
    WARNING         : { bg:"#fff7ed", border:"#f97316", color:"#9a3412", icon:"bi-exclamation-triangle-fill",label:"Warning on Account — contact support" },
    AWAITING_DELETE : { bg:"#fafaf9", border:"#78716c", color:"#44403c", icon:"bi-trash3-fill",              label:"Account Deletion Requested — pending operator review" }
  }[status] || { bg:"#fffbeb", border:"#f59e0b", color:"#92400e", icon:"bi-hourglass-split", label: status || "Unknown" };

  let extraInfo = "";
  if (balance !== undefined && balance !== "") extraInfo += `<span style="font-size:13px;opacity:0.85;display:flex;align-items:center;gap:5px;"><i class="bi bi-wallet2"></i> TZS ${Number(balance).toLocaleString()}</span>`;
  if (lastPaymentDate) extraInfo += `<span style="font-size:12px;opacity:0.7;display:flex;align-items:center;gap:5px;"><i class="bi bi-calendar-check"></i> ${lastPaymentDate}</span>`;

  const banner = document.createElement("div");
  banner.id = "statusBanner";
  banner.style.cssText = `background:${cfg.bg};border-left:4px solid ${cfg.border};color:${cfg.color};padding:13px 18px;border-radius:4px;margin:15px 0;font-size:13.5px;font-weight:500;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;`;
  banner.innerHTML = `
    <span style="display:flex;align-items:center;gap:8px;"><i class="bi ${cfg.icon}" style="font-size:15px;"></i>${cfg.label}</span>
    <span style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">${extraInfo}</span>`;
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
  section.style.cssText = "background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:4px;padding:20px;margin:20px 0;box-shadow:0 4px 15px rgba(102,126,234,0.3);color:white;";
  section.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <i class="bi bi-chat-left-text-fill" style="font-size:19px;color:#ffd700;"></i>
      <h3 style="margin:0;font-size:15.5px;font-weight:600;">Message from AcademixPoint</h3>
    </div>
    <div style="background:rgba(255,255,255,0.12);border-radius:4px;padding:14px;white-space:pre-wrap;line-height:1.6;font-size:13.5px;">
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
  section.style.cssText = "background:#fff;border-radius:4px;padding:20px;margin:20px 0;box-shadow:0 2px 12px rgba(0,0,0,0.07);";
  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #f0f0f0;";
  header.innerHTML = `
    <i class="bi bi-megaphone-fill" style="font-size:19px;color:#4ecca3;"></i>
    <h3 style="margin:0;font-size:15.5px;font-weight:600;color:#1e293b;">Announcements</h3>
    <span style="margin-left:auto;background:#4ecca3;color:white;padding:3px 10px;border-radius:3px;font-size:12px;font-weight:600;">${announcements.length} Active</span>`;
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

  /* Initialize the DynamicPageLoader for data-load-page links */
  if (!window.axpPageLoader) {
    window.axpPageLoader = new AxpDynamicPageLoader();
  }
}

/* ─────────────────────────────────────────────────────────────
   SETUP DASHBOARD INTERACTIONS
   (Modified to support section navigation + DynamicPageLoader)
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
      ["isLoggedIn","axpUsername","axpPassword"].forEach(k => localStorage.removeItem(k));
      location.reload();
    });
  }

  /* ── Menu item navigation (modified for inline sections) ── */
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach(item => {
    item.addEventListener("click", function(e) {
      const section = this.getAttribute("data-section") || this.getAttribute("data-load-page");

      if (section) {
        e.preventDefault();
        menuItems.forEach(mi => mi.classList.remove("active"));
        this.classList.add("active");
        /* If a data-load-page item is clicked, treat "demo" as fallback */
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
      .axp-so-btn{background:#4ecca3;color:#060c1c;border:none;border-radius:4px;padding:12px 32px;font-size:14px;font-weight:700;letter-spacing:0.4px;cursor:pointer;display:flex;align-items:center;gap:8px;animation:axpSoTextIn 0.4s ease 1.15s both}
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
    .notification-popup{position:fixed;top:70px;right:20px;background:white;border-radius:4px;box-shadow:0 8px 28px rgba(0,0,0,0.14);z-index:100000;max-width:420px;width:calc(100% - 40px);max-height:calc(100vh - 100px);overflow:hidden;display:flex;flex-direction:column;animation:axpPopIn 0.25s cubic-bezier(0.22,1,0.36,1)}
    @keyframes axpPopIn{from{opacity:0;transform:translateY(-6px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
    .popup-header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #e9ecef;background:#f8f9fa}
    .popup-header h4{margin:0;font-size:15.5px;font-weight:600;color:#1e293b;display:flex;align-items:center;gap:10px}
    .popup-header h4 i{color:#4ecca3;font-size:17px}
    .popup-close{background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:3px}
    .popup-body{overflow-y:auto;max-height:calc(100vh - 175px)}
    .popup-item{display:flex;gap:13px;padding:13px 20px;border-bottom:1px solid #f0f0f0;cursor:pointer}
    .popup-item:last-child{border-bottom:none}
    .popup-item-icon{width:36px;height:36px;min-width:36px;border-radius:3px;background:#e3f2fd;display:flex;align-items:center;justify-content:center;color:#2088bd;font-size:15px}
    .popup-item-icon.message-icon{background:#e8f5e9;color:#28a745}
    .popup-item-content{flex:1;min-width:0}
    .popup-item-content p{margin:0 0 4px;font-size:13.5px;color:#334155;line-height:1.5;word-wrap:break-word}
    .popup-item-time{font-size:11.5px;color:#94a3b8}
    .popup-empty{padding:36px 20px;text-align:center;color:#94a3b8}
    .popup-empty i{font-size:40px;margin-bottom:10px;opacity:0.4;display:block}
    .popup-empty p{margin:0;font-size:13px}
    @media(max-width:768px){.notification-popup{top:60px;right:10px;left:10px;width:calc(100% - 20px)}}`;
  document.head.appendChild(style);
}


/* ══════════════════════════════════════════════════════════════
   ██████████  NEW ADDITIONS  ██████████
   All school management, section rendering, and page loader
   functionality added below. Nothing above is removed/changed.
══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   API HELPERS
───────────────────────────────────────────────────────────── */
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
   SCHOOL SETUP STATUS — reads / writes localStorage
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
  if (_appScriptSchoolId) { _unlockSidebarButtons(); return; }
  if (!_dashboardData || _dashboardData.status !== "ACTIVE") return;

  _lockSidebarButtons();

  const dc = document.querySelector(".dashboard-content");
  if (!dc) return;
  const notice = document.createElement("div");
  notice.id = "axp-setup-notice";
  notice.className = "axp-alert axp-alert-warning";
  notice.style.cssText = "margin-bottom:20px;border-radius:6px;cursor:pointer;transition:opacity .2s;";
  notice.innerHTML = `
    <i class="bi bi-exclamation-triangle-fill" style="font-size:18px;flex-shrink:0;"></i>
    <div>
      <strong>School not yet set up in the results system.</strong>
      Click here or the <em>Setup</em> button in the sidebar to configure your school — this unlocks all features.
    </div>
    <button onclick="axpOpenSetupPopup()" style="margin-left:auto;white-space:nowrap;background:#4ecca3;color:#060c1c;border:none;border-radius:4px;padding:7px 16px;font-weight:700;font-size:12px;cursor:pointer;flex-shrink:0;">
      <i class="bi bi-gear-fill"></i> Setup Now
    </button>`;
  notice.addEventListener("click", e => { if (!e.target.closest("button")) axpOpenSetupPopup(); });
  dc.insertBefore(notice, dc.firstChild);
}

/* Lock sidebar buttons that need school to be set up */
function _lockSidebarButtons() {
  ["assign-tasks","push-names","task-progress"].forEach(sec => {
    const btn = document.querySelector(`.menu-item[data-section="${sec}"]`);
    if (!btn) return;
    btn.style.opacity = "0.45";
    btn.style.pointerEvents = "none";
    btn.title = "Complete school setup to unlock";
    /* Add lock badge if not already there */
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
   SCHOOL SETUP POPUP MODAL
   Opens right after login if ACTIVE + no schoolId
───────────────────────────────────────────────────────────── */
window.axpOpenSetupPopup = function() {
  if (document.getElementById("axpSetupPopupOverlay")) return;

  const presetExamTypes = ["WEEKLY","MONTHLY","MIDTERM","MIDTERM2","TERMINAL","JOINT","ANNUAL","PREMOCK","MOCK","PRENECTA","PRENECTA2"];

  const overlay = document.createElement("div");
  overlay.id = "axpSetupPopupOverlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(6,12,28,0.82);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px);";

  overlay.innerHTML = `
    <div id="axpSetupPopupBox" style="background:#fff;border-radius:12px;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,0.4);animation:axpPopIn .3s cubic-bezier(.22,1,.36,1);">
      <style>@keyframes axpPopIn{from{opacity:0;transform:scale(.92) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}</style>

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#060c1c,#0f2248);padding:22px 26px;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:40px;height:40px;background:rgba(78,204,163,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;">
              <i class="bi bi-building-gear" style="font-size:20px;color:#4ecca3;"></i>
            </div>
            <div>
              <div style="font-size:16px;font-weight:800;color:#fff;letter-spacing:.5px;">School Setup</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.45);">Configure your school in the results system once</div>
            </div>
          </div>
        </div>
        <button onclick="document.getElementById('axpSetupPopupOverlay').remove()" style="background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.6);width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button>
      </div>

      <!-- Steps progress bar -->
      <div style="padding:18px 26px 0;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:20px;">
          ${["Year & Type","Classes","Exam Types","Subjects","Confirm"].map((s,i)=>`
            <div style="display:flex;align-items:center;gap:6px;flex:1;">
              <div class="axp-setup-step-dot" data-step="${i}" style="width:28px;height:28px;min-width:28px;border-radius:50%;background:${i===0?'#4ecca3':'#e2e8f0'};color:${i===0?'#060c1c':'#94a3b8'};font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;transition:all .25s;">${i+1}</div>
              <span style="font-size:10.5px;color:#94a3b8;white-space:nowrap;display:none;" class="step-label-${i}">${s}</span>
              ${i<4?'<div class="axp-setup-step-line" data-after="'+i+'" style="height:2px;flex:1;background:#e2e8f0;border-radius:2px;transition:background .25s;"></div>':''}
            </div>`).join("")}
        </div>
      </div>

      <!-- Step panels -->
      <div style="padding:0 26px 26px;">

        <!-- Step 0: Year & Type -->
        <div class="axp-setup-panel" data-panel="0">
          <p style="font-size:13.5px;color:#475569;margin:0 0 18px;line-height:1.6;">Enter the academic year and select your school level. This creates the spreadsheet structure for your exam data.</p>
          <div class="axp-form-row">
            <div class="axp-field-group">
              <label>Academic Year</label>
              <input id="axpPopYear" class="axp-input" placeholder="e.g. 2026" maxlength="4" style="font-size:22px;font-weight:700;text-align:center;letter-spacing:4px;" />
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
          <p style="font-size:13.5px;color:#475569;margin:0 0 14px;line-height:1.6;">Add each class or stream in your school. Press <kbd style="background:#f1f5f9;padding:2px 6px;border-radius:3px;font-size:12px;">Enter</kbd> or click Add after each one.</p>
          <div style="display:flex;gap:8px;margin-bottom:10px;">
            <input id="axpPopClassInput" class="axp-input" placeholder="e.g. Form I, Form II, S1A…" style="flex:1;" />
            <button onclick="axpPopAddClass()" class="axp-btn-secondary"><i class="bi bi-plus"></i> Add</button>
          </div>
          <!-- Quick add buttons -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
            ${["Form I","Form II","Form III","Form IV","Form V","Form VI"].map(c=>`
              <button onclick="axpPopQuickClass('${c}')" style="font-size:11px;padding:5px 10px;background:#f0fdf9;color:#065f46;border:1.5px solid #4ecca3;border-radius:20px;cursor:pointer;">${c}</button>`).join("")}
          </div>
          <div id="axpPopClassTags" class="axp-tags-container"></div>
        </div>

        <!-- Step 2: Exam Types -->
        <div class="axp-setup-panel" data-panel="2" style="display:none;">
          <p style="font-size:13.5px;color:#475569;margin:0 0 14px;line-height:1.6;">Select the examination types used in your school.</p>
          <div class="subject-grid" id="axpPopExamGrid">
            ${presetExamTypes.map(et=>`
              <label class="subject-check-item" id="axpPopEt_${et}">
                <input type="checkbox" value="${et}" onchange="axpPopToggleExamType('${et}',this.checked)" />
                ${et}
              </label>`).join("")}
          </div>
          <div id="axpPopSelectedExamTypes" class="axp-tags-container" style="margin-top:10px;"></div>
        </div>

        <!-- Step 3: Subjects per Class -->
        <div class="axp-setup-panel" data-panel="3" style="display:none;">
          <p style="font-size:13.5px;color:#475569;margin:0 0 14px;line-height:1.6;">Select subjects for each class. Use the tabs to switch between classes.</p>
          <div id="axpPopSubjectsTabs" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;"></div>
          <div id="axpPopSubjectsContent"></div>
        </div>

        <!-- Step 4: Confirm -->
        <div class="axp-setup-panel" data-panel="4" style="display:none;">
          <div style="background:#f0fdf9;border:1.5px solid #4ecca3;border-radius:8px;padding:18px;margin-bottom:16px;">
            <div style="font-size:14px;font-weight:700;color:#065f46;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
              <i class="bi bi-check-circle-fill"></i> Ready to Create
            </div>
            <div id="axpPopConfirmSummary" style="font-size:13px;color:#374151;line-height:1.8;"></div>
          </div>
          <div class="axp-alert axp-alert-warning" style="border-radius:6px;">
            <i class="bi bi-info-circle-fill"></i>
            <span>This will create spreadsheet tabs for each class and exam type. You can always add more classes later but this forms the base structure.</span>
          </div>
          <div id="axpSetupPopupMsg" style="margin-top:12px;"></div>
        </div>

        <!-- Navigation buttons -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:22px;padding-top:16px;border-top:1px solid #e2e8f0;">
          <button id="axpPopPrevBtn" onclick="axpPopStep(-1)" class="axp-btn-secondary" style="display:none;"><i class="bi bi-chevron-left"></i> Back</button>
          <div style="margin-left:auto;display:flex;gap:10px;">
            <button id="axpPopNextBtn" onclick="axpPopStep(1)" class="axp-btn-primary"><i class="bi bi-chevron-right"></i> Next</button>
            <button id="axpPopSubmitBtn" onclick="axpPopSubmitSchool()" class="axp-btn-primary" style="display:none;"><i class="bi bi-rocket"></i> Create My School</button>
          </div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  /* Init popup state */
  window._axpPopStep       = 0;
  window._axpPopClasses    = [];
  window._axpPopExamTypes  = [];
  window._axpPopSubjects   = {};
  window._axpPopActiveTab  = null;

  /* Enter key on class input */
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

  /* Update step dots */
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
  /* Validate before going forward */
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
      style="padding:7px 16px;border-radius:4px;border:1.5px solid ${c===window._axpPopActiveTab?'#4ecca3':'#e2e8f0'};background:${c===window._axpPopActiveTab?'#f0fdf9':'#fff'};color:${c===window._axpPopActiveTab?'#065f46':'#334155'};font-weight:600;font-size:13px;cursor:pointer;transition:all .15s;">
      ${escapeHtml(c)}
    </button>`).join("");

  const active   = window._axpPopActiveTab;
  const selected = active ? (window._axpPopSubjects[active] || []) : [];

  content.innerHTML = active ? `
    <p style="font-size:13px;color:#64748b;margin:0 0 10px;">Subjects for <strong>${escapeHtml(active)}</strong>:</p>
    <div class="subject-grid">
      ${_presetSubjectsList_popup.map(s => `
        <label class="subject-check-item ${selected.includes(s) ? "checked" : ""}">
          <input type="checkbox" value="${s}" ${selected.includes(s) ? "checked" : ""}
            onchange="axpPopToggleSubject('${active.replace(/'/g,"\\'")}','${s}',this.checked)" />
          ${s}
        </label>`).join("")}
    </div>
    <div style="display:flex;gap:8px;margin-top:10px;">
      <button onclick="axpPopSelectAllSubjects('${active.replace(/'/g,"\\'")}' )" class="axp-btn-secondary" style="font-size:12px;padding:6px 12px;">Select All</button>
      <button onclick="axpPopClearSubjects('${active.replace(/'/g,"\\'")}' )" class="axp-btn-secondary" style="font-size:12px;padding:6px 12px;">Clear All</button>
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
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">
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

  /* Animated progress bar during creation */
  const msgEl = document.getElementById("axpSetupPopupMsg");
  if (msgEl) {
    msgEl.innerHTML = `
      <div style="background:#f8fafc;border-radius:6px;padding:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:13px;font-weight:600;color:#374151;" id="axpPopProgressLabel">Preparing structure...</span>
          <span style="font-size:14px;font-weight:800;color:#4ecca3;" id="axpPopProgressPct">0%</span>
        </div>
        <div class="axp-progress-bar" style="height:10px;">
          <div class="axp-progress-fill" id="axpPopProgressFill" style="width:0%;transition:width .4s ease;"></div>
        </div>
      </div>`;
  }

  /* Animate progress while waiting */
  let fakeP = 0;
  const labels = ["Validating data...","Creating spreadsheet tabs...","Setting up exam sheets...","Saving school record...","Almost done..."];
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
      /* Complete bar */
      ["axpPopProgressFill","axpPopProgressPct","axpPopProgressLabel"].forEach((id, i) => {
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
        /* Refresh dashboard notice */
        _updateSetupNotice();
        /* Show success toast */
        _axpToast("School configured! All features are now unlocked.", "success");
      }, 1200);
    } else {
      clearInterval(ticker);
      const fill2 = document.getElementById("axpPopProgressFill");
      if (fill2) { fill2.style.width="100%"; fill2.style.background="#ef4444"; }
      if (msgEl) {
        const prevContent = msgEl.innerHTML;
        msgEl.innerHTML = prevContent + `<div class="axp-alert axp-alert-danger" style="border-radius:4px;margin-top:10px;"><i class="bi bi-x-circle-fill"></i><span>${escapeHtml(res.message||"Failed. Please try again.")}</span></div>`;
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-rocket"></i> Retry';
    }
  } catch(err) {
    clearInterval(ticker);
    if (msgEl) msgEl.innerHTML += `<div class="axp-alert axp-alert-danger" style="border-radius:4px;margin-top:10px;"><i class="bi bi-x-circle-fill"></i><span>Network error. Please check your connection.</span></div>`;
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-rocket"></i> Retry';
  }
};

/* Toast notification helper */
function _axpToast(message, type="info") {
  const colors = { success:"#10b981", danger:"#ef4444", warning:"#f59e0b", info:"#4ecca3" };
  const toast  = document.createElement("div");
  toast.style.cssText = `position:fixed;bottom:28px;right:24px;background:#1a1a2e;color:#fff;padding:14px 20px;border-radius:8px;border-left:4px solid ${colors[type]||colors.info};box-shadow:0 8px 24px rgba(0,0,0,.35);z-index:9999999;font-size:14px;font-weight:500;max-width:340px;line-height:1.5;animation:axpToastIn .3s ease;`;
  toast.innerHTML = `<style>@keyframes axpToastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}</style>${escapeHtml(message)}`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.transition="opacity .4s"; toast.style.opacity="0"; setTimeout(()=>toast.remove(),400); }, 4000);
}

function _updateStatCards() {
  if (!_schoolMeta) return;
  const centresEl = document.querySelector(".stat-card.blue .stat-info h3");
  if (centresEl) centresEl.textContent = "1";
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
  sectionWrap.scrollTop = 0;
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
    sw.style.cssText = "padding:30px;display:none;";
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
   Includes sub-section for Setup School (first time)
───────────────────────────────────────────────────────────── */
function renderAssignTeachersSection() {
  const sw = document.getElementById("axpSectionWrapper");

  /* If school not set up yet, show locked prompt */
  if (!_appScriptSchoolId) {
    sw.innerHTML = `
      <div class="axp-section-card" style="text-align:center;padding:50px 30px;">
        <div style="width:70px;height:70px;background:#f0fdf9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
          <i class="bi bi-lock-fill" style="font-size:32px;color:#4ecca3;"></i>
        </div>
        <h3 style="font-size:18px;font-weight:800;color:#1a1a2e;margin:0 0 10px;">Feature Locked</h3>
        <p style="font-size:14px;color:#64748b;max-width:380px;margin:0 auto 24px;line-height:1.6;">
          You need to configure your school in the results system before assigning teachers. This takes about 2 minutes.
        </p>
        <button onclick="axpOpenSetupPopup()" class="axp-btn-primary" style="font-size:15px;padding:12px 30px;">
          <i class="bi bi-gear-fill"></i> Setup School Now
        </button>
      </div>`;
    return;
  }

  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-person-badge"></i> Assign Tasks to Teachers</div>
      <div class="axp-alert axp-alert-info" style="border-radius:4px;margin-bottom:20px;">
        <i class="bi bi-info-circle"></i>
        <span>Add teachers and assign them the classes and subjects they will enter marks for.</span>
      </div>

      <!-- Add Teacher Form -->
      <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:6px;padding:20px;margin-bottom:24px;">
        <h4 style="font-size:14px;font-weight:700;color:#1a1a2e;margin:0 0 16px;display:flex;align-items:center;gap:8px;">
          <i class="bi bi-person-plus" style="color:#4ecca3;"></i> Add New Teacher
        </h4>
        <div class="axp-form-row">
          <div class="axp-field-group">
            <label>Teacher Full Name</label>
            <input id="axpTchName" class="axp-input" placeholder="e.g. John Mwangi" />
          </div>
          <div class="axp-field-group">
            <label>Teacher Email (Gmail)</label>
            <input id="axpTchEmail" class="axp-input" type="email" placeholder="e.g. john@gmail.com" />
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:8px;">Subject Assignments</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">
            <select id="axpTchClass" class="axp-select" style="flex:1;min-width:120px;max-width:180px;">
              <option value="">Select Class</option>
              ${(_schoolMeta && _schoolMeta.classes ? _schoolMeta.classes : []).map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
            </select>
            <select id="axpTchSubject" class="axp-select" style="flex:1;min-width:140px;max-width:200px;">
              <option value="">Select Subject</option>
            </select>
            <button onclick="axpAddTeacherAssignment()" class="axp-btn-secondary">
              <i class="bi bi-plus"></i> Add
            </button>
          </div>
          <div id="axpTchAssignments" class="axp-tags-container"></div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button onclick="axpSaveTeacher()" class="axp-btn-primary" id="axpSaveTeacherBtn">
            <i class="bi bi-floppy"></i> Save Teacher
          </button>
          <button onclick="axpClearTeacherForm()" class="axp-btn-secondary">
            <i class="bi bi-x-circle"></i> Clear
          </button>
        </div>
        <div id="axpTeacherFormMsg" style="margin-top:10px;"></div>
      </div>

      <!-- Teachers List -->
      <h4 style="font-size:14px;font-weight:700;color:#1a1a2e;margin:0 0 14px;display:flex;align-items:center;gap:8px;">
        <i class="bi bi-people" style="color:#4ecca3;"></i> Teacher List
        <button onclick="axpLoadTeachers()" style="margin-left:auto;" class="axp-btn-secondary">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </h4>
      <div id="axpTeachersList">
        <div class="axp-empty-state">
          <div class="axp-spinner-sm" style="margin:0 auto 10px;"></div>
          <p>Loading teachers...</p>
        </div>
      </div>
    </div>`;

  /* Populate subjects when class changes */
  document.getElementById("axpTchClass").addEventListener("change", function() {
    const sub = document.getElementById("axpTchSubject");
    sub.innerHTML = '<option value="">Select Subject</option>';
    if (this.value && _schoolMeta && _schoolMeta.subjects && _schoolMeta.subjects[this.value]) {
      _schoolMeta.subjects[this.value].forEach(s => {
        sub.innerHTML += `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`;
      });
    }
  });

  axpLoadTeachers();
}

/* Teacher form helpers */
window._axpTchAssignmentsList = [];

window.axpAddTeacherAssignment = function() {
  const cls = document.getElementById("axpTchClass").value;
  const sub = document.getElementById("axpTchSubject").value;
  if (!cls || !sub) { _showSectionMsg("axpTeacherFormMsg","Please select both a class and subject.","warning"); return; }
  const key = `${cls}::${sub}`;
  if (window._axpTchAssignmentsList.find(a=>a.key===key)) { _showSectionMsg("axpTeacherFormMsg","Already added.","warning"); return; }
  window._axpTchAssignmentsList.push({key,class:cls,subject:sub});
  _renderTeacherAssignmentTags();
};

window.axpRemoveTeacherAssignment = function(key) {
  window._axpTchAssignmentsList = window._axpTchAssignmentsList.filter(a=>a.key!==key);
  _renderTeacherAssignmentTags();
};

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
  document.getElementById("axpTchName").value = "";
  document.getElementById("axpTchEmail").value = "";
  document.getElementById("axpTchClass").value = "";
  document.getElementById("axpTchSubject").innerHTML = '<option value="">Select Subject</option>';
  window._axpTchAssignmentsList = [];
  _renderTeacherAssignmentTags();
  document.getElementById("axpTeacherFormMsg").innerHTML = "";
};

window.axpSaveTeacher = async function() {
  const name  = document.getElementById("axpTchName").value.trim();
  const email = document.getElementById("axpTchEmail").value.trim();
  if (!name)  { _showSectionMsg("axpTeacherFormMsg","Teacher name is required.","danger"); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { _showSectionMsg("axpTeacherFormMsg","Valid email is required.","danger"); return; }
  if (window._axpTchAssignmentsList.length === 0) { _showSectionMsg("axpTeacherFormMsg","Add at least one subject assignment.","danger"); return; }

  const btn = document.getElementById("axpSaveTeacherBtn");
  btn.disabled = true; btn.innerHTML = '<span class="axp-spinner-sm"></span> Saving...';

  try {
    const res = await _apiPost({
      mode        : "saveTeacher",
      adminEmail  : _dashboardData.email,
      schoolId    : _appScriptSchoolId,
      teacherName : name,
      teacherEmail: email,
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
    btn.disabled = false; btn.innerHTML = '<i class="bi bi-floppy"></i> Save Teacher';
  }
};

window.axpLoadTeachers = async function() {
  const cont = document.getElementById("axpTeachersList");
  if (!cont) return;
  cont.innerHTML = `<div class="axp-empty-state"><div class="axp-spinner-sm" style="margin:0 auto 10px;"></div><p>Loading...</p></div>`;
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
      cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-person-x"></i><p>No teachers added yet. Add the first teacher above.</p></div>`;
    }
  } catch (e) {
    cont.innerHTML = `<div class="axp-empty-state"><i class="bi bi-exclamation-triangle"></i><p>Failed to load teachers.</p></div>`;
  }
};

/* ─────────────────────────────────────────────────────────────
   renderSetupSchoolSection — now delegates to the popup
───────────────────────────────────────────────────────────── */
function renderSetupSchoolSection() {
  /* Setup is now handled by the modal popup */
  axpOpenSetupPopup();
}




/* ─────────────────────────────────────────────────────────────
   SECTION: PUSH STUDENT NAMES
───────────────────────────────────────────────────────────── */
function renderPushStudentsSection() {
  const sw = document.getElementById("axpSectionWrapper");

  if (!_appScriptSchoolId) {
    sw.innerHTML = `
      <div class="axp-section-card" style="text-align:center;padding:50px 30px;">
        <div style="width:70px;height:70px;background:#f0fdf9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
          <i class="bi bi-lock-fill" style="font-size:32px;color:#4ecca3;"></i>
        </div>
        <h3 style="font-size:18px;font-weight:800;color:#1a1a2e;margin:0 0 10px;">Feature Locked</h3>
        <p style="font-size:14px;color:#64748b;max-width:380px;margin:0 auto 24px;line-height:1.6;">Complete the school setup first to unlock student enrollment.</p>
        <button onclick="axpOpenSetupPopup()" class="axp-btn-primary" style="font-size:15px;padding:12px 30px;">
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

      <!-- Upload progress overview -->
      <div style="background:linear-gradient(135deg,#060c1c,#0f2248);border-radius:8px;padding:18px 22px;margin-bottom:22px;color:#fff;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:13px;font-weight:600;opacity:.8;">Enrollment Progress</span>
          <span style="font-size:22px;font-weight:800;color:#4ecca3;" id="axpEnrollPct">—</span>
        </div>
        <div class="axp-progress-bar" style="height:8px;background:rgba(255,255,255,0.1);">
          <div class="axp-progress-fill" id="axpEnrollFill" style="width:0%;transition:width .6s ease;"></div>
        </div>
        <div style="font-size:12px;opacity:.5;margin-top:6px;" id="axpEnrollSubLabel">Select a class to see enrollment status</div>
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

        <!-- Tabs: Names | Subject Assignment -->
        <div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:16px;">
          <button onclick="axpStudentTab('names')" id="axpTabNames" style="padding:10px 20px;border:none;background:none;font-weight:700;font-size:13px;color:#4ecca3;border-bottom:2px solid #4ecca3;margin-bottom:-2px;cursor:pointer;">
            <i class="bi bi-list-ol"></i> Student Names
          </button>
          <button onclick="axpStudentTab('subjects')" id="axpTabSubjects" style="padding:10px 20px;border:none;background:none;font-weight:700;font-size:13px;color:#94a3b8;border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;">
            <i class="bi bi-book"></i> Subject Assignment
          </button>
        </div>

        <!-- Tab: Names -->
        <div id="axpStudentTabNames">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <label style="font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:.5px;">Student List</label>
            <div style="display:flex;gap:8px;">
              <button onclick="axpAddStudentRow()" class="axp-btn-secondary" style="font-size:12px;padding:6px 12px;"><i class="bi bi-plus"></i> Add Row</button>
              <button onclick="axpBulkPasteToggle()" class="axp-btn-secondary" style="font-size:12px;padding:6px 12px;"><i class="bi bi-clipboard"></i> Bulk Paste</button>
            </div>
          </div>

          <!-- Row entry progress indicator -->
          <div style="background:#f8fafc;border-radius:6px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:12px;">
            <div style="flex:1;">
              <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">Names filled</div>
              <div class="axp-progress-bar" style="height:6px;">
                <div class="axp-progress-fill" id="axpNamesFill" style="width:0%;transition:width .3s;"></div>
              </div>
            </div>
            <span id="axpNamesCount" style="font-size:20px;font-weight:800;color:#4ecca3;min-width:48px;text-align:right;">0/0</span>
          </div>

          <!-- Bulk paste -->
          <div id="axpBulkPasteArea" style="display:none;margin-bottom:14px;">
            <div class="axp-alert axp-alert-info" style="border-radius:4px;margin-bottom:8px;">
              <i class="bi bi-info-circle"></i>
              <span>One student per line: <code>STUDENT NAME,M</code> or <code>STUDENT NAME,F</code></span>
            </div>
            <textarea id="axpBulkPasteInput" class="axp-textarea" placeholder="JOHN DOE,M&#10;JANE SMITH,F&#10;PETER JONES,M"></textarea>
            <div style="margin-top:8px;display:flex;gap:8px;">
              <button onclick="axpParseBulkPaste()" class="axp-btn-primary" style="font-size:12px;"><i class="bi bi-arrow-right"></i> Parse Names</button>
              <button onclick="axpBulkPasteToggle()" class="axp-btn-secondary" style="font-size:12px;">Cancel</button>
            </div>
          </div>

          <div id="axpStudentRows" style="max-height:400px;overflow-y:auto;border:1.5px solid #e2e8f0;border-radius:4px;padding:12px;"></div>
        </div>

        <!-- Tab: Subject Assignment per student -->
        <div id="axpStudentTabSubjects" style="display:none;">
          <div class="axp-alert axp-alert-info" style="border-radius:4px;margin-bottom:14px;">
            <i class="bi bi-info-circle"></i>
            <span>Assign which subjects each student takes. Leave unchecked if a student doesn't take a subject — this improves accuracy in the progress tracker.</span>
          </div>
          <div id="axpStudentSubjectMatrix" style="overflow-x:auto;"></div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;">
          <button onclick="axpSubmitStudentNames()" class="axp-btn-primary" id="axpPushStudentsBtn">
            <i class="bi bi-cloud-upload"></i> Push Names to System
          </button>
          <button onclick="axpSyncStudents()" class="axp-btn-secondary" id="axpSyncStudentsBtn">
            <i class="bi bi-arrow-repeat"></i> Sync to Exam Sheets
          </button>
        </div>
        <div id="axpPushMsg" style="margin-top:10px;"></div>

        <!-- Push progress bar (shown during submission) -->
        <div id="axpPushProgress" style="display:none;margin-top:14px;background:#f8fafc;border-radius:6px;padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span id="axpPushProgressLabel" style="font-size:13px;font-weight:600;color:#374151;">Uploading...</span>
            <span id="axpPushProgressPct" style="font-size:14px;font-weight:800;color:#4ecca3;">0%</span>
          </div>
          <div class="axp-progress-bar" style="height:10px;">
            <div class="axp-progress-fill" id="axpPushProgressFill" style="width:0%;transition:width .4s ease;"></div>
          </div>
        </div>
      </div>
    </div>`;

  window._axpStudentRows    = [];
  window._axpStudentSubjects = {}; /* { studentName: [subjects] } */
}

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
    cont.innerHTML = `<div class="axp-alert axp-alert-warning" style="border-radius:4px;"><i class="bi bi-exclamation-triangle"></i><span>Add student names first in the "Student Names" tab.</span></div>`;
    return;
  }
  if (subjects.length === 0) {
    cont.innerHTML = `<div class="axp-alert axp-alert-warning" style="border-radius:4px;"><i class="bi bi-exclamation-triangle"></i><span>No subjects configured for this class. Check School Setup.</span></div>`;
    return;
  }

  /* Init defaults: all subjects for each student */
  names.forEach(n => {
    if (!window._axpStudentSubjects[n]) window._axpStudentSubjects[n] = [...subjects];
  });

  /* Compact matrix: rows = students, cols = subjects */
  const cellStyle = "width:36px;height:36px;min-width:36px;display:flex;align-items:center;justify-content:center;border-right:1px solid #e2e8f0;";
  const hdrStyle  = "width:36px;min-width:36px;text-align:center;font-size:10px;font-weight:700;color:#64748b;padding:0 2px;writing-mode:vertical-lr;transform:rotate(180deg);height:80px;display:flex;align-items:center;justify-content:center;border-right:1px solid #e2e8f0;";

  cont.innerHTML = `
    <p style="font-size:12px;color:#64748b;margin:0 0 10px;">Check subjects each student takes. <strong>Uncheck</strong> if a student doesn't study that subject.</p>
    <div style="min-width:max-content;">
      <!-- Header row -->
      <div style="display:flex;align-items:flex-end;border-bottom:2px solid #e2e8f0;padding-bottom:4px;">
        <div style="min-width:200px;font-size:11px;font-weight:700;color:#64748b;padding:0 10px;flex-shrink:0;">Student Name</div>
        ${subjects.map(s => `<div style="${hdrStyle}" title="${escapeHtml(s)}">${escapeHtml(s)}</div>`).join("")}
        <div style="min-width:60px;font-size:11px;font-weight:700;color:#64748b;text-align:center;">Subjects</div>
      </div>
      <!-- Student rows -->
      ${names.map((name, ni) => {
        const taken = window._axpStudentSubjects[name] || [];
        const takesCount = subjects.filter(s => taken.includes(s)).length;
        return `
          <div style="display:flex;align-items:center;border-bottom:1px solid #f1f5f9;${ni%2===0?'background:#fafbfc;':''}">
            <div style="min-width:200px;font-size:13px;font-weight:500;color:#1a1a2e;padding:8px 10px;flex-shrink:0;">${escapeHtml(name)}</div>
            ${subjects.map(s => `
              <div style="${cellStyle}">
                <input type="checkbox" ${taken.includes(s) ? "checked" : ""}
                  onchange="axpToggleStudentSubject('${name.replace(/'/g,"\\'")}','${s}',this.checked)"
                  style="width:16px;height:16px;accent-color:#4ecca3;cursor:pointer;" />
              </div>`).join("")}
            <div style="min-width:60px;text-align:center;">
              <span id="axpSubCount_${ni}" style="font-size:12px;font-weight:700;color:#4ecca3;">${takesCount}</span>
            </div>
          </div>`;
      }).join("")}
      <!-- "Select All" helper row -->
      <div style="display:flex;align-items:center;border-top:2px solid #e2e8f0;padding:6px 0;background:#f8fafc;">
        <div style="min-width:200px;font-size:11px;color:#94a3b8;padding:0 10px;font-style:italic;">Toggle all →</div>
        ${subjects.map((s, si) => `
          <div style="${cellStyle}">
            <input type="checkbox" checked title="Toggle all for ${escapeHtml(s)}"
              onchange="axpToggleSubjectForAll('${s}',this.checked)"
              style="width:14px;height:14px;accent-color:#94a3b8;cursor:pointer;opacity:.6;" />
          </div>`).join("")}
        <div style="min-width:60px;"></div>
      </div>
    </div>`;
}

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

window.axpRenderStudentInputs = function() {
  const cls = document.getElementById("axpPushClass").value;
  const sec = document.getElementById("axpStudentInputSection");
  if (!cls) { sec.style.display="none"; return; }
  sec.style.display = "block";
  window._axpStudentRows    = [];
  window._axpStudentSubjects = {};
  _axpRenderStudentRows();
  axpLoadExistingStudents(cls);

  /* Prime enrollment bar */
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
  const expected = 40; /* generic expected per class — adjust if needed */
  const pct = count > 0 ? Math.min(100, Math.round(count / expected * 100)) : 0;
  if (pctEl)  pctEl.textContent  = count > 0 ? `${count} students` : "0 students";
  if (fillEl) { fillEl.style.width = pct + "%"; fillEl.style.background = pct >= 80 ? "#10b981" : "#4ecca3"; }
  if (lblEl)  lblEl.textContent  = count > 0 ? `${count} students enrolled in ${cls}` : `No students yet in ${cls} — add names below`;
}

function _axpRenderStudentRows() {
  const cont = document.getElementById("axpStudentRows");
  if (!cont) return;
  cont.innerHTML = `
    <div style="display:grid;grid-template-columns:30px 1fr 80px auto;gap:6px;align-items:center;padding:6px 4px 8px;border-bottom:1px solid #e2e8f0;margin-bottom:6px;">
      <span style="font-size:11px;color:#94a3b8;">#</span>
      <span style="font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Student Name</span>
      <span style="font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Gender</span>
      <span></span>
    </div>
    ${window._axpStudentRows.map((s,i)=>`
      <div style="display:grid;grid-template-columns:30px 1fr 80px auto;gap:6px;align-items:center;margin-bottom:6px;">
        <span style="font-size:12px;color:#94a3b8;text-align:center;">${i+1}</span>
        <input class="axp-input" style="padding:7px 10px;font-size:13px;" value="${escapeHtml(s.name)}"
          oninput="window._axpStudentRows[${i}].name=this.value;_axpUpdateNamesProgress()" placeholder="Full Name" />
        <select class="axp-select" style="padding:7px 8px;font-size:13px;" onchange="window._axpStudentRows[${i}].gender=this.value">
          <option value="M" ${s.gender==="M"?"selected":""}>M</option>
          <option value="F" ${s.gender==="F"?"selected":""}>F</option>
        </select>
        <button onclick="axpRemoveStudentRow(${i})" style="background:none;border:none;color:#dc3545;cursor:pointer;font-size:18px;padding:2px 6px;" title="Remove">×</button>
      </div>`).join("")}`;
  _axpUpdateNamesProgress();
}

window.axpAddStudentRow = function() {
  window._axpStudentRows.push({name:"",gender:"M"});
  _axpRenderStudentRows();
  /* Scroll to bottom */
  const cont = document.getElementById("axpStudentRows");
  if (cont) cont.scrollTop = cont.scrollHeight;
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

window.axpSubmitStudentNames = async function() {
  const cls = document.getElementById("axpPushClass").value;
  if (!cls) { _showSectionMsg("axpPushMsg","Select a class first.","danger"); return; }

  /* Sync DOM input values to array */
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

  /* Show animated progress bar */
  const progDiv  = document.getElementById("axpPushProgress");
  const progFill = document.getElementById("axpPushProgressFill");
  const progPct  = document.getElementById("axpPushProgressPct");
  const progLbl  = document.getElementById("axpPushProgressLabel");
  if (progDiv) progDiv.style.display = "block";

  let fakeP = 0;
  const steps = [
    "Preparing headers…","Uploading student names…","Saving to spreadsheet…","Finalizing…"
  ];
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

    /* Include subject assignments in payload */
    const dataPayload = valid.map(s => [s.name, s.gender, JSON.stringify(window._axpStudentSubjects[s.name] || subjectList)]);
    await _apiPost({ mode:"data", schoolId:_appScriptSchoolId, year:_schoolMeta.year, class:cls, data:JSON.stringify(dataPayload) });

    clearInterval(ticker);
    if (progFill) { progFill.style.width = "100%"; progFill.style.background = "#10b981"; }
    if (progPct)  progPct.textContent  = "100%";
    if (progLbl)  progLbl.textContent  = `${valid.length} students uploaded successfully!`;
    _showSectionMsg("axpPushMsg",`${valid.length} student names pushed! Click "Sync to Exam Sheets" to propagate.`,"success");
    /* Update enrollment bar */
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
      _showSectionMsg("axpPushMsg",`Sync complete! Synced to: ${(res.synced||[]).join(", ") || "all sheets"}`,"success");
    } else {
      _showSectionMsg("axpPushMsg", res.message || "Sync failed.","danger");
    }
  } catch(e) {
    _showSectionMsg("axpPushMsg","Sync failed. Check your connection.","danger");
  } finally {
    btn.disabled=false; btn.innerHTML='<i class="bi bi-arrow-repeat"></i> Sync to Exam Sheets';
  }
};

/* ─────────────────────────────────────────────────────────────
   SECTION: TASK PROGRESS
───────────────────────────────────────────────────────────── */
function renderTaskProgressSection() {
  const sw = document.getElementById("axpSectionWrapper");

  if (!_appScriptSchoolId) {
    sw.innerHTML = `
      <div class="axp-section-card" style="text-align:center;padding:50px 30px;">
        <div style="width:70px;height:70px;background:#f0fdf9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
          <i class="bi bi-lock-fill" style="font-size:32px;color:#4ecca3;"></i>
        </div>
        <h3 style="font-size:18px;font-weight:800;color:#1a1a2e;margin:0 0 10px;">Feature Locked</h3>
        <p style="font-size:14px;color:#64748b;max-width:380px;margin:0 auto 24px;line-height:1.6;">Set up your school first to unlock progress tracking.</p>
        <button onclick="axpOpenSetupPopup()" class="axp-btn-primary" style="font-size:15px;padding:12px 30px;">
          <i class="bi bi-gear-fill"></i> Setup School Now
        </button>
      </div>`;
    return;
  }

  const classes   = (_schoolMeta && _schoolMeta.classes)   ? _schoolMeta.classes   : [];
  const examTypes = (_schoolMeta && _schoolMeta.examTypes) ? _schoolMeta.examTypes : [];

  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-clock-history"></i> Task Progress</div>

      <div class="axp-form-row">
        <div class="axp-field-group">
          <label>Exam Type</label>
          <select id="axpProgExamType" class="axp-select">
            ${examTypes.map(et=>`<option value="${escapeHtml(et)}">${escapeHtml(et)}</option>`).join("")}
          </select>
        </div>
        <div class="axp-field-group">
          <label>Class</label>
          <select id="axpProgClass" class="axp-select">
            <option value="">All Classes</option>
            ${classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
          </select>
        </div>
      </div>
      <div style="margin-bottom:16px;">
        <button onclick="axpLoadProgress()" class="axp-btn-primary">
          <i class="bi bi-search"></i> Load Progress
        </button>
      </div>

      <div id="axpProgressResults">
        <div class="axp-empty-state">
          <i class="bi bi-clock-history"></i>
          <p>Select an exam type and click Load Progress.</p>
        </div>
      </div>
    </div>`;
}

window.axpLoadProgress = async function() {
  const examType  = document.getElementById("axpProgExamType").value;
  const className = document.getElementById("axpProgClass").value;
  const cont      = document.getElementById("axpProgressResults");
  const classes   = (_schoolMeta && _schoolMeta.classes) ? _schoolMeta.classes : [];

  cont.innerHTML = `<div class="axp-empty-state"><div class="axp-spinner-sm" style="margin:0 auto 10px;"></div><p>Loading progress data...</p></div>`;

  const classesToLoad = className ? [className] : classes;
  if (classesToLoad.length === 0) { cont.innerHTML=`<div class="axp-empty-state"><i class="bi bi-exclamation-triangle"></i><p>No classes configured.</p></div>`; return; }

  try {
    const results = await Promise.all(classesToLoad.map(async cls => {
      const res = await _apiGet({ mode:"subjectProgress", schoolId:_appScriptSchoolId, year:_schoolMeta.year, examType, class:cls });
      return { class:cls, progress: res.status==="success" ? res.progress : {} };
    }));

    if (results.every(r=>Object.keys(r.progress).length===0)) {
      cont.innerHTML=`<div class="axp-empty-state"><i class="bi bi-inbox"></i><p>No progress data yet for ${examType}. Teachers need to submit marks first.</p></div>`;
      return;
    }

    /* Summary bar */
    let totalSubjects=0, completedSubjects=0;
    results.forEach(r=>{ Object.keys(r.progress).forEach(s=>{ totalSubjects++; if(r.progress[s].completed) completedSubjects++; }); });
    const pct = totalSubjects > 0 ? Math.round(completedSubjects/totalSubjects*100) : 0;

    cont.innerHTML = `
      <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:6px;padding:16px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="font-size:14px;color:#1a1a2e;">Overall Progress — ${examType}</strong>
          <span style="font-size:20px;font-weight:800;color:${pct===100?'#10b981':'#f59e0b'};">${pct}%</span>
        </div>
        <div class="axp-progress-bar" style="height:12px;">
          <div class="axp-progress-fill" style="width:${pct}%;"></div>
        </div>
        <div style="font-size:12px;color:#64748b;margin-top:6px;">${completedSubjects} of ${totalSubjects} subjects completed</div>
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
                      <div class="axp-progress-bar" style="width:60px;">
                        <div class="axp-progress-fill" style="width:${pPct}%;background:${pPct===100?'#10b981':'#4ecca3'};"></div>
                      </div>
                      <div class="progress-subject-count">${p.submitted||0}/${p.expected||0}</div>
                      <span class="axp-badge ${p.completed?'axp-badge-green':'pPct>0?\'axp-badge-yellow\':\'axp-badge-gray\''}" style="font-size:10px;">
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
   SECTION: NOTIFICATIONS (full inline)
───────────────────────────────────────────────────────────── */
function renderNotificationsSectionFull() {
  const sw = document.getElementById("axpSectionWrapper");
  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-bell"></i> Notifications</div>
      ${_announcements.length > 0
        ? `<div style="display:flex;flex-direction:column;gap:12px;">
            ${_announcements.map(ann=>{
              const colors={High:"#ef4444",Medium:"#f59e0b",Low:"#3b82f6"};
              const c=colors[ann.priority]||"#94a3b8";
              return `
                <div style="background:#f8fafc;border-left:4px solid ${c};border-radius:3px;padding:16px;">
                  <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                    <strong style="font-size:14px;color:#1e293b;">${escapeHtml(ann.title)}</strong>
                    <span style="background:${c};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">${escapeHtml(ann.priority||"Normal")}</span>
                  </div>
                  <p style="margin:0 0 8px;color:#475569;line-height:1.6;font-size:13.5px;">${escapeHtml(ann.message)}</p>
                  <span style="font-size:11.5px;color:#94a3b8;"><i class="bi bi-calendar3"></i> ${formatAnnouncementDate(ann.date)}</span>
                </div>`;
            }).join("")}
          </div>`
        : `<div class="axp-empty-state"><i class="bi bi-bell-slash"></i><p>No notifications at this time.</p></div>`}
    </div>`;
}

/* ─────────────────────────────────────────────────────────────
   SECTION: MESSAGES (full inline)
───────────────────────────────────────────────────────────── */
function renderMessagesSectionFull() {
  const sw = document.getElementById("axpSectionWrapper");
  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-chat-dots"></i> Messages</div>
      ${_operatorMessage
        ? `<div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:6px;padding:20px;color:#fff;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              <i class="bi bi-chat-left-text-fill" style="font-size:20px;color:#ffd700;"></i>
              <strong style="font-size:15px;">Message from AcademixPoint</strong>
            </div>
            <div style="background:rgba(255,255,255,0.12);border-radius:4px;padding:14px;white-space:pre-wrap;line-height:1.6;font-size:13.5px;">
              ${escapeHtml(_operatorMessage)}
            </div>
          </div>`
        : `<div class="axp-empty-state"><i class="bi bi-chat-slash"></i><p>No messages at this time.</p></div>`}
    </div>`;
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

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
        <div style="background:#f8fafc;border-radius:6px;padding:18px;border:1.5px solid #e2e8f0;">
          <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">School Name</div>
          <div style="font-size:15px;font-weight:600;color:#1e293b;">${escapeHtml(d.schoolname||"—")}</div>
        </div>
        <div style="background:#f8fafc;border-radius:6px;padding:18px;border:1.5px solid #e2e8f0;">
          <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">School Index</div>
          <div style="font-size:15px;font-weight:600;color:#1e293b;">${escapeHtml(d.schoolindex||"—")}</div>
        </div>
        <div style="background:#f8fafc;border-radius:6px;padding:18px;border:1.5px solid #e2e8f0;">
          <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Email</div>
          <div style="font-size:15px;font-weight:600;color:#1e293b;">${escapeHtml(d.email||"—")}</div>
        </div>
        <div style="background:#f8fafc;border-radius:6px;padding:18px;border:1.5px solid #e2e8f0;">
          <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Username</div>
          <div style="font-size:15px;font-weight:600;color:#1e293b;">${escapeHtml(d.username||"—")}</div>
        </div>
      </div>

      ${_schoolMeta ? `
        <div class="axp-alert axp-alert-success" style="border-radius:4px;margin-bottom:16px;">
          <i class="bi bi-check-circle-fill"></i>
          <span>Results system configured: <strong>${_schoolMeta.year}</strong> · ${(_schoolMeta.classes||[]).length} classes · ${(_schoolMeta.examTypes||[]).length} exam types</span>
        </div>` : ""}

      <div class="axp-divider-line"></div>
      <h4 style="font-size:14px;font-weight:700;color:#1e293b;margin:16px 0 12px;">Danger Zone</h4>
      <button onclick="axpRequestDelete()" class="axp-btn-danger">
        <i class="bi bi-trash3"></i> Request Account Deletion
      </button>
      <p style="font-size:12px;color:#94a3b8;margin:8px 0 0;">This will flag your account for deletion. An operator will review and process your request.</p>
    </div>`;
}

window.axpRequestDelete = async function() {
  if (!confirm("Are you sure you want to request account deletion? This cannot be undone.")) return;
  try {
    const res = await _apiPost({ action:"requestDelete", username:_dashboardData.username, password:localStorage.getItem("axpPassword")||"" });
    alert(res.result==="success" ? "Deletion request submitted. An operator will review." : (res.message||"Request failed."));
  } catch(e) { alert("Network error."); }
};

/* ─────────────────────────────────────────────────────────────
   SECTION: HELP
───────────────────────────────────────────────────────────── */
function renderHelpSection() {
  const sw = document.getElementById("axpSectionWrapper");
  sw.innerHTML = `
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-question-circle"></i> Help & Support</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div style="background:linear-gradient(135deg,#4ecca3,#2ecc71);border-radius:6px;padding:20px;color:#060c1c;">
          <i class="bi bi-telephone-fill" style="font-size:28px;margin-bottom:8px;display:block;"></i>
          <strong style="font-size:15px;">Call Support</strong>
          <p style="margin:6px 0 0;font-size:13px;opacity:0.85;">+255677819173</p>
        </div>
        <div style="background:#1a1a2e;border-radius:6px;padding:20px;color:#fff;">
          <i class="bi bi-globe" style="font-size:28px;margin-bottom:8px;display:block;color:#4ecca3;"></i>
          <strong style="font-size:15px;">Website</strong>
          <p style="margin:6px 0 0;font-size:13px;opacity:0.7;">www.academixpoint.com</p>
        </div>
      </div>

      <h4 style="font-size:14px;font-weight:700;color:#1e293b;margin:0 0 14px;">Getting Started</h4>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${[
          ["1","bi-building-gear","Setup School Structure","Go to Assign Tasks → Teachers section. If your school isn't set up yet, you'll be prompted to configure your year, classes, exam types, and subjects."],
          ["2","bi-people","Push Student Names","After setup, go to Push Student Names. Select a class, enter names row by row or bulk paste, then push and sync to all exam sheets."],
          ["3","bi-person-badge","Assign Teachers","Return to Assign Tasks and add your teachers. Assign each teacher the class and subject they will enter marks for."],
          ["4","bi-clock-history","Monitor Progress","Use the Task Progress section to track how many subjects each teacher has completed for each class and exam type."],
        ].map(([n,icon,title,desc])=>`
          <div style="display:flex;gap:14px;padding:14px;background:#f8fafc;border-radius:6px;border:1.5px solid #e2e8f0;">
            <div style="width:36px;height:36px;min-width:36px;background:#4ecca3;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#060c1c;">${n}</div>
            <div>
              <strong style="font-size:13.5px;color:#1e293b;display:flex;align-items:center;gap:6px;"><i class="bi ${icon}" style="color:#4ecca3;"></i>${title}</strong>
              <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">${desc}</p>
            </div>
          </div>`).join("")}
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────────────────────
   SHARED SECTION HELPER: show inline messages
───────────────────────────────────────────────────────────── */
function _showSectionMsg(elId, text, type="info") {
  const el = document.getElementById(elId);
  if (!el) return;
  const typeMap = { success:"axp-alert-success", danger:"axp-alert-danger", warning:"axp-alert-warning", info:"axp-alert-info" };
  const iconMap = { success:"bi-check-circle-fill", danger:"bi-x-circle-fill", warning:"bi-exclamation-triangle-fill", info:"bi-info-circle-fill" };
  el.innerHTML = `
    <div class="axp-alert ${typeMap[type]||typeMap.info}" style="border-radius:4px;">
      <i class="bi ${iconMap[type]||iconMap.info}" style="flex-shrink:0;font-size:15px;"></i>
      <span>${escapeHtml(text)}</span>
    </div>`;
  el.scrollIntoView({behavior:"smooth",block:"nearest"});
  if (type === "success") setTimeout(() => { if (el) el.innerHTML=""; }, 5000);
}


/* ══════════════════════════════════════════════════════════════
   DEMO SECTION — Interactive walkthrough simulator
   Lets admin experience the system as a teacher would,
   without loading any external links.
══════════════════════════════════════════════════════════════ */
function renderDemoSection() {
  const sw = document.getElementById("axpSectionWrapper");

  /* Build demo class/subject data based on actual school meta, or fallback */
  const demoClasses  = (_schoolMeta && _schoolMeta.classes)   ? _schoolMeta.classes   : ["Form I","Form II"];
  const demoExamTypes = (_schoolMeta && _schoolMeta.examTypes) ? _schoolMeta.examTypes : ["MONTHLY","TERMINAL"];
  const demoSubjects  = (_schoolMeta && _schoolMeta.subjects)  ? _schoolMeta.subjects  :
    { "Form I": ["MATHEMATICS","ENGLISH","KISWAHILI","BIOLOGY","CHEMISTRY"], "Form II": ["MATHEMATICS","ENGLISH","PHYSICS","HISTORY"] };
  const firstClass   = demoClasses[0];
  const firstExam    = demoExamTypes[0];
  const firstSubjects = demoSubjects[firstClass] || ["MATHEMATICS","ENGLISH","KISWAHILI"];

  /* Generate fake student list */
  const fakeStudents = ["AMINA HASSAN","BARAKA JOHN","CECILIA MWANGI","DAVID JOSEPH","ESTHER PETER",
    "FRANK OMARI","GRACE MUTUA","HENRY SALIM","IRENE KATO","JAMES NDEGE"].slice(0, 8);

  /* Build mark rows state */
  window._axpDemoMarks = {};
  window._axpDemoClass = firstClass;
  window._axpDemoExam  = firstExam;
  window._axpDemoSub   = firstSubjects[0];
  fakeStudents.forEach(s => { window._axpDemoMarks[s] = ""; });

  sw.innerHTML = `
    <div style="background:linear-gradient(135deg,#060c1c,#0f2248);border-radius:12px;padding:22px 26px;margin-bottom:22px;color:#fff;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:44px;height:44px;background:rgba(78,204,163,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <i class="bi bi-play-circle-fill" style="font-size:22px;color:#4ecca3;"></i>
        </div>
        <div>
          <div style="font-size:18px;font-weight:800;letter-spacing:.3px;">Interactive Demo</div>
          <div style="font-size:12px;opacity:.5;">Practice the system exactly as a teacher would — no real data is saved</div>
        </div>
      </div>
      <div class="axp-alert" style="background:rgba(78,204,163,0.1);border:1px solid rgba(78,204,163,0.25);border-radius:6px;padding:10px 14px;font-size:13px;color:rgba(255,255,255,0.75);gap:8px;">
        <i class="bi bi-shield-check" style="color:#4ecca3;"></i>
        <span>This demo uses your actual school structure but saves nothing to the database. Experiment freely.</span>
      </div>
    </div>

    <!-- Teacher's marks entry view -->
    <div class="axp-section-card" style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">
        <div class="axp-section-title" style="margin:0;"><i class="bi bi-pencil-square"></i> Teacher Marks Entry</div>
        <span style="background:#f0fdf9;color:#065f46;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700;border:1.5px solid #4ecca3;">
          <i class="bi bi-person-fill"></i> Demo Mode
        </span>
      </div>

      <div class="axp-form-row" style="margin-bottom:16px;">
        <div class="axp-field-group">
          <label>Class</label>
          <select id="axpDemoClass" class="axp-select" onchange="axpDemoRefresh()">
            ${demoClasses.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
          </select>
        </div>
        <div class="axp-field-group">
          <label>Exam Type</label>
          <select id="axpDemoExam" class="axp-select" onchange="axpDemoRefresh()">
            ${demoExamTypes.map(et => `<option value="${escapeHtml(et)}">${escapeHtml(et)}</option>`).join("")}
          </select>
        </div>
        <div class="axp-field-group">
          <label>Subject</label>
          <select id="axpDemoSubject" class="axp-select" onchange="axpDemoRefresh()">
            ${firstSubjects.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("")}
          </select>
        </div>
      </div>

      <!-- Progress bar for marks entry -->
      <div style="background:#f8fafc;border-radius:8px;padding:14px 18px;margin-bottom:18px;border:1.5px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:13px;font-weight:600;color:#374151;" id="axpDemoSubjectLabel">Entering marks for — </span>
          <span style="font-size:20px;font-weight:800;color:#4ecca3;" id="axpDemoPercent">0%</span>
        </div>
        <div class="axp-progress-bar" style="height:10px;margin-bottom:6px;">
          <div class="axp-progress-fill" id="axpDemoProgressFill" style="width:0%;transition:width .4s ease;"></div>
        </div>
        <div style="font-size:12px;color:#94a3b8;" id="axpDemoProgressSub">0 of ${fakeStudents.length} marks entered</div>
      </div>

      <!-- Marks entry table -->
      <div style="border:1.5px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        <div style="display:grid;grid-template-columns:30px 1fr 100px 80px;gap:0;background:#f8fafc;padding:10px 14px;border-bottom:2px solid #e2e8f0;">
          <span style="font-size:11px;font-weight:700;color:#64748b;">#</span>
          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Student Name</span>
          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Score (0–100)</span>
          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Grade</span>
        </div>
        <div id="axpDemoMarksTable">
          ${fakeStudents.map((name, i) => `
            <div style="display:grid;grid-template-columns:30px 1fr 100px 80px;gap:0;align-items:center;padding:9px 14px;border-bottom:1px solid #f1f5f9;${i%2===0?'background:#fff;':'background:#fafbfc;'}">
              <span style="font-size:12px;color:#94a3b8;">${i+1}</span>
              <span style="font-size:13.5px;font-weight:500;color:#1a1a2e;">${escapeHtml(name)}</span>
              <input class="axp-input" id="axpMark_${i}" type="number" min="0" max="100"
                style="padding:6px 10px;font-size:14px;font-weight:700;width:80px;"
                placeholder="—" oninput="axpDemoMarkInput(${i},this.value)"
                value="${window._axpDemoMarks[name]||''}" />
              <span id="axpGrade_${i}" style="font-size:13px;font-weight:700;text-align:center;"></span>
            </div>`).join("")}
        </div>
      </div>

      <!-- Submit area -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:18px;align-items:center;">
        <button onclick="axpDemoSubmitMarks()" class="axp-btn-primary" id="axpDemoSubmitBtn">
          <i class="bi bi-send-fill"></i> Submit Marks (Demo)
        </button>
        <button onclick="axpDemoClear()" class="axp-btn-secondary">
          <i class="bi bi-trash"></i> Clear All
        </button>
      </div>
      <div id="axpDemoMsg" style="margin-top:12px;"></div>
    </div>

    <!-- How it works panel -->
    <div class="axp-section-card">
      <div class="axp-section-title"><i class="bi bi-lightbulb"></i> How Teachers Use The System</div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:4px;">
        ${[
          ["bi-link-45deg","Teachers receive a shared link","You share a unique link with each teacher. They open it on any device — no login required."],
          ["bi-search","System identifies the teacher","The link encodes their class and subject assignment, so they only see their students."],
          ["bi-pencil-square","Teacher enters marks","Each student is listed with an input box. Teachers type scores and click Submit."],
          ["bi-check2-circle","Marks saved to spreadsheet","Marks go directly into the Google Spreadsheet, visible to you in real time."],
          ["bi-clock-history","Admin monitors progress","Use the Task Progress section to see which teachers have submitted and which are pending."],
        ].map(([icon, title, desc]) => `
          <div style="display:flex;gap:14px;padding:14px;background:#f8fafc;border-radius:6px;border:1.5px solid #e2e8f0;">
            <div style="width:40px;height:40px;min-width:40px;background:#f0fdf9;border-radius:50%;display:flex;align-items:center;justify-content:center;">
              <i class="bi ${icon}" style="font-size:18px;color:#4ecca3;"></i>
            </div>
            <div>
              <strong style="font-size:13.5px;color:#1e293b;">${title}</strong>
              <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.55;">${desc}</p>
            </div>
          </div>`).join("")}
      </div>
    </div>`;

  window._axpDemoStudents = fakeStudents;
  window._axpDemoSubjectsList = demoSubjects;
  axpDemoRefresh();
}

/* Demo helpers */
window.axpDemoRefresh = function() {
  const cls  = (document.getElementById("axpDemoClass") || {}).value   || window._axpDemoClass;
  const exam = (document.getElementById("axpDemoExam") || {}).value    || window._axpDemoExam;
  const sub  = (document.getElementById("axpDemoSubject") || {}).value || window._axpDemoSub;

  /* Update subject list when class changes */
  const subSel = document.getElementById("axpDemoSubject");
  if (subSel && cls !== window._axpDemoClass) {
    const subs = (window._axpDemoSubjectsList && window._axpDemoSubjectsList[cls]) || ["MATHEMATICS","ENGLISH"];
    subSel.innerHTML = subs.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  }

  window._axpDemoClass = cls;
  window._axpDemoExam  = exam;
  window._axpDemoSub   = subSel ? subSel.value : sub;

  const lbl = document.getElementById("axpDemoSubjectLabel");
  if (lbl) lbl.textContent = `Entering marks for ${window._axpDemoSub} — ${window._axpDemoClass} (${window._axpDemoExam})`;

  /* Reset marks for new selection */
  (window._axpDemoStudents || []).forEach((s, i) => {
    const inp = document.getElementById(`axpMark_${i}`);
    if (inp) inp.value = "";
    const gr = document.getElementById(`axpGrade_${i}`);
    if (gr)  gr.textContent = "";
  });
  window._axpDemoMarks = {};
  axpDemoUpdateProgress();
};

window.axpDemoMarkInput = function(idx, val) {
  const student = (window._axpDemoStudents || [])[idx];
  if (!student) return;
  const score = parseInt(val);
  window._axpDemoMarks[student] = val;
  const grEl = document.getElementById(`axpGrade_${idx}`);
  if (grEl) {
    if (!val || val === "") { grEl.textContent = ""; return; }
    const g = score >= 75 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 30 ? "D" : "F";
    const c = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
    grEl.innerHTML = `<span style="color:${c};">${g}</span>`;
  }
  axpDemoUpdateProgress();
};

function axpDemoUpdateProgress() {
  const students = window._axpDemoStudents || [];
  const filled   = students.filter(s => window._axpDemoMarks[s] !== "" && window._axpDemoMarks[s] !== undefined).length;
  const total    = students.length;
  const pct      = total > 0 ? Math.round(filled / total * 100) : 0;
  const fill     = document.getElementById("axpDemoProgressFill");
  const pctEl    = document.getElementById("axpDemoPercent");
  const subLbl   = document.getElementById("axpDemoProgressSub");
  if (fill)   { fill.style.width = pct + "%"; fill.style.background = pct === 100 ? "#10b981" : "#4ecca3"; }
  if (pctEl)  pctEl.textContent  = pct + "%";
  if (subLbl) subLbl.textContent = `${filled} of ${total} marks entered`;
}

window.axpDemoSubmitMarks = function() {
  const students = window._axpDemoStudents || [];
  const filled   = students.filter(s => window._axpDemoMarks[s] !== "" && window._axpDemoMarks[s] !== undefined).length;
  if (filled === 0) { _showSectionMsg("axpDemoMsg","Enter at least one mark to submit.","warning"); return; }

  const btn = document.getElementById("axpDemoSubmitBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="axp-spinner-sm"></span> Submitting…';

  /* Simulate network submission */
  setTimeout(() => {
    axpDemoUpdateProgress();
    _showSectionMsg("axpDemoMsg",
      `✓ ${filled} marks for ${window._axpDemoSub} (${window._axpDemoClass} — ${window._axpDemoExam}) submitted successfully! In a real session, these would be saved to your Google Spreadsheet.`,
      "success");
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-send-fill"></i> Submit Marks (Demo)';
  }, 1400);
};

window.axpDemoClear = function() {
  window._axpDemoMarks = {};
  (window._axpDemoStudents || []).forEach((s, i) => {
    const inp = document.getElementById(`axpMark_${i}`);
    if (inp) inp.value = "";
    const gr  = document.getElementById(`axpGrade_${i}`);
    if (gr)  gr.textContent = "";
  });
  axpDemoUpdateProgress();
};
/* End of AcademixPoint Dashboard JS */
