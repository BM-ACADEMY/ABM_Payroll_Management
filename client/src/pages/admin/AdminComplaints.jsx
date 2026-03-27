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

const AdminComplaints = () => {
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/complaints`, {
        headers: { 'x-auth-token': token }
      });
      setComplaints(res.data);
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

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-black font-medium">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs uppercase tracking-[0.2em]">Employee Feedback Terminal</span>
          </div>
          <h1 className="text-4xl font-medium text-slate-900 tracking-tight">Grievance Management</h1>
          <p className="text-slate-500 font-medium">Review and resolve employee complaints with full transparency.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 border-2 border-slate-100 rounded-full shadow-xl shadow-slate-200/40">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search complaints..." 
                className="pl-11 pr-6 py-2 w-72 rounded-full border-0 bg-transparent font-medium focus-visible:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <Button onClick={fetchComplaints} variant="ghost" className="rounded-full w-10 h-10 p-0 text-slate-400 hover:text-black">
              <Clock className="w-5 h-5" />
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {filteredComplaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white border-4 border-dashed border-slate-100 rounded-[3rem]">
            <div className="w-20 h-20 rounded-3xl bg-black flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-[#fffe01]" />
            </div>
            <h3 className="text-xl font-medium text-slate-400 tracking-tight uppercase">No Complaints Found</h3>
            <p className="text-slate-300 font-medium italic">Everything seems to be running smoothly.</p>
          </div>
        ) : (
          filteredComplaints.map((c) => (
            <Card key={c._id} className="rounded-[2.5rem] border-0 shadow-xl shadow-slate-200/30 bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className="flex flex-col md:flex-row">
                <div className="p-8 md:w-80 border-b md:border-b-0 md:border-r border-slate-50 bg-slate-50/30">
                   <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-[#fffe01] font-medium shadow-lg">
                          {c.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 tracking-tight">{c.user.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{c.user.employeeId}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-400">
                           <Clock className="w-4 h-4" />
                           <span className="text-xs font-bold">{format(new Date(c.createdAt), 'MMM dd, yyyy • HH:mm')}</span>
                        </div>
                        {getStatusBadge(c.status)}
                      </div>
                   </div>
                </div>

                <div className="p-8 flex-1 flex flex-col justify-between gap-6">
                   <div className="space-y-3">
                      <h3 className="text-xl font-medium text-slate-900 tracking-tight">{c.subject}</h3>
                      <p className="text-slate-600 font-medium leading-relaxed">{c.description}</p>
                   </div>

                   <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-4">
                         {c.adminResponse && (
                           <div className="flex items-center gap-2 text-black bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 italic font-medium text-sm">
                              <ShieldCheck className="w-4 h-4" />
                              <span className="truncate max-w-sm whitespace-nowrap">Response: {c.adminResponse}</span>
                           </div>
                         )}
                      </div>
                      <div className="flex items-center gap-3">
                         <Button 
                           variant="outline" 
                           onClick={() => {
                             setSelectedComplaint(c);
                             setAdminResponse(c.adminResponse || '');
                             setShowResponseDialog(true);
                           }}
                           className="rounded-full border-2 border-slate-100 font-medium uppercase text-[10px] tracking-widest px-6"
                         >
                           <Reply className="w-4 h-4 mr-2" />
                           Respond
                         </Button>
                         {c.status !== 'resolved' && (
                           <Button 
                             onClick={() => updateStatus(c._id, 'resolved', c.adminResponse)}
                             className="rounded-full bg-emerald-600 hover:bg-emerald-700 font-medium uppercase text-[10px] tracking-widest px-6 shadow-lg shadow-emerald-100"
                           >
                             <CheckCircle className="w-4 h-4 mr-2" />
                             Mark Resolved
                           </Button>
                         )}
                      </div>
                   </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden bg-white sm:max-w-lg text-slate-900">
           <DialogHeader className="p-10 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3 text-black mb-2">
                 <ShieldCheck className="w-6 h-6" />
                 <DialogTitle className="text-2xl font-medium uppercase tracking-tight">Admin Resolution</DialogTitle>
              </div>
              <DialogDescription className="text-slate-500 font-medium">Issue: <span className="text-slate-900 font-bold">{selectedComplaint?.subject}</span></DialogDescription>
           </DialogHeader>
           <div className="p-10 space-y-6">
              <div className="space-y-3">
                 <Label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Official Response</Label>
                 <Textarea 
                   value={adminResponse}
                   onChange={(e) => setAdminResponse(e.target.value)}
                   placeholder="Enter final resolution details..."
                   className="min-h-[150px] rounded-[1.5rem] border-2 border-slate-100 focus:border-black bg-slate-50/50 p-6 font-medium transition-all"
                 />
              </div>
              <div className="flex gap-4">
                 <Button variant="outline" onClick={() => setShowResponseDialog(false)} className="flex-1 h-14 rounded-2xl font-medium uppercase text-[10px] tracking-widest border-2 border-slate-100">Cancel</Button>
                 <Button 
                   onClick={() => updateStatus(selectedComplaint._id, 'reviewed', adminResponse)}
                   className="flex-1 h-14 rounded-2xl bg-black hover:bg-zinc-900 text-[#fffe01] font-medium uppercase text-[10px] tracking-widest shadow-lg"
                 >Post Response</Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-md z-[100] flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-black animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
