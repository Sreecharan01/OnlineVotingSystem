import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import PageLoader from '../../components/PageLoader';
import api from '../../api/axios';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  return (
    <>
      <AdminNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container-fluid px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-800 mb-0"><i className="fas fa-tachometer-alt me-2 text-primary"></i>Admin Dashboard</h3>
            <div className="d-none d-md-block text-muted">
              <i className="fas fa-calendar-day me-2"></i>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="stat-card glass-card p-4 h-100 d-flex align-items-center">
                <div className="stat-icon bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3">
                  <i className="fas fa-users fa-2x"></i>
                </div>
                <div>
                  <h3 className="fw-900 mb-0">{data.total_users}</h3>
                  <p className="text-muted small mb-0 fw-600 text-uppercase">Total Users</p>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="stat-card glass-card p-4 h-100 d-flex align-items-center">
                <div className="stat-icon bg-warning bg-opacity-10 text-warning rounded-circle p-3 me-3">
                  <i className="fas fa-user-clock fa-2x"></i>
                </div>
                <div>
                  <h3 className="fw-900 mb-0">{data.pending_approvals}</h3>
                  <p className="text-muted small mb-0 fw-600 text-uppercase">Pending Approvals</p>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="stat-card glass-card p-4 h-100 d-flex align-items-center">
                <div className="stat-icon bg-accent bg-opacity-10 text-accent rounded-circle p-3 me-3">
                  <i className="fas fa-poll fa-2x"></i>
                </div>
                <div>
                  <h3 className="fw-900 mb-0">{data.total_elections}</h3>
                  <p className="text-muted small mb-0 fw-600 text-uppercase">Total Elections</p>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="stat-card glass-card p-4 h-100 d-flex align-items-center">
                <div className="stat-icon bg-success bg-opacity-10 text-success rounded-circle p-3 me-3">
                  <i className="fas fa-vote-yea fa-2x"></i>
                </div>
                <div>
                  <h3 className="fw-900 mb-0">{data.total_votes}</h3>
                  <p className="text-muted small mb-0 fw-600 text-uppercase">Total Votes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="glass-card p-4 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-700 mb-0"><i className="fas fa-broadcast-tower text-danger pulse-dot me-2"></i>Live Elections Tracking</h5>
                  <Link to="/admin/elections" className="btn btn-sm btn-outline-primary rounded-pill">Manage</Link>
                </div>
                
                {data.live_data.length > 0 ? (
                  <div className="row g-4">
                    {data.live_data.map((item, i) => (
                      <div key={i} className="col-md-6">
                        <div className="p-3 border border-secondary border-opacity-25 rounded-3 h-100 position-relative bg-light-custom">
                          <h6 className="fw-bold text-truncate pe-3">{item.election.title}</h6>
                          <div className="d-flex justify-content-between align-items-end mt-3">
                            <div>
                              <div className="text-muted small mb-1">Total Votes</div>
                              <h4 className="fw-900 text-primary mb-0">{item.votes}</h4>
                            </div>
                            <Link to={`/voter/election/${item.election.id}`} className="btn btn-sm btn-primary rounded-pill">
                              View <i className="fas fa-arrow-right ms-1"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i className="fas fa-sleep fa-3x mb-3"></i>
                    <h6>No Active Elections</h6>
                    <p className="small mb-0">Start an election to see live tracking data here.</p>
                  </div>
                )}
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="glass-card p-4 h-100">
                    <h6 className="fw-700 text-secondary mb-3">Quick Actions</h6>
                    <div className="d-flex flex-column gap-2">
                      <Link to="/admin/users" className="btn btn-outline-primary text-start rounded-pill w-100">
                        <i className="fas fa-user-plus me-2"></i> Approve New Users
                        {data.pending_approvals > 0 && <span className="badge bg-danger ms-2 rounded-pill">{data.pending_approvals}</span>}
                      </Link>
                      <Link to="/admin/elections" className="btn btn-outline-accent text-start rounded-pill w-100">
                        <i className="fas fa-plus-circle me-2"></i> Create Election
                      </Link>
                      <Link to="/admin/candidates" className="btn btn-outline-success text-start rounded-pill w-100">
                        <i className="fas fa-user-tie me-2"></i> Manage Candidates
                      </Link>
                      <Link to="/admin/analytics" className="btn btn-outline-warning text-start rounded-pill w-100">
                        <i className="fas fa-chart-line me-2"></i> View Analytics
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="glass-card p-4 h-100 bg-primary bg-opacity-10 border-primary border-opacity-25">
                    <h6 className="fw-700 text-primary mb-3">System Status</h6>
                    <ul className="list-unstyled mb-0">
                      <li className="mb-3 d-flex justify-content-between align-items-center">
                        <span className="text-secondary"><i className="fas fa-server me-2"></i>Server</span>
                        <span className="badge bg-success rounded-pill">Online</span>
                      </li>
                      <li className="mb-3 d-flex justify-content-between align-items-center">
                        <span className="text-secondary"><i className="fas fa-database me-2"></i>Database</span>
                        <span className="badge bg-success rounded-pill">Connected</span>
                      </li>
                      <li className="mb-3 d-flex justify-content-between align-items-center">
                        <span className="text-secondary"><i className="fas fa-shield-alt me-2"></i>Security</span>
                        <span className="badge bg-success rounded-pill">Active</span>
                      </li>
                      <li className="d-flex justify-content-between align-items-center">
                        <span className="text-secondary"><i className="fas fa-clock me-2"></i>Uptime</span>
                        <span className="text-dark fw-bold small">99.9%</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="glass-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-700 mb-0"><i className="fas fa-history text-secondary me-2"></i>System Logs</h5>
                </div>
                
                <div className="activity-list pe-2">
                  {data.recent_activities.length > 0 ? (
                    data.recent_activities.map((log, i) => (
                      <div key={i} className="activity-item d-flex gap-3 mb-3">
                        <div className="activity-dot mt-1"></div>
                        <div>
                          <p className="mb-1 text-sm"><span className="fw-600 text-primary">{log.user}</span> {log.action}</p>
                          <small className="text-muted"><i className="far fa-clock me-1"></i>{new Date(log.time).toLocaleString()}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted py-4">
                      <p>No recent activity.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
