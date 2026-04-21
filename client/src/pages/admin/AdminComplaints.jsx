import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  Search, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Reply,
  ShieldCheck,
  Building2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import PaginationControl from '@/components/ui/PaginationControl';
import Loader from "@/components/ui/Loader";
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const AdminComplaints = () => {
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaints(1);
  }, []);

  const handlePageChange = (page) => {
    fetchComplaints(page);
  };

  const fetchComplaints = async (page = 1) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/complaints?page=${page}&limit=5`, {
        headers: { 'x-auth-token': token }
      });
      setComplaints(res.data.complaints);
      setPagination(res.data.pagination);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch complaints"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, response = '') => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/complaints/${id}`, 
        { status, adminResponse: response },
        { headers: { 'x-auth-token': token } }
      );
      toast({ title: "Success", description: `Complaint marked as ${status}` });
      fetchComplaints();
      setShowResponseDialog(false);
      setAdminResponse('');
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update complaint" });
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/complaints/${id}`, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Deleted", description: "Complaint has been removed." });
      fetchComplaints(pagination.currentPage);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete complaint" });
    }
  };

  const filteredComplaints = complaints.filter(c => 
    c.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reviewed':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 uppercase text-[10px] font-semibold">Resolved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 uppercase text-[10px] font-semibold">Dismissed</Badge>;
      default:
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 uppercase text-[10px] font-semibold animate-pulse">Pending Review</Badge>;
    }
  };

  const getPriorityBadge = (department) => {
    return <Badge className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border-none uppercase text-[9px] font-bold tracking-wider">{department || 'General'}</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-zinc-900 rounded-full"></div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Resolution Center</h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium ml-4">
             Official Employee Complaint Registry & Audit
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative group w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-white border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-100 transition-all"
              />
           </div>
           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Secure Audit</span>
           </div>
        </div>
      </header>

      {/* Main Content Card */}
      <Card className="border-zinc-200 shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col min-h-[600px]">
        <CardHeader className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 text-white rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-zinc-900">Complaint Feed</CardTitle>
              <CardDescription className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                Manage and resolve employee feedback
              </CardDescription>
            </div>
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200 shadow-inner">
             <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                System Active
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          {filteredComplaints.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4 border border-zinc-100">
                <MessageSquare className="w-8 h-8 text-zinc-200" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">No complaints found</h3>
              <p className="text-zinc-400 text-[11px] font-medium uppercase tracking-wider mt-1">
                The registry is currently clear of active grievances.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filteredComplaints.map((c) => (
                <div key={c._id} className="p-6 hover:bg-zinc-50/50 transition-colors group relative">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* User Info */}
                    <div className="flex items-center gap-3 w-full lg:w-64 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 font-semibold text-sm">
                        {c.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-sm font-semibold text-zinc-900 block truncate">{c.user.name}</span>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block font-mono">{c.user.employeeId}</span>
                      </div>
                    </div>

                    {/* Complaint Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-[1.5px] bg-zinc-200"></div>
                        <h3 className="text-sm font-semibold text-zinc-900">{c.subject}</h3>
                        {getPriorityBadge(c.department)}
                        <div className="ml-auto text-[10px] font-medium text-zinc-400 flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100 group-hover:bg-white transition-colors">
                           <Clock className="w-3 h-3 text-amber-500" />
                           {format(new Date(c.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-zinc-50/50 rounded-xl border border-zinc-100/50 group-hover:bg-white transition-all">
                        <p className="text-zinc-600 text-[13px] leading-relaxed italic pr-4">"{c.description}"</p>
                      </div>

                      {c.adminResponse && (
                        <div className="flex items-start gap-2 pt-2">
                           <div className="mt-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                           </div>
                           <div className="bg-zinc-900 p-3 px-4 rounded-xl shadow-sm border border-white/5 max-w-xl">
                              <div className="text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1">Official Response</div>
                              <p className="text-white text-[12px] font-medium leading-relaxed italic">"{c.adminResponse}"</p>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col items-center justify-end gap-2 lg:w-48 shrink-0">
                      <div className="mb-auto hidden lg:block">
                         {getStatusBadge(c.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(c);
                            setAdminResponse(c.adminResponse || '');
                            setShowResponseDialog(true);
                          }}
                          className="h-9 px-4 rounded-lg bg-white border-zinc-200 hover:bg-zinc-900 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          Resolve
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setDeleteId(c._id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="h-9 w-9 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all border border-zinc-100 lg:border-transparent opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 border-t border-zinc-100 bg-zinc-50/30">
          <PaginationControl
            currentPage={pagination.currentPage}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </CardFooter>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border-none shadow-2xl">
          <DialogHeader className="space-y-3 pb-4">
            <div className="w-12 h-12 bg-zinc-900 text-[#fffe01] rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold tracking-tight">Official Resolution</DialogTitle>
              <DialogDescription className="text-xs font-medium text-zinc-500">
                Provide a recorded verdict for this employee complaint.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Resolution Details</Label>
              <Textarea 
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Enter final resolution..."
                className="min-h-[140px] rounded-xl border-zinc-100 bg-zinc-50 focus:bg-white p-4 text-[13px] font-medium transition-all shadow-inner resize-none leading-relaxed"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowResponseDialog(false)} className="flex-1 h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-50">Cancel</Button>
              <Button 
                onClick={() => updateStatus(selectedComplaint._id, 'reviewed', adminResponse)}
                className="flex-[2] h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase text-[11px] tracking-wider transition-all active:scale-95 shadow-lg shadow-zinc-200"
              >Post Resolution</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => handleDelete(deleteId)}
        title="Confirm Deletion"
        description="Are you sure you want to delete this complaint? This operation is permanent and cannot be undone."
      />
    </div>
  );
};

export default AdminComplaints;

