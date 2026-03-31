import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  Briefcase, 
  Loader2, 
  Home, 
  Building2, 
  Coffee, 
  LogOut, 
  Zap,
  CheckCircle2,
  Calendar,
  Timer,
  AlertCircle,
  TrendingUp,
  List,
  LayoutGrid,
  CalendarDays
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parse, format } from 'date-fns';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import CalendarView from '@/components/CalendarView';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const [earlyLogoutReason, setEarlyLogoutReason] = useState('');
  const [showEarlyLogoutDialog, setShowEarlyLogoutDialog] = useState(false);
  const [estimatedEarnings, setEstimatedEarnings] = useState(null);
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal', 'logs'
  const [viewMode, setViewMode] = useState('list'); // 'list', 'table', 'calendar'
  const [filterPeriod, setFilterPeriod] = useState('monthly'); // 'weekly', 'monthly'
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchCurrentStatus();
    fetchUserTimings();
    fetchEstimatedEarnings();
    fetchAttendanceLogs();
  }, [filterPeriod]);

  const fetchAttendanceLogs = async () => {
    setLogsLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/logs`, {
        headers: { 'x-auth-token': token }
      });
      // Sort and filter handled client-side for better UX in this small-scale app
      setAttendanceLogs(res.data);
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
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      let res;

      switch (action) {
        case 'check-in':
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/checkin`, { 
            mode: workingMode,
            lateReason: '' 
          }, config);
          setAttendanceState('working');
          setSessionTimes(prev => ({ ...prev, checkIn: res.data.checkIn.time }));
          setLateReason('');
          fetchEstimatedEarnings();
          break;
        case 'lunch-out':
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/lunchout`, {}, config);
          setAttendanceState('lunch');
          setSessionTimes(prev => ({ ...prev, lunchOut: res.data.lunch.out }));
          break;
        case 'lunch-in':
          if (userTimings && sessionTimes.lunchOut) {
            const now = new Date();
            const lunchOutTime = parse(sessionTimes.lunchOut, 'HH:mm', new Date());
            
            const limitOut = parse('14:00', 'HH:mm', new Date());
            const limitIn = parse('14:30', 'HH:mm', new Date());
            
            const isSpecialCase = lunchOutTime > limitOut && now > limitIn;

            if (isSpecialCase && !lunchDelayReason) {
              setShowLunchDelayDialog(true);
              setLoading(false);
              return;
            }
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
            reason: '' 
          }, config);
          setAttendanceState('completed');
          setSessionTimes(prev => ({ ...prev, checkOut: res.data.checkOut.time }));
          setEarlyLogoutReason('');
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
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err.response?.data?.msg || "Could not apply for leave"
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
      case 'holiday': return { label: 'Company Holiday', color: 'bg-black', icon: Calendar };
      case 'leave': return { label: 'Approved Leave', color: 'bg-emerald-500', icon: Coffee };
      default: return { label: 'Offline', color: 'bg-slate-400', icon: Zap };
    }
  };

  const StatusConfig = getStatusConfig(attendanceState);
  const StatusIcon = StatusConfig.icon;
  const user = JSON.parse(sessionStorage.getItem('user')) || { name: 'Employee' };

  const filteredLogs = attendanceLogs.filter(log => {
     if (filterPeriod === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(log.date) >= weekAgo;
     }
     return true; // monthly or all for now
  });

  const stats = [
    { label: 'Avg. Login', value: '09:12 AM', icon: Clock },
    { label: 'On-Time Rate', value: '94%', icon: CheckCircle2 },
    { label: 'Active Days', value: filteredLogs.length, icon: Calendar },
    { label: 'Perm. Used', value: `${estimatedEarnings?.totalPermissionHours || 0}h`, icon: Timer },
    { label: 'Est. Salary', value: `₹${estimatedEarnings?.estimatedNetSalary?.toLocaleString() || 0}`, icon: TrendingUp }
  ];

  return (
    <div className="min-h-full bg-background p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-black font-medium mb-1">
            <div className="w-10 h-10 rounded-2xl bg-[#fffe01]/10 flex items-center justify-center shadow-sm">
              <Timer className="w-6 h-6 text-black" />
            </div>
            <span className="text-sm tracking-[0.2em] uppercase font-normal">Live Shift Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-gray-900">
            Attendance <span className="text-[#d30614]">Tracker</span>
          </h1>
          <p className="text-gray-500 font-normal max-w-xl leading-relaxed">System-monitored workspace for managing your professional hours and shift logs in real-time.</p>
        </div>

        {estimatedEarnings && (
          <div className="flex flex-col items-end gap-1 px-10 py-5 bg-[#fffe01] text-black rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-1000">
               <TrendingUp className="w-20 h-20 text-black" />
            </div>
            <span className="text-[9px] font-normal text-black/60 uppercase tracking-[0.2em] relative z-10">Live Monthly Yield</span>
            <div className="flex items-center gap-3 relative z-10">
              <span className="text-4xl font-medium tracking-tighter text-black">₹{estimatedEarnings.estimatedNetSalary.toLocaleString()}</span>
              <div className="flex items-center gap-1 bg-black/10 px-2 py-0.5 rounded-full border border-black/20">
                 <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></div>
                 <span className="text-[8px] font-medium text-black uppercase tracking-tighter">Live</span>
              </div>
            </div>
            <div className="flex items-center gap-2 relative z-10 mt-1">
               <span className="text-[8px] font-normal text-black/70 uppercase tracking-widest">LOP: {estimatedEarnings.totalLOPDays}D</span>
               <div className="w-1 h-1 rounded-full bg-black/20"></div>
               <span className="text-[8px] font-normal text-black/70 uppercase tracking-widest">Perm: {estimatedEarnings.totalPermissionHours}h</span>
            </div>
          </div>
        )}

        
        <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-2xl shadow-sm">
           <div className="flex flex-col px-6 border-r border-gray-200">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">Operational Date</span>
              <span className="text-sm font-normal text-gray-900">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
           </div>
           <div className="flex flex-col px-6">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">Status Protocol</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${StatusConfig.color.replace('bg-', 'bg-')} shadow-lg shadow-current/20 animate-pulse`}></div>
                <span className="text-sm font-normal text-gray-900 uppercase tracking-tight">{StatusConfig.label}</span>
              </div>
           </div>
        </div>
      </header>
<br/>
      {/* Analytics Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-[#fffe01]/10 transition-colors">
                  <stat.icon className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                  <p className="text-xl font-medium text-gray-900 tracking-tight">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100/50 border border-gray-200 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`px-8 py-3 rounded-xl text-xs font-medium uppercase tracking-widest transition-all ${
            activeTab === 'terminal' 
              ? 'bg-black text-[#fffe01] shadow-lg' 
              : 'text-gray-400 hover:text-black hover:bg-white'
          }`}
        >
          Live Terminal
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-8 py-3 rounded-xl text-xs font-medium uppercase tracking-widest transition-all ${
            activeTab === 'logs' 
              ? 'bg-black text-[#fffe01] shadow-lg' 
              : 'text-gray-400 hover:text-black hover:bg-white'
          }`}
        >
          Audit Logs
        </button>
      </div>

      <div className="space-y-10 items-start">
        {activeTab === 'terminal' ? (
          <div className="lg:col-span-12 max-w-5xl mx-auto w-full">
            <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden relative">
              {loading && (
                <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-md transition-all">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-black animate-spin shadow-inner"></div>
                    <span className="text-black font-medium text-xs tracking-[0.3em] uppercase animate-pulse">Synchronizing Session...</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left Side: Configuration */}
                <div className="p-10 md:p-14 bg-gray-50/50 border-r border-gray-200">
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <Label className="text-gray-600 font-medium text-xs uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#fffe01]"></div>
                        Work Environment Selection
                      </Label>
                      <div className="grid grid-cols-2 gap-4 p-2 bg-gray-100 border border-gray-200 rounded-2xl shadow-inner">
                        <button
                          onClick={() => setWorkingMode('WFH')}
                          disabled={attendanceState !== 'idle'}
                          className={`flex flex-col items-center gap-3 py-8 rounded-xl transition-all duration-500 ${
                            workingMode === 'WFH' 
                              ? 'bg-[#fffe01] text-black shadow-lg scale-[1.03]' 
                              : 'bg-transparent text-gray-400 hover:bg-white active:scale-95'
                          } ${attendanceState !== 'idle' ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <Home className={`w-7 h-7 ${workingMode === 'WFH' ? 'text-black' : 'text-gray-400'}`} />
                          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">{workingMode === 'WFH' ? 'ACTIVE' : ''} HOME</span>
                        </button>
                        
                        <button
                          onClick={() => setWorkingMode('WFO')}
                          disabled={attendanceState !== 'idle'}
                          className={`flex flex-col items-center gap-3 py-8 rounded-xl transition-all duration-500 ${
                            workingMode === 'WFO' 
                              ? 'bg-[#fffe01] text-black shadow-lg scale-[1.03]' 
                              : 'bg-transparent text-gray-400 hover:bg-white active:scale-95'
                          } ${attendanceState !== 'idle' ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <Building2 className={`w-7 h-7 ${workingMode === 'WFO' ? 'text-black' : 'text-gray-400'}`} />
                          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">{workingMode === 'WFO' ? 'ACTIVE' : ''} OFFICE</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Label className="text-gray-600 font-medium text-xs uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#fffe01]"></div>
                        Session Timeline
                      </Label>
                      <div className="grid grid-cols-2 gap-5">
                        {[
                          { label: 'Clock-In', time: sessionTimes.checkIn, icon: Clock, color: 'text-black', bg: 'bg-[#fffe01]/10' },
                          { label: 'Clock-Out', time: sessionTimes.checkOut, icon: LogOut, color: 'text-rose-500', bg: 'bg-rose-50' },
                          { label: 'Lunch Start', time: sessionTimes.lunchOut, icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-50' },
                          { label: 'Lunch End', time: sessionTimes.lunchIn, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                        ].map((item, i) => (
                          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center gap-3 transition-all hover:border-gray-300 group">
                            <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                              <item.icon className={`w-6 h-6 ${item.color}`} />
                            </div>
                            <div className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.2em]">{item.label}</div>
                            <div className={`text-lg font-medium tracking-tight ${item.time ? 'text-gray-900' : 'text-gray-200'}`}>
                              {item.time || '--:--'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Primary Actions */}
                <div className="p-10 md:p-14 flex flex-col justify-center items-center h-full bg-white relative">
                  <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none">
                     <Zap className="w-64 h-64 text-indigo-600 rotate-12" />
                  </div>

                  {workingMode === 'WFO' && attendanceState === 'idle' ? (
                    <div className="space-y-10 text-center animate-in slide-in-from-right-8 duration-700">
                      <div className="w-40 h-40 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center shadow-sm group">
                        <Building2 className="w-20 h-20 text-gray-300 group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-medium text-gray-900 tracking-tighter uppercase">Biometric Link Required</h3>
                        <p className="text-gray-500 font-normal leading-relaxed max-w-[320px] mx-auto text-sm">
                          Shift data must be captured via the <span className="text-black font-medium">Authorized Office Fingerprint Device</span>.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-3 py-2 px-6 border border-gray-200 text-black bg-gray-50 rounded-full font-medium text-[10px] tracking-widest uppercase shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-black animate-ping"></div>
                        Terminal Recognition Active
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-sm space-y-10 animate-in zoom-in-95 duration-500">
                      <div className="flex flex-col items-center gap-5">
                          <StatusIcon className={`w-16 h-16 ${StatusConfig.color.replace('bg-', 'text-')} drop-shadow-xl animate-pulse`} />
                          <div className="flex flex-col items-center gap-1">
                             <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.4em]">Protocol Status</span>
                             <span className={`text-4xl font-medium ${StatusConfig.color.replace('bg-', 'text-')} tracking-tighter uppercase`}>
                               {StatusConfig.label}
                             </span>
                          </div>
                      </div>

                      <div className="space-y-6">
                        {attendanceState === 'idle' && (
                          <Button
                            disabled={loading}
                            onClick={() => handleAction('check-in')}
                            className="group w-full py-16 text-3xl font-medium bg-[#fffe01] hover:bg-indigo-600 text-black shadow-lg transition-all hover:-translate-y-2 active:scale-[0.98] rounded-2xl flex flex-col gap-2 relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                              <Zap className="w-32 h-32" />
                            </div>
                            <span className="tracking-tighter relative z-10 uppercase text-4xl">Start Day</span>
                            <span className="text-[11px] font-medium opacity-80 uppercase tracking-[0.4em] relative z-10">Initialize Session</span>
                          </Button>
                        )}

                        {attendanceState === 'working' && (
                          <div className="space-y-6">
                            <Button
                              disabled={loading}
                              onClick={() => handleAction('lunch-out')}
                              className="w-full py-12 text-2xl font-medium bg-white border-2 border-amber-400 text-amber-500 hover:bg-amber-50 shadow-md transition-all hover:-translate-y-1 rounded-2xl flex flex-col gap-1"
                            >
                              <span className="tracking-tight uppercase">Lunch Break</span>
                              <span className="text-[10px] font-normal opacity-70 uppercase tracking-[0.3em]">Pause Session</span>
                            </Button>
                            <Button
                              disabled={loading}
                              onClick={() => handleAction('check-out')}
                              className="w-full py-12 text-2xl font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-all hover:-translate-y-1 rounded-2xl flex flex-col gap-1"
                            >
                              <span className="tracking-tight uppercase">Clock-Out</span>
                              <span className="text-[10px] font-normal opacity-70 uppercase tracking-[0.3em]">Terminate Session</span>
                            </Button>
                          </div>
                        )}

                        {attendanceState === 'lunch' && (
                          <Button
                            disabled={loading}
                            onClick={() => handleAction('lunch-in')}
                            className="w-full py-16 text-3xl font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all hover:-translate-y-2 active:scale-[0.98] rounded-2xl flex flex-col gap-2"
                          >
                            <span className="tracking-tighter uppercase text-white">RESUME WORK</span>
                            <span className="text-[11px] font-normal opacity-80 uppercase tracking-[0.4em] text-white">Continue Session</span>
                          </Button>
                        )}

                        {attendanceState === 'completed' && (
                          <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-400 blur-[60px] opacity-10 transition-opacity"></div>
                            <div className="relative text-center p-14 bg-white border-2 border-emerald-200 rounded-2xl shadow-sm">
                              <div className="w-24 h-24 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-8 shadow-inner">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                              </div>
                              <h3 className="text-3xl font-medium text-gray-900 tracking-tighter uppercase mb-3">Day Finalized</h3>
                              <p className="text-gray-500 font-normal text-sm leading-relaxed mb-8">
                                Professional summary synchronized accurately across the central network.
                              </p>
                              <div className="flex items-center justify-center gap-3 py-2 px-6 bg-gray-50 rounded-full inline-flex">
                                 <div className="flex -space-x-3">
                                   {[1,2,3].map(i => (
                                     <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-gray-200" />
                                   ))}
                                 </div>
                                 <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest pl-2">System Verified</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {attendanceState === 'holiday' && (
                          <div className="relative group animate-in zoom-in-95 duration-700">
                            <div className="relative text-center p-14 bg-white border-2 border-[#fffe01]/30 rounded-2xl shadow-sm">
                              <div className="w-28 h-28 mx-auto rounded-2xl bg-[#fffe01]/10 flex items-center justify-center mb-10 shadow-inner group-hover:rotate-6 transition-transform">
                                <Calendar className="w-14 h-14 text-black" />
                              </div>
                              <h3 className="text-4xl font-medium text-gray-900 tracking-tighter uppercase mb-4">Official Holiday</h3>
                              <p className="text-gray-500 font-normal text-md leading-relaxed mb-10">
                                Marked as a company-wide day of rest. No operations required.
                              </p>
                              <div className="inline-block">
                                  <Badge variant="outline" className="border-2 border-[#fffe01]/30 text-black bg-[#fffe01]/5 rounded-2xl py-3 px-8 font-medium text-xs tracking-[0.3em] uppercase shadow-sm">
                                    OFF DUTY
                                  </Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        {attendanceState === 'leave' && (
                          <div className="relative group animate-in zoom-in-95 duration-700">
                            <div className="relative text-center p-14 bg-white border-2 border-emerald-200 rounded-2xl shadow-sm">
                              <div className="w-28 h-28 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-10 shadow-inner group-hover:rotate-6 transition-transform">
                                <Coffee className="w-14 h-14 text-emerald-500" />
                              </div>
                              <h3 className="text-4xl font-medium text-gray-900 tracking-tighter uppercase mb-4">On Leave</h3>
                              <p className="text-gray-500 font-normal text-md leading-relaxed mb-10">
                                Your leave request has been approved. Enjoy your time off and relax! No operations required today.
                              </p>
                              <div className="inline-block">
                                  <Badge variant="outline" className="border-2 border-emerald-200 text-emerald-600 bg-emerald-50 rounded-2xl py-3 px-8 font-medium text-xs tracking-[0.3em] uppercase shadow-sm">
                                    RELAXING
                                  </Badge>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="border border-gray-200 shadow-sm rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col">
            <CardHeader className="p-10 border-b border-gray-100 bg-gray-50/30 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="space-y-1">
                 <CardTitle className="text-2xl font-medium flex items-center gap-3">
                   <Calendar className="w-7 h-7 text-black" />
                   Attendance History
                 </CardTitle>
                 <CardDescription className="text-gray-500 font-normal">Review your professional engagement logs</CardDescription>
               </div>

               <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
                  {/* Period Filter */}
                  <div className="flex p-1 bg-gray-50 rounded-xl mr-2">
                    {['weekly', 'monthly'].map(p => (
                      <button
                        key={p}
                        onClick={() => setFilterPeriod(p)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                          filterPeriod === p ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  
                  {/* View Mode Selector */}
                  <div className="flex gap-1 border-l border-gray-100 pl-3">
                    {[
                      { mode: 'list', icon: List },
                      { mode: 'table', icon: LayoutGrid },
                      { mode: 'calendar', icon: CalendarDays }
                    ].map(v => (
                      <Button
                        key={v.mode}
                        variant={viewMode === v.mode ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode(v.mode)}
                        className={`rounded-xl ${viewMode === v.mode ? 'bg-[#fffe01] text-black hover:bg-[#fffe01]' : 'text-gray-400'}`}
                      >
                        <v.icon className="w-5 h-5" />
                      </Button>
                    ))}
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
               {logsLoading ? (
                 <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="w-12 h-12 text-black animate-spin" />
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Retrieving Logs...</span>
                 </div>
               ) : (
                 <>
                   {viewMode === 'list' ? (
                     <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredLogs.map((log, i) => (
                          <div key={i} className="group p-6 rounded-[2rem] border border-gray-100 bg-white hover:border-[#fffe01] hover:shadow-xl transition-all duration-500 flex flex-col gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-[4rem] flex items-center justify-center group-hover:bg-[#fffe01]/10 transition-colors">
                               <span className="text-2xl font-medium text-gray-300 group-hover:text-black transition-colors">{new Date(log.date).getDate()}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em]">{format(new Date(log.date), 'EEEE')}</span>
                              <h4 className="text-lg font-medium text-gray-900 tracking-tight">{format(new Date(log.date), 'MMMM dd, yyyy')}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
                                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">In</span>
                                  <span className="text-sm font-medium text-gray-900">{log.checkIn?.time || '--:--'}</span>
                               </div>
                               <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
                                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Out</span>
                                  <span className="text-sm font-medium text-gray-900">{log.checkOut?.time || '--:--'}</span>
                               </div>
                            </div>
                            <div className="flex justify-between items-center">
                               <Badge className={`uppercase text-[10px] font-bold tracking-widest py-1.5 px-4 rounded-full border-0 ${
                                 log.status?.includes('late') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                               }`}>
                                 {log.status || 'Verified'}
                               </Badge>
                               {log.checkIn?.mode && (
                                 <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em]">{log.checkIn.mode}</span>
                               )}
                            </div>
                          </div>
                        ))}
                     </div>
                   ) : viewMode === 'table' ? (
                     <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow className="border-gray-100 h-16">
                            <TableHead className="pl-10 font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em]">Date</TableHead>
                            <TableHead className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em]">Login</TableHead>
                            <TableHead className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em]">Logout</TableHead>
                            <TableHead className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em]">Environment</TableHead>
                            <TableHead className="text-right pr-10 font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLogs.map((log, i) => (
                            <TableRow key={i} className="h-20 hover:bg-gray-50/50 transition-colors border-gray-50">
                              <TableCell className="pl-10 font-medium text-gray-900">
                                 <div className="flex flex-col">
                                   <span>{format(new Date(log.date), 'MMM dd, yyyy')}</span>
                                   <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{format(new Date(log.date), 'EEEE')}</span>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <span className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-900">{log.checkIn?.time || '--:--'}</span>
                              </TableCell>
                              <TableCell>
                                 <span className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-900">{log.checkOut?.time || '--:--'}</span>
                              </TableCell>
                              <TableCell>
                                 <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-gray-200">{log.checkIn?.mode || 'OFFICE'}</Badge>
                              </TableCell>
                              <TableCell className="text-right pr-10">
                                 <Badge className={`uppercase text-[9px] font-bold tracking-widest py-1 px-3 rounded-full border-0 ${
                                   log.status?.includes('late') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                 }`}>
                                   {log.status || 'Present'}
                                 </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                     </Table>
                   ) : (
                     <div className="pb-20 p-10">
                        <CalendarView />
                     </div>
                   )}
                 </>
               )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lunch Delay Dialog */}
      <Dialog open={showLunchDelayDialog} onOpenChange={setShowLunchDelayDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-gray-200 shadow-xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3 text-amber-500 mb-2">
              <Coffee className="w-6 h-6" />
              <DialogTitle className="text-xl font-medium uppercase tracking-tight text-gray-900">Lunch Delay Reason</DialogTitle>
            </div>
            <DialogDescription className="text-gray-500 font-normal">
              Lunch logout after 2:00 PM and login after 2:30 PM requires a reason for admin approval.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
               <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">Reason for Delay</Label>
                <Textarea 
                  placeholder="Enter reason..."
                  value={lunchDelayReason}
                  onChange={(e) => setLunchDelayReason(e.target.value)}
                  className="min-h-[120px] rounded-2xl border border-gray-200 bg-gray-50 p-4 font-normal transition-all text-gray-900 focus:border-black"
                />
             </div>
             <div className="flex gap-4">
                <Button variant="outline" onClick={() => setShowLunchDelayDialog(false)} className="flex-1 h-14 rounded-2xl font-medium uppercase text-[10px] tracking-widest border border-gray-200 text-gray-500">
                  Cancel
                </Button>
                <Button 
                  disabled={!lunchDelayReason.trim() || loading}
                  onClick={() => handleAction('lunch-in')}
                  className="flex-1 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-medium uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/10"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Resume'}
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
