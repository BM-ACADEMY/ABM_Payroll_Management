import { 
  X, ChevronDown, ChevronRight, MoreHorizontal, Plus, Tag, CheckSquare, 
  Paperclip, Layout, MessageSquare, 
  Check, Trash2, Edit2, Send, Bell, Calendar, Clock, 
  TrendingUp, Copy
} from 'lucide-react';
import React, { useState, useEffect, useRef, memo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import SubTaskItem from './SubTaskItem';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import Loader from '@/components/ui/Loader';
import { cn } from "@/lib/utils";

const TaskDetailsModal = ({ 
  isOpen, 
  onClose, 
  taskDetails, 
  boardData, 
  lists, 
  isAdmin,
  handleUpdateTask,
  handleAddComment,
  handleUpdateLabels,
  handleAddChecklist,
  handleAddChecklistItem,
  handleUpdateChecklistItem,
  handleRemoveChecklist,
  handleAddSubTask,
  getTimeAgo,
  handleUpdateComment,
  handleDeleteComment,
  handleDeleteTask,
  onRefresh,
  currentBoardId,
  allUsers = []
}) => {
  const { toast } = useToast();
  const { task, comments = [], history = [], subTasks: initialSubTasks = [] } = taskDetails || {};
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState(task?.description || '');

  // Mentions State
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionTriggerPos, setMentionTriggerPos] = useState(null);
  const [activeInput, setActiveInput] = useState(null); // 'desc' or 'comment' or 'editComment'

  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [isLabelPickerOpen, setIsLabelPickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isChecklistPickerOpen, setIsChecklistPickerOpen] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('Checklist');
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [activeChecklistForNewItem, setActiveChecklistForNewItem] = useState(null);
  const [newItemAssignee, setNewItemAssignee] = useState(null);
  const [newItemDueDate, setNewItemDueDate] = useState(null);
  const [isNewItemMemberPickerOpen, setIsNewItemMemberPickerOpen] = useState(false);
  const [isNewItemDatePickerOpen, setIsNewItemDatePickerOpen] = useState(false);
  const [showActivityDetails, setShowActivityDetails] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);
  const moreMenuRef = useRef(null);

  // Copy Flow State
  const [copyFlowStep, setCopyFlowStep] = useState(0); // 0: main menu, 1: select type, 2: select board/list
  const [copyTargetType, setCopyTargetType] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [isDestLoading, setIsDestLoading] = useState(false);

  // Date picker staging states
  const [stagingDeadline, setStagingDeadline] = useState(task?.deadline || '');
  const [manualDateText, setManualDateText] = useState('');

  const parseManualDate = (text) => {
    if (!text) return null;
    const now = new Date();
    
    // DD/MM HH:mm (current year)
    const dmt = text.match(/^(\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2})$/);
    if (dmt) return new Date(now.getFullYear(), dmt[2]-1, dmt[1], dmt[3], dmt[4]);

    // DD/MM/YYYY HH:mm
    const dmyt = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})$/);
    if (dmyt) return new Date(dmyt[3], dmyt[2]-1, dmyt[1], dmyt[4], dmyt[5]);

    // Just DD/MM
    const dm = text.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
    if (dm) return new Date(now.getFullYear(), dm[2]-1, dm[1], 12, 0);

    // native parse
    const native = new Date(text);
    if (!isNaN(native.getTime())) return native;

    return null;
  };

  useEffect(() => {
    if (isDatePickerOpen) {
      setStagingDeadline(task?.deadline || '');
      setManualDateText(task?.deadline ? format(new Date(task.deadline), 'dd/MM HH:mm') : '');
    }
  }, [isDatePickerOpen, task?.deadline]);

  const [tempStartDate, setTempStartDate] = useState('');
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempDueDate, setTempDueDate] = useState('');
  const [tempDueTime, setTempDueTime] = useState('');
  const [isStartChecked, setIsStartChecked] = useState(false);
  const [isDueChecked, setIsDueChecked] = useState(false);

  const descRef = useRef(null);
  const commentRef = useRef(null);
  const editCommentRef = useRef(null);
  const memberPickerRef = useRef(null);
  const labelPickerRef = useRef(null);
  const datePickerRef = useRef(null);
  const checklistPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMemberPickerOpen && memberPickerRef.current && !memberPickerRef.current.contains(event.target)) {
        const isClickOnToggle = event.target.closest('[data-member-toggle]');
        if (!isClickOnToggle) setIsMemberPickerOpen(false);
      }
      if (isLabelPickerOpen && labelPickerRef.current && !labelPickerRef.current.contains(event.target)) {
        const isClickOnToggle = event.target.closest('[data-label-toggle]');
        if (!isClickOnToggle) setIsLabelPickerOpen(false);
      }
      if (isDatePickerOpen && datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        const isClickOnToggle = event.target.closest('[data-date-toggle]');
        if (!isClickOnToggle) setIsDatePickerOpen(false);
      }
      if (isChecklistPickerOpen && checklistPickerRef.current && !checklistPickerRef.current.contains(event.target)) {
        const isClickOnToggle = event.target.closest('[data-checklist-toggle]');
        if (!isClickOnToggle) setIsChecklistPickerOpen(false);
      }
      if (isMoreMenuOpen && moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        const isClickOnToggle = event.target.closest('[data-more-toggle]');
        if (!isClickOnToggle) setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMemberPickerOpen, isLabelPickerOpen, isDatePickerOpen, isChecklistPickerOpen, isMoreMenuOpen]);

  useEffect(() => {
    const autoResize = (ref) => {
      if (ref.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = (ref.current.scrollHeight) + 'px';
      }
    };
    autoResize(descRef);
    autoResize(commentRef);
    autoResize(editCommentRef);
  }, [tempDesc, commentText, editCommentText, isEditingDesc, editingCommentId]);

  useEffect(() => {
    if (taskDetails?.task) setTempDesc(taskDetails.task.description || '');
  }, [taskDetails]);

  const isDueSoon = (deadline) => {
    if (!deadline || taskDetails?.task?.isCompleted) return false;
    const now = new Date();
    const due = new Date(deadline);
    const diff = (due - now) / (1000 * 60 * 60);
    return diff > 0 && diff <= 8;
  };

  const isOverdue = (deadline) => {
    if (!deadline || taskDetails?.task?.isCompleted) return false;
    return new Date(deadline) < new Date();
  };

  const currentUser = { 
    _id: sessionStorage.getItem('userId'), 
    name: sessionStorage.getItem('userName'), 
    role: sessionStorage.getItem('userRole') 
  };

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(taskDetails?.task?.title || '');

  useEffect(() => {
    setEditTitleValue(taskDetails?.task?.title || '');
  }, [taskDetails?.task?.title]);

  const handleTitleSave = () => {
    const task = taskDetails?.task;
    if (task && editTitleValue.trim() && editTitleValue !== task.title) {
      handleUpdateTask(task._id, { title: editTitleValue });
    }
    setIsEditingTitle(false);
  };

  // Logic for Mentions
  const handleTextChange = (text, type) => {
    if (type === 'comment') setCommentText(text);
    else if (type === 'desc') setTempDesc(text);
    else if (type === 'editComment') setEditCommentText(text);

    const words = text.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setMentionSearch(lastWord.substring(1));
      setMentionTriggerPos(text.length - lastWord.length);
      setActiveInput(type);
    } else {
      setMentionSearch('');
      setMentionTriggerPos(null);
      setActiveInput(null);
    }
  };

  const insertMention = (user) => {
    const textToUpdate = activeInput === 'comment' ? commentText : activeInput === 'desc' ? tempDesc : editCommentText;
    const prefix = textToUpdate.substring(0, mentionTriggerPos);
    const suffix = textToUpdate.substring(textToUpdate.indexOf(' ', mentionTriggerPos) === -1 ? textToUpdate.length : textToUpdate.indexOf(' ', mentionTriggerPos));
    const mention = `@[${user.name}](${user.email}) `;
    const newText = prefix + mention + suffix;
    
    if (activeInput === 'comment') setCommentText(newText);
    else if (activeInput === 'desc') setTempDesc(newText);
    else if (activeInput === 'editComment') setEditCommentText(newText);
    
    setMentionSearch('');
    setMentionTriggerPos(null);
    setActiveInput(null);
  };

  const handleCopyTask = async (targetType, targetBoardId = null, targetListId = null) => {
    try {
      const token = sessionStorage.getItem('token');
      let finalBoardId = targetBoardId;
      let finalListId = targetListId;

      // If upcoming board was selected without a list, fetch lists for that board first
      if (targetType === 'upcoming' && finalBoardId && (!finalListId || finalListId === 'auto')) {
        const boardRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/${finalBoardId}`, {
          headers: { 'x-auth-token': token }
        });
        const targetLists = boardRes.data.lists || [];
        if (targetLists.length === 0) {
          toast({ variant: "destructive", title: "Error", description: "The selected board has no columns/lists to copy into." });
          return;
        }
        finalListId = targetLists[0]._id;
      }

      // If no boardId provided (special types), we need to fetch the special board
      if (!finalBoardId && (targetType === 'weekly' || targetType === 'daily')) {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/special/${targetType}?teamId=${boardData.team?._id || boardData.team}`, {
          headers: { 'x-auth-token': token }
        });
        const targetBoard = res.data.board || res.data;
        if (!targetBoard) throw new Error(`Could not find ${targetType} board`);
        finalBoardId = targetBoard._id;
        
        if (!finalListId) {
           const targetLists = res.data.lists || [];
           if (targetType === 'daily') {
             const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
             const todayName = days[new Date().getDay()];
             finalListId = targetLists.find(l => l.title === todayName)?._id || targetLists[0]?._id;
           } else {
             finalListId = targetLists[0]?._id;
           }
        }
      }

      if (!finalBoardId || !finalListId) {
        toast({ variant: "destructive", title: "Error", description: "Destination not fully selected" });
        return;
      }
      
      const payload = {
        title: task.title,
        description: task.description || `Copied from ${boardData.title}`,
        listId: finalListId,
        boardId: finalBoardId,
        position: 0,
        deadline: task.deadline,
        assignees: task.assignees?.map(a => a._id || a) || [],
        originTaskId: task._id,
        labels: task.labels || [],
        checklists: task.checklists?.map(cl => ({
          name: cl.name,
          items: cl.items?.map(item => ({
            text: item.text,
            isCompleted: item.isCompleted,
            assignedTo: item.assignedTo?._id || item.assignedTo,
            dueDate: item.dueDate
          }))
        })) || []
      };
      
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/tasks`, payload, {
        headers: { 'x-auth-token': token }
      });
      
      toast({ 
        title: "Success", 
        description: `Task copied successfully.` 
      });
      setIsMoreMenuOpen(false);
      setCopyFlowStep(0);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Copy Error:', err);
      toast({ variant: "destructive", title: "Error", description: "Failed to copy task" });
    }
  };

  const fetchDestinations = async (type) => {
    setIsDestLoading(true);
    setCopyTargetType(type);
    try {
      const token = sessionStorage.getItem('token');
      const teamId = boardData.team?._id || boardData.team;
      
      if (type === 'upcoming') {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/team/${teamId}`, {
          headers: { 'x-auth-token': token }
        });
        setDestinations(res.data);
        setCopyFlowStep(2);
      } else {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/special/${type}?teamId=${teamId}`, {
          headers: { 'x-auth-token': token }
        });
        setDestinations(res.data.lists || []);
        // Save boardId for later
        setCopyTargetType({ type, boardId: res.data.board?._id || res.data._id });
        setCopyFlowStep(2);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch destinations" });
    } finally {
      setIsDestLoading(false);
    }
  };

  const Toolbar = ({ onSave, onCancel, showActions = true }) => {
    return (
      <div className={cn(
        "flex items-center justify-end bg-zinc-50 border border-zinc-200 rounded-t-lg px-2 py-1.5 border-b-0 transition-opacity duration-200",
        showActions ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
         <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 px-2 text-[11px] font-normal text-zinc-500 hover:text-red-600 transition-colors uppercase tracking-tight">Cancel</Button>
            <Button onClick={onSave} className="h-7 px-3 text-[11px] font-normal bg-black text-[#fffe01] rounded uppercase tracking-tight shadow-sm hover:scale-105 transition-transform">Save</Button>
         </div>
      </div>
    );
  };

  const MentionList = () => {
    if (mentionTriggerPos === null) return null;
    const filtered = allUsers.filter(m => 
      m.name?.toLowerCase().includes(mentionSearch.toLowerCase()) || 
      m.email?.toLowerCase().includes(mentionSearch.toLowerCase())
    );
    if (filtered.length === 0) return null;
    return (
      <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-2xl z-[100] p-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
         <div className="px-2 py-1.5 mb-1 border-b border-zinc-100">
            <span className="text-[10px] font-normal text-zinc-400 uppercase tracking-widest">Tag a person</span>
         </div>
         <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filtered.map(m => (
               <div
                  key={m._id}
                  onClick={() => insertMention(m)}
                 className="flex items-center gap-3 p-2 hover:bg-zinc-100 rounded-lg cursor-pointer group/mention transition-all"
               >
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 text-[#fffe01] flex items-center justify-center text-[10px] font-normal shadow-sm group-hover/mention:scale-110 transition-transform">
                    {m.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-normal text-zinc-800">{m.name}</span>
                    <span className="text-[10px] text-zinc-400 font-medium">@{m.email.split('@')[0]}</span>
                  </div>
               </div>
            ))}
         </div>
      </div>
    );
  };

  if (!isOpen || !taskDetails || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[1260px] w-full md:w-[95vw] h-full md:h-[88vh] p-0 overflow-hidden border-none shadow-[0_0_80px_-15px_rgba(0,0,0,0.3)] md:rounded-[3rem] rounded-none bg-white flex flex-col custom-modal" showClose={false}>
           <DialogTitle className="sr-only">Task Details</DialogTitle>
           <DialogDescription className="sr-only">Viewing detailed information for {task.title}</DialogDescription>
 
           {/* Header Context Bar */}
           <div className="min-h-[3.5rem] md:h-12 px-4 md:px-8 py-2 flex items-center justify-between bg-zinc-50/80 border-b border-zinc-100/50 relative z-50 flex-wrap gap-2">
              <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                <div className="flex items-center gap-1.5 py-1 px-3 bg-white rounded-full border border-zinc-100 shadow-sm shrink-0">
                   <div className="w-2 h-2 rounded-full bg-[#fffe01] animate-pulse"></div>
                   <span className="text-[10px] font-normal text-zinc-900 uppercase tracking-widest">{boardData?.title || 'NODE'}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                <div className="relative group/status-breadcrumb">
                   <span className="text-[10px] font-normal text-zinc-400 uppercase tracking-widest group-hover/status-breadcrumb:text-black transition-colors cursor-pointer truncate max-w-[80px] md:max-w-none">
                      {boardData?.type === 'weekly' 
                        ? (task.board?.title || lists.find(l => l._id === (task.board?._id || task.board))?.title || 'GLOBAL')
                        : (task.list?.title || lists.find(l => l._id === (task.list?._id || task.list))?.title || 'UNSORTED')}
                   </span>
                   <select 
                      value={boardData?.type === 'weekly' ? (task.board?._id || task.board) : (task.list?._id || task.list)}
                      onChange={(e) => {
                        const updates = boardData?.type === 'weekly' 
                          ? { board: e.target.value } 
                          : { list: e.target.value };
                        handleUpdateTask(task._id, updates);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                   >
                      {lists.map(l => (
                        <option key={l._id} value={l._id}>{l.title}</option>
                      ))}
                   </select>
                </div>
              </div>
 
              <div className="flex items-center gap-3">
                 {task?.mentionCount > 0 && (
                  <div className="relative group/mention shrink-0">
                    <Bell className="w-4 h-4 text-red-500 fill-current animate-pulse cursor-pointer" />
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white font-normal shadow-sm">
                      {task.mentionCount}
                    </span>
                  </div>
                )}

                 <div className="flex items-center bg-white border border-zinc-100 rounded-xl px-1 md:px-1.5 py-1 gap-1 shadow-sm shrink-0">
                  {task.checklists?.some(cl => cl.items?.length > 0) && (
                    <div className="flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-1">
                      <CheckSquare className="w-3.5 h-3.5 text-[#fffe01] drop-shadow-[0_0_8px_rgba(255,254,1,0.5)]" />
                      <span className="text-[11px] font-normal text-zinc-800">
                        {task.checklists.reduce((acc, cl) => acc + (cl.items?.filter(i => i.isCompleted).length || 0), 0)}/
                        {task.checklists.reduce((acc, cl) => acc + (cl.items?.length || 0), 0)}
                      </span>
                    </div>
                  )}
                  
                  <div className="h-4 w-px bg-zinc-100 mx-0.5"></div>

                  <div className="relative flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      data-more-toggle
                      onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                      className="h-8 w-8 text-zinc-400 hover:text-black hover:bg-zinc-50 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>

                    {isMoreMenuOpen && (
                      <div ref={moreMenuRef} className="absolute right-0 top-10 w-56 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        {copyFlowStep === 0 && (
                          <>
                            <button 
                              onClick={() => setCopyFlowStep(1)}
                              className="w-full text-left px-4 py-3 text-[13px] font-normal text-zinc-700 hover:bg-zinc-50 flex items-center justify-between group transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Copy className="w-4 h-4 text-zinc-400 group-hover:text-black" /> Copy Card
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                            </button>
                            
                            <div className="h-px bg-zinc-100 my-1 mx-2" />
                            <button 
                              onClick={() => handleDeleteTask(task._id)}
                              className="w-full text-left px-4 py-3 text-[13px] font-normal text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete Card
                            </button>
                          </>
                        )}

                        {copyFlowStep === 1 && (
                          <div className="animate-in slide-in-from-right-2 duration-200">
                            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                              <span className="text-[10px] font-normal text-zinc-400 uppercase tracking-widest">Target Mode</span>
                              <button onClick={() => setCopyFlowStep(0)} className="text-[10px] text-zinc-500 hover:text-black font-normal uppercase">Back</button>
                            </div>
                            <button onClick={() => fetchDestinations('upcoming')} className="w-full text-left px-4 py-3 text-[13px] font-normal text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-indigo-500" /> Upcoming
                            </button>
                            <button onClick={() => fetchDestinations('weekly')} className="w-full text-left px-4 py-3 text-[13px] font-normal text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-500" /> Weekly
                            </button>
                            <button onClick={() => fetchDestinations('daily')} className="w-full text-left px-4 py-3 text-[13px] font-normal text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-500" /> Daily
                            </button>
                          </div>
                        )}

                        {copyFlowStep === 2 && (
                          <div className="animate-in slide-in-from-right-2 duration-200">
                            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                              <span className="text-[10px] font-normal text-zinc-400 uppercase tracking-widest">
                                {copyTargetType === 'upcoming' ? 'Select Board' : 'Select List'}
                              </span>
                              <button onClick={() => setCopyFlowStep(1)} className="text-[10px] text-zinc-500 hover:text-black font-normal uppercase">Back</button>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                              {isDestLoading ? (
                                <div className="p-6 flex justify-center"><Loader size="sm" /></div>
                              ) : destinations.length === 0 ? (
                                <div className="p-6 text-zinc-400 text-xs italic text-center">No targets found</div>
                              ) : (
                                destinations.map(d => (
                                  <button 
                                    key={d._id} 
                                    onClick={() => {
                                      if (copyTargetType === 'upcoming') {
                                        handleCopyTask('upcoming', d._id, d.lists?.[0] || 'auto'); 
                                      } else {
                                        handleCopyTask(copyTargetType.type, copyTargetType.boardId, d._id);
                                      }
                                    }}
                                    className="w-full text-left px-4 py-3 text-[12px] font-normal text-zinc-600 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 truncate"
                                  >
                                    {d.title}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="h-10 w-10 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </Button>
           </div>

        <div className="flex-1 overflow-hidden bg-white">
          <div className="flex flex-col md:flex-row h-full">
            {/* Left Column */}
            <div className="flex-1 p-6 md:p-10 space-y-8 md:space-y-12 overflow-y-auto custom-scrollbar">
                <div className="flex items-start gap-3 md:gap-4">
                  <button 
                    onClick={() => handleUpdateTask(task._id, { isCompleted: !task.isCompleted })}
                    className={`w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center transition-all mt-1 md:mt-2 ${task.isCompleted ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm' : 'border-zinc-300 hover:border-zinc-400 bg-white'}`}
                  >
                    {task.isCompleted && <Check className="w-4 h-4" />}
                  </button>
                  <DialogHeader className="p-0 space-y-0 text-left flex-1">
                    {isEditingTitle ? (
                      <Input 
                        autoFocus
                        className="text-xl md:text-[28px] font-normal text-zinc-900 tracking-tight leading-tight h-auto p-0 border-none focus-visible:ring-0 bg-transparent"
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                      />
                    ) : (
                      <div className="flex items-center flex-wrap gap-2 md:gap-3">
                        <DialogTitle 
                          onDoubleClick={() => setIsEditingTitle(true)}
                          className={`text-xl md:text-[28px] font-normal text-zinc-900 tracking-tight leading-tight transition-all cursor-text ${task.isCompleted ? 'text-zinc-400 line-through decoration-zinc-300' : ''}`}
                        >
                          {task.title}
                        </DialogTitle>
                        {task.timeLogLabel && (
                          <Badge variant="outline" className="mt-1 md:mt-2 h-5 md:h-6 px-1.5 md:px-2 text-[8px] md:text-[10px] font-normal capitalize bg-slate-50 text-slate-600 border-slate-200 shrink-0">
                            {task.timeLogLabel}
                          </Badge>
                        )}
                      </div>
                    )}
                    <DialogDescription className="sr-only">
                      Task details and management for {task.title}
                    </DialogDescription>
                  </DialogHeader>
                </div>
                
                {task.originTaskId && (
                  <div className="flex items-center gap-2 pl-10 md:pl-12">
                     <Badge variant="outline" className="bg-zinc-50 text-zinc-500 border-zinc-200 text-[10px] font-normal py-0 h-5">
                        COPIED FROM PROJECT
                     </Badge>
                     <span className="text-[11px] text-zinc-400 font-medium italic hidden sm:inline">Track progress across boards</span>
                  </div>
                )}
               
               <div className="flex flex-wrap items-center gap-2 pl-0 md:pl-10">
                 <Button 
                  variant="outline" 
                  data-member-toggle
                  onClick={() => { setIsMemberPickerOpen(!isMemberPickerOpen); setIsLabelPickerOpen(false); setIsChecklistPickerOpen(false); setIsDatePickerOpen(false); }}
                  className="h-8 px-3 border-zinc-200 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 gap-2 transition-all"
                >
                   <Plus className="w-4 h-4 text-zinc-500" /> Add
                </Button>
                <Button 
                  variant="outline" 
                  data-label-toggle
                  onClick={() => { setIsLabelPickerOpen(!isLabelPickerOpen); setIsChecklistPickerOpen(false); setIsDatePickerOpen(false); setIsMemberPickerOpen(false); }} 
                  className="h-8 px-3 border-zinc-200 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 gap-2 transition-all"
                >
                   <Tag className="w-4 h-4 text-zinc-500" /> Labels
                </Button>
                
                <div className="relative">
                  <Button 
                    variant="outline" 
                    data-checklist-toggle
                    onClick={() => { setIsChecklistPickerOpen(!isChecklistPickerOpen); setIsLabelPickerOpen(false); setIsDatePickerOpen(false); setIsMemberPickerOpen(false); }} 
                    className="h-8 px-3 border-zinc-200 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 gap-2 transition-all"
                  >
                     <CheckSquare className="w-4 h-4 text-zinc-500" /> Checklist
                  </Button>
                  {isChecklistPickerOpen && (
                     <div ref={checklistPickerRef} className="absolute top-10 left-0 w-64 bg-white border border-zinc-200 rounded-lg shadow-2xl z-[70] p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left">
                        <h5 className="text-[14px] font-normal text-zinc-700 pb-2 border-b border-zinc-100">Add Checklist</h5>
                        <div className="space-y-2">
                           <Label className="text-xs font-normal text-zinc-500">Title</Label>
                           <Input 
                             autoFocus
                             value={newChecklistTitle} 
                             onChange={e=>setNewChecklistTitle(e.target.value)}
                             className="h-9 rounded-md border-zinc-300" 
                           />
                        </div>
                        <Button 
                          onClick={() => { handleAddChecklist(task._id, newChecklistTitle); setIsChecklistPickerOpen(false); }}
                          className="w-full bg-[#0052cc] hover:bg-[#0747a6] text-white font-normal h-9 rounded-md"
                        >
                           Add
                        </Button>
                     </div>
                  )}
                </div>

                <div className="relative">
                  <Button 
                    variant="outline" 
                    data-date-toggle
                    onClick={() => { setIsDatePickerOpen(!isDatePickerOpen); setIsLabelPickerOpen(false); setIsChecklistPickerOpen(false); setIsMemberPickerOpen(false); }} 
                    className="h-8 px-3 border-zinc-200 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 gap-2 transition-all"
                  >
                     <Clock className="w-4 h-4 text-zinc-500" /> Dates
                  </Button>
                  {isDatePickerOpen && (
                     <div ref={datePickerRef} className="absolute top-10 left-0 w-80 bg-white border border-zinc-200 rounded-lg shadow-2xl z-[70] p-5 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                           <h5 className="text-[14px] font-normal text-zinc-900 uppercase tracking-tight">Set Date & Time</h5>
                           <X className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-black" onClick={()=>setIsDatePickerOpen(false)} />
                        </div>
                        
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-normal text-zinc-400 uppercase tracking-widest block">Quick Select</label>
                              <Input 
                                type="datetime-local"
                                value={stagingDeadline ? format(new Date(stagingDeadline), "yyyy-MM-dd'T'HH:mm") : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStagingDeadline(val);
                                  if (val) setManualDateText(format(new Date(val), 'dd/MM HH:mm'));
                                }}
                                className="h-10 rounded-xl border-zinc-200 font-normal text-zinc-800 focus:border-black transition-colors"
                              />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[10px] font-normal text-zinc-400 uppercase tracking-widest block">Manual Entry</label>
                              <Input 
                                placeholder="DD/MM HH:mm (e.g. 25/04 14:30)"
                                value={manualDateText}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setManualDateText(val);
                                  const parsed = parseManualDate(val);
                                  if (parsed) setStagingDeadline(parsed.toISOString());
                                }}
                                className="h-10 rounded-xl border-zinc-200 text-[13px] font-normal text-zinc-800 placeholder:text-zinc-300 focus:border-black transition-colors"
                              />
                           </div>

                            <div className="pt-4 flex gap-3">
                               <Button 
                                 className="flex-1 h-11 bg-black text-[#fffe01] font-normal text-[11px] uppercase tracking-widest rounded-xl shadow-xl hover:shadow-[#fffe01]/10 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                                 onClick={() => { 
                                   handleUpdateTask(task._id, { deadline: stagingDeadline }); 
                                   setIsDatePickerOpen(false); 
                                 }}
                               >
                                 Commit Schedule
                               </Button>
                               <Button 
                                 variant="outline" 
                                 size="icon"
                                 className="h-11 w-11 text-red-500 border-zinc-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                                 onClick={() => { 
                                   handleUpdateTask(task._id, { deadline: null }); 
                                   setIsDatePickerOpen(false); 
                                 }}
                                 title="Remove Date"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                            </div>
                        </div>
                     </div>
                  )}
                </div>

                <div className="relative">
                   <input 
                     type="file" 
                     id="attachment-upload" 
                     className="hidden" 
                     onChange={async (e) => { 
                         const file = e.target.files?.[0];
                         if(!file) return;
                         
                         try {
                           const formData = new FormData();
                           formData.append('file', file);
                           
                           const token = sessionStorage.getItem('token');
                           const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, formData, {
                             headers: { 
                               'Content-Type': 'multipart/form-data',
                               'x-auth-token': token 
                             }
                           });
                           
                           const newAttachment = { 
                             name: res.data.name, 
                             url: res.data.url, 
                             fileType: res.data.fileType, 
                             createdAt: new Date().toISOString() 
                           };
                           handleUpdateTask(task._id, { attachments: [...(task.attachments || []), newAttachment] });
                           toast({ title: "Success", description: "File uploaded successfully" });
                         } catch (err) {
                           console.error('Upload Error:', err);
                           toast({ variant: "destructive", title: "Error", description: "Failed to upload file" });
                         }
                      }} 
                   />
                </div>
               </div>


                {/* Meta Properties Row */}
                <div className="flex flex-col sm:flex-row flex-wrap items-start gap-8 md:gap-12 pl-2 md:pl-10 mb-2">
                  {/* Members */}
                  <div className="space-y-3">
                     <h4 className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">Members</h4>
                     <div className="flex flex-wrap gap-2 items-center">
                        {task.assignees?.map(a => (
                          <div key={a._id} className="w-8 h-8 rounded-full bg-zinc-900 text-[#fffe01] flex items-center justify-center text-[10px] font-normal shadow-sm border-2 border-white ring-1 ring-zinc-100 transition-transform hover:scale-110 cursor-default" title={a.name}>
                             {a.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                        ))}
                        <div className="relative">
                            <button 
                              data-member-toggle 
                              onClick={() => setIsMemberPickerOpen(!isMemberPickerOpen)} 
                              className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black hover:border-black transition-all shadow-sm"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {isMemberPickerOpen && (
                               <div ref={memberPickerRef} className="absolute top-10 left-0 w-[280px] bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[70] p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                  <div className="flex items-center justify-between">
                                     <span className="text-xs font-normal uppercase tracking-widest text-zinc-400">Manage Members</span>
                                     <X className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-black" onClick={()=>setIsMemberPickerOpen(false)} />
                                  </div>
                                  <Input placeholder="Find members..." className="h-10 text-sm rounded-xl border-zinc-200" />
                                  <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                                     {task.assignees?.length > 0 && (
                                        <div className="space-y-2">
                                           <h5 className="text-[9px] font-normal text-zinc-400 uppercase tracking-widest">In this vector</h5>
                                           {task.assignees.map(m => (
                                              <div key={m._id} className="flex items-center justify-between p-1.5 hover:bg-zinc-50 rounded-xl transition-colors">
                                                 <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-zinc-900 text-[#fffe01] flex items-center justify-center text-[9px] font-normal">{m.name.split(' ').map(n=>n[0]).join('')}</div>
                                                    <span className="text-[13px] font-normal text-zinc-800">{m.name}</span>
                                                 </div>
                                                 <X onClick={() => handleUpdateTask(task._id, { assignees: task.assignees.filter(a=>a._id !== m._id).map(a=>a._id) })} className="w-3.5 h-3.5 text-zinc-300 cursor-pointer hover:text-red-500 transition-colors" />
                                              </div>
                                           ))}
                                        </div>
                                     )}
                                     <div className="space-y-2">
                                        <h5 className="text-[9px] font-normal text-zinc-400 uppercase tracking-widest">Available Nodes</h5>
                                        {(boardData?.members || []).filter(m => !task.assignees?.some(a=>a._id === m._id)).map(m => (
                                           <div 
                                             key={m._id} 
                                             onClick={() => handleUpdateTask(task._id, { assignees: [...(task.assignees?.map(a=>a._id) || []), m._id] })}
                                             className="flex items-center gap-3 p-1.5 hover:bg-zinc-50 rounded-xl cursor-pointer transition-colors"
                                           >
                                              <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center text-[9px] font-normal group-hover:bg-zinc-900 group-hover:text-[#fffe01]">{m.name.split(' ').map(n=>n[0]).join('')}</div>
                                              <span className="text-[13px] font-normal text-zinc-800">{m.name}</span>
                                           </div>
                                        ))}
                                     </div>
                                  </div>
                               </div>
                            )}
                        </div>
                     </div>
                  </div>

                  {/* Labels */}
                  <div className="space-y-3">
                     <h4 className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">Labels</h4>
                      <div className="flex flex-wrap gap-2 items-center">
                         {task.labels?.map((l, i) => (
                           <Badge key={i} style={{ backgroundColor: l.color }} className="text-white border-none rounded-lg h-8 px-4 text-[10px] font-normal uppercase tracking-widest shadow-sm transition-transform hover:scale-105 cursor-default">{l.text}</Badge>
                         ))}
                          <div className="relative">
                             <button 
                               data-label-toggle 
                               onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)} 
                               className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black hover:border-black transition-all shadow-sm"
                             >
                               <Plus className="w-4 h-4" />
                             </button>
                             {isLabelPickerOpen && (
                                <div ref={labelPickerRef} className="absolute top-10 left-0 w-[240px] bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[70] p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                   <span className="text-[10px] font-normal uppercase tracking-widest text-zinc-400 w-full text-center block">Classification</span>
                                   <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                      {[ {t:'Done', c:'#51cc9e'}, {t:'Under QC', c:'#f1d643'}, {t:'Waiting for requirement', c:'#ff9f1a'}, {t:'Not yet started', c:'#f87171'}, {t:'On hold', c:'#c084fc'}, {t:'In process', c:'#60a5fa'} ].map((opt, i) => {
                                         const isLabeled = task.labels?.some(l => l.text === opt.t);
                                         return (
                                            <div key={i} onClick={() => handleUpdateLabels({ text: opt.t, color: opt.c })} className="flex items-center gap-3 p-1.5 hover:bg-zinc-50 rounded-xl cursor-pointer group transition-colors">
                                               <div className={`w-5 h-8 rounded-md transition-all ${isLabeled ? 'w-2' : ''}`} style={{ backgroundColor: opt.c }}></div>
                                               <span className={cn("text-[11px] font-normal uppercase tracking-tight transition-colors", isLabeled ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-700")}>{opt.t}</span>
                                            </div>
                                         );
                                      })}
                                   </div>
                                </div>
                             )}
                          </div>
                      </div>
                  </div>

                  {/* Due Date Display */}
                  {task.deadline && (
                    <div className="space-y-3">
                       <h4 className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">Projected Date</h4>
                       <div 
                         onClick={() => setIsDatePickerOpen(true)}
                         className={cn(
                           "flex items-center gap-3 px-4 py-1.5 rounded-xl border-2 cursor-pointer transition-all shadow-sm hover:scale-105",
                           isOverdue(task.deadline) ? "bg-red-50 border-red-200 text-red-700 shadow-red-100" : 
                           isDueSoon(task.deadline) ? "bg-amber-50 border-amber-200 text-amber-700 shadow-amber-100" :
                           "bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-black"
                         )}
                       >
                          <Clock className={cn("w-4 h-4", isOverdue(task.deadline) ? "text-red-500" : isDueSoon(task.deadline) ? "text-amber-500" : "text-zinc-400")} />
                          <span className="text-[13px] font-normal">
                            {format(new Date(task.deadline), 'MMM d, HH:mm')}
                            {isOverdue(task.deadline) && <span className="ml-2 text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-normal uppercase tracking-tighter">Overdue</span>}
                          </span>
                       </div>
                    </div>
                  )}
                </div>

                {/* Unified Intelligence Section */}
                <div className="pl-0 md:pl-10 space-y-8">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                     <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-normal tracking-widest text-zinc-400">Tactical Priority</Label>
                        <select 
                          value={task.priority || 'Normal'}
                          onChange={(e) => handleUpdateTask(task._id, { priority: e.target.value })}
                          className="w-full h-10 bg-transparent border-b-2 border-zinc-100 hover:border-black text-[11px] font-normal uppercase tracking-widest transition-all outline-none pb-1 appearance-none"
                        >
                          <option value="Low">Low Priority</option>
                          <option value="Normal">Normal Node</option>
                          <option value="High">High Vector</option>
                          <option value="Urgent">Urgent Alert</option>
                        </select>
                     </div>

                     <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-normal tracking-widest text-zinc-400">Est. Quantum (H)</Label>
                        <div className="relative group">
                           <Input 
                             type="number"
                             placeholder="0.0"
                             value={task.estimatedTime || ''}
                             onChange={(e) => handleUpdateTask(task._id, { estimatedTime: e.target.value })}
                             className="h-10 bg-transparent border-0 border-b-2 border-zinc-100 rounded-none px-0 text-xs font-normal focus-visible:ring-0 focus:border-black transition-all"
                           />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-normal tracking-widest text-zinc-400">Execution Flux (%)</Label>
                        <div className="flex items-center gap-4">
                           <span className="text-xs font-normal text-zinc-900 w-8">{task.progress || 0}%</span>
                           <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden relative">
                              <div className="absolute inset-0 bg-black transition-all duration-700 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]" style={{ width: `${task.progress || 0}%` }}></div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3 text-left md:text-right">
                        <Label className="text-[10px] uppercase font-normal tracking-widest text-zinc-400">Deployment Status</Label>
                        <div className="flex justify-start md:justify-end">
                           <button 
                             onClick={() => handleUpdateTask(task._id, { isInSprint: !task.isInSprint })}
                             className={cn(
                               "h-9 px-4 rounded-xl flex items-center gap-3 transition-all font-normal text-[9px] uppercase tracking-widest border-2",
                               task.isInSprint 
                                 ? "bg-black text-[#fffe01] border-black shadow-lg shadow-black/10" 
                                 : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200"
                             )}
                           >
                              {task.isInSprint ? 'Active Sprint' : 'In Backlog'}
                              <Layout className={cn("w-3.5 h-3.5", task.isInSprint ? "text-[#fffe01]" : "text-zinc-200")} />
                           </button>
                        </div>
                     </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <Label className="text-[10px] uppercase font-normal tracking-widest text-zinc-400 flex items-center gap-2">
                            Execution Blockers
                            {task.blocker && <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />}
                         </Label>
                         {task.blocker && (
                            <button onClick={() => handleUpdateTask(task._id, { blocker: '' })} className="text-[9px] font-normal text-red-500 uppercase tracking-widest opacity-0 hover:opacity-100 transition-opacity">Clear Blocker</button>
                         )}
                      </div>
                      <div className="relative group/blocker">
                        <Textarea 
                          placeholder="Document any critical path obstructions..."
                          value={task.blocker || ''}
                          onChange={(e) => handleUpdateTask(task._id, { blocker: e.target.value })}
                          className="min-h-[40px] bg-zinc-50/50 border-0 border-l-4 border-zinc-100 focus:border-red-500 rounded-none p-4 text-[13px] font-medium focus-visible:ring-0 transition-all resize-none italic text-zinc-600"
                        />
                      </div>
                   </div>
                </div>

              {/* Description */}
              <div className="space-y-4 pl-0 md:pl-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-zinc-900 font-normal gap-4">
                   <div className="flex items-center gap-3"><Layout className="w-5 h-5 text-zinc-300" /><h3>Description</h3></div>
                   <div className="flex items-center gap-2">
                      {!isEditingDesc && <Button variant="outline" size="sm" onClick={() => setIsEditingDesc(true)} className="h-8 px-3 text-xs font-normal gap-2 flex-1 sm:flex-none">Edit</Button>}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('attachment-upload').click()}
                        className="h-8 px-3 text-xs font-normal gap-2 flex-1 sm:flex-none"
                      >
                         <Paperclip className="w-4 h-4 text-zinc-500" /> Attachment
                      </Button>
                   </div>
                </div>
                
                {isEditingDesc ? (
                  <div className="space-y-0 relative border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
                     <Toolbar 
                        onSave={() => { handleUpdateTask(task._id, { description: tempDesc }); setIsEditingDesc(false); }}
                        onCancel={() => { setTempDesc(task.description || ''); setIsEditingDesc(false); }}
                     />
                     <Textarea 
                        ref={descRef}
                        value={tempDesc} 
                        onChange={(e) => handleTextChange(e.target.value, 'desc')} 
                        className="w-full bg-white border-0 rounded-none p-6 min-h-[140px] text-[15px] focus-visible:ring-0 resize-none font-medium leading-relaxed overflow-hidden" 
                        autoFocus 
                     />
                     {activeInput === 'desc' && <MentionList />}
                  </div>
                ) : (
                   <div className="space-y-4">
                      <div className={`w-full bg-white border border-transparent rounded-xl p-4 text-[15px] text-zinc-800 min-h-[100px] shadow-sm border-dashed border-2 border-zinc-100`}>
                         <div className={`leading-relaxed ${(!isDescExpanded && task.description?.split('\n').length > 3) ? 'line-clamp-3' : ''}`}>
                            <MarkdownRenderer content={task.description || 'Add a more detailed description...'} />
                         </div>
                         {task.description?.split('\n').length > 3 && (
                           <Button variant="ghost" size="sm" onClick={() => setIsDescExpanded(!isDescExpanded)} className="mt-2 text-[#0052cc] font-normal hover:bg-transparent p-0 h-auto">
                             {isDescExpanded ? 'Show less' : 'Show more'}
                           </Button>
                         )}
                      </div>
                      
                      {/* Attachments Section */}
                      {task.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-4">
                           {task.attachments.map((file, idx) => (
                             <div 
                                key={idx} 
                                onClick={() => {
                                  const baseUrl = import.meta.env.VITE_API_URL || '';
                                  const fullUrl = (file.url.startsWith('blob:') || file.url.startsWith('http')) 
                                    ? file.url 
                                    : `${baseUrl.replace(/\/$/, '')}/${file.url.replace(/^\//, '')}`;
                                  window.open(fullUrl, '_blank');
                                }}
                                className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-white transition-all cursor-pointer group/file"
                             >
                                <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 group-hover/file:bg-black group-hover/file:text-[#fffe01] transition-colors">
                                   <Paperclip className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[13px] font-normal text-zinc-900 line-clamp-1">{file.name}</span>
                                   <span className="text-[10px] text-zinc-400 uppercase font-normal">{file.fileType.split('/')[1] || 'FILE'}</span>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                )}
              </div>

               {/* Checklists */}
               <div className="space-y-12 mb-12">
                  {task.checklists?.map(checklist => {
                     const progress = checklist.items?.length ? Math.round((checklist.items.filter(i=>i.isCompleted).length / checklist.items.length) * 100) : 0;
                     return (
                        <div key={checklist._id} className="space-y-6">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <CheckSquare className="w-5 h-5 text-zinc-900" />
                                 <h3 className="font-normal text-[17px] tracking-tight">{checklist.name}</h3>
                                 <span className="text-[11px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-normal">
                                    {checklist.items?.filter(i => i.isCompleted).length || 0}/{checklist.items?.length || 0}
                                 </span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveChecklist(checklist._id)} className="font-normal text-zinc-700">Delete</Button>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="text-[11px] font-normal text-zinc-500 w-6">{progress}%</span>
                              <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-zinc-300 transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
                           </div>
                           <div className="space-y-3">
                              {checklist.items?.map(item => (
                                 <SubTaskItem 
                                   key={item._id} 
                                   task={{ ...item, checklistId: checklist._id }} 
                                   boardMembers={boardData?.members} 
                                   teamId={boardData?.team?._id || boardData?.team}
                                   onUpdate={(id, updates) => handleUpdateChecklistItem(task._id, checklist._id, id, updates)}
                                   onAddSubTask={handleAddSubTask}
                                   onToggleCompletion={(id, completed) => handleUpdateChecklistItem(task._id, checklist._id, id, { isCompleted: !completed })}
                                   isChecklist={true}
                                   onRefresh={onRefresh}
                                   currentBoardId={task.board?._id || task.board || boardData?._id}
                                 />
                              ))}
                              {activeChecklistForNewItem === checklist._id ? (
                                 <div className="space-y-3 pt-2">
                                    <Textarea placeholder="Add an item" autoFocus className="w-full border-zinc-900 border-2 rounded-xl p-3 text-[14px]" id={`new-item-text-${checklist._id}`} />
                                    <div className="flex items-center gap-2">
                                       <Button onClick={() => { const el = document.getElementById(`new-item-text-${checklist._id}`); if(el.value) { handleAddChecklistItem(checklist._id, el.value); el.value = ''; } }} className="bg-black text-[#fffe01] font-normal rounded-lg px-4 h-9">Add</Button>
                                       <Button variant="ghost" onClick={() => setActiveChecklistForNewItem(null)} className="font-normal text-zinc-600">Cancel</Button>
                                    </div>
                                 </div>
                              ) : (
                                 <Button variant="outline" onClick={() => setActiveChecklistForNewItem(checklist._id)} className="bg-zinc-50 border-zinc-100 font-normal text-[11px] uppercase tracking-widest gap-2 py-2 h-auto rounded-xl text-zinc-500 hover:text-black">Add an item</Button>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>

               {/* Sub-tasks Section */}
               <div className="pt-8 border-t border-zinc-100 space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-zinc-900 rounded-lg shadow-sm">
                           <Layout className="w-4 h-4 text-[#fffe01]" />
                        </div>
                        <h3 className="font-black text-[18px] tracking-tight text-zinc-900 uppercase">Sub-tasks <span className="text-zinc-300 ml-1">Nodes</span></h3>
                        {initialSubTasks.length > 0 && (
                          <span className="text-[11px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-black">
                             {initialSubTasks.length}
                          </span>
                        )}
                     </div>
                  </div>

                  <div className="space-y-3">
                     {initialSubTasks.map(st => (
                        <SubTaskItem 
                           key={st._id} 
                           task={st} 
                           boardMembers={boardData?.members} 
                           teamId={boardData?.team?._id || boardData?.team}
                           onUpdate={handleUpdateTask}
                           onAddSubTask={handleAddSubTask}
                           onRefresh={() => onRefresh && onRefresh()}
                           currentBoardId={boardData?._id}
                        />
                     ))}

                     {isAddingSubTask ? (
                        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                           <div className="bg-white border-2 border-zinc-900 rounded-2xl p-4 shadow-xl">
                              <Textarea 
                                 placeholder="What needs to be done?" 
                                 autoFocus 
                                 className="w-full border-0 focus-visible:ring-0 p-0 text-[15px] font-medium min-h-[60px] resize-none" 
                                 id="new-subtask-title" 
                              />
                              <div className="flex items-center justify-between mt-4 border-t border-zinc-100 pt-4">
                                 <div className="flex items-center gap-2">
                                    <Button 
                                       onClick={() => { 
                                          const el = document.getElementById('new-subtask-title'); 
                                          if(el.value.trim()) { 
                                             handleAddSubTask(task._id, el.value.trim()); 
                                             el.value = ''; 
                                             setIsAddingSubTask(false);
                                          } 
                                       }} 
                                       className="bg-black text-[#fffe01] font-black uppercase tracking-widest text-[10px] rounded-xl px-6 h-10 shadow-lg"
                                    >
                                       Create Node
                                    </Button>
                                    <Button variant="ghost" onClick={() => setIsAddingSubTask(false)} className="font-black uppercase tracking-widest text-[10px] text-zinc-400 hover:text-black">Cancel</Button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <Button 
                           variant="outline" 
                           onClick={() => setIsAddingSubTask(true)} 
                           className="w-full bg-zinc-50 border-zinc-100/50 border-dashed border-2 py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] text-zinc-400 hover:text-black hover:bg-white hover:border-zinc-200 transition-all flex items-center justify-center gap-2"
                        >
                           <Plus className="w-4 h-4" /> Initialize Sub-Node
                        </Button>
                     )}
                  </div>
               </div>
            </div>

            {/* Right Column - Activity */}
            <div className="w-full md:w-[400px] bg-slate-50/50 p-6 md:p-8 flex flex-col border-t md:border-t-0 md:border-l border-zinc-100 overflow-y-auto custom-scrollbar relative">
               {/* Activity Vertical Line Guide */}
               <div className="absolute left-[50px] top-[140px] bottom-10 w-[1px] bg-zinc-200/60 pointer-events-none"></div>
               
               <div className="flex items-center justify-between mb-8 relative z-10 text-zinc-900">
                  <div className="flex items-center gap-2.5 text-zinc-900 font-bold">
                     <MessageSquare className="w-5 h-5 text-zinc-500" />
                     <h3>Activity</h3>
                     {comments.length > 0 && (
                       <span className="text-[11px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded font-black">
                          {comments.length}
                       </span>
                     )}
                  </div>
                  <Button variant="ghost" onClick={() => setShowActivityDetails(!showActivityDetails)} className="text-[13px] font-black uppercase tracking-tight text-zinc-400 hover:text-black">{showActivityDetails ? 'Hide details' : 'Show details'}</Button>
               </div>
               
               <div className="relative mb-10 group/comment">
                  <div className="bg-white border-2 border-zinc-100 focus-within:border-black rounded-xl overflow-hidden transition-all shadow-sm focus-within:shadow-md">
                     <Toolbar 
                        onSave={() => { if(commentText.trim()){ handleAddComment(task._id, commentText); setCommentText(''); } }}
                        onCancel={() => setCommentText('')}
                        showActions={commentText.length > 0}
                     />
                     <Textarea 
                        ref={commentRef}
                        placeholder="Write a comment..." 
                        value={commentText} 
                        onChange={e=>handleTextChange(e.target.value, 'comment')} 
                        onKeyDown={(e) => { 
                           if (e.key === 'Enter' && !e.shiftKey && commentText.trim() && !mentionTriggerPos) { 
                              e.preventDefault(); 
                              handleAddComment(task._id, commentText); 
                              setCommentText(''); 
                           } 
                        }} 
                        className="w-full border-0 rounded-none min-h-[44px] bg-white p-4 text-[14px] focus-visible:ring-0 resize-none font-medium text-zinc-800 overflow-hidden"
                      />
                     {activeInput === 'comment' && <MentionList />}
                  </div>
                  {!commentText.length && (
                    <div className="absolute right-4 bottom-3 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                       <Send className="w-4 h-4 text-zinc-300" />
                    </div>
                  )}
               </div>

               <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">
                  {[...comments.map(c=>({...c, type:'comment'})), ...(showActivityDetails ? history.map(h=>({...h, type:'history'})) : [])]
                    .sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))
                    .map((item, i) => (
                      <div key={item._id || i} className="flex gap-4 group/item relative z-10">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black shrink-0 bg-zinc-900 text-[#fffe01] shadow-lg border-2 border-white ring-1 ring-zinc-200/50 uppercase transition-transform group-hover/item:scale-110">
                           {(item.user.name || 'A').charAt(0)}
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                           <div className="flex items-center justify-between">
                               <div className="text-[14px] flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-zinc-900">{item.user.name}</span>
                                  {item.type === 'history' ? (
                                    <span className="text-zinc-500 font-medium whitespace-pre-wrap">
                                       {(item.action.toLowerCase() === 'completed' && item.details?.toLowerCase().includes('completed')) || 
                                        (item.action.toLowerCase() === 'updated' && item.details)
                                         ? '' 
                                         : item.action.toLowerCase().replace('_',' ') + ' '}
                                       <span className="text-zinc-900 font-bold inline-block"><MarkdownRenderer content={item.details || ''} /></span>
                                    </span>
                                  ) : null}
                                  <span className="text-[10px] font-bold text-zinc-300 ml-1 uppercase tracking-tighter">{getTimeAgo(item.createdAt)}</span>
                               </div>
                              {item.type === 'comment' && item.user._id === currentUser?._id && !editingCommentId && (
                                 <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-white text-zinc-400 hover:text-black" onClick={() => { setEditingCommentId(item._id); setEditCommentText(item.text); }}><Edit2 className="w-3 h-3" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600" onClick={() => handleDeleteComment(item._id)}><Trash2 className="w-3 h-3" /></Button>
                                 </div>
                              )}
                           </div>
                           
                           {item.type === 'comment' && (
                             <>
                               {editingCommentId === item._id ? (
                                 <div className="space-y-0 relative border border-black rounded-lg overflow-hidden shadow-lg mt-2 scale-in-center animate-in fade-in duration-200">
                                    <Toolbar 
                                       onSave={() => { handleUpdateComment(item._id, editCommentText); setEditingCommentId(null); }}
                                       onCancel={() => setEditingCommentId(null)}
                                    />
                                    <Textarea 
                                       ref={editCommentRef}
                                       autoFocus
                                       value={editCommentText} 
                                       onChange={(e) => handleTextChange(e.target.value, 'editComment')}
                                       className="w-full border-0 rounded-none p-4 text-[14px] focus-visible:ring-0 min-h-[80px] overflow-hidden"
                                    />
                                    {activeInput === 'editComment' && <MentionList />}
                                 </div>
                               ) : (
                                 <div className="bg-white px-4 py-3 rounded-2xl text-[14px] text-zinc-900 shadow-sm border border-zinc-200/50 leading-relaxed font-bold">
                                    <MarkdownRenderer content={item.text} />
                                 </div>
                               )}
                             </>
                           )}
                        </div>
                      </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(TaskDetailsModal);