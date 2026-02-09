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
  
  // Colors per type
  const colors = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '✓' },
    error:   { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '✕' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '!' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: 'i' },
  };
  const c = colors[type] || colors.info;
  
  toast.style.cssText = `
    background: ${c.bg};
    color: ${c.text};
    border: 1px solid ${c.border};
    padding: 0.625rem 0.875rem;
    border-radius: 0.375rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    pointer-events: auto;
    transform: translateX(100%);
    transition: transform 0.25s ease-out, opacity 0.25s ease-out;
    font-size: 0.8125rem;
    font-weight: 400;
    line-height: 1.4;
    min-width: 220px;
    max-width: 360px;
    word-wrap: break-word;
  `;

  // Build DOM elements instead of innerHTML to avoid quote-escaping issues
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';

  const icon = document.createElement('span');
  icon.style.cssText = `font-weight:700;font-size:0.75rem;width:1.125rem;height:1.125rem;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:${c.border};color:${c.text};flex-shrink:0;`;
  icon.textContent = c.icon;

  const msg = document.createElement('span');
  msg.style.cssText = 'flex:1;';
  msg.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'background:none;border:none;color:inherit;cursor:pointer;padding:0.125rem;opacity:0.6;font-size:0.875rem;line-height:1;flex-shrink:0;';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '1'; });
  closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '0.6'; });
  closeBtn.addEventListener('click', () => {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  });

  row.appendChild(icon);
  row.appendChild(msg);
  row.appendChild(closeBtn);
  toast.appendChild(row);
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }
  
  return toast;
};

// Toast functions
export const toast = {
  success: (message, duration = 3000) => createToast(message, 'success', duration),
  error: (message, duration = 5000) => createToast(message, 'error', duration),
  warning: (message, duration = 4000) => createToast(message, 'warning', duration),
  info: (message, duration = 3000) => createToast(message, 'info', duration),
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