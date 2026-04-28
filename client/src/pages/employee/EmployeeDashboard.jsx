import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarCheck2, 
  IndianRupee, 
  CalendarDays, 
  UserCheck2, 
  CheckCircle2,
  AlertCircle,
  Wallet,
  Clock,
  Trophy,
  MessageSquare,
  MapPin,
  ChevronRight,
  TrendingUp,
  Target
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import Loader from "@/components/ui/Loader";

const COLORS = ['#880505', '#fffe01', '#1f2937']; // Crimson, Volt, Dark Gray

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill || payload[0].color }}></div>
          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
            {payload[0].name}
          </p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-[#fffe01] tabular-nums">
            {payload[0].value}
          </span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Units</span>
        </div>
      </div>
    );
  }
  return null;
};

const EmployeeDashboard = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [settings, setSettings] = useState(null);
  const [weeklyScores, setWeeklyScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { 'x-auth-token': token };

        const [logsRes, summaryRes, requestsRes, settingsRes, scoresRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/logs`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/payroll/my-summary`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/requests/my-requests?limit=100`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/settings`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/scores/my-score`, { headers })
        ]);

        setAttendanceLogs(logsRes.data);
        setPayrollSummary(summaryRes.data);
        setMyRequests(requestsRes.data.requests);
        setSettings(settingsRes.data);
        setWeeklyScores(scoresRes.data);

        const savedName = localStorage.getItem('userName');
        if (savedName) setUserName(savedName.split(' ')[0]);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const daysInMonth = eachDayOfInterval({ start, end });
    
    const currentMonthLogs = attendanceLogs.filter(log => {
      const logDate = parseISO(log.date);
      return logDate >= start && logDate <= end;
    });

    const earlyCount = currentMonthLogs.filter(log => log.checkIn?.status === 'on-time').length;
    const lateCount = currentMonthLogs.filter(log => log.checkIn?.status === 'late').length;
    const futureDaysCount = daysInMonth.filter(day => day > now).length;
    
    return [
      { name: 'Logged', value: earlyCount },
      { name: 'Delayed', value: lateCount },
      { name: 'Upcoming', value: futureDaysCount }
    ];
  }, [attendanceLogs]);

  const balances = useMemo(() => {
    if (!settings || !myRequests || !attendanceLogs) return { leave: { total: 0, used: 0 }, permission: { total: 0, used: 0 } };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const usedLeaves = myRequests.filter(req => {
      const reqDate = parseISO(req.date || req.fromDateTime);
      return reqDate.getMonth() === currentMonth && 
             reqDate.getFullYear() === currentYear && 
             req.type === 'leave' && 
             req.status === 'approved';
    }).length;

    const generalPermissionMinutes = myRequests.filter(req => {
      const reqDate = parseISO(req.date || req.fromDateTime);
      return reqDate.getMonth() === currentMonth && 
             reqDate.getFullYear() === currentYear && 
             req.type === 'permission' && 
             (req.status === 'approved' || req.status === 'rejected');
    }).reduce((acc, req) => acc + (req.duration || 0), 0);

    const attendancePermissionMinutes = attendanceLogs.filter(log => {
      const logDate = parseISO(log.date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    }).reduce((acc, log) => acc + (log.checkIn?.permissionMinutes || 0), 0);

    const usedPermissionMinutes = generalPermissionMinutes + attendancePermissionMinutes;
    const usedPermissionHours = usedPermissionMinutes / 60;

    const casualLimit = settings?.casualLeaveLimit ?? 1;
    const permissionLimit = settings?.monthlyPermissionHours ?? 3;

    return {
      leave: {
        total: casualLimit,
        used: usedLeaves,
        remaining: Math.max(0, casualLimit - usedLeaves)
      },
      permission: {
        total: permissionLimit,
        used: parseFloat(usedPermissionHours.toFixed(2)),
        remaining: Math.max(0, permissionLimit - usedPermissionHours).toFixed(2)
      }
    };
  }, [settings, myRequests, attendanceLogs]);

  const leaveChartData = useMemo(() => {
    if (!balances) return [];
    return [
      { name: 'Used', value: balances.leave.used },
      { name: 'Available', value: balances.leave.remaining }
    ];
  }, [balances]);

  const weeklyLogs = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });

    return attendanceLogs.filter(log => {
      const logDate = parseISO(log.date);
      return isWithinInterval(logDate, { start, end });
    }).sort((a, b) => parseISO(b.date) - parseISO(a.date));
  }, [attendanceLogs]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-6">
        <div className="relative">
          <Loader size="lg" color="#fffe01" />
          <div className="absolute inset-0 bg-[#fffe01]/20 blur-2xl rounded-full animate-pulse"></div>
        </div>
        <p className="text-[10px] font-black text-[#fffe01] uppercase tracking-[0.4em] animate-pulse">Initializing Personal Node...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-12 bg-slate-50 min-h-screen pb-24 animate-fade-up relative overflow-hidden">
      {/* Refined Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 text-slate-400 mb-1">
             <div className="w-8 h-[1px] bg-slate-300 rounded-full"></div>
             <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Employee Portal</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 leading-none uppercase">
            Hi, <span className="text-slate-400">{userName}</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-medium">
            Personal performance and telemetry for <span className="text-slate-900 font-bold">{format(new Date(), 'MMMM yyyy')}</span>.
          </p>
        </div>

        <div className="flex items-center gap-5 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
           <div className="w-12 h-12 rounded-lg bg-[#fffe01] flex items-center justify-center shadow-sm">
              <Target className="w-6 h-6 text-black" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Efficiency Core</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                {weeklyScores[0]?.totalCredits || 0}<span className="text-xs text-slate-400 ml-1 font-medium italic">/100 pts</span>
              </p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {/* Attendance - Black Card */}
        <Card className="neat-card">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
              <CalendarCheck2 className="w-4 h-4 text-[#fffe01]" />
              Attendance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[240px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1500}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-1">
                 <span className="text-4xl font-bold text-white tracking-tighter tabular-nums">{attendanceLogs.length}</span>
                 <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">LOGS</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expected Earnings - Black Card */}
        <Card className="neat-card">
          <CardHeader className="pb-6 border-b border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
              <Wallet className="w-4 h-4 text-[#fffe01]" />
              Monthly Settlement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estimated Net</div>
              <div className="text-3xl md:text-5xl font-bold text-[#fffe01] tracking-tighter flex items-start gap-1 tabular-nums">
                <span className="text-lg mt-1.5 opacity-30 font-medium whitespace-nowrap">₹</span>
                {payrollSummary?.estimatedNetSalary?.toLocaleString('en-IN') || '0'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Base Core</div>
                  <div className="text-lg font-bold text-white tabular-nums">₹{payrollSummary?.baseSalary?.toLocaleString('en-IN') || '0'}</div>
               </div>
               <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="text-[9px] text-red-500 font-bold uppercase tracking-widest mb-1.5">LOP Loss</div>
                  <div className="text-lg font-bold text-red-500">-{payrollSummary?.totalLOPDays || 0} D</div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Balance - Black Card */}
        <Card className="neat-card">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              Resource Quota
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[240px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1500}
                  >
                    {leaveChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Used' ? '#1f2937' : '#fffe01'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-1">
                 <span className="text-4xl font-bold text-white tracking-tighter tabular-nums">{balances.leave.remaining}</span>
                 <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">REMAIN</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Industrial Progress - Black Card */}
      <Card className="neat-card overflow-hidden">
          <CardHeader className="bg-white/5 p-6 border-b border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 text-center">UTILIZATION ANALYTICS</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Casual Leave Core</span>
                    <h4 className="text-lg font-bold text-white tracking-tight uppercase">Vacation Node</h4>
                  </div>
                  <span className="text-lg font-bold text-white tabular-nums">{balances.leave.remaining} <span className="text-xs opacity-30 font-medium">/ {balances.leave.total}</span></span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#fffe01] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,254,1,0.2)]" style={{ width: `${(balances.leave.used / balances.leave.total) * 100}%` }}></div>
                </div>
            </div>
            <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Authorized Absence</span>
                    <h4 className="text-lg font-bold text-white tracking-tight uppercase">Permission Bandwidth</h4>
                  </div>
                  <span className="text-lg font-bold text-white tabular-nums">{balances.permission.remaining}h <span className="text-xs opacity-30 font-medium">/ {balances.permission.total}h</span></span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 rounded-full transition-all duration-1000 opacity-60" style={{ width: `${(balances.permission.used / balances.permission.total) * 100}%` }}></div>
                </div>
            </div>
          </CardContent>
      </Card>

      {/* Assessment Feed - Dark Cards */}
      {weeklyScores.length > 0 && (
        <div className="space-y-8 relative z-10">
          <div className="flex items-center justify-between px-4">
            <div className="space-y-1">
               <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                 <Trophy className="w-6 h-6 text-[#fffe01] drop-shadow-sm" /> Engagement Analytics
               </h2>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-9">System-verified weekly operational assessments</p>
            </div>
            <Link to="/dashboard/performance-history">
              <Button variant="outline" size="sm" className="text-[10px] font-bold text-slate-600 hover:text-black hover:bg-[#fffe01] border-slate-200 uppercase tracking-widest px-6 h-10 rounded-xl transition-all shadow-sm">
                History <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeklyScores.map((score, idx) => (
              <Card key={idx} className="neat-card group">
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-bold text-xl text-white tracking-tight uppercase group-hover:text-[#fffe01] transition-colors">{score.team?.name}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">CYCLE: {format(parseISO(score.weekStartDate), 'MMM dd')}</p>
                    </div>
                    <Badge className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase border-none tracking-widest shadow-lg ${score.assessment?.color} text-black`}>
                      {score.assessment?.title}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl md:text-5xl font-bold tracking-tighter text-white tabular-nums">{score.totalCredits}</span>
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-40">credits</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-[#fffe01] rounded-full transition-all duration-1000" style={{ width: `${score.totalCredits}%` }}></div>
                    </div>
                  </div>
                  {score.feedback && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex gap-3 text-slate-400 italic text-[12px] font-medium leading-relaxed group-hover:text-slate-300">
                      <MessageSquare className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      <p>"{score.feedback}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Registry Logs - Black Card */}
      <Card className="neat-card">
        <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-3 tracking-tight text-white uppercase">
              <Clock className="w-5 h-5 text-[#fffe01]" />
              System Registry Logs
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-8">Verified node synchronization records</p>
          </div>
          <Link to="/dashboard/logs">
             <Button variant="outline" size="sm" className="text-[10px] font-bold text-white bg-yellow hover:text-black hover:bg-[#fffe01] border-white/10 uppercase tracking-widest px-6 h-10 rounded-lg transition-all shadow-inner">
               Full Audit
             </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-white/[0.05]">
                <TableRow className="border-white/5">
                  <TableHead className="pl-10 h-16 uppercase text-[9px] font-bold tracking-widest text-slate-500">Timestamp</TableHead>
                  <TableHead className="uppercase text-[9px] font-bold tracking-widest text-slate-500 text-center">In</TableHead>
                  <TableHead className="uppercase text-[9px] font-bold tracking-widest text-slate-500 text-center">Out</TableHead>
                  <TableHead className="uppercase text-[9px] font-bold tracking-widest text-slate-500 text-center">Delay</TableHead>
                  <TableHead className="text-right pr-10 uppercase text-[9px] font-bold tracking-widest text-slate-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-slate-600 text-[10px] font-bold uppercase tracking-widest">No node telemetry found</TableCell>
                  </TableRow>
                ) : (
                  weeklyLogs.map((log, i) => (
                    <TableRow key={i} className="hover:bg-white/[0.03] transition-all border-white/5 group">
                      <TableCell className="font-mono text-[11px] text-slate-400 pl-10 py-5">
                        {format(parseISO(log.date), 'EEE, MMM dd')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1.5">
                           <span className={`px-3 py-1 rounded text-[11px] font-bold tabular-nums border transition-all ${log.checkIn?.status === 'late' ? 'bg-[#fffe01]/10 text-[#fffe01] border-[#fffe01]/20' : 'bg-white/5 text-slate-300 border-white/10'}`}>
                               {log.checkIn?.time || '--:--'}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1.5">
                           <span className="bg-white/5 text-slate-300 px-3 py-1 rounded text-[11px] font-bold tabular-nums border border-white/10">
                               {log.checkOut?.time || '--:--'}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <div className="flex flex-col items-center gap-0.5">
                            <span className="text-lg font-bold text-red-500 tabular-nums">{log.checkIn?.permissionMinutes || 0}</span>
                            <span className="text-[8px] font-bold text-slate-600 tracking-widest uppercase">min</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <Badge className={`font-bold text-[9px] py-0.5 px-3 rounded uppercase tracking-widest border-none ${log.status?.includes('late') ? 'bg-[#fffe01]/10 text-[#fffe01]' : 'bg-white/5 text-slate-400'}`}>
                           {log.status || 'Synced'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Governance Footer - Black Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 relative z-10">
          <div className="neat-card p-8 space-y-4 group transition-all duration-300 overflow-hidden relative">
             <div className="absolute -bottom-4 -right-4 opacity-[0.03] text-white">
                <CheckCircle2 className="w-24 h-24" />
             </div>
             <div className="w-10 h-10 rounded-lg bg-[#fffe01]/10 text-[#fffe01] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
             </div>
             <div className="space-y-1.5 relative z-10">
                <h4 className="text-lg font-bold text-white uppercase tracking-tight">Leave Policy</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                   Quota: <strong className="text-white">{settings?.casualLeaveLimit ?? 1} Units</strong> per month. Protocol strictly prohibits carry-over logic.
                </p>
             </div>
          </div>
          <div className="neat-card p-8 space-y-4 group transition-all duration-300 overflow-hidden relative">
             <div className="absolute -bottom-4 -right-4 opacity-[0.03] text-white">
                <Clock className="w-24 h-24" />
             </div>
             <div className="w-10 h-10 rounded-lg bg-white/5 text-white flex items-center justify-center">
                <Clock className="w-5 h-5" />
             </div>
             <div className="space-y-1.5 relative z-10">
                <h4 className="text-lg font-bold text-white uppercase tracking-tight">Permission Bandwidth</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                   Limit: <strong className="text-white">{settings?.monthlyPermissionHours ?? 3} Hours</strong>. Threshold breach triggers LOP automation.
                </p>
             </div>
          </div>
          <div className="neat-card p-8 space-y-4 group transition-all duration-300 overflow-hidden relative">
             <div className="absolute -bottom-4 -right-4 opacity-[0.03] text-red-500">
                <AlertCircle className="w-24 h-24" />
             </div>
             <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center animate-pulse">
                <AlertCircle className="w-5 h-5" />
             </div>
             <div className="space-y-1.5 relative z-10">
                <h4 className="text-lg font-bold text-red-500 uppercase tracking-tight">Critical Bypass</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                   Edge absences (Mon-Sat) initiate <strong className="text-red-500 font-bold">Sandwich Logic (Double LOP)</strong> automated deductions.
                </p>
             </div>
          </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
