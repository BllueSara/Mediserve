// دوال إدارة القوائم المنسدلة (Dropdowns)
import { checkUserPermissions, cleanDropdownError } from "./helpers.js";

export async function renderDropdownOptions({
  endpoint,
  containerId,
  displayId,
  inputId,
  labelKey,
  itemKey, // ممكن تكون string أو دالة
  storageKey,
  onAddNew,
  onEditOption,
  onDeleteOption,
  onSelectOption,
  transformData // ← أضف هذا
}) {
  const permissions = await checkUserPermissions();
  const res = await fetch(endpoint);
  let data = await res.json();

  // ✅ دعم التحويل (الترجمة)
  if (typeof transformData === "function") {
    data = transformData(data);
  }
  const container = document.getElementById(containerId);
  const display = document.getElementById(displayId);
  const input = document.getElementById(inputId);
  const lang = languageManager?.currentLang || 'en';
  const t = languageManager?.translations?.[lang] || {};

  if (!container || !display || !input) {
    console.warn(`❌ عناصر الدروب داون ناقصة: ${containerId}, ${displayId}, ${inputId}`);
    return;
  }

  container.innerHTML = "";

  // ✅ زر الإضافة - فقط إذا كان عنده صلاحية
  if ((permissions.full_access || permissions.add_items) && onAddNew) {
    const addNewRow = document.createElement("div");
    addNewRow.className = "dropdown-option-row add-new-option";
    addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new'] || 'Add New'} ${t[labelKey] || labelKey}</div>`;
    addNewRow.onclick = () => {
      sessionStorage.setItem("lastDropdownOpened", inputId);
      onAddNew();
      closeAllDropdowns();
    };
    container.appendChild(addNewRow);
  }

  // ✅ العناصر
  data.forEach(item => {
    // استخراج الـ ID والاسم للعنصر
    const value = typeof itemKey === 'function'
      ? itemKey(item)           // إذا كان itemKey دالة، نستخدم نتيجتها
      : item[itemKey];          // وإلا نأخذ الحقل باسم itemKey

    // إذا كانت قيمة value كائن { id, name }
    const internalId   = typeof value === 'object' ? value.id   : null;
    const displayText  = typeof value === 'object' ? value.name : value;
    const actualValue  = typeof value === 'object' ? value.name : value;

    const row = document.createElement("div");
    row.className = "dropdown-option-row";

    const text = document.createElement("div");
    text.className = "dropdown-option-text";
    text.textContent = displayText;

    // عند الضغط على اسم المهندس
    text.onclick = () => {
      // ✅ للحقول الأخرى، استخدم المنطق العادي
      display.textContent = displayText;

      if (inputId === "technical-status") {
        input.dataset.id = internalId || "";
        input.dataset.name = actualValue;
        input.value = internalId || "";
        console.log("✅ تم تحديد المهندس:", actualValue, "ID:", internalId);
      } else {
        input.value = actualValue;
      }

      if (onSelectOption) onSelectOption(actualValue, item);

      cleanDropdownError(input);
      closeAllDropdowns();
    };

    const icons = document.createElement("div");
    icons.className = "dropdown-actions-icons";

    // ✏️ تعديل
    if (permissions.full_access || permissions.edit_items) {
      const editIcon = document.createElement("i");
      editIcon.className = "fas fa-edit";
      editIcon.title = t['edit'] || "Edit";
      editIcon.onclick = (e) => {
        e.stopPropagation();
        // تمرير القيمة الكاملة عند التعديل
        if (inputId === "section" || inputId === "spec-department") {
          onEditOption?.(item.fullName || actualValue);
        } else if (inputId === "technical-status"|| inputId === "technical") {
          onEditOption?.(item.fullName || actualValue);
        } else {
          onEditOption?.(actualValue);
        }
      };
      icons.appendChild(editIcon);
    }

    // 🗑️ حذف
    if (permissions.full_access || permissions.delete_items) {
      const deleteIcon = document.createElement("i");
      deleteIcon.className = "fas fa-trash";
      deleteIcon.title = t['delete'] || "Delete";
      deleteIcon.onclick = (e) => {
        e.stopPropagation();
        onDeleteOption?.(value);
      };
      icons.appendChild(deleteIcon);
    }

    row.appendChild(text);
    row.appendChild(icons);
    container.appendChild(row);
  });

  // ✅ استرجاع القيمة المحفوظة
  const saved = sessionStorage.getItem(storageKey || inputId);
  if (saved) {
    const allRows = container.querySelectorAll(".dropdown-option-row");
    for (const row of allRows) {
      const textEl = row.querySelector(".dropdown-option-text");
      if (textEl?.textContent?.trim() === saved.trim()) {
        textEl.click();  // ← هذا ينفذ الكود اللي يحفظ dataset.id
        break;
      }
    }

    sessionStorage.removeItem(storageKey || inputId);
  }

  attachEditDeleteHandlers(containerId, t[labelKey] || labelKey);
}

export function toggleDropdown(toggleEl) {
  const content = toggleEl.nextElementSibling;
  const isOpen = content.style.display === "block";
  closeAllDropdowns();
  if (!isOpen) {
    content.style.display = "block";
    const input = content.querySelector(".dropdown-search");
    input.value = "";
    filterDropdown(input, content.querySelector(".dropdown-options").id);
  }
}

export function filterDropdown(input, optionsContainerId) {
  const filter = input.value.toLowerCase();
  const rows = document.getElementById(optionsContainerId).querySelectorAll(".dropdown-option-row");

  rows.forEach(row => {
    const textEl = row.querySelector(".dropdown-option-text");
    if (!textEl) {
      row.style.display = "none"; // 🔥 إذا مافي نص، أخفِ العنصر
      return;
    }

    const text = textEl.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? "flex" : "none";
  });
}

export function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-content").forEach(d => d.style.display = "none");
}

export function attachEditDeleteHandlers(optionsContainerId, type = null) {
  const optionsContainer = document.getElementById(optionsContainerId);

  if (!optionsContainer) {
    console.error(`❌ Cannot find options container for: ${optionsContainerId}`);
    return;
  }

  const rows = optionsContainer.querySelectorAll(".dropdown-option-row:not(.add-new-option)");

  rows.forEach(row => {
    const textEl = row.querySelector(".dropdown-option-text");
    let iconsContainer = row.querySelector(".dropdown-actions-icons");

    if (!iconsContainer) {
      iconsContainer = document.createElement("div");
      iconsContainer.className = "dropdown-actions-icons";

      const editIcon = document.createElement("i");
      editIcon.className = "fas fa-edit";
      editIcon.title = "Edit";
      editIcon.style.cursor = "pointer";
      editIcon.onclick = (e) => {
        e.stopPropagation();
        const oldValue = textEl.textContent.trim();
        const selectId = optionsContainerId.replace("-options", "");
        
        console.log(`✏️ Edit clicked for ${selectId}: "${oldValue}"`);
        
        // استخدام الدالة الجديدة للمهندس والقسم
        if (selectId === "section" || selectId === "spec-department" || selectId === "technical-status" || selectId === "problem-status") {
          console.log(`🔄 Using enhanced edit for ${selectId}`);
          // استخدم النص المعروض للبحث عن الاسم الكامل
          editOptionWithFullName(selectId, oldValue, null, type);
        } else {
          // للمجالات الأخرى، استخدم المنطق العادي
          console.log(`📝 Using standard edit for ${selectId}`);
          const newValue = prompt(`Edit "${oldValue}"`, oldValue);
          if (newValue && newValue.trim() !== oldValue) {
            editOption(selectId, oldValue, newValue.trim(), type);
          }
        }
      };

      const deleteIcon = document.createElement("i");
      deleteIcon.className = "fas fa-trash";
      deleteIcon.title = "Delete";
      deleteIcon.style.cursor = "pointer";
      deleteIcon.onclick = (e) => {
        e.stopPropagation();
        const valueToDelete = textEl.textContent.trim();
        const selectId = optionsContainerId.replace("-options", "");
        console.log(`🗑️ Delete clicked for ${selectId}: "${valueToDelete}"`);
        deleteOption(selectId, valueToDelete, type);
      };

      iconsContainer.appendChild(editIcon);
      iconsContainer.appendChild(deleteIcon);
      row.appendChild(iconsContainer);
    }
  });
} 