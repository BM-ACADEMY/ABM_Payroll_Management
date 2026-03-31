import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { Clock, UserPlus, MoreHorizontal, Check, ChevronDown, ChevronRight, X, Plus, AlignLeft, Layout } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const SubTaskItem = ({ task, boardMembers, teamId, onUpdate, onAddSubTask, onToggleCompletion, isChecklist = false, onRefresh, currentBoardId }) => {
  const [fullTask, setFullTask] = useState(task);
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isAssignPickerOpen, setIsAssignPickerOpen] = useState(false);
  const [isItemDatePickerOpen, setIsItemDatePickerOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [boards, setBoards] = useState([]);
  const [targetLists, setTargetLists] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const { toast } = useToast();

  const assignPickerRef = React.useRef(null);
  const datePickerRef = React.useRef(null);
  const actionsMenuRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAssignPickerOpen && assignPickerRef.current && !assignPickerRef.current.contains(event.target)) {
        if (!event.target.closest('[data-assign-toggle]')) setIsAssignPickerOpen(false);
      }
      if (isItemDatePickerOpen && datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        if (!event.target.closest('[data-date-toggle]')) setIsItemDatePickerOpen(false);
      }
      if (isActionsMenuOpen && actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        if (!event.target.closest('[data-actions-toggle]')) setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAssignPickerOpen, isItemDatePickerOpen, isActionsMenuOpen]);

  useEffect(() => {
    if (isOpen && !isChecklist) fetchDetails();
  }, [isOpen, isChecklist]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/tasks/${task._id}`, {
        headers: { 'x-auth-token': token }
      });
      setFullTask(res.data.task);
      setChildren(res.data.subTasks);
    } catch(err) {} 
    setLoading(false);
  }

  const fetchBoards = async () => {
    try {
      const token = sessionStorage.getItem('token');
      // Use the teamId passed from boardData
      const effectiveTeamId = teamId || sessionStorage.getItem('teamId');
      
      if (!effectiveTeamId) {
        console.warn('No teamId available for fetching boards');
        return;
      }

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/team/${effectiveTeamId}`, {
        headers: { 'x-auth-token': token }
      });
      setBoards(res.data);
      // Default to current board if found
      const currentBoardId = task.board?._id || task.board;
      if (res.data.find(b => b._id === currentBoardId)) {
        setSelectedBoardId(currentBoardId);
        fetchLists(currentBoardId);
      }
    } catch(err) {}
  };

  const fetchLists = async (boardId) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/${boardId}`, {
        headers: { 'x-auth-token': token }
      });
      setTargetLists(res.data.lists);
      if (res.data.lists.length > 0) setSelectedListId(res.data.lists[0]._id);
    } catch(err) {}
  };

  const handleConvert = async () => {
    if (!selectedListId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a destination list" });
      return;
    }
    
    try {
      const token = sessionStorage.getItem('token');
      
      // Determine origin IDs
      const originTaskId = isChecklist ? null : task._id;
      const originChecklistItemId = isChecklist ? task._id : null;

      // Map assignees correctly for both subtasks and checklist items
      const initialAssignees = isChecklist 
        ? (task.assignedTo ? [task.assignedTo._id || task.assignedTo] : [])
        : (task.assignees?.map(a => a._id || a) || []);

      const payload = {
        title: task.title || task.text,
        description: task.description || (isChecklist ? `Converted from checklist item: ${task.text}` : `Converted from subtask: ${task.title}`),
        listId: selectedListId,
        boardId: selectedBoardId,
        position: 0,
        deadline: task.dueDate || task.deadline || null,
        assignees: initialAssignees,
        originTaskId,
        originChecklistItemId
      };
      
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/tasks`, payload, {
        headers: { 'x-auth-token': token }
      });
      
      toast({ 
        title: "Success", 
        description: `Successfully converted "${task.title || task.text}" to a card.` 
      });
      
      // Auto-refresh if on the same board
      if (selectedBoardId === currentBoardId && onRefresh) {
         onRefresh();
      }
      
      setIsConvertModalOpen(false);
      // The status sync will handle updates across boards via sockets
    } catch (err) {
      console.error('Conversion error:', err);
      toast({ variant: "destructive", title: "Error", description: "Failed to convert to card" });
    }
  };

  const handleQuickWeeklyConvert = async () => {
    try {
      const token = sessionStorage.getItem('token');
      // 1. Get the Weekly Board (will auto-create if missing)
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/special/weekly`, {
        headers: { 'x-auth-token': token }
      });
      
      const weeklyBoard = res.data;
      if (!weeklyBoard) throw new Error('Could not find weekly board');
      
      // 2. Refresh the board/list IDs
      const listsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/${weeklyBoard._id}`, {
        headers: { 'x-auth-token': token }
      });
      
      const listId = listsRes.data.lists?.[0]?._id;
      if (!listId) {
        toast({ variant: "destructive", title: "Error", description: "Weekly board has no columns" });
        return;
      }
      
      // 3. Perform conversion
      const originTaskId = isChecklist ? null : task._id;
      const originChecklistItemId = isChecklist ? task._id : null;
      const initialAssignees = isChecklist 
        ? (task.assignedTo ? [task.assignedTo._id || task.assignedTo] : [])
        : (task.assignees?.map(a => a._id || a) || []);

      const payload = {
        title: task.title || task.text,
        description: task.description || (isChecklist ? `Converted from checklist item: ${task.text}` : `Converted from subtask: ${task.title}`),
        listId: listId,
        boardId: weeklyBoard._id,
        position: 0,
        deadline: task.dueDate || task.deadline || null,
        assignees: initialAssignees,
        originTaskId,
        originChecklistItemId
      };
      
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards/tasks`, payload, {
        headers: { 'x-auth-token': token }
      });
      
      toast({ title: "Success", description: `Sent to Weekly Board.` });
      if (onRefresh && weeklyBoard._id === currentBoardId) onRefresh();
      setIsConvertModalOpen(false);
    } catch (err) {
      console.error('Quick Convert Error:', err);
      toast({ variant: "destructive", title: "Error", description: "Failed to send to weekly board" });
    }
  };

  const handleAddChild = async (title) => {
    await onAddSubTask(task._id, title);
    fetchDetails(); 
  }

  const displayedAssignees = task.assignees || (task.assignedTo ? [task.assignedTo] : []);
  const dueDate = task.deadline || task.dueDate;

  if (isChecklist) {
    return (
      <div className="group flex items-start gap-4 p-2 hover:bg-zinc-100/50 rounded-xl transition-all relative border border-transparent hover:border-zinc-200/50">
        <div 
          onClick={() => onToggleCompletion(task._id, task.isCompleted)}
          className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${task.isCompleted ? 'bg-black border-black text-[#fffe01]' : 'border-zinc-300 hover:border-zinc-400 bg-white shadow-sm'}`}
        >
          {task.isCompleted && <Check className="w-3.5 h-3.5 font-black" />}
        </div>
        
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <span className={`text-[14px] font-medium leading-relaxed break-words pt-0.5 ${task.isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
            {task.title || task.text}
          </span>
          
          {(dueDate || displayedAssignees.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mb-1">
               {dueDate && (
                  <div 
                    onClick={() => setIsItemDatePickerOpen(true)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${new Date(dueDate) < new Date() && !task.isCompleted ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                  >
                     <Clock className="w-3 h-3" />
                     {new Date(dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
               )}
               {displayedAssignees.length > 0 && (
                  <div 
                    onClick={() => setIsAssignPickerOpen(true)}
                    className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 rounded-full cursor-pointer transition-colors border border-zinc-200/50"
                  >
                     <div className="w-4 h-4 rounded-full bg-zinc-800 text-[#fffe01] flex items-center justify-center text-[7px] font-black border border-white">
                        {displayedAssignees[0].name?.split(' ').map(n=>n[0]).join('') || 'A'}
                     </div>
                     <span className="text-[10px] font-bold text-zinc-600 pr-1">{displayedAssignees[0].name?.split(' ')[0]}</span>
                  </div>
               )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
           <div className="relative">
              <Button 
                variant="ghost" size="icon" data-date-toggle
                className={`h-8 w-8 rounded-lg ${dueDate ? 'text-[#0052cc] bg-blue-50' : 'text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200'}`}
                onClick={() => { setIsItemDatePickerOpen(!isItemDatePickerOpen); setIsAssignPickerOpen(false); setIsActionsMenuOpen(false); }}
              >
                 <Clock className="w-4 h-4" />
              </Button>
              {isItemDatePickerOpen && (
                 <div ref={datePickerRef} className="absolute top-10 right-0 w-[240px] bg-white border border-zinc-200 rounded-xl shadow-2xl z-[90] p-4 scale-in-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-[12px] font-black text-zinc-900 uppercase tracking-tight">Due Date</span>
                       <X className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-black" onClick={()=>setIsItemDatePickerOpen(false)} />
                    </div>
                    <Input 
                       type="date" 
                       autoFocus
                       className="h-9 text-xs font-bold rounded-lg border-zinc-200"
                       defaultValue={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
                       onChange={(e) => { onUpdate(task._id, { dueDate: e.target.value }); setIsItemDatePickerOpen(false); }}
                    />
                    <div className="pt-2 flex gap-2">
                      <Button variant="ghost" className="flex-1 text-[11px] h-8 font-bold text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg" onClick={() => { onUpdate(task._id, { dueDate: null }); setIsItemDatePickerOpen(false); }}>Remove</Button>
                    </div>
                 </div>
              )}
           </div>

           <div className="relative">
              <Button 
                variant="ghost" size="icon" data-assign-toggle
                className={`h-8 w-8 rounded-lg ${displayedAssignees.length > 0 ? 'text-[#0052cc] bg-blue-50' : 'text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200'}`}
                onClick={() => { setIsAssignPickerOpen(!isAssignPickerOpen); setIsItemDatePickerOpen(false); setIsActionsMenuOpen(false); }}
              >
                 <UserPlus className="w-4 h-4" />
              </Button>
              {isAssignPickerOpen && (
                 <div ref={assignPickerRef} className="absolute top-10 right-0 w-[240px] bg-white border border-zinc-200 rounded-xl shadow-2xl z-[90] p-4 scale-in-center animate-in fade-in zoom-in-95 duration-200 text-left">
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-[12px] font-black text-zinc-900 uppercase tracking-tight">Assign member</span>
                       <X className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-black" onClick={()=>setIsAssignPickerOpen(false)} />
                    </div>
                    <div className="max-h-[220px] overflow-y-auto space-y-1 custom-scrollbar pr-1">
                       {Array.isArray(boardMembers) ? (
                          boardMembers.map(m => (
                             <div 
                               key={m._id} 
                               onClick={() => { onUpdate(task._id, { assignedTo: m._id }); setIsAssignPickerOpen(false); }}
                               className={`flex items-center justify-between p-2 hover:bg-zinc-100 rounded-lg cursor-pointer group/member transition-all ${displayedAssignees.some(a=>a._id === m._id) ? 'bg-blue-50 border border-blue-100' : 'border border-transparent'}`}
                             >
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-zinc-900 text-[#fffe01] flex items-center justify-center text-[10px] font-black shadow-sm group-hover/member:scale-110 transition-transform">{m.name.split(' ').map(n=>n[0]).join('')}</div>
                                   <span className="text-[13px] font-bold text-zinc-800">{m.name}</span>
                                </div>
                                {displayedAssignees.some(a=>a._id === m._id) && <Check className="w-4 h-4 text-[#0052cc]" />}
                             </div>
                          ))
                       ) : (
                          <div className="text-center py-4 text-xs font-bold text-zinc-400 italic">No members available.</div>
                       )}
                    </div>
                 </div>
              )}
           </div>

           <div className="relative">
              <Button 
                variant="ghost" size="icon" data-actions-toggle
                className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200"
                onClick={() => { setIsActionsMenuOpen(!isActionsMenuOpen); setIsItemDatePickerOpen(false); setIsAssignPickerOpen(false); }}
              >
                 <MoreHorizontal className="w-4 h-4" />
              </Button>
              {isActionsMenuOpen && (
                 <div ref={actionsMenuRef} className="absolute top-10 right-0 w-[180px] bg-white border border-zinc-200 rounded-xl shadow-2xl z-[90] p-2 animate-in fade-in zoom-in-95 duration-200 text-left">
                    <div className="px-2 py-1.5 mb-1 border-b border-zinc-100">
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Item actions</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => { setIsActionsMenuOpen(false); fetchBoards(); setIsConvertModalOpen(true); }}
                      className="w-full justify-start h-9 px-3 text-[13px] font-bold hover:bg-zinc-100 rounded-lg text-zinc-700"
                    >
                      Convert to card
                    </Button>
                    <Button 
                       variant="ghost" 
                       onClick={() => { onUpdate(task._id, { delete: true }); setIsActionsMenuOpen(false); }}
                       className="w-full justify-start h-9 px-3 text-[13px] font-bold hover:bg-red-50 text-red-600 rounded-lg mt-1"
                    >
                       Delete
                    </Button>
                 </div>
              )}
           </div>

           {/* Conversion Modal */}
           <Dialog open={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
              <DialogContent className="sm:max-w-[400px]">
                 <DialogHeader>
                    <DialogTitle>Convert to Card</DialogTitle>
                    <DialogDescription>
                       Choose the destination board and list for the new card.
                    </DialogDescription>
                 </DialogHeader>
                  <div className="grid gap-4 py-4">
                     <div className="grid gap-2 text-left">
                        <label className="text-sm font-bold text-zinc-500">Board</label>
                        <Select 
                           key={`board-select-${boards.length}`}
                           value={selectedBoardId} 
                           onValueChange={(val) => { setSelectedBoardId(val); fetchLists(val); }}
                        >
                           <SelectTrigger className="w-full h-12 rounded-xl border-zinc-200 bg-zinc-50">
                              <SelectValue placeholder="Select a destination board" />
                           </SelectTrigger>
                           <SelectContent className="z-[200]">
                              {Array.isArray(boards) && boards.map(b => (
                                 <SelectItem key={b._id} value={b._id} className="cursor-pointer">
                                    <span className="font-medium">{b.title}</span>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="grid gap-2 text-left">
                        <label className="text-sm font-bold text-zinc-500">List (Column)</label>
                        <Select 
                           key={`list-select-${targetLists.length}-${selectedBoardId}`}
                           value={selectedListId} 
                           onValueChange={setSelectedListId}
                           disabled={!selectedBoardId}
                        >
                           <SelectTrigger className="w-full h-12 rounded-xl border-zinc-200 bg-zinc-50">
                              <SelectValue placeholder="Select a column" />
                           </SelectTrigger>
                           <SelectContent className="z-[200]">
                              {Array.isArray(targetLists) && targetLists.map(l => (
                                 <SelectItem key={l._id} value={l._id} className="cursor-pointer">
                                    <span className="font-medium">{l.title}</span>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                   <DialogFooter className="flex flex-col sm:flex-row gap-2">
                      <Button variant="ghost" onClick={() => setIsConvertModalOpen(false)} className="font-bold sm:mr-auto">Cancel</Button>
                      <Button 
                        variant="outline"
                        className="bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 font-bold"
                        onClick={handleQuickWeeklyConvert}
                      >
                         Send to Weekly
                      </Button>
                      <Button 
                        className="bg-[#fffe01] text-black hover:bg-yellow-400 font-bold"
                        onClick={handleConvert} 
                        disabled={!selectedBoardId || !selectedListId}
                      >
                         Convert
                      </Button>
                   </DialogFooter>
              </DialogContent>
           </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl transition-all shadow-sm hover:shadow-md overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
           <div className="flex items-center gap-3 flex-1">
             <div 
               onClick={() => onToggleCompletion(task._id, task.isCompleted)}
               className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${task.isCompleted ? 'bg-black border-black text-[#fffe01]' : 'border-zinc-200 hover:border-zinc-400'}`}
             >
               {task.isCompleted && <Check className="w-3.5 h-3.5" />}
             </div>
             <span className={`text-[14px] font-semibold leading-tight flex-1 ${task.isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-900 group-hover:text-[#0052cc]'}`}>
               {task.title || task.text}
             </span>
           </div>
           
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => setIsOpen(!isOpen)} 
             className={`h-7 w-7 p-0 rounded-md transition-colors ${isOpen ? 'bg-zinc-100 text-black' : 'text-zinc-400 group-hover:text-zinc-900'}`}
           >
             {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
           </Button>
        </div>

        <div className="flex items-center justify-between pt-1">
           <div className="flex items-center gap-4 text-zinc-400">
              <div className="relative">
                 <div 
                   onClick={() => { setIsAssignPickerOpen(!isAssignPickerOpen); setIsItemDatePickerOpen(false); }}
                   className={`flex items-center gap-1.5 text-[11px] font-bold hover:text-zinc-900 cursor-pointer transition-colors ${displayedAssignees.length > 0 ? 'text-[#0052cc]' : ''}`}
                 >
                    <UserPlus className="w-4 h-4" />
                    {displayedAssignees.length > 0 ? displayedAssignees[0].name.split(' ')[0] : 'Assign'}
                 </div>

                 {isAssignPickerOpen && (
                   <div className="absolute top-8 left-0 w-[240px] bg-white border border-zinc-200 rounded-lg shadow-xl z-[80] p-3 space-y-2 animate-in fade-in zoom-in-95 duration-200 text-left">
                      <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-zinc-700">Assign Member</span>
                         <X className="w-3.5 h-3.5 text-zinc-400 cursor-pointer" onClick={()=>setIsAssignPickerOpen(false)} />
                      </div>
                      <div className="max-h-[160px] overflow-y-auto space-y-1 custom-scrollbar">
                         {Array.isArray(boardMembers) && boardMembers.map(m => (
                            <div 
                              key={m._id} 
                              onClick={() => { onUpdate(task._id, { assignees: [m._id] }); setIsAssignPickerOpen(false); }}
                              className={`flex items-center gap-2 p-1.5 hover:bg-zinc-100 rounded cursor-pointer ${displayedAssignees.some(a=>a._id === m._id) ? 'bg-blue-50' : ''}`}
                            >
                               <div className="w-6 h-6 rounded-full bg-zinc-800 text-[#fffe01] flex items-center justify-center text-[9px] font-bold">{m.name.split(' ').map(n=>n[0]).join('')}</div>
                               <span className="text-[12px] font-medium text-zinc-800">{m.name}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
              
              <div className="relative">
                 <div 
                   onClick={() => { setIsItemDatePickerOpen(!isItemDatePickerOpen); setIsAssignPickerOpen(false); }}
                   className={`flex items-center gap-1.5 text-[11px] font-bold hover:text-zinc-900 cursor-pointer transition-colors ${dueDate ? 'text-[#0052cc]' : ''}`}
                 >
                    <Clock className="w-4 h-4" />
                    {dueDate ? new Date(dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Due date'}
                 </div>

                 {isItemDatePickerOpen && (
                   <div className="absolute top-8 left-0 w-[240px] bg-white border border-zinc-200 rounded-lg shadow-xl z-[80] p-3 space-y-2 animate-in fade-in zoom-in-95 duration-200 text-left">
                      <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-zinc-700">Set Due Date</span>
                         <X className="w-3.5 h-3.5 text-zinc-400 cursor-pointer" onClick={()=>setIsItemDatePickerOpen(false)} />
                      </div>
                      <Input 
                         type="date" 
                         className="h-8 text-xs font-bold"
                         defaultValue={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
                         onChange={(e) => { onUpdate(task._id, { deadline: e.target.value }); setIsItemDatePickerOpen(false); }}
                      />
                      <Button variant="ghost" className="w-full text-[10px] h-7 font-bold" onClick={() => { onUpdate(task._id, { deadline: null }); setIsItemDatePickerOpen(false); }}>Remove Date</Button>
                   </div>
                 )}
              </div>

              {(fullTask.checklists?.length > 0 || fullTask.description) && (
                 <AlignLeft className="w-4 h-4 hover:text-zinc-900 cursor-pointer" />
              )}
           </div>

           <div className="flex -space-x-2.5">
              {displayedAssignees.slice(0, 3).map((m, i) => (
                 <div 
                   key={i} 
                   className="w-7 h-7 rounded-full border-2 border-white bg-zinc-900 flex items-center justify-center text-[9px] font-black text-[#fffe01] shadow-sm transform transition-transform group-hover:translate-x-1"
                   style={{ zIndex: 10 - i }}
                   title={m.name}
                 >
                   {m.name?.substring(0, 2).toUpperCase() || 'A'}
                 </div>
              ))}
              {displayedAssignees.length > 3 && (
                 <div className="w-7 h-7 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center text-[9px] font-black text-zinc-600 shadow-sm relative z-0">
                    +{displayedAssignees.length - 3}
                 </div>
              )}
           </div>
        </div>
      </div>

      {isOpen && (
        <div className="bg-zinc-50 border-t border-zinc-100 p-5 space-y-6 animate-in slide-in-from-top-1 duration-300">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Assignee</span>
                <select 
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold outline-none ring-0 focus:border-[#0052cc] transition-all"
                  value={displayedAssignees[0]?._id || displayedAssignees[0] || ''}
                  onChange={(e) => onUpdate(task._id, { assignees: [e.target.value] })}
                >
                  <option value="">UNASSIGNED</option>
                  {boardMembers?.map(m => <option key={m._id} value={m._id}>{m.name.toUpperCase()}</option>)}
                </select>
             </div>
             <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Due Date</span>
                <Input 
                  type="date" 
                  value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => onUpdate(task._id, { deadline: e.target.value })}
                  className="bg-white border-zinc-200 rounded-lg text-xs font-bold h-9"
                />
             </div>
          </div>

          {!isChecklist && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Hierarchy</span>
                 <div className="h-px flex-1 bg-zinc-200"></div>
              </div>
              
              {children.length > 0 && (
                <div className="space-y-4 pl-2">
                  {children.map(child => (
                     <SubTaskItem 
                       key={child._id} task={child} boardMembers={boardMembers}
                       teamId={teamId}
                       onUpdate={onUpdate} onAddSubTask={onAddSubTask}
                       onToggleCompletion={onToggleCompletion}
                     />
                  ))}
                </div>
              )}

              <div className="relative group/add pl-2">
                 <Plus className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-hover/add:text-[#0052cc] transition-colors" />
                 <Input 
                   placeholder="Add sub-item..." 
                   className="h-10 pl-10 text-[13px] font-medium rounded-xl bg-white border-zinc-200 border-dashed border-2 hover:border-zinc-300 transition-all placeholder:text-zinc-400"
                   onKeyDown={(e) => { if(e.key === 'Enter') { handleAddChild(e.target.value); e.target.value = ''; } }}
                 />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(SubTaskItem);
