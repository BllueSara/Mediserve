/**
 * Function to change the image source when hovering over an option.
 * @param {HTMLElement} element - The parent div containing the image.
 * @param {string} newSrc - The new image source to apply.
 */
function changeImage(element, newSrc) {
  element.querySelector("img").src = newSrc; // Updates the `src` attribute of the image inside the hovered element
}


// Redirect to the correct maintenance page based on `data-page` attribute
document.querySelectorAll(".option").forEach(option => {
  option.addEventListener("click", function () {
    const page = this.getAttribute("data-page"); // Retrieves the page name from `data-page`
    if (page) {
      window.location.href = page; // Redirects the user to the selected maintenance page
    }
  });
});

/**
 * Function to navigate back to the previous page.
 * If no previous page is available in history, redirects to the main Maintenance page.
 */
function goBack() {
  if (window.history.length > 1) {
    window.history.back(); // Navigates to the previous page in browser history
  } else {
    window.location.href = "Maintenance.html"; // Redirects to Maintenance home if there's no previous page
  }
}


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
      <select name="model" required>
        <option disabled selected>Select Model</option>
      </select>

      <label>Ministry Number:</label>
      <input type="text" name="ministry-id" required>

      <label>Operating System:</label>
      <select name="os" id="os-select" required>
        <option disabled selected>Select OS</option>
      </select>
    `;

    fetchCPU();
    fetchRAM();
    fetchOS();
    fetchProcessorGen();
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
      <select name="model" required>
        <option disabled selected>Select Model</option>
        <option>HP</option>
        <option>Canon</option>
        <option>Epson</option>
      </select>
    `;
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
        <option>HP</option>
        <option>Canon</option>
        <option>Epson</option>
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


fetch("http://localhost:5050/floors")
  .then(response => response.json())
  .then(data => {
    const floorDropdown = document.getElementById("floor");
    data.forEach(floor => {
      const option = document.createElement("option");
      option.value = floor.FloorNum;
      option.textContent = floor.FloorNum;
      floorDropdown.appendChild(option);
    });
  })
  .catch(error => {
    console.error("❌ Failed to load floors:", error);
  })


fetch("http://localhost:5050/Technical")
  .then(response => response.json())
  .then(data => {
    const techDropdown = document.getElementById("technical");
    data.forEach(engineer => {
      const option = document.createElement("option");
      option.value = engineer.name;
      option.textContent = engineer.name;
      techDropdown.appendChild(option);
    });
  })
  .catch(error => {
    console.error("❌ Failed to load engineers:", error);
  });


fetch("http://localhost:5050/TypeProplem")
  .then(response => response.json())
  .then(data => {
    const typeDropdown = document.getElementById("problem-type");
    data.forEach(type => {
      const option = document.createElement("option");
      option.value = type.DeviceType;
      option.textContent = type.DeviceType;
      typeDropdown.appendChild(option);
    });
  })
  .catch(error => {
    console.error("❌ Failed to load device types:", error);
  });


fetch("http://localhost:5050/ProblemStates")
  .then(response => response.json())
  .then(data => {
    const stateDropdown = document.getElementById("problem-status");
    data.forEach(state => {
      const option = document.createElement("option");
      option.value = state.ProblemState;
      option.textContent = state.ProblemState;
      stateDropdown.appendChild(option);
    });
  })
  .catch(error => {
    console.error("❌ Failed to load problem states:", error);
  });



fetch("http://localhost:5050/Departments")
  .then(response => response.json())
  .then(data => {
    const sectionDropdown = document.getElementById("section");
    data.forEach(Departments => {
      const option = document.createElement("option");
      option.value = Departments.name;
      option.textContent = Departments.name;
      sectionDropdown.appendChild(option);
    });
  })
  .catch(error => {
    console.error("❌ Failed to load sections:", error);
  });


fetch("http://localhost:5050/TypeProplem")
  .then(response => response.json())
  .then(data => {
    const typeDropdown = document.getElementById("device-type");
    data.forEach(type => {
      const option = document.createElement("option");
      option.value = type.DeviceType;
      option.textContent = type.DeviceType;
      typeDropdown.appendChild(option);
    });
  })
  .catch(error => {
    console.error("❌ Failed to load device types:", error);
  });

