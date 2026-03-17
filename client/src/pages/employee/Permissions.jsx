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
import { io } from 'socket.io-client';
import { useToast } from "@/hooks/use-toast";


const Permissions = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const [hasMore, setHasMore] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fromDateTime: '',
    toDateTime: '',
    reason: ''
  });

  useEffect(() => {
    fetchMyRequests(true);

    const socket = io(import.meta.env.VITE_API_URL);
    
    socket.on('request_updated', (data) => {
      // Refresh list if the update belongs to this user session (or just refresh anyway for simplicity)
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

  const fetchMyRequests = async (reset = false) => {
    try {
      const skip = reset ? 0 : requests.length;
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/requests/my-requests?limit=5&skip=${skip}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (reset) {
        setRequests(res.data.requests);
      } else {
        setRequests(prev => [...prev, ...res.data.requests]);
      }
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
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
      fetchMyRequests(true);
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
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Pending</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Send className="w-4 h-4" />
          </div>
          <span className="text-xs tracking-widest uppercase">Request Center</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Permission Requests</h1>
        <p className="text-slate-500 font-medium">Apply for short-term permissions or track your existing requests.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Request Form */}
        <Card className="lg:col-span-5 border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] bg-white overflow-hidden h-fit">
          <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <FileText className="w-5 h-5 text-indigo-600" />
              New Permission Request
            </CardTitle>
            <CardDescription className="font-medium">Please provide accurate details for review.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="fromDateTime" className="text-slate-700 font-bold text-xs uppercase tracking-wider ml-1">From (Date & Time)</Label>
                <Input
                  id="fromDateTime"
                  name="fromDateTime"
                  type="datetime-local"
                  value={formData.fromDateTime}
                  onChange={handleChange}
                  required
                  className="bg-slate-50 border-slate-200 text-slate-900 h-12 rounded-xl focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toDateTime" className="text-slate-700 font-bold text-xs uppercase tracking-wider ml-1">To (Date & Time)</Label>
                <Input
                  id="toDateTime"
                  name="toDateTime"
                  type="datetime-local"
                  value={formData.toDateTime}
                  onChange={handleChange}
                  required
                  className="bg-slate-50 border-slate-200 text-slate-900 h-12 rounded-xl focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-slate-700 font-bold text-xs uppercase tracking-wider ml-1">Reason for Permission</Label>
                <textarea
                  id="reason"
                  name="reason"
                  rows="4"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  placeholder="E.g. Personal emergency, Medical appointment..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-medium placeholder:text-slate-400 text-sm transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={formLoading}
                className="w-full py-7 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
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
        <Card className="lg:col-span-7 border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <Clock className="w-5 h-5 text-indigo-600" />
              Request History
            </CardTitle>
            <CardDescription className="font-medium">Track your previous and pending permissions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-medium">No requests found yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {requests.map((request) => (
                  <div key={request._id} className="p-6 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-black text-slate-900 uppercase">
                             {format(new Date(request.fromDateTime), 'MMM dd, yyyy')}
                           </span>
                           {getStatusBadge(request.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Timer className="w-3 h-3" />
                          {format(new Date(request.fromDateTime), 'hh:mm a')} - {format(new Date(request.toDateTime), 'hh:mm a')}
                          {request.totalPermissionTime && (
                            <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 font-black">
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
                    
                    <p className="text-sm text-slate-600 font-medium mb-4 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      {request.reason}
                    </p>

                    {request.status === 'rejected' && request.rejectedReason && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold">
                        <span className="uppercase text-[9px] block mb-1 opacity-70">Admin Remark</span>
                        {request.rejectedReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {hasMore && (
              <div className="p-6 border-t border-slate-50 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => fetchMyRequests()}
                  disabled={loading}
                  className="rounded-xl font-bold border-2 border-slate-100 text-indigo-600 hover:bg-slate-50 hover:border-indigo-100 transition-all px-8 h-12"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                  Load More Requests
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Permissions;
