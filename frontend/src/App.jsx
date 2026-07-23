import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Voter Pages
import VoterDashboard from './pages/voter/Dashboard';
import Elections from './pages/voter/Elections';
import ElectionDetails from './pages/voter/ElectionDetails';
import VotePage from './pages/voter/VotePage';
import VoteReceipt from './pages/voter/VoteReceipt';
import Results from './pages/voter/Results';
import WinnerPage from './pages/voter/WinnerPage';
import Profile from './pages/voter/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageElections from './pages/admin/ManageElections';
import ManageCandidates from './pages/admin/ManageCandidates';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loader"><div className="loader-spinner"><div className="spinner-ring"></div>Loading...</div></div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/voter/dashboard'} /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/voter/dashboard'} /> : <RegisterPage />} />

        {/* Voter Routes */}
        <Route path="/voter/*" element={<ProtectedRoute />}>
          <Route path="dashboard" element={<VoterDashboard />} />
          <Route path="elections" element={<Elections />} />
          <Route path="election/:id" element={<ElectionDetails />} />
          <Route path="vote/:id" element={<VotePage />} />
          <Route path="vote-receipt/:id" element={<VoteReceipt />} />
          <Route path="results/:id" element={<Results />} />
          <Route path="winner/:id" element={<WinnerPage />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminRoute />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="elections" element={<ManageElections />} />
          <Route path="candidates" element={<ManageCandidates />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;
