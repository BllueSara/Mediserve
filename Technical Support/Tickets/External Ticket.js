/**
 * Toggles the visibility of the "Other Department" input field.
 * Shows the input only when the user selects "Other" from the department dropdown.
 */
function toggleOtherDepartment() {
    // Get references to the department dropdown and the custom input field
    var departmentSelect = document.getElementById("departmentSelect");
    var otherDepartment = document.getElementById("otherDepartment");
// 🔙 Back button - navigates to the previous page in history
document.querySelector(".back-button").addEventListener("click", () => window.history.back()); 
    // Check if the selected value is "Other"
    if (departmentSelect.value === "Other") {
        otherDepartment.style.display = "block";          // Show the input field
        otherDepartment.setAttribute("required", "true"); // Make it a required field
    } else {
        otherDepartment.style.display = "none";           // Hide the input field
        otherDepartment.removeAttribute("required");      // Remove required attribute
    }
}




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


