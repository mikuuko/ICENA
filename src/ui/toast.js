// Toast notification UI component

export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let bg = '#FF9EAA';
  let icon = '🐱';
  if (type === 'success') { bg = '#4ECCA3'; icon = '✅'; }
  if (type === 'error') { bg = '#FF6B6B'; icon = '❌'; }
  if (type === 'warning') { bg = '#FFD93D'; icon = '⚠️'; }

  toast.style.cssText = `
    background: ${bg};
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    font-family: 'Kanit', sans-serif;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease, fadeOut 0.3s ease ${duration - 300}ms forwards;
    pointer-events: auto;
  `;

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}
