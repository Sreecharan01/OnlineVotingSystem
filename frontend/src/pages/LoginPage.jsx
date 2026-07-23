import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await login(email, password);
      showToast('Login successful!');
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/voter/dashboard');
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center">
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
              <h3 className="fw-800 mb-1">Welcome Back!</h3>
              <p className="text-secondary mb-4">Please enter your details to sign in.</p>
              
              <form onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="name@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label><i className="fas fa-envelope me-2 text-muted"></i>Email address</label>
                </div>
                
                <div className="form-floating mb-4">
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label><i className="fas fa-lock me-2 text-muted"></i>Password</label>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="remember" />
                    <label className="form-check-label text-secondary small" htmlFor="remember">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-primary text-decoration-none small fw-600">Forgot Password?</a>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold btn-glow mb-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Signing In...</>
                  ) : (
                    <>Sign In <i className="fas fa-sign-in-alt ms-2"></i></>
                  )}
                </button>
              </form>
              
              <div className="text-center mt-4">
                <p className="text-secondary mb-0">Don't have an account? <Link to="/register" className="text-accent fw-bold text-decoration-none">Register here</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
