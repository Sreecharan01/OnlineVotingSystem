import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import DashboardNavbar from '../../components/DashboardNavbar';
import PageLoader from '../../components/PageLoader';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';

const VotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/voter/vote/${id}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        showToast(err.response?.data?.error || 'Error loading election', 'error');
        if (err.response?.data?.already_voted) {
          navigate(`/voter/vote-receipt/${id}`);
        } else {
          navigate('/voter/elections');
        }
      });
  }, [id, navigate, showToast]);

  const handleVoteSubmit = async () => {
    if (!selectedCandidate) {
      showToast('Please select a candidate first.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post(`/voter/vote/${id}`, { candidate_id: selectedCandidate });
      showToast('Your vote has been submitted successfully!');
      navigate(`/voter/vote-receipt/${id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit vote.', 'error');
      setIsSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!data) return null;

  const { election, candidates } = data;
  const selCandObj = candidates.find(c => c.id === selectedCandidate);

  return (
    <>
      <DashboardNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h3 className="fw-800 mb-1">Cast Your Vote</h3>
                  <p className="text-secondary mb-0">{election.title}</p>
                </div>
                <Link to={`/voter/election/${election.id}`} className="btn btn-outline-secondary rounded-pill">
                  Cancel
                </Link>
              </div>

              <div className="glass-card p-0 overflow-hidden mb-4 border-primary border-opacity-50 border-2">
                <div className="bg-primary bg-opacity-10 p-3 p-md-4 text-center border-bottom border-primary border-opacity-25">
                  <i className="fas fa-shield-alt fa-2x text-primary mb-2"></i>
                  <h5 className="fw-bold text-primary mb-1">Secure Voting Terminal</h5>
                  <p className="small text-secondary mb-0">Your vote is encrypted and anonymous. Once cast, it cannot be changed.</p>
                </div>
                
                <div className="p-4 p-md-5">
                  <h5 className="fw-700 mb-4 text-center">Select Your Candidate</h5>
                  
                  <div className="row g-3">
                    {candidates.map(candidate => (
                      <div key={candidate.id} className="col-md-6">
                        <div 
                          className={`candidate-vote-card glass-card p-3 d-flex align-items-center h-100 rounded-3 ${selectedCandidate === candidate.id ? 'selected' : ''}`}
                          onClick={() => setSelectedCandidate(candidate.id)}
                        >
                          <div className="form-check me-3">
                            <input 
                              className="form-check-input" 
                              type="radio" 
                              name="candidate_id" 
                              value={candidate.id}
                              checked={selectedCandidate === candidate.id}
                              onChange={() => setSelectedCandidate(candidate.id)}
                              style={{ transform: 'scale(1.2)' }}
                            />
                          </div>
                          <img 
                            src={candidate.photo ? `/static/uploads/${candidate.photo}` : '/static/images/default-avatar.png'} 
                            alt={candidate.name}
                            className="rounded-circle object-fit-cover me-3 shadow-sm"
                            style={{ width: '50px', height: '50px' }}
                          />
                          <div>
                            <h6 className="fw-bold mb-1">{candidate.name}</h6>
                            <span className="badge bg-primary bg-opacity-10 text-primary small">{candidate.party}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 text-center">
                    <button 
                      type="button"
                      className="btn btn-primary btn-lg rounded-pill px-5 py-3 fw-bold btn-glow shadow"
                      disabled={!selectedCandidate || isSubmitting}
                      data-bs-toggle="modal" 
                      data-bs-target="#confirmVoteModal"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Vote Securely'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        id="confirmVoteModal"
        title="Confirm Your Vote"
        message={
          <>
            Are you sure you want to vote for <strong className="text-primary">{selCandObj?.name}</strong>? 
            <br/><br/>
            <span className="text-danger small"><i className="fas fa-exclamation-triangle me-1"></i>This action is final and cannot be undone.</span>
          </>
        }
        confirmText="Yes, Cast My Vote"
        confirmStyle="primary"
        onConfirm={handleVoteSubmit}
      />
    </>
  );
};

export default VotePage;
