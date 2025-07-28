import { showToast, showErrorToast, showSuccessToast, showWarningToast, showInfoToast } from '../shared_functions/toast.js';

document.addEventListener("DOMContentLoaded", () => {
  const reportType = localStorage.getItem("reportType"); // internal / external

  // احذر لو ما حُدد النوع
  if (!reportType) {
    showWarningToast("❗ Please select report type first");
    window.location.href = "Report Type.html"; // رجع المستخدم لاختيار النوع
    return;
  }

  const options = document.querySelectorAll(".option");

  options.forEach(option => {
    option.addEventListener("click", () => {
      const label = option.querySelector("p")?.textContent?.toLowerCase();
      const currentLang = languageManager.currentLang;

      // تحديد الحالة بناءً على اللغة الحالية
      if (currentLang === 'ar') {
        if (label.includes("مفتوح")) {
          localStorage.setItem("reportStatusFilter", "Open");
        } else if (label.includes("قيد التنفيذ")) {
          localStorage.setItem("reportStatusFilter", "In Progress");
        } else if (label.includes("مغلق")) {
          localStorage.setItem("reportStatusFilter", "Closed");
        }
      } else {
        if (label.includes("open")) {
          localStorage.setItem("reportStatusFilter", "Open");
        } else if (label.includes("in progress")) {
          localStorage.setItem("reportStatusFilter", "In Progress");
        } else if (label.includes("closed")) {
          localStorage.setItem("reportStatusFilter", "Closed");
        }
      }

      // ✅ التوجيه حسب نوع التقرير
      if (reportType === "internal") {
        window.location.href = "/Technical Support/Reports/Search reports.html";
      } else if (reportType === "external") {
        window.location.href = "/Technical Support/Reports/Search reports2.html";
      }
    });
  });
});

function goBack() {
  window.history.back();
}

// دالة للانتقال مباشرة مع تحديد الحالة
function goToSearchWithStatus(status) {
  localStorage.setItem("reportStatusFilter", status);
  
  const reportType = localStorage.getItem("reportType");
  if (reportType === "internal") {
    window.location.href = "/Technical Support/Reports/Search reports.html";
  } else if (reportType === "external") {
    window.location.href = "/Technical Support/Reports/Search reports2.html";
  }
}

// دالة لتغيير الصورة عند التمرير
function changeImage(element, newImageSrc) {
  const img = element.querySelector('img');
  if (img) {
    img.src = newImageSrc;
  }
}

// Make functions globally accessible for HTML onclick/onmouseover/onmouseout attributes
window.goBack = goBack;
window.goToSearchWithStatus = goToSearchWithStatus;
window.changeImage = changeImage;
