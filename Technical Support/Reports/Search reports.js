document.addEventListener("DOMContentLoaded", () => {
  // Back button
  document.querySelector(".back-button")?.addEventListener("click", () => {
    history.back();
  });

  // Home button
  document.querySelector(".Home-button")?.addEventListener("click", () => {
    window.location.href = "/Home/home.html";
  });

  // New Report button
  document.querySelector(".new-report-btn")?.addEventListener("click", () => {
    window.location.href = "NewReport.html";
  });

  // Pagination
  document.querySelectorAll(".pagination .page-btn[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      if (page) {
        window.location.href = `Search reports.html?page=${page}`;
      }
    });
  });

  // Load reports
  fetch("http://localhost:5050/get-internal-reports")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("report-list");

      if (!data.length) {
        container.innerHTML = "<p>No reports found.</p>";
        return;
      }

      data.forEach(report => {
        const card = document.createElement("div");
        card.className = "report-card";

        const statusClass = getStatusClass(report.status);

        card.innerHTML = `
          <div class="report-card-header">
            <img src="/icon/Maintenance.png" alt="Maintenance Icon" />
            Maintenance <span class="status ${statusClass}">${report.status || "N/A"}</span>
          </div>
          <div class="report-details">
            <img src="/icon/desktop.png" alt="Device Icon" />
            <span>${formatDateTime(report.created_at)}</span>
          </div>
          <p><strong>Ticket:</strong> ${report.ticket_number || "N/A"}</p>
          <p><strong>Device:</strong> ${report.device_name || "N/A"}</p>
          <p><strong>Department:</strong> ${report.department_name || "N/A"}</p>
          <p><strong>Issue:</strong> ${report.issue_summary || "No issue summary"}</p>
        `;

        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error("❌ Error loading reports:", err);
      document.getElementById("report-list").innerHTML = "<p>Error loading reports.</p>";
    });
});


// Format datetime
function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Status color class
function getStatusClass(status) {
  if (!status) return "pending";
  const statusClean = status.toLowerCase();
  if (statusClean === "completed" || statusClean === "closed") return "completed";
  if (statusClean === "in progress") return "in-progress";
  return "pending";
}
