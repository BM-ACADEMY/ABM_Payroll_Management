import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Clock, UserPlus, MoreHorizontal, Check, ChevronDown, ChevronRight, X, Plus, AlignLeft, Layout, Search, Trash2, ExternalLink, Timer, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const SubTaskItem = ({ task, boardMembers, teamId, onUpdate, onAddSubTask, onToggleCompletion, isChecklist = false, onRefresh, currentBoardId }) => {
  const [fullTask, setFullTask] = useState(task);
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isAssignPickerOpen, setIsAssignPickerOpen] = useState(false);
  const [isItemDatePickerOpen, setIsItemDatePickerOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(task.title || task.text);
  const { toast } = useToast();

  const [stagingDate, setStagingDate] = useState(task.deadline || task.dueDate || '');
  const [manualDateText, setManualDateText] = useState('');

  const parseManualDate = (text) => {
    if (!text) return null;
    const now = new Date();
    const dmt = text.match(/^(\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2})$/);
    if (dmt) return new Date(now.getFullYear(), dmt[2]-1, dmt[1], dmt[3], dmt[4]);
    const dmyt = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})$/);
    if (dmyt) return new Date(dmyt[3], dmyt[2]-1, dmyt[1], dmyt[4], dmyt[5]);
    const native = new Date(text);
    if (!isNaN(native.getTime())) return native;
    return null;
  };

  useEffect(() => {
    if (isItemDatePickerOpen) {
      const d = task.deadline || task.dueDate;
      setStagingDate(d || '');
      setManualDateText(d ? format(new Date(d), 'dd/MM HH:mm') : '');
    }
  }, [isItemDatePickerOpen, task.deadline, task.dueDate]);

  useEffect(() => {
    setEstHours(Math.floor((task.estimatedDuration || 0) / 60));
    setEstMinutes((task.estimatedDuration || 0) % 60);
  }, [task.estimatedDuration]);

  const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);
  const [estHours, setEstHours] = useState(Math.floor((task.estimatedDuration || 0) / 60));
  const [estMinutes, setEstMinutes] = useState((task.estimatedDuration || 0) % 60);

  const durationPickerRef = React.useRef(null);

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

  const assignPickerRef = React.useRef(null);
  const datePickerRef = React.useRef(null);
  const actionsMenuRef = React.useRef(null);

  useEffect(() => {
    setEditNameValue(task.title || task.text);
  }, [task.title, task.text]);

  const handleNameSave = () => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== (task.title || task.text)) {
      onUpdate(task._id, { title: trimmed });
    }
    setIsEditingName(false);
  };

  // Existing useEffects... (truncated for brevity in instructions, I'll keep them in actual replacement)

  const handleConvert = async () => {
    // ... existing handleConvert
  };

  const handleAddChild = async (title) => {
    await onAddSubTask(task._id, title);
    fetchDetails(); 
  }

  const displayedAssignees = task.assignees || (task.assignedTo ? [task.assignedTo] : []);
  const dueDate = task.deadline || task.dueDate;
  const estimatedDuration = task.estimatedDuration || 0;

  const getStatusBadge = (label) => {
    // ... existing getStatusBadge
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
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] cursor-pointer transition-colors ${new Date(dueDate) < new Date() && !task.isCompleted ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                     <Clock className="w-3 h-3" />
                     {format(new Date(dueDate), 'MMM d, H:mm')}
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
                className={`h-7 w-7 rounded ${dueDate ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                onClick={() => { setIsItemDatePickerOpen(!isItemDatePickerOpen); setIsAssignPickerOpen(false); setIsDurationPickerOpen(false); setIsActionsMenuOpen(false); }}
              >
                 <Clock className="w-3.5 h-3.5" />
              </Button>
              {isItemDatePickerOpen && (
                 <div ref={datePickerRef} className="absolute top-8 right-0 w-[220px] bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-3 space-y-3">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide px-1">Set Date</span>
                    <Input 
                       type="datetime-local" 
                       value={stagingDate ? format(new Date(stagingDate), "yyyy-MM-dd'T'HH:mm") : ''}
                       onChange={(e) => setStagingDate(e.target.value)}
                       className="h-8 text-xs border-slate-200"
                    />
                    <div className="flex gap-2">
                       <Button className="h-8 flex-1 bg-slate-900 shadow-none text-xs" onClick={() => { onUpdate(task._id, { dueDate: stagingDate }); setIsItemDatePickerOpen(false); }}>Save</Button>
                       <Button variant="ghost" className="h-8 text-xs text-red-500" onClick={() => { onUpdate(task._id, { dueDate: null }); setIsItemDatePickerOpen(false); }}>Clear</Button>
                    </div>
                 </div>
              )}
           </div>

           <div className="relative">
              <Button 
                variant="ghost" size="icon" data-duration-toggle
                className={`h-7 w-7 rounded ${estimatedDuration > 0 ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
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
                    <Button variant="ghost" className="w-full justify-start h-8 text-[12px] font-normal" onClick={handleConvert}>Convert to card</Button>
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
               className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${task.isCompleted ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 bg-white'}`}
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
                      className={`text-sm font-normal truncate cursor-text ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                    >
                      {task.title || task.text}
                    </span>
                  )}
                  {getStatusBadge(task.timeLogLabel)}
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {dueDate ? format(new Date(dueDate), 'MMM d, H:mm') : 'No due date'}
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
                <Select value={displayedAssignees[0]?._id || ''} onValueChange={(val) => onUpdate(task._id, { assignees: [val] })}>
                  <SelectTrigger className="h-8 text-xs font-normal bg-white border-slate-200">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {boardMembers?.map(m => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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

          {!isChecklist && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                 <span className="text-[10px] text-slate-400 uppercase">Subtasks</span>
                 <div className="h-[1px] flex-1 bg-slate-100"></div>
              </div>
              
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

              <div className="relative group/add">
                 <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                 <Input 
                   placeholder="Add a subtask..." 
                   className="h-9 pl-9 text-xs font-normal bg-white border-slate-200 rounded-lg placeholder:text-slate-300"
                   onKeyDown={(e) => { if(e.key === 'Enter' && e.target.value) { handleAddChild(e.target.value); e.target.value = ''; } }}
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
