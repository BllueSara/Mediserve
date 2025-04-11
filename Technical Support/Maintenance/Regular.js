// =============================================
// Main Elements Selection
// =============================================
const deviceTypeSelect = document.getElementById("device-type"); // Dropdown for device type selection
const deviceSpecSelect = document.getElementById("device-spec"); // Dropdown for device specifications
const popup = document.getElementById("popup-modal"); // Popup modal element
const popupHeading = popup.querySelector("#popup-title"); // Popup title element
const popupForm = document.getElementById("pc-spec-form"); // Form inside popup
const popupFieldsContainer = document.getElementById("popup-fields"); // Container for dynamic form fields

// =============================================
// Event Listeners Initialization
// =============================================
if (deviceTypeSelect) {
  // When device type changes, reset the specifications dropdown
  deviceTypeSelect.addEventListener("change", function () {
    deviceSpecSelect.value = "";
  });
}

if (deviceSpecSelect) {
  // When "Add Custom" is selected in specifications
  deviceSpecSelect.addEventListener("change", function () {
    if (this.value === "add-custom") {
      popup.style.display = "flex"; // Show the popup
      updatePopupHeadingAndFields(deviceTypeSelect.value); // Update fields based on device type
    }
  });
}

// =============================================
// Popup Management Functions
// =============================================

/**
 * Updates popup content based on selected device type
 * @param {string} type - The device type (pc, printer, scanner)
 */
function updatePopupHeadingAndFields(type) {
  popupFieldsContainer.innerHTML = ""; // Clear existing fields
  const typeCleaned = type.trim().toLowerCase(); // Normalize device type string

  // PC Device Fields
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
    // Load all necessary dropdowns for PC
    fetchCPU();
    fetchRAM();
    fetchOS();
    fetchProcessorGen();
    fetchmodel();
    fetchDepartments("department-pc");
  }
  // Printer Device Fields
  else if (typeCleaned === "printer") {
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
  }
  // Scanner Device Fields
  else if (typeCleaned === "scanner") {
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
  }
  // Default Case
  else {
    popupHeading.textContent = "Enter Device Specifications";
    popupFieldsContainer.innerHTML = "<p>No fields available for this device type.</p>";
  }
}

/**
 * Closes the popup and resets form
 */
function closePopup() {
  popup.style.display = "none";
  popupForm.reset();
  deviceSpecSelect.value = "";
}

// =============================================
// Data Saving Functions
// =============================================

/**
 * Saves PC specifications to server
 */
function savePCSpec() {
  const data = new FormData(popupForm); // Get form data
  const deviceData = {}; // Initialize data object
  data.forEach((value, key) => {
    deviceData[key] = value; // Convert FormData to object
  });

  const deviceType = document.getElementById("device-type").value.toLowerCase(); // Get device type

  // Send data to server
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
        alert("❌ Failed to save: " + result.error);
      }
    })
    .catch(err => {
      console.error("❌ Server connection error:", err);
      alert("❌ Server connection error. Make sure server is running");
    });
}

// =============================================
// Data Fetching Functions
// =============================================

/**
 * Fetches departments from server
 * @param {string} selectId - ID of the select element to populate
 */
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

/**
 * Fetches CPU types from server
 */
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

/**
 * Fetches PC models from server
 */
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

/**
 * Fetches printer models from server
 */
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

/**
 * Fetches scanner models from server
 */
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

/**
 * Fetches RAM types from server
 */
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

/**
 * Fetches OS types from server
 */
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

/**
 * Fetches processor generations from server
 */
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

/**
 * Fetches device types from server
 */
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

// =============================================
// Initialization on Page Load
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  fetchDeviceTypes(); // Load device types
  fetchDepartments("section"); // Load departments

  // Set up event listeners for dynamic dropdowns
  const typeDropdown = document.getElementById("device-type");
  const sectionDropdown = document.getElementById("section");

  if (typeDropdown && sectionDropdown) {
    typeDropdown.addEventListener("change", fetchDeviceSpecsByTypeAndDepartment);
    sectionDropdown.addEventListener("change", fetchDeviceSpecsByTypeAndDepartment);
  }
});

// =============================================
// Utility Functions
// =============================================

/**
 * Fetches devices by type and department
 */
function fetchDeviceSpecsByTypeAndDepartment() {
  const type = document.getElementById("device-type").value.toLowerCase();
  const dept = document.getElementById("section").value;
  const dropdown = document.getElementById("device-spec");

  if (!type || !dept) return; // Exit if type or department not selected

  fetch(`http://localhost:5050/devices/${type}/${encodeURIComponent(dept)}`)
    .then(res => res.json())
    .then(data => {
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
        option.value = `${device.Serial_Number} - ${name} - ${device.Governmental_Number}`;
        option.textContent = `${name} | ${device.Serial_Number} | ${device.Governmental_Number}`;
        dropdown.appendChild(option);
      });
    })
    .catch(err => {
      console.error("❌ Error fetching specs:", err);
    });
}

/**
 * Sets up dropdown handlers for custom options
 */
function setupDropdownHandlers() {
  document.querySelectorAll("select").forEach(select => {
    select.addEventListener("change", function() {
      if (this.value === "add-custom") {
        const label = this.previousElementSibling?.textContent?.replace("*", "").trim() || "Option";
        popup.style.display = "flex";
        popupHeading.textContent = `Add New ${label}`;
        popupFieldsContainer.innerHTML = `
          <input type="text" id="custom-input" placeholder="Enter ${label.toLowerCase()}" required>
        `;
        popup.setAttribute("data-target-select", this.id);
        this.value = "";
      }
    });
  });
}