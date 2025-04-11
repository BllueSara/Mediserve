// When the page is loaded, fetch device types from the backend
document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:5050/TypeProplem")
      .then(res => res.json()) // Parse response as JSON
      .then(data => {
        console.log("TypeProplem data:", data);
        const dropdown = document.getElementById("device-type"); // Get the device type dropdown
        data.forEach(item => {
          const option = document.createElement("option"); // Create option for each device type
          option.value = item.DeviceType;
          option.textContent = item.DeviceType;
          dropdown.appendChild(option); // Add the option to the dropdown
        });
      })
      .catch(err => console.error("❌ Error fetching DeviceType:", err)); // Log any error
  });
  
  
  // When the page is loaded, fetch departments from the backend
  document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:5050/Departments")
      .then(res => res.json()) // Parse response as JSON
      .then(data => {
        const dropdown = document.getElementById("section"); // Get the department dropdown
        data.forEach(item => {
          const option = document.createElement("option"); // Create option for each department
          option.value = item.name;
          option.textContent = item.name;
          dropdown.appendChild(option); // Add the option to the dropdown
        });
      })
      .catch(err => console.error("❌ Error fetching departments:", err)); // Log any error
  });
  
  
  // When device type or section changes, update device specifications list
  document.getElementById("device-type").addEventListener("change", fetchDeviceSpecsByTypeAndDepartment);
  document.getElementById("section").addEventListener("change", fetchDeviceSpecsByTypeAndDepartment);
  
  
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
          option.value = `${device.Serial_Number} - ${name} - ${device.Governmental_Number}`;
          option.textContent = `${name} | ${device.Serial_Number} | ${device.Governmental_Number}`;
          dropdown.appendChild(option);
        });
      })
      .catch(err => {
        console.error("❌ Error fetching specs:", err); // Log error if request fails
      });
  }
  
  
  // When the page is loaded, fetch technical engineers list
  document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:5050/Technical")
      .then(res => res.json()) // Parse response
      .then(data => {
        const dropdown = document.getElementById("reporter-name"); // Get reporter dropdown
        data.forEach(item => {
          const option = document.createElement("option"); // Create option for each engineer
          option.value = item.name;
          option.textContent = item.name;
          dropdown.appendChild(option); // Add to dropdown
        });
      })
      .catch(err => console.error("❌ Error fetching technical engineers:", err)); // Log any error
  });
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
        })
        .catch((err) => {
          console.error("❌ Error sending data:", err);
          alert("فشل في الإرسال");
        });
    });
  });
  