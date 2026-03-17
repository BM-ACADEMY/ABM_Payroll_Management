import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  Send, 
  Loader2, 
  AlertCircle,
  History,
  CheckCircle2
} from "lucide-react";
import axios from 'axios';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import { useToast } from "@/hooks/use-toast";

const LeaveRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const [hasMore, setHasMore] = useState(false);

  // Form State
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveType, setLeaveType] = useState('full'); // full, half
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    fetchMyRequests(true);

    const socket = io(import.meta.env.VITE_API_URL);
    
    socket.on('request_updated', () => {
      fetchMyRequests(true);
    });

    socket.on('request_deleted', ({ id }) => {
      setRequests(prev => prev.filter(req => req._id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchMyRequests = async (reset = false) => {
    try {
      const skip = reset ? 0 : requests.length;
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/requests/my-requests?limit=10&skip=${skip}`, {
        headers: { 'x-auth-token': token }
      });
      
      // Filter for only 'leave' types in this specialized page? 
      // Or show all but emphasize leaves. User said "Leave Request" menu.
      // Usually better to show all my requests or just leaves? Let's show all but focused on leaves.
      const leaveOnly = res.data.requests.filter(req => req.type === 'leave');
      
      if (reset) {
        setRequests(leaveOnly);
      } else {
        setRequests(prev => [...prev, ...leaveOnly]);
      }
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a reason for your leave." });
      return;
    }

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/requests`, {
        type: 'leave',
        date: leaveDate,
        duration: leaveType === 'full' ? 1 : 0.5,
        reason: leaveReason
      }, { headers: { 'x-auth-token': token } });

      toast({
        title: "Success",
        description: `Formal request for ${leaveDate} has been submitted.`,
      });
      setLeaveReason('');
      fetchMyRequests(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err.response?.data?.msg || "Could not apply for leave"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 animate-pulse">Pending</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'leave': return <Badge className="bg-indigo-600 text-white border-0 font-black uppercase text-[9px] tracking-widest">Leave</Badge>;
      case 'permission': return <Badge className="bg-slate-900 text-white border-0 font-black uppercase text-[9px] tracking-widest">Permission</Badge>;
      default: return <Badge className="bg-slate-400 text-white border-0 font-black uppercase text-[9px] tracking-widest">{type}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <span className="text-xs tracking-widest uppercase">Professional Absence</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Leave Request Center</h1>
        <p className="text-slate-500 font-medium">Apply for planned leaves and track your formal requests.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Leave Form */}
        <Card className="lg:col-span-5 border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden h-fit">
          <CardHeader className="pb-4 border-b border-indigo-500/30">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Send className="w-5 h-5" />
              New Application
            </CardTitle>
            <CardDescription className="text-indigo-100 font-medium">Coordinate your time off with the administration.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8 pb-8">
            <form onSubmit={handleApplyLeave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-indigo-100">Leave Date</Label>
                  <Input 
                    type="date" 
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="rounded-2xl border-0 bg-indigo-500/50 text-white placeholder:text-indigo-200 h-14 font-black focus:ring-2 focus:ring-white transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-indigo-100">Leave Type</Label>
                  <div className="flex p-1 bg-indigo-700/50 rounded-2xl h-14">
                    <button 
                      type="button"
                      onClick={() => setLeaveType('full')}
                      className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${leaveType === 'full' ? 'bg-white text-indigo-600 shadow-lg' : 'text-indigo-200'}`}
                    >Full Day</button>
                    <button 
                      type="button"
                      onClick={() => setLeaveType('half')}
                      className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${leaveType === 'half' ? 'bg-white text-indigo-600 shadow-lg' : 'text-indigo-200'}`}
                    >Half Day</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-indigo-100">Reason for Absence</Label>
                 <Textarea 
                   placeholder="Describe why you need this leave..."
                   value={leaveReason}
                   onChange={(e) => setLeaveReason(e.target.value)}
                   className="min-h-[140px] rounded-[2rem] border-0 bg-indigo-500/50 text-white placeholder:text-indigo-200 p-6 font-medium transition-all focus:ring-2 focus:ring-white shadow-inner resize-none"
                 />
              </div>

              <Button
                type="submit"
                disabled={formLoading}
                className="w-full h-16 bg-white hover:bg-indigo-50 text-indigo-600 font-black text-xs uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl transition-all active:scale-95"
              >
                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply for Leave'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Request History */}
        <Card className="lg:col-span-7 border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <History className="w-5 h-5 text-indigo-600" />
                Application History
              </CardTitle>
              <CardDescription className="font-medium">Recent status updates and logs.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-10 h-10 text-slate-200" />
                </div>
                <h4 className="text-slate-900 font-black uppercase text-xs tracking-widest">No Applications Found</h4>
                <p className="text-slate-400 text-sm font-medium">Your leave history will appear here once you submit a request.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {requests.map((request) => (
                  <div key={request._id} className="p-8 hover:bg-slate-50/50 transition-colors group relative">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${request.type === 'leave' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                           {request.type === 'leave' ? <CalendarIcon className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className="text-base font-black text-slate-900">
                               {request.date ? format(new Date(request.date), 'MMMM dd, yyyy') : format(new Date(request.appliedOn), 'MMMM dd, yyyy')}
                             </span>
                             {getStatusBadge(request.status)}
                             {request.status !== 'pending' && request.verifyByAdminUserId?.name && (
                               <span className="text-[10px] font-bold text-slate-400 italic">
                                 Verified by {request.verifyByAdminUserId.name}
                               </span>
                             )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {getTypeBadge(request.type)}
                            <span>•</span>
                            <span>{request.type === 'leave' ? `${request.duration} Day(s) Application` : request.totalPermissionTime || 'Permission'}</span>
                          </div>
                        </div>
                      </div>
                      {request.isApproved && (
                        <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-100">
                           <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-[4.5rem] bg-white border border-slate-100 p-5 rounded-2xl shadow-sm italic text-slate-600 text-sm leading-relaxed">
                      "{request.reason}"
                    </div>

                    {request.status === 'rejected' && request.rejectedReason && (
                      <div className="ml-[4.5rem] mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-700 font-bold flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                          <span className="uppercase text-[9px] block mb-1 opacity-70 tracking-tighter">
                            {request.verifyByAdminUserId?.name ? `Verified by ${request.verifyByAdminUserId.name}` : 'Administrator Feedback'}
                          </span>
                          {request.rejectedReason}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {hasMore && (
              <div className="p-8 border-t border-slate-50 flex justify-center bg-slate-50/30">
                <Button 
                  variant="ghost" 
                  onClick={() => fetchMyRequests()}
                  disabled={loading}
                  className="rounded-2xl font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-10 h-14 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <History className="w-4 h-4 mr-2" />}
                  Scroll for More Logged Applications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaveRequest;
