import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Plus, Users, Search, MoreHorizontal, Calendar, 
  MessageSquare, CheckSquare, Clock, Layout, X, UserPlus,
  Settings, Trash2, Edit
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
import ConfirmDialog from "@/components/ui/ConfirmDialog";



const KanbanBoard = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [boardData, setBoardData] = useState(null);
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({ title: '', listId: '', boardId: id });
  
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

  const userRole = sessionStorage.getItem('userRole');
  const isAdmin = userRole === 'admin' || userRole === 'subadmin';

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
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/teams`, {
            headers: { 'x-auth-token': token }
          });
          const teamsArray = res.data.teams || (Array.isArray(res.data) ? res.data : []);
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
      setSelectedTeamId(boardData.team._id);
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
      part.startsWith('@') ? <span key={i} className="bg-blue-100 text-blue-600 px-1 rounded font-bold">{part}</span> : part
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
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${draggableId}`, {
        list: destination.droppableId,
        position: destination.index
      }, { headers: { 'x-auth-token': sessionStorage.getItem('token') } });
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
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/tasks`, { ...newTaskData, boardId: activeBoardId, position: tasks.filter(t => t.list === newTaskData.listId).length }, {
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
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/tasks`, { title, listId: taskDetails.task.list, boardId: id, parentTaskId }, {
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

  // Memoize tasks grouped by list
  const tasksByList = useMemo(() => {
    const map = {};
    if (!Array.isArray(lists) || !Array.isArray(tasks)) return map;
    lists.forEach(l => { map[l._id] = []; });
    tasks.forEach(t => {
      const listId = t.list?._id || t.list;
      if (!t.parentTask && map[listId]) {
        map[listId].push(t);
      }
    });
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => (a.position || 0) - (b.position || 0));
    });
    return map;
  }, [tasks, lists]);

  if (loading) return <div className="h-full flex items-center justify-center bg-zinc-50"><Loader size="lg" color="red" /></div>;

  if (authError) {
     return (
       <div className="h-[calc(100vh-80px)] xl:h-screen w-full flex flex-col items-center justify-center bg-white p-8">
         <div className="max-w-md w-full bg-zinc-50 rounded-3xl p-10 border border-zinc-100 shadow-xl flex flex-col items-center text-center">
           <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
             <div className="text-4xl text-red-500">ðŸ”’</div>
           </div>
           <h2 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">Access Restricted</h2>
           <p className="text-sm font-medium text-zinc-500 leading-relaxed max-w-[280px] mx-auto mb-8">
             You don't have permission to view this board. Please contact the administrator.
           </p>
           <Button 
             onClick={() => navigate('/dashboard')} 
             className="w-full h-14 rounded-2xl bg-black text-[#fffe01] font-black tracking-widest text-[11px] uppercase shadow-2xl hover:-translate-y-1 hover:shadow-black/20 transition-all border-b-4 border-zinc-800 active:border-b-0 active:translate-y-0"
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
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{boardData?.title}</h1>
              {isAdmin && type ? (
                <select 
                  className="bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] uppercase font-medium px-2 py-1 outline-none focus:ring-1 focus:ring-yellow-400"
                  value={selectedTeamId || ''}
                  onChange={(e) => {
                    setSelectedTeamId(e.target.value);
                    setLoading(true);
                  }}
                >
                  {teamsForAdmin.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              ) : (
                <Badge variant="outline" className="text-[10px] uppercase font-medium bg-zinc-50">{boardData?.team?.name}</Badge>
              )}
            </div>
            <div className="text-zinc-500 text-xs font-normal"><MarkdownRenderer content={boardData?.description} /></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-2">
             {boardData?.members?.slice(0, 3).map((m, i) => (
               <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center text-[10px] font-bold shadow-sm" title={m?.name}>{m?.name?.charAt(0) || '?'}</div>
             ))}
            {boardData?.members?.length > 3 && <div className="w-9 h-9 rounded-full border-2 border-white bg-black text-[#fffe01] flex items-center justify-center text-[10px] font-bold shadow-sm">+{boardData.members.length - 3}</div>}
          </div>

          <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-2xl h-10 px-6 text-xs gap-2 border-zinc-200 hover:bg-zinc-50 font-bold transition-all shadow-sm">
                <UserPlus className="w-4 h-4 text-zinc-400" /> Share
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-[40px] bg-white p-8 custom-scrollbar">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tighter text-zinc-900">Collaborators</DialogTitle>
                <DialogDescription className="font-medium text-zinc-500 text-sm">Manage who can access and edit this board.</DialogDescription>
              </DialogHeader>
              <div className="space-y-8 pt-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Current Access</h4>
                  <div className="space-y-3">
                    {boardData?.members?.map(m => {
                      const currentUserId = sessionStorage.getItem('userId');
                      const isBoardAdmin = boardData.admins.some(a => String(a._id || a) === String(m._id));
                      const isCurrentUserBoardAdmin = boardData.admins.some(a => String(a._id || a) === String(currentUserId));
                      const canRemove = true; // All members can manage participants as requested

                      return (
                        <div key={m._id} className="flex items-center gap-4 bg-zinc-50 p-4 rounded-3xl border border-zinc-100/50">
                          <div className="w-12 h-12 rounded-[20px] bg-white shadow-sm flex items-center justify-center text-zinc-900 font-black border border-zinc-100">{m.name.charAt(0)}</div>
                          <div className="flex-1">
                             <p className="text-sm font-black text-zinc-900">{m.name}</p>
                             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{m.email}</p>
                          </div>
                          {isBoardAdmin && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[8px] font-black tracking-widest">ADMIN</Badge>}
                          
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
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Add New Members</h4>
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
                                 <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-sm font-bold shadow-sm group-hover/user:bg-black group-hover/user:text-white transition-all">{u.name.charAt(0)}</div>
                                 <div className="flex flex-col">
                                   <span className="text-sm font-black text-zinc-900 leading-none mb-1">{u.name}</span>
                                   <span className="text-[10px] text-zinc-400 font-medium">{u.email}</span>
                                 </div>
                               </div>
                               <Button size="sm" onClick={() => handleAddMember(u._id)} className="h-9 rounded-xl bg-black text-[#fffe01] hover:bg-zinc-800 px-6 font-black text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">INVITE</Button>
                            </div>
                          ))
                       ) : (
                         <div className="text-center py-4 text-xs font-bold text-zinc-400">Loading members...</div>
                       )}
                       {userSearch && Array.isArray(allUsers) && allUsers.filter(u => {
                          const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase());
                          const notInBoard = !boardData?.members?.some(m => m._id === u._id);
                          if (isAdmin) return matchesSearch && notInBoard;
                          const isInSameTeam = u.teams?.some(t => String(t._id || t) === String(boardData?.team?._id || boardData?.team));
                          return matchesSearch && notInBoard && isInSameTeam;
                       }).length === 0 && (
                          <p className="text-center py-8 text-xs font-bold text-zinc-400 italic">No matching members found...</p>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditBoardModalOpen} onOpenChange={setIsEditBoardModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-2xl h-10 px-4 text-xs gap-2 border-zinc-200 hover:bg-zinc-50 font-bold transition-all shadow-sm">
                <Settings className="w-4 h-4 text-zinc-400" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-[32px] bg-white p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-zinc-900">Board Settings</DialogTitle>
                <DialogDescription className="font-medium text-zinc-500">Edit board details or manage its lifecycle.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateBoard} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Board Title</Label>
                  <Input 
                    placeholder="Board name..." 
                    value={editBoardData.title} 
                    onChange={e => setEditBoardData({...editBoardData, title: e.target.value})}
                    className="rounded-[20px] h-14 border-zinc-200 bg-zinc-50 focus:bg-white transition-all text-base font-bold px-5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Description</Label>
                  <Textarea 
                    placeholder="What is this board for?" 
                    value={editBoardData.description} 
                    onChange={e => setEditBoardData({...editBoardData, description: e.target.value})}
                    className="rounded-[20px] min-h-[120px] border-zinc-200 bg-zinc-50 focus:bg-white transition-all text-sm font-medium p-5"
                  />
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <Button type="submit" className="w-full bg-black text-[#fffe01] rounded-2xl h-14 font-black text-sm tracking-widest shadow-xl active:scale-95 transition-all">SAVE CHANGES</Button>
                  {boardData?.type === 'regular' && (
                    <Button 
                      type="button" 
                      onClick={handleDeleteBoard}
                      variant="ghost" 
                      className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl h-14 font-black text-xs tracking-widest transition-all"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> DELETE BOARD
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button size="sm" onClick={() => setIsListModalOpen(true)} className="bg-black text-[#fffe01] hover:bg-zinc-800 rounded-2xl h-10 px-6 text-xs font-bold shadow-xl transition-all active:scale-95">
            <Plus className="w-4 h-4 mr-1.5" /> Add List
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" type="list" direction="horizontal">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex gap-6 h-full items-start">
                {Array.isArray(lists) && lists.map((list, index) => (
                  <Draggable key={list._id} draggableId={list._id} index={index}>
                    {(provided) => (
                      <div {...provided.draggableProps} ref={provided.innerRef} className="w-80 shrink-0 bg-zinc-100/80 backdrop-blur-sm rounded-[32px] flex flex-col max-h-full shadow-sm border border-zinc-200/50">
                        <div {...provided.dragHandleProps} className="px-6 py-5 flex items-center justify-between">
                          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                            {list.title}
                            <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-zinc-200 text-zinc-500 text-[10px] font-bold">
                              {tasksByList[list._id]?.length || 0}
                            </span>
                          </h3>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setEditingList(list); setIsEditListModalOpen(true); }}
                            className="h-8 w-8 text-zinc-400 hover:text-black hover:bg-white rounded-xl transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        <Droppable droppableId={list._id} type="task">
                          {(provided, snapshot) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 overflow-y-auto px-3 pb-3 min-h-[50px] space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-zinc-200/40' : ''}`}>
                              {tasksByList[list._id]?.map((task, idx) => (
                                <KanbanCard key={task._id} task={task} index={idx} onClick={() => fetchTaskDetails(task._id)} />
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                        <div className="px-3 pb-4">
                          <Button variant="ghost" onClick={() => { setNewTaskData({ ...newTaskData, listId: list._id }); setIsTaskModalOpen(true); }} className="w-full justify-start text-zinc-500 hover:text-black hover:bg-white rounded-[20px] h-11 px-4 text-xs font-semibold gap-2 border border-dashed border-zinc-200 transition-all hover:border-zinc-300">
                            <Plus className="w-4 h-4" /> Add a card
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <Button onClick={()=>setIsListModalOpen(true)} className="h-14 w-80 shrink-0 bg-white/50 backdrop-blur-sm border-2 border-dashed border-zinc-200 rounded-[32px] text-zinc-500 hover:text-black hover:border-zinc-400 hover:bg-white transition-all text-sm font-bold flex gap-2">
                  <Plus className="w-5 h-5" /> Add another list
                </Button>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <Dialog open={isListModalOpen} onOpenChange={setIsListModalOpen}><DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-[32px] bg-white p-6"><DialogHeader><DialogTitle className="text-xl font-bold">Create New List</DialogTitle><DialogDescription className="sr-only">Form to create a new task list on the board.</DialogDescription></DialogHeader><form onSubmit={handleCreateList} className="space-y-4 pt-4"><div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">List Title</Label><Input placeholder="e.g. To Do, Done" value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} required className="rounded-2xl h-12 border-zinc-200" /></div><DialogFooter><Button type="submit" className="w-full bg-black text-[#fffe01] rounded-2xl h-12 font-bold shadow-lg">Create List</Button></DialogFooter></form></DialogContent></Dialog>
      
      <Dialog open={isEditListModalOpen} onOpenChange={setIsEditListModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-[32px] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">List Settings</DialogTitle>
            <DialogDescription className="sr-only">Edit list name or delete list.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateList} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">List Title</Label>
              <Input 
                placeholder="List name..." 
                value={editingList?.title || ''} 
                onChange={(e) => setEditingList({ ...editingList, title: e.target.value })} 
                required 
                className="rounded-2xl h-12 border-zinc-200" 
              />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full bg-black text-[#fffe01] rounded-2xl h-12 font-bold shadow-lg">Save Changes</Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => handleDeleteList(editingList?._id)}
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl h-12 font-bold"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete List
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}><DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-[32px] bg-white p-6"><DialogHeader><DialogTitle className="text-xl font-bold">New Card</DialogTitle><DialogDescription className="sr-only">Form to create a new task card in a list.</DialogDescription></DialogHeader><form onSubmit={handleCreateTask} className="space-y-4 pt-4"><div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Title</Label><Input placeholder="Task title..." value={newTaskData.title} onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })} required className="rounded-2xl h-12 border-zinc-200" /></div><div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Description</Label><Textarea placeholder="Details..." value={newTaskData.description || ''} onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })} className="rounded-2xl min-h-[120px] border-zinc-200" /></div><DialogFooter><Button type="submit" className="w-full bg-black text-[#fffe01] rounded-2xl h-12 font-bold shadow-lg">Add Card</Button></DialogFooter></form></DialogContent></Dialog>

      {/* Task Details Dialog */}
      {isDetailsOpen && taskDetails && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center"><Loader size="lg" color="red" /></div>}>
          <TaskDetailsModal 
            isOpen={isDetailsOpen}
            onClose={() => { setIsDetailsOpen(false); setTaskDetails(null); }}
            taskDetails={taskDetails}
            boardData={boardData}
            currentBoardId={boardData._id}
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

