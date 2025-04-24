// ✅ MAIN LOGIC - DOM READY

let currentDropdownId = "";

document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("upload-file");
  const fileLabel = document.querySelector(".upload-box");
  const saveButton = document.querySelector(".submit-btn");
  const ticketTypeSelect = document.getElementById("ticket-type");
  const customTypeContainer = document.getElementById("custom-type-container");
  const customTypeInput = document.getElementById("custom-ticket-type");
  const ticketNumberInput = document.getElementById("ticket-number");
  const deviceTypeSelect = document.getElementById("device-type");
  const departmentSelect = document.getElementById("department");
  const specSelect = document.getElementById("device-specification");

  ticketNumberInput.readOnly = true;
  ticketNumberInput.value = "";

  // Load dropdowns
  loadTicketTypes();
  loadReportStatuses();
  loadDepartments();
  loadDeviceTypes();
  loadDeviceSpecifications();
  loadTechnicals();

  ticketTypeSelect.addEventListener("change", onTicketTypeChange);
  departmentSelect.addEventListener("change", updateDeviceSpecifications);
  deviceTypeSelect.addEventListener("change", () => {
    updateDeviceSpecifications();
    updateDiagnosisOptions();
  });

  fileLabel.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileChange);

  ["dragenter", "dragover", "dragleave", "drop"].forEach(evt =>
    fileLabel.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
    })
  );

  fileLabel.addEventListener("dragover", () => fileLabel.classList.add("drag-over"));
  ["dragleave", "drop"].forEach(evt =>
    fileLabel.addEventListener(evt, () => fileLabel.classList.remove("drag-over"))
  );

  fileLabel.addEventListener("drop", e => {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
  });

  const backButton = document.querySelector(".back-button");
  if (backButton) {
    backButton.addEventListener("click", e => {
      e.preventDefault();
      window.history.back();
    });
  }

  saveButton.addEventListener("click", handleSubmit);

  // + Add New option logic
  document.querySelectorAll("select").forEach(select => {
    select.addEventListener("change", function () {
      if (this.value === "add-custom") {
        currentDropdownId = this.id;
        document.getElementById("popup-title").textContent = `Add New ${formatLabel(currentDropdownId)}`;
        document.getElementById("popup-fields").innerHTML = `<input type="text" id="popup-input" placeholder="Enter new ${formatLabel(currentDropdownId)}" />`;
        document.getElementById("popup-modal").style.display = "flex";
      }
    });
  });
});

function loadTicketTypes() {
  fetch("http://localhost:5050/ticket-types")
    .then(res => res.json())
    .then(types => {
      const select = document.getElementById("ticket-type");
      select.innerHTML = '<option value="" disabled selected>Select ticket type</option>';
      types.forEach(type => {
        const option = document.createElement("option");
        option.value = type.type_name;
        option.textContent = type.type_name;
        select.appendChild(option);
      });
      if (!types.find(t => t.type_name.toLowerCase() === "other")) {
        const otherOption = document.createElement("option");
        otherOption.value = "Other";
        otherOption.textContent = "Other";
        select.appendChild(otherOption);
      }
    });
}

function loadReportStatuses() {
  fetch("http://localhost:5050/report-statuses")
    .then(res => res.json())
    .then(statuses => {
      const select = document.getElementById("report-status");
      select.innerHTML = '<option value="" disabled selected>Select report status</option>';
      statuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status.status_name;
        option.textContent = status.status_name;
        select.appendChild(option);
      });
    });
}

function loadDepartments() {
  fetch("http://localhost:5050/Departments")
    .then(res => res.json())
    .then(departments => {
      const select = document.getElementById("department");
      select.innerHTML = "";
      select.appendChild(createOption("", "Select department", true, true));
      select.appendChild(createOption("add-custom", "+ Add New"));
      departments.forEach(dep => {
        select.appendChild(createOption(dep.name, dep.name));
      });
    });
}

function loadDeviceTypes() {
  fetch("http://localhost:5050/TypeProplem")
    .then(res => res.json())
    .then(types => {
      const select = document.getElementById("device-type");
      select.innerHTML = "";
      select.appendChild(createOption("", "Select device type", true, true));
      select.appendChild(createOption("add-custom", "+ Add New"));
      types.forEach(type => {
        select.appendChild(createOption(type.DeviceType, type.DeviceType));
      });
    });
}

function loadDeviceSpecifications() {
  fetch("http://localhost:5050/device-specifications")
    .then(res => res.json())
    .then(specs => {
      const select = document.getElementById("device-specification");
      select.innerHTML = "";
      select.appendChild(createOption("", "Select device specification", true, true));
      select.appendChild(createOption("add-custom", "+ Add New"));
      specs.forEach(spec => {
        select.appendChild(createOption(spec.name, spec.name));
      });
    });
}

function loadTechnicals() {
  fetch("http://localhost:5050/Technical")
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("technical");
      data.forEach(tech => {
        dropdown.appendChild(createOption(tech.name, tech.name));
      });
    });
}

function createOption(value, text, disabled = false, selected = false) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  if (disabled) option.disabled = true;
  if (selected) option.selected = true;
  return option;
}

function onTicketTypeChange() {
  const select = document.getElementById("ticket-type");
  const customTypeContainer = document.getElementById("custom-type-container");
  const customTypeInput = document.getElementById("custom-ticket-type");
  const ticketNumberInput = document.getElementById("ticket-number");

  if (select.value === "Other") {
    customTypeContainer.style.display = "block";
  } else {
    customTypeContainer.style.display = "none";
    customTypeInput.value = "";
  }

  fetch("http://localhost:5050/generate-internal-ticket-number")
    .then(res => res.json())
    .then(data => ticketNumberInput.value = data.ticket_number)
    .catch(() => ticketNumberInput.value = "ERROR");
}

function handleFileChange(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];
  const allowedExtensions = ["pdf", "doc", "docx", "eml"];
  const ext = file?.name?.split(".").pop().toLowerCase();

  const fileLabel = document.querySelector(".upload-box p");
  if (file && !allowedExtensions.includes(ext)) {
    alert("Invalid file type. Only PDF, DOC, DOCX, and EML are allowed.");
    fileInput.value = "";
    fileLabel.textContent = "Drop files here or click to upload";
  } else if (file) {
    fileLabel.textContent = "Selected File: " + file.name;
  }
}

function updateDeviceSpecifications() {
  const department = document.getElementById("department").value;
  const type = document.getElementById("device-type").value;
  const specSelect = document.getElementById("device-specification");

  if (!department || !type || type === "add-custom") return;

  fetch(`http://localhost:5050/device-specifications?department=${encodeURIComponent(department)}&type=${encodeURIComponent(type)}`)
    .then(res => res.json())
    .then(specs => {
      specSelect.innerHTML = "";
      specSelect.appendChild(createOption("", "Select device specification", true, true));
      specSelect.appendChild(createOption("add-custom", "+ Add New"));
      specs.forEach(spec => {
        specSelect.appendChild(createOption(spec.name, spec.name));
      });
    });
}

function updateDiagnosisOptions() {
  const deviceType = document.getElementById("device-type").value;
  const diagnosisSelect = document.getElementById("initial-diagnosis");

  if (!deviceType || deviceType === "add-custom") return;

  let endpoint = "";
  switch (deviceType) {
    case "PC": endpoint = "ProblemStates_Pc"; break;
    case "Printer": endpoint = "ProblemStates_Printer"; break;
    case "Scanner": endpoint = "ProblemStates_Scanner"; break;
    default:
      endpoint = `problemStates_Maintance_device?type=${encodeURIComponent(deviceType)}`;
      break;
  }

  fetch(`http://localhost:5050/${endpoint}`)
    .then(res => res.json())
    .then(problems => {
      diagnosisSelect.innerHTML = "";
      diagnosisSelect.appendChild(createOption("", "Select diagnosis", true, true));
      diagnosisSelect.appendChild(createOption("add-custom", "+ Add New"));
      problems.forEach(p => {
        const text = p.problem_text || p.problemStates_Maintance_device_name;
        diagnosisSelect.appendChild(createOption(text, text));
      });
    });
}

function handleSubmit(event) {
  event.preventDefault();

  const reportNumber = document.querySelector('input[placeholder="Enter report name"]').value.trim();
  const reporterName = document.getElementById("reporter-name")?.value.trim();
  const initialDiagnosis = document.getElementById("initial-diagnosis").value;
  const reportDetails = document.querySelector('textarea[placeholder="Enter detailed description of the issue"]').value.trim();
  const finalDiagnosis = document.querySelector('textarea[placeholder="Enter final diagnosis after investigation"]').value.trim();
  const otherDescription = document.querySelector('textarea[placeholder*="Other"]').value.trim();
  const status = document.getElementById("report-status").value;
  const file = document.getElementById("upload-file").files[0];

  const selectedType = document.getElementById("ticket-type").value;
  const customType = document.getElementById("custom-ticket-type").value.trim();
  const ticketType = selectedType === "Other" ? customType : selectedType;

  if (!ticketType || !initialDiagnosis) {
    alert("Please select ticket type and initial diagnosis.");
    return;
  }

  const formData = new FormData();
  formData.append("report_number", reportNumber);
  formData.append("reporter_name", reporterName || "");
  formData.append("ticket_type", ticketType);
  formData.append("initial_diagnosis", initialDiagnosis);
  formData.append("report_details", reportDetails);
  formData.append("final_diagnosis", finalDiagnosis);
  formData.append("other_description", otherDescription);
  formData.append("status", status);
  if (file) formData.append("attachment", file);

  fetch("http://localhost:5050/internal-ticket-with-file", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "✅ Ticket submitted successfully!");
    })
    .catch(err => {
      console.error("❌ Error:", err);
      alert("❌ Failed to submit ticket.");
    });
}

// Popup handling (Add New)
document.getElementById("popup-save-btn").addEventListener("click", function () {
  const input = document.getElementById("popup-input");
  const value = input.value.trim();
  if (!value) return;

  fetch("http://localhost:5050/add-popup-option", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: currentDropdownId,
      value: value
    })
  })
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById(currentDropdownId);
      if (data.success) {
        const newOption = createOption(value, value);
        select.appendChild(newOption);
        select.value = value;
        closePopup();
      } else {
        alert(data.message || "❌ Failed to add option.");
      }
    })
    .catch(err => {
      console.error("❌ Error:", err);
      alert("❌ Server error while adding option.");
    });
});

function closePopup() {
  document.getElementById("popup-modal").style.display = "none";
  document.getElementById("popup-fields").innerHTML = "";
  currentDropdownId = "";
}

function formatLabel(id) {
  return id.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
