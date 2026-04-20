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
  Info,
  CheckCircle2,
  AlertCircle,
  CalendarX,
  Wallet,
  Clock,
  Trophy,
  MessageSquare,
  MapPin,
  ChevronRight
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import Loader from "@/components/ui/Loader";

const COLORS = ['#d30614', '#1f2937', '#f3f4f6']; // On-time, Late, Future (Professional Palette)

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill || payload[0].color }}></div>
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
        const token = sessionStorage.getItem('token');
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

        const savedName = sessionStorage.getItem('userName');
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
      { name: 'On-time Login', value: earlyCount },
      { name: 'Late Login', value: lateCount },
      { name: 'Future Days', value: futureDaysCount }
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
    }).reduce((acc, log) => {
      let mins = log.checkIn?.permissionMinutes || 0;
      const lunchReq = myRequests.find(r => r.type === 'lunch_delay' && r.date === log.date && r.status === 'approved');
      if (lunchReq) mins = Math.max(0, mins - (lunchReq.duration || 0));
      return acc + mins;
    }, 0);

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
      { name: 'Used Leave', value: balances.leave.used },
      { name: 'Remaining Leave', value: balances.leave.remaining }
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader size="lg" color="red" />
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-10 animate-in fade-in duration-700 bg-background min-h-screen pb-20">
      <header className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900 leading-tight">
          Welcome, <span className="text-[#d30614]">{userName}</span>
        </h1>
        <p className="text-gray-500 text-base md:text-lg font-normal">
          Dashboard summary for {format(new Date(), 'MMMM yyyy')}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Attendance Breakdown */}
        <Card className="border-gray-100 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-2 border-b border-gray-50">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-900 font-medium">
              <CalendarCheck2 className="w-5 h-5 text-[#d30614]" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
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
                 <span className="text-2xl font-medium">{attendanceLogs.length}</span>
                 <span className="text-[9px] text-gray-400 uppercase tracking-wider">Days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salary Summary */}
        <Card className="border-gray-100 shadow-sm bg-white rounded-2xl md:col-span-2 lg:col-span-1 border-t-4 border-t-[#d30614]">
          <CardHeader className="pb-4 border-b border-gray-50">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-900 font-medium">
              <Wallet className="w-5 h-5 text-[#d30614]" />
              Monthly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="text-[10px] text-gray-400 font-normal uppercase tracking-widest">Est. Net Salary</div>
              <div className="text-4xl font-medium text-gray-900 tracking-tight">
                ₹{payrollSummary?.estimatedNetSalary?.toLocaleString('en-IN') || '0'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-[9px] text-gray-400 font-normal uppercase tracking-widest">Base Salary</div>
                  <div className="text-base font-medium text-gray-900">₹{payrollSummary?.baseSalary?.toLocaleString('en-IN') || '0'}</div>
               </div>
               <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-[9px] text-gray-400 font-normal uppercase tracking-widest">LOP Days</div>
                  <div className="text-base font-medium text-red-600">{payrollSummary?.totalLOPDays || 0}</div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Balance */}
        <Card className="border-gray-100 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-2 border-b border-gray-50">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-900 font-medium">
              <CalendarDays className="w-5 h-5 text-[#d30614]" />
              Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
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
                 <span className="text-2xl font-medium">{balances.leave.remaining}</span>
                 <span className="text-[9px] text-gray-400 uppercase tracking-wider">Remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefit Usage Stats */}
        <div className="md:col-span-2 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck2 className="w-8 h-8" />
               </div>
               <div>
                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Days Present</div>
                  <div className="text-3xl font-medium text-gray-900">{payrollSummary?.presentDays || 0}</div>
               </div>
            </CardContent>
          </Card>
          <Card className="border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CalendarX className="w-8 h-8" />
               </div>
               <div>
                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">LOP History</div>
                  <div className="text-3xl font-medium text-gray-900">{payrollSummary?.totalLOPDays || 0}</div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BENIFIT PROGRESS */}
      <Card className="border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50/50">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-gray-500">Utilization Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">Casual Leave Status</span>
                  <span className="font-medium">{balances.leave.remaining} / {balances.leave.total}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#d30614] transition-all duration-1000" style={{ width: `${(balances.leave.used / balances.leave.total) * 100}%` }}></div>
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">Permission Balance</span>
                  <span className="font-medium">{balances.permission.remaining}h / {balances.permission.total}h</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-900 transition-all duration-1000" style={{ width: `${(balances.permission.used / balances.permission.total) * 100}%` }}></div>
                </div>
            </div>
          </CardContent>
      </Card>

      {/* PERFORMANCE CARDS */}
      {weeklyScores.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-medium text-gray-900 tracking-tight">Weekly Performance</h2>
            <Link to="/dashboard/performance-history">
              <Button variant="ghost" size="sm" className="text-xs font-medium text-gray-400 hover:text-[#d30614]">
                History <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {weeklyScores.map((score, idx) => (
              <Card key={idx} className="border-gray-100 shadow-sm bg-white rounded-2xl hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{score.team?.name}</h3>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Week {format(parseISO(score.weekStartDate), 'MMM dd')}</p>
                    </div>
                    <Badge variant="outline" className={`px-2 py-1 rounded-lg ${score.assessment?.color} border-current bg-transparent text-[10px] uppercase`}>
                      {score.assessment?.title}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">{score.totalCredits}<span className="text-xs font-normal text-gray-400 ml-1">/100</span></div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-900 transition-all duration-1000" style={{ width: `${score.totalCredits}%` }}></div>
                    </div>
                  </div>
                  {score.feedback && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex gap-3">
                      <MessageSquare className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 italic">{score.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* LOGS TABLE SECTION */}
      <Card className="border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-6 md:p-8 border-b border-gray-100">
          <CardTitle className="text-xl md:text-2xl font-medium flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#d30614]" />
            Recent Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="pl-6 h-12 uppercase text-[10px] font-medium tracking-widest text-gray-500">Date</TableHead>
                  <TableHead className="uppercase text-[10px] font-medium tracking-widest text-gray-500">Login</TableHead>
                  <TableHead className="uppercase text-[10px] font-medium tracking-widest text-gray-500">Logout</TableHead>
                  <TableHead className="uppercase text-[10px] font-medium tracking-widest text-gray-500">Permission</TableHead>
                  <TableHead className="text-right pr-6 uppercase text-[10px] font-medium tracking-widest text-gray-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-400">No recent activity found.</TableCell>
                  </TableRow>
                ) : (
                  weeklyLogs.map((log, i) => (
                    <TableRow key={i} className="hover:bg-gray-50 transition-all border-gray-50">
                      <TableCell className="font-medium text-gray-900 pl-6 py-4">
                        {format(parseISO(log.date), 'EEE, MMM dd')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-1 rounded text-xs font-medium ${log.checkIn?.status === 'late' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                               {log.checkIn?.time || '--:--'}
                           </span>
                           {log.checkIn?.location && (
                             <a href={`https://www.google.com/maps?q=${log.checkIn.location.lat},${log.checkIn.location.lng}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#d30614]"><MapPin className="w-3.5 h-3.5" /></a>
                           )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <span className="bg-gray-200 text-gray-900 px-2 py-1 rounded text-xs font-medium">
                              {log.checkOut?.time || '--:--'}
                           </span>
                           {log.checkOut?.location && (
                             <a href={`https://www.google.com/maps?q=${log.checkOut.location.lat},${log.checkOut.location.lng}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#d30614]"><MapPin className="w-3.5 h-3.5" /></a>
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {log.checkIn?.permissionMinutes ? `${log.checkIn.permissionMinutes} min` : '0'}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge className={`font-medium text-[9px] uppercase ${log.status?.includes('late') ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`} variant="outline">
                          {log.status || 'Verified'}
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

      {/* INFO FOOTER */}
      <Card className="border-none shadow-sm overflow-hidden bg-gray-900 text-white rounded-2xl">
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
               <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4>Casual Leaves</h4>
               </div>
               <p className="text-xs text-gray-400 leading-relaxed">
                  Monthly limit: <strong>{settings?.casualLeaveLimit ?? 1} day</strong>. Unused days are purged monthly.
               </p>
            </div>
            <div className="space-y-3">
               <div className="flex items-center gap-2 text-white font-medium">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h4>Permissions</h4>
               </div>
               <p className="text-xs text-gray-400 leading-relaxed">
                  Limit: <strong>{settings?.monthlyPermissionHours ?? 3} hours</strong>. Excess hours trigger LOP tiers.
               </p>
            </div>
            <div className="space-y-3">
               <div className="flex items-center gap-2 text-white font-medium">
                  <AlertCircle className="w-5 h-5 text-[#d30614]" />
                  <h4>Sandwich Policy</h4>
               </div>
               <p className="text-xs text-gray-400 leading-relaxed">
                  Monday/Saturday absences incur double LOP penalty.
               </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
