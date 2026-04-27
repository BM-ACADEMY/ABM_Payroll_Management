import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Users2, 
  UserCheck2, 
  CalendarClock, 
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  UserPlus,
  LayoutDashboard,
  Bell,
  IndianRupee
} from "lucide-react";
import { lazy, Suspense } from 'react';
import axios from 'axios';
import Loader from "@/components/ui/Loader";

const DashboardCharts = lazy(() => import('./DashboardCharts'));

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      const [statsRes, employeesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats`, config),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/employees?limit=5&fields=employeeId,name,role,baseSalary`, config)
      ]);

      setStats(statsRes.data.stats || []);
      setChartData(statsRes.data.chartData || []);
      setEmployees(Array.isArray(employeesRes.data.employees) ? employeesRes.data.employees : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const IconMap = {
    Users: Users2,
    CheckCircle2: UserCheck2,
    AlertCircle: CalendarClock,
    Clock: ShieldAlert
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-6">
        <div className="relative">
          <Loader size="lg" color="#fffe01" />
          <div className="absolute inset-0 bg-[#fffe01]/20 blur-2xl rounded-full animate-pulse"></div>
        </div>
        <p className="text-[10px] font-black text-[#fffe01] uppercase tracking-[0.4em] animate-pulse">Synchronizing Analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-12 bg-slate-50 min-h-screen pb-32 animate-fade-up relative overflow-hidden">
      {/* Refined Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 text-slate-400 mb-1">
             <div className="w-8 h-[1px] bg-slate-300 rounded-full"></div>
             <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Operational Overview</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 leading-none">
            ADMIN <span className="text-slate-400">DASHBOARD</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-medium max-w-xl">
            Real-time management of organizational personnel and payroll logic.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* <Button 
            variant="outline" 
            size="icon" 
            className="rounded-xl bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm"
          >
            <Bell className="w-4 h-4" />
          </Button> */}
          {/* <Button 
            onClick={() => navigate('/admin/emails')} 
            className="bg-[#fffe01] hover:bg-black hover:text-white text-black font-bold rounded-xl px-8 h-12 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Enroll Staff
          </Button> */}
        </div>
      </div>

      {/* Stats Grid - Dark Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {stats.map((stat, i) => {
          const Icon = IconMap[stat.icon] || Users2;
          const isWarning = stat.label.toLowerCase().includes('absent') || stat.label.toLowerCase().includes('alerts');
          return (
            <Card key={i} className="neat-card h-40">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-lg ${isWarning ? 'bg-red-500/20 text-red-500' : 'bg-[#fffe01]/20 text-[#fffe01]'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="bg-white/5 text-slate-400 font-bold text-[9px] border-none px-2 py-0.5 rounded">
                    LIVE
                  </Badge>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                   <div className="flex items-baseline gap-2">
                     <span className={`text-4xl font-bold tracking-tight tabular-nums ${isWarning ? 'text-red-500' : 'text-white'}`}>{stat.value}</span>
                     <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center opacity-40">
                       <TrendingUp className="w-3 h-3 mr-0.5" /> +2%
                     </span>
                   </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
        {/* Attendance Pulse - Dark Card */}
        <Card className="xl:col-span-1 neat-card overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold text-white tracking-tight uppercase">Attendance Pulse</CardTitle>
                  <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time engagement telemetry</CardDescription>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#fffe01] animate-pulse"></div>
             </div>
          </CardHeader>
          <CardContent className="p-8 h-[340px] flex items-center justify-center">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-slate-500 font-bold text-[10px] uppercase tracking-widest">Compiling stream...</div>}>
              <DashboardCharts 
                chartData={chartData.map(d => ({
                  ...d,
                  color: d.name === 'Absent' ? '#ef4444' : (d.name === 'Present' ? '#fffe01' : '#1f2937')
                }))} 
              />
            </Suspense>
          </CardContent>
        </Card>

        {/* Directory Snapshot - Dark Card */}
        <Card className="xl:col-span-2 neat-card overflow-hidden">
          <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-white/5 bg-white/[0.01]">
            <div className="space-y-1">
               <CardTitle className="text-lg font-bold text-white tracking-tight uppercase">Talent Roster</CardTitle>
               <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent acquisitions & performance logs</CardDescription>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/admin/employees')}
                className="text-[10px] font-bold bg-grey-200 text-white hover:text-black hover:bg-[#fffe01] border-white/10 uppercase tracking-widest rounded px-5 h-9 transition-all"
            >
              All Records <ChevronRight className="w-3 h-3 ml-2" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-white/[0.05]">
                  <TableRow className="border-white/5">
                    <TableHead className="text-slate-500 font-bold uppercase tracking-widest text-[9px] pl-8 py-5">UID</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase tracking-widest text-[9px] py-5">NAME</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase tracking-widest text-[9px] py-5 text-center">ROLE</TableHead>
                    <TableHead className="text-slate-500 font-bold uppercase tracking-widest text-[9px] text-right pr-8 py-5">SALARY</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.slice(0, 5).map((emp, i) => (
                    <TableRow key={i} className="hover:bg-white/[0.03] transition-all border-white/5 group">
                      <TableCell className="font-mono text-[10px] text-slate-500 pl-8 py-5">{emp.employeeId}</TableCell>
                      <TableCell className="font-bold text-white text-[13px] py-5 uppercase tracking-tight group-hover:text-[#fffe01] transition-colors">{emp.name}</TableCell>
                      <TableCell className="py-5 text-center">
                         <Badge variant="secondary" className="bg-white/10 text-white border-none font-bold text-[9px] px-3 py-0.5 rounded-full uppercase">
                            {emp.role?.name || 'Authorized'}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-[#fffe01] text-base pr-8 py-5 tabular-nums">
                         <span className="text-xs opacity-40 mr-1 font-medium italic">₹</span>{emp.baseSalary?.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Governance Banner - Light Card */}
      <Card className="bg-white border border-slate-100 rounded-2xl p-10 relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
         <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <ShieldAlert className="w-40 h-40 text-slate-900" />
         </div>
         <div className="max-w-4xl space-y-4 relative z-10">
            <div className="flex items-center gap-3">
               <div className="w-10 h-[1px] bg-slate-300 rounded-full"></div>
               <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Protocol Registry</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight uppercase">System Integrity Registry</h3>
            <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed max-w-2xl">
               All administrative operations are encrypted and logged. Current sync latency: <span className="text-slate-900 font-bold">0.4ms</span>. Verify all employee records against the central platform ledger.
            </p>
         </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
