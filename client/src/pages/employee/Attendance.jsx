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
  TrendingUp
} from "lucide-react";
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
  const [attendanceState, setAttendanceState] = useState('idle'); // idle, working, lunch, completed, holiday
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

  useEffect(() => {
    fetchCurrentStatus();
    fetchUserTimings();
    fetchEstimatedEarnings();
  }, []);

  const fetchEstimatedEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      let res;

      switch (action) {
        case 'check-in':
          // Check if late on frontend to show dialog
          if (userTimings) {
            const now = new Date();
            const [hours, minutes] = userTimings.loginTime.split(':');
            const expected = new Date();
            expected.setHours(parseInt(hours), parseInt(minutes), 0);
            const graceLimit = new Date(expected.getTime() + (userTimings.graceTime || 15) * 60000);
            
            if (now > graceLimit && !lateReason) {
              setShowLateDialog(true);
              setLoading(false);
              return;
            }
          }
          
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/checkin`, { 
            mode: workingMode,
            lateReason 
          }, config);
          setAttendanceState('working');
          setSessionTimes(prev => ({ ...prev, checkIn: res.data.checkIn.time }));
          setShowLateDialog(false);
          setLateReason('');
          fetchEstimatedEarnings(); // Refresh for accurate permissions
          break;
        case 'lunch-out':
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/lunchout`, {}, config);
          setAttendanceState('lunch');
          setSessionTimes(prev => ({ ...prev, lunchOut: res.data.lunch.out }));
          break;
        case 'lunch-in':
          // Check if delay on frontend
          if (userTimings) {
            const lunchOutTime = parse(sessionTimes.lunchOut, 'HH:mm', new Date());
            const now = new Date();
            const durationArr = (now - lunchOutTime) / (1000 * 60);
            const maxDuration = userTimings.lunchDuration || 45;

            if (durationArr > maxDuration && !lunchDelayReason) {
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
          // Check if early logout on frontend
          if (userTimings) {
            const lunchStartTimeStr = userTimings.lunchStart || '13:30';
            const [lHours, lMinutes] = lunchStartTimeStr.split(':');
            const scheduledLunchStart = new Date();
            scheduledLunchStart.setHours(parseInt(lHours), parseInt(lMinutes), 0);

            const now = new Date();

            if (now < scheduledLunchStart && !earlyLogoutReason) {
              setShowEarlyLogoutDialog(true);
              setLoading(false);
              return;
            }
          }

          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/checkout`, { 
            reason: earlyLogoutReason 
          }, config);
          setAttendanceState('completed');
          setSessionTimes(prev => ({ ...prev, checkOut: res.data.checkOut.time }));
          setShowEarlyLogoutDialog(false);
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
      case 'holiday': return { label: 'Company Holiday', color: 'bg-indigo-600', icon: Calendar };
      case 'leave': return { label: 'Approved Leave', color: 'bg-emerald-500', icon: Coffee };
      default: return { label: 'Offline', color: 'bg-slate-400', icon: Zap };
    }
  };

  const status = getStatusConfig();

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-indigo-600 font-bold mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
              <Timer className="w-6 h-6" />
            </div>
            <span className="text-sm tracking-[0.2em] uppercase font-black">Live Shift Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Attendance Tracker</h1>
          <p className="text-slate-600 font-medium max-w-xl leading-relaxed">System-monitored workspace for managing your professional hours and shift logs in real-time.</p>
        </div>

        {estimatedEarnings && (
          <div className="flex flex-col items-end gap-1 px-10 py-5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 animate-in slide-in-from-top-4 duration-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-1000">
               <TrendingUp className="w-20 h-20 text-white" />
            </div>
            <span className="text-[9px] font-black text-indigo-200 uppercase tracking-[0.2em] relative z-10">Live Monthly Yield</span>
            <div className="flex items-center gap-3 relative z-10">
              <span className="text-4xl font-black tracking-tighter">₹{estimatedEarnings.estimatedNetSalary.toLocaleString()}</span>
              <div className="flex items-center gap-1 bg-emerald-400/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                 <span className="text-[8px] font-black text-emerald-100 uppercase tracking-tighter">Live</span>
              </div>
            </div>
            <div className="flex items-center gap-2 relative z-10 mt-1">
               <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest">LOP: {estimatedEarnings.totalLOPDays}D</span>
               <div className="w-1 h-1 rounded-full bg-indigo-400/30"></div>
               <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest">Perm: {estimatedEarnings.totalPermissionHours}h</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 p-2 bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/40">
           <div className="flex flex-col px-6 border-r-2 border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Date</span>
              <span className="text-sm font-black text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
           </div>
           <div className="flex flex-col px-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Protocol</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${status.color.replace('bg-', 'bg-')} shadow-lg shadow-current/20 animate-pulse`}></div>
                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{status.label}</span>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Main Control Card */}
        <div className="lg:col-span-12 max-w-5xl mx-auto w-full">
          <Card className="border-0 shadow-[0_40px_80px_rgba(0,0,0,0.08)] rounded-[3rem] bg-white overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 bg-white/70 z-50 flex items-center justify-center backdrop-blur-md transition-all">
                 <div className="flex flex-col items-center gap-4">
                   <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin shadow-inner"></div>
                   <span className="text-indigo-600 font-black text-xs tracking-[0.3em] uppercase animate-pulse">Synchronizing Session...</span>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Side: Configuration */}
              <div className="p-10 md:p-14 bg-gradient-to-br from-slate-50 to-white border-r-2 border-slate-100">
                <div className="space-y-12">
                  <div className="space-y-6">
                    <Label className="text-slate-900 font-black text-xs uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                      Work Environment Selection
                    </Label>
                    <div className="grid grid-cols-2 gap-4 p-2 bg-white border-2 border-slate-100 rounded-[2rem] shadow-inner">
                      <button
                        onClick={() => setWorkingMode('WFH')}
                        disabled={attendanceState !== 'idle'}
                        className={`flex flex-col items-center gap-3 py-8 rounded-[1.8rem] transition-all duration-500 ${
                          workingMode === 'WFH' 
                            ? 'bg-indigo-600 text-white shadow-[0_15px_30px_rgba(79,70,229,0.3)] scale-[1.03]' 
                            : 'bg-transparent text-slate-400 hover:bg-slate-50 active:scale-95'
                        } ${attendanceState !== 'idle' ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <Home className={`w-7 h-7 ${workingMode === 'WFH' ? 'text-white' : 'text-slate-300'}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{workingMode === 'WFH' ? 'ACTIVE' : ''} HOME</span>
                      </button>
                      
                      <button
                        onClick={() => setWorkingMode('WFO')}
                        disabled={attendanceState !== 'idle'}
                        className={`flex flex-col items-center gap-3 py-8 rounded-[1.8rem] transition-all duration-500 ${
                          workingMode === 'WFO' 
                            ? 'bg-indigo-600 text-white shadow-[0_15px_30px_rgba(79,70,229,0.3)] scale-[1.03]' 
                            : 'bg-transparent text-slate-400 hover:bg-slate-50 active:scale-95'
                        } ${attendanceState !== 'idle' ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <Building2 className={`w-7 h-7 ${workingMode === 'WFO' ? 'text-white' : 'text-slate-300'}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{workingMode === 'WFO' ? 'ACTIVE' : ''} OFFICE</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-slate-900 font-black text-xs uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                      Session Timeline
                    </Label>
                    <div className="grid grid-cols-2 gap-5">
                      {[
                        { label: 'Clock-In', time: sessionTimes.checkIn, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                        { label: 'Clock-Out', time: sessionTimes.checkOut, icon: LogOut, color: 'text-rose-600', bg: 'bg-rose-50/50' },
                        { label: 'Lunch Start', time: sessionTimes.lunchOut, icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                        { label: 'Lunch End', time: sessionTimes.lunchIn, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50' }
                      ].map((item, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col items-center gap-3 transition-all hover:border-indigo-200 group">
                          <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                            <item.icon className={`w-6 h-6 ${item.color}`} />
                          </div>
                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{item.label}</div>
                          <div className={`text-lg font-black tracking-tight ${item.time ? 'text-slate-900' : 'text-slate-200'}`}>
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
                   <Zap className="w-64 h-64 text-indigo-900 rotate-12" />
                </div>

                {workingMode === 'WFO' && attendanceState === 'idle' ? (
                  <div className="space-y-10 text-center animate-in slide-in-from-right-8 duration-700">
                    <div className="w-40 h-40 mx-auto rounded-[3rem] bg-indigo-50 flex items-center justify-center shadow-2xl shadow-indigo-100/50 group">
                      <Building2 className="w-20 h-20 text-indigo-500 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Biometric Link Required</h3>
                      <p className="text-slate-600 font-semibold leading-relaxed max-w-[320px] mx-auto text-sm italic">
                        Shift data must be captured via the <span className="text-indigo-600 font-black">Authorized Office Fingerprint Device</span>.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-3 py-2 px-6 border-2 border-indigo-100 text-indigo-600 bg-indigo-50/50 rounded-full font-black text-[10px] tracking-widest uppercase shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>
                      Terminal Recognition Active
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-sm space-y-10 animate-in zoom-in-95 duration-500">
                    <div className="flex flex-col items-center gap-5">
                       <status.icon className={`w-16 h-16 ${status.color.replace('bg-', 'text-')} drop-shadow-2xl animate-pulse`} />
                       <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Protocol Status</span>
                          <span className={`text-4xl font-black ${status.color.replace('bg-', 'text-')} tracking-tighter uppercase`}>
                            {status.label}
                          </span>
                       </div>
                    </div>

                    <div className="space-y-6">
                      {attendanceState === 'idle' && (
                        <Button
                          disabled={loading}
                          onClick={() => handleAction('check-in')}
                          className="group w-full py-16 text-3xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_30px_60px_-15px_rgba(79,70,229,0.5)] transition-all hover:-translate-y-2 active:scale-[0.98] rounded-[2.5rem] flex flex-col gap-2 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                            <Zap className="w-32 h-32" />
                          </div>
                          <span className="tracking-tighter relative z-10 uppercase font-serif italic text-4xl">Start Day</span>
                          <span className="text-[11px] font-black opacity-80 uppercase tracking-[0.4em] relative z-10">Initialize Session</span>
                        </Button>
                      )}

                      {attendanceState === 'working' && (
                        <div className="space-y-6">
                          <Button
                            disabled={loading}
                            onClick={() => handleAction('lunch-out')}
                            className="w-full py-12 text-2xl font-black bg-white border-4 border-amber-500 text-amber-600 hover:bg-amber-50 shadow-xl shadow-amber-500/10 transition-all hover:-translate-y-1 rounded-[2rem] flex flex-col gap-1"
                          >
                            <span className="tracking-tight uppercase">Lunch Break</span>
                            <span className="text-[10px] font-black opacity-70 uppercase tracking-[0.3em]">Pause Session</span>
                          </Button>
                          <Button
                            disabled={loading}
                            onClick={() => handleAction('check-out')}
                            className="w-full py-12 text-2xl font-black bg-rose-600 hover:bg-rose-700 text-white shadow-[0_30px_60px_-15px_rgba(225,29,72,0.5)] transition-all hover:-translate-y-1 rounded-[2rem] flex flex-col gap-1"
                          >
                            <span className="tracking-tight uppercase">Clock-Out</span>
                            <span className="text-[10px] font-black opacity-70 uppercase tracking-[0.3em]">Terminate Session</span>
                          </Button>
                        </div>
                      )}

                      {attendanceState === 'lunch' && (
                        <Button
                          disabled={loading}
                          onClick={() => handleAction('lunch-in')}
                          className="w-full py-16 text-3xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_30px_60px_-15px_rgba(16,185,129,0.4)] transition-all hover:-translate-y-2 active:scale-[0.98] rounded-[2.5rem] flex flex-col gap-2"
                        >
                          <span className="tracking-tighter uppercase text-white">RESUME WORK</span>
                          <span className="text-[11px] font-black opacity-80 uppercase tracking-[0.4em] text-white">Continue Session</span>
                        </Button>
                      )}

                      {attendanceState === 'completed' && (
                        <div className="relative group">
                          <div className="absolute inset-0 bg-emerald-400 blur-[60px] opacity-20 transition-opacity"></div>
                          <div className="relative text-center p-14 bg-white border-4 border-emerald-500/20 rounded-[3rem] shadow-[0_30px_60px_rgba(16,185,129,0.1)]">
                            <div className="w-24 h-24 mx-auto rounded-[2rem] bg-emerald-50 flex items-center justify-center mb-8 shadow-inner">
                              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-3">Day Finalized</h3>
                            <p className="text-slate-600 font-bold text-sm leading-relaxed mb-8 italic">
                              Professional summary synchronized accurately across the central network.
                            </p>
                            <div className="flex items-center justify-center gap-3 py-2 px-6 bg-slate-50 rounded-full inline-flex">
                               <div className="flex -space-x-3">
                                 {[1,2,3].map(i => (
                                   <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-indigo-100" />
                                 ))}
                               </div>
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">System Verified</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {attendanceState === 'holiday' && (
                        <div className="relative group animate-in zoom-in-95 duration-700">
                          <div className="absolute inset-0 bg-indigo-400 blur-[80px] opacity-20 transition-opacity"></div>
                          <div className="relative text-center p-14 bg-white border-4 border-indigo-500/20 rounded-[3.5rem] shadow-[0_40px_80px_rgba(79,70,229,0.15)]">
                            <div className="w-28 h-28 mx-auto rounded-[2.5rem] bg-indigo-50 flex items-center justify-center mb-10 shadow-inner group-hover:rotate-6 transition-transform">
                              <Calendar className="w-14 h-14 text-indigo-500" />
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">Official Holiday</h3>
                            <p className="text-slate-600 font-black text-md leading-relaxed mb-10 italic">
                              Marked as a company-wide day of rest. No operations required.
                            </p>
                            <div className="inline-block">
                               <Badge variant="outline" className="border-2 border-indigo-200 text-indigo-700 bg-indigo-50/80 rounded-2xl py-3 px-8 font-black text-xs tracking-[0.3em] uppercase shadow-lg shadow-indigo-100">
                                 OFF DUTY
                               </Badge>
                            </div>
                          </div>
                        </div>
                      )}

                      {attendanceState === 'leave' && (
                        <div className="relative group animate-in zoom-in-95 duration-700">
                          <div className="absolute inset-0 bg-emerald-400 blur-[80px] opacity-20 transition-opacity"></div>
                          <div className="relative text-center p-14 bg-white border-4 border-emerald-500/20 rounded-[3.5rem] shadow-[0_40px_80px_rgba(16,185,129,0.15)]">
                            <div className="w-28 h-28 mx-auto rounded-[2.5rem] bg-emerald-50 flex items-center justify-center mb-10 shadow-inner group-hover:rotate-6 transition-transform">
                              <Coffee className="w-14 h-14 text-emerald-500" />
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">On Leave</h3>
                            <p className="text-slate-600 font-black text-md leading-relaxed mb-10 italic">
                              Your leave request has been approved. Enjoy your time off and relax! No operations required today.
                            </p>
                            <div className="inline-block">
                               <Badge variant="outline" className="border-2 border-emerald-200 text-emerald-700 bg-emerald-50/80 rounded-2xl py-3 px-8 font-black text-xs tracking-[0.3em] uppercase shadow-lg shadow-emerald-100">
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

        {/* Monthly Timeline Section */}
        <div className="lg:col-span-12 max-w-5xl mx-auto w-full pb-20">
          <CalendarView />
        </div>
      </div>
      {/* Late Check-in Dialog */}
      <Dialog open={showLateDialog} onOpenChange={setShowLateDialog}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-0 shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-3 text-amber-600 mb-2">
              <AlertCircle className="w-6 h-6" />
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Late Login Detected</DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 font-bold">
              You are checking in after the allowed grace period. Please provide a reason to initiate a permission request.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
               <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Late Arrival</Label>
                <Textarea 
                  placeholder="Enter your reason here..."
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                  className="min-h-[120px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 bg-slate-50/50 p-4 font-medium transition-all"
                />
             </div>
             <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowLateDialog(false)}
                  className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-100 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  disabled={!lateReason.trim() || loading}
                  onClick={() => handleAction('check-in')}
                  className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Check-in'}
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lunch Delay Dialog */}
      <Dialog open={showLunchDelayDialog} onOpenChange={setShowLunchDelayDialog}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-0 shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-3 text-amber-600 mb-2">
              <Coffee className="w-6 h-6" />
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Lunch Delay Reason</DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 font-bold">
              Your lunch break exceeded the 45-minute limit. Please provide a reason for the delay.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
               <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Delay</Label>
                <Textarea 
                  placeholder="Enter reason..."
                  value={lunchDelayReason}
                  onChange={(e) => setLunchDelayReason(e.target.value)}
                  className="min-h-[120px] rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-4 font-medium transition-all"
                />
             </div>
             <div className="flex gap-4">
                <Button variant="outline" onClick={() => setShowLunchDelayDialog(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-100">
                  Cancel
                </Button>
                <Button 
                  disabled={!lunchDelayReason.trim() || loading}
                  onClick={() => handleAction('lunch-in')}
                  className="flex-1 h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-100"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Resume'}
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Early Logout Dialog */}
      <Dialog open={showEarlyLogoutDialog} onOpenChange={setShowEarlyLogoutDialog}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-0 shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <LogOut className="w-6 h-6" />
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Early Logout Protocol</DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 font-bold">
              Logging out before lunch requires a reason. The interval will be added to permissions, and the second half marked as leave.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
               <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Early Logout</Label>
               <Textarea 
                 placeholder="Enter emergency reason..."
                 value={earlyLogoutReason}
                 onChange={(e) => setEarlyLogoutReason(e.target.value)}
                 className="min-h-[120px] rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-4 font-medium transition-all"
               />
            </div>
            <div className="flex gap-4">
               <Button variant="outline" onClick={() => setShowEarlyLogoutDialog(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-100">
                 Cancel
               </Button>
               <Button 
                 disabled={!earlyLogoutReason.trim() || loading}
                 onClick={() => handleAction('check-out')}
                 className="flex-1 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-100"
               >
                 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Logout'}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
