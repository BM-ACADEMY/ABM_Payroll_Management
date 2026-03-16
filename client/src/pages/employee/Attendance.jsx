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
  Timer
} from "lucide-react";
import axios from 'axios';

const Attendance = () => {
  const [attendanceState, setAttendanceState] = useState('idle'); // idle, working, lunch, completed
  const [workingMode, setWorkingMode] = useState('WFH');
  const [loading, setLoading] = useState(false);
  const [sessionTimes, setSessionTimes] = useState({
    checkIn: null,
    lunchOut: null,
    lunchIn: null,
    checkOut: null
  });

  useEffect(() => {
    fetchCurrentStatus();
  }, []);

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
        
        if (data.checkOut?.time) setAttendanceState('completed');
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
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/checkin`, { mode: workingMode }, config);
          setAttendanceState('working');
          setSessionTimes(prev => ({ ...prev, checkIn: res.data.checkIn.time }));
          break;
        case 'lunch-out':
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/lunchout`, {}, config);
          setAttendanceState('lunch');
          setSessionTimes(prev => ({ ...prev, lunchOut: res.data.lunch.out }));
          break;
        case 'lunch-in':
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/lunchin`, {}, config);
          setAttendanceState('working');
          setSessionTimes(prev => ({ ...prev, lunchIn: res.data.lunch.in }));
          break;
        case 'check-out':
          res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/checkout`, {}, config);
          setAttendanceState('completed');
          setSessionTimes(prev => ({ ...prev, checkOut: res.data.checkOut.time }));
          break;
        default:
          break;
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Something went wrong");
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
      default: return { label: 'Offline', color: 'bg-slate-400', icon: Zap };
    }
  };

  const status = getStatusConfig();

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
            <span className="text-sm tracking-widest uppercase">Live Tracking</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Attendance Center</h1>
          <p className="text-slate-500 font-medium">Manage your work status and track session timings in real-time.</p>
        </div>
        
        <div className="hidden md:flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
           <div className="flex flex-col px-4 border-r border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Date</span>
              <span className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
           </div>
           <div className="flex flex-col px-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Status</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${status.color.replace('bg-', 'bg-')}`}></div>
                <span className="text-sm font-black text-slate-700">{status.label}</span>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Control Card */}
        <div className="lg:col-span-12 max-w-4xl mx-auto w-full">
          <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] bg-white overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center backdrop-blur-sm transition-all">
                 <div className="flex flex-col items-center gap-3">
                   <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                   <span className="text-indigo-600 font-bold text-sm tracking-widest uppercase">Synchronizing...</span>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Side: Configuration */}
              <div className="p-8 md:p-12 bg-slate-50/50 border-r border-slate-100">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-slate-900 font-black text-xs uppercase tracking-[0.2em] ml-1">Working Mode Selection</Label>
                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm">
                      <button
                        onClick={() => setWorkingMode('WFH')}
                        disabled={attendanceState !== 'idle'}
                        className={`flex flex-col items-center gap-2 py-6 rounded-[1.2rem] transition-all duration-300 ${
                          workingMode === 'WFH' 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]' 
                            : 'bg-transparent text-slate-400 hover:bg-slate-50'
                        } ${attendanceState !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Home className={`w-6 h-6 ${workingMode === 'WFH' ? 'text-white' : 'text-slate-300'}`} />
                        <span className="text-xs font-black uppercase tracking-wider">Home (WFH)</span>
                      </button>
                      
                      <button
                        onClick={() => setWorkingMode('WFO')}
                        disabled={attendanceState !== 'idle'}
                        className={`flex flex-col items-center gap-2 py-6 rounded-[1.2rem] transition-all duration-300 ${
                          workingMode === 'WFO' 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]' 
                            : 'bg-transparent text-slate-400 hover:bg-slate-50'
                        } ${attendanceState !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Building2 className={`w-6 h-6 ${workingMode === 'WFO' ? 'text-white' : 'text-slate-300'}`} />
                        <span className="text-xs font-black uppercase tracking-wider">Office (WFO)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-slate-900 font-black text-xs uppercase tracking-[0.2em] ml-1">Session Summary</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Login', time: sessionTimes.checkIn, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Logout', time: sessionTimes.checkOut, icon: LogOut, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { label: 'Lunch Out', time: sessionTimes.lunchOut, icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Lunch In', time: sessionTimes.lunchIn, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                      ].map((item, i) => (
                        <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-2 group hover:border-indigo-200 transition-colors">
                          <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                          </div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
                          <div className={`text-sm font-black ${item.time ? 'text-slate-800' : 'text-slate-300'}`}>
                            {item.time || '--:--'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Primary Actions */}
              <div className="p-8 md:p-12 flex flex-col justify-center items-center h-full">
                {workingMode === 'WFO' && attendanceState === 'idle' ? (
                  <div className="space-y-8 text-center animate-in slide-in-from-right-4">
                    <div className="w-32 h-32 mx-auto rounded-[2rem] bg-indigo-50 flex items-center justify-center shadow-inner group">
                      <Building2 className="w-16 h-16 text-indigo-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Biometric Required</h3>
                      <p className="text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto text-sm">
                        Please use the <span className="text-indigo-600 font-bold">fingerprint device</span> at the office entrance to mark your shift.
                      </p>
                    </div>
                    <Badge variant="outline" className="py-1 px-4 border-indigo-200 text-indigo-600 bg-indigo-50/50 rounded-full font-bold">
                      OFFICE MODE ACTIVE
                    </Badge>
                  </div>
                ) : (
                  <div className="w-full max-w-sm space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="flex flex-col items-center gap-4 mb-4">
                       <status.icon className={`w-12 h-12 ${status.color.replace('bg-', 'text-')} animate-pulse`} />
                       <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Current Status</span>
                          <span className={`text-3xl font-black ${status.color.replace('bg-', 'text-')} tracking-tighter uppercase`}>
                            {status.label}
                          </span>
                       </div>
                    </div>

                    <div className="space-y-4">
                      {attendanceState === 'idle' && (
                        <Button
                          disabled={loading}
                          onClick={() => handleAction('check-in')}
                          className="group w-full py-12 text-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_20px_40px_-15px_rgba(79,70,229,0.4)] transition-all hover:translate-y-[-4px] active:scale-[0.98] rounded-[2rem] flex flex-col gap-1 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                            <Zap className="w-20 h-20" />
                          </div>
                          <span className="tracking-tighter relative z-10 uppercase">Start Workday</span>
                          <span className="text-xs font-bold opacity-70 uppercase tracking-[0.2em] relative z-10">Mark Clock-In</span>
                        </Button>
                      )}

                      {attendanceState === 'working' && (
                        <div className="space-y-4">
                          <Button
                            disabled={loading}
                            onClick={() => handleAction('lunch-out')}
                            className="w-full py-10 text-xl font-black bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50 shadow-sm transition-all hover:translate-y-[-2px] rounded-[1.8rem] flex flex-col gap-1"
                          >
                            <span className="tracking-tight uppercase">Lunch Break</span>
                            <span className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em]">Start break</span>
                          </Button>
                          <Button
                            disabled={loading}
                            onClick={() => handleAction('check-out')}
                            className="w-full py-10 text-xl font-black bg-rose-600 hover:bg-rose-700 text-white shadow-[0_20px_40px_-15px_rgba(225,29,72,0.4)] transition-all hover:translate-y-[-2px] rounded-[1.8rem] flex flex-col gap-1"
                          >
                            <span className="tracking-tight uppercase">End Workday</span>
                            <span className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em]">Clock-Out</span>
                          </Button>
                        </div>
                      )}

                      {attendanceState === 'lunch' && (
                        <Button
                          disabled={loading}
                          onClick={() => handleAction('lunch-in')}
                          className="w-full py-12 text-2xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_20px_40px_-15px_rgba(16,185,129,0.4)] transition-all hover:translate-y-[-4px] active:scale-[0.98] rounded-[2rem] flex flex-col gap-1"
                        >
                          <span className="tracking-tighter uppercase text-white">Back to Work</span>
                          <span className="text-xs font-bold opacity-70 uppercase tracking-[0.2em] text-white">End lunch break</span>
                        </Button>
                      )}

                      {attendanceState === 'completed' && (
                        <div className="relative group">
                          <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                          <div className="relative text-center p-12 bg-white border-2 border-emerald-500/30 rounded-[2.5rem] shadow-xl">
                            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Great Work!</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed">
                              You've completed your shift successfully. Everything is synchronized.
                            </p>
                            <div className="mt-8 flex items-center justify-center gap-2">
                               <div className="flex -space-x-2">
                                 {[1,2,3].map(i => (
                                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 animate-pulse" style={{ animationDelay: `${i*200}ms` }} />
                                 ))}
                               </div>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logs verified</span>
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
      </div>
    </div>
  );
};

export default Attendance;
