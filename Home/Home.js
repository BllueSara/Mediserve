document.addEventListener("DOMContentLoaded", function() {
    console.log("🚀 الصفحة تم تحميلها بنجاح!");

    // تأثير تحديد البطاقات عند الضغط
    document.querySelectorAll(".service-box").forEach(service => {
        service.addEventListener("click", function() {
            document.querySelectorAll(".service-box").forEach(s => s.classList.remove("selected"));
            this.classList.add("selected");

            // التنقل إلى الصفحة المحددة في data-url
            const url = this.getAttribute("data-url"); // ✅ تصحيح الخطأ هنا
            if (url) {
                window.location.href = url;
            }
        });
    });

    // تقليل عدد الإشعارات عند الضغط
    let notifBtn = document.getElementById("notif-btn");
    let notifCount = document.getElementById("notif-count");

    if (notifBtn && notifCount) {
        notifBtn.addEventListener("click", function() {
            let count = parseInt(notifCount.textContent) || 0;

            if (count > 0) {
                count--;
                notifCount.textContent = count;

                if (count === 0) {
                    notifCount.style.display = "none";
                }
            }
        });
    }
     const notifCountSpan = document.getElementById("notif-count");

  if (!notifCountSpan) return;

  fetch("http://localhost:4000/notifications", {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  })
  .then(res => res.json())
  .then(data => {
    if (!Array.isArray(data)) return;

    const count = data.length;
    if (count > 0) {
      notifCountSpan.textContent = count;
      notifCountSpan.classList.remove("hidden");
    } else {
      notifCountSpan.classList.add("hidden");
    }
  })
  .catch(err => {
    console.error("❌ Error fetching notification count:", err);
  });
});


window.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('userRole'); // ← مهم يكون نفس الاسم المستخدم في login
    const logsLink = document.getElementById('logs-link');

    if (role === 'admin' && logsLink) {
        logsLink.classList.remove('hidden');
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem('userRole'); // ← مهم يكون نفس الاسم المستخدم في login

  // إظهار مربع الأدمن فقط إذا كان الدور هو admin
  if (role === "admin") {
    const adminBox = document.getElementById("admin-panel");
    if (adminBox) {
      adminBox.classList.remove("hidden");
    }
  }

  // التنقل عند الضغط على أي مربع خدمة
  document.querySelectorAll(".service-box").forEach(box => {
    box.addEventListener("click", () => {
      const url = box.getAttribute("data-url");
      if (url) window.location.href = url;
    });
  });
});
