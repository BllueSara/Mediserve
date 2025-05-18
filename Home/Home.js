document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 الصفحة تم تحميلها بنجاح!");

  const role = localStorage.getItem("userRole");
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  // ✅ إظهار رابط Logs إذا أدمن أو عنده صلاحية check_logs
  const logsLink = document.getElementById("logs-link");
  if (logsLink && await hasPermissionOrAdmin("check_logs")) {
    logsLink.classList.remove("hidden");
  }

  // ✅ إظهار لوحة الأدمن إذا أدمن أو عنده صلاحية edit_permission
  const adminBox = document.getElementById("admin-panel");
  if (adminBox && await hasPermissionOrAdmin("edit_permission")) {
    adminBox.classList.remove("hidden");
  }

  // ✅ عرض عدد الإشعارات
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
      console.error("❌ Error fetching notification count:", err);
    }
  }

  // ✅ تقليل عدد الإشعارات عند الضغط
  const notifBtn = document.getElementById("notif-btn");
  if (notifBtn && notifCountSpan) {
    notifBtn.addEventListener("click", () => {
      let count = parseInt(notifCountSpan.textContent) || 0;
      if (count > 0) {
        count--;
        notifCountSpan.textContent = count;
        if (count === 0) notifCountSpan.style.display = "none";
      }
    });
  }

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
