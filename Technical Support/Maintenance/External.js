document.querySelector(".cancel-btn").addEventListener("click", function () {
  window.location.href = "Maintenance.html"; // أو حط رابط صفحة الصيانة حسب المسار الصحيح عندك
});

  // Function to fetch devices for selected type and department
  function fetchDeviceSpecsByTypeAndDepartment() {
    const type = document.getElementById("device-type").value.toLowerCase(); // Get selected type
    const dept = document.getElementById("section").value; // Get selected department
    const dropdown = document.getElementById("device-spec"); // Get the specifications dropdown
  
    if (!type || !dept) return; // Exit if either is not selected
  
    // Fetch matching devices from the server
    fetch(`http://localhost:5050/devices/${type}/${encodeURIComponent(dept)}`)
      .then(res => res.json()) // Parse response
      .then(data => {
        // Clear current options and set default ones
        dropdown.innerHTML = `
          <option value="" disabled selected>Select specification</option>
          <option value="add-custom">+ Add New Specification</option>
        `;
  
        // If no data found, show message
        if (!Array.isArray(data) || data.length === 0) {
          const noDataOption = document.createElement("option");
          noDataOption.textContent = "No devices found in this department";
          noDataOption.disabled = true;
          dropdown.appendChild(noDataOption);
          return;
        }
  
        // Add each device as an option in the dropdown
        data.forEach(device => {
          const name = device.name || "Unnamed";
          const option = document.createElement("option");
          option.value = device.id;
          option.textContent = `${device.name} | ${device.Serial_Number} | ${device.Governmental_Number}`;
          dropdown.appendChild(option);
        });
      })
      .catch(err => {
        console.error("❌ Error fetching specs:", err); // Log error if request fails
      });
  }
  

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("external-maintenance-form");

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const data = {
        ticket_number: document.querySelector('input[placeholder="Enter ticket number"]').value,
        device_type: document.getElementById("device-type").value,
        device_specifications: document.getElementById("device-spec").value,
        section: document.getElementById("section").value,
        maintenance_manager: document.querySelector('input[placeholder="Enter manager name"]').value,
        reporter_name: document.getElementById("reporter-name").value,
        initial_diagnosis: document.querySelector('textarea[placeholder="Enter initial diagnosis"]').value,
        final_diagnosis: document.querySelector('textarea[placeholder="Enter final diagnosis"]').value
      };

      console.log("📤 Sending data to server:", data); // للتأكد من البيانات

      fetch("http://localhost:5050/submit-external-maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })
        .then((res) => res.json())
        .then((result) => {
          console.log("✅ Server response:", result);
          alert(result.message || "تم الإرسال بنجاح");
          location.reload();
        })
        .catch((err) => {
          console.error("❌ Error sending data:", err);
          alert("فشل في الإرسال");
        });
    });
    
  });
  function saveAllSpecFieldValues() {
    const fields = [
      "ministry-id", "device-name", "serial",
      "cpu-select", "ram-select", "os-select",
      "generation-select", "model-select", "department-pc"
    ];
  
    const values = {};
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) values[id] = el.value;
    });
  
    sessionStorage.setItem("spec-temp", JSON.stringify(values));
  }
  
  function restoreAllSpecFieldValues() {
    const values = JSON.parse(sessionStorage.getItem("spec-temp") || "{}");
    for (const id in values) {
      const el = document.getElementById(id);
      
      // ✅ لا تسترجع قيم مثل add-new أو add-custom
      if (
        el &&
        values[id] &&
        !values[id].startsWith("add-") && // يتجاهل "add-new" و "add-custom"
        !values[id].includes("+ Add")
      ) {
        el.value = values[id];
      }
    }
    sessionStorage.removeItem("spec-temp");
  }
  
  
// ================== تعبئة القوائم =====================
document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:5050/TypeProplem")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("device-type");
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.DeviceType;
        option.textContent = item.DeviceType;
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

    fetch("http://localhost:5050/Technical")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("reporter-name");
  
      // أولاً نحط + Add New كأول عنصر
      const addNew = document.createElement("option");
      addNew.value = "add-custom";
      addNew.textContent = "+ Add New Reporter";
      dropdown.appendChild(addNew); // نحطّه أول
  
      // بعدين نضيف العناصر الباقية
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        dropdown.appendChild(option);
      });
    });
  
});

function setupGenericSaveHandler(table, label, select) {
  document.getElementById("popup-save-button").onclick = () => {
    const value = document.getElementById("popup-input").value.trim();
    if (!value) return alert(`❌ Please enter a ${label}`);

    fetch("http://localhost:5050/add-options-regular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: table, value })
    })
      .then(res => res.json())
      .then(result => {
        alert(result.message);

        sessionStorage.setItem("lastAddedValue", value);

        const type = sessionStorage.getItem("currentDeviceType");
        const selectId = sessionStorage.getItem("currentSelectId");

        if (type && selectId) {
          generateFieldsForDeviceType(type);

          setTimeout(() => {
            const dropdown = document.getElementById(selectId);
            if (dropdown) {
              // ✅ تأكد إن الخيار الجديد موجود، أضفه لو مش موجود
              let exists = Array.from(dropdown.options).some(opt => opt.value === value);
              if (!exists) {
                const newOption = document.createElement("option");
                newOption.value = value;
                newOption.textContent = value;
                dropdown.appendChild(newOption);
              }

              // ✅ حدده كقيمة مختارة
              dropdown.value = value;
            }

            sessionStorage.removeItem("lastAddedValue");
          }, 150);
        }

        sessionStorage.removeItem("currentDeviceType");
        sessionStorage.removeItem("currentSelectId");
      })
      .catch(err => {
        console.error(`❌ Error saving ${label}:`, err);
        alert(`❌ Failed to save ${label}`);
      });
  };
}


function insertAddNewOptionAtTop(selectId, value, labelText) {
  const dropdown = document.getElementById(selectId);
  if (!dropdown) return;

  // أولاً، تأكد أن فيه عنصر placeholder أول
  const placeholderExists = dropdown.options.length > 0 && dropdown.options[0].disabled;

  const newOption = document.createElement("option");
  newOption.value = value;
  newOption.textContent = labelText;

  // أدخل الخيار بعد placeholder مباشرة أو كأول عنصر
  const insertPosition = placeholderExists ? 1 : 0;
  dropdown.insertBefore(newOption, dropdown.options[insertPosition]);
}


function fetchModelsByType(type, selectId) {
  let endpoint = "";
  const cleanedType = type.trim().toLowerCase();

  if (cleanedType === "pc") endpoint = "/PC_Model";
  else if (cleanedType === "printer") endpoint = "/Printer_Model";
  else if (cleanedType === "scanner") endpoint = "/Scanner_Model";
  else return;

  fetch(`http://localhost:5050${endpoint}`)
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById(selectId);
      if (!dropdown) return;

      dropdown.innerHTML = '<option disabled selected>Select Model</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        dropdown.appendChild(option);
      });
    })
    .catch(err => {
      console.error(`❌ Failed to fetch models for ${type}:`, err);
    });
}

function fetchModelsForNewDevices(type, selectId) {
  fetch(`http://localhost:5050/models-by-type/${type}`)
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById(selectId);
      if (!dropdown) return;

      dropdown.innerHTML = '<option disabled selected>Select Model</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        dropdown.appendChild(option);
      });

      // لو فيه اختيار + Add New
      if (selectId === "spec-model") {
        insertAddNewOptionAtTop(selectId, "add-new-model", "+ Add New Model");
      }
    })
    .catch(err => {
      console.error(`❌ Error loading new device models (${type}):`, err);
    });
}

// ================== تعبئة المواصفات حسب النوع والقسم =====================
function fetchExternalDeviceSpecs() {
  const type = document.getElementById("device-type").value.toLowerCase();
  const dept = document.getElementById("section").value;
  const dropdown = document.getElementById("device-spec");

  if (!type || !dept) return;

  fetch(`http://localhost:5050/devices/${type}/${encodeURIComponent(dept)}`)
    .then(res => res.json())
    .then(data => {
      dropdown.innerHTML = `
        <option value="" disabled selected>Select Specification</option>
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

document.getElementById("device-type").addEventListener("change", fetchExternalDeviceSpecs);
document.getElementById("section").addEventListener("change", fetchExternalDeviceSpecs);

// ================== النافذة المنبثقة العامة =====================
const popup = document.getElementById("popup-modal");
const popupFields = document.getElementById("popup-fields");
const popupTitle = document.getElementById("popup-title");
const popupInput = document.getElementById("popup-input");
const popupTarget = document.getElementById("popup-target-id");

const dropdownsWithPopup = [
  { id: "device-type", label: "Device Type" },
  { id: "section", label: "Section" },
  { id: "device-spec", label: "Device Specification" }, // ✅ أضف هذا
  { id: "reporter-name", label: "Reporter Name" } // ✅ أضف هذا
];


dropdownsWithPopup.forEach(({ id, label }) => {
  const dropdown = document.getElementById(id);
  if (!dropdown) return;

  dropdown.addEventListener("change", () => {
    const selected = dropdown.value;
    const type = document.getElementById("device-type")?.value?.trim().toLowerCase(); // ✅ الصحيح هنا

    if (selected !== "add-custom") return;

    if (label === "Device Specification") {
      if (["pc", "printer", "scanner"].includes(type)) {
        popup.style.display = "flex";
        generateFieldsForDeviceType(type);
      } else {
        openGenericPopup(label, id);
      }
    } else {
      openGenericPopup(label, id);
    }
  });
});


function openGenericPopup(label, targetId) {
  const saveBtn = document.getElementById("popup-save-button");

  if (label === "Device Specification") {
    const deviceType = document.getElementById("device-type")?.value?.toLowerCase();

    fetch("http://localhost:5050/Departments")
      .then(res => res.json())
      .then(departments => {
        const departmentsOptions = departments.map(dep => `<option value="${dep.name}">${dep.name}</option>`).join("");

        popupTitle.textContent = "Add Device Specification";
        popupFields.innerHTML = `
          <label>Ministry Number:</label><input type="text" id="spec-ministry" />
          <label>Device Name:</label><input type="text" id="spec-name" />
          <label>Model:</label>
          <select id="spec-model">
            <option value="" disabled selected>Select Model</option>
            <option value="add-new-model">+ Add New Model</option>
          </select>
          <label>Serial Number:</label><input type="text" id="spec-serial" />
             </select>
          <label>Department:</label>
          <select id="spec-department">
         <option value="" disabled selected>Select department</option>
         ${departmentsOptions}
         <option value="add-new-department">+ Add New Section</option> 
</select>
          <input type="hidden" id="popup-target-id" value="${targetId}" />
        `;

   
        saveBtn.onclick = saveDeviceSpecification;
        popup.style.display = "flex";

        document.getElementById("spec-department").addEventListener("change", function (e) {
          if (e.target.value === "add-new-department") {
            const fields = ["spec-ministry", "spec-name", "spec-serial"];
            fields.forEach(id => {
              const el = document.getElementById(id);
              if (el) sessionStorage.setItem(id, el.value);
            });
            openAddSectionPopup(); // ✅ استدعاء البوب أب لإضافة القسم
          }
        });

      
   function openAddSectionPopup() {
  // 🟡 احفظ البوب أب الحالي في sessionStorage
  sessionStorage.setItem("nestedPopupFields", popupFields.innerHTML);
  sessionStorage.setItem("nestedPopupTitle", popupTitle.textContent);

  popupTitle.textContent = "Add New Section";
  popupFields.innerHTML = `
    <label>Section Name:</label>
    <input type="text" id="new-section-name" placeholder="Enter section name" />
  `;

  document.getElementById("popup-save-button").onclick = saveNewSection;
  popup.style.display = "flex";
}


        function saveNewSection() {
          const sectionName = document.getElementById("new-section-name").value.trim();
          if (!sectionName) {
            alert("❌ Please enter a section name");
            return;
          }

          fetch("http://localhost:5050/add-options-external", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target: "section", value: sectionName })
          })
            .then(res => res.json())
            .then(result => {
              alert(result.message);
              sessionStorage.setItem("spec-department", sectionName);

              const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
              if (["pc", "printer", "scanner"].includes(deviceType)) {
                generateFieldsForDeviceType(deviceType);
              } else {
                openGenericPopup("Device Specification", "device-spec");
              }
              
            })
            .catch(err => {
              console.error("❌ Failed to save section:", err);
              alert("❌ Error saving section");
            });
        }
        // ✅ تحميل الموديلات بناءً على نوع الجهاز
        if (["pc", "printer", "scanner"].includes(deviceType)) {
          fetchModelsByType(deviceType, "spec-model"); // أجهزة قديمة
        } else {
          fetchModelsForNewDevices(deviceType, "spec-model"); // أجهزة حديثة
        }

        // ✅ استرجاع القيم المؤقتة
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
          }, 200);
        }

        // ✅ إضافة موديل جديد يدويًا
        document.getElementById("spec-model").addEventListener("change", (e) => {
          if (e.target.value === "add-new-model") {
            fields.forEach(id => {
              const el = document.getElementById(id);
              if (el) sessionStorage.setItem(id, el.value);
            });
            openAddModelPopup(deviceType);
          }
        });
      })
      .catch(err => {
        console.error("❌ Failed to load departments:", err);
        alert("فشل في تحميل الأقسام");
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


// ✅ Popup جديد لإضافة موديل
function openAddModelPopup(deviceType) {
  popupTitle.textContent = `Add New Model for ${deviceType}`;
  popupFields.innerHTML = `
    <label>Model Name:</label>
    <input type="text" id="new-model-name" placeholder="Enter model name" />
  `;

  document.getElementById("popup-save-button").onclick = () => saveNewModel(deviceType);
}

// ✅ حفظ موديل جديد وإعادة فتح نافذة Device Specification

function saveNewModel(deviceType) {
  const modelName = document.getElementById("new-model-name").value.trim();
  if (!modelName) {
    alert("❌ Please enter a model name");
    return;
  }

  // ✅ احفظ القيم قبل ما تعيد بناء الفورم
  saveAllSpecFieldValues();

  fetch("http://localhost:5050/add-device-model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_name: modelName, device_type_name: deviceType })
  })
    .then(res => res.json())
    .then(result => {
      alert(result.message || "✅ Model added successfully");

      // ✅ احفظ الموديل المضاف مؤقتًا عشان نحدده لاحقًا
      sessionStorage.setItem("lastAddedModel", modelName);

      // ✅ أعد بناء النموذج بالكامل
      generateFieldsForDeviceType(deviceType);

      // ✅ انتظر شوي عشان القوائم تنبني، بعدين استرجع القيم
      setTimeout(() => {
        restoreAllSpecFieldValues();

        // ✅ حدد الموديل الجديد تلقائيًا
        const modelSelect = document.getElementById("model-select");
        if (modelSelect) {
          modelSelect.value = modelName;
        }

        popup.style.display = "flex";
      }, 300); // ← تأخير بسيط حتى يكتمل البناء
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
  const deviceType = document.getElementById("device-type").value.toLowerCase(); // external
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

        const option = document.createElement("option");
        option.value = result.insertedId || specData.serial;
        option.textContent = `${specData.name} | ${specData.serial} | ${specData.ministry}`;
        dropdown.appendChild(option);
        dropdown.value = option.value;

        closePopup();

      } else {
        alert("❌ فشل في الحفظ: " + result.error);
      }
    })
    .catch(err => {
      console.error("❌ Error saving specification:", err);
      alert("❌ Failed to save specification");
    });
}
function closePopup() {
  popup.style.display = "none";

  const targetInput = document.getElementById("popup-target-id");
  const targetId = targetInput ? targetInput.value : null;

  if (targetId) {
    const dropdown = document.getElementById(targetId);
    if (dropdown && (dropdown.value === "add-custom" || dropdown.value === "add-new-model")) {
      dropdown.value = ""; // ترجع الاختيار للوضع الطبيعي
    }
  }

  // ✳️ تأكد إن العنصر موجود قبل محاولة تصفيره
  if (targetInput) targetInput.value = "";

  const input = document.getElementById("popup-input");
  if (input) input.value = "";
}

function saveGenericOption() {
  const value = document.getElementById("popup-input").value.trim();
  const targetId = document.getElementById("popup-target-id").value;
  const dropdown = document.getElementById(targetId);

  if (!value || !dropdown) return;

  fetch("http://localhost:5050/add-options-external", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: targetId, value })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
        return;
      }

      // ✅ تأكد إذا الخيار موجود، لا تكرره
      let exists = Array.from(dropdown.options).some(opt => opt.value === value);
      if (!exists) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        dropdown.appendChild(option);
      }

      dropdown.value = value;
      closePopup();
    })
    .catch(err => {
      console.error("❌ Error saving option:", err);
      alert("❌ Failed to save new option");
    });
}



// ================== النافذة المنبثقة للمواصفات =====================
const deviceSpecSelect = document.getElementById("device-spec");

if (deviceSpecSelect) {
  deviceSpecSelect.addEventListener("change", () => {
    if (deviceSpecSelect.value === "add-custom") {
      const type = document.getElementById("device-type").value.toLowerCase();
      popup.style.display = "flex";
      generateFieldsForDeviceType(type);
      const saveBtn = document.getElementById("popup-save-button");
      saveBtn.onclick = savePCSpec; // 👈 هذا خاص بحفظ الجهاز
    }
  });
}
function generateFieldsForDeviceType(type) {
  popupFields.innerHTML = "";

  if (type === "pc") {
    popupTitle.textContent = "Enter PC Specifications";
    popupFields.innerHTML = `
      <label>Computer Name:</label><input type="text" name="device-name" id="device-name" required>
      <label>Serial Number:</label><input type="text" name="serial" id="serial" required>
      <label>Ministry Number:</label><input type="text" name="ministry-id" id="ministry-id" required>
      <label>Department:</label><select name="department" id="department-pc"></select>
      <label>Processor Generation:</label><select name="generation" id="generation-select"></select>
      <label>CPU:</label><select name="processor" id="cpu-select"></select>
      <label>RAM:</label><select name="ram" id="ram-select"></select>
      <label>Model:</label><select name="model" id="model-select"></select>
      <label>OS:</label><select name="os" id="os-select"></select>
    `;

    fetchCPU(() => addAddNewOption("cpu-select", "CPU"));
    fetchRAM(() => addAddNewOption("ram-select", "RAM"));
    fetchOS(() => addAddNewOption("os-select", "OS"));
    fetchProcessorGen(() => addAddNewOption("generation-select", "Generation"));
    fetchModelsByType("pc", "model-select", () => addAddNewOption("model-select", "Model"));
    fetchDepartments("department-pc");

    document.getElementById("department-pc").addEventListener("change", function (e) {
      if (e.target.value === "add-new-department") {
        saveAllSpecFieldValues();
        openAddSectionPopup();
      }
    });


    const dynamicDropdowns = [
      { id: "cpu-select", label: "CPU", table: "CPU_Types", field: "cpu_name" },
      { id: "ram-select", label: "RAM", table: "RAM_Types", field: "ram_type" },
      { id: "os-select", label: "OS", table: "OS_Types", field: "os_name" },
      { id: "generation-select", label: "Generation", table: "Processor_Generations", field: "generation_number" },
      { id: "model-select", label: "Model", table: "PC_Model", field: "model_name" }
    ];

    dynamicDropdowns.forEach(({ id, label, table, field }) => {
      const select = document.getElementById(id);
      if (!select) return;

      select.addEventListener("change", () => {
        if (select.value === "add-new") {
          saveAllSpecFieldValues();
          sessionStorage.setItem("currentDeviceType", type);
          sessionStorage.setItem("currentSelectId", id);
          openGenericPopup(label, id);
          setupGenericSaveHandler(table, label, select);
        }
      });
    });
    document.getElementById("model-select").addEventListener("change", function (e) {
      if (e.target.value === "add-new-model") {
        const fields = ["device-name", "serial", "ministry-id"];
        fields.forEach(id => {
          const el = document.getElementById(id);
          if (el) sessionStorage.setItem(id, el.value);
        });
    
        openAddModelPopup(type);
      }
    });
    

  } else if (type === "printer" || type === "scanner") {
    const isPrinter = type === "printer";
    const capitalized = isPrinter ? "Printer" : "Scanner";

    popupTitle.textContent = `Enter ${capitalized} Specifications`;
    popupFields.innerHTML = `
      <label>${capitalized} Name:</label><input type="text" id="device-name" required />
      <label>Serial Number:</label><input type="text" id="serial" required />
      <label>Ministry Number:</label><input type="text" id="ministry-id" required />
      <label>Department:</label><select id="department-${type}"></select>
      <label>Model:</label><select id="model-select"></select>
    `;

    fetchDepartments(`department-${type}`);
    fetchModelsByType(type, "model-select");

    // ✅ دعم + Add New Department
    document.getElementById(`department-${type}`).addEventListener("change", function (e) {
      if (e.target.value === "add-new-department") {
        saveAllSpecFieldValues();
        openAddSectionPopup();
      }
    });

    // ✅ دعم + Add New Model
    document.getElementById("model-select").addEventListener("change", function (e) {
      if (e.target.value === "add-new-model") {
        const fields = ["device-name", "serial", "ministry-id"];
        fields.forEach(id => {
          const el = document.getElementById(id);
          if (el) sessionStorage.setItem(id, el.value);
        });

        openAddModelPopup(type);
      }
    });
  }

  // ✅ استرجاع القيم بعد التأكد أن القوائم تم تحميلها
  // ✅ انتظر القوائم تخلص، بعدين استرجع القيم من sessionStorage
setTimeout(() => {
  restoreAllSpecFieldValues();

  // ✅ حدد آخر موديل مضاف تلقائيًا (لو موجود)
  const lastModel = sessionStorage.getItem("lastAddedModel");
  if (lastModel) {
    const modelSelect = document.getElementById("model-select");
    if (modelSelect) {
      modelSelect.value = lastModel;
    }
    sessionStorage.removeItem("lastAddedModel");
  }
}, 500); // ← خله 300ms أو أكثر إذا احتجت

}




function addAddNewOption(selectId, label) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const addOption = document.createElement("option");
  addOption.value = "add-new";
  addOption.textContent = `+ Add New ${label}`;
  select.appendChild(addOption);
}


function savePCSpec() {
  const formElements = popupFields.querySelectorAll("input, select");
  const data = {};
  formElements.forEach(input => {
    data[input.name] = input.value;
  });

  const type = document.getElementById("device-type").value.toLowerCase();

  fetch(`http://localhost:5050/AddDevice/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(result => {
      alert(result.message || "✅ Device saved successfully");

      // ✅ أضف العنصر الجديد مباشرة للدروبداون
      const specDropdown = document.getElementById("device-spec");
      const newOption = document.createElement("option");
      newOption.value = result.insertedId || data.serial || data["device-name"]; // حسب الموجود
      newOption.textContent = `${data["device-name"]} | ${data.serial} | ${data["ministry-id"]}`;
      specDropdown.appendChild(newOption);
      specDropdown.value = newOption.value;

      closePopup();
 // إغلاق البوب أب
    })
    .catch(err => {
      console.error("❌ Error saving device:", err);
      alert("❌ Server connection failed");
    });
}

function openAddSectionPopup() {
  popupTitle.textContent = "Add New Section";
  popupFields.innerHTML = `
    <label>Section Name:</label>
    <input type="text" id="new-section-name" placeholder="Enter section name" />
  `;

  document.getElementById("popup-save-button").onclick = saveNewSection;
  popup.style.display = "flex";
}

function saveNewSection() {
  const sectionName = document.getElementById("new-section-name").value.trim();
  if (!sectionName) {
    alert("❌ Please enter a section name");
    return;
  }

  fetch("http://localhost:5050/add-options-external", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: "section", value: sectionName })
  })
    .then(res => res.json())
    .then(result => {
      alert(result.message);
      sessionStorage.setItem("section", sectionName);

      const deviceType = document.getElementById("device-type")?.value?.toLowerCase();

      // ✅ إعادة بناء النموذج مع تحميل الأقسام مجددًا
      generateFieldsForDeviceType(deviceType);

      // ✅ انتظر شوي عشان القائمة تكون جاهزة ثم اختار القسم الجديد
      setTimeout(() => {
        const deptId = `department-${deviceType}`;
        const deptDropdown = document.getElementById(deptId);
        if (deptDropdown) {
          deptDropdown.value = sectionName;
        }
      }, 100);
    })
    .catch(err => {
      console.error("❌ Failed to save section:", err);
      alert("❌ Error saving section");
    });
}



// ================== دوال الموديلات والخصائص =====================
function fetchCPU() {
  fetch("http://localhost:5050/CPU_Types")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("cpu-select");
      if (!select) return;

      select.innerHTML = '<option disabled selected>Select CPU</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.cpu_name;
        option.textContent = item.cpu_name;
        select.appendChild(option);
      });

      // ✅ أضف + Add New في الأعلى
      insertAddNewOptionAtTop("cpu-select", "add-new", "+ Add New CPU");
    })
    .catch(err => {
      console.error("❌ Error fetching CPU types:", err);
    });
}
function fetchRAM() {
  fetch("http://localhost:5050/RAM_Types")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("ram-select");
      if (!select) return;

      select.innerHTML = '<option disabled selected>Select RAM</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.ram_type;
        option.textContent = item.ram_type;
        select.appendChild(option);
      });

      // ✅ أضف + Add New في الأعلى
      insertAddNewOptionAtTop("ram-select", "add-new", "+ Add New RAM");
    })
    .catch(err => {
      console.error("❌ Error fetching RAM types:", err);
    });
}
function fetchOS() {
  fetch("http://localhost:5050/OS_Types")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("os-select");
      if (!select) return;

      select.innerHTML = '<option disabled selected>Select OS</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.os_name;
        option.textContent = item.os_name;
        select.appendChild(option);
      });

      insertAddNewOptionAtTop("os-select", "add-new", "+ Add New OS");
    })
    .catch(err => {
      console.error("❌ Error fetching OS types:", err);
    });
}
function fetchProcessorGen() {
  fetch("http://localhost:5050/Processor_Generations")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("generation-select");
      if (!select) return;

      select.innerHTML = '<option disabled selected>Select Generation</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.generation_number;
        option.textContent = item.generation_number;
        select.appendChild(option);
      });

      insertAddNewOptionAtTop("generation-select", "add-new", "+ Add New Generation");
    })
    .catch(err => {
      console.error("❌ Error fetching processor generations:", err);
    });
}function fetchModelsByType(type, selectId) {
  const knownEndpoints = {
    pc: "/PC_Model",
    printer: "/Printer_Model",
    scanner: "/Scanner_Model"
  };

  const endpoint = knownEndpoints[type] || `/models-by-type/${type}`;

  fetch(`http://localhost:5050${endpoint}`)
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById(selectId);
      if (!dropdown) return;

      dropdown.innerHTML = '<option disabled selected>Select Model </option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        dropdown.appendChild(option);
      });

      insertAddNewOptionAtTop(selectId, "add-new-model", "+ Add New Model");
    })
    .catch(err => {
      console.error(`❌ فشل تحميل موديلات ${type}:`, err);
    });
}

function fetchDepartments(selectId = "department") {
  fetch("http://localhost:5050/Departments")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById(selectId);
      if (!select) return;

      select.innerHTML = '<option value="" disabled selected>Select Department</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        select.appendChild(option);
      });

      insertAddNewOptionAtTop(selectId, "add-new-department", "+ Add New Section");
    })
    .catch(err => {
      console.error("❌ Error fetching departments:", err);
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


function fillSelect(id, data, field) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = `<option disabled selected>Select ${field}</option>`;
  data.forEach(item => {
    const option = document.createElement("option");
    option.value = item[field];
    option.textContent = item[field];
    select.appendChild(option);
  });
}
