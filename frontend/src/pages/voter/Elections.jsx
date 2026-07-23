import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardNavbar from '../../components/DashboardNavbar';
import PageLoader from '../../components/PageLoader';
import Pagination from '../../components/Pagination';
import CountdownTimer from '../../components/CountdownTimer';
import api from '../../api/axios';

const Elections = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setLoading(true);
    api.get(`/voter/elections?search=${search}&status=${statusFilter}&page=${page}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [search, statusFilter, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchInput, status: statusFilter, page: 1 });
  };

  const handleFilter = (e) => {
    setSearchParams({ search, status: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ search, status: statusFilter, page: newPage });
  };

  if (loading && !data) return <PageLoader />;

  return (
    <>
      <DashboardNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h3 className="fw-800 mb-0"><i className="fas fa-poll me-2"></i>Elections</h3>
            
            <div className="d-flex gap-2">
              <form onSubmit={handleSearch} className="d-flex position-relative">
                <input 
                  type="text" 
                  className="form-control rounded-pill pe-5" 
                  placeholder="Search elections..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ width: '250px' }}
                />
                <button type="submit" className="btn position-absolute end-0 top-0 bottom-0 border-0 text-primary">
                  <i className="fas fa-search"></i>
                </button>
              </form>
              
              <select 
                className="form-select rounded-pill" 
                value={statusFilter}
                onChange={handleFilter}
                style={{ width: '150px' }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : data.elections.length > 0 ? (
            <>
              <div className="row g-4">
                {data.elections.map(election => (
                  <div key={election.id} className="col-md-6 col-lg-4">
                    <div className="election-card glass-card p-4 h-100 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="fw-700 mb-0 pe-2">{election.title}</h5>
                        {election.status === 'active' && <span className="badge bg-danger rounded-pill pulse-dot">Live</span>}
                        {election.status === 'upcoming' && <span className="badge bg-warning text-dark rounded-pill">Upcoming</span>}
                        {election.status === 'ended' && <span className="badge bg-secondary rounded-pill">Ended</span>}
                      </div>
                      
                      <p className="text-secondary small mb-4 flex-grow-1">{election.description.substring(0, 120)}...</p>
                      
                      <div className="d-flex justify-content-between align-items-end mt-auto">
                        <div>
                          {election.status === 'active' && (
                            <>
                              <small className="text-muted fw-600 d-block mb-1">Ends in</small>
                              <CountdownTimer targetDate={election.end_date} />
                            </>
                          )}
                          {election.status === 'upcoming' && (
                            <>
                              <small className="text-muted fw-600 d-block mb-1">Starts at</small>
                              <div className="fw-bold text-primary small">{new Date(election.start_date).toLocaleDateString()}</div>
                            </>
                          )}
                          {election.status === 'ended' && (
                            <>
                              <small className="text-muted fw-600 d-block mb-1">Ended on</small>
                              <div className="fw-bold text-secondary small">{new Date(election.end_date).toLocaleDateString()}</div>
                            </>
                          )}
                        </div>
                        
                        <div>
                          {data.voted_elections.includes(election.id) ? (
                            <Link to={`/voter/results/${election.id}`} className="btn btn-sm btn-outline-success rounded-pill px-3">
                              <i className="fas fa-check-circle me-1"></i>Voted
                            </Link>
                          ) : (
                            <Link to={`/voter/election/${election.id}`} className="btn btn-sm btn-primary rounded-pill px-3">
                              View <i className="fas fa-arrow-right ms-1"></i>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination 
                currentPage={data.page} 
                totalPages={data.total_pages} 
                onPageChange={handlePageChange} 
              />
            </>
          ) : (
            <div className="glass-card p-5 text-center mt-4">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No elections found</h4>
              <p className="text-secondary mb-0">Try adjusting your search or filter criteria.</p>
              {(search || statusFilter !== 'all') && (
                <button 
                  className="btn btn-outline-primary rounded-pill mt-3"
                  onClick={() => setSearchParams({})}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Elections;
