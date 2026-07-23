import React, { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar';
import PageLoader from '../../components/PageLoader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      api.get('/voter/profile')
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.put('/voter/profile', { name });
      showToast('Profile updated successfully.');
      // Update local user context via window reload or context update
      window.location.reload(); 
    } catch (err) {
      showToast(err.response?.data?.error || 'Update failed', 'error');
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsChangingPwd(true);
    try {
      await api.put('/voter/change-password', passwords);
      showToast('Password changed successfully.');
      setPasswords({ current_password: '', new_password: '', confirm_new_password: '' });
    } catch (err) {
      showToast(err.response?.data?.error || 'Password change failed', 'error');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    setIsUploading(true);
    try {
      await api.post('/voter/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Profile picture updated.');
      window.location.reload();
    } catch (err) {
      showToast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading || loading) return <PageLoader />;
  if (!data) return null;

  return (
    <>
      <DashboardNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container py-4">
          <h3 className="fw-800 mb-4"><i className="fas fa-user-circle me-2"></i>My Profile</h3>

          <div className="row g-4">
            <div className="col-lg-4">
              <div className="glass-card p-4 text-center h-100 position-relative">
                {isUploading && (
                  <div className="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex align-items-center justify-content-center z-2 rounded-3">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                )}
                <div className="position-relative d-inline-block mb-3">
                  <img 
                    src={user.profile_picture ? `/static/uploads/${user.profile_picture}` : '/static/images/default-avatar.png'} 
                    alt={user.name} 
                    className="rounded-circle object-fit-cover shadow-sm border border-4 border-white"
                    style={{ width: '150px', height: '150px' }}
                  />
                  <label htmlFor="photo-upload" className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 cursor-pointer shadow" style={{ transform: 'translate(-10%, -10%)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-camera"></i>
                  </label>
                  <input type="file" id="photo-upload" className="d-none" accept="image/*" onChange={handlePhotoUpload} />
                </div>
                <h4 className="fw-bold mb-1">{user.name}</h4>
                <p className="text-secondary mb-3">{user.email}</p>
                <div className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill mb-4">
                  <i className="fas fa-check-circle me-1"></i>Verified Voter
                </div>
                
                <div className="d-flex justify-content-center gap-4 border-top border-secondary border-opacity-25 pt-4">
                  <div>
                    <h3 className="fw-900 text-primary mb-0">{data.vote_count}</h3>
                    <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Votes Cast</small>
                  </div>
                  <div>
                    <h3 className="fw-900 text-secondary mb-0">{new Date(user.created_at).getFullYear()}</h3>
                    <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Joined</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="row g-4">
                <div className="col-12">
                  <div className="glass-card p-4">
                    <h5 className="fw-700 mb-4"><i className="fas fa-user-edit me-2 text-primary"></i>Personal Information</h5>
                    <form onSubmit={handleUpdateProfile}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="form-floating">
                            <input 
                              type="text" 
                              className="form-control" 
                              required 
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                            <label>Full Name</label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-floating">
                            <input type="email" className="form-control bg-light" value={user.email} disabled />
                            <label>Email Address</label>
                          </div>
                          <small className="text-muted ms-2"><i className="fas fa-info-circle me-1"></i>Email cannot be changed.</small>
                        </div>
                        <div className="col-12 mt-4 text-end">
                          <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={isUpdating || name === user.name}>
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="col-12">
                  <div className="glass-card p-4">
                    <h5 className="fw-700 mb-4"><i className="fas fa-lock me-2 text-primary"></i>Security</h5>
                    <form onSubmit={handleChangePassword}>
                      <div className="row g-3">
                        <div className="col-12">
                          <div className="form-floating">
                            <input 
                              type="password" 
                              className="form-control" 
                              required 
                              placeholder="Current Password"
                              value={passwords.current_password}
                              onChange={(e) => setPasswords({...passwords, current_password: e.target.value})}
                            />
                            <label>Current Password</label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-floating">
                            <input 
                              type="password" 
                              className="form-control" 
                              required 
                              minLength="8" 
                              placeholder="New Password"
                              value={passwords.new_password}
                              onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                            />
                            <label>New Password</label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-floating">
                            <input 
                              type="password" 
                              className="form-control" 
                              required 
                              placeholder="Confirm New Password"
                              value={passwords.confirm_new_password}
                              onChange={(e) => setPasswords({...passwords, confirm_new_password: e.target.value})}
                            />
                            <label>Confirm New Password</label>
                          </div>
                        </div>
                        <div className="col-12 mt-4 text-end">
                          <button type="submit" className="btn btn-warning text-dark fw-bold rounded-pill px-4" disabled={isChangingPwd}>
                            {isChangingPwd ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
