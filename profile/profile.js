window.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const roleInput = document.getElementById("role");
  
    // جلب البيانات من localStorage
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail"); // تأكد من تخزينه وقت تسجيل الدخول
    const role = localStorage.getItem("userRole");
  
    if (name) usernameInput.value = name;
    if (email) emailInput.value = email;
    if (role) roleInput.value = role;
  });
  
  function signOutClicked() {
    localStorage.clear(); // مسح كل البيانات
  }
  