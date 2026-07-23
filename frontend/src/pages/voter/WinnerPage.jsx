import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardNavbar from '../../components/DashboardNavbar';
import PageLoader from '../../components/PageLoader';
import api from '../../api/axios';

const WinnerPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/voter/winner/${id}`)
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
  if (!data) return <div className="text-center mt-5">No winner data found</div>;

  const { election, winner, total_votes, winner_votes, winner_percentage } = data;

  return (
    <>
      <DashboardNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center mb-4">
              <span className="badge bg-warning text-dark rounded-pill px-3 py-2 mb-3 text-uppercase ls-2 shadow-sm border border-warning">
                <i className="fas fa-crown me-2"></i>Official Result
              </span>
              <h2 className="display-6 fw-900 mb-2">{election.title}</h2>
              <p className="text-secondary">The results have been verified and the winner is officially declared.</p>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <div className="glass-card winner-card text-center p-0 position-relative bg-white overflow-visible">
                <div className="winner-confetti position-absolute w-100 h-100 top-0 start-0 pointer-events-none z-index-1">
                  <div className="confetti-piece" style={{ '--color': '#4F46E5', '--delay': '0s' }}></div>
                  <div className="confetti-piece" style={{ '--color': '#10B981', '--delay': '0.5s' }}></div>
                  <div className="confetti-piece" style={{ '--color': '#F59E0B', '--delay': '1s' }}></div>
                  <div className="confetti-piece" style={{ '--color': '#EF4444', '--delay': '1.5s' }}></div>
                  <div className="confetti-piece" style={{ '--color': '#8B5CF6', '--delay': '2s' }}></div>
                  <div className="confetti-piece" style={{ '--color': '#06B6D4', '--delay': '0.8s' }}></div>
                  <div className="confetti-piece" style={{ '--color': '#F43F5E', '--delay': '1.2s' }}></div>
                  <div className="confetti-piece" style={{ '--color': '#14B8A6', '--delay': '2.5s' }}></div>
                </div>

                <div className="p-5 position-relative z-index-2">
                  <div className="position-absolute top-0 start-50 translate-middle">
                    <div className="winner-bounce">
                      <div className="checkmark-circle shadow-lg border border-4 border-white">
                        <i className="fas fa-check fa-2x text-white"></i>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3">
                    <h5 className="text-muted text-uppercase fw-bold ls-2 mb-4">Winner</h5>
                    
                    <div className="position-relative d-inline-block mb-4">
                      <img 
                        src={winner.photo ? `/static/uploads/${winner.photo}` : '/static/images/default-avatar.png'} 
                        alt={winner.name}
                        className="rounded-circle object-fit-cover shadow-lg border border-4 border-white"
                        style={{ width: '150px', height: '150px' }}
                      />
                      <div className="position-absolute bottom-0 end-0 bg-warning rounded-circle p-2 shadow-sm border border-2 border-white text-dark" style={{ transform: 'translate(20%, 20%)' }}>
                        <i className="fas fa-crown"></i>
                      </div>
                    </div>
                    
                    <h2 className="fw-900 text-dark mb-1">{winner.name}</h2>
                    <h5 className="text-primary mb-4">{winner.party}</h5>
                    
                    {winner.symbol && (
                      <div className="mb-4">
                        <span className="badge bg-secondary bg-opacity-10 text-secondary fs-6 py-2 px-4 rounded-pill">
                          Symbol: {winner.symbol}
                        </span>
                      </div>
                    )}
                    
                    <div className="row justify-content-center bg-light rounded-3 p-3 mx-1 mt-4 border">
                      <div className="col-6 border-end border-secondary border-opacity-25">
                        <h3 className="fw-900 text-dark mb-0">{winner_votes}</h3>
                        <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Votes Received</small>
                      </div>
                      <div className="col-6">
                        <h3 className="fw-900 text-success mb-0">{winner_percentage}%</h3>
                        <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Of Total Votes</small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-light p-3 border-top position-relative z-index-2">
                  <p className="small text-muted mb-0">Total votes cast in this election: <strong className="text-dark">{total_votes}</strong></p>
                </div>
              </div>
              
              <div className="text-center mt-5">
                <Link to={`/voter/results/${election.id}`} className="btn btn-outline-primary rounded-pill px-4 me-3">
                  <i className="fas fa-chart-pie me-2"></i>Full Results
                </Link>
                <Link to="/voter/elections" className="btn btn-primary rounded-pill px-4">
                  <i className="fas fa-home me-2"></i>Back to Elections
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WinnerPage;
