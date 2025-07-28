// دوال إدارة الأعطال (Problems)
import { checkUserPermissions,isArabicText,cleanDropdownError } from "./helpers.js";
import { closeAllDropdowns, } from "./dropdowns.js";
import { deleteOption } from "./edit.js";
import { showToast, showErrorToast, showSuccessToast, showWarningToast } from "./toast.js";

export async function fetchProblemStatus(deviceType, onFinished) {
  const permissions = await checkUserPermissions();
  const t = languageManager.translations[languageManager.currentLang];

  const container = document.getElementById("problem-status-options");
  const displaySpan = document.getElementById("selected-problem-status");
  const hiddenInput = document.getElementById("problem-status");

  if (!container || !displaySpan || !hiddenInput) {
    console.error("❌ Elements missing for problem status");
    return;
  }

  container.innerHTML = "";

  const isAllDevices = deviceType?.toLowerCase() === "all" || deviceType?.toLowerCase() === "all-devices";

  if (!deviceType || deviceType === "add-custom") {
    const row = document.createElement("div");
    row.className = "dropdown-option-row";
    row.innerHTML = `<div class="dropdown-option-text">${t['select_device_type']}</div>`;
    container.appendChild(row);
    return;
  }

  if (!isAllDevices && (permissions.full_access || permissions.add_items)) {
    const addNewRow = document.createElement("div");
    addNewRow.className = "dropdown-option-row add-new-option";
    addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new']} ${t['problem_status']}</div>`;
    addNewRow.onclick = () => {
      sessionStorage.setItem("lastDropdownOpened", "problem-status");
      openAddProblemStatusPopup(deviceType);
      closeAllDropdowns();
    };
    container.appendChild(addNewRow);
  }

  try {
    const res = await fetch(`http://localhost:4000/problem-states/${encodeURIComponent(deviceType)}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      const row = document.createElement("div");
      row.className = "dropdown-option-row";
      row.innerHTML = `<div class="dropdown-option-text">${t['no_problem_status_found']}</div>`;
      container.appendChild(row);
      return;
    }

    // ✅ متغير لتخزين المشاكل المختارة
    let selectedProblems = [];

    data.forEach(item => {
      const originalText = item.problem_text || item.problemStates_Maintance_device_name || "Unnamed Problem";
      
      // ✅ معالجة خاصة للمشاكل التي تحتوي على "|" (إنجليزي|عربي)
      let displayName = originalText;
      if (originalText.includes("|")) {
        const parts = originalText.split("|").map(s => s.trim());
        const currentLang = languageManager.currentLang;
        if (currentLang === "ar") {
          displayName = parts[1] || parts[0]; // الجزء العربي أو الإنجليزي كبديل
        } else {
          displayName = parts[0]; // الجزء الإنجليزي
        }
      } else {
        // ✅ للمشاكل العادية، استخدم الترجمة
        const translated = translateProblemText(deviceType, originalText);
        displayName = translated.replace(/\s*\[(ar|en)\]$/i, "").trim();
      }

      const value = originalText;

      const currentLang = languageManager.currentLang;
      const isTranslated = translateProblemText(deviceType, originalText) !== originalText;
      const isUserAddedArabic = !isTranslated && isArabicText(originalText);

      const hasArTag = /\[ar\]$/i.test(originalText);
      const hasEnTag = /\[en\]$/i.test(originalText);

      // ✅ فلترة حسب اللغة الحالية والوسم
      if (currentLang === "ar" && hasEnTag) return;
      if (currentLang === "en" && hasArTag) return;

      const row = document.createElement("div");
      row.className = "dropdown-option-row";

      const text = document.createElement("div");
      text.className = "dropdown-option-text";

      text.textContent = isAllDevices
        ? `${displayName} (${item.device_type || deviceType})`
        : displayName;

      // ✅ منطق الاختيار المتعدد - نفس general.js
      text.onclick = () => {
        const existingIndex = selectedProblems.findIndex(p => p.value === value);

        if (existingIndex === -1) {
          selectedProblems.push({ value, label: displayName });
          text.style.backgroundColor = "#d0f0fd";
        } else {
          selectedProblems.splice(existingIndex, 1);
          text.style.backgroundColor = "";
        }

        displaySpan.textContent = selectedProblems.map(p => p.label).join(", ");
        hiddenInput.value = JSON.stringify(selectedProblems.map(p => p.value));
        cleanDropdownError(hiddenInput);
      };

      row.appendChild(text);

      if (permissions.full_access || permissions.edit_items || permissions.delete_items) {
        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        if (permissions.full_access || permissions.edit_items) {
          const editIcon = document.createElement("i");
          editIcon.className = "fas fa-edit";
          editIcon.title = t['edit'];
          editIcon.onclick = (e) => {
            e.stopPropagation();
            openAddProblemStatusPopup(deviceType, originalText);
          };
          icons.appendChild(editIcon);
        }

        if (permissions.full_access || permissions.delete_items) {
          const deleteIcon = document.createElement("i");
          deleteIcon.className = "fas fa-trash";
          deleteIcon.title = t['delete'];
          deleteIcon.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`${t['confirm_delete']} "${displayName}"?`)) {
              deleteOption("problem-status", originalText, deviceType);
            }
          };
          icons.appendChild(deleteIcon);
        }

        row.appendChild(icons);
      }

      container.appendChild(row);
    });

    // ✅ Call callback after loading
    if (typeof onFinished === "function") onFinished();

  } catch (err) {
    console.error("❌ Failed to fetch problem statuses:", err);
    const row = document.createElement("div");
    row.className = "dropdown-option-row";
    row.innerHTML = `<div class="dropdown-option-text">${t['failed_to_load']}</div>`;
    container.appendChild(row);
  }
}

export function openAddProblemStatusPopup(deviceType, oldValue = "") {
  const t = languageManager.translations[languageManager.currentLang];
  let enVal = "", arVal = "";
  if (oldValue && oldValue.includes("|")) {
    [enVal, arVal] = oldValue.split("|").map(s => s.trim());
  } else if (oldValue) {
    const isArabic = /[\u0600-\u06FF]/.test(oldValue);
    if (isArabic) {
      arVal = oldValue;
    } else {
      enVal = oldValue;
    }
  }
  const popup = document.getElementById("generic-popup");
  const isEdit = oldValue && oldValue.trim() !== "";
  const title = isEdit ? `${t['edit']} ${t['problem_status']}` : `${t['add_new']} ${t['problem_status']}`;
  popup.innerHTML = `
    <div class="popup-contentt">
      <h3>${title}</h3>
      <label>${t['problem_status']} (English):</label>
      <input type="text" id="new-problem-status-en" placeholder="${t['problem_status']} (English)" value="${enVal || ''}" />
      <label>${t['problem_status']} (عربي):</label>
      <input type="text" id="new-problem-status-ar" placeholder="${t['problem_status']} (عربي)" value="${arVal || ''}" />
      <input type="hidden" id="old-problem-status-value" value="${oldValue || ''}" />
      <input type="hidden" id="problem-status-device-type" value="${deviceType}" />
      <div class="popup-buttons">
        <button type="button" onclick="saveNewProblemStatus()">${t['save']}</button>
        <button type="button" onclick="closeGenericPopup()">${t['cancel']}</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}

export function saveNewProblemStatus() {
  const t = languageManager.translations[languageManager.currentLang];
  const en = document.getElementById("new-problem-status-en").value.trim();
  const ar = document.getElementById("new-problem-status-ar").value.trim();
  const oldValue = document.getElementById("old-problem-status-value")?.value.trim();
  const deviceType = document.getElementById("problem-status-device-type")?.value;
  if (!en || !ar) {
    showErrorToast("❌ الرجاء إدخال المشكلة بالإنجليزي والعربي.");
    return;
  }
  const rawName = `${en}|${ar}`;
  if (oldValue) {
    fetch("http://localhost:4000/update-option-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({
        target: "problem-status",
        oldValue: oldValue,
        newValue: rawName,
        type: deviceType
      })
    })
      .then(res => res.json())
      .then(result => {
        if (result.error) {
          showErrorToast(result.error);
        } else {
          fetchProblemStatus(deviceType, () => {
            const displaySpan = document.getElementById("selected-problem-status");
            const hiddenInput = document.getElementById("problem-status");
            const displayName = languageManager.currentLang === "ar" ? ar : en;
            if (displaySpan) displaySpan.textContent = displayName;
            if (hiddenInput) {
              let currentProblems = [];
              try {
                const currentValue = hiddenInput.value;
                if (currentValue) {
                  currentProblems = JSON.parse(currentValue);
                }
              } catch (e) {
                currentProblems = [];
              }
              const oldIndex = currentProblems.indexOf(oldValue);
              if (oldIndex !== -1) {
                currentProblems[oldIndex] = rawName;
              } else {
                currentProblems.push(rawName);
              }
              hiddenInput.value = JSON.stringify(currentProblems);
            }
          });
          closeGenericPopup();
        }
      })
      .catch(err => {
        console.error("❌ Error updating problem status:", err);
        showErrorToast(t['failed_to_save'] || "Failed to update problem status");
      });
    return;
  }
  fetch("http://localhost:4000/add-options-regular", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({
      target: "problem-status",
      value: rawName,
      type: deviceType
    })
  })
    .then(res => res.status === 204 ? {} : res.json())
    .then(result => {
      if (result.error) {
        showErrorToast(result.error);
      } else {
        const parts = rawName.split("|").map(p => p.trim());
        const en = parts[0] || "";
        const ar = parts[1] || "";
        const displayName = languageManager.currentLang === "ar" ? (ar || en) : en;
        fetchProblemStatus(deviceType, () => {
          const displaySpan = document.getElementById("selected-problem-status");
          const hiddenInput = document.getElementById("problem-status");
          displaySpan.textContent = displayName;
          if (hiddenInput) {
            let currentProblems = [];
            try {
              const currentValue = hiddenInput.value;
              if (currentValue) {
                currentProblems = JSON.parse(currentValue);
              }
            } catch (e) {
              currentProblems = [];
            }
            if (!currentProblems.includes(rawName)) {
              currentProblems.push(rawName);
            }
            hiddenInput.value = JSON.stringify(currentProblems);
          }
        });
        closeGenericPopup();
      }
    })
    .catch(err => {
      console.error("❌ Error saving problem status:", err);
      showErrorToast(t['failed_to_save'] || "Failed to save problem status");
    });
} 
window.saveNewProblemStatus = saveNewProblemStatus