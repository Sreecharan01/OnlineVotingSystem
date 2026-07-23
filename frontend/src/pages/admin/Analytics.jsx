import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import PageLoader from '../../components/PageLoader';
import api from '../../api/axios';
import { Bar, Doughnut } from 'react-chartjs-2';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
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

  const { overall, trend, elections_data } = data;

  const trendData = {
    labels: trend.map(t => t._id),
    datasets: [{
      label: 'Votes Cast',
      data: trend.map(t => t.count),
      backgroundColor: 'rgba(79, 70, 229, 0.2)',
      borderColor: '#4F46E5',
      borderWidth: 2,
      borderRadius: 4,
    }]
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } }
    }
  };

  const roleData = {
    labels: ['Admins', 'Voters'],
    datasets: [{
      data: [overall.total_admins, overall.total_voters],
      backgroundColor: ['#EF4444', '#10B981'],
      borderWidth: 0
    }]
  };

  const roleOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container-fluid px-4">
          <h3 className="fw-800 mb-4"><i className="fas fa-chart-line me-2 text-primary"></i>Analytics</h3>
          
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="glass-card p-4 h-100">
                <h5 className="fw-700 mb-4">Voting Activity (Last 7 Days)</h5>
                <div style={{ height: '300px' }}>
                  {trend.length > 0 ? (
                    <Bar data={trendData} options={trendOptions} />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                      No voting activity in the last 7 days.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-lg-4">
              <div className="glass-card p-4 h-100 d-flex flex-column">
                <h5 className="fw-700 mb-4">User Demographics</h5>
                <div style={{ height: '220px' }} className="mb-4">
                  <Doughnut data={roleData} options={roleOptions} />
                </div>
                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary">Total Users</span>
                    <span className="fw-bold">{overall.total_users}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary">Approved Voters</span>
                    <span className="fw-bold text-success">{overall.total_voters}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-secondary">Pending Approvals</span>
                    <span className="fw-bold text-warning">{overall.pending_users}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <h5 className="fw-800 mb-3 mt-5">Election Specific Analytics</h5>
          <div className="row g-4">
            {elections_data.map(election => (
              <div key={election.id} className="col-md-6 col-xl-4">
                <div className="glass-card p-4 h-100 border-top border-4 border-primary">
                  <h6 className="fw-bold mb-3 text-truncate" title={election.title}>{election.title}</h6>
                  
                  <div className="d-flex justify-content-between mb-3">
                    <div className="text-center w-50 border-end border-secondary border-opacity-25">
                      <div className="text-muted small">Total Votes</div>
                      <div className="fs-3 fw-900 text-primary">{election.total_votes}</div>
                    </div>
                    <div className="text-center w-50">
                      <div className="text-muted small">Turnout</div>
                      <div className="fs-3 fw-900 text-success">{election.participation_rate}%</div>
                    </div>
                  </div>
                  
                  <hr className="border-secondary border-opacity-25" />
                  
                  <div className="small">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Status</span>
                      <span className={`badge ${election.status === 'active' ? 'bg-danger' : election.status === 'ended' ? 'bg-secondary' : 'bg-warning'} rounded-pill`}>
                        {election.status}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Candidates</span>
                      <span className="fw-600">{election.candidates_count}</span>
                    </div>
                    {election.winner && (
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Winner</span>
                        <span className="fw-bold text-warning text-dark px-2 bg-warning bg-opacity-25 rounded"><i className="fas fa-crown me-1"></i>{election.winner}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {elections_data.length === 0 && (
              <div className="col-12 text-center text-muted py-5 glass-card">
                <i className="fas fa-chart-pie fa-3x mb-3"></i>
                <p>No election analytics available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Analytics;
