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
  Timer
} from "lucide-react";
import axios from 'axios';
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
      const token = localStorage.getItem('token');
      // We pass a custom query to exclude leaves if the backend supports it, 
      // otherwise we just fetch all and hope for the best or update the backend.
      // Standardizing to page-based fetching.
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
      const token = localStorage.getItem('token');
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
      case 'leave': return <Badge className="bg-black text-[#fffe01] border-0 font-medium uppercase text-[9px] tracking-widest">Leave</Badge>;
      case 'permission': return <Badge className="bg-black text-[#fffe01] border-0 font-medium uppercase text-[9px] tracking-widest">Permission</Badge>;
      case 'lunch_delay': return <Badge className="bg-amber-500 text-white border-0 font-medium uppercase text-[9px] tracking-widest">Lunch Delay</Badge>;
      case 'late_login': return <Badge className="bg-rose-500 text-white border-0 font-medium uppercase text-[9px] tracking-widest">Late Login</Badge>;
      case 'early_logout_permission': return <Badge className="bg-orange-500 text-white border-0 font-medium uppercase text-[9px] tracking-widest">Early Logout</Badge>;
      default: return <Badge className="bg-gray-500 text-white border-0 font-medium uppercase text-[9px] tracking-widest">{type}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-black font-medium mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#fffe01]/10 flex items-center justify-center">
            <Send className="w-4 h-4 text-black" />
          </div>
          <span className="text-xs tracking-widest uppercase">Request Center</span>
        </div>
        <h1 className="text-4xl font-medium tracking-tight text-gray-900">
          Permission <span className="text-[#d30614]">Requests</span>
        </h1>
        <p className="text-gray-500 font-normal">Apply for short-term permissions or track your log records.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Request Form */}
        <Card className="lg:col-span-5 border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden h-fit">
          <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/30">
            <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-900">
              <FileText className="w-5 h-5 text-black" />
              New Permission Request
            </CardTitle>
            <CardDescription className="font-normal">Please provide accurate details for review.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="fromDateTime" className="text-gray-600 font-medium text-xs uppercase tracking-wider ml-1">From (Date & Time)</Label>
                <Input
                  id="fromDateTime"
                  name="fromDateTime"
                  type="datetime-local"
                  value={formData.fromDateTime}
                  onChange={handleChange}
                  required
                  className="bg-gray-50 border-gray-200 text-gray-900 h-12 rounded-xl focus:ring-[#d30614]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toDateTime" className="text-gray-600 font-medium text-xs uppercase tracking-wider ml-1">To (Date & Time)</Label>
                <Input
                  id="toDateTime"
                  name="toDateTime"
                  type="datetime-local"
                  value={formData.toDateTime}
                  onChange={handleChange}
                  required
                  className="bg-gray-50 border-gray-200 text-gray-900 h-12 rounded-xl focus:ring-[#d30614]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-gray-600 font-medium text-xs uppercase tracking-wider ml-1">Reason for Permission</Label>
                <textarea
                  id="reason"
                  name="reason"
                  rows="4"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  placeholder="E.g. Personal emergency, Medical appointment..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 p-4 rounded-xl focus:ring-2 focus:ring-[#d30614] focus:border-black resize-none font-normal placeholder:text-gray-300 text-sm transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={formLoading}
                className="w-full py-7 bg-black hover:bg-gray-900 text-[#fffe01] font-medium text-sm uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                {formLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>SUBMIT REQUEST</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Request History */}
        <Card className="lg:col-span-7 border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/30">
            <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-900">
              <Clock className="w-5 h-5 text-black" />
              Request History
            </CardTitle>
            <CardDescription className="font-normal">Track your previous and pending permissions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-black animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-normal">No requests found yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {requests.map((request) => (
                  <div key={request._id} className="p-6 hover:bg-gray-50/60 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-medium text-gray-900 uppercase">
                             {request.date ? format(new Date(request.date), 'MMM dd, yyyy') : format(new Date(request.appliedOn), 'MMM dd, yyyy')}
                           </span>
                           {getTypeBadge(request.type)}
                           {getStatusBadge(request.status)}
                           {request.status !== 'pending' && request.verifyByAdminUserId?.name && (
                             <span className="text-[10px] font-normal text-gray-400">
                               Verified by {request.verifyByAdminUserId.name}
                             </span>
                           )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-normal">
                          <Timer className="w-3 h-3" />
                          {request.type === 'leave' ? `${request.duration} Day(s)` : (
                            <>
                              {request.fromDateTime ? format(new Date(request.fromDateTime), 'hh:mm a') : '00:00'} - 
                              {request.toDateTime ? format(new Date(request.toDateTime), 'hh:mm a') : '00:00'}
                            </>
                          )}
                          {request.totalPermissionTime && (
                            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-black rounded-md border border-gray-200 font-medium">
                              {request.totalPermissionTime}
                            </span>
                          )}
                        </div>
                      </div>
                      {request.isApproved && (
                        <div className="bg-emerald-50 p-2 rounded-lg">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 font-normal mb-4 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
                      {request.reason}
                    </p>

                    {request.status === 'rejected' && request.rejectedReason && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-normal">
                        <span className="uppercase text-[9px] block mb-1 opacity-70">
                          {request.verifyByAdminUserId?.name ? `Verified by ${request.verifyByAdminUserId.name}` : 'Admin Remark'}
                        </span>
                        {request.rejectedReason}
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

