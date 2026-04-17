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
            <Loader size="lg" color="red" />
          </div>
        ) : groupedLogs.length === 0 ? (
          <div className="text-center py-24 bg-white border border-gray-100 rounded-3xl text-gray-400 font-medium">
            No activity logs found for this period.
          </div>
        ) : (
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="space-y-10 p-6">
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

                    <Table>
                      <TableHeader className="bg-zinc-50/50">
                        <TableRow className="border-gray-100 hover:bg-transparent">
                          <TableHead className="w-[40px] px-4"></TableHead>
                          {userRole === 'admin' && <TableHead className="text-gray-500 font-medium px-6 text-[10px] uppercase tracking-wider">Employee</TableHead>}
                          <TableHead className="text-gray-500 font-medium px-6 text-[10px] uppercase tracking-wider">Task Details</TableHead>
                          <TableHead className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Timeline</TableHead>
                          <TableHead className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Duration</TableHead>
                          <TableHead className="text-gray-500 font-medium text-center px-6 text-[10px] uppercase tracking-wider">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((log) => (
                          <Fragment key={log._id}>
                            <TableRow
                              className={`border-gray-50 hover:bg-zinc-50/50 transition-colors cursor-pointer ${expandedRows.has(log._id) ? 'bg-zinc-50/80' : ''}`}
                              onClick={() => toggleRow(log._id)}
                            >
                              <TableCell className="px-4">
                                <div className={`p-1.5 rounded-lg transition-transform w-fit ${expandedRows.has(log._id) ? 'rotate-180 bg-[#fffe01] text-black' : 'bg-zinc-100 text-zinc-400'}`}>
                                  <ChevronDown className="w-3 h-3" />
                                </div>
                              </TableCell>
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
                                <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter ${log.label === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    log.label === 'holded' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                      log.label === 'qc' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                        'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                  {log.label || log.status}
                                </Badge>
                              </TableCell>
                            </TableRow>

                            {/* Expanded Comments Row */}
                            {expandedRows.has(log._id) && (
                              <TableRow className="bg-zinc-50/40 border-none hover:bg-zinc-50/40">
                                <TableCell colSpan={userRole === 'admin' ? 6 : 5} className="p-0">
                                  <div className="px-12 py-4 border-l-2 border-[#fffe01] ml-8 mb-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Comment History</span>
                                    </div>

                                    {/* Timeline Section */}
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Timer className="w-3.5 h-3.5 text-zinc-400" />
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Work sessions</span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {log.activityLog?.filter(a => a.type === 'play').length > 0 ? (
                                          log.activityLog.filter(a => a.type === 'play').map((activity, idx) => (
                                            <div key={idx} className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 shadow-sm flex flex-col gap-1 transition-all">
                                              <div className="flex items-center justify-between">
                                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700 border-emerald-200">
                                                  Active Session {idx + 1}
                                                </Badge>
                                                <span className="text-[9px] font-mono font-bold text-zinc-500">
                                                  {activity.duration ? formatDuration(activity.duration) : '---'}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 text-[10px] text-zinc-600 mt-1">
                                                <span className="font-medium">{formatLogTime(activity.startTime)}</span>
                                                <ChevronRight className="w-2.5 h-2.5 text-zinc-300" />
                                                <span className="font-medium">{activity.endTime ? formatLogTime(activity.endTime) : 'Ongoing'}</span>
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="col-span-full py-4 text-center text-xs text-zinc-400 italic bg-zinc-100/50 rounded-xl">
                                            No detailed work sessions recorded.
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {log.comments?.length > 0 ? (
                                        log.comments.map((comment, idx) => (
                                          <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1 ease-in duration-200 hover:shadow-md group/comment relative">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[10px] font-bold text-[#facc15]">{comment.author}</span>
                                              <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-zinc-400">{format(new Date(comment.createdAt), 'MMM dd, hh:mm a')}</span>
                                                {((userName === comment.author) || (userRole === 'admin')) && !editingCommentId && (
                                                  <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingCommentId(comment._id); setEditValue(comment.text); }} className="text-zinc-400 hover:text-blue-500">
                                                      <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteComment(log._id, comment._id); }} className="text-zinc-400 hover:text-red-500">
                                                      <Trash2 className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            {editingCommentId === comment._id ? (
                                              <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                                <Input
                                                  value={editValue}
                                                  onChange={(e) => setEditValue(e.target.value)}
                                                  className="h-8 text-xs focus:ring-[#fffe01]"
                                                  autoFocus
                                                />
                                                <Button size="sm" className="h-8 bg-[#fffe01] text-black" onClick={() => handleUpdateComment(log._id, comment._id, editValue)}>
                                                  <Check className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 text-zinc-400" onClick={() => setEditingCommentId(null)}>
                                                  <X className="w-3.5 h-3.5" />
                                                </Button>
                                              </div>
                                            ) : (
                                              <div className="text-xs text-gray-700 leading-normal"><MarkdownRenderer content={comment.text} /></div>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="col-span-full py-4 text-center text-xs text-zinc-400 italic bg-zinc-100/50 rounded-xl">
                                          No comments logged for this task.
                                        </div>
                                      )}
                                    </div>

                                    {/* Add New Comment Section */}
                                    <div className="flex gap-2 max-w-2xl bg-white p-2 rounded-xl border border-gray-100 shadow-sm mt-4">
                                      <Input
                                        value={newComments[log._id] || ''}
                                        onChange={(e) => setNewComments(prev => ({ ...prev, [log._id]: e.target.value }))}
                                        placeholder="Write a new comment..."
                                        className="h-10 text-xs bg-zinc-50 border-none focus-visible:ring-0 shadow-none px-4"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(log._id, newComments[log._id])}
                                      />
                                      <Button
                                        size="icon"
                                        onClick={() => handleAddComment(log._id, newComments[log._id])}
                                        disabled={!newComments[log._id]?.trim()}
                                        className="h-10 w-10 min-w-[40px] bg-black hover:bg-[#fffe01] hover:text-black text-white transition-all rounded-lg"
                                      >
                                        <Send className="w-4 h-4" />
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
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-zinc-50/50">
                <PaginationControl
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TimeHistory;

