/* ============================================
    Login Page JavaScript
   ============================================ */
// ============= DOM Elements =============
const loginForm = document.querySelector("#loginForm");
const emailInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const errorEmail = document.querySelector(".error-email");
const errorPassword = document.querySelector(".error-password");
const eyeIcon = document.querySelector(".eye__pass");

// ============= Initialize =============
document.addEventListener("DOMContentLoaded", function () {
  setupPasswordToggle();
  setupFormSubmission();
});

// ============= Password Visibility Toggle =============
function setupPasswordToggle() {
  if (!eyeIcon) return;
  eyeIcon.addEventListener("click", function () {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    eyeIcon.classList.toggle("fa-eye", !isPassword);
    eyeIcon.classList.toggle("fa-eye-slash", isPassword);
  });
}

// ============= Form Submission (fetch — no page refresh) =============
function setupFormSubmission() {
  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (e) {
    // منع الـ default POST الذي يسبب page refresh
    e.preventDefault();

    // Reset errors
    clearErrors();

    // Client-side validation
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    let isValid = true;

    if (!email) {
      showFieldError(errorEmail, "Please enter your email");
      isValid = false;
    } else if (!isValidEmail(email)) {
      showFieldError(errorEmail, "Please enter a valid email address");
      isValid = false;
    }

    if (!password) {
      showFieldError(errorPassword, "Please enter your password");
      isValid = false;
    } else if (password.length < 4) {
      showFieldError(errorPassword, "Password must be at least 4 characters");
      isValid = false;
    }

    if (!isValid) return;

    // Loading state
    const loginBtn = loginForm.querySelector(".btn");
    loginBtn.textContent = "LOGGING IN...";
    loginBtn.disabled = true;

    try {
      // إرسال للـ API الحقيقي
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // عرض رسالة الخطأ من الـ backend
        const msg = data.message || "Invalid email or password";
        showFieldError(errorEmail, msg);
        loginBtn.textContent = "Login";
        loginBtn.disabled = false;
        return;
      }

      // حفظ الـ token
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", email);
      }

      showNotification("Login successful! Redirecting...", "success");

      // Redirect بناءً على الـ email
      setTimeout(() => {
        const decoded = JSON.parse(atob(data.token.split(".")[1]));
        console.log(decoded);
        const role = decoded.role;

        if (role === "admin") {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/home";
        }
      }, 800);
    } catch (err) {
      console.error("Login error:", err);
      showFieldError(errorEmail, "Network error. Please try again.");
      loginBtn.textContent = "Login";
      loginBtn.disabled = false;
    }
  });
}

// ============= Helpers =============
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
  el.style.color = "#ff006e";
}

function clearErrors() {
  [errorEmail, errorPassword].forEach((el) => {
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
  });
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.textContent = message;

  const baseStyle = `
    position:fixed; bottom:20px; right:20px;
    padding:16px 24px; border-radius:8px;
    font-weight:600; z-index:9999;
    animation:slideIn .3s ease;
    max-width:400px; word-wrap:break-word;
    box-shadow:0 10px 30px rgba(0,0,0,.5);
  `;
  const typeStyle =
    type === "success"
      ? "background:linear-gradient(135deg,#00ff88,#00dd66);color:#000;"
      : "background:linear-gradient(135deg,#ff006e,#ff0055);color:#fff;";
  notification.style.cssText = baseStyle + typeStyle;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut .3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Keyframes
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn  { from{transform:translateX(400px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes slideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(400px);opacity:0} }
`;
document.head.appendChild(style);
