import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import PageLoader from '../../components/PageLoader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';

const ManageElections = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const [searchInput, setSearchInput] = useState(search);
  
  const [selectedElection, setSelectedElection] = useState(null);
  const [actionType, setActionType] = useState(''); // 'start', 'stop', 'declare-winner', 'delete'
  
  const [formData, setFormData] = useState({ title: '', description: '', start_date: '', end_date: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchElections();
  }, [search, statusFilter, page]);

  const fetchElections = () => {
    setLoading(true);
    api.get(`/admin/elections?search=${search}&status=${statusFilter}&page=${page}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

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

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const openFormModal = (election = null) => {
    if (election) {
      setFormData({
        title: election.title,
        description: election.description,
        start_date: formatDateTimeForInput(election.start_date),
        end_date: formatDateTimeForInput(election.end_date)
      });
      setIsEditing(true);
      setEditId(election.id);
    } else {
      setFormData({ title: '', description: '', start_date: '', end_date: '' });
      setIsEditing(false);
      setEditId(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/admin/elections/${editId}`, formData);
        showToast('Election updated successfully');
      } else {
        await api.post('/admin/elections', formData);
        showToast('Election created successfully');
      }
      fetchElections();
      document.querySelector('#electionFormModal .btn-close').click();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save election', 'error');
    }
  };

  const confirmAction = async () => {
    if (!selectedElection) return;
    try {
      if (actionType === 'delete') {
        await api.delete(`/admin/elections/${selectedElection.id}`);
      } else {
        await api.post(`/admin/elections/${selectedElection.id}/${actionType}`);
      }
      showToast(`Action successful`);
      fetchElections();
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed', 'error');
    }
  };

  const openActionModal = (election, type) => {
    setSelectedElection(election);
    setActionType(type);
  };

  // Fix: for start/stop which are PUT requests, not POST
  const confirmStartStopAction = async () => {
    if (!selectedElection) return;
    try {
      if (actionType === 'delete') {
        await api.delete(`/admin/elections/${selectedElection.id}`);
      } else if (actionType === 'declare-winner') {
        await api.post(`/admin/elections/${selectedElection.id}/${actionType}`);
      } else {
        await api.put(`/admin/elections/${selectedElection.id}/${actionType}`);
      }
      showToast(`Action successful`);
      fetchElections();
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed', 'error');
    }
  };

  if (loading && !data) return <PageLoader />;

  return (
    <>
      <AdminNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container-fluid px-4">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h3 className="fw-800 mb-0"><i className="fas fa-poll me-2 text-primary"></i>Manage Elections</h3>
            
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
                style={{ width: '130px' }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="ended">Ended</option>
              </select>
              
              <button className="btn btn-primary rounded-pill btn-glow ms-2 px-4" onClick={() => openFormModal()} data-bs-toggle="modal" data-bs-target="#electionFormModal">
                <i className="fas fa-plus me-1"></i>New Election
              </button>
            </div>
          </div>

          <div className="glass-card p-0 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="ps-4">Election Title</th>
                    <th>Status</th>
                    <th>Timeline</th>
                    <th>Winner</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.elections.map(election => (
                    <tr key={election.id}>
                      <td className="ps-4">
                        <h6 className="fw-bold mb-0">{election.title}</h6>
                        <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '250px' }}>{election.description}</small>
                      </td>
                      <td>
                        {election.status === 'active' && <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill pulse-dot">Live</span>}
                        {election.status === 'upcoming' && <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill">Upcoming</span>}
                        {election.status === 'ended' && <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill">Ended</span>}
                      </td>
                      <td>
                        <small className="d-block"><strong className="text-muted">Start:</strong> {new Date(election.start_date).toLocaleString()}</small>
                        <small className="d-block"><strong className="text-muted">End:</strong> {new Date(election.end_date).toLocaleString()}</small>
                      </td>
                      <td>
                        {election.winner ? (
                          <span className="badge bg-success rounded-pill"><i className="fas fa-crown me-1"></i>Declared</span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-outline-primary rounded-pill me-1 mb-1" onClick={() => openFormModal(election)} data-bs-toggle="modal" data-bs-target="#electionFormModal" title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                        
                        {election.status === 'upcoming' && (
                          <button className="btn btn-sm btn-success rounded-pill me-1 mb-1" onClick={() => openActionModal(election, 'start')} data-bs-toggle="modal" data-bs-target="#electionActionModal" title="Start Early">
                            <i className="fas fa-play"></i>
                          </button>
                        )}
                        
                        {election.status === 'active' && (
                          <button className="btn btn-sm btn-warning rounded-pill me-1 mb-1" onClick={() => openActionModal(election, 'stop')} data-bs-toggle="modal" data-bs-target="#electionActionModal" title="Stop Early">
                            <i className="fas fa-stop"></i>
                          </button>
                        )}
                        
                        {election.status === 'ended' && !election.winner && (
                          <button className="btn btn-sm btn-info text-white rounded-pill me-1 mb-1" onClick={() => openActionModal(election, 'declare-winner')} data-bs-toggle="modal" data-bs-target="#electionActionModal" title="Declare Winner">
                            <i className="fas fa-trophy"></i>
                          </button>
                        )}
                        
                        <button className="btn btn-sm btn-outline-danger rounded-pill mb-1" onClick={() => openActionModal(election, 'delete')} data-bs-toggle="modal" data-bs-target="#electionActionModal" title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data?.elections.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        No elections found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {data && <Pagination currentPage={data.page} totalPages={data.total_pages} onPageChange={handlePageChange} />}
        </div>
      </div>

      {/* Form Modal */}
      <div className="modal fade" id="electionFormModal" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content glass-card border-0">
            <div className="modal-header border-bottom border-secondary border-opacity-25">
              <h5 className="modal-title fw-bold">{isEditing ? 'Edit Election' : 'Create New Election'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-floating mb-3">
                  <input type="text" className="form-control" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Title" />
                  <label>Election Title</label>
                </div>
                <div className="form-floating mb-3">
                  <textarea className="form-control" required style={{height: '100px'}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description"></textarea>
                  <label>Description</label>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input type="datetime-local" className="form-control" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                      <label>Start Date & Time</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input type="datetime-local" className="form-control" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                      <label>End Date & Time</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top border-secondary border-opacity-25">
                <button type="button" className="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary rounded-pill btn-glow">{isEditing ? 'Save Changes' : 'Create Election'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal 
        id="electionActionModal"
        title="Confirm Action"
        message={
          <>
            Are you sure you want to {actionType.replace('-', ' ')} <strong>{selectedElection?.title}</strong>?
            {actionType === 'delete' && <span className="d-block text-danger mt-2">This will permanently delete the election, all its candidates, and all cast votes. This cannot be undone.</span>}
          </>
        }
        confirmText={actionType === 'delete' ? 'Delete' : 'Confirm'}
        confirmStyle={actionType === 'delete' ? 'danger' : 'primary'}
        onConfirm={confirmStartStopAction}
      />
    </>
  );
};

export default ManageElections;
