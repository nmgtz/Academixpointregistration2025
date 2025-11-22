document.addEventListener("DOMContentLoaded", () => {
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
      }
      body::before {
        content:'';
        position: absolute;
        top:0;left:0;
        width:100%;height:100%;
        background:rgba(255,255,255,0.7);
        z-index:-1;
      }
    `;
    document.head.appendChild(style);

    const socialBtn = document.querySelector(".social-btn");
    if (socialBtn) socialBtn.style.display = "none";
  };

  const toggleVisibility = () => {
    const ids = ["whatsapp","facebook","share","sms","globe","close","x"];
    const els = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));

    if (els.globe && els.close) {
      const show = els.globe.style.display !== "none";
      ["whatsapp","facebook","share","sms"].forEach(id => {
        if (els[id]) els[id].style.display = show ? "block":"none";
      });
      els.globe.style.display = show ? "none":"block";
      els.close.style.display = show ? "block":"none";
      if (els.x) els.x.style.display = show ? "block":"none";
    }
  };

  const hideButtonsExceptGlobe = () => {
    const ids = ["whatsapp","facebook","share","sms","close","globe","x"];
    const els = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));

    ["whatsapp","facebook","share","sms","close","x"].forEach(id => {
      if (els[id]) els[id].style.display = "none";
    });
    if (els.globe) els.globe.style.display = "block";
  };

  const globe = document.getElementById("globe");
  if (globe) globe.addEventListener("click", e => { e.preventDefault(); toggleVisibility(); });

  const closeBtn = document.getElementById("close");
  if (closeBtn) closeBtn.addEventListener("click", e => { e.preventDefault(); hideButtonsExceptGlobe(); });

  const phoneLink = document.getElementById("phoneLink");
  const popup1 = document.getElementById("contact-popup");
  const overlay1 = document.getElementById("overlay1");

  if (phoneLink && popup1 && overlay1) {
    phoneLink.addEventListener("click", e => { e.preventDefault(); popup1.style.display="block"; overlay1.style.display="block"; });
    overlay1.addEventListener("click", () => { popup1.style.display="none"; overlay1.style.display="none"; });
  }

  const createLoginButton = document.getElementById("createLogin");
  const accountButton = document.getElementById("accountButton");
  const popup = document.getElementById("popup");
  const overlay = document.getElementById("overlay");

  const showPopup = (e) => { e.preventDefault(); if (popup && overlay) { popup.style.display="block"; overlay.style.display="block"; } };

  if (createLoginButton) createLoginButton.addEventListener("click", showPopup);
  if (accountButton) accountButton.addEventListener("click", showPopup);

  if (overlay) overlay.addEventListener("click", () => { if (popup) popup.style.display="none"; overlay.style.display="none"; });

  toggleForms("lg-form");
});

(async () => {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  const loginTimestamp = sessionStorage.getItem("loginTimestamp");
  
  const sessionDuration = 30 * 60 * 1000;
  
  if (isLoggedIn && loginTimestamp) {
    const currentTime = Date.now();
    const elapsedTime = currentTime - parseInt(loginTimestamp);
    
    if (elapsedTime < sessionDuration) {
      const restored = await restoreDashboardFromStorage();
      if (restored) {
        displayDashboard();
      } else {
        await clearSessionData();
      }
    } else {
      await clearSessionData();
      window.location.href = 'https://www.academixpoint.com/';
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  const token = urlParams.get('token');

  if (email && token) {
    toggleForms('newSet-form');
    const emailInput = document.querySelector('#newSet-form input[name="email"]');
    const tokenInput = document.querySelector('#newSet-form input[name="token"]');
    if (emailInput) emailInput.value = email;
    if (tokenInput) tokenInput.value = token;
  }
})();

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

const scriptURL = 'https://script.google.com/macros/s/AKfycbyyrPfNubwCH-kYl75CJqyUlMjGzNDhjCKQOi4ZVm3z2ICUfwMKDZbivI7ncDclu-cK/exec';

async function submitForm(action) {
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
  const form = document.getElementById(formId1);

  if (!button || !form) {
    showMessage("Form or button not found", false);
    return;
  }

  const originalText = button.textContent;
  button.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i>`;

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
      .then(async (data) => {
        showMessage(data.message, data.result === "success");

        if (data.result === "success") {
          if (action === 'login') {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('loginTimestamp', Date.now().toString());
            
            showMessageWithOverlay("Login successful! Loading dashboard...", true);
            
            const username = form.querySelector('input[name="username"]').value;
            const password = form.querySelector('input[name="loginPassword"]').value;
            
            sessionStorage.setItem('password', password);

            setTimeout(async () => {
              try {
                const dataLoaded = await loadDashboardData(username, password);
                if (dataLoaded) {
                  displayDashboard();
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
            button.textContent = originalText;
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
      const label = input.previousElementSibling;
      const fieldName = label ? label.textContent : input.name;
      showMessage(`${fieldName} is required.`, false);
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
      if (username) username.style.borderColor = 'red';
      showMessage("Username is required.", false);
      isValid = false;
    } else if (username) {
      username.style.borderColor = '';
    }

    if (!loginPassword || !loginPassword.value.trim()) {
      if (loginPassword) loginPassword.style.borderColor = 'red';
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
  if (!messageBox) return;

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
  if (messageBox) {
    messageBox.style.display = "block";
    messageBox.className = `message-box ${success ? "success" : "error"}`;
    messageBox.textContent = message;
  }

  if (success) {
    const overlay = document.createElement("div");
    overlay.className = "overlay-ms-bx";

    const overlayMessageBox = document.createElement("div");
    overlayMessageBox.className = "overlay-message-box";
    overlayMessageBox.textContent = message;

    overlay.appendChild(overlayMessageBox);
    document.body.appendChild(overlay);

    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      if (typeof onComplete === "function") {
        onComplete();
      }
    }, 10000);
  } else {
    setTimeout(() => {
      if (messageBox) messageBox.style.display = "none";
    }, 5000);
  }
}

let email, notification, phone, schoolindex, schoolname, usermessage, globalUsername, isLoggedIn = false;

function displayDashboard() {
    toggleDashboard();
    startSessionMonitoring();
    
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
    
    const header = document.getElementById("header");
    const dashboard = document.getElementById("dashboard");
    const mainId = document.getElementById("main-id");
    const footer = document.querySelector(".footer");
    const footerBottom = document.querySelector(".footer-bottom");
    const loginForm = document.querySelector(".login-form");

    if (header) header.style.display = "none";
    dashboardStyles();
    if (dashboard) dashboard.style.display = "block";
    if (mainId) mainId.style.display = "none";
    if (footer) footer.style.display = "none";
    if (footerBottom) footerBottom.style.display = "none";
    if (loginForm) loginForm.style.display = "none";
}

async function restoreDashboardFromStorage() {
  const storedData = sessionStorage.getItem('dashboardData');
  
  if (storedData) {
    try {
      const dashboardData = JSON.parse(storedData);
      
      email = dashboardData.email || "Not Provided";
      phone = dashboardData.phone || "Not Provided";
      schoolindex = dashboardData.schoolindex || "N/A";
      schoolname = dashboardData.schoolname || "Unknown School";
      usermessage = dashboardData.usermessage || "No message available";
      globalUsername = dashboardData.username || "Guest";
      notification = dashboardData.notification || "No notification";
      
      console.log('Dashboard data restored from sessionStorage');
      
      updateDashboardUI(dashboardData);
      
      return true;
    } catch (error) {
      console.error('Error restoring dashboard data:', error);
      return false;
    }
  }
  return false;
}

async function clearSessionData() {
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('password');
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('dashboardData');
  sessionStorage.removeItem('loginTimestamp');
  
  email = null;
  notification = null;
  phone = null;
  schoolindex = null;
  schoolname = null;
  usermessage = null;
  globalUsername = null;
  
  console.log('Session data cleared');
}

function startSessionMonitoring() {
  setInterval(async () => { 
    const loginTimestamp = sessionStorage.getItem("loginTimestamp");
    const sessionDuration = 30 * 60 * 1000;
    
    if (loginTimestamp) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - parseInt(loginTimestamp);
      
      if (elapsedTime >= sessionDuration) {
        await clearSessionData();
        
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
        
        setTimeout(() => {
            window.location.href = 'https://www.academixpoint.com/';
        }, 5000);
      }
    }
  }, 60000);
}

async function loadDashboardData(username, password) {
    try {
        const action = 'login';
        const response = await fetch(`${scriptURL}?action=${action}&username=${username}&loginPassword=${password}`);
        const rawResponse = await response.text();

        const parsedResponse = JSON.parse(rawResponse);
        
        if (parsedResponse.result === "success") {
            const dashboardData = parsedResponse.dashboardData;

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

            updateDashboardUI(dashboardData);
            
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('dashboardData', JSON.stringify(dashboardData));
            sessionStorage.setItem('loginTimestamp', Date.now().toString());
            
            return true;
        } else {
            console.error("Error:", parsedResponse.message);
            showMessage(parsedResponse.message || "Unknown error", false);
            return false;
        }
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        showMessage("Failed to load dashboard data. Please try again later.", false);
        throw error;
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

    if (alertedNotification) {
        alertedNotification.textContent = `Hi, ${data.username}: ${data.notification}`;
    }
    
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

    const notificationList = document.getElementById('notification-list');
    const notificationCount = document.getElementById('hover-icon1');
    if (notificationList) {
        const notifications = Array.isArray(data.notification) ? data.notification : [data.notification].filter(Boolean);
        notificationList.innerHTML = "";
        notifications.forEach(note => {
            const li = document.createElement('li');
            li.textContent = `Hi, ${data.username}: ${note}`;
            notificationList.appendChild(li);
        });
        if (notificationCount) notificationCount.textContent = notifications.length || 0;
    }

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

const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeBanner = document.getElementById('closeBanner');
const planBanner = document.getElementById('planBanner');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent = document.getElementById('mainContent');
const shareLinkSection = document.getElementById('shareLinkSection');
const copyToast = document.getElementById('copyToast');

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
        
        setTimeout(() => {
            if (typeof globalUsername !== 'undefined' && globalUsername && schoolindex && schoolname) {
                console.log('Retrying with global data');
                updateUIWithGlobalData();
            }
        }, 500);
    }
};

function updateUIWithGlobalData() {
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
    
    const assignTeachers = document.querySelector('#assign-teachers, [data-section="assign-tasks"]');
    if (assignTeachers) {
        const newAssignTeachers = assignTeachers.cloneNode(true);
        assignTeachers.parentNode.replaceChild(newAssignTeachers, assignTeachers);
        newAssignTeachers.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `${schoolLinkH}${schoolIndex.toLowerCase()}-push-teachers-names.html`;
        });
    }
    
    const sendName = document.querySelector('#sendName, [data-section="push-names"]');
    if (sendName) {
        const newSendName = sendName.cloneNode(true);
        sendName.parentNode.replaceChild(newSendName, sendName);
        newSendName.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `${schoolLinkH}${schoolIndex.toLowerCase()}-push-students-names.html`;
        });
    }
    
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

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        if (sidebar) sidebar.classList.toggle('collapsed');
        if (mainContent) mainContent.classList.toggle('expanded');
        const icon = sidebarToggle.querySelector('i');
        if (icon && sidebar) {
            icon.className = sidebar.classList.contains('collapsed') ? 'bi bi-chevron-right' : 'bi bi-chevron-left';
        }
    });
}

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        if (sidebar) sidebar.classList.toggle('active');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });
}

if (closeBanner && planBanner) {
    closeBanner.addEventListener('click', () => {
        planBanner.style.display = 'none';
    });
}

const menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        if (window.innerWidth <= 768) {
            if (sidebar) sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        }
    });
});

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

const dashboardEl = document.getElementById('dashboard');
if (dashboardEl) {
    dashboardEl.addEventListener('click', function(e) {
        if (e.target.id === 'dashboard' && typeof hideModernDashboard === 'function') {
            hideModernDashboard();
        }
    });
}

const sidebarEl = document.querySelector('.sidebar');
if (sidebarEl) {
    sidebarEl.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

const mainContentEl = document.querySelector('.main-content');
if (mainContentEl) {
    mainContentEl.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}
