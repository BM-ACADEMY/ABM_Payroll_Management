import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Clock, Briefcase, IndianRupee, FileText } from "lucide-react";

const EmployeeDashboard = () => {
  const [attendanceLogs] = useState([
    { date: '2026-03-12', checkIn: '09:15', checkOut: '18:15', status: 'on-time', mode: 'WFO', lunchOut: '13:00', lunchIn: '14:00' },
    { date: '2026-03-11', checkIn: '09:46', checkOut: '18:30', status: 'late (16m)', mode: 'WFH', lunchOut: '13:30', lunchIn: '14:15' }
  ]);

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col space-y-2 text-center md:text-left transition-all duration-300">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Welcome back, John</h1>
        <p className="text-slate-500 text-lg">Here is your professional overview for March 2026</p>
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
        <Card className="md:col-span-2 bg-white border-slate-200 shadow-xl overflow-hidden ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/50 border-b border-slate-100">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2 text-slate-900 font-bold">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                Activity History
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium italic">Your recent professional journey</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 font-bold">View Full Report</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider pl-6">Date</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider">Mode</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider text-center">Work Interval</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider text-right pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceLogs.map((log, i) => (
                  <TableRow key={i} className="border-slate-100 hover:bg-slate-50 transition-colors group">
                    <TableCell className="font-bold text-slate-900 pl-6 py-4">{log.date}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`font-bold text-[10px] ${log.mode === 'WFH' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {log.mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-600 font-semibold text-sm">
                        <span className="text-indigo-600">{log.checkIn}</span>
                        <span className="text-slate-300 font-light">→</span>
                        <span className="text-rose-600">{log.checkOut}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge className={`font-black text-[10px] uppercase shadow-sm ${log.status.includes('late') ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`} variant="outline">
                        {log.status === 'Present' ? 'Full Day' : log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>

      {/* Quick Access / Requests */ }
  <Card className="bg-white border-slate-200 shadow-xl overflow-hidden ring-1 ring-slate-200">
    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
      <div className="space-y-1">
        <CardTitle className="text-xl flex items-center gap-2 text-slate-900 font-bold">
          <FileText className="w-5 h-5 text-indigo-600" />
          Benefit Requests
        </CardTitle>
        <CardDescription className="text-slate-500 font-medium italic">Apply for leaves or permissions</CardDescription>
      </div>
      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-indigo-100 shadow-lg px-6">New Application</Button>
    </CardHeader>
    <CardContent className="h-32 flex flex-col items-center justify-center bg-slate-50/30">
      <FileText className="w-10 h-10 mb-2 text-slate-200" />
      <p className="text-slate-400 font-semibold italic">No active requests found.</p>
    </CardContent>
  </Card>
    </div >
  );
};

export default EmployeeDashboard;
