function cleanTag(text) {
  return typeof text === "string"
    ? text.replace(/\s*\[(ar|en)\]/gi, "").trim()
    : text;
}

function filterEngineerNameByLang(text, lang) {
  if (!text || typeof text !== 'string') return text;
  // فلترة أي اسم فيه | حتى لو جاء بعد كلمات مثل engineer أو user أو غيرها
  // أمثلة: to engineer Sara|سارة, assigned to user Ali|علي
  return text.replace(/([A-Za-zء-ي0-9_\-]+\|[A-Za-zء-ي0-9_\-]+)/g, (match) => {
    const parts = match.split('|').map(s => s.trim());
    if (parts.length === 2) {
      return lang === 'ar' ? (parts[1] || parts[0]) : parts[0];
    }
    return match;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("activity-log-container");
  const filterButtons = document.querySelectorAll(".filter-btn");
  let allLogs = [];



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

  const lang = languageManager.currentLang || "en";

  const filteredLogs = allLogs.filter(log => {
    const actionText = typeof log.action === "object" && log.action !== null
      ? log.action[lang] || log.action.en || ""
      : log.action || "";
    const detailsText = typeof log.details === "object" && log.details !== null
      ? log.details[lang] || log.details.en || ""
      : log.details || "";

    const action = cleanTag(actionText)?.toLowerCase() || "";
    const details = cleanTag(detailsText)?.toLowerCase() || "";
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
    const createdAt = new Date(log.timestamp);
    const time = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = createdAt.toLocaleDateString();

    const actionText = typeof log.action === "object" && log.action !== null
      ? log.action[lang] || log.action.en || ""
      : log.action || "";
    const detailsText = typeof log.details === "object" && log.details !== null
      ? log.details[lang] || log.details.en || ""
      : log.details || "";
    const userText = typeof log.user_name === "object" && log.user_name !== null
      ? log.user_name[lang] || log.user_name.en || ""
      : log.user_name || "";

    // فلترة اسم المهندس حسب اللغة
    const action = filterEngineerNameByLang(cleanTag(actionText), lang);
    const details = filterEngineerNameByLang(cleanTag(detailsText), lang);
    const user = filterEngineerNameByLang(cleanTag(userText), lang);
  const byText = lang === "ar" ? "بواسطة" : "By";

    const card = document.createElement("div");
    card.className = "activity-card";

    card.innerHTML = `
      <div class="flex gap-4">
        <div class="activity-content">
          <h2>${action}</h2>
          <p>${details}</p>
      <p class="meta">${byText}: ${user}</p>
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

// // ===================== دوال مساعدة =====================

// // 1) تنضيف وسوم [ar] أو [en] من نص
// function cleanTag(text) {
//   return typeof text === "string"
//     ? text.replace(/\s*\[(ar|en)\]/gi, "").trim()
//     : text;
// }

// // 2) دالة طلب ترجمة مباشرة من Google Translate
// async function translateWithGoogle(text, targetLang, sourceLang = "en") {
//   if (!text || !targetLang || targetLang === sourceLang) return text;
//   const encoded = encodeURIComponent(text);
//   const url =
//     `https://translate.googleapis.com/translate_a/single?client=gtx` +
//     `&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encoded}`;

//   try {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error("Failed to fetch Google Translate");
//     const data = await res.json();
//     return data?.[0]?.[0]?.[0] || text;
//   } catch (err) {
//     console.warn("⚠️ translateWithGoogle error:", err);
//     return text;
//   }
// }

// // 3) دالة لتنظيف كامل كائن التقرير من أي وسم [ar] أو [en]
// function cleanReport(raw) {
//   const cleaned = {};
//   for (const key in raw) {
//     if (typeof raw[key] === "string") {
//       cleaned[key] = cleanTag(raw[key]);
//     } else {
//       cleaned[key] = raw[key];
//     }
//   }
//   return cleaned;
// }

// // ===================== الكود الرئيسي =====================

// document.addEventListener("DOMContentLoaded", () => {
//   const container = document.getElementById("activity-log-container");
//   const filterButtons = document.querySelectorAll(".filter-btn");
//   const searchInput   = document.getElementById("search-input");
//   let allLogs = [];
//   let currentFilter = "All";

//   // أولًا: جلب كل السجلات وتخزينها في allLogs
//   fetch("http://localhost:4000/activity-logs", {
//     headers: {
//       Authorization: `Bearer ${localStorage.getItem("token")}`
//     }
//   })
//     .then(res => res.json())
//     .then(logs => {
//       if (!Array.isArray(logs)) {
//         container.innerHTML = "<p>No logs found.</p>";
//         return;
//       }
//       // نظّف كل مدخلات السجلات من أي وسم غير ضروري
//       allLogs = logs.map(cleanReport);

//       // عرض جميع السجلات في البداية
//       renderLogs(); 
//     })
//     .catch(err => {
//       console.error("❌ Failed to load logs:", err);
//       container.innerHTML = "<p>Error loading activity logs.</p>";
//     });

//   // عند الضغط على أي زر فلترة:
//   filterButtons.forEach(button => {
//     button.addEventListener("click", () => {
//       document.querySelector(".filter-btn.active")?.classList.remove("active");
//       button.classList.add("active");
//       currentFilter = button.dataset.filter;
//       renderLogs();
//     });
//   });

//   // عند الكتابة في حقل البحث:
//   searchInput.addEventListener("input", () => {
//     renderLogs();
//   });


//   // =========== دالة renderLogs تصبح async حتى نتمكّن من استخدام await ===========

//   async function renderLogs() {
//     container.innerHTML = "";

//     const searchTerm = searchInput.value.trim().toLowerCase();

//     // 1) فلترة السجلات حسب الزر النشط وعبارة البحث
//     const filteredLogs = allLogs.filter(log => {
//       const action  = cleanTag(log.action || "").toLowerCase();
//       const details = cleanTag(log.details || "").toLowerCase();
//       const filter  = currentFilter.toLowerCase();
//       const search  = searchTerm.toLowerCase();

//       // مطابقة الفلتر (All يعني كل السجلات)
//       const actionMatch = (filter === "all") || action.includes(filter);

//       // مطابقة البحث في حقل action أو details
//       const searchMatch = !search || action.includes(search) || details.includes(search);

//       return actionMatch && searchMatch;
//     });

//     if (filteredLogs.length === 0) {
//       container.innerHTML = "<p>No logs found for this category.</p>";
//       return;
//     }

//     // 2) لكل سجل مطلوب، نبني بطاقة عرض (وبما أننا قد نحتاج ترجمة عبر Google، نستخدم await)
//     for (const log of filteredLogs) {
//       // صياغة التاريخ والوقت
//       const createdAt = new Date(log.timestamp);
//       const time = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//       const date = createdAt.toLocaleDateString();

//       // نظّف الحقول أولًا من أي وسم زائد
//       const rawAction  = cleanTag(log.action || "");
//       const rawDetails = cleanTag(log.details || "");
//       const rawUser    = cleanTag(log.user_name || "");

//       // بناء النصوص الأصلية
//       let displayAction  = rawAction;
//       let displayDetails = rawDetails;
//       let displayUser    = rawUser;

//       // إذا كانت لغة العرض الحالية ليست "en" (أي المطلوب ترجمتها):
//       const lang = languageManager.currentLang; // مثلاً "ar" أو "en"
//       if (lang && lang !== "en") {
//         // ترجمة الفعل action
//         displayAction = await translateWithGoogle(rawAction, lang, "en");
//         // ترجمة التفاصيل details
//         displayDetails = await translateWithGoogle(rawDetails, lang, "en");
//         // (اختياري) ترجمة اسم المستخدم إذا لزم الأمر. غالبًا يبقى كما هو.
//         // displayUser = await translateWithGoogle(rawUser, lang, "en");
//       }

//       // بناء بطاقة HTML واحدة
//       const card = document.createElement("div");
//       card.className = "activity-card";

//       card.innerHTML = `
//         <div class="flex gap-4">
//           <div class="activity-content">
//             <h2>${displayAction}</h2>
//             <p>${displayDetails}</p>
//             <p class="meta">By: ${displayUser}</p>
//           </div>
//         </div>
//         <div class="activity-time">
//           <p>${time}</p>
//           <p class="date">${date}</p>
//         </div>
//       `;

//       container.appendChild(card);
//     }
//   }

// }); // نهاية DOMContentLoaded
