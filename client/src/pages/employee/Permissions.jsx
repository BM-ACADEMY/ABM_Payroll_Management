import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Send, 
  Clock, 
  Calendar as CalendarIcon, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Timer,
  History
} from "lucide-react";
import axios from 'axios';
import Loader from "@/components/ui/Loader";
import { format } from 'date-fns';
import socket from '@/services/socket';
import { useToast } from "@/hooks/use-toast";
import PaginationControl from '@/components/ui/PaginationControl';

const Permissions = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });

  const [formData, setFormData] = useState({
    fromDateTime: '',
    toDateTime: '',
    reason: ''
  });

  useEffect(() => {
    fetchMyRequests(1);

    // Socket handled via shared service
    socket.on('notification', (data) => {
      fetchMyRequests(true);
    });

    socket.on('request_deleted', ({ id }) => {
      setRequests(prev => prev.filter(req => req._id !== id));
    });

    socket.on('requests_bulk_deleted', ({ ids }) => {
      setRequests(prev => prev.filter(req => !ids.includes(req._id)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchMyRequests = async (page = 1) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/requests/my-requests?page=${page}&limit=5`, {
        headers: { 'x-auth-token': token }
      });
      
      const filtered = res.data.requests.filter(req => req.type !== 'leave');
      setRequests(filtered);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchMyRequests(page);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/requests`, {
        type: 'permission',
        date: format(new Date(formData.fromDateTime), 'yyyy-MM-dd'),
        fromDateTime: formData.fromDateTime,
        toDateTime: formData.toDateTime,
        reason: formData.reason
      }, {
        headers: { 'x-auth-token': token }
      });

      toast({
        title: "Success",
        description: "Permission request submitted successfully!",
      });
      setFormData({ fromDateTime: '', toDateTime: '', reason: '' });
      fetchMyRequests(1);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || 'Failed to submit request',
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
        return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200">Pending</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'leave': return <Badge className="bg-zinc-100 text-zinc-900 border-0 font-medium uppercase text-[9px] tracking-widest">Leave</Badge>;
      case 'permission': return <Badge className="bg-zinc-900 text-[#fffe01] border-0 font-medium uppercase text-[9px] tracking-widest">Permission</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-600 border-0 font-medium uppercase text-[9px] tracking-widest">{type}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
          Permission <span className="text-[#d30614]">Request Center</span>
        </h1>
        <p className="text-sm md:text-base text-gray-500 font-normal">Request temporary absence or delay and track status.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Request Form */}
        <Card className="lg:col-span-5 border-0 shadow-lg rounded-2xl bg-black text-[#fffe01] overflow-hidden h-fit">
          <CardHeader className="p-6 md:p-8 pb-4 border-b border-zinc-800">
            <CardTitle className="text-xl font-medium flex items-center gap-2">
              <Send className="w-5 h-5 text-[#fffe01]" />
              New Request
            </CardTitle>
            <CardDescription className="text-zinc-400 font-normal text-xs md:text-sm">Submit your hourly permission request for approval.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 md:pt-8 px-6 md:px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest ml-1 text-zinc-400">Start Time</Label>
                  <Input 
                    type="datetime-local" 
                    name="fromDateTime"
                    value={formData.fromDateTime}
                    onChange={handleChange}
                    required
                    className="rounded-2xl border-0 bg-zinc-900 text-[#fffe01] placeholder:text-zinc-500 h-14 font-normal focus:ring-2 focus:ring-[#d30614] transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest ml-1 text-zinc-400">End Time</Label>
                  <Input 
                    type="datetime-local" 
                    name="toDateTime"
                    value={formData.toDateTime}
                    onChange={handleChange}
                    required
                    className="rounded-2xl border-0 bg-zinc-900 text-[#fffe01] placeholder:text-zinc-500 h-14 font-normal focus:ring-2 focus:ring-[#d30614] transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-medium uppercase tracking-widest ml-1 text-zinc-400">Reason for Request</Label>
                 <textarea 
                   id="reason"
                   name="reason"
                   placeholder="Describe why you need this permission..."
                   value={formData.reason}
                   onChange={handleChange}
                   required
                   className="w-full min-h-[140px] rounded-2xl border-0 bg-zinc-900 text-[#fffe01] placeholder:text-zinc-600 p-6 font-normal transition-all focus:ring-2 focus:ring-[#d30614] shadow-inner resize-none"
                 />
              </div>

              <Button
                type="submit"
                disabled={formLoading}
                className="w-full h-16 bg-[#fffe01] hover:bg-black hover:text-[#fffe01] text-black font-medium text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95"
              >
                {formLoading ? <Loader size="sm" color="white" /> : 'Transmit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Request History */}
        <Card className="lg:col-span-7 border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 md:p-8 pb-4 border-b border-gray-100 bg-gray-50/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-900">
                <History className="w-5 h-5 text-black" />
                Application History
              </CardTitle>
              <CardDescription className="font-normal text-xs md:text-sm">Recent status updates and logs.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader size="md" color="red" />
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 md:p-20 text-center space-y-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
                </div>
                <h4 className="text-gray-900 font-medium uppercase text-[10px] md:text-xs tracking-widest">No Applications Found</h4>
                <p className="text-gray-400 text-xs md:text-sm font-normal">Your permission history will appear here once you submit a request.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {requests.map((request) => (
                  <div key={request._id} className="p-6 md:p-8 hover:bg-gray-50/60 transition-colors group relative">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 ${request.type === 'permission' ? 'bg-[#fffe01]/10 text-black' : 'bg-gray-50 text-gray-600'}`}>
                           <Clock className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                             <span className="text-sm md:text-base font-medium text-gray-900">
                               {request.date ? format(new Date(request.date), 'MMMM dd, yyyy') : format(new Date(request.appliedOn), 'MMMM dd, yyyy')}
                             </span>
                             {getStatusBadge(request.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[9px] md:text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
                             {getTypeBadge(request.type)}
                             <span className="hidden sm:inline">•</span>
                             <span className="flex items-center gap-1">
                               <Timer className="w-3 h-3" />
                               {request.fromDateTime ? format(new Date(request.fromDateTime), 'HH:mm') : '00:00'} - 
                               {request.toDateTime ? format(new Date(request.toDateTime), 'HH:mm') : '00:00'}
                             </span>
                          </div>
                        </div>
                      </div>
                      
                      {request.status !== 'pending' && request.verifyByAdminUserId?.name && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                           <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                           <span className="text-[10px] font-normal text-gray-500">
                             Verified by {request.verifyByAdminUserId.name}
                           </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-0 sm:ml-[4.5rem] bg-gray-50 border border-gray-100 p-4 md:p-5 rounded-2xl shadow-sm text-gray-600 text-xs md:text-sm leading-relaxed italic">
                      "{request.reason}"
                    </div>

                    {request.status === 'rejected' && request.rejectedReason && (
                      <div className="ml-0 sm:ml-[4.5rem] mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-normal flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                          <span className="uppercase text-[9px] block mb-1 opacity-70 tracking-tighter">
                            Administrator Feedback
                          </span>
                          {request.rejectedReason}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="px-6 border-t border-gray-100 bg-gray-50/10">
              <PaginationControl 
                pagination={pagination} 
                onPageChange={handlePageChange} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Permissions;
