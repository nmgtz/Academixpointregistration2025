document.addEventListener("DOMContentLoaded", () => {
  // Function to apply styles dynamically
 const applyStyles = () => {
  const style = document.createElement("style");
  style.textContent = `
    body {
      position: fixed;
      font-family: 'Roboto', Arial, sans-serif;
      background: url("https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjy2cfaQRRkMgdUGuc-4HskPmN9ShQ5ogiRyvKHeN5kBwG-FA2FKqTvim76kcf-1FiAyV7kheyfOkcoWSjybLmp2Y_o0Mp9IK-l8K9fFsy5bG1xlsOriUJa5KfctpIt8dOcMmZ5eaJmMuQByNHFhTmXx8GWwDtYnCMPefJjr6GgOwQDbBttfTpn0Oj-RF2S/s1600/students%201.jpg");
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      color: var(--default-color);
    }

    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.7);
      z-index: -1;
    }
  `;
  document.head.appendChild(style);
  const socialBtn = document.querySelector(".social-btn");
  if (socialBtn) socialBtn.style.display = "none";
};

// Get elements
const phoneLink = document.getElementById("phoneLink");
const popup1 = document.getElementById("contact-popup");
const overlay1 = document.getElementById("overlay1");

// Function to show the popup and overlay
function showPopup1(e) {
  e.preventDefault();
  popup1.style.display = "block";
  overlay1.style.display = "block";
}

// Add event listener for phone link click
if (phoneLink) {
  phoneLink.addEventListener("click", showPopup1);
}

// Hide the popup and overlay when the overlay is clicked
if (overlay1) {
  overlay1.addEventListener("click", () => {
    popup1.style.display = "none";
    overlay1.style.display = "none";
  });
}

// Get elements
const createLoginButton = document.getElementById("createLogin");
const accountButton = document.getElementById("accountButton");
const popup = document.getElementById("popup");
const overlay = document.getElementById("overlay");
const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");
const registerLink = document.getElementById("registerLink");
const loginLink = document.getElementById("loginLink");

// Show the popup and overlay when the account button is clicked
function showPopup(e) {
  e.preventDefault();
  popup.style.display = "block";
  overlay.style.display = "block";
}

// Add event listeners
if (createLoginButton) createLoginButton.addEventListener("click", showPopup);
if (accountButton) accountButton.addEventListener("click", showPopup);

// Hide the popup and overlay when the overlay is clicked
if (overlay) {
  overlay.addEventListener("click", () => {
    popup.style.display = "none";
    overlay.style.display = "none";
  });
}

// Add event listeners for login and register buttons
if (loginButton && registerButton) {
  loginButton.addEventListener("click", (e) => {
    e.preventDefault();
    popup.style.display = "none";
    overlay.style.display = "none";
    applyStyles();
    document.getElementById("header").style.display = "none";
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("main-id").style.display = "none";
    document.querySelector(".footer").style.display = "none";
    document.querySelector(".footer-bottom").style.display = "none";
    document.querySelector(".login-form").style.display = "block";
    toggleForms("lg-form");
  });

  registerButton.addEventListener("click", (e) => {
    e.preventDefault();
    popup.style.display = "none";
    overlay.style.display = "none";
    applyStyles();
    document.getElementById("header").style.display = "none";
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("main-id").style.display = "none";
    document.querySelector(".footer").style.display = "none";
    document.querySelector(".footer-bottom").style.display = "none";
    document.querySelector(".login-form").style.display = "block";
    toggleForms("sp-form");
  });
}

// Add event listeners for registerLink and loginLink
if (registerLink) {
  registerLink.addEventListener("click", (e) => {
    e.preventDefault();
    applyStyles();
    document.getElementById("header").style.display = "none";
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("main-id").style.display = "none";
    document.querySelector(".footer").style.display = "none";
    document.querySelector(".footer-bottom").style.display = "none";
    document.querySelector(".login-form").style.display = "block";
    toggleForms("sp-form");
  });
}

if (loginLink) {
  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    applyStyles();
    document.getElementById("header").style.display = "none";
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("main-id").style.display = "none";
    document.querySelector(".footer").style.display = "none";
    document.querySelector(".footer-bottom").style.display = "none";
    document.querySelector(".login-form").style.display = "block";
    toggleForms("lg-form");
  });
}
});
document.addEventListener("DOMContentLoaded", () => {
  // Check login state on page load
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  
  if (isLoggedIn) {
    displayDashboard();
  } else {
    toggleForms('login-form');
  }

  // Handle token and email in URL parameters for password reset
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  const token = urlParams.get('token');

  if (email && token) {
    toggleForms('new-password-form');
    document.querySelector('#new-password-form input[name="email"]').value = email;
    document.querySelector('#new-password-form input[name="token"]').value = token;
  }
});

// Function to toggle between forms
function toggleForms(formIdToShow) {
  const forms = document.querySelectorAll('.form-container');
  forms.forEach((form) => {
    form.style.display = 'none';
  });
  
  const selectedForm = document.getElementById(formIdToShow);
  if (selectedForm) {
    selectedForm.style.display = 'block';
  }
}

// Function to toggle password visibility
function togglePasswordVisibility(inputName) {
  const passwordField = document.querySelector(`input[name="${inputName}"]`);
  if (passwordField) {
    const eyeIcon = passwordField.nextElementSibling;
    if (passwordField.type === "password") {
      passwordField.type = "text";
      eyeIcon.classList.remove("fa-eye-slash");
      eyeIcon.classList.add("fa-eye");
    } else {
      passwordField.type = "password";
      eyeIcon.classList.remove("fa-eye");
      eyeIcon.classList.add("fa-eye-slash");
    }
  }
}

const scriptURL = 'https://script.google.com/macros/s/AKfycby-G8HRWbp-NcmB8z1zlTtoKCHcIZWxauu0-nJti_A4zP3JtbidKdTli2ayUiUs98E/exec';

function submitForm(action) {
  const formsAndButtons = {
    signup: { formId1: 'signup-form', buttonId: 'submit1' },
    login: { formId1: 'login-form', buttonId: 'submit' },
    generateToken: { formId1: 'reset-form', buttonId: 'submit2' },
    resetPassword: { formId1: 'new-password-form', buttonId: 'submit3' }
  };
  
  const config = formsAndButtons[action];
  if (!config) {
    showMessage("Invalid action specified", false);
    return;
  }

  const { formId1, buttonId } = config;
  const button = document.getElementById(buttonId);
  const originalText = button.textContent;

  // Show loading spinner
  button.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i>`;

  const form = document.getElementById(formId1);

  if (validateForm(form, action)) {
    const formData = new URLSearchParams(new FormData(form));
    formData.append("action", action);

    fetch(scriptURL, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        showMessage(data.message, data.result === "success");

        if (data.result === "success") {
          if (action === 'login') {
            // Show success message with overlay
            showMessageWithOverlay(
              "Login successful! Redirecting to dashboard...", 
              true
            );
            
            const username = form.querySelector('input[name="username"]').value;
            const password = form.querySelector('input[name="loginPassword"]').value;

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              loadDashboardData(username, password);
              displayDashboard();
            }, 3000);
          } else if (['signup', 'resetPassword', 'generateToken'].includes(action)) {
            let additionalMessage = "Please you can log in to your account.";

            if (action === 'signup') {
              additionalMessage = "Please now you log in to continue.";
            } else if (action === 'resetPassword') {
              additionalMessage = "Use your new password to log in.";
            } else if (action === 'generateToken') {
              additionalMessage = "Check reset token email that we have sent to your email address.";
            }

            showMessageWithOverlay(
              `${action.charAt(0).toUpperCase() + action.slice(1)} successful! ${additionalMessage}`, 
              true
            );
            toggleForms('lg-form');
          }
        } else {
          button.textContent = originalText;
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showMessage('Error connecting to server', false);
        button.textContent = originalText;
      });
  } else {
    button.textContent = originalText;
  }
}

function validateForm(form, action) {
  let isValid = true;

  form.querySelectorAll('input[required], select[required]').forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = 'red';
      showMessage(`${input.previousElementSibling.textContent} is required.`, false);
      isValid = false;
    } else {
      input.style.borderColor = '';
    }
  });

  if (action === 'signup' || action === 'resetPassword') {
    const password = form.querySelector('input[name="newPassword"], input[name="password"]');
    const confirmPassword = form.querySelector('input[name="newConfirmPassword"], input[name="confirmPassword"]');

    if (password && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+={}[\]:;"'<>,.?/-]{8,}$/.test(password.value.trim())) {
      password.style.borderColor = 'red';
      showMessage("Password must be at least 8 characters long and contain both letters and numbers.", false);
      isValid = false;
    } else if (password) {
      password.style.borderColor = '';
    }

    if (password && confirmPassword && password.value.trim() !== confirmPassword.value.trim()) {
      confirmPassword.style.borderColor = 'red';
      showMessage("Passwords do not match.", false);
      isValid = false;
    } else if (confirmPassword) {
      confirmPassword.style.borderColor = '';
    }
  }

  if ((action === 'signup' || action === 'resetPassword') && isValid) {
    const email = form.querySelector('input[name="email"]');
    if (email && !/^\S+@\S+\.\S+$/.test(email.value.trim())) {
      email.style.borderColor = 'red';
      showMessage("Please enter a valid email address.", false);
      isValid = false;
    } else if (email) {
      email.style.borderColor = '';
    }
  }

  if (action === 'signup' && isValid) {
    const phone = form.querySelector('input[name="phone"]');
    if (phone && !/^\+?[0-9]{10,15}$/.test(phone.value.trim())) {
      phone.style.borderColor = 'red';
      showMessage("Please enter a valid phone number.", false);
      isValid = false;
    } else if (phone) {
      phone.style.borderColor = '';
    }
  }

  if (action === 'login' && isValid) {
    const username = form.querySelector('input[name="username"]');
    const loginPassword = form.querySelector('input[name="loginPassword"]');

    if (!username || !username.value.trim()) {
      username.style.borderColor = 'red';
      showMessage("Username is required.", false);
      isValid = false;
    } else if (username) {
      username.style.borderColor = '';
    }

    if (!loginPassword || !loginPassword.value.trim()) {
      loginPassword.style.borderColor = 'red';
      showMessage("Password is required.", false);
      isValid = false;
    } else if (loginPassword) {
      loginPassword.style.borderColor = '';
    }
  }

  return isValid;
}

function showMessage(message, success = true) {
  const visibleForm = document.querySelector('.form-container[style*="display: block"]');
  if (!visibleForm) {
    console.error("No visible form found.");
    return;
  }

  const messageBox = visibleForm.querySelector(".message-box");
  messageBox.style.display = "block";
  messageBox.className = `message-box ${success ? "success" : "error"}`;
  messageBox.textContent = message;

  setTimeout(() => {
    messageBox.style.display = "none";
  }, 5000);
}

function showMessageWithOverlay(message, success = true, onComplete = null) {
  const visibleForm = document.querySelector('.form-container[style*="display: block"]');
  if (!visibleForm) {
    console.error("No visible form found.");
    return;
  }

  const messageBox = visibleForm.querySelector(".message-box");
  messageBox.style.display = "block";
  messageBox.className = `message-box ${success ? "success" : "error"}`;
  messageBox.textContent = message;

  if (success) {
    const overlay = document.createElement("div");
    overlay.className = "overlay-ms-bx";

    // Add animated background elements
    const animatedBg = document.createElement("div");
    animatedBg.className = "animated-background";
    animatedBg.innerHTML = `
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
      <div class="floating-shape shape-5"></div>
      <div class="floating-shape shape-6"></div>
      <div class="particle particle-1"></div>
      <div class="particle particle-2"></div>
      <div class="particle particle-3"></div>
      <div class="particle particle-4"></div>
      <div class="particle particle-5"></div>
      <div class="particle particle-6"></div>
      <div class="particle particle-7"></div>
      <div class="particle particle-8"></div>
    `;

    const messageBoxOverlay = document.createElement("div");
    messageBoxOverlay.className = "overlay-message-box";
    
    // Enhanced content with icon and progress bar
    messageBoxOverlay.innerHTML = `
      <div class="overlay-icon-container">
        <div class="icon-circle ${success ? 'success-circle' : 'error-circle'}">
          <i class="bi ${success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
          <div class="ripple-effect"></div>
          <div class="ripple-effect ripple-delay"></div>
        </div>
      </div>
      <h3 class="overlay-title">${success ? 'Success!' : 'Error!'}</h3>
      <p class="overlay-message">${message}</p>
      <div class="overlay-progress-bar">
        <div class="overlay-progress-fill"></div>
      </div>
      <button class="overlay-close-btn" onclick="this.closest('.overlay-ms-bx').remove()">
        <i class="bi bi-x-lg"></i>
      </button>
    `;

    overlay.appendChild(animatedBg);
    overlay.appendChild(messageBoxOverlay);
    document.body.appendChild(overlay);

    // Add styles if not already added
    if (!document.getElementById('overlay-message-styles')) {
      addOverlayMessageStyles();
    }

    // Auto-dismiss after 10 seconds
    const autoCloseTimeout = setTimeout(() => {
      if (document.body.contains(overlay)) {
        overlay.classList.add('fade-out-overlay');
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
          if (typeof onComplete === "function") {
            onComplete();
          }
        }, 300);
      }
    }, 10000);

    // Manual close button
    const closeBtn = messageBoxOverlay.querySelector('.overlay-close-btn');
    closeBtn.addEventListener('click', () => {
      clearTimeout(autoCloseTimeout);
      overlay.classList.add('fade-out-overlay');
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
        if (typeof onComplete === "function") {
          onComplete();
        }
      }, 300);
    });

  } else {
    setTimeout(() => {
      messageBox.style.display = "none";
    }, 5000);
  }
}

// Enhanced function to inject the styles with animated background
function addOverlayMessageStyles() {
  const style = document.createElement('style');
  style.id = 'overlay-message-styles';
  style.textContent = `
    .overlay-ms-bx {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(78, 204, 163, 0.1) 0%, rgba(46, 204, 113, 0.15) 100%);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      animation: fadeInOverlay 0.4s ease;
      padding: 20px;
      overflow: hidden;
    }

    @keyframes fadeInOverlay {
      from {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
      to {
        opacity: 1;
        backdrop-filter: blur(10px);
      }
    }

    .fade-out-overlay {
      animation: fadeOutOverlay 0.3s ease forwards;
    }

    @keyframes fadeOutOverlay {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    /* Animated Background Elements */
    .animated-background {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .floating-shape {
      position: absolute;
      border-radius: 50%;
      opacity: 0.15;
      filter: blur(40px);
    }

    .shape-1 {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, #4ecca3, #2ecc71);
      top: -100px;
      left: -100px;
      animation: float1 20s ease-in-out infinite;
    }

    .shape-2 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, #2ecc71, #4ecca3);
      bottom: -150px;
      right: -150px;
      animation: float2 25s ease-in-out infinite;
    }

    .shape-3 {
      width: 250px;
      height: 250px;
      background: linear-gradient(135deg, #4ecca3, #2ecc71);
      top: 50%;
      left: -125px;
      animation: float3 18s ease-in-out infinite;
    }

    .shape-4 {
      width: 350px;
      height: 350px;
      background: linear-gradient(135deg, #2ecc71, #4ecca3);
      top: 20%;
      right: -100px;
      animation: float4 22s ease-in-out infinite;
    }

    .shape-5 {
      width: 200px;
      height: 200px;
      background: linear-gradient(135deg, #4ecca3, #2ecc71);
      bottom: 30%;
      left: 20%;
      animation: float5 15s ease-in-out infinite;
    }

    .shape-6 {
      width: 280px;
      height: 280px;
      background: linear-gradient(135deg, #2ecc71, #4ecca3);
      top: 60%;
      right: 15%;
      animation: float6 19s ease-in-out infinite;
    }

    @keyframes float1 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(100px, 50px) rotate(90deg); }
      50% { transform: translate(50px, 100px) rotate(180deg); }
      75% { transform: translate(-50px, 50px) rotate(270deg); }
    }

    @keyframes float2 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(-80px, -80px) rotate(120deg); }
      66% { transform: translate(-120px, 60px) rotate(240deg); }
    }

    @keyframes float3 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(150px, -100px) scale(1.2); }
    }

    @keyframes float4 {
      0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
      50% { transform: translate(-100px, 100px) rotate(180deg) scale(0.8); }
    }

    @keyframes float5 {
      0%, 100% { transform: translate(0, 0); }
      25% { transform: translate(60px, -60px); }
      50% { transform: translate(-60px, -80px); }
      75% { transform: translate(80px, 40px); }
    }

    @keyframes float6 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      50% { transform: translate(-120px, -80px) rotate(360deg); }
    }

    /* Particles */
    .particle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #4ecca3;
      border-radius: 50%;
      opacity: 0.6;
      box-shadow: 0 0 10px rgba(78, 204, 163, 0.8);
    }

    .particle-1 {
      top: 20%;
      left: 15%;
      animation: particle-float 8s ease-in-out infinite;
    }

    .particle-2 {
      top: 40%;
      left: 80%;
      animation: particle-float 10s ease-in-out infinite 1s;
    }

    .particle-3 {
      top: 60%;
      left: 25%;
      animation: particle-float 12s ease-in-out infinite 2s;
    }

    .particle-4 {
      top: 80%;
      left: 70%;
      animation: particle-float 9s ease-in-out infinite 1.5s;
    }

    .particle-5 {
      top: 30%;
      left: 50%;
      animation: particle-float 11s ease-in-out infinite 0.5s;
    }

    .particle-6 {
      top: 70%;
      left: 45%;
      animation: particle-float 13s ease-in-out infinite 2.5s;
    }

    .particle-7 {
      top: 50%;
      left: 90%;
      animation: particle-float 10s ease-in-out infinite 3s;
    }

    .particle-8 {
      top: 90%;
      left: 30%;
      animation: particle-float 14s ease-in-out infinite 1s;
    }

    @keyframes particle-float {
      0%, 100% {
        transform: translate(0, 0) scale(1);
        opacity: 0.6;
      }
      25% {
        transform: translate(30px, -30px) scale(1.5);
        opacity: 0.8;
      }
      50% {
        transform: translate(-20px, -60px) scale(0.8);
        opacity: 0.4;
      }
      75% {
        transform: translate(40px, -40px) scale(1.2);
        opacity: 0.7;
      }
    }

    .overlay-message-box {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 24px;
      padding: 50px 40px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15), 
                  0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      position: relative;
      animation: slideUpBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      z-index: 1;
    }

    @keyframes slideUpBounce {
      0% {
        opacity: 0;
        transform: translateY(50px) scale(0.8);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .overlay-icon-container {
      margin-bottom: 25px;
      position: relative;
    }

    .icon-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      animation: scaleInBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      position: relative;
      z-index: 2;
    }

    @keyframes scaleInBounce {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.15);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .success-circle {
      background: linear-gradient(135deg, #4ecca3 0%, #2ecc71 100%);
      box-shadow: 0 8px 25px rgba(78, 204, 163, 0.4),
                  0 0 0 0 rgba(78, 204, 163, 0.4);
      animation: scaleInBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55),
                 pulse 2s ease-in-out infinite 1s;
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 8px 25px rgba(78, 204, 163, 0.4),
                    0 0 0 0 rgba(78, 204, 163, 0.4);
      }
      50% {
        box-shadow: 0 8px 25px rgba(78, 204, 163, 0.6),
                    0 0 0 20px rgba(78, 204, 163, 0);
      }
    }

    .error-circle {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
      box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
    }

    /* Ripple effect */
    .ripple-effect {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid rgba(78, 204, 163, 0.6);
      transform: translate(-50%, -50%);
      animation: ripple 2s ease-out infinite;
    }

    .ripple-delay {
      animation-delay: 1s;
    }

    @keyframes ripple {
      0% {
        width: 100%;
        height: 100%;
        opacity: 1;
      }
      100% {
        width: 200%;
        height: 200%;
        opacity: 0;
      }
    }

    .icon-circle i {
      font-size: 50px;
      color: white;
      animation: iconPop 0.6s ease 0.3s both;
      position: relative;
      z-index: 3;
    }

    @keyframes iconPop {
      0% {
        transform: scale(0) rotate(-180deg);
      }
      50% {
        transform: scale(1.2) rotate(10deg);
      }
      100% {
        transform: scale(1) rotate(0deg);
      }
    }

    .overlay-title {
      margin: 0 0 15px 0;
      font-size: 32px;
      font-weight: 700;
      color: #1a1a2e;
      animation: fadeInUp 0.5s ease 0.4s both;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .overlay-message {
      margin: 0 0 30px 0;
      font-size: 16px;
      line-height: 1.6;
      color: #666;
      animation: fadeInUp 0.5s ease 0.5s both;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .overlay-progress-bar {
      width: 100%;
      height: 6px;
      background: rgba(233, 236, 239, 0.5);
      border-radius: 10px;
      overflow: hidden;
      margin-top: 25px;
      animation: fadeInUp 0.5s ease 0.6s both;
      position: relative;
    }

    .overlay-progress-bar::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 255, 255, 0.3) 50%, 
        transparent 100%);
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .overlay-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4ecca3 0%, #2ecc71 100%);
      border-radius: 10px;
      animation: progressAnimation 10s linear forwards;
      box-shadow: 0 0 15px rgba(78, 204, 163, 0.6);
      position: relative;
    }

    @keyframes progressAnimation {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    .overlay-close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(248, 249, 250, 0.8);
      backdrop-filter: blur(10px);
      color: #666;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-size: 18px;
      z-index: 10;
    }

    .overlay-close-btn:hover {
      background: rgba(233, 236, 239, 0.9);
      color: #333;
      transform: rotate(90deg);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .overlay-close-btn:active {
      transform: rotate(90deg) scale(0.95);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .overlay-ms-bx {
        padding: 15px;
      }

      .overlay-message-box {
        padding: 40px 30px 30px;
        border-radius: 20px;
        max-width: 100%;
      }

      .icon-circle {
        width: 80px;
        height: 80px;
      }

      .icon-circle i {
        font-size: 40px;
      }

      .overlay-title {
        font-size: 26px;
        margin-bottom: 12px;
      }

      .overlay-message {
        font-size: 15px;
        margin-bottom: 25px;
      }

      .overlay-progress-bar {
        height: 5px;
        margin-top: 20px;
      }

      .overlay-close-btn {
        width: 36px;
        height: 36px;
        top: 15px;
        right: 15px;
        font-size: 16px;
      }

      .floating-shape {
        filter: blur(30px);
      }
    }

    @media (max-width: 480px) {
      .overlay-message-box {
        padding: 35px 25px 25px;
        border-radius: 16px;
      }

      .icon-circle {
        width: 70px;
        height: 70px;
      }

      .icon-circle i {
        font-size: 35px;
      }

      .overlay-title {
        font-size: 24px;
        margin-bottom: 10px;
      }

      .overlay-message {
        font-size: 14px;
        margin-bottom: 20px;
        line-height: 1.5;
      }

      .overlay-progress-bar {
        height: 4px;
        margin-top: 18px;
      }

      .overlay-close-btn {
        width: 32px;
        height: 32px;
        top: 12px;
        right: 12px;
        font-size: 14px;
      }

      .floating-shape {
        filter: blur(25px);
      }

      .particle {
        width: 6px;
        height: 6px;
      }
    }

    /* Accessibility - Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .overlay-ms-bx,
      .overlay-message-box,
      .icon-circle,
      .icon-circle i,
      .overlay-title,
      .overlay-message,
      .overlay-progress-bar,
      .floating-shape,
      .particle,
      .ripple-effect {
        animation: none !important;
      }

      .overlay-close-btn:hover {
        transform: none;
      }

      .success-circle {
        animation: scaleInBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// Global Variables
let email, notification, phone, schoolindex, schoolname, usermessage, globalUsername;

async function loadDashboardData(username, password) {
  try {
    const action = 'login';
    const response = await fetch(`${scriptURL}?action=${action}&username=${username}&loginPassword=${password}`);
    const rawResponse = await response.text();

    const parsedResponse = JSON.parse(rawResponse);
    const dashboardData = parsedResponse.dashboardData;

    email = dashboardData.email || "Not Provided";
    phone = dashboardData.phone || "Not Provided";
    schoolindex = dashboardData.schoolindex || "N/A";
    schoolname = dashboardData.schoolname || "Unknown School";
    usermessage = dashboardData.usermessage || "No message available";
    globalUsername = dashboardData.username || "Guest";

    if (parsedResponse.result === "success") {
      updateDashboardUI(dashboardData);
    } else {
      console.error("Error:", parsedResponse.message);
      showMessage(parsedResponse.message || "Unknown error", false);
    }
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    showMessage("Failed to load dashboard data. Please try again later.", false);
  }
}

function updateDashboardUI(data) {
    // Update school name in top bar
    const schoolNameElement = document.getElementById('schoolName');
    if (schoolNameElement) {
        schoolNameElement.textContent = data.schoolname || "Unknown School";
    }

    // Update region name in top bar
    const regionNameElement = document.getElementById('regionName');
    if (regionNameElement) {
        regionNameElement.textContent = data.schoolindex || "N/A";
    }

    // Update user name in top bar
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = data.username || "Admin";
    }

    // Update notification count
    const notificationCountElement = document.getElementById('notificationCount');
    if (notificationCountElement) {
        const notifications = Array.isArray(data.notification) ? data.notification : [data.notification].filter(Boolean);
        notificationCountElement.textContent = notifications.length || 0;
    }

    // Update message count
    const messageCountElement = document.getElementById('messageCount');
    if (messageCountElement) {
        const messages = Array.isArray(data.usermessage) ? data.usermessage : [data.usermessage].filter(Boolean);
        messageCountElement.textContent = messages.length || 0;
    }

    // Update share link - store link but don't display it
    let shareableLink = '';
    if (data.schoolindex) {
        shareableLink = `https://www.academixpoint.com/p/${data.schoolindex.toLowerCase()}-teachers-feeding-area.html`;
    }

    // Setup share link section with copy button
    const shareLinkSection = document.getElementById('shareLinkSection');
    if (shareLinkSection && shareableLink) {
        shareLinkSection.innerHTML = `
            <p>Share this link with officemates:</p>
            <div class='link-text'>
                <i class='bi bi-link-45deg'></i>
                <button style="background: none; border: none; color: #4ecca3; font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 5px; padding: 0;">
                    <i class='bi bi-clipboard'></i>
                    <span>Copy Link</span>
                </button>
            </div>
        `;
        
        // Add click handler to copy button
        const copyButton = shareLinkSection.querySelector('button');
        copyButton.addEventListener('click', function() {
            navigator.clipboard.writeText(shareableLink).then(() => {
                const toast = document.getElementById('copyToast');
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            }).catch(err => {
                console.error('Failed to copy link:', err);
                alert('Failed to copy link. Please try again.');
            });
        });
    }

    
}

function displayDashboard() {
  toggleDashboard();
  setupDashboardInteractions();
}

function toggleDashboard() {
  const dashboardStyles = () => {
    const dashboardStyle = document.createElement("style");
    dashboardStyle.textContent = `
      body {
        position: relative;
        font-family: 'Roboto', Arial, sans-serif;
        background: #fff;
        color: var(--default-color);
        overflow-y: auto;
        margin: 0;
      }

      body::before {
        content: '';
        width: 100%;
        height: 100%;
      }
    `;
    document.head.appendChild(dashboardStyle);
  };

  document.getElementById("header").style.display = "none";
  dashboardStyles();
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("main-id").style.display = "none";
  document.querySelector(".footer").style.display = "none";
  document.querySelector(".footer-bottom").style.display = "none";
  document.querySelector(".login-form").style.display = "none";
}

function setupDashboardInteractions() {
  // Sidebar toggle functionality
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const mainContent = document.getElementById('mainContent');
  const menuToggle = document.getElementById('menuToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      mainContent.classList.toggle('expanded');
      const icon = sidebarToggle.querySelector('i');
      if (sidebar.classList.contains('collapsed')) {
        icon.classList.remove('bi-chevron-left');
        icon.classList.add('bi-chevron-right');
      } else {
        icon.classList.remove('bi-chevron-right');
        icon.classList.add('bi-chevron-left');
      }
    });
  }

  // Mobile menu toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      sidebarOverlay.classList.toggle('active');
    });
  }

  // Close sidebar when overlay is clicked
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Close plan banner
  const closeBanner = document.getElementById('closeBanner');
  const planBanner = document.getElementById('planBanner');
  if (closeBanner && planBanner) {
    closeBanner.addEventListener('click', () => {
      planBanner.style.display = 'none';
    });
  }

  // Logout functionality
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('isLoggedIn');
      location.reload();
    });
  }

  // Menu item active state
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', function(e) {
      // Only prevent default if it's not a link that should navigate
      const section = this.getAttribute('data-section');
      if (section && !this.id) {
        e.preventDefault();
      }
      
      menuItems.forEach(mi => mi.classList.remove('active'));
      this.classList.add('active');
      
      // Close mobile menu after selection
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
      }
    });
  });

  // Notification button click - show actual notifications
  const notificationBtn = document.getElementById('notificationBtn');
  if (notificationBtn) {
    notificationBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Remove message popup if open
      const existingMessagePopup = document.querySelector('[data-popup="message"]');
      if (existingMessagePopup) existingMessagePopup.remove();
      
      // Toggle notification popup
      const existingPopup = document.querySelector('[data-popup="notification"]');
      if (existingPopup) {
        existingPopup.remove();
        return;
      }
      
      const notifications = Array.isArray(notification) ? notification : [notification].filter(Boolean);
      
      // Create popup container
      const popup = document.createElement('div');
      popup.setAttribute('data-popup', 'notification');
      popup.className = 'notification-popup';
      
      // Create popup content
      let contentHTML = `
        <div class="popup-header">
          <h4><i class="bi bi-bell"></i> Notifications</h4>
          <button class="popup-close" onclick="this.closest('[data-popup]').remove()">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="popup-body">
      `;
      
      if (notifications.length > 0) {
        notifications.forEach((note, index) => {
          contentHTML += `
            <div class="popup-item">
              <div class="popup-item-icon">
                <i class="bi bi-info-circle"></i>
              </div>
              <div class="popup-item-content">
                <p>${note}</p>
                <span class="popup-item-time">Just now</span>
              </div>
            </div>
          `;
        });
      } else {
        contentHTML += `
          <div class="popup-empty">
            <i class="bi bi-bell-slash"></i>
            <p>No notifications available</p>
          </div>
        `;
      }
      
      contentHTML += '</div>';
      popup.innerHTML = contentHTML;
      document.body.appendChild(popup);
      
      // Add styles if not already added
      if (!document.getElementById('popup-styles')) {
        addPopupStyles();
      }
    });
  }

  // Message button click - show actual messages
  const messageBtn = document.getElementById('messageBtn');
  if (messageBtn) {
    messageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Remove notification popup if open
      const existingNotificationPopup = document.querySelector('[data-popup="notification"]');
      if (existingNotificationPopup) existingNotificationPopup.remove();
      
      // Toggle message popup
      const existingPopup = document.querySelector('[data-popup="message"]');
      if (existingPopup) {
        existingPopup.remove();
        return;
      }
      
      const messages = Array.isArray(usermessage) ? usermessage : [usermessage].filter(Boolean);
      
      // Create popup container
      const popup = document.createElement('div');
      popup.setAttribute('data-popup', 'message');
      popup.className = 'notification-popup';
      
      // Create popup content
      let contentHTML = `
        <div class="popup-header">
          <h4><i class="bi bi-chat-dots"></i> Messages</h4>
          <button class="popup-close" onclick="this.closest('[data-popup]').remove()">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="popup-body">
      `;
      
      if (messages.length > 0) {
        messages.forEach((msg, index) => {
          contentHTML += `
            <div class="popup-item">
              <div class="popup-item-icon message-icon">
                <i class="bi bi-envelope"></i>
              </div>
              <div class="popup-item-content">
                <p>${msg}</p>
                <span class="popup-item-time">Just now</span>
              </div>
            </div>
          `;
        });
      } else {
        contentHTML += `
          <div class="popup-empty">
            <i class="bi bi-chat-slash"></i>
            <p>No messages available</p>
          </div>
        `;
      }
      
      contentHTML += '</div>';
      popup.innerHTML = contentHTML;
      document.body.appendChild(popup);
      
      // Add styles if not already added
      if (!document.getElementById('popup-styles')) {
        addPopupStyles();
      }
    });
  }
  
  // Close popups when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-popup]') && !e.target.closest('.icon-btn')) {
      const popups = document.querySelectorAll('[data-popup]');
      popups.forEach(popup => popup.remove());
    }
  });

  // User profile click
  const userProfile = document.getElementById('userProfile');
  if (userProfile) {
    userProfile.addEventListener('click', () => {
      alert('Profile settings coming soon!');
    });
  }
}

// Function to add popup styles
function addPopupStyles() {
  const style = document.createElement('style');
  style.id = 'popup-styles';
  style.textContent = `
    .notification-popup {
      position: fixed;
      top: 70px;
      right: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 100000;
      max-width: 420px;
      width: calc(100% - 40px);
      max-height: calc(100vh - 100px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.3s ease;
    }
    
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e9ecef;
      background: #f8f9fa;
    }
    
    .popup-header h4 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a2e;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .popup-header h4 i {
      color: #4ecca3;
      font-size: 20px;
    }
    
    .popup-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.3s ease;
    }
    
    .popup-close:hover {
      background: #e9ecef;
      color: #333;
    }
    
    .popup-body {
      overflow-y: auto;
      max-height: calc(100vh - 180px);
    }
    
    .popup-item {
      display: flex;
      gap: 15px;
      padding: 15px 20px;
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.2s ease;
      cursor: pointer;
    }
    
    .popup-item:hover {
      background: #f8f9fa;
    }
    
    .popup-item:last-child {
      border-bottom: none;
    }
    
    .popup-item-icon {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      background: #e3f2fd;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2088bd;
      font-size: 18px;
    }
    
    .popup-item-icon.message-icon {
      background: #e8f5e9;
      color: #28a745;
    }
    
    .popup-item-content {
      flex: 1;
      min-width: 0;
    }
    
    .popup-item-content p {
      margin: 0 0 5px 0;
      font-size: 14px;
      color: #333;
      line-height: 1.5;
      word-wrap: break-word;
    }
    
    .popup-item-time {
      font-size: 12px;
      color: #999;
    }
    
    .popup-empty {
      padding: 40px 20px;
      text-align: center;
      color: #999;
    }
    
    .popup-empty i {
      font-size: 48px;
      margin-bottom: 15px;
      opacity: 0.5;
    }
    
    .popup-empty p {
      margin: 0;
      font-size: 14px;
    }
    
    /* Responsive styles */
    @media (max-width: 768px) {
      .notification-popup {
        top: 60px;
        right: 10px;
        left: 10px;
        width: calc(100% - 20px);
        max-width: none;
        border-radius: 8px;
      }
      
      .popup-header {
        padding: 15px;
      }
      
      .popup-header h4 {
        font-size: 16px;
      }
      
      .popup-item {
        padding: 12px 15px;
      }
      
      .popup-item-icon {
        width: 36px;
        height: 36px;
        min-width: 36px;
        font-size: 16px;
      }
      
      .popup-item-content p {
        font-size: 13px;
      }
      
      .popup-body {
        max-height: calc(100vh - 150px);
      }
    }
    
    @media (max-width: 480px) {
      .notification-popup {
        top: 55px;
        max-height: calc(100vh - 70px);
      }
      
      .popup-header {
        padding: 12px 15px;
      }
      
      .popup-header h4 {
        font-size: 15px;
        gap: 8px;
      }
      
      .popup-header h4 i {
        font-size: 18px;
      }
      
      .popup-close {
        font-size: 20px;
        width: 28px;
        height: 28px;
      }
      
      .popup-item {
        gap: 12px;
        padding: 10px 15px;
      }
      
      .popup-item-icon {
        width: 32px;
        height: 32px;
        min-width: 32px;
        font-size: 14px;
      }
      
      .popup-item-content p {
        font-size: 12px;
      }
      
      .popup-item-time {
        font-size: 11px;
      }
      
      .popup-empty {
        padding: 30px 15px;
      }
      
      .popup-empty i {
        font-size: 40px;
      }
      
      .popup-body {
        max-height: calc(100vh - 130px);
      }
    }
  `;
  document.head.appendChild(style);
}
