/**
 * Toggles the visibility of the "Other Department" input field.
 * Shows the input only when the user selects "Other" from the department dropdown.
 */
function toggleOtherDepartment() {
  // Get references to the department dropdown and the custom input field
  var departmentSelect = document.getElementById("departmentSelect");
  var otherDepartment = document.getElementById("otherDepartment");
// 🔙 Back button - navigates to the previous page in history
document.querySelector(".back-button").addEventListener("click", () => window.history.back()); 
  // Check if the selected value is "Other"
  if (departmentSelect.value === "Other") {
      otherDepartment.style.display = "block";          // Show the input field
      otherDepartment.setAttribute("required", "true"); // Make it a required field
  } else {
      otherDepartment.style.display = "none";           // Hide the input field
      otherDepartment.removeAttribute("required");      // Remove required attribute
  }
}



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

// Function to open the popup modal with validation and prefill the data from the dropdown


// Function to close the popup modal
function closePopup() {
document.getElementById('popup-modal').style.display = 'none';
}

// Function to toggle the display of the search container for the dropdown
function toggleSearch(dropdownId) {
var searchContainer = document.getElementById('search-container-' + dropdownId);
if (!searchContainer) return;

if (searchContainer.style.display === 'none' || searchContainer.style.display === '') {
    searchContainer.style.display = 'block';
    var searchInput = document.getElementById('search-' + dropdownId);
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    // Reset dropdown options when search is toggled on
    resetDropdownOptions(dropdownId);
} else {
    searchContainer.style.display = 'none';
    resetDropdownOptions(dropdownId);
}
}

// Function to filter the dropdown options based on the input value
function filterDropdown(dropdownId) {
var searchInput = document.getElementById('search-' + dropdownId);
var filterValue = searchInput.value.toLowerCase();
var selectElement = document.getElementById(dropdownId);

// Execute filtering for each option in the select element
for (var i = 0; i < selectElement.options.length; i++) {
    var option = selectElement.options[i];
    if (option.text.toLowerCase().indexOf(filterValue) > -1) {
        option.style.display = '';
    } else {
        option.style.display = 'none';
    }
}
}

// Function to reset the dropdown options to display all options
function resetDropdownOptions(dropdownId) {
var selectElement = document.getElementById(dropdownId);
for (var i = 0; i < selectElement.options.length; i++) {
    selectElement.options[i].style.display = '';
}
}

// Function to delete the selected option from the dropdown
function deleteOption(dropdownId) {
var selectElement = document.getElementById(dropdownId);
if (!selectElement) return;

var selectedValue = selectElement.value;

if (!selectedValue) {
    var container = selectElement.closest('.dropdown-container');
    if (!container.querySelector('.inline-error')) {
        var errorMsg = document.createElement('span');
        errorMsg.className = 'inline-error';
        errorMsg.innerText = 'You must select from the dropdown.';
        container.appendChild(errorMsg);
        setTimeout(function() {
            errorMsg.remove();
        }, 1500);
    }
    return;
}

for (var i = 0; i < selectElement.options.length; i++) {
    if (selectElement.options[i].value === selectedValue) {
        selectElement.remove(i);
        break;
    }
}

// Reset the dropdown's value to default (usually the first disabled placeholder)
selectElement.selectedIndex = 0;
}

// يقوم بتبديل ظهور الحاوية التي تحتوي على حقل البحث للقائمة المحددة
function toggleSearch(dropdownId) {
// تكون معرف الحاوية لحقل البحث بتنسيق: "search-container-" + dropdownId
var searchContainer = document.getElementById('search-container-' + dropdownId);
if (!searchContainer) return;

// إذا كانت الحاوية مخفية، نقوم بإظهارها وإفراغ الحقل ثم تركيز المؤشر عليها
if (searchContainer.style.display === 'none' || searchContainer.style.display === '') {
  searchContainer.style.display = 'block';
  var searchInput = document.getElementById('search-' + dropdownId);
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }
  // عند إظهار البحث نعيد كل الخيارات إلى وضعها الطبيعي
  resetDropdownOptions(dropdownId);
} else {
  // إذا كانت مرئية بالفعل، نقوم بإخفائها وإعادة القائمة الأصلية
  searchContainer.style.display = 'none';
  resetDropdownOptions(dropdownId);
}
}

// يقوم بتصفية الخيارات في القائمة بناءً على قيمة حقل البحث
function filterDropdown(dropdownId) {
var searchInput = document.getElementById('search-' + dropdownId);
var filterValue = searchInput.value.toLowerCase();
var selectElement = document.getElementById(dropdownId);

// نفّذ التصفية لكل خيار في القائمة
for (var i = 0; i < selectElement.options.length; i++) {
  var option = selectElement.options[i];
  // إذا احتوى النص على قيمة البحث، يظهر الخيار؛ وإلا يخفيه
  if (option.text.toLowerCase().indexOf(filterValue) > -1) {
    option.style.display = '';
  } else {
    option.style.display = 'none';
  }
}
}

// تساعد هذه الدالة على إعادة جميع الخيارات للظهور بشكل افتراضي
function resetDropdownOptions(dropdownId) {
var selectElement = document.getElementById(dropdownId);
for (var i = 0; i < selectElement.options.length; i++) {
  selectElement.options[i].style.display = '';
}
}
function deleteOption(dropdownId) {
// استرجاع عنصر الـ select باستخدام المعرف الممرر
var selectElement = document.getElementById(dropdownId);
if (!selectElement) return;

// الحصول على القيمة المختارة في القائمة
var selectedValue = selectElement.value;

if (!selectedValue) {
  // إذا لم يكن هناك قيمة صالحة، نبحث عن الحاوية التي تحتوي على الدروب داون
  var container = selectElement.closest('.dropdown-container');
  // التأكد من عدم وجود رسالة خطأ موجودة بالفعل
  if (!container.querySelector('.inline-error')) {
    var errorMsg = document.createElement('span');
    errorMsg.className = 'inline-error';
    errorMsg.innerText = 'You must select from the dropdown.';
    // Append the error message after the dropdown element
    var container = selectElement.closest('.dropdown-container');
    container.appendChild(errorMsg);
    
    // إزالة رسالة الخطأ بعد 3 ثواني
    setTimeout(function() {
      errorMsg.remove();
    }, 1500);
  }
  return;
}

// إذا كان هناك قيمة مختارة، نقوم بحذف العنصر المطابق من القائمة
for (var i = 0; i < selectElement.options.length; i++) {
  if (selectElement.options[i].value === selectedValue) {
    selectElement.remove(i);
    break;
  }
}

// إعادة تعيين القيمة الافتراضية للقائمة (عادة يكون الخيار الأول المُعطل)
selectElement.selectedIndex = 0;
}

// 📌 لما المستخدم يختار "+ Add New Section" من القائمة
document.getElementById("section").addEventListener("change", function () {
  if (this.value === "add-custom") {
    this.selectedIndex = 0; // ترجع الاختيار
    showSectionPopup();     // تفتح البوب أب
  }
});

// 📌 دالة لعرض البوب أب وإعداده
function showSectionPopup() {
  document.getElementById("popup-title").textContent = "Add New Section";

  const popupFields = document.getElementById("popup-fields");
  popupFields.innerHTML = `
    <label for="popup-input">Section:</label>
    <input type="text" id="popup-input" placeholder="Enter new section name">
  `;

  document.getElementById("popup-modal").style.display = "flex";

  setTimeout(() => document.getElementById("popup-input").focus(), 100);
}

// 📌 دالة لإغلاق البوب أب
function closePopup() {
  document.getElementById("popup-modal").style.display = "none";
}

// 📌 حفظ القسم الجديد داخل الـ dropdown + حفظه في السيرفر
document.getElementById("popup-save-btn").addEventListener("click", function () {
  const input = document.getElementById("popup-input");
  const newValue = input.value.trim();
  const dropdown = document.getElementById("section");

  if (newValue === "") {
    alert("❌ Please enter a valid section name");
    return;
  }

  // تحقق إذا القسم موجود مسبقًا في الواجهة
  const exists = Array.from(dropdown.options).some(opt => opt.value === newValue);
  if (exists) {
    alert("⚠️ This section already exists");
    return;
  }

  // ✅ أرسل الاسم للسيرفر لحفظه في قاعدة البيانات
  fetch("http://localhost:5050/add-department", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ value: newValue })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      alert("❌ " + data.error);
      return;
    }

    // ✅ أضف القسم الجديد للقائمة في الواجهة
    const option = document.createElement("option");
    option.value = newValue;
    option.textContent = newValue;

    const addOptionIndex = Array.from(dropdown.options).findIndex(opt => opt.value === "add-custom");
    if (addOptionIndex !== -1) {
      dropdown.insertBefore(option, dropdown.options[addOptionIndex]);
    } else {
      dropdown.appendChild(option);
    }

    // حدده كقيمة مختارة
    dropdown.value = newValue;
    dropdown.dispatchEvent(new Event("change", { bubbles: true }));

    // أغلق النافذة
    closePopup();
  })
  .catch(err => {
    console.error("❌ Error saving section:", err);
    alert("❌ Failed to save to server");
  });
});


// 🟰 تحميل قائمة الأقسام من السيرفر عند بداية الصفحة
fetch("http://localhost:5050/Departments")
    .then(res => res.json()) // 🟰 تحويل الرد إلى JSON
    .then(data => {
      const sectionDropdown = document.getElementById("section");

// 🟰 إضافة كل قسم للقائمة
      data.forEach(item => {
        const option = document.createElement("option"); // 🟰 إنشاء خيار (Option)
        option.value = item.name; // 🟰 قيمة الخيار هي اسم القسم
        option.textContent = item.name; // 🟰 قيمة الخيار هي اسم القسم
        sectionDropdown.appendChild(option);  // 🟰 إضافة الخيار للقائمة
      
      });
    })
    .catch(err => console.error("Error loading sections:" , err)); // 🟰 طباعة أي خطأ إذا فشل الجلب




// 🟰 تحميل قائمة الأقسام من السيرفر عند بداية الصفحة
fetch("http://localhost:5050/TypeProplem")
.then(res => res.json()) // 🟰 تحويل الرد إلى JSON
.then(data => {
  const deviceType = document.getElementById("device-type");

// 🟰 إضافة كل قسم للقائمة
  data.forEach(item => {
    const option = document.createElement("option"); // 🟰 إنشاء خيار (Option)
    option.value = item.DeviceType; // 🟰 قيمة الخيار هي اسم القسم
    option.textContent = item.DeviceType; // 🟰 قيمة الخيار هي اسم القسم
    deviceType.appendChild(option);  // 🟰 إضافة الخيار للقائمة
  
  });
})
.catch(err => console.error("Error loading sections:" , err)); // 🟰 طباعة أي خطأ إذا فشل الجلب



  // ✅ تحميل السبسفيكيشن حسب القسم والجهاز
function loadSpecifications() {
  const section = document.getElementById("section")?.value;
  const type = document.getElementById("device-type")?.value;
  const specDropdown = document.getElementById("specification");

  if (!section || !type || section === "add-custom" || type === "add-custom") return;

  fetch(`http://localhost:5050/devices/${type}/${section}`)
    .then(res => res.json())
    .then(data => {
      specDropdown.innerHTML = `<option disabled selected value="">Select Specification</option>`;
      
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        specDropdown.appendChild(option);
      });

      // Add the "+ Add New" option
      const addNewOption = document.createElement("option");
      addNewOption.value = "add-custom";
      addNewOption.textContent = "+ Add New Specification";
      specDropdown.appendChild(addNewOption);
    })
    .catch(err => console.error("❌ Error loading specifications:", err));
}




document.getElementById("section").addEventListener("change", loadSpecifications);
document.getElementById("device-type").addEventListener("change", loadSpecifications);



document.getElementById("specification").addEventListener("change", function () {
  if (this.value === "add-custom") {
    this.selectedIndex = 0;
    showPopup("Add New Specification", "specification");
  }
});


function showPopup(title, targetDropdownId) {
  document.getElementById("popup-title").textContent = title;
  document.getElementById("popup-fields").innerHTML = `
    <label for="popup-input">${title}:</label>
    <input type="text" id="popup-input" placeholder="Enter ${title.toLowerCase()}">
    <input type="hidden" id="popup-target" value="${targetDropdownId}">
  `;
  document.getElementById("popup-modal").style.display = "flex";
  setTimeout(() => document.getElementById("popup-input").focus(), 100);
}



document.getElementById("popup-save-btn").addEventListener("click", function () {
  const input = document.getElementById("popup-input").value.trim();
  const target = document.getElementById("popup-target").value;
  const dropdown = document.getElementById(target);

  if (!input) {
    alert("❌ Please enter a valid value");
    return;
  }

  const exists = Array.from(dropdown.options).some(opt => opt.value === input);
  if (exists) {
    alert("⚠️ This value already exists");
    return;
  }

  let endpoint = "";
  if (target === "section") endpoint = "add-department";
  else if (target === "device-type") endpoint = "add-device-type";
  else if (target === "specification") endpoint = "add-specification";

  // NOTE: تأكد أن لديك هذه الـ endpoints في الـ backend
  fetch(`http://localhost:5050/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: input })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("❌ " + data.error);
        return;
      }

      const option = document.createElement("option");
      option.value = input;
      option.textContent = input;

      const addIndex = Array.from(dropdown.options).findIndex(opt => opt.value === "add-custom");
      if (addIndex !== -1) dropdown.insertBefore(option, dropdown.options[addIndex]);
      else dropdown.appendChild(option);

      dropdown.value = input;
      dropdown.dispatchEvent(new Event("change", { bubbles: true }));

      closePopup();
    })
    .catch(err => {
      console.error("❌ Save failed:", err);
      alert("❌ Failed to save to server");
    });
});


// ✅ تحديث عرض الحقول حسب نوع الجهاز المختار
document.getElementById("device-type").addEventListener("change", function () {
  const type = this.value.toLowerCase();

  const specFields = [
    "processor-generation-row",
    "cpu-row",
    "ram-row",
    "hdd-row",
    "os-row"
  ];

  // إظهار الكل فقط للـ PC
  if (type === "pc") {
    specFields.forEach(id => document.getElementById(id).style.display = "block");
  } else {
    specFields.forEach(id => document.getElementById(id).style.display = "none");
  }

  // تحميل المواصفات حسب النوع والقسم
  loadSpecifications();
});
