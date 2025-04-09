// ✅ Cleaned Maintenance.js Script

/**
 * Change image on hover
 */
function changeImage(element, newSrc) {
  element.querySelector("img").src = newSrc;
}

// ✅ Go Back Button
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "Maintenance.html";
  }
}

function goHome() {
  window.location.href = "./Home.html";
}



// ✅ Page Redirection
document.querySelectorAll(".option").forEach(option => {
  option.addEventListener("click", function () {
    const page = this.getAttribute("data-page");
    if (page) window.location.href = page;
  });
});

