import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Otp from './pages/Otp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import Employees from './pages/admin/Employees';
import PermissionReview from './pages/admin/PermissionReview';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import Attendance from './pages/employee/Attendance';
import Permissions from './pages/employee/Permissions';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('userRole'); // Stores the string name (e.g., 'admin')
    const savedName = localStorage.getItem('userName');
    if (token && savedRole) {
      setUser({ role: { name: savedRole }, name: savedName || 'User' });
    }
    setLoading(false);
  }, []);

  const handleSetUser = (u) => {
    setUser(u);
    if (u) {
      localStorage.setItem('userRole', u.role.name);
      localStorage.setItem('userName', u.name);
    } else {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        {user && <Sidebar user={user} />}
        <div className="flex-1 flex flex-col" style={{ marginLeft: user ? '256px' : '0' }}>
          {user && <Navbar user={user} setUser={handleSetUser} />}
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={!user ? <Login setUser={handleSetUser} /> : <Navigate to={user.role?.name === 'admin' ? '/admin' : '/dashboard'} />} />
              <Route path="/signup" element={!user ? <Signup /> : <Navigate to={user.role?.name === 'admin' ? '/admin' : '/dashboard'} />} />
              <Route path="/otp" element={!user ? <Otp /> : <Navigate to={user.role?.name === 'admin' ? '/admin' : '/dashboard'} />} />
              <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to={user.role?.name === 'admin' ? '/admin' : '/dashboard'} />} />
              <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to={user.role?.name === 'admin' ? '/admin' : '/dashboard'} />} />
              <Route
                path="/admin"
                element={user?.role?.name === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/employees"
                element={user?.role?.name === 'admin' ? <Employees /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/permissions"
                element={user?.role?.name === 'admin' ? <PermissionReview /> : <Navigate to="/login" />}
              />
              <Route
                path="/dashboard"
                element={user ? <EmployeeDashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/dashboard/logs"
                element={user ? <Attendance /> : <Navigate to="/login" />}
              />
              <Route
                path="/dashboard/permissions"
                element={user ? <Permissions /> : <Navigate to="/login" />}
              />
              <Route path="/" element={<Navigate to={user ? (user.role?.name === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
