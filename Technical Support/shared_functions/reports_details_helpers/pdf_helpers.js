// دوال مساعدة لتوليد PDF في تقارير التفاصيل

import {
  prepareArabic, // دالة تجهيز النص العربي
  getImageBase64, // دالة تحويل الصورة إلى Base64
  waitForImagesToLoad, // دالة انتظار تحميل الصور
  reverseTranslate, // دالة الترجمة العكسية
  processPipeText, // دالة معالجة النصوص
  normalizeText, // دالة تطبيع النصوص
  getTitleKey, // دالة الحصول على مفتاح العنوان
  getAssignedTo // دالة الحصول على اسم المسؤول
} from './helpers.js';

import {
  findLabelKeyByAnyLang // دالة البحث عن مفتاح التسمية بأي لغة
} from './translation.js';

// ترجمات الحقول للـ PDF
const getFieldTranslations = (lang) => {
  return {
    en: { 
      report: "Report", 
      report_id: "Report ID", 
      priority: "Priority", 
      device_type: "Device Type", 
      assigned_to: "Assigned To", 
      department: "Department", 
      category: "Category", 
      attachment: "Attachment", 
      description: "Description", 
      technical_notes: "Technical Notes", 
      signature: "Signature", 
      specs: "Device Specifications" 
    },
    ar: { 
      report: "تقرير", 
      report_id: "رقم التقرير", 
      priority: "الأولوية", 
      device_type: "نوع الجهاز", 
      assigned_to: "المسؤول", 
      department: "القسم", 
      category: "الفئة", 
      attachment: "المرفق", 
      description: "الوصف", 
      technical_notes: "ملاحظات فنية", 
      signature: "التوقيع", 
      specs: "مواصفات الجهاز" 
    }
  }[lang];
};

// ترجمات ملاحظات تقنية
const getNoteTranslations = () => {
  return {
    "Customer Name": { en: "Customer Name", ar: "اسم العميل" },
    "ID Number": { en: "ID Number", ar: "رقم الهوية" },
    "Ext Number": { en: "Ext Number", ar: "رقم التمديد" },
    "Initial Diagnosis": { en: "Initial Diagnosis", ar: "التشخيص الأولي" },
    "Final Diagnosis": { en: "Final Diagnosis", ar: "التشخيص النهائي" },
    "Floor": { en: "Floor", ar: "الطابق" },
    // 🔧 إصلاح: إضافة ترجمات إضافية محتملة
    "customer_name": { en: "Customer Name", ar: "اسم العميل" },
    "id_number": { en: "ID Number", ar: "رقم الهوية" },
    "ext_number": { en: "Ext Number", ar: "رقم التمديد" },
    "initial_diagnosis": { en: "Initial Diagnosis", ar: "التشخيص الأولي" },
    "final_diagnosis": { en: "Final Diagnosis", ar: "التشخيص النهائي" },
    "floor": { en: "Floor", ar: "الطابق" },
    "اسم العميل": { en: "Customer Name", ar: "اسم العميل" },
    "رقم الهوية": { en: "ID Number", ar: "رقم الهوية" },
    "رقم التمديد": { en: "Ext Number", ar: "رقم التمديد" },
    "التشخيص الأولي": { en: "Initial Diagnosis", ar: "التشخيص الأولي" },
    "التشخيص النهائي": { en: "Final Diagnosis", ar: "التشخيص النهائي" },
    "الطابق": { en: "Floor", ar: "الطابق" }
  };
};

// ترجمات الطوابق
const getFloorTranslations = () => {
  return {
    "Basement 2": { en: "Basement 2", ar: "القبو الثاني" },
    "Basement 1": { en: "Basement 1", ar: "القبو الأول" },
    "Below Ground": { en: "Below Ground", ar: "تحت الأرض" },
    "Ground Level": { en: "Ground Level", ar: "الدور الأرضي" },
    "First Floor": { en: "First Floor", ar: "الدور الأول" },
    "Second Floor": { en: "Second Floor", ar: "الدور الثاني" },
    "Third Floor": { en: "Third Floor", ar: "الدور الثالث" },
    "Forth Floor": { en: "Fourth Floor", ar: "الدور الرابع" },
    "Fifth Floor": { en: "Fifth Floor", ar: "الدور الخامس" },
    "Sixth Floor": { en: "Sixth Floor", ar: "الدور السادس" },
    "Seventh Floor": { en: "Seventh Floor", ar: "الدور السابع" },
    "Eighth Floor": { en: "Eighth Floor", ar: "الدور الثامن" },
    "Ninth Floor": { en: "Ninth Floor", ar: "الدور التاسع" },
    "Tenth Floor": { en: "Tenth Floor", ar: "الدور العاشر" },
    "Rooftop": { en: "Rooftop", ar: "السطح" },
    "Parking": { en: "Parking", ar: "مواقف السيارات" }
  };
};

// ترجمات مواصفات الجهاز
const getSpecsTranslations = () => {
  return {
    device_name: { en: "Device Name", ar: "اسم الجهاز" },
    serial_number: { en: "Serial Number", ar: "الرقم التسلسلي" },
    ministry_number: { en: "Ministry Number", ar: "الرقم الوزاري" },
    cpu: { en: "CPU", ar: "المعالج" },
    ram: { en: "RAM", ar: "نوع الذاكرة" },
    os: { en: "OS", ar: "نظام التشغيل" },
    generation: { en: "Generation", ar: "الجيل" },
    model: { en: "Model", ar: "الموديل" },
    device_type: { en: "Device Type", ar: "نوع الجهاز" },
    hard_drive: { en: "Hard Drive", ar: "نوع القرص" },
    ram_size: { en: "RAM Size", ar: "حجم الذاكرة" },
    mac_address: { en: "MAC Address", ar: "عنوان MAC" },
    ip_address: { en: "IP Address", ar: "عنوان IP" },
    printer_type: { en: "Printer Type", ar: "نوع الطابعة" },
    ink_type: { en: "Ink Type", ar: "نوع الحبر" },
    ink_serial: { en: "Ink Serial Number", ar: "الرقم التسلسلي للحبر" },
    scanner_type: { en: "Scanner Type", ar: "نوع الماسح الضوئي" }
  };
};

// دالة إعداد الخطوط للـ PDF
export const setupPdfFonts = (doc, tajawalRegularBase64, tajawalBoldBase64) => {
  doc.addFileToVFS("Amiri-Regular.ttf", tajawalRegularBase64); // إضافة خط Amiri-Regular
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal"); // إضافة الخط العادي
  doc.addFileToVFS("Amiri-Bold.ttf", tajawalBoldBase64); // إضافة خط Amiri-Bold
  doc.addFont("Amiri-Bold.ttf", "Amiri", "bold"); // إضافة الخط العريض
  doc.setFont("Amiri", "normal"); // تعيين الخط الافتراضي
};

// دالة إضافة الشعارات للـ PDF
export const addLogosToPdf = (doc, msLogoImg, hospitalLogoImg) => {
  const pageWidth = doc.internal.pageSize.getWidth(); // عرض الصفحة
  const msBase64 = getImageBase64(msLogoImg); // تحويل شعار ms إلى Base64
  const hospitalBase64 = getImageBase64(hospitalLogoImg); // تحويل شعار المستشفى إلى Base64
  
  doc.addImage(msBase64, "PNG", 3, 8, 25, 12); // إضافة شعار ms
  doc.addImage(hospitalBase64, "PNG", pageWidth - 35, 8, 25, 12); // إضافة شعار المستشفى
};

// دالة إضافة عنوان التقرير للـ PDF
export const addReportTitle = (doc, reportTitle, lang, translations, pageWidth) => {
  const L = getFieldTranslations(lang);
  const isArabic = lang === "ar";
  
  let title = reportTitle.split("#")[0].trim();
  const titleKey = getTitleKey(title);
  const translatedReportTitle = titleKey
    ? translations.titleType[titleKey]?.[lang]
    : title;

  const titleText = isArabic
    ? prepareArabic(`${L.report} :${translatedReportTitle}`)
    : `${L.report}: ${translatedReportTitle}`;

  doc.setFont("Amiri", "bold");
  doc.text(titleText, pageWidth / 2, 20, { align: "center" });
};

// دالة إضافة الحقول الأساسية للـ PDF
export const addBasicFields = (doc, reportData, lang, translations, pageWidth, y) => {
  const L = getFieldTranslations(lang);
  const isArabic = lang === "ar";
  const align = isArabic ? "right" : "left";
  const xLabel = isArabic ? pageWidth - 15 : 15;
  const xValue = isArabic ? pageWidth - 60 : 60;

  const rawDeviceType = document.getElementById("device-type")?.textContent?.trim();
  const rawCategory = document.getElementById("category")?.textContent?.trim();
  const rawPriority = document.getElementById("priority")?.textContent?.trim();
  const rawDeptFull = reportData.department_name || "";

  const parts = rawDeptFull.split("|");
  const enPart = parts[0]?.trim() || "";
  const arPart = parts[1]?.trim() || "";
  const translatedDepartment = (lang === "ar") ? (arPart || enPart) : enPart;
  
  const translatedAssignedTo = getAssignedTo(reportData, lang) || "N/A";
  const translatedPriority = reverseTranslate(rawPriority, translations.priority, lang);
  const translatedDeviceType = reverseTranslate(rawDeviceType, translations.deviceType, lang);
  const translatedCategory = reverseTranslate(rawCategory, translations.category, lang);

  const showPriority = document.getElementById("opt-priority").checked;
  const showDeviceType = document.getElementById("opt-device-type").checked;

  const fields = [
    [L.report_id, document.getElementById("report-id")?.textContent],
    showPriority && [L.priority, translatedPriority],
    showDeviceType && [L.device_type, translatedDeviceType],
    [L.assigned_to, translatedAssignedTo],
    [L.department, translatedDepartment],
    [L.category, translatedCategory]
  ].filter(Boolean);

  fields.forEach(([label, value]) => {
    const labelText = isArabic ? prepareArabic(`${label}`) : `${label}:`;
    const valueText = isArabic ? prepareArabic(value || "") : (value || "");
    doc.setFont("Amiri", "bold").text(labelText, xLabel, y, { align });
    doc.setFont("Amiri", "normal").text(valueText, xValue, y, { align });
    y += 8;
  });

  return y;
};

// دالة إضافة المرفقات للـ PDF
export const addAttachments = (doc, reportData, lang, pageWidth, y) => {
  const L = getFieldTranslations(lang);
  const isArabic = lang === "ar";
  const align = isArabic ? "right" : "left";
  const xLabel = isArabic ? pageWidth - 15 : 15;
  const xValue = isArabic ? pageWidth - 60 : 60;
  
  const showAttachment = document.getElementById("opt-attachment").checked;
  const attachmentName = reportData?.attachment_name || null;
  const attachmentUrl = reportData?.attachment_path ? `http://localhost:4000/uploads/${reportData.attachment_path}` : null;

  if (showAttachment && attachmentName && attachmentUrl) {
    const label = isArabic ? prepareArabic(`${L.attachment}:`) : `${L.attachment}:`;
    doc.setFont("Amiri", "bold").text(label, xLabel, y, { align });
    doc.setTextColor(0, 0, 255);
    doc.textWithLink(attachmentName, xValue, y, { url: attachmentUrl, align });
    doc.setTextColor(0, 0, 0);
    y += 8;
  }

  return y;
};

// دالة معالجة الوصف للـ PDF
export const processDescriptionForPdf = (reportData, lang) => {
  let originalDescription = "";
  
  if (reportData.source === "new") {
    let newDescription = reportData.description || "";
    if (typeof reportData.problem_status === "string" && reportData.problem_status.trim().startsWith("[")) {
      try {
        const problemArray = JSON.parse(reportData.problem_status);
        if (Array.isArray(problemArray) && problemArray.length > 0) {
          const processedItems = problemArray.map(item => {
            if (typeof item === "string" && item.includes("|")) {
              const parts = item.split("|").map(p => p.trim());
              return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
            }
            return item;
          });
          originalDescription = processedItems.join("\n");
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse new report problem_status JSON in PDF:", e);
        originalDescription = newDescription;
      }
    } else {
      originalDescription = newDescription;
    }
  } else if (reportData.maintenance_type === "General") {
    let generalProblem = reportData.problem_status || reportData.issue_description || reportData.issue_summary || "";
    if (typeof generalProblem === "string" && generalProblem.trim().startsWith("[")) {
      try {
        const problemArray = JSON.parse(generalProblem);
        if (Array.isArray(problemArray) && problemArray.length > 0) {
          const processedItems = problemArray.map(item => {
            if (typeof item === "string" && item.includes("|")) {
              const parts = item.split("|").map(p => p.trim());
              return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
            }
            return item;
          });
          originalDescription = processedItems.join("\n");
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse General problem_status JSON in PDF:", e);
        originalDescription = generalProblem;
      }
    } else {
      originalDescription = generalProblem;
    }
  } else if (reportData.maintenance_type === "Regular") {
    let regularProblem = reportData.problem_status || reportData.issue_summary || "";
    if (typeof regularProblem === "string" && regularProblem.trim().startsWith("[")) {
      try {
        const problemArray = JSON.parse(regularProblem);
        if (Array.isArray(problemArray) && problemArray.length > 0) {
          const processedItems = problemArray.map(item => {
            if (typeof item === "string" && item.includes("|")) {
              const parts = item.split("|").map(p => p.trim());
              return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
            }
            return item;
          });
          originalDescription = processedItems.join("\n");
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse Regular problem_status JSON in PDF:", e);
        originalDescription = regularProblem;
      }
    } else {
      originalDescription = regularProblem;
    }
  } else if (reportData.maintenance_type === "Internal") {
    let internalSummary = reportData.issue_summary || reportData.initial_diagnosis || "";
    if (typeof internalSummary === "string" && internalSummary.trim().startsWith("[")) {
      try {
        const summaryArray = JSON.parse(internalSummary);
        if (Array.isArray(summaryArray) && summaryArray.length > 0) {
          const processedItems = summaryArray.map(item => {
            if (typeof item === "string" && item.includes("|")) {
              const parts = item.split("|").map(p => p.trim());
              return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
            }
            return item;
          });
          originalDescription = processedItems.join("\n");
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse Internal issue_summary JSON in PDF:", e);
        originalDescription = internalSummary;
      }
    } else {
      originalDescription = internalSummary;
    }
  } else {
    let problem = reportData.problem_status || "";
    if (typeof problem === "string" && problem.trim().startsWith("[")) {
      try {
        const problemArray = JSON.parse(problem);
        if (Array.isArray(problemArray) && problemArray.length > 0) {
          const processedItems = problemArray.map(item => {
            if (typeof item === "string" && item.includes("|")) {
              const parts = item.split("|").map(p => p.trim());
              return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
            }
            return item;
          });
          problem = processedItems.join("\n");
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse problem_status JSON in PDF:", e);
      }
    }
    
    const summary = reportData.issue_summary || reportData.initial_diagnosis || "";
    
    if (problem && summary) {
      const normalizedProblem = problem.toLowerCase();
      const normalizedSummary = summary.toLowerCase();
      
      if (normalizedSummary.includes(normalizedProblem)) {
        originalDescription = summary;
      } else if (normalizedProblem.includes(normalizedSummary)) {
        originalDescription = problem;
      } else {
        originalDescription = `${summary}\n${problem}`;
      }
    } else if (problem) {
      originalDescription = problem;
    } else if (summary) {
      originalDescription = summary;
    }
  }

  originalDescription = processPipeText(originalDescription, lang);
  return originalDescription;
};

// دالة إضافة الوصف للـ PDF
export const addDescription = (doc, reportData, lang, translations, pageWidth, y) => {
  const L = getFieldTranslations(lang);
  const isArabic = lang === "ar";
  const align = isArabic ? "right" : "left";
  const xLabel = isArabic ? pageWidth - 15 : 15;
  
  const showDescription = document.getElementById("opt-description").checked;
  if (!showDescription) return y;

  y += 5;
  const descLabel = isArabic ? prepareArabic(L.description) : `${L.description}:`;
  doc.setFont("Amiri", "bold").text(descLabel, xLabel, y, { align });
  y += 6;

  const originalDescription = processDescriptionForPdf(reportData, lang);
  let items = [];

  if (reportData.maintenance_type === "General") {
    console.log("🔍 PDF General Maintenance - reportData.problem_status:", reportData.problem_status);
    let generalProblem = reportData.problem_status || "";
    if (typeof generalProblem === "string" && generalProblem.trim().startsWith("[")) {
      try {
        const problemArray = JSON.parse(generalProblem);
        console.log("🔍 PDF General Maintenance - parsed problemArray:", problemArray);
        if (Array.isArray(problemArray) && problemArray.length > 0) {
          const processedItems = problemArray.map(item => {
            if (typeof item === "string" && item.includes("|")) {
              const parts = item.split("|").map(p => p.trim());
              return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
            }
            return item;
          });
          console.log("🔍 PDF General Maintenance - processedItems:", processedItems);
          items = processedItems;
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse General problem_status JSON in PDF:", e);
        items = [originalDescription];
      }
    } else {
      console.log("🔍 PDF General Maintenance - using originalDescription:", originalDescription);
      items = [originalDescription];
    }
    console.log("🔍 PDF General Maintenance - final items:", items);
  } else if (reportData.maintenance_type === "Internal") {
    console.log("🔍 PDF Internal Maintenance - reportData.issue_summary:", reportData.issue_summary);
    let internalSummary = reportData.issue_summary || "";
    if (typeof internalSummary === "string" && internalSummary.trim().startsWith("[")) {
      try {
        const summaryArray = JSON.parse(internalSummary);
        console.log("🔍 PDF Internal Maintenance - parsed summaryArray:", summaryArray);
        if (Array.isArray(summaryArray) && summaryArray.length > 0) {
          const processedItems = summaryArray.map(item => {
            if (typeof item === "string" && item.includes("|")) {
              const parts = item.split("|").map(p => p.trim());
              return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
            }
            return item;
          });
          console.log("🔍 PDF Internal Maintenance - processedItems:", processedItems);
          items = processedItems;
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse Internal issue_summary JSON in PDF:", e);
        items = [originalDescription];
      }
    } else {
      console.log("🔍 PDF Internal Maintenance - using originalDescription:", originalDescription);
      items = [originalDescription];
    }
    console.log("🔍 PDF Internal Maintenance - final items:", items);
  } else if (reportData.source === "new") {
    let newDescription = reportData.description || "";
    if (typeof reportData.problem_status === "string" && reportData.problem_status.trim().startsWith("[")) {
      try {
        const problemArray = JSON.parse(reportData.problem_status);
        if (Array.isArray(problemArray) && problemArray.length > 0) {
          const processedItems = problemArray.map(item => {
            if (typeof item === "string" && item.includes("|")) {
              const parts = item.split("|").map(p => p.trim());
              return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
            }
            return item;
          });
          newDescription = processedItems.join("\n");
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse new report problem_status JSON:", e);
        newDescription = processPipeText(reportData.description, lang) || "No description.";
      }
    } else {
      newDescription = processPipeText(reportData.description, lang) || "No description.";
    }
    items = [newDescription];
  } else {
    try {
      items = JSON.parse(originalDescription);
      if (!Array.isArray(items)) throw new Error();
    } catch {
      let cleanedDesc = originalDescription;
      
      if (cleanedDesc.startsWith("[") && cleanedDesc.endsWith("]")) {
        cleanedDesc = cleanedDesc.slice(1, -1);
      } else if (cleanedDesc.startsWith("[")) {
        cleanedDesc = cleanedDesc.slice(1);
      }
      
      items = cleanedDesc
        .replace(/^["""]?|["""]?$/g, "")
        .split(/[\n\r\-•]+/g)
        .map(s => s.replace(/^["""]?|["""]?$/g, "").trim())
        .filter(Boolean);
    }
  }

  items.forEach(text => {
    const normalizedInput = normalizeText(text);
    const processedText = processPipeText(text, lang);
    
    const translated = processedText;

    console.log("--------");
    console.log("Raw Text:", text);
    console.log("Normalized Input:", normalizedInput);
    console.log("Processed Text:", processedText);
    console.log("Translated Text:", translated);
    console.log("Language:", lang);

    const finalText = lang === "ar" ? prepareArabic(translated) : translated;
    const wrapped = doc.splitTextToSize(finalText, pageWidth - 30);
    doc.setFont("Amiri", "normal").text(wrapped, xLabel, y, { align });
    y += wrapped.length * 6 + 2;
  });

  y += 3;
  return y;
};

// دالة إضافة الملاحظات التقنية للـ PDF
export const addTechnicalNotes = (doc, lang, pageWidth, y) => {
  const L = getFieldTranslations(lang);
  const isArabic = lang === "ar";
  const align = isArabic ? "right" : "left";
  const xLabel = isArabic ? pageWidth - 15 : 15;
  
  const showNote = document.getElementById("opt-note").checked;
  if (!showNote) return y;

  // 🔧 إصلاح: انتظار قليل للتأكد من تحميل العناصر
  const noteElement = document.getElementById("note");
  console.log("🔍 PDF Technical Notes - Note element:", noteElement);
  console.log("🔍 PDF Technical Notes - Note element HTML:", noteElement?.innerHTML);

  // 🔧 إصلاح: محاولة العثور على العناصر بطرق مختلفة
  let rows = Array.from(document.querySelectorAll("#note .info-row"));
  
  // إذا لم نجد عناصر info-row، جرب البحث عن أي عناصر تحتوي على info-label
  if (rows.length === 0) {
    rows = Array.from(document.querySelectorAll("#note [class*='info']"));
    console.log("🔍 PDF Technical Notes - Trying alternative selector, found:", rows.length);
  }
  
  // إذا لم نجد أي شيء، جرب البحث عن أي عناصر div داخل #note
  if (rows.length === 0) {
    rows = Array.from(document.querySelectorAll("#note div"));
    console.log("🔍 PDF Technical Notes - Trying div selector, found:", rows.length);
  }

  console.log("🔍 PDF Technical Notes - Final rows count:", rows.length);
  
  if (rows.length === 0) {
    console.log("⚠️ No technical notes rows found in #note");
    // 🔧 إصلاح: محاولة العثور على أي محتوى في #note
    const noteContent = noteElement?.textContent?.trim();
    if (noteContent) {
      console.log("🔍 PDF Technical Notes - Found note content:", noteContent);
      const noteLabel = isArabic ? prepareArabic(L.technical_notes) : L.technical_notes;
      doc.setFont("Amiri", "bold").text(noteLabel, xLabel, y, { align });
      y += 6;
      
      const processedContent = processPipeText(noteContent, lang);
      const finalText = isArabic ? prepareArabic(processedContent) : processedContent;
      const lines = doc.splitTextToSize(finalText, pageWidth - 30);
      doc.setFont("Amiri", "normal").text(lines, xLabel, y, { align });
      y += lines.length * 6 + 2;
    }
    return y;
  }

  const noteLabel = isArabic ? prepareArabic(L.technical_notes) : L.technical_notes;

  doc.setFont("Amiri", "bold").text(noteLabel, xLabel, y, { align });
  y += 6;

  const noteLabelTranslations = getNoteTranslations();
  const floors = getFloorTranslations();

  rows.forEach((row, index) => {
    // 🔧 إصلاح: محاولة العثور على العناصر بطرق مختلفة
    let labelEl = row.querySelector(".info-label");
    let valueEl = row.querySelector(".info-value");
    
    // إذا لم نجد العناصر بالطريقة العادية، جرب البحث عن أي عناصر span
    if (!labelEl || !valueEl) {
      const spans = row.querySelectorAll("span");
      if (spans.length >= 2) {
        labelEl = spans[0];
        valueEl = spans[1];
      }
    }
    
    let rawLabel = labelEl?.textContent?.trim() || "";
    let value = valueEl?.textContent?.trim() || "";

    console.log(`🔍 PDF Technical Notes - Row ${index + 1}:`, {
      labelElement: labelEl,
      valueElement: valueEl,
      rawLabel: rawLabel,
      value: value,
      rowHTML: row.innerHTML
    });

    // إذا لم يكن هناك label، قد يكون هذا نوع آخر من الملاحظات
    if (!rawLabel && value) {
      // هذا قد يكون ملاحظة تقنية عادية بدون label
      const processedValue = processPipeText(value, lang);
      const finalText = isArabic ? prepareArabic(processedValue) : processedValue;
      const lines = doc.splitTextToSize(finalText, pageWidth - 30);
      doc.setFont("Amiri", "normal").text(lines, xLabel, y, { align });
      y += lines.length * 6 + 2;
      return;
    }

    // 🔧 إصلاح: إذا كان هناك label ولكن لا توجد قيمة، تخطى هذا الصف
    if (rawLabel && !value) {
      console.log("⚠️ Skipping row with label but no value:", rawLabel);
      return;
    }

    rawLabel = rawLabel.replace(/:$/, "").trim();
    const labelKey = findLabelKeyByAnyLang(rawLabel, noteLabelTranslations);
    const translatedLabel = labelKey ? noteLabelTranslations[labelKey][lang] : rawLabel;

    let translatedValue = value;
    if (labelKey === "Floor") {
      const floorKey = findLabelKeyByAnyLang(value, floors);
      translatedValue = floorKey ? floors[floorKey][lang] : value;
    }

    console.log("----------- NOTE ITEM -----------");
    console.log("Raw Label:", rawLabel);
    console.log("Value:", value);
    console.log("Label Key:", labelKey);
    console.log("Translated Label:", translatedLabel);
    console.log("Translated Value:", translatedValue);
    console.log("Language:", lang);

    const line = isArabic
      ? prepareArabic(`${translatedValue} :${translatedLabel}`)
      : `${translatedLabel}: ${translatedValue}`;

    const lines = doc.splitTextToSize(line, pageWidth - 30);
    doc.setFont("Amiri", "normal").text(lines, xLabel, y, { align });
    y += lines.length * 6 + 2;
  });

  y += 5;
  return y;
};

// دالة إضافة مواصفات الجهاز للـ PDF
export const addDeviceSpecs = (doc, lang, pageWidth, y) => {
  const L = getFieldTranslations(lang);
  const isArabic = lang === "ar";
  const align = isArabic ? "right" : "left";
  const xLabel = isArabic ? pageWidth - 15 : 15;
  
  const showSpecs = document.getElementById("opt-specs").checked;
  if (!showSpecs) return y;

  const specsTitle = isArabic ? prepareArabic(L.specs) : `${L.specs}:`;
  doc.setFont("Amiri", "bold").text(specsTitle, xLabel, y, { align });
  y += 8;

  const labelTranslations = getSpecsTranslations();

  const specs = Array.from(document.querySelectorAll("#device-specs .spec-box"))
    .map(box => {
      const spans = box.querySelectorAll("span");
      if (spans.length < 2) return null;

      const i18nKey = spans[1].getAttribute("data-i18n")?.trim();
      const rawLabel = i18nKey || spans[1].textContent.trim().replace(/[:\s]*$/, "");
      const value = spans[2]?.textContent?.trim() || "";

      if (!rawLabel || !value) return null;

      const translation = labelTranslations[rawLabel]?.[lang] || rawLabel;
      const line = isArabic
        ? prepareArabic(`${value} :${translation}`)
        : `${translation}: ${value}`;
      return line;
    })
    .filter(Boolean);

  const colCount = 2;
  const colWidth = (pageWidth - 30) / colCount;
  let col = 0;
  let startX = 15;

  specs.forEach((spec) => {
    const x = startX + (col * colWidth);
    const lines = doc.splitTextToSize(spec, colWidth);
    lines.forEach((line, idx) => {
      doc.setFont("Amiri", "normal").text(line, x, y + (idx * 5));
    });
    col++;
    if (col === colCount) {
      col = 0;
      y += lines.length * 5 + 2;
    }
  });

  if (col !== 0) y += 10;
  return y;
};

// دالة إضافة التوقيع للـ PDF
export const addSignature = async (doc, reportData, lang, pageWidth, y) => {
  const L = getFieldTranslations(lang);
  const isArabic = lang === "ar";
  const align = isArabic ? "right" : "left";
  const xLabel = isArabic ? pageWidth - 15 : 15;
  
  const showSignature = document.getElementById("opt-signature").checked;
  
  y = Math.max(y + 20, 240);
  const signLabel = isArabic ? prepareArabic(`${L.signature}`) : `${L.signature}:`;
  doc.setFont("Amiri", "bold").text(signLabel, xLabel, y, { align });

  if (showSignature && reportData?.signature_path) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = `http://localhost:4000/${reportData.signature_path}`;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const url = canvas.toDataURL("image/png");
      
      // 🔧 إصلاح: ضبط موقع التوقيع حسب اللغة
      let signatureX;
      if (isArabic) {
        // للعربية: التوقيع على اليمين
        signatureX = xLabel - 50;
      } else {
        // للإنجليزية: التوقيع على اليسار بجانب النص
        signatureX = xLabel + 10;
      }
      
      doc.addImage(url, "PNG", signatureX, y + 5, 50, 25);
    } catch (e) {
      console.warn("⚠️ Signature not loaded", e);
    }
  }

  return y;
};

// دالة توليد PDF كاملة
export const generatePdf = async (reportData, translations, tajawalRegularBase64, tajawalBoldBase64) => {
  console.log("assigned_to_raw:", reportData.assigned_to_raw);
  console.log("assigned_to:", reportData.assigned_to);
  console.log("عنصر الصفحة:", document.getElementById("assigned-to")?.textContent);
  
  document.getElementById("pdf-options-modal").style.display = "none";

  const msLogoImg = document.querySelector(".ms-logo img");
  const hospitalLogoImg = document.querySelector(".hospital-logo img");
  await waitForImagesToLoad([msLogoImg, hospitalLogoImg]);

  const { jsPDF } = window.jspdf;
  const lang = document.getElementById("pdf-lang").value;
  const isArabic = lang === "ar";

  const doc = new jsPDF("p", "mm", "a4", true);
  const pageWidth = doc.internal.pageSize.getWidth();

  setupPdfFonts(doc, tajawalRegularBase64, tajawalBoldBase64);
  addLogosToPdf(doc, msLogoImg, hospitalLogoImg);

  let y = 40;

  doc.setFontSize(16);
  const reportTitle = document.getElementById("report-title")?.textContent || "Report";
  addReportTitle(doc, reportTitle, lang, translations, pageWidth);

  doc.setFontSize(12);
  y = addBasicFields(doc, reportData, lang, translations, pageWidth, y);
  y = addAttachments(doc, reportData, lang, pageWidth, y);
  y = addDescription(doc, reportData, lang, translations, pageWidth, y);
  y = addTechnicalNotes(doc, lang, pageWidth, y);
  y = addDeviceSpecs(doc, lang, pageWidth, y);
  y = await addSignature(doc, reportData, lang, pageWidth, y);

  const [typeOnly, ticketPart] = reportTitle.split("#").map(p => p.trim());
  const fileName = ticketPart ? `${typeOnly} - ${ticketPart}` : typeOnly;
  doc.save(`${fileName}.pdf`);
};

// دالة الحصول على الترجمات
export const getTranslations = () => {
  return {
    titleType: {
      "Internal Ticket": { en: "Internal Ticket", ar: "تذكرة داخلية" },
      "External Ticket": { en: "External Ticket", ar: "تذكرة خارجية" },
      "Regular Maintenance": { en: "Regular Maintenance", ar: "صيانة دورية" },
      "General Maintenance": { en: "General Maintenance", ar: "صيانة عامة" },
      "External Maintenance": { en: "External Maintenance", ar: "صيانة خارجية" },
      "Ticket": { en: "Ticket", ar: "تذكرة" }
    },
    priority: {
      "High": { en: "High", ar: "عالية" },
      "Medium": { en: "Medium", ar: "متوسطة" },
      "Low": { en: "Low", ar: "منخفضة" }
    },
    deviceType: {
      "pc": { en: "pc", ar: "كمبيوتر" },
      "Printer": { en: "Printer", ar: "طابعة" },
      "printer": { en: "printer", ar: "طابعة" },
      "Scanner": { en: "Scanner", ar: "ماسح ضوئي" },
      "scanner": { en: "Scanner", ar: "ماسح ضوئي" }
    },
    category: {
      'General': { en: "General ", ar: "صيانة عامة" },
      'General Maintenance': { en: "General Maintenance", ar: "صيانة عامة" },
      'Regular': { en: "Regular ", ar: "صيانة دورية" },
      'Regular Maintenance': { en: "Regular Maintenance", ar: "صيانة دورية" },
      "External": { en: "External Maintenance", ar: "صيانة خارجية" },
      "Incident / Report": { en: "Incident / Report", ar: "بلاغ داخلي / بلاغ عادي" },
      "Incident": { en: "Incident", ar: "بلاغ داخلي / بلاغ عادي" },
      "Follow-Up": { en: "FollowUp", ar: "متابعة" },
      "Modification Request": { en: "Modification", ar: "طلب تعديل" },
      "Other": { en: "Other", ar: "أي نوع آخر" }
    }
  };
};

 