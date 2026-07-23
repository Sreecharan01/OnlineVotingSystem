import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import DashboardNavbar from '../../components/DashboardNavbar';
import PageLoader from '../../components/PageLoader';
import api from '../../api/axios';

const Results = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    api.get(`/voter/results/${id}`)
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
  if (!data) return <div className="text-center mt-5">Results not found</div>;

  const { election, results, total_votes, winner, participation } = data;

  const chartData = {
    labels: results.map(r => r.candidate.name),
    datasets: [
      {
        label: 'Votes',
        data: results.map(r => r.votes),
        backgroundColor: [
          '#4F46E5', '#10B981', '#F59E0B', '#EF4444', 
          '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
        ],
        borderRadius: 6,
        barThickness: 40
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <>
      <DashboardNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Link to="/voter/elections" className="btn btn-outline-secondary rounded-pill">
              <i className="fas fa-arrow-left me-1"></i> Back to Elections
            </Link>
            
            {election.winner && (
              <Link to={`/voter/winner/${election.id}`} className="btn btn-warning text-dark fw-bold rounded-pill shadow-sm">
                <i className="fas fa-trophy me-1"></i> View Winner
              </Link>
            )}
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="glass-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
                  <div>
                    <h4 className="fw-800 mb-1">{election.title} - Results</h4>
                    <span className="badge bg-secondary rounded-pill me-2">Ended</span>
                    <small className="text-muted">Total Votes: {total_votes}</small>
                  </div>
                  <div className="text-end">
                    <div className="text-primary fw-900 h3 mb-0">{participation}%</div>
                    <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Turnout</small>
                  </div>
                </div>

                {results.length > 0 ? (
                  <div className="chart-container" style={{ height: '350px' }}>
                    <Bar ref={chartRef} data={chartData} options={chartOptions} />
                  </div>
                ) : (
                  <div className="text-center text-muted py-5">
                    <i className="fas fa-chart-bar fa-3x mb-3"></i>
                    <h5>No votes cast</h5>
                    <p>There are no results to display for this election.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="glass-card p-4 h-100">
                <h5 className="fw-700 mb-4"><i className="fas fa-list-ol me-2 text-primary"></i>Standings</h5>
                
                {results.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {results.map((r, index) => (
                      <div key={r.candidate.id} className="d-flex align-items-center p-3 rounded-3 bg-light-custom border border-secondary border-opacity-10 position-relative overflow-hidden">
                        {index === 0 && <div className="position-absolute top-0 start-0 w-100 h-100 bg-warning opacity-10 pointer-events-none"></div>}
                        
                        <div className={`rank-number me-3 ${index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}`}>
                          {index + 1}
                        </div>
                        
                        <img 
                          src={r.candidate.photo ? `/static/uploads/${r.candidate.photo}` : '/static/images/default-avatar.png'} 
                          alt={r.candidate.name}
                          className="rounded-circle object-fit-cover me-3 shadow-sm"
                          style={{ width: '45px', height: '45px' }}
                        />
                        
                        <div className="flex-grow-1">
                          <h6 className="fw-bold mb-0 text-truncate" style={{ maxWidth: '120px' }}>{r.candidate.name}</h6>
                          <small className="text-muted">{r.candidate.party}</small>
                        </div>
                        
                        <div className="text-end">
                          <div className="fw-900 text-dark">{r.votes}</div>
                          <small className={`fw-bold ${index === 0 ? 'text-warning' : 'text-primary'}`}>{r.percentage}%</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <p className="mb-0">No standings available.</p>
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

export default Results;
