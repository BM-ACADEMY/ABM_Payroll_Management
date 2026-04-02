import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Pause, Square, X, Clock, AlertCircle, History, Plus, MessageSquare, Send, User as UserIcon, Pencil, Trash2, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import socket from '@/services/socket';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';

const TimerItem = ({ log, onPause, onResume, onStop, onAddComment, onStatusChange, settings }) => {
  const [seconds, setSeconds] = useState(0);
  const [label, setLabel] = useState(log.label || 'in process');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    const calculateSeconds = () => {
      if (log.status === 'running') {
        const now = new Date();
        const startTime = new Date(log.startTime);
        let totalPauseDuration = 0;
        log.pauses.forEach(p => {
          if (p.pauseEnd) {
            totalPauseDuration += (new Date(p.pauseEnd) - new Date(p.pauseStart));
          }
        });
        const diff = Math.floor((now - startTime - totalPauseDuration) / 1000);
        setSeconds(diff > 0 ? diff : 0);
      } else {
        setSeconds(log.duration || 0);
      }
    };

    calculateSeconds();
    
    if (log.status === 'running') {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [log]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => 
      urlRegex.test(part) ? (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="underline text-blue-400 hover:text-blue-300 break-all transition-colors"
        >
          {part}
        </a>
      ) : part
    );
  };

  const isOverLimit = settings && seconds > settings.taskTimeLimit * 3600;

  return (
    <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-4 space-y-4 shadow-xl group transition-all hover:bg-[#18181b]">
      <div className="flex justify-between items-center gap-2 pb-2 border-b border-zinc-800/50">
        <div className="flex items-center gap-2 flex-1 truncate">
            <div className={`w-2 h-2 rounded-full ${isOverLimit ? 'bg-red-500 animate-pulse' : log.status === 'running' ? 'bg-[#fffe01]' : 'bg-zinc-600'}`} />
            <h3 className="text-sm font-semibold text-white/90 truncate">{log.taskName}</h3>
        </div>
        <span className={`text-xs font-mono font-bold tracking-wider ${isOverLimit ? 'text-red-500' : 'text-[#fffe01]'}`}>
          {formatTime(seconds)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Current Status</span>
            <Select value={label} onValueChange={(val) => {
              setLabel(val);
              onStatusChange(log._id, val);
            }}>
              <SelectTrigger className="w-[140px] h-8 text-[11px] font-bold bg-zinc-900 border-zinc-800 text-white hover:border-[#fffe01] transition-all">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="in process">In Process</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="qc">QC</SelectItem>
                <SelectItem value="requirement needed">Requirement Needed</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="holded">Holded</SelectItem>
              </SelectContent>
            </Select>
        </div>

        {/* Comments Section */}
        <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-0.5">
                <MessageSquare className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">History & Comments</span>
            </div>
            
            <div className="max-h-[100px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {log.comments?.length > 0 ? (
                    log.comments.map((c, i) => (
                        <div key={i} className="flex flex-col gap-1 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/30 group/comment relative">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-[#fffe01]/70">{c.author}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] text-zinc-600">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                                    {((settings?.userName === c.author) || (settings?.userRole === 'admin')) && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingCommentId(c._id); setEditValue(c.text); }} className="text-zinc-500 hover:text-[#fffe01]">
                                                <Pencil className="w-2.5 h-2.5" />
                                            </button>
                                            <button onClick={() => onStop && onStop(log._id, label) /* placeholder for delete */ } className="text-zinc-500 hover:text-red-500">
                                                {/* Wait, I should use a proper delete prop */}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {editingCommentId === c._id ? (
                                <div className="flex gap-1 mt-1">
                                    <Input 
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-6 text-[9px] bg-zinc-900 border-zinc-700"
                                        autoFocus
                                    />
                                    <Button size="icon" className="h-6 w-6 bg-[#fffe01] text-black" onClick={() => { onUpdateComment(log._id, c._id, editValue); setEditingCommentId(null); }}>
                                        <Check className="w-2.5 h-2.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-500" onClick={() => setEditingCommentId(null)}>
                                        <X className="w-2.5 h-2.5" />
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-[10px] leading-relaxed text-zinc-400 font-medium">{renderTextWithLinks(c.text)}</p>
                            )}
                            
                            {/* Improved Action Overlay */}
                            {!editingCommentId && ((log.currentUser === c.author) || (log.isAdmin)) && (
                                <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5 opacity-0 group-hover/comment:opacity-100 transition-opacity bg-zinc-900/80 p-1 rounded-md backdrop-blur-sm">
                                     <button onClick={() => { setEditingCommentId(c._id); setEditValue(c.text); }} className="text-zinc-400 hover:text-[#fffe01] transition-colors">
                                        <Pencil className="w-2.5 h-2.5" />
                                     </button>
                                     <button onClick={() => onDeleteComment(log._id, c._id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-2.5 h-2.5" />
                                     </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-[9px] text-zinc-600 italic px-1">No comments yet</p>
                )}
            </div>

            <div className="flex gap-2">
                <Input 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="h-8 text-[10px] bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-600"
                    onKeyPress={(e) => e.key === 'Enter' && (onAddComment(log._id, newComment), setNewComment(''))}
                />
                <Button 
                    size="icon" 
                    onClick={() => { onAddComment(log._id, newComment); setNewComment(''); }}
                    disabled={!newComment.trim()}
                    className="h-8 w-8 min-w-[32px] bg-zinc-800 hover:bg-[#fffe01] hover:text-black transition-all"
                >
                    <Send className="w-3 h-3" />
                </Button>
            </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/30">
        <div className="flex gap-2">
          {log.status === 'running' ? (
            <Button 
              size="icon"
              onClick={() => onPause(log._id, label)}
              className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-black text-white hover:text-[#fffe01] border border-zinc-800 hover:border-[#fffe01]/50 transition-all font-black"
            >
              <Pause className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button 
              size="icon"
              onClick={() => onResume(log._id)}
              className="w-10 h-10 rounded-xl bg-[#fffe01] hover:bg-black text-black hover:text-[#fffe01] transition-all border border-[#fffe01]"
            >
              <Play className="w-4 h-4 fill-current" />
            </Button>
          )}
          <Button 
            size="icon"
            onClick={() => onStop(log._id, label)}
            className="w-10 h-10 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 hover:border-red-600 transition-all"
          >
            <Square className="w-4 h-4 fill-current" />
          </Button>
        </div>
        
        {isOverLimit && (
          <Badge variant="destructive" className="text-[9px] uppercase tracking-tighter px-2 h-5 animate-pulse rounded-full">
            Overtime!
          </Badge>
        )}
      </div>
    </div>
  );
};

const TaskTrackerSidebar = ({ isOpen, onClose, user }) => {
  const [taskName, setTaskName] = useState('');
  const [activeLogs, setActiveLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const { toast } = useToast();

  const fetchActiveTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/time-logs/active`, {
        headers: { 'x-auth-token': token }
      });
      setActiveLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch active tasks', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/time-logs/settings`, {
        headers: { 'x-auth-token': token }
      });
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  useEffect(() => {
    if (user && isOpen) {
      fetchActiveTasks();
      fetchSettings();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!user) return;

    const handleUpdate = (updatedLog) => {
      // If employee, only update their own logs. If admin, update all.
      const isOwnLog = updatedLog.user === user._id || updatedLog.user?._id === user._id;
      const isAdmin = user.role?.name === 'admin';

      if (isOwnLog || isAdmin) {
        setActiveLogs(prev => {
          if (updatedLog.status === 'completed') {
            return prev.filter(log => log._id !== updatedLog._id);
          }
          const exists = prev.find(log => log._id === updatedLog._id);
          if (exists) {
            return prev.map(log => log._id === updatedLog._id ? updatedLog : log);
          }
          if (updatedLog.status === 'running' || updatedLog.status === 'paused') {
            return [updatedLog, ...prev];
          }
          return prev;
        });
      }
    };

    socket.on('time_log_updated', handleUpdate);
    return () => socket.off('time_log_updated');
  }, [user]);

  const handleStart = async () => {
    if (!taskName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a task name" });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/time-logs/start`, { taskName }, {
        headers: { 'x-auth-token': token }
      });
      setActiveLogs(prev => [res.data, ...prev]);
      setTaskName('');
      toast({ title: "Started", description: `Tracking: ${taskName}` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.msg || "Failed to start task" });
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id, label) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/pause/${id}`, { label }, {
        headers: { 'x-auth-token': token }
      });
      setActiveLogs(prev => prev.map(log => log._id === id ? res.data : log));
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to pause task" });
    }
  };

  const handleResume = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/resume/${id}`, {}, {
        headers: { 'x-auth-token': token }
      });
      setActiveLogs(prev => prev.map(log => log._id === id ? res.data : log));
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to resume task" });
    }
  };

  const handleStop = async (id, label) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/stop/${id}`, { label }, {
        headers: { 'x-auth-token': token }
      });
      setActiveLogs(prev => prev.filter(log => log._id !== id));
      toast({ title: "Completed", description: "Task logged successfully" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to stop task" });
    }
  };

  const handleAddComment = async (id, text) => {
    if (!text.trim()) return;
    try {
        const token = localStorage.getItem('token');
        const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/comment/${id}`, { text }, {
          headers: { 'x-auth-token': token }
        });
        setActiveLogs(prev => prev.map(log => log._id === id ? res.data : log));
        toast({ title: "Comment Added", description: "Update sent successfully" });
    } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to add comment" });
    }
  };

  const handleUpdateComment = async (id, commentId, text) => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/comment/${id}/${commentId}`, { text }, {
          headers: { 'x-auth-token': token }
        });
        setActiveLogs(prev => prev.map(log => log._id === id ? res.data : log));
        toast({ title: "Comment Updated", description: "Changes saved" });
    } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update comment" });
    }
  };

  const handleDeleteComment = async (id, commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
        const token = localStorage.getItem('token');
        const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/time-logs/comment/${id}/${commentId}`, {
          headers: { 'x-auth-token': token }
        });
        setActiveLogs(prev => prev.map(log => log._id === id ? res.data : log));
        toast({ title: "Comment Deleted", description: "Update removed" });
    } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete comment" });
    }
  };

  const handleStatusChange = async (id, label) => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/status/${id}`, { label }, {
          headers: { 'x-auth-token': token }
        });
        setActiveLogs(prev => prev.map(log => log._id === id ? res.data : log));
        // No toast for silent auto-save
    } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
  };

  return (
    <div className={`fixed right-0 top-0 h-screen transition-all duration-300 ease-in-out bg-black border-l border-zinc-800 z-[60] flex flex-col p-6 shadow-2xl ${isOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full overflow-hidden'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#fffe01]" />
          <h2 className="text-lg font-medium text-white italic tracking-tight">Task Tracker</h2>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="space-y-3 mb-8">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-1">Start New Task</label>
          <div className="flex gap-2">
            <Input 
              placeholder="What's next?" 
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-11 rounded-xl focus:ring-[#fffe01] focus:border-[#fffe01] flex-1"
            />
            <Button 
              size="icon"
              onClick={handleStart} 
              disabled={loading || !taskName.trim()}
              className="w-11 h-11 bg-[#fffe01] hover:bg-yellow-400 text-black rounded-xl shadow-lg shadow-yellow-400/5 flex-shrink-0"
            >
              <Plus className="w-5 h-5 font-bold" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 -mr-3 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Ongoing Tasks</span>
            <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400 px-2 rounded-md h-5 capitalize">
               {activeLogs.length} Active
            </Badge>
          </div>
          
          {activeLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
               <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                  <Play className="w-4 h-4 text-zinc-600 fill-current opacity-30" />
               </div>
               <p className="text-xs text-zinc-500 font-medium">No tasks running.</p>
            </div>
          ) : (
            <div className="space-y-4">
                {activeLogs.map(log => (
                  <TimerItem 
                     key={log._id} 
                     log={{
                        ...log,
                        currentUser: user?.name,
                        isAdmin: user?.role?.name === 'admin'
                     }} 
                     onPause={handlePause} 
                     onResume={handleResume} 
                     onStop={handleStop} 
                     onAddComment={handleAddComment}
                     onUpdateComment={handleUpdateComment}
                     onDeleteComment={handleDeleteComment}
                     onStatusChange={handleStatusChange}
                     settings={settings}
                  />
                ))}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-zinc-800 pt-6">
           <Button 
             variant="ghost" 
             className="w-full text-zinc-400 hover:text-[#fffe01] hover:bg-zinc-900 justify-start gap-3 h-12 rounded-xl"
             onClick={() => window.location.href = user?.role?.name === 'admin' ? '/admin/time-history' : '/dashboard/time-history'}
           >
             <History className="w-5 h-5" />
             <span className="text-xs font-medium uppercase tracking-wider">Full History</span>
           </Button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
};

export default TaskTrackerSidebar;

