function toggleOtherDepartment() {
    var departmentSelect = document.getElementById("departmentSelect");
    var otherDepartment = document.getElementById("otherDepartment");

    if (departmentSelect.value === "Other") {
        otherDepartment.style.display = "block";
        otherDepartment.setAttribute("required", "true");
    } else {
        otherDepartment.style.display = "none";
        otherDepartment.removeAttribute("required");
    }
}
