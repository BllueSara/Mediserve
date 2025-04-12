document.addEventListener("DOMContentLoaded", () => {
  // Back button - goes to the previous page in browser history
  document.querySelector(".back-button")?.addEventListener("click", () => {
    history.back();
  });

  // Home button - redirects to the home page
  document.querySelector(".Home-button")?.addEventListener("click", () => {
    window.location.href = "/Home/home.html";
  });

  // New Report button - redirects to the new report creation page
  document.querySelector(".new-report-btn")?.addEventListener("click", () => {
    window.location.href = "NewReport.html";
  });

  // Report cards - clicking on a card redirects to the detail page
  document.querySelectorAll(".report-card[data-href]").forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const href = card.getAttribute("data-href");
      if (href) window.location.href = href;
    });
  });

  // Pagination - when clicking on a page number button
  document.querySelectorAll(".pagination .page-btn[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      if (page) {
        // Reloads the page with the selected page number in the URL
        window.location.href = `Search reports.html?page=${page}`;
      }
    });
  });
});

  