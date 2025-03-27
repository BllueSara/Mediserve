document.addEventListener("DOMContentLoaded", () => {
    // زر Back
    document.querySelector(".back-button")?.addEventListener("click", () => {
      history.back();
    });
  
    // زر Home
    document.querySelector(".Home-button")?.addEventListener("click", () => {
      window.location.href = "/Home/home.html";
    });
  
    // زر New Report
    document.querySelector(".new-report-btn")?.addEventListener("click", () => {
      window.location.href = "/Technical Support/Reports/NewReport.html";
    });
  
    // كروت التقارير - تودي للصفحة
    document.querySelectorAll(".report-card[data-href]").forEach(card => {
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        const href = card.getAttribute("data-href");
        if (href) window.location.href = href;
      });
    });
  
    // ✅ Pagination: عند الضغط على رقم الصفحة
    document.querySelectorAll(".pagination .page-btn[data-page]").forEach(button => {
      button.addEventListener("click", () => {
        const page = button.dataset.page;
        if (page) {
          // يعيد تحميل الصفحة مع رقم الصفحة في الرابط
          window.location.href = `Search reports.html?page=${page}`;
        }
      });
    });
  });
  