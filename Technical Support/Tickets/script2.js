document.addEventListener("DOMContentLoaded", function() {
    const fileInput = document.getElementById("upload-file");
    const fileLabel = document.querySelector(".upload-container");
    const saveButton = document.querySelector(".save-ticket-button");
  
    fileInput.addEventListener("change", function(event) {
      const file = event.target.files[0];
      if (file) {
        const allowedExtensions = ["pdf", "doc", "docx", "eml"];
        const fileExtension = file.name.split(".").pop().toLowerCase();
  
        if (!allowedExtensions.includes(fileExtension)) {
          alert("Invalid file type. Only PDF, DOC, DOCX, and EML are allowed.");
          fileInput.value = "";
        } else {
          fileLabel.textContent = "Selected File: " + file.name;
        }
      }
    });
  
    saveButton.addEventListener("click", function(event) {
      const ticketNumber = document.querySelector('input[placeholder="Enter ticket number"]').value;
      const reportNumber = document.querySelector('input[placeholder="Enter report number"]').value;
      const reportDetails = document.querySelector('textarea[placeholder="Enter detailed description of the issue"]').value;
  
      if (!ticketNumber || !reportNumber || !reportDetails) {
        event.preventDefault();
        alert("Please fill in all required fields.");
      }
    });
  });
  