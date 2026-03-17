import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Clock, Briefcase, IndianRupee, FileText, LayoutDashboard, Users, UserCheck, CreditCard, Settings, Calendar } from "lucide-react";

import axios from 'axios';

const EmployeeDashboard = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchLogs();
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      // Handle both { name: ... } and name as string if applicable
      const displayName = typeof user === 'string' ? user : (user.name || 'Employee');
      setUserName(displayName.split(' ')[0]);
    }
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/logs`, {
        headers: { 'x-auth-token': token }
      });
      setAttendanceLogs(res.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col space-y-3">
        <div className="flex items-center gap-3">
           <div className="h-10 w-2 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"></div>
           <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 drop-shadow-sm">
             Welcome back, <span className="text-indigo-600">{userName || 'Employee'}</span>
           </h1>
        </div>
        <p className="text-slate-600 text-lg font-medium max-w-2xl leading-relaxed">
          Here is your <span className="text-slate-900 font-bold underline decoration-indigo-500 decoration-4 underline-offset-4">professional performance summary</span> for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card className="bg-white border-slate-200 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 ring-1 ring-slate-200">
          <CardHeader className="pb-4 bg-slate-50/50">
            <CardTitle className="text-xl flex items-center gap-2 text-slate-900 font-bold">
              <Clock className="w-6 h-6 text-indigo-600" />
              This Month's Summary
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">Quick glance at your performance</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-1">
                <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Present Days</div>
                <div className="text-2xl font-black text-indigo-900">{attendanceLogs.length}</div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-1">
                <div className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Avg. Login</div>
                <div className="text-2xl font-black text-amber-900">09:30</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 space-y-1 shadow-lg shadow-emerald-200/50 block group hover:scale-[1.02] transition-transform duration-300">
              <div className="flex items-center gap-2 text-xs text-white/90 font-bold uppercase tracking-widest">
                <IndianRupee className="w-4 h-4" />
                Est. Monthly Pay
              </div>
              <div className="text-4xl font-black text-white tracking-tighter">₹{(attendanceLogs.length * 666.66).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              <p className="text-[10px] text-emerald-100 font-medium opacity-80">Accumulated for current active session</p>
            </div>
          </CardContent>
        </Card>
        {/* Attendance Logs */}
        <Card className="md:col-span-2 bg-white border-2 border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.06)] rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-3 text-slate-900 font-black">
                <Briefcase className="w-7 h-7 text-indigo-600" />
                Work Activity History
              </CardTitle>
              <CardDescription className="text-slate-600 font-bold italic">Your recent professional journey logged in real-time</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-black rounded-full px-6 transition-all">
              FULL ANALYSIS
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] pl-10 h-14">Protocol Date</TableHead>
                  <TableHead className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em]">Env. Mode</TableHead>
                  <TableHead className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] text-center">Session Interval</TableHead>
                  <TableHead className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] text-right pr-10">Compliance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                     <TableCell colSpan={4} className="text-center py-20">
                        <div className="flex flex-col items-center gap-4">
                           <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                           <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Downloading Secure Logs...</span>
                        </div>
                     </TableCell>
                  </TableRow>
                ) : attendanceLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-slate-400 font-bold italic tracking-wide">No activity signatures detected in this period.</TableCell>
                  </TableRow>
                ) : (
                  attendanceLogs.map((log, i) => (
                    <TableRow key={i} className="border-slate-50 hover:bg-indigo-50/30 transition-all group">
                      <TableCell className="font-black text-slate-900 pl-10 py-6 tracking-tight text-base">{log.date}</TableCell>
                      <TableCell>
                        {log.isHoliday ? (
                          <Badge variant="outline" className="font-black text-[9px] bg-indigo-50 text-indigo-700 border-indigo-200 uppercase px-3 py-1 rounded-lg shadow-sm">Official Holiday</Badge>
                        ) : (
                          <Badge variant="secondary" className={`font-black text-[9px] uppercase px-3 py-1 rounded-lg ${log.checkIn?.mode === 'WFH' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                            {log.checkIn?.mode || 'N/A'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.isHoliday ? (
                          <span className="text-slate-400 text-xs font-black uppercase tracking-widest italic opacity-50">Reserved Day</span>
                        ) : (
                          <div className="flex items-center justify-center gap-3 text-slate-900 font-black text-sm tracking-tighter">
                            <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{log.checkIn?.time || '--:--'}</span>
                            <span className="text-slate-200 font-light">→</span>
                            <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">{log.checkOut?.time || '--:--'}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        {log.isHoliday ? (
                           <Badge className="font-black text-[9px] uppercase shadow-md bg-indigo-600 text-white border-0 px-4" variant="outline">On Leave</Badge>
                        ) : (
                          <Badge className={`font-black text-[9px] uppercase shadow-sm border px-3 ${log.status?.includes('late') ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`} variant="outline">
                            {log.status === 'Present' ? 'Full Validation' : (log.status || 'Marked')}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access / Requests */}
      <Card className="bg-white border-2 border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.06)] rounded-[2.5rem] overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-center justify-between p-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 gap-6">
          <div className="space-y-1 text-center md:text-left">
            <CardTitle className="text-2xl flex items-center justify-center md:justify-start gap-3 text-slate-900 font-black">
              <FileText className="w-7 h-7 text-indigo-600" />
              Benefit Protocols
            </CardTitle>
            <CardDescription className="text-slate-600 font-bold italic">Application gateway for leaves and special permissions</CardDescription>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-200 px-10 py-7 rounded-2xl transition-all hover:scale-[1.05] active:scale-95">
            NEW APPLICATION
          </Button>
        </CardHeader>
        <CardContent className="py-20 flex flex-col items-center justify-center bg-slate-50/20">
          <div className="w-20 h-20 rounded-full bg-white shadow-inner flex items-center justify-center mb-6">
             <FileText className="w-10 h-10 text-slate-200" />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">No active applications found.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
