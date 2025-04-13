// ================== تعبئة القوائم =====================
document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:5050/TypeProplem")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("problem-type");
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.DeviceType;
        option.textContent = item.DeviceType;
        dropdown.appendChild(option);
      });
    });

  fetch("http://localhost:5050/floors")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("floor");
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.FloorNum;
        option.textContent = item.FloorNum;
        dropdown.appendChild(option);
      });
    });

  fetch("http://localhost:5050/Technical")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("technical");
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        dropdown.appendChild(option);
      });
    });

  fetch("http://localhost:5050/Departments")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("section");
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        dropdown.appendChild(option);
      });
    });
});

// ================== تعبئة حالات الأعطال =====================
document.addEventListener("DOMContentLoaded", () => {
  const deviceType = document.getElementById("problem-type");
  const problemStatus = document.getElementById("problem-status");

  if (deviceType && problemStatus) {
    deviceType.addEventListener("change", () => {
      const selected = deviceType.value.toLowerCase();
      let endpoint = "";

      if (selected === "pc") endpoint = "/problem-states/pc";
      else if (selected === "printer") endpoint = "/problem-states/printer";
      else if (selected === "scanner") endpoint = "/problem-states/scanner";
      else return;

      problemStatus.innerHTML = `<option value="" disabled selected>Select status</option>`;

      fetch(`http://localhost:5050${endpoint}`)
        .then(res => res.json())
        .then(data => {
          data.forEach(item => {
            const option = document.createElement("option");
            option.value = item.problem_text;
            option.textContent = item.problem_text;
            problemStatus.appendChild(option);
          });
        });
    });
  }
});

// ================== تعبئة المواصفات حسب النوع والقسم =====================
function fetchGeneralDeviceSpecs() {
  const type = document.getElementById("problem-type").value.toLowerCase();
  const dept = document.getElementById("section").value;
  const dropdown = document.getElementById("device-spec");

  if (!type || !dept) return;

  fetch(`http://localhost:5050/devices/${type}/${encodeURIComponent(dept)}`)
    .then(res => res.json())
    .then(data => {
      dropdown.innerHTML = `
        <option value="" disabled selected>Select Specifications</option>
        <option value="add-custom">+ Add New Specification</option>
      `;

      if (!data.length) {
        const opt = document.createElement("option");
        opt.textContent = "No devices found in this department";
        opt.disabled = true;
        dropdown.appendChild(opt);
        return;
      }

      data.forEach(device => {
        const option = document.createElement("option");
        option.value = device.id;
        option.textContent = `${device.name} | ${device.Serial_Number} | ${device.Governmental_Number}`;
        dropdown.appendChild(option);
      });
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const typeDropdown = document.getElementById("problem-type");
  const sectionDropdown = document.getElementById("section");

  if (typeDropdown && sectionDropdown) {
    typeDropdown.addEventListener("change", fetchGeneralDeviceSpecs);
    sectionDropdown.addEventListener("change", fetchGeneralDeviceSpecs);
  }
});

// ================== النافذة المنبثقة =====================
const popup = document.getElementById("popup-modal");
const popupFields = document.getElementById("popup-fields");
const popupTitle = document.getElementById("popup-title");
const deviceSpecDropdown = document.getElementById("device-spec");
const problemTypeDropdown = document.getElementById("problem-type");

if (deviceSpecDropdown) {
  deviceSpecDropdown.addEventListener("change", () => {
    if (deviceSpecDropdown.value === "add-custom") {
      const type = problemTypeDropdown.value.toLowerCase();
      popup.style.display = "flex";
      generateFieldsForDeviceType(type);
    }
  });
}

function closePopup() {
  popup.style.display = "none";
  document.getElementById("device-spec").value = "";
}

const generalDropdowns = [
  { id: "problem-type", label: "Problem Type" },
  { id: "section", label: "Section" },
  { id: "floor", label: "Floor" },
  { id: "technical", label: "Technical" },
  { id: "problem-status", label: "Problem Status" },
  { id: "device-spec", label: "Device Specification" } // ✅ أضف هذا

];

generalDropdowns.forEach(({ id, label }) => {
  const dropdown = document.getElementById(id);
  if (!dropdown) return;

  dropdown.addEventListener("change", () => {
    if (dropdown.value === "add-custom") {
      openGenericPopup(label, id);
    }
  });
});

function openGenericPopup(label, targetId) {
  const saveBtn = document.getElementById("popup-save-btn");

  if (label === "Device Specification") {
    const deviceType = document.getElementById("problem-type")?.value?.toLowerCase();

    Promise.all([
      fetch("http://localhost:5050/Departments").then(res => res.json()),
      fetch(`http://localhost:5050//models-by-type/:type`).then(res => res.json())
    ]).then(([departments, models]) => {
      const departmentsOptions = departments.map(dep => `<option value="${dep.name}">${dep.name}</option>`).join("");
      const modelsOptions = models.map(model => `<option value="${model.model_name}">${model.model_name}</option>`).join("");

      popupTitle.textContent = "Add Device Specification";
      popupFields.innerHTML = `
        <label>Ministry Number:</label><input type="text" id="spec-ministry" />
        <label>Device Name:</label><input type="text" id="spec-name" />
        <label>Model:</label>
        <select id="spec-model">
          <option value="" disabled selected>Select model</option>
          ${modelsOptions}
          <option value="add-new-model">+ Add New Model</option>
        </select>
        <label>Serial Number:</label><input type="text" id="spec-serial" />
        <label>Department:</label>
        <select id="spec-department">
          <option value="" disabled selected>Select department</option>
          ${departmentsOptions}
        </select>
        <input type="hidden" id="popup-target-id" value="${targetId}" />
      `;

      saveBtn.onclick = saveDeviceSpecification;
      popup.style.display = "flex";

      // ✅ استرجاع البيانات السابقة إن وجدت
      const fields = ["spec-ministry", "spec-name", "spec-serial", "spec-department"];
      fields.forEach(id => {
        const val = sessionStorage.getItem(id);
        if (val) {
          document.getElementById(id).value = val;
          sessionStorage.removeItem(id);
        }
      });

      const lastModel = sessionStorage.getItem("lastAddedModel");
      if (lastModel) {
        setTimeout(() => {
          document.getElementById("spec-model").value = lastModel;
          sessionStorage.removeItem("lastAddedModel");
        }, 0);
      }

      // ✅ فتح نافذة لإضافة موديل
      document.getElementById("spec-model").addEventListener("change", (e) => {
        if (e.target.value === "add-new-model") {
          const fields = ["spec-ministry", "spec-name", "spec-serial", "spec-department"];
          fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) sessionStorage.setItem(id, el.value);
          });
          openAddModelPopup(deviceType);
        }
      });
    });
  } else {
    popupTitle.textContent = `Add New ${label}`;
    popupFields.innerHTML = `
      <label for="popup-input">${label}:</label>
      <input type="text" id="popup-input" placeholder="Enter ${label}" required>
      <input type="hidden" id="popup-target-id" value="${targetId}">
    `;

    saveBtn.onclick = saveGenericOption;
    popup.style.display = "flex";
  }
}

function openAddModelPopup(deviceType) {
  popupTitle.textContent = `Add New Model for ${deviceType}`;
  popupFields.innerHTML = `
    <label>Model Name:</label>
    <input type="text" id="new-model-name" placeholder="Enter model name" />
  `;

  document.getElementById("popup-save-btn").onclick = () => saveNewModel(deviceType);
}

function saveNewModel(deviceType) {
  const modelName = document.getElementById("new-model-name").value.trim();
  if (!modelName) {
    alert("❌ Please enter a model name");
    return;
  }

  fetch("http://localhost:5050/add-device-model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_name: modelName, device_type_name: deviceType })
  })
    .then(res => res.json())
    .then(result => {
      alert(result.message);
      sessionStorage.setItem("lastAddedModel", modelName);
      openGenericPopup("Device Specification", "device-spec");
    })
    .catch(err => {
      console.error("❌ Error saving model:", err);
      alert("❌ Failed to add model");
    });
}


function saveDeviceSpecification() {
  const ministry = document.getElementById("spec-ministry").value.trim();
  const name = document.getElementById("spec-name").value.trim();
  const model = document.getElementById("spec-model").value.trim();
  const serial = document.getElementById("spec-serial").value.trim();
  const department = document.getElementById("spec-department").value.trim();
  const deviceType = document.getElementById("problem-type").value.toLowerCase();
  const dropdown = document.getElementById("device-spec");

  if (!ministry || !name || !model || !serial || !department || !deviceType) {
    alert("❌ Please fill all fields.");
    return;
  }

  const specData = {
    ministry,
    name,
    model,
    serial,
    department,
    type: deviceType
  };

  fetch("http://localhost:5050/add-device-specification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(specData)
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      return res.json();
    })
    .then(result => {
      if (result.message) {
        alert(result.message);

        // ✅ إضافة مباشرة إلى القائمة بدون انتظار fetch
        const option = document.createElement("option");
        option.value = result.insertedId || specData.serial;
        option.textContent = `${specData.name} | ${specData.serial} | ${specData.ministry}`;
        dropdown.appendChild(option);
        dropdown.value = option.value;

        popup.style.display = "none";
      } else {
        alert("❌ فشل في الحفظ: " + result.error);
      }
    })
    .catch(err => {
      console.error("❌ Error saving specification:", err);
      alert("❌ Failed to save specification");
    });
}




function saveGenericOption() {
  const value = document.getElementById("popup-input").value.trim();
  const targetId = document.getElementById("popup-target-id").value;
  const dropdown = document.getElementById(targetId);

  if (!value || !dropdown) return;

  fetch("http://localhost:5050/add-option-general", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: targetId, value })
  })
    .then(res => res.json())
    .then(result => {
      alert(result.message);
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      dropdown.appendChild(option);
      dropdown.value = value;
      closePopup();
    })
    .catch(err => {
      console.error("❌ Error saving option:", err);
      alert("❌ Failed to save new option");
    });
}


// ================== الحقول حسب النوع =====================
function generateFieldsForDeviceType(type) {
  const saveBtn = document.getElementById("popup-save-btn");
  popupFields.innerHTML = "";

  if (type === "pc") {
    popupTitle.textContent = "Enter PC Specifications";
    popupFields.innerHTML = `
      <label>Computer Name:</label><input type="text" name="device-name" required>
      <label>Serial Number:</label><input type="text" name="serial" required>
      <label>Ministry Number:</label><input type="text" name="ministry-id" required>
      <label>Department:</label><select name="department" id="department-pc"></select>
      <label>Processor Generation:</label><select name="generation" id="generation-select"></select>
      <label>CPU:</label><select name="processor" id="cpu-select"></select>
      <label>RAM:</label><select name="ram" id="ram-select"></select>
      <label>Model:</label><select name="model" id="model-select"></select>
      <label>OS:</label><select name="os" id="os-select"></select>
    `;
    saveBtn.onclick = savePCSpec;
    fetchCPU(); fetchRAM(); fetchOS(); fetchProcessorGen(); fetchModel(); fetchDepartments("department-pc");

  } else if (type === "printer") {
    popupTitle.textContent = "Enter Printer Specifications";
    popupFields.innerHTML = `
      <label>Printer Name:</label><input type="text" name="device-name" required>
      <label>Serial Number:</label><input type="text" name="serial" required>
      <label>Ministry Number:</label><input type="text" name="ministry-id" required>
      <label>Department:</label><select name="department" id="department-printer"></select>
      <label>Model:</label><select name="model" id="Model-printer"></select>
    `;
    saveBtn.onclick = savePCSpec;
    fetchPrinterModel(); fetchDepartments("department-printer");

  } else if (type === "scanner") {
    popupTitle.textContent = "Enter Scanner Specifications";
    popupFields.innerHTML = `
      <label>Scanner Name:</label><input type="text" name="device-name" required>
      <label>Serial Number:</label><input type="text" name="serial" required>
      <label>Ministry Number:</label><input type="text" name="ministry-id" required>
      <label>Department:</label><select name="department" id="department-scanner"></select>
      <label>Model:</label><select name="model" id="model-scanner"></select>
    `;
    saveBtn.onclick = savePCSpec;
    fetchScannerModel(); fetchDepartments("department-scanner");

  } else {
    popupFields.innerHTML = "<p>No fields for this type</p>";
  }

  popup.style.display = "flex";
}


// ================== حفظ الجهاز =====================
function savePCSpec() {
  const formElements = popupFields.querySelectorAll("input, select");
  const data = {};
  formElements.forEach(input => {
    data[input.name] = input.value;
  });

  const type = problemTypeDropdown.value.toLowerCase(); // أو استخدم: document.getElementById("problem-type")

  fetch(`http://localhost:5050/AddDevice/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(result => {
      if (result.message) {
        alert(result.message);

        // ✅ إضافة الخيار الجديد مباشرة في dropdown
        const specDropdown = document.getElementById("device-spec");
        const newOption = document.createElement("option");
        newOption.value = result.insertedId || data.serial || data["device-name"]; // fallback
        newOption.textContent = `${data["device-name"]} | ${data.serial} | ${data["ministry-id"]}`;
        specDropdown.appendChild(newOption);
        specDropdown.value = newOption.value;

        // ✅ إغلاق البوب أب بدون لمس عناصر غير موجودة
        popup.style.display = "none";
      } else {
        alert("❌ Failed to save: " + result.error);
      }
    })
    .catch(err => {
      console.error("❌ Error saving device:", err);
      alert("❌ Server connection failed");
    });
}


// ================== إرسال النموذج =====================
document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();

  const data = {
    DeviceType: document.getElementById("problem-type").value,
    DeviceID: document.getElementById("device-spec").value,
    Section: document.getElementById("section").value,
    Floor: document.getElementById("floor").value,
    ProblemType: document.getElementById("problem-type").value,
    ProblemStatus: document.getElementById("problem-status").value,
    InitialDiagnosis: document.querySelector('input[placeholder="Enter initial diagnosis"]').value,
    FinalDiagnosis: document.querySelector('input[placeholder="Enter final diagnosis"]').value,
    CustomerName: document.querySelector('input[placeholder="Enter customer name"]').value,
    IDNumber: document.querySelector('input[placeholder="Enter ID number"]').value,
    ExtNumber: document.querySelector('input[placeholder="Enter extension number"]').value,
    Technical: document.getElementById("technical").value
  };

  fetch("http://localhost:5050/submit-general-maintenance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(result => {
      alert(result.message);
      location.reload();  // إعادة تحميل الصفحة بعد الإرسال الناجح

    })
    .catch(err => {
      console.error("❌ Failed to submit form:", err);
      alert("❌ Submission failed");
    });
});

// ================== دوال الموديلات والخصائص =====================
function fetchCPU() {
  fetch("http://localhost:5050/CPU_Types")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("cpu-select");
      select.innerHTML = '<option disabled selected>Select CPU</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.cpu_name;
        option.textContent = item.cpu_name;
        select.appendChild(option);
      });
    });
}
function fetchRAM() {
  fetch("http://localhost:5050/RAM_Types")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("ram-select");
      select.innerHTML = '<option disabled selected>Select RAM</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.ram_type;
        option.textContent = item.ram_type;
        select.appendChild(option);
      });
    });
}
function fetchOS() {
  fetch("http://localhost:5050/OS_Types")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("os-select");
      select.innerHTML = '<option disabled selected>Select OS</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.os_name;
        option.textContent = item.os_name;
        select.appendChild(option);
      });
    });
}
function fetchProcessorGen() {
  fetch("http://localhost:5050/Processor_Generations")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("generation-select");
      select.innerHTML = '<option disabled selected>Select Generation</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.generation_number;
        option.textContent = item.generation_number;
        select.appendChild(option);
      });
    });
}
function fetchModel() {
  fetch("http://localhost:5050/PC_Model")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("model-select");
      select.innerHTML = '<option disabled selected>Select Model</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        select.appendChild(option);
      });
    });
}
function fetchPrinterModel() {
  fetch("http://localhost:5050/Printer_Model")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("Model-printer");
      select.innerHTML = '<option disabled selected>Select Model</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        select.appendChild(option);
      });
    });
}
function fetchScannerModel() {
  fetch("http://localhost:5050/Scanner_Model")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("model-scanner");
      select.innerHTML = '<option disabled selected>Select Model</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        select.appendChild(option);
      });
    });
}
function fetchDepartments(selectId = "department") {
  fetch("http://localhost:5050/Departments")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById(selectId);
      if (!select) return;
      select.innerHTML = '<option value="">Select Department</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        select.appendChild(option);
      });
    });
}
function fetchDeviceSpecsByTypeAndDepartment() {
  const type = document.getElementById("problem-type").value.toLowerCase();
  const dept = document.getElementById("section").value;
  const dropdown = document.getElementById("device-spec");

  if (!type || !dept) return;

  fetch(`http://localhost:5050/devices/${type}/${encodeURIComponent(dept)}`)
    .then(res => res.json())
    .then(data => {
      dropdown.innerHTML = `
        <option value="" disabled selected>Select Specifications</option>
        <option value="add-custom">+ Add New Specification</option>
      `;

      if (!Array.isArray(data) || data.length === 0) {
        const noDataOption = document.createElement("option");
        noDataOption.textContent = "No devices found in this department";
        noDataOption.disabled = true;
        dropdown.appendChild(noDataOption);
        return;
      }

      data.forEach(device => {
        const name = device.name || "Unnamed";
        const option = document.createElement("option");
        option.value = device.id;
        option.textContent = `${name} | ${device.Serial_Number} | ${device.Governmental_Number}`;
        dropdown.appendChild(option);
      });
    })
    .catch(err => {
      console.error("❌ Error fetching specs:", err);
    });
}

function fetchDevicesBySection() {
  const type = document.getElementById("problem-type").value.toLowerCase();
  const department = document.getElementById("section").value;

  if (!type || !department) {
    alert("❌ تأكد من اختيار نوع الجهاز والقسم");
    return;
  }

  fetch(`http://localhost:5050/devices/${type}/${encodeURIComponent(department)}`)
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("device-spec");
      dropdown.innerHTML = '<option disabled selected>Select specification</option>';
      data.forEach(device => {
        const option = document.createElement("option");
        const label = type === 'pc' ? device.Computer_Name : type === 'printer' ? device.Printer_Name : device.Scanner_Name;
        option.value = device.Serial_Number;
        option.textContent = `${device.Serial_Number} | ${label}`;
        dropdown.appendChild(option);
      });
    })
    .catch(err => console.error("❌ Error fetching device specs:", err));
}
