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

  useEffect(() => {
    fetchRequests(1);

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
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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

    <div className="min-h-screen bg-[#fdfdfd] p-4 md:p-8 lg:p-12 space-y-12 animate-in fade-in duration-1000">
      {/* Header Section */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-10 md:h-14 w-2.5 bg-[#d30614] rounded-full shadow-lg shadow-red-100"></div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-zinc-900 uppercase leading-[0.9]">
              Request <span className="text-[#d30614] tracking-tight">Audit</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl leading-relaxed ml-2">
            Professional <span className="text-zinc-900 font-black">Governance Backbone</span> & Operational Authorization Registry.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
           <div className="relative group w-full sm:w-80">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400 group-focus-within:text-black transition-colors" />
              <Input
                placeholder="PROBE REPOSITORY..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-16 h-20 bg-white border-zinc-100 rounded-[2rem] shadow-xl text-sm font-black uppercase tracking-widest focus:ring-4 focus:ring-zinc-100/50 transition-all"
              />
           </div>
           
           <div className="flex items-center gap-4 bg-white p-3 rounded-[2rem] border border-zinc-100 shadow-xl pr-8">
              <div className="p-4 bg-zinc-900 text-[#fffe01] rounded-2xl shadow-xl">
                 <FileText className="w-8 h-8" />
              </div>
              <div className="hidden sm:block">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-1 block">ACTIVE_QUOTA</span>
                 <span className="text-xl font-black text-zinc-900 uppercase tracking-tight">Governance_Archive</span>
              </div>
           </div>
        </div>
      </header>

      {/* ACTION BAR */}
      <div className="flex flex-wrap items-center gap-6">
        {selectedIds.length > 0 && (
          <Button
            onClick={handleBulkDelete}
            disabled={actionLoading}
            className="rounded-[1.75rem] bg-[#d30614] hover:bg-black text-white hover:text-[#fffe01] shadow-[0_20px_50px_-12px_rgba(211,6,20,0.3)] h-16 px-10 font-black uppercase tracking-[0.3em] text-[10px] gap-4 transition-all hover:-translate-y-2 active:scale-95 animate-in slide-in-from-left-4"
          >
            <Trash2 className="w-5 h-5" />
            Purge_Context ({selectedIds.length})
          </Button>
        )}
        <Button
          variant="outline"
          onClick={markAllAsRead}
          className="rounded-[1.75rem] border-zinc-100 bg-white hover:bg-zinc-50 text-zinc-400 hover:text-black shadow-xl h-16 px-10 font-black uppercase tracking-[0.3em] text-[10px] gap-4 transition-all hover:-translate-y-1"
        >
          <CheckSquare className="w-5 h-5" />
          Archive_Signified
        </Button>
      </div>

      {/* Audit Stream */}
      <Card className="border-none shadow-3xl shadow-zinc-200/50 rounded-[3.5rem] bg-white overflow-hidden min-h-[800px] flex flex-col">
        <CardHeader className="p-10 md:p-14 border-b border-zinc-50 bg-[#f8f8f8]/50 flex flex-col sm:flex-row items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-zinc-900 text-[#fffe01] rounded-2xl shadow-xl">
                 <Clock className="w-6 h-6" />
               </div>
               <div>
                  <CardTitle className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Audit_Stream</CardTitle>
                  <CardDescription className="text-zinc-400 font-bold text-xs uppercase tracking-[0.3em] ml-2 mt-2 leading-relaxed">
                    Real-time <span className="text-zinc-900">governance telemetry</span> synchronization active.
                  </CardDescription>
               </div>
            </div>
          </div>
          {filteredRequests.length > 0 && (
            <div className="flex items-center gap-5 bg-white p-4 px-10 rounded-full border border-zinc-100 shadow-xl group cursor-pointer hover:bg-zinc-900 transition-all duration-500" onClick={toggleAll}>
              <Checkbox 
                id="select-all" 
                checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                onCheckedChange={toggleAll}
                className="w-6 h-6 rounded-lg border-zinc-200 data-[state=checked]:bg-[#fffe01] data-[state=checked]:text-black"
              />
              <Label htmlFor="select-all" className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 cursor-pointer group-hover:text-[#fffe01] transition-colors">
                Select Entire Context
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
            <div className="flex-1 flex flex-col items-center justify-center p-20 py-40 text-center space-y-10 group">
              <div className="w-48 h-48 rounded-[3.5rem] bg-zinc-50 flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 animate-in zoom-in-95">
                <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center">
                   <AlertCircle className="w-14 h-14 text-zinc-100" />
                </div>
              </div>
              <div className="space-y-4 text-center">
                <h3 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Zero_Anomalies_Detected</h3>
                <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                   Operational vectors are currently <span className="text-zinc-900">fully authorized</span> and synchronized.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {filteredRequests.map((req) => (
                <div key={req._id} className={`p-10 md:p-14 hover:bg-zinc-50/50 transition-all group flex flex-col xl:flex-row gap-12 xl:items-center relative border-l-8 border-l-transparent duration-700 ${selectedIds.includes(req._id) ? 'bg-[#fffe01]/5 border-l-black' : 'hover:border-l-zinc-100'}`}>
                  
                  <div className="flex items-center gap-10">
                    <div className="scale-150">
                      <Checkbox 
                        checked={selectedIds.includes(req._id)}
                        onCheckedChange={() => toggleSelect(req._id)}
                        className="rounded-lg border-zinc-200 data-[state=checked]:bg-black data-[state=checked]:text-[#fffe01]"
                      />
                    </div>
                    
                    <div className="flex items-center gap-8">
                       <div className="w-20 h-20 rounded-[2.5rem] bg-zinc-900 flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12 duration-500 shrink-0 border border-white/5">
                          <User className="w-10 h-10 text-[#fffe01]" />
                       </div>
                       <div className="space-y-3 min-w-[200px]">
                          <div className="flex flex-wrap items-center gap-4">
                             <h4 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none truncate max-w-[240px]">
                               {req.user?.name || 'IDENTITY_UNKNOWN'}
                             </h4>
                             {getTypeBadge(req.type)}
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-zinc-200"></div>
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono">{req.user?.employeeId || 'ID_NULL'}</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-xl space-y-4 group-hover:scale-105 transition-transform duration-500">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] flex items-center gap-3 font-mono">
                              <CalendarIcon className="w-4 h-4 text-[#d30614]" /> Chronology
                            </span>
                             {getStatusBadge(req.status)}
                          </div>
                          <p className="text-lg font-black text-zinc-900 uppercase tracking-tighter font-mono">
                            {format(new Date(req.appliedOn), 'MMM dd')} <span className="text-zinc-300 mx-2">•</span> 
                            {req.type === 'leave' ? `${req.duration}D_MAG` : req.totalPermissionTime || 'PERM_SIGNAL'}
                            {req.date && req.type !== 'leave' && <span className="ml-4 text-[10px] text-zinc-400 bg-zinc-100 px-3 py-1 rounded-lg">[{req.date}]</span>}
                         </p>
                       </div>
                      <div className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-xl space-y-4 group-hover:scale-105 transition-transform duration-500">
                         <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] flex items-center gap-3 font-mono">
                           <MessageSquare className="w-4 h-4 text-zinc-900" /> Operational_Rationale
                         </span>
                         <p className="text-sm font-bold text-zinc-500 line-clamp-2 leading-relaxed italic pr-6 pb-2">
                           "{req.reason}"
                         </p>
                      </div>
                  </div>

                  <div className="flex flex-row xl:flex-col gap-4 shrink-0 pt-6 xl:pt-0">
                    {req.status === 'pending' ? (
                      <>
                        <Button
                          onClick={() => handleStatusUpdate(req._id, 'approved')}
                          disabled={actionLoading}
                          className="flex-1 h-20 xl:w-56 bg-zinc-900 hover:bg-[#d30614] text-[#fffe01] hover:text-white rounded-[1.75rem] shadow-2xl font-black uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-4 transition-all hover:-translate-y-1 active:scale-95"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Commit_Auth
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedId(req._id);
                            setIsRejectOpen(true);
                          }}
                          disabled={actionLoading}
                          className="flex-1 h-20 xl:w-56 border-zinc-100 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-[1.75rem] font-black uppercase tracking-[0.4em] text-[10px] gap-4 transition-all hover:-translate-y-1"
                        >
                          <XCircle className="w-5 h-5" />
                          Dismiss_Req
                        </Button>
                      </>
                    ) : (
                       <div className="flex flex-col md:flex-row xl:flex-col gap-4 items-stretch w-full xl:w-56">
                          {req.status === 'rejected' && req.rejectedReason && (
                            <div className="p-6 bg-[#d30614]/5 border border-[#d30614]/10 rounded-[2rem] shadow-inner animate-in slide-in-from-top-4">
                              <span className="text-[9px] font-black text-[#d30614] uppercase block mb-2 tracking-[0.3em] font-mono">REJECTION_LOG:</span>
                              <p className="text-[11px] text-[#d30614] font-black leading-relaxed uppercase tracking-tighter">"{req.rejectedReason}"</p>
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
                              className="h-16 border-zinc-50 text-zinc-300 hover:text-[#d30614] hover:bg-[#d30614]/5 rounded-2xl font-black uppercase tracking-[0.3em] text-[9px] transition-all"
                            >
                              <XCircle className="w-4 h-4 mr-3" />
                              Void_Sequence
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleStatusUpdate(req._id, 'approved')}
                              disabled={actionLoading}
                              className="h-16 bg-zinc-900 text-[#fffe01] hover:bg-black rounded-2xl font-black uppercase tracking-[0.3em] text-[9px] shadow-2xl"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-3" />
                              Authorize_Signal
                            </Button>
                          )}
                       </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRecord(req._id)}
                      disabled={actionLoading}
                      className="text-zinc-100 hover:text-[#d30614] hover:bg-rose-50 rounded-[1.5rem] h-16 w-16 transition-all opacity-0 group-hover:opacity-100 hidden xl:flex items-center justify-center shadow-xl hover:scale-110"
                    >
                      <Trash2 className="w-6 h-6" />
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
        <DialogContent className="w-[95vw] sm:max-w-2xl rounded-[3.5rem] bg-white border-0 shadow-3xl p-0 overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="bg-zinc-900 p-12 md:p-16 text-white relative">
            <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
               <XCircle className="w-48 h-48" />
            </div>
            <DialogTitle className="text-4xl font-black tracking-tighter mb-4 uppercase">Rejection Verdict</DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em] leading-relaxed">
              Provide formal authorization context for the <span className="text-[#d30614]">dismissal sequence</span>.
            </DialogDescription>
          </div>
          <div className="p-12 md:p-16 space-y-10">
            <div className="space-y-4">
              <Label htmlFor="rejectedReason" className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 ml-2 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#d30614]"></div>
                 RATIONALE_SPECIFICATION
              </Label>
              <textarea
                id="rejectedReason"
                placeholder="ENCODE DISMISSAL RATIONALE..."
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
                className="w-full min-h-[220px] bg-zinc-50 border-none rounded-[2.5rem] p-10 text-sm font-black text-zinc-900 uppercase tracking-tight focus:bg-white focus:ring-0 transition-all resize-none shadow-inner leading-relaxed"
              />
            </div>
          </div>
          <DialogFooter className="p-12 md:p-16 pt-0 flex-row gap-6 ">
            <Button
              variant="ghost"
              onClick={() => setIsRejectOpen(false)}
              className="flex-1 h-20 rounded-[1.75rem] font-black uppercase tracking-[0.3em] text-[10px] text-zinc-400 hover:text-black hover:bg-zinc-50 transition-all"
            >
              Abort_Verdict
            </Button>
            <Button
              disabled={!rejectedReason || actionLoading}
              onClick={() => handleStatusUpdate(selectedId, 'rejected', rejectedReason)}
              className="flex-1 h-20 bg-zinc-900 text-[#fffe01] hover:bg-[#d30614] hover:text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-3xl hover:-translate-y-1 active:scale-95 transition-all"
            >
              Commit_Denial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermissionReview;

