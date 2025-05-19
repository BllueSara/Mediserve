document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("userRole");

  console.log("🚀 الصفحة تم تحميلها بنجاح!");

  // ✅ تحقق من حالة الحساب كل دقيقة
  checkAccountStatus(); // تحقق فوري عند تحميل الصفحة

  setInterval(checkAccountStatus, 60000); // وبعدها كل دقيقة

  async function checkAccountStatus() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:4000/me/status", {
        headers: { Authorization: "Bearer " + token }
      });
      const data = await res.json();
      if (data.status === "inactive") {
        alert("🚫 تم تعطيل حسابك. سيتم تسجيل الخروج الآن.");
        localStorage.clear();
        window.location.href = "/authintication/AuthPage/LoginEnglish.html";
      }
    } catch (err) {
      console.error("🚨 فشل التحقق من حالة الحساب:", err);
    }
  }


  // ✅ إظهار صلاحيات حسب الدور
  if (await hasPermissionOrAdmin("check_logs")) {
    document.getElementById("logs-link")?.classList.remove("hidden");
  }
  if (await hasPermissionOrAdmin("edit_permission")) {
    document.getElementById("admin-panel")?.classList.remove("hidden");
  }

  // ✅ إشعارات
  const notifCountSpan = document.getElementById("notif-count");
  if (notifCountSpan) {
    try {
      const res = await fetch("http://localhost:4000/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : 0;
      notifCountSpan.textContent = count;
      notifCountSpan.style.display = count > 0 ? "inline-block" : "none";
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
    }
  }

  // ✅ تقليل عدد الإشعارات عند الضغط
  document.getElementById("notif-btn")?.addEventListener("click", () => {
    let count = parseInt(notifCountSpan.textContent) || 0;
    if (count > 0) {
      count--;
      notifCountSpan.textContent = count;
      if (count === 0) notifCountSpan.style.display = "none";
    }
  });

  // ✅ تحديد البطاقة والتنقل
  document.querySelectorAll(".service-box").forEach(service => {
    service.addEventListener("click", function () {
      document.querySelectorAll(".service-box").forEach(s => s.classList.remove("selected"));
      this.classList.add("selected");

      const url = this.getAttribute("data-url");
      if (url) window.location.href = url;
    });
  });
});

async function hasPermissionOrAdmin(key) {
  const role = localStorage.getItem("userRole");
  if (role === "admin") return true;

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  if (!token || !userId) return false;

  try {
    const res = await fetch(`http://localhost:4000/users/${userId}/permissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const permissions = await res.json();
    return !!permissions[key];
  } catch (err) {
    console.error("❌ Failed to fetch permissions:", err);
    return false;
  }
}
