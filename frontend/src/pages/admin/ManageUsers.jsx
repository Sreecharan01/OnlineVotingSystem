import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import PageLoader from '../../components/PageLoader';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';

const ManageUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  const search = searchParams.get('search') || '';
  const roleFilter = searchParams.get('role') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const [searchInput, setSearchInput] = useState(search);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve', 'enable', 'disable', 'delete'

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page]);

  const fetchUsers = () => {
    setLoading(true);
    api.get(`/admin/users?search=${search}&role=${roleFilter}&page=${page}`)
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
    setSearchParams({ search: searchInput, role: roleFilter, page: 1 });
  };

  const handleFilter = (e) => {
    setSearchParams({ search, role: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ search, role: roleFilter, page: newPage });
  };

  const handleExport = () => {
    window.location.href = 'http://127.0.0.1:5000/api/admin/export/users';
  };

  const confirmAction = async () => {
    if (!selectedUser) return;
    try {
      if (actionType === 'delete') {
        await api.delete(`/admin/users/${selectedUser.id}`);
      } else {
        await api.put(`/admin/users/${selectedUser.id}/${actionType}`);
      }
      showToast(`Action successful`);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed', 'error');
    }
  };

  const openModal = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
  };

  if (loading && !data) return <PageLoader />;

  return (
    <>
      <AdminNavbar />
      <div className="dashboard-content" style={{ paddingTop: '80px' }}>
        <div className="container-fluid px-4">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h3 className="fw-800 mb-0"><i className="fas fa-users me-2 text-primary"></i>Manage Users</h3>
            
            <div className="d-flex gap-2">
              <form onSubmit={handleSearch} className="d-flex position-relative">
                <input 
                  type="text" 
                  className="form-control rounded-pill pe-5" 
                  placeholder="Search by name or email..." 
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
                value={roleFilter}
                onChange={handleFilter}
                style={{ width: '130px' }}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="voter">Voter</option>
              </select>
              
              <button onClick={handleExport} className="btn btn-outline-success rounded-pill ms-2">
                <i className="fas fa-file-csv me-1"></i>Export
              </button>
            </div>
          </div>

          <div className="glass-card p-0 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="ps-4">User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.users.map(user => (
                    <tr key={user.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <img 
                            src={user.profile_picture ? `/static/uploads/${user.profile_picture}` : '/static/images/default-avatar.png'} 
                            alt={user.name}
                            className="rounded-circle object-fit-cover me-3 shadow-sm"
                            style={{ width: '40px', height: '40px' }}
                          />
                          <div>
                            <h6 className="fw-bold mb-0">{user.name}</h6>
                            <small className="text-muted">{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-primary bg-opacity-10 text-primary'} rounded-pill text-uppercase`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {!user.approved ? (
                          <span className="badge bg-warning text-dark rounded-pill"><i className="fas fa-clock me-1"></i>Pending</span>
                        ) : user.disabled ? (
                          <span className="badge bg-secondary rounded-pill"><i className="fas fa-ban me-1"></i>Disabled</span>
                        ) : (
                          <span className="badge bg-success bg-opacity-10 text-success rounded-pill"><i className="fas fa-check-circle me-1"></i>Active</span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted fw-600">{new Date(user.created_at).toLocaleDateString()}</small>
                      </td>
                      <td className="text-end pe-4">
                        {!user.approved && (
                          <button className="btn btn-sm btn-success rounded-pill me-1 mb-1" onClick={() => openModal(user, 'approve')} data-bs-toggle="modal" data-bs-target="#userActionModal" title="Approve">
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        {user.approved && !user.disabled && user.role !== 'admin' && (
                          <button className="btn btn-sm btn-warning rounded-pill me-1 mb-1" onClick={() => openModal(user, 'disable')} data-bs-toggle="modal" data-bs-target="#userActionModal" title="Disable">
                            <i className="fas fa-ban"></i>
                          </button>
                        )}
                        {user.disabled && (
                          <button className="btn btn-sm btn-info text-white rounded-pill me-1 mb-1" onClick={() => openModal(user, 'enable')} data-bs-toggle="modal" data-bs-target="#userActionModal" title="Enable">
                            <i className="fas fa-unlock"></i>
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button className="btn btn-sm btn-outline-danger rounded-pill mb-1" onClick={() => openModal(user, 'delete')} data-bs-toggle="modal" data-bs-target="#userActionModal" title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data?.users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        No users found.
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

      <ConfirmModal 
        id="userActionModal"
        title="Confirm Action"
        message={
          <>
            Are you sure you want to {actionType} user <strong>{selectedUser?.name}</strong>?
            {actionType === 'delete' && <span className="d-block text-danger mt-2">This will permanently delete the user's account and cannot be undone. Their cast votes will remain anonymous.</span>}
          </>
        }
        confirmText={actionType === 'delete' ? 'Delete User' : 'Confirm'}
        confirmStyle={actionType === 'delete' ? 'danger' : 'primary'}
        onConfirm={confirmAction}
      />
    </>
  );
};

export default ManageUsers;
