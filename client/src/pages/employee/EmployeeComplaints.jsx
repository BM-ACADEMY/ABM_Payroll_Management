import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ShieldCheck,
  Plus,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import PaginationControl from '@/components/ui/PaginationControl';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const EmployeeComplaints = () => {
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMyComplaints(1);
  }, []);

  const handlePageChange = (page) => {
    fetchMyComplaints(page);
  };

  const fetchMyComplaints = async (page = 1) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/complaints/my?page=${page}&limit=5`, {
        headers: { 'x-auth-token': token }
      });
      setComplaints(res.data.complaints);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/complaints`, 
        { subject, description },
        { headers: { 'x-auth-token': token } }
      );
      toast({ title: "Submitted", description: "Your complaint has been logged successfully." });
      setSubject('');
      setDescription('');
      setShowSubmitDialog(false);
      fetchMyComplaints();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit complaint" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/complaints/${id}`, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Deleted", description: "Complaint has been removed." });
      fetchMyComplaints(pagination.currentPage);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete complaint" });
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-medium uppercase tracking-widest text-[9px]">Awaiting Review</Badge>;
      case 'reviewed': return <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-medium uppercase tracking-widest text-[9px]">Reviewed by Admin</Badge>;
      case 'resolved': return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-medium uppercase tracking-widest text-[9px]">Resolved</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-zinc-900 rounded-full"></div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Support <span className="text-zinc-500 font-normal underline decoration-zinc-200 underline-offset-8">Center</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium ml-4">
            Official grievance registry and resolution history.
          </p>
        </div>

        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-black text-[#fffe01] hover:bg-zinc-800 px-6 h-12 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-lg transition-all active:scale-95">
              <Plus className="w-4 h-4" />
              New Complaint
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white sm:max-w-md">
            <DialogHeader className="p-8 bg-zinc-50 border-b border-zinc-100">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-black text-[#fffe01] rounded-lg">
                     <MessageSquare className="w-4 h-4" />
                  </div>
                  <DialogTitle className="text-lg font-semibold text-zinc-900">Lodge Complaint</DialogTitle>
               </div>
               <DialogDescription className="text-zinc-500 font-medium text-xs pt-1">
                 Please provide details of your grievance.
               </DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Subject</Label>
                    <Input 
                      placeholder="e.g. Technical Issue, HR Inquiry..." 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="rounded-xl border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-black h-12 font-medium text-sm px-4 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Details</Label>
                    <Textarea 
                      placeholder="Describe the situation..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[150px] rounded-xl border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-black p-4 font-medium text-sm transition-all resize-none"
                    />
                  </div>
               </div>
               <DialogFooter className="pt-2 gap-3 sm:justify-end">
                  <Button variant="ghost" onClick={() => setShowSubmitDialog(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-12 px-6">Cancel</Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!subject || !description || loading}
                    className="rounded-xl bg-black text-[#fffe01] hover:bg-zinc-800 font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl"
                  >
                    {loading ? "Sending..." : "Submit"}
                  </Button>
               </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 py-24 bg-white shadow-sm rounded-3xl border border-zinc-100">
            <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6">
               <MessageSquare className="w-8 h-8 text-zinc-300" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">No Complaints Found</h3>
              <p className="text-zinc-500 font-medium text-xs max-w-xs mx-auto">
                 History is currently clear. Any grievances filed will appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8">
              {complaints.map((c) => (
                <Card key={c._id} className="rounded-3xl border-zinc-100 shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className="p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                       <div className="flex items-start gap-4">
                          <div className="p-3 bg-zinc-900 text-[#fffe01] rounded-xl shadow-lg shrink-0">
                             <MessageSquare className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                             <div className="flex flex-wrap items-center gap-3 mb-2">
                                {getStatusBadge(c.status)}
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                  {format(new Date(c.createdAt), 'MMMM dd, yyyy')}
                                </span>
                             </div>
                             <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">{c.subject}</h3>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 self-start sm:self-auto">
                          <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100 shrink-0">
                             <div className="w-1.5 h-1.5 rounded-full bg-[#d30614]"></div>
                             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">ID: {c._id.slice(-6).toUpperCase()}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setDeleteId(c._id); setIsDeleteDialogOpen(true); }}
                            className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Complaint"
                          >
                             <Trash2 className="w-4 h-4" />
                          </Button>
                       </div>
                    </div>

                    <div className="bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100 relative">
                       <p className="text-zinc-600 font-medium text-sm leading-relaxed italic">"{c.description}"</p>
                    </div>

                    {c.adminResponse ? (
                      <div className="bg-zinc-900 p-8 rounded-2xl relative border-none shadow-xl">
                        <div className="flex items-start gap-4 relative z-10">
                           <div className="w-10 h-10 rounded-xl bg-[#fffe01] flex items-center justify-center text-black shrink-0">
                              <ShieldCheck className="w-5 h-5" />
                           </div>
                           <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Official Response</span>
                                <div className="h-[1px] w-12 bg-zinc-800"></div>
                              </div>
                              <p className="text-white font-medium text-sm leading-relaxed">"{c.adminResponse}"</p>
                              <div className="flex items-center gap-2 pt-1">
                                 <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                 <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Verified Resolution</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 py-3 px-5 bg-amber-50 rounded-xl border border-amber-100 inline-flex">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Awaiting Review</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex justify-center pt-8">
              <PaginationControl pagination={pagination} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </div>

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

export default EmployeeComplaints;

