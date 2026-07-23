import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="error-page d-flex align-items-center justify-content-center min-vh-100">
      <div className="text-center">
        <div className="error-code display-1 fw-900 gradient-text mb-3">404</div>
        <h2 className="fw-800 mb-3">Page Not Found</h2>
        <p className="text-muted mb-4">The page you're looking for doesn't exist or has been moved.</p>
        <div className="d-flex gap-3 justify-content-center">
          <Link to="/" className="btn btn-primary rounded-pill px-4">
            <i className="fas fa-home me-2"></i>Go Home
          </Link>
          <button onClick={() => window.history.back()} className="btn btn-outline-secondary rounded-pill px-4">
            <i className="fas fa-arrow-left me-2"></i>Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
