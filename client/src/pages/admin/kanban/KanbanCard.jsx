import React, { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { CheckCircle2, Calendar, MessageSquare, Bell, CheckSquare } from 'lucide-react';

const KanbanCard = ({ task, index, onClick }) => {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided) => (
        <div 
          {...provided.draggableProps} 
          {...provided.dragHandleProps} 
          ref={provided.innerRef} 
          onClick={onClick} 
          className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-1 cursor-pointer group border border-zinc-100 hover:border-yellow-400 active:scale-[0.98] duration-300"
        >
          {/* Label section */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.labels.map((l, i) => (
                <div 
                  key={i} 
                  style={{ backgroundColor: l.color }} 
                  className="h-1.5 w-8 rounded-full shadow-sm"
                  title={l.text}
                />
              ))}
            </div>
          )}
          
          <div className="flex items-start justify-between mb-2">
            <h4 className={`text-sm font-semibold text-zinc-900 group-hover:text-[#d30614] transition-all leading-snug ${task.isCompleted ? 'text-zinc-400 line-through decoration-zinc-300' : ''}`}>
              {task.title}
            </h4>
            <div className="flex items-center gap-1 shrink-0">
               {task.originTaskId && <div className="text-[7px] font-black bg-zinc-100 text-zinc-400 px-1 py-0.5 rounded border border-zinc-200 uppercase tracking-tighter">Copied</div>}
               {task.isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
          </div>
          

          <div className="flex items-center justify-between">
            <div className="flex -space-x-1.5">
              {task.assignees?.map((a, i) => (
                <div 
                  key={i} 
                  className="w-6 h-6 rounded-full border-2 border-white bg-zinc-800 text-[#fffe01] flex items-center justify-center text-[8px] font-bold shadow-sm" 
                  title={a.name}
                >
                  {a.name.charAt(0)}
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 text-zinc-400">
              {task.isCompleted && (
                <div className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Done
                </div>
              )}
              {task.mentionCount > 0 && (
                <div className="flex items-center gap-0.5 text-[9px] text-white font-bold bg-red-500 px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                  <Bell className="w-3 h-3 fill-current" />
                  {task.mentionCount}
                </div>
              )}
              
              {task.checklists?.some(cl => cl.items?.length > 0) && (
                <div className="flex items-center gap-1 text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-bold border border-zinc-200">
                  <CheckSquare className="w-3 h-3" />
                  {task.checklists.reduce((acc, cl) => acc + (cl.items?.filter(i => i.isCompleted).length || 0), 0)}/
                  {task.checklists.reduce((acc, cl) => acc + (cl.items?.length || 0), 0)}
                </div>
              )}

              {task.commentCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] bg-zinc-50 text-zinc-500 px-1.5 py-0.5 rounded-full font-bold">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {task.commentCount}
                </div>
              )}

              {task.deadline && !task.isCompleted && (
                <div className="flex items-center gap-1 text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                  <Calendar className="w-3 h-3" /> 
                  {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default memo(KanbanCard);
