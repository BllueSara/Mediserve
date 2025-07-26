// دوال مساعدة للخطوط والخطوط في تقارير التفاصيل

export function goBack() {
  window.history.back();
}

export const fetchFont = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // فقط البايس64 بدون data:...
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

export const loadFonts = async () => {
  const tajawalRegularBase64 = await fetchFont("/fonts/Amiri-Regular.ttf");
  const tajawalBoldBase64 = await fetchFont("/fonts/Amiri-Bold.ttf");
  return { tajawalRegularBase64, tajawalBoldBase64 };
}; 