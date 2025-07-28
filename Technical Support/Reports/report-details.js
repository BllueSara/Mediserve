// Make goBack available globally for HTML onclick handlers immediately
window.goBack = function() {
  window.history.back();
};

// Also make it available as a fallback for any remaining onclick handlers
window.addEventListener('DOMContentLoaded', () => {
  window.goBack = function() {
    window.history.back();
  };
  
  // Ensure back button is properly translated when language changes
  if (window.languageManager && typeof window.languageManager.onLanguageChange === 'function') {
    window.languageManager.onLanguageChange(() => {
      const backButton = document.getElementById("back-button");
      if (backButton) {
        const backSpan = backButton.querySelector('span[data-i18n="back"]');
        if (backSpan) {
          backSpan.textContent = window.languageManager.currentLang === 'ar' ? 'رجوع' : 'Back';
        }
      }
    });
  }
});

import {
  loadFonts,
  setReportStatus
} from "../shared_functions/reports_details_helpers/helpers.js";

import { generatePdf, getTranslations } from "../shared_functions/reports_details_helpers/pdf_helpers.js";
import { 
  activateEditMode, 
  collectUpdatedData, 
  prepareFormData, 
  submitUpdatedData, 
  handleSuccessfulSave,
} from "../shared_functions/reports_details_helpers/update_helpers.js";
import { setGlobalVariables } from "../shared_functions/reports_details_helpers/ui_helpers.js";
import { showToast, showErrorToast, showSuccessToast, showWarningToast, showInfoToast } from '../shared_functions/toast.js';

let reportData = null;
const canvas = document.getElementById("signatureCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
let drawing = false;
let userDrewOnCanvas = false;

// تحسين الأداء: تحميل الترجمة مسبقاً
const translations = getTranslations();

document.addEventListener("DOMContentLoaded", async () => {
  // Add event listener for back button
  const backButton = document.getElementById("back-button");
  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.history.back();
    });
  } else {
    console.warn("Back button not found in the DOM");
  }

  const saveBtn = document.querySelector(".save-btn");
  const reportId = new URLSearchParams(window.location.search).get("id");
  const reportType = new URLSearchParams(window.location.search).get("type");

  if (!reportId) {
    showErrorToast("No report ID provided");
    return;
  }

  // إخفاء المحتوى حتى يتم تحميل اللغة
  const container = document.querySelector('.container');
  const navButtons = document.querySelector('.nav-buttons');
  const header = document.querySelector('header');
  
  if (container) {
    container.classList.add('content-hidden');
  }
  if (navButtons) {
    navButtons.classList.add('content-hidden');
  }
  if (header) {
    header.classList.add('content-hidden');
  }

  // تعيين المتغيرات العامة للدوال المساعدة مبكراً
  setGlobalVariables(languageManager, translations);

  try {
    // تحميل التقرير
    const response = await fetch(`http://localhost:4000/report/${reportId}?type=${reportType}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rawReport = await response.json();
    
    // استيراد الدوال المساعدة
    const {
      prepareReport,
      processInitialData,
      setBasicReportData,
      setDescription,
      setTechnicalNotes,
      setAttachments,
      createNewReportSpecs,
      createRegularReportSpecs,
      processNewReport,
      extractTicketNumber,
      createReportTitle
    } = await import('../shared_functions/reports_details_helpers/helpers.js');

    // معالجة التقرير الأولية
    const report = prepareReport(rawReport);
    reportData = report;

    const lang = languageManager.currentLang;

    // معالجة البيانات الأولية
    const { map, rawMap } = processInitialData(report, translations, lang);

    // تعيين البيانات الأساسية للتقرير
    await setBasicReportData(report, translations, lang);
    
    // تعيين المرفقات والتوقيع
    setAttachments(report);

    const isExternal = report.source === "external";

    if (reportType === "new") {
      processNewReport(report, lang, languageManager);
      createNewReportSpecs(report, lang, languageManager);
      
      // تعيين حالة التقرير مع الترجمة والألوان
      setReportStatus(report.status, lang);
      
      // تطبيق الترجمة النهائية
    languageManager.applyLanguage();
    
    // إظهار المحتوى بعد تحميل اللغة
    setTimeout(() => {
      if (container) {
        container.classList.remove('content-hidden');
        container.classList.add('content-visible');
      }
      if (navButtons) {
        navButtons.classList.remove('content-hidden');
        navButtons.classList.add('content-visible');
      }
      if (header) {
        header.classList.remove('content-hidden');
        header.classList.add('content-visible');
      }
      
      // إخفاء loading spinner
      const loadingSpinner = document.getElementById('loading-spinner');
      if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
      }
    }, 100);
    return;
    }

    // معالجة البيانات الأساسية للتقارير العادية
    const isInternalTicket = report.maintenance_type === "Internal";
    const ticketNumber = extractTicketNumber(report);
    const reportTitle = createReportTitle(report, translations, lang);
    
    document.getElementById("report-title").textContent = reportTitle;
    document.getElementById("report-title").setAttribute("data-i18n", "report_title_key");

    document.getElementById("report-id").textContent =
      report.maintenance_type === "Internal"
        ? report.ticket_number || `INT-${report.id}`
        : report.report_number || report.request_number || `MR-${report.id}`;

    // تعيين حالة التقرير مع الترجمة والألوان
    setReportStatus(report.status, lang);

    // معالجة وعرض الوصف
    setDescription(report, lang);

    // معالجة الملاحظات التقنية
    setTechnicalNotes(report, lang, translations);

    // إنشاء مواصفات الجهاز
    createRegularReportSpecs(report, lang, languageManager);
    
    // تطبيق الترجمة النهائية
    languageManager.applyLanguage();
    
    // إظهار المحتوى بعد تحميل اللغة
    setTimeout(() => {
      if (container) {
        container.classList.remove('content-hidden');
        container.classList.add('content-visible');
      }
      if (navButtons) {
        navButtons.classList.remove('content-hidden');
        navButtons.classList.add('content-visible');
      }
      if (header) {
        header.classList.remove('content-hidden');
        header.classList.add('content-visible');
      }
      
      // إخفاء loading spinner
      const loadingSpinner = document.getElementById('loading-spinner');
      if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
      }
    }, 100);

  } catch (err) {
    console.error("❌ Error fetching report:", err);
    
    // عرض رسالة خطأ أكثر وضوحاً للمستخدم
    const errorMessage = err.message.includes('fetch') 
      ? "❌ فشل في الاتصال بالخادم. تأكد من تشغيل الخادم على المنفذ 4000"
      : `❌ حدث خطأ أثناء تحميل التقرير: ${err.message}`;
    
    showErrorToast(errorMessage);
    
    // إضافة رسالة في الصفحة
    const container = document.querySelector('.container') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      background: #fee;
      border: 1px solid #fcc;
      color: #c33;
      padding: 20px;
      margin: 20px;
      border-radius: 5px;
      text-align: center;
    `;
    errorDiv.innerHTML = `
      <h3>❌ خطأ في تحميل التقرير</h3>
      <p>${errorMessage}</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; margin: 10px;">
        إعادة المحاولة
      </button>
    `;
    container.appendChild(errorDiv);
    
    // إظهار المحتوى حتى في حالة الخطأ
    setTimeout(() => {
      if (container) {
        container.classList.remove('content-hidden');
        container.classList.add('content-visible');
      }
      if (navButtons) {
        navButtons.classList.remove('content-hidden');
        navButtons.classList.add('content-visible');
      }
      if (header) {
        header.classList.remove('content-hidden');
        header.classList.add('content-visible');
      }
      
      // إخفاء loading spinner
      const loadingSpinner = document.getElementById('loading-spinner');
      if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
      }
    }, 100);
  }

  // ⬇️ تحميل PDF
  document.querySelector(".download-btn")?.addEventListener("click", () => {
    document.getElementById("pdf-options-modal").style.display = "block";
  });

  // ✅ دعم توليد PDF بلغتين (عربية / إنجليزية)
  document.getElementById("generate-pdf-btn")?.addEventListener("click", async () => {
    document.getElementById("pdf-options-modal").style.display = "none";
    const { tajawalRegularBase64, tajawalBoldBase64 } = await loadFonts();
    await generatePdf(reportData, translations, tajawalRegularBase64, tajawalBoldBase64);
  });

  // ===== تكوين الحقول بسبب lookupConfig (ثابتة) =====
  const lookupConfig = [
    { fieldId: "assigned-to", api: "http://localhost:4000/Technical" },
    { fieldId: "department", api: "http://localhost:4000/Departments" },
    { fieldId: "category", api: "http://localhost:4000/api/categories" },
    { fieldId: "device_type", api: "http://localhost:4000/api/device-types" },
  ];

  // ===== نحذف الحقل الثابت model من هنا ونعلّمه خاصة =====
  const specConfig = [
    { key: "cpu", api: "http://localhost:4000/CPU_Types" },
    { key: "ram", api: "http://localhost:4000/RAM_Types" },
    { key: "os", api: "http://localhost:4000/OS_Types" },
    { key: "generation", api: "http://localhost:4000/Processor_Generations" },
    { key: "hard_drive", api: "http://localhost:4000/Hard_Drive_Types" },
    { key: "ram_size", api: "http://localhost:4000/RAM_Sizes" },
    { key: "printer_type", api: "http://localhost:4000/Printer_Types" },
    { key: "scanner_type", api: "http://localhost:4000/Scanner_Types" },
    { key: "ink_type", api: "http://localhost:4000/Ink_Types" },
  ];

  // ===== تفعيل وضع التعديل (Edit Mode) =====
  document.querySelector(".edit-btn")?.addEventListener("click", async () => {
    await activateEditMode(reportData, lookupConfig, specConfig);
  });

  document.querySelector(".save-btn")?.addEventListener("click", async () => {
    try {
      // Collect updated data from form fields
      const updatedData = collectUpdatedData(reportData, lookupConfig, specConfig);
      
      // Prepare FormData for submission
      const formData = await prepareFormData(updatedData, userDrewOnCanvas);
      
      // Submit to server
      const result = await submitUpdatedData(formData);
      
      if (result.message) {
        handleSuccessfulSave();
      } else {
        throw new Error("❌ لم يتم الحفظ");
      }
    } catch (err) {
      console.error("❌ فشل الحفظ:", err);
      showErrorToast("❌ حدث خطأ أثناء الحفظ: " + err.message);
    }
  });

  // إغلاق
  document.querySelector(".close-btn")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to close this report?")) {
      window.location.href = "Search Reports.html";
    }
  });

  // ✅ توقيع بالقلم على Canvas
  canvas.addEventListener("mousedown", () => {
    drawing = true;
    userDrewOnCanvas = true;
    ctx.beginPath();
  });
  
  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });
  
  canvas.addEventListener("mouseup", () => drawing = false);
  canvas.addEventListener("mouseleave", () => drawing = false);

  // ✅ رفع صورة توقيع
  const signatureUpload = document.getElementById("signatureUpload");
  const uploadedSignature = document.getElementById("uploadedSignature");

  signatureUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedSignature.src = event.target.result;
      uploadedSignature.style.display = "block";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    reader.readAsDataURL(file);
  });

  // ✅ تنظيف التوقيع
  document.getElementById("clearSignature").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signatureUpload.value = "";
    uploadedSignature.src = "";
    uploadedSignature.style.display = "none";
  });
});
     