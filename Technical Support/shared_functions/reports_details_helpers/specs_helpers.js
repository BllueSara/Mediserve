// دوال معالجة مواصفات الأجهزة في تقارير التفاصيل

import { processPipeText } from './translation.js';
import { cleanTag } from './data_processing.js';

/**
 * إنشاء مواصفات الجهاز للتقرير الجديد
 */
export function createNewReportSpecs(report, lang, languageManager) {
  const specsContainer = document.getElementById("device-specs");
  specsContainer.innerHTML = "";
  
  if (!report.device_type) return;

  const deviceType = report.device_type?.trim()?.toLowerCase() || "";
  const fields = [
    { icon: "🔘", label: "Device Name:", value: report.device_name, alwaysShow: true, i18n: "device_name" },
    { icon: "🔑", label: "Serial Number:", value: report.serial_number, alwaysShow: true, i18n: "serial_number" },
    { icon: "🏛️", label: "Ministry Number:", value: report.governmental_number, alwaysShow: true, i18n: "ministry_number" },
    { icon: "🧠", label: "CPU:", value: report.cpu_name, showForPC: true, i18n: "cpu" },
    { icon: "💾", label: "RAM:", value: report.ram_type, showForPC: true, i18n: "ram" },
    { icon: "🖥️", label: "OS:", value: report.os_name, showForPC: true, i18n: "os" },
    { icon: "📶", label: "Generation:", value: report.generation_number, showForPC: true, i18n: "generation" },
    { icon: "🔧", label: "Model:", value: report.model_name, alwaysShow: true, i18n: "model" },
    { icon: "📟", label: "Device Type:", value: report.device_type, i18n: "device_type" },
    { icon: "💽", label: "Hard Drive:", value: report.drive_type, showForPC: true, i18n: "hard_drive" },
    { icon: "📏", label: "RAM Size:", value: report.ram_size, showForPC: true, i18n: "ram_size" },
    { icon: "🌐", label: "MAC Address:", value: report.mac_address, showForPC: true, i18n: "mac_address" },
    { icon: "🖧", label: "IP Address:", value: report.ip_address, showForPC: true, i18n: "ip_address" },
    { icon: "🖨️", label: "Printer Type:", value: report.printer_type, showForPrinter: true, i18n: "printer_type" },
    { icon: "🖋️", label: "Ink Type:", value: report.ink_type, showForPrinter: true, i18n: "ink_type" },
    { icon: "🔖", label: "Ink Serial Number:", value: report.ink_serial_number, showForPrinter: true, i18n: "ink_serial" },
    { icon: "📠", label: "Scanner Type:", value: report.scanner_type, showForScanner: true, i18n: "scanner_type" },
  ];

  fields.forEach(({ icon, label, value, showForPC, showForPrinter, showForScanner, alwaysShow, i18n }) => {
    const shouldShow =
      alwaysShow ||
      (showForPC && ["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(deviceType)) ||
      (showForPrinter && deviceType === "printer") ||
      (showForScanner && deviceType === "scanner") ||
      !!value;

    if (!shouldShow) return;

    const div = document.createElement("div");
    div.className = "spec-box";

    // أيقونة
    const iconSpan = document.createElement("span");
    iconSpan.textContent = icon;
    iconSpan.style.marginRight = "5px";
    div.appendChild(iconSpan);

    // تسمية الحقل
    const labelSpan = document.createElement("span");
    labelSpan.setAttribute("data-i18n", i18n);
    labelSpan.textContent = label;
    div.appendChild(labelSpan);

    // مسافة
    div.appendChild(document.createTextNode(" "));

    // القيمة مع id و data-id و data-rawtext
    const valueSpan = document.createElement("span");
    const raw = value != null ? String(value).trim() : "";
    
    setSpecValue(valueSpan, i18n, report, raw);
    div.appendChild(valueSpan);
    specsContainer.appendChild(div);

    // ترجمة التسمية إذا العربية
    if (languageManager.currentLang === "ar") {
      const tr = languageManager.translations.ar[i18n];
      if (tr) labelSpan.textContent = tr;
    }
  });
}

/**
 * إنشاء مواصفات الجهاز للتقارير العادية
 */
export function createRegularReportSpecs(report, lang, languageManager) {
  const specsContainer = document.getElementById("device-specs");
  if (!specsContainer) return;
  
  specsContainer.innerHTML = "";
  
  if (!report.device_type) return;

  const deviceType = (report.device_type || "").trim().toLowerCase();

  const fields = [
    { icon: "🔘", label: "Device Name:", value: cleanTag(report.device_name), alwaysShow: true, i18n: "device_name" },
    { icon: "🔑", label: "Serial Number:", value: cleanTag(report.serial_number), alwaysShow: true, i18n: "serial_number" },
    { icon: "🏛️", label: "Ministry Number:", value: cleanTag(report.governmental_number), alwaysShow: true, i18n: "ministry_number" },
    { icon: "🧠", label: "CPU:", value: cleanTag(report.cpu_name), showForPC: true, i18n: "cpu" },
    { icon: "💾", label: "RAM:", value: cleanTag(report.ram_type), showForPC: true, i18n: "ram" },
    { icon: "🖥️", label: "OS:", value: cleanTag(report.os_name), showForPC: true, i18n: "os" },
    { icon: "📶", label: "Generation:", value: cleanTag(report.generation_number), showForPC: true, i18n: "generation" },
    { icon: "🔧", label: "Model:", value: cleanTag(report.model_name), alwaysShow: true, i18n: "model" },
    { icon: "📟", label: "Device Type:", value: cleanTag(report.device_type), i18n: "device_type" },
    { icon: "💽", label: "Hard Drive:", value: cleanTag(report.drive_type), showForPC: true, i18n: "hard_drive" },
    { icon: "📏", label: "RAM Size:", value: cleanTag(report.ram_size), showForPC: true, i18n: "ram_size" },
    { icon: "🌐", label: "MAC Address:", value: cleanTag(report.mac_address), showForPC: true, i18n: "mac_address" },
    { icon: "🖧", label: "IP Address:", value: cleanTag(report.ip_address), showForPC: true, i18n: "ip_address" },
    { icon: "🖨️", label: "Printer Type:", value: cleanTag(report.printer_type), showForPrinter: true, i18n: "printer_type" },
    { icon: "🖋️", label: "Ink Type:", value: cleanTag(report.ink_type), showForPrinter: true, i18n: "ink_type" },
    { icon: "🔖", label: "Ink Serial Number:", value: cleanTag(report.ink_serial_number), showForPrinter: true, i18n: "ink_serial" },
    { icon: "📠", label: "Scanner Type:", value: cleanTag(report.scanner_type), showForScanner: true, i18n: "scanner_type" },
  ];

  // إنشاء DocumentFragment لتحسين الأداء
  const fragment = document.createDocumentFragment();

  fields.forEach(({ icon, label, value, showForPC, showForPrinter, showForScanner, alwaysShow, i18n }) => {
    const shouldShow =
      alwaysShow ||
      (showForPC && ["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(deviceType)) ||
      (showForPrinter && deviceType === "printer") ||
      (showForScanner && deviceType === "scanner") ||
      !!value;

    if (!shouldShow) return;

    const div = document.createElement("div");
    div.className = "spec-box";

    // أيقونة
    const iconSpan = document.createElement("span");
    iconSpan.textContent = icon;
    iconSpan.style.marginRight = "5px";
    div.appendChild(iconSpan);

    // تسمية الحقل
    const labelSpan = document.createElement("span");
    labelSpan.setAttribute("data-i18n", i18n);
    labelSpan.textContent = label;
    div.appendChild(labelSpan);

    // مسافة
    div.appendChild(document.createTextNode(" "));

    // القيمة مع id و data-id و data-rawtext
    const valueSpan = document.createElement("span");
    const raw = value != null ? String(value).trim() : "";
    
    setSpecValue(valueSpan, i18n, report, raw);
    div.appendChild(valueSpan);
    fragment.appendChild(div);

    // ترجمة التسمية إذا العربية
    if (languageManager.currentLang === "ar") {
      const tr = languageManager.translations.ar[i18n];
      if (tr) labelSpan.textContent = tr;
    }
  });

  // إضافة جميع العناصر مرة واحدة
  specsContainer.appendChild(fragment);
}

/**
 * تعيين قيمة مواصفة معينة
 */
function setSpecValue(valueSpan, i18n, report, raw) {
  switch (i18n) {
    case "device_name":
      valueSpan.id = "device_name";
      valueSpan.dataset.id = raw;
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.device_name || "";
      break;

    case "serial_number":
      valueSpan.id = "serial_number";
      valueSpan.dataset.id = raw;
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.serial_number || "";
      break;

    case "ministry_number":
      valueSpan.id = "governmental_number";
      valueSpan.dataset.id = raw;
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.governmental_number || "";
      break;

    case "ip_address":
      valueSpan.id = "ip_address";
      valueSpan.dataset.id = raw;
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.ip_address || "";
      break;

    case "mac_address":
      valueSpan.id = "mac_address";
      valueSpan.dataset.id = raw;
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.mac_address || "";
      break;

    case "model":
      valueSpan.id = "model";
      valueSpan.dataset.id = raw;
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.model_name || "";
      break;

    case "device_type":
      valueSpan.id = "device_type";
      valueSpan.dataset.id = raw;
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.device_type || "";
      break;

    case "cpu":
      valueSpan.id = "cpu";
      valueSpan.dataset.id = report.cpu_id || "";
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.cpu_name || "";
      break;

    case "ram":
      valueSpan.id = "ram_type";
      valueSpan.dataset.id = report.ram_id || "";
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.ram_type || "";
      break;

    case "os":
      valueSpan.id = "os";
      valueSpan.dataset.id = report.os_id || "";
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.os_name || "";
      break;

    case "generation":
      valueSpan.id = "generation";
      valueSpan.dataset.id = report.generation_id || "";
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.generation_number || "";
      break;

    case "hard_drive":
      valueSpan.id = "drive_type";
      valueSpan.dataset.id = report.drive_id || "";
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.drive_type || "";
      break;

    case "ram_size":
      valueSpan.id = "ram_size";
      valueSpan.dataset.id = report.ram_id || "";
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.ram_size || "";
      break;

    case "scanner_type":
      valueSpan.id = "scanner_type";
      valueSpan.dataset.id = report.scanner_type_id || "";
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.scanner_type || "";
      break;

    case "printer_type":
      valueSpan.id = "printer_type";
      valueSpan.dataset.id = report.printer_type_id || "";
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.printer_type || "";
      break;

    case "ink_type":
      valueSpan.id = "ink_type";
      valueSpan.dataset.id = report.ink_type_id || "";
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.ink_type || "";
      break;

    case "ink_serial":
      valueSpan.id = "ink_serial";
      valueSpan.dataset.id = raw;
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = report.ink_serial_number || "";
      break;

    default:
      valueSpan.dataset.rawtext = raw;
      valueSpan.textContent = raw || "";
  }
}

/**
 * إنشاء مواصفات الجهاز بالطريقة القديمة (للتوافق)
 */
export function createLegacySpecs(report) {
  const specs = [];

  if (report.device_name) specs.push(`🔘 Device Name: ${cleanTag(report.device_name)}`);
  if (report.serial_number) specs.push(`🔑 Serial Number: ${cleanTag(report.serial_number)}`);
  if (report.governmental_number) specs.push(`🏛️ Ministry Number: ${cleanTag(report.governmental_number)}`);
  if (report.cpu_name) specs.push(`🧠 CPU: ${cleanTag(report.cpu_name)}`);
  if (report.ram_type) specs.push(`💾 RAM: ${cleanTag(report.ram_type)}`);
  if (report.os_name) specs.push(`🖥️ OS: ${cleanTag(report.os_name)}`);
  if (report.generation_number) specs.push(`📶 Generation: ${cleanTag(report.generation_number)}`);
  if (report.model_name) specs.push(`🔧 Model: ${cleanTag(report.model_name)}`);
  if (report.drive_type) specs.push(`💽 Hard Drive: ${cleanTag(report.drive_type)}`);
  if (report.ram_size) specs.push(`📏 RAM Size: ${cleanTag(report.ram_size)}`);
  if (report.mac_address) specs.push(`🌐 MAC Address: ${cleanTag(report.mac_address)}`);
  if (report.ip_address) specs.push(`🖧 IP Address: ${cleanTag(report.ip_address)}`);
  if (report.printer_type) specs.push(`🖨️ Printer Type: ${cleanTag(report.printer_type)}`);
  if (report.ink_type) specs.push(`🖋️ Ink Type: ${cleanTag(report.ink_type)}`);
  if (report.ink_serial_number) specs.push(`🔖 Ink Serial Number: ${cleanTag(report.ink_serial_number)}`);
  if (report.scanner_type) specs.push(`📠 Scanner Type: ${cleanTag(report.scanner_type)}`);

  return specs;
} 