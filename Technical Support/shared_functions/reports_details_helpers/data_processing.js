// دوال معالجة البيانات لتقارير التفاصيل

export function normalizeKey(str) {
  return str
    .toLowerCase()
    .replace(/["\"]/g, "")     // حذف علامات التنصيص
    .replace(/[^\w\s]/g, "")     // حذف الرموز
    .replace(/\s+/g, " ")        // توحيد المسافات
    .trim();
}

export function fixEncoding(badText) {
  try {
    const bytes = new Uint8Array([...badText].map(ch => ch.charCodeAt(0)));
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes);
  } catch {
    return badText;
  }
}

export function cleanValue(val) {
  return (val || "").replace(/\s*\[(ar|en)\]$/i, "").trim();
}

export function cleanTag(value) {
  return value?.toString().trim().replace(/\s*\[(ar|en)\]$/i, "");
}

export function cleanReport(raw) {
  const cleaned = {};
  for (const key in raw) {
    if (typeof raw[key] === "string") {
      cleaned[key] = cleanTag(raw[key]);
    } else {
      cleaned[key] = raw[key];
    }
  }
  return cleaned;
}

export function getAssignedTo(report, lang, languageManager) {
  lang = lang || (languageManager?.currentLang || 'en');
  let raw = '';
  switch (report.maintenance_type) {
    case "Regular":
      raw = report.technical_engineer || '';
      break;
    case "General":
      raw = report.technician_name || report.technical_engineer || '';
      break;
    case "Internal":
      raw = report.technical || report.technician_name || '';
      break;
    case "External":
      raw = report.technical_engineer || report.assigned_to || '';
      break;
    default:
      raw = report.assigned_to || report.reporter_name || report.technical_engineer || '';
  }
  if (raw.includes("|")) {
    const parts = raw.split("|");
    const en = parts[0] || "";
    const ar = parts[1] || "";
    return lang === "ar" ? (ar || en) : en;
  }
  return raw;
}

export function getAssignedToId(report) {
  switch (report.maintenance_type) {
    case "Regular":
      return report.technical_engineer_id || report.assigned_to_id || null;
    case "General":
      return report.technician_id || report.assigned_to_id || null;
    case "Internal":
      return report.assigned_to_id || report.technical || report.technician_id || null;
    default:
      return report.assigned_to_id || report.technical || report.technician_id || null;
  }
}

export function getLookupField(fieldId) {
  if (fieldId === "assigned-to") {
    return "assigned_to";    // نرسل دايمًا هذا المفتاح
  }
  const map = {
    category: "category",
    device_type: "device_type",
    department: "department_name",
  };
  return map[fieldId] || fieldId;
} 