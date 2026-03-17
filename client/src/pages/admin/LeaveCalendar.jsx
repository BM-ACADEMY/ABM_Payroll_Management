import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import axios from 'axios';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";


const LeaveCalendar = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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

  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Are you sure you want to remove this company leave? Attendance records will be reverted.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/company-leaves/${id}`, {
        headers: { 'x-auth-token': token }
      });
      toast({
        title: "Success",
        description: "Company leave removed",
      });
      fetchLeaves();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete leave",
      });
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Company Leave Calendar</h1>
          <p className="text-slate-600 font-medium">Manage holidays and company-wide leave days with precision</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Leave Form */}
        <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50 h-fit sticky top-28 rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-xl flex items-center gap-2 text-slate-900 font-bold">
              <Plus className="w-5 h-5 text-indigo-600" />
              Add Company Leave
            </CardTitle>
            <CardDescription className="text-slate-600 font-medium">Mark a day as leave for all employees</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddLeave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-700 font-bold text-sm ml-1 uppercase tracking-wider">Target Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="bg-white border-2 border-slate-100 h-12 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 text-slate-900 font-semibold transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-slate-700 font-bold text-sm ml-1 uppercase tracking-wider">Leave Description</Label>
                <Input
                  id="reason"
                  placeholder="e.g. Holi, Diwali, Annual Trip"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  className="bg-white border-2 border-slate-100 h-12 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 text-slate-900 font-semibold transition-all placeholder:text-slate-400"
                />
              </div>
              <Button 
                type="submit" 
                disabled={adding}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-7 rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {adding ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CalendarIcon className="w-5 h-5 mr-2" />}
                ADD TO CALENDAR
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Leaves List */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden min-h-[400px]">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <CardTitle className="text-xl text-slate-900 font-bold">Active & Upcoming Leaves</CardTitle>
            <CardDescription className="text-slate-600 font-medium font-serif italic">Complete history of company-marked leave days</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-80 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-600" />
                <p className="font-bold uppercase tracking-[0.2em] text-xs">Fetching records...</p>
              </div>
            ) : leaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-slate-300 p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                  <CalendarIcon className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-slate-900 font-black text-xl mb-2">The calendar is empty</h3>
                <p className="text-slate-500 font-medium max-w-[280px]">No company-wide leaves have been marked yet. Add one to see it here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-slate-100">
                      <TableHead className="text-slate-900 font-black text-xs uppercase tracking-widest px-8 py-5">Date</TableHead>
                      <TableHead className="text-slate-900 font-black text-xs uppercase tracking-widest">Reason / Occasion</TableHead>
                      <TableHead className="text-right text-slate-900 font-black text-xs uppercase tracking-widest px-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map((leave) => (
                      <TableRow key={leave._id} className="border-slate-50 hover:bg-indigo-50/30 transition-all group">
                        <TableCell className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-lg tracking-tight">{leave.date}</span>
                              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Scheduled Day</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <span className="text-slate-700 font-semibold">{leave.reason}</span>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteLeave(leave._id)}
                            className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-full h-12 w-12 transition-all group-hover:scale-110 active:scale-95"
                          >
                            <Trash2 className="w-5 h-5" />
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
  );
};

export default LeaveCalendar;

