// دوال الترجمة واللغة لتقارير التفاصيل

// تخزين مؤقت للترجمات
const translationCache = new Map();

export async function translateWithGoogle(text, targetLang, sourceLang = "en") {
  if (!text || !targetLang) return text;
  
  // إنشاء مفتاح التخزين المؤقت
  const cacheKey = `${text}_${sourceLang}_${targetLang}`;
  
  // التحقق من التخزين المؤقت
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  
  const encoded = encodeURIComponent(text);
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx` +
    `&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encoded}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch Google Translate");
    const data = await res.json();
    const firstSegment = data?.[0]?.[0]?.[0];
    const result = firstSegment || text;
    
    // حفظ في التخزين المؤقت
    translationCache.set(cacheKey, result);
    
    return result;
  } catch (err) {
    console.warn("⚠️ translateWithGoogle error:", err);
    return text;
  }
}

// دالة لترجمة مجموعة من النصوص في نفس الوقت
export async function translateBatch(texts, targetLang, sourceLang = "en") {
  const promises = texts.map(text => translateWithGoogle(text, targetLang, sourceLang));
  return Promise.all(promises);
}

export function reverseTranslate(value, dictionary, targetLang) {
  for (const key in dictionary) {
    const entry = dictionary[key];
    const values = typeof entry === "object" ? Object.values(entry).map(v => v?.trim()) : [entry];
    if (values.includes(value?.trim())) {
      return entry[targetLang] || value;
    }
  }
  return value;
}

export function processPipeText(text, lang) {
  if (!text || typeof text !== 'string') return text;
  if (text.includes("|")) {
    const parts = text.split("|").map(p => p.trim());
    const enPart = parts[0] || "";
    const arPart = parts[1] || "";
    return lang === "ar" ? (arPart || enPart) : enPart;
  }
  return text;
}

export function prepareArabic(text, ArabicReshaper, bidi) {
  try {
    const reshaped = ArabicReshaper.reshape(text);
    return bidi.getVisualString(reshaped);
  } catch {
    return text;
  }
}

export function normalizeText(text) {
  return text
    .replace(/[""]/g, '"')        // اقتباسات ذكية
    .replace(/['']/g, "'")        // اقتباسات مفردة
    .replace(/[^A-Za-z\u0600-\u06FF0-9\s]/g, "") // إنجليزي + عربي + أرقام
    .toLowerCase()
    .trim();
}

export function getTitleKey(text) {
  return text.replace(/[^\w\s]/gi, "").toLowerCase().trim();
}

export function findOriginalKeyByAnyLang(text, dictionary) {
  const normalizedText = normalizeText(text);
  for (const key in dictionary) {
    const entry = dictionary[key];
    if (typeof entry === "object") {
      const values = Object.values(entry).map(v => normalizeText(v));
      if (values.includes(normalizedText)) {
        return key;
      }
    } else {
      if (normalizeText(entry) === normalizedText) {
        return key;
      }
    }
  }
  return null;
}

export function findLabelKeyByAnyLang(label, dictionary) {
  if (!label || !dictionary) return null;
  
  const normalizedLabel = normalizeText(label);
  console.log("🔍 findLabelKeyByAnyLang - Input:", label);
  console.log("🔍 findLabelKeyByAnyLang - Normalized:", normalizedLabel);
  
  for (const key in dictionary) {
    const entry = dictionary[key];
    if (typeof entry === "object") {
      const values = Object.values(entry).map(v => normalizeText(v));
      console.log("🔍 findLabelKeyByAnyLang - Checking key:", key, "values:", values);
      if (values.includes(normalizedLabel)) {
        console.log("🔍 findLabelKeyByAnyLang - Found match for key:", key);
        return key;
      }
    } else {
      const normalizedEntry = normalizeText(entry);
      console.log("🔍 findLabelKeyByAnyLang - Checking entry:", entry, "normalized:", normalizedEntry);
      if (normalizedEntry === normalizedLabel) {
        console.log("🔍 findLabelKeyByAnyLang - Found match for entry:", entry);
        return key;
      }
    }
  }
  
  console.log("🔍 findLabelKeyByAnyLang - No match found");
  return null;
} 