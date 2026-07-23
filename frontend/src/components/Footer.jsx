import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer-section text-white pt-5">
      <div className="container">
        <div className="row g-4 mb-4">
          <div className="col-lg-4 col-md-6">
            <h4 className="fw-bold mb-3"><i className="fas fa-vote-yea me-2 text-primary"></i>Elect<span className="text-accent">Vote</span></h4>
            <p className="text-secondary">Empowering democracy through secure, transparent, and accessible digital voting solutions for organizations worldwide.</p>
            <div className="social-links mt-3">
              <a href="#" className="me-2 text-white text-decoration-none"><i className="fab fa-twitter"></i></a>
              <a href="#" className="me-2 text-white text-decoration-none"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="me-2 text-white text-decoration-none"><i className="fab fa-linkedin-in"></i></a>
              <a href="#" className="text-white text-decoration-none"><i className="fab fa-github"></i></a>
            </div>
          </div>
          <div className="col-lg-2 col-md-6">
            <h5 className="fw-600 mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/" className="text-secondary text-decoration-none hover-white">Home</Link></li>
              <li className="mb-2"><Link to="/login" className="text-secondary text-decoration-none hover-white">Login</Link></li>
              <li className="mb-2"><Link to="/register" className="text-secondary text-decoration-none hover-white">Register</Link></li>
            </ul>
          </div>
          <div className="col-lg-2 col-md-6">
            <h5 className="fw-600 mb-3">Legal</h5>
            <ul className="list-unstyled">
              <li className="mb-2"><a href="#" className="text-secondary text-decoration-none hover-white">Terms of Service</a></li>
              <li className="mb-2"><a href="#" className="text-secondary text-decoration-none hover-white">Privacy Policy</a></li>
              <li className="mb-2"><a href="#" className="text-secondary text-decoration-none hover-white">Cookie Policy</a></li>
            </ul>
          </div>
          <div className="col-lg-4 col-md-6">
            <h5 className="fw-600 mb-3">Contact Us</h5>
            <ul className="list-unstyled text-secondary">
              <li className="mb-2"><i className="fas fa-envelope me-2"></i> support@electvote.com</li>
              <li className="mb-2"><i className="fas fa-phone-alt me-2"></i> +1 (555) 123-4567</li>
              <li className="mb-2"><i className="fas fa-map-marker-alt me-2"></i> 123 Democracy Blvd, Tech City, TC 90210</li>
            </ul>
          </div>
        </div>
        <div className="row border-top border-secondary pt-3 pb-3">
          <div className="col-md-6 text-center text-md-start">
            <p className="text-secondary mb-0">&copy; {new Date().getFullYear()} ElectVote. All rights reserved.</p>
          </div>
          <div className="col-md-6 text-center text-md-end mt-2 mt-md-0">
            <p className="text-secondary mb-0">Built with <i className="fas fa-heart text-danger"></i> for secure elections</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
