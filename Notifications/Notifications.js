let allNotifications = [];
let showingAll = false;

const notifPopup   = document.getElementById('notifications-popup');
const notifList    = document.getElementById('notifications-list');
const notifButton  = document.querySelector('a[href="/Notifications/Notifications.html"]');

// نظام فلترة النصوص حسب اللغة:
// 1. النصوص داخل قوسين []: (["Printer driver error pops up| يظهر خطأ في برنامج تشغيل الطابعة"])
// 2. الأسماء المفصولة بـ |: "Ahmed Al-Khuzai|احمد الخزاعي", "admin|مشرف"
// 3. أسماء المهندسين باللغتين: "assigned to engineer Mohammed محمد مشاط"
// يتم فلترة النص حسب اللغة المحددة في languageManager.currentLang

function cleanTag(text) {
  return typeof text === 'string'
    ? text.replace(/\s*\[(ar|en)\]/gi, '').trim()
    : text;
}

/// دالة ترجمة عبر Google Translate
async function translateWithGoogle(text, targetLang, sourceLang = "en") {
  if (!text || !targetLang || targetLang === sourceLang) return text;
  const encoded = encodeURIComponent(text);
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx` +
    `&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encoded}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch Google Translate");
    const data = await res.json();
    return data?.[0]?.[0]?.[0] || text;
  } catch (err) {
    console.warn("⚠️ translateWithGoogle error:", err);
    return text;
  }
}

notifButton.addEventListener('click', (e) => {
  e.preventDefault();
  toggleNotifications();
});

async function fetchUnseenCount() {
  const token = localStorage.getItem('token');
  const notifCount = document.getElementById('notif-count');

  try {
    const res = await fetch('http://localhost:4000/notifications/unseen-count', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const { count } = await res.json();

    if (count > 0) {
      notifCount.textContent = count;
      notifCount.style.display = 'inline-block';
    } else {
      notifCount.textContent = '';
      notifCount.style.display = 'none';
    }
  } catch (err) {
    console.error('❌ Failed to fetch unseen count:', err);
  }
}

async function toggleNotifications() {
  const notifCount = document.getElementById('notif-count');

  if (notifPopup.classList.contains('hidden')) {
    await loadNotifications();
    notifPopup.classList.remove('hidden');

    try {
      // بعد عرض البوب أب، نعلم السيرفر أن الإشعارات أصبحت مرئية
      const res = await fetch('http://localhost:4000/notifications/mark-as-seen', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const result = await res.json();

      if (res.ok && result.message === 'All notifications marked as seen') {
        // نعيد جلب عدد الإشعارات غير المقروءة
        await fetchUnseenCount();
        // نحدّث allNotifications داخليًا لو أردنا الاحتفاظ بوضع is_seen
        allNotifications = allNotifications.map(n => ({ ...n, is_seen: true }));
      } else {
        console.warn("⚠️ Server didn't confirm marking as seen.");
      }
    } catch (err) {
      console.error('❌ Failed to mark notifications as seen:', err);
    }
  } else {
    notifPopup.classList.add('hidden');
  }
}

async function loadNotifications() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:4000/notifications', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    allNotifications = await res.json();
    renderNotifications();
  } catch (err) {
    console.error('Error loading notifications:', err);
    notifList.innerHTML = '<div class="p-4 text-center text-red-400">Failed to load notifications</div>';
  }
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

// دالة للتعامل مع النصوص داخل قوسين [] التي تحتوي على | لفصل اللغتين
function filterBracketedTextByLang(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  // البحث عن نصوص داخل قوسين [] تحتوي على | لفصل اللغتين
  // مثال: (["Printer driver error pops up| يظهر خطأ في برنامج تشغيل الطابعة"])
  return text.replace(/\(\["([^"]+)\|([^"]+)"\]\)/g, (match, englishPart, arabicPart) => {
    const english = englishPart.trim();
    const arabic = arabicPart.trim();
    
    // التحقق من أن الجزء العربي يحتوي على أحرف عربية
    const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(arabic);
    
    if (lang === 'ar') {
      return hasArabicChars ? arabic : english; // إذا كانت اللغة عربية، نعرض الجزء العربي إذا كان يحتوي على أحرف عربية
    } else {
      return english || arabic; // إذا كانت اللغة إنجليزية، نعرض الجزء الإنجليزي، وإلا الجزء العربي
    }
  });
}

// دالة للتعامل مع أسماء المهندسين التي تأتي باللغتين معًا
function filterEngineerNamesByLang(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  // البحث عن أسماء مهندسين تأتي باللغتين معًا
  // مثال: "assigned to engineer Mohammed محمد مشاط"
  return text.replace(/(\b[A-Za-z]+\s+)([A-Za-zء-ي0-9_\-]+\s+[ء-ي0-9_\-]+)/g, (match, prefix, namePart) => {
    const parts = namePart.trim().split(/\s+/);
    
    // البحث عن الجزء الإنجليزي والجزء العربي
    let englishName = '';
    let arabicName = '';
    
    for (const part of parts) {
      // التحقق من أن الجزء يحتوي على أحرف عربية
      const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(part);
      
      if (hasArabicChars) {
        arabicName = part;
      } else {
        englishName = part;
      }
    }
    
    if (lang === 'ar') {
      return prefix + (arabicName || englishName); // إذا كانت اللغة عربية، نعرض الاسم العربي إذا وجد
    } else {
      return prefix + (englishName || arabicName); // إذا كانت اللغة إنجليزية، نعرض الاسم الإنجليزي إذا وجد
    }
  });
}

async function renderNotifications() {
  notifList.innerHTML = '';
  const notificationsToShow = showingAll ? allNotifications : allNotifications.slice(0, 4);
  const lang = languageManager.currentLang; // مثال: "ar" أو "en"

  if (notificationsToShow.length === 0) {
    notifList.innerHTML = '<div class="p-4 text-center text-gray-400">No notifications</div>';
    return;
  }

  for (const n of notificationsToShow) {
    let rawMessage = cleanTag(n.message);
    // فلترة النصوص داخل قوسين [] أولاً
    rawMessage = filterBracketedTextByLang(rawMessage, lang);
    // ثم فلترة الأسماء المفصولة بـ |
    rawMessage = filterEngineerNameByLang(rawMessage, lang);
    // ثم فلترة أسماء المهندسين باللغتين معًا
    rawMessage = filterEngineerNamesByLang(rawMessage, lang);
    const displayMessage = rawMessage;

    // جلب العنوان الأصلي من getTypeLabel فقط (بدون ترجمة)
    const rawLabel = getTypeLabel(n.type);
    const displayLabel = rawLabel;

    const div = document.createElement('div');
    div.className = `notification-item p-3 border-b ${getColor(n.type)}`;
    div.dataset.id = n.id;

    div.innerHTML = `
      <div class="notification-content">
        <div class="font-semibold">${displayLabel}</div>
        <div class="text-sm text-gray-600">${displayMessage}</div>
        <div class="text-xs text-gray-400">${new Date(n.created_at).toLocaleString()}</div>
      </div>
    `;

    notifList.appendChild(div);
    setupSwipeToDelete(div);
  }
}

function setupSwipeToDelete(elem) {
  let startX = 0;
  let currentX = 0;
  let dragging = false;
  let isTouch = false;

  const start = (clientX) => {
    startX = clientX;
    currentX = startX;
    dragging = true;
    elem.classList.add('swiping');
  };

  const move = (clientX) => {
    if (!dragging) return;
    currentX = clientX;
    const translateX = Math.max(0, currentX - startX);
    elem.style.transform = `translateX(${translateX}px)`;

    if (translateX > 100) {
      elem.classList.add('delete-ready');
    } else {
      elem.classList.remove('delete-ready');
    }
  };

  const end = async () => {
    if (!dragging) return;
    dragging = false;
    const translateX = currentX - startX;

    elem.classList.remove('swiping');

    if (translateX > 100) {
      elem.style.transform = `translateX(100%)`;
      await deleteNotification(elem);
    } else {
      elem.style.transform = `translateX(0)`;
      elem.classList.remove('delete-ready');
    }
  };

  // Touch events
  elem.addEventListener('touchstart', (e) => {
    isTouch = true;
    start(e.touches[0].clientX);
  });
  elem.addEventListener('touchmove', (e) => {
    if (isTouch) move(e.touches[0].clientX);
  });
  elem.addEventListener('touchend', () => {
    if (isTouch) end();
  });

  // Mouse events
  elem.addEventListener('mousedown', (e) => {
    isTouch = false;
    start(e.clientX);
  });
  elem.addEventListener('mousemove', (e) => {
    if (!isTouch && dragging) move(e.clientX);
  });
  elem.addEventListener('mouseup', () => {
    if (!isTouch) end();
  });
  elem.addEventListener('mouseleave', () => {
    if (dragging && !isTouch) end();
  });
}

async function deleteNotification(elem) {
  const notifId = elem.dataset.id;
  try {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:4000/notifications/${notifId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    allNotifications = allNotifications.filter(n => n.id != notifId);
    renderNotifications();
  } catch (err) {
    console.error('❌ Failed to delete notification:', err);
  }
}

async function clearNotifications() {
  const token = localStorage.getItem('token');
  try {
    await fetch('http://localhost:4000/notifications/clear', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    allNotifications = [];
    renderNotifications();
  } catch (err) {
    console.error('❌ Failed to clear notifications:', err);
  }
}

function viewAll() {
  showingAll = true;
  renderNotifications();
}

function getColor(type) {
  if (type.includes('maintenance')) return 'border-l-4 border-blue-500';
  if (type.includes('report'))      return 'border-l-4 border-green-500';
  if (type.includes('ticket'))      return 'border-l-4 border-yellow-500';
  return 'border-l-4 border-gray-500';
}

function getTypeLabel(type) {
  switch (type) {
    case 'regular-maintenance':         return ' Regular Maintenance';
    case 'general-maintenance':         return ' General Maintenance';
    case 'external-maintenance':        return ' External Maintenance';
    case 'internal-ticket':             return ' Internal Ticket';
    case 'external-ticket':             return ' External Ticket';
    case 'general-report':              return ' General Report';
    case 'regular-report':              return ' Regular Report';
    case 'external-report':             return ' External Report';
    case 'internal-ticket-report':      return ' Internal Ticket Report';
    case 'external-ticket-report':      return ' External Ticket Report';
    case 'status-update':               return ' Status Update';
    case 'external-status-update':      return ' External Report Status Update';
    default:                            return ' Notification';
  }
}

window.addEventListener('DOMContentLoaded', fetchUnseenCount);
