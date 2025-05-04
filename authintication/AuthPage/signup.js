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


// Load departments into custom searchable dropdown
function loadDepartmentsDropdown() {
    fetch("http://localhost:4000/Departments")
        .then((response) => response.json())
        .then((data) => {
            const sectionOptions = document.getElementById("section-options");

            data.forEach((dep) => {
                const optionDiv = document.createElement("div");
                optionDiv.classList.add("dropdown-option");
                optionDiv.textContent = dep.name;
                optionDiv.onclick = () => {
                    document.getElementById("selected-section").textContent = dep.name;
                    document.getElementById("section").value = dep.name;
                    sectionOptions.parentElement.style.display = "none";
                };
                sectionOptions.appendChild(optionDiv);
            });
        })
        .catch((err) => {
            console.error("Error loading departments:", err);
        });
}

window.addEventListener("DOMContentLoaded", () => {
    loadDepartmentsDropdown();
});



// Handle signup form submission
document.getElementById("signupForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent default form submission

    // Gather input values
    const name = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const phone = document.getElementById("signupPhone").value.trim();
    const department = document.getElementById("section").value.trim();
    const employee_id = document.getElementById("employeeID").value.trim();
    const errorMessage = document.getElementById("signupError");

    // Validation
    if (!name || !email || !password || !phone || !department || !employee_id) {
        errorMessage.textContent = "All fields are required!";
        return;
    }

    // Email format check
    if (!/\S+@\S+\.\S+/.test(email)) {
        errorMessage.textContent = "Invalid email format!";
        return;
    }

    // Password length
    if (password.length < 6) {
        errorMessage.textContent = "Password must be at least 6 characters!";
        return;
    }

    // Phone number format: exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        errorMessage.textContent = "Phone number must be exactly 10 digits.";
        return;
    }

    // Send to backend
    fetch("http://localhost:4000/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name,
            email,
            password,
            phone,
            department,
            employee_id
        }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.token) {
                localStorage.setItem("userId", data.user.id);  // ← صح هنا
                localStorage.setItem("token", data.token);
                localStorage.setItem("userRole", data.role);
                localStorage.setItem("userName", data.user.name);
                localStorage.setItem("userEmail", data.user.email);
        
                alert("Registration successful!");
                window.location.href = "/Home/Home.html";
            } else {
                errorMessage.textContent = data.message;
            }
        })
        
        .catch((error) => {
            console.error("Signup error:", error);
            errorMessage.textContent = "Server error. Please try again later.";
        });
});



document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const errorMessage = document.getElementById("loginError");

    if (!email || !password) {
        errorMessage.textContent = "Both email and password are required.";
        return;
    }

    fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userRole", data.role); 
                localStorage.setItem("userName", data.user.name);
                localStorage.setItem("userEmail", data.user.email);
                localStorage.setItem("userId", data.user.id); // ⬅️ مهم جداً



                window.location.href = "/Home/Home.html";

            } else {
                errorMessage.textContent = data.message || "Login failed.";
            }
        })
        .catch(err => {
            console.error("Login error:", err);
            errorMessage.textContent = "Server error. Please try again later.";
        });
});

