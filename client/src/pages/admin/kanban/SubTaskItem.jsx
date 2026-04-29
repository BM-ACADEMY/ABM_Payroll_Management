import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, setHours, setMinutes } from 'date-fns';
import { Clock, UserPlus, MoreHorizontal, Check, ChevronDown, ChevronRight, X, Plus, AlignLeft, Layout, Search, Trash2, ExternalLink, Timer, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SubTaskItem = ({ 
  task, 
  boardMembers, 
  teamId, 
  onUpdate, 
  onAddSubTask, 
  onToggleCompletion, 
  isChecklist = false, 
  onRefresh, 
  currentBoardId,
  parentTaskId,
  onAddToTracker,
  onMoveToSprint
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isAssignPickerOpen, setIsAssignPickerOpen] = useState(false);
  const [isItemDatePickerOpen, setIsItemDatePickerOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(task.title || task.text || '');
  const { toast } = useToast();

  const [stagingDate, setStagingDate] = useState(task.deadline || task.dueDate || '');
  const [viewDate, setViewDate] = useState(new Date());

  const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);
  const [estHours, setEstHours] = useState(Math.floor((task.estimatedDuration || 0) / 60));
  const [estMinutes, setEstMinutes] = useState((task.estimatedDuration || 0) % 60);

  const assignPickerRef = useRef(null);
  const datePickerRef = useRef(null);
  const actionsMenuRef = useRef(null);
  const durationPickerRef = useRef(null);

  useEffect(() => {
    if (isItemDatePickerOpen) {
      const d = task.deadline || task.dueDate;
      const initialDate = d ? new Date(d) : new Date();
      setStagingDate(d || '');
      setViewDate(initialDate);
    }
  }, [isItemDatePickerOpen, task.deadline, task.dueDate]);

  useEffect(() => {
    setEstHours(Math.floor((task.estimatedDuration || 0) / 60));
    setEstMinutes((task.estimatedDuration || 0) % 60);
  }, [task.estimatedDuration]);

  useEffect(() => {
    setEditNameValue(task.title || task.text || '');
  }, [task.title, task.text]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAssignPickerOpen && assignPickerRef.current && !assignPickerRef.current.contains(event.target)) {
        if (!event.target.closest('[data-assign-toggle]')) setIsAssignPickerOpen(false);
      }
      if (isItemDatePickerOpen && datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        if (!event.target.closest('[data-date-toggle]')) setIsItemDatePickerOpen(false);
      }
      if (isDurationPickerOpen && durationPickerRef.current && !durationPickerRef.current.contains(event.target)) {
        if (!event.target.closest('[data-duration-toggle]')) setIsDurationPickerOpen(false);
      }
      if (isActionsMenuOpen && actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        if (!event.target.closest('[data-actions-toggle]')) setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAssignPickerOpen, isItemDatePickerOpen, isDurationPickerOpen, isActionsMenuOpen]);

  const handleDurationSave = () => {
    const totalMinutes = (parseInt(estHours) || 0) * 60 + (parseInt(estMinutes) || 0);
    onUpdate(task._id, { estimatedDuration: totalMinutes });
    setIsDurationPickerOpen(false);
  };

  const handleNameSave = () => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== (task.title || task.text)) {
      onUpdate(task._id, isChecklist ? { text: trimmed } : { title: trimmed });
    }
    setIsEditingName(false);
  };

  const fetchDetails = useCallback(async () => {
    if (isChecklist) return; // Checklist items usually don't have deep subtasks/details here
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/tasks/details/${task._id}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setChildren(res.data.subTasks || []);
    } catch (err) {
      console.error('Fetch Details Error:', err);
    } finally {
      setLoading(false);
    }
  }, [task._id, isChecklist]);

  useEffect(() => {
    if (isOpen && !isChecklist) {
      fetchDetails();
    }
  }, [isOpen, isChecklist, fetchDetails]);

  const handleConvert = async () => {
    try {
      if (onAddToTracker) {
        await onAddToTracker(task.title || task.text, task._id);
      } else {
        await onAddSubTask(parentTaskId || task._id, task.title || task.text, isChecklist ? task._id : null);
        onUpdate(task._id, { delete: true });
      }
      setIsActionsMenuOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to process request" });
    }
  };

  const handleSprintMove = async () => {
    try {
      if (onMoveToSprint) {
        await onMoveToSprint(task.title || task.text, task._id);
      }
      setIsActionsMenuOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to move to sprint" });
    }
  };

  const handleAddChild = async (title) => {
    await onAddSubTask(task._id, title);
    fetchDetails(); 
  }

  const displayedAssignees = task.assignees || (task.assignedTo ? [task.assignedTo] : []);
  const dueDate = task.deadline || task.dueDate;
  const estimatedDuration = task.estimatedDuration || 0;

  const getStatusBadge = (label) => {
    if (!label) return null;
    const styles = {
      'done': 'bg-green-50 text-green-600 border-green-100',
      'qc': 'bg-blue-50 text-blue-600 border-blue-100',
      'pending': 'bg-yellow-50 text-yellow-600 border-yellow-100',
      'in process': 'bg-slate-50 text-slate-600 border-slate-100',
      'holded': 'bg-red-50 text-red-600 border-red-100',
      'not yet started': 'bg-slate-50 text-slate-400 border-slate-100',
      'requirement needed': 'bg-purple-50 text-purple-600 border-purple-100'
    };
    return (
      <Badge variant="outline" className={`px-2 py-0 h-5 text-[9px] font-normal capitalize ${styles[label] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
        {label}
      </Badge>
    );
  };

  const getDueDateStyles = (d, completed) => {
    if (!d) return 'bg-slate-200 text-slate-600';
    if (completed) return 'bg-zinc-100 text-zinc-400 border-zinc-200';
    
    const now = new Date();
    const due = new Date(d);
    
    if (isNaN(due.getTime())) return 'bg-zinc-100 text-zinc-500';

    // Using a 1-minute grace period to avoid micro-second flickering
    const isOverdue = due < new Date(now.getTime() - 1000); 
    
    if (isOverdue) {
      return 'bg-red-600 text-white border-red-700 shadow-sm font-bold';
    }
    
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours <= 24) {
      return 'bg-yellow-400 text-black border-yellow-500 shadow-sm font-bold';
    }
    
    return 'bg-blue-600 text-white border-blue-700 shadow-sm font-bold';
  };

  if (isChecklist) {
    return (
      <div className="group flex items-start gap-4 p-2.5 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 rounded-lg">
        <div 
          onClick={() => onToggleCompletion(task._id, task.isCompleted)}
          className={`mt-1.5 w-4.5 h-4.5 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${task.isCompleted ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 bg-white'}`}
        >
          {task.isCompleted && <Check className="w-3 h-3" />}
        </div>
        
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center flex-wrap gap-2 pt-1 border-transparent">
            {isEditingName ? (
              <Input 
                autoFocus
                className="h-7 text-sm font-normal border-slate-300 rounded focus:ring-0"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              />
            ) : (
              <span 
                onDoubleClick={() => setIsEditingName(true)}
                className={`text-sm font-normal break-words cursor-text ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}
              >
                {task.title || task.text}
              </span>
            )}
            {getStatusBadge(task.timeLogLabel)}
            {estimatedDuration > 0 && (
              <Badge variant="outline" className="px-2 py-0 h-5 text-[9px] font-normal bg-zinc-50 text-zinc-500 border-zinc-100 flex items-center gap-1">
                 <Clock className="w-2.5 h-2.5" />
                 {Math.floor(estimatedDuration / 60)}h {estimatedDuration % 60}m
              </Badge>
            )}
          </div>
          
          {(dueDate || displayedAssignees.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mb-1">
                {dueDate && (
                   <div 
                     onClick={() => setIsItemDatePickerOpen(true)}
                     className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] cursor-pointer transition-all border font-medium ${getDueDateStyles(dueDate, task.isCompleted)}`}
                   >
                     <Clock className="w-3 h-3" />
                     {format(new Date(dueDate), 'MMM d, yyyy, h:mm a')}
                  </div>
               )}
               {displayedAssignees.length > 0 && (
                  <div 
                    onClick={() => setIsAssignPickerOpen(true)}
                    className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-1.5 py-0.5 rounded-full cursor-pointer transition-colors border border-slate-100"
                  >
                     <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[8px]">
                        {displayedAssignees[0].name?.charAt(0) || 'A'}
                     </div>
                     <span className="text-[10px] text-slate-500">{displayedAssignees[0].name?.split(' ')[0]}</span>
                  </div>
               )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all mt-1">
           <div className="relative">
              <Button 
                variant="ghost" size="icon" data-date-toggle
                className={`h-7 w-7 rounded \${dueDate ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                onClick={() => { setIsItemDatePickerOpen(!isItemDatePickerOpen); setIsAssignPickerOpen(false); setIsDurationPickerOpen(false); setIsActionsMenuOpen(false); }}
              >
                 <Clock className="w-3.5 h-3.5" />
              </Button>
              {isItemDatePickerOpen && (
                 <div ref={datePickerRef} className="absolute top-8 right-0 w-[240px] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{format(viewDate, 'MMMM yyyy')}</span>
                       <div className="flex gap-1">
                          <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1 hover:bg-slate-200 rounded transition-colors"><ChevronRight className="w-3 h-3 rotate-180" /></button>
                          <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 hover:bg-slate-200 rounded transition-colors"><ChevronRight className="w-3 h-3" /></button>
                       </div>
                    </div>

                    <div className="p-3 bg-white">
                       <div className="grid grid-cols-7 mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                             <span key={d} className="text-[9px] font-bold text-slate-300 text-center">{d}</span>
                          ))}
                       </div>
                       <div className="grid grid-cols-7 gap-1">
                          {(() => {
                             const start = startOfWeek(startOfMonth(viewDate));
                             const end = endOfWeek(endOfMonth(viewDate));
                             const days = eachDayOfInterval({ start, end });
                             return days.map(day => {
                                const isSelected = stagingDate && isSameDay(day, new Date(stagingDate));
                                const inMonth = isSameMonth(day, viewDate);
                                return (
                                   <button 
                                      key={day.toString()}
                                      onClick={() => {
                                         const current = stagingDate ? new Date(stagingDate) : new Date();
                                         const next = setHours(setMinutes(day, current.getMinutes()), current.getHours());
                                         setStagingDate(next.toISOString());
                                      }}
                                      className={cn(
                                         "h-6 w-6 rounded-md text-[10px] flex items-center justify-center transition-all",
                                         !inMonth ? "text-slate-200" : "text-slate-600 hover:bg-slate-100",
                                         isSelected && "bg-slate-900 text-white hover:bg-slate-900 shadow-md transform scale-110"
                                      )}
                                   >
                                      {format(day, 'd')}
                                   </button>
                                );
                             });
                          })()}
                       </div>
                    </div>

                    <div className="px-3 pb-3 bg-white border-t border-slate-50 mt-1 pt-3">
                        <div className="grid grid-cols-4 gap-1 mb-3">
                           <div className="flex flex-col gap-1">
                              <label className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Hours</label>
                              <select 
                                 value={stagingDate ? (new Date(stagingDate).getHours() % 12 || 12) : 12}
                                 onChange={(e) => {
                                    const current = new Date(stagingDate || new Date());
                                    const isPM = current.getHours() >= 12;
                                    let h = parseInt(e.target.value);
                                    if (isPM && h < 12) h += 12;
                                    if (!isPM && h === 12) h = 0;
                                    setStagingDate(setHours(current, h).toISOString());
                                 }}
                                 className="text-[10px] bg-slate-50 border-slate-100 rounded p-1 outline-none appearance-none text-center h-8"
                              >
                                 {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{(i+1).toString().padStart(2, '0')}</option>)}
                              </select>
                           </div>
                           <div className="flex flex-col gap-1">
                              <label className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Mins</label>
                              <select 
                                 value={stagingDate ? (new Date(stagingDate).getMinutes()) : 0}
                                 onChange={(e) => {
                                    const next = setMinutes(new Date(stagingDate || new Date()), parseInt(e.target.value));
                                    setStagingDate(next.toISOString());
                                 }}
                                 className="text-[10px] bg-slate-50 border-slate-100 rounded p-1 outline-none appearance-none text-center h-8"
                              >
                                 {Array.from({length: 60}, (_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>)}
                              </select>
                           </div>
                           <div className="flex flex-col gap-1">
                              <label className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">AM/PM</label>
                              <select 
                                 value={stagingDate ? (new Date(stagingDate).getHours() >= 12 ? "PM" : "AM") : "AM"}
                                 onChange={(e) => {
                                    const current = new Date(stagingDate || new Date());
                                    let h = current.getHours();
                                    if (e.target.value === "PM" && h < 12) h += 12;
                                    if (e.target.value === "AM" && h >= 12) h -= 12;
                                    setStagingDate(setHours(current, h).toISOString());
                                 }}
                                 className="text-[10px] bg-slate-50 border-slate-100 rounded p-1 outline-none appearance-none text-center font-bold h-8"
                               >
                                 <option value="AM">AM</option>
                                 <option value="PM">PM</option>
                               </select>
                           </div>
                           <div className="flex flex-col justify-end">
                              <Button 
                                 variant="ghost" 
                                 className="h-8 text-[8px] text-blue-500 hover:bg-blue-50 uppercase font-black tracking-widest px-0"
                                 onClick={() => {
                                    const now = new Date();
                                    setStagingDate(now.toISOString());
                                    setViewDate(now);
                                 }}
                              >
                                 Today
                              </Button>
                           </div>
                        </div>
                       
                       <div className="flex gap-2 border-t border-slate-50 pt-3">
                          <Button 
                             className="h-8 flex-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:scale-[1.02] active:scale-95 transition-all" 
                             onClick={() => { 
                                if (stagingDate) {
                                   onUpdate(task._id, { dueDate: new Date(stagingDate).toISOString() }); 
                                }
                                setIsItemDatePickerOpen(false); 
                             }}
                          >
                             Save
                          </Button>
                          <Button 
                             variant="ghost" 
                             className="h-8 px-3 text-[10px] text-red-500 font-bold uppercase" 
                             onClick={() => { 
                                onUpdate(task._id, { dueDate: null }); 
                                setIsItemDatePickerOpen(false); 
                             }}
                          >
                             Clear
                          </Button>
                       </div>
                    </div>
                 </div>
              )}
           </div>

           <div className="relative">
              <Button 
                variant="ghost" size="icon" data-duration-toggle
                className={`h-7 w-7 rounded \${estimatedDuration > 0 ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                onClick={() => { setIsDurationPickerOpen(!isDurationPickerOpen); setIsItemDatePickerOpen(false); setIsAssignPickerOpen(false); setIsActionsMenuOpen(false); }}
              >
                 <Timer className="w-3.5 h-3.5" />
              </Button>
              {isDurationPickerOpen && (
                 <div ref={durationPickerRef} className="absolute top-8 right-0 w-[200px] bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-4 space-y-3">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide px-1">Estimated Duration</span>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                          <Label className="text-[9px] uppercase text-zinc-400">Hours</Label>
                          <Input 
                            type="number" 
                            value={estHours} 
                            onChange={(e) => setEstHours(e.target.value)}
                            className="h-8 text-xs bg-zinc-50 border-zinc-100" 
                            placeholder="H"
                          />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[9px] uppercase text-zinc-400">Mins</Label>
                          <Input 
                            type="number" 
                            value={estMinutes} 
                            onChange={(e) => setEstMinutes(e.target.value)}
                            className="h-8 text-xs bg-zinc-50 border-zinc-100" 
                            placeholder="M"
                          />
                       </div>
                    </div>
                    <Button className="w-full h-8 bg-black text-[#fffe01] text-xs font-normal" onClick={handleDurationSave}>Save Estimate</Button>
                 </div>
              )}
           </div>

           <div className="relative">
              <Button 
                variant="ghost" size="icon" data-assign-toggle
                className="h-7 w-7 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                onClick={() => { setIsAssignPickerOpen(!isAssignPickerOpen); setIsItemDatePickerOpen(false); setIsDurationPickerOpen(false); setIsActionsMenuOpen(false); }}
              >
                 <UserPlus className="w-3.5 h-3.5" />
              </Button>
              {isAssignPickerOpen && (
                 <div ref={assignPickerRef} className="absolute top-8 right-0 w-[200px] bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 space-y-1">
                    {boardMembers?.map(m => (
                       <div key={m._id} onClick={() => { onUpdate(task._id, { assignedTo: m._id }); setIsAssignPickerOpen(false); }} className="p-2 hover:bg-slate-50 cursor-pointer rounded text-[12px] flex items-center justify-between">
                          <span className="text-slate-700">{m.name}</span>
                          {displayedAssignees.some(a=>a._id === m._id) && <Check className="w-3.5 h-3.5 text-blue-500" />}
                       </div>
                    ))}
                 </div>
              )}
           </div>

           <div className="relative">
              <Button 
                variant="ghost" size="icon" data-actions-toggle
                className="h-7 w-7 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                onClick={() => { setIsActionsMenuOpen(!isActionsMenuOpen); setIsItemDatePickerOpen(false); setIsAssignPickerOpen(false); setIsDurationPickerOpen(false); }}
              >
                 <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
              {isActionsMenuOpen && (
                 <div ref={actionsMenuRef} className="absolute top-8 right-0 w-[160px] bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1">
                    <Button variant="ghost" className="w-full justify-start h-8 text-[12px] font-normal" onClick={handleConvert}>Convert to Tracker</Button>
                    <Button variant="ghost" className="w-full justify-start h-8 text-[12px] font-normal text-blue-600" onClick={handleSprintMove}>Move to Sprint</Button>
                    <Button variant="ghost" className="w-full justify-start h-8 text-[12px] text-red-500 hover:bg-red-50 font-normal" onClick={() => onUpdate(task._id, { delete: true })}>Delete</Button>
                 </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 hover:border-slate-300 transition-all rounded-lg overflow-hidden group">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
           <div className="flex items-start gap-3 flex-1 min-w-0">
             <div 
               onClick={() => onToggleCompletion(task._id, task.isCompleted)}
               className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0 \${task.isCompleted ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 bg-white'}`}
             >
               {task.isCompleted && <Check className="w-3.5 h-3.5" />}
             </div>
             <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  {isEditingName ? (
                    <Input 
                      autoFocus
                      className="h-7 text-sm font-normal border-slate-300 rounded focus:ring-0"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onBlur={handleNameSave}
                      onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    />
                  ) : (
                    <span 
                      onDoubleClick={() => setIsEditingName(true)}
                      className={`text-sm font-normal truncate cursor-text \${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                    >
                      {task.title || task.text}
                    </span>
                  )}
                  {getStatusBadge(task.timeLogLabel)}
                </div>
                <div className="flex items-center gap-3">
                   <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-medium transition-all ${getDueDateStyles(dueDate, task.isCompleted)}`}>
                      <Clock className="w-3 h-3" />
                      {dueDate ? format(new Date(dueDate), 'MMM d, yyyy, h:mm a') : 'No due date'}
                   </div>
                   <div className="flex -space-x-1.5">
                      {displayedAssignees.slice(0, 3).map((m, i) => (
                        <div key={i} className="w-5.5 h-5.5 rounded-full border border-white bg-slate-200 flex items-center justify-center text-[7px] text-slate-700" title={m.name}>
                          {m.name?.substring(0, 2) || 'A'}
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           </div>
           
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => setIsOpen(!isOpen)} 
             className="h-7 w-7 text-slate-400"
           >
             {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
           </Button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-1">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase ml-0.5">Assignee</label>
                <div className="relative">
                   <Button variant="outline" className="w-full h-8 justify-start text-xs font-normal" onClick={() => setIsAssignPickerOpen(!isAssignPickerOpen)}>
                      {displayedAssignees[0]?.name || 'Unassigned'}
                   </Button>
                   {isAssignPickerOpen && (
                      <div ref={assignPickerRef} className="absolute top-9 left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1">
                         {boardMembers?.map(m => (
                            <Button key={m._id} variant="ghost" className="w-full justify-start h-8 text-xs font-normal" onClick={() => { onUpdate(task._id, { assignedTo: m._id }); setIsAssignPickerOpen(false); }}>
                               {m.name}
                            </Button>
                         ))}
                      </div>
                   )}
                </div>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase ml-0.5">Due Date</label>
                <Input 
                   type="datetime-local" 
                   value={dueDate ? format(new Date(dueDate), "yyyy-MM-dd'T'HH:mm") : ''}
                   onChange={(e) => onUpdate(task._id, { deadline: e.target.value })}
                   className="h-8 text-xs font-normal border-slate-200 bg-white"
                />
             </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
               <span className="text-[10px] text-slate-400 uppercase">Subtasks</span>
               <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>
            
            {loading ? <div className="py-4 text-center"><Loader size="sm" /></div> : (
              <>
                {children.length > 0 && (
                  <div className="space-y-2">
                    {children.map(child => (
                       <SubTaskItem 
                         key={child._id} task={child} boardMembers={boardMembers}
                         teamId={teamId} onUpdate={onUpdate} onAddSubTask={onAddSubTask}
                         onToggleCompletion={onToggleCompletion} currentBoardId={currentBoardId}
                       />
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="relative group/add">
               <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
               <Input 
                 placeholder="Add a subtask..." 
                 className="h-9 pl-9 text-xs font-normal bg-white border-slate-200 rounded-lg placeholder:text-slate-300"
                 onKeyDown={(e) => { if(e.key === 'Enter' && e.target.value) { handleAddChild(e.target.value); e.target.value = ''; } }}
               />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SubTaskItem);
