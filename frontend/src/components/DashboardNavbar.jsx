import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DashboardNavbar = () => {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        if (window.scrollY > 20) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initialize state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar navbar-expand-lg fixed-top glass-navbar">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/voter/dashboard">
          <i className="fas fa-vote-yea me-2 text-primary"></i>
          Elect<span className="text-accent">Vote</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#voterNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="voterNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/voter/dashboard')}`} to="/voter/dashboard">
                <i className="fas fa-home me-1"></i> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/voter/elections')}`} to="/voter/elections">
                <i className="fas fa-poll me-1"></i> Elections
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/voter/profile')}`} to="/voter/profile">
                <i className="fas fa-user-circle me-1"></i> Profile
              </Link>
            </li>
            <li className="nav-item ms-lg-2">
              <button className="btn btn-sm btn-outline-secondary rounded-pill me-2" onClick={toggleTheme}>
                <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
            </li>
            <li className="nav-item">
              <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={logout}>
                <i className="fas fa-sign-out-alt me-1"></i> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
