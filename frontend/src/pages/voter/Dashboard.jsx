import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardNavbar from '../../components/DashboardNavbar';
import CountdownTimer from '../../components/CountdownTimer';
import PageLoader from '../../components/PageLoader';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/voter/dashboard')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <>
      <DashboardNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-800 mb-1">Welcome, {user?.name}!</h3>
              <p className="text-secondary mb-0">Here's what's happening with your elections.</p>
            </div>
            <div className="text-end d-none d-md-block">
              <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">
                <i className="fas fa-check-circle me-1"></i> Verified Voter
              </span>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="stat-card glass-card p-4 h-100 d-flex align-items-center">
                <div className="stat-icon bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3">
                  <i className="fas fa-poll fa-2x"></i>
                </div>
                <div>
                  <h3 className="fw-900 mb-0">{data.active_elections.length}</h3>
                  <p className="text-muted small mb-0 fw-600 text-uppercase">Active Elections</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card glass-card p-4 h-100 d-flex align-items-center">
                <div className="stat-icon bg-accent bg-opacity-10 text-accent rounded-circle p-3 me-3">
                  <i className="fas fa-calendar-alt fa-2x"></i>
                </div>
                <div>
                  <h3 className="fw-900 mb-0">{data.upcoming_elections.length}</h3>
                  <p className="text-muted small mb-0 fw-600 text-uppercase">Upcoming</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card glass-card p-4 h-100 d-flex align-items-center">
                <div className="stat-icon bg-success bg-opacity-10 text-success rounded-circle p-3 me-3">
                  <i className="fas fa-check-double fa-2x"></i>
                </div>
                <div>
                  <h3 className="fw-900 mb-0">{data.vote_history.length}</h3>
                  <p className="text-muted small mb-0 fw-600 text-uppercase">Votes Cast</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <h5 className="fw-700 mb-3"><i className="fas fa-broadcast-tower text-danger me-2 pulse-dot"></i>Active Elections</h5>
              
              {data.active_elections.length > 0 ? (
                <div className="row g-4">
                  {data.active_elections.map(election => (
                    <div key={election.id} className="col-md-6">
                      <div className="election-card glass-card p-4 h-100 position-relative overflow-hidden">
                        <div className="position-absolute top-0 end-0 p-3">
                          <span className="badge bg-danger rounded-pill pulse-dot">Live</span>
                        </div>
                        <h5 className="fw-700 mb-2 pe-5">{election.title}</h5>
                        <p className="text-secondary small mb-4">{election.description.substring(0, 100)}...</p>
                        
                        <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-end">
                            <div>
                              <small className="text-muted fw-600 d-block mb-1">Ends in</small>
                              <CountdownTimer targetDate={election.end_date} />
                            </div>
                            <Link to={`/voter/election/${election.id}`} className="btn btn-sm btn-primary rounded-pill px-3">
                              View <i className="fas fa-arrow-right ms-1"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-5 text-center h-100 d-flex flex-column justify-content-center">
                  <div className="mb-3 text-muted">
                    <i className="fas fa-sleep fa-3x"></i>
                  </div>
                  <h5 className="text-muted">No Active Elections</h5>
                  <p className="text-secondary mb-0">There are no ongoing elections at the moment.</p>
                </div>
              )}
            </div>

            <div className="col-lg-4">
              <h5 className="fw-700 mb-3"><i className="fas fa-history text-secondary me-2"></i>Recent Activity</h5>
              <div className="glass-card p-4 h-100">
                {data.vote_history.length > 0 ? (
                  <div className="activity-list">
                    {data.vote_history.slice(0, 5).map((vote, i) => (
                      <div key={i} className="activity-item d-flex gap-3 mb-3">
                        <div className="activity-dot mt-1"></div>
                        <div>
                          <p className="mb-1 fw-600 text-sm">Voted in {vote.election?.title}</p>
                          <small className="text-muted">{new Date(vote.timestamp).toLocaleString()}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <i className="fas fa-clipboard-list fa-2x mb-2"></i>
                    <p className="small mb-0">No voting history yet.</p>
                  </div>
                )}
                
                {data.vote_history.length > 0 && (
                  <div className="mt-3 text-center">
                    <Link to="/voter/profile" className="btn btn-sm btn-outline-primary rounded-pill w-100">
                      View All History
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
