document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("activity-log-container");
  
    // نوع الحدث → الأيقونة المناسبة
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
  
    // دالة جلب اللوقز
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
  
        logs.forEach(log => {
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
      })
      .catch(err => {
        console.error("❌ Failed to load logs:", err);
        container.innerHTML = "<p>Error loading activity logs.</p>";
      });
  });
  