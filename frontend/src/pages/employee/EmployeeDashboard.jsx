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
    <div className="p-8 space-y-8">
      <header className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">Welcome back, John</h1>
        <p className="text-slate-400">Here's your attendance overview for March 2026</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Actions */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-indigo-400" />
              Daily Actions
            </CardTitle>
            <CardDescription className="text-slate-400">Manage your daily attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-200">Working Mode</Label>
              <Select value={workingMode} onValueChange={setWorkingMode}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="WFO">Office (WFO)</SelectItem>
                  <SelectItem value="WFH">Home (WFH)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCheckIn}
              disabled={checkedIn}
              className={`w-full py-6 text-lg font-semibold transition-all duration-300 ${
                checkedIn ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {checkedIn ? '✓ Checked In' : 'Check In Now'}
            </Button>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/50 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <IndianRupee className="w-4 h-4" />
                Earnings (Est.)
              </div>
              <div className="text-3xl font-bold text-emerald-400">₹18,333.15</div>
              <p className="text-xs text-slate-500">Based on 27.5 present days</p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Logs */}
        <Card className="md:col-span-2 bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2 text-white">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                Attendance Logs
              </CardTitle>
              <CardDescription className="text-slate-400">Your recent activity logs</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-white bg-transparent">View All</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400">Mode</TableHead>
                  <TableHead className="text-slate-400">Log In</TableHead>
                  <TableHead className="text-slate-400">Log Out</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceLogs.map((log, i) => (
                  <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell className="font-medium text-slate-200">{log.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700">
                        {log.mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{log.checkIn}</TableCell>
                    <TableCell className="text-slate-300">{log.checkOut}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${log.status.includes('late') ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {log.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Requests */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-indigo-400" />
              My Requests
            </CardTitle>
            <CardDescription className="text-slate-400">Leave and permission applications</CardDescription>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">New Request</Button>
        </CardHeader>
        <CardContent className="h-40 flex flex-col items-center justify-center border-t border-slate-800">
          <FileText className="w-8 h-8 mb-4 text-slate-700" />
          <p className="text-slate-500">No pending requests found.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
