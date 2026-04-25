import React, { useMemo } from 'react';
import { format, differenceInDays, startOfDay, addDays, isSameDay } from 'date-fns';
import { Clock, CheckCircle2, Layout, Zap, Calendar as CalendarIcon, TrendingUp, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TimelineEngine = ({ tasks, listData }) => {
  // 1. Calculate tactical range
  const { startDate, endDate, daysCount, calendarDays } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      const today = startOfDay(new Date());
      return { 
        startDate: today, 
        endDate: addDays(today, 14), 
        daysCount: 14,
        calendarDays: Array.from({ length: 14 }, (_, i) => addDays(today, i))
      };
    }

    const taskDates = tasks.flatMap(t => [
      new Date(t.startTime || t.createdAt),
      new Date(t.endTime || t.deadline || addDays(new Date(t.startTime || t.createdAt), 1))
    ]);

    let start = startOfDay(new Date(Math.min(...taskDates)));
    let end = startOfDay(new Date(Math.max(...taskDates)));

    // Add buffer
    start = addDays(start, -2);
    end = addDays(end, 5);

    const count = differenceInDays(end, start) + 1;
    const days = Array.from({ length: count }, (_, i) => addDays(start, i));

    return { startDate: start, endDate: end, daysCount: count, calendarDays: days };
  }, [tasks]);

  // 2. Group tasks
  const groupedTasks = useMemo(() => {
    const groups = {};
    listData.forEach(l => { groups[l._id] = { title: l.title, tasks: [] }; });
    tasks.forEach(t => {
      const listId = t.list?._id || t.list;
      if (groups[listId]) groups[listId].tasks.push(t);
    });
    return Object.values(groups).filter(g => g.tasks.length > 0);
  }, [tasks, listData]);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'from-red-500 to-red-600 bg-red-500';
      case 'high': return 'from-amber-500 to-amber-600 bg-amber-500';
      case 'low': return 'from-zinc-400 to-zinc-500 bg-zinc-400';
      default: return 'from-blue-500 to-blue-600 bg-blue-500';
    }
  };

  const dayWidth = 80;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#fbfcff] rounded-[2rem] border border-zinc-200/50 shadow-sm overflow-hidden animate-in fade-in duration-500">
      {/* Precision Header */}
      <div className="px-4 md:px-8 py-4 md:py-6 flex flex-col sm:flex-row sm:items-center justify-between bg-white border-b border-zinc-100 gap-4">
        <div className="flex items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black shadow-lg relative overflow-hidden group">
            <Zap className="h-5 w-5 text-[#fffe01] relative z-10" />
            <div className="absolute inset-0 bg-[#fffe01]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              Operational <span className="text-zinc-400 font-bold">Timeline</span>
              <Badge className="bg-zinc-100 text-zinc-500 border-none font-bold text-[9px] px-2 py-0">SYNCED</Badge>
            </h3>
            <div className="flex items-center gap-4 mt-0.5">
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                 <CalendarIcon className="h-3 w-3" /> {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}
               </div>
               <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
               <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global Ops: {tasks.length} Nodes</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest leading-none mb-1 text-right">System Matrix</p>
              <div className="h-1.5 w-32 bg-zinc-100 rounded-full overflow-hidden flex">
                 <div className="h-full bg-black transition-all" style={{ width: '85%' }}></div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-white/50 relative">
        <div className="min-w-max relative" style={{ width: `${daysCount * dayWidth + 280}px` }}>
          {/* Calendar Header */}
          <div className="sticky top-0 z-[45] flex bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm">
            <div className="w-[280px] shrink-0 p-5 px-8 flex items-center justify-between bg-zinc-50/50">
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Structural Nodes</span>
               <Layout className="h-3 w-3 text-zinc-300" />
            </div>
            {calendarDays.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={i} className={cn(
                  "w-[80px] shrink-0 p-3 py-4 text-center flex flex-col items-center justify-center gap-0.5 border-r border-zinc-100/50 transition-colors",
                  isToday ? "bg-black/[0.02]" : ""
                )}>
                  <span className={cn("text-[9px] font-black uppercase tracking-tighter", isToday ? "text-black" : "text-zinc-400")}>{format(day, 'EEE')}</span>
                  <span className={cn("text-xs font-black", isToday ? "text-black scale-110" : "text-zinc-600")}>{format(day, 'dd')}</span>
                  {isToday && <div className="h-1 w-1 rounded-full bg-black mt-0.5" />}
                </div>
              );
            })}
          </div>

          <div className="relative min-h-[500px]">
            {/* Grid Overlay */}
            <div className="absolute inset-0 flex pointer-events-none z-10">
                <div className="w-[280px] shrink-0 border-r border-zinc-100 bg-zinc-50/10"></div>
                {calendarDays.map((_, i) => (
                    <div key={i} className="w-[80px] shrink-0 border-r border-zinc-50/40"></div>
                ))}
            </div>

            {/* Today's Matrix Line */}
            {calendarDays.some(d => isSameDay(d, new Date())) && (
              <div 
                className="absolute top-0 bottom-0 w-[80px] flex justify-center pointer-events-none z-[35] ml-[280px]"
                style={{ left: `${calendarDays.findIndex(d => isSameDay(d, new Date())) * 80}px` }}
              >
                  <div className="h-full w-px bg-black/10 relative">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-black shadow-lg"></div>
                  </div>
              </div>
            )}

            {/* Empty Context */}
            {groupedTasks.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center ml-[280px] z-30 pointer-events-none p-20">
                 <div className="w-16 h-16 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex items-center justify-center mb-6 shadow-inner rotate-3">
                    <Clock className="w-8 h-8 text-zinc-200" />
                 </div>
                 <h4 className="text-zinc-900 font-black uppercase tracking-widest text-[10px] mb-1">Queue Synchronized</h4>
                 <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-tight">No active operation vectors detected</p>
              </div>
            )}

            {/* Group Layers */}
            <div className="relative z-20">
              {groupedTasks.map((group, gIdx) => (
                <div key={gIdx}>
                  <div className="flex items-center gap-3 px-8 py-3 bg-zinc-50/40 sticky left-0 z-30 border-b border-zinc-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{group.title}</span>
                  </div>
                  
                  {group.tasks.map((task, tIdx) => {
                    const taskStart = new Date(task.startTime || task.createdAt);
                    const taskEnd = new Date(task.endTime || task.deadline || addDays(taskStart, 1));
                    const startOffset = differenceInDays(startOfDay(taskStart), startDate);
                    const duration = Math.max(1, differenceInDays(startOfDay(taskEnd), startOfDay(taskStart)) + 1);
                    
                    return (
                      <div key={tIdx} className="flex group/row hover:bg-zinc-50/30 transition-colors border-b border-zinc-50/50 h-16 relative">
                        <div className="w-[280px] shrink-0 p-4 px-8 flex items-center justify-between bg-white/90 sticky left-0 z-40 backdrop-blur-sm border-r border-zinc-100 group-hover/row:bg-white transition-colors">
                           <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={cn("shrink-0 w-1.5 h-1.5 rounded-full shadow-sm", getPriorityColor(task.priority).split(' ')[2])}></div>
                              <span className="text-xs font-bold text-zinc-800 truncate leading-none tracking-tight">{task.title}</span>
                           </div>
                           <ChevronRight className="h-3 w-3 text-zinc-200 group-hover/row:text-zinc-400 transition-colors" />
                        </div>
                        
                        <div className="flex-1 relative flex items-center">
                           <TooltipProvider>
                             <Tooltip delayDuration={0}>
                               <TooltipTrigger asChild>
                                 <div 
                                   className={cn(
                                     "absolute h-7 rounded-lg shadow-sm border border-white/50 cursor-pointer overflow-hidden group/bar transition-all hover:h-8 hover:z-30 bg-gradient-to-tr",
                                     getPriorityColor(task.priority)
                                   )}
                                   style={{ 
                                     left: `${startOffset * dayWidth + 10}px`, 
                                     width: `${Math.max(40, duration * dayWidth - 20)}px`,
                                   }}
                                 >
                                    <div className="absolute inset-0 bg-black/10 origin-left" style={{ width: `${task.progress || 0}%` }}></div>
                                    <div className="absolute inset-0 flex items-center px-3 justify-between">
                                       <span className="text-[8px] font-black text-white uppercase drop-shadow-sm opacity-0 group-hover/bar:opacity-100 transition-opacity">{task.progress || 0}%</span>
                                       {task.isCompleted && <CheckCircle2 className="h-3 w-3 text-white" />}
                                    </div>
                                 </div>
                               </TooltipTrigger>
                               <TooltipContent side="top" sideOffset={8} className="bg-white text-zinc-900 border-zinc-200 p-0 rounded-2xl shadow-2xl min-w-[220px] overflow-hidden z-[100]">
                                  <div className="p-4 border-b border-zinc-50 bg-zinc-50/50">
                                    <div className="flex items-center gap-2 mb-1.5">
                                       <div className={cn("h-2 w-2 rounded-full", getPriorityColor(task.priority).split(' ')[2])}></div>
                                       <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest">{task.priority} Priority Matrix</span>
                                    </div>
                                    <p className="text-sm font-black tracking-tight leading-tight">{task.title}</p>
                                  </div>
                                  <div className="p-4 space-y-3">
                                     <div className="flex items-center justify-between">
                                        <div className="text-center flex-1">
                                           <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Entry</p>
                                           <p className="text-[10px] font-bold text-zinc-600">{format(taskStart, 'MMM dd')}</p>
                                        </div>
                                        <div className="w-px h-6 bg-zinc-100"></div>
                                        <div className="text-center flex-1">
                                           <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Exit</p>
                                           <p className="text-[10px] font-bold text-zinc-600">{format(taskEnd, 'MMM dd')}</p>
                                        </div>
                                     </div>
                                     <div className="pt-2 border-t border-zinc-50 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-zinc-900 uppercase">Integrity</span>
                                        <span className="text-[9px] font-black text-zinc-900">{task.progress || 0}%</span>
                                     </div>
                                  </div>
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Dynamic Summary */}
      <div className="px-4 md:px-10 py-5 bg-white border-t border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex flex-wrap items-center gap-4 md:gap-8">
            {[
              { label: 'Essential', color: 'bg-zinc-400' },
              { label: 'Moderate', color: 'bg-blue-500' },
              { label: 'High Vector', color: 'bg-amber-500' },
              { label: 'CRITICAL', color: 'bg-red-500' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 group cursor-default">
                 <div className={cn("w-2 h-2 rounded-full", item.color)}></div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-600 transition-colors">{item.label}</span>
              </div>
            ))}
         </div>
         <div className="flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-zinc-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Structural Throughput</span>
         </div>
      </div>
    </div>
  );
};

export default TimelineEngine;
