import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const AdminNavbar = () => {
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
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar navbar-expand-lg fixed-top glass-navbar">
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold" to="/admin/dashboard">
          <i className="fas fa-vote-yea me-2 text-primary"></i>
          Elect<span className="text-accent">Vote</span>
          <span className="badge bg-danger rounded-pill ms-2 small">Admin</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="adminNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/admin/dashboard')}`} to="/admin/dashboard">
                <i className="fas fa-tachometer-alt me-1"></i>Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/admin/users')}`} to="/admin/users">
                <i className="fas fa-users me-1"></i>Users
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/admin/elections')}`} to="/admin/elections">
                <i className="fas fa-poll me-1"></i>Elections
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/admin/candidates')}`} to="/admin/candidates">
                <i className="fas fa-user-tie me-1"></i>Candidates
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/admin/analytics')}`} to="/admin/analytics">
                <i className="fas fa-chart-line me-1"></i>Analytics
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/admin/settings')}`} to="/admin/settings">
                <i className="fas fa-cog me-1"></i>Settings
              </Link>
            </li>
            <li className="nav-item ms-lg-2">
              <button className="btn btn-sm btn-outline-secondary rounded-pill me-2" onClick={toggleTheme}>
                <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
            </li>
            <li className="nav-item">
              <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={logout}>
                <i className="fas fa-sign-out-alt me-1"></i>Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
