import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import DashboardNavbar from '../../components/DashboardNavbar';
import PageLoader from '../../components/PageLoader';
import api from '../../api/axios';

const VoteReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/voter/vote-receipt/${id}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        navigate('/voter/elections');
      });
  }, [id, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <PageLoader />;
  if (!data) return null;

  const { election, candidate, vote_record } = data;

  return (
    <>
      <DashboardNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
            <Link to="/voter/dashboard" className="btn btn-outline-secondary rounded-pill">
              <i className="fas fa-arrow-left me-1"></i> Dashboard
            </Link>
            <button onClick={handlePrint} className="btn btn-outline-primary rounded-pill">
              <i className="fas fa-print me-1"></i> Print Receipt
            </button>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <div className="glass-card p-0 receipt-card mb-4 position-relative overflow-hidden bg-white">
                <div className="bg-success bg-opacity-10 p-4 text-center border-bottom border-success border-opacity-25">
                  <div className="mb-3">
                    <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                      <i className="fas fa-check fa-2x"></i>
                    </div>
                  </div>
                  <h4 className="fw-800 text-success mb-1">Vote Recorded</h4>
                  <p className="text-secondary small mb-0">Your vote has been securely cryptographically recorded.</p>
                </div>
                
                <div className="p-4 p-md-5 bg-white">
                  <div className="text-center mb-4">
                    <h5 className="fw-700 text-dark mb-1">{election.title}</h5>
                    <span className="badge bg-secondary text-uppercase ls-2">Official Receipt</span>
                  </div>
                  
                  <div className="mb-4 text-center">
                    <p className="text-muted small text-uppercase fw-bold mb-2">You Voted For</p>
                    <div className="d-flex align-items-center justify-content-center p-3 bg-light rounded-3 border">
                      <img 
                        src={candidate.photo ? `/static/uploads/${candidate.photo}` : '/static/images/default-avatar.png'} 
                        alt={candidate.name}
                        className="rounded-circle object-fit-cover me-3 shadow-sm"
                        style={{ width: '50px', height: '50px' }}
                      />
                      <div className="text-start">
                        <h6 className="fw-bold text-dark mb-0">{candidate.name}</h6>
                        <small className="text-muted">{candidate.party}</small>
                      </div>
                    </div>
                  </div>
                  
                  <hr className="border-secondary border-opacity-25 my-4 border-dashed" />
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Receipt ID:</span>
                    <span className="text-dark fw-bold small text-break text-end ms-3" style={{ fontFamily: 'monospace' }}>
                      {vote_record._id}
                    </span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Timestamp:</span>
                    <span className="text-dark fw-bold small text-end">
                      {new Date(vote_record.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="d-flex justify-content-between">
                    <span className="text-muted small">Status:</span>
                    <span className="text-success fw-bold small text-end">Verified & Secured <i className="fas fa-lock ms-1"></i></span>
                  </div>
                </div>
                
                <div className="bg-light p-3 text-center border-top">
                  <p className="small text-muted mb-0">
                    <i className="fas fa-info-circle me-1"></i>
                    Please keep this receipt for your records. It proves your participation but cannot be used to reveal your choice to others.
                  </p>
                </div>
              </div>
              
              {election.status === 'ended' && (
                <div className="text-center mt-4 d-print-none">
                  <Link to={`/voter/results/${election.id}`} className="btn btn-primary rounded-pill px-4 fw-bold">
                    View Election Results <i className="fas fa-chart-pie ms-1"></i>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VoteReceipt;
