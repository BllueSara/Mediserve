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
      <input type="text" name="pc-name" required>

      <label>Serial Number:</label>
      <input type="text" name="serial" required>

      <label>Ministry Number:</label>
      <input type="text" name="ministry-id" required>


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
      <select name="model"  id="model-select" required>
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

  }
  else if (typeCleaned === "printer") {
    popupHeading.textContent = "Enter Printer Specifications";
  
    popupFieldsContainer.innerHTML = `
      <label>Printer Name:</label>
      <input type="text" name="device-name" required>
  
      <label>Serial Number:</label>
      <input type="text" name="serial" required>
  
      <label>Ministry Number:</label>
      <input type="text" name="ministry-id" required>
  
      <label>Model:</label>
      <select name="model" id="Model-printer" required>
        <option disabled selected>Select Model</option>
      </select>
    `;
  

    fetchPrinterModel();
  
  }
  else if (typeCleaned === "scanner") {
    popupHeading.textContent = "Enter Scanner Specifications";

    popupFieldsContainer.innerHTML = `
      <label>Scanner Name:</label>
      <input type="text" name="device-name" required>

      <label>Serial Number:</label>
      <input type="text" name="serial" required>

      <label>Ministry Number:</label>
      <input type="text" name="ministry-id" required>

      <label>Model:</label>
      <select name="model" required>
        <option disabled selected>Select Model</option>
      </select>
    `;
  }
  else {
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
  deviceSpecSelect.add(option, deviceSpecSelect.options.length - 1);
  deviceSpecSelect.value = option.value;
  closePopup();
}
function fetchCPU() {
  fetch("http://localhost:5050/CPU_Types")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById("cpu-select");
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
      if (!dropdown) return;
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        dropdown.appendChild(option);
      });
    })
    .catch(err => console.error("❌ Error fetching Printer Models:", err));
}



function fetchRAM() {
  fetch("http://localhost:5050/RAM_Types")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById("ram-select");
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.ram_type;
        option.textContent = item.ram_type;
        select.appendChild(option);
      });
    })
    .catch(error => console.error("❌ RAM fetch error:", error));
}

function fetchOS() {
  fetch("http://localhost:5050/OS_Types")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById("os-select");
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
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.generation_number;
        option.textContent = item.generation_number;
        select.appendChild(option);
      });
    });
}

document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:5050/TypeProplem")
    .then(res => res.json())
    .then(data => {
      console.log("TypeProplem data:", data);
      const dropdown = document.getElementById("device-type");
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.DeviceType;
        option.textContent = item.DeviceType;
        dropdown.appendChild(option);
      });
    })
    .catch(err => console.error("❌ Error fetching DeviceType:", err));
});


document.addEventListener("DOMContentLoaded", () => {
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
    })


    .catch(err => console.error("❌ Error fetching DeviceType:", err));
});

document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:5050/Printer_Model")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("Model-printer");
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.model_name;
        option.textContent = item.model_name;
        dropdown.appendChild(option);
      });

    })


    .catch(err => console.error("❌ Error fetching DeviceType:", err));

});

// تحميل القائمة عند فتح الصفحة
window.addEventListener("DOMContentLoaded", fetchDeviceTypes);