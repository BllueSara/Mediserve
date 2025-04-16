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
function fetchModelsByType(type, selectId, origin = 'fields') {
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

      // 🟢 تعبئة القائمة مع إعادة تعيين القيمة
      dropdown.innerHTML = '<option value="" disabled selected>Select Model</option>';
      dropdown.value = ""; // ✅ يرجع الوضع الافتراضي

      const addOption = document.createElement("option");
      addOption.value = "add-new";
      addOption.textContent = "+ Add New Model";
      dropdown.appendChild(addOption);

      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        dropdown.appendChild(option);
      });

      // ✅ فتح نافذة الإضافة عند اختيار "+ Add New Model"
      dropdown.addEventListener("change", (e) => {
        if (e.target.value === "add-new") {
          openAddModelPopup(type, origin);
        }
      });
    });
}

function fetchModelsForNewDevices(type, selectId) {
   fetch(`http://localhost:5050/models-by-type/${type}`)
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById(selectId);
      if (!dropdown) return;

      dropdown.innerHTML = '<option disabled selected>Select Model</option>';

      // ✅ أضف كل موديل
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        dropdown.appendChild(option);
      });

      // ✅ خيار إضافة موديل جديد
      if (selectId === "spec-model") {
        const addNew = document.createElement("option");
        addNew.value = "add-new-model";
        addNew.textContent = "+ Add New Model";
        dropdown.appendChild(addNew);
      }
    })
    .catch(err => {
      console.error("❌ Error fetching models:", err);
    });
}



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
      else endpoint = `/problem-states/maintenance/${selected}`; // ✅ جلب حالات جهاز جديد

      // إعادة تعيين القائمة
      problemStatus.innerHTML = `
        <option value="" disabled selected>Select status</option>
        <option value="add-custom">+ Add New Status</option>
      `;

      fetch(`http://localhost:5050${endpoint}`)
        .then(res => res.json())
        .then(data => {
          data.forEach(item => {
            const option = document.createElement("option");
            option.value = item.problem_text || item.problemStates_Maintance_device_name;
            option.textContent = item.problem_text || item.problemStates_Maintance_device_name;
            problemStatus.appendChild(option);
          });
        })
        .catch(err => {
          console.error("❌ Error loading problem states:", err);
        });
    });

    problemStatus.addEventListener("change", () => {
      if (problemStatus.value === "add-custom") {
        openGenericPopup("Problem Status", "problem-status");
      }
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

  const targetId = document.getElementById("popup-target-id").value;
  const dropdown = document.getElementById(targetId);
  const deviceType = document.getElementById("problem-type")?.value?.toLowerCase();

  if (targetId === "device-spec" && dropdown) {
    // إعادة تعيين القائمة حسب نوع الجهاز
    if (["pc", "printer", "scanner"].includes(deviceType)) {
      dropdown.innerHTML = '<option value="" disabled selected>Select Specification</option>';
      dropdown.value = "";
      
      // إضافة خيار "Add New" فقط إذا كان الجهاز معروفًا
      const addNewOption = document.createElement("option");
      addNewOption.value = "add-custom";
      addNewOption.textContent = "+ Add New Specification";
      dropdown.appendChild(addNewOption);
    } else {
      // للأجهزة غير المعروفة
      dropdown.innerHTML = '<option value="" disabled selected>Select Specification</option>';
      dropdown.value = "";
    }
  }

  // تنظيف الحقول المؤقتة
  const input = document.getElementById("popup-input");
  if (input) input.value = "";
  document.getElementById("popup-target-id").value = "";
}

function closeGenericPopup() {
  const popup = document.getElementById("generic-popup");
  popup.style.display = "none";

  const lastSelectId = sessionStorage.getItem("lastDropdownOpened");
  if (lastSelectId) {
    const dropdown = document.getElementById(lastSelectId);
    if (dropdown) {
      // إعادة التعيين بناءً على نوع الحقل
      if (lastSelectId.includes("department")) {
        dropdown.selectedIndex = 0; // للأقسام
      } else if (lastSelectId === "device-spec") {
        dropdown.innerHTML = '<option value="" disabled selected>Select Specification</option>';
        dropdown.value = "";
      } else {
        dropdown.selectedIndex = 0; // لباقي الحقول
      }
    }
    sessionStorage.removeItem("lastDropdownOpened");
  }
  
  // إعادة تحميل القوائم إذا لزم الأمر
  const deviceType = document.getElementById("problem-type")?.value?.toLowerCase();
  if (["pc", "printer", "scanner"].includes(deviceType)) {
    fetchDeviceSpecsByTypeAndDepartment();
  }
}



const generalDropdowns = [
  { id: "problem-type", label: "Problem Type" },
  { id: "section", label: "Section" },
  { id: "floor", label: "Floor" },
  { id: "technical", label: "Technical" },
  { id: "problem-status", label: "Problem Status" },
  { id: "device-spec", label: "Device Specification" }

];

generalDropdowns.forEach(({ id, label }) => {
  const dropdown = document.getElementById(id);
  if (!dropdown) return;

  dropdown.addEventListener("change", () => {
    const selected = dropdown.value;
    const type = document.getElementById("problem-type")?.value?.trim().toLowerCase();

    if (selected !== "add-custom") return;

    if (label === "Device Specification") {
      if (["pc", "printer", "scanner"].includes(type)) {
        // ✅ الأجهزة المعروفة → افتح popup-modal
        popup.style.display = "flex";
        generateFieldsForDeviceType(type);
      } else {
        // ✅ أي نوع جديد (غير معروف) → افتح generic-popup
        openGenericPopup(label, id);
      }
    } else {
      // ✅ بقية الحقول مثل القسم، الفني، الطابق...
      openGenericPopup(label, id);
    }
  });
});


function openGenericPopup(label, targetId) {
  const saveBtn = document.getElementById("popup-save-btn");

  if (label === "Device Specification") {
    const deviceType = document.getElementById("problem-type")?.value?.toLowerCase();

    popupTitle.textContent = "Add Device Specification";
    popupFields.innerHTML = `
      <label>Device Name:</label><input type="text" id="spec-name" />
      <label>Serial Number:</label><input type="text" id="spec-serial" />
      <label>Ministry Number:</label><input type="text" id="spec-ministry" />

      <label>Model:</label>
      <select id="spec-model">
        <option value="" disabled selected>Select Model</option>
        <option value="add-new-model">+ Add New Model</option>
      </select>

      <label>Department:</label>
      <select id="spec-department">
        <option value="" disabled selected>Loading departments...</option>
      </select>

      <input type="hidden" id="popup-target-id" value="${targetId}" />
    `;

    saveBtn.onclick = saveDeviceSpecification;
    popup.style.display = "flex";

    // ✅ جلب الأقسام أولاً
    fetch("http://localhost:5050/Departments?" + Date.now()) 
    .then(res => res.json())
      .then(departments => {

        const departmentSelect = document.getElementById("spec-department");
        departmentSelect.innerHTML = `
          <option value="" disabled selected>Select department</option>
          ${departments.map(dep => `<option value="${dep.name}">${dep.name}</option>`).join("")}
          <option value="add-new-department">+ Add New Section</option>
        `;
        console.log("🧪 الأقسام المحمّلة:", departments.map(d => d.name));
console.log("🧪 القيمة المحفوظة:", sessionStorage.getItem("spec-department"));

        // ✅ تحديد القسم المحفوظ
        const savedDept = sessionStorage.getItem("spec-department");
        if (savedDept) {
          const options = Array.from(departmentSelect.options);
          const match = options.find(opt => opt.value.trim().toLowerCase() === savedDept.trim().toLowerCase());
        
          // ✅ إذا ما لقيه، نضيفه يدويًا
          if (!match) {
            const newOption = document.createElement("option");
            newOption.value = savedDept;
            newOption.textContent = savedDept;
            departmentSelect.insertBefore(newOption, departmentSelect.lastElementChild); // قبل + Add New Section
            console.log("🆕 القسم مضاف يدويًا:", savedDept);
          }
        
          // ✅ تحديده بعد التأكد من وجوده
          departmentSelect.value = savedDept;
          console.log("✅ تم تحديد القسم:", savedDept);
        
          sessionStorage.removeItem("spec-department");
        }
        

        // ✅ مراقبة خيار إضافة قسم جديد
        departmentSelect.addEventListener("change", function (e) {
          if (e.target.value === "add-new-department") {
            sessionStorage.setItem("lastDepartmentSelectId", "spec-department");
            saveTemporaryFields(); // نحفظ القيم قبل فتح popup القسم
            openAddSectionPopup();
          }
        });
      });

    // ✅ جلب الموديلات
    // ✅ جلب الموديلات وضمان تفعيل الحدث بعد تأكد وجود العنصر
setTimeout(() => {
  if (["pc", "printer", "scanner"].includes(deviceType)) {
    fetchModelsByType(deviceType, "spec-model");
  } else {
    fetchModelsForNewDevices(deviceType, "spec-model");
  }

  // ✅ تفعيل الحدث وإعادة آخر موديل مضاف بعد تأكد وجود القائمة
  setTimeout(() => {
    const modelDropdown = document.getElementById("spec-model");

    if (modelDropdown) {
      const last = sessionStorage.getItem("lastAddedModel");
      if (last) {
        modelDropdown.value = last;
        modelDropdown.dispatchEvent(new Event("change", { bubbles: true }));
        sessionStorage.removeItem("lastAddedModel");
      }

      modelDropdown.addEventListener("change", (e) => {
        if (e.target.value === "add-new-model") {
          saveTemporaryFields();
          openAddModelPopup(deviceType, 'generic');
        }
      });
    } else {
      console.warn("❌ ما لقى spec-model داخل popup!");
    }
  }, 300);
}, 150);


  } else {
    // ✅ الحقول العادية
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

// ✅ دالة لحفظ الحقول المؤقتة
function saveTemporaryFields() {
  const ids = ["spec-name", "spec-serial", "spec-ministry", "spec-department"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      sessionStorage.setItem(id, el.value);
    }
  });
}




function openAddModelPopup(type, origin = 'generic') {
  const popup = document.getElementById("generic-popup");

  const selectId = origin === 'fields' ? "model-select" : "spec-model";
  sessionStorage.setItem("lastDropdownOpened", selectId); // ✅ أضف هذا

  popup.innerHTML = `
    <div class="popup-content">
      <h3>Add New Model for ${type}</h3>
      <label for="new-model-name">Model Name:</label>
      <input type="text" id="new-model-name" placeholder="Enter model name" />
      <input type="hidden" id="model-origin" value="${origin}" />
      <div class="popup-buttons">
        <button onclick="saveNewModel('${type}')">Save</button>
        <button onclick="closeGenericPopup()">Cancel</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";

  // ✅ حفظ القيم
  const fieldsToSave = ["spec-ministry", "spec-name", "spec-serial", "spec-department"];
  fieldsToSave.forEach(id => {
    const el = document.getElementById(id);
    if (el) sessionStorage.setItem(id, el.value);
  });
}

function saveNewModel(type) {
  const modelName = document.getElementById("new-model-name").value.trim();
  const origin = document.getElementById("model-origin")?.value || 'generic';

  if (!modelName) {
    alert("❌ Please enter a model name");
    return;
  }

  fetch("http://localhost:5050/add-device-model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_name: modelName, device_type_name: type })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
        return;
      }

      alert(result.message || "✅ Model added successfully");
      sessionStorage.setItem("lastAddedModel", modelName);
      document.getElementById("generic-popup").style.display = "none"; // ✅ نقفل بوب أب الموديل فقط

      setTimeout(() => {
        if (origin === 'fields') {
          const modelSelectId = `model-${type}`;
          fetchModelsByType(type, modelSelectId);

          setTimeout(() => {
            const modelDropdown = document.getElementById(modelSelectId);
            if (modelDropdown) {
              modelDropdown.value = modelName;
              const event = new Event("change", { bubbles: true });
              modelDropdown.dispatchEvent(event);
            }

            // ✅ استرجاع القيم الأساسية
            const fieldsToRestore = [
              "ministry-id",
              "device-name",
              "serial",
              `department-${type}`
            ];

            // ✅ إذا الجهاز PC أضف له حقول إضافية
            if (type === "pc") {
              fieldsToRestore.push("cpu-select", "ram-select", "os-select", "generation-select");
            }

            fieldsToRestore.forEach(id => {
              const val = sessionStorage.getItem(id);
              if (val) {
                const el = document.getElementById(id);
                if (el) el.value = val;
                sessionStorage.removeItem(id);
              }
            });
          }, 150);

        } else {
          // ✅ للأجهزة الجديدة في popup العادي
          const popupVisible = document.getElementById("popup-modal")?.style.display === "flex";
          if (popupVisible) {
            const modelDropdown = document.getElementById("spec-model");
            if (modelDropdown) {
              modelDropdown.value = modelName;
              const event = new Event("change", { bubbles: true });
              modelDropdown.dispatchEvent(event);
            }
          }
        }
      }, 100);
    })
    .catch(err => {
      console.error("❌ Failed to save model:", err);
      alert("❌ Error saving new model");
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
  const type = document.getElementById("problem-type")?.value?.toLowerCase();

  if (!value || !dropdown) return;

  fetch("http://localhost:5050/add-option-general", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: targetId, value, type })
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

  // Common fields for all device types
  const commonFields = `
    <label>Device Name:</label><input type="text" name="device-name" required>
    <label>Serial Number:</label><input type="text" name="serial" required>
    <label>Ministry Number:</label><input type="text" name="ministry-id" required>
    <label>Department:</label><select name="department" id="department-${type}"></select>
    <label>Model:</label><select name="model" id="model-${type}"></select>
  `;

  // Device-specific fields
  let deviceSpecificFields = '';
  if (type === "pc") {
    deviceSpecificFields = `
      <label>Processor Generation:</label><select name="generation" id="generation-select"></select>
      <label>CPU:</label><select name="processor" id="cpu-select"></select>
      <label>RAM:</label><select name="ram" id="ram-select"></select>
      <label>OS:</label><select name="os" id="os-select"></select>
    `;
  }

  // Set the popup content
  popupTitle.textContent = `Enter ${type.charAt(0).toUpperCase() + type.slice(1)} Specifications`;
  popupFields.innerHTML = commonFields + deviceSpecificFields;
  saveBtn.onclick = savePCSpec;

  // Initialize common components
  fetchModelsByType(type, `model-${type}`);
  fetchDepartments(`department-${type}`);

  // Initialize PC-specific components
  if (type === "pc") {
    fetchCPU();
    fetchRAM();
    fetchOS();
    fetchProcessorGen();
  }

  // Handle department change for all device types
  document.getElementById(`department-${type}`).addEventListener("change", function(e) {
    if (e.target.value === "add-new-department") {
      // Save current field values
      ["ministry-id", "device-name", "serial"].forEach(id => {
        const el = document.querySelector(`[name="${id}"]`);
        if (el) sessionStorage.setItem(id, el.value);
      });
      
      // Mark which department select triggered this
      sessionStorage.setItem("lastDepartmentSelectId", `department-${type}`);
      openAddSectionPopup();
    }
  });

  // Handle model change for all device types
  document.getElementById(`model-${type}`).addEventListener("change", function(e) {
    if (e.target.value === "add-new") {
      // Save current field values
      ["ministry-id", "device-name", "serial"].forEach(id => {
        const el = document.querySelector(`[name="${id}"]`);
        if (el) sessionStorage.setItem(id, el.value);
      });
      
      openAddModelPopup(type, 'fields');
    }
  });

  // Reset the device-spec dropdown to default state
  const deviceSpecDropdown = document.getElementById("device-spec");
  if (deviceSpecDropdown) {
    deviceSpecDropdown.innerHTML = `
      <option value="" disabled selected>Select Specification</option>
      <option value="add-custom">+ Add New Specification</option>
    `;
    deviceSpecDropdown.value = "";
  }

  popup.style.display = "flex";
}


function openAddSectionPopup() {
  const popup = document.getElementById("generic-popup");

  // 🟢 نحفظ اسم السلكت اللي المستخدم كان فيه قبل ما يضغط Add New Section
  const selectId = sessionStorage.getItem("lastDepartmentSelectId") || "spec-department";
  sessionStorage.setItem("lastDropdownOpened", selectId); // ✅ ضروري عشان يرجع السلكت للوضع الطبيعي

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

  fetch("http://localhost:5050/add-option-general", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: "section", value: sectionName })
  })
    .then(res => res.json())
    .then(result => {
      alert(result.message);
      sessionStorage.setItem("spec-department", sectionName);

      const deviceType = document.getElementById("problem-type")?.value?.toLowerCase();

      // ✅ قفل البوب أب بعد الحفظ
      closeGenericPopup();

      // ✅ إذا الجهاز من الأنواع الثلاثة المعروفة
      if (["pc", "printer", "scanner"].includes(deviceType)) {
        const deptSelectId = `department-${deviceType}`;
        fetchDepartments(deptSelectId); // 🟢 فقط حدث القائمة

        sessionStorage.setItem(deptSelectId, sectionName); // ✅ عشان يتحدد تلقائيًا

        // ✅ استرجاع الحقول اللي كتبها المستخدم
        const fieldsToRestore = [
          "ministry-id",
          "device-name",
          "serial"
        ];

        if (deviceType === "pc") {
          fieldsToRestore.push("cpu-select", "ram-select", "os-select", "generation-select");
        }

        setTimeout(() => {
          fieldsToRestore.forEach(id => {
            const val = sessionStorage.getItem(id);
            if (val) {
              const el = document.getElementById(id);
              if (el) el.value = val;
              sessionStorage.removeItem(id);
            }
          });
        }, 200);

      } else {
        const departmentId = "spec-department";
      
        // ✅ خزّن القسم عشان fetchDepartments تتعامل معه
        sessionStorage.setItem(departmentId, sectionName);
            // ✅ خزّن القيم اللي كتبها المستخدم
const fields = ["spec-name", "spec-serial", "spec-ministry"];
fields.forEach(id => {
  const el = document.getElementById(id);
  if (el) sessionStorage.setItem(id, el.value);
});
sessionStorage.setItem("spec-department", sectionName);

// ✅ أغلق popup القسم
closeGenericPopup();

// ✅ أعد فتح popup الجهاز بعد إغلاق القسم (زي موديل)
setTimeout(() => {
  const popupVisible = document.getElementById("popup-modal")?.style.display === "flex";
  if (!popupVisible) {
    fetchDepartments("spec-department").then(() => {
      openGenericPopup("Device Specification", "device-spec");
    });
  }
}, 400);



      }
      
      
      
    })
    .catch(err => {
      console.error("❌ Failed to save section:", err);
      alert("❌ Error saving section");
    });
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
      if (!select) return;

      select.innerHTML = '<option value="" disabled selected>Select CPU</option>';
      select.value = ""; // ✅ يرجع للسطر الأول تلقائيًا

      const addOption = document.createElement("option");
      addOption.value = "add-new";
      addOption.textContent = "+ Add New CPU";
      select.appendChild(addOption);

      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.cpu_name;
        option.textContent = item.cpu_name;
        select.appendChild(option);
      });

      select.addEventListener("change", (e) => {
        if (e.target.value === "add-new") {
          openAddOptionPopup("cpu-select");
        }
      });
    });
}


function fetchRAM() {
  fetch("http://localhost:5050/RAM_Types")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("ram-select");
      if (!select) return;

      select.innerHTML = '<option value="" disabled selected>Select RAM</option>';
      select.value = ""; // ✅ يرجع للسطر الأول تلقائيًا

      const addOption = document.createElement("option");
      addOption.value = "add-new";
      addOption.textContent = "+ Add New RAM";
      select.appendChild(addOption);

      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.ram_type;
        option.textContent = item.ram_type;
        select.appendChild(option);
      });

      select.addEventListener("change", (e) => {
        if (e.target.value === "add-new") {
          openAddOptionPopup("ram-select");
        }
      });
    });
}


function fetchOS() {
  fetch("http://localhost:5050/OS_Types")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("os-select");
      if (!select) return;

      select.innerHTML = '<option value="" disabled selected>Select OS</option>';
      select.value = ""; // ✅ يرجع للسطر الأول تلقائيًا

      const addOption = document.createElement("option");
      addOption.value = "add-new";
      addOption.textContent = "+ Add New OS";
      select.appendChild(addOption);

      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.os_name;
        option.textContent = item.os_name;
        select.appendChild(option);
      });

      select.addEventListener("change", (e) => {
        if (e.target.value === "add-new") {
          openAddOptionPopup("os-select");
        }
      });
    });
}


function openAddOptionPopup(targetId) {
  // 🟡 نحفظ اسم السلكت المفتوح حاليًا عشان نرجعه إذا ضغط Cancel
  sessionStorage.setItem("lastDropdownOpened", targetId);

  let label = "New Option";
  if (targetId === "ram-select") label = "RAM";
  else if (targetId === "cpu-select") label = "CPU";
  else if (targetId === "os-select") label = "Operating System";
  else if (targetId === "generation-select") label = "Processor Generation";

  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-content">
      <h3>Add New ${label}</h3>
      <label for="generic-popup-input">${label} Name:</label>
      <input type="text" id="generic-popup-input" placeholder="Enter ${label}" />
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

  fetch("http://localhost:5050/add-option-general", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: targetId, value })
  })
    .then(res => res.json())
    .then(result => {
      alert(result.message || "✅ Added successfully");

      closeGenericPopup();

      // تحديث القائمة بالكامل ثم تعيين القيمة المضافة
      const applyValue = () => {
        if (dropdown) dropdown.value = value;
      };

      if (targetId === "os-select") {
        fetchOS();
        setTimeout(applyValue, 100);
      } else if (targetId === "ram-select") {
        fetchRAM();
        setTimeout(applyValue, 100);
      } else if (targetId === "cpu-select") {
        fetchCPU();
        setTimeout(applyValue, 100);
      } else if (targetId === "generation-select") {
        fetchProcessorGen();
        setTimeout(applyValue, 100);
      }
    })
    .catch(err => {
      console.error("❌ Error saving new option:", err);
      alert("❌ Failed to save option");
    });
}


function fetchProcessorGen() {
  fetch("http://localhost:5050/Processor_Generations")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("generation-select");
      if (!select) return;

      select.innerHTML = '<option value="" disabled selected>Select Generation</option>';
      select.value = ""; // ✅ يرجع للسطر الأول تلقائيًا

      const addOption = document.createElement("option");
      addOption.value = "add-new";
      addOption.textContent = "+ Add New Generation";
      select.appendChild(addOption);

      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.generation_number;
        option.textContent = item.generation_number;
        select.appendChild(option);
      });

      select.addEventListener("change", (e) => {
        if (e.target.value === "add-new") {
          openAddOptionPopup("generation-select");
        }
      });
    });
}


function fetchDepartments(selectId = "department") {
    fetch("http://localhost:5050/Departments")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById(selectId);
      if (!select) return;

      // 🟢 عنوان القائمة
      select.innerHTML = `<option value="" disabled selected>${selectId === "section" ? "Select section" : "Select Department"}</option>`;

      // 🟢 Add New دائمًا (حتى لو مو section رئيسي)
      const addOption = document.createElement("option");
      addOption.value = "add-new-department";
      addOption.textContent = "+ Add New Section";
      select.appendChild(addOption);

      // 🟢 الأقسام
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        select.appendChild(option);
      });

      // ✅ تحديد القسم المختار تلقائيًا (إن وجد)
      const savedDept = sessionStorage.getItem(selectId);
      if (savedDept) {
        select.value = savedDept;
        sessionStorage.removeItem(selectId);
      }

      // ✅ إذا المستخدم اختار Add New Section
      select.addEventListener("change", function (e) {
        if (e.target.value === "add-new-department") {

          const popupVisible = document.getElementById("generic-popup")?.style.display === "flex";
          if(!popupVisible){

            openAddSectionPopup();
            sessionStorage.setItem("lastDepartmentSelectId", selectId);
          }
        }
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
