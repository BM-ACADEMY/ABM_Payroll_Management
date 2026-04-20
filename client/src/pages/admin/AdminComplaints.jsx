import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  Search, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MoreVertical,
  Reply,
  ShieldCheck,
  Building2
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
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import PaginationControl from '@/components/ui/PaginationControl';
import Loader from "@/components/ui/Loader";

const AdminComplaints = () => {
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
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

  const filteredComplaints = complaints.filter(c => 
    c.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold uppercase tracking-widest text-[10px]">Pending Review</Badge>;
      case 'reviewed': return <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold uppercase tracking-widest text-[10px]">Reviewed</Badge>;
      case 'resolved': return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold uppercase tracking-widest text-[10px]">Resolved</Badge>;
      default: return null;
    }
  };

    <div className="min-h-screen bg-[#fdfdfd] p-4 md:p-8 lg:p-12 space-y-12 animate-in fade-in duration-1000 pb-32">
      {/* Header Section */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-10 md:h-14 w-2.5 bg-[#d30614] rounded-full shadow-lg shadow-red-100"></div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-zinc-900 uppercase leading-[0.9]">
              Resolution <span className="text-[#d30614] tracking-tight">Vectors</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl leading-relaxed ml-2">
            Strategic <span className="text-zinc-900 font-black">Grievance Arbitration</span> & Operational Feedback Registry.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
           <div className="relative group w-full sm:w-80">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400 group-focus-within:text-black transition-colors" />
              <Input
                placeholder="PROBE FEEDBACK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-16 h-20 bg-white border-zinc-100 rounded-[2rem] shadow-xl text-sm font-black uppercase tracking-widest focus:ring-4 focus:ring-zinc-100/50 transition-all"
              />
           </div>
           
           <div className="flex items-center gap-4 bg-white p-3 rounded-[2rem] border border-zinc-100 shadow-xl pr-8">
              <div className="p-4 bg-zinc-900 text-[#fffe01] rounded-2xl shadow-xl">
                 <Building2 className="w-8 h-8" />
              </div>
              <div className="hidden sm:block">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-1 block">STABILITY_METRIC</span>
                 <span className="text-xl font-black text-zinc-900 uppercase tracking-tight">Feedback_Grid</span>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {filteredComplaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 py-40 bg-white shadow-3xl shadow-zinc-200/50 rounded-[4rem] group border border-zinc-50">
            <div className="w-48 h-48 rounded-[3.5rem] bg-zinc-50 flex items-center justify-center mb-10 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 animate-in zoom-in-95">
              <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center">
                 <MessageSquare className="w-14 h-14 text-zinc-100" />
              </div>
            </div>
            <div className="space-y-4 text-center">
              <h3 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Record_Grid_Static</h3>
              <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                 No active grievances detected in the <span className="text-zinc-900">resolution lattice</span>. System integrity verified.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-10">
              {filteredComplaints.map((c) => (
                <Card key={c._id} className="rounded-[3.5rem] border-none shadow-3xl shadow-zinc-200/50 bg-white overflow-hidden hover:scale-[1.01] transition-all duration-700 group">
                  <div className="flex flex-col md:flex-row min-h-[300px]">
                    <div className="p-10 md:p-14 md:w-96 border-b md:border-b-0 md:border-r border-zinc-50 bg-[#f8f8f8]/50 flex flex-col justify-between gap-10">
                       <div className="space-y-8">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-900 flex items-center justify-center text-[#fffe01] font-black text-2xl shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                              {c.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                              <span className="text-xl font-black text-zinc-900 tracking-tighter uppercase truncate block max-w-[160px]">{c.user.name}</span>
                              <span className="text-[10px] font-bold text-zinc-400 tracking-[0.3em] uppercase block font-mono">{c.user.employeeId}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="flex items-center gap-4 text-zinc-500 bg-white p-3 px-6 rounded-2xl shadow-inner border border-zinc-100">
                               <Clock className="w-4 h-4 text-[#d30614]" />
                               <span className="text-[10px] font-black uppercase tracking-widest font-mono">{format(new Date(c.createdAt), 'MMM dd | HH:mm')}</span>
                            </div>
                            <div className="inline-block transform group-hover:scale-105 transition-transform">
                               {getStatusBadge(c.status)}
                            </div>
                          </div>
                       </div>
                       
                       <div className="pt-6 border-t border-zinc-100">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-[#fffe01] animate-pulse"></div>
                             <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Awaiting_Administrative_Action</span>
                          </div>
                       </div>
                    </div>

                    <div className="p-10 md:p-14 flex-1 flex flex-col justify-between gap-10 relative">
                       <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000 pointer-events-none">
                          <MessageSquare className="w-64 h-64" />
                       </div>

                       <div className="space-y-8 relative z-10">
                          <div className="flex items-center gap-4">
                             <div className="h-0.5 w-10 bg-zinc-100"></div>
                             <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">{c.subject}</h3>
                          </div>
                          <div className="bg-[#fcfcfc] p-8 md:p-10 rounded-[2.5rem] border border-zinc-100 shadow-inner group-hover:bg-white transition-all duration-700">
                             <p className="text-zinc-500 font-bold text-lg md:text-xl leading-relaxed italic pr-6 pb-2">"{c.description}"</p>
                          </div>
                       </div>

                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pt-10 border-t border-zinc-50 relative z-10">
                          <div className="flex items-center gap-4">
                             {c.adminResponse && (
                               <div className="bg-zinc-900 p-4 px-8 rounded-[1.75rem] shadow-2xl border border-white/5 flex items-center gap-4 group/res hover:scale-105 transition-transform duration-500">
                                  <ShieldCheck className="w-6 h-6 text-[#fffe01] animate-pulse" />
                                  <div className="flex flex-col">
                                     <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Official_Verdict</span>
                                     <span className="text-white font-black text-xs uppercase tracking-tighter truncate max-w-[280px]">"{c.adminResponse}"</span>
                                  </div>
                               </div>
                             )}
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                             <Button 
                               variant="outline" 
                               onClick={() => {
                                 setSelectedComplaint(c);
                                 setAdminResponse(c.adminResponse || '');
                                 setShowResponseDialog(true);
                               }}
                               className="rounded-[1.5rem] border-zinc-100 bg-white hover:bg-zinc-900 hover:text-[#fffe01] font-black uppercase text-[10px] tracking-[0.3em] h-16 px-10 shadow-xl transition-all hover:-translate-y-1"
                             >
                               <Reply className="w-5 h-5 mr-3" />
                               Respond_Signal
                             </Button>
                             {c.status !== 'resolved' && (
                               <Button 
                                 onClick={() => updateStatus(c._id, 'resolved', c.adminResponse)}
                                 className="rounded-[1.5rem] bg-zinc-900 hover:bg-[#d30614] text-[#fffe01] hover:text-white font-black uppercase text-[10px] tracking-[0.3em] h-16 px-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-2 active:scale-95"
                               >
                                 <CheckCircle className="w-5 h-5 mr-3" />
                                 Resolve_Case
                               </Button>
                             )}
                          </div>
                       </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex justify-center pt-10">
              <PaginationControl pagination={pagination} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </div>

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="rounded-[3.5rem] border-none shadow-3xl p-0 overflow-hidden bg-white sm:max-w-2xl animate-in zoom-in-95 duration-500">
           <DialogHeader className="p-12 md:p-16 bg-zinc-900 border-b border-white/5 relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
                 <ShieldCheck className="w-48 h-48" />
              </div>
              <div className="space-y-4 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#fffe01] text-black rounded-xl">
                       <ShieldCheck className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-4xl font-black uppercase tracking-tighter">Admin Resolution</DialogTitle>
                 </div>
                 <DialogDescription className="text-zinc-500 font-bold text-xs uppercase tracking-[0.4em] leading-relaxed">
                   Synchronize resolution verdict for case: <span className="text-white font-black tracking-tight">{selectedComplaint?.subject}</span>
                 </DialogDescription>
              </div>
           </DialogHeader>
           <div className="p-12 md:p-16 space-y-12">
              <div className="space-y-4">
                 <Label className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d30614]"></div>
                    OFFICIAL_RESPONSE_ENTRY
                 </Label>
                 <Textarea 
                   value={adminResponse}
                   onChange={(e) => setAdminResponse(e.target.value)}
                   placeholder="ENCODE FINAL RESOLUTION DETAILS..."
                   className="min-h-[220px] rounded-[2.5rem] border-none bg-zinc-50 focus:bg-white focus:ring-0 p-10 font-black text-sm uppercase tracking-tight transition-all shadow-inner resize-none leading-relaxed"
                 />
              </div>
              <div className="flex flex-row gap-6">
                 <Button variant="outline" onClick={() => setShowResponseDialog(false)} className="flex-1 h-20 rounded-[1.75rem] font-black uppercase text-[10px] tracking-[0.3em] border-zinc-100 hover:bg-zinc-50 transition-all">ABORT_VERDICT</Button>
                 <Button 
                   onClick={() => updateStatus(selectedComplaint._id, 'reviewed', adminResponse)}
                   className="flex-1 h-20 rounded-[2rem] bg-zinc-900 hover:bg-[#fffe01] text-white hover:text-black font-black uppercase text-[10px] tracking-[0.3em] shadow-3xl hover:-translate-y-2 transition-all active:scale-95"
                 >POST_RESOLUTION</Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminComplaints;

