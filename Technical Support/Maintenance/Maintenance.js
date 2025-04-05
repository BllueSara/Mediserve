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
    option.addEventListener("click", function() {
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

  document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:5050/pc-specifications")
      .then(response => response.json())
      .then(data => {
        const specDropdown = document.getElementById("device-spec");
        data.forEach(item => {
          const option = document.createElement("option");
          option.value = item.Serial_Number;
          option.textContent = `${item.Computer_Name} (${item.Serial_Number})`;
          specDropdown.appendChild(option);
        });
      })
      .catch(error => {
        console.error("❌ Failed to load device specifications:", error);
      });
  });
  

  document.addEventListener("DOMContentLoaded", () => {
    const typeSelect = document.getElementById("device-type");
    const specSelect = document.getElementById("device-spec");
  
    typeSelect.addEventListener("change", () => {
      const selectedType = typeSelect.value;
  
      // امسح الخيارات القديمة
      specSelect.innerHTML = '<option value="" disabled selected>Select specification</option>';
  
      fetch(`http://localhost:5050/api/devices/specs/${selectedType}`)
        .then(res => res.json())
        .then(data => {
          data.forEach(device => {
            const option = document.createElement("option");
            option.value = device.serial_number;
            option.textContent = device.serial_number;
            specSelect.appendChild(option);
          });
        })
        .catch(err => console.error("❌ Error fetching device specs:", err));
    });
  });
  

  // جلب أنواع الأجهزة ووضعها في خانة "نوع المشكلة"
fetch("http://localhost:5050/api/device-types")
.then(res => res.json())
.then(data => {
  const dropdown = document.getElementById("problem-type");
  data.forEach(type => {
    const option = document.createElement("option");
    option.value = type.type;
    option.textContent = type.type;
    dropdown.appendChild(option);
  });
})
.catch(err => {
  console.error("فشل في تحميل الأنواع:", err);
});


document.addEventListener("DOMContentLoaded", () => {
  const typeDropdown = document.getElementById("device-type");
  const specDropdown = document.getElementById("device-spec");

  if (!typeDropdown || !specDropdown) return;

  // 🔹 Load all device types into dropdown
  fetch("http://localhost:5050/api/device-types")
    .then(res => res.json())
    .then(data => {
      data.forEach(type => {
        const option = document.createElement("option");
        option.value = type.type;
        option.textContent = type.type;
        typeDropdown.appendChild(option);
      });
    });

  // 🔹 When selecting "Printer", load its specs
  typeDropdown.addEventListener("change", () => {
    if (typeDropdown.value !== "Printer") {
      specDropdown.innerHTML = '<option value="" disabled selected>Select printer</option>';
      return;
    }

    fetch("http://localhost:5050/api/devices/by-type/Printer")
      .then(res => res.json())
      .then(data => {
        specDropdown.innerHTML = '<option value="" disabled selected>Select printer</option>';
        data.forEach(printer => {
          const option = document.createElement("option");
          option.value = printer.Serial_Number;
          option.textContent = `${printer.Serial_Number} - ${printer.name}`;
          specDropdown.appendChild(option);
        });
      });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const modelDropdown = document.getElementById("printer-model");
  const detailsDiv = document.getElementById("printer-details");

  // Get printer models
  fetch("http://localhost:5050/api/printers/models")
    .then(res => res.json())
    .then(data => {
      data.forEach(row => {
        const option = document.createElement("option");
        option.value = row.Model;
        option.textContent = row.Model;
        modelDropdown.appendChild(option);
      });
    });

  // When a model is selected, show full printer details
  modelDropdown.addEventListener("change", () => {
    const model = modelDropdown.value;

    fetch(`http://localhost:5050/api/printer/details/${model}`)
      .then(res => res.json())
      .then(data => {
        if (data.length === 0) {
          detailsDiv.innerHTML = "<p>No details found.</p>";
          return;
        }

        // Render details in a table
        const printer = data[0];
        let html = "<table border='1'><tbody>";
        for (const key in printer) {
          html += `<tr><td><strong>${key}</strong></td><td>${printer[key]}</td></tr>`;
        }
        html += "</tbody></table>";
        detailsDiv.innerHTML = html;
      });
  });
});


