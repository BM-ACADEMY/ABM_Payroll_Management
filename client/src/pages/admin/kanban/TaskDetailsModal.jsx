import { 
  X, ChevronDown, ChevronRight, MoreHorizontal, Plus, Tag, CheckSquare, 
  Paperclip, Layout, MessageSquare, AlignLeft,
  Check, Trash2, Edit2, Send, Bell, Calendar, Clock, 
  TrendingUp, Timer
} from 'lucide-react';
import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  setHours, 
  setMinutes 
} from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import SubTaskItem from './SubTaskItem';
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import Loader from '@/components/ui/Loader';

// --- Sub-components for Optimization ---

const ChecklistHeader = memo(({ checklist, handleRenameChecklist, handleRemoveChecklist }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(checklist.name);
  
  useEffect(() => { setVal(checklist.name); }, [checklist.name]);

  const save = () => {
    const trimmed = val.trim();
    if (trimmed && trimmed !== checklist.name) {
      handleRenameChecklist(checklist._id, trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-zinc-900" />
        {isEditing ? (
          <Input 
            autoFocus
            className="font-normal text-[17px] tracking-tight h-auto p-0 border-none focus-visible:ring-0 bg-transparent w-auto min-w-[100px]"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setIsEditing(false);
            }}
          />
        ) : (
          <h3 
            onDoubleClick={() => setIsEditing(true)}
            className="font-normal text-[17px] tracking-tight cursor-text"
          >
            {checklist.name}
          </h3>
        )}
        <span className="text-[11px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-normal">
          {checklist.items?.filter(i => i.isCompleted).length || 0}/{checklist.items?.length || 0}
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={() => handleRemoveChecklist(checklist._id)} className="font-normal text-zinc-700">Delete</Button>
    </div>
  );
});

const ChecklistItemSection = memo(({ 
  checklist, 
  boardData, 
  task, 
  onChecklistItemUpdate, 
  onChecklistItemToggle, 
  handleAddSubTask, 
  onRefresh,
  handleAddChecklistItem,
  handleAddToTracker
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const progress = checklist.items?.length ? Math.round((checklist.items.filter(i=>i.isCompleted).length / checklist.items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-normal text-zinc-500 w-6">{progress}%</span>
        <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-300 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <div className="space-y-3">
        {checklist.items?.map(item => (
          <SubTaskItem 
            key={item._id} 
            task={item} 
            parentTaskId={task?._id}
            boardMembers={boardData?.members} 
            teamId={boardData?.team?._id || boardData?.team}
            onUpdate={(id, updates) => onChecklistItemUpdate(id, updates, checklist._id)}
            onAddSubTask={handleAddSubTask}
            onAddToTracker={handleAddToTracker}
            onToggleCompletion={(id, completed) => onChecklistItemToggle(id, completed, checklist._id)}
            isChecklist={true}
            onRefresh={onRefresh}
            currentBoardId={task?.board?._id || task?.board || boardData?._id}
          />
        ))}
        {isAdding ? (
          <div className="space-y-3 pt-2">
            <Textarea 
              placeholder="Add an item" 
              autoFocus 
              className="w-full border-zinc-900 border-2 rounded-xl p-3 text-[14px]" 
              id={`new-item-text-${checklist._id}`} 
            />
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => { 
                  const el = document.getElementById(`new-item-text-${checklist._id}`); 
                  if(el.value) { 
                    handleAddChecklistItem(checklist._id, el.value); 
                    el.value = ''; 
                  } 
                }} 
                className="bg-black text-[#fffe01] font-normal rounded-lg px-4 h-9"
              >
                Add
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="font-normal text-zinc-600">Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsAdding(true)} className="bg-zinc-50 border-zinc-100 font-normal text-[11px] uppercase tracking-widest gap-2 py-2 h-auto rounded-xl text-zinc-500 hover:text-black">Add an item</Button>
        )}
      </div>
    </div>
  );
});

// --- Modal Component ---

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
  handleRenameChecklist,
  handleAddSubTask,
  handleAddToTracker,
  getTimeAgo,
  handleUpdateComment,
  handleDeleteComment,
  handleDeleteTask,
  onRefresh,
  currentBoardId,
  allUsers = []
}) => {
  const { toast } = useToast();
  const { task, comments = [], history = [] } = taskDetails || {};
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState(task?.description || '');

  // Mentions State
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionTriggerPos, setMentionTriggerPos] = useState(null);
  const [activeInput, setActiveInput] = useState(null); 

  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [isLabelPickerOpen, setIsLabelPickerOpen] = useState(false);
  const location = useLocation();
  const labelPickerRef = useRef(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isChecklistPickerOpen, setIsChecklistPickerOpen] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('Checklist');
  const [showActivityDetails, setShowActivityDetails] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  // Date picker staging states
  const [stagingDeadline, setStagingDeadline] = useState(task?.deadline || '');
  const [manualDateText, setManualDateText] = useState('');
  const [viewDate, setViewDate] = useState(new Date());

  const descRef = useRef(null);
  const commentRef = useRef(null);
  const editCommentRef = useRef(null);
  const memberPickerRef = useRef(null);
  const datePickerRef = useRef(null);
  const checklistPickerRef = useRef(null);

  useEffect(() => {
    if (isDatePickerOpen) {
      const d = task?.deadline;
      const initialDate = d ? new Date(d) : new Date();
      setStagingDeadline(d || '');
      setManualDateText(d ? format(initialDate, 'dd/MM/yyyy h:mm a') : '');
      setViewDate(initialDate);
    }
  }, [isDatePickerOpen, task?.deadline]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMemberPickerOpen && memberPickerRef.current && !memberPickerRef.current.contains(event.target)) {
        if (!event.target.closest('[data-member-toggle]')) setIsMemberPickerOpen(false);
      }
      if (isLabelPickerOpen && labelPickerRef.current && !labelPickerRef.current.contains(event.target)) {
        if (!event.target.closest('[data-label-toggle]')) setIsLabelPickerOpen(false);
      }
      if (isDatePickerOpen && datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        if (!event.target.closest('[data-date-toggle]')) setIsDatePickerOpen(false);
      }
      if (isChecklistPickerOpen && checklistPickerRef.current && !checklistPickerRef.current.contains(event.target)) {
        if (!event.target.closest('[data-checklist-toggle]')) setIsChecklistPickerOpen(false);
      }
      if (isMoreMenuOpen && moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        if (!event.target.closest('[data-more-toggle]')) setIsMoreMenuOpen(false);
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
    if (task) setTempDesc(task.description || '');
  }, [task?.description]);

  const onChecklistItemUpdate = useCallback((itemId, updates, checklistId) => {
    if (!task?._id) return;
    handleUpdateChecklistItem(task._id, checklistId, itemId, updates);
  }, [task?._id, handleUpdateChecklistItem]);

  const onChecklistItemToggle = useCallback((itemId, completed, checklistId) => {
    if (!task?._id) return;
    handleUpdateChecklistItem(task._id, checklistId, itemId, { isCompleted: !completed });
  }, [task?._id, handleUpdateChecklistItem]);

  const handleTitleSave = useCallback((newTitle) => {
    if (task && newTitle.trim() && newTitle !== task.title) {
      handleUpdateTask(task._id, { title: newTitle });
    }
  }, [task, handleUpdateTask]);

  const isDueSoon = (deadline) => {
    if (!deadline || task?.isCompleted) return false;
    const now = new Date();
    const due = new Date(deadline);
    const diff = (due - now) / (1000 * 60 * 60);
    return diff > 0 && diff <= 8;
  };

  const isOverdue = (deadline) => {
    if (!deadline || task?.isCompleted) return false;
    return new Date(deadline) < new Date();
  };

  const currentUser = { 
    _id: localStorage.getItem('userId'), 
    name: localStorage.getItem('userName'), 
    role: localStorage.getItem('userRole') 
  };

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(task?.title || '');
  useEffect(() => { setEditTitleValue(task?.title || ''); }, [task?.title]);

  // Handle scroll to comment on deep link
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const commentId = searchParams.get('comment');
    if (commentId && comments.length > 0) {
      setTimeout(() => {
        const commentEl = document.getElementById(`comment-${commentId}`);
        if (commentEl) {
          commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          commentEl.style.transition = 'all 0.5s ease-in-out';
          commentEl.style.backgroundColor = 'rgba(255, 254, 1, 0.2)';
          commentEl.style.borderRadius = '1rem';
          commentEl.style.paddingLeft = '1rem';
          commentEl.style.borderLeft = '4px solid #fffe01';
          setTimeout(() => {
            commentEl.style.backgroundColor = 'transparent';
            commentEl.style.borderLeft = 'none';
          }, 4000);
        }
      }, 500);
    }
  }, [comments, location.search]);

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
    const wordsAfter = textToUpdate.substring(mentionTriggerPos).split(' ');
    const rest = wordsAfter.slice(1).join(' ');
    const mention = `@[${user.name}](${user.email}) `;
    const newText = prefix + mention + rest;
    
    if (activeInput === 'comment') setCommentText(newText);
    else if (activeInput === 'desc') setTempDesc(newText);
    else if (activeInput === 'editComment') setEditCommentText(newText);
    
    setMentionSearch('');
    setMentionTriggerPos(null);
    setActiveInput(null);
  };

  const Toolbar = ({ onSave, onCancel, showActions = true }) => (
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
               <div key={m._id} onClick={() => insertMention(m)} className="flex items-center gap-3 p-2 hover:bg-zinc-100 rounded-lg cursor-pointer group/mention transition-all">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 text-[#fffe01] flex items-center justify-center text-[10px] font-normal group-hover/mention:scale-110 transition-transform">
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[1260px] w-full md:w-[95vw] h-full md:h-[88vh] p-0 overflow-hidden border-none shadow-[0_0_80px_-15px_rgba(0,0,0,0.3)] md:rounded-[3rem] rounded-none bg-white flex flex-col custom-modal" showClose={false}>
           <DialogTitle className="sr-only">Task Details</DialogTitle>
           <DialogDescription className="sr-only">Viewing detailed information for {task.title}</DialogDescription>
 
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
                      onChange={(e) => handleUpdateTask(task._id, boardData?.type === 'weekly' ? { board: e.target.value } : { list: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                   >
                      {lists.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                   </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 {task.mentionCount > 0 && (
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
                    <Button variant="ghost" size="icon" data-more-toggle onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className="h-8 w-8 text-zinc-400 hover:text-black hover:bg-zinc-50 rounded-lg">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    {isMoreMenuOpen && (
                      <div ref={moreMenuRef} className="absolute right-0 top-10 w-56 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                            <button onClick={() => handleDeleteTask(task._id)} className="w-full text-left px-4 py-3 text-[13px] font-normal text-red-600 hover:bg-red-50 flex items-center gap-2">
                              <Trash2 className="w-4 h-4" /> Delete Card
                            </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </Button>
           </div>

        <div className="flex-1 overflow-hidden bg-white">
          <div className="flex flex-col md:flex-row h-full">
            <div className="flex-1 p-6 md:p-10 space-y-8 md:space-y-12 overflow-y-auto custom-scrollbar">
                <div className="flex items-start gap-4">
                  <button 
                    onClick={() => handleUpdateTask(task._id, { isCompleted: !task.isCompleted })}
                    className={`w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center mt-1 md:mt-2 transition-all \${task.isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300 hover:border-zinc-400 bg-white'}`}
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
                        onBlur={() => { handleTitleSave(editTitleValue); setIsEditingTitle(false); }}
                        onKeyDown={(e) => { if(e.key === 'Enter') { handleTitleSave(editTitleValue); setIsEditingTitle(false); } }}
                      />
                    ) : (
                      <div className="flex items-center flex-wrap gap-2 md:gap-3">
                        <DialogTitle onDoubleClick={() => setIsEditingTitle(true)} className={`text-xl md:text-[28px] font-normal text-zinc-900 tracking-tight leading-tight cursor-text \${task.isCompleted ? 'text-zinc-400 line-through' : ''}`}>
                          {task.title}
                        </DialogTitle>
                        {task.timeLogLabel && <Badge variant="outline" className="mt-1 md:mt-2 h-5 md:h-6 px-2 text-[8px] md:text-[10px] font-normal bg-slate-50 text-slate-600">{task.timeLogLabel}</Badge>}
                      </div>
                    )}
                  </DialogHeader>
                </div>
               
               <div className="flex flex-wrap items-center gap-2 pl-0 md:pl-10">
                 <Button variant="outline" data-member-toggle onClick={() => setIsMemberPickerOpen(!isMemberPickerOpen)} className="h-8 px-3 border-zinc-200 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 gap-2">
                   <Plus className="w-4 h-4 text-zinc-500" /> Add
                 </Button>
                 <Button variant="outline" data-label-toggle onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)} className="h-8 px-3 border-zinc-200 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 gap-2">
                   <Tag className="w-4 h-4 text-zinc-500" /> Labels
                 </Button>
                 <div className="relative">
                   <Button variant="outline" data-checklist-toggle onClick={() => setIsChecklistPickerOpen(!isChecklistPickerOpen)} className="h-8 px-3 border-zinc-200 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 gap-2">
                      <CheckSquare className="w-4 h-4 text-zinc-500" /> Checklist
                   </Button>
                   {isChecklistPickerOpen && (
                      <div ref={checklistPickerRef} className="absolute top-10 left-0 w-64 bg-white border border-zinc-200 rounded-lg shadow-2xl z-[70] p-4 space-y-4 text-left">
                         <h5 className="text-[14px]">Add Checklist</h5>
                         <div className="space-y-2">
                            <Label className="text-xs text-zinc-500">Title</Label>
                            <Input autoFocus value={newChecklistTitle} onChange={e=>setNewChecklistTitle(e.target.value)} className="h-9" />
                         </div>
                         <Button onClick={() => { handleAddChecklist(task._id, newChecklistTitle); setIsChecklistPickerOpen(false); }} className="w-full bg-[#0052cc] text-white h-9">Add</Button>
                      </div>
                   )}
                 </div>
                 <div className="relative">
                   <Button variant="outline" data-date-toggle onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} className="h-8 px-3 border-zinc-200 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 gap-2">
                      <Clock className="w-4 h-4 text-zinc-500" /> Dates
                   </Button>
                   {isDatePickerOpen && (
                      <div ref={datePickerRef} className="absolute top-10 left-0 w-[280px] bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[70] p-0 overflow-hidden text-left">
                         <div className="p-4 bg-zinc-50/50 border-b flex items-center justify-between">
                            <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">{format(viewDate, 'MMMM yyyy')}</span>
                            <div className="flex gap-2">
                               <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1 hover:bg-zinc-200 rounded-lg"><ChevronRight className="w-3 h-3 rotate-180" /></button>
                               <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 hover:bg-zinc-200 rounded-lg"><ChevronRight className="w-3 h-3" /></button>
                            </div>
                         </div>
                         <div className="p-4 bg-white">
                            <div className="grid grid-cols-7 mb-2 border-b pb-1 text-[9px] font-black text-zinc-300 text-center uppercase">
                               {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                               {(() => {
                                  const start = startOfWeek(startOfMonth(viewDate));
                                  const end = endOfWeek(endOfMonth(viewDate));
                                  const days = eachDayOfInterval({ start, end });
                                  return days.map(day => {
                                     const isSelected = stagingDeadline && isSameDay(day, new Date(stagingDeadline));
                                     const inMonth = isSameMonth(day, viewDate);
                                     return (
                                        <button key={day.toString()} onClick={() => {
                                              const current = stagingDeadline ? new Date(stagingDeadline) : new Date();
                                              const next = setHours(setMinutes(day, current.getMinutes()), current.getHours());
                                              setStagingDeadline(next.toISOString());
                                           }}
                                           className={cn("h-7 w-7 rounded-lg text-[10px] flex items-center justify-center", 
                                             !inMonth ? "text-zinc-200" : "text-zinc-600 font-bold",
                                             isSelected && "bg-black text-white")}>{format(day, 'd')}</button>
                                     );
                                  });
                                })()}
                            </div>
                         </div>
                         <div className="px-4 pb-4 pt-4 border-t">
                             <div className="grid grid-cols-4 gap-1.5 mb-4">
                                <select 
                                   value={stagingDeadline ? (new Date(stagingDeadline).getHours() % 12 || 12) : 12} 
                                   onChange={e => {
                                      const current = new Date(stagingDeadline || new Date());
                                      const isPM = current.getHours() >= 12;
                                      let h = parseInt(e.target.value);
                                      if (isPM && h < 12) h += 12;
                                      if (!isPM && h === 12) h = 0;
                                      setStagingDeadline(setHours(current, h).toISOString());
                                   }} 
                                   className="text-[11px] font-bold bg-zinc-50 border rounded-lg h-9"
                                >
                                   {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{(i+1).toString().padStart(2, '0')}</option>)}
                                </select>
                                <select 
                                   value={stagingDeadline ? new Date(stagingDeadline).getMinutes() : 0} 
                                   onChange={e => setStagingDeadline(setMinutes(new Date(stagingDeadline || new Date()), parseInt(e.target.value)).toISOString())} 
                                   className="text-[11px] font-bold bg-zinc-50 border rounded-lg h-9"
                                >
                                   {Array.from({length: 60}, (_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>)}
                                </select>
                                <select 
                                   value={stagingDeadline ? (new Date(stagingDeadline).getHours() >= 12 ? 'PM' : 'AM') : 'AM'} 
                                   onChange={e => {
                                      const current = new Date(stagingDeadline || new Date());
                                      let h = current.getHours();
                                      if (e.target.value === 'PM' && h < 12) h += 12;
                                      if (e.target.value === 'AM' && h >= 12) h -= 12;
                                      setStagingDeadline(setHours(current, h).toISOString());
                                   }} 
                                   className="text-[11px] font-bold bg-zinc-50 border rounded-lg h-9"
                                >
                                   <option value="AM">AM</option>
                                   <option value="PM">PM</option>
                                </select>
                                <Button variant="ghost" className="h-9 text-[9px] uppercase font-black px-0" onClick={() => { const now = new Date(); setStagingDeadline(now.toISOString()); setViewDate(now); }}>Now</Button>
                             </div>
                             <div className="flex gap-3 pt-4 border-t">
                                <Button className="flex-1 h-10 bg-black text-[#fffe01] font-bold text-[11px] rounded-xl" onClick={() => { if(stagingDeadline) handleUpdateTask(task._id, { deadline: stagingDeadline }); setIsDatePickerOpen(false); }}>Save Date</Button>
                                <Button variant="ghost" className="h-10 px-4 text-[10px] text-red-500 font-bold" onClick={() => { handleUpdateTask(task._id, { deadline: null }); setIsDatePickerOpen(false); }}>Clear</Button>
                             </div>
                         </div>
                      </div>
                   )}
                 </div>
               </div>
 
                <div className="flex flex-col sm:flex-row flex-wrap items-start gap-8 md:gap-12 pl-2 md:pl-10 mb-2">
                   <div className="space-y-3">
                      <h4 className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">Members</h4>
                      <div className="flex flex-wrap gap-2 items-center">
                         {task.assignees?.map(a => (
                           <div key={a._id} className="w-8 h-8 rounded-full bg-zinc-900 text-[#fffe01] flex items-center justify-center text-[10px] font-normal shadow-sm border-2 border-white ring-1 ring-zinc-100" title={a.name}>{a.name.split(' ').map(n=>n[0]).join('')}</div>
                         ))}
                         <div className="relative">
                             <button data-member-toggle onClick={() => setIsMemberPickerOpen(!isMemberPickerOpen)} className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400"><Plus className="w-4 h-4" /></button>
                             {isMemberPickerOpen && (
                                <div ref={memberPickerRef} className="absolute top-10 left-0 w-[280px] bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[70] p-4 space-y-4">
                                   <div className="flex items-center justify-between"><span className="text-xs text-zinc-400 uppercase">Manage Members</span><X className="w-4 h-4 text-zinc-400 cursor-pointer" onClick={()=>setIsMemberPickerOpen(false)} /></div>
                                   <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                                      {task.assignees?.length > 0 && <div className="space-y-2"><h5 className="text-[9px] text-zinc-400 uppercase">In this vector</h5>{task.assignees.map(m => <div key={m._id} className="flex items-center justify-between p-1.5 hover:bg-zinc-50 rounded-xl"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-zinc-900 text-[#fffe01] flex items-center justify-center text-[9px]">{m.name.split(' ').map(n=>n[0]).join('')}</div><span>{m.name}</span></div><X onClick={() => handleUpdateTask(task._id, { assignees: task.assignees.filter(a=>a._id !== m._id).map(a=>a._id) })} className="w-3.5 h-3.5 text-zinc-300 cursor-pointer" /></div>)}</div>}
                                      <div className="space-y-2"><h5 className="text-[9px] text-zinc-400 uppercase">Available Nodes</h5>{(boardData?.members || []).filter(m => !task.assignees?.some(a=>a._id === m._id)).map(m => <div key={m._id} onClick={() => handleUpdateTask(task._id, { assignees: [...(task.assignees?.map(a=>a._id) || []), m._id] })} className="flex items-center gap-3 p-1.5 hover:bg-zinc-50 rounded-xl cursor-pointer"><div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-[9px]">{m.name.split(' ').map(n=>n[0]).join('')}</div><span>{m.name}</span></div>)}</div>
                                   </div>
                                </div>
                             )}
                         </div>
                      </div>
                   </div>
 
                   <div className="space-y-3">
                      <h4 className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">Labels</h4>
                       <div className="flex flex-wrap gap-2 items-center">
                          {task.labels?.map((l, i) => <Badge key={i} style={{ backgroundColor: l.color }} className="text-white border-none rounded-lg h-8 px-4 text-[10px] font-normal uppercase shadow-sm">{l.text}</Badge>)}
                           <div className="relative">
                              <button data-label-toggle onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)} className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400"><Plus className="w-4 h-4" /></button>
                              {isLabelPickerOpen && (
                                 <div ref={labelPickerRef} className="absolute top-10 left-0 w-[240px] bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[70] p-4 space-y-4">
                                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                       {[ {t:'Done', c:'#51cc9e'}, {t:'Under QC', c:'#f1d643'}, {t:'Waiting for requirement', c:'#ff9f1a'}, {t:'Not yet started', c:'#f87171'}, {t:'On hold', c:'#c084fc'}, {t:'In process', c:'#60a5fa'} ].map((opt, i) => {
                                          const isLabeled = task.labels?.some(l => l.text === opt.t);
                                          return (
                                             <div key={i} onClick={() => handleUpdateLabels({ text: opt.t, color: opt.c })} className="flex items-center gap-3 p-1.5 hover:bg-zinc-50 rounded-xl cursor-pointer group">
                                                <div className={cn("w-4 h-4 rounded border flex items-center justify-center", isLabeled ? "bg-zinc-900 border-zinc-900" : "bg-white border-zinc-200")}>{isLabeled && <Check className="w-2.5 h-2.5 text-[#fffe01]" />}</div>
                                                <div className="w-2.5 h-8 rounded-md" style={{ backgroundColor: opt.c }}></div>
                                                <span className={cn("text-[11px] uppercase flex-1", isLabeled ? "text-zinc-900" : "text-zinc-500")}>{opt.t}</span>
                                             </div>
                                          );
                                       })}
                                    </div>
                                 </div>
                              )}
                           </div>
                       </div>
                   </div>
 
                   {task.deadline && (
                     <div className="space-y-3">
                        <h4 className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">Projected Date</h4>
                        <div onClick={() => setIsDatePickerOpen(true)} className={cn("flex items-center gap-3 px-4 py-1.5 rounded-xl border-2 cursor-pointer shadow-sm", isOverdue(task.deadline) ? "bg-red-50 border-red-200 text-red-700" : isDueSoon(task.deadline) ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-zinc-50 border-zinc-200 text-zinc-700")}>
                           <Clock className="w-4 h-4" />
                           <span className="text-[13px]">{format(new Date(task.deadline), 'MMM d, yyyy, h:mm a')}</span>
                        </div>
                     </div>
                   )}
                 </div>
 
                 {/* Description and Checklists */}
                 <div className="space-y-10 pl-0 md:pl-10">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 text-zinc-900 font-bold"><AlignLeft className="w-5 h-5 text-zinc-500" /><h3>Description</h3></div>
                          <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(!isEditingDesc)} className="text-xs font-normal">{isEditingDesc ? 'Cancel' : 'Edit'}</Button>
                       </div>
                       {isEditingDesc ? (
                         <div className="space-y-0 relative border-2 border-black rounded-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95">
                            <Toolbar onSave={() => { handleUpdateTask(task._id, { description: tempDesc }); setIsEditingDesc(false); }} onCancel={() => { setIsEditingDesc(false); setTempDesc(task.description || ''); }} />
                            <Textarea ref={descRef} value={tempDesc} onChange={e=>handleTextChange(e.target.value, 'desc')} className="min-h-[200px] border-0 focus-visible:ring-0 text-[14px] p-6 leading-relaxed" />
                            {activeInput === 'desc' && <MentionList />}
                         </div>
                       ) : (
                         <div className="bg-zinc-50/50 p-6 rounded-[2rem] text-[15px] text-zinc-700 leading-relaxed"><MarkdownRenderer content={task.description || '*No description provided node-wide.*'} /></div>
                       )}
                    </div>
 
                    <div className="space-y-12 mb-12">
                       {task.checklists?.map(checklist => (
                          <div key={checklist._id} className="space-y-6">
                             <ChecklistHeader 
                                checklist={checklist} 
                                handleRenameChecklist={handleRenameChecklist} 
                                handleRemoveChecklist={handleRemoveChecklist} 
                             />
                             <ChecklistItemSection 
                                checklist={checklist}
                                boardData={boardData}
                                task={task}
                                onChecklistItemUpdate={onChecklistItemUpdate}
                                onChecklistItemToggle={onChecklistItemToggle}
                                handleAddSubTask={handleAddSubTask}
                                handleAddToTracker={handleAddToTracker}
                                onRefresh={onRefresh}
                                handleAddChecklistItem={handleAddChecklistItem}
                             />
                          </div>
                       ))}
                    </div>
                 </div>
             </div>
 
             <div className="w-full md:w-[400px] bg-slate-50/50 p-6 md:p-8 flex flex-col border-t md:border-t-0 md:border-l relative overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8"><div className="flex items-center gap-2.5 font-bold"><MessageSquare className="w-5 h-5 text-zinc-500" /><h3>Activity</h3>{comments.length > 0 && <span className="text-[11px] bg-zinc-200 px-1.5 py-0.5 rounded">{comments.length}</span>}</div><Button variant="ghost" onClick={() => setShowActivityDetails(!showActivityDetails)} className="text-[13px] font-black">{showActivityDetails ? 'Hide details' : 'Show details'}</Button></div>
                <div className="relative mb-10">
                   <div className="bg-white border-2 border-zinc-100 rounded-xl overflow-hidden transition-all shadow-sm">
                      <Toolbar onSave={() => { if(commentText.trim()){ handleAddComment(task._id, commentText); setCommentText(''); } }} onCancel={() => setCommentText('')} showActions={commentText.length > 0} />
                      <Textarea ref={commentRef} placeholder="Write a comment..." value={commentText} onChange={e=>handleTextChange(e.target.value, 'comment')} className="w-full border-0 rounded-none p-4 text-[14px] focus-visible:ring-0 min-h-[60px]" />
                      {activeInput === 'comment' && <MentionList />}
                   </div>
                </div>
                <div className="flex-1 space-y-6">
                   {[...comments.map(c=>({...c, type:'comment'})), ...(showActivityDetails ? history.map(h=>({...h, type:'history'})) : [])].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)).map((item, i) => (
                       <div key={item._id || i} id={`comment-${item._id}`} className="flex gap-4">
                         <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-zinc-900 text-[#fffe01]">{(item.user.name || 'A').charAt(0)}</div>
                         <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center justify-between text-[14px]">
                                <div className="flex flex-wrap gap-1.5 items-center"><span className="font-bold">{item.user.name}</span>{item.type === 'history' && <span className="text-zinc-500">{item.action.toLowerCase().replace('_',' ')} <MarkdownRenderer content={item.details || ''} /></span>}<span className="text-[10px] text-zinc-300 uppercase">{getTimeAgo(item.createdAt)}</span></div>
                                {item.type === 'comment' && (item.user._id === currentUser?._id || currentUser?.role === 'admin') && !editingCommentId && (
                                   <div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCommentId(item._id); setEditCommentText(item.text); }}><Edit2 className="w-3 h-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCommentToDelete(item._id); setIsDeleteDialogOpen(true); }}><Trash2 className="w-3 h-3" /></Button></div>
                                )}
                            </div>
                            {item.type === 'comment' && (editingCommentId === item._id ? (
                              <div className="border border-black rounded-lg overflow-hidden mt-2 scale-in-center">
                                 <Toolbar onSave={() => { handleUpdateComment(item._id, editCommentText); setEditingCommentId(null); }} onCancel={() => setEditingCommentId(null)} />
                                 <Textarea ref={editCommentRef} autoFocus value={editCommentText} onChange={(e) => handleTextChange(e.target.value, 'editComment')} className="w-full border-0 p-4 text-[14px] focus-visible:ring-0 min-h-[80px]" />
                                 {activeInput === 'editComment' && <MentionList />}
                              </div>
                            ) : <div className="bg-white px-4 py-3 rounded-2xl text-[14px] shadow-sm border leading-relaxed"><MarkdownRenderer content={item.text} /></div>)}
                         </div>
                       </div>
                   ))}
                </div>
             </div>
           </div>
         </div>
       </DialogContent>
     </Dialog>
     <ConfirmDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={() => { if(commentToDelete) { handleDeleteComment(commentToDelete); setCommentToDelete(null); } }} title="Delete Comment?" description="This action will remove the comment permanently node-wide." />
     </>
   );
 };
 
 export default TaskDetailsModal;
