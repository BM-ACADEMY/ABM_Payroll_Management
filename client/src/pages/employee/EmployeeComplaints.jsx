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

const EmployeeComplaints = () => {
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/complaints/my`, {
        headers: { 'x-auth-token': token }
      });
      setComplaints(res.data);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
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
      case 'pending': return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold uppercase tracking-widest text-[9px]">Awaiting Review</Badge>;
      case 'reviewed': return <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold uppercase tracking-widest text-[9px]">Reviewed by Admin</Badge>;
      case 'resolved': return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold uppercase tracking-widest text-[9px]">Resolved</Badge>;
      default: return null;
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen animate-in fade-in duration-700">
      <header className="flex justify-between items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs uppercase tracking-[0.2em]">Support Portal</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Grievances</h1>
          <p className="text-slate-500 font-medium">Track your submitted complaints and official resolutions.</p>
        </div>

        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 px-8 h-14 font-black uppercase tracking-widest text-[11px] gap-3 transition-all hover:-translate-y-1">
              <Plus className="w-5 h-5" />
              File New Complaint
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden bg-white sm:max-w-lg">
            <DialogHeader className="p-10 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3 text-indigo-600 mb-2">
                 <MessageSquare className="w-6 h-6" />
                 <DialogTitle className="text-2xl font-black uppercase tracking-tight">Submit Complaint</DialogTitle>
              </div>
              <DialogDescription className="text-slate-500 font-medium italic">Your feedback helps us maintain a professional environment.</DialogDescription>
            </DialogHeader>
            <div className="p-10 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</Label>
                    <Input 
                      placeholder="e.g., Salary discrepancy, Attendance error..." 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="rounded-2xl border-2 border-slate-100 focus:border-indigo-500 bg-slate-50/50 h-14 font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Description</Label>
                    <Textarea 
                      placeholder="Explain the issue in detail..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[150px] rounded-[1.5rem] border-2 border-slate-100 focus:border-indigo-500 bg-slate-50/50 p-6 font-medium transition-all"
                    />
                  </div>
               </div>
               <DialogFooter className="pt-4 gap-4 sm:justify-between">
                  <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 flex-1">Cancel</Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!subject || !description || loading}
                    className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[10px] tracking-widest h-14 flex-1 shadow-lg shadow-indigo-100"
                  >
                    {loading ? "Syncing..." : "Submit Grievance"}
                  </Button>
               </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white border-4 border-dashed border-slate-100 rounded-[3rem]">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-400 tracking-tight uppercase">No Grievances Filed</h3>
            <p className="text-slate-300 font-medium italic">You haven't submitted any complaints yet.</p>
          </div>
        ) : (
          complaints.map((c) => (
            <Card key={c._id} className="rounded-[2.5rem] border-0 shadow-xl shadow-slate-200/30 bg-white overflow-hidden hover:shadow-2xl transition-all duration-500">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start gap-4">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         {getStatusBadge(c.status)}
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           {format(new Date(c.createdAt), 'MMM dd, yyyy')}
                         </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight underline decoration-indigo-200 decoration-4 underline-offset-4">{c.subject}</h3>
                   </div>
                </div>

                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                   <p className="text-slate-600 font-medium leading-relaxed italic">"{c.description}"</p>
                </div>

                {c.adminResponse ? (
                  <div className="bg-indigo-50/50 p-8 rounded-[2rem] border-2 border-indigo-100 relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <ShieldCheck className="w-12 h-12 text-indigo-900" />
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                          <AlertCircle className="w-6 h-6" />
                       </div>
                       <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Official Resolution</span>
                          <p className="text-indigo-900 font-bold leading-relaxed">{c.adminResponse}</p>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-3 px-6 bg-amber-50 rounded-2xl border border-amber-100 inline-flex">
                     <Clock className="w-4 h-4 text-amber-500 animate-spin-slow" />
                     <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Monitoring by Admin</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EmployeeComplaints;
