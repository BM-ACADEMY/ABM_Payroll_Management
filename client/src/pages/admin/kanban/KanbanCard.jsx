import React, { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { CheckCircle2, Calendar, MessageSquare, Bell, CheckSquare, Clock, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import axios from 'axios';

const KanbanCard = ({ task, index, onClick, handleMoveToBacklog }) => {
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
      <Badge variant="outline" className={`px-1.5 py-0 text-[8px] font-normal capitalize h-4 ${styles[label] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
        {label}
      </Badge>
    );
  };

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided) => (
        <div 
          {...provided.draggableProps} 
          {...provided.dragHandleProps} 
          ref={provided.innerRef} 
          id={`task-card-${task._id}`}
          className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-1 cursor-pointer group border border-slate-200 hover:border-yellow-400 active:scale-[0.98] duration-300"
        >
          <div onClick={(e) => { e.stopPropagation(); onClick(); }} className="p-4 flex flex-col gap-3">
            {/* Header: Status Line */}
            <div className="flex items-start justify-between min-w-0 gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {task.originTaskId && <Badge variant="outline" className="text-[7px] font-normal bg-slate-50 text-slate-400 px-1 py-0 h-3.5 uppercase border-slate-100">Copied</Badge>}
                  {getStatusBadge(task.timeLogLabel)}
                </div>
                <h4 className={`text-[13px] md:text-sm font-normal text-slate-700 leading-snug break-words ${task.isCompleted ? 'text-slate-300 line-through' : ''}`}>
                  {task.title}
                </h4>
              </div>
              {task.isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />}
            </div>

            {/* Labels (Modern Pills) */}
            {task.labels && task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {task.labels.map((l, i) => (
                  <div 
                    key={i} 
                    style={{ backgroundColor: l.color }} 
                    className="h-1 w-6 rounded-full opacity-60"
                    title={l.text}
                  />
                ))}
              </div>
            )}

            {/* Footer: Meta Info */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex -space-x-1.5">
                {task.assignees?.slice(0,3).map((a, i) => (
                  <div 
                    key={i} 
                    className="w-5.5 h-5.5 rounded-full border-2 border-white bg-slate-800 text-yellow-300 flex items-center justify-center text-[7px] font-normal shadow-sm" 
                    title={a.name}
                  >
                    {a.name.charAt(0)}
                  </div>
                ))}
                {task.assignees?.length > 3 && (
                  <div className="w-5.5 h-5.5 rounded-full border-2 border-white bg-slate-100 text-slate-500 flex items-center justify-center text-[7px]">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {task.checklists?.some(cl => cl.items?.length > 0) && (
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-normal">
                    <CheckSquare className="w-3 h-3" />
                    {task.checklists.reduce((acc, cl) => acc + (cl.items?.filter(i => i.isCompleted).length || 0), 0)}/
                    {task.checklists.reduce((acc, cl) => acc + (cl.items?.length || 0), 0)}
                  </div>
                )}

                {task.mentionCount > 0 && (
                  <div className="flex items-center gap-1 text-[9px] text-red-500 font-bold animate-pulse">
                    <Bell className="w-3 h-3 fill-red-500" />
                    {task.mentionCount}
                  </div>
                )}

                {task.commentCount > 0 && (
                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <MessageSquare className="w-3 h-3" />
                    {task.commentCount}
                  </div>
                )}

                {task.deadline && !task.isCompleted && (
                   <div className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md font-normal ${new Date(task.deadline) < new Date() ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500'}`}>
                     <Clock className="w-2.5 h-2.5" />
                     {format(new Date(task.deadline), 'MMM d, yyyy, h:mm a')}
                   </div>
                )}
              </div>

              {/* Actions Area */}
              {!task.isCompleted && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2 shrink-0">
                  {task.isInSprint && handleMoveToBacklog && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleMoveToBacklog(task._id);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all shadow-sm"
                      title="Back to Backlog"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button 
                    onClick={async (e) => { 
                      e.stopPropagation(); 
                      try {
                        const token = localStorage.getItem('token');
                        await axios.post(`${import.meta.env.VITE_API_URL}/api/time-logs/start`, { taskName: task.title }, {
                          headers: { 'x-auth-token': token }
                        });
                      } catch (err) {
                        console.error('Failed to start tracking', err);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-yellow-400 text-black hover:bg-yellow-500  hover:text-white transition-all shadow-sm"
                    title="Start Tracking"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
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
