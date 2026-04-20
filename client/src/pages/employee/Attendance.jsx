import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  CalendarDays,
  Zap,
  Clock,
  Coffee,
  CheckCircle2,
  Calendar,
  Timer,
  TrendingUp,
  Home,
  Building2,
  LogOut,
  List,
  LayoutGrid,
  MapPin,
  LogIn,
  Fingerprint,
  Info
} from "lucide-react";
import { getCurrentLocation } from '@/utils/location';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parse, format } from 'date-fns';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import Loader from "@/components/ui/Loader";
import CalendarView from '@/components/CalendarView';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const Attendance = () => {
  const [attendanceState, setAttendanceState] = useState('idle');
  const [workingMode, setWorkingMode] = useState('WFH');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [sessionTimes, setSessionTimes] = useState({
    checkIn: null,
    lunchOut: null,
    lunchIn: null,
    checkOut: null
  });
  const [userTimings, setUserTimings] = useState(null);
  const [lateReason, setLateReason] = useState('');
  const [showLateDialog, setShowLateDialog] = useState(false);
  const [lunchDelayReason, setLunchDelayReason] = useState('');
  const [showLunchDelayDialog, setShowLunchDelayDialog] = useState(false);
  const [estimatedEarnings, setEstimatedEarnings] = useState(null);
  const [activeTab, setActiveTab] = useState('terminal'); 
  const [viewMode, setViewMode] = useState('list'); 
  const [filterPeriod, setFilterPeriod] = useState('monthly'); 
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('attendance'); 

  useEffect(() => {
    fetchCurrentStatus();
    fetchUserTimings();
    fetchEstimatedEarnings();
    fetchLogs();
  }, [filterPeriod]);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'x-auth-token': token };
      const [attendRes, auditRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/logs`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/audit-logs`, { headers })
      ]);
      setAttendanceLogs(attendRes.data);
      setAuditLogs(auditRes.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchEstimatedEarnings = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payroll/my-summary`, {
        headers: { 'x-auth-token': token }
      });
      setEstimatedEarnings(res.data);
    } catch (err) {
      console.error("Error fetching earnings:", err);
    }
  };

  const fetchUserTimings = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth`, {
        headers: { 'x-auth-token': token }
      });
      setUserTimings(res.data.timingSettings);
    } catch (err) {
      console.error("Error fetching user timings:", err);
    }
  };

  const fetchCurrentStatus = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/today`, {
        headers: { 'x-auth-token': token }
      });
      
      if (res.data) {
        const data = res.data;
        setSessionTimes({
          checkIn: data.checkIn?.time || null,
          lunchOut: data.lunch?.out || null,
          lunchIn: data.lunch?.in || null,
          checkOut: data.checkOut?.time || null
        });
        setWorkingMode(data.checkIn?.mode || 'WFH');
        
        if (data.leaveStatus === 'leave') setAttendanceState('leave');
        else if (data.isHoliday) setAttendanceState('holiday');
        else if (data.checkOut?.time) setAttendanceState('completed');
        else if (data.lunch?.out && !data.lunch?.in) setAttendanceState('lunch');
        else if (data.checkIn?.time) setAttendanceState('working');
      }
    } catch (err) {
      console.error("Error fetching status:", err);
    }
  };

  const handleAction = async (action) => {
    setLoading(true);
    const location = await getCurrentLocation();
    
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      let res;

      switch (action) {
        case 'check-in':
          const now = new Date();
          const checkInLimit = parse('14:30', 'HH:mm', new Date());
          if (now > checkInLimit && !lateReason) {
            setShowLateDialog(true);
            setLoading(false);
            return;
          }
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/checkin`, { 
            mode: workingMode,
            lateReason: lateReason,
            location
          }, config);
          setAttendanceState('working');
          setSessionTimes(prev => ({ ...prev, checkIn: res.data.checkIn.time }));
          setLateReason('');
          setShowLateDialog(false);
          fetchEstimatedEarnings();
          break;
        case 'lunch-out':
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/lunchout`, {}, config);
          setAttendanceState('lunch');
          setSessionTimes(prev => ({ ...prev, lunchOut: res.data.lunch.out }));
          break;
        case 'lunch-in':
          const lunchInNow = new Date();
          const lunchLimitOut = parse('14:00', 'HH:mm', new Date());
          const lunchLimitIn = parse('14:30', 'HH:mm', new Date());
          let isLunchSpecialCase = false;
          if (sessionTimes.lunchOut) {
            const lunchOutTime = parse(sessionTimes.lunchOut, 'HH:mm', new Date());
            isLunchSpecialCase = lunchOutTime > lunchLimitOut && lunchInNow > lunchLimitIn;
          } else {
            isLunchSpecialCase = lunchInNow > lunchLimitIn;
          }
          if (isLunchSpecialCase && !lunchDelayReason) {
            setShowLunchDelayDialog(true);
            setLoading(false);
            return;
          }
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/lunchin`, { 
            delayReason: lunchDelayReason 
          }, config);
          setAttendanceState('working');
          setSessionTimes(prev => ({ ...prev, lunchIn: res.data.lunch.in }));
          setShowLunchDelayDialog(false);
          setLunchDelayReason('');
          fetchEstimatedEarnings();
          break;
        case 'check-out':
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/checkout`, { 
            reason: '',
            location
          }, config);
          setAttendanceState('completed');
          setSessionTimes(prev => ({ ...prev, checkOut: res.data.checkOut.time }));
          fetchEstimatedEarnings();
          break;
        default:
          break;
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    switch(attendanceState) {
      case 'idle': return { label: 'Ready', color: 'bg-slate-500', icon: Zap };
      case 'working': return { label: 'On Duty', color: 'bg-emerald-500', icon: Clock };
      case 'lunch': return { label: 'Lunch Break', color: 'bg-amber-500', icon: Coffee };
      case 'completed': return { label: 'Shift Ended', color: 'bg-rose-500', icon: CheckCircle2 };
      case 'holiday': return { label: 'Company Holiday', color: 'bg-zinc-900', icon: Calendar };
      case 'leave': return { label: 'Approved Leave', color: 'bg-emerald-500', icon: Coffee };
      default: return { label: 'Offline', color: 'bg-slate-400', icon: Zap };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const combinedLogs = useMemo(() => {
    let logs = [];
    if (logFilter === 'attendance' || logFilter === 'all') {
      logs = [...logs, ...attendanceLogs.map(l => ({ ...l, type: 'attendance', timestamp: new Date(l.date + (l.checkIn?.time ? 'T' + l.checkIn.time : '')) }))];
    }
    if (logFilter === 'audit' || logFilter === 'all') {
      logs = [...logs, ...auditLogs.map(l => ({ ...l, type: 'audit', timestamp: new Date(l.timestamp) }))];
    }
    logs.sort((a, b) => b.timestamp - a.timestamp);
    return logs.filter(log => {
      if (filterPeriod === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return log.timestamp >= weekAgo;
      }
      return true;
    });
  }, [attendanceLogs, auditLogs, filterPeriod, logFilter]);

  const stats = [
    { label: 'Avg. Login', value: '09:12 AM', icon: Clock },
    { label: 'On-Time Rate', value: '94%', icon: CheckCircle2 },
    { label: 'Active Days', value: attendanceLogs.length, icon: Calendar },
    { label: 'Perm. Used', value: `${estimatedEarnings?.totalPermissionHours || 0}h`, icon: Timer },
    { label: 'Est. Salary', value: `₹${estimatedEarnings?.estimatedNetSalary?.toLocaleString() || 0}`, icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 md:p-8 lg:p-10 space-y-8 animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900">
            Shift <span className="text-[#d30614]">Management</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg font-normal">
            Track and manage your daily attendance status and logs
          </p>
        </div>

        {estimatedEarnings && (
          <Card className="bg-[#fffe01] border-none shadow-sm p-6 rounded-2xl flex items-center gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Monthly Estimate</span>
              <div className="text-3xl font-bold text-black">₹{estimatedEarnings.estimatedNetSalary.toLocaleString()}</div>
            </div>
            <div className="h-10 w-[1px] bg-black/10"></div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Status</span>
              <Badge className="bg-black/10 text-black border-none hover:bg-black/20 text-[10px] font-bold">LIVE SYNC</Badge>
            </div>
          </Card>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className={`border-gray-100 shadow-sm bg-white rounded-2xl ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-0.5">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Tabs */}
      <div className="flex justify-center md:justify-start">
        <div className="flex bg-gray-100/80 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'terminal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'logs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Records
          </button>
        </div>
      </div>

      {activeTab === 'terminal' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Status Card */}
          <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-8 md:p-12 relative text-center">
            {loading && (
              <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-sm">
                <Loader size="lg" color="red" />
              </div>
            )}
            
            <div className="space-y-10 w-full max-w-sm">
              <div className="flex flex-col items-center gap-4">
                <div className={`p-6 rounded-[2rem] ${statusConfig.color} shadow-lg shadow-current/10`}>
                  <StatusIcon className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Current Status</span>
                  <div className="text-4xl font-bold text-gray-900 uppercase tracking-tight">{statusConfig.label}</div>
                </div>
              </div>

              <div className="space-y-4">
                {attendanceState === 'idle' && (
                  <div className="space-y-6">
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full">
                      <button
                        onClick={() => setWorkingMode('WFH')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${workingMode === 'WFH' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                      >
                        <Home className="w-4 h-4" /> Remote (WFH)
                      </button>
                      <button
                        onClick={() => setWorkingMode('WFO')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${workingMode === 'WFO' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                      >
                        <Building2 className="w-4 h-4" /> Office (WFO)
                      </button>
                    </div>
                    
                    <Button
                      disabled={loading}
                      onClick={() => handleAction('check-in')}
                      className="w-full py-10 bg-gray-900 hover:bg-[#d30614] text-white text-xl font-bold rounded-2xl shadow-xl transition-all active:scale-95"
                    >
                      Process Check-in
                    </Button>
                  </div>
                )}

                {attendanceState === 'working' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!sessionTimes.lunchIn && (
                      <Button
                        disabled={loading}
                        onClick={() => handleAction('lunch-out')}
                        className="py-8 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-md transition-all h-auto flex flex-col"
                      >
                        <Coffee className="w-6 h-6 mb-2" /> Lunch Break
                      </Button>
                    )}
                    <Button
                      disabled={loading}
                      onClick={() => handleAction('check-out')}
                      className={`py-8 bg-zinc-900 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-md transition-all h-auto flex flex-col ${sessionTimes.lunchIn ? 'col-span-2' : ''}`}
                    >
                      <LogOut className="w-6 h-6 mb-2" /> End Shift
                    </Button>
                  </div>
                )}

                {attendanceState === 'lunch' && (
                  <Button
                    disabled={loading}
                    onClick={() => handleAction('lunch-in')}
                    className="w-full py-10 bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold rounded-2xl shadow-xl transition-all active:scale-95"
                  >
                    Resume Working
                  </Button>
                )}

                {attendanceState === 'completed' && (
                   <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Shift Finalized</h3>
                      <p className="text-xs text-emerald-700 font-medium">Your work logs for today have been successfully recorded and synced.</p>
                   </div>
                )}

                {(attendanceState === 'holiday' || attendanceState === 'leave') && (
                  <div className="p-10 bg-gray-100 rounded-3xl space-y-4">
                    <StatusIcon className="w-12 h-12 text-gray-400 mx-auto" />
                    <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{statusConfig.label}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">Operations are suspended for your profile today as per the organizational calendar.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Times Log Snapshot */}
          <div className="space-y-6">
            <Card className="border-gray-100 shadow-sm rounded-3xl bg-white p-6">
               <CardHeader className="p-0 pb-4 border-b border-gray-50 mb-6">
                  <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Timer className="w-4 h-4" /> Today's Timeline
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-0 space-y-6">
                  {[
                    { label: 'Check-in', time: sessionTimes.checkIn, icon: LogIn, color: 'text-gray-900' },
                    { label: 'Lunch Out', time: sessionTimes.lunchOut, icon: Coffee, color: 'text-amber-500' },
                    { label: 'Lunch In', time: sessionTimes.lunchIn, icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'Check-out', time: sessionTimes.checkOut, icon: LogOut, color: 'text-rose-500' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gray-50 ${item.color}`}>
                             <item.icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-gray-600">{item.label}</span>
                       </div>
                       <span className={`text-sm font-bold font-mono ${item.time ? 'text-gray-900' : 'text-gray-200'}`}>
                          {item.time || '00:00:00'}
                       </span>
                    </div>
                  ))}
               </CardContent>
            </Card>

            <Card className="border-[#fffe01] bg-[#fffe01]/10 rounded-3xl p-6 border-dashed border-2">
              <div className="flex gap-4">
                <Info className="w-6 h-6 text-yellow-600 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider">Operational Note</p>
                  <p className="text-xs text-yellow-700 leading-relaxed font-medium">Ensure your GPS is enabled for check-in/out to avoid validation errors.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-gray-100 shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-6 md:p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-3">
              <CalendarDays className="w-6 h-6 text-[#d30614]" /> Records Log
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {['weekly', 'monthly'].map(p => (
                  <button key={p} onClick={() => setFilterPeriod(p)} className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${filterPeriod === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {['attendance', 'audit', 'all'].map(f => (
                  <button key={f} onClick={() => setLogFilter(f)} className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${logFilter === f ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                {[List, LayoutGrid, CalendarDays].map((Icon, idx) => {
                  const modes = ['list', 'table', 'calendar'];
                  const mode = modes[idx];
                  return (
                    <Button
                      key={idx}
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setViewMode(mode)}
                      className={`h-8 w-8 rounded-lg transition-all ${viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="py-40 flex flex-col items-center gap-4">
                <Loader color="red" size="lg" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Synchronizing Terminal Logs...</span>
              </div>
            ) : (
              <div className={`${viewMode === 'calendar' ? 'p-0' : 'p-6 md:p-10'}`}>
                {viewMode === 'list' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5 duration-500">
                    {combinedLogs.length === 0 ? (
                      <div className="col-span-full py-20 text-center text-gray-400 uppercase font-bold text-xs tracking-widest border-2 border-dashed border-gray-100 rounded-3xl">No operational logs found</div>
                    ) : (
                      combinedLogs.map((log, i) => (
                        <Card key={i} className="border-gray-100 shadow-sm hover:shadow-xl hover:border-black/5 transition-all rounded-2xl group overflow-hidden">
                           <div className="p-5 space-y-4">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.type === 'attendance' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                       {log.type === 'attendance' ? <LogIn className="w-5 h-5" /> : <Fingerprint className="w-5 h-5" />}
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.type}</p>
                                       <p className="text-sm font-bold text-gray-900">{format(new Date(log.timestamp), 'MMM dd, yyyy')}</p>
                                    </div>
                                 </div>
                                 {log.type === 'attendance' ? (
                                    <Badge className={`${log.status?.includes('late') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} border-none text-[9px] font-black uppercase px-2`}>
                                      {log.status || 'SYNCED'}
                                    </Badge>
                                 ) : (
                                    <Badge className="bg-zinc-900 text-[#fffe01] border-none text-[9px] font-black uppercase px-2">AUDIT</Badge>
                                 )}
                              </div>
                              
                              {log.type === 'attendance' ? (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                   <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                                      <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Check-in</span>
                                      <span className="font-mono text-sm text-gray-900">{log.checkIn?.time || '--:--'}</span>
                                   </div>
                                   <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                                      <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Check-out</span>
                                      <span className="font-mono text-sm text-gray-900">{log.checkOut?.time || '--:--'}</span>
                                   </div>
                                </div>
                              ) : (
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                                   <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Activity</span>
                                   <p className="text-xs font-medium text-gray-700 line-clamp-2">{log.action || log.details || 'System event recorded'}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between pt-2">
                                 <div className="flex items-center gap-1.5 text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold">{format(new Date(log.timestamp), 'hh:mm a')}</span>
                                 </div>
                                 {log.checkIn?.mode && (
                                   <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                      <MapPin className="w-3 h-3 text-red-400" />
                                      {log.checkIn.mode}
                                   </div>
                                 )}
                              </div>
                           </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {viewMode === 'table' && (
                  <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm animate-in fade-in duration-500">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="pl-10 h-16 text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] w-48">Timestamp</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Category</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Record / Action</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Environment</TableHead>
                          <TableHead className="text-right pr-10 text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Validation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {combinedLogs.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-32 text-gray-400 uppercase font-bold text-xs tracking-widest opacity-50">Operational logs absent</TableCell></TableRow>
                        ) : (
                          combinedLogs.map((log, i) => (
                            <TableRow key={i} className="hover:bg-gray-50 group transition-all">
                              <TableCell className="pl-10 py-6">
                                <div className="flex flex-col">
                                   <span className="font-bold text-gray-900 text-sm">{format(new Date(log.timestamp), 'MMM dd, yyyy')}</span>
                                   <span className="text-[10px] text-gray-400 font-bold font-mono">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                 <Badge variant="outline" className={`text-[9px] font-black uppercase ${log.type === 'attendance' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-indigo-600 border-indigo-100 bg-indigo-50'}`}>
                                    {log.type}
                                 </Badge>
                              </TableCell>
                              <TableCell>
                                 {log.type === 'attendance' ? (
                                   <div className="flex items-center gap-6">
                                      <div className="space-y-0.5">
                                         <span className="text-[9px] font-bold text-gray-400 uppercase block">In</span>
                                         <span className="font-mono text-xs font-bold text-gray-900">{log.checkIn?.time || '--:--'}</span>
                                      </div>
                                      <div className="space-y-0.5">
                                         <span className="text-[9px] font-bold text-gray-400 uppercase block">Out</span>
                                         <span className="font-mono text-xs font-bold text-gray-900">{log.checkOut?.time || '--:--'}</span>
                                      </div>
                                   </div>
                                 ) : (
                                   <span className="text-xs font-bold text-gray-700">{log.action || log.details || 'System event'}</span>
                                 )}
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-red-500 opacity-50" />
                                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-tight">{log.checkIn?.mode || 'LOCAL_IP'}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-right pr-10">
                                 <Badge className={`text-[9px] font-black uppercase ${log.status?.includes('late') ? 'bg-amber-100 text-amber-700 shadow-sm' : log.type === 'audit' ? 'bg-zinc-900 text-[#fffe01]' : 'bg-emerald-100 text-emerald-700 shadow-sm'}`}>
                                   {log.status || (log.type === 'audit' ? 'LOGGED' : 'SYNCED')}
                                 </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {viewMode === 'calendar' && (
                  <div className="animate-in zoom-in-95 duration-500">
                    <CalendarView />
                  </div>
                )}
              </div>
            ) }
          </CardContent>
        </Card>
      )}

      {/* Re-entry Dialog */}
      <Dialog open={showLunchDelayDialog} onOpenChange={setShowLunchDelayDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-3xl p-8 bg-white border-none shadow-2xl">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
              <Coffee className="w-8 h-8 text-amber-500" />
            </div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl font-bold">Lunch Re-entry Validation</DialogTitle>
              <DialogDescription className="text-xs font-medium text-gray-400">
                An extended lunch break was detected. Please provide a brief reason for the delay to resume your session.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <Textarea 
              placeholder="Provide reason for delay..."
              value={lunchDelayReason}
              onChange={(e) => setLunchDelayReason(e.target.value)}
              className="resize-none rounded-xl border-gray-100 focus:ring-[#d30614] h-32"
            />
            <div className="grid grid-cols-2 gap-4">
               <Button variant="ghost" onClick={() => setShowLunchDelayDialog(false)} className="rounded-xl font-bold uppercase text-xs">Cancel</Button>
               <Button 
                 disabled={!lunchDelayReason.trim() || loading}
                 onClick={() => handleAction('lunch-in')}
                 className="rounded-xl bg-[#d30614] hover:bg-gray-900 text-white font-bold uppercase text-xs"
               >
                 Resume Duty
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Late Entry Dialog */}
      <Dialog open={showLateDialog} onOpenChange={setShowLateDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-3xl p-8 bg-white border-none shadow-2xl">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-[#d30614]" />
            </div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl font-bold">Check-in Validation</DialogTitle>
              <DialogDescription className="text-xs font-medium text-gray-400">
                You are checking in after the standard commencement time. A justification is required to initialize your session.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <Textarea 
              placeholder="Reason for late check-in..."
              value={lateReason}
              onChange={(e) => setLateReason(e.target.value)}
              className="resize-none rounded-xl border-gray-100 focus:ring-[#d30614] h-32"
            />
            <div className="grid grid-cols-2 gap-4">
               <Button variant="ghost" onClick={() => setShowLateDialog(false)} className="rounded-xl font-bold uppercase text-xs">Cancel</Button>
               <Button 
                 disabled={!lateReason.trim() || loading}
                 onClick={() => handleAction('check-in')}
                 className="rounded-xl bg-[#d30614] hover:bg-gray-900 text-white font-bold uppercase text-xs"
               >
                 Confirm Check-in
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
