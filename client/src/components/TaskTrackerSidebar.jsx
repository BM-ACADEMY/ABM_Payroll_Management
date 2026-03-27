import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Pause, Square, X, Clock, AlertCircle, History, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import socket from '@/services/socket';
import { Badge } from "@/components/ui/badge";

const TimerItem = ({ log, onPause, onResume, onStop, settings }) => {
  const [seconds, setSeconds] = useState(0);
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-inner group">
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-sm font-medium text-white truncate flex-1">{log.taskName}</h3>
        <span className={`text-xs font-mono ${isOverLimit ? 'text-red-500 animate-pulse' : 'text-[#fffe01]'}`}>
          {formatTime(seconds)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex gap-2">
          {log.status === 'running' ? (
            <Button 
              size="icon"
              onClick={() => onPause(log._id)}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border-none"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
            </Button>
          ) : (
            <Button 
              size="icon"
              onClick={() => onResume(log._id)}
              className="w-8 h-8 rounded-lg bg-[#fffe01] hover:bg-yellow-400 text-black border-none"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </Button>
          )}
          <Button 
            size="icon"
            onClick={() => onStop(log._id)}
            variant="destructive"
            className="w-8 h-8 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border-none"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </Button>
        </div>
        
        {isOverLimit && (
          <div className="flex items-center gap-1 text-[10px] text-red-400 font-medium bg-red-400/10 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            <span>Limit!</span>
          </div>
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
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/time-logs/user`, {
        headers: { 'x-auth-token': token }
      });
      const ongoing = res.data.filter(log => log.status === 'running' || log.status === 'paused');
      setActiveLogs(ongoing);
    } catch (err) {
      console.error('Failed to fetch active tasks', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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

  const handlePause = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/pause/${id}`, {}, {
        headers: { 'x-auth-token': token }
      });
      setActiveLogs(prev => prev.map(log => log._id === id ? res.data : log));
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to pause task" });
    }
  };

  const handleResume = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/resume/${id}`, {}, {
        headers: { 'x-auth-token': token }
      });
      setActiveLogs(prev => prev.map(log => log._id === id ? res.data : log));
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to resume task" });
    }
  };

  const handleStop = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/time-logs/stop/${id}`, {}, {
        headers: { 'x-auth-token': token }
      });
      setActiveLogs(prev => prev.filter(log => log._id !== id));
      toast({ title: "Completed", description: "Task logged successfully" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to stop task" });
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
                    log={log} 
                    onPause={handlePause} 
                    onResume={handleResume} 
                    onStop={handleStop} 
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
