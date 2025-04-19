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
      renderSelectOptionsWithAddFirst(
        dropdown,
        data,
        "model_name",
        "model_name",
        "add-new-model",
        "+ Add New Model",
        "Select Model"
      );

      dropdown.addEventListener("change", (e) => {
        if (e.target.value === "add-new-model") {
          const fields = ["spec-ministry", "spec-name", "spec-serial", "spec-department"];
          fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) sessionStorage.setItem(id, el.value);
          });
          openAddModelPopup();
        }
      });

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

  // ✅ إعادة اختيار القوائم إلى الوضع الافتراضي (لو كان مختار + Add New)
  const modelSelect = document.getElementById("model-select");
  if (modelSelect && modelSelect.value === "add-new-model") {
    modelSelect.selectedIndex = 0;
  }
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
  // Fetch departments list from the server
  fetch("http://localhost:5050/Departments")
    .then(response => response.json()) // Convert response to JSON
    .then(data => {
      // Get the dropdown element by ID (defaults to "department")
      const select = document.getElementById(selectId);
      if (!select) return; // Exit if dropdown doesn't exist

      // Set placeholder text based on selectId (either section or department)
      const placeholderText = selectId === "section" ? "Select section" : "Select Department";

      // Populate the dropdown with department options, including "+ Add New Section"
      renderSelectOptionsWithAddFirst(
        select,                  // The dropdown element
        data,                    // Array of departments from the server
        "name",                  // Option value field
        "name",                  // Option label field
        "add-new-department",    // Value for the "+ Add New Section" option
        "+ Add New Section",     // Label for the "+ Add New Section" option
        placeholderText          // Placeholder text
      );

      // Restore previously selected department if stored in sessionStorage
      const savedDept = sessionStorage.getItem(selectId);
      if (savedDept) {
        select.value = savedDept;              // Restore value
        sessionStorage.removeItem(selectId);   // Clear from storage
      }

      // Handle user selecting "+ Add New Section"
      select.addEventListener("change", function (e) {
        if (e.target.value === "add-new-department") {
          sessionStorage.setItem("lastDropdownOpened", selectId);       // Track which dropdown triggered the popup
          openAddSectionPopup();                                        // Open the section add popup
          sessionStorage.setItem("lastDepartmentSelectId", selectId);   // Save department dropdown ID for after adding
        }
      });
    });
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

      const selectId = sessionStorage.getItem("lastDepartmentSelectId") || "spec-department";
      const select = document.getElementById(selectId);
      if (select) {
        const exists = Array.from(select.options).some(opt => opt.value === sectionName);
        if (!exists) {
          const option = document.createElement("option");
          option.value = sectionName;
          option.textContent = sectionName;

          const addNewIndex = Array.from(select.options).findIndex(opt => opt.value === "add-new-department");
          if (addNewIndex !== -1) {
            select.insertBefore(option, select.options[addNewIndex]);
          } else {
            select.appendChild(option);
          }
        }

        select.value = sectionName;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }

      sessionStorage.removeItem("lastDepartmentSelectId");
      sessionStorage.setItem(selectId, sectionName);
      sessionStorage.removeItem("returnToPopup");

      // ✅ أغلق البوب أب
      document.getElementById("generic-popup").style.display = "none";

      // ✅ فقط إذا الإضافة كانت داخل popup المواصفات + الجهاز غير معروف → ارجع لبوب أب المواصفات
      const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
      const isSpecContext = ["spec-department", "department-pc", "department-printer", "department-scanner"].includes(selectId);

      if (isSpecContext && !["pc", "printer", "scanner"].includes(deviceType)) {
        const modelName = document.getElementById("spec-model")?.value;
        if (modelName) sessionStorage.setItem("spec-model", modelName);
      
        setTimeout(() => {
          openGenericPopup("Device Specification", "device-spec");
      
          setTimeout(() => {
            const deptSelect = document.getElementById("spec-department");
            if (deptSelect) {
              deptSelect.value = sectionName;
              deptSelect.dispatchEvent(new Event("change", { bubbles: true }));
            }
      
            const modelSelect = document.getElementById("spec-model");
            const savedModel = sessionStorage.getItem("spec-model");
            if (modelSelect && savedModel) {
              modelSelect.value = savedModel;
              modelSelect.dispatchEvent(new Event("change", { bubbles: true }));
              sessionStorage.removeItem("spec-model");
            }
          }, 150);
        }, 100);
      }
      

    })
    .catch(err => {
      console.error("❌ Failed to save section:", err);
      alert("❌ Error saving section");
    });
}


function renderSelectOptionsWithAddFirst(selectElement, optionsArray, valueKey, textKey, addNewValue, addNewLabel, placeholderText) {
  if (!selectElement) return;

  // تفريغ القائمة
  selectElement.innerHTML = "";

  // 1. placeholder
  const placeholder = document.createElement("option");
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = placeholderText;
  selectElement.appendChild(placeholder);

  // 2. + Add New
  const addNewOption = document.createElement("option");
  addNewOption.value = addNewValue;
  addNewOption.textContent = addNewLabel;
  selectElement.appendChild(addNewOption);

  // 3. باقي الخيارات
  optionsArray.forEach(item => {
    const option = document.createElement("option");
    option.value = item[valueKey];
    option.textContent = item[textKey];
    selectElement.appendChild(option);
    
  });
}


function fetchCPU() {
  fetch("http://localhost:5050/CPU_Types")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("cpu-select");

      renderSelectOptionsWithAddFirst(
        select,
        data,
        "cpu_name",
        "cpu_name",
        "add-new",
        "+ Add New CPU",
        "Select processor"
      );

      // ✅ تحديد القيمة الجديدة إن وجدت
      const saved = sessionStorage.getItem("cpu-select");
      if (saved) {
        select.value = saved;
        sessionStorage.removeItem("cpu-select");
      }

      select.addEventListener("change", (e) => {
        if (e.target.value === "add-new") {
          sessionStorage.setItem("lastDropdownOpened", e.target.id); // ✅ أضف هذا
          sessionStorage.setItem("cpu-select", ""); // تحديد العودة لاحقًا
          openAddOptionPopup("cpu-select");
        }
      });
    });
}

function fetchRAM() {
  // Fetch RAM types from the server
  fetch("http://localhost:5050/RAM_Types")
    .then(response => response.json()) // Convert the response to JSON
    .then(data => {
      // Get the RAM select dropdown element
      const select = document.getElementById("ram-select");

      // Render the options into the dropdown with "+ Add New RAM" and placeholder at the top
      renderSelectOptionsWithAddFirst(
        select,            // The select element to populate
        data,              // The data fetched from the server
        "ram_type",        // Key for the option value
        "ram_type",        // Key for the option label
        "add-new",         // Value for the "+ Add New" option
        "+ Add New RAM",   // Display label for the "+ Add New" option
        "Select RAM"       // Placeholder option text
      );

      // Check if a temporary value was saved earlier in sessionStorage
      const saved = sessionStorage.getItem("ram-select");
      if (saved) {
        select.value = saved;                  // Restore the saved value
        sessionStorage.removeItem("ram-select"); // Remove it from storage after restoring
      }

      // Listen for changes in the dropdown
      select.addEventListener("change", (e) => {
        // If "+ Add New" was selected
        if (e.target.value === "add-new") {
          sessionStorage.setItem("lastDropdownOpened", e.target.id); // Save which dropdown triggered the popup
          sessionStorage.setItem("ram-select", ""); // Mark that we might return here
          openAddOptionPopup("ram-select"); // Open the popup to add a new RAM option
        }
      });
    });
}



function fetchOS() {
  // Fetch OS types from the server
  fetch("http://localhost:5050/OS_Types")
    .then(response => response.json()) // Convert response to JSON
    .then(data => {
      // Get the OS select dropdown element
      const select = document.getElementById("os-select");

      // Populate the dropdown with options including "+ Add New OS" and placeholder
      renderSelectOptionsWithAddFirst(
        select,             // The select element
        data,               // Data from the server
        "os_name",          // Option value key
        "os_name",          // Option label key
        "add-new",          // Special value for "Add New"
        "+ Add New OS",     // Label for the "Add New" option
        "Select OS"         // Placeholder text
      );

      // Restore previously saved value if exists
      const saved = sessionStorage.getItem("os-select");
      if (saved) {
        select.value = saved;                  // Set saved value
        sessionStorage.removeItem("os-select"); // Clear from session storage
      }

      // Handle selection change
      select.addEventListener("change", (e) => {
        // If user selects "+ Add New"
        if (e.target.value === "add-new") {
          sessionStorage.setItem("lastDropdownOpened", e.target.id); // Save the triggering dropdown
          sessionStorage.setItem("os-select", ""); // Mark this for restore
          openAddOptionPopup("os-select"); // Open popup to add a new OS
        }
      });
    });
}


function fetchProcessorGen() {
  // Fetch processor generation options from the server
  fetch("http://localhost:5050/Processor_Generations")
    .then(response => response.json()) // Convert response to JSON
    .then(data => {
      // Get the processor generation select element
      const select = document.getElementById("generation-select");

      // Populate the dropdown with generation numbers and "+ Add New Generation" option
      renderSelectOptionsWithAddFirst(
        select,                   // The select element
        data,                     // Data from the server
        "generation_number",      // Key for option value
        "generation_number",      // Key for option label
        "add-new",                // Special value for "Add New"
        "+ Add New Generation",   // Label for the "Add New" option
        "Select generation"       // Placeholder text
      );

      // Restore previously saved value from sessionStorage
      const saved = sessionStorage.getItem("generation-select");
      if (saved) {
        select.value = saved;                          // Restore saved value
        sessionStorage.removeItem("generation-select"); // Clear it after use
      }

      // Listen for change in the dropdown
      select.addEventListener("change", (e) => {
        // If "+ Add New" is selected
        if (e.target.value === "add-new") {
          sessionStorage.setItem("lastDropdownOpened", e.target.id); // Save dropdown ID
          sessionStorage.setItem("generation-select", ""); // Mark for return
          openAddOptionPopup("generation-select"); // Show the add popup
        }
      });
    });
}



function openAddOptionPopup(targetId) {
  // نحدد النص المناسب حسب الـ id
  let label = "New Option";
  if (targetId === "ram-select") label = "RAM";
  else if (targetId === "cpu-select") label = "CPU";
  else if (targetId === "os-select") label = "Operating System";
  else if (targetId === "generation-select") label = "Processor Generation";

  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-content">
      <h3>Add New ${label}</h3>
      <label for="generic-popup-input"> ${label} Name:</label>
      <input type="text" id="generic-popup-input" placeholder="Enter New ${label}" />
      <input type="hidden" id="generic-popup-target-id" value="${targetId}" />
      <div class="popup-buttons">
        <button onclick="saveOptionForSelect()">Save</button>
        <button onclick="closeGenericPopup()">Cancel</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}

function saveOptionForSelect() {
  const value = document.getElementById("generic-popup-input").value.trim();
  const targetId = document.getElementById("generic-popup-target-id").value;
  const dropdown = document.getElementById(targetId);

  if (!value || !dropdown) return;

  // ✅ نرسل targetId مباشرة لأنه هو اللي السيرفر يتعامل معه
  fetch("http://localhost:5050/add-options-regular", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: targetId, value }) // لا تغير اسم الـ target
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error); // ✅ إظهار رسالة الخطأ لو القيمة موجودة
      } else {
        alert(result.message); // ✅ رسالة النجاح

        // ✅ تحديث القائمة من السيرفر حسب الـ target
        if (targetId === "os-select") fetchOS();
        else if (targetId === "ram-select") fetchRAM();
        else if (targetId === "cpu-select") fetchCPU();
        else if (targetId === "generation-select") fetchProcessorGen();

        // ✅ نحفظ القيمة الجديدة عشان نرجع نحددها تلقائيًا
        sessionStorage.setItem(targetId, value);

        closeGenericPopup();
      }
    })
    .catch(err => {
      console.error("❌ Error saving new option:", err);
      alert("❌ Failed to save new option");
    });
}

function fetchDeviceTypes() {
  fetch("http://localhost:5050/TypeProplem")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("device-type");

      renderSelectOptionsWithAddFirst(
        dropdown,
        data,
        "DeviceType",
        "DeviceType",
        "add-custom",
        "+ Add New Device Type",
        "Select device type"
      );
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
  console.log("🔍 Sending device ID:", data["device-spec"]);

  submitRegularMaintenance(data);
});



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

    // ✅ Fetch departments from the server
    fetch("http://localhost:5050/Departments")
      .then(res => res.json())
      .then((departments) => {
        // ✅ تحقق إذا نوع الجهاز غير معروف
        const isUnknownType = !["pc", "printer", "scanner"].includes(cleanedType);

        // ✅ بناء قائمة الأقسام بترتيب حسب نوع الجهاز
        const departmentsOptions = isUnknownType
          ? `<option value="add-new-department">+ Add New Section</option>` +
            departments.map(dep => `<option value="${dep.name}">${dep.name}</option>`).join("")
          : departments.map(dep => `<option value="${dep.name}">${dep.name}</option>`).join("") +
            `<option value="add-new-department">+ Add New Section</option>`;

        // 🛠 Build the popup form for device specification
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
            </select>

            <input type="hidden" id="generic-popup-target-id" value="${targetId}" />

            <div class="popup-buttons">
              <button onclick="saveDeviceSpecification()">Save</button>
              <button onclick="closeGenericPopup()">Cancel</button>
            </div>
          </div>
        `;

        popup.style.display = "flex";

        // ✅ When selecting "+ Add New Section"
        document.getElementById("spec-department").addEventListener("change", function (e) {
          if (e.target.value === "add-new-department") {
            const currentFields = ["spec-ministry", "spec-name", "spec-serial", "spec-model"];
            currentFields.forEach(id => {
              const el = document.getElementById(id);
              if (el) sessionStorage.setItem(id, el.value);
            });
            openAddSectionPopup();
          }
        });

        // ✅ Load models based on device type
        fetchAndRenderModels(cleanedType, "spec-model");

        // ✅ Restore any temporary values (if previously stored)
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

        // ✅ Handle "+ Add New Model" selection
        document.getElementById("spec-model").addEventListener("change", (e) => {
          if (e.target.value === "add-new-model") {
            sessionStorage.setItem("lastDropdownOpened", "spec-model");
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
        alert("Failed to load departments");
      });

  } else {
    // Generic popup for adding other options
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
  const origin = document.getElementById("generic-popup-target-id")?.value;
  if (origin === "device-spec") {
    sessionStorage.setItem("returnToPopup", "true");
  }

  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-content">
      <h3>Add New Model for ${deviceType}</h3>
      <label>Model Name:</label>
      <input type="text" id="new-model-name" placeholder="Enter model name" />
      <input type="hidden" id="generic-popup-target-id" value="model" />
      <div class="popup-buttons">
        <button onclick="saveNewModel()">Save</button>
        <button onclick="closeGenericPopup()">Cancel</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}


function openAddSectionPopup() {
  // ✅ علشان نرجع إلى popup المواصفات بعد الإلغاء
  sessionStorage.setItem("returnToPopup", "true");

  const popup = document.getElementById("generic-popup");

  popup.innerHTML = `
    <div class="popup-content">
      <h3>Add New Section</h3>
      <label>Section Name:</label>
      <input type="text" id="new-section-name" placeholder="Enter section name" />
      <input type="hidden" id="generic-popup-target-id" value="section" />

      <div class="popup-buttons">
        <button onclick="saveNewSection()">Save</button>
        <button onclick="closeGenericPopup()">Cancel</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}




function saveNewModel() {
  const deviceType = document.getElementById("device-type").value.trim().toLowerCase();
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
      if (result.error) {
        alert(result.error);
      } else {
        alert(result.message);

        const modelSelect = document.getElementById("spec-model") ||
                            document.getElementById("model-select") ||
                            document.getElementById(`Model-${deviceType}`) ||
                            document.getElementById(`model-${deviceType}`);

        if (modelSelect) {
          const exists = Array.from(modelSelect.options).some(opt => opt.value === modelName);
          if (!exists) {
            const option = document.createElement("option");
            option.value = modelName;
            option.textContent = modelName;

            const addNewIndex = Array.from(modelSelect.options).findIndex(opt => opt.value === "add-new-model" || opt.value === "add-new");
            if (addNewIndex !== -1) {
              modelSelect.insertBefore(option, modelSelect.options[addNewIndex]);
            } else {
              modelSelect.appendChild(option);
            }

            modelSelect.value = modelName;
            modelSelect.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }

        sessionStorage.removeItem("returnToPopup");

        // ✅ أغلق بوب أب الموديل فقط
        document.getElementById("generic-popup").style.display = "none";

        // ✅ إذا الجهاز غير معروف → رجع المستخدم لبوب أب المواصفات
        if (!["pc", "printer", "scanner"].includes(deviceType)) {
          setTimeout(() => {
            openGenericPopup("Device Specification", "device-spec");
            setTimeout(() => {
              const modelDropdown = document.getElementById("spec-model");
              if (modelDropdown) {
                modelDropdown.value = modelName;
                modelDropdown.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }, 100);
          }, 100);
        }
      }
    })
    .catch(err => {
      console.error("❌ Failed to save model:", err);
      alert("❌ Failed to save the new model");
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

  // ✅ تعديل أسماء المفاتيح لتطابق متطلبات الباكند
  const specData = {
    "ministry-id": ministry,
    "device-name": name,
    model,
    serial,
    department
  };

  fetch(`http://localhost:5050/AddDevice/${deviceType}`, {
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

        if (!result.insertedId) {
          alert("❌ لم يتم استرجاع ID من السيرفر. لا يمكن ربط الجهاز بالصيانة.");
          return;
        }

        console.log("✅ Inserted Device ID:", result.insertedId);

        const option = document.createElement("option");
        option.value = result.insertedId;
        option.textContent = `${name} | ${serial} | ${ministry}`;
        dropdown.appendChild(option);
        dropdown.value = result.insertedId;

        document.getElementById("generic-popup").style.display = "none";

        // تنظيف الحقول
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
      console.error("❌ Error saving device specification:", err);
      alert("❌ Error saving device specification");
    });
}

function closeGenericPopup() {
  const popup = document.getElementById("generic-popup");
  popup.style.display = "none";

  const returnToSpec = sessionStorage.getItem("returnToPopup");
  const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
  const lastDropdownId = sessionStorage.getItem("lastDropdownOpened");

  // ✅ احفظ القيم قبل ما ترجع
  const fieldsToPreserve = ["spec-ministry", "spec-name", "spec-serial", "spec-model", "spec-department"];
  fieldsToPreserve.forEach(id => {
    const el = document.getElementById(id);
    if (el) sessionStorage.setItem(id, el.value);
  });

  // ✅ إذا المستخدم اختار + Add New لأي dropdown، نرجعه إلى "Select"
  if (lastDropdownId) {
    const select = document.getElementById(lastDropdownId);
    if (select && ["add-new", "add-new-model", "add-new-department", "add-custom"].includes(select.value)) {
      const firstOption = select.querySelector('option[disabled][selected]');
      if (firstOption) {
        firstOption.selected = true;
      } else {
        select.selectedIndex = 0;
      }
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    sessionStorage.removeItem("lastDropdownOpened");
  }

  // ✅ إصلاح: تأكد من إرجاع جميع قوائم الموديل إلى الوضع الافتراضي إذا كانت "Add New Model"
  const modelDropdowns = ["spec-model", "model-select", "Model-printer", "model-scanner"];
  modelDropdowns.forEach(id => {
    const dropdown = document.getElementById(id);
    if (dropdown && dropdown.value === "add-new-model") {
      dropdown.selectedIndex = 0;
      dropdown.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  // ✅ إضافي: تأكد من أن القوائم العامة أيضًا يتم تصفيرها إذا كانت add-custom
  const generalDropdowns = ["device-type", "device-spec", "section"];
  generalDropdowns.forEach(id => {
    const dropdown = document.getElementById(id);
    if (dropdown && dropdown.value === "add-custom") {
      const placeholder = Array.from(dropdown.options).find(opt =>
        opt.disabled && opt.textContent.toLowerCase().includes("select")
      );
      if (placeholder) {
        placeholder.selected = true;
      } else {
        dropdown.selectedIndex = 0;
      }
      dropdown.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  // ✅ رجع للبُوب أب إذا الجهاز غير معروف - بشرط ما يكون من section
  if (returnToSpec && !["pc", "printer", "scanner"].includes(deviceType) && lastDropdownId !== "section") {
    sessionStorage.removeItem("returnToPopup");

    setTimeout(() => {
      openGenericPopup("Device Specification", "device-spec");

      setTimeout(() => {
        fieldsToPreserve.forEach(id => {
          const el = document.getElementById(id);
          const val = sessionStorage.getItem(id);
          if (el && val) {
            el.value = val;
            sessionStorage.removeItem(id);
          }
        });

        const dept = sessionStorage.getItem("spec-department");
        if (dept) {
          const deptSelect = document.getElementById("spec-department");
          if (deptSelect) {
            deptSelect.value = dept;
            deptSelect.dispatchEvent(new Event("change", { bubbles: true }));
            sessionStorage.removeItem("spec-department");
          }
        }

        const model = sessionStorage.getItem("spec-model");
        if (model) {
          const modelSelect = document.getElementById("spec-model");
          if (modelSelect) {
            modelSelect.value = model;
            modelSelect.dispatchEvent(new Event("change", { bubbles: true }));
            sessionStorage.removeItem("spec-model");
          }
        }

      }, 150);
    }, 100);

    return;
  }

  // ✅ مسح الحقول المؤقتة
  ["spec-ministry", "spec-name", "spec-serial", "spec-model", "spec-department", "lastAddedModel", "returnToPopup"]
    .forEach(k => sessionStorage.removeItem(k));
}








function prependAddNewOption(selectElement, value = "add-new", text = "+ Add New") {
  if (!selectElement) return;

  const addNewOption = document.createElement("option");
  addNewOption.value = value;
  addNewOption.textContent = text;

  const options = Array.from(selectElement.options);
  const hasAddNew = options.some(opt => opt.value === value);
  if (!hasAddNew) {
    selectElement.insertBefore(addNewOption, selectElement.firstChild);
  }
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
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => { throw new Error(err.error) });
      }
      return res.json();
    })
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
      alert(err.message); // ✅ هنا سيتم عرض رسالة التكرار من السيرفر
    });
}



// إظهار إشعار أسفل الدروب ليست
function showNotification(message, selectId) {
  const selectElement = document.getElementById(selectId);
  let container = selectElement.closest('.dropdown-container') || selectElement.parentNode;

  const notification = document.createElement('div');
  notification.className = "notification";
  notification.textContent = message;
  notification.style.color = "#d9534f";
  notification.style.fontSize = "14px";
  notification.style.marginTop = "4px";

  container.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// فتح البوب أب وتعبئة العنوان والنص الحالي
function openPopup(selectId, title) {
  const select = document.getElementById(selectId);
  const selectedOption = select.options[select.selectedIndex];

  if (!selectedOption || selectedOption.disabled || selectedOption.value === "add-custom") {
    showNotification("Please select a valid option to edit.", selectId);
    return;
  }

  document.getElementById("popup-title").textContent = `Edit ${title}`;
  const popupFields = document.getElementById("popup-fields");
  popupFields.innerHTML = `
    <label>Update ${title}:</label>
    <input type="text" id="popup-input" value="${selectedOption.text}">
  `;

  const saveBtn = document.getElementById("popup-save-btn");
  saveBtn.onclick = () => {
    const newValue = document.getElementById("popup-input").value.trim();
    if (newValue) {
      selectedOption.text = newValue;
    }
    closePopup();
  };

  document.getElementById("popup-modal").style.display = "flex";
}

// إغلاق البوب أب
function closePopup() {
  document.getElementById("popup-modal").style.display = "none";
}

// فتح/إغلاق حقل البحث
function toggleSearch(selectId) {
  const container = document.getElementById(`search-container-${selectId}`);
  container.style.display = container.style.display === "none" ? "block" : "none";

  const input = container.querySelector("input");
  input.value = "";
  input.focus();

  input.oninput = () => {
    const filter = input.value.toLowerCase();
    const select = document.getElementById(selectId);

    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i];
      const shouldShow = option.text.toLowerCase().includes(filter) || option.value === "add-custom";
      option.style.display = shouldShow ? "block" : "none";
    }
  };
}

// حذف الخيار المحدد مع حفظ الحذف بشكل دائم باستخدام localStorage
function deleteOption(selectId) {
  const select = document.getElementById(selectId);
  const selectedIndex = select.selectedIndex;
  const selectedOption = select.options[selectedIndex];

  if (!selectedOption || selectedOption.disabled || selectedOption.value === "add-custom") {
    showNotification("Please select a valid option to delete.", selectId);
    return;
  }

  const deletedOptionText = selectedOption.text;
  select.removeChild(selectedOption);

  const persistentKey = `deletedOptions_${selectId}`;
  let deletedOptions = JSON.parse(localStorage.getItem(persistentKey)) || [];
  if (!deletedOptions.includes(deletedOptionText)) {
    deletedOptions.push(deletedOptionText);
    localStorage.setItem(persistentKey, JSON.stringify(deletedOptions));
  }

  showNotification("Deleted option: " + deletedOptionText, selectId);
}

// دالة تطبق الحذف الدائم عند تحميل الصفحة
function applyDeletions(selectId) {
  const persistentKey = `deletedOptions_${selectId}`;
  const deletedOptions = JSON.parse(localStorage.getItem(persistentKey)) || [];
  const select = document.getElementById(selectId);

  for (let i = select.options.length - 1; i >= 0; i--) {
    if (deletedOptions.includes(select.options[i].text)) {
      select.remove(i);
    }
  }
}

// عند تحميل الصفحة، نطبق الحذف الدائم على القوائم المطلوبة
document.addEventListener("DOMContentLoaded", function() {
  const selectIds = ["problem-type", "section", "device-spec", "floor", "technical", "problem-status"];
  selectIds.forEach(id => {
    if (document.getElementById(id)) {
      applyDeletions(id);
    }
  });
});
