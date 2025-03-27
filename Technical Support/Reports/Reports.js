document.addEventListener("DOMContentLoaded", () => {
    // 🔁 زر الرجوع
    const backButton = document.querySelector(".back-button");
    backButton?.addEventListener("click", () => window.history.back());
  
    // 🔁 أزرار الهوم
    const homeSelectors = [".home-button", ".photo-label", ".home-section"];
    homeSelectors.forEach((selector) => {
      const el = document.querySelector(selector);
      el?.addEventListener("click", () => {
        window.location.href = "profile.html"; // عدل للرابط الصحيح للصفحة الرئيسية
      });
    });
  
    // 🔁 عناصر لها روابط حسب الكلاس
    const classBasedLinks = {
      container1: "/Technical Support/Reports/ReportsType2.html",
      container2: "", // ممكن تضيف له لاحقاً
      internal_report: "reports_dashboard.html",
      external_report: "reports_dashboard.html",
      new_report: "new_report.html",
      maintenance: "maintenance_dashboard.html",
      report_details: "maintenance_report.html",
    };
  
    Object.entries(classBasedLinks).forEach(([className, link]) => {
      if (!link) return;
      const el = document.querySelector(`.${className}`);
      el?.addEventListener("click", () => {
        window.location.href = link;
      });
    });
  
    // 🔁 التنقل عن طريق select
    const selectRoutes = [
      { selector: "#reportType", link: "reports_dashboard.html" },
      { selector: "#deviceType", link: "maintenance_dashboard.html" },
      { selector: "#status", link: "maintenance_report.html" },
    ];
  
    selectRoutes.forEach(({ selector, link }) => {
      const selectEl = document.querySelector(selector);
      selectEl?.addEventListener("change", () => {
        window.location.href = link;
      });
    });
  
    // 🔁 عناصر بكرت مثل .option فيها data-href
    document.querySelectorAll("[data-href]").forEach((el) => {
      el.style.cursor = "pointer"; // عشان يبين أنه قابل للضغط
      el.addEventListener("click", () => {
        const target = el.getAttribute("data-href");
        if (target) window.location.href = target;
      });
    });
  });
  