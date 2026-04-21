import { useState, useEffect, useMemo, Fragment } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Search, Calendar, Timer, History, Filter, ChevronRight, ChevronDown, MessageSquare, Pencil, Trash2, Check, X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from 'date-fns';
import socket from '@/services/socket';
import PaginationControl from '@/components/ui/PaginationControl';
import Loader from "@/components/ui/Loader";
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

const TimeHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adminNameSearch, setAdminNameSearch] = useState('');
  const [userRole, setUserRole] = useState(sessionStorage.getItem('userRole'));
  const [userName, setUserName] = useState(sessionStorage.getItem('userName'));
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [newComments, setNewComments] = useState({});
  const { toast } = useToast();

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const url = userRole === 'admin'
        ? `${import.meta.env.VITE_API_URL}/api/time-logs/all?startDate=${startDate}&endDate=${endDate}&userName=${adminNameSearch}&taskName=${searchTerm}&page=${page}&limit=5`
        : `${import.meta.env.VITE_API_URL}/api/time-logs/user?startDate=${startDate}&endDate=${endDate}&taskName=${searchTerm}&page=${page}&limit=5`;

      const res = await axios.get(url, {
        headers: { 'x-auth-token': token }
      });
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch logs" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [startDate, endDate, adminNameSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    fetchLogs(page);
  };

  useEffect(() => {
    const handleUpdate = (updatedLog) => {
      // Find if this log exists in our current list
      setLogs(prev => {
        const exists = prev.find(l => l._id === updatedLog._id);
        if (!exists) return prev; // If not in current filtered list, ignore

        // Re-map with updated data
        return prev.map(l => l._id === updatedLog._id ? updatedLog : l);
      });
    };

    socket.on('time_log_updated', handleUpdate);
    return () => socket.off('time_log_updated');
  }, []);

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



  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const handleUpdateComment = async (id, commentId, text) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/comment/${id}/${commentId}`, { text }, {
        headers: { 'x-auth-token': token }
      });
      setLogs(prev => prev.map(log => log._id === id ? res.data : log));
      setEditingCommentId(null);
      toast({ title: "Comment Updated", description: "Changes saved" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update comment" });
    }
  };

  const handleDeleteComment = async (id, commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/time-logs/comment/${id}/${commentId}`, {
        headers: { 'x-auth-token': token }
      });
      setLogs(prev => prev.map(log => log._id === id ? res.data : log));
      toast({ title: "Comment Deleted", description: "Update removed" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete comment" });
    }
  };

  const handleAddComment = async (id, text) => {
    if (!text?.trim()) return;
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/comment/${id}`, { text }, {
        headers: { 'x-auth-token': token }
      });
      setLogs(prev => prev.map(log => log._id === id ? res.data : log));
      setNewComments(prev => ({ ...prev, [id]: '' }));
      toast({ title: "Comment Added", description: "Update sent successfully" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add comment" });
    }
  };

  const groupedLogs = useMemo(() => {
    const groups = {};
    logs.forEach(log => {
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
  }, [logs]);

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-12 animate-in fade-in duration-700 bg-background min-h-screen pb-24">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-2">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#fffe01] rounded-xl shadow-sm">
                <History className="w-5 h-5 text-black" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Activity Vectors</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900 leading-tight">
            Time Tracker <span className="text-zinc-400">History</span>
          </h1>
          <p className="text-gray-500 font-normal max-w-2xl text-sm md:text-base leading-relaxed">
            {userRole === 'admin' ? 'Strategic monitoring of global organizational operational velocity.' : 'Analytical review of personal productivity metrics and tactical execution logs.'}
          </p>
        </div>
      </header>

      <Card className="border-0 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] bg-white overflow-hidden group">
        <div className="h-2 bg-black w-1/4 group-hover:w-full transition-all duration-1000"></div>
        <div className="px-8 md:px-12 py-6 border-b border-zinc-50 flex items-center gap-4">
          <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-[#fffe01] group-hover:text-black transition-all">
            <Filter className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
            {userRole === 'admin' ? 'Operational Filters' : 'History Scope'}
          </span>
        </div>
        <CardContent className="p-8 md:p-12">
          <div className={`grid grid-cols-1 ${userRole === 'admin' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8 md:gap-12`}>
            {userRole === 'admin' && (
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Personnel Identifier</label>
                <div className="relative group/input">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within/input:text-black transition-colors" />
                  <Input
                    placeholder="Search personnel..."
                    value={adminNameSearch}
                    onChange={(e) => setAdminNameSearch(e.target.value)}
                    className="pl-14 h-16 bg-zinc-50 border-2 border-zinc-50 rounded-2xl font-bold focus:bg-white focus:border-black transition-all shadow-inner"
                  />
                </div>
              </div>
            )}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Timeline Start</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-16 bg-zinc-50 border-2 border-zinc-50 rounded-2xl font-bold focus:bg-white focus:border-black transition-all shadow-inner px-8"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Timeline End</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-16 bg-zinc-50 border-2 border-zinc-50 rounded-2xl font-bold focus:bg-white focus:border-black transition-all shadow-inner px-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tighter italic">Activity Journal</h2>
          <div className="relative group/search w-full max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within/search:text-black transition-colors" />
            <Input
              placeholder="Search tactical vector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-2 border-zinc-100 pl-14 h-14 text-zinc-900 focus-visible:ring-0 focus:border-black shadow-xl shadow-zinc-200/40 rounded-2xl font-bold"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-32 space-y-4">
            <Loader size="lg" color="red" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 animate-pulse">Synchronizing Logs...</p>
          </div>
        ) : groupedLogs.length === 0 ? (
          <div className="text-center py-32 bg-white border-2 border-dashed border-zinc-100 rounded-[3rem] shadow-inner">
             <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-zinc-200">
                <Clock className="w-10 h-10" />
             </div>
             <h3 className="text-xl font-black text-zinc-900">Registry Empty</h3>
             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">No activity vectors established for this scope.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {groupedLogs.map((group) => (
              <section key={group.date.toISOString()} className="space-y-8 animate-in slide-in-from-left duration-500">
                <div className="flex items-center gap-6 px-4">
                  <div className="bg-black text-[#fffe01] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">
                    {format(group.date, 'EEEE, MMM dd, yyyy')}
                  </div>
                  <div className="h-[2px] flex-1 bg-zinc-100 rounded-full opacity-50"></div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 px-4 py-2 rounded-full border border-zinc-100">
                    Velocity: {formatDuration(group.totalDuration)}
                  </div>
                </div>

                {/* Card view for mobile */}
                <div className="grid grid-cols-1 gap-6 lg:hidden">
                  {group.items.map((log) => (
                    <Card key={log._id} className="border-0 shadow-xl shadow-zinc-200/50 rounded-[2.5rem] bg-white overflow-hidden group">
                      <CardContent className="p-8 space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="text-xl font-black tracking-tighter text-zinc-900 group-hover:text-[#d30614] transition-colors">{log.taskName}</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">TACTICAL VECTOR</p>
                          </div>
                          <Badge variant="outline" className={`rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border-2 ${log.label === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              log.label === 'holded' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                log.label === 'qc' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                  'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                            {log.label || log.status}
                          </Badge>
                        </div>

                        {userRole === 'admin' && (
                          <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border-2 border-white shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-black text-[#fffe01] flex items-center justify-center text-xs font-black shadow-lg">
                              {log.user?.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-black text-zinc-900 leading-none mb-1">{log.user?.name || 'Unknown'}</p>
                              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{log.user?.employeeId || 'ID PENDING'}</p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-zinc-50 rounded-[1.5rem] border border-white">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Duration</p>
                            <p className="text-lg font-black tracking-tighter">
                               {log.status === 'running' ? (
                                <span className="text-emerald-500 animate-pulse">ACTIVE</span>
                               ) : formatDuration(log.duration)}
                            </p>
                          </div>
                          <div className="p-4 bg-zinc-50 rounded-[1.5rem] border border-white">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Timeline</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                               <span>{formatLogTime(log.startTime)}</span>
                               <ChevronRight className="w-3 h-3 text-zinc-300" />
                               <span>{log.endTime ? formatLogTime(log.endTime) : 'NOW'}</span>
                            </div>
                          </div>
                        </div>

                        <Button 
                          variant="ghost" 
                          onClick={() => toggleRow(log._id)}
                          className="w-full h-12 rounded-[1.5rem] border-2 border-zinc-50 hover:bg-zinc-50 hover:border-zinc-100 text-[10px] font-black uppercase tracking-widest gap-2 group/btn"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${expandedRows.has(log._id) ? 'rotate-180 text-[#d30614]' : ''}`} />
                          {expandedRows.has(log._id) ? 'Retract Logs' : 'Sync Detailed Metrics'}
                        </Button>

                        {expandedRows.has(log._id) && (
                          <div className="pt-4 space-y-8 animate-in slide-in-from-top-4 duration-500">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <Timer className="w-4 h-4 text-zinc-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Tactical Sessions</span>
                              </div>
                              <div className="space-y-3">
                                {log.activityLog?.filter(a => a.type === 'play').length > 0 ? (
                                  log.activityLog.filter(a => a.type === 'play').map((activity, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl border-2 border-emerald-50 bg-emerald-50/10 shadow-sm flex items-center justify-between group/sess">
                                      <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                        <div>
                                          <p className="text-[10px] font-black text-zinc-900 uppercase">Session {idx + 1}</p>
                                          <p className="text-[9px] font-bold text-zinc-400 uppercase">{formatLogTime(activity.startTime)} - {activity.endTime ? formatLogTime(activity.endTime) : 'ACTIVE'}</p>
                                        </div>
                                      </div>
                                      <span className="text-xs font-black text-emerald-600 font-mono">{activity.duration ? formatDuration(activity.duration) : '---'}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="py-8 text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest bg-zinc-50 rounded-[1.5rem] border-2 border-dashed border-zinc-100">Zero active captures</div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                               <div className="flex items-center gap-3">
                                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Debriefing Logs</span>
                               </div>
                               <div className="space-y-4">
                                 {log.comments?.map((comment, idx) => (
                                   <div key={idx} className="bg-zinc-50/50 p-5 rounded-2xl border-2 border-white shadow-sm space-y-3 group/comm">
                                      <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black text-[#d30614] uppercase tracking-widest">{comment.author}</p>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase">{format(new Date(comment.createdAt), 'MMM dd, hh:mm a')}</p>
                                      </div>
                                      <div className="text-xs font-bold text-zinc-700 leading-relaxed italic"><MarkdownRenderer content={comment.text} /></div>
                                   </div>
                                 ))}
                                 <div className="flex gap-3 bg-white p-3 rounded-2xl border-2 border-zinc-100 shadow-xl">
                                    <Input
                                      value={newComments[log._id] || ''}
                                      onChange={(e) => setNewComments(prev => ({ ...prev, [log._id]: e.target.value }))}
                                      placeholder="Execute comment..."
                                      className="h-12 border-none bg-zinc-50 rounded-xl text-xs font-bold focus:bg-zinc-50"
                                    />
                                    <Button
                                      size="icon"
                                      onClick={() => handleAddComment(log._id, newComments[log._id])}
                                      className="h-12 w-12 bg-black text-[#fffe01] rounded-xl hover:scale-105 transition-all shadow-xl"
                                    >
                                      <Send className="w-4 h-4" />
                                    </Button>
                                 </div>
                               </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Table view for desktop */}
                <div className="hidden lg:block bg-white border-0 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] overflow-hidden">
                    <Table>
                      <TableHeader className="bg-zinc-900 border-none">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="w-[80px] px-8"></TableHead>
                          {userRole === 'admin' && <TableHead className="text-[#fffe01]/60 font-black px-8 py-6 text-[10px] uppercase tracking-[0.2em]">Personnel</TableHead>}
                          <TableHead className="text-[#fffe01]/60 font-black px-8 py-6 text-[10px] uppercase tracking-[0.2em]">Tactical Vector</TableHead>
                          <TableHead className="text-[#fffe01]/60 font-black px-8 py-6 text-[10px] uppercase tracking-[0.2em]">Deployment Scope</TableHead>
                          <TableHead className="text-[#fffe01]/60 font-black px-8 py-6 text-[10px] uppercase tracking-[0.2em]">Velocity</TableHead>
                          <TableHead className="text-[#fffe01]/60 font-black px-8 py-6 text-[10px] uppercase tracking-[0.2em] text-center">Protocol</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((log) => (
                          <Fragment key={log._id}>
                            <TableRow
                              className={`border-zinc-50 hover:bg-zinc-50/50 transition-all cursor-pointer group ${expandedRows.has(log._id) ? 'bg-zinc-50/80 shadow-inner' : ''}`}
                              onClick={() => toggleRow(log._id)}
                            >
                              <TableCell className="px-8 py-6">
                                <div className={`p-2.5 rounded-xl transition-all duration-500 w-fit ${expandedRows.has(log._id) ? 'rotate-180 bg-[#fffe01] text-black shadow-lg scale-110' : 'bg-zinc-100 text-zinc-300 group-hover:text-black group-hover:bg-[#fffe01]'}`}>
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </TableCell>
                              {userRole === 'admin' && (
                                <TableCell className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-[#fffe01] flex items-center justify-center text-xs font-black shadow-xl ring-4 ring-white group-hover:scale-110 transition-transform">
                                      {log.user?.name?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-black text-zinc-900 text-sm tracking-tight">{log.user?.name || 'Unknown'}</span>
                                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{log.user?.employeeId || 'ID PENDING'}</span>
                                    </div>
                                  </div>
                                </TableCell>
                              )}
                              <TableCell className="px-8 py-6">
                                <div className="flex flex-col gap-1">
                                  <span className="font-black text-zinc-800 text-base tracking-tighter group-hover:text-[#d30614] transition-colors">{log.taskName}</span>
                                  <span className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em] italic opacity-60">TACTICAL EXECUTION</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-8 py-6">
                                <div className="flex items-center gap-3 text-[11px] font-black text-zinc-900 bg-zinc-50/80 px-4 py-2 rounded-xl border border-zinc-100 w-fit">
                                  <span className="bg-white px-2 py-1 rounded-lg shadow-sm border border-zinc-100">{formatLogTime(log.startTime)}</span>
                                  <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                                  <span className="bg-white px-2 py-1 rounded-lg shadow-sm border border-zinc-100 italic">
                                    {log.endTime ? formatLogTime(log.endTime) : 'ACTIVE.CAP'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-8 py-6 font-mono text-lg font-black text-zinc-900">
                                {log.status === 'running' ? (
                                  <div className="flex items-center gap-3 text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 w-fit shadow-sm">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                                    <span className="text-[10px] tracking-[0.3em] font-black uppercase">Active Capturing</span>
                                  </div>
                                ) : (
                                  <span className="bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-100 shadow-inner">{formatDuration(log.duration)}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center px-8 py-6">
                                <Badge variant="outline" className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 shadow-sm transition-all hover:scale-105 ${log.label === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50' :
                                    log.label === 'holded' ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50' :
                                      log.label === 'qc' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-50' :
                                        'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50'
                                  }`}>
                                  {log.label || log.status}
                                </Badge>
                              </TableCell>
                            </TableRow>

                            {/* Expanded Comments Row */}
                            {expandedRows.has(log._id) && (
                              <TableRow className="bg-zinc-50/40 border-none hover:bg-zinc-50/40">
                                <TableCell colSpan={userRole === 'admin' ? 6 : 5} className="p-0">
                                  <div className="px-20 py-12 border-l-8 border-[#fffe01] ml-16 mb-12 space-y-12 animate-in slide-in-from-top-4 transition-all duration-700">
                                    
                                    {/* Timeline Section */}
                                    <div className="space-y-8">
                                      <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-black rounded-xl">
                                          <Timer className="w-5 h-5 text-[#fffe01]" />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">Captured Operational Segments</span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {log.activityLog?.filter(a => a.type === 'play').length > 0 ? (
                                          log.activityLog.filter(a => a.type === 'play').map((activity, idx) => (
                                            <div key={idx} className="p-6 rounded-[2rem] border-2 border-white bg-white shadow-xl shadow-zinc-200/40 flex flex-col gap-4 hover:-translate-y-2 transition-all group/sess">
                                              <div className="flex items-center justify-between">
                                                <Badge className="text-[9px] font-black uppercase tracking-widest bg-[#fffe01] text-black border-none px-3 py-1 rounded-full shadow-lg">
                                                  SEGMENT {idx + 1}
                                                </Badge>
                                                <span className="text-xs font-mono font-black text-[#d30614]">
                                                  {activity.duration ? formatDuration(activity.duration) : 'O.INC'}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-500 bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                                                <span>{formatLogTime(activity.startTime)}</span>
                                                <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                                                <span className="italic">{activity.endTime ? formatLogTime(activity.endTime) : 'ACTIVE'}</span>
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="col-span-full py-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 bg-white border-2 border-dashed border-zinc-100 rounded-[2rem] shadow-inner font-bold">
                                            No granular activity captures established
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-8">
                                      <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-zinc-900 rounded-xl">
                                          <MessageSquare className="w-5 h-5 text-[#fffe01]" />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">Tactical Debriefing Logs</span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {log.comments?.length > 0 ? (
                                          log.comments.map((comment, idx) => (
                                            <div key={idx} className="bg-white p-7 rounded-[2rem] border-2 border-zinc-50 shadow-xl shadow-zinc-200/40 flex flex-col gap-4 group/comment relative hover:border-[#fffe01] transition-all duration-500">
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-[#d30614] uppercase tracking-widest">{comment.author}</span>
                                                <div className="flex items-center gap-3">
                                                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{format(new Date(comment.createdAt), 'MMM dd, hh:mm a')}</span>
                                                  {((userName === comment.author) || (userRole === 'admin')) && !editingCommentId && (
                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover/comment:opacity-100 transition-all scale-90 group-hover:scale-100">
                                                      <button onClick={(e) => { e.stopPropagation(); setEditingCommentId(comment._id); setEditValue(comment.text); }} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-all">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                      </button>
                                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteComment(log._id, comment._id); }} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                              {editingCommentId === comment._id ? (
                                                <div className="flex gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                                                  <Input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="h-12 bg-zinc-50 rounded-[1rem] border-2 border-zinc-100 text-xs font-bold"
                                                    autoFocus
                                                  />
                                                  <Button size="sm" className="h-12 w-12 bg-black text-[#fffe01] rounded-xl shadow-xl" onClick={() => handleUpdateComment(log._id, comment._id, editValue)}>
                                                    <Check className="w-4 h-4" />
                                                  </Button>
                                                  <Button size="sm" variant="ghost" className="h-12 w-12 text-zinc-400 rounded-xl" onClick={() => setEditingCommentId(null)}>
                                                    <X className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <div className="text-sm font-bold text-zinc-700 leading-relaxed italic"><MarkdownRenderer content={comment.text} /></div>
                                              )}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="col-span-full py-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 bg-white border-2 border-dashed border-zinc-100 rounded-[2rem] shadow-inner font-bold">
                                            Zero tactical debriefs established
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Add New Comment Section */}
                                    <div className="flex gap-4 max-w-4xl bg-white p-4 rounded-[2.5rem] border-2 border-zinc-50 shadow-2xl relative group/inputbox">
                                      <div className="absolute inset-0 bg-[#fffe01]/5 rounded-[2.5rem] opacity-0 group-hover/inputbox:opacity-100 transition-opacity"></div>
                                      <Input
                                        value={newComments[log._id] || ''}
                                        onChange={(e) => setNewComments(prev => ({ ...prev, [log._id]: e.target.value }))}
                                        placeholder="Initialize new tactical capture..."
                                        className="h-16 text-sm font-black bg-zinc-50/50 border-none focus-visible:ring-0 shadow-inner px-8 rounded-[1.5rem] relative z-10"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(log._id, newComments[log._id])}
                                      />
                                      <Button
                                        onClick={() => handleAddComment(log._id, newComments[log._id])}
                                        disabled={!newComments[log._id]?.trim()}
                                        className="h-16 px-10 bg-black text-[#fffe01] font-black uppercase tracking-[0.2em] rounded-[1.5rem] hover:scale-[1.02] shadow-2xl transition-all relative z-10 group/sendbtn"
                                      >
                                        <Send className="w-5 h-5 mr-3 group-hover/sendbtn:translate-x-1 transition-transform" />
                                        EXECUTE
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                </div>
              </section>
            ))}
            <div className="pt-12 px-6 flex justify-center">
              <PaginationControl
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeHistory;

