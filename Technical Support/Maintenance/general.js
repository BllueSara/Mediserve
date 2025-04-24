function fetchAndRenderModels(deviceType, dropdownId) {
  const cleanedType = deviceType.trim().toLowerCase();
  const optionsContainer = document.getElementById(`${dropdownId}-options`);
  const displaySpan = document.getElementById(`selected-${dropdownId}`);
  const hiddenInput = document.getElementById(dropdownId);

  if (!optionsContainer || !displaySpan || !hiddenInput) {
    console.error(`❌ عناصر دروب داون موديل غير موجودة لـ: ${dropdownId}`);
    return;
  }

  let endpoint = "";
  if (cleanedType === "pc") endpoint = "/PC_Model";
  else if (cleanedType === "printer") endpoint = "/Printer_Model";
  else if (cleanedType === "scanner") endpoint = "/Scanner_Model";
  else endpoint = `/models-by-type/${cleanedType}`;

  fetch(`http://localhost:5050${endpoint}`)
    .then(res => res.json())
    .then(data => {
      optionsContainer.innerHTML = "";

      // ✅ + Add New
      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New Model</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", dropdownId);

        // حفظ الحقول قبل الإضافة
        ["spec-ministry", "spec-name", "spec-serial", "spec-department"].forEach(id => {
          const el = document.getElementById(id);
          if (el) sessionStorage.setItem(id, el.value);
        });

        openAddModelPopup(); // فتح بوب أب الإضافة
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      // ✅ تعبئة النماذج من السيرفر
      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.model_name;
        text.onclick = () => {
          displaySpan.textContent = item.model_name;
          hiddenInput.value = item.model_name;
          closeAllDropdowns();
        };

        row.appendChild(text);
        optionsContainer.appendChild(row);
      });

      // ✅ استعادة القيمة المحفوظة
      const saved = sessionStorage.getItem(dropdownId) || sessionStorage.getItem("lastAddedModel");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem(dropdownId);
        sessionStorage.removeItem("lastAddedModel");
      }
    })
    .catch(err => {
      console.error("❌ Error fetching models:", err);
    });
}


// ================== تعبئة حالات الأعطال =====================
document.addEventListener("DOMContentLoaded", () => {
  function renderProblemStatuses(type) {
    const statusOptionsContainer = document.getElementById("problem-status-options");
    const selectedStatus = document.getElementById("selected-problem-status");
    const hiddenInput = document.getElementById("problem-status");
  
    if (!statusOptionsContainer || !selectedStatus || !hiddenInput) return;
  
    let endpoint = "";
    const cleanedType = type.toLowerCase();
  
    if (cleanedType === "pc") endpoint = "/problem-states/pc";
    else if (cleanedType === "printer") endpoint = "/problem-states/printer";
    else if (cleanedType === "scanner") endpoint = "/problem-states/scanner";
    else endpoint = `/problem-states/maintenance/${cleanedType}`;
  
    statusOptionsContainer.innerHTML = "";
  
    // ➕ أول خيار: Add New
    const addNew = document.createElement("div");
    addNew.className = "dropdown-option-row";
    addNew.innerHTML = `<strong>+ Add New Status</strong>`;
    addNew.onclick = () => {
      sessionStorage.setItem("lastDropdownOpened", "problem-status");
      openGenericPopup("Problem Status", "problem-status");
      statusOptionsContainer.parentElement.style.display = "none";
    };
    statusOptionsContainer.appendChild(addNew);
  
    // 🌐 جلب حالات العطل من السيرفر
    fetch(`http://localhost:5050${endpoint}`)
      .then(res => res.json())
      .then(data => {
        console.log("🟢 المشاكل المستلمة:", data); // <-- هذا مهم جداً

        data.forEach(item => {
          const value = item.problem_text || item.problemStates_Maintance_device_name;
  
          const row = document.createElement("div");
          row.className = "dropdown-option-row";
          row.style.display = "flex";
          row.style.justifyContent = "space-between";
          row.style.alignItems = "center";
  
          // ✅ اسم الحالة
          const label = document.createElement("span");
          label.textContent = value;
          label.style.flex = "1";
          label.style.cursor = "pointer";
          label.onclick = () => {
            hiddenInput.value = value;
            selectedStatus.textContent = value;
            statusOptionsContainer.parentElement.style.display = "none";
          };
  
          // ✏️🗑️ أيقونات التعديل والحذف
          const icons = document.createElement("span");
          icons.innerHTML = `
            <i class="fa fa-edit" title="Edit" style="color: gray; cursor: pointer; margin-right: 10px;"
              onclick="event.stopPropagation(); openPopup('problem-status', 'Problem Status')"></i>
            <i class="fa fa-trash" title="Delete" style="color: gray; cursor: pointer;"
              onclick="event.stopPropagation(); deleteOption('problem-status')"></i>
          `;
  
          row.appendChild(label);
          row.appendChild(icons);
          statusOptionsContainer.appendChild(row);
        });
      })
      .catch(err => {
        console.error("❌ Error loading problem statuses:", err);
        const errorRow = document.createElement("div");
        errorRow.className = "dropdown-option-row";
        errorRow.textContent = "❌ Failed to load statuses";
        errorRow.style.color = "#d9534f";
        statusOptionsContainer.appendChild(errorRow);
      });
  }  
});
document.addEventListener("DOMContentLoaded", () => {
  const typeDropdown = document.getElementById("problem-type");
  if (typeDropdown) {
    typeDropdown.addEventListener("change", function (e) {
      const selectedType = e.target.value.toLowerCase();
      if (!selectedType) return;

      console.log("✅ نوع الجهاز المختار:", selectedType);
      renderProblemStatuses(selectedType);

      const section = document.getElementById("section")?.value;
      const knownTypes = ["pc", "printer", "scanner"];

      if (knownTypes.includes(selectedType) && section) {
        updatePopupHeadingAndFields(selectedType);
      }
    });
  }
});


document.getElementById("selected-device-spec").addEventListener("click", () => {
  document.getElementById("device-spec-options").style.display = "block";
});
function fetchDeviceTypes() {
  fetch("http://localhost:5050/TypeProplem")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("problem-type");
      const options = document.getElementById("problem-type-options");
      const display = document.getElementById("selected-problem-type");

      if (!dropdown || !options || !display) return;

      options.innerHTML = "";

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";
        row.textContent = item.DeviceType;
        row.onclick = () => {
          display.textContent = item.DeviceType;
          dropdown.value = item.DeviceType;
          options.style.display = "none";
        };
        options.appendChild(row);
      });
    })
    .catch(err => {
      console.error("❌ Error fetching device types:", err);
    });
}




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
      updatePopupHeadingAndFields(type);
    }
  });
}
function closePopup() {
  const popup = document.getElementById("popup-modal");
  if (popup) popup.style.display = "none";

  const targetElement = document.getElementById("popup-target-id");
  const targetId = targetElement ? targetElement.value : null;
  const dropdown = targetId ? document.getElementById(targetId) : null;
  const deviceType = document.getElementById("problem-type")?.value?.toLowerCase();

  if (targetId === "device-spec" && dropdown) {
    dropdown.innerHTML = '<option value="" disabled selected>Select Specification</option>';
    dropdown.value = "";

    if (["pc", "printer", "scanner"].includes(deviceType)) {
      const addNewOption = document.createElement("option");
      addNewOption.value = "add-custom";
      addNewOption.textContent = "+ Add New Specification";
      dropdown.appendChild(addNewOption);
    }
  }

  if (dropdown && ["add-custom", "add-new", "add-new-department"].includes(dropdown.value)) {
    dropdown.selectedIndex = 0;
    dropdown.value = "";
    dropdown.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (document.getElementById("popup-input")) {
    document.getElementById("popup-input").value = "";
  }
  if (targetElement) targetElement.value = "";
}
// 🔔 Show notification message below the dropdown
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

  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}




// 🗑️ Delete selected option from dropdown and remember using localStorage + DB
window.deleteOption = function(selectId) {
  const select = document.getElementById(selectId);
  const selectedIndex = select.selectedIndex;
  const selectedOption = select.options[selectedIndex];

  if (!selectedOption || selectedOption.disabled || selectedOption.value === "add-custom") {
    showNotification("Please select a valid option to delete.", selectId);
    return;
  }

  const deletedText = selectedOption.text;
  const deviceType = document.getElementById("problem-type")?.value?.toLowerCase() || "";

  select.removeChild(selectedOption);

  // 🧠 حفظ الحذف محليًا (localStorage)
  const persistentKey = `deletedOptions_${selectId}`;
  let deletedOptions = JSON.parse(localStorage.getItem(persistentKey)) || [];

  if (!deletedOptions.includes(deletedText)) {
    deletedOptions.push(deletedText);
    localStorage.setItem(persistentKey, JSON.stringify(deletedOptions));
  }

  // 🔄 أعد تعيين السلكت لأول خيار صالح
  // 🔄 أعد تعيين السلكت لأول خيار "صالح" بعد الحذف
for (let i = 0; i < select.options.length; i++) {
  const opt = select.options[i];
  if (!opt.disabled && !opt.value.includes("add-")) {
    select.selectedIndex = i;
    select.value = opt.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    break;
  }
}


  // 🌐 حذف من الداتا بيس (API)
  fetch("http://localhost:5050/delete-option-general", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: selectId,
      value: deletedText,
      type: deviceType // فقط لحالة problem-status
    })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        console.error("❌ Error:", result.error);
        showNotification("❌ Failed to delete from DB", selectId);
        return;
      }
      showNotification("✅ Deleted: " + deletedText, selectId);
    })
    .catch(err => {
      console.error("❌ Network error:", err);
      showNotification("❌ Failed to connect", selectId);
    });
};

// 🧽 Apply deletions from localStorage on load
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

function closeGenericPopup() {
  const popup = document.getElementById("generic-popup");
  popup.style.display = "none";

  const lastSelectId = sessionStorage.getItem("lastDropdownOpened");
  if (lastSelectId) {
    const dropdown = document.getElementById(lastSelectId);
    if (dropdown) {
      const addNewValues = ["add-new", "add-new-model", "add-new-department", "add-custom"];
      if (addNewValues.includes(dropdown.value)) {
        dropdown.selectedIndex = 0;
        dropdown.value = "";
        dropdown.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    sessionStorage.removeItem("lastDropdownOpened");
  }

  const deviceType = document.getElementById("problem-type")?.value?.toLowerCase();
  if (["pc", "printer", "scanner"].includes(deviceType)) {
    fetchDeviceSpecsByTypeAndDepartment();
  }
}




function openGenericPopup(label, targetId) {
  const popup = document.getElementById("generic-popup");

  if (label === "Device Specification") {
    const deviceTypeElement = document.getElementById("device-type");
    const deviceType = deviceTypeElement?.value || "";
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
      
  <label for="spec-model">Model</label>
<div class="custom-dropdown-wrapper" id="spec-model-dropdown-wrapper">
  <div class="custom-dropdown">
    <div class="dropdown-toggle" onclick="toggleDropdown(this)">
      <span id="selected-spec-model">Select Model</span>
      <span>▼</span>
    </div>
    <div class="dropdown-content">
      <input
        type="text"
        placeholder="Search model..."
        class="dropdown-search"
        oninput="filterDropdown(this, 'spec-model-options')"
      />
      <div class="dropdown-options" id="spec-model-options"></div>
    </div>
  </div>
</div>
<input type="hidden" id="spec-model" name="model" />

      
     <label for="spec-department">Department</label>
<div class="custom-dropdown-wrapper" id="spec-department-dropdown-wrapper">
  <div class="custom-dropdown">
    <div class="dropdown-toggle" onclick="toggleDropdown(this)">
      <span id="selected-spec-department">Select department</span>
      <span>▼</span>
    </div>
    <div class="dropdown-content">
      <input
        type="text"
        placeholder="Search department..."
        class="dropdown-search"
        oninput="filterDropdown(this, 'spec-department-options')"
      />
      <div class="dropdown-options" id="spec-department-options"></div>
    </div>
  </div>
</div>
<input type="hidden" id="spec-department" name="department" />

      
          <input type="hidden" id="generic-popup-target-id" value="${targetId}" />
          <div class="popup-buttons">
            <button onclick="saveDeviceSpecification()">Save</button>
            <button onclick="closeGenericPopup()">Cancel</button>
          </div>
        </div>
      `;
      

        popup.style.display = "flex";
        fetchDepartments("spec-department");


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


function openAddModelPopup(type, selectId) {
  const popup = document.getElementById("generic-popup");
  // سجل أي سلكت نرجعه لو Cancel
  sessionStorage.setItem("lastDropdownOpened", selectId);

  popup.innerHTML = `
    <div class="popup-content">
      <h3>Add New Model for ${type}</h3>
      <label for="new-model-name">Model Name:</label>
      <input type="text" id="new-model-name" placeholder="Enter model name" />
      <div class="popup-buttons">
        <button onclick="saveNewModel('${type}', '${selectId}')">Save</button>
        <button onclick="closeGenericPopup()">Cancel</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";

  // حفظ القيم المؤقتة (لو مستخدم في فرم specifications)
  const fieldsToSave = ["spec-ministry", "spec-name", "spec-serial", "spec-department"];
  fieldsToSave.forEach(id => {
    const el = document.getElementById(id);
    if (el) sessionStorage.setItem(id, el.value);
  });
}


function saveNewModel(type, selectId) {
  const modelName = document.getElementById("new-model-name").value.trim();
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

      // ✅ خزّن اسم الموديل في sessionStorage لاستخدامه بعد إغلاق البوب أب
      sessionStorage.setItem("lastAddedModel", modelName);

      closeGenericPopup(); // يقفل البوب أب
// ✅ أضف الخيار مباشرة في قائمة الموديلات
const displaySpan = document.getElementById(`selected-${selectId}`);
const hiddenInput = document.getElementById(selectId);
const optionsContainer = document.getElementById(`${selectId}-options`);

if (optionsContainer) {
  const row = document.createElement("div");
  row.className = "dropdown-option-row";
  row.textContent = modelName;
  row.onclick = () => {
    displaySpan.textContent = modelName;
    hiddenInput.value = modelName;
    closeAllDropdowns();
  };
  optionsContainer.appendChild(row);
  displaySpan.textContent = modelName;
  hiddenInput.value = modelName;
}

      // ✅ أعد تحميل قائمة الموديلات
      if (["pc", "printer", "scanner"].includes(type)) {
        fetchModelsByType(type, selectId);
      } else {
        fetchModelsForNewDevices(type, selectId);
      }

      // ✅ عوضًا عن setTimeout ثابت، ننتظر عنصر القائمة يظهر فعلاً
      const interval = setInterval(() => {
        const dropdown = document.getElementById(selectId);
        if (dropdown) {
          clearInterval(interval);
          dropdown.value = modelName;
          dropdown.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, 100);
    })
    .catch(err => {
      console.error("❌ Error saving model:", err);
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




// ✅ تعديل شامل لواجهة البوب أب - منع التكرار قبل الإضافة

function saveGenericOption() {
  const value = document.getElementById("generic-popup-input").value.trim();
  const targetId = document.getElementById("generic-popup-target-id").value;
  const dropdown = document.getElementById(targetId);

  if (!value || !dropdown) return;

  fetch("http://localhost:5050/add-option-general", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: targetId, value })
  })
    .then(res => {
      if (!res.ok) return res.json().then(err => { throw new Error(err.error) });
      return res.json();
    })
    .then(result => {
      alert(result.message || "✅ Added successfully");
        // ✅ إضافة العنصر مباشرة إلى dropdown المخصص أو select
  const isCustomDropdown = document.getElementById(`${targetId}-options`);
  if (isCustomDropdown) {
    const row = document.createElement("div");
    row.className = "dropdown-option-row";
    row.textContent = value;
    row.onclick = () => {
      document.getElementById(`selected-${targetId}`).textContent = value;
      document.getElementById(targetId).value = value;
      closeAllDropdowns();
    };
    document.getElementById(`${targetId}-options`).appendChild(row);
    document.getElementById(`selected-${targetId}`).textContent = value;
    document.getElementById(targetId).value = value;
  } else {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    dropdown.appendChild(option);
    dropdown.value = value;
    dropdown.dispatchEvent(new Event("change", { bubbles: true }));
  }


      if (targetId === "device-type") {
        // ✅ أعد تحميل القائمة ثم اختر القيمة المضافة
        fetch("http://localhost:5050/TypeProplem")
          .then(res => res.json())
          .then(data => {
            const container = document.getElementById("device-type-options");
            const selectedDisplay = document.getElementById("selected-device-type");
            const hiddenInput = document.getElementById("device-type");

            container.innerHTML = "";

            // + Add New
            const addNewRow = document.createElement("div");
            addNewRow.className = "dropdown-option-row add-new-option";
            addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New Device Type</div>`;
            addNewRow.onclick = () => {
              openGenericPopup("Device Type", "device-type");
              closeAllDropdowns();
            };
            container.appendChild(addNewRow);

            // Render updated list
            data.forEach((item, index) => {
              const row = document.createElement("div");
              row.className = "dropdown-option-row";

              const text = document.createElement("div");
              text.className = "dropdown-option-text";
              text.textContent = item.DeviceType;
              text.onclick = () => {
                selectedDisplay.textContent = item.DeviceType;
                hiddenInput.value = item.DeviceType;
                closeAllDropdowns();
                fetchDeviceSpecsByTypeAndDepartment();
              };

              const icons = document.createElement("div");
              icons.className = "dropdown-actions-icons";

              const editIcon = document.createElement("i");
              editIcon.className = "fas fa-edit";
              editIcon.title = "Edit";
              editIcon.onclick = (e) => {
                e.stopPropagation();
                const newValue = prompt("Edit Device Type:", item.DeviceType);
                if (newValue) {
                  item.DeviceType = newValue;
                  fetchDeviceTypes();
                  selectedDisplay.textContent = newValue;
                  hiddenInput.value = newValue;
                }
              };

              const deleteIcon = document.createElement("i");
              deleteIcon.className = "fas fa-trash";
              deleteIcon.title = "Delete";
              deleteIcon.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${item.DeviceType}"?`)) {
                  data.splice(index, 1);
                  fetchDeviceTypes();
                  selectedDisplay.textContent = "Select device type";
                  hiddenInput.value = "";
                }
              };

              icons.appendChild(editIcon);
              icons.appendChild(deleteIcon);
              row.appendChild(text);
              row.appendChild(icons);
              container.appendChild(row);

              // ✅ اختر المضاف تلقائيًا
              if (item.DeviceType === value) {
                selectedDisplay.textContent = value;
                hiddenInput.value = value;
                fetchDeviceSpecsByTypeAndDepartment();
              }
            });
          });
      }
      sessionStorage.removeItem("returnToPopup");
      closeGenericPopup();
      
    })
    .catch(err => {
      alert(err.message);
    });
}


function closeAllDropdowns() {
  const dropdowns = document.querySelectorAll(".dropdown-content");
  dropdowns.forEach(drop => drop.style.display = "none");
}




// ================== الحقول حسب النوع =====================

function updatePopupHeadingAndFields(type) {
  const popupHeading = document.getElementById("popup-title");

  const saveBtn = document.getElementById("popup-save-btn");
  const popupFieldsContainer = document.getElementById("popup-fields");

  popupFieldsContainer.innerHTML = "";

  const typeCleaned = type.trim().toLowerCase();

  if (["pc", "printer", "scanner"].includes(typeCleaned)) {
    let fieldsHtml = `
      <label>${typeCleaned.charAt(0).toUpperCase() + typeCleaned.slice(1)} Name:</label>
      <input type="text" name="device-name" required>

      <label>Serial Number:</label>
      <input type="text" name="serial" required>

      <label>Ministry Number:</label>
      <input type="text" name="ministry-id" required>

      <label>Department:</label>
      <div class="custom-dropdown-wrapper">
        <div class="custom-dropdown">
          <div class="dropdown-toggle" onclick="toggleDropdown(this)">
            <span id="selected-department-${typeCleaned}">Select Department</span>
            <span>▼</span>
          </div>
          <div class="dropdown-content">
            <input type="text" class="dropdown-search" placeholder="Search department..." oninput="filterDropdown(this, 'department-${typeCleaned}-options')">
            <div class="dropdown-options" id="department-${typeCleaned}-options"></div>
          </div>
        </div>
      </div>
      <input type="hidden" id="department-${typeCleaned}" name="department" required>
    `;

    if (typeCleaned === "pc") {
      fieldsHtml += `
        <label>Processor Generation:</label>
        <div class="custom-dropdown-wrapper">
          <div class="custom-dropdown">
            <div class="dropdown-toggle" onclick="toggleDropdown(this)">
              <span id="selected-generation-select">Select generation</span>
              <span>▼</span>
            </div>
            <div class="dropdown-content">
              <input type="text" class="dropdown-search" placeholder="Search generation..." oninput="filterDropdown(this, 'generation-select-options')">
              <div class="dropdown-options" id="generation-select-options"></div>
            </div>
          </div>
        </div>
        <input type="hidden" id="generation-select" name="generation">

        <label>CPU:</label>
        <div class="custom-dropdown-wrapper">
          <div class="custom-dropdown">
            <div class="dropdown-toggle" onclick="toggleDropdown(this)">
              <span id="selected-cpu-select">Select processor</span>
              <span>▼</span>
            </div>
            <div class="dropdown-content">
              <input type="text" class="dropdown-search" placeholder="Search CPU..." oninput="filterDropdown(this, 'cpu-select-options')">
              <div class="dropdown-options" id="cpu-select-options"></div>
            </div>
          </div>
        </div>
        <input type="hidden" id="cpu-select" name="processor">

        <label>RAM:</label>
        <div class="custom-dropdown-wrapper">
          <div class="custom-dropdown">
            <div class="dropdown-toggle" onclick="toggleDropdown(this)">
              <span id="selected-ram-select">Select RAM</span>
              <span>▼</span>
            </div>
            <div class="dropdown-content">
              <input type="text" class="dropdown-search" placeholder="Search RAM..." oninput="filterDropdown(this, 'ram-select-options')">
              <div class="dropdown-options" id="ram-select-options"></div>
            </div>
          </div>
        </div>
        <input type="hidden" id="ram-select" name="ram">
      `;
    }

    fieldsHtml += `
      <label>Model:</label>
      <div class="custom-dropdown-wrapper">
        <div class="custom-dropdown">
          <div class="dropdown-toggle" onclick="toggleDropdown(this)">
            <span id="selected-model-${typeCleaned}">Select Model</span>
            <span>▼</span>
          </div>
          <div class="dropdown-content">
            <input type="text" class="dropdown-search" placeholder="Search model..." oninput="filterDropdown(this, 'model-${typeCleaned}-options')">
            <div class="dropdown-options" id="model-${typeCleaned}-options"></div>
          </div>
        </div>
      </div>
      <input type="hidden" id="model-${typeCleaned}" name="model">
    `;

    if (typeCleaned === "pc") {
      fieldsHtml += `
        <label>Operating System:</label>
        <div class="custom-dropdown-wrapper">
          <div class="custom-dropdown">
            <div class="dropdown-toggle" onclick="toggleDropdown(this)">
              <span id="selected-os-select">Select OS</span>
              <span>▼</span>
            </div>
            <div class="dropdown-content">
              <input type="text" class="dropdown-search" placeholder="Search OS..." oninput="filterDropdown(this, 'os-select-options')">
              <div class="dropdown-options" id="os-select-options"></div>
            </div>
          </div>
        </div>
        <input type="hidden" id="os-select" name="os">
      `;
    }

    popupHeading.textContent = `Enter ${type.charAt(0).toUpperCase() + type.slice(1)} Specifications`;
    popupFieldsContainer.innerHTML = fieldsHtml;
    saveBtn.onclick = savePCSpec;


    // Load data
    fetchDepartments(`department-${typeCleaned}`);
    fetchAndRenderModels(typeCleaned, `model-${typeCleaned}`);
    if (typeCleaned === "pc") {
      fetchCPU();
      fetchRAM();
      fetchOS();
      fetchProcessorGen();
    }
  } else {
    popupHeading.textContent = "Enter Device Specifications";
    popupFieldsContainer.innerHTML = "<p>No fields available for this device type.</p>";
  }
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
      if (result.error) {
        alert(result.error);
        return;
      }

      alert(result.message);

      const selectId = sessionStorage.getItem("lastDepartmentSelectId") || "spec-department";
      sessionStorage.setItem(selectId, sectionName); // تخزين لتحديده لاحقًا

      const displaySpan = document.getElementById(`selected-${selectId}`);
      const hiddenInput = document.getElementById(selectId);
      const optionsContainer = document.getElementById(`${selectId}-options`);

      // ✅ إضافة مباشرة للقائمة
      if (displaySpan && hiddenInput && optionsContainer) {
        const newRow = document.createElement("div");
        newRow.className = "dropdown-option-row";
        newRow.textContent = sectionName;
        newRow.onclick = () => {
          displaySpan.textContent = sectionName;
          hiddenInput.value = sectionName;
          closeAllDropdowns();
          fetchDeviceSpecsByTypeAndDepartment(); // لو كنت داخل المواصفات
        };
        optionsContainer.appendChild(newRow);
        displaySpan.textContent = sectionName;
        hiddenInput.value = sectionName;
      }

      // ✅ استرجاع القيم المؤقتة
      const isKnownDevice = ["pc", "printer", "scanner"].includes(document.getElementById("problem-type")?.value?.toLowerCase());

      const restoreFields = isKnownDevice
        ? ["ministry-id", "device-name", "serial", ...(document.getElementById("problem-type").value.toLowerCase() === "pc"
            ? ["cpu-select", "ram-select", "os-select", "generation-select"]
            : [])]
        : ["spec-name", "spec-serial", "spec-ministry"];

      restoreFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) sessionStorage.setItem(id, el.value);
      });

      setTimeout(() => {
        closeGenericPopup();

        if (!isKnownDevice) {
          setTimeout(() => {
            const popupVisible = document.getElementById("popup-modal")?.style.display === "flex";
            if (!popupVisible) {
              openGenericPopup("Device Specification", "device-spec");
            }
          }, 300);
        }
      }, 300);
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

  const type = problemTypeDropdown.value.toLowerCase();

  fetch(`http://localhost:5050/AddDevice/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(result => {
      if (result.message) {
        alert(result.message);

        const newValue = result.insertedId || data.serial || data["device-name"];
        const label = `${data["device-name"]} | ${data.serial} | ${data["ministry-id"]}`;

        // ✅ إضافة إلى <select>
        const specDropdown = document.getElementById("device-spec");
        if (specDropdown) {
          const newOption = document.createElement("option");
          newOption.value = newValue;
          newOption.textContent = label;
          specDropdown.appendChild(newOption);
          specDropdown.value = newValue;
          specDropdown.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // ✅ إضافة إلى dropdown المخصص (إن وجد)
        const optionsContainer = document.getElementById("device-spec-options");
        const displaySpan = document.getElementById("selected-device-spec");
        const hiddenInput = document.getElementById("device-spec");

        if (optionsContainer && displaySpan && hiddenInput) {
          const newRow = document.createElement("div");
          newRow.className = "dropdown-option-row";
          newRow.textContent = label;
          newRow.onclick = () => {
            displaySpan.textContent = label;
            hiddenInput.value = newValue;
            closeAllDropdowns();
          };
          optionsContainer.appendChild(newRow);

          // تحديد الخيار مباشرة
          displaySpan.textContent = label;
          hiddenInput.value = newValue;
        }

        // ✅ إغلاق البوب أب
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
      const optionsContainer = document.getElementById("cpu-select-options");
      const displaySpan = document.getElementById("selected-cpu-select");
      const hiddenInput = document.getElementById("cpu-select");

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New CPU</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "cpu-select");
        openAddOptionPopup("cpu-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";
        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.cpu_name;
        text.onclick = () => {
          displaySpan.textContent = item.cpu_name;
          hiddenInput.value = item.cpu_name;
          closeAllDropdowns();
        };
        row.appendChild(text);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("cpu-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("cpu-select");
      }
    });
}




function fetchRAM() {
  fetch("http://localhost:5050/RAM_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("ram-select-options");
      const displaySpan = document.getElementById("selected-ram-select");
      const hiddenInput = document.getElementById("ram-select");

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New RAM</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "ram-select");
        openAddOptionPopup("ram-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";
        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.ram_type;
        text.onclick = () => {
          displaySpan.textContent = item.ram_type;
          hiddenInput.value = item.ram_type;
          closeAllDropdowns();
        };
        row.appendChild(text);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("ram-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("ram-select");
      }
    });
}



function fetchOS() {
  fetch("http://localhost:5050/OS_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("os-select-options");
      const displaySpan = document.getElementById("selected-os-select");
      const hiddenInput = document.getElementById("os-select");

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New OS</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "os-select");
        openAddOptionPopup("os-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";
        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.os_name;
        text.onclick = () => {
          displaySpan.textContent = item.os_name;
          hiddenInput.value = item.os_name;
          closeAllDropdowns();
        };
        row.appendChild(text);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("os-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("os-select");
      }
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

  let endpoint = "http://localhost:5050/add-option-general";
  if (targetId === "os-select") endpoint = "http://localhost:5050/add-os";
  else if (targetId === "ram-select") endpoint = "http://localhost:5050/add-ram";
  else if (targetId === "cpu-select") endpoint = "http://localhost:5050/add-cpu";
  else if (targetId === "generation-select") endpoint = "http://localhost:5050/add-generation";
  else if (targetId === "section") endpoint = "http://localhost:5050/add-department";

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: targetId, value })
  })
    .then(async res => {
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "❌ This option already exists");
        return;
      }

      alert(data.message || "✅ Added successfully");
      const displaySpan = document.getElementById(`selected-${targetId}`);
const hiddenInput = document.getElementById(targetId);
const optionsContainer = document.getElementById(`${targetId}-options`);

if (optionsContainer) {
  const row = document.createElement("div");
  row.className = "dropdown-option-row";
  row.textContent = value;
  row.onclick = () => {
    displaySpan.textContent = value;
    hiddenInput.value = value;
    closeAllDropdowns();
  };
  optionsContainer.appendChild(row);
  displaySpan.textContent = value;
  hiddenInput.value = value;
} else {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  dropdown.appendChild(option);
  dropdown.value = value;
  dropdown.dispatchEvent(new Event("change", { bubbles: true }));
}


      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      dropdown.appendChild(option);
      dropdown.value = value;

      closeGenericPopup();
    })
    .catch(err => {
      console.error("❌ Error:", err);
      alert("❌ Failed to save option");
    });
}



function fetchProcessorGen() {
  fetch("http://localhost:5050/Processor_Generations")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("generation-select-options");
      const displaySpan = document.getElementById("selected-generation-select");
      const hiddenInput = document.getElementById("generation-select");

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New Generation</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "generation-select");
        openAddOptionPopup("generation-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";
        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.generation_number;
        text.onclick = () => {
          displaySpan.textContent = item.generation_number;
          hiddenInput.value = item.generation_number;
          closeAllDropdowns();
        };
        row.appendChild(text);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("generation-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("generation-select");
      }
    });
}


function fetchDepartments(selectId = "department") {
  fetch("http://localhost:5050/Departments")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById(`${selectId}-options`);
      const displaySpan = document.getElementById(`selected-${selectId}`);
      const hiddenInput = document.getElementById(selectId);

      if (!optionsContainer || !displaySpan || !hiddenInput) {
        console.error(`❌ عناصر الدروب داون غير موجودة لـ: ${selectId}`);
        return;
      }

      optionsContainer.innerHTML = "";

      // ✅ زر "إضافة جديد"
      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New Section</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", selectId);
        openAddSectionPopup();
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      // ✅ الأقسام من السيرفر
      data.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.name;
        text.onclick = () => {
          displaySpan.textContent = item.name;
          hiddenInput.value = item.name;
          closeAllDropdowns();
          fetchDeviceSpecsByTypeAndDepartment(); // 🔁 للتحديث حسب القسم
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt("Edit Section:", item.name);
          if (newValue) {
            item.name = newValue;
            displaySpan.textContent = newValue;
            hiddenInput.value = newValue;
            fetchCustomStyledDepartments(selectId);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.name}"?`)) {
            data.splice(index, 1);
            displaySpan.textContent = "Select section";
            hiddenInput.value = "";
            fetchCustomStyledDepartments(selectId);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      // ✅ استعادة القيمة المخزنة مؤقتًا
      const saved = sessionStorage.getItem(selectId);
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem(selectId);
      }
    })
    .catch(err => {
      console.error(`❌ Failed to fetch departments for ${selectId}:`, err);
    });
}



function fetchDeviceSpecsByTypeAndDepartment() {
  const type = document.getElementById("problem-type").value?.toLowerCase();
  const dept = document.getElementById("section").value;
  const optionsContainer = document.getElementById("device-spec-options");
  const displaySpan = document.getElementById("selected-device-spec");
  const hiddenInput = document.getElementById("device-spec");

  if (!type || !dept || !optionsContainer || !displaySpan || !hiddenInput) return;

  optionsContainer.innerHTML = "";

  // + Add New Specification
  const addNewRow = document.createElement("div");
  addNewRow.className = "dropdown-option-row add-new-option";
  addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New Specification</div>`;
  addNewRow.onclick = () => {
    sessionStorage.setItem("lastDropdownOpened", "device-spec");
    updatePopupHeadingAndFields(type);
    popup.style.display = "flex";
    closeAllDropdowns();
  };
  optionsContainer.appendChild(addNewRow);

  fetch(`http://localhost:5050/devices/${type}/${encodeURIComponent(dept)}`)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        const noData = document.createElement("div");
        noData.className = "dropdown-option-row";
        noData.innerHTML = `<div class="dropdown-option-text">No specifications found</div>`;
        optionsContainer.appendChild(noData);
        return;
      }

      data.forEach(device => {
        const text = `${device.name || "Unnamed"} | ${device.Serial_Number} | ${device.Governmental_Number}`;
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const optionText = document.createElement("div");
        optionText.className = "dropdown-option-text";
        optionText.textContent = text;
        optionText.onclick = () => {
          displaySpan.textContent = text;
          hiddenInput.value = device.id;
          closeAllDropdowns();
        };

        row.appendChild(optionText);
        optionsContainer.appendChild(row);
      });

      // ✅ Restore from sessionStorage
      const saved = sessionStorage.getItem("device-spec");
      if (saved) {
        const match = data.find(d => d.id === saved);
        if (match) {
          const label = `${match.name} | ${match.Serial_Number} | ${match.Governmental_Number}`;
          displaySpan.textContent = label;
          hiddenInput.value = saved;
          sessionStorage.removeItem("device-spec");
        }
      }
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
function openPopup(selectId, label) {
  const select = document.getElementById(selectId);
  const selectedOption = select.options[select.selectedIndex];

  if (!selectedOption || selectedOption.disabled || selectedOption.value === "add-custom") {
    showNotification("Please select a valid option to edit.", selectId);
    return;
  }

  sessionStorage.setItem("lastDropdownOpened", selectId); // نستخدمه بعد الإغلاق

  const genericPopup = document.getElementById("generic-popup");
  genericPopup.innerHTML = `
    <div class="popup-content">
      <h3>Edit ${label}</h3>
      <label for="edit-option-input">New ${label}:</label>
      <input type="text" id="edit-option-input" value="${selectedOption.text}" />
      <div class="popup-buttons">
        <button onclick="saveEditedOption('${selectId}', '${selectedOption.text}', '${label}')">Save</button>
        <button onclick="closeGenericPopup()">Cancel</button>
      </div>
    </div>
  `;

  genericPopup.style.display = "flex"; // ✅ تأكد انه العنصر الصحيح
}
document.addEventListener("DOMContentLoaded", () => {
  fetchDeviceTypes();
  fetchDepartments("section");

  const typeDropdown = document.getElementById("problem-type");
  const sectionDropdown = document.getElementById("section");

  if (typeDropdown && sectionDropdown) {
    typeDropdown.addEventListener("change", () => {
      fetchDeviceSpecsByTypeAndDepartment();
    });

    sectionDropdown.addEventListener("change", () => {
      fetchDeviceSpecsByTypeAndDepartment();
    });
  }

  // ✅ لتفعيل اختيار "+ Add New Specification"
  const displaySpan = document.getElementById("selected-device-spec");
  const hiddenInput = document.getElementById("device-spec");
  const optionsContainer = document.getElementById("device-spec-options");

  if (optionsContainer) {
    optionsContainer.addEventListener("click", (e) => {
      const row = e.target.closest(".dropdown-option-row");
      if (!row) return;

      const value = row.textContent.trim();

      if (value === "+ Add New Specification") {
        const type = typeDropdown?.value?.toLowerCase();
        if (type && ["pc", "printer", "scanner"].includes(type)) {
          updatePopupHeadingAndFields(type);
          document.getElementById("popup-modal").style.display = "flex";
        } else {
          openGenericPopup("Device Specification", "device-spec");
        }
      }
    });
  }
});


window.toggleSearch = function(selectId) {
  const container = document.getElementById(`search-container-${selectId}`);
  if (!container) {
    console.warn(`❌ search-container-${selectId} not found`);
    return;
  }

  container.style.display = container.style.display === "none" ? "block" : "none";

  const input = container.querySelector("input");
  if (!input) {
    console.warn(`❌ input not found inside search-container-${selectId}`);
    return;
  }

  input.value = "";
  input.focus();

  input.oninput = () => {
    const filter = input.value.toLowerCase();
    const select = document.getElementById(selectId);
    if (!select) return;

    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i];
      const shouldShow = option.text.toLowerCase().includes(filter) || option.value === "add-custom";
      option.style.display = shouldShow ? "block" : "none";
    }
  };
};


function deleteOption(selectId) {
  const select = document.getElementById(selectId);
  const selectedIndex = select.selectedIndex;
  const selectedOption = select.options[selectedIndex];

  if (!selectedOption || selectedOption.disabled || selectedOption.value === "add-custom") {
    showNotification("Please select a valid option to delete.", selectId);
    return;
  }

  const deletedText = selectedOption.text;
  const deviceType = document.getElementById("problem-type")?.value?.toLowerCase() || "";

  fetch("http://localhost:5050/delete-option-general", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: selectId,
      value: deletedText,
      type: deviceType
    })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        // If the value is linked to other records, suggest editing
        if (result.error.includes("linked")) {
          if (confirm(`⚠️ ${result.error}\n\nWould you like to edit the value instead?`)) {
            openPopup(selectId, "Value");
          }
        } else {
          showNotification(result.error, selectId);
        }
        return;
      }

      // Remove from DOM
      select.removeChild(selectedOption);

      // Save deleted value to localStorage
      const persistentKey = `deletedOptions_${selectId}`;
      let deletedOptions = JSON.parse(localStorage.getItem(persistentKey)) || [];

      if (!deletedOptions.includes(deletedText)) {
        deletedOptions.push(deletedText);
        localStorage.setItem(persistentKey, JSON.stringify(deletedOptions));
      }

      // Reset the select box to a valid option
      for (let i = 0; i < select.options.length; i++) {
        const opt = select.options[i];
        if (!opt.disabled && !opt.value.includes("add-")) {
          select.selectedIndex = i;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          break;
        }
      }

      showNotification("✅ Deleted: " + deletedText, selectId);
    })
    .catch(err => {
      console.error("❌ Network error:", err);
      showNotification("❌ Failed to connect to the server.", selectId);
    });
}

// دالة تطبق الحذف الدائم عند تحميل الصفحة
function applyDeletions(selectId) {
  const select = document.getElementById(selectId);
  if (!select) {
    console.warn(`⚠️ select element not found for id: ${selectId}`);
    return;
  }

  const persistentKey = `deletedOptions_${selectId}`;
  const deletedOptions = JSON.parse(localStorage.getItem(persistentKey)) || [];

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

function saveEditedOption(selectId, oldValue, label) {
  const newValue = document.getElementById("edit-option-input").value.trim();
  if (!newValue || newValue === oldValue) {
    closeGenericPopup();
    return;
  }

  fetch("http://localhost:5050/update-option-general", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: selectId,
      oldValue,
      newValue,
      type: document.getElementById("problem-type")?.value?.toLowerCase() || ""
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        const select = document.getElementById(selectId);
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption) {
          selectedOption.text = newValue;
          selectedOption.value = newValue;
        }
        showNotification("✅ Option updated successfully", selectId);
        closeGenericPopup();
      }
       else {
        showNotification(data.error || "❌ Update failed", selectId);
      }
    })
    .catch(err => {
      console.error("❌ Update error:", err);
      showNotification("❌ Failed to update option", selectId);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const dropdownConfigs = [
    { id: "problem-type", endpoint: "/TypeProplem", key: "DeviceType", label: "Problem Type" },
    { id: "floor", endpoint: "/floors", key: "FloorNum", label: "Floor" },
    { id: "technical", endpoint: "/Technical", key: "name", label: "Technical" },
    { id: "section", endpoint: "/Departments", key: "name", label: "Section" },
  ];

  dropdownConfigs.forEach(config => {
    const optionsContainer = document.getElementById(`${config.id}-options`);
    const hiddenInput = document.getElementById(config.id);
    const displaySpan = document.getElementById(`selected-${config.id}`);

    fetch(`http://localhost:5050${config.endpoint}`)
      .then(res => res.json())
      .then(data => {
        optionsContainer.innerHTML = "";

        // ✅ Add New with custom label
        const addNew = document.createElement("div");
        addNew.className = "dropdown-option-row";
        addNew.textContent = `+ Add New ${config.label}`;
        addNew.style.fontWeight = "bold";
        addNew.onclick = () => {
          sessionStorage.setItem("lastDropdownOpened", config.id);
          openGenericPopup(config.label, config.id);
          optionsContainer.parentElement.style.display = "none";
        };
        optionsContainer.appendChild(addNew);

        // ✅ باقي العناصر
        data.forEach(item => {
          const value = item[config.key];
        
          const row = document.createElement("div");
          row.className = "dropdown-option-row";
          row.style.display = "flex";
          row.style.justifyContent = "space-between";
          row.style.alignItems = "center";
        
          // النص الأساسي
          const valueSpan = document.createElement("span");
          valueSpan.textContent = value;
          valueSpan.style.flex = "1";
          valueSpan.style.cursor = "pointer";
          valueSpan.onclick = () => {
            hiddenInput.value = value;
            displaySpan.textContent = value;
            optionsContainer.parentElement.style.display = "none";
          };
        
          // أيقونات
          const iconGroup = document.createElement("div");
          iconGroup.innerHTML = `
            <i class="fa-solid fa-edit" style="color:#6c757d; margin-left: 8px; cursor:pointer;" title="Edit"></i>
            <i class="fa-solid fa-trash" style="color:#6c757d; margin-left: 8px; cursor:pointer;" title="Delete"></i>
          `;
        
          // حدث التعديل
          iconGroup.querySelector(".fa-edit").onclick = (e) => {
            e.stopPropagation(); // ما يختار العنصر
            sessionStorage.setItem("lastDropdownOpened", config.id);
            openPopup(config.id, config.label); // يفتح popup التعديل
          };
        
          // حدث الحذف
          iconGroup.querySelector(".fa-trash").onclick = (e) => {
            e.stopPropagation(); // ما يختار العنصر
            deleteOption(config.id); // ينفذ الحذف
          };
        
          // التجميع النهائي
          row.appendChild(valueSpan);
          row.appendChild(iconGroup);
          optionsContainer.appendChild(row);
        });
        
      })        
      .catch(err => console.error(`❌ Error loading ${config.id}:`, err));
  });
});


function toggleDropdown(el) {
  const dropdownContent = el.nextElementSibling;
  dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
}

function filterDropdown(input, optionsId) {
  const filter = input.value.toLowerCase();
  const options = document.getElementById(optionsId).querySelectorAll(".dropdown-option-row");

  options.forEach(opt => {
    opt.style.display = opt.textContent.toLowerCase().includes(filter) ? "flex" : "none";
  });
}

document.getElementById("selected-device-spec").addEventListener("click", () => {
  const type = document.getElementById("problem-type").value;
  const section = document.getElementById("section").value;

  if (!type || !section) {
    alert("Please select both device type and section first.");
    return;
  }

  fetchDeviceSpecsByTypeAndDepartment();
});

document.getElementById("selected-problem-status").addEventListener("click", () => {
  const content = document.querySelector("#selected-problem-status").closest(".custom-dropdown").querySelector(".dropdown-content");
  if (content) {
    // فتح أو إغلاق القائمة
    content.style.display = content.style.display === "block" ? "none" : "block";
  }
});
document.getElementById("selected-device-spec").addEventListener("click", () => {
  const type = document.getElementById("problem-type").value;
  const section = document.getElementById("section").value;

  if (!type || !section) {
    alert("Please select both device type and section first.");
    return;
  }

  // ✅ الحل: جلب المواصفات عند الضغط

  // فتح القائمة
  document.getElementById("device-spec-options").style.display = "block";
});
