import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('userRole');
    const savedName = localStorage.getItem('userName');
    if (token && savedRole) {
      setUser({ role: savedRole, name: savedName || 'User' });
    }
    setLoading(false);
  }, []);

  const handleSetUser = (u) => {
    setUser(u);
    if (u) {
      localStorage.setItem('userRole', u.role);
      localStorage.setItem('userName', u.name);
    } else {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-950">
        {user && <Sidebar user={user} />}
        <div className="flex-1 flex flex-col" style={{ marginLeft: user ? '256px' : '0' }}>
          {user && <Navbar user={user} setUser={handleSetUser} />}
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={!user ? <Login setUser={handleSetUser} /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />
              <Route
                path="/admin"
                element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/dashboard"
                element={user ? <EmployeeDashboard /> : <Navigate to="/login" />}
              />
              <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
