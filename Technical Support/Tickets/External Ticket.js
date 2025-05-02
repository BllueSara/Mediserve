

// التعامل مع منطقة رفع الملفات باستخدام Drag & Drop والنقر

// الحصول على عناصر السحب والإفلات وعناصر الـ input المخفي
const dropArea = document.getElementById("drop-area");
const uploadFileInput = document.getElementById("upload-file");

// عند النقر على منطقة الرفع، يتم تفعيل اختيار الملفات
dropArea.addEventListener("click", () => {
uploadFileInput.click();
});

// التعامل مع سحب الملفات فوق منطقة الرفع
dropArea.addEventListener("dragover", (e) => {
e.preventDefault(); // منع السلوك الافتراضي (مثلاً فتح الملف في المتصفح)
dropArea.classList.add("drag-over"); // تفعيل تأثير بصري عند السحب
});

// عند مغادرة الملفات للمنطقة (دون إفلاتها)
dropArea.addEventListener("dragleave", (e) => {
e.preventDefault();
dropArea.classList.remove("drag-over"); // إزالة التأثير البصري
});

// عند إفلات الملفات داخل منطقة الرفع
dropArea.addEventListener("drop", (e) => {
e.preventDefault();
dropArea.classList.remove("drag-over"); // إزالة التأثير البصري
const files = e.dataTransfer.files;
handleFiles(files);
});

// عند اختيار الملفات باستخدام متصفح الملفات (عن طريق الـ input المخفي)
uploadFileInput.addEventListener("change", (e) => {
const files = e.target.files;
handleFiles(files);
});

/**
* دالة للتعامل مع الملفات المختارة وإرسالها للسيرفر
* @param {FileList} files - قائمة الملفات المختارة
*/
function handleFiles(files) {
// إنشاء كائن FormData لتجميع الملفات
const formData = new FormData();

// إضافة كل ملف إلى formData
for (let i = 0; i < files.length; i++) {
  formData.append("files", files[i]);
}

// إرسال الملفات للسيرفر عبر طلب POST باستخدام fetch
// تأكد من تعديل الرابط التالي (URL) ليناسب إعدادات السيرفر لديك
fetch("http://localhost:5050/upload", {
  method: "POST",
  body: formData
})
  .then(response => response.json())
  .then(result => {
    console.log("Upload successful!", result);
    // يمكنك هنا عرض رسالة نجاح أو تحديث الواجهة بحسب النتيجة
  })
  .catch(error => {
    console.error("Upload error:", error);
    // يمكنك هنا تقديم رسالة للمستخدم عند حدوث خطأ ما
  });
}

const deviceTypeSelect = document.getElementById("device-type");
const deviceSpecSelect = document.getElementById("device-spec");
const popup = document.getElementById("popup-modal");
const popupHeading = popup.querySelector("#popup-title");
const popupForm = document.getElementById("pc-spec-form");
const popupFieldsContainer = document.getElementById("popup-fields");

if (deviceTypeSelect) {
  deviceTypeSelect.addEventListener("change", function () {
    const type = this.value.trim().toLowerCase();
    const department = sectionDropdown?.value?.trim();

    deviceSpecSelect.value = "";

    fetchDeviceSpecsByTypeAndDepartment(); // ✅ تحديث الأجهزة
  });
}

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

        ["spec-ministry", "spec-name", "spec-serial", "spec-department"].forEach(id => {
          const el = document.getElementById(id);
          if (el) sessionStorage.setItem(id, el.value);
        });

        openAddModelPopup();
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      // ✅ تعبئة النماذج من السيرفر مع Edit/Delete
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

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt("Edit Model:", item.model_name);
          if (newValue) {
            editOption(dropdownId, item.model_name, newValue, cleanedType); 
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.model_name}"?`)) {
            deleteOption(dropdownId, item.model_name, cleanedType);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);

        row.appendChild(text);
        row.appendChild(icons);
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
      attachEditDeleteHandlers(`${dropdownId}-options`, "Model");
    })
    .catch(err => {
      console.error("❌ Error fetching models:", err);
    });
}



// ✅ تحديث الحقول إلى custom dropdown
function updatePopupHeadingAndFields(type) {
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
            <label>MAC Address:</label>
<input type="text" name="mac-address" required>
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

        <label>Hard Drive Type:</label>
<div class="custom-dropdown-wrapper">
  <div class="custom-dropdown">
    <div class="dropdown-toggle" onclick="toggleDropdown(this)">
      <span id="selected-drive-select">Select Hard Drive</span>
      <span>▼</span>
    </div>
    <div class="dropdown-content">
      <input type="text" class="dropdown-search" placeholder="Search Drive..." oninput="filterDropdown(this, 'drive-select-options')">
      <div class="dropdown-options" id="drive-select-options"></div>
    </div>
  </div>
</div>
<input type="hidden" id="drive-select" name="drive">

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
      fieldsHtml += `
      <label>RAM Size:</label>
      <div class="custom-dropdown-wrapper">
        <div class="custom-dropdown">
          <div class="dropdown-toggle" onclick="toggleDropdown(this)">
            <span id="selected-ram-size-select">Select RAM Size</span>
            <span>▼</span>
          </div>
          <div class="dropdown-content">
            <input type="text" class="dropdown-search" placeholder="Search RAM size..." oninput="filterDropdown(this, 'ram-size-select-options')">
            <div class="dropdown-options" id="ram-size-select-options"></div>
          </div>
        </div>
      </div>
      <input type="hidden" id="ram-size-select" name="ram_size">
    `;
    }

    popupHeading.textContent = `Enter ${type.charAt(0).toUpperCase() + type.slice(1)} Specifications`;
    popupFieldsContainer.innerHTML = fieldsHtml;

    // Load data
    fetchDepartments(`department-${typeCleaned}`);
    fetchAndRenderModels(typeCleaned, `model-${typeCleaned}`);
    if (typeCleaned === "pc") {
      fetchCPU();
      fetchRAM();
      fetchOS();
      fetchProcessorGen();
      fetchDrives(); // ✅ أضفناها هنا
      fetchRAMSize(); // ✅ أضفناها هنا

    }
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
  if (deviceType !== "pc") {
    delete deviceData["mac-address"];
  }

  // 🔥 هنا التعديل المهم 🔥
  const departmentInput = document.getElementById("department-" + deviceType);
  if (departmentInput) {
    const departmentName = departmentInput.dataset.name || departmentInput.value.trim();
    deviceData["department"] = departmentName;
  }

  console.log("🔍 Sending data:", deviceData);

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
        option.value = result.insertedId || deviceData.serial || deviceData["device-name"];
        option.textContent = `${deviceData["device-name"]} | ${deviceData.serial} | ${deviceData["ministry-id"]}`;
        dropdown.appendChild(option);
        dropdown.value = option.value;

        const displaySpan = document.getElementById("selected-device-spec");
        if (displaySpan) {
          displaySpan.textContent = option.textContent;
        }

        popup.style.display = "none";
        fetchDeviceSpecsByTypeAndDepartment();
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

      // ✅ زر إضافة جديد
      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New Section</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDepartmentSelectId", selectId);

        ["spec-name", "spec-serial", "spec-ministry", "spec-model", selectId].forEach(id => {
          const el = document.getElementById(id);
          if (el) sessionStorage.setItem(id, el.value);
        });

        sessionStorage.setItem("lastDropdownOpened", selectId);
        openAddSectionPopup();
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      // ✅ الأقسام من السيرفر
      data.forEach((item) => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.name;
        text.onclick = () => {
          displaySpan.textContent = item.name;
          hiddenInput.value = item.id; // 👈 ID للتذكرة
          hiddenInput.dataset.name = item.name; // 👈 Name لاستخدامه لاحقًا للأجهزة
          closeAllDropdowns();
          fetchDeviceSpecsByTypeAndDepartment(); // ✅
        };
        

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        // ✏️ أيقونة التعديل (Edit)
        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const oldValue = item.name;
          const newValue = prompt("Edit Section:", oldValue);
          if (newValue && newValue.trim() !== oldValue) {
            editOption("section", oldValue, newValue.trim(), "Department");
          }
        };

        // 🗑️ أيقونة الحذف (Delete)
        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.name}"?`)) {
            deleteOption("section", item.name, "Department");
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

      attachEditDeleteHandlers(`${selectId}-options`, "Department");
    })
    .catch(err => {
      console.error(`❌ Failed to fetch departments for ${selectId}:`, err);
    });
}
  
  function saveNewSection() {
    const sectionName = document.getElementById("new-section-name").value.trim();
    if (!sectionName) {
      alert("❌ Please enter a section name");
      return;
    }
  
    fetch("http://localhost:5050/add-option-external-ticket", {
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
  
        // ✅ تحديث الدروب داون المخصص
   // ✅ بعد fetchDepartments(selectId);
fetchDepartments(selectId);
sessionStorage.setItem(selectId, sectionName);

// ✅ إظهار القيمة الجديدة يدويًا
setTimeout(() => {
  const displaySpan = document.getElementById(`selected-${selectId}`);
  const hiddenInput = document.getElementById(selectId);

  if (displaySpan && hiddenInput) {
    displaySpan.textContent = sectionName;
    hiddenInput.value = sectionName;
  }
}, 200);

  
        // ✅ إزالة بيانات الجلس
        sessionStorage.removeItem("lastDepartmentSelectId");
        sessionStorage.removeItem("returnToPopup");
  
        // ✅ أغلق البوب أب الحالي
        document.getElementById("generic-popup").style.display = "none";
  
        // ✅ فقط إذا كانت الإضافة داخل popup المواصفات + نوع الجهاز غير معروف
        const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
        const isSpecContext = ["spec-department", "department-pc", "department-printer", "department-scanner"].includes(selectId);
  
        if (isSpecContext && !["pc", "printer", "scanner"].includes(deviceType)) {
          const modelName = document.getElementById("spec-model")?.value;
          if (modelName) sessionStorage.setItem("spec-model", modelName);
        
          const popup = document.getElementById("generic-popup");
        
          // ✅ إذا البوب أب موجود ومفتوح، لا تفتحه من جديد
          if (popup && popup.style.display !== "flex") {
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
        }
        
      })
      .catch(err => {
        console.error("❌ Failed to save section:", err);
        alert("❌ Error saving section");
      });
  }
  function fetchRAMSize() {
    fetch("http://localhost:5050/RAM_Sizes")
      .then(res => res.json())
      .then(data => {
        const optionsContainer = document.getElementById("ram-size-select-options");
        const displaySpan = document.getElementById("selected-ram-size-select");
        const hiddenInput = document.getElementById("ram-size-select");
  
        if (!optionsContainer || !displaySpan || !hiddenInput) return;
  
        optionsContainer.innerHTML = "";
  
        // ✅ زر + Add New RAM Size
        const addNewRow = document.createElement("div");
        addNewRow.className = "dropdown-option-row add-new-option";
        addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New RAM Size</div>`;
        addNewRow.onclick = () => {
          sessionStorage.setItem("lastDropdownOpened", "ram-size-select");
          openAddOptionPopup("ram-size-select");
          closeAllDropdowns();
        };
        optionsContainer.appendChild(addNewRow);
  
        // ✅ الأنواع من السيرفر
        data.forEach(item => {
          const row = document.createElement("div");
          row.className = "dropdown-option-row";
  
          const text = document.createElement("div");
          text.className = "dropdown-option-text";
          text.textContent = item.ram_size;
          text.onclick = () => {
            displaySpan.textContent = item.ram_size;
            hiddenInput.value = item.ram_size;
            closeAllDropdowns();
          };
  
          const icons = document.createElement("div");
          icons.className = "dropdown-actions-icons";
  
          // ✏️ زر التعديل
          const editIcon = document.createElement("i");
          editIcon.className = "fas fa-edit";
          editIcon.title = "Edit";
          editIcon.onclick = (e) => {
            e.stopPropagation();
            const newValue = prompt("Edit RAM Size:", item.ram_size);
            if (newValue) {
              editOption("ram-size-select", item.ram_size, newValue);
            }
          };
  
          // 🗑️ زر الحذف
          const deleteIcon = document.createElement("i");
          deleteIcon.className = "fas fa-trash";
          deleteIcon.title = "Delete";
          deleteIcon.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${item.ram_size}"?`)) {
              deleteOption("ram-size-select", item.ram_size);
            }
          };
  
          icons.appendChild(editIcon);
          icons.appendChild(deleteIcon);
          row.appendChild(text);
          row.appendChild(icons);
          optionsContainer.appendChild(row);
        });
  
        // ✅ استعادة القيمة المحفوظة
        const saved = sessionStorage.getItem("ram-size-select");
        if (saved) {
          displaySpan.textContent = saved;
          hiddenInput.value = saved;
          sessionStorage.removeItem("ram-size-select");
        }
  
        attachEditDeleteHandlers("ram-size-select-options", "RAM Size");
      })
      .catch(err => {
        console.error("❌ Error fetching RAM sizes:", err);
      });
  }
  


function fetchDrives() {
  fetch("http://localhost:5050/Hard_Drive_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("drive-select-options");
      const displaySpan = document.getElementById("selected-drive-select");
      const hiddenInput = document.getElementById("drive-select");

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      // ✅ زر + Add New Drive Type
      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New Drive Type</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "drive-select");
        openAddOptionPopup("drive-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      // ✅ الأنواع من السيرفر
      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.drive_type;
        text.onclick = () => {
          displaySpan.textContent = item.drive_type;
          hiddenInput.value = item.drive_type;
          closeAllDropdowns();
        };

        // ✅ أيقونات التعديل والحذف
        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        // ✏️ زر التعديل
        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt("Edit Drive Type:", item.drive_type);
          if (newValue) {
            editOption("drive-select", item.drive_type, newValue);
          }
        };

        // 🗑️ زر الحذف
        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.drive_type}"?`)) {
            deleteOption("drive-select", item.drive_type);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      // ✅ استعادة القيمة المحفوظة
      const saved = sessionStorage.getItem("drive-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("drive-select");
      }
      attachEditDeleteHandlers("drive-select-options", "Hard Drive Type");

    })
    .catch(err => {
      console.error("❌ Error fetching drives:", err);
    });
}



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

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt("Edit CPU:", item.cpu_name);
          if (newValue) {
            editOption("cpu-select", item.cpu_name, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.cpu_name}"?`)) {
            deleteOption("cpu-select", item.cpu_name);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("cpu-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("cpu-select");
      }
      attachEditDeleteHandlers("cpu-select-options", "CPU");

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

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt("Edit RAM:", item.ram_type);
          if (newValue) {
            editOption("ram-select", item.ram_type, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.ram_type}"?`)) {
            deleteOption("ram-select", item.ram_type);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("ram-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("ram-select");
      }
      attachEditDeleteHandlers("ram-select-options", "RAM");

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

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt("Edit OS:", item.os_name);
          if (newValue) {
            editOption("os-select", item.os_name, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.os_name}"?`)) {
            deleteOption("os-select", item.os_name);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("os-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("os-select");
      }
      attachEditDeleteHandlers("os-select-options", "Operating System");

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

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt("Edit Generation:", item.generation_number);
          if (newValue) {
            editOption("generation-select", item.generation_number, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.generation_number}"?`)) {
            deleteOption("generation-select", item.generation_number);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("generation-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("generation-select");
      }
      attachEditDeleteHandlers("generation-select-options", "Processor Generation");

    });
}



function openAddOptionPopup(targetId) {
  // نحدد النص المناسب حسب الـ id
  let label = "New Option";
  if (targetId === "ram-select") label = "RAM";
  else if (targetId === "cpu-select") label = "CPU";
  else if (targetId === "os-select") label = "Operating System";
  else if (targetId === "drive-select") label = "Hard Drive Type";
  else if (targetId === "ram-size-select") label = "RAM Size";

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
  fetch("http://localhost:5050/add-option-external-ticket", {
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
        else if (targetId === "drive-select") fetchDrives();
        else if (targetId === "cpu-select") fetchCPU();
        else if (targetId === "generation-select") fetchProcessorGen();
        else if (targetId === "drive-select") fetchDrives();
        else if (targetId === "ram-size-select") fetchRAMSize();

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
      const container = document.getElementById("device-type-options");
      const selectedDisplay = document.getElementById("selected-device-type");
      const hiddenInput = document.getElementById("device-type");

      container.innerHTML = "";

      // ✅ Add "+ Add New Device Type" option first
      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `
        <div class="dropdown-option-text">+ Add New Device Type</div>
      `;
      addNewRow.onclick = () => {
        openGenericPopup("Device Type", "device-type");
        closeAllDropdowns();
      };
      container.appendChild(addNewRow);

      // ✅ Render other device types
      data.forEach((item) => {
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
        
          const type = item.DeviceType.trim().toLowerCase();
        };
        

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        // ✏️ Edit icon
        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt("Edit Device Type:", item.DeviceType);
          if (newValue && newValue.trim() !== item.DeviceType) {
            editOption("problem-type", item.DeviceType, newValue.trim()); // ✅ استخدم editOption مباشرة
          }
        };

        // 🗑️ Delete icon
        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          deleteOption("problem-type", item.DeviceType);
        };
        

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        container.appendChild(row);
      });
      attachEditDeleteHandlers("device-type-options", "problem-type");

    })
    .catch(err => {
      console.error("❌ Failed to fetch device types:", err);
    });
}







function toggleDropdown(toggleEl) {
  const content = toggleEl.nextElementSibling;
  const isOpen = content.style.display === "block";
  closeAllDropdowns();
  if (!isOpen) {
    content.style.display = "block";
    const input = content.querySelector(".dropdown-search");
    input.value = "";
    filterDropdown(input, content.querySelector(".dropdown-options").id);
  }
}

function filterDropdown(input, optionsContainerId) {
  const filter = input.value.toLowerCase();
  const rows = document.getElementById(optionsContainerId).querySelectorAll(".dropdown-option-row");
  rows.forEach(row => {
    const text = row.querySelector(".dropdown-option-text").textContent.toLowerCase();
    row.style.display = text.includes(filter) ? "flex" : "none";
  });
}

function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-content").forEach(d => d.style.display = "none");
}

document.addEventListener(" ", () => {
  document.addEventListener("click", e => {
    if (!e.target.closest(".custom-dropdown-wrapper")) {
      closeAllDropdowns();
    }
  });
});

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
  const type = document.getElementById("device-type")?.value?.toLowerCase();
  const deptInput = document.getElementById("section");
  const dept = deptInput?.dataset.name; // 🛠 نقرأ الـ Name وليس الـ ID
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
    if (["pc", "printer", "scanner"].includes(type)) {
      updatePopupHeadingAndFields(type);
      popup.style.display = "flex";
    } else {
      openGenericPopup("Device Specification", "device-spec");
    }
    closeAllDropdowns();
  };
  optionsContainer.appendChild(addNewRow);

  // 🛠 الاتصال بالسيرفر باستخدام اسم القسم
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

      // ✅ Restore previous selection from sessionStorage if exists
      const saved = sessionStorage.getItem("device-spec");
      if (saved) {
        const match = data.find(d => String(d.id) === String(saved)); // 🛠 نحول الاثنين لنص عشان تتطابق
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

document.addEventListener("DOMContentLoaded", () => {
  fetchDeviceTypes();
  fetchDepartments("section");

  const typeDropdown = document.getElementById("device-type");
  const sectionDropdown = document.getElementById("section");

  if (typeDropdown && sectionDropdown) {
    typeDropdown.addEventListener("change", () => {
      fetchDeviceSpecsByTypeAndDepartment();
      
      const type = typeDropdown?.value?.toLowerCase();
    });

    sectionDropdown.addEventListener("change", () => {
      fetchDeviceSpecsByTypeAndDepartment();
    });
  }

  const optionsContainer = document.getElementById("device-spec-options");

  if (optionsContainer) {
    optionsContainer.addEventListener("click", (e) => {
      const row = e.target.closest(".dropdown-option-row");
      if (!row) return;

      const value = row.textContent.trim();
      if (value === "+ Add New Specification") {
        const type = typeDropdown?.value?.toLowerCase();
      
        if (!type) {
          console.log("❌ نوع الجهاز غير محدد");
          alert("❌ اختر نوع الجهاز أولاً");
          return;
        }
        
        if (["pc", "printer", "scanner"].includes(type)) {
          console.log("✅ فتح بوب أب المواصفات لنوع:", type);
          updatePopupHeadingAndFields(type);
          document.getElementById("popup-modal").style.display = "flex";
        } else {
          console.log("🔁 فتح بوب أب generic للجهاز من نوع:", type);
          openGenericPopup("Device Specification", "device-spec");
        }
      }        
    });
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
  async function submitExternalTicket(data) {
    try {
      const response = await fetch("http://localhost:5050/external-ticket-with-file", {
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
  console.log("🔍 Submitted Data:", data);


  submitExternalTicket(data);
});
function mapSelectIdToServerTarget(selectId) {
  const map = {
    "device-type": "problem-type",
    "technical-status": "technical",
    "problem-status": "problem-status",
    "section": "section",
    "spec-department": "section",
    "spec-model": "model",
    "model-pc": "model",
    "model-printer": "model",
    "model-scanner": "model",
    "drive-select": "drive-select",
    "cpu-select": "cpu-select",
    "ram-select": "ram-select",
    "ram-size-select": "ram-size-select",

    "os-select": "os-select",
    "generation-select": "generation-select",
    "device-spec": "device-spec"
  };

  return map[selectId] || selectId;
}


function deleteOption(selectId, value, type = null) {
  if (!value) {
    alert("❌ Please select a valid option to delete.");
    return;
  }

  if (!confirm(`❗ Are you sure you want to delete "${value}"?`)) {
    return;
  }

  fetch("http://localhost:5050/delete-option-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: mapSelectIdToServerTarget(selectId), value, type })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
      } else {
        alert(result.message);

        // ✅ بعد الحذف، نحدث القائمة بالكامل
        refreshDropdown(selectId);
      }
    })
    .catch(err => {
      console.error("❌ Error deleting option:", err);
      alert("❌ Failed to delete option");
    });
}
function refreshDropdown(selectId) {
  if (selectId === "problem-type") {
    fetchDeviceTypes();
  } else if (selectId === "section" || selectId.startsWith("department-")) {
    fetchDepartments(selectId);
  } else if (selectId === "ram-select") {
    fetchRAM();
  } else if (selectId === "ram-size-select") {
    fetchRAMSize();
  }
   else if (selectId === "cpu-select") {
    fetchCPU();
  } else if (selectId === "os-select") {
    fetchOS();
  } else if (selectId === "drive-select") {
    fetchDrives();
  } else if (selectId === "generation-select") {
    fetchProcessorGen();
  } else if (selectId.startsWith("model-")) {
    const type = selectId.replace("model-", "");
    fetchAndRenderModels(type, selectId);
  } else if (selectId === "device-spec") {
    fetchDeviceSpecsByTypeAndDepartment();
  } 

  // -------------------
  else {
    console.warn(`❓ Unknown selectId for refreshing: ${selectId}`);
  }
}


function editOption(selectId, oldValue, newValue, type = null) {
  if (!oldValue || !newValue) {
    alert("❌ Please select and enter a valid value to edit.");
    return;
  }

  fetch("http://localhost:5050/update-option-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: mapSelectIdToServerTarget(selectId), oldValue, newValue, type })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
      } else {
        alert(result.message);

        // ✅ بعد التعديل، نرجع نحمل البيانات من السيرفر من جديد
        refreshDropdown(selectId);
      }
    })
    .catch(err => {
      console.error("❌ Error editing option:", err);
      alert("❌ Failed to edit option");
    });
}




function attachEditDeleteHandlers(optionsContainerId, type = null) {
  const optionsContainer = document.getElementById(optionsContainerId);

  if (!optionsContainer) {
    console.error(`❌ Cannot find options container for: ${optionsContainerId}`);
    return;
  }

  const rows = optionsContainer.querySelectorAll(".dropdown-option-row:not(.add-new-option)");

  rows.forEach(row => {
    const textEl = row.querySelector(".dropdown-option-text");
    let iconsContainer = row.querySelector(".dropdown-actions-icons");

    if (!iconsContainer) {
      iconsContainer = document.createElement("div");
      iconsContainer.className = "dropdown-actions-icons";

      const editIcon = document.createElement("i");
      editIcon.className = "fas fa-edit";
      editIcon.title = "Edit";
      editIcon.style.cursor = "pointer";
      editIcon.onclick = (e) => {
        e.stopPropagation();
        const oldValue = textEl.textContent.trim();
        const newValue = prompt(`Edit "${oldValue}"`, oldValue);
        if (newValue && newValue.trim() !== oldValue) {
          editOption(optionsContainerId.replace("-options", ""), oldValue, newValue.trim(), type);
        }
      };

      const deleteIcon = document.createElement("i");
      deleteIcon.className = "fas fa-trash";
      deleteIcon.title = "Delete";
      deleteIcon.style.cursor = "pointer";
      deleteIcon.onclick = (e) => {
        e.stopPropagation();
        const valueToDelete = textEl.textContent.trim();
          deleteOption(optionsContainerId.replace("-options", ""), valueToDelete, type);
        
      };

      iconsContainer.appendChild(editIcon);
      iconsContainer.appendChild(deleteIcon);
      row.appendChild(iconsContainer);
    }
  });
}



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
<button onclick="closeGenericPopup(true); event.stopPropagation()">Cancel</button>          </div>
        </div>
      `;
      

        popup.style.display = "flex";
        requestAnimationFrame(() => fetchDepartments("spec-department"));


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
<button onclick="closeGenericPopup(true); event.stopPropagation()">Cancel</button>
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
+   <button onclick="closeGenericPopup(true); event.stopPropagation()">Cancel</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}

function openAddSectionPopup(contextId = "section") {
  sessionStorage.setItem("addSectionContext", contextId);

  // ✅ نضيف هذا الجزء لتحديد إذا جاي من بوب أب المواصفات
  const origin = document.getElementById("generic-popup-target-id")?.value;
  if (origin === "device-spec") {
    sessionStorage.setItem("returnToPopup", "true");
    sessionStorage.setItem("popupContext", "device-spec"); // سياق مواصفات
  }

  const popup = document.getElementById("generic-popup");

  popup.innerHTML = `
    <div class="popup-content">
      <h3>Add New Section</h3>
      <label>Section Name:</label>
      <input type="text" id="new-section-name" placeholder="Enter section name" />
      <input type="hidden" id="generic-popup-target-id" value="section" />

      <div class="popup-buttons">
        <button onclick="saveNewSection()">Save</button>
        <button onclick="closeGenericPopup(true); event.stopPropagation()">Cancel</button>
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
        return;
      }

      alert(result.message);

      // ✅ نحفظ الموديل مؤقتاً
      sessionStorage.setItem("lastAddedModel", modelName);

      // ✅ نحدث القائمة
      fetchAndRenderModels(deviceType, `model-${deviceType}`);

      // ✅ لو سياق popup المواصفات → نحدث أيضًا قائمة spec-model
      const isSpecContext = sessionStorage.getItem("returnToPopup") === "true";
      if (isSpecContext) {
        fetchAndRenderModels(deviceType, "spec-model");
      
        // بعد التحديث نحط القيمة يدويًا
        setTimeout(() => {
          const displaySpan = document.getElementById(`selected-spec-model`);
          const hiddenInput = document.getElementById(`spec-model`);
          if (displaySpan && hiddenInput) {
            displaySpan.textContent = modelName;
            hiddenInput.value = modelName;
          }
        }, 300);
      }
      

      // ✅ إغلاق البوب أب
      document.getElementById("generic-popup").style.display = "none";
      sessionStorage.removeItem("returnToPopup");

      // ✅ إذا الجهاز غير معروف → نرجع للمواصفات
      if (!["pc", "printer", "scanner"].includes(deviceType)) {
        setTimeout(() => {
          openGenericPopup("Device Specification", "device-spec");
        }, 150);
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
  const departmentInput = document.getElementById("spec-department");
  const department = departmentInput.dataset.name || departmentInput.value.trim();
    const deviceType = document.getElementById("device-type").value.toLowerCase();
  const dropdown = document.getElementById("device-spec");

  if (!ministry || !name || !model || !serial || !department || !deviceType) {
    alert("❌ Please fill all fields.");
    return;
  }

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
        sessionStorage.setItem("spec-saved", "true"); // ✅ هذي الإضافة المهمة


        // ✅ أضف الجهاز الجديد للدروب داون
        const option = document.createElement("option");
        option.value = result.insertedId;
        option.textContent = `${name} | ${serial} | ${ministry}`;
        dropdown.appendChild(option);
        dropdown.value = result.insertedId;

        // ✅ عدل النص الظاهر
        const displaySpan = document.getElementById("selected-device-spec");
        if (displaySpan) {
          displaySpan.textContent = option.textContent;
        }
        sessionStorage.removeItem("returnToPopup");

        // ✅ حدث القائمة
        fetchDeviceSpecsByTypeAndDepartment();

        // ✅ نظف الحقول
        ["spec-ministry", "spec-name", "spec-model", "spec-serial", "spec-department"].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = "";
        });

        // ✅ أغلق البوب أب مرة وحدة بس
        document.getElementById("generic-popup").style.display = "none";

        // ✅ امسح الفلاج عشان ما يفتح البوب أب مرة ثانية
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

function closeGenericPopup(cancelled = false) {
  if (cancelled) {
    const returnToSpec = sessionStorage.getItem("returnToPopup");
    const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
  
    // ✅ إذا كنا راجعين من بوب أب المواصفات لنوع جهاز غير معروف
    if (returnToSpec === "true" && !["pc", "printer", "scanner"].includes(deviceType)) {
      sessionStorage.removeItem("returnToPopup");
      setTimeout(() => {
        openGenericPopup("Device Specification", "device-spec");
      }, 100);
    } else {
      sessionStorage.removeItem("returnToPopup");
      document.getElementById("generic-popup").style.display = "none";
    }
    return;
  }
  
  const popup = document.getElementById("generic-popup");
  popup.style.display = "none";

  const returnToSpec = sessionStorage.getItem("returnToPopup");
  const popupContext = sessionStorage.getItem("popupContext");
  const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
  const lastDropdownId = sessionStorage.getItem("lastDropdownOpened");
  const deviceSpecValue = document.getElementById("device-spec")?.value;

  const fieldsToPreserve = ["spec-ministry", "spec-name", "spec-serial", "spec-model", "spec-department"];
  fieldsToPreserve.forEach(id => {
    const el = document.getElementById(id);
    if (el) sessionStorage.setItem(id, el.value);
  });

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

  // ✅ فقط إذا كان من سياق المواصفات وبعد الحفظ، نرجع
  if (
    popupContext === "device-spec" &&
    returnToSpec === "true" &&
    !cancelled &&
    (!deviceSpecValue || deviceSpecValue === "add-custom") &&
    !["pc", "printer", "scanner"].includes(deviceType) &&
    lastDropdownId !== "section" &&
    !sessionStorage.getItem("spec-saved")
  ) {
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

  // 🧹 تنظيف بعد الإغلاق
  sessionStorage.removeItem("returnToPopup");
  sessionStorage.removeItem("popupContext");

  ["spec-ministry", "spec-name", "spec-serial", "spec-model", "spec-department", "lastAddedModel"]
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

  fetch("http://localhost:5050/add-option-external-ticket", {
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

