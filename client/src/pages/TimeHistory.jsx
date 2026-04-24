import { useState, useEffect, useMemo, Fragment } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Search, Calendar, Timer, History, Filter, ChevronRight, ChevronDown, MessageSquare, Pencil, Trash2, Check, X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
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
        ? `${import.meta.env.VITE_API_URL}/api/time-logs/all?startDate=${startDate}&endDate=${endDate}&userName=${adminNameSearch}&taskName=${searchTerm}&page=${page}&limit=10`
        : `${import.meta.env.VITE_API_URL}/api/time-logs/user?startDate=${startDate}&endDate=${endDate}&taskName=${searchTerm}&page=${page}&limit=10`;

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
      setLogs(prev => {
        const exists = prev.find(l => l._id === updatedLog._id);
        if (!exists) return prev;
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
    if (!dateString) return '---';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '---';
      return format(d, 'h:mm a');
    } catch (e) {
      return '---';
    }
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
      toast({ title: "Updated", description: "Comment updated successfully" });
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
      toast({ title: "Deleted", description: "Comment removed" });
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
      toast({ title: "Added", description: "Comment added successfully" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add comment" });
    }
  };

  const groupedLogs = useMemo(() => {
    const groups = {};
    logs.forEach(log => {
      const startTime = log.startTime || log.createdAt;
      const dateKey = format(new Date(startTime), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(startTime),
          items: [],
          totalDuration: 0
        };
      }
      groups[dateKey].items.push(log);
      groups[dateKey].totalDuration += (log.duration || 0);
    });
    return Object.values(groups).sort((a, b) => b.date - a.date);
  }, [logs]);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 min-h-screen bg-slate-50/30">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-slate-900">Time History</h1>
          <p className="text-sm text-slate-500">View and manage time tracking logs and activity.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
          <History className="w-4 h-4" />
          <span>{userRole === 'admin' ? 'Organization Logs' : 'My Activity'}</span>
        </div>
      </header>

      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <CardTitle className="text-sm font-normal text-slate-600">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userRole === 'admin' && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 pl-1">Employee Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search employee..."
                    value={adminNameSearch}
                    onChange={(e) => setAdminNameSearch(e.target.value)}
                    className="pl-9 h-10 border-slate-200 rounded-md focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 pl-1">Task Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Task name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 border-slate-200 rounded-md focus:ring-1 focus:ring-yellow-400"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 pl-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 border-slate-200 rounded-md"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 pl-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 border-slate-200 rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 space-y-4">
            <Loader size="lg" color="yellow" />
            <p className="text-xs text-slate-400">Loading history data...</p>
          </div>
        ) : groupedLogs.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-slate-300" />
             </div>
             <p className="text-sm text-slate-500">No logs found for the selected criteria.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedLogs.map((group) => (
              <div key={group.date.toISOString()} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-900 px-3 py-1 bg-yellow-400/10 border border-yellow-200 rounded-full">
                      {format(group.date, 'EEEE, MMM dd, yyyy')}
                    </span>
                    <div className="h-[1px] w-20 bg-slate-200"></div>
                  </div>
                  <span className="text-xs text-slate-400">
                    Daily Total: {formatDuration(group.totalDuration)}
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12 text-center"></TableHead>
                        {userRole === 'admin' && <TableHead className="text-xs text-slate-500 py-4">Employee</TableHead>}
                        <TableHead className="text-xs text-slate-500 py-4">Task</TableHead>
                        <TableHead className="text-xs text-slate-500 py-4">Timeline</TableHead>
                        <TableHead className="text-xs text-slate-500 py-4">Duration</TableHead>
                        <TableHead className="text-xs text-slate-500 py-4 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((log) => (
                        <Fragment key={log._id}>
                          <TableRow
                            className={`group cursor-pointer border-slate-100 ${expandedRows.has(log._id) ? 'bg-slate-50/50' : ''}`}
                            onClick={() => toggleRow(log._id)}
                          >
                            <TableCell className="p-4 text-center">
                              <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${expandedRows.has(log._id) ? 'rotate-90' : ''}`} />
                            </TableCell>
                            {userRole === 'admin' && (
                              <TableCell className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600">
                                    {log.user?.name?.charAt(0)}
                                  </div>
                                  <span className="text-sm text-slate-700">{log.user?.name || 'Unknown'}</span>
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="p-4">
                              <span className="text-sm text-slate-900">{log.taskName}</span>
                            </TableCell>
                            <TableCell className="p-4">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{log.status === 'pending' ? '---' : formatLogTime(log.startTime)}</span>
                                <span className="opacity-30">-</span>
                                <span>{log.endTime ? formatLogTime(log.endTime) : (log.status === 'pending' ? '---' : 'Active')}</span>
                              </div>
                            </TableCell>
                            <TableCell className="p-4">
                              <span className={`text-sm font-normal ${log.status === 'running' ? 'text-green-600' : 'text-slate-600'}`}>
                                {log.status === 'running' ? 'Tracking...' : formatDuration(log.duration)}
                              </span>
                            </TableCell>
                            <TableCell className="p-4 text-center">
                              <Badge variant="outline" className={`px-2 py-0.5 text-[10px] font-normal border-slate-200 ${
                                  log.label === 'not yet started' ? 'bg-slate-100 text-slate-500' :
                                  log.label === 'done' ? 'bg-green-50 text-green-600 border-green-100' :
                                  log.label === 'holded' ? 'bg-red-50 text-red-600 border-red-100' :
                                  log.label === 'qc' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  'bg-yellow-50 text-yellow-600 border-yellow-100'
                                }`}>
                                {log.label || log.status}
                              </Badge>
                            </TableCell>
                          </TableRow>

                          {expandedRows.has(log._id) && (
                            <TableRow className="bg-slate-50/30 border-none">
                              <TableCell colSpan={userRole === 'admin' ? 6 : 5} className="p-0">
                                <div className="px-12 py-6 space-y-8 animate-in slide-in-from-top-2 duration-300">
                                  {/* Sessions Section */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs text-slate-400 flex items-center gap-2">
                                      <Timer className="w-3 h-3" />
                                      Session Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                      {log.activityLog?.filter(a => a.type === 'play').length > 0 ? (
                                        log.activityLog.filter(a => a.type === 'play').map((activity, idx) => (
                                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1">
                                            <div className="flex justify-between items-center">
                                              <span className="text-[10px] text-slate-400">Session {idx + 1}</span>
                                              <span className="text-xs text-slate-600">
                                                {activity.duration ? formatDuration(activity.duration) : '--:--'}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                              <span>{formatLogTime(activity.startTime)}</span>
                                              <span>-</span>
                                              <span>{activity.endTime ? formatLogTime(activity.endTime) : 'Active'}</span>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="col-span-full py-4 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg">
                                          No individual sessions recorded.
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Comments Section */}
                                  <div className="space-y-4">
                                    <h4 className="text-xs text-slate-400 flex items-center gap-2">
                                      <MessageSquare className="w-3 h-3" />
                                      Comments & Updates
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {log.comments?.map((comment, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-2 relative group-hover:border-slate-300 transition-colors">
                                          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                            <span className="text-[11px] text-slate-500">{comment.author}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] text-slate-300">{format(new Date(comment.createdAt), 'MMM dd, h:mm a')}</span>
                                              {((userName === comment.author) || (userRole === 'admin')) && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                  <button onClick={() => { setEditingCommentId(comment._id); setEditValue(comment.text); }} className="p-1 text-slate-400 hover:text-slate-600">
                                                    <Pencil className="w-3 h-3" />
                                                  </button>
                                                  <button onClick={() => handleDeleteComment(log._id, comment._id)} className="p-1 text-slate-400 hover:text-red-500">
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          {editingCommentId === comment._id ? (
                                            <div className="flex gap-2 pt-2">
                                              <Input
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="h-8 text-xs border-slate-200"
                                                autoFocus
                                              />
                                              <Button size="sm" className="h-8 px-2 bg-yellow-400 hover:bg-yellow-500 text-black shadow-none border-none" onClick={() => handleUpdateComment(log._id, comment._id, editValue)}>
                                                <Check className="w-3 h-3" />
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-8 px-2 text-slate-400" onClick={() => setEditingCommentId(null)}>
                                                <X className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="text-sm text-slate-600 leading-relaxed font-normal"><MarkdownRenderer content={comment.text} /></div>
                                          )}
                                        </div>
                                      ))}
                                      
                                      <div className="flex gap-2 mt-4 max-w-lg">
                                        <Input
                                          value={newComments[log._id] || ''}
                                          onChange={(e) => setNewComments(prev => ({ ...prev, [log._id]: e.target.value }))}
                                          placeholder="Add a new comment..."
                                          className="h-10 text-xs border-slate-200 shadow-none focus:ring-yellow-400"
                                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(log._id, newComments[log._id])}
                                        />
                                        <Button
                                          onClick={() => handleAddComment(log._id, newComments[log._id])}
                                          disabled={!newComments[log._id]?.trim()}
                                          className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white shadow-none border-none"
                                        >
                                          <Send className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
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
              </div>
            ))}
            <div className="flex justify-center pb-8">
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
