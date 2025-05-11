// add.js

window.addEventListener("DOMContentLoaded", () => {
    loadDeviceTypes();
    loadDepartments();
  
    // Watch for device type change
    document.getElementById("device-type-options").addEventListener("click", () => {
      const selectedDeviceType = document.getElementById("device-type").value.toLowerCase();
      loadSpecsByDeviceType(selectedDeviceType);
    });
  });
  
  const token = localStorage.getItem("token");
  
  function loadDeviceTypes() {
    fetch("http://localhost:5050/TypeProplem", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById("device-type-options");
        container.innerHTML = "";
  
        const types = data.deviceTypes || [];
  
        if (!Array.isArray(types)) {
          console.error("Invalid response for device types:", data);
          return;
        }
  
        types.forEach(type => {
          const row = document.createElement("div");
          row.classList.add("dropdown-option");
          row.innerHTML = `
            <span>${type.DeviceType}</span>
            <div class="option-icons">
              <img src="/icon/edit.png" class="icon-btn" title="Edit" onclick="editDeviceType('${type.DeviceType}', ${type.id})">
              <img src="/icon/trash.png" class="icon-btn" title="Delete" onclick="deleteDeviceType(${type.id})">
            </div>
          `;
          row.addEventListener("click", () => {
            document.getElementById("selected-device-type").textContent = type.DeviceType;
            document.getElementById("device-type").value = type.DeviceType;
            container.parentElement.style.display = "none";
            loadSpecsByDeviceType(type.DeviceType.toLowerCase());
          });
          container.appendChild(row);
        });
      })
      .catch(err => console.error("Failed to load device types:", err));
  }
  
  
  
  
  function loadDepartments() {
    fetch("http://localhost:5050/Departments", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById("section-options");
        container.innerHTML = "";
  
        if (!Array.isArray(data)) {
          console.error("Invalid response for departments:", data);
          return;
        }
  
        data.forEach(dep => {
          const row = document.createElement("div");
          row.classList.add("dropdown-option");
          row.innerHTML = `
            <span>${dep.name}</span>
            <div class="option-icons">
              <img src="/icon/edit.png" class="icon-btn" onclick="editDepartment('${dep.name}', ${dep.id})">
              <img src="/icon/trash.png" class="icon-btn" onclick="deleteDepartment(${dep.id})">
            </div>
          `;
          row.onclick = () => {
            document.getElementById("selected-section").textContent = dep.name;
            document.getElementById("section").value = dep.name;
            container.parentElement.style.display = "none";
          };
          container.appendChild(row);
        });
      })
      .catch(err => console.error("Failed to load departments:", err));
  }
  
  
  function loadSpecsByDeviceType(type) {
    const specsContainer = document.getElementById("device-specifications");
    specsContainer.innerHTML = "";
  
    const pcTypes = ["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"];
  
    if (pcTypes.includes(type)) {
      specsContainer.innerHTML = `
        <label>Device Name</label>
        <input type="text" name="device-name" id="pc-name" required>
  
        <label>Serial Number</label>
        <input type="text" name="serial" required>
  
        <label>Ministry Number</label>
        <input type="text" name="ministry-id" required>
  
        <label>MAC Address</label>
        <input type="text" name="mac-address" id="mac-address">
  
        <label>Processor Generation</label>
        <select name="generation_number" required id="generation"></select>
  
        <label>CPU</label>
        <select name="processor" required id="cpu"></select>
  
        <label>RAM Type</label>
        <select name="ram" required id="ram"></select>
  
        <label>Hard Drive Type</label>
        <select name="drive" required id="drive"></select>
  
        <label>Model</label>
        <select name="model" required id="model"></select>
  
        <label>Operating System</label>
        <select name="os" required id="os"></select>
  
        <label>RAM Size</label>
        <select name="ram_size" required id="ram-size"></select>
      `;
  
      fetchSpecs("cpu", "CPU_Types", "cpu_name");
      fetchSpecs("ram", "RAM_Types", "ram_type");
      fetchSpecs("ram-size", "RAM_Sizes", "ram_size");
      fetchSpecs("os", "OS_Types", "os_name");
      fetchSpecs("drive", "Hard_Drive_Types", "drive_type");
      fetchSpecs("generation", "Processor_Generations", "generation_number");
      fetchSpecs("model", "PC_Model", "model_name");
  
    } else if (type === "printer") {
      specsContainer.innerHTML = `
        <label>Printer Name</label>
        <input type="text" name="device-name" required>
  
        <label>Serial Number</label>
        <input type="text" name="serial" required>
  
        <label>Ministry Number</label>
        <input type="text" name="ministry-id" required>
  
        <label>Ink Serial Number</label>
        <input type="text" name="ink-serial-number" required>
  
        <label>Printer Type</label>
        <select name="printer_type" required id="printer-type"></select>
  
        <label>Ink Type</label>
        <select name="ink_type" required id="ink-type"></select>
  
        <label>Model</label>
        <select name="model" required id="model"></select>
      `;
  
      fetchSpecs("printer-type", "Printer_Types", "printer_type");
      fetchSpecs("ink-type", "Ink_Types", "ink_type");
      fetchSpecs("model", "Printer_Model", "model_name");
  
    } else if (type === "scanner") {
      specsContainer.innerHTML = `
        <label>Scanner Name</label>
        <input type="text" name="device-name" required>
  
        <label>Serial Number</label>
        <input type="text" name="serial" required>
  
        <label>Ministry Number</label>
        <input type="text" name="ministry-id" required>
  
        <label>Model</label>
        <select name="model" required id="model"></select>
      `;
  
      fetchSpecs("model", "Scanner_Model", "model_name");
    }
  }
  
  
  function fetchSpecs(selectId, table, column) {
    fetch(`http://localhost:4000/options?table=${table}&column=${column}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const select = document.getElementById(selectId);
        if (!Array.isArray(data)) {
          console.error(`Invalid data for ${table}:`, data);
          return;
        }
  
        data.forEach(item => {
          const option = document.createElement("option");
          option.value = item[column];
          option.textContent = item[column];
          select.appendChild(option);
        });
      })
      .catch(err => console.error(`Error fetching ${table}:`, err));
  }
  
  // Dropdown toggle handler
  function toggleDropdown(trigger) {
    const dropdownContent = trigger.nextElementSibling;
    const isVisible = dropdownContent.style.display === "block";
  
    // Close all
    document.querySelectorAll('.dropdown-content').forEach(el => el.style.display = 'none');
  
    // Toggle current
    if (!isVisible) dropdownContent.style.display = "block";
  }
  
  // Optional: filter function if not already defined
  function filterDropdown(input, containerId) {
    const filter = input.value.toLowerCase();
    const options = document.getElementById(containerId).querySelectorAll("div");
    options.forEach(opt => {
      opt.style.display = opt.textContent.toLowerCase().includes(filter) ? "block" : "none";
    });
  }
  

  function promptAddDeviceType() {
    document.getElementById("deviceTypeModal").style.display = "flex";
  }
  
  function promptAddSection() {
    document.getElementById("sectionModal").style.display = "flex";
  }
  
  function closeModal(id) {
    document.getElementById(id).style.display = "none";
  }
  
  function saveNewDeviceType() {
    const value = document.getElementById("newDeviceTypeInput").value.trim();
    if (!value) return;
  
    fetch("http://localhost:5050/add-device-type", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ type: value })
    })
    .then(res => res.json())
    .then(data => {
      if (data.message?.includes("added")) {
        closeModal("deviceTypeModal");
        document.getElementById("newDeviceTypeInput").value = "";
        loadDeviceTypes();
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    })
    .catch(err => console.error("Error saving device type:", err));
  }
  
  
  function saveNewSection() {
    const value = document.getElementById("newSectionInput").value.trim();
    if (!value) return;
  
    fetch("http://localhost:5050/add-department", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name: value })
    })
    .then(res => res.json())
    .then(data => {
      if (data.message.includes("added")) {
        closeModal("sectionModal");
        document.getElementById("newSectionInput").value = "";
        loadDepartments(); // reload list
      }
    })
    .catch(err => console.error("Error saving department:", err));
  }




  
  
  