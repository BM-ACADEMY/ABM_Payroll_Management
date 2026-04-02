import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSunday, isSaturday, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Coffee, 
  LogOut, 
  UserCheck,
  Info,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const month = format(currentDate, 'M');
      const year = format(currentDate, 'yyyy');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/calendar?month=${month}&year=${year}`, {
        headers: { 'x-auth-token': token }
      });
      setCalendarData(res.data);
    } catch (err) {
      console.error("Error fetching calendar data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayContent = (day) => {
    if (!isSameMonth(day, monthStart)) return null;
    const dateStr = format(day, 'yyyy-MM-dd');
    return calendarData.find(d => d.date === dateStr);
  };

  const renderDay = (day) => {
    const dayData = getDayContent(day);
    const isToday = isSameDay(day, new Date());
    const isCurrentMonth = isSameMonth(day, monthStart);

    if (!isCurrentMonth) {
      return (
        <div key={day.toString()} className="h-32 border-b border-r border-gray-50 bg-gray-50/30"></div>
      );
    }

    let bgColor = "bg-white";
    let textColor = "text-gray-900";
    let badge = null;

    if (dayData) {
      if (dayData.type === 'holiday') {
        bgColor = "bg-gray-50 border-l-4 border-l-black";
        badge = <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-0 text-[9px] uppercase font-medium px-1.5 py-0 h-4">{dayData.status}</Badge>;
      } else if (dayData.type === 'leave') {
        bgColor = "bg-rose-50/80 border-l-4 border-l-rose-400";
        badge = <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0 text-[9px] uppercase font-medium px-1.5 py-0 h-4">Leave</Badge>;
      } else if (dayData.type === 'half-day') {
        bgColor = "bg-orange-50/80 border-l-4 border-l-orange-400";
        badge = <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0 text-[9px] uppercase font-medium px-1.5 py-0 h-4">Half Day</Badge>;
      } else if (dayData.details?.checkIn) {
        if (dayData.details.status === 'late') {
          bgColor = "bg-amber-50/80 border-l-4 border-l-amber-400";
          badge = <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-200 border-0 text-[9px] uppercase font-medium px-1.5 py-0 h-4 shadow-sm">Late Login</Badge>;
        } else {
          bgColor = "bg-emerald-50/80 border-l-4 border-l-emerald-400";
          badge = <Badge className="bg-emerald-200 text-emerald-800 hover:bg-emerald-200 border-0 text-[9px] uppercase font-medium px-1.5 py-0 h-4 shadow-sm">On Time</Badge>;
        }
      }
    }

    return (
      <div 
        key={day.toString()} 
        onClick={() => setSelectedDate(day)}
        className={cn(
          "h-32 border-b border-r border-gray-100 p-2 transition-all hover:bg-gray-50 cursor-pointer relative group",
          bgColor,
          isSameDay(selectedDate, day) && "ring-2 ring-inset ring-black bg-[#fffe01]/5"
        )}
      >
        <div className="flex justify-between items-start">
          <span className={cn(
            "w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium",
            isToday ? "bg-black text-[#fffe01] shadow-lg" : textColor
          )}>
            {format(day, 'd')}
          </span>
          {badge}
        </div>

        {dayData?.details?.checkIn && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1 text-[9px] font-normal text-gray-500">
               <Clock className="w-2.5 h-2.5 text-emerald-500" />
               {dayData.details.checkIn} - {dayData.details.checkOut || '--:--'}
            </div>
            {dayData.details.status === 'late' && (
              <div className="text-[8px] font-medium text-rose-500 uppercase tracking-tighter">
                Late{dayData.details.permissionMinutes > 0 ? `: ${Math.ceil(dayData.details.permissionMinutes)}m` : ''}
              </div>
            )}
            {dayData.details.lateReason && (
              <div className="text-[7px] text-gray-400 font-normal truncate uppercase tracking-widest mt-0.5" title={dayData.details.lateReason}>
                {dayData.details.lateReason}
              </div>
            )}
            {dayData.details.lunchOut && (
              <div className="flex items-center gap-1 text-[9px] font-normal text-gray-400">
                 <Coffee className="w-2.5 h-2.5 text-amber-400" />
                 Break Logged
              </div>
            )}
          </div>
        )}

        {dayData?.status && !badge && !dayData?.details?.checkIn && (
          <p className="mt-1 text-[8px] font-medium text-gray-400 uppercase tracking-tighter truncate opacity-70 group-hover:opacity-100 transition-opacity">
            {dayData.status}
          </p>
        )}
      </div>
    );
  };

  const selectedDayData = getDayContent(selectedDate);

  return (
    <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
      <CardHeader className="p-10 border-b border-gray-100 bg-gray-50/30 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-medium flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-black" />
            Attendance Timeline
          </CardTitle>
          <p className="text-gray-500 font-normal text-xs">Comprehensive monthly protocol overview</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-black" />
          </Button>
          <span className="text-base font-medium text-gray-900 min-w-32 text-center uppercase tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full hover:bg-gray-100">
            <ChevronRight className="w-5 h-5 text-black" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col lg:flex-row">
        <div className="flex-1 w-full border-r border-gray-100">
          <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] border-r border-gray-100 last:border-0 border-t border-gray-100 lg:border-t-0 opacity-80">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 border-l border-gray-100">
            {days.map(day => renderDay(day))}
          </div>
        </div>

        {/* Right side panel details */}
        <div className="w-full lg:w-[360px] bg-gray-50/20 p-8 flex flex-col border-t lg:border-t-0 border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
               <div>
                 <span className="text-[10px] font-medium text-black tracking-[0.3em] uppercase block mb-1">{format(selectedDate, 'EEEE')}</span>
                 <h4 className="font-medium text-gray-900 text-lg tracking-tight">{format(selectedDate, 'MMM dd, yyyy')}</h4>
               </div>
               <span className="text-xs font-medium text-gray-300">#DATA</span>
            </div>
            
            <div className="space-y-3 pt-2">
              {selectedDayData?.details?.checkIn ? (
                <div className="space-y-4">
                  <div className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all ${selectedDayData.details.status === 'late' ? 'bg-amber-50/60 border-amber-200' : 'bg-emerald-50/60 border-emerald-100/50 hover:shadow-md'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className={`${selectedDayData.details.status === 'late' ? 'text-amber-700' : 'text-emerald-700'} font-medium uppercase tracking-widest text-[10px]`}>Login</span>
                        <span className={`${selectedDayData.details.status === 'late' ? 'text-amber-900' : 'text-emerald-900'} font-medium text-base`}>{selectedDayData.details.checkIn}</span>
                      </div>
                      {selectedDayData.details.status === 'late' ? (
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-[10px] text-amber-700 font-medium uppercase tracking-tighter bg-amber-100 border-amber-300 px-3 shadow-sm">
                            Late Login
                          </Badge>
                          {selectedDayData.details.permissionMinutes > 0 && (
                            <span className="text-[9px] font-medium text-amber-800 tracking-tighter uppercase">By {Math.ceil(selectedDayData.details.permissionMinutes)} min</span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 font-medium uppercase tracking-tighter bg-emerald-100 border-emerald-300 px-3 shadow-sm">
                          On Time
                        </Badge>
                      )}
                    </div>
                    {selectedDayData.details.status === 'late' && selectedDayData.details.lateReason && (
                      <div className="mt-2 text-xs bg-white p-3 rounded-xl border border-amber-200/50 shadow-sm text-amber-800 break-words whitespace-pre-wrap">
                        <span className="font-medium text-amber-900 block mb-1 uppercase tracking-widest text-[9px]">Reason Provided:</span>
                        {selectedDayData.details.lateReason}
                      </div>
                    )}
                  </div>

                  {selectedDayData.details.earlyLogoutReason && (
                    <div className="text-xs bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-rose-700 break-words whitespace-pre-wrap">
                      <span className="font-medium text-gray-900 block mb-1 uppercase tracking-widest text-[9px]">Early Out Reason</span>
                      {selectedDayData.details.earlyLogoutReason}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs bg-gray-50 p-4 rounded-2xl border border-gray-200 hover:shadow-md transition-all flex-shrink-0">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-600 font-medium uppercase tracking-widest text-[10px]">Logout</span>
                      <span className="text-gray-900 font-medium text-base">{selectedDayData.details.checkOut || 'Active'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-gray-300 py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                  <Info className="w-8 h-8 opacity-20" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.3em]">{selectedDayData?.status || 'No Entry Logged'}</span>
                </div>
              )}
            </div>

            {/* Show full reason if it's a leave request or half day */}
            {['leave', 'half-day'].includes(selectedDayData?.type) && selectedDayData?.details?.reason && (
               <div className="text-xs bg-rose-50/50 p-5 rounded-2xl border border-rose-100 text-rose-700 mt-4 break-words whitespace-pre-wrap shadow-inner">
                 <span className="font-medium text-rose-900 block mb-2 uppercase tracking-widest text-[10px]">Off-Day Reason</span>
                 {selectedDayData.details.reason}
               </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;

