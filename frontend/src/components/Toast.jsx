import React from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';
  const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';

  return (
    <div className={`toast show align-items-center text-white ${bgColor} custom-toast mb-2 border-0`} role="alert">
      <div className="d-flex">
        <div className="toast-body">
          <i className={`fas ${icon} me-2`}></i>
          {message}
        </div>
        <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={onClose} aria-label="Close"></button>
      </div>
    </div>
  );
};

export default Toast;
