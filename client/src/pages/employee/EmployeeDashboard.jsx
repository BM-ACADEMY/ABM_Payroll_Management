import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarCheck2, 
  Briefcase, 
  IndianRupee, 
  FileText, 
  CalendarDays, 
  UserCheck2, 
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarX,
  Wallet,
  Clock,
  Trophy,
  MessageSquare
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

const COLORS = ['#fffe01', '#000000', '#f3f4f6']; // Early, Late, Future

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 border border-gray-100 rounded-xl shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill || payload[0].color }}></div>
          <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            {payload[0].name}
          </p>
        </div>
        <p className="text-xl font-medium mt-1 text-gray-900">
          {payload[0].value} <span className="text-[10px] text-gray-400 font-normal uppercase">Days</span>
        </p>
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

        // Fetch all necessary data in parallel
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

  // Calculate Chart Data
  const chartData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const daysInMonth = eachDayOfInterval({ start, end });
    
    // Filter logs for current month only
    const currentMonthLogs = attendanceLogs.filter(log => {
      const logDate = parseISO(log.date);
      return logDate >= start && logDate <= end;
    });

    const earlyCount = currentMonthLogs.filter(log => log.checkIn?.status === 'on-time').length;
    const lateCount = currentMonthLogs.filter(log => log.checkIn?.status === 'late').length;
    
    // Calculate future days (excluding Sundays and holidays if possible, but keeping it simple for now)
    const futureDaysCount = daysInMonth.filter(day => day > now).length;
    
    return [
      { name: 'On-time Login', value: earlyCount },
      { name: 'Late Login', value: lateCount },
      { name: 'Future Days', value: futureDaysCount }
    ];
  }, [attendanceLogs]);


  // Calculate Leave/Permission Balance
  const balances = useMemo(() => {
    if (!settings || !myRequests || !attendanceLogs) return { leave: { total: 0, used: 0 }, permission: { total: 0, used: 0 } };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // 1. Calculate Used Leaves (Approved only)
    const usedLeaves = myRequests.filter(req => {
      const reqDate = parseISO(req.date || req.fromDateTime);
      return reqDate.getMonth() === currentMonth && 
             reqDate.getFullYear() === currentYear && 
             req.type === 'leave' && 
             req.status === 'approved';
    }).length;

    // 2. Calculate Used Permission Minutes
    // A. General permissions (Deduct if Approved OR Rejected)
    const generalPermissionMinutes = myRequests.filter(req => {
      const reqDate = parseISO(req.date || req.fromDateTime);
      // Ensure we are comparing with the SAME month and year
      return reqDate.getMonth() === currentMonth && 
             reqDate.getFullYear() === currentYear && 
             req.type === 'permission' && 
             (req.status === 'approved' || req.status === 'rejected');
    }).reduce((acc, req) => acc + (req.duration || 0), 0);

    // B. Attendance-related (Late Login, Lunch Delay, Early Logout)
    // These are in attendanceLogs.checkIn.permissionMinutes
    const attendancePermissionMinutes = attendanceLogs.filter(log => {
      const logDate = parseISO(log.date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    }).reduce((acc, log) => {
      let mins = log.checkIn?.permissionMinutes || 0;
      
      // If lunch delay is approved, subtract it from the day's total 
      // (Requirement: If reason is accepted for lunch, permission should not be deducted)
      const lunchReq = myRequests.find(r => 
        r.type === 'lunch_delay' && 
        r.date === log.date && 
        r.status === 'approved'
      );
      if (lunchReq) {
        mins = Math.max(0, mins - (lunchReq.duration || 0));
      }
      return acc + mins;
    }, 0);

    const usedPermissionMinutes = generalPermissionMinutes + attendancePermissionMinutes;
    const usedPermissionHours = usedPermissionMinutes / 60;

    // Default to model defaults if settings fields are missing or 0
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

  // Leave Balance Chart Data
  const leaveChartData = useMemo(() => {
    if (!balances) return [];
    return [
      { name: 'Used Leave', value: balances.leave.used },
      { name: 'Remaining Leave', value: balances.leave.remaining }
    ];
  }, [balances]);


  // Current Week Logs
  const weeklyLogs = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(now, { weekStartsOn: 1 });

    return attendanceLogs.filter(log => {
      const logDate = parseISO(log.date);
      return isWithinInterval(logDate, { start, end });
    }).sort((a, b) => parseISO(b.date) - parseISO(a.date));
  }, [attendanceLogs]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-[#fffe01] rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Synchronizing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 bg-background min-h-full pb-20">
      <header className="flex flex-col space-y-3">
        <div className="flex items-center gap-3">
           <div className="h-10 w-2 bg-[#d30614] rounded-full shadow-sm"></div>
           <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-gray-900">
             Welcome back, <span className="text-[#d30614]">{userName}</span>
           </h1>
        </div>
        <p className="text-gray-500 text-lg font-normal max-w-2xl leading-relaxed">
          Your <span className="text-[#d30614] font-medium">performance summary</span> for {format(new Date(), 'MMMM yyyy')}.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* PIE CHART SECTION */}
        <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
          <CardHeader className="pb-2 border-b border-gray-50">
            <CardTitle className="text-xl flex items-center gap-2 text-gray-900 font-medium">
              <CalendarCheck2 className="w-5 h-5" />
              Attendance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>

              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-medium">{attendanceLogs.length}</span>
                 <span className="text-[10px] text-gray-400 uppercase tracking-wider">Total Days</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-2">
               {chartData.map((item, idx) => (
                 <div key={item.name} className="flex flex-col items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className="text-[10px] text-gray-400 font-medium uppercase text-center leading-tight mb-1">{item.name}</span>
                    <span className="text-xl font-medium text-gray-900">{item.value}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>

        {/* SALARY SUMMARY */}
        <Card className="bg-black text-[#fffe01] border-none shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <IndianRupee className="w-32 h-32" />
          </div>
          <CardHeader className="pb-4 border-b border-zinc-800">
            <CardTitle className="text-xl flex items-center gap-2 text-[#fffe01] font-medium">
              <Wallet className="w-5 h-5" />
              Monthly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="space-y-1">
              <div className="text-[10px] text-zinc-500 font-normal uppercase tracking-[0.2em]">Estimated Net Salary</div>
              <div className="text-5xl font-medium text-[#fffe01] tracking-tighter">
                ₹<span>{payrollSummary?.estimatedNetSalary?.toLocaleString('en-IN') || '0'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="text-[10px] text-zinc-500 font-normal uppercase tracking-widest">Base Salary</div>
                  <div className="text-xl font-medium text-[#fffe01] tracking-tight">₹{payrollSummary?.baseSalary?.toLocaleString('en-IN') || '0'}</div>
               </div>
               <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="text-[10px] text-zinc-500 font-normal uppercase tracking-widest">LOP Deductions</div>
                  <div className="text-xl font-medium text-[#ff3b3b] tracking-tight">{payrollSummary?.totalLOPDays || 0} Days</div>
               </div>
            </div>

            <div className="pt-4">
              <div className="flex justify-between items-center text-xs border-t border-zinc-800 pt-6">
                <span className="text-[#fffe01]">Payroll Status</span>
                <Badge className="bg-[#fffe01] text-black hover:bg-yellow-400 border-0 font-medium text-[10px]">Processing</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LEAVE BALANCE PIE CHART */}
        <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
          <CardHeader className="pb-2 border-b border-gray-50">
            <CardTitle className="text-xl flex items-center gap-2 text-gray-900 font-medium">
              <CalendarDays className="w-5 h-5" />
              Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={leaveChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leaveChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-medium">{balances.leave.total}</span>
                 <span className="text-[10px] text-gray-400 uppercase tracking-wider">Total Leave</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-2">
               {leaveChartData.map((item, idx) => (
                 <div key={item.name} className="flex flex-col items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className="text-[10px] text-gray-400 font-medium uppercase text-center leading-tight mb-1">{item.name}</span>
                    <span className="text-xl font-medium text-gray-900">{item.value}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>


        {/* LEAVE & BALANCES */}
        <div className="space-y-8">
           <div className="grid grid-cols-2 gap-6">
              <Card className="border-gray-100 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                      <UserCheck2 className="w-6 h-6" />
                   </div>
                   <div className="space-y-1">
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest leading-none">Days Present</div>
                      <div className="text-3xl font-medium text-gray-900">{payrollSummary?.presentDays || 0}</div>
                   </div>
                   <p className="text-[9px] text-gray-400 font-normal italic">Including holidays & weekends</p>
                </CardContent>
              </Card>

              <Card className="border-gray-100 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                   <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                      <CalendarX className="w-6 h-6" />
                   </div>
                   <div className="space-y-1">
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest leading-none">LOP This Month</div>
                      <div className="text-3xl font-medium text-gray-900">{payrollSummary?.totalLOPDays || 0}</div>
                   </div>
                   <p className="text-[9px] text-gray-400 font-normal italic leading-tight">Subject to policy review</p>
                </CardContent>
              </Card>
           </div>

           <Card className="border-gray-100 shadow-sm bg-white overflow-hidden">
             <CardHeader className="pb-0 pt-6 px-6 border-0">
                <CardTitle className="text-sm font-medium uppercase tracking-widest text-gray-400">Benefit Usage</CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Casual Leave Balance</span>
                      <span className="text-sm font-medium text-black">{balances.leave.remaining} / {balances.leave.total}</span>
                   </div>
                   <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#fffe01] transition-all duration-1000" 
                        style={{ width: `${(balances.leave.used / balances.leave.total) * 100}%` }}
                      ></div>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Permission Balance (Hrs)</span>
                      <span className="text-sm font-medium text-black">{balances.permission.remaining} / {balances.permission.total}</span>
                   </div>
                   <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#fffe01] transition-all duration-1000" 
                        style={{ width: `${(balances.permission.used / balances.permission.total) * 100}%` }}
                      ></div>
                   </div>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>

      {/* WEEKLY PERFORMANCE SCORES */}
      {weeklyScores.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center gap-3">
             <div className="h-6 w-1.5 bg-[#fffe01] rounded-full"></div>
             <h2 className="text-2xl font-medium tracking-tight text-gray-900">Weekly Performance <span className="text-[#d30614]">Credits</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {weeklyScores.map((score, idx) => (
              <Card key={idx} className="border-gray-100 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow rounded-2xl">
                <CardHeader className="pb-2 border-b border-gray-50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium">{score.team?.name}</CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-wider">Week starting {format(parseISO(score.weekStartDate), 'MMM dd')}</CardDescription>
                  </div>
                  <div className={`p-2 rounded-xl bg-gray-50 group-hover:bg-[#fffe01] transition-colors`}>
                    <Trophy className="w-5 h-5 text-black" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Total Credits</span>
                      <div className="text-4xl font-bold text-gray-900">{score.totalCredits}<span className="text-sm font-normal text-gray-400">/100</span></div>
                    </div>
                    <Badge className={`shadow-none font-medium px-2 py-1 rounded-lg border uppercase text-[10px] ${score.assessment?.color} border-current bg-transparent`}>
                      {score.assessment?.title}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-black transition-all duration-1000" 
                        style={{ width: `${score.totalCredits}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-zinc-500 italic leading-relaxed">
                      "{score.assessment?.msg}"
                    </p>
                  </div>

                  {score.feedback && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-[9px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Admin Feedback
                      </div>
                      <p className="text-xs text-gray-600 font-normal">{score.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* WEEKLY ACTIVITY */}
      <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-gray-100">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-3 text-gray-900 font-medium">
              <CalendarDays className="w-6 h-6 text-black" />
              This Week's Chronology
            </CardTitle>
            <CardDescription className="text-gray-500 font-normal">Real-time attendance & permission audit logs</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-gray-100">
                <TableHead className="pl-10 h-14 font-medium text-gray-500 text-[11px] uppercase tracking-wider">Date</TableHead>
                <TableHead className="font-medium text-gray-500 text-[11px] uppercase tracking-wider">Login</TableHead>
                <TableHead className="font-medium text-gray-500 text-[11px] uppercase tracking-wider">Logout</TableHead>
                <TableHead className="font-medium text-gray-500 text-[11px] uppercase tracking-wider text-center">Lunch</TableHead>
                <TableHead className="font-medium text-gray-500 text-[11px] uppercase tracking-wider">Permissions</TableHead>
                <TableHead className="text-right pr-10 font-medium text-gray-500 text-[11px] uppercase tracking-wider">Validation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-gray-400 font-normal">No activity logs recorded for this week.</TableCell>
                </TableRow>
              ) : (
                weeklyLogs.map((log, i) => (
                  <TableRow key={i} className="hover:bg-gray-50/60 transition-all border-gray-50">
                    <TableCell className="font-medium text-gray-900 pl-10 py-6 tracking-tight">
                      {format(parseISO(log.date), 'EEE, MMM dd')}
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                          {log.schedule && (
                            <span className="text-[9px] font-medium text-blue-600 border-none uppercase tracking-tighter opacity-70 mb-1">
                              Sch: {log.schedule.loginTime}
                            </span>
                          )}
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium w-fit ${log.checkIn?.status === 'late' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {log.checkIn?.time || '--:--'}
                          </span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                          {log.schedule && (
                            <span className="text-[9px] font-medium text-blue-600 border-none uppercase tracking-tighter opacity-70 mb-1">
                              Sch: {log.schedule.logoutTime}
                            </span>
                          )}
                          <span className="bg-zinc-900 text-[#fffe01] px-3 py-1.5 rounded-lg text-sm font-medium w-fit">
                             {log.checkOut?.time || '--:--'}
                          </span>
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="flex flex-col items-center">
                          {log.schedule && (
                             <span className="text-[9px] font-medium text-blue-600 border-none uppercase tracking-tighter opacity-70 mb-1">
                               Limit: {log.schedule.lunchDuration}m
                             </span>
                          )}
                          <span className="text-xs font-normal text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                             {log.lunch?.out ? `${log.lunch.out} - ${log.lunch.in || 'PND'}` : '--:--'}
                          </span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <span className="text-gray-500 text-sm font-normal">
                          {log.checkIn?.permissionMinutes ? `${log.checkIn.permissionMinutes} min` : '0 min'}
                       </span>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Badge className={`font-medium text-[10px] uppercase border px-3 rounded-full ${log.status?.includes('late') ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`} variant="outline">
                        {log.status || 'Verified'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BENEFIT PROTOCOLS INFO */}
      <Card className="border-none shadow-sm overflow-hidden bg-zinc-950 text-[#fffe01]">
        <CardHeader className="p-8 border-b border-zinc-800">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#fffe01]/10 text-[#fffe01]">
                 <Info className="w-6 h-6" />
              </div>
              <div>
                 <CardTitle className="text-xl font-medium">Benefit Protocols Policy</CardTitle>
                 <CardDescription className="text-zinc-400">Understanding your leave and permission entitlements</CardDescription>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-[#fffe01]">
                    <CheckCircle2 className="w-5 h-5" />
                    <h4 className="font-medium">Casual Leaves</h4>
                 </div>
                 <p className="text-sm text-zinc-400 leading-relaxed">
                    You are entitled to <strong>{settings?.casualLeaveLimit ?? 1}</strong> casual leave(s) per month. Unused leaves do not carry forward. Any leave taken beyond this limit is considered a Loss of Pay (LOP) day.
                 </p>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-[#fffe01]">
                    <Clock className="w-5 h-5" />
                    <h4 className="font-medium">Monthly Permissions</h4>
                 </div>
                 <p className="text-sm text-zinc-400 leading-relaxed">
                    A total of <strong>{settings?.monthlyPermissionHours ?? 3} hours</strong> of special permissions are granted monthly. Exceeding specific tiers ({settings?.permissionTier1Limit ?? 3}h or {settings?.permissionTier2Limit ?? 5}h) will trigger automatic LOP deductions as per protocol.
                 </p>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-[#fffe01]">
                    <AlertCircle className="w-5 h-5" />
                    <h4 className="font-medium">Sandwich Policy</h4>
                 </div>
                 <p className="text-sm text-zinc-400 leading-relaxed">
                    Absences or leaves taken on <strong>Mondays</strong> or <strong>Saturdays</strong> are subject to <strong>double LOP deductions</strong> (2 days) even if you have remaining casual leave.
                 </p>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;

