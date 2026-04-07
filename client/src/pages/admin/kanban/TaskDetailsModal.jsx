import { 
  X, ChevronDown, MoreHorizontal, Plus, Tag, CheckSquare, 
  Paperclip, Layout, Bold, Italic, Link, MessageSquare,
  Check, Trash2, Edit2, Send, List, Bell, Calendar, Clock,
  TrendingUp
} from 'lucide-react';
import { memo, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import SubTaskItem from './SubTaskItem';

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
  renderMarkdown,
  handleUpdateComment,
  handleDeleteComment,
  handleDeleteTask,
  onRefresh,
  currentBoardId
}) => {
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState(taskDetails?.task?.description || '');
  
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
  const moreMenuRef = useRef(null);

  // Date picker staging states
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

    const lastChar = text[text.length - 1];
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
    // Format as @Name@email.com for internal parsing but clear for user
    const mention = `@${user.name.replace(/\s/g, '')}@${user.email} `;
    const newText = prefix + mention;
    
    if (activeInput === 'comment') setCommentText(newText);
    else if (activeInput === 'desc') setTempDesc(newText);
    else if (activeInput === 'editComment') setEditCommentText(newText);
    
    setMentionSearch('');
    setMentionTriggerPos(null);
    setActiveInput(null);
  };

  const handleCopyTask = async (targetType) => {
    try {
      const token = sessionStorage.getItem('token');
      // 1. Get the special board
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/special/${targetType}`, {
        headers: { 'x-auth-token': token }
      });
      
      const targetBoard = res.data.board || res.data;
      if (!targetBoard) throw new Error(`Could not find ${targetType} board`);
      
      // 2. Refresh the board/list IDs
      const listsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/${targetBoard._id}`, {
        headers: { 'x-auth-token': token }
      });
      
      const targetLists = listsRes.data.lists || [];
      let listId = targetLists[0]?._id;
      let todayName = '';

      if (targetType === 'daily') {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        todayName = days[new Date().getDay()];
        listId = targetLists.find(l => l.title === todayName)?._id || listId;
      }
      
      if (!listId) {
        toast({ variant: "destructive", title: "Error", description: "Target board has no columns" });
        return;
      }
      
      // 3. Perform conversion (Copy)
      const payload = {
        title: task.title,
        description: task.description || `Copied from ${boardData.title}`,
        listId: listId,
        boardId: targetBoard._id,
        position: 0,
        deadline: task.deadline,
        assignees: task.assignees?.map(a => a._id || a) || [],
        originTaskId: task._id
      };
      
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/tasks`, payload, {
        headers: { 'x-auth-token': token }
      });
      
      toast({ 
        title: "Success", 
        description: `Copied to ${targetType === 'daily' ? `Daily Board (${todayName})` : 'Weekly Board'}.` 
      });
      setIsMoreMenuOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Copy Error:', err);
      toast({ variant: "destructive", title: "Error", description: "Failed to copy task" });
    }
  };

  const Toolbar = ({ targetText, setTargetText, onSave, onCancel, showActions = true, textareaRef }) => {
    const handleFormat = (openTag, closeTag, placeholder) => {
      if (!textareaRef?.current) {
        setTargetText(targetText + openTag + placeholder + closeTag);
        return;
      }
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = targetText.substring(start, end);
      const before = targetText.substring(0, start);
      const after = targetText.substring(end);

      const content = selected || placeholder;
      const newText = before + openTag + content + closeTag + after;
      
      setTargetText(newText);
      
      // Need to wait for React to re-render before setting selection
      setTimeout(() => {
        textarea.focus();
        const cursorPosition = start + openTag.length + content.length + closeTag.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    };

    return (
      <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-t-lg px-2 py-1.5 border-b-0">
         <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-white text-zinc-500" onClick={() => handleFormat('**', '**', 'bold')}><Bold className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-white text-zinc-500" onClick={() => handleFormat('_', '_', 'italic')}><Italic className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-white text-zinc-500" onClick={() => handleFormat('\n- ', '', 'list item')}><List className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-white text-zinc-500" onClick={() => handleFormat('[', '](url)', 'text')}><Link className="w-3.5 h-3.5" /></Button>
         </div>
         {showActions && (
           <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 px-2 text-[11px] font-black text-zinc-500 hover:text-red-600 transition-colors uppercase tracking-tight">Cancel</Button>
              <Button onClick={onSave} className="h-7 px-3 text-[11px] font-black bg-black text-[#fffe01] rounded uppercase tracking-tight shadow-sm hover:scale-105 transition-transform">Save</Button>
           </div>
         )}
      </div>
    );
  };

  const MentionList = () => {
    if (mentionTriggerPos === null) return null;
    const filtered = boardData.members.filter(m => 
      m.name.toLowerCase().includes(mentionSearch.toLowerCase()) || 
      m.email.toLowerCase().includes(mentionSearch.toLowerCase())
    );
    if (filtered.length === 0) return null;

    return (
      <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-2xl z-[100] p-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
         <div className="px-2 py-1.5 mb-1 border-b border-zinc-100">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tag a person</span>
         </div>
         <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filtered.map(m => (
               <div 
                 key={m._id} 
                 onClick={() => insertMention(m)}
                 className="flex items-center gap-3 p-2 hover:bg-zinc-100 rounded-lg cursor-pointer group/mention transition-all"
               >
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 text-[#fffe01] flex items-center justify-center text-[10px] font-black shadow-sm group-hover/mention:scale-110 transition-transform">
                    {m.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-zinc-800">{m.name}</span>
                    <span className="text-[10px] text-zinc-400 font-medium">@{m.email.split('@')[0]}</span>
                  </div>
               </div>
            ))}
         </div>
      </div>
    );
  };

  if (!taskDetails) return null;

  const { task, comments, history } = taskDetails;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1100px] h-[90vh] border-none shadow-2xl rounded-lg p-0 overflow-hidden bg-white flex flex-col" showClose={false}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-zinc-100 shrink-0">
           <div className="flex items-center gap-2">
             <div className="relative group/status">
                <div className="flex items-center gap-1 bg-zinc-100 px-3 py-1.5 rounded hover:bg-zinc-200 cursor-pointer transition-all">
                   <span className="text-[13px] font-medium text-zinc-700">{lists.find(l => l._id === (task.list?._id || task.list))?.title || 'List'}</span>
                   <ChevronDown className="w-4 h-4 text-zinc-500" />
                </div>
                <select 
                  value={task.list?._id || task.list}
                  onChange={(e) => handleUpdateTask(task._id, { list: e.target.value })}
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
                <div className="relative group/mention">
                  <Bell className="w-4 h-4 text-red-500 fill-current animate-pulse cursor-pointer shadow-sm" />
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white font-bold">
                    {task.mentionCount}
                  </span>
                </div>
              )}

              {task.checklists?.some(cl => cl.items?.length > 0) && (
                <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-50 px-2 py-1 rounded border border-zinc-200">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold text-zinc-600">
                    {task.checklists.reduce((acc, cl) => acc + (cl.items?.filter(i => i.isCompleted).length || 0), 0)}/
                    {task.checklists.reduce((acc, cl) => acc + (cl.items?.length || 0), 0)}
                  </span>
                </div>
              )}

              <div className="h-4 w-px bg-zinc-200 mx-1"></div>

              <div className="relative flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  data-more-toggle
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="h-8 w-8 text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                
                {isMoreMenuOpen && (
                  <div ref={moreMenuRef} className="absolute right-0 top-10 w-48 bg-white border border-zinc-200 rounded-lg shadow-xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                      onClick={() => {
                        const url = window.location.href.split('?')[0] + '?task=' + task._id;
                        navigator.clipboard.writeText(url);
                        toast({ title: "Link Copied", description: "Task link copied to clipboard" });
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                    >
                      <Link className="w-4 h-4" /> Share Card
                    </button>
                    
                    {boardData.type === 'regular' && (
                      <button 
                        onClick={() => handleCopyTask('weekly')}
                        className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" /> Copy to Weekly
                      </button>
                    )}

                    {boardData.type === 'weekly' && (
                      <button 
                        onClick={() => handleCopyTask('daily')}
                        className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4" /> Copy to Daily
                      </button>
                    )}

                    <div className="h-px bg-zinc-100 my-1" />
                    <button 
                      onClick={() => handleDeleteTask(task._id)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Task
                    </button>
                  </div>
                )}

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-hidden bg-white">
          <div className="flex flex-col md:flex-row h-full">
            {/* Left Column */}
            <div className="flex-1 p-10 space-y-12 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleUpdateTask(task._id, { isCompleted: !task.isCompleted })}
                      className={`w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${task.isCompleted ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm' : 'border-zinc-300 hover:border-zinc-400 bg-white'}`}
                    >
                      {task.isCompleted && <Check className="w-4 h-4" />}
                    </button>
                    <DialogHeader className="p-0 space-y-0 text-left flex-1">
                      {isEditingTitle ? (
                        <Input 
                          autoFocus
                          className="text-[28px] font-bold text-zinc-900 tracking-tight leading-tight h-auto p-0 border-none focus-visible:ring-0 bg-transparent"
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          onBlur={handleTitleSave}
                          onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                        />
                      ) : (
                        <DialogTitle 
                          onDoubleClick={() => setIsEditingTitle(true)}
                          className={`text-[28px] font-bold text-zinc-900 tracking-tight leading-tight transition-all cursor-text ${task.isCompleted ? 'text-zinc-400 line-through decoration-zinc-300' : ''}`}
                        >
                          {task.title}
                        </DialogTitle>
                      )}
                      <DialogDescription className="sr-only">
                        Task details and management for {task.title}
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  
                  {task.originTaskId && (
                    <div className="flex items-center gap-2 pl-12">
                       <Badge variant="outline" className="bg-zinc-50 text-zinc-500 border-zinc-200 text-[10px] font-bold py-0 h-5">
                          COPIED FROM PROJECT
                       </Badge>
                       <span className="text-[11px] text-zinc-400 font-medium italic">Track progress across boards</span>
                    </div>
                  )}
                 
                 <div className="flex items-center gap-2 pl-10">
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
                          <h5 className="text-[14px] font-bold text-zinc-700 pb-2 border-b border-zinc-100">Add Checklist</h5>
                          <div className="space-y-2">
                             <Label className="text-xs font-bold text-zinc-500">Title</Label>
                             <Input 
                               autoFocus
                               value={newChecklistTitle} 
                               onChange={e=>setNewChecklistTitle(e.target.value)}
                               className="h-9 rounded-md border-zinc-300" 
                             />
                          </div>
                          <Button 
                            onClick={() => { handleAddChecklist(task._id, newChecklistTitle); setIsChecklistPickerOpen(false); }}
                            className="w-full bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold h-9 rounded-md"
                          >
                             Add
                          </Button>
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
              </div>

              <div className="flex flex-wrap items-start gap-8 pl-10 mb-8">
                {/* Members */}
                <div className="space-y-2">
                   <h4 className="text-[12px] font-bold text-zinc-500">Members</h4>
                   <div className="flex flex-wrap gap-2 items-center">
                      {task.assignees?.map(a => (
                        <div key={a._id} className="w-8 h-8 rounded-full bg-[#0052cc] text-white flex items-center justify-center text-[11px] font-bold shadow-sm border-2 border-white ring-1 ring-zinc-300" title={a.name}>
                           {a.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                      ))}
                       <div className="relative">
                          <div data-member-toggle onClick={() => setIsMemberPickerOpen(!isMemberPickerOpen)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 cursor-pointer border border-zinc-200 transition-all shadow-sm"><Plus className="w-4 h-4" /></div>
                         {isMemberPickerOpen && (
                            <div ref={memberPickerRef} className="absolute top-10 left-0 w-[304px] bg-white border border-zinc-200 rounded-lg shadow-[0_12px_24px_rgba(0,0,0,0.15)] z-[70] p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                               <div className="flex items-center justify-between mb-2">
                                  <span className="text-[14px] font-bold text-zinc-700 w-full text-center">Members</span>
                                  <X className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-black absolute right-4" onClick={()=>setIsMemberPickerOpen(false)} />
                               </div>
                               <Input placeholder="Search members" className="h-9 text-sm rounded-sm border-zinc-300" />
                               <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                  {task.assignees?.length > 0 && (
                                     <div className="space-y-2">
                                        <h5 className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight">Card members</h5>
                                        {task.assignees.map(m => (
                                           <div key={m._id} className="flex items-center justify-between p-1 group">
                                              <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 rounded-full bg-[#0052cc] text-white flex items-center justify-center text-[10px] font-bold">{m.name.split(' ').map(n=>n[0]).join('')}</div>
                                                 <span className="text-[13px] font-medium text-zinc-800">{m.name}</span>
                                              </div>
                                              <X onClick={() => handleUpdateTask(task._id, { assignees: task.assignees.filter(a=>a._id !== m._id).map(a=>a._id) })} className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-black" />
                                           </div>
                                        ))}
                                     </div>
                                  )}
                                  <div className="space-y-2">
                                     <h5 className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight">Board members</h5>
                                     {boardData.members.filter(m => !task.assignees?.some(a=>a._id === m._id)).map(m => (
                                        <div 
                                          key={m._id} 
                                          onClick={() => handleUpdateTask(task._id, { assignees: [...(task.assignees?.map(a=>a._id) || []), m._id] })}
                                          className="flex items-center gap-3 p-1 hover:bg-zinc-100 rounded-md cursor-pointer group"
                                        >
                                           <div className="w-8 h-8 rounded-full bg-zinc-800 text-[#fffe01] flex items-center justify-center text-[10px] font-bold">{m.name.split(' ').map(n=>n[0]).join('')}</div>
                                           <span className="text-[13px] font-medium text-zinc-800">{m.name}</span>
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
                <div className="space-y-2">
                   <h4 className="text-[12px] font-bold text-zinc-500">Labels</h4>
                    <div className="flex flex-wrap gap-2 items-center">
                       {task.labels?.map((l, i) => (
                         <Badge key={i} style={{ backgroundColor: l.color }} className="text-white border-none rounded h-8 px-3 text-[12px] font-bold tracking-tight min-w-[40px] shadow-sm">{l.text}</Badge>
                       ))}
                        <div className="relative">
                           <div data-label-toggle onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)} className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 cursor-pointer border border-zinc-200 transition-all font-bold shadow-sm"><Plus className="w-4 h-4" /></div>
                          {isLabelPickerOpen && (
                             <div ref={labelPickerRef} className="absolute top-10 left-0 w-[304px] bg-white border border-zinc-200 rounded-lg shadow-[0_12px_24px_rgba(0,0,0,0.15)] z-[70] p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <span className="text-[14px] font-bold text-zinc-700 w-full text-center inline-block mb-2">Labels</span>
                                <Input placeholder="Search labels..." className="h-9 text-sm rounded-sm border-zinc-300" />
                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                   {[ {t:'Done', c:'#51cc9e'}, {t:'Under QC', c:'#f1d643'}, {t:'Waiting for requirement', c:'#ff9f1a'}, {t:'Not yet started', c:'#f87171'}, {t:'On hold', c:'#c084fc'}, {t:'In process', c:'#60a5fa'} ].map((opt, i) => {
                                      const isLabeled = task.labels?.some(l => l.text === opt.t);
                                      return (
                                         <div key={i} className="flex items-center gap-2 group">
                                            <div onClick={() => handleUpdateLabels({ text: opt.t, color: opt.c })} className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-all cursor-pointer ${isLabeled ? 'border-[#0052cc] bg-[#0052cc]' : 'border-zinc-300 bg-white'}`}>{isLabeled && <Check className="w-3 h-3 text-white" />}</div>
                                            <div onClick={() => handleUpdateLabels({ text: opt.t, color: opt.c })} style={{ backgroundColor: opt.c }} className="flex-1 h-8 rounded px-3 flex items-center text-[12px] font-bold text-white cursor-pointer shadow-sm">{opt.t}</div>
                                         </div>
                                      );
                                   })}
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Due date */}
                 <div className="space-y-3">
                    <h4 className="text-[12px] font-bold text-zinc-500">Due date</h4>
                    <div className="relative">
                       <div 
                        data-date-toggle
                          onClick={() => {
                             const start = task.startTime ? new Date(task.startTime) : null;
                             const due = task.deadline ? new Date(task.deadline) : null;
                             setTempStartDate(start ? start.toISOString().split('T')[0] : '');
                             setTempStartTime(start ? start.toTimeString().split(' ')[0].substring(0,5) : '09:00');
                             setIsStartChecked(!!start);
                             setTempDueDate(due ? due.toISOString().split('T')[0] : '');
                             setTempDueTime(due ? due.toTimeString().split(' ')[0].substring(0,5) : '17:00');
                             setIsDueChecked(!!due);
                             setIsDatePickerOpen(!isDatePickerOpen);
                          }}
                          className="flex items-center gap-3 bg-zinc-100 border border-zinc-200 rounded-md px-3 py-2 cursor-pointer hover:bg-zinc-200 transition-all w-fit"
                        >
                          <span className="text-[14px] font-medium text-zinc-800">
                             {task.deadline ? new Date(task.deadline).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Set Due Date'}
                          </span>
                          {task.deadline && (
                             <>
                                {isOverdue(task.deadline) ? <Badge className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border-none shadow-sm">Overdue</Badge> : isDueSoon(task.deadline) && <Badge className="bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded border-none shadow-sm animate-pulse">Due soon</Badge>}
                             </>
                          )}
                          <ChevronDown className="w-4 h-4 text-zinc-500" />
                       </div>
                       {isDatePickerOpen && (
                          <div ref={datePickerRef} className="absolute top-12 left-0 w-[300px] bg-white border border-zinc-200 rounded-lg shadow-2xl z-[70] p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                             <span className="text-[14px] font-bold text-zinc-700 w-full text-center inline-block">Dates</span>
                             <div className="space-y-4">
                                <div className="space-y-1.5">
                                   <span className="text-[12px] font-bold text-zinc-600">Start date</span>
                                   <div className="flex items-center gap-2">
                                      <div onClick={()=>setIsStartChecked(!isStartChecked)} className={`w-5 h-5 rounded-sm border-2 shrink-0 cursor-pointer flex items-center justify-center ${isStartChecked ? 'border-[#0052cc] bg-[#0052cc]' : 'border-zinc-200'}`}>{isStartChecked && <Check className="w-3 h-3 text-white" />}</div>
                                      <input type="date" value={tempStartDate} onChange={e=>setTempStartDate(e.target.value)} disabled={!isStartChecked} className="h-9 rounded-md border border-zinc-300 text-xs font-bold px-2 flex-1"/>
                                      <input type="time" value={tempStartTime} onChange={e=>setTempStartTime(e.target.value)} disabled={!isStartChecked} className="h-9 rounded-md border border-zinc-300 text-xs font-bold w-24 px-2"/>
                                   </div>
                                </div>
                                <div className="space-y-1.5">
                                   <span className="text-[12px] font-bold text-zinc-600">Due date</span>
                                   <div className="flex items-center gap-2">
                                      <div onClick={()=>setIsDueChecked(!isDueChecked)} className={`w-5 h-5 rounded-sm border-2 shrink-0 cursor-pointer flex items-center justify-center ${isDueChecked ? 'border-[#0052cc] bg-[#0052cc]' : 'border-zinc-200'}`}>{isDueChecked && <Check className="w-3 h-3 text-white" />}</div>
                                      <input type="date" value={tempDueDate} onChange={e=>setTempDueDate(e.target.value)} disabled={!isDueChecked} className="h-9 rounded-md border border-zinc-300 text-xs font-bold px-2 flex-1"/>
                                      <input type="time" value={tempDueTime} onChange={e=>setTempDueTime(e.target.value)} disabled={!isDueChecked} className="h-9 rounded-md border border-zinc-300 text-xs font-bold w-24 px-2"/>
                                   </div>
                                </div>
                                <Button onClick={() => { 
                                   handleUpdateTask(task._id, { startTime: isStartChecked ? `${tempStartDate}T${tempStartTime}:00` : null, deadline: isDueChecked ? `${tempDueDate}T${tempDueTime}:00` : null }); 
                                   setIsDatePickerOpen(false); 
                                }} className="w-full bg-[#0052cc] text-white font-bold h-10 mt-2 hover:bg-[#0747a6] rounded-md transition-all">Save</Button>
                                <Button variant="ghost" onClick={() => { handleUpdateTask(task._id, { deadline: null, startTime: null }); setIsDatePickerOpen(false); }} className="w-full text-zinc-500 font-bold h-10 text-[14px] hover:bg-zinc-100 transition-all">Remove</Button>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Description */}
              <div className="space-y-4 pl-6 relative">
                <div className="flex items-center justify-between text-zinc-900 font-bold">
                   <div className="flex items-center gap-3"><Layout className="w-5 h-5 text-zinc-300" /><h3>Description</h3></div>
                   <div className="flex items-center gap-2">
                      {!isEditingDesc && <Button variant="outline" size="sm" onClick={() => setIsEditingDesc(true)} className="h-8 px-3 text-xs font-bold gap-2">Edit</Button>}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('attachment-upload').click()}
                        className="h-8 px-3 text-xs font-bold gap-2"
                      >
                         <Paperclip className="w-4 h-4 text-zinc-500" /> Attachment
                      </Button>
                   </div>
                </div>
                
                {isEditingDesc ? (
                  <div className="space-y-0 relative border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
                     <Toolbar 
                        targetText={tempDesc} 
                        setTargetText={setTempDesc} 
                        onSave={() => { handleUpdateTask(task._id, { description: tempDesc }); setIsEditingDesc(false); }}
                        onCancel={() => { setTempDesc(task.description || ''); setIsEditingDesc(false); }}
                        textareaRef={descRef}
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
                      <div className="w-full bg-white border border-transparent rounded-xl p-4 text-[15px] text-zinc-800 min-h-[100px] shadow-sm border-dashed border-2 border-zinc-100">
                         <div className={`whitespace-pre-wrap leading-relaxed ${(!isDescExpanded && task.description?.split('\n').length > 3) ? 'line-clamp-3' : ''}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(task.description) || '<span class="text-zinc-400 italic">Add a more detailed description...</span>' }} />
                         {task.description?.split('\n').length > 3 && (
                           <Button variant="ghost" size="sm" onClick={() => setIsDescExpanded(!isDescExpanded)} className="mt-2 text-[#0052cc] font-bold hover:bg-transparent p-0 h-auto">
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
                                 const fullUrl = file.url.startsWith('blob:') 
                                   ? file.url 
                                   : `${import.meta.env.VITE_API_URL}${file.url}`;
                                 window.open(fullUrl, '_blank');
                               }}
                               className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-white transition-all cursor-pointer group/file"
                             >
                                <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 group-hover/file:bg-black group-hover/file:text-[#fffe01] transition-colors">
                                   <Paperclip className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[13px] font-bold text-zinc-900 line-clamp-1">{file.name}</span>
                                   <span className="text-[10px] text-zinc-400 uppercase font-black">{file.fileType.split('/')[1] || 'FILE'}</span>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                )}
              </div>

              {/* Checklists */}
              <div className="space-y-12">
                 {task.checklists?.map(checklist => {
                    const progress = checklist.items?.length ? Math.round((checklist.items.filter(i=>i.isCompleted).length / checklist.items.length) * 100) : 0;
                    return (
                       <div key={checklist._id} className="space-y-6">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-zinc-900" />
                                <h3 className="font-bold text-[17px] tracking-tight">{checklist.name}</h3>
                                <span className="text-[11px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-bold">
                                   {checklist.items?.filter(i => i.isCompleted).length || 0}/{checklist.items?.length || 0}
                                </span>
                             </div>
                             <Button variant="ghost" size="sm" onClick={() => handleRemoveChecklist(checklist._id)} className="font-bold text-zinc-700">Delete</Button>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="text-[11px] font-bold text-zinc-500 w-6">{progress}%</span>
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
                                  currentBoardId={boardData._id}
                                />
                             ))}
                             {activeChecklistForNewItem === checklist._id ? (
                                <div className="space-y-3 pt-2">
                                   <Textarea placeholder="Add an item" autoFocus className="w-full border-[#0052cc] border-2 rounded-lg p-3 text-[14px]" id={`new-item-text-${checklist._id}`} />
                                   <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                         <Button onClick={() => { const el = document.getElementById(`new-item-text-${checklist._id}`); if(el.value) { handleAddChecklistItem(checklist._id, el.value); el.value = ''; } }} className="bg-[#0052cc] font-bold">Add</Button>
                                         <Button variant="ghost" onClick={() => setActiveChecklistForNewItem(null)} className="font-bold text-zinc-600">Cancel</Button>
                                      </div>
                                   </div>
                                </div>
                             ) : (
                                <Button variant="outline" onClick={() => setActiveChecklistForNewItem(checklist._id)} className="bg-zinc-100/50 font-bold text-xs gap-2">Add an item</Button>
                             )}
                          </div>
                       </div>
                    );
                 })}
              </div>
            </div>

            {/* Right Column - Activity */}
            <div className="w-full md:w-[400px] bg-[#f4f5f7] p-8 flex flex-col border-l border-zinc-200 overflow-y-auto custom-scrollbar">
               <div className="flex items-center justify-between mb-6">
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
                        targetText={commentText} 
                        setTargetText={setCommentText} 
                        onSave={() => { if(commentText.trim()){ handleAddComment(task._id, commentText); setCommentText(''); } }}
                        onCancel={() => setCommentText('')}
                        showActions={commentText.length > 0}
                        textareaRef={commentRef}
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
                      <div key={item._id || i} className="flex gap-4 group/item">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black shrink-0 bg-zinc-900 text-[#fffe01] shadow-md border-2 border-white ring-1 ring-zinc-100 uppercase">
                           {(item.user.name || 'A').charAt(0)}
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                           <div className="flex items-center justify-between">
                              <div className="text-[14px] flex items-center gap-1.5 flex-wrap">
                                 <span className="font-bold text-zinc-900">{item.user.name}</span>
                                 {item.type === 'history' ? (
                                    <span className="text-zinc-500 font-medium whitespace-pre-wrap">
                                       {item.action.toLowerCase().replace('_',' ')} <span className="text-zinc-900 font-bold" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.details || '') }} />
                                    </span>
                                 ) : null}
                                 <span className="text-[11px] font-bold text-zinc-300 ml-1 uppercase tracking-tighter">{getTimeAgo(item.createdAt)}</span>
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
                                       targetText={editCommentText} 
                                       setTargetText={setEditCommentText} 
                                       onSave={() => { handleUpdateComment(item._id, editCommentText); setEditingCommentId(null); }}
                                       onCancel={() => setEditingCommentId(null)}
                                       textareaRef={editCommentRef}
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
                                 <div className="bg-white px-4 py-3 rounded-2xl text-[14px] text-zinc-900 shadow-sm border border-zinc-200/50 leading-relaxed font-bold" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.text) }} />
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

