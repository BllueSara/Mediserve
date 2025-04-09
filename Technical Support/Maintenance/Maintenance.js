// ✅ Cleaned Maintenance.js Script

/**
 * Change image on hover
 */
function changeImage(element, newSrc) {
  element.querySelector("img").src = newSrc;
}

// ✅ Go Back Button
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "Maintenance.html";
  }
}

// ✅ Page Redirection
document.querySelectorAll(".option").forEach(option => {
  option.addEventListener("click", function () {
    const page = this.getAttribute("data-page");
    if (page) window.location.href = page;
  });
});

// ✅ Device Spec Popup Logic
const deviceTypeSelect = document.getElementById("device-type");
const deviceSpecSelect = document.getElementById("device-spec");
const popup = document.getElementById("popup-modal");
const popupHeading = document.getElementById("popup-title");
const popupForm = document.getElementById("pc-spec-form");
const popupFieldsContainer = document.getElementById("popup-fields");

if (deviceTypeSelect) {
  deviceTypeSelect.addEventListener("change", () => {
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
  const cleaned = type.trim().toLowerCase();

  if (cleaned === "pc") {
    popupHeading.textContent = "Enter PC Specifications";
    popupFieldsContainer.innerHTML = `
      <label>Computer Name:</label>
      <input type="text" name="pc-name" required>
      <label>Serial Number:</label>
      <input type="text" name="serial" required>
      <label>Processor Generation:</label>
      <select name="generation" id="generation-select" required><option disabled selected>Select generation</option></select>
      <label>CPU:</label>
      <select name="processor" id="cpu-select" required><option disabled selected>Select processor</option></select>
      <label>RAM:</label>
      <select name="ram" id="ram-select" required><option disabled selected>Select RAM</option></select>
      <label>Model:</label>
      <select name="model" required><option disabled selected>Select Model</option></select>
      <label>Ministry Number:</label>
      <input type="text" name="ministry-id" required>
      <label>Operating System:</label>
      <select name="os" id="os-select" required><option disabled selected>Select OS</option></select>
    `;
    fetchCPU(); fetchRAM(); fetchOS(); fetchProcessorGen();
  } else if (cleaned === "printer" || cleaned === "scanner") {
    const label = cleaned === "printer" ? "Printer" : "Scanner";
    popupHeading.textContent = `Enter ${label} Specifications`;
    popupFieldsContainer.innerHTML = `
      <label>${label} Name:</label>
      <input type="text" name="device-name" required>
      <label>Serial Number:</label>
      <input type="text" name="serial" required>
      <label>Ministry Number:</label>
      <input type="text" name="ministry-id" required>
      <label>Model:</label>
      <select name="model" required>
        <option disabled selected>Select Model</option>
        <option>HP</option>
        <option>Canon</option>
        <option>Epson</option>
      </select>
    `;
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
  let summary = "";
  for (const [key, value] of data.entries()) {
    summary += `${key}: ${value} | `;
  }
  const option = document.createElement("option");
  option.value = summary;
  option.textContent = "Custom - " + summary.slice(0, -3);
  deviceSpecSelect.add(option);
  deviceSpecSelect.value = option.value;
  closePopup();
}

function fetchAndAppend(url, targetId, fieldName) {
  fetch(url)
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById(targetId);
      if (!dropdown) return;
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item[fieldName];
        option.textContent = item[fieldName];
        dropdown.appendChild(option);
      });
    })
    .catch(err => console.error(`❌ Failed to load ${targetId}:`, err));
}

function fetchCPU() { fetchAndAppend("http://localhost:5050/CPU_Types", "cpu-select", "cpu_name"); }
function fetchRAM() { fetchAndAppend("http://localhost:5050/RAM_Types", "ram-select", "ram_type"); }
function fetchOS()  { fetchAndAppend("http://localhost:5050/OS_Types",  "os-select",  "os_name"); }
function fetchProcessorGen() { fetchAndAppend("http://localhost:5050/Processor_Generations", "generation-select", "generation_number"); }

// ✅ General Dropdowns (Outside Modal)
document.addEventListener("DOMContentLoaded", () => {
  fetchAndAppend("http://localhost:5050/TypeProplem", "problem-type", "DeviceType");
  fetchAndAppend("http://localhost:5050/Departments", "section", "name");
  fetchAndAppend("http://localhost:5050/Technical", "technical", "name");
  fetchAndAppend("http://localhost:5050/floors", "floor", "FloorNum");
  fetchAndAppend("http://localhost:5050/ProblemStates", "problem-status", "ProblemState");
});



const problemTypeSelect = document.getElementById("problem-type");
const problemStatusSelect = document.getElementById("problem-status");

if (problemTypeSelect && problemStatusSelect) {
  problemTypeSelect.addEventListener("change", () => {
    const selectedType = problemTypeSelect.value.toLowerCase(); // pc / printer / scanner

    let endpoint = "";
    if (selectedType === "pc") endpoint = "/problem-states/pc";
else if (selectedType === "printer") endpoint = "/problem-states/printer";
else if (selectedType === "scanner") endpoint = "/problem-states/scanner";


    // Clear current options
    problemStatusSelect.innerHTML = `<option value="" disabled selected>Select status</option>`;

    // Fetch and populate
    fetch(`http://localhost:5050${endpoint}`)
      .then(res => res.json())
      .then(data => {
        data.forEach(item => {
          const option = document.createElement("option");
          option.value = item.problem_text;
          option.textContent = item.problem_text;
          problemStatusSelect.appendChild(option);
        });
      })
      .catch(err => {
        console.error("❌ Failed to load problem states for:", selectedType, err);
      });
  });
}
