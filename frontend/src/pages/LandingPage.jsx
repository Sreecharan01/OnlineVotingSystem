import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/axios';

const LandingPage = () => {
  const [stats, setStats] = useState({
    total_elections: 0,
    total_votes: 0,
    total_users: 0
  });

  useEffect(() => {
    // Fetch stats
    api.get('/landing-stats')
      .then(res => {
        setStats(res.data);
      })
      .catch(err => console.error("Failed to load stats", err));

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.animate-hidden').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar />

      <section className="hero-section d-flex align-items-center">
        <div className="auth-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="hero-content pe-lg-4">
                <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 mb-4 hero-badge fw-bold border border-primary border-opacity-25">
                  <i className="fas fa-shield-alt me-2"></i>Secure & Transparent
                </span>
                <h1 className="hero-title display-4 fw-900 mb-4 text-primary">
                  The Future of <br />
                  <span className="gradient-text">Digital Democracy</span>
                </h1>
                <p className="hero-subtitle text-secondary mb-5">
                  A modern, secure, and intuitive online voting platform designed for 
                  organizations of all sizes. Ensure transparent elections with cryptographic security.
                </p>
                <div className="hero-cta d-flex gap-3 mb-5">
                  <Link to="/register" className="btn btn-primary btn-glow rounded-pill px-5 py-3 fw-bold shadow-lg">
                    Get Started <i className="fas fa-arrow-right ms-2"></i>
                  </Link>
                  <a href="#how-it-works" className="btn btn-outline-secondary rounded-pill px-5 py-3 fw-bold bg-light-custom">
                    Learn More
                  </a>
                </div>
                <div className="hero-stats row g-4 mt-2">
                  <div className="col-4">
                    <div className="stat-item text-center">
                      <h3 className="fw-900 text-primary mb-1 counter">{stats.total_elections}</h3>
                      <p className="text-muted small mb-0 fw-600 text-uppercase">Elections</p>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="stat-item text-center">
                      <h3 className="fw-900 text-accent mb-1 counter">{stats.total_votes}</h3>
                      <p className="text-muted small mb-0 fw-600 text-uppercase">Votes Cast</p>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="stat-item text-center">
                      <h3 className="fw-900 text-purple mb-1 counter">{stats.total_users}</h3>
                      <p className="text-muted small mb-0 fw-600 text-uppercase">Voters</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 d-none d-lg-block">
              <div className="hero-illustration">
                <div className="hero-image-wrapper">
                  <div className="floating-card card-1 glass-card">
                    <i className="fas fa-check-circle text-success fa-lg"></i>
                    <span>Vote Verified</span>
                  </div>
                  <div className="floating-card card-2 glass-card">
                    <i className="fas fa-shield-alt text-primary fa-lg"></i>
                    <span>256-bit Encryption</span>
                  </div>
                  <div className="floating-card card-3 glass-card">
                    <i className="fas fa-chart-line text-accent fa-lg"></i>
                    <span>Real-time Results</span>
                  </div>
                  <div className="hero-main-visual">
                    <div className="ballot-box">
                      <div className="ballot-paper"></div>
                      <div className="ballot-top"></div>
                      <div className="ballot-body">
                        <i className="fas fa-vote-yea fa-5x text-white opacity-50"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section-padding bg-light-custom">
        <div className="container">
          <div className="text-center mb-5 pb-3 animate-hidden">
            <span className="text-accent fw-bold text-uppercase ls-2">Why Choose Us</span>
            <h2 className="display-6 fw-800 mt-2">Enterprise-Grade Features</h2>
            <p className="text-secondary lead mx-auto" style={{maxWidth: '700px'}}>Everything you need to run secure, transparent, and successful elections.</p>
          </div>
          <div className="row g-4">
            <div className="col-lg-4 col-md-6 animate-hidden" data-aos="fade-up" data-aos-delay="0">
              <div className="glass-card feature-card h-100">
                <div className="feature-icon bg-primary bg-opacity-10 text-primary mb-4">
                  <i className="fas fa-lock fa-2x"></i>
                </div>
                <h4 className="fw-700 mb-3">Secure Voting</h4>
                <p className="text-secondary mb-0">End-to-end encryption ensures that all votes remain completely anonymous and tamper-proof.</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 animate-hidden" data-aos="fade-up" data-aos-delay="100">
              <div className="glass-card feature-card h-100">
                <div className="feature-icon bg-accent bg-opacity-10 text-accent mb-4">
                  <i className="fas fa-chart-pie fa-2x"></i>
                </div>
                <h4 className="fw-700 mb-3">Real-time Analytics</h4>
                <p className="text-secondary mb-0">Watch the results come in live with beautiful, interactive charts and detailed analytics.</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 animate-hidden" data-aos="fade-up" data-aos-delay="200">
              <div className="glass-card feature-card h-100">
                <div className="feature-icon bg-success bg-opacity-10 text-success mb-4">
                  <i className="fas fa-mobile-alt fa-2x"></i>
                </div>
                <h4 className="fw-700 mb-3">Mobile Ready</h4>
                <p className="text-secondary mb-0">Vote from anywhere, anytime, on any device with our fully responsive platform.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section-padding">
        <div className="container">
          <div className="text-center mb-5 pb-3 animate-hidden">
            <span className="text-primary fw-bold text-uppercase ls-2">Process</span>
            <h2 className="display-6 fw-800 mt-2">How It Works</h2>
            <p className="text-secondary lead mx-auto" style={{maxWidth: '700px'}}>Four simple steps to cast your vote securely.</p>
          </div>
          <div className="row g-4 position-relative">
            <div className="col-lg-3 col-md-6 animate-hidden" data-aos="fade-up" data-aos-delay="0">
              <div className="glass-card step-card text-center h-100">
                <div className="step-number">1</div>
                <div className="step-icon mb-4"><i className="fas fa-user-plus fa-2x text-primary"></i></div>
                <h5 className="fw-700 mb-3">Register</h5>
                <p className="text-secondary small mb-0">Create an account and verify your identity.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 animate-hidden" data-aos="fade-up" data-aos-delay="100">
              <div className="glass-card step-card text-center h-100">
                <div className="step-number">2</div>
                <div className="step-icon mb-4"><i className="fas fa-check-double fa-2x text-accent"></i></div>
                <h5 className="fw-700 mb-3">Approval</h5>
                <p className="text-secondary small mb-0">Admin approves your voter registration.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 animate-hidden" data-aos="fade-up" data-aos-delay="200">
              <div className="glass-card step-card text-center h-100">
                <div className="step-number">3</div>
                <div className="step-icon mb-4"><i className="fas fa-person-booth fa-2x text-purple"></i></div>
                <h5 className="fw-700 mb-3">Cast Vote</h5>
                <p className="text-secondary small mb-0">Select your preferred candidate securely.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 animate-hidden" data-aos="fade-up" data-aos-delay="300">
              <div className="glass-card step-card text-center h-100">
                <div className="step-number">4</div>
                <div className="step-icon mb-4"><i className="fas fa-poll fa-2x text-success"></i></div>
                <h5 className="fw-700 mb-3">Results</h5>
                <p className="text-secondary small mb-0">View transparent election results instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section text-center text-white">
        <div className="container position-relative z-index-2 animate-hidden">
          <h2 className="display-5 fw-900 mb-4">Ready to Run Your Election?</h2>
          <p className="lead mb-5 opacity-75 mx-auto" style={{maxWidth: '600px'}}>Join thousands of organizations that trust ElectVote for their secure online voting needs.</p>
          <div className="d-flex gap-3 justify-content-center">
            <Link to="/register" className="btn btn-light btn-lg rounded-pill px-5 fw-bold text-primary">Get Started Now</Link>
            <Link to="/login" className="btn btn-outline-light btn-lg rounded-pill px-5 fw-bold">Sign In</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default LandingPage;
