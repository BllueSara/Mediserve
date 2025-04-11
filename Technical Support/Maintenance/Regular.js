const deviceTypeSelect = document.getElementById("device-type");
const deviceSpecSelect = document.getElementById("device-spec");
const popup = document.getElementById("popup-modal");
const popupHeading = popup.querySelector("#popup-title");
const popupForm = document.getElementById("pc-spec-form");
const popupFieldsContainer = document.getElementById("popup-fields");

if (deviceTypeSelect) {
  deviceTypeSelect.addEventListener("change", function () {
    deviceSpecSelect.value = "";
  });
}

if (deviceSpecSelect) {
  deviceSpecSelect.addEventListener("change", function () {
    if (this.value === "add-custom") {
      popup.style.display = "flex";
      updatePopupHeadingAndFields(deviceTypeSelect.value);
    }
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
    fetchmodel();
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
    fetchPrinterModel();
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
    fetchScannerModel();
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
        closePopup();
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
      select.innerHTML = '<option value="">Select Department</option>';
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

function fetchmodel() {
  fetch("http://localhost:5050/PC_Model")
    .then(response => response.json())
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
      const dropdown = document.getElementById("Model-printer");
      dropdown.innerHTML = '<option disabled selected>Select Model</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        dropdown.appendChild(option);
      });
    });
}
function fetchScannerModel() {
  fetch("http://localhost:5050/Scanner_Model")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("model-scanner");
      dropdown.innerHTML = '<option disabled selected>Select Model</option>';
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        dropdown.appendChild(option);
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

