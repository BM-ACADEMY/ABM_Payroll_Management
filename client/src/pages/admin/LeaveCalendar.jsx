import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import axios from 'axios';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Loader from "@/components/ui/Loader";


const LeaveCalendar = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedLeaveToDelete, setSelectedLeaveToDelete] = useState(null);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    type: 'holiday'
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/company-leaves`, {
        headers: { 'x-auth-token': token }
      });
      setLeaves(res.data);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch leaves",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/company-leaves`, formData, {
        headers: { 'x-auth-token': token }
      });
      setFormData({ ...formData, reason: '' });
      toast({
        title: "Success",
        description: "Company leave added successfully",
      });
      fetchLeaves();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Failed to add leave",
      });
    } finally {
      setAdding(false);
    }
  };

  const confirmRemoveLeave = async () => {
    if (!selectedLeaveToDelete) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/company-leaves/${selectedLeaveToDelete}`, {
        headers: { 'x-auth-token': token }
      });
      toast({
        title: "Success",
        description: "Company leave removed",
      });
      fetchLeaves();
      setSelectedLeaveToDelete(null);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete leave",
      });
    }
  };

    <div className="min-h-screen bg-[#fdfdfd] p-4 md:p-8 lg:p-12 space-y-12 animate-in fade-in duration-1000 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-10 md:h-14 w-2.5 bg-[#d30614] rounded-full shadow-lg shadow-red-100"></div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-zinc-900 uppercase leading-[0.9]">
              Temporal <span className="text-[#d30614] tracking-tight">Mapping</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl leading-relaxed ml-2">
            Strategic <span className="text-zinc-900 font-black">Availability Management</span> & Organizational Leave Registry.
          </p>
        </div>

        <div className="flex items-center gap-6 bg-white p-3 rounded-[2.5rem] border border-zinc-100 shadow-xl pr-10">
           <div className="p-5 bg-zinc-900 text-[#fffe01] rounded-2xl shadow-xl">
              <CalendarIcon className="w-8 h-8" />
           </div>
           <div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-1 block">ACTIVE_QUOTA</span>
              <span className="text-xl font-black text-zinc-900 uppercase tracking-tight">Leave_Archive</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Add Leave Form */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-3xl shadow-zinc-200/50 rounded-[3.5rem] bg-zinc-900 text-[#fffe01] overflow-hidden group">
            <CardHeader className="p-10 md:p-14 pb-4 border-b border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
                  <Plus className="w-32 h-32" />
               </div>
               <div className="space-y-4 relative z-10">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/10 rounded-xl">
                      <Plus className="w-6 h-6 text-[#fffe01]" />
                   </div>
                   <CardTitle className="text-2xl font-black uppercase tracking-tighter">Initialize Block</CardTitle>
                 </div>
                 <CardDescription className="text-zinc-500 font-bold text-[11px] uppercase tracking-widest leading-relaxed">
                   Synchronize company-wide leave sequences with the <span className="text-white">Central Ledger</span>.
                 </CardDescription>
               </div>
            </CardHeader>
            <CardContent className="p-10 md:p-14 pt-10">
              <form onSubmit={handleAddLeave} className="space-y-12">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.4em] ml-2 text-zinc-500 flex items-center gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#d30614]"></div>
                     TARGET_EPOCH
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="rounded-[1.75rem] border-none bg-white/5 text-[#fffe01] h-16 font-black text-xs uppercase px-8 focus:bg-white/10 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-[0.4em] ml-2 text-zinc-500 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#fffe01]/50 shadow-[0_0_10px_rgba(255,254,1,0.5)]"></div>
                      RATIONALIZATION_LOG
                   </Label>
                   <Input
                     placeholder="ENCODE RATIONALE..."
                     value={formData.reason}
                     onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                     required
                     className="rounded-[1.75rem] border-none bg-white/5 text-[#fffe01] placeholder:text-zinc-800 h-16 font-black text-xs uppercase px-8 focus:bg-white/10 transition-all shadow-inner"
                   />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={adding}
                    className="w-full h-20 bg-[#fffe01] hover:bg-[#d30614] text-black hover:text-white font-black text-[11px] uppercase tracking-[0.5em] rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(255,254,1,0.2)] transition-all hover:-translate-y-2 active:scale-95 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity"></div>
                    {adding ? (
                      <div className="flex items-center gap-4">
                        <Loader size="sm" color="black" />
                        <span>SYNCHRONIZING...</span>
                      </div>
                    ) : (
                      'TRANSMIT_RECORD'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Leaves List */}
        <div className="lg:col-span-8 flex flex-col">
          <Card className="border-none shadow-3xl shadow-zinc-200/50 rounded-[3.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col">
            <CardHeader className="p-10 md:p-14 border-b border-zinc-50 bg-[#f8f8f8]/50 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-900 text-[#fffe01] rounded-xl shadow-xl">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Legacy_Stream</CardTitle>
                </div>
                <CardDescription className="text-zinc-400 font-bold text-[11px] uppercase tracking-[0.2em] ml-2">Active and upcoming organizational blocks.</CardDescription>
              </div>
              <div className="flex items-center gap-4 py-3 px-8 bg-white rounded-full border border-zinc-100 shadow-xl">
                 <div className="w-2.5 h-2.5 rounded-full bg-[#d30614] animate-pulse"></div>
                 <span className="text-[10px] font-black text-zinc-900 tracking-[0.3em] uppercase">Registry_Live</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-40 gap-8">
                  <Loader size="lg" color="red" />
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em] animate-pulse">Syncing_Records...</span>
                </div>
              ) : leaves.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-10 group">
                  <div className="w-40 h-40 bg-zinc-50 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 animate-in zoom-in-50 duration-1000">
                    <div className="w-28 h-28 bg-white rounded-[2rem] shadow-xl flex items-center justify-center">
                       <CalendarIcon className="w-12 h-12 text-zinc-200" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter">NULL_SIGNALS</h4>
                    <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                      No company-wide leave sequences detected in the current <span className="text-zinc-900">operational window</span>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#fafafa]">
                      <TableRow className="border-zinc-50">
                        <TableHead className="text-zinc-400 font-black text-[10px] uppercase tracking-[0.3em] px-14 py-10">EPOCH_SIGNAL</TableHead>
                        <TableHead className="text-zinc-400 font-black text-[10px] uppercase tracking-[0.3em]">RATIONALE_SEQUENCE</TableHead>
                        <TableHead className="text-right text-zinc-400 font-black text-[10px] uppercase tracking-[0.3em] px-14">REGISTRY_OPS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.map((leave) => (
                        <TableRow key={leave._id} className="border-zinc-50 hover:bg-zinc-50/50 transition-all duration-700 group">
                          <TableCell className="px-14 py-12">
                             <div className="flex items-center gap-6">
                               <div className="w-14 h-14 bg-zinc-900 text-[#fffe01] rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                                  <CalendarIcon className="w-6 h-6" />
                               </div>
                               <div className="flex flex-col gap-1">
                                  <span className="font-black text-zinc-900 text-2xl tracking-tighter uppercase font-mono">{leave.date}</span>
                                  <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-[#d30614]"></div>
                                     SCHEDULED_DAY
                                  </span>
                               </div>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="bg-white border border-zinc-100 p-6 rounded-[2rem] shadow-sm group-hover:shadow-xl transition-all duration-700 max-w-md">
                                <span className="text-zinc-600 font-bold text-base leading-relaxed italic pr-4">"{leave.reason}"</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right px-14">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setSelectedLeaveToDelete(leave._id)}
                              className="text-zinc-100 hover:text-[#d30614] hover:bg-rose-50 rounded-2xl h-16 w-16 transition-all group-hover:scale-110 active:scale-95 shadow-md hover:shadow-xl"
                            >
                              <Trash2 className="w-6 h-6" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!selectedLeaveToDelete}
        onClose={() => setSelectedLeaveToDelete(null)}
        onConfirm={confirmRemoveLeave}
        title="PURGE_LEAVE_RECORD"
        description="ARE YOU ABSOLUTELY CERTAIN? REMOVING THIS TEMPORAL BLOCK WILL RE-SYNCHRONIZE ALL EMPLOYEE ATTENDANCE RECORDS FOR THIS EPOCH TO STANDARD OPERATIONAL PARAMETERS."
      />
    </div>
  );
};

export default LeaveCalendar;
