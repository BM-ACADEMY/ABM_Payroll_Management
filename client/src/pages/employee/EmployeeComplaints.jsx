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
      const token = localStorage.getItem('token');
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
      case 'pending': return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-medium uppercase tracking-widest text-[9px]">Awaiting Review</Badge>;
      case 'reviewed': return <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-medium uppercase tracking-widest text-[9px]">Reviewed by Admin</Badge>;
      case 'resolved': return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-medium uppercase tracking-widest text-[9px]">Resolved</Badge>;
      default: return null;
    }
  };

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen animate-in fade-in duration-700">
      <header className="flex justify-between items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-black font-medium">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs uppercase tracking-[0.2em]">Support Portal</span>
          </div>
          <h1 className="text-4xl font-medium text-gray-900 tracking-tight">My Grievances</h1>
          <p className="text-gray-500 font-normal">Track your submitted complaints and official resolutions.</p>
        </div>

        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-black hover:bg-gray-900 text-[#fffe01] shadow-lg px-8 h-14 font-medium uppercase tracking-widest text-[11px] gap-3 transition-all hover:-translate-y-1">
              <Plus className="w-5 h-5" />
              File New Complaint
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border border-gray-200 shadow-xl p-0 overflow-hidden bg-white sm:max-w-lg">
            <DialogHeader className="p-10 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3 text-black mb-2">
                 <MessageSquare className="w-6 h-6" />
                 <DialogTitle className="text-2xl font-medium uppercase tracking-tight">Submit Complaint</DialogTitle>
              </div>
              <DialogDescription className="text-gray-500 font-normal">Your feedback helps us maintain a professional environment.</DialogDescription>
            </DialogHeader>
            <div className="p-10 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">Subject</Label>
                    <Input 
                      placeholder="e.g., Salary discrepancy, Attendance error..." 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="rounded-2xl border border-gray-200 focus:border-black bg-gray-50/50 h-14 font-normal transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">Detailed Description</Label>
                    <Textarea 
                      placeholder="Explain the issue in detail..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[150px] rounded-2xl border border-gray-200 focus:border-black bg-gray-50/50 p-6 font-normal transition-all"
                    />
                  </div>
               </div>
               <DialogFooter className="pt-4 gap-4 sm:justify-between">
                  <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="rounded-2xl font-medium uppercase text-[10px] tracking-widest h-14 flex-1">Cancel</Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!subject || !description || loading}
                    className="rounded-2xl bg-black hover:bg-gray-900 text-[#fffe01] font-medium uppercase text-[10px] tracking-widest h-14 flex-1 shadow-lg"
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
          <div className="flex flex-col items-center justify-center p-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-medium text-gray-400 tracking-tight uppercase">No Grievances Filed</h3>
            <p className="text-gray-300 font-normal">You haven't submitted any complaints yet.</p>
          </div>
        ) : (
          <>
            {complaints.map((c) => (
            <Card key={c._id} className="rounded-2xl border border-gray-200 shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-500">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start gap-4">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         {getStatusBadge(c.status)}
                         <span className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">
                           {format(new Date(c.createdAt), 'MMM dd, yyyy')}
                         </span>
                      </div>
                      <h3 className="text-2xl font-medium text-gray-900 tracking-tight">{c.subject}</h3>
                   </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                   <p className="text-gray-600 font-normal leading-relaxed">"{c.description}"</p>
                </div>

                {c.adminResponse ? (
                  <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                       <ShieldCheck className="w-12 h-12 text-black" />
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-[#fffe01] shrink-0 shadow-lg">
                          <AlertCircle className="w-6 h-6" />
                       </div>
                       <div className="space-y-2">
                          <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Official Resolution</span>
                          <p className="text-gray-900 font-normal leading-relaxed">{c.adminResponse}</p>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-3 px-6 bg-amber-50 rounded-2xl border border-amber-100 inline-flex">
                     <Clock className="w-4 h-4 text-amber-500" />
                     <span className="text-xs font-medium text-amber-600 uppercase tracking-widest">Monitoring by Admin</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
          <div className="flex justify-center pt-8">
            <PaginationControl pagination={pagination} onPageChange={handlePageChange} />
          </div>
        </>
        )}
      </div>
    </div>
  );
};

export default EmployeeComplaints;

