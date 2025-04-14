const deviceTypeSelect = document.getElementById("device-type");
const deviceSpecSelect = document.getElementById("device-spec");
const popup = document.getElementById("popup-modal");
const popupHeading = popup.querySelector("#popup-title");
const popupForm = document.getElementById("pc-spec-form");
const popupFieldsContainer = document.getElementById("popup-fields");

if (deviceTypeSelect) {
  deviceTypeSelect.addEventListener("change", function () {
    deviceSpecSelect.value = "";
    fetchDeviceSpecsByTypeAndDepartment(); // ✅ ضروري عشان يعرض الأجهزة حسب النوع الجديد

  });
}

function fetchAndRenderModels(deviceType, selectId) {
  const cleanedType = deviceType.trim().toLowerCase();
  const dropdown = document.getElementById(selectId);
  if (!dropdown) return;

  let endpoint = "";
  if (cleanedType === "pc") endpoint = "/PC_Model";
  else if (cleanedType === "printer") endpoint = "/Printer_Model";
  else if (cleanedType === "scanner") endpoint = "/Scanner_Model";
  else endpoint = `/models-by-type/${cleanedType}`;

  fetch(`http://localhost:5050${endpoint}`)
    .then(res => res.json())
    .then(data => {
      dropdown.innerHTML = `<option value="" disabled selected>Select Model</option>`;

      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        dropdown.appendChild(option);
      });

      const addOption = document.createElement("option");
      addOption.value = "add-new-model";
      addOption.textContent = "+ Add New Model";
      dropdown.appendChild(addOption);

      const lastModel = sessionStorage.getItem("lastAddedModel");
      if (lastModel) {
        dropdown.value = lastModel;
        sessionStorage.removeItem("lastAddedModel");
      }
    })
    .catch(err => {
      console.error("❌ Error fetching models:", err);
    });
}



function updatePopupHeadingAndFields(type) {
  popupFieldsContainer.innerHTML = "";
  const typeCleaned = type.trim().toLowerCase();

  if (typeCleaned === "pc") {
    popupHeading.textContent = "Enter PC Specifications";
    popupFieldsContainer.innerHTML = `
      <label>Computer Name:</label>
      <input type="text" name="device-name" required>

      <label>Serial Number:</label>
      <input type="text" name="serial" required>

      <label>Ministry Number:</label>
      <input type="text" name="ministry-id" required>

      <label for="department-pc">Department:</label>
      <select id="department-pc" name="department" required>
        <option value="">Select Department</option>
      </select>

      <label>Processor Generation:</label>
      <select name="generation" id="generation-select" required>
        <option disabled selected>Select generation</option>
      </select>

      <label>CPU:</label>
      <select name="processor" id="cpu-select" required>
        <option disabled selected>Select processor</option>
      </select>

      <label>RAM:</label>
      <select name="ram" id="ram-select" required>
        <option disabled selected>Select RAM</option>
      </select>

      <label>Model:</label>
      <select name="model" id="model-select" required>
        <option disabled selected>Select Model</option>
      </select>

      <label>Operating System:</label>
      <select name="os" id="os-select" required>
        <option disabled selected>Select OS</option>
      </select>
    `;
    fetchCPU();
    fetchRAM();
    fetchOS();
    fetchProcessorGen();
    fetchAndRenderModels("pc", "model-select");
    fetchDepartments("department-pc");

  } else if (typeCleaned === "printer") {
    popupHeading.textContent = "Enter Printer Specifications";
    popupFieldsContainer.innerHTML = `
      <label>Printer Name:</label>
      <input type="text" name="device-name" required>

      <label>Serial Number:</label>
      <input type="text" name="serial" required>

      <label>Ministry Number:</label>
      <input type="text" name="ministry-id" required>

      <label for="department-printer">Department:</label>
      <select id="department-printer" name="department" required>
        <option value="">Select Department</option>
      </select>

      <label>Model:</label>
      <select name="model" id="Model-printer" required>
        <option disabled selected>Select Model</option>
      </select>
    `;
    fetchAndRenderModels("printer", "Model-printer");


    fetchDepartments("department-printer");

  } else if (typeCleaned === "scanner") {
    popupHeading.textContent = "Enter Scanner Specifications";
    popupFieldsContainer.innerHTML = `
      <label>Scanner Name:</label>
      <input type="text" name="device-name" required>

      <label>Serial Number:</label>
      <input type="text" name="serial" required>

      <label>Ministry Number:</label>
      <input type="text" name="ministry-id" required>

      <label for="department-scanner">Department:</label>
      <select id="department-scanner" name="department" required>
        <option value="">Select Department</option>
      </select>

      <label>Model:</label>
      <select name="model" id="model-scanner" required>
        <option disabled selected>Select Model</option>
      </select>
    `;
    fetchDepartments("department-scanner");
    fetchAndRenderModels("scanner", "model-scanner");
  } else {
    popupHeading.textContent = "Enter Device Specifications";
    popupFieldsContainer.innerHTML = "<p>No fields available for this device type.</p>";
  }
}

function closePopup() {
  popup.style.display = "none";
  popupForm.reset();
  deviceSpecSelect.value = "";
}

function savePCSpec() {
  const data = new FormData(popupForm);
  const deviceData = {};
  data.forEach((value, key) => {
    deviceData[key] = value;
  });

  const deviceType = document.getElementById("device-type").value.toLowerCase();

  fetch(`http://localhost:5050/AddDevice/${deviceType}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deviceData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      if (result.message) {
        alert(result.message);

        const dropdown = document.getElementById("device-spec");
        const option = document.createElement("option");
        option.value = result.insertedId || deviceData.serial || deviceData["device-name"]; // fallback
        option.textContent = `${deviceData["device-name"]} | ${deviceData.serial} | ${deviceData["ministry-id"]}`;
        dropdown.appendChild(option);
        dropdown.value = option.value;

        popup.style.display = "none";

      } else {
        alert("❌ فشل في الحفظ: " + result.error);
      }
    })
    .catch(err => {
      console.error("❌ خطأ أثناء الاتصال بالسيرفر:", err);
      alert("❌ حدث خطأ في الاتصال بالسيرفر. تأكد أن السيرفر يعمل");
    });
}


function fetchDepartments(selectId = "department") {
  fetch("http://localhost:5050/Departments")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById(selectId);
      if (!select) return;

      // العنوان الأساسي
      select.innerHTML = `<option value="" disabled selected>${selectId === "section" ? "Select section" : "Select Department"}</option>`;

      // ✅ أول شيء نضيف + Add New (فوق الكل)
      if (selectId === "section") {
        const addOption = document.createElement("option");
        addOption.value = "add-custom";
        addOption.textContent = "+ Add New Section";
        select.appendChild(addOption);
      }

      // بعدين نضيف الخيارات الجاية من السيرفر
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        select.appendChild(option);
      });
    });
}



function fetchCPU() {
  fetch("http://localhost:5050/CPU_Types")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById("cpu-select");
      select.innerHTML = '<option disabled selected>Select processor</option>';
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
    .then(response => response.json())
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
    .then(response => response.json())
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
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById("generation-select");
      select.innerHTML = '<option disabled selected>Select generation</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.generation_number;
        option.textContent = item.generation_number;
        select.appendChild(option);
      });
    });
}

function fetchDeviceTypes() {
  fetch("http://localhost:5050/TypeProplem")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("device-type");
      dropdown.innerHTML = '<option value="" disabled selected>Select device type</option>';
      // أضف خيار إضافة جديد
      const addOption = document.createElement("option");
      addOption.value = "add-custom";
      addOption.textContent = "+ Add New Device Type";
      dropdown.appendChild(addOption);
      data.forEach(item => {

        const option = document.createElement("option");
        option.value = item.DeviceType;
        option.textContent = item.DeviceType;
        dropdown.appendChild(option);
      });


    });
}



function fetchDevicesBySection() {
  const type = document.getElementById("device-type").value.toLowerCase();
  const department = document.getElementById("section").value;

  if (!type || !department) {
    alert("❌ تأكد من اختيار نوع الجهاز والقسم");
    return;
  }

  fetch(`http://localhost:5050/devices/${type}/${department}`)
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("device-spec");
      dropdown.innerHTML = '<option disabled selected>Select specification</option>';


      data.forEach(device => {
        const option = document.createElement("option");
        option.value = device.Serial_Number;
        option.textContent = `${device.Serial_Number} | ${device[type === 'pc' ? 'Computer_Name' : type === 'printer' ? 'Printer_Name' : 'Scanner_Name']}`;
        dropdown.appendChild(option);
      });
    })
    .catch(err => console.error("❌ Error fetching device specs:", err));
}

function fetchDeviceSpecsByTypeAndDepartment() {

  const type = document.getElementById("device-type").value.toLowerCase();
  const dept = document.getElementById("section").value;
  const dropdown = document.getElementById("device-spec");

  // ما نكمل إلا إذا النوع والقسم مختارين
  if (!type || !dept) return;

  fetch(`http://localhost:5050/devices/${type}/${encodeURIComponent(dept)}`)
    .then(res => res.json())
    .then(data => {
      // تنظيف القائمة قبل ما نضيف الجديد
      dropdown.innerHTML = `
        <option value="" disabled selected>Select specification</option>
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
        option.value = device.id; // 👈 this is the real device_id from Maintenance_Devices
        option.textContent = `${name} | ${device.Serial_Number} | ${device.Governmental_Number}`;
        dropdown.appendChild(option);
      });
    })

    .catch(err => {
      console.error("❌ Error fetching specs:", err);
    });
}


document.addEventListener("DOMContentLoaded", () => {
  fetchDeviceTypes();
  fetchDepartments("section");

  const typeDropdown = document.getElementById("device-type");
  const sectionDropdown = document.getElementById("section");

  if (typeDropdown && sectionDropdown) {
    typeDropdown.addEventListener("change", fetchDeviceSpecsByTypeAndDepartment);
    sectionDropdown.addEventListener("change", fetchDeviceSpecsByTypeAndDepartment);
  }
});

document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();  // منع إعادة تحميل الصفحة

  const form = e.target;
  const formData = new FormData(form);
  const data = {};

  // تحويل بيانات الفورم إلى JSON
  formData.forEach((value, key) => {
    if (data[key]) {
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]];
      }
      data[key].push(value);
    } else {
      data[key] = value;
    }
  });

  // إرسال البيانات إلى السيرفر
  async function submitRegularMaintenance(data) {
    try {
      const response = await fetch("http://localhost:5050/submit-regular-maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unknown server error");
      }

      alert(result.message || "✅ Submitted successfully");

      location.reload();  // إعادة تحميل الصفحة بعد الإرسال الناجح

    } catch (err) {
      console.error("❌ Submission error:", err);
      alert("❌ Failed to submit: " + err.message);
    }
  }

  submitRegularMaintenance(data);
});

async function submitRegularMaintenance(data) {
  try {
    const response = await fetch("http://localhost:5050/submit-regular-maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unknown server error");
    }

    alert(result.message || "✅ Submitted successfully");

    // ✅ نعيد تحميل الصفحة بعد الحفظ
    location.reload();

  } catch (err) {
    console.error("❌ Submission error:", err);
    alert("❌ Failed to submit: " + err.message);
  }
}
const generalDropdowns = [
  { id: "device-type", label: "Device Type" },
  { id: "section", label: "Section" },
  { id: "device-spec", label: "Device Specification" } // ✅ أضف هذا

];
generalDropdowns.forEach(({ id, label }) => {
  const dropdown = document.getElementById(id);
  if (!dropdown) return;

  dropdown.addEventListener("change", () => {
    if (dropdown.value !== "add-custom") return;

    const type = deviceTypeSelect?.value?.trim().toLowerCase();

    if (label === "Device Specification") {
      if (["pc", "printer", "scanner"].includes(type)) {
        popup.style.display = "flex";
        updatePopupHeadingAndFields(type);
      } else {
        openGenericPopup(label, id);
      }
    } else {
      openGenericPopup(label, id);
    }
  });
});



function openGenericPopup(label, targetId) {
  const popup = document.getElementById("generic-popup");

  if (label === "Device Specification") {
    const deviceType = document.getElementById("device-type")?.value;
    const cleanedType = deviceType.trim().toLowerCase();

    // ✅ فقط جلب الأقسام
    fetch("http://localhost:5050/Departments")
      .then(res => res.json())
      .then((departments) => {
        const departmentsOptions = departments
          .map(dep => `<option value="${dep.name}">${dep.name}</option>`)
          .join("");

        // نبدأ بناء النموذج
        popup.innerHTML = `
          <div class="popup-content">
            <h3>Add Device Specification</h3>

            <label>Device Name:</label>
            <input type="text" id="spec-name" />
            <label>Serial Number:</label>
            <input type="text" id="spec-serial" />
            <label>Ministry Number:</label>
            <input type="text" id="spec-ministry" />

            <label>Model:</label>
            <select id="spec-model">
              <option value="" disabled selected>Select Model</option>
              <option value="add-new-model">+ Add New Model</option>
            </select>
           <label>Department:</label>
           <select id="spec-department">
         <option value="" disabled selected>Select department</option>
          ${departmentsOptions}
          <option value="add-new-department">+ Add New Section</option> 
        </select>

            <input type="hidden" id="generic-popup-target-id" value="${targetId}" />

            <div class="popup-buttons">
              <button onclick="saveDeviceSpecification()">Save</button>
              <button onclick="closeGenericPopup()">Cancel</button>
            </div>
          </div>
        `;

        popup.style.display = "flex";

        document.getElementById("spec-department").addEventListener("change", function (e) {
          if (e.target.value === "add-new-department") {
            const currentFields = ["spec-ministry", "spec-name", "spec-serial", "spec-model"];
            currentFields.forEach(id => {
              const el = document.getElementById(id);
              if (el) sessionStorage.setItem(id, el.value);
            });
            openAddSectionPopup(); // ✅ استدعاء البوب أب الجديد
          }
        });


        // 🟢 جلب الموديلات حسب نوع الجهاز (قديم أو جديد)
        fetchAndRenderModels(cleanedType, "spec-model");


        // ✅ استرجاع القيم المؤقتة
        setTimeout(() => {
          const fields = ["spec-ministry", "spec-name", "spec-serial", "spec-department"];
          fields.forEach(id => {
            const el = document.getElementById(id);
            const saved = sessionStorage.getItem(id);
            if (el && saved) {
              el.value = saved;
              sessionStorage.removeItem(id);
            }
          });

          const lastModel = sessionStorage.getItem("lastAddedModel");
          if (lastModel) {
            document.getElementById("spec-model").value = lastModel;
            sessionStorage.removeItem("lastAddedModel");
          }
        }, 0);

        // ✅ إضافة موديل جديد يدويًا
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

      })
      .catch(err => {
        console.error("❌ Error loading departments:", err);
        alert("فشل في تحميل البيانات");
      });

  } else {
    popup.innerHTML = `
      <div class="popup-content">
        <h3 id="generic-popup-title">Add New ${label}</h3>
        <label for="generic-popup-input" id="generic-label">${label}:</label>
        <input type="text" id="generic-popup-input" placeholder="Enter ${label}" required />
        <input type="hidden" id="generic-popup-target-id" value="${targetId}" />
        <div class="popup-buttons">
          <button type="button" class="save-btn" onclick="saveGenericOption()">Save</button>
          <button type="button" class="cancel-btn" onclick="closeGenericPopup()">Cancel</button>
        </div>
      </div>
    `;
    popup.style.display = "flex";
  }
}
function openAddModelPopup() {
  const deviceType = document.getElementById("device-type").value.trim();

  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-content">
      <h3>Add New Model for ${deviceType}</h3>
      <label>Model Name:</label>
      <input type="text" id="new-model-name" placeholder="Enter model name" />
      <div class="popup-buttons">
        <button onclick="saveNewModel()">Save</button>
        <button onclick="closeGenericPopup()">Cancel</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}


function openAddSectionPopup() {
  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-content">
      <h3>Add New Section</h3>
      <label>Section Name:</label>
      <input type="text" id="new-section-name" placeholder="Enter section name" />
      <div class="popup-buttons">
        <button onclick="saveNewSection()">Save</button>
        <button onclick="closeGenericPopup()">Cancel</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}


function saveNewSection() {
  const sectionName = document.getElementById("new-section-name").value.trim();
  if (!sectionName) {
    alert("❌ Please enter a section name");
    return;
  }

  fetch("http://localhost:5050/add-options-regular", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: "section", value: sectionName })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
        return;
      }

      alert(result.message || "✅ Section added successfully");

      // ✅ احفظ اسم القسم في sessionStorage عشان نرجعه بعد الإضافة
      sessionStorage.setItem("spec-department", sectionName);

      // ✅ أعد فتح بوب أب المواصفات
      openGenericPopup("Device Specification", "device-spec");
    })
    .catch(err => {
      console.error("❌ Failed to save section:", err);
      alert("❌ Error saving new section");
    });
}


function saveNewModel() {
  const deviceType = document.getElementById("device-type").value.trim().toLowerCase();
  const modelName = document.getElementById("new-model-name").value.trim();

  if (!modelName) {
    alert("❌ اكتب اسم الموديل");
    return;
  }

  // ✅ حفظ القيم الحالية من حقول Device Specification قبل إغلاقها
  const fieldsToSave = ["spec-ministry", "spec-name", "spec-serial", "spec-department"];
  fieldsToSave.forEach(id => {
    const el = document.getElementById(id);
    if (el) sessionStorage.setItem(id, el.value);
  });

  fetch("http://localhost:5050/add-device-model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_name: modelName, device_type_name: deviceType })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
        return;
      }

      alert(result.message);
      sessionStorage.setItem("lastAddedModel", modelName);
      fetchAndRenderModels(deviceType, "spec-model");
      openGenericPopup("Device Specification", "device-spec");
    })
    .catch(err => {
      console.error("❌ Failed to save model:", err);
      alert("❌ فشل في إضافة الموديل");
    });
}


function saveDeviceSpecification() {
  const ministry = document.getElementById("spec-ministry").value.trim();
  const name = document.getElementById("spec-name").value.trim();
  const model = document.getElementById("spec-model").value.trim();
  const serial = document.getElementById("spec-serial").value.trim();
  const department = document.getElementById("spec-department").value.trim();
  const deviceType = document.getElementById("device-type").value.toLowerCase();
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

        // ✅ إنشاء الخيار الجديد مباشرة بدون إعادة تحميل القائمة
        const option = document.createElement("option");
        option.value = result.insertedId || specData.serial;
        option.textContent = `${specData.name} | ${specData.serial} | ${specData.ministry}`;
        dropdown.appendChild(option);
        dropdown.value = option.value;

        // ✅ إغلاق الـ popup بأمان
        const popup = document.getElementById("generic-popup");
        if (popup) popup.style.display = "none";

        // ✅ تنظيف الحقول
        document.getElementById("spec-ministry").value = "";
        document.getElementById("spec-name").value = "";
        document.getElementById("spec-model").value = "";
        document.getElementById("spec-serial").value = "";
        document.getElementById("spec-department").value = "";

      } else {
        alert("❌ فشل في الحفظ: " + result.error);
      }
    })
    .catch(err => {
      console.error("❌ Error saving specification:", err);
      alert("❌ Failed to save specification");
    });
}

function closeGenericPopup() {
  document.getElementById("generic-popup").style.display = "none";
}

function saveGenericOption() {
  const value = document.getElementById("generic-popup-input").value.trim();
  const targetId = document.getElementById("generic-popup-target-id").value;
  const dropdown = document.getElementById(targetId);

  if (!value || !dropdown) return;

  fetch("http://localhost:5050/add-options-regular", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: targetId, value })
  })
    .then(res => res.json())
    .then(result => {
      alert(result.message || "✅ Option added successfully");
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      dropdown.appendChild(option);
      dropdown.value = value;
      if (targetId === "device-type") {
        fetchDeviceSpecsByTypeAndDepartment();
      }
      closeGenericPopup();
    })
    .catch(err => {
      console.error("❌ Error saving option:", err);
      alert("❌ Failed to save option");
    });
}