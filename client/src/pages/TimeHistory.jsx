import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Search, Calendar, Timer, History, Filter, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from 'date-fns';

const TimeHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adminNameSearch, setAdminNameSearch] = useState('');
  const [userRole, setUserRole] = useState(sessionStorage.getItem('userRole'));
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const endpoint = userRole === 'admin' ? '/api/time-logs/all' : '/api/time-logs/user';
      
      let params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (userRole === 'admin' && adminNameSearch) params.name = adminNameSearch;

      const res = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        headers: { 'x-auth-token': token },
        params
      });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch time logs",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [userRole, startDate, endDate, adminNameSearch]);

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatLogTime = (dateString) => {
    return format(new Date(dateString), 'hh:mm a');
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.taskName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  const groupedLogs = useMemo(() => {
    const groups = {};
    filteredLogs.forEach(log => {
      const dateKey = format(new Date(log.startTime), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(log.startTime),
          items: [],
          totalDuration: 0
        };
      }
      groups[dateKey].items.push(log);
      groups[dateKey].totalDuration += (log.duration || 0);
    });

    // Convert to array and sort by date descending
    return Object.values(groups).sort((a, b) => b.date - a.date);
  }, [filteredLogs]);

  return (
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-700 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-[#fffe01] rounded-full"></div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Time Tracker <span className="text-zinc-400">History</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm md:text-base font-normal">
            {userRole === 'admin' ? 'Monitor all employee task durations and activities' : 'Track your personal task history and productivity'}
          </p>
        </div>
      </header>

      <Card className="bg-white border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-zinc-50/50 p-4 border-b border-gray-100 flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            {userRole === 'admin' ? 'Admin Filters' : 'History Filters'}
          </span>
        </div>
        <CardContent className="p-6">
          <div className={`grid grid-cols-1 ${userRole === 'admin' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
            {userRole === 'admin' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500">Employee Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Filter by name..." 
                    value={adminNameSearch}
                    onChange={(e) => setAdminNameSearch(e.target.value)}
                    className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:ring-[#fffe01]"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">Start Date</label>
              <Input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 bg-gray-50 border-gray-100 rounded-xl focus:ring-[#fffe01]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">End Date</label>
              <Input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 bg-gray-50 border-gray-100 rounded-xl focus:ring-[#fffe01]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-black border-zinc-800 shadow-xl overflow-hidden rounded-3xl group relative">
            <CardHeader className="pb-2">
               <CardDescription className="text-zinc-500 font-medium uppercase tracking-widest text-[10px]">Total Logs</CardDescription>
               <CardTitle className="text-4xl text-[#fffe01] font-mono tracking-tighter">{logs.length}</CardTitle>
            </CardHeader>
            <div className="absolute top-4 right-6 bg-zinc-900 p-2 rounded-xl group-hover:scale-110 transition-transform">
               <History className="w-5 h-5 text-zinc-500" />
            </div>
         </Card>
         <Card className="bg-black border-zinc-800 shadow-xl overflow-hidden rounded-3xl group relative">
            <CardHeader className="pb-2">
               <CardDescription className="text-zinc-500 font-medium uppercase tracking-widest text-[10px]">Total tracked time</CardDescription>
               <CardTitle className="text-4xl text-[#fffe01] font-mono tracking-tighter">
                 {Math.round(logs.reduce((acc, log) => acc + (log.duration || 0), 0) / 3600)}h
               </CardTitle>
            </CardHeader>
            <div className="absolute top-4 right-6 bg-zinc-900 p-2 rounded-xl group-hover:scale-110 transition-transform">
               <Timer className="w-5 h-5 text-zinc-500" />
            </div>
         </Card>
         <Card className="bg-black border-zinc-800 shadow-xl overflow-hidden rounded-3xl group relative">
            <CardHeader className="pb-2">
               <CardDescription className="text-zinc-500 font-medium uppercase tracking-widest text-[10px]">Ongoing Tasks</CardDescription>
               <CardTitle className="text-4xl text-emerald-400 font-mono tracking-tighter">
                 {logs.filter(l => l.status === 'running').length}
               </CardTitle>
            </CardHeader>
            <div className="absolute top-4 right-6 bg-zinc-900 p-2 rounded-xl group-hover:scale-110 transition-transform">
               <Clock className="w-5 h-5 text-emerald-500 animate-pulse" />
            </div>
         </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-medium italic text-gray-900">Activity Journal</h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search task..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-gray-200 pl-10 h-10 text-gray-900 focus-visible:ring-[#fffe01] shadow-sm rounded-xl" 
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#fffe01]"></div>
          </div>
        ) : groupedLogs.length === 0 ? (
          <div className="text-center py-24 bg-white border border-gray-100 rounded-3xl text-gray-400 font-medium">
             No activity logs found for this period.
          </div>
        ) : (
          <div className="space-y-10">
            {groupedLogs.map((group) => (
              <div key={group.date.toISOString()} className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                   <div className="bg-[#fffe01] text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                      {format(group.date, 'EEEE, MMM dd, yyyy')}
                   </div>
                   <div className="h-[1px] flex-1 bg-gray-100"></div>
                   <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Total: {formatDuration(group.totalDuration)}
                   </div>
                </div>

                <Card className="bg-white border-gray-200 shadow-sm overflow-hidden rounded-2xl">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-zinc-50/50">
                        <TableRow className="border-gray-100 hover:bg-transparent">
                          {userRole === 'admin' && <TableHead className="text-gray-500 font-medium px-6 text-[10px] uppercase tracking-wider">Employee</TableHead>}
                          <TableHead className="text-gray-500 font-medium px-6 text-[10px] uppercase tracking-wider">Task Details</TableHead>
                          <TableHead className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Timeline</TableHead>
                          <TableHead className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Duration</TableHead>
                          <TableHead className="text-gray-500 font-medium text-center px-6 text-[10px] uppercase tracking-wider">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((log) => (
                          <TableRow key={log._id} className="border-gray-50 hover:bg-zinc-50/50 transition-colors">
                            {userRole === 'admin' && (
                              <TableCell className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-black text-[#fffe01] flex items-center justify-center text-[10px] font-bold shadow-sm">
                                       {log.user?.name?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="font-bold text-gray-900 text-xs tracking-tight">{log.user?.name || 'Unknown'}</span>
                                       <span className="text-[9px] text-zinc-400 font-medium">{log.user?.employeeId || 'ID Pending'}</span>
                                    </div>
                                 </div>
                              </TableCell>
                            )}
                            <TableCell className="px-6 py-4">
                               <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-gray-800 text-sm tracking-tight">{log.taskName}</span>
                                  <span className="text-[10px] text-zinc-400 font-medium italic">General Task</span>
                               </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                 <div className="bg-zinc-100 px-2 py-0.5 rounded-md">{formatLogTime(log.startTime)}</div>
                                 <ChevronRight className="w-3 h-3 text-zinc-300" />
                                 <div className="bg-zinc-100 px-2 py-0.5 rounded-md">
                                    {log.endTime ? formatLogTime(log.endTime) : '---'}
                                 </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 font-mono text-sm font-black text-gray-900">
                               {log.status === 'running' ? (
                                 <div className="flex items-center gap-1.5 text-emerald-500">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                                    Tracking...
                                 </div>
                               ) : formatDuration(log.duration)}
                            </TableCell>
                            <TableCell className="text-center px-6 py-4">
                              <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter ${
                                log.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                log.status === 'running' ? 'bg-[#fffe01] text-black border-transparent shadow-sm' : 
                                'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                {log.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeHistory;
