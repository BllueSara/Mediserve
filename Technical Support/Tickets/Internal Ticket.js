

let currentDropdownId = "";

document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("upload-file");
  const fileLabel = document.querySelector(".upload-box");
  const saveButton = document.querySelector(".submit-btn");
  const ticketTypeSelect = document.getElementById("ticket-type");
  const customTypeContainer = document.getElementById("custom-type-container");
  const customTypeInput = document.getElementById("custom-ticket-type");
  const ticketNumberInput = document.getElementById("ticket-number");
  const deviceTypeSelect = document.getElementById("device-type");
  const departmentSelect = document.getElementById("department");
  const specSelect = document.getElementById("device-specification");

  ticketNumberInput.readOnly = true;
  ticketNumberInput.value = "";

  // Load dropdowns
  loadTicketTypes();
  loadReportStatuses();
  loadDepartments();
  loadDeviceTypes();
  loadDeviceSpecifications();

  loadTechnicals();
  updateDiagnosisOptions();

  ticketTypeSelect.addEventListener("change", onTicketTypeChange);
  departmentSelect.addEventListener("change", updateDeviceSpecifications);
  deviceTypeSelect.addEventListener("change", () => {
    updateDeviceSpecifications();
    updateDiagnosisOptions();
  });

  fileLabel.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileChange);

  ["dragenter", "dragover", "dragleave", "drop"].forEach(evt =>
    fileLabel.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
    })
  );

  fileLabel.addEventListener("dragover", () => fileLabel.classList.add("drag-over"));
  ["dragleave", "drop"].forEach(evt =>
    fileLabel.addEventListener(evt, () => fileLabel.classList.remove("drag-over"))
  );

  fileLabel.addEventListener("drop", e => {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
  });

  const backButton = document.querySelector(".back-button");
  if (backButton) {
    backButton.addEventListener("click", e => {
      e.preventDefault();
      window.history.back();
    });
  }

  saveButton.addEventListener("click", handleSubmit);

 
// + Add New option logic (مع تمييز device-specification)
document.querySelectorAll("select").forEach(select => {
  select.addEventListener("change", function () {
    if (this.value === "add-custom") {
      currentDropdownId = this.id;
      
      if (currentDropdownId === "device-specification") {
        const deviceType = document.getElementById("device-type").value.toLowerCase();
        if (!deviceType) {
          alert("❌ Please select device type first!");
          return;
        }
        openAddNewSpecPopup(deviceType); // يفتح حقول خاصة بال PC أو Printer أو Scanner
      } else {
        document.getElementById("popup-title").textContent = `Add New ${formatLabel(currentDropdownId)}`;
        document.getElementById("popup-fields").innerHTML = `<input type="text" id="popup-input" placeholder="Enter new ${formatLabel(currentDropdownId)}" />`;
        document.getElementById("popup-modal").style.display = "flex";
      }
    }
  });
});


});



function loadTicketTypes() {
  fetch("http://localhost:5050/ticket-types")
    .then(res => res.json())
    .then(types => {
      const select = document.getElementById("ticket-type");
      select.innerHTML = '<option value="" disabled selected>Select ticket type</option>';
      types.forEach(type => {
        const option = document.createElement("option");
        option.value = type.type_name;
        option.textContent = type.type_name;
        select.appendChild(option);
      });
      if (!types.find(t => t.type_name.toLowerCase() === "other")) {
        const otherOption = document.createElement("option");
        otherOption.value = "Other";
        otherOption.textContent = "Other";
        select.appendChild(otherOption);
      }
    });
}

function loadReportStatuses() {
  fetch("http://localhost:5050/report-statuses")
    .then(res => res.json())
    .then(statuses => {
      const select = document.getElementById("report-status");
      select.innerHTML = '<option value="" disabled selected>Select report status</option>';
      statuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status.status_name;
        option.textContent = status.status_name;
        select.appendChild(option);
      });
    });
}

function loadDepartments() {
  fetch("http://localhost:5050/Departments")
    .then(res => res.json())
    .then(departments => {
      const select = document.getElementById("department");
      select.innerHTML = "";
      select.appendChild(createOption("", "Select department", true, true));
      select.appendChild(createOption("add-custom", "+ Add New"));
      departments.forEach(dep => {
        select.appendChild(createOption(dep.name, dep.name));
      });
    });
}

function loadDeviceTypes() {
  fetch("http://localhost:5050/TypeProplem")
    .then(res => res.json())
    .then(types => {
      const select = document.getElementById("device-type");
      select.innerHTML = "";
      select.appendChild(createOption("", "Select device type", true, true));
      select.appendChild(createOption("add-custom", "+ Add New"));
      types.forEach(type => {
        select.appendChild(createOption(type.DeviceType, type.DeviceType));
      });
    });
}

function loadDeviceSpecifications() {
  const select = document.getElementById("device-specification");
  select.innerHTML = "";

  // 🥇 أضف خيار "Select device specification" - دايم ثابت
  select.appendChild(createOption("", "Select device specification", true, true));

  // 🥈 أضف خيار "+ Add New" - دايم ثابت
  select.appendChild(createOption("add-custom", "+ Add New"));
}


function loadTechnicals() {
  fetch("http://localhost:5050/Technical")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("technical");
      data.forEach(tech => {
        dropdown.appendChild(createOption(tech.name, tech.name));
      });
    });
}

function createOption(value, text, disabled = false, selected = false) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  if (disabled) option.disabled = true;
  if (selected) option.selected = true;
  return option;
}

function onTicketTypeChange() {
  const select = document.getElementById("ticket-type");
  const customTypeContainer = document.getElementById("custom-type-container");
  const customTypeInput = document.getElementById("custom-ticket-type");
  const ticketNumberInput = document.getElementById("ticket-number");

  if (select.value === "Other") {
    customTypeContainer.style.display = "block";
  } else {
    customTypeContainer.style.display = "none";
    customTypeInput.value = "";
  }

  fetch("http://localhost:5050/generate-internal-ticket-number")
    .then(res => res.json())
    .then(data => ticketNumberInput.value = data.ticket_number)
    .catch(() => ticketNumberInput.value = "ERROR");
}

function handleFileChange(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];
  const allowedExtensions = ["pdf", "doc", "docx", "eml"];
  const ext = file?.name?.split(".").pop().toLowerCase();

  const fileLabel = document.querySelector(".upload-box p");
  if (file && !allowedExtensions.includes(ext)) {
    alert("Invalid file type. Only PDF, DOC, DOCX, and EML are allowed.");
    fileInput.value = "";
    fileLabel.textContent = "Drop files here or click to upload";
  } else if (file) {
    fileLabel.textContent = "Selected File: " + file.name;
  }
}


function updateDeviceSpecifications() {
  const department = document.getElementById("department").value.trim();
  const deviceType = document.getElementById("device-type").value.trim();
  const specSelect = document.getElementById("device-specification");

  // 🧹 نظف كل الخيارات أول شي
  specSelect.innerHTML = "";

  // ✅ أضف خيار "Select" دايمًا كأول خيار
  const selectOption = createOption("", "Select device specification", false, true);
  specSelect.appendChild(selectOption);

  // ✅ أضف خيار "+ Add New" بعدها
  const addNewOption = createOption("add-custom", "+ Add New");
  specSelect.appendChild(addNewOption);

  // 🛑 لو مافيه قسم أو نوع جهاز، نوقف بدون نكمل تحميل الديفايسات
  if (!department || !deviceType || deviceType === "add-custom") {
    console.log("⛔ No department or device type selected. Showing only default options.");
    return; // مافي تحميل ديفايسات
  }

  // ✅ في نوع وقسم: نجيب الديفايسات ونكمل
  fetch(`http://localhost:5050/devices/${encodeURIComponent(deviceType)}/${encodeURIComponent(department)}`)
    .then(res => res.json())
    .then(devices => {
      if (!Array.isArray(devices) || devices.length === 0) {
        console.log("ℹ️ No devices found for this combination.");
        return;
      }

      devices.forEach(device => {
        const option = document.createElement("option");
        option.value = device.Serial_Number; // أو device.id لو تحب
        option.textContent = `${device.Device_Name} | S/N: ${device.Serial_Number} | Gov#: ${device.Ministerial_Number || "-"}`;
        specSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error("❌ Error loading devices:", error);
    });
}




function updateDiagnosisOptions() {
  const deviceType = document.getElementById("device-type").value;
  const diagnosisSelect = document.getElementById("initial-diagnosis");

  // 🧼 نظف القائمة أولاً
  diagnosisSelect.innerHTML = "";

  // ✅ دائما نعرض "Select diagnosis" حتى قبل ما يختار جهاز
  diagnosisSelect.appendChild(createOption("", "Select diagnosis", false, true));
  diagnosisSelect.appendChild(createOption("add-custom", "+ Add New"));

  // ⛔ لو ما فيه نوع جهاز، ما نحمل شي جديد
  if (!deviceType || deviceType === "add-custom") return;

  // 🔄 حدّد الـ API المناسب بناءً على نوع الجهاز
  let endpoint = "";
  switch (deviceType) {
    case "PC":
      endpoint = "problem-states/pc";
      break;
    case "Printer":
      endpoint = "problem-states/printer";
      break;
    case "Scanner":
      endpoint = "problem-states/scanner";
      break;
    default:
      endpoint = `problem-states/maintenance/${encodeURIComponent(deviceType)}`;
      break;
  }

  // 🔃 حمل المشاكل من السيرفر
  fetch(`http://localhost:5050/${endpoint}`)
    .then(res => res.json())
    .then(problems => {
      problems.forEach(p => {
        const text = p.problem_text || p.problemStates_Maintance_device_name;
        diagnosisSelect.appendChild(createOption(text, text));
      });
    })
    .catch(err => {
      console.error("❌ Failed to load diagnosis options:", err);
    });
}




function handleSubmit(event) {
  event.preventDefault();

  const reportNumber = document.querySelector('input[placeholder="Enter report name"]').value.trim();
  const reporterName = document.getElementById("reporter-name")?.value.trim();
  const initialDiagnosis = document.getElementById("initial-diagnosis").value;
  const reportDetails = document.querySelector('textarea[placeholder="Enter detailed description of the issue"]').value.trim();
  const finalDiagnosis = document.querySelector('textarea[placeholder="Enter final diagnosis after investigation"]').value.trim();
  const otherDescription = document.querySelector('textarea[placeholder*="Other"]').value.trim();
  const status = document.getElementById("report-status").value;
  const file = document.getElementById("upload-file").files[0];

  const selectedType = document.getElementById("ticket-type").value;
  const customType = document.getElementById("custom-ticket-type").value.trim();
  const ticketType = selectedType === "Other" ? customType : selectedType;

  if (!ticketType || !initialDiagnosis) {
    alert("Please select ticket type and initial diagnosis.");
    return;
  }

  const formData = new FormData();
  formData.append("report_number", reportNumber);
  formData.append("reporter_name", reporterName || "");
  formData.append("ticket_type", ticketType);
  formData.append("initial-diagnosis", initialDiagnosis);
  formData.append("report_details", reportDetails);
  formData.append("final_diagnosis", finalDiagnosis);
  formData.append("other_description", otherDescription);
  formData.append("status", status);
  if (file) formData.append("attachment", file);

  fetch("http://localhost:5050/internal-ticket-with-file", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "✅ Ticket submitted successfully!");
    })
    .catch(err => {
      console.error("❌ Error:", err);
      alert("❌ Failed to submit ticket.");
    });
}





document.getElementById("popup-save-btn").addEventListener("click", async function () {
  const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
  if (currentDropdownId !== "device-specification") return;

  // جمع القيم يدويًا من جميع الحقول داخل البوب أب
  const inputs = document.querySelectorAll("#popup-fields input, #popup-fields select, #popup-fields textarea");
  const deviceData = {};
  inputs.forEach(input => {
    deviceData[input.name] = input.value;
  });

  try {
    const res = await fetch(`http://localhost:5050/AddDevice/${deviceType}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deviceData)
    });

    const result = await res.json();
    if (result.message) {
      alert(result.message);

      // تحديث قائمة المواصفات بعد الإضافة
      const department = document.getElementById("department")?.value;
      const specSelect = document.getElementById("device-specification");
      specSelect.innerHTML = "";
      specSelect.appendChild(createOption("", "Select device specification", true, true));
      specSelect.appendChild(createOption("add-custom", "+ Add New"));

      const devices = await fetch(`http://localhost:5050/devices/${deviceType}/${department}`).then(res => res.json());

      devices.forEach(device => {
        const option = document.createElement("option");
        option.value = device.Serial_Number;
        option.textContent = `${device.Device_Name} | S/N: ${device.Serial_Number} | Gov#: ${device.Ministerial_Number || "-"}`;
        specSelect.appendChild(option);
      });

      // اختار الجهاز الجديد بعد الحفظ
      if (deviceData.serial) {
        specSelect.value = deviceData.serial;
      }

      closePopup();
    } else {
      alert("❌ فشل في الإضافة: " + result.error);
    }
  } catch (err) {
    console.error("❌ خطأ:", err);
    alert("❌ خطأ في الاتصال بالخادم.");
  }
});







// لما يختار Add New في Device Specification
document.getElementById("device-specification").addEventListener("change", function () {
  if (this.value === "add-custom") {
    const deviceType = document.getElementById("device-type").value.toLowerCase();
    if (!deviceType) {
      alert("❌ Please select device type first!");
      return;
    }
    openAddNewSpecPopup(deviceType);
  }
});
async function openAddNewSpecPopup(deviceType) {
  const popupTitle = document.getElementById("popup-title");
  const popupFields = document.getElementById("popup-fields");

  popupTitle.textContent = "Enter Pc Specifications";

  if (deviceType === "pc") {
    popupFields.innerHTML = `
      <label>Pc Name:</label>
      <input type="text" id="computer-name" placeholder="Enter Pc Name" />

      <label>Serial Number:</label>
      <input type="text" id="serial" placeholder="Enter Serial Number" />

      <label>Ministry Number:</label>
      <input type="text" id="ministerial-number" placeholder="Enter Ministry Number" />

      <label>Department:</label>
      <select id="department-name"></select>

      <label>Processor Generation:</label>
      <select id="generation"></select>

      <label>CPU:</label>
      <select id="processor"></select>

      <label>RAM:</label>
      <select id="ram"></select>

      <label>Model:</label>
      <select id="model"></select>

      <label>Operating System:</label>
      <select id="os"></select>
    `;

    // ✨ هنا أربط الـ select بالـ API الصح
    await loadPopupDropdown('department-name', 'Departments');
    await loadPopupDropdown('generation', 'Processor_Generations');
    await loadPopupDropdown('processor', 'CPU_Types');
    await loadPopupDropdown('ram', 'RAM_Types');
    await loadPopupDropdown('model', 'PC_Model');
    await loadPopupDropdown('os', 'OS_Types');
  } else {
    popupFields.innerHTML = `
      <label>Device Name:</label>
      <input type="text" id="device-name" placeholder="Enter Device Name" />

      <label>Serial Number:</label>
      <input type="text" id="serial" placeholder="Enter Serial Number" />

      <label>Ministry Number:</label>
      <input type="text" id="ministerial-number" placeholder="Enter Ministry Number" />

      <label>Model:</label>
      <input type="text" id="model" placeholder="Enter Model" />
    `;
  }

  document.getElementById("popup-modal").style.display = "flex";
}





async function loadPopupDropdown(selectId, apiEndpoint) {
  const select = document.getElementById(selectId);

  // 🔥 قبل أي شيء، نحذف كل Event Listeners عن طريق نسخ العنصر وعمل Replace
  const newSelect = select.cloneNode(true);
  select.parentNode.replaceChild(newSelect, select);

  try {
    const res = await fetch(`http://localhost:5050/${apiEndpoint}`);
    const data = await res.json();

    newSelect.innerHTML = "";

    newSelect.appendChild(createOption("", `Select ${formatLabel(selectId)}`, true, true));
    newSelect.appendChild(createOption("add-new", "+ Add New"));

    data.forEach(item => {
      const option = document.createElement("option");

      if (selectId === "department-name" || selectId === "department") {
        option.value = item.name;
        option.textContent = item.name;
      } else if (selectId === "generation") {
        option.value = item.generation_number;
        option.textContent = item.generation_number;
      } else if (selectId === "processor") {
        option.value = item.cpu_name;
        option.textContent = item.cpu_name;
      } else if (selectId === "ram") {
        option.value = item.ram_type;
        option.textContent = item.ram_type;
      } else if (selectId === "model") {
        option.value = item.model_name;
        option.textContent = item.model_name;
      } else if (selectId === "os") {
        option.value = item.os_name;
        option.textContent = item.os_name;
      } else {
        option.value = item.name || item.value || item;
        option.textContent = item.name || item.value || item;
      }

      newSelect.appendChild(option);
    });

    newSelect.addEventListener("change", function () {
      if (this.value === "add-new") {
        const newValue = prompt(`Enter new ${formatLabel(selectId)}:`);
        if (newValue) {
          saveNewOption(apiEndpoint, newValue, this);
        } else {
          this.selectedIndex = 0;
        }
      }
    });

  } catch (error) {
    console.error(`❌ Failed loading ${apiEndpoint}`, error);
  }
}





async function saveNewOption(apiEndpoint, newValue, selectElement) {
  const apiToTargetMap = {
    "Departments": "department",
    "department-name": "department",
    "Processor_Generations": "generation",
    "generation": "generation",
    "CPU_Types": "processor",
    "processor": "processor",
    "RAM_Types": "ram",
    "ram": "ram",
    "PC_Model": "model",
    "model": "model",
    "OS_Types": "os",
    "os": "os",
    "Technical": "technical",
    "technical": "technical",
    "TypeProplem": "device-type",
    "device-type": "device-type",
    "device-specification": "device-specification",
    "device-specifications": "device-specification",
    "problem-status": "problem-status",
    "initial-diagnosis": "problem-status",
    "ticket-types": "ticket-type",
    "ticket-type": "ticket-type",
    "report-statuses": "report-status",
    "report-status": "report-status"
  };

  let target = apiToTargetMap[selectElement.id] || apiToTargetMap[apiEndpoint] || selectElement.id;

  if (!target) {
    alert("❌ Invalid target field!");
    return;
  }

  try {
    const res = await fetch("http://localhost:5050/add-option-internal-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: target,
        value: newValue
      })
    });

    const data = await res.json();
    if (data.message?.includes("✅")) {
      const newOption = document.createElement("option");
      newOption.value = newValue;
      newOption.textContent = newValue;
      selectElement.appendChild(newOption);
      selectElement.value = newValue;
      alert("✅ New option added successfully!");
    } else {
      alert(data.error || "❌ Failed to add option.");
    }
  } catch (error) {
    console.error(`❌ Error saving new option:`, error);
  }
}







function closePopup() {
  document.getElementById("popup-modal").style.display = "none";
  document.getElementById("popup-fields").innerHTML = "";

  if (currentDropdownId) {
    const select = document.getElementById(currentDropdownId);
    if (select) {
      select.selectedIndex = 0; // يرجعه لاختار أول
    }
  }
  currentDropdownId = "";
}

function formatLabel(id) {
  return id.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
