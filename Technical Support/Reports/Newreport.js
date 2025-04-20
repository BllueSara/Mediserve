// 🟢 تعبئة القوائم من السيرفر
window.addEventListener("DOMContentLoaded", () => {
  fillSelect("reportType", ["Incident Report", "Maintenance", "Other"]),
  Promise.all([
    fetch("http://localhost:5050/TypeProplem").then(res => res.json()),
    fetch("http://localhost:5050/ticket-status").then(res => res.json())
  ])
  .then(([ deviceTypes, statuses]) => {
    fillSelect("deviceType", deviceTypes.map(t => t.DeviceType));
    fillSelect("status", statuses.map(s => s.status_name));
  })
  .catch(err => {
    console.error("❌ Failed to fetch select data:", err);
  });
  

  function fillSelect(name, items) {
    const select = document.querySelector(`select[name='${name}']`);
    select.innerHTML = `<option disabled selected>Select ${name.replace(/([A-Z])/g, ' $1')}</option>`;
    items.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      select.appendChild(opt);
    });
  }
});

// 🟢 Upload file logic
const fileLabel = document.querySelector("#drop-area");
const fileInput = document.getElementById("upload-file");

fileLabel.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const allowed = ["pdf", "doc", "docx", "eml"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      alert("❌ Invalid file type. Only PDF, DOC, DOCX, and EML are allowed.");
      fileInput.value = "";
      fileLabel.querySelector("p").textContent = "Drop files here or click to upload";
    } else {
      fileLabel.querySelector("p").textContent = "Selected File: " + file.name;
    }
  }
});

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  fileLabel.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
});
fileLabel.addEventListener("dragover", () => fileLabel.classList.add("drag-over"));
["dragleave", "drop"].forEach(eventName => {
  fileLabel.addEventListener(eventName, () => fileLabel.classList.remove("drag-over"));
});
fileLabel.addEventListener("drop", (e) => {
  const droppedFile = e.dataTransfer.files[0];
  fileInput.files = e.dataTransfer.files;
  fileInput.dispatchEvent(new Event("change"));
});

// 🟢 Signature logic
const canvas = document.getElementById("signatureCanvas");
const ctx = canvas.getContext("2d");
let drawing = false;

canvas.addEventListener("mousedown", () => {
  drawing = true;
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

const uploadInput = document.getElementById("signatureUpload");
const uploadedImage = document.getElementById("uploadedSignature");

uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    uploadedImage.src = event.target.result;
    uploadedImage.style.display = "block";
    clearCanvas();
  };
  reader.readAsDataURL(file);
});

document.getElementById("clearSignature").addEventListener("click", () => {
  clearCanvas();
  uploadInput.value = "";
  uploadedImage.src = "";
  uploadedImage.style.display = "none";
});

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 🟢 إرسال النموذج
document.getElementById("report-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData();

  // 📥 البيانات النصية
  formData.append("report_type", form.reportType.value);
  formData.append("device_type", form.deviceType.value);
  formData.append("priority", "Medium"); // أو خلّيها من اختيار المستخدم
  formData.append("status", form.status.value);
  formData.append("description", form.description.value || "");

  // 📎 المرفق
  if (fileInput.files[0]) {
    formData.append("attachment", fileInput.files[0]);
  }

  // ✍️ توقيع
  if (uploadInput.files.length > 0) {
    formData.append("signature", uploadInput.files[0]);
  } else {
    await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        formData.append("signature", blob, "signature.png");
        resolve();
      });
    });
  }

  // 🚀 إرسال إلى السيرفر
  fetch("http://localhost:5050/submit-new-report", {
    method: "POST",
    body: formData
  })
  .then(async res => {
    const text = await res.text(); // 👈 نقرأ النص بدل JSON مباشرة
    try {
      const data = JSON.parse(text); // نحاول نحوله JSON
      alert(data.message || "✅ تم الحفظ");
    } catch (err) {
      console.error("❌ Server returned non-JSON:", text);
      alert("⚠️ السيرفر رجّع استجابة غير متوقعة");
    }
  })
  .catch(err => {
    console.error("❌ Submit failed:", err);
    alert("❌ حدث خطأ أثناء الإرسال");
  });
  
});
