// دوال مساعدة (Helpers)

export function isArabicText(text) {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}

export function labelWithStar(labelText, isRequired = false) {
  return `${labelText}${isRequired ? '<span class="required-star">*</span>' : ''}`;
}

export function cleanLangTag(value) {
  return value.replace(/\s*\[(ar|en)\]$/i, "").trim();
}

export function createLangAwareTransform(field) {
  return (items) => {
    const currentLang = languageManager.currentLang;
    return items
      .filter(item => item && typeof item === "object" && typeof item[field] === "string")
      .filter(item => {
        const raw = item[field].trim();
        const isArabic = raw.endsWith("[ar]");
        const isEnglish = raw.endsWith("[en]");
        const isUnlabeled = !isArabic && !isEnglish;
        return currentLang === "ar"
          ? isArabic || isUnlabeled
          : isEnglish || isUnlabeled;
      })
      .map(item => {
        const raw = typeof item[field] === "string" ? item[field].trim() : "";
        const cleaned = raw.replace(/\s*\[(ar|en)\]$/, "");
        return {
          ...item,
          [field]: cleaned
        };
      });
  };
}

export function detectLangTag(text) {
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  return hasArabic ? "ar" : "en";
}

export function prependAddNewOption(selectElement, value = "add-new", text = "+ Add New") {
  if (!selectElement) return;
  const addNewOption = document.createElement("option");
  addNewOption.value = value;
  addNewOption.textContent = text;
  const options = Array.from(selectElement.options);
  const hasAddNew = options.some(opt => opt.value === value);
  if (!hasAddNew) {
    selectElement.insertBefore(addNewOption, selectElement.firstChild);
  }
}

export function showNotification(message, selectId) {
  const selectElement = document.getElementById(selectId);
  let container = selectElement.closest('.dropdown-container') || selectElement.parentNode;
  const notification = document.createElement('div');
  notification.className = "notification";
  notification.textContent = message;
  notification.style.color = "#d9534f";
  notification.style.fontSize = "14px";
  notification.style.marginTop = "4px";
  container.appendChild(notification);
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

export function applyDeletions(selectId) {
  const persistentKey = `deletedOptions_${selectId}`;
  const deletedOptions = JSON.parse(localStorage.getItem(persistentKey)) || [];
  const select = document.getElementById(selectId);
  for (let i = select.options.length - 1; i >= 0; i--) {
    if (deletedOptions.includes(select.options[i].text)) {
      select.remove(i);
    }
  }
}

export function cleanDropdownError(hiddenInput) {
  if (!hiddenInput) return;
  hiddenInput.classList.remove("input-error");
  const visibleId = hiddenInput.id;
  const displayElement = document.getElementById("selected-" + visibleId);
  const toggle = displayElement?.closest(".dropdown-toggle");
  if (toggle) {
    toggle.style.border = "";
    toggle.style.borderRadius = "";
  }
  let wrapper = document.getElementById(visibleId + "-wrapper") ||
                document.getElementById(visibleId + "-dropdown-wrapper");
  if (!wrapper) {
    const prev = hiddenInput.previousElementSibling;
    if (prev?.classList.contains("custom-dropdown-wrapper")) {
      wrapper = prev;
    }
  }
  if (!wrapper && displayElement) {
    wrapper = displayElement.closest(".custom-dropdown-wrapper");
  }
  const wrapperError = wrapper?.nextElementSibling;
  if (wrapperError && wrapperError.classList.contains("input-error-message")) {
    wrapperError.remove();
  }
  const formField = hiddenInput.closest(".form-field");
  if (formField) {
    const extraErrors = formField.querySelectorAll(".input-error-message");
    extraErrors.forEach(err => err.remove());
    const toggleInside = formField.querySelector(".dropdown-toggle");
    if (toggleInside) {
      toggleInside.style.border = "";
      toggleInside.style.borderRadius = "";
    }
  }
  if (visibleId === "problem-status") {
    const problemOptionsContainer = document.getElementById("problem-status-options");
    if (problemOptionsContainer) {
      const errorMessages = problemOptionsContainer.querySelectorAll(".input-error-message");
      errorMessages.forEach(err => err.remove());
    }
  }
}

export function initInputFieldValidation(formElement) {
  if (!formElement) return;
  const inputs = formElement.querySelectorAll('input[required]:not([type="hidden"])');
  inputs.forEach(input => {
    input.addEventListener("input", () => {
      if (input.value.trim() !== "") {
        input.classList.remove("input-error");
        const msg = input.nextElementSibling;
        if (msg && msg.classList.contains("input-error-message")) {
          msg.remove();
        }
      }
    });
  });
}

export async function checkUserPermissions(userId) {
  if (!userId) {
    userId = localStorage.getItem("userId");
  }
  const userRole = localStorage.getItem("userRole");
  if (userRole === "admin") {
    return {
      device_access: "all",
      view_access: true,
      full_access: true,
      add_items: true,
      edit_items: true,
      delete_items: true,
      check_logs: true,
      edit_permission: true
    };
  }
  try {
    const response = await fetch(`http://localhost:4000/users/${userId}/with-permissions`);
    if (!response.ok) throw new Error('Failed to fetch user permissions');
    const userData = await response.json();
    return {
      device_access: userData.permissions?.device_access || 'none',
      view_access: userData.permissions?.view_access || false,
      full_access: userData.permissions?.full_access || false,
      add_items: userData.permissions?.add_items || false,
      edit_items: userData.permissions?.edit_items || false,
      delete_items: userData.permissions?.delete_items || false,
      check_logs: userData.permissions?.check_logs || false,
      edit_permission: userData.permissions?.edit_permission || false
    };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {
      device_access: 'none',
      view_access: false,
      full_access: false
    };
  }
} 