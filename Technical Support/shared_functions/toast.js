// Toast Notification Utility
// This file provides a modern toast notification system to replace alert() calls

// Toast Notification Styles
const toastStyles = `
/* Toast Notification Styles */
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.toast {
    background-color: #333;
    color: #fff;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.4;
}

.toast.success {
    background-color: #28a745;
    border-left: 4px solid #1e7e34;
}

.toast.error {
    background-color: #dc3545;
    border-left: 4px solid #c82333;
}

.toast.info {
    background-color: #17a2b8;
    border-left: 4px solid #138496;
}

.toast.warning {
    background-color: #ffc107;
    color: #212529;
    border-left: 4px solid #e0a800;
}

/* تفعيل التوست عند إضافته */
.toast.show {
    opacity: 1;
    transform: translateX(0);
}

.toast.hide {
    opacity: 0;
    transform: translateX(100%);
}

/* RTL Support */
[dir="rtl"] .toast {
    transform: translateX(-100%);
}

[dir="rtl"] .toast.show {
    transform: translateX(0);
}

[dir="rtl"] .toast.hide {
    transform: translateX(-100%);
}

@keyframes slideIn {
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slideOut {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(100%);
    }
}

[dir="rtl"] @keyframes slideOut {
    to {
        transform: translateX(-100%);
    }
}
`;

// Inject styles if not already present
if (!document.getElementById('toast-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'toast-styles';
    styleSheet.textContent = toastStyles;
    document.head.appendChild(styleSheet);
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('success', 'error', 'info', 'warning')
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    // Create or get toast container
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add to container
    toastContainer.appendChild(toast);

    // Force reflow to ensure animation plays from start
    toast.offsetWidth;

    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Auto hide after duration
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);

    // Return toast element for manual control
    return toast;
}

/**
 * Show success toast
 * @param {string} message - The success message
 * @param {number} duration - Duration in milliseconds
 */
export function showSuccessToast(message, duration = 3000) {
    return showToast(message, 'success', duration);
}

/**
 * Show error toast
 * @param {string} message - The error message
 * @param {number} duration - Duration in milliseconds
 */
export function showErrorToast(message, duration = 4000) {
    return showToast(message, 'error', duration);
}

/**
 * Show info toast
 * @param {string} message - The info message
 * @param {number} duration - Duration in milliseconds
 */
export function showInfoToast(message, duration = 3000) {
    return showToast(message, 'info', duration);
}

/**
 * Show warning toast
 * @param {string} message - The warning message
 * @param {number} duration - Duration in milliseconds
 */
export function showWarningToast(message, duration = 4000) {
    return showToast(message, 'warning', duration);
}

/**
 * Clear all toasts
 */
export function clearAllToasts() {
    const container = document.getElementById('toast-container');
    if (container) {
        container.innerHTML = '';
    }
}

// Global function for backward compatibility
window.showToast = showToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showInfoToast = showInfoToast;
window.showWarningToast = showWarningToast;
window.clearAllToasts = clearAllToasts; 