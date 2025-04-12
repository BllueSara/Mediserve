
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
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        dropdown.appendChild(option);
      });
    });
});

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
  { id: "reporter-name", label: "Reporter Name" }
];

dropdownsWithPopup.forEach(({ id, label }) => {
  const dropdown = document.getElementById(id);
  if (dropdown) {
    dropdown.addEventListener("change", () => {
      if (dropdown.value === "add-custom") {
        openGenericPopup(label, id);
      }
    });
  }
});

function openGenericPopup(label, targetId) {
  popupTitle.textContent = `Add New ${label}`;
  popupFields.innerHTML = `
    <label>${label}:</label>
    <input type="text" id="popup-input" placeholder="Enter ${label}" required>
    <input type="hidden" id="popup-target-id" value="${targetId}">
    
  `;
  popup.style.display = "flex";
}

function closePopup() {
  popup.style.display = "none";
  document.getElementById("popup-input").value = "";
  document.getElementById("popup-target-id").value = "";
}

function saveGenericOption() {
  const value = popupInput.value.trim();
  const targetId = popupTarget.value;
  const dropdown = document.getElementById(targetId);

  if (!value || !dropdown) return;

  fetch("http://localhost:5050/add-options-external", {
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
      console.error("❌ Error saving:", err);
      alert("❌ Error while saving value");
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
    }
  });
}

function generateFieldsForDeviceType(type) {
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
    fetchScannerModel(); fetchDepartments("department-scanner");
  }
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
      if (result.message) {
        alert(result.message);
        closePopup();
        fetchExternalDeviceSpecs();
      } else {
        alert("❌ Failed to save: " + result.error);
      }
    })
    .catch(err => {
      console.error("❌ Error saving device:", err);
      alert("❌ Server connection failed");
    });
}


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
