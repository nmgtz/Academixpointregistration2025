document.addEventListener("DOMContentLoaded", () => {
  // Function to apply styles dynamically
  const applyStyles = () => {
  const style = document.createElement("style");
  style.textContent = `
    body {
      font-family: 'Roboto', Arial, sans-serif;
      background: url("https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjy2cfaQRRkMgdUGuc-4HskPmN9ShQ5ogiRyvKHeN5kBwG-FA2FKqTvim76kcf-1FiAyV7kheyfOkcoWSjybLmp2Y_o0Mp9IK-l8K9fFsy5bG1xlsOriUJa5KfctpIt8dOcMmZ5eaJmMuQByNHFhTmXx8GWwDtYnCMPefJjr6GgOwQDbBttfTpn0Oj-RF2S/s1600/students%201.jpg");
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      color: var(--default-color);
      min-height: 100vh;
      overflow-y: auto;
    }

    body::before {
      content: '';
      position: fixed;
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
  const toggleVisibility = () => {
    const whatsapp = document.getElementById("whatsapp");
    const facebook = document.getElementById("facebook");
    const share = document.getElementById("share");
    const sms = document.getElementById("sms");
    const globe = document.getElementById("globe");
    const close = document.getElementById("close");
    const x = document.getElementById("x");

    if (whatsapp && facebook && share && sms && globe && close) {
      const isGlobeVisible = globe.style.display !== "none";
      whatsapp.style.display = isGlobeVisible ? "block" : "none";
      facebook.style.display = isGlobeVisible ? "block" : "none";
      share.style.display = isGlobeVisible ? "block" : "none";
      sms.style.display = isGlobeVisible ? "block" : "none";
      globe.style.display = isGlobeVisible ? "none" : "block";
      close.style.display = isGlobeVisible ? "block" : "none";
      x.style.display = isGlobeVisible ? "block" : "none";
    }
  };

  const hideButtonsExceptGlobe = () => {
    const whatsapp = document.getElementById("whatsapp");
    const facebook = document.getElementById("facebook");
    const share = document.getElementById("share");
    const sms = document.getElementById("sms");
    const close = document.getElementById("close");
    const globe = document.getElementById("globe");
    const x = document.getElementById("x");

    if (whatsapp && facebook && share && sms && close && globe) {
      whatsapp.style.display = "none";
      facebook.style.display = "none";
      share.style.display = "none";
      sms.style.display = "none";
      close.style.display = "none";
      globe.style.display = "block";
      x.style.display = "none";
    }
  };

  const globe = document.getElementById("globe");
  if (globe) {
    globe.addEventListener("click", (e) => {
      e.preventDefault();
      toggleVisibility();
    });
  }

  const close = document.getElementById("close");
  if (close) {
    close.addEventListener("click", (e) => {
      e.preventDefault();
      hideButtonsExceptGlobe();
    });
  }

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
  if (phoneLink && popup1 && overlay1) {
    phoneLink.addEventListener("click", showPopup1);

    // Hide the popup and overlay when the overlay is clicked
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

  // Function to show the popup and overlay
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
    e.stopPropagation();
    e.preventDefault();
    
    // Close popup first
    if (popup) popup.style.display = "none";
    if (overlay) overlay.style.display = "none";
    
    // Hide other sections
    const header = document.getElementById("header");
    const dashboard = document.getElementById("dashboard");
    const mainId = document.getElementById("main-id");
    const footer = document.querySelector(".footer");
    const footerBottom = document.querySelector(".footer-bottom");
    
    if (header) header.style.display = "none";
    if (dashboard) dashboard.style.display = "none";
    if (mainId) mainId.style.display = "none";
    if (footer) footer.style.display = "none";
    if (footerBottom) footerBottom.style.display = "none";
    
    // Apply background styles
    applyStyles();
    
    // Show login form container
    const loginFormContainer = document.querySelector(".login-form");
    if (loginFormContainer) {
      loginFormContainer.style.display = "block";
    }
    
    // Hide all form containers first
    const allForms = document.querySelectorAll('.form-container');
    allForms.forEach(form => {
      form.style.display = 'none';
    });
    
    // Show ONLY the login form
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.style.display = "block";
      console.log("Login form displayed");
    } else {
      console.error("Login form (lg-form) not found!");
    }
  });

  registerButton.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Close popup first
    if (popup) popup.style.display = "none";
    if (overlay) overlay.style.display = "none";
    
    // Hide other sections
    const header = document.getElementById("header");
    const dashboard = document.getElementById("dashboard");
    const mainId = document.getElementById("main-id");
    const footer = document.querySelector(".footer");
    const footerBottom = document.querySelector(".footer-bottom");
    
    if (header) header.style.display = "none";
    if (dashboard) dashboard.style.display = "none";
    if (mainId) mainId.style.display = "none";
    if (footer) footer.style.display = "none";
    if (footerBottom) footerBottom.style.display = "none";
    
    // Apply background styles
    applyStyles();
    
    // Show login form container
    const loginFormContainer = document.querySelector(".login-form");
    if (loginFormContainer) {
      loginFormContainer.style.display = "block";
    }
    
    // Hide all form containers first
    const allForms = document.querySelectorAll('.form-container');
    allForms.forEach(form => {
      form.style.display = 'none';
    });
    
    // Show ONLY the signup form
    const signupForm = document.getElementById("sp-form");
    if (signupForm) {
      signupForm.style.display = "block";
      console.log("Signup form displayed");
    } else {
      console.error("Signup form (sp-form) not found!");
    }
  });
} else {
  console.error("Login or register button elements not found");
}

  // Check login state on page load
  (async () => {
    const storedLoginStateResult = await window.storage.get("isLoggedIn");
    const loginTimestampResult = await window.storage.get("loginTimestamp");
    const isLoggedIn = storedLoginStateResult ? storedLoginStateResult.value === "true" : false;
    const loginTimestamp = loginTimestampResult ? loginTimestampResult.value : null;

    const sessionDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    if (isLoggedIn && loginTimestamp) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - parseInt(loginTimestamp);
      
      if (elapsedTime < sessionDuration) {
        // Session is still valid, restore dashboard
        const restored = await restoreDashboardFromStorage();
        if (restored) {
          displayDashboard();
        } else {
          // If restoration failed, clear and show login
          await clearSessionData();
          toggleForms('lg-form');
        }
      } else {
        // Session expired, clear data and redirect
        await clearSessionData();
        window.location.href = 'https://www.academixpoint.com/';
      }
    }

    // Handle token and email in URL parameters for password reset
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const token = urlParams.get('token');

    if (email && token) {
      toggleForms('newSet-form');
      document.querySelector('#newSet-form input[name="email"]').value = email;
      document.querySelector('#newSet-form input[name="token"]').value = token;
    }
  })();
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
      if (eyeIcon && eyeIcon.classList) {
        eyeIcon.classList.remove("fa-eye-slash");
        eyeIcon.classList.add("fa-eye");
      }
    } else {
      passwordField.type = "password";
      if (eyeIcon && eyeIcon.classList) {
        eyeIcon.classList.remove("fa-eye");
        eyeIcon.classList.add("fa-eye-slash");
      }
    }
  }
}

const scriptURL = 'https://script.google.com/macros/s/AKfycbwZIr1_0gW2Xl_8DYYqfV8k8cwkJuu0bUetugHecv36C0eOFYv2wKGMMh1C2EZenpDE/exec';

async function submitForm(action) {
  const formId = (action === 'signup') ? 'signup-form' :
                 (action === 'login') ? 'login-form' :
                 (action === 'generateToken') ? 'reset-form' :
                 (action === 'resetPassword') ? 'new-password-form' : null;
const formsAndButtons = {
    signup: { formId1: 'signup-form', buttonId: 'submit1' },
    login: { formId1: 'login-form', buttonId: 'submit' },
    generateToken: { formId1: 'reset-form', buttonId: 'submit2' },
    resetPassword: { formId1: 'new-password-form', buttonId: 'submit3' }
  };
const config = formsAndButtons[action];
const { formId1, buttonId } = config;
  const button = document.getElementById(buttonId);
  const originalText = button.textContent;

  // Show loading spinner
  button.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i>`;

  if (!formId) {
    showMessage("Invalid action specified", false);
    return;
  }

  const form = document.getElementById(formId);

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
      .then(async (data) => {  // ← ADD async HERE
  showMessage(data.message, data.result === "success");

  if (data.result === "success") {
    if (action === 'login') {
      isLoggedIn = true;
      await window.storage.set('loginTimestamp', Date.now().toString(), false);

    // Show success message with overlay
    showMessageWithOverlay(
      "Login successful! Loading dashboard...", 
      true
    );
    
    // Retrieve username and password from form
    const username = form.querySelector('input[name="username"]').value;
    const password = form.querySelector('input[name="loginPassword"]').value;
    
    // Optionally store password (encrypted in production!)
    await window.storage.set('password', password, false);

    // Load dashboard data FIRST, then display
    setTimeout(async () => {
      try {
        const dataLoaded = await loadDashboardData(username, password);
        if (dataLoaded) {
          displayDashboard(); // Only display after data is loaded
        } else {
          showMessage('Failed to load dashboard data', false);
          button.textContent = originalText;
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        showMessage('Failed to load dashboard data', false);
        button.textContent = originalText;
      }
    }, 2000);
    
  } else if (['signup', 'resetPassword', 'generateToken'].includes(action)) {
   let additionalMessage = "Please you can log in to your account.";

    // Adjust the last part of the message based on the action
    if (action === 'signup') {
        additionalMessage = "Please now you log in to continue.";
    } else if (action === 'resetPassword') {
        additionalMessage = "Use your new password to log in.";
    } else if (action === 'generateToken') {
        additionalMessage = "Check reset token email that we have sent to your email address.";
    }

    // Show the message with the dynamic part
    showMessageWithOverlay(
      `${action.charAt(0).toUpperCase() + action.slice(1)} successful! ${additionalMessage}`, 
      true
    );
    toggleForms('lg-form');
    button.textContent = originalText;
  }
 } else {
          button.textContent = originalText; // Restore button text on failure
        }
      })
      .catch(error => {
        console.error('Error:', error); // Log the error for debugging
        showMessage('Error connecting to server', false); // Notify the user
        button.textContent = originalText;
      });
  } else {
    button.textContent = originalText;
  }
}

function validateForm(form, action) {
  let isValid = true;

  // General required field validation
  form.querySelectorAll('input[required], select[required]').forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = 'red'; // Highlight empty required fields
      showMessage(`${input.previousElementSibling.textContent} is required.`, false);
      isValid = false;
    } else {
      input.style.borderColor = ''; // Reset border color if valid
    }
  });

  // Additional validation logic based on action
  if (action === 'signup' || action === 'resetPassword') {
    const password = form.querySelector('input[name="newPassword"], input[name="password"]');
    const confirmPassword = form.querySelector('input[name="newConfirmPassword"], input[name="confirmPassword"]');

    // Password strength validation
    if (password && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+={}[\]:;"'<>,.?/-]{8,}$/.test(password.value.trim())) {
      password.style.borderColor = 'red';
      showMessage("Password must be at least 8 characters long and contain both letters and numbers.", false);
      isValid = false;
    } else if (password) {
      password.style.borderColor = '';
    }

    // Password match validation
    if (password && confirmPassword && password.value.trim() !== confirmPassword.value.trim()) {
      confirmPassword.style.borderColor = 'red';
      showMessage("Passwords do not match.", false);
      isValid = false;
    } else if (confirmPassword) {
      confirmPassword.style.borderColor = '';
    }
  }

  // Email validation for signup and reset password forms
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

  // Phone number validation for signup
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

  // Specific validation for login form
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

  // Show message box
  const messageBox = visibleForm.querySelector(".message-box");
  messageBox.style.display = "block";
  messageBox.className = `message-box ${success ? "success" : "error"}`;
  messageBox.textContent = message;

  // If success, create overlay
 if (success) {
  const overlay = document.createElement("div");
  overlay.className = "overlay-ms-bx"; // Assign CSS class to the overlay

  const messageBox = document.createElement("div");
  messageBox.className = "overlay-message-box"; // Assign CSS class for the message box
  messageBox.textContent = message;

  overlay.appendChild(messageBox); // Add the message box to the overlay
  document.body.appendChild(overlay);

  // Remove overlay after 10 seconds
  setTimeout(() => {
    document.body.removeChild(overlay);
    if (typeof onComplete === "function") {
      onComplete(); // Execute the provided callback function
    }
  }, 10000); // 10 seconds
}

 else {
    // Hide the error message after 5 seconds
    setTimeout(() => {
      messageBox.style.display = "none";
    }, 5000);
  }
}



// ===== PART 1: GLOBAL VARIABLES (Must be declared first) =====
let email, notification, phone, schoolindex, schoolname, usermessage, globalUsername, isLoggedIn = false;

// ===== PART 2: MAIN DASHBOARD FUNCTIONS =====

function displayDashboard() {
    toggleDashboard();

 startSessionMonitoring();
    // Wait a bit for DOM to be ready, then load user data
    setTimeout(() => {
        if (typeof window.loadUserData === 'function') {
            window.loadUserData();
        }
    }, 200);
    
    const buttons = [
        { buttonId: "user-dashboard", targetClass: ".user" },
        { buttonId: "notification-dashboard", targetClass: ".notification" },
        { buttonId: "message-dashboard", targetClass: ".message" },
    ];

    const targets = buttons.map(({ targetClass }) => document.querySelector(targetClass));

    buttons.forEach(({ buttonId, targetClass }) => {
        const button = document.getElementById(buttonId);
        const target = document.querySelector(targetClass);

        if (button && target) {
            button.addEventListener("click", (e) => {
                e.preventDefault();
                target.style.display = target.style.display === "block" ? "none" : "block";
            });
        }
    });

    // Hide elements when clicking outside
    document.addEventListener("click", (e) => {
        const clickedInside = buttons.some(({ buttonId, targetClass }) => {
            const button = document.getElementById(buttonId);
            const target = document.querySelector(targetClass);
            return button && target && (button.contains(e.target) || target.contains(e.target));
        });

        if (!clickedInside) {
            targets.forEach((target) => {
                if (target) {
                    target.style.display = "none";
                }
            });
        }
    });
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

// Function to restore dashboard from localStorage
async function restoreDashboardFromStorage() {
    const storedDataResult = await window.storage.get('dashboardData');
    const storedData = storedDataResult ? storedDataResult.value : null;
    
    if (storedData) {
        try {
            const dashboardData = JSON.parse(storedData);
            
            // Restore global variables
            email = dashboardData.email || "Not Provided";
            phone = dashboardData.phone || "Not Provided";
            schoolindex = dashboardData.schoolindex || "N/A";
            schoolname = dashboardData.schoolname || "Unknown School";
            usermessage = dashboardData.usermessage || "No message available";
            globalUsername = dashboardData.username || "Guest";
            notification = dashboardData.notification || "No notification";
            
            console.log('Dashboard data restored from localStorage');
            
            // Update UI with restored data
            updateDashboardUI(dashboardData);
            
            return true;
        } catch (error) {
            console.error('Error restoring dashboard data:', error);
            return false;
        }
    }
    return false;
}

// Function to clear session data
async function clearSessionData() {
    await window.storage.delete('username', false);
    await window.storage.delete('password', false);
    await window.storage.delete('isLoggedIn', false);
    await window.storage.delete('dashboardData', false);
    await window.storage.delete('loginTimestamp', false);
    
    // Clear global variables
    email = null;
    notification = null;
    phone = null;
    schoolindex = null;
    schoolname = null;
    usermessage = null;
    globalUsername = null;
    
    console.log('Session data cleared');
}

// Function to check session validity periodically
function startSessionMonitoring() {
  setInterval(async () => { 
const loginTimestampResult = await window.storage.get("loginTimestamp");
const loginTimestamp = loginTimestampResult ? loginTimestampResult.value : null;
        const sessionDuration = 30 * 60 * 1000; // 30 minutes
        
        if (loginTimestamp) {
            const currentTime = Date.now();
            const elapsedTime = currentTime - parseInt(loginTimestamp);
            
            if (elapsedTime >= sessionDuration) {
                clearSessionData();
                // Create a styled alert overlay instead of browser alert
                const alertOverlay = document.createElement('div');
                alertOverlay.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.8); z-index: 99999999;
                    display: flex; align-items: center; justify-content: center;
                `;
                const alertBox = document.createElement('div');
                alertBox.style.cssText = `
                    background: white; padding: 30px; border-radius: 10px;
                    text-align: center; max-width: 400px;
                `;
                alertBox.innerHTML = `
                    <h3 style="margin: 0 0 15px 0; color: #dc3545;">Session Expired</h3>
                    <p style="margin: 0 0 20px 0;">Your session has expired due to inactivity. You will be redirected to the homepage.</p>
                    <button onclick="window.location.href='https://www.academixpoint.com/'" 
                            style="background: #dc3545; color: white; border: none; padding: 10px 30px; 
                                   border-radius: 5px; cursor: pointer; font-weight: 600;">
                        OK
                    </button>
                `;
                alertOverlay.appendChild(alertBox);
                document.body.appendChild(alertOverlay);
                
                // Auto-redirect after 5 seconds if user doesn't click
                setTimeout(() => {
                    window.location.href = 'https://www.academixpoint.com/';
                }, 5000);
            }
        }
    }, 60000); // Check every 60 seconds
}

async function loadDashboardData(username, password) {
    try {
        const action = 'login';
        const response = await fetch(`${scriptURL}?action=${action}&username=${username}&loginPassword=${password}`);
        const rawResponse = await response.text();

        const parsedResponse = JSON.parse(rawResponse);
        
        if (parsedResponse.result === "success") {
            const dashboardData = parsedResponse.dashboardData;

            // Assign values to global variables
            email = dashboardData.email || "Not Provided";
            phone = dashboardData.phone || "Not Provided";
            schoolindex = dashboardData.schoolindex || "N/A";
            schoolname = dashboardData.schoolname || "Unknown School";
            usermessage = dashboardData.usermessage || "No message available";
            globalUsername = dashboardData.username || "Guest";
            notification = dashboardData.notification || "No notification";

            console.log('Global variables set:', { 
                schoolindex, 
                schoolname, 
                globalUsername,
                email,
                phone,
                notification,
                usermessage
            });

            // Update dashboard UI with loaded data
            updateDashboardUI(dashboardData);
            
            // Store in localStorage for persistence
await window.storage.set('isLoggedIn', 'true', false);
await window.storage.set('username', username, false);
await window.storage.set('dashboardData', JSON.stringify(dashboardData), false);
await window.storage.set('loginTimestamp', Date.now().toString(), false);
            
            return true; // Indicate success
        } else {
            console.error("Error:", parsedResponse.message);
            showMessage(parsedResponse.message || "Unknown error", false);
            return false;
        }
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        showMessage("Failed to load dashboard data. Please try again later.", false);
        throw error; // Propagate error to be caught by caller
    }
}

function updateDashboardUI(data) {
    console.log('Updating dashboard UI with data:', data);
    
    const userEmail = document.getElementById('user-email');
    const userUsername = document.getElementById('user-username');
    const schoolName = document.getElementById('school-name');
    const schoolIndex = document.getElementById('school-index');
    const nameHomeDiv = document.getElementById('nameHmdiv');
    const hmeIndxDiv = document.getElementById('hmeIndxDiv');
    const schoolLinkH = "https://www.academixpoint.com/p/";
    
    const alertedNotification = document.getElementById("alertednotification");
    const alertedLink = document.getElementById("alertedLink");
    const sendName = document.getElementById("sendName");
    const assignTeachers = document.getElementById("assign-teachers");
    const taskStatus = document.getElementById("task-status");

    // === ENHANCED NOTIFICATION SECTION (24-hour welcome message) ===
    if (alertedNotification) {
        if (data.notification && data.notification.trim() !== "") {
            // Show fancy styled 24-hour welcome notification
            alertedNotification.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            border-left: 5px solid #5a67d8; 
                            padding: 20px; 
                            border-radius: 10px; 
                            margin-bottom: 20px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            color: white;">
                    <div style="display: flex; align-items: start; gap: 15px;">
                        <span style="font-size: 32px;">🎉</span>
                        <div style="flex: 1;">
                            <strong style="font-size: 18px; display: block; margin-bottom: 10px;">
                                Welcome, ${data.username}!
                            </strong>
                            <p style="margin: 0; line-height: 1.6; opacity: 0.95;">
                                ${data.notification}
                            </p>
                            <small style="display: block; margin-top: 10px; opacity: 0.8; font-size: 12px;">
                                ⏰ This message will disappear after 24 hours
                            </small>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // No welcome notification - keep it simple
            alertedNotification.innerHTML = "";
        }
    }

    // === ENHANCED ANNOUNCEMENTS SECTION (System-wide announcements) ===
    const announcementsContainer = document.getElementById("announcements-container") || createAnnouncementsContainer();
    
    if (announcementsContainer) {
        if (data.announcements && data.announcements.length > 0) {
            announcementsContainer.innerHTML = `
                <div style="margin-top: 20px; margin-bottom: 20px;">
                    <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 20px; font-weight: 600;">
                        📢 System Announcements
                    </h3>
                    ${data.announcements.map(announcement => {
                        const priorityColors = {
                            'High': { bg: '#fff3cd', border: '#ffc107', badge: '#dc3545', icon: '🔴' },
                            'Medium': { bg: '#d1ecf1', border: '#17a2b8', badge: '#ffc107', icon: '🟡' },
                            'Low': { bg: '#f8f9fa', border: '#6c757d', badge: '#28a745', icon: '🟢' }
                        };
                        const colors = priorityColors[announcement.priority] || priorityColors['Low'];
                        
                        return `
                            <div style="
                                background: ${colors.bg};
                                border-left: 4px solid ${colors.border};
                                padding: 15px 20px;
                                margin-bottom: 12px;
                                border-radius: 8px;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                                transition: transform 0.2s, box-shadow 0.2s;
                            " onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';"
                               onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">
                                <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px;">
                                    <div style="flex: 1;">
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                            <span style="font-size: 18px;">${colors.icon}</span>
                                            <strong style="font-size: 16px; color: #2d3748;">
                                                ${announcement.title}
                                            </strong>
                                        </div>
                                        <p style="margin: 10px 0 8px 0; color: #4a5568; line-height: 1.6;">
                                            ${announcement.message}
                                        </p>
                                        <small style="color: #718096; font-size: 12px;">
                                            📅 Posted: ${new Date(announcement.date).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </small>
                                    </div>
                                    <span style="
                                        background: ${colors.badge};
                                        color: white;
                                        padding: 4px 12px;
                                        border-radius: 12px;
                                        font-size: 11px;
                                        font-weight: bold;
                                        white-space: nowrap;
                                        align-self: flex-start;
                                    ">${announcement.priority}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            // No announcements available - simple message
            announcementsContainer.innerHTML = `
                <div style="
                    text-align: center; 
                    padding: 30px 20px; 
                    color: #a0aec0;
                    background: #f7fafc;
                    border-radius: 8px;
                    margin-top: 20px;
                ">
                    <span style="font-size: 48px; display: block; margin-bottom: 10px;">📭</span>
                    <p style="margin: 0; font-size: 14px;">No announcements at this time.</p>
                </div>
            `;
        }
    }
    
    // === KEEP SIMPLE STRUCTURE FOR OTHER ELEMENTS ===
    if (alertedLink) {
        alertedLink.innerHTML = `Open or share this link with your officemates: <a href="${schoolLinkH}${data.schoolindex.toLowerCase()}-teachers-feeding-area.html">${data.schoolindex}-TEACHER'S FEEDING AREA</a>`;
    }
    
    if (sendName) {
        sendName.onclick = function() {
            window.location.href = `${schoolLinkH}${data.schoolindex.toLowerCase()}-push-students-names.html`;
        };
    }
    
    if (assignTeachers) {
        assignTeachers.onclick = function() {
            window.location.href = `${schoolLinkH}${data.schoolindex.toLowerCase()}-push-teachers-names.html`;
        };
    }
    
    if (taskStatus) {
        taskStatus.onclick = function() {
            window.location.href = `${schoolLinkH}${data.schoolindex.toLowerCase()}-task-proggress-status.html`;
        };
    }

    if (userEmail) userEmail.textContent = data.email || "Email not available";
    if (userUsername) userUsername.textContent = data.username || "Username not available";
    if (schoolName) schoolName.textContent = data.schoolname || "School name not available";
    if (schoolIndex) schoolIndex.textContent = data.schoolindex || "School index not available";
    if (nameHomeDiv) nameHomeDiv.textContent = data.schoolname || "School name not available";
    if (hmeIndxDiv) hmeIndxDiv.textContent = data.schoolindex || "School index not available";

    // === ENHANCED NOTIFICATION DROPDOWN LIST ===
    const notificationList = document.getElementById('notification-list');
    const notificationCount = document.getElementById('hover-icon1');
    if (notificationList) {
        const notifications = [];
        
        // Add 24-hour welcome notification if available
        if (data.notification && data.notification.trim() !== "") {
            notifications.push(`Welcome: ${data.notification}`);
        }
        
        // Add system announcements to notifications dropdown
        if (data.announcements && data.announcements.length > 0) {
            data.announcements.forEach(ann => {
                notifications.push(`${ann.priority}: ${ann.title}`);
            });
        }
        
        notificationList.innerHTML = "";
        if (notifications.length > 0) {
            notifications.forEach(note => {
                const li = document.createElement('li');
                li.textContent = note;
                li.style.cssText = "padding: 10px; border-bottom: 1px solid #e2e8f0; cursor: pointer;";
                li.onmouseover = function() { this.style.background = '#f7fafc'; };
                li.onmouseout = function() { this.style.background = 'transparent'; };
                notificationList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "No notifications";
            li.style.cssText = "padding: 10px; color: #a0aec0; text-align: center;";
            notificationList.appendChild(li);
        }
        
        if (notificationCount) notificationCount.textContent = notifications.length || 0;
    }

    // === SIMPLE MESSAGE DROPDOWN LIST ===
    const messageList = document.getElementById('message-list');
    const messageCount = document.getElementById('hover-icon2');
    if (messageList) {
        const messages = Array.isArray(data.usermessage) ? data.usermessage : [data.usermessage].filter(Boolean);
        messageList.innerHTML = "";
        messages.forEach(msg => {
            const li = document.createElement('li');
            li.textContent = `Hi, ${data.username}: ${msg}`;
            messageList.appendChild(li);
        });
        if (messageCount) messageCount.textContent = messages.length || 0;
    }
}

// Helper function to create announcements container
function createAnnouncementsContainer() {
    const alertedNotification = document.getElementById("alertednotification");
    if (alertedNotification && alertedNotification.parentElement) {
        const container = document.createElement('div');
        container.id = "announcements-container";
        alertedNotification.parentElement.insertBefore(container, alertedNotification.nextSibling);
        return container;
    }
    return null;
}

// ===== PART 3: UI FUNCTIONS (Dashboard UI) =====

// DOM elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeBanner = document.getElementById('closeBanner');
const planBanner = document.getElementById('planBanner');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent = document.getElementById('mainContent');
const shareLinkSection = document.getElementById('shareLinkSection');
const copyToast = document.getElementById('copyToast');

// Load user data function
window.loadUserData = function() {
    console.log('loadUserData called');
    console.log('Checking global variables:', { 
        globalUsername, 
        schoolindex, 
        schoolname,
        email,
        phone 
    });
    
    if (typeof globalUsername !== 'undefined' && globalUsername && 
        typeof schoolindex !== 'undefined' && schoolindex && 
        typeof schoolname !== 'undefined' && schoolname) {
        console.log('Using global data');
        updateUIWithGlobalData();
    } else {
        console.log('Global data not available, using DOM fallback');
        loadUserDataFromDOM();
        
        // Retry after a short delay if data loads later
        setTimeout(() => {
            if (typeof globalUsername !== 'undefined' && globalUsername && schoolindex && schoolname) {
                console.log('Retrying with global data');
                updateUIWithGlobalData();
            }
        }, 500);
    }
};

function updateUIWithGlobalData() {
    // Validate data before using
    if (!globalUsername || !schoolindex || !schoolname) {
        console.error('Missing required data:', { globalUsername, schoolindex, schoolname });
        showMessage('Failed to load user data', false);
        return;
    }

    const userData = {
        schoolName: `${schoolindex}-${schoolname}`,
        regionName: schoolname,
        userName: globalUsername,
        notifications: Array.isArray(notification) ? notification.length : 
                       (notification && notification !== "No notification" ? 1 : 0),
        messages: Array.isArray(usermessage) ? usermessage.length : 
                  (usermessage && usermessage !== "No message available" ? 1 : 0),
        schoolIndex: schoolindex
    };

    console.log('Updating UI with userData:', userData);

    // Update all elements safely
    const elements = {
        schoolName: document.getElementById('schoolName'),
        schoolName2: document.getElementById('schoo-name2'),
        regionName: document.getElementById('regionName'),
        userName: document.getElementById('userName'),
        notificationCount: document.getElementById('notificationCount'),
        messageCount: document.getElementById('messageCount'),
        shareLinkText: document.getElementById('shareLinkText')
    };

    if (elements.schoolName) {
        elements.schoolName.textContent = userData.schoolName;
        console.log('Updated schoolName:', userData.schoolName);
    }
    if (elements.schoolName2) elements.schoolName2.textContent = userData.schoolName;
    if (elements.regionName) elements.regionName.textContent = userData.regionName;
    if (elements.userName) elements.userName.textContent = userData.userName;
    if (elements.notificationCount) elements.notificationCount.textContent = userData.notifications;
    if (elements.messageCount) elements.messageCount.textContent = userData.messages;
    if (elements.shareLinkText) elements.shareLinkText.textContent = `${userData.schoolIndex}-TEACHER'S FEEDING AREA`;
    
    setupNavigationLinks(userData.schoolIndex);
}

function loadUserDataFromDOM() {
    const hmeIndxDivEl = document.getElementById('hmeIndxDiv');
    const nameHmdivEl = document.getElementById('nameHmdiv');
    const userUsernameEl = document.getElementById('user-username');
    const hoverIcon1El = document.getElementById('hover-icon1');
    const hoverIcon2El = document.getElementById('hover-icon2');

    const userData = {
        schoolName: hmeIndxDivEl ? hmeIndxDivEl.textContent : 'Loading...',
        regionName: nameHmdivEl ? nameHmdivEl.textContent : 'Loading...',
        userName: userUsernameEl ? userUsernameEl.textContent : 'User',
        notifications: hoverIcon1El ? hoverIcon1El.textContent : '0',
        messages: hoverIcon2El ? hoverIcon2El.textContent : '0'
    };

    console.log('Using DOM data:', userData);

    const schoolNameEl = document.getElementById('schoolName');
    const schoolName2El = document.getElementById('schoo-name2');
    const regionNameEl = document.getElementById('regionName');
    const userNameEl = document.getElementById('userName');
    const notificationCountEl = document.getElementById('notificationCount');
    const messageCountEl = document.getElementById('messageCount');
    const shareLinkTextEl = document.getElementById('shareLinkText');

    if (schoolNameEl) schoolNameEl.textContent = userData.schoolName;
    if (schoolName2El) schoolName2El.textContent = userData.schoolName;
    if (regionNameEl) regionNameEl.textContent = userData.regionName;
    if (userNameEl) userNameEl.textContent = userData.userName;
    if (notificationCountEl) notificationCountEl.textContent = userData.notifications;
    if (messageCountEl) messageCountEl.textContent = userData.messages;

    const schoolIndex = userData.schoolName.includes('-') ? userData.schoolName.split('-')[0] : 'N/A';
    if (shareLinkTextEl) shareLinkTextEl.textContent = `${schoolIndex}-TEACHER'S FEEDING AREA`;
    
    setupNavigationLinks(schoolIndex);
}

function setupNavigationLinks(schoolIndex) {
    console.log('Setting up navigation links for:', schoolIndex);
    const schoolLinkH = "https://www.academixpoint.com/p/";
    
    // Assign Teachers link
    const assignTeachers = document.querySelector('#assign-teachers, [data-section="assign-tasks"]');
    if (assignTeachers) {
        const newAssignTeachers = assignTeachers.cloneNode(true);
        assignTeachers.parentNode.replaceChild(newAssignTeachers, assignTeachers);
        newAssignTeachers.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `${schoolLinkH}${schoolIndex.toLowerCase()}-push-teachers-names.html`;
        });
    }
    
    // Push Names link
    const sendName = document.querySelector('#sendName, [data-section="push-names"]');
    if (sendName) {
        const newSendName = sendName.cloneNode(true);
        sendName.parentNode.replaceChild(newSendName, sendName);
        newSendName.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `${schoolLinkH}${schoolIndex.toLowerCase()}-push-students-names.html`;
        });
    }
    
    // Task Status link
    const taskStatus = document.querySelector('#task-status, [data-section="task-progress"]');
    if (taskStatus) {
        const newTaskStatus = taskStatus.cloneNode(true);
        taskStatus.parentNode.replaceChild(newTaskStatus, taskStatus);
        newTaskStatus.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `${schoolLinkH}${schoolIndex.toLowerCase()}-task-proggress-status.html`;
        });
    }
}

// ===== PART 4: EVENT LISTENERS =====

// Share link functionality
if (shareLinkSection) {
    shareLinkSection.addEventListener('click', () => {
        const shareLinkTextEl = document.getElementById('shareLinkText');
        if (!shareLinkTextEl) return;
        
        const linkText = shareLinkTextEl.textContent;
        const formattedLink = linkText.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const fullLink = `https://www.academixpoint.com/p/${formattedLink}.html`;
        
        navigator.clipboard.writeText(fullLink).then(() => {
            if (copyToast) {
                copyToast.classList.add('show');
                setTimeout(() => copyToast.classList.remove('show'), 3000);
            }
        }).catch(err => {
            console.error('Failed to copy link:', err);
            alert('Failed to copy link. Please try again.');
        });
    });
}

// Sidebar toggle
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        const icon = sidebarToggle.querySelector('i');
        if (icon) {
            icon.className = sidebar.classList.contains('collapsed') ? 'bi bi-chevron-right' : 'bi bi-chevron-left';
        }
    });
}

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });
}

if (closeBanner) {
    closeBanner.addEventListener('click', () => {
        if (planBanner) planBanner.style.display = 'none';
    });
}

// Menu items active state
const menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        }
    });
});

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            clearSessionData();
            
            if (typeof hideModernDashboard === 'function') hideModernDashboard();
            window.location.href = 'https://www.academixpoint.com/';
        }
    });
}

// Show/Hide dashboard functions
window.showModernDashboard = function() {
    console.log('showModernDashboard called');
    const dashboardEl = document.getElementById('dashboard');
    if (dashboardEl) {
        dashboardEl.classList.add('show');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            if (typeof window.loadUserData === 'function') {
                window.loadUserData();
            }
        }, 500);
    }
};

window.hideModernDashboard = function() {
    const dashboardEl = document.getElementById('dashboard');
    if (dashboardEl) {
        dashboardEl.classList.remove('show');
        document.body.style.overflow = '';
    }
};

// Close dashboard on overlay click
const dashboardEl = document.getElementById('dashboard');
if (dashboardEl) {
    dashboardEl.addEventListener('click', function(e) {
        if (e.target.id === 'dashboard' && typeof hideModernDashboard === 'function') {
            hideModernDashboard();
        }
    });
}

const sidebarEl = document.querySelector('.sidebar');
if (sidebarEl) sidebarEl.addEventListener('click', (e) => e.stopPropagation());

const mainContentEl = document.querySelector('.main-content');
if (mainContentEl) mainContentEl.addEventListener('click', (e) => e.stopPropagation());
