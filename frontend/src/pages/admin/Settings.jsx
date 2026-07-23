import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import PageLoader from '../../components/PageLoader';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';

const Settings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  const [settings, setSettings] = useState({
    site_name: '',
    allow_registration: true,
    require_approval: true,
    maintenance_mode: false
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then(res => {
        setData(res.data);
        if (res.data.settings) {
          setSettings({
            site_name: res.data.settings.site_name || 'ElectVote',
            allow_registration: res.data.settings.allow_registration ?? true,
            require_approval: res.data.settings.require_approval ?? true,
            maintenance_mode: res.data.settings.maintenance_mode ?? false
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/admin/settings', settings);
      showToast('System settings updated successfully.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      showToast('Generating backup...', 'info');
      const response = await api.post('/admin/backup');
      showToast(`Backup created successfully: ${response.data.filename}`);
    } catch (err) {
      showToast('Failed to generate backup', 'error');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <AdminNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container-fluid px-4">
          <h3 className="fw-800 mb-4"><i className="fas fa-cog me-2 text-primary"></i>System Settings</h3>
          
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="glass-card p-4">
                <h5 className="fw-700 mb-4">General Settings</h5>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label text-muted small fw-bold">Site Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={settings.site_name}
                      onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <div className="form-check form-switch fs-5 mb-3">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="allowReg" 
                        checked={settings.allow_registration}
                        onChange={(e) => setSettings({...settings, allow_registration: e.target.checked})}
                      />
                      <label className="form-check-label fs-6 mt-1 ms-2" htmlFor="allowReg">Allow New User Registrations</label>
                    </div>
                    <p className="text-muted small ms-5 mb-0">If disabled, no new users can register on the platform.</p>
                  </div>
                  
                  <div className="mb-4">
                    <div className="form-check form-switch fs-5 mb-3">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="reqApp" 
                        checked={settings.require_approval}
                        onChange={(e) => setSettings({...settings, require_approval: e.target.checked})}
                      />
                      <label className="form-check-label fs-6 mt-1 ms-2" htmlFor="reqApp">Require Admin Approval</label>
                    </div>
                    <p className="text-muted small ms-5 mb-0">If enabled, new users must be manually approved by an admin before they can vote.</p>
                  </div>
                  
                  <div className="mb-4 pt-3 border-top border-danger border-opacity-25">
                    <div className="form-check form-switch fs-5 mb-3">
                      <input 
                        className="form-check-input border-danger" 
                        type="checkbox" 
                        id="maintMode" 
                        checked={settings.maintenance_mode}
                        onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked})}
                      />
                      <label className="form-check-label fs-6 mt-1 ms-2 text-danger fw-bold" htmlFor="maintMode">Maintenance Mode</label>
                    </div>
                    <p className="text-muted small ms-5 mb-0">Only admins will be able to log in. Active elections will not be accessible to voters.</p>
                  </div>
                  
                  <div className="mt-4 text-end">
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="col-lg-6">
              <div className="glass-card p-4 mb-4">
                <h5 className="fw-700 mb-4"><i className="fas fa-database me-2 text-primary"></i>Database Management</h5>
                <p className="text-secondary mb-4">Create a backup of all system data including users, elections, candidates, and cast votes. Backups are stored securely on the server.</p>
                <button onClick={handleBackup} className="btn btn-outline-success rounded-pill px-4">
                  <i className="fas fa-download me-2"></i>Generate Backup
                </button>
                
                <div className="mt-4 pt-4 border-top border-secondary border-opacity-25">
                  <h6 className="fw-bold mb-3">System Information</h6>
                  <ul className="list-unstyled mb-0 text-secondary">
                    <li className="mb-2"><strong>Database:</strong> MongoDB ({data?.db_info?.name || 'online_voting'})</li>
                    <li className="mb-2"><strong>Collections:</strong> {data?.db_info?.collections || 0} active</li>
                    <li className="mb-2"><strong>Backend API:</strong> Flask v{data?.system?.flask_version || '3.x'}</li>
                    <li><strong>Frontend:</strong> React (Vite)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
