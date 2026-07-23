import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardNavbar from '../../components/DashboardNavbar';
import PageLoader from '../../components/PageLoader';
import CountdownTimer from '../../components/CountdownTimer';
import api from '../../api/axios';

const ElectionDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/voter/election/${id}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <PageLoader />;
  if (!data) return <div className="text-center mt-5">Election not found</div>;

  const { election, candidates, has_voted } = data;

  return (
    <>
      <DashboardNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container py-4">
          <Link to="/voter/elections" className="btn btn-sm btn-outline-secondary rounded-pill mb-4">
            <i className="fas fa-arrow-left me-1"></i>Back to Elections
          </Link>

          <div className="row g-4">
            <div className="col-lg-4">
              <div className="glass-card p-4 h-100 text-center text-lg-start position-relative overflow-hidden">
                {election.status === 'active' && <div className="position-absolute top-0 end-0 p-3"><span className="badge bg-danger pulse-dot rounded-pill">Live</span></div>}
                
                <h3 className="fw-800 mb-3">{election.title}</h3>
                
                <div className="d-flex flex-column gap-3 mb-4">
                  <div className="d-flex align-items-center gap-2 justify-content-center justify-content-lg-start">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2"><i className="fas fa-calendar-check"></i></div>
                    <div className="text-start">
                      <small className="text-muted d-block lh-1">Start Date</small>
                      <span className="fw-600">{new Date(election.start_date).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 justify-content-center justify-content-lg-start">
                    <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-2"><i className="fas fa-calendar-times"></i></div>
                    <div className="text-start">
                      <small className="text-muted d-block lh-1">End Date</small>
                      <span className="fw-600">{new Date(election.end_date).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 justify-content-center justify-content-lg-start">
                    <div className="bg-success bg-opacity-10 text-success rounded-circle p-2"><i className="fas fa-users"></i></div>
                    <div className="text-start">
                      <small className="text-muted d-block lh-1">Candidates</small>
                      <span className="fw-600">{candidates.length} Registered</span>
                    </div>
                  </div>
                </div>

                {election.status === 'active' && (
                  <div className="mb-4">
                    <p className="text-muted small fw-bold text-uppercase mb-2">Time Remaining</p>
                    <CountdownTimer targetDate={election.end_date} />
                  </div>
                )}

                <div className="mt-4 pt-4 border-top border-secondary border-opacity-25">
                  {has_voted ? (
                    <div className="alert alert-success border-0 rounded-3 mb-0">
                      <i className="fas fa-check-circle me-2"></i>You have already voted in this election.
                      <div className="mt-3 d-flex gap-2">
                        <Link to={`/voter/vote-receipt/${election.id}`} className="btn btn-sm btn-success rounded-pill">View Receipt</Link>
                        {election.status === 'ended' && (
                          <Link to={`/voter/results/${election.id}`} className="btn btn-sm btn-outline-success rounded-pill">View Results</Link>
                        )}
                      </div>
                    </div>
                  ) : election.status === 'active' ? (
                    <Link to={`/voter/vote/${election.id}`} className="btn btn-primary w-100 rounded-pill py-3 fw-bold btn-glow text-uppercase ls-2">
                      Cast Your Vote Now <i className="fas fa-arrow-right ms-2"></i>
                    </Link>
                  ) : election.status === 'ended' ? (
                    <Link to={`/voter/results/${election.id}`} className="btn btn-outline-primary w-100 rounded-pill py-2 fw-bold">
                      View Election Results
                    </Link>
                  ) : (
                    <button className="btn btn-secondary w-100 rounded-pill py-2 fw-bold" disabled>
                      Election Not Started
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="glass-card p-4 mb-4">
                <h5 className="fw-700 mb-3"><i className="fas fa-info-circle me-2 text-primary"></i>Description</h5>
                <p className="text-secondary lh-lg mb-0">{election.description}</p>
              </div>

              <div className="glass-card p-4">
                <h5 className="fw-700 mb-4"><i className="fas fa-user-tie me-2 text-primary"></i>Candidates ({candidates.length})</h5>
                
                <div className="row g-3">
                  {candidates.map(candidate => (
                    <div key={candidate.id} className="col-md-6">
                      <div className="candidate-profile-card d-flex align-items-center p-3 rounded-3 h-100">
                        <img 
                          src={candidate.photo ? `/static/uploads/${candidate.photo}` : '/static/images/default-avatar.png'} 
                          alt={candidate.name}
                          className="rounded-circle object-fit-cover shadow-sm me-3"
                          style={{ width: '60px', height: '60px' }}
                        />
                        <div>
                          <h6 className="fw-bold mb-1">{candidate.name}</h6>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-primary bg-opacity-10 text-primary">{candidate.party}</span>
                            {candidate.symbol && <span className="badge bg-secondary bg-opacity-10 text-secondary">{candidate.symbol}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {candidates.length === 0 && (
                    <div className="col-12 text-center text-muted py-4">
                      No candidates have been added to this election yet.
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

export default ElectionDetails;
