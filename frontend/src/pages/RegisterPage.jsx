import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register(formData);
      showToast('Registration successful! Please wait for admin approval.');
      navigate('/login');
    } catch (error) {
      showToast(error.response?.data?.error || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center py-5">
      <div className="auth-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>
      
      <div className="container position-relative z-2">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">
            <div className="text-center mb-4">
              <Link to="/" className="text-decoration-none">
                <h2 className="fw-900 text-primary mb-0"><i className="fas fa-vote-yea me-2"></i>Elect<span className="text-accent">Vote</span></h2>
              </Link>
            </div>
            
            <div className="glass-card auth-card p-4 p-md-5">
              <h3 className="fw-800 mb-1">Create Account</h3>
              <p className="text-secondary mb-4">Join our secure voting platform today.</p>
              
              <form onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input 
                    type="text" 
                    className="form-control" 
                    name="name"
                    placeholder="Full Name" 
                    required 
                    value={formData.name}
                    onChange={handleChange}
                  />
                  <label><i className="fas fa-user me-2 text-muted"></i>Full Name</label>
                </div>

                <div className="form-floating mb-3">
                  <input 
                    type="email" 
                    className="form-control" 
                    name="email"
                    placeholder="name@example.com" 
                    required 
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <label><i className="fas fa-envelope me-2 text-muted"></i>Email address</label>
                </div>
                
                <div className="form-floating mb-3">
                  <input 
                    type="password" 
                    className="form-control" 
                    name="password"
                    placeholder="Password" 
                    required 
                    minLength="8"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <label><i className="fas fa-lock me-2 text-muted"></i>Password</label>
                </div>

                <div className="form-floating mb-4">
                  <input 
                    type="password" 
                    className="form-control" 
                    name="confirm_password"
                    placeholder="Confirm Password" 
                    required 
                    value={formData.confirm_password}
                    onChange={handleChange}
                  />
                  <label><i className="fas fa-lock me-2 text-muted"></i>Confirm Password</label>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold btn-glow mb-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating Account...</>
                  ) : (
                    <>Create Account <i className="fas fa-user-plus ms-2"></i></>
                  )}
                </button>
              </form>
              
              <div className="text-center mt-4">
                <p className="text-secondary mb-0">Already have an account? <Link to="/login" className="text-accent fw-bold text-decoration-none">Sign in</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
