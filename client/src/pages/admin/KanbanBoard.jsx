import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Plus, Users, Search, MoreHorizontal, Calendar, 
  MessageSquare, CheckSquare, Clock, Layout, X, UserPlus,
  Settings, Trash2, Edit, Save, ChevronDown, TrendingUp,
  Target, Zap, Activity, Info
} from 'lucide-react';
import socket from '@/services/socket';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import Loader from "@/components/ui/Loader";
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

// Modularized components
import KanbanCard from './kanban/KanbanCard';
const TaskDetailsModal = lazy(() => import('./kanban/TaskDetailsModal'));
import TimelineEngine from './kanban/TimelineEngine';
import SOPTab from './kanban/SOPTab';
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";



const KanbanBoard = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const userRole = sessionStorage.getItem('userRole');
  const isAdmin = userRole === 'admin' || userRole === 'subadmin';

  const [boardData, setBoardData] = useState(null);
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  
  const [activeTab, setActiveTab] = useState('sprint');
  const [selectedAnalyticsUser, setSelectedAnalyticsUser] = useState(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({ title: '', listId: '', boardId: boardData?._id || id });
  
  const [taskDetails, setTaskDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
  const [editBoardData, setEditBoardData] = useState({ title: '', description: '' });
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [teamsForAdmin, setTeamsForAdmin] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', data: null });

  // Refs for socket listener to avoid closure issues
  const isDetailsOpenRef = useRef(isDetailsOpen);
  const taskDetailsRef = useRef(taskDetails);
  
  useEffect(() => { isDetailsOpenRef.current = isDetailsOpen; }, [isDetailsOpen]);
  useEffect(() => { taskDetailsRef.current = taskDetails; }, [taskDetails]);

  const backlogTasks = useMemo(() => tasks.filter(t => !t.isInSprint && !t.parentTask), [tasks]);
  const sprintTasks = useMemo(() => tasks.filter(t => t.isInSprint && !t.parentTask), [tasks]);

  const tasksByList = useMemo(() => {
    const map = {};
    if (!Array.isArray(lists)) return map;
    lists.forEach(l => { map[l._id] = []; });
    
    const tasksToUse = boardData?.type === 'weekly' ? tasks : sprintTasks;

    if (!Array.isArray(tasksToUse)) return map;

    tasksToUse.forEach(t => {
      // In weekly mode, the 'listId' we match against is the task's board ID
      const matchId = boardData?.type === 'weekly' 
        ? (t.board?._id || t.board) 
        : (t.list?._id || t.list);
        
      if (!t.parentTask && map[matchId]) {
        map[matchId].push(t);
      }
    });

    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => (a.position || 0) - (b.position || 0));
    });
    return map;
  }, [tasks, sprintTasks, lists, boardData?.type]);

  const deduplicatedMembers = useMemo(() => {
    if (!boardData?.members) return [];
    const seen = new Set();
    return boardData.members.filter(m => {
      const duplicate = seen.has(m._id || m);
      seen.add(m._id || m);
      return !duplicate;
    });
  }, [boardData?.members]);

  const analyticsData = useMemo(() => {
    const currentUserId = sessionStorage.getItem('userId');
    const isAdminView = isAdmin || userRole === 'subadmin';
    let filteredTasks = tasks;
    
    if (!isAdminView) {
      filteredTasks = tasks.filter(t => t.assignees?.some(a => (a._id || a) === currentUserId));
    } else if (selectedAnalyticsUser && selectedAnalyticsUser !== 'all') {
      filteredTasks = tasks.filter(t => t.assignees?.some(a => (a._id || a) === selectedAnalyticsUser));
    }

    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.isCompleted).length;
    const blocked = filteredTasks.filter(t => t.blocker).length;
    const inSprint = filteredTasks.filter(t => t.isInSprint).length;
    
    const listStats = lists.map(l => ({
      name: l.title,
      tasks: filteredTasks.filter(t => (t.list?._id || t.list) === l._id).length,
      completed: filteredTasks.filter(t => (t.list?._id || t.list) === l._id && t.isCompleted).length
    })).filter(l => l.tasks > 0);

    const statsToDisplay = (!isAdminView) 
      ? deduplicatedMembers.filter(m => String(m._id || m) === String(currentUserId))
      : (selectedAnalyticsUser && selectedAnalyticsUser !== 'all')
        ? deduplicatedMembers.filter(m => String(m._id || m) === String(selectedAnalyticsUser))
        : deduplicatedMembers;

    const memberStats = statsToDisplay.map(m => {
       const mId = String(m._id || m);
       
       // 1. Direct task assignments
       const memberTasks = tasks.filter(t => t.assignees?.some(a => String(a._id || a) === mId));
       
       // 2. Checklist item assignments
       const memberChecklistItems = tasks.flatMap(t => 
         t.checklists?.flatMap(cl => 
           cl.items?.filter(item => String(item.assignedTo?._id || item.assignedTo) === mId) || []
         ) || []
       );

       const total = memberTasks.length + memberChecklistItems.length;
       const completed = memberTasks.filter(t => t.isCompleted).length + 
                        memberChecklistItems.filter(item => item.isCompleted).length;
       const blocked = memberTasks.filter(t => t.blocker).length; // Usually blocker is a task property

       return {
          name: m.name.split(' ')[0],
          fullName: m.name,
          id: m._id,
          total,
          completed,
          blocked
       };
    }) || [];

    return { total, completed, blocked, inSprint, listStats, memberStats };
  }, [tasks, lists, boardData, deduplicatedMembers, isAdmin, selectedAnalyticsUser, userRole]);

  const handleMoveToSprint = async (taskId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskId}`, {
        isInSprint: true
      }, { headers: { 'x-auth-token': token } });
      toast({ title: "Task Deployed", description: "Operation moved to active Sprint node." });
      fetchData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to deploy task" });
    }
  };

  const fetchData = React.useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      // If type exists ('daily' or 'weekly'), fetch from the special endpoint
      const url = type 
        ? `${import.meta.env.VITE_API_URL}/api/boards/special/${type}${selectedTeamId ? `?teamId=${selectedTeamId}` : ''}`
        : `${import.meta.env.VITE_API_URL}/api/boards/${id}`;
        
      const res = await axios.get(url, {
        headers: { 'x-auth-token': token }
      });
      setBoardData(res.data.board || null);
      setLists(res.data.lists || []);
      setTasks(res.data.tasks || []);
      if (res.data.board) {
        setEditBoardData({
          title: res.data.board.title,
          description: res.data.board.description || ''
        });
      }
      setLoading(false);
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        setAuthError(true);
      } else if (err.response && err.response.status === 404) {
        toast({ variant: "destructive", title: "Board Not Found", description: "This board does not exist or has been deleted." });
        navigate(isAdmin ? '/admin/kanban' : '/dashboard/kanban', { replace: true });
      } else {
        toast({ variant: "destructive", title: "Error", description: err.response?.data?.msg || "Failed to fetch board" });
      }
      setLoading(false);
    }
  }, [id, type, toast, selectedTeamId, navigate, isAdmin]);

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/members/search`, {
        headers: { 'x-auth-token': token }
      });
      // Handle both { employees: [...] } and [...] formats
      const data = res.data.employees || (Array.isArray(res.data) ? res.data : []);
      setAllUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setAllUsers([]);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchUsers(); // All authenticated users can now fetch directory info for boards
    
    if (isAdmin) {
      const fetchTeams = async () => {
        try {
          const token = sessionStorage.getItem('token');
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/teams?nopage=true`, {
            headers: { 'x-auth-token': token }
          });
          const teamsArray = (res.data.teams || (Array.isArray(res.data) ? res.data : [])).map(t => ({
            ...t,
            _id: String(t._id).toLowerCase()
          }));
          setTeamsForAdmin(teamsArray);
        } catch (err) {
          console.error('Error fetching teams:', err);
        }
      };
      fetchTeams();
    }
  }, [fetchData]);

  // Update selectedTeamId when boardData changes to ensure sync
  useEffect(() => {
    if (boardData?.team?._id && !selectedTeamId) {
      setSelectedTeamId(String(boardData.team._id).toLowerCase());
    }
  }, [boardData]);

  // Handle Board Socket Connections
  useEffect(() => {
    const currentBoardId = boardData?._id || id;
    if (!currentBoardId) return;
    
    const joinBoard = () => {
      console.log('Joined board room:', currentBoardId);
      socket.emit('join_board', currentBoardId);
    };

    if (socket.connected) joinBoard();
    socket.on('connect', joinBoard);

    socket.on('board_updated', (data) => {
      console.log('Board update received:', data);
      fetchData();
      
      // Check for current task details refresh
      if (taskDetailsRef.current && (data.taskId === taskDetailsRef.current.task._id || data.type?.includes('COMMENT'))) {
        fetchTaskDetails(taskDetailsRef.current.task._id);
      }
    });

    socket.on('notification', (data) => {
      if (data.userId === sessionStorage.getItem('userId')) {
         toast({
           title: "New Mention",
           description: data.message,
           action: data.taskId ? (
             <Button variant="outline" size="sm" onClick={() => fetchTaskDetails(data.taskId)}>View Task</Button>
           ) : null
         });
      }
    });

    return () => {
      socket.emit('leave_board', currentBoardId);
      socket.off('connect', joinBoard);
      socket.off('board_updated');
      socket.off('notification');
    };
  }, [boardData?._id, id, fetchData, toast]);

  const handleAddMember = async (userId) => {
    // Optimistic Update
    const userToAdd = allUsers.find(u => u._id === userId);
    if (userToAdd) {
      setBoardData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          members: [...(prev.members || []), userToAdd]
        };
      });
    }

    try {
      const token = sessionStorage.getItem('token');
      const currentBoardId = boardData?._id || id;
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/${currentBoardId}/members`, { userId }, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Success", description: "Member added to board" });
      fetchData(); // Sync with server
    } catch (err) { 
      toast({ variant: "destructive", title: "Error", description: "Failed to add member" });
      fetchData(); // Rollback on error
    }
  };

  const handleRemoveMember = async (userId) => {
    setConfirmDialog({ 
      isOpen: true, 
      type: 'REMOVE_MEMBER', 
      data: userId,
      title: "Remove Member",
      description: "Are you sure you want to remove this member from the board?"
    });
  };

  const confirmRemoveMember = async (userId) => {
    // Optimistic Update
    setBoardData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        members: (prev.members || []).filter(m => m._id !== userId),
        admins: (prev.admins || []).filter(a => a._id !== userId)
      };
    });

    try {
      const token = sessionStorage.getItem('token');
      const currentBoardId = boardData?._id || id;
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/boards/${currentBoardId}/members/${userId}`, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Success", description: "Member removed from board" });
      fetchData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove member" });
      fetchData();
    }
  };




  const getTimeAgo = (date) => {
    const diff = new Date() - new Date(date);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const fetchTaskDetails = React.useCallback(async (taskId) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskId}`, {
        headers: { 'x-auth-token': token }
      });
      setTaskDetails(res.data);
      setIsDetailsOpen(true);
    } catch (err) {
      // Don't toast if the task just isn't found for a deep link, or customize it
      if (err.response?.status !== 404 && err.response?.status !== 403) {
         toast({ variant: "destructive", title: "Error", description: "Failed to fetch task details" });
      }
    }
  }, [toast]);

  // Handle deep link auto-open
  useEffect(() => {
     const searchParams = new URLSearchParams(location.search);
     const deepLinkTaskId = searchParams.get('task');
     if (deepLinkTaskId && !isDetailsOpen && !loading && !authError) {
        fetchTaskDetails(deepLinkTaskId);
     }
  }, [location.search, loading, authError, isDetailsOpen, fetchTaskDetails]);


  useEffect(() => { fetchData(); }, [id]);

  const renderContent = (content) => {
    if (!content) return null;
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => 
      part.startsWith('@') ? <span key={i} className="bg-blue-100 text-blue-600 px-1 rounded font-normal">{part}</span> : part
    );
  };
  const onDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'list') {
      const newLists = Array.from(lists);
      const [removed] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, removed);
      setLists(newLists);
      try {
        await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/lists/${draggableId}`, { position: destination.index }, {
          headers: { 'x-auth-token': sessionStorage.getItem('token') }
        });
      } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to move list" }); }
      return;
    }

    const newTasks = Array.from(tasks);
    const updatedTasks = newTasks.map(t => t._id === draggableId ? { ...t, list: destination.droppableId, position: destination.index } : t);
    setTasks(updatedTasks);

    try {
      const payload = boardData?.type === 'weekly' 
        ? { board: destination.droppableId, position: destination.index }
        : { list: destination.droppableId, position: destination.index };
        
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${draggableId}`, payload, { headers: { 'x-auth-token': sessionStorage.getItem('token') } });
    } catch (err) { fetchData(); }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const activeBoardId = boardData?._id || id;
      if (!activeBoardId) {
        toast({ variant: "destructive", title: "Error", description: "Board ID not found" });
        return;
      }
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/lists`, { title: newListTitle, boardId: activeBoardId, position: lists.length }, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      setNewListTitle(''); setIsListModalOpen(false); fetchData();
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to create list" }); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const activeBoardId = boardData?._id || id;
      let activeListId = newTaskData.listId || (lists.length > 0 ? lists[0]?._id : null);
      
      // If no lists exist on the board, automatically create a "Backlog" list first
      if (!activeListId && activeBoardId) {
        try {
          const listRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/lists`, { 
            title: "Backlog", 
            boardId: activeBoardId, 
            position: 0 
          }, {
            headers: { 'x-auth-token': sessionStorage.getItem('token') }
          });
          activeListId = listRes.data._id;
        } catch (listErr) {
          toast({ variant: "destructive", title: "Error", description: "Failed to initialize default list" });
          return;
        }
      }

      if (!activeListId || !activeBoardId) {
        toast({ variant: "destructive", title: "Error", description: "Target list or board not found" });
        return;
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/tasks`, { 
        ...newTaskData, 
        boardId: activeBoardId, 
        listId: activeListId,
        position: tasks.filter(t => t.list === activeListId).length 
      }, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      setNewTaskData({ title: '', listId: '', boardId: activeBoardId }); setIsTaskModalOpen(false); fetchData();
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to create task" }); }
  };

  const handleAddComment = async (taskId, text) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/comments`, { taskId, text }, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      fetchTaskDetails(taskId);
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to add comment" }); }
  };

  const handleUpdateComment = async (commentId, text) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/comments/${commentId}`, { text }, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      fetchTaskDetails(taskDetails.task._id);
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to update comment" }); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/boards/comments/${commentId}`, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      fetchTaskDetails(taskDetails.task._id);
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to delete comment" }); }
  };

  const handleDeleteTask = async (taskId) => {
    setConfirmDialog({ 
      isOpen: true, 
      type: 'DELETE_TASK', 
      data: taskId,
      title: "Delete Task",
      description: "Are you sure you want to delete this task? This action cannot be undone."
    });
  };

  const confirmDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskId}`, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      setIsDetailsOpen(false);
      setTaskDetails(null);
      fetchData();
      toast({ title: "Task Deleted" });
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to delete task" }); }
  };


  const handleUpdateChecklistItem = async (taskId, checklistId, itemId, updates) => {
    // Optimistic Update for UI responsiveness
    if (taskDetails?.task?._id === taskId) {
      setTaskDetails(prev => {
        const newTask = { ...prev.task };
        newTask.checklists = newTask.checklists.map(cl => {
          if (cl._id === checklistId) {
            cl.items = cl.items.map(item => {
              if (item._id === itemId) {
                // Handle different update types
                const updatedItem = { ...item, ...updates };
                // Map frontend names to backend if necessary for local display
                if (updates.assignedTo) {
                   const user = allUsers.find(u => u._id === (updates.assignedTo._id || updates.assignedTo));
                   updatedItem.assignedTo = user || item.assignedTo;
                }
                return updatedItem;
              }
              return item;
            });
          }
          return cl;
        });
        return { ...prev, task: newTask };
      });
    }

    try {
      if (updates.delete) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`, {
           headers: { 'x-auth-token': sessionStorage.getItem('token') }
        });
        toast({ title: "Item Deleted" });
      } else {
        await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskId}/checklists/update`, {
          checklistId, itemId, ...updates
        }, { headers: { 'x-auth-token': sessionStorage.getItem('token') } });
      }
      // Re-fetch only after a slight delay or if critical, 
      // but with optimistic update, the UI is already correct.
      fetchTaskDetails(taskId);
    } catch (err) { 
      toast({ variant: "destructive", title: "Error", description: "Failed to update item" }); 
      fetchTaskDetails(taskId); // Rollback on error
    }
  };

  const toggleChecklistItemStatus = (taskId, checklistId, itemId, currentStatus) => {
    handleUpdateChecklistItem(taskId, checklistId, itemId, { isCompleted: !currentStatus });
  };

  const handleAddSubTask = async (parentTaskId, title) => {
    try {
      const activeBoardId = boardData?._id || id;
      const activeListId = taskDetails?.task?.list?._id || taskDetails?.task?.list || lists[0]?._id;

      if (!activeListId || !activeBoardId) {
        toast({ variant: "destructive", title: "Error", description: "Board context missing" });
        return;
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/tasks`, { 
        title, 
        listId: activeListId, 
        boardId: activeBoardId, 
        parentTaskId 
      }, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      fetchTaskDetails(parentTaskId);
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to add subtask" }); }
  };

  const toggleTaskCompletion = async (taskId, current) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskId}`, { isCompleted: !current }, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      fetchTaskDetails(taskId);
      fetchData();
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Update failed" }); }
  };

  const handleUpdateTask = async (taskId, payload) => {
    // Comprehensive Optimistic Update
    if (taskDetails) {
      setTaskDetails(prev => {
        const isMainTask = prev.task._id === taskId;
        
        if (isMainTask) {
          const newTask = { ...prev.task, ...payload };
          // Map user IDs to objects for assignees if they changed
          if (payload.assignees) {
            newTask.assignees = allUsers.filter(u => payload.assignees.includes(u._id));
          }
          return { ...prev, task: newTask };
        } else {
          // Check if it's a subtask
          const subTasks = prev.subTasks.map(st => {
            if (st._id === taskId) {
              const newSt = { ...st, ...payload };
              if (payload.assignees) {
                newSt.assignees = allUsers.filter(u => payload.assignees.includes(u._id));
              }
              return newSt;
            }
            return st;
          });
          return { ...prev, subTasks };
        }
      });
    }

    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskId}`, payload, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      // Re-fetch to ensure sync, but optimistic update makes it feel instant
      fetchTaskDetails(taskDetails?.task?._id || taskId);
      fetchData();
      toast({ title: "Updated", description: "Task properties saved" });
    } catch (err) { 
      toast({ variant: "destructive", title: "Error", description: "Failed to update task" });
      fetchData();
      if (taskDetails?.task?._id === taskId) fetchTaskDetails(taskId);
    }
  };

  const handleUpdateBoard = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const currentBoardId = boardData?._id || id;
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/${currentBoardId}`, editBoardData, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Success", description: "Board updated successfully" });
      setIsEditBoardModalOpen(false);
      fetchData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update board" });
    }
  };

  const handleDeleteBoard = async () => {
    setConfirmDialog({ 
      isOpen: true, 
      type: 'DELETE_BOARD', 
      data: boardData?._id || id,
      title: "Delete Board",
      description: "ARE YOU SURE? This will permanently delete the board and all its tasks, comments, and history. This action cannot be undone."
    });
  };

  const confirmDeleteBoard = async (boardId) => {
    
    try {
      const token = sessionStorage.getItem('token');
      const boardIdToDelete = boardData?._id || id;
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/boards/${boardIdToDelete}`, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Board Deleted", description: "The board has been permanently removed." });
      navigate(`${isAdmin ? '/admin' : '/dashboard'}/kanban`);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete board" });
    }
  };

  const handleUpdateList = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/lists/${editingList._id}`, { title: editingList.title }, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      toast({ title: "Updated", description: "List name changed" });
      setIsEditListModalOpen(false);
      fetchData();
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to update list" }); }
  };

  const handleDeleteList = async (listId) => {
    setConfirmDialog({ 
      isOpen: true, 
      type: 'DELETE_LIST', 
      data: listId,
      title: "Delete List",
      description: "Delete this list and all its tasks?"
    });
  };

  const confirmDeleteList = async (listId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/boards/lists/${listId}`, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      toast({ title: "Deleted", description: "List removed" });
      setIsEditListModalOpen(false);
      fetchData();
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to delete list" }); }
  };

  const handleAddChecklist = async (taskId, name = "Checklist") => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskId}/checklists`, { name }, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      fetchTaskDetails(taskId);
      toast({ title: "Success", description: "Checklist added" });
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to add checklist" }); }
  };

  const handleAddChecklistItem = async (checklistId, text, assignedTo = null, dueDate = null) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskDetails.task._id}/checklists/items`, { 
        checklistId, 
        text,
        assignedTo,
        dueDate
      }, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      fetchTaskDetails(taskDetails.task._id);
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to add item" }); }
  };

  const handleToggleChecklistItem = async (checklistId, itemId, isCompleted) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskDetails.task._id}/checklists/toggle`, { checklistId, itemId, isCompleted }, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      fetchTaskDetails(taskDetails.task._id);
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to update item" }); }
  };

  const handleUpdateLabels = async (label) => {
    try {
      const currentLabels = taskDetails.task.labels || [];
      const exists = currentLabels.some(l => l.text === label.text);
      const newLabels = exists ? currentLabels.filter(l => l.text !== label.text) : [...currentLabels, label];
      
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskDetails.task._id}/labels`, { labels: newLabels }, {
        headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      fetchTaskDetails(taskDetails.task._id);
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to update labels" }); }
  };

  const handleRemoveChecklist = async (checklistId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${taskDetails.task._id}/checklists/${checklistId}`, {
         headers: { 'x-auth-token': sessionStorage.getItem('token') }
      });
      fetchTaskDetails(taskDetails.task._id);
      toast({ title: "Checklist Deleted", description: "The checklist has been removed." });
    } catch (err) { toast({ variant: "destructive", title: "Error", description: "Failed to delete checklist" }); }
  };


  if (loading) return <div className="h-full flex items-center justify-center bg-zinc-50"><Loader size="lg" color="red" /></div>;

  if (authError) {
     return (
       <div className="h-[calc(100vh-80px)] xl:h-screen w-full flex flex-col items-center justify-center bg-white p-8">
         <div className="max-w-md w-full bg-zinc-50 rounded-3xl p-10 border border-zinc-100 shadow-xl flex flex-col items-center text-center">
           <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
             <div className="text-4xl text-red-500">ðŸ”’</div>
           </div>
           <h2 className="text-2xl font-normal text-zinc-900 mb-3 tracking-tight">Access Restricted</h2>
           <p className="text-sm font-medium text-zinc-500 leading-relaxed max-w-[280px] mx-auto mb-8">
             You don't have permission to view this board. Please contact the administrator.
           </p>
           <Button 
             onClick={() => navigate('/dashboard')} 
             className="w-full h-14 rounded-2xl bg-black text-[#fffe01] font-normal tracking-widest text-[11px] uppercase shadow-2xl hover:-translate-y-1 hover:shadow-black/20 transition-all border-b-4 border-zinc-800 active:border-b-0 active:translate-y-0"
           >
             Return Home
           </Button>
         </div>
       </div>
     );
  }

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-zinc-50/50">
      <header className="px-6 py-4 flex items-center justify-between border-b bg-white shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`${isAdmin ? '/admin' : '/dashboard'}/kanban`)} className="p-2 h-auto text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl">
            <X className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-normal text-zinc-900 tracking-tight">{boardData?.title}</h1>
              {isAdmin && type && teamsForAdmin.length > 0 ? (
                <Select value={String(selectedTeamId || '').toLowerCase()} onValueChange={(val) => { setSelectedTeamId(String(val).toLowerCase()); setLoading(true); }}>
                  <SelectTrigger className="h-8 min-w-[180px] bg-zinc-50 border-zinc-200 text-[11px] font-normal tracking-widest rounded-xl hover:bg-zinc-100 transition-all shadow-sm px-4">
                    <SelectValue>
                      {teamsForAdmin.find(t => String(t._id).toLowerCase() === String(selectedTeamId).toLowerCase())?.name || boardData?.team?.name || 'Select Team'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-100 shadow-2xl">
                    {teamsForAdmin.map(team => (
                      <SelectItem key={team._id} value={String(team._id).toLowerCase()} className="text-[10px] font-normal uppercase tracking-widest">{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="bg-white text-zinc-400 border-zinc-200 font-normal text-[9px] tracking-[0.2em] px-2 py-1 rounded-lg border-2">
                  {boardData?.team?.name || 'STABLE NODE'}
                </Badge>
              )}
            </div>
            {boardData?.description && (
              <div className="text-zinc-400 text-[11px] font-normal uppercase tracking-wider flex items-center gap-2 opacity-80">
                <div className="w-1.5 h-1.5 rounded-full bg-[#fffe01]"></div>
                {boardData.description}
              </div>
            )}
          </div>
        </div>
      <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-2">
             {boardData?.members?.slice(0, 3).map((m, i) => (
               <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center text-[10px] font-normal shadow-sm" title={m?.name}>{m?.name?.charAt(0) || '?'}</div>
             ))}
            {boardData?.members?.length > 3 && <div className="w-9 h-9 rounded-full border-2 border-white bg-black text-[#fffe01] flex items-center justify-center text-[10px] font-normal shadow-sm">+{boardData.members.length - 3}</div>}
          </div>

          <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
            {boardData?.type !== 'weekly' && (
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-2xl h-10 px-6 text-xs gap-2 border-zinc-200 hover:bg-zinc-50 font-normal transition-all shadow-sm">
                  <UserPlus className="w-4 h-4 text-zinc-400" /> Share
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-[40px] bg-white p-8 custom-scrollbar">
              <DialogHeader>
                <DialogTitle className="text-3xl font-normal tracking-tighter text-zinc-900">Collaborators</DialogTitle>
                <DialogDescription className="font-medium text-zinc-500 text-sm">Manage who can access and edit this board.</DialogDescription>
              </DialogHeader>
              <div className="space-y-8 pt-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-normal tracking-widest text-zinc-400 ml-1">Current Access</h4>
                  <div className="space-y-3">
                    {boardData?.members?.map(m => {
                      const currentUserId = sessionStorage.getItem('userId');
                      const isBoardAdmin = boardData.admins.some(a => String(a._id || a) === String(m._id));
                      const isCurrentUserBoardAdmin = boardData.admins.some(a => String(a._id || a) === String(currentUserId));
                      const canRemove = true; // All members can manage participants as requested

                      return (
                        <div key={m._id} className="flex items-center gap-4 bg-zinc-50 p-4 rounded-3xl border border-zinc-100/50">
                          <div className="w-12 h-12 rounded-[20px] bg-white shadow-sm flex items-center justify-center text-zinc-900 font-normal border border-zinc-100">{m.name.charAt(0)}</div>
                          <div className="flex-1">
                             <p className="text-sm font-normal text-zinc-900">{m.name}</p>
                             <p className="text-[10px] text-zinc-400 font-normal uppercase tracking-tight">{m.email}</p>
                          </div>
                          {isBoardAdmin && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[8px] font-normal tracking-widest">ADMIN</Badge>}
                          
                          {canRemove && String(m._id) !== String(currentUserId) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveMember(m._id)}
                              className="h-9 w-9 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-2xl transition-all"
                              title="Remove Member"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-4 pt-8 border-t border-zinc-100">
                  <h4 className="text-[10px] uppercase font-normal tracking-widest text-zinc-400 ml-1">Add New Members</h4>
                  <div className="space-y-4">
                     <div className="relative group/search">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within/search:text-black transition-colors" />
                       <Input 
                        placeholder={isAdmin ? "Search all members..." : "Search team members..."} 
                        value={userSearch} 
                        onChange={e => setUserSearch(e.target.value)}
                        className="rounded-[20px] h-12 pl-12 border-zinc-100 bg-zinc-50 focus:bg-white transition-all text-sm font-medium"
                       />
                     </div>
                     <div className="space-y-2">
                       {Array.isArray(allUsers) ? (
                         allUsers
                          .filter(u => {
                            const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
                            const notInBoard = !boardData?.members?.some(m => m._id === u._id);
                            
                            if (isAdmin) return matchesSearch && notInBoard;
                            
                            // If employee: Must be in the same team as the board
                            const isInSameTeam = u.teams?.some(t => String(t._id || t) === String(boardData?.team?._id || boardData?.team));
                            return matchesSearch && notInBoard && isInSameTeam;
                          })
                          .map(u => (
                            <div key={u._id} className="flex items-center justify-between p-4 rounded-[24px] hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all group/user">
                               <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-sm font-normal shadow-sm group-hover/user:bg-black group-hover/user:text-white transition-all">{u.name.charAt(0)}</div>
                                 <div className="flex flex-col">
                                   <span className="text-sm font-normal text-zinc-900 leading-none mb-1">{u.name}</span>
                                   <span className="text-[10px] text-zinc-400 font-medium">{u.email}</span>
                                 </div>
                               </div>
                               <Button size="sm" onClick={() => handleAddMember(u._id)} className="h-9 rounded-xl bg-black text-[#fffe01] hover:bg-zinc-800 px-6 font-normal text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">INVITE</Button>
                            </div>
                          ))
                       ) : (
                         <div className="text-center py-4 text-xs font-normal text-zinc-400">Loading members...</div>
                       )}
                       {userSearch && Array.isArray(allUsers) && allUsers.filter(u => {
                          const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase());
                          const notInBoard = !boardData?.members?.some(m => m._id === u._id);
                          if (isAdmin) return matchesSearch && notInBoard;
                          const isInSameTeam = u.teams?.some(t => String(t._id || t) === String(boardData?.team?._id || boardData?.team));
                          return matchesSearch && notInBoard && isInSameTeam;
                       }).length === 0 && (
                          <p className="text-center py-8 text-xs font-normal text-zinc-400 italic">No matching members found...</p>
                       )}
                     </div>
                  </div>
                </div>
              </div>
             </DialogContent>
          </Dialog>

          <Dialog open={isEditBoardModalOpen} onOpenChange={setIsEditBoardModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-2xl h-10 px-4 text-xs gap-2 border-zinc-200 hover:bg-zinc-50 font-normal transition-all shadow-sm">
                <Settings className="w-4 h-4 text-zinc-400" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-[32px] bg-white p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-normal text-zinc-900">Board Settings</DialogTitle>
                <DialogDescription className="font-medium text-zinc-500">Edit board details or manage its lifecycle.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateBoard} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-normal uppercase tracking-wider text-zinc-400 ml-1">Board Title</Label>
                  <Input 
                    placeholder="Board name..." 
                    value={editBoardData.title} 
                    onChange={e => setEditBoardData({...editBoardData, title: e.target.value})}
                    className="rounded-[20px] h-14 border-zinc-200 bg-zinc-50 focus:bg-white transition-all text-base font-normal px-5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-normal uppercase tracking-wider text-zinc-400 ml-1">Description</Label>
                  <Textarea 
                    placeholder="What is this board for?" 
                    value={editBoardData.description} 
                    onChange={e => setEditBoardData({...editBoardData, description: e.target.value})}
                    className="rounded-[20px] min-h-[120px] border-zinc-200 bg-zinc-50 focus:bg-white transition-all text-sm font-medium p-5"
                  />
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <Button type="submit" className="w-full bg-black text-[#fffe01] rounded-2xl h-14 font-normal text-sm tracking-widest shadow-xl active:scale-95 transition-all">SAVE CHANGES</Button>
                  {boardData?.type === 'regular' && (
                    <Button 
                      type="button" 
                      onClick={handleDeleteBoard}
                      variant="ghost" 
                      className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl h-14 font-normal text-xs tracking-widest transition-all"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> DELETE BOARD
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>

           {boardData?.type !== 'weekly' && (
             <Button size="sm" onClick={() => setIsListModalOpen(true)} className="bg-black text-[#fffe01] hover:bg-zinc-800 rounded-2xl h-10 px-6 text-xs font-normal shadow-xl transition-all active:scale-95">
               <Plus className="w-4 h-4 mr-1.5" /> Add List
             </Button>
           )}
        </div>
      </header>

      <Tabs 
        key={`${id}-${type}-${selectedTeamId}`}
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-6 py-2.5 border-b border-zinc-100 bg-white/50 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between overflow-x-auto scrollbar-hide">
          <TabsList className="bg-zinc-100/50 p-1 rounded-xl border border-zinc-200/50 shadow-sm">
            {boardData?.type !== 'weekly' && (
              <TabsTrigger value="backlog" className="rounded-lg px-5 py-2 h-9 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-normal uppercase text-[9px] tracking-widest transition-all">Backlog</TabsTrigger>
            )}
            <TabsTrigger value="sprint" className="rounded-lg px-5 py-2 h-9 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-normal uppercase text-[9px] tracking-widest transition-all">
              {boardData?.type === 'weekly' ? 'Weekly Stream' : 'Sprint'}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-lg px-5 py-2 h-9 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-normal uppercase text-[9px] tracking-widest transition-all">Timeline</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg px-5 py-2 h-9 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-normal uppercase text-[9px] tracking-widest transition-all">Analytics</TabsTrigger>
            <TabsTrigger value="team" className="rounded-lg px-5 py-2 h-9 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-normal uppercase text-[9px] tracking-widest transition-all">Team</TabsTrigger>
            <TabsTrigger value="sop" className="rounded-lg px-5 py-2 h-9 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-normal uppercase text-[9px] tracking-widest transition-all">SOP</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
             <div className="relative group/search">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-black transition-colors" />
                <Input 
                  placeholder="Search nodes..." 
                  className="pl-9 h-10 w-64 bg-zinc-100/50 border-zinc-200/50 focus:bg-white rounded-xl focus:ring-2 focus:ring-[#fffe01]/20 transition-all text-xs font-semibold shadow-sm"
                />
             </div>
             {activeTab === 'sprint' && (
               <Button 
                  onClick={() => {
                    setNewTaskData(prev => ({ ...prev, listId: lists[0]?._id || '' }));
                    setIsTaskModalOpen(true);
                  }} 
                  className="bg-black text-[#fffe01] rounded-xl h-10 px-4 text-xs font-normal tracking-widest shadow-lg active:scale-95 transition-all"
               >
                 <Plus className="w-4 h-4 mr-2" /> ADD VECTOR
               </Button>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <TabsContent value="backlog" className="flex-1 overflow-y-auto p-6 outline-none">
             <div className="h-full flex flex-col">
               <div className="flex items-center justify-between mb-10">
                  <div>
                     <h2 className="text-4xl font-normal tracking-tight text-zinc-900 mb-2">Backlog <span className="text-zinc-300">Quarantine</span></h2>
                     <p className="text-zinc-500 font-medium tracking-tight">Phase 0: Operational Analysis & Scheduling</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setNewTaskData(prev => ({ ...prev, listId: lists[0]?._id }));
                      setIsTaskModalOpen(true);
                    }}
                    className="bg-black text-[#fffe01] hover:bg-zinc-800 rounded-2xl h-14 px-8 font-normal uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all"
                  >
                    <Plus className="w-5 h-5 mr-3" /> Initialize Vector
                  </Button>
               </div>

               <div className="bg-white rounded-[3rem] p-4 shadow-xl border border-zinc-100 flex-1 min-h-[400px] overflow-y-auto custom-scrollbar">
                  {backlogTasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-20">
                      <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6">
                         <Layout className="w-10 h-10 text-zinc-200" />
                      </div>
                      <p className="text-zinc-400 font-normal uppercase tracking-widest text-xs">No pending operations in queue</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {backlogTasks.map(task => (
                        <div 
                           key={task._id} 
                           onClick={() => fetchTaskDetails(task._id)}
                           className="group flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-100 cursor-pointer"
                        >
                           <div className="flex items-center gap-4 flex-1">
                              <div className={`w-2.5 h-2.5 rounded-full ${task.priority === 'Urgent' ? 'bg-red-500' : task.priority === 'High' ? 'bg-orange-500' : 'bg-zinc-200'}`}></div>
                              <div className="flex-1">
                                 <h3 className="text-lg font-normal text-zinc-900 mb-0.5 group-hover:text-[#d30614] transition-colors">{task.title}</h3>
                                 <div className="flex items-center gap-4 text-xs font-normal text-zinc-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> EST: {task.estimatedTime || 0}H</span>
                                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {task.assignees?.length || 0} Nodes</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <Button 
                                variant="ghost" 
                                onClick={() => fetchTaskDetails(task._id)}
                                className="h-12 w-12 rounded-2xl hover:bg-white hover:shadow-md transition-all text-zinc-400 hover:text-black"
                              >
                                 <Edit className="w-5 h-5" />
                              </Button>
                              <Button 
                                onClick={() => handleMoveToSprint(task._id)}
                                className="bg-black text-[#fffe01] hover:bg-[#fffe01] hover:text-black rounded-2xl h-12 px-6 font-normal uppercase tracking-widest text-[10px] shadow-sm active:scale-95 transition-all flex items-center gap-2"
                              >
                                 <Plus className="w-4 h-4" /> Deploy to Sprint
                              </Button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
             </div>
          </TabsContent>

          <TabsContent value="sprint" className="flex-1 overflow-hidden flex flex-col outline-none">
            <div className="flex-1 overflow-x-auto p-4 scrollbar-style">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" type="list" direction="horizontal">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex gap-6 h-full items-start">
                {Array.isArray(lists) && lists.map((list, index) => (
                  <Draggable key={list._id} draggableId={list._id} index={index}>
                    {(provided) => (
                      <div {...provided.draggableProps} ref={provided.innerRef} className="w-[300px] shrink-0 bg-zinc-50/50 backdrop-blur-md rounded-[20px] flex flex-col max-h-full shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200/60">
                        <div {...provided.dragHandleProps} className="px-5 py-4 flex items-center justify-between border-b border-zinc-100/50">
                          <h3 className="font-normal text-slate-800 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                            {boardData?.type === 'weekly' && <Layout className="w-3.5 h-3.5 text-slate-400" />}
                            {list.title}
                            <span className="h-4.5 min-w-[20px] px-1.5 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 text-[9px] font-normal border border-slate-200/50">
                              {tasksByList[list._id]?.length || 0}
                            </span>
                          </h3>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setEditingList(list); setIsEditListModalOpen(true); }}
                            className="h-7 w-7 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Droppable droppableId={list._id} type="task">
                          {(provided, snapshot) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 overflow-y-auto px-2.5 pb-2.5 pt-4 min-h-[100px] space-y-4 transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-slate-200/30' : ''}`}>
                              {tasksByList[list._id]?.map((task, idx) => (
                                <KanbanCard key={task._id} task={task} index={idx} onClick={() => fetchTaskDetails(task._id)} />
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <Button onClick={()=>setIsListModalOpen(true)} className="h-14 w-[300px] shrink-0 bg-white/40 backdrop-blur-sm border border-dashed border-slate-300 rounded-[20px] text-slate-400 hover:text-slate-900 hover:border-slate-400 hover:bg-white/80 transition-all text-[11px] uppercase tracking-widest font-normal flex gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> Add another list
                </Button>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </TabsContent>

          <TabsContent value="timeline" className="flex-1 overflow-hidden p-0 outline-none">
             <div className="h-full flex flex-col p-6 lg:p-10">
               
               <TimelineEngine 
                 tasks={isAdmin ? (selectedAnalyticsUser && selectedAnalyticsUser !== 'all' ? tasks.filter(t => t.assignees?.some(a => (a._id || a) === selectedAnalyticsUser)) : tasks) : tasks.filter(t => t.assignees?.some(a => (a._id || a) === sessionStorage.getItem('userId')))} 
                 listData={lists} 
               />
             </div>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-y-auto p-10 outline-none">
             <div className="h-full flex flex-col space-y-10">
               <div className="flex items-center justify-between">
                  <div>
                     <h2 className="text-4xl font-normal tracking-tight text-zinc-900 mb-2">Performance <span className="text-zinc-300">Analytics</span></h2>
                     <p className="text-zinc-500 font-medium tracking-tight">Real-time Operational Efficiency Tracking</p>
                  </div>
                  <div className="flex items-center gap-3 bg-zinc-50 p-2 rounded-2xl border border-zinc-100">
                      {isAdmin && (
                        <div className="mr-2">
                           <Select value={selectedAnalyticsUser || 'all'} onValueChange={setSelectedAnalyticsUser}>
                             <SelectTrigger className="w-[180px] h-10 rounded-xl bg-white border-zinc-200 text-xs font-normal">
                               <SelectValue placeholder="All Members" />
                             </SelectTrigger>
                             <SelectContent className="rounded-xl border-zinc-100">
                               <SelectItem value="all">All Members</SelectItem>
                               {deduplicatedMembers.map(m => (
                                 <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                        </div>
                      )}
                      <div className="px-4 py-2 bg-white rounded-xl shadow-sm">
                         <span className="text-[10px] font-normal text-zinc-400 uppercase tracking-widest block">Health Score</span>
                         <span className="text-xl font-normal text-zinc-900">{analyticsData.total ? Math.round((analyticsData.completed / analyticsData.total) * 100) : 0}%</span>
                      </div>
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   {[
                     { label: 'Total Vectors', value: analyticsData.total, icon: Layout, color: 'text-zinc-900', bg: 'bg-zinc-50' },
                     { label: 'Completed', value: analyticsData.completed, icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                     { label: 'Active Sprint', value: analyticsData.inSprint, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
                     { label: 'Blocked Nodes', value: analyticsData.blocked, icon: Activity, color: 'text-red-600', bg: 'bg-red-50' }
                   ].map((stat, i) => (
                     <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-zinc-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                           <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                              <stat.icon className="w-6 h-6" />
                           </div>
                           <TrendingUp className="w-4 h-4 text-zinc-200" />
                        </div>
                        <span className="text-[10px] font-normal text-zinc-400 uppercase tracking-[0.2em]">{stat.label}</span>
                        <h4 className="text-4xl font-normal text-zinc-900 mt-2 tracking-tighter">{stat.value}</h4>
                     </div>
                   ))}
                </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-zinc-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-bl-full -z-0 group-hover:bg-indigo-50/50 transition-colors"></div>
                      <h3 className="text-xl font-normal text-zinc-900 mb-8 flex items-center gap-3 relative z-10">
                         <Target className="w-6 h-6 text-indigo-500" /> Vector Distribution
                      </h3>
                      <div className="h-[300px] w-full relative z-10">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.listStats}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#a1a1aa'}} />
                               <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#a1a1aa'}} />
                               <RechartsTooltip 
                                 cursor={{fill: '#f8f8f8'}} 
                                 contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '16px'}}
                               />
                               <Bar dataKey="tasks" fill="#18181b" radius={[10, 10, 0, 0]} barSize={32} />
                               <Bar dataKey="completed" fill="#10b981" radius={[10, 10, 0, 0]} barSize={32} />
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-zinc-100">
                     <h3 className="text-xl font-normal text-zinc-900 mb-8 flex items-center gap-3">
                        <Users className="w-5 h-5 text-emerald-500" /> Member Execution Flux
                     </h3>
                     <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={analyticsData.memberStats}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#a1a1aa'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#a1a1aa'}} />
                              <RechartsTooltip 
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                              />
                              <Line type="monotone" dataKey="total" stroke="#000000" strokeWidth={4} dot={{r: 6, fill: '#000000'}} activeDot={{r: 8}} />
                              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={4} dot={{r: 6, fill: '#10b981'}} />
                           </LineChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>
             </div>
          </TabsContent>

          <TabsContent value="team" className="flex-1 overflow-y-auto p-10 outline-none">
             <div className="h-full flex flex-col">
               <div className="flex items-center justify-between mb-10">
                  <div>
                     <h2 className="text-4xl font-normal tracking-tight text-zinc-900 mb-2">Team <span className="text-zinc-300">Nodes</span></h2>
                     <p className="text-zinc-500 font-medium tracking-tight">Active Operation Contributors</p>
                  </div>
               </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {deduplicatedMembers.map((m, i) => {
                    const mId = String(m._id || m);
                    
                    // Task assignments
                    const memberTasks = tasks.filter(t => t.assignees?.some(a => String(a._id || a) === mId));
                    
                    // Checklist item assignments
                    const memberChecklistItems = tasks.flatMap(t => 
                      t.checklists?.flatMap(cl => 
                        cl.items?.filter(item => String(item.assignedTo?._id || item.assignedTo) === mId) || []
                      ) || []
                    );

                    const total = memberTasks.length + memberChecklistItems.length;
                    const completed = memberTasks.filter(t => t.isCompleted).length + 
                                     memberChecklistItems.filter(item => item.isCompleted).length;
                    const blocked = memberTasks.filter(t => t.blocker).length;
                    const efficiency = total ? Math.round((completed / total) * 100) : 0;

                    return (
                    <div key={m._id} className="bg-white p-10 rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-zinc-100 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
                       <div className="absolute top-0 right-0 w-48 h-48 bg-zinc-50 rounded-bl-[100%] transition-all group-hover:bg-[#fffe01]/20 -z-10 group-hover:scale-110 duration-700"></div>
                       
                       <div className="flex items-center gap-6 mb-10">
                          <div className="w-20 h-20 rounded-[2.2rem] bg-zinc-900 shadow-2xl relative overflow-hidden flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500">
                             <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                             <span className="text-3xl font-normal text-[#fffe01] relative z-10 uppercase">{m.name.charAt(0)}</span>
                          </div>
                          <div>
                             <h4 className="text-2xl font-normal text-zinc-900 tracking-tight leading-none mb-2">{m.name}</h4>
                             <Badge className="bg-zinc-50 text-zinc-400 border-zinc-100 font-normal text-[9px] tracking-widest px-3">ACTIVE AGENT</Badge>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-zinc-50 p-6 rounded-[2rem] text-center border border-zinc-100/50">
                             <span className="text-[10px] font-normal text-zinc-400 uppercase tracking-widest block mb-2">Deployed</span>
                             <span className="text-3xl font-normal text-zinc-900">{total}</span>
                          </div>
                          <div className="bg-emerald-50 p-6 rounded-[2rem] text-center border border-emerald-100/50">
                             <span className="text-[10px] font-normal text-emerald-400 uppercase tracking-widest block mb-2">Resolved</span>
                             <span className="text-3xl font-normal text-emerald-600">{completed}</span>
                          </div>
                       </div>

                       <div className="mt-8">
                          <div className="flex items-center justify-between px-2 mb-3">
                             <span className="text-[10px] font-normal text-zinc-400 uppercase tracking-widest">Efficiency</span>
                             <span className="text-[10px] font-normal text-emerald-600 uppercase tracking-widest">{efficiency}%</span>
                          </div>
                          <div className="h-3 w-full bg-zinc-50 rounded-full overflow-hidden p-1 shadow-inner">
                             <div 
                               className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                               style={{ width: `${efficiency}%` }}
                             ></div>
                          </div>
                       </div>

                       {blocked > 0 && (
                         <div className="mt-6">
                            <Badge className="w-full justify-center bg-red-500 text-white border-none py-3 rounded-2xl text-[10px] font-normal tracking-widest shadow-lg shadow-red-500/20">
                               {blocked} BLOCKED VECTORS DETECTED
                            </Badge>
                         </div>
                       )}
                    </div>
                  )})}
                </div>
              </div>
           </TabsContent>

           <TabsContent value="sop" className="flex-1 overflow-y-auto p-10 outline-none custom-scrollbar">
              <SOPTab boardData={boardData} onUpdate={fetchData} />
           </TabsContent>
        </div>
      </Tabs>
      
      <Dialog open={isEditListModalOpen} onOpenChange={setIsEditListModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-[32px] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal">List Settings</DialogTitle>
            <DialogDescription className="sr-only">Edit list name or delete list.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateList} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-normal uppercase tracking-wider text-zinc-400">List Title</Label>
              <Input 
                placeholder="List name..." 
                value={editingList?.title || ''} 
                onChange={(e) => setEditingList({ ...editingList, title: e.target.value })} 
                required 
                className="rounded-2xl h-12 border-zinc-200" 
              />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full bg-black text-[#fffe01] rounded-2xl h-12 font-normal shadow-lg">Save Changes</Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => handleDeleteList(editingList?._id)}
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl h-12 font-normal"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete List
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
         <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-[32px] bg-white p-8">
            <DialogHeader>
               <DialogTitle className="text-2xl font-normal text-zinc-900">New Card</DialogTitle>
               <DialogDescription className="font-medium text-zinc-500">Initialize a new node onto your board matrix.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-6 pt-4">
               <div className="space-y-2">
                  <Label className="text-[10px] font-normal uppercase tracking-widest text-zinc-400 ml-1">Title</Label>
                  <Input 
                     placeholder="Task title..." 
                     value={newTaskData.title} 
                     onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })} 
                     required 
                     className="rounded-2xl h-14 border-zinc-200 bg-zinc-50 focus:bg-white transition-all text-base font-normal px-5" 
                  />
               </div>

               {lists.length > 1 && (
                  <div className="space-y-2">
                     <Label className="text-[10px] font-normal uppercase tracking-widest text-zinc-400 ml-1">Target List</Label>
                     <div className="relative group/select">
                        <select 
                           value={newTaskData.listId} 
                           onChange={(e) => setNewTaskData({ ...newTaskData, listId: e.target.value })}
                           className="w-full rounded-2xl h-14 border-2 border-zinc-100 bg-zinc-50 focus:bg-white focus:border-zinc-900 transition-all text-sm font-normal px-5 appearance-none cursor-pointer"
                        >
                           {lists.map(l => (
                              <option key={l._id} value={l._id}>{l.title}</option>
                           ))}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none group-focus-within:text-black transition-colors" />
                     </div>
                  </div>
               )}

               <div className="space-y-2">
                  <Label className="text-[10px] font-normal uppercase tracking-widest text-zinc-400 ml-1">Description</Label>
                  <Textarea 
                     placeholder="Details..." 
                     value={newTaskData.description || ''} 
                     onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })} 
                     className="rounded-2xl min-h-[120px] border-zinc-200 bg-zinc-50 focus:bg-white transition-all text-sm font-medium p-5" 
                  />
               </div>
               
               <DialogFooter className="pt-2">
                  <Button type="submit" className="w-full bg-black text-[#fffe01] rounded-2xl h-14 font-normal text-sm tracking-widest shadow-xl active:scale-95 transition-all">CREATE VECTOR</Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      {isDetailsOpen && taskDetails && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center"><Loader size="lg" color="red" /></div>}>
          <TaskDetailsModal 
            isOpen={isDetailsOpen}
            onClose={() => { setIsDetailsOpen(false); setTaskDetails(null); }}
            taskDetails={taskDetails}
            boardData={boardData}
            currentBoardId={boardData?._id}
            lists={lists}
            isAdmin={isAdmin}
            handleUpdateTask={handleUpdateTask}
            handleDeleteTask={handleDeleteTask}
            onRefresh={fetchData}
            handleAddComment={handleAddComment}
            handleUpdateComment={handleUpdateComment}
            handleDeleteComment={handleDeleteComment}
            handleUpdateLabels={handleUpdateLabels}
            handleAddChecklist={handleAddChecklist}
            handleAddChecklistItem={handleAddChecklistItem}
            handleUpdateChecklistItem={handleUpdateChecklistItem}
            handleRemoveChecklist={handleRemoveChecklist}
            handleAddSubTask={handleAddSubTask}
            getTimeAgo={getTimeAgo}

          />
        </Suspense>
      )}
      
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={() => {
          if (confirmDialog.type === 'REMOVE_MEMBER') confirmRemoveMember(confirmDialog.data);
          if (confirmDialog.type === 'DELETE_TASK') confirmDeleteTask(confirmDialog.data);
          if (confirmDialog.type === 'DELETE_BOARD') confirmDeleteBoard(confirmDialog.data);
          if (confirmDialog.type === 'DELETE_LIST') confirmDeleteList(confirmDialog.data);
        }}
        title={confirmDialog.title}
        description={confirmDialog.description}
      />
    </div>
  );
};

export default KanbanBoard;

