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
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const TimerItem = ({ log, onPause, onResume, onStop, onAddComment, onStatusChange, settings, onUpdateComment, onDeleteComment, allUsers }) => {
  const [seconds, setSeconds] = useState(0);
  const [label, setLabel] = useState(log.label || 'not yet started');
  const [newComment, setNewComment] = useState('');
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Mention states
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const mentionRef = useRef(null);
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

  const isOverLimit = settings && seconds > settings.taskTimeLimit * 3600;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm transition-all hover:border-slate-300">
      <div className="flex justify-between items-start gap-2 pb-3 border-b border-slate-50">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
            <h3 className="text-sm font-normal text-slate-900 truncate tracking-tight">{log.taskName}</h3>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isOverLimit ? 'bg-red-500 animate-pulse' : log.status === 'running' ? 'bg-green-500' : 'bg-slate-300'}`} />
                <span className="text-[10px] text-slate-400 capitalize">{log.status}</span>
            </div>
        </div>
        <span className={`text-xs font-mono font-normal ${isOverLimit ? 'text-red-500' : log.status === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}>
          {log.status === 'pending' ? '00:00:00' : formatTime(seconds)}
        </span>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400">Current Status</label>
            <Select value={label} onValueChange={(val) => {
              setLabel(val);
              onStatusChange(log._id, val);
            }}>
              <SelectTrigger className="w-full h-9 text-xs font-normal bg-slate-50 border-slate-200 text-slate-700 shadow-none hover:bg-slate-100 transition-colors">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700 shadow-lg rounded-lg p-1">
                <SelectItem value="not yet started" className="focus:bg-slate-50 rounded-md py-2 text-xs font-normal">Not Yet Started</SelectItem>
                <SelectItem value="in process" className="focus:bg-slate-50 rounded-md py-2 text-xs font-normal">In Process</SelectItem>
                <SelectItem value="pending" className="focus:bg-slate-50 rounded-md py-2 text-xs font-normal">Pending (On Hold)</SelectItem>
                <SelectItem value="qc" className="focus:bg-slate-50 rounded-md py-2 text-xs font-normal">Quality Check (QC)</SelectItem>
                <SelectItem value="requirement needed" className="focus:bg-slate-50 rounded-md py-2 text-xs font-normal">Requirements Needed</SelectItem>
                <SelectItem value="done" className="focus:bg-slate-50 rounded-md py-2 text-xs font-normal">Completed / Done</SelectItem>
                <SelectItem value="holded" className="focus:bg-slate-50 rounded-md py-2 text-xs font-normal">Critical Block</SelectItem>
              </SelectContent>
            </Select>
        </div>

        {/* Comments Section */}
        <div className="space-y-3">
            <div className="flex items-center gap-1.5 px-0.5 border-t border-slate-50 pt-3">
                <MessageSquare className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-slate-400">Comments History</span>
            </div>
            
            <div className="max-h-[120px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {log.comments?.length > 0 ? (
                    log.comments.map((c, i) => (
                        <div key={i} className="flex flex-col gap-1.5 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 group/comment relative hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500">{c.author}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-slate-300">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                                    {((settings?.userName === c.author) || (settings?.userRole === 'admin') || (settings?.userRole === 'subadmin')) && (
                                        <div className="flex items-center gap-1 transition-opacity">
                                            <button onClick={() => { setEditingCommentId(c._id); setEditValue(c.text); }} className="p-1 text-slate-300 hover:text-slate-600 transition-colors">
                                                <Pencil className="w-2.5 h-2.5" />
                                            </button>
                                            <button onClick={() => { setCommentToDelete(c._id); setIsDeleteDialogOpen(true); }} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {editingCommentId === c._id ? (
                                <div className="flex gap-1">
                                    <Textarea 
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => {
                                           if (e.key === 'Enter' && !e.shiftKey && editValue.trim()) {
                                               e.preventDefault();
                                               onUpdateComment(log._id, c._id, editValue);
                                               setEditingCommentId(null);
                                           }
                                        }}
                                        className="min-h-[60px] text-[11px] border-slate-200 focus:ring-0 w-full resize-none py-1.5"
                                        autoFocus
                                    />
                                    <div className="flex flex-col gap-1">
                                        <Button size="sm" className="h-7 w-7 p-0 bg-slate-900 shadow-none border-none" onClick={() => { onUpdateComment(log._id, c._id, editValue); setEditingCommentId(null); }}>
                                            <Check className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400" onClick={() => setEditingCommentId(null)}>
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[11px] leading-relaxed text-slate-600 font-normal"><MarkdownRenderer content={c.text} /></div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-[10px] text-slate-400 italic px-1">No updates registered yet.</p>
                )}
            </div>

            <div className="flex flex-col gap-1.5 pt-2">
                <div className="relative">
                    <Textarea 
                        value={newComment}
                        onChange={(e) => {
                            const val = e.target.value;
                            setNewComment(val);
                            const pos = e.target.selectionStart;
                            setCursorPos(pos);
                            
                            const lastAt = val.lastIndexOf('@', pos - 1);
                            if (lastAt !== -1 && !val.slice(lastAt, pos).includes(' ')) {
                                setShowMentions(true);
                                setMentionSearch(val.slice(lastAt + 1, pos));
                            } else {
                                setShowMentions(false);
                            }
                        }}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter' && !e.shiftKey && !showMentions && newComment.trim()) {
                              e.preventDefault();
                              onAddComment(log._id, newComment);
                              setNewComment('');
                           }
                        }}
                        placeholder="Type an update..."
                        className="min-h-[60px] text-xs bg-white border-slate-200 text-slate-700 shadow-none focus-visible:ring-0 w-full resize-none py-2"
                    />
                    {showMentions && allUsers.length > 0 && (
                        <div ref={mentionRef} className="absolute bottom-full left-0 w-full mb-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[150px] overflow-y-auto">
                            {allUsers
                                .filter(u => u.name.toLowerCase().includes(mentionSearch.toLowerCase()) || u.email.toLowerCase().includes(mentionSearch.toLowerCase()))
                                .map(u => (
                                    <div 
                                        key={u._id}
                                        className="p-2 hover:bg-slate-50 cursor-pointer flex flex-col"
                                        onClick={() => {
                                            const before = newComment.slice(0, newComment.lastIndexOf('@', cursorPos - 1));
                                            const after = newComment.slice(cursorPos);
                                            // The user wanted @name, but we use @[name](email) internally for unique identification in backend
                                            // but to satisfy "eg: @snega", we'll make sure it looks like @snega to the user if they were just typing.
                                            // Actually, @[Name](email) format is best for backend parsing.
                                            const mention = `@[${u.name}](${u.email}) `;
                                            setNewComment(before + mention + after);
                                            setShowMentions(false);
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
                    size="sm" 
                    onClick={() => { onAddComment(log._id, newComment); setNewComment(''); }}
                    disabled={!newComment.trim()}
                    className="h-9 bg-slate-900 border-none shadow-none text-white hover:bg-slate-800 transition-colors w-full flex items-center justify-center gap-2"
                >
                    <Send className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-widest font-medium">Send Update</span>
                </Button>
            </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <div className="flex gap-2">
          {log.status === 'running' ? (
            <Button 
              size="sm"
              onClick={() => onPause(log._id, label)}
              className="h-10 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-none transition-colors"
            >
              <Pause className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs font-normal">Pause</span>
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={() => onResume(log._id)}
              className="h-10 px-4 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black border-none shadow-none transition-colors"
            >
              <Play className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs font-normal">Resume</span>
            </Button>
          )}
          <Button 
            size="sm"
            variant="ghost"
            onClick={() => onStop(log._id, label)}
            className="h-10 px-3 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Square className="w-3.5 h-3.5 mr-2" />
            <span className="text-xs font-normal">Finish</span>
          </Button>
        </div>
        
        {isOverLimit && (
          <Badge variant="destructive" className="text-[9px] font-normal px-2 py-0.5 rounded-full animate-pulse shadow-none border-none">
            Limit Over
          </Badge>
        )}
      </div>

       <ConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
            if(commentToDelete) {
                onDeleteComment(log._id, commentToDelete);
                setCommentToDelete(null);
            }
        }}
        title="Delete Insight?"
        description="This action will remove the transition log permanently."
      />
    </div>
  );
};

const TaskTrackerSidebar = ({ isOpen, onClose, user }) => {
  const [taskName, setTaskName] = useState('');
  const [activeLogs, setActiveLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
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
    if (user && isOpen) {
      fetchActiveTasks();
      fetchSettings();
      fetchAllUsers();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!user) return;

    const handleUpdate = (updatedLog) => {
      const logUserId = updatedLog.user?._id || updatedLog.user;
      const isOwnLog = String(logUserId) === String(user.id);

      if (isOwnLog) {
        setActiveLogs(prev => {
          if (updatedLog.status === 'completed') {
            return prev.filter(log => log._id !== updatedLog._id);
          }
          const exists = prev.find(log => log._id === updatedLog._id);
          if (exists) {
            return prev.map(log => log._id === updatedLog._id ? updatedLog : log);
          }
          if (updatedLog.status === 'running' || updatedLog.status === 'paused' || updatedLog.status === 'pending') {
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
      toast({ variant: "destructive", title: "Missing Input", description: "Please enter a task name" });
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
      toast({ title: "Tracking Started", description: taskName });
    } catch (err) {
      toast({ variant: "destructive", title: "System Error", description: err.response?.data?.msg || "Failed to start task" });
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id, label) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/time-logs/pause/${id}`, { label }, {
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
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/time-logs/resume/${id}`, {}, {
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
      await axios.post(`${import.meta.env.VITE_API_URL}/api/time-logs/stop/${id}`, { label }, {
        headers: { 'x-auth-token': token }
      });
      setActiveLogs(prev => prev.filter(log => log._id !== id));
      toast({ title: "Task Completed", description: "Data logged successfully" });
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
    } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
  };

  return (
    <div className={`fixed right-0 top-0 h-screen transition-all duration-300 ease-in-out bg-white border-l border-slate-200 z-[60] flex flex-col shadow-2xl ${isOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full overflow-hidden'}`}>
      <div className="flex items-center justify-between p-6 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-normal text-slate-800">Task Tracker</h2>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col flex-1 min-h-0 p-6">
        <div className="space-y-2.5 mb-8">
          <label className="text-[10px] text-slate-400 pl-1 uppercase tracking-wider">Add Task Manually</label>
          <div className="flex gap-2">
            <Input 
              placeholder="What are you working on?" 
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-700 h-10 px-4 rounded-lg focus:ring-0 shadow-none text-xs font-normal"
            />
            <Button 
              size="icon"
              onClick={handleStart} 
              disabled={loading || !taskName.trim()}
              className="w-10 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-none flex-shrink-0 border-none"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 -mr-2 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Current Deployments</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{activeLogs.length} active</span>
          </div>
          
          {activeLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
               <Play className="w-6 h-6 text-slate-200 mb-2" />
               <p className="text-[11px] text-slate-400 font-normal">No active tasks being tracked.</p>
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
                     allUsers={allUsers}
                  />
                ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
           <Button 
             variant="ghost" 
             className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 justify-start gap-3 h-11 rounded-lg border border-transparent"
             onClick={() => window.location.href = user?.role?.name === 'admin' ? '/admin/time-history' : '/dashboard/time-history'}
           >
             <History className="w-4 h-4" />
             <span className="text-xs font-normal">View Full History</span>
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
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default TaskTrackerSidebar;
