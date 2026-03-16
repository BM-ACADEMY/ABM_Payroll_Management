import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Clock, Briefcase, IndianRupee, FileText } from "lucide-react";

const EmployeeDashboard = () => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [workingMode, setWorkingMode] = useState('WFO');
  const [attendanceLogs] = useState([
    { date: '2026-03-12', checkIn: '09:15', checkOut: '18:15', status: 'on-time', mode: 'WFO' },
    { date: '2026-03-11', checkIn: '09:46', checkOut: '18:30', status: 'late (16m)', mode: 'WFH' }
  ]);

  const handleCheckIn = () => setCheckedIn(true);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Welcome back, John</h1>
        <p className="text-slate-500">Here's your attendance overview for March 2026</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Actions */}
        <Card className="bg-white border-slate-200 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-slate-900">
              <Clock className="w-5 h-5 text-indigo-600" />
              Daily Actions
            </CardTitle>
            <CardDescription className="text-slate-500">Manage your daily attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-700">Working Mode</Label>
              <Select value={workingMode} onValueChange={setWorkingMode}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="WFO">Office (WFO)</SelectItem>
                  <SelectItem value="WFH">Home (WFH)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCheckIn}
              disabled={checkedIn}
              className={`w-full py-6 text-lg font-semibold transition-all duration-300 ${
                checkedIn ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {checkedIn ? '✓ Checked In' : 'Check In Now'}
            </Button>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <IndianRupee className="w-4 h-4" />
                Earnings (Est.)
              </div>
              <div className="text-2xl md:text-3xl font-bold text-emerald-600">₹18,333.15</div>
              <p className="text-xs text-slate-500">Based on 27.5 present days</p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Logs */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2 text-slate-900">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                Attendance Logs
              </CardTitle>
              <CardDescription className="text-slate-500">Your recent activity logs</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 w-full sm:w-auto">View All</Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-500 font-medium whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-slate-500 font-medium whitespace-nowrap">Mode</TableHead>
                    <TableHead className="text-slate-500 font-medium whitespace-nowrap">Log In</TableHead>
                    <TableHead className="text-slate-500 font-medium whitespace-nowrap">Log Out</TableHead>
                    <TableHead className="text-slate-500 font-medium whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceLogs.map((log, i) => (
                    <TableRow key={i} className="border-slate-100 hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-900 whitespace-nowrap">{log.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 shadow-none">
                          {log.mode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-700 whitespace-nowrap">{log.checkIn}</TableCell>
                      <TableCell className="text-slate-700 whitespace-nowrap">{log.checkOut}</TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium whitespace-nowrap ${log.status.includes('late') ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {log.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2 text-slate-900">
              <FileText className="w-5 h-5 text-indigo-600" />
              My Requests
            </CardTitle>
            <CardDescription className="text-slate-500">Leave and permission applications</CardDescription>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm w-full sm:w-auto">New Request</Button>
        </CardHeader>
        <CardContent className="h-40 flex flex-col items-center justify-center border-t border-slate-100">
          <FileText className="w-8 h-8 mb-4 text-slate-200" />
          <p className="text-slate-500 font-medium">No pending requests found.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
