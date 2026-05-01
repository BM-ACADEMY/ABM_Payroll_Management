import { useState, useEffect, useMemo, Fragment } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Search, Calendar, Timer, History, Filter, ChevronRight, ChevronDown, MessageSquare, Pencil, Trash2, Check, X, Send, Play, Pause, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import socket from '@/services/socket';
import PaginationControl from '@/components/ui/PaginationControl';
import Loader from "@/components/ui/Loader";
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const TimeHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adminNameSearch, setAdminNameSearch] = useState('');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [userName, setUserName] = useState(localStorage.getItem('userName'));
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [newComments, setNewComments] = useState({});
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [logToDelete, setLogToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLogDeleteDialogOpen, setIsLogDeleteDialogOpen] = useState(false);
  // Mention states
  const [allUsers, setAllUsers] = useState([]);
  const [showMentions, setShowMentions] = useState(null); // logId of current active mention
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const { toast } = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const handleEditLog = async (log) => {
    try {
        if (log.status === 'completed') {
            const token = localStorage.getItem('token');
            await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/restart/${log._id}`, {}, {
                headers: { 'x-auth-token': token }
            });
            toast({ title: "Task Resumed", description: "Log moved back to tracker in paused state." });
        }
        // In all cases (running, paused, or just restarted), open the tracker
        window.dispatchEvent(new CustomEvent('open-task-tracker'));
    } catch (err) {
        console.error(err);
        toast({ variant: "destructive", title: "Action Failed", description: "Could not resume the task." });
    }
  };

  const handleResume = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/time-logs/resume/${id}`, {}, {
        headers: { 'x-auth-token': token }
      });
      setLogs(prev => prev.map(l => l._id === id ? res.data : l));
      toast({ title: "Resumed", description: "Time tracking resumed" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to resume task" });
    }
  };

  const handlePause = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/time-logs/pause/${id}`, {
        label: 'pending',
        message: 'Paused from history page'
      }, {
        headers: { 'x-auth-token': token }
      });
      setLogs(prev => prev.map(l => l._id === id ? res.data : l));
      toast({ title: "Paused", description: "Time tracking paused" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to pause task" });
    }
  };

  const handleStop = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/time-logs/stop/${id}`, {
        label: 'done',
        message: 'Completed from history page'
      }, {
        headers: { 'x-auth-token': token }
      });
      setLogs(prev => prev.map(l => l._id === id ? res.data : l));
      toast({ title: "Completed", description: "Task marked as finished" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to finish task" });
    }
  };

  const handleRestart = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/time-logs/restart/${id}`, {}, {
        headers: { 'x-auth-token': token }
      });
      setLogs(prev => prev.map(l => l._id === id ? res.data : l));
      toast({ title: "Restarted", description: "Task moved back to active logs" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to restart task" });
    }
  };

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
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

  const fetchAllUsers = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/members/search`, {
          headers: { 'x-auth-token': token }
        });
        setAllUsers(res.data);
    } catch (err) {
        console.error('Failed to fetch users', err);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

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

  // Deep linking logic
  useEffect(() => {
    const logId = searchParams.get('log');
    const commentId = searchParams.get('comment');

    if (logId) {
      const handleDeepLink = async () => {
        // 1. Check if log is already in the list
        let targetLog = logs.find(l => l._id === logId);
        
        if (!targetLog) {
          // If not in list (multi-page/filtered), fetch it specifically
          try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/time-logs/${logId}`, {
              headers: { 'x-auth-token': token }
            });
            targetLog = res.data;
            // Prepend it to logs so it's visible
            setLogs(prev => [targetLog, ...prev]);
          } catch (err) {
            console.error('Failed to fetch deep-linked log:', err);
          }
        }

        if (targetLog) {
          // 2. Expand the row
          setExpandedRows(prev => new Set([...prev, logId]));

          // 3. Scroll to the row
          setTimeout(() => {
            const rowElement = document.getElementById(`log-row-${logId}`);
            if (rowElement) {
              rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              rowElement.classList.add('bg-yellow-50/50', 'transition-all');
              setTimeout(() => rowElement.classList.remove('bg-yellow-50/50'), 4000);
            }

            // 4. If commentId, scroll to the comment
            if (commentId) {
              setTimeout(() => {
                const commentElement = document.getElementById(`comment-${commentId}`);
                if (commentElement) {
                  commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  commentElement.classList.add('ring-2', 'ring-yellow-400', 'ring-offset-2');
                  setTimeout(() => commentElement.classList.remove('ring-2', 'ring-yellow-400', 'ring-offset-2'), 4000);
                }
              }, 500);
            }
          }, 500);
        }
      };

      handleDeepLink();
    }
  }, [logs.length > 0, searchParams]);

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
      const token = localStorage.getItem('token');
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
    try {
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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

  const handleUpdateLabel = async (id, label) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/status/${id}`, { label }, {
        headers: { 'x-auth-token': token }
      });
      setLogs(prev => prev.map(log => log._id === id ? res.data : log));
      toast({ title: "Updated", description: "Status label updated successfully" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status label" });
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/time-logs/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setLogs(prev => prev.filter(log => log._id !== id));
      toast({ title: "Deleted", description: "Time log entry removed" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete time log" });
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
                        <TableHead className="text-xs text-slate-500 py-4 text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((log) => (
                        <Fragment key={log._id}>
                          <TableRow
                            id={`log-row-${log._id}`}
                            className={`group cursor-pointer border-slate-100 transition-all ${expandedRows.has(log._id) ? 'bg-slate-50/50' : ''}`}
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
                              {editingLabelId === log._id ? (
                                <select 
                                  autoFocus
                                  value={log.label || 'pending'}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    handleUpdateLabel(log._id, e.target.value);
                                    setEditingLabelId(null);
                                  }}
                                  onBlur={() => setEditingLabelId(null)}
                                  className="text-[10px] bg-white border border-slate-200 rounded px-1 h-6 outline-none animate-in fade-in zoom-in-95 duration-200"
                                >
                                  {['not yet started', 'pending', 'qc', 'requirement needed', 'in process', 'done', 'holded'].map(opt => (
                                    <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                  ))}
                                </select>
                              ) : (
                                <Badge 
                                  variant="outline" 
                                  onClick={(e) => { e.stopPropagation(); setEditingLabelId(log._id); }}
                                  className={`px-2 py-0.5 text-[10px] font-normal border-slate-200 cursor-pointer hover:border-slate-400 transition-colors ${
                                    log.label === 'not yet started' ? 'bg-slate-100 text-slate-500' :
                                    log.label === 'done' ? 'bg-green-50 text-green-600 border-green-100' :
                                    log.label === 'holded' ? 'bg-red-50 text-red-600 border-red-100' :
                                    log.label === 'qc' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    'bg-yellow-50 text-yellow-600 border-yellow-100'
                                  }`}
                                >
                                  {log.label || log.status}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="p-4 text-right pr-6">
                              <div className="flex justify-end gap-1">
                                {((log.user?._id || log.user) === userId) && (
                                  <>
                                    {log.status === 'running' && (
                                      <>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={(e) => { e.stopPropagation(); handlePause(log._id); }}
                                          className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                          title="Pause"
                                        >
                                          <Pause className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={(e) => { e.stopPropagation(); handleStop(log._id); }}
                                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
                                          title="Finish"
                                        >
                                          <Square className="w-3.5 h-3.5" />
                                        </Button>
                                      </>
                                    )}
                                    {(log.status === 'paused' || log.status === 'pending') && (
                                      <>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={(e) => { e.stopPropagation(); handleResume(log._id); }}
                                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
                                          title={log.status === 'pending' ? "Start" : "Resume"}
                                        >
                                          <Play className="w-3.5 h-3.5" />
                                        </Button>
                                        {log.status === 'paused' && (
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={(e) => { e.stopPropagation(); handleStop(log._id); }}
                                            className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
                                            title="Finish"
                                          >
                                            <Square className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                      </>
                                    )}
                                    {log.status === 'completed' && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={(e) => { e.stopPropagation(); handleRestart(log._id); }}
                                        className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                        title="Restart"
                                      >
                                        <Play className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        handleEditLog(log);
                                      }}
                                      className="h-8 w-8 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setLogToDelete(log._id); 
                                    setIsLogDeleteDialogOpen(true); 
                                  }}
                                  className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {expandedRows.has(log._id) && (
                            <TableRow className="bg-slate-50/30 border-none">
                              <TableCell colSpan={userRole === 'admin' ? 7 : 6} className="p-0">
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
                                        <div 
                                          key={comment._id || idx} 
                                          id={`comment-${comment._id}`}
                                          className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-2 relative group-hover:border-slate-300 transition-all"
                                        >
                                          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                            <span className="text-[11px] text-slate-500">{comment.author}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] text-slate-300">{format(new Date(comment.createdAt), 'MMM dd, h:mm a')}</span>
                                              {((userName === comment.author) || (userRole === 'admin') || (userRole === 'subadmin')) && (
                                                <div className="flex items-center gap-1">
                                                  <button onClick={() => { setEditingCommentId(comment._id); setEditValue(comment.text); }} className="p-1 text-slate-400 hover:text-slate-600">
                                                    <Pencil className="w-3 h-3" />
                                                  </button>
                                                  <button onClick={() => { setCommentToDelete({logId: log._id, commentId: comment._id}); setIsDeleteDialogOpen(true); }} className="p-1 text-slate-400 hover:text-red-500">
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          {editingCommentId === comment._id ? (
                                            <div className="flex flex-col gap-2 pt-2">
                                              <Textarea
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter' && !e.shiftKey && editValue.trim()) {
                                                    e.preventDefault();
                                                    handleUpdateComment(log._id, comment._id, editValue);
                                                    setEditingCommentId(null);
                                                  }
                                                }}
                                                className="min-h-[80px] text-xs border-slate-200 resize-none py-2"
                                                autoFocus
                                              />
                                              <div className="flex gap-2">
                                                <Button size="sm" className="h-8 px-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold" onClick={() => { handleUpdateComment(log._id, comment._id, editValue); setEditingCommentId(null); }}>
                                                  Save
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 px-4 text-slate-400 font-bold" onClick={() => setEditingCommentId(null)}>
                                                  Cancel
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-wrap"><MarkdownRenderer content={comment.text} /></div>
                                          )}
                                        </div>
                                      ))}
                                      
                                        <div className="flex flex-col gap-2 mt-4 max-w-lg w-full">
                                          <div className="relative">
                                            <Textarea
                                              value={newComments[log._id] || ''}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setNewComments(prev => ({ ...prev, [log._id]: val }));
                                                const pos = e.target.selectionStart;
                                                setCursorPos(pos);
                                                
                                                const lastAt = val.lastIndexOf('@', pos - 1);
                                                if (lastAt !== -1 && !val.slice(lastAt, pos).includes(' ')) {
                                                    setShowMentions(log._id);
                                                    setMentionSearch(val.slice(lastAt + 1, pos));
                                                } else {
                                                    setShowMentions(null);
                                                }
                                              }}
                                              placeholder="Add a new comment..."
                                              className="min-h-[64px] text-xs border-slate-200 shadow-none focus-visible:ring-yellow-400 w-full resize-none py-2"
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey && !showMentions && newComments[log._id]?.trim()) {
                                                   e.preventDefault();
                                                   handleAddComment(log._id, newComments[log._id]);
                                                }
                                              }}
                                            />
                                            {showMentions === log._id && allUsers.length > 0 && (
                                              <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[150px] overflow-y-auto">
                                                {allUsers
                                                  .filter(u => u.name.toLowerCase().includes(mentionSearch.toLowerCase()) || u.email.toLowerCase().includes(mentionSearch.toLowerCase()))
                                                  .map(u => (
                                                    <div 
                                                      key={u._id}
                                                      className="p-2 hover:bg-slate-50 cursor-pointer flex flex-col"
                                                      onClick={() => {
                                                        const currentText = newComments[log._id] || '';
                                                        const before = currentText.slice(0, currentText.lastIndexOf('@', cursorPos - 1));
                                                        const after = currentText.slice(cursorPos);
                                                        const mention = `@[${u.name}](${u.email}) `;
                                                        setNewComments(prev => ({ ...prev, [log._id]: before + mention + after }));
                                                        setShowMentions(null);
                                                      }}
                                                    >
                                                      <span className="text-[11px] font-medium text-slate-900">{u.name}</span>
                                                      <span className="text-[9px] text-slate-400">{u.email}</span>
                                                    </div>
                                                  ))
                                                }
                                              </div>
                                            )}
                                          </div>
                                          <Button
                                            onClick={() => handleAddComment(log._id, newComments[log._id])}
                                            disabled={!newComments[log._id]?.trim()}
                                            className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white shadow-none border-none flex items-center justify-center gap-2"
                                          >
                                            <Send className="w-4 h-4" />
                                            <span className="text-xs uppercase tracking-widest font-black">Post Update</span>
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

      <ConfirmDialog 
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
              if(commentToDelete) {
                  handleDeleteComment(commentToDelete.logId, commentToDelete.commentId);
                  setCommentToDelete(null);
              }
          }}
          title="Delete History Insight?"
          description="This will remove the specific comment from the historical time log entry."
      />

      <ConfirmDialog 
          isOpen={isLogDeleteDialogOpen}
          onClose={() => setIsLogDeleteDialogOpen(false)}
          onConfirm={() => {
              if(logToDelete) {
                  handleDeleteLog(logToDelete);
                  setLogToDelete(null);
              }
          }}
          title="Scrub Time Vector?"
          description="This will permanently delete this time log. This action cannot be reversed."
      />
    </div>
  );
};

export default TimeHistory;
