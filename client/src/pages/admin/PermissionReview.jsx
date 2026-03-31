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
import socket from '@/services/socket';
import { useToast } from "@/hooks/use-toast";
import { Trash2, CheckSquare, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import PaginationControl from '@/components/ui/PaginationControl';

const PermissionReview = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const { toast } = useToast();
  
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectedReason, setRejectedReason] = useState('');

  useEffect(() => {
    fetchRequests(1);

    // Socket handled via shared service
    socket.on('new_request', (data) => {
      fetchRequests(true);
    });

    socket.on('request_deleted', ({ id }) => {
      setRequests(prev => prev.filter(req => req._id !== id));
    });

    socket.on('requests_bulk_deleted', ({ ids }) => {
      setRequests(prev => prev.filter(req => !ids.includes(req._id)));
    });

    return () => {
      socket.off('new_request');
      socket.off('request_deleted');
      socket.off('requests_bulk_deleted');
    };
  }, []);

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/requests/admin-requests?page=${page}&limit=5&name=${searchTerm}`, {
        headers: { 'x-auth-token': token }
      });
      
      setRequests(res.data.requests);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Error fetching requests:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch requests" });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchRequests(page);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const markAllAsRead = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/requests/mark-read`, {}, {
        headers: { 'x-auth-token': token }
      });
      toast({
        title: "Success",
        description: "All requests marked as read",
      });
    } catch (err) {
      console.error("Error marking as read:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark as read",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setActionLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/requests/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setRequests(prev => prev.filter(req => req._id !== id));
      toast({
        title: "Success",
        description: "Request deleted successfully",
      });
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
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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

  const filteredRequests = requests;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200 font-medium uppercase text-[10px]">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200 font-medium uppercase text-[10px]">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200 font-medium uppercase text-[10px] animate-pulse">Pending</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'leave':
        return <Badge className="bg-[#fffe01] text-black border-0 font-medium uppercase text-[9px] tracking-widest">Leave</Badge>;
      case 'permission':
        return <Badge className="bg-black text-[#fffe01] border-0 font-medium uppercase text-[9px] tracking-widest">Permission</Badge>;
      case 'lunch_delay':
        return <Badge className="bg-amber-500 text-white border-0 font-medium uppercase text-[9px] tracking-widest">Lunch Delay</Badge>;
      case 'late_login':
        return <Badge className="bg-rose-500 text-white border-0 font-medium uppercase text-[9px] tracking-widest">Late Login</Badge>;
      case 'early_logout_permission':
        return <Badge className="bg-orange-500 text-white border-0 font-medium uppercase text-[9px] tracking-widest">Early Logout</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white border-0 font-medium uppercase text-[9px] tracking-widest">{type}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-black font-medium mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#fffe01]/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-black" />
            </div>
            <span className="text-xs tracking-widest uppercase">Administration</span>
          </div>
          <h1 className="text-4xl font-medium tracking-tight text-gray-900">
            Request <span className="text-[#d30614]">Management Hub</span>
          </h1>
          <p className="text-gray-500 font-normal">Coordinate and verify employee leaves, permissions, and shift violations.</p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <Button
              onClick={handleBulkDelete}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 px-6 shadow-lg shadow-rose-500/10 animate-in slide-in-from-right-4 duration-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-black rounded-xl h-11 px-4 shadow-sm"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by employee or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl shadow-sm text-gray-900 focus-visible:ring-[#d30614]"
              />
            </div>
          </div>
        </div>
      </header>

      <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/30 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-900">
              <Clock className="w-5 h-5 text-black" />
              All Requests
            </CardTitle>
            <CardDescription className="font-normal text-gray-500">Showing most recent requests first.</CardDescription>
          </div>
          {filteredRequests.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-all">
              <Checkbox 
                id="select-all" 
                checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                onCheckedChange={toggleAll}
                className="rounded-md border-gray-300 data-[state=checked]:bg-[#fffe01] data-[state=checked]:text-black"
              />
              <Label htmlFor="select-all" className="text-[10px] font-medium uppercase tracking-widest text-gray-400 cursor-pointer">
                Select All
              </Label>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading && requests.length === 0 ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-black animate-spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-normal">No requests found matching your search.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRequests.map((req) => (
                <div key={req._id} className={`p-6 hover:bg-gray-50/60 transition-colors group flex flex-col md:flex-row gap-6 md:items-center relative ${selectedIds.includes(req._id) ? 'bg-[#fffe01]/5' : ''}`}>
                  <div className="flex-none pt-1">
                    <Checkbox 
                      checked={selectedIds.includes(req._id)}
                      onCheckedChange={() => toggleSelect(req._id)}
                      className="rounded-md border-gray-300 data-[state=checked]:bg-[#fffe01] data-[state=checked]:text-black"
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <User className="w-6 h-6 text-gray-400 group-hover:text-black" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-normal text-gray-900 text-base flex items-center gap-2">
                          {req.user?.name || 'Unknown User'}
                          {getTypeBadge(req.type)}
                        </h4>
                        <p className="text-xs text-gray-400 font-normal uppercase tracking-wider">{req.user?.employeeId || 'ID Pending'}</p>
                      </div>
                      <div className="ml-auto md:ml-4">
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl shadow-sm space-y-1">
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" /> Event Duration
                            </span>
                            <p className="text-xs font-normal text-gray-600">
                              {format(new Date(req.appliedOn), 'MMM dd, yyyy')} | {req.type === 'leave' ? `${req.duration} Day(s)` : req.totalPermissionTime}
                              {req.date && req.type !== 'leave' && <span className="ml-2 text-gray-400">({req.date})</span>}
                           </p>
                         </div>
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl shadow-sm space-y-1">
                           <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest flex items-center gap-1">
                             <MessageSquare className="w-3 h-3" /> Reason
                           </span>
                           <p className="text-xs font-normal text-gray-600 line-clamp-2 leading-relaxed">
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
                        className="flex-1 md:w-full border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl h-12"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(req._id)}
                        disabled={actionLoading}
                        className="text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-12 w-12 transition-all"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {req.status !== 'pending' && (
                     <div className="flex shrink-0 flex-col md:flex-row gap-2 items-center">
                        {req.status === 'rejected' && req.rejectedReason && (
                          <div className="w-48 p-3 bg-rose-50 border border-rose-100 rounded-xl self-stretch md:self-auto flex flex-col justify-center">
                            <span className="text-[9px] font-medium text-rose-400 uppercase block mb-1">Rejection Reason</span>
                            <p className="text-xs text-rose-600 font-normal leading-tight line-clamp-2">{req.rejectedReason}</p>
                          </div>
                        )}
                        {req.status === 'approved' && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedId(req._id);
                              setIsRejectOpen(true);
                            }}
                            disabled={actionLoading}
                            className="w-full md:w-auto bg-transparent border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl h-12 px-4 shadow-sm"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Revise to Reject
                          </Button>
                        )}
                        {req.status === 'rejected' && (
                          <Button
                            onClick={() => handleStatusUpdate(req._id, 'approved')}
                            disabled={actionLoading}
                            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-4 shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Revise to Approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(req._id)}
                          disabled={actionLoading}
                          className="text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-12 w-12 transition-all self-center shrink-0 hidden md:flex"
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
          <div className="px-6 border-t border-gray-100 bg-gray-50/10">
            <PaginationControl 
              pagination={pagination} 
              onPageChange={handlePageChange} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-medium tracking-tight text-gray-900">Reject Request</DialogTitle>
            <DialogDescription className="font-normal text-gray-500">
              Please provide a reason for rejecting this permission request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectedReason" className="text-xs font-medium uppercase tracking-widest text-gray-400 ml-1">Reason for Rejection</Label>
              <textarea
                id="rejectedReason"
                rows="4"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-normal text-gray-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none"
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
              className="rounded-xl font-normal text-gray-500 hover:bg-gray-100 hover:text-black"
            >
              Cancel
            </Button>
            <Button
              disabled={!rejectedReason || actionLoading}
              onClick={() => handleStatusUpdate(selectedId, 'rejected', rejectedReason)}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium px-8 shadow-lg shadow-rose-500/10"
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
