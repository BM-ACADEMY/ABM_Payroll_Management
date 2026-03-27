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
import socket from '@/services/socket';
import { useToast } from "@/hooks/use-toast";

const LeaveRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const [hasMore, setHasMore] = useState(false);

  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveType, setLeaveType] = useState('full');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    fetchMyRequests(true);

    // Socket handled via shared service
    socket.on('leave_updated', (data) => {
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
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/requests/my-requests?limit=10&skip=${skip}`, {
        headers: { 'x-auth-token': token }
      });
      
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
      const token = sessionStorage.getItem('token');
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
        return <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200 animate-pulse">Pending</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'leave': return <Badge className="bg-black text-[#fffe01] border-0 font-medium uppercase text-[9px] tracking-widest">Leave</Badge>;
      case 'permission': return <Badge className="bg-black text-[#fffe01] border-0 font-medium uppercase text-[9px] tracking-widest">Permission</Badge>;
      default: return <Badge className="bg-gray-500 text-white border-0 font-medium uppercase text-[9px] tracking-widest">{type}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-black font-medium mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#fffe01]/10 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 text-black" />
          </div>
          <span className="text-xs tracking-widest uppercase">Professional Absence</span>
        </div>
        <h1 className="text-4xl font-medium tracking-tight text-gray-900">
          Leave <span className="text-[#d30614]">Request Center</span>
        </h1>
        <p className="text-gray-500 font-normal">Apply for planned leaves and track your formal requests.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Leave Form */}
        <Card className="lg:col-span-5 border-0 shadow-lg rounded-2xl bg-black text-[#fffe01] overflow-hidden h-fit">
          <CardHeader className="pb-4 border-b border-zinc-800">
            <CardTitle className="text-xl font-medium flex items-center gap-2">
              <Send className="w-5 h-5 text-[#fffe01]" />
              New Application
            </CardTitle>
            <CardDescription className="text-zinc-400 font-normal">Coordinate your time off with the administration.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8 pb-8">
            <form onSubmit={handleApplyLeave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest ml-1 text-zinc-400">Leave Date</Label>
                  <Input 
                    type="date" 
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="rounded-2xl border-0 bg-zinc-900 text-[#fffe01] placeholder:text-zinc-500 h-14 font-normal focus:ring-2 focus:ring-[#d30614] transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest ml-1 text-zinc-400">Leave Type</Label>
                  <div className="flex p-1 bg-zinc-800 rounded-2xl h-14">
                    <button 
                      type="button"
                      onClick={() => setLeaveType('full')}
                      className={`flex-1 rounded-xl text-[10px] font-medium uppercase transition-all ${leaveType === 'full' ? 'bg-[#fffe01] text-black shadow-lg' : 'text-zinc-400'}`}
                    >Full Day</button>
                    <button 
                      type="button"
                      onClick={() => setLeaveType('half')}
                      className={`flex-1 rounded-xl text-[10px] font-medium uppercase transition-all ${leaveType === 'half' ? 'bg-[#fffe01] text-black shadow-lg' : 'text-zinc-400'}`}
                    >Half Day</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-medium uppercase tracking-widest ml-1 text-zinc-400">Reason for Absence</Label>
                 <Textarea 
                   placeholder="Describe why you need this leave..."
                   value={leaveReason}
                   onChange={(e) => setLeaveReason(e.target.value)}
                   className="min-h-[140px] rounded-2xl border-0 bg-zinc-900 text-[#fffe01] placeholder:text-zinc-600 p-6 font-normal transition-all focus:ring-2 focus:ring-[#d30614] shadow-inner resize-none"
                 />
              </div>

              <Button
                type="submit"
                disabled={formLoading}
                className="w-full h-16 bg-[#fffe01] hover:bg-indigo-600 text-black font-medium text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95"
              >
                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply for Leave'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Request History */}
        <Card className="lg:col-span-7 border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-900">
                <History className="w-5 h-5 text-black" />
                Application History
              </CardTitle>
              <CardDescription className="font-normal">Recent status updates and logs.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-black animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="text-gray-900 font-medium uppercase text-xs tracking-widest">No Applications Found</h4>
                <p className="text-gray-400 text-sm font-normal">Your leave history will appear here once you submit a request.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {requests.map((request) => (
                  <div key={request._id} className="p-8 hover:bg-gray-50/60 transition-colors group relative">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${request.type === 'leave' ? 'bg-[#fffe01]/10 text-black' : 'bg-gray-50 text-gray-600'}`}>
                           {request.type === 'leave' ? <CalendarIcon className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className="text-base font-medium text-gray-900">
                               {request.date ? format(new Date(request.date), 'MMMM dd, yyyy') : format(new Date(request.appliedOn), 'MMMM dd, yyyy')}
                             </span>
                             {getStatusBadge(request.status)}
                             {request.status !== 'pending' && request.verifyByAdminUserId?.name && (
                               <span className="text-[10px] font-normal text-gray-400">
                                 Verified by {request.verifyByAdminUserId.name}
                               </span>
                             )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                            {getTypeBadge(request.type)}
                            <span>•</span>
                            <span>{request.type === 'leave' ? `${request.duration} Day(s) Application` : request.totalPermissionTime || 'Permission'}</span>
                          </div>
                        </div>
                      </div>
                      {request.isApproved && (
                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                           <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-[4.5rem] bg-gray-50 border border-gray-100 p-5 rounded-2xl shadow-sm text-gray-600 text-sm leading-relaxed">
                      "{request.reason}"
                    </div>

                    {request.status === 'rejected' && request.rejectedReason && (
                      <div className="ml-[4.5rem] mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-normal flex items-start gap-3">
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
              <div className="p-8 border-t border-gray-100 flex justify-center bg-gray-50/30">
                <Button 
                  variant="ghost" 
                  onClick={() => fetchMyRequests()}
                  disabled={loading}
                  className="rounded-2xl font-medium text-[10px] uppercase tracking-widest text-black hover:bg-gray-100 px-10 h-14 transition-all"
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
