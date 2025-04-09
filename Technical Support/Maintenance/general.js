document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:5050/TypeProplem")
      .then(res => res.json())
      .then(data => {
        console.log("TypeProplem data:", data);
        const dropdown = document.getElementById("problem-type");
        data.forEach(item => {
          const option = document.createElement("option");
          option.value = item.DeviceType;
          option.textContent = item.DeviceType;
          dropdown.appendChild(option);
        });
      })
      .catch(err => console.error("❌ Error fetching DeviceType:", err));
  });
  

  document.addEventListener("DOMContentLoaded", ()=> {
    fetch("http://localhost:5050/floors")
    .then(res => res.json())
    .then(data => {
        const dropdown = document.getElementById("floor");
        data.forEach(item => {
            const option = document.createElement("option");
            option.value = item.FloorNum;
            option.textContent = item.FloorNum;
            dropdown.appendChild(option);
        });
    })
    .catch(err => console.error("❌ Error fetching DeviceType:", err));
  })


  document.addEventListener("DOMContentLoaded", ()=> {
    fetch("http://localhost:5050/Technical")
    .then(res => res.json())
    .then(data => {
        const dropdown = document.getElementById("technical");
        data.forEach(item => {
            const option = document.createElement("option");
            option.value = item.name;
            option.textContent = item.name;
            dropdown.appendChild(option);
        });
    })
    .catch(err => console.error("❌ Error fetching DeviceType:", err));
  })

  document.addEventListener("DOMContentLoaded", ()=> {
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
    })
    .catch(err => console.error("❌ Error fetching DeviceType:", err));
  })


  document.addEventListener("DOMContentLoaded", () => {
    const deviceType = document.getElementById("problem-type"); // هذا الحقل يختار نوع الجهاز
    const problemStatus = document.getElementById("problem-status"); // هذا الحقل يعرض المشاكل
  
    if (deviceType && problemStatus) {
      deviceType.addEventListener("change", () => {
        const selected = deviceType.value.toLowerCase(); // pc / printer / scanner
        let endpoint = "";
  
        if (selected === "pc") endpoint = "/problem-states/pc";
        else if (selected === "printer") endpoint = "/problem-states/printer";
        else if (selected === "scanner") endpoint = "/problem-states/scanner";
        else return;
  
        // تنظيف القائمة
        problemStatus.innerHTML = `<option value="" disabled selected>Select status</option>`;
  
        // سحب المشاكل
        fetch(`http://localhost:5050${endpoint}`)
          .then(res => res.json())
          .then(data => {
            data.forEach(item => {
              const option = document.createElement("option");
              option.value = item.problem_text;
              option.textContent = item.problem_text;
              problemStatus.appendChild(option);
            });
          })
          .catch(err => {
            console.error("❌ Failed to fetch problems:", err);
          });
      });
    }
  });
  