// Tab switching with animated slider and headline swap
const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const tabSlider = document.getElementById("tab-slider");
const loginHeadline = document.getElementById("login-headline");
const signupHeadline = document.getElementById("signup-headline");
const loginSubheading = document.getElementById("login-subheading");
const signupSubheading = document.getElementById("signup-subheading");
function switchTab(tab) {
    if (tab === "login") {
        loginTab.classList.add("active");
        signupTab.classList.remove("active");
        loginForm.style.display = "";
        signupForm.style.display = "none";
        loginHeadline.style.display = "";
        signupHeadline.style.display = "none";
        loginSubheading.style.display = "";
        signupSubheading.style.display = "none";
        tabSlider.style.transform = "translateX(0)";
    } else {
        signupTab.classList.add("active");
        loginTab.classList.remove("active");
        signupForm.style.display = "";
        loginForm.style.display = "none";
        signupHeadline.style.display = "";
        loginHeadline.style.display = "none";
        signupSubheading.style.display = "";
        loginSubheading.style.display = "none";
        tabSlider.style.transform = "translateX(100%)";
    }
}
loginTab.addEventListener("click", () => switchTab("login"));
signupTab.addEventListener("click", () => switchTab("signup"));
// Set initial slider width and position
window.addEventListener("DOMContentLoaded", () => {
    tabSlider.style.width = loginTab.offsetWidth + "px";
    tabSlider.style.left = loginTab.offsetLeft + "px";
});
// Responsive slider width
window.addEventListener("resize", () => {
    if (loginTab.classList.contains("active")) {
        tabSlider.style.width = loginTab.offsetWidth + "px";
        tabSlider.style.left = loginTab.offsetLeft + "px";
    } else {
        tabSlider.style.width = signupTab.offsetWidth + "px";
        tabSlider.style.left = signupTab.offsetLeft + "px";
    }
});
// Login form submit
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const message = document.getElementById("login-message");
    message.textContent = "";
    try {
        const res = await fetch("http://localhost:8000/api/v1/auth/token/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
            document.getElementById("login-username").value = "";
            document.getElementById("login-password").value = "";

            message.textContent = "Login successful!";
            message.className = "form-message success";

            // window.location.href = '/dashboard.html';
        } else {
            let error_text = "";
            for (key in data) {
                error_text += `${key}: ${data[key]}\n`;
            }
            message.textContent = error_text || "Login failed.";
            message.className = "form-message error";
        }
    } catch (err) {
        console.log(err);
        message.textContent = "Network error. Please try again.";
        message.className = "form-message error";
    }
});
// Signup form submit
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const first_name = document.getElementById("signup-firstname").value;
    const last_name = document.getElementById("signup-lastname").value;
    const email = document.getElementById("signup-email").value;
    const username = document.getElementById("signup-username").value;
    const password = document.getElementById("signup-password").value;
    const message = document.getElementById("signup-message");
    message.textContent = "";
    try {
        const res = await fetch("http://localhost:8000/api/v1/auth/register/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                password,
                first_name,
                last_name,
                email,
            }),
        });
        const data = await res.json();
        if (res.ok) {
            message.textContent = "Sign up successful! You can now log in.";
            message.className = "form-message success";
            switchTab("login");
        } else {
            let error_text = "";
            for (key in data) {
                error_text += `${key}: ${data[key]}\n`;
            }
            message.textContent = error_text || "Sign up failed.";
            message.className = "form-message error";
        }
    } catch (err) {
        message.textContent = "Network error. Please try again.";
        message.className = "form-message error";
    }
});
