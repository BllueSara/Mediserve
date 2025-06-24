window.addEventListener("DOMContentLoaded", () => {
    let name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    const role = localStorage.getItem("userRole");

    // فلترة الاسم حسب اللغة من languageManager فقط
    let lang = (window.languageManager && window.languageManager.currentLang) || "en";
    if (name && name.includes("|")) {
        const [en, ar] = name.split("|").map(s => s.trim());
        name = lang === "ar" ? (ar || en) : en;
    }

    console.log("Loaded from storage:", { name, email, role }); // للتأكد من التخزين

    // عرض البيانات
    document.getElementById("username").value = name;
    document.getElementById("email").value = email;
    document.getElementById("role").value = role;
});

function signOutClicked() {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId"); // ⬅️ مهم تنظفها
    window.location.href = "/login.html";}
