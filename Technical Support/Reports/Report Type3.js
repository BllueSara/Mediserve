// Run this script when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Select all elements with the class "option"
  const options = document.querySelectorAll(".option");

  // Loop through each option element
  options.forEach(option => {
    // Add click event listener to each option
    option.addEventListener("click", () => {
      // Get the text content inside the <p> tag, convert it to lowercase
      const label = option.querySelector("p")?.textContent?.toLowerCase();

      // Determine which status to store in localStorage based on the label text
      if (label.includes("open")) {
        localStorage.setItem("reportStatusFilter", "Open");
      } else if (label.includes("in progress")) {
        localStorage.setItem("reportStatusFilter", "In Progress");
      } else if (label.includes("closed")) {
        localStorage.setItem("reportStatusFilter", "Closed");
      }

      // Navigate to the reports search page
      window.location.href = "/Technical Support/Reports/Search reports.html";
    });
  });
});
