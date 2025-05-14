document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("activity-log-container");
  const filterButtons = document.querySelectorAll(".filter-btn");
  let allLogs = [];

  const iconMap = {
    Added: "/icon/add.png",
    Deleted: "/icon/delete.png",
    Edited: "/icon/edit.png",
    Submitted: "/icon/submit.png",
    Uploaded: "/icon/upload.png",
    Login: "/icon/login.png",
    Register: "/icon/add.png",
    Default: "/icon/info.png"
  };

  // ✅ جلب السجلات مرة واحدة فقط
  fetch("http://localhost:4000/activity-logs", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(res => res.json())
    .then(logs => {
      if (!Array.isArray(logs)) {
        container.innerHTML = "<p>No logs found.</p>";
        return;
      }

      allLogs = logs;
      renderLogs("All"); // عرض الكل بالبداية
      console.log("🔎 جميع الأحداث الموجودة:");
console.log(allLogs.map(log => log.action));
    })
    .catch(err => {
      console.error("❌ Failed to load logs:", err);
      container.innerHTML = "<p>Error loading activity logs.</p>";
    });

  // ✅ دالة ترسم السجلات حسب الفلتر المحدد
function renderLogs(filter, searchTerm = "") {
  container.innerHTML = "";

  const filteredLogs = allLogs.filter(log => {
    const action = log.action?.toLowerCase() || "";
    const details = log.details?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    const actionMatch = filter === "All" || action.includes(filter.toLowerCase());
    const searchMatch = action.includes(search) || details.includes(search);

    return actionMatch && searchMatch;
  });

  if (filteredLogs.length === 0) {
    container.innerHTML = "<p>No logs found for this category.</p>";
    return;
  }

  filteredLogs.forEach(log => {
    const icon = iconMap[log.action] || iconMap.Default;
    const createdAt = new Date(log.timestamp);
    const time = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = createdAt.toLocaleDateString();

    const card = document.createElement("div");
    card.className = "activity-card";

    card.innerHTML = `
      <div class="flex gap-4">
        <img src="${icon}" class="icon" alt="${log.action}" />
        <div class="activity-content">
          <h2>${log.action}</h2>
          <p>${log.details}</p>
          <p class="meta">By: ${log.user_name}</p>
        </div>
      </div>
      <div class="activity-time">
        <p>${time}</p>
        <p class="date">${date}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

const searchInput = document.getElementById("search-input");
let currentFilter = "All";

// الفلتر بالأزرار
filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    document.querySelector(".filter-btn.active")?.classList.remove("active");
    button.classList.add("active");

    currentFilter = button.dataset.filter;
    renderLogs(currentFilter, searchInput.value);
  });
});

// البحث بالكلمة
searchInput.addEventListener("input", () => {
  renderLogs(currentFilter, searchInput.value);
});
});
