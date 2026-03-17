import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Calendar as CalendarIcon,
  Loader2,
  Search,
  AlertCircle,
  Timer,
  MessageSquare
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import { useToast } from "@/hooks/use-toast";
import { Trash2, CheckSquare, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const PermissionReview = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const { toast } = useToast();
  
  // Rejection Dialog State
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectedReason, setRejectedReason] = useState('');

  useEffect(() => {
    fetchRequests(true);

    const socket = io(import.meta.env.VITE_API_URL);
    
    socket.on('new_request', () => {
      fetchRequests(true);
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

  const fetchRequests = async (reset = false) => {
    try {
      const skip = reset ? 0 : requests.length;
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/requests/admin-requests?limit=5&skip=${skip}`, {
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

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/requests/mark-read`, {}, {
        headers: { 'x-auth-token': token }
      });
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/requests/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setRequests(prev => prev.filter(req => req._id !== id));
      toast({
        title: "Success",
        description: "Request deleted successfully",
      });
      // Socket will handle refresh
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Deletion failed",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} records?`)) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/requests/bulk-delete`, {
        ids: selectedIds
      }, {
        headers: { 'x-auth-token': token }
      });
      setSelectedIds([]);
      setSelectedIds([]);
      toast({
        title: "Success",
        description: "Bulk deletion successful",
      });
      // Socket will handle refresh
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Bulk deletion failed",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredRequests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRequests.map(req => req._id));
    }
  };

  const handleStatusUpdate = async (id, status, reason = '') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/requests/${id}`, {
        status,
        rejectedReason: reason
      }, {
        headers: { 'x-auth-token': token }
      });
      
      fetchRequests(true);
      setIsRejectOpen(false);
      setRejectedReason('');
      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Action failed",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs tracking-widest uppercase">Administration</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Permission Review</h1>
          <p className="text-slate-500 font-medium">Review and manage employee permission requests.</p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <Button
              onClick={handleBulkDelete}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 px-6 shadow-lg shadow-rose-100 animate-in slide-in-from-right-4 duration-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl h-11 px-4 shadow-sm"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by employee or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-white border-slate-200 rounded-xl shadow-sm"
              />
            </div>
          </div>
        </div>
      </header>

      <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] bg-white overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <Clock className="w-5 h-5 text-indigo-600" />
              All Requests
            </CardTitle>
            <CardDescription className="font-medium">Showing most recent requests first.</CardDescription>
          </div>
          {filteredRequests.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm transition-all">
              <Checkbox 
                id="select-all" 
                checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                onCheckedChange={toggleAll}
                className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600"
              />
              <Label htmlFor="select-all" className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
                Select All
              </Label>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading && requests.length === 0 ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-medium">No requests found matching your search.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredRequests.map((req) => (
                <div key={req._id} className={`p-6 hover:bg-slate-50/50 transition-colors group flex flex-col md:flex-row gap-6 md:items-center relative ${selectedIds.includes(req._id) ? 'bg-indigo-50/30' : ''}`}>
                  <div className="flex-none pt-1">
                    <Checkbox 
                      checked={selectedIds.includes(req._id)}
                      onCheckedChange={() => toggleSelect(req._id)}
                      className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600"
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-white transition-colors">
                        <User className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-slate-900 text-base">{req.user?.name || 'Unknown User'}</h4>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{req.user?.employeeId || 'ID Pending'}</p>
                      </div>
                      <div className="ml-auto md:ml-4">
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm space-y-1">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                             <CalendarIcon className="w-3 h-3" /> Date & Time
                           </span>
                           <p className="text-xs font-bold text-slate-700 italic">
                             {format(new Date(req.fromDateTime), 'MMM dd, yyyy')} | {format(new Date(req.fromDateTime), 'hh:mm a')} - {format(new Date(req.toDateTime), 'hh:mm a')}
                            {req.totalPermissionTime && (
                              <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 font-black">
                                {req.totalPermissionTime}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm space-y-1">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                             <MessageSquare className="w-3 h-3" /> Reason
                           </span>
                           <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed">
                             {req.reason}
                           </p>
                        </div>
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex shrink-0 gap-2 md:flex-col lg:flex-row">
                      <Button
                        onClick={() => handleStatusUpdate(req._id, 'approved')}
                        disabled={actionLoading}
                        className="flex-1 md:w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 shadow-inner"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedId(req._id);
                          setIsRejectOpen(true);
                        }}
                        disabled={actionLoading}
                        className="flex-1 md:w-full border-2 border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl h-12"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(req._id)}
                        disabled={actionLoading}
                        className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-12 w-12 transition-all"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {req.status !== 'pending' && (
                     <div className="flex shrink-0 gap-2 items-center">
                        {req.status === 'rejected' && req.rejectedReason && (
                          <div className="w-48 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                            <span className="text-[9px] font-black text-rose-400 uppercase block mb-1">Rejection Reason</span>
                            <p className="text-xs text-rose-700 font-bold leading-tight">{req.rejectedReason}</p>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(req._id)}
                          disabled={actionLoading}
                          className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-12 w-12 transition-all self-center"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                onClick={() => fetchRequests()}
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

      {/* Rejection Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Reject Request</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Please provide a reason for rejecting this permission request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectedReason" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Reason for Rejection</Label>
              <textarea
                id="rejectedReason"
                rows="4"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none"
                placeholder="E.g. Insufficient staffing, overlaps with critical meeting..."
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsRejectOpen(false)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              disabled={!rejectedReason || actionLoading}
              onClick={() => handleStatusUpdate(selectedId, 'rejected', rejectedReason)}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-rose-100"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermissionReview;
