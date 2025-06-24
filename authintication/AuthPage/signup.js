// Handle switching between Sign In and Sign Up
const container = document.querySelector('.container');
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');

// Show Sign Up form
signUpButton.addEventListener('click', () => {
    container.classList.add('right-panel-active');

    // Switch logos
    document.getElementById('logo1').style.display = 'none';
    document.getElementById('logo2').style.display = 'block';
    document.getElementById('logo3').style.display = 'none';
    document.getElementById('logo4').style.display = 'block';
});

// Show Sign In form
signInButton.addEventListener('click', () => {
    container.classList.remove('right-panel-active');

    // Switch logos
    document.getElementById('logo1').style.display = 'block';
    document.getElementById('logo2').style.display = 'none';
    document.getElementById('logo3').style.display = 'block';
    document.getElementById('logo4').style.display = 'none';
});



// Toggle dropdown visibility
function toggleDropdown(trigger) {
    const dropdownContent = trigger.nextElementSibling;
    dropdownContent.style.display =
        dropdownContent.style.display === "block" ? "none" : "block";
}

// Filter dropdown options
function filterDropdown(input) {
    const filter = input.value.toLowerCase();
    const options = document.querySelectorAll("#section-options .dropdown-option");
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(filter) ? "block" : "none";
    });
}

// متغير لتخزين بيانات الأقسام
let departmentsData = [];

function loadDepartmentsDropdown() {
    fetch("http://localhost:4000/Departments")
        .then((response) => response.json())
        .then((data) => {
            departmentsData = data; // خزّن البيانات لاستخدامها عند تغيير اللغة
            renderDepartmentsDropdown();
        })
        .catch((err) => {
            console.error("Error loading departments:", err);
        });
}

function renderDepartmentsDropdown() {
    const sectionOptions = document.getElementById("section-options");
    sectionOptions.innerHTML = "";
    // استخدم اللغة الحالية من العنصر <html lang="...">
    const lang = document.documentElement.lang || 'en';
    departmentsData.forEach((dep) => {
        // قسم الاسم بناءً على وجود |
        let nameEn = dep.name, nameAr = dep.name;
        if (dep.name.includes("|")) {
            const parts = dep.name.split("|");
            nameEn = parts[0].trim();
            nameAr = parts[1].trim();
        }
        const optionDiv = document.createElement("div");
        optionDiv.classList.add("dropdown-option");
        optionDiv.textContent = lang === "ar" ? nameAr : nameEn;
        optionDiv.onclick = () => {
            document.getElementById("selected-section").textContent = lang === "ar" ? nameAr : nameEn;
            document.getElementById("section").value = nameAr + "|" + nameEn;
            sectionOptions.parentElement.style.display = "none";
        };
        sectionOptions.appendChild(optionDiv);
    });
}

// عند تحميل الصفحة
window.addEventListener("DOMContentLoaded", () => {
    loadDepartmentsDropdown();
    
});

// دعم إعادة تحميل القائمة عند تغيير اللغة
if (window.switchLanguage) {
    const oldSwitch = window.switchLanguage;
    window.switchLanguage = function() {
        oldSwitch();
        renderDepartmentsDropdown();
    };
} else {
    // إذا لم تكن موجودة، راقب تغيير lang
    const observer = new MutationObserver(() => {
        renderDepartmentsDropdown();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}
console.log(translations);
console.log(translations.en.usernameEn, translations.ar.usernameEn);
// Handle signup form submission
// Handle signup form submission
document.getElementById("signupForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent default form submission

    // Gather input values
    const nameEn = document.getElementById("signupUsernameEn").value.trim();
    const nameAr = document.getElementById("signupUsernameAr").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const phone = document.getElementById("signupPhone").value.trim();
    const department = document.getElementById("section").value.trim();
    const employee_id = document.getElementById("employeeID").value.trim();
    const errorMessage = document.getElementById("signupError");

    // الاسم الكامل بصيغة انجليزي|عربي
    const name = nameEn + '|' + nameAr;
    const isAdmin = nameEn.toLowerCase() === "admin" || nameAr === "مشرف";

    // ✅ Validation
    if (!nameEn || !nameAr || !email || !password || (!isAdmin && (!phone || !department || !employee_id))) {
        errorMessage.textContent = "All fields are required!";
        return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        errorMessage.textContent = "Invalid email format!";
        return;
    }

    if (password.length < 6) {
        errorMessage.textContent = "Password must be at least 6 characters!";
        return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!isAdmin && !phoneRegex.test(phone)) {
        errorMessage.textContent = "Phone number must be exactly 10 digits.";
        return;
    }

    // ✅ Construct payload dynamically
    const payload = {
        name, // ← الاسم بصيغة انجليزي|عربي
        email,
        password
    };

    if (!isAdmin) {
        payload.phone = phone;
        payload.department = department;
        payload.employee_id = employee_id;
    }

    // ✅ Send to backend
    fetch("http://localhost:4000/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.token) {
                localStorage.setItem("userId", data.user.id);
                localStorage.setItem("token", data.token);
                localStorage.setItem("userRole", data.role);
                localStorage.setItem("userName", data.user.name);
                localStorage.setItem("userEmail", data.user.email);

                alert("Registration successful!");
                window.location.href = "/Home/Home.html";
            } else {
                errorMessage.textContent = data.message || "Signup failed.";
            }
        })
        .catch((error) => {
            console.error("Signup error:", error);
            errorMessage.textContent = "Server error. Please try again later.";
        });
});



document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const emailInput = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const errorMessage = document.getElementById("loginError");

    if (!emailInput || !password) {
        errorMessage.textContent = "Both email and password are required.";
        return;
    }

    // المحاولة الأولى: جرب مباشرة كما هو
    fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userRole", data.role);
                localStorage.setItem("userName", data.user.name);
                localStorage.setItem("userEmail", data.user.email);
                localStorage.setItem("userId", data.user.id);
                window.location.href = "/Home/Home.html";
            } else {
                // إذا فشل، جرب البحث عن الاسم الكامل
                fetch("http://localhost:4000/users")
                    .then(res => res.json())
                    .then(users => {
                        const found = users.find(u => {
                            if (!u.name) return false;
                            const [en, ar] = u.name.split("|").map(s => s.trim());
                            return emailInput === en || emailInput === ar;
                        });
                        if (!found) {
                            errorMessage.textContent = data.message || "Login failed.";
                            return;
                        }
                        // جرب تسجيل الدخول بالاسم الكامل
                        fetch("http://localhost:4000/login", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: found.name, password })
                        })
                            .then(res => res.json())
                            .then(data2 => {
                                if (data2.token) {
                                    localStorage.setItem("token", data2.token);
                                    localStorage.setItem("userRole", data2.role);
                                    localStorage.setItem("userName", data2.user.name);
                                    localStorage.setItem("userEmail", data2.user.email);
                                    localStorage.setItem("userId", data2.user.id);
                                    window.location.href = "/Home/Home.html";
                                } else {
                                    errorMessage.textContent = data2.message || "Login failed.";
                                }
                            })
                            .catch(err => {
                                console.error("Login error:", err);
                                errorMessage.textContent = "Server error. Please try again later.";
                            });
                    })
                    .catch(err => {
                        console.error("User fetch error:", err);
                        errorMessage.textContent = "Server error. Please try again later.";
                    });
            }
        })
        .catch(err => {
            console.error("Login error:", err);
            errorMessage.textContent = "Server error. Please try again later.";
        });
});

