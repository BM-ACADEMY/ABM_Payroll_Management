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
  MessageSquare
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import { format } from 'date-fns';
import socket from '@/services/socket';
import { useToast } from "@/hooks/use-toast";
import { Trash2, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import PaginationControl from '@/components/ui/PaginationControl';
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Loader from "@/components/ui/Loader";

const PermissionReview = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: '', data: null, title: '', description: '' });
  const { toast } = useToast();
  
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectedReason, setRejectedReason] = useState('');
  const [isAddLeaveOpen, setIsAddLeaveOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [leaveData, setLeaveData] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    duration: 1,
    reason: ''
  });

  useEffect(() => {
    fetchRequests(1);

    socket.on('new_request', (data) => {
      fetchRequests(pagination.currentPage);
    });
    fetchEmployees();

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

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/employees?limit=1000`, {
        headers: { 'x-auth-token': token }
      });
      setEmployees(res.data.users);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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

  const handleDeleteRecord = async (id) => {
    setDeleteDialog({ 
      isOpen: true, 
      type: 'SINGLE', 
      data: id,
      title: "Delete Record",
      description: "Are you sure you want to delete this permission record?"
    });
  };

  const confirmDelete = async (id) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/requests/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setRequests(prev => prev.filter(req => req._id !== id));
      setDeleteDialog({ ...deleteDialog, isOpen: false });
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
    setDeleteDialog({ 
      isOpen: true, 
      type: 'BULK', 
      data: selectedIds,
      title: "Delete Records",
      description: `Are you sure you want to delete ${selectedIds.length} selected records?`
    });
  };

  const confirmBulkDelete = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/requests/bulk-delete`, {
        ids: selectedIds
      }, {
        headers: { 'x-auth-token': token }
      });
      setSelectedIds([]);
      setDeleteDialog({ ...deleteDialog, isOpen: false });
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

  const handleAddLeave = async () => {
    if (!leaveData.userId || !leaveData.reason) {
      toast({ variant: "destructive", title: "Error", description: "Please select an employee and provide a reason." });
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/requests`, {
        ...leaveData,
        type: 'leave'
      }, {
        headers: { 'x-auth-token': token }
      });
      setIsAddLeaveOpen(false);
      setLeaveData({ userId: '', date: new Date().toISOString().split('T')[0], duration: 1, reason: '' });
      fetchRequests(1);
      toast({ title: "Success", description: "Leave added successfully" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.msg || "Failed to add leave" });
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
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-zinc-900 rounded-full"></div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Request Audit</h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium ml-4">
             Governance & Operational Authorization Registry
          </p>
        </div>

        <div className="flex items-center gap-4">
           <Button
             onClick={() => setIsAddLeaveOpen(true)}
             className="h-10 bg-zinc-900 hover:bg-black text-[#fffe01] rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center gap-2 shadow-sm px-6"
           >
             <CalendarIcon className="w-4 h-4" />
             Add Leave
           </Button>
           <div className="relative group w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-white border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-100 transition-all"
              />
           </div>
           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200 shadow-sm">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Archive</span>
           </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        {selectedIds.length > 0 && (
          <Button
            onClick={handleBulkDelete}
            disabled={actionLoading}
            variant="destructive"
            className="rounded-xl h-10 px-6 font-semibold text-xs gap-2 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected ({selectedIds.length})
          </Button>
        )}
        <Button
          variant="outline"
          onClick={markAllAsRead}
          className="rounded-xl border-zinc-200 bg-white h-10 px-6 font-semibold text-xs gap-2 shadow-sm"
        >
          <CheckSquare className="w-4 h-4" />
          Mark All Read
        </Button>
      </div>

      <Card className="border-zinc-100 shadow-sm rounded-3xl bg-white overflow-hidden flex flex-col">
        <CardHeader className="p-8 border-b border-zinc-50 bg-zinc-50/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-zinc-900 text-[#fffe01] rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-900 tracking-tight">Audit Stream</CardTitle>
              <CardDescription className="text-zinc-500 font-medium text-[10px] uppercase tracking-wider">
                Real-time governance telemetry
              </CardDescription>
            </div>
          </div>
          {filteredRequests.length > 0 && (
            <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl border border-zinc-200 shadow-sm group cursor-pointer hover:bg-zinc-50 transition-all" onClick={toggleAll}>
              <Checkbox 
                id="select-all" 
                checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                onCheckedChange={toggleAll}
                className="w-4 h-4 rounded border-zinc-300"
              />
              <Label htmlFor="select-all" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 cursor-pointer">
                Select All
              </Label>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-40 gap-8">
              <Loader size="lg" color="red" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300 animate-pulse">Processing_Stream...</span>
            </div>
          ) : actionLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-40 gap-8">
              <Loader size="lg" color="black" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 animate-pulse">Executing_Governance_Command...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 py-24 text-center space-y-6">
              <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4">
                 <AlertCircle className="w-8 h-8 text-zinc-200" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">No Requests Found</h3>
                <p className="text-zinc-500 font-medium text-xs max-w-xs mx-auto">
                   Operational vectors are currently fully authorized and synchronized.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filteredRequests.map((req) => (
                <div key={req._id} className={`p-8 hover:bg-zinc-50/50 transition-all group flex flex-col xl:flex-row gap-8 xl:items-center relative ${selectedIds.includes(req._id) ? 'bg-zinc-50' : ''}`}>
                  
                  <div className="flex items-center gap-6">
                    <Checkbox 
                      checked={selectedIds.includes(req._id)}
                      onCheckedChange={() => toggleSelect(req._id)}
                      className="w-4 h-4 rounded border-zinc-300"
                    />
                    
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-[#fffe01]" />
                       </div>
                       <div className="space-y-1 min-w-[160px]">
                          <div className="flex flex-wrap items-center gap-2">
                             <h4 className="text-base font-semibold text-zinc-900 tracking-tight truncate max-w-[200px]">
                               {req.user?.name || 'Unknown User'}
                             </h4>
                             {getTypeBadge(req.type)}
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{req.user?.employeeId || 'ID_NULL'}</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-white border border-zinc-100 p-6 rounded-2xl shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                              <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" /> Date & Duration
                            </span>
                             {getStatusBadge(req.status)}
                          </div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {format(new Date(req.appliedOn), 'MMMM dd, yyyy')} <span className="text-zinc-200 mx-2">|</span> 
                            {req.type === 'leave' ? `${req.duration} Days` : req.totalPermissionTime || 'Permission'}
                            {req.date && req.type !== 'leave' && <span className="ml-2 text-[10px] text-zinc-400 font-medium">({req.date})</span>}
                          </p>
                       </div>
                      <div className="bg-white border border-zinc-100 p-6 rounded-2xl shadow-sm space-y-3">
                         <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                           <MessageSquare className="w-3.5 h-3.5 text-zinc-400" /> Reason
                         </span>
                         <p className="text-xs font-medium text-zinc-600 line-clamp-2 italic leading-relaxed">
                           "{req.reason}"
                         </p>
                      </div>
                  </div>

                  <div className="flex flex-row xl:flex-col gap-3 shrink-0">
                    {req.status === 'pending' ? (
                      <>
                        <Button
                          onClick={() => handleStatusUpdate(req._id, 'approved')}
                          disabled={actionLoading}
                          className="flex-1 h-12 xl:w-48 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedId(req._id);
                            setIsRejectOpen(true);
                          }}
                          disabled={actionLoading}
                          className="flex-1 h-12 xl:w-48 border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50 rounded-xl font-bold uppercase tracking-wider text-[10px] gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </>
                    ) : (
                       <div className="flex flex-col md:flex-row xl:flex-col gap-3 items-stretch w-full xl:w-48">
                          {req.status === 'rejected' && req.rejectedReason && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                              <span className="text-[9px] font-bold text-rose-600 uppercase block mb-1 tracking-wider">Reason:</span>
                              <p className="text-[10px] text-rose-700 font-medium leading-relaxed italic">"{req.rejectedReason}"</p>
                            </div>
                          )}
                          {req.status === 'approved' ? (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedId(req._id);
                                setIsRejectOpen(true);
                              }}
                              disabled={actionLoading}
                              className="h-10 border-zinc-100 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold uppercase tracking-wider text-[9px]"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-2" />
                              Dismiss
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleStatusUpdate(req._id, 'approved')}
                              disabled={actionLoading}
                              className="h-10 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold uppercase tracking-wider text-[9px] shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                              Approve
                            </Button>
                          )}
                       </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRecord(req._id)}
                      disabled={actionLoading}
                      className="text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-10 w-10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

          )}
          <div className="mt-auto p-10 md:p-14 border-t border-zinc-50 bg-[#fcfcfc]/50">
            <PaginationControl 
              pagination={pagination} 
              onPageChange={handlePageChange} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="rounded-3xl bg-white border-0 shadow-xl p-0 overflow-hidden sm:max-w-md">
          <div className="bg-rose-600 p-8 text-white">
            <DialogTitle className="text-xl font-semibold tracking-tight uppercase">Rejection Verdict</DialogTitle>
            <DialogDescription className="text-rose-100 text-[10px] font-bold uppercase tracking-wider mt-2">
              Provide authorization context for dismissal.
            </DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="rejectedReason" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">
                 Dismissal Rationale
              </Label>
              <textarea
                id="rejectedReason"
                placeholder="Enter reason for rejection..."
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
                className="w-full min-h-[120px] bg-zinc-50 border border-zinc-100 rounded-2xl p-6 text-sm font-medium text-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-200 transition-all resize-none shadow-inner"
              />
            </div>
            <div className="flex flex-row gap-4">
              <Button
                variant="ghost"
                onClick={() => setIsRejectOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider text-[10px] text-zinc-400 hover:text-black transition-all"
              >
                Cancel
              </Button>
              <Button
                disabled={!rejectedReason || actionLoading}
                onClick={() => handleStatusUpdate(selectedId, 'rejected', rejectedReason)}
                className="flex-1 h-12 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-bold uppercase tracking-wider text-[10px] shadow-lg transition-all"
              >
                Submit Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Leave Dialog */}
      <Dialog open={isAddLeaveOpen} onOpenChange={setIsAddLeaveOpen}>
        <DialogContent className="rounded-3xl bg-white border-0 shadow-xl p-0 overflow-hidden sm:max-w-md">
          <div className="bg-zinc-900 p-8 text-white">
            <DialogTitle className="text-xl font-semibold tracking-tight uppercase">Add Leave Record</DialogTitle>
            <DialogDescription className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mt-2">
              Manually register an approved leave for an employee.
            </DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Select Employee</Label>
                <select 
                  value={leaveData.userId}
                  onChange={(e) => setLeaveData({ ...leaveData, userId: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-sm font-medium focus:ring-1 focus:ring-zinc-200"
                >
                  <option value="">Select an employee...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Date</Label>
                  <Input 
                    type="date"
                    value={leaveData.date}
                    onChange={(e) => setLeaveData({ ...leaveData, date: e.target.value })}
                    className="rounded-xl border-zinc-100 bg-zinc-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Duration</Label>
                  <select 
                    value={leaveData.duration}
                    onChange={(e) => setLeaveData({ ...leaveData, duration: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-sm font-medium focus:ring-1 focus:ring-zinc-200"
                  >
                    <option value="1">Full Day</option>
                    <option value="0.5">Half Day</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Reason</Label>
                <textarea
                  placeholder="Reason for leave..."
                  value={leaveData.reason}
                  onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                  className="w-full min-h-[80px] bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-sm font-medium focus:ring-1 focus:ring-zinc-200 resize-none"
                />
              </div>
            </div>

            <div className="flex flex-row gap-4">
              <Button
                variant="ghost"
                onClick={() => setIsAddLeaveOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider text-[10px] text-zinc-400 hover:text-black"
              >
                Cancel
              </Button>
              <Button
                disabled={actionLoading}
                onClick={handleAddLeave}
                className="flex-1 h-12 bg-zinc-900 text-[#fffe01] hover:bg-black rounded-xl font-bold uppercase tracking-wider text-[10px] shadow-lg"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
        onConfirm={() => {
          if (deleteDialog.type === 'SINGLE') {
            confirmDelete(deleteDialog.data);
          } else {
            confirmBulkDelete();
          }
        }}
        title={deleteDialog.title}
        description={deleteDialog.description}
      />
    </div>
  );
};

export default PermissionReview;

