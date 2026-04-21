import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Plus, Trash2, Search } from "lucide-react";
import axios from 'axios';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Loader from "@/components/ui/Loader";


const LeaveCalendar = () => {
   const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    const filtered = leaves.filter(leave => 
      leave.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.date.includes(searchTerm)
    );
    setFilteredLeaves(filtered);
  }, [searchTerm, leaves]);

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

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8 pb-32 transition-all duration-500">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
             <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Organization Calendar</h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium ml-4">
             Manage company-wide holidays and organizational leaves
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative group w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search holidays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-white border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-100 transition-all"
              />
           </div>
           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200 shadow-sm">
              <CalendarIcon className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Registry_Arch</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Add Leave Form */}
        <div className="lg:col-span-4">
          <Card className="border-zinc-200 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-zinc-100 bg-zinc-50/50">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-white text-zinc-900 border border-zinc-200 rounded-lg shadow-sm">
                    <Plus className="w-4 h-4" />
                 </div>
                 <div>
                    <CardTitle className="text-base font-semibold text-zinc-900">Add Holiday</CardTitle>
                    <CardDescription className="text-zinc-400 font-medium text-[10px] uppercase tracking-wider">
                       Create new organizational block
                    </CardDescription>
                 </div>
               </div>
            </CardHeader>
            <CardContent className="p-6 pt-8">
              <form onSubmit={handleAddLeave} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Date Selection</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="rounded-xl border-zinc-200 bg-zinc-50 h-11 px-4 text-sm font-medium focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Event Name / Reason</Label>
                   <Input
                     placeholder="e.g. New Year Holiday"
                     value={formData.reason}
                     onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                     required
                     className="rounded-xl border-zinc-200 bg-zinc-50 h-11 px-4 text-sm font-medium focus:bg-white transition-all shadow-sm"
                   />
                </div>

                <Button
                  type="submit"
                  disabled={adding}
                  className="w-full h-11 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-sm"
                >
                  {adding ? (
                    <div className="flex items-center gap-2">
                      <Loader size="sm" color="zinc-400" />
                      <span>Syncing...</span>
                    </div>
                  ) : (
                    'Add to Calendar'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Leaves List */}
        <div className="lg:col-span-8">
          <Card className="border-zinc-200 shadow-sm rounded-2xl bg-white overflow-hidden min-h-[600px] flex flex-col">
            <CardHeader className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white text-zinc-600 rounded-lg border border-zinc-200 shadow-sm">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                   <CardTitle className="text-base font-semibold text-zinc-900">Registry History</CardTitle>
                   <CardDescription className="text-zinc-400 font-medium text-[10px] uppercase tracking-wider">Scheduled organizational blocks</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 py-1 px-3 bg-white rounded-lg border border-zinc-200 shadow-inner">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-[9px] font-bold text-zinc-600 tracking-wider uppercase">Live Feed</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                  <Loader size="lg" color="zinc-900" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Syncing Registry...</span>
                </div>
              ) : leaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto border border-zinc-100">
                    <CalendarIcon className="w-8 h-8 text-zinc-200" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">No holidays found</h4>
                    <p className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider max-w-sm mx-auto leading-relaxed">
                      Your organization currently has no scheduled blocks.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-zinc-50/50">
                      <TableRow className="border-zinc-100">
                        <TableHead className="text-zinc-400 font-semibold text-[10px] uppercase tracking-widest px-8 py-4">Status / Date</TableHead>
                        <TableHead className="text-zinc-400 font-semibold text-[10px] uppercase tracking-widest">Reason / Event</TableHead>
                        <TableHead className="text-right text-zinc-400 font-semibold text-[10px] uppercase tracking-widest px-8">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                     <TableBody>
                      {filteredLeaves.map((leave) => (
                        <TableRow key={leave._id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors group">
                          <TableCell className="px-8 py-5 w-64">
                             <div className="flex items-center gap-4">
                               <div className="w-9 h-9 bg-white text-zinc-600 rounded-lg flex items-center justify-center border border-zinc-200 transition-transform group-hover:scale-105 shadow-sm">
                                  <CalendarIcon className="w-4 h-4" />
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-semibold text-zinc-900 text-sm text-[#d30614]">{leave.date}</span>
                                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Scheduled Holiday</span>
                               </div>
                             </div>
                          </TableCell>
                          <TableCell>
                             <p className="text-zinc-600 text-sm font-medium italic">"{leave.reason}"</p>
                          </TableCell>
                          <TableCell className="text-right px-8">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setSelectedLeaveToDelete(leave._id)}
                              className="text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg h-9 w-9 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-100"
                            >
                              <Trash2 className="w-4 h-4" />
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
        title="Confirm Removal"
        description="Are you sure you want to remove this organizational block? This action will restore standard attendance tracking for this date."
      />
    </div>
  );
};

export default LeaveCalendar;
