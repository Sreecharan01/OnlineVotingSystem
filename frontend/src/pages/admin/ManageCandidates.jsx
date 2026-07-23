import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import PageLoader from '../../components/PageLoader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';

const ManageCandidates = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const [searchInput, setSearchInput] = useState(search);
  
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  const [formData, setFormData] = useState({ election_id: '', name: '', party: '', symbol: '', description: '' });
  const [photo, setPhoto] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCandidates();
  }, [search, page]);

  const fetchCandidates = () => {
    setLoading(true);
    api.get(`/admin/candidates?search=${search}&page=${page}`)
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
    setSearchParams({ search: searchInput, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ search, page: newPage });
  };

  const openFormModal = (candidate = null) => {
    setPhoto(null);
    if (candidate) {
      setFormData({
        election_id: candidate.election_id,
        name: candidate.name,
        party: candidate.party || '',
        symbol: candidate.symbol || '',
        description: candidate.description || ''
      });
      setIsEditing(true);
      setEditId(candidate.id);
    } else {
      setFormData({ election_id: '', name: '', party: '', symbol: '', description: '' });
      setIsEditing(false);
      setEditId(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const form = new FormData();
    Object.keys(formData).forEach(key => form.append(key, formData[key]));
    if (photo) form.append('photo', photo);
    
    try {
      if (isEditing) {
        await api.put(`/admin/candidates/${editId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Candidate updated successfully');
      } else {
        await api.post('/admin/candidates', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Candidate created successfully');
      }
      fetchCandidates();
      document.querySelector('#candidateFormModal .btn-close').click();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save candidate', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedCandidate) return;
    try {
      await api.delete(`/admin/candidates/${selectedCandidate.id}`);
      showToast('Candidate deleted successfully');
      fetchCandidates();
    } catch (err) {
      showToast(err.response?.data?.error || 'Delete failed', 'error');
    }
  };

  if (loading && !data) return <PageLoader />;

  return (
    <>
      <AdminNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container-fluid px-4">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h3 className="fw-800 mb-0"><i className="fas fa-user-tie me-2 text-primary"></i>Manage Candidates</h3>
            
            <div className="d-flex gap-2">
              <form onSubmit={handleSearch} className="d-flex position-relative">
                <input 
                  type="text" 
                  className="form-control rounded-pill pe-5" 
                  placeholder="Search candidates..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ width: '250px' }}
                />
                <button type="submit" className="btn position-absolute end-0 top-0 bottom-0 border-0 text-primary">
                  <i className="fas fa-search"></i>
                </button>
              </form>
              
              <button className="btn btn-primary rounded-pill btn-glow ms-2 px-4" onClick={() => openFormModal()} data-bs-toggle="modal" data-bs-target="#candidateFormModal">
                <i className="fas fa-plus me-1"></i>New Candidate
              </button>
            </div>
          </div>

          <div className="glass-card p-0 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="ps-4">Candidate</th>
                    <th>Election</th>
                    <th>Party/Symbol</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.candidates.map(candidate => (
                    <tr key={candidate.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <img 
                            src={candidate.photo ? `/static/uploads/${candidate.photo}` : '/static/images/default-avatar.png'} 
                            alt={candidate.name}
                            className="rounded-circle object-fit-cover me-3 shadow-sm"
                            style={{ width: '50px', height: '50px' }}
                          />
                          <div>
                            <h6 className="fw-bold mb-0">{candidate.name}</h6>
                            <small className="text-muted d-block text-truncate" style={{ maxWidth: '200px' }}>{candidate.description}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">
                          {data.election_map[candidate.election_id] || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary rounded-pill me-1">{candidate.party || 'Independent'}</span>
                        {candidate.symbol && <span className="badge border border-secondary text-secondary rounded-pill">{candidate.symbol}</span>}
                      </td>
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-outline-primary rounded-pill me-1" onClick={() => openFormModal(candidate)} data-bs-toggle="modal" data-bs-target="#candidateFormModal" title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => setSelectedCandidate(candidate)} data-bs-toggle="modal" data-bs-target="#deleteCandidateModal" title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data?.candidates.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted">
                        No candidates found.
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
      <div className="modal fade" id="candidateFormModal" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content glass-card border-0">
            <div className="modal-header border-bottom border-secondary border-opacity-25">
              <h5 className="modal-title fw-bold">{isEditing ? 'Edit Candidate' : 'Add New Candidate'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {!isEditing && (
                  <div className="form-floating mb-3">
                    <select className="form-select" required value={formData.election_id} onChange={e => setFormData({...formData, election_id: e.target.value})}>
                      <option value="">Select Election</option>
                      {data?.elections.map(e => (
                        <option key={e.id} value={e.id}>{e.title} ({e.status})</option>
                      ))}
                    </select>
                    <label>Assign to Election</label>
                  </div>
                )}
                
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" />
                      <label>Candidate Name</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input type="text" className="form-control" value={formData.party} onChange={e => setFormData({...formData, party: e.target.value})} placeholder="Party" />
                      <label>Party Affiliation</label>
                    </div>
                  </div>
                </div>
                
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input type="text" className="form-control" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} placeholder="Symbol" />
                      <label>Symbol / Catchphrase</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-muted small ms-1">Candidate Photo</label>
                      <input type="file" className="form-control" accept="image/*" onChange={e => setPhoto(e.target.files[0])} />
                    </div>
                  </div>
                </div>
                
                <div className="form-floating">
                  <textarea className="form-control" style={{height: '100px'}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description"></textarea>
                  <label>Bio / Description</label>
                </div>
              </div>
              <div className="modal-footer border-top border-secondary border-opacity-25">
                <button type="button" className="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary rounded-pill btn-glow">{isEditing ? 'Save Changes' : 'Add Candidate'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal 
        id="deleteCandidateModal"
        title="Delete Candidate"
        message={
          <>
            Are you sure you want to delete candidate <strong>{selectedCandidate?.name}</strong>?
            <span className="d-block text-danger mt-2">This will remove the candidate from the election. It may affect vote counts if votes have already been cast.</span>
          </>
        }
        confirmText="Delete Candidate"
        confirmStyle="danger"
        onConfirm={handleDelete}
      />
    </>
  );
};

export default ManageCandidates;
