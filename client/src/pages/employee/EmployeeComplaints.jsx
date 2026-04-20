import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ShieldCheck,
  Plus
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

const EmployeeComplaints = () => {
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-medium uppercase tracking-widest text-[9px]">Awaiting Review</Badge>;
      case 'reviewed': return <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-medium uppercase tracking-widest text-[9px]">Reviewed by Admin</Badge>;
      case 'resolved': return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-medium uppercase tracking-widest text-[9px]">Resolved</Badge>;
      default: return null;
    }
  };

    <div className="min-h-screen bg-[#fdfdfd] p-4 md:p-8 lg:p-12 space-y-12 animate-in fade-in duration-1000 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-10 md:h-14 w-2.5 bg-[#d30614] rounded-full shadow-lg shadow-red-100"></div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-zinc-900 uppercase leading-[0.9]">
              Support <span className="text-[#d30614] tracking-tight">Vectors</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl leading-relaxed ml-2">
            Professional <span className="text-zinc-900 font-black">Grievance Management</span> & Official Resolution Registry.
          </p>
        </div>

        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-[2rem] bg-zinc-900 hover:bg-[#d30614] text-[#fffe01] hover:text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] px-10 h-20 font-black uppercase tracking-[0.3em] text-[11px] gap-4 transition-all hover:-translate-y-2 active:scale-95 group">
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
              Initialize_Signal
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[3.5rem] border-none shadow-3xl p-0 overflow-hidden bg-white sm:max-w-2xl animate-in zoom-in-95 duration-500">
            <DialogHeader className="p-12 md:p-16 bg-zinc-900 border-b border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
                  <MessageSquare className="w-48 h-48" />
               </div>
               <div className="space-y-4 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#fffe01] text-black rounded-xl">
                       <MessageSquare className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-[#fffe01]">New Complaint</DialogTitle>
                 </div>
                 <DialogDescription className="text-zinc-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
                   Synchronize your concerns with the <span className="text-white">Administrative Backbone</span>.
                 </DialogDescription>
               </div>
            </DialogHeader>
            <div className="p-12 md:p-16 space-y-12">
               <div className="space-y-10">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#d30614]"></div>
                       SIGNAL_SUBJECT
                    </Label>
                    <Input 
                      placeholder="ENCODE SUBJECT..." 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="rounded-[1.75rem] border-none bg-zinc-50 focus:bg-white focus:ring-0 h-16 font-black text-sm uppercase px-8 shadow-inner transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#fffe01] shadow-[0_0_10px_rgba(255,254,1,0.5)]"></div>
                       DETAILED_LOG
                    </Label>
                    <Textarea 
                      placeholder="ENCODE DESCRIPTION..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[200px] rounded-[2.5rem] border-none bg-zinc-50 focus:bg-white focus:ring-0 p-10 font-black text-sm transition-all shadow-inner resize-none leading-relaxed"
                    />
                  </div>
               </div>
               <DialogFooter className="pt-4 gap-6 sm:justify-between flex-row">
                  <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="rounded-[1.75rem] font-black uppercase text-[10px] tracking-[0.3em] h-16 flex-1 hover:bg-zinc-50 border-zinc-100">ABORT</Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!subject || !description || loading}
                    className="rounded-[2rem] bg-zinc-900 hover:bg-[#fffe01] text-white hover:text-black font-black uppercase text-[10px] tracking-[0.3em] h-20 flex-1 shadow-2xl transition-all"
                  >
                    {loading ? "SYNCING..." : "TRANSMIT"}
                  </Button>
               </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 py-40 bg-white shadow-3xl shadow-zinc-200/50 rounded-[4rem] group border border-zinc-50">
            <div className="w-48 h-48 rounded-[3.5rem] bg-zinc-50 flex items-center justify-center mb-10 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 animate-in zoom-in-95">
              <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center">
                 <MessageSquare className="w-14 h-14 text-zinc-100" />
              </div>
            </div>
            <div className="space-y-4 text-center">
              <h3 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Record_History_Vacant</h3>
              <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                 No active or archived grievances detected in the <span className="text-zinc-900">resolution lattice</span>.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-12">
              {complaints.map((c) => (
                <Card key={c._id} className="rounded-[3.5rem] border-none shadow-3xl shadow-zinc-200/50 bg-white overflow-hidden hover:scale-[1.01] transition-all duration-700 group">
                  <div className="p-12 md:p-16 space-y-10 relative">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000 pointer-events-none">
                       <MessageSquare className="w-64 h-64" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                       <div className="flex flex-col md:flex-row md:items-center gap-6">
                          <div className="p-5 bg-zinc-900 text-[#fffe01] rounded-[1.75rem] shadow-2xl transition-transform group-hover:rotate-12 duration-500 shrink-0">
                             <MessageSquare className="w-8 h-8" />
                          </div>
                          <div className="space-y-3">
                             <div className="flex flex-wrap items-center gap-5">
                                {getStatusBadge(c.status)}
                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] font-mono">
                                  {format(new Date(c.createdAt), 'MMM dd, yyyy')}
                                </span>
                             </div>
                             <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">{c.subject}</h3>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-[1.5rem] pr-8 shadow-inner shrink-0 self-start sm:self-auto">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#d30614] animate-pulse"></div>
                          <span className="text-[9px] font-black text-zinc-900 uppercase tracking-widest font-mono">Registry_ID: #0x{c._id.slice(-6).toUpperCase()}</span>
                       </div>
                    </div>

                    <div className="bg-[#fcfcfc] p-10 md:p-12 rounded-[2.5rem] border border-zinc-100 shadow-inner group-hover:bg-white transition-all duration-700 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-2.5 h-full bg-zinc-100"></div>
                       <p className="text-zinc-500 font-bold text-lg md:text-xl leading-relaxed relative z-10 italic">"{c.description}"</p>
                    </div>

                    {c.adminResponse ? (
                      <div className="bg-zinc-900 p-10 md:p-14 rounded-[3rem] border border-white/5 relative group/res shadow-22xl">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover/res:scale-110 group-hover/res:rotate-12 transition-transform duration-700">
                           <ShieldCheck className="w-32 h-32 text-white" />
                        </div>
                        <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                           <div className="w-16 h-16 rounded-[1.5rem] bg-[#fffe01] flex items-center justify-center text-black shrink-0 shadow-2xl animate-in slide-in-from-left-4 duration-1000">
                              <ShieldCheck className="w-10 h-10" />
                           </div>
                           <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 font-mono">OFFICIAL_RESOLUTION</span>
                                <div className="h-px w-20 bg-zinc-800"></div>
                              </div>
                              <p className="text-white font-black text-xl md:text-2xl tracking-tighter leading-tight uppercase">"{c.adminResponse}"</p>
                              <div className="flex items-center gap-3 py-2 px-6 bg-white/5 rounded-xl border border-white/5 inline-flex">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                 <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">Verified_by_Advisory_Board</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-6 py-6 px-10 bg-amber-50/50 rounded-[2rem] border border-amber-100/50 inline-flex group-hover:scale-105 transition-transform duration-700">
                         <div className="relative">
                            <Clock className="w-6 h-6 text-amber-500 animate-spin transition-all duration-3000" />
                         </div>
                         <div className="space-y-1">
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em] block">PROTOCOL_PULSE</span>
                            <span className="text-sm font-black text-amber-600 uppercase tracking-tighter">Awaiting_Administrative_Handshake</span>
                         </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex justify-center pt-12">
              <PaginationControl pagination={pagination} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeComplaints;

