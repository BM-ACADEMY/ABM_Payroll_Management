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
  PieChart as PieChartIcon, 
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  UserPlus
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
      const token = sessionStorage.getItem('token');
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
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader size="lg" color="red" />
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Loading Admin Stats...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-10 animate-in fade-in duration-500 bg-gray-50/20 min-h-screen pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900 leading-tight">
            Admin <span className="text-[#d30614]">Dashboard</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg font-normal">
            Comprehensive overview of organizational performance and attendance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/admin/employees')} className="bg-[#d30614] hover:bg-gray-900 text-white font-bold rounded-xl shadow-lg shadow-red-100 px-6">
            <UserPlus className="w-4 h-4 mr-2" /> All Employees
          </Button>
          <div className="hidden lg:flex flex-col items-end px-4 border-l border-gray-200">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Status</span>
             <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               ONLINE
             </span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => {
          const Icon = IconMap[stat.icon] || Users2;
          return (
            <Card key={i} className="group border-gray-100 shadow-sm bg-white rounded-2xl transition-all hover:shadow-md">
              <CardContent className="p-6 md:p-8 flex flex-col items-center md:items-start text-center md:text-left gap-4">
                <div className={`p-3 md:p-4 rounded-xl ${stat.bg} ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                   <div className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">{stat.value}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Attendance Pulse */}
        <Card className="xl:col-span-1 border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="p-6 md:p-8 pb-4">
             <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Today's Pulse</CardTitle>
                  <CardDescription className="text-xs font-medium text-gray-400 uppercase tracking-wider">Attendance Breakdown</CardDescription>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-0 h-[300px]">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-400">Loading charts...</div>}>
              <DashboardCharts chartData={chartData} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Directory Snapshot */}
        <Card className="xl:col-span-2 border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="p-6 md:p-8 pb-4 flex flex-row items-center justify-between border-b border-gray-50">
            <div>
               <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 <Users2 className="w-5 h-5 text-[#d30614]" /> Employee Registry
               </CardTitle>
               <CardDescription className="text-xs font-medium text-gray-400">Recent talent acquisitions and payroll metrics</CardDescription>
            </div>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/employees')}
                className="text-xs font-bold text-[#d30614] hover:bg-red-50 uppercase tracking-widest"
            >
              Full List <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px] pl-8">ID</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Name</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Rank</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px] text-right pr-8">Yield</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.slice(0, 5).map((emp, i) => (
                    <TableRow key={i} className="hover:bg-gray-50/50 transition-all border-gray-50">
                      <TableCell className="font-mono text-gray-400 text-xs pl-8 py-5">{emp.employeeId}</TableCell>
                      <TableCell className="font-bold text-gray-900 py-5">{emp.name}</TableCell>
                      <TableCell className="py-5">
                         <Badge variant="outline" className="bg-white border-gray-200 text-gray-500 font-bold uppercase text-[9px] px-2.5 py-1 rounded-lg">
                            {emp.role?.name || 'Staff'}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900 pr-8 py-5">
                         ₹{emp.baseSalary?.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card Responsive Full Width */}
      <Card className="bg-gray-900 text-white rounded-[2rem] border-none shadow-xl overflow-hidden p-8 md:p-12 relative">
         <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <ShieldAlert className="w-40 h-40" />
         </div>
         <div className="max-w-3xl space-y-6 relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Security & Operational Intelligence</h3>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
               All personnel telemetry is synchronized in real-time with our centralized attendance matrix. Ensure your administrative protocols are followed when overriding shift finalizations or adjusting threshold credits.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
               <Badge className="bg-[#fffe01] text-black font-bold border-none uppercase text-[10px] py-1.5 px-4 rounded-full">Automated Audit</Badge>
               <Badge className="bg-white/10 text-white border-none uppercase text-[10px] py-1.5 px-4 rounded-full">Geo-fencing Active</Badge>
            </div>
         </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
