import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TaskTrackerSidebar from './components/TaskTrackerSidebar';
import { Timer } from 'lucide-react';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Otp = lazy(() => import('./pages/Otp'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Employees = lazy(() => import('./pages/admin/Employees'));
const AdminAttendance = lazy(() => import('./pages/admin/AdminAttendance'));
const PermissionReview = lazy(() => import('./pages/admin/PermissionReview'));
const LeaveCalendar = lazy(() => import('./pages/admin/LeaveCalendar'));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const Attendance = lazy(() => import('./pages/employee/Attendance'));
const Permissions = lazy(() => import('./pages/employee/Permissions'));
const LeaveRequest = lazy(() => import('./pages/employee/LeaveRequest'));
const PayrollSettings = lazy(() => import('./pages/admin/PayrollSettings'));
const Profile = lazy(() => import('./pages/admin/Profile'));
const AdminPayrollReport = lazy(() => import('./pages/admin/AdminPayrollReport'));
const AdminComplaints = lazy(() => import('./pages/admin/AdminComplaints'));
const EmployeeComplaints = lazy(() => import('./pages/employee/EmployeeComplaints'));
const TeamManagement = lazy(() => import('./pages/admin/TeamManagement'));
const WeeklyScoring = lazy(() => import('./pages/admin/WeeklyScoring'));
const KanbanBoards = lazy(() => import('./pages/admin/KanbanBoards'));
const KanbanBoard = lazy(() => import('./pages/admin/KanbanBoard'));
const TimeHistory = lazy(() => import('./pages/TimeHistory'));
import { Toaster } from './components/ui/toaster';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const savedRole = sessionStorage.getItem('userRole'); 
    const savedName = sessionStorage.getItem('userName');
    const savedId = sessionStorage.getItem('userId');
    if (token && savedRole) {
      setUser({ id: savedId, role: { name: savedRole }, name: savedName || 'User' });
    }
    setLoading(false);
  }, []);

  const handleSetUser = (u) => {
    setUser(u);
    if (u) {
      sessionStorage.setItem('userRole', u.role.name);
      sessionStorage.setItem('userName', u.name);
      sessionStorage.setItem('userId', u.id);
    } else {
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userId');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const sidebarWidth = user ? (isMobile ? '0px' : (isSidebarCollapsed ? '80px' : '256px')) : '0px';

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex min-h-screen bg-background relative overflow-x-hidden text-foreground">
        {user && (
          <>
            <Sidebar 
              user={user} 
              isCollapsed={isSidebarCollapsed} 
              setIsCollapsed={setIsSidebarCollapsed} 
              isMobile={isMobile}
            />
            <TaskTrackerSidebar 
              isOpen={isTrackerOpen} 
              onClose={() => setIsTrackerOpen(false)} 
              user={user} 
            />
            {/* Floating Tracker Toggle */}
            <button 
              onClick={() => setIsTrackerOpen(!isTrackerOpen)}
              className="fixed bottom-8 right-8 w-16 h-16 bg-[#fffe01] text-black rounded-full shadow-2xl flex items-center justify-center z-[55] hover:scale-110 active:scale-95 transition-all group"
            >
              <Timer className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              <div className="absolute -top-2 -right-2 bg-black text-[#fffe01] text-[10px] font-bold px-2 py-1 rounded-full border border-[#fffe01] opacity-0 group-hover:opacity-100 transition-opacity">
                TRACKER
              </div>
            </button>
          </>
        )}
        <div 
          className="flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0" 
          style={{ marginLeft: sidebarWidth }}
        >
          {user && (
            <Navbar 
              user={user} 
              setUser={handleSetUser} 
              isSidebarCollapsed={isSidebarCollapsed} 
              isMobile={isMobile}
              setIsSidebarCollapsed={setIsSidebarCollapsed}
            />
          )}
          <main className="flex-1">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            }>
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
                  path="/admin/leave-calendar"
                  element={user?.role?.name === 'admin' ? <LeaveCalendar /> : <Navigate to="/login" />}
                />
                <Route
                  path="/admin/attendance"
                  element={user?.role?.name === 'admin' ? <AdminAttendance /> : <Navigate to="/login" />}
                />
                <Route
                  path={user?.role?.name === 'admin' ? "/admin/settings" : "/dashboard/settings"}
                  element={user?.role?.name === 'admin' ? <PayrollSettings /> : <Navigate to="/login" />}
                />
                <Route
                  path="/admin/payroll"
                  element={user?.role?.name === 'admin' ? <AdminPayrollReport /> : <Navigate to="/login" />}
                />
                <Route
                  path="/admin/complaints"
                  element={user?.role?.name === 'admin' ? <AdminComplaints /> : <Navigate to="/login" />}
                />
                <Route
                  path="/admin/teams"
                  element={user?.role?.name === 'admin' ? <TeamManagement /> : <Navigate to="/login" />}
                />
                <Route
                  path="/admin/weekly-credits"
                  element={user?.role?.name === 'admin' ? <WeeklyScoring /> : <Navigate to="/login" />}
                />
                <Route
                  path="/admin/kanban"
                  element={user?.role?.name === 'admin' ? <KanbanBoards /> : <Navigate to="/login" />}
                />
                <Route
                  path="/admin/kanban/:id"
                  element={user?.role?.name === 'admin' ? <KanbanBoard /> : <Navigate to="/login" />}
                />
                <Route
                  path="/admin/kanban/special/:type"
                  element={user?.role?.name === 'admin' ? <KanbanBoard /> : <Navigate to="/login" />}
                />
                <Route
                  path="/admin/time-history"
                  element={user?.role?.name === 'admin' ? <TimeHistory /> : <Navigate to="/login" />}
                />
                <Route
                  path="/admin/profile"
                  element={user?.role?.name === 'admin' ? <Profile setUser={handleSetUser} /> : <Navigate to="/login" />}
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
                <Route
                  path="/dashboard/leave"
                  element={user ? <LeaveRequest /> : <Navigate to="/login" />}
                />
                <Route
                  path="/dashboard/complaints"
                  element={user ? <EmployeeComplaints /> : <Navigate to="/login" />}
                />
                <Route
                  path="/dashboard/kanban"
                  element={user ? <KanbanBoards /> : <Navigate to="/login" />}
                />
                <Route
                  path="/dashboard/kanban/:id"
                  element={user ? <KanbanBoard /> : <Navigate to="/login" />}
                />
                <Route
                  path="/dashboard/kanban/special/:type"
                  element={user ? <KanbanBoard /> : <Navigate to="/login" />}
                />
                <Route
                  path="/dashboard/time-history"
                  element={user ? <TimeHistory /> : <Navigate to="/login" />}
                />
                <Route path="/" element={<Navigate to={user ? (user.role?.name === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
      <Toaster />
    </Router>
  );
}

export default App;
