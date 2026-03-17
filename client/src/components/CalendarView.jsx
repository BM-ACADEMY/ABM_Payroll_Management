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
        <div key={day.toString()} className="h-32 border-b border-r border-slate-50 bg-slate-50/30"></div>
      );
    }

    let bgColor = "bg-white";
    let textColor = "text-slate-900";
    let badge = null;

    if (dayData) {
      switch (dayData.type) {
        case 'holiday':
          bgColor = "bg-indigo-50/50";
          badge = <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-0 text-[9px] uppercase font-black px-1.5 py-0 h-4">{dayData.status}</Badge>;
          break;
        case 'leave':
          bgColor = "bg-rose-50/50";
          badge = <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0 text-[9px] uppercase font-black px-1.5 py-0 h-4">Leave</Badge>;
          break;
        case 'half-day':
          bgColor = "bg-amber-50/50";
          badge = <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-[9px] uppercase font-black px-1.5 py-0 h-4">Half Day</Badge>;
          break;
        default:
          if (dayData.details?.checkIn) {
             bgColor = dayData.details.status === 'late' ? "bg-amber-50/30" : "bg-emerald-50/30";
          }
      }
    }

    return (
      <div 
        key={day.toString()} 
        className={cn(
          "h-32 border-b border-r border-slate-100 p-2 transition-all hover:bg-slate-50 cursor-pointer relative group",
          bgColor
        )}
      >
        <div className="flex justify-between items-start">
          <span className={cn(
            "w-7 h-7 flex items-center justify-center rounded-full text-xs font-black",
            isToday ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : textColor
          )}>
            {format(day, 'd')}
          </span>
          {badge}
        </div>

        {dayData?.details?.checkIn && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
               <Clock className="w-2.5 h-2.5 text-emerald-500" />
               {dayData.details.checkIn} - {dayData.details.checkOut || '--:--'}
            </div>
            {dayData.details.lunchOut && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                 <Coffee className="w-2.5 h-2.5 text-amber-400" />
                 Break Logged
              </div>
            )}
          </div>
        )}

        {dayData?.status && !badge && (
          <p className="mt-1 text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate opacity-70 group-hover:opacity-100 transition-opacity">
            {dayData.status}
          </p>
        )}

        {/* Hover Details Overlay */}
        <div className="absolute inset-x-2 top-2 bottom-2 z-[60] bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border-2 border-indigo-100 p-4 opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 flex flex-col justify-between overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
               <span className="text-[9px] font-black text-indigo-600 tracking-[0.2em] uppercase">{format(day, 'EEEE')}</span>
               <span className="text-[9px] font-black text-slate-300">#LOG</span>
            </div>
            <h4 className="font-black text-slate-900 text-xs tracking-tight">{format(day, 'MMM dd, yyyy')}</h4>
            
            <div className="space-y-1.5 pt-2">
              {dayData?.details?.checkIn ? (
                <>
                  <div className="flex items-center justify-between text-[9px] bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                    <span className="text-emerald-700 font-bold uppercase tracking-tighter">Login</span>
                    <span className="text-emerald-900 font-black">{dayData.details.checkIn}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-600 font-bold uppercase tracking-tighter">Logout</span>
                    <span className="text-slate-900 font-black">{dayData.details.checkOut || 'Active'}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-300 py-4">
                  <Info className="w-5 h-5 opacity-20" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">{dayData?.status || 'No Entry'}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 pt-3 border-t border-slate-50">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${dayData?.details?.checkIn ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Validated Sequence</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-[0_40px_80px_rgba(0,0,0,0.06)] rounded-[3rem] bg-white overflow-hidden">
      <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-black flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-indigo-600" />
            Attendance Timeline
          </CardTitle>
          <p className="text-slate-500 font-bold italic text-xs">Comprehensive monthly protocol overview</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] border-2 border-slate-100 shadow-sm">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full hover:bg-indigo-50">
            <ChevronLeft className="w-5 h-5 text-indigo-600" />
          </Button>
          <span className="text-base font-black text-slate-900 min-w-32 text-center uppercase tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full hover:bg-indigo-50">
            <ChevronRight className="w-5 h-5 text-indigo-600" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-100 last:border-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 border-l border-slate-100">
          {days.map(day => renderDay(day))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
