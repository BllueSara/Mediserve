window.addEventListener("DOMContentLoaded", () => {
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    const role = localStorage.getItem("userRole");

    console.log("Loaded from storage:", { name, email, role }); // للتأكد من التخزين

    // عرض البيانات
    document.getElementById("username").value = name;
    document.getElementById("email").value = email;
    document.getElementById("role").value = role;
});

function signOutClicked() {
    localStorage.clear();
}
