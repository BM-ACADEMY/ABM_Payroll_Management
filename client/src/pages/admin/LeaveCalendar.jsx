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
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 bg-background min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-2 bg-[#fffe01] rounded-full"></div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-gray-900">
              Leave <span className="text-[#d30614]">Calendar</span>
            </h1>
          </div>
          <p className="text-gray-500 text-lg font-normal">Manage and track <span className="text-[#d30614] font-medium">employee availability</span> across the organization.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Leave Form */}
        <Card className="bg-white border border-gray-200 shadow-sm h-fit sticky top-28 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-xl flex items-center gap-2 text-gray-900 font-medium">
              <Plus className="w-5 h-5 text-black" />
              Add Company Leave
            </CardTitle>
            <CardDescription className="text-gray-500 font-normal">Mark a day as leave for all employees</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddLeave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-gray-600 font-medium text-sm ml-1 uppercase tracking-wider">Target Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="bg-gray-50 border border-gray-200 h-12 rounded-xl focus:border-black focus:ring-1 focus:ring-black text-gray-900 font-normal transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-gray-600 font-medium text-sm ml-1 uppercase tracking-wider">Leave Description</Label>
                <Input
                  id="reason"
                  placeholder="e.g. Holi, Diwali, Annual Trip"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  className="bg-gray-50 border border-gray-200 h-12 rounded-xl focus:border-black focus:ring-1 focus:ring-black text-gray-900 font-normal transition-all placeholder:text-gray-300"
                />
              </div>
              <Button 
                type="submit" 
                disabled={adding}
                className="w-full bg-[#fffe01] hover:bg-yellow-400 text-black font-medium py-7 rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {adding ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CalendarIcon className="w-5 h-5 mr-2" />}
                ADD TO CALENDAR
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Leaves List */}
        <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden min-h-[400px]">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-xl text-gray-900 font-medium">Active & Upcoming Leaves</CardTitle>
            <CardDescription className="text-gray-500 font-normal">Complete history of company-marked leave days</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-black" />
                <p className="font-normal uppercase tracking-[0.2em] text-xs">Fetching records...</p>
              </div>
            ) : leaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-gray-400 p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                  <CalendarIcon className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-medium text-xl mb-2">The calendar is empty</h3>
                <p className="text-gray-500 font-normal max-w-[280px]">No company-wide leaves have been marked yet. Add one to see it here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                  <TableRow className="border-gray-100">
                    <TableHead className="text-gray-500 font-medium text-xs uppercase tracking-widest px-8 py-5">Date</TableHead>
                    <TableHead className="text-gray-500 font-medium text-xs uppercase tracking-widest">Reason / Occasion</TableHead>
                    <TableHead className="text-right text-gray-500 font-medium text-xs uppercase tracking-widest px-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {leaves.map((leave) => (
                      <TableRow key={leave._id} className="border-gray-100 hover:bg-gray-50/60 transition-all group">
                        <TableCell className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="font-normal text-gray-900 text-lg tracking-tight">{leave.date}</span>
                              <span className="text-[10px] text-black font-medium uppercase tracking-wider">Scheduled Day</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <span className="text-gray-600 font-normal">{leave.reason}</span>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteLeave(leave._id)}
                            className="text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-full h-12 w-12 transition-all group-hover:scale-110 active:scale-95"
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

