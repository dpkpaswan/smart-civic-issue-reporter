// Simple toast notification utility
let toastContainer = null;

// Create toast container if it doesn't exist
const createToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
      max-width: 400px;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

// Create toast element
const createToast = (message, type = 'info', duration = 5000) => {
  const container = createToastContainer();
  
  const toast = document.createElement('div');
  
  // Get colors for toast type
  const getToastStyles = (type) => {
    const styles = {
      success: 'background: #10b981; color: white; border: 2px solid #059669;',
      error: 'background: #ef4444; color: white; border: 2px solid #dc2626;',
      warning: 'background: #f59e0b; color: white; border: 2px solid #d97706;',
      info: 'background: #3b82f6; color: white; border: 2px solid #2563eb;'
    };
    return styles[type] || styles.info;
  };
  
  toast.style.cssText = `
    ${getToastStyles(type)}
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    pointer-events: auto;
    transform: translateX(100%);
    transition: all 0.3s ease-out;
    font-size: 0.875rem;
    font-weight: 500;
    min-width: 300px;
    word-wrap: break-word;
  `;
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.25rem;">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </span>
        <span>${message}</span>
      </div>
      <button 
        onclick="this.closest('div[style*=\"translateX\"]').style.transform='translateX(100%)'; setTimeout(() => this.closest('div[style*=\"translateX\"]').remove(), 300);"
        style="background: none; border: none; color: inherit; cursor: pointer; padding: 0.25rem; opacity: 0.8; font-size: 1.25rem; line-height: 1;"
        onmouseover="this.style.opacity='1'"
        onmouseout="this.style.opacity='0.8'"
      >
        ✕
      </button>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto remove toast after duration
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (toast.parentElement) {
            toast.remove();
          }
        }, 300);
      }
    }, duration);
  }
  
  return toast;
};

// Toast functions
export const toast = {
  success: (message, duration = 5000) => createToast(message, 'success', duration),
  error: (message, duration = 7000) => createToast(message, 'error', duration),
  warning: (message, duration = 6000) => createToast(message, 'warning', duration),
  info: (message, duration = 5000) => createToast(message, 'info', duration),
};

// Add CSS animation styles
const addToastStyles = () => {
  const existingStyle = document.getElementById('toast-styles');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .animate-slide-in {
        animation: slide-in 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }
};

// Initialize styles when module loads
addToastStyles();

export default toast;