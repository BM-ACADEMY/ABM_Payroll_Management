import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  Star, 
  Target,
  ArrowUpRight,
  ChevronRight,
  Clock
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import Loader from "@/components/ui/Loader";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-xl">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-900">
          {payload[0].value} <span className="text-xs text-gray-400 font-normal">Credits</span>
        </p>
      </div>
    );
  }
  return null;
};

const PerformanceHistory = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/scores/history`, {
          headers: { 'x-auth-token': token }
        });
        setScores(res.data);
      } catch (err) {
        console.error("Error fetching score history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const chartData = useMemo(() => {
    return [...scores].reverse().map(s => ({
      name: format(parseISO(s.weekStartDate), 'MMM dd'),
      credits: s.totalCredits
    }));
  }, [scores]);

  const stats = useMemo(() => {
    if (scores.length === 0) return { avg: 0, total: 0, best: 0, count: 0 };
    const total = scores.reduce((acc, s) => acc + s.totalCredits, 0);
    const avg = total / scores.length;
    const best = Math.max(...scores.map(s => s.totalCredits));
    return { 
      avg: avg.toFixed(1), 
      total, 
      best,
      count: scores.length
    };
  }, [scores]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader size="lg" color="red" />
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Loading History...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 md:p-8 lg:p-10 space-y-8 animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900">
            Performance <span className="text-[#d30614]">History</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg font-normal">
            Track your weekly credits and performance trends over time
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <Trophy className="w-6 h-6 text-amber-500" />
           <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Overall Grade</span>
              <span className="text-sm font-bold text-gray-900 group-hover:text-[#d30614] transition-colors uppercase italic">Professional Level</span>
           </div>
        </div>
      </header>

      {/* Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         {[
           { label: 'Average Score', value: stats.avg, suffix: '/100', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
           { label: 'Peak Performance', value: stats.best, suffix: ' pts', icon: Trophy, color: 'text-[#d30614]', bg: 'bg-red-50' },
           { label: 'Total Credits', value: stats.total, suffix: '', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
           { label: 'Assessments', value: stats.count, suffix: ' weeks', icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50' },
         ].map((stat, i) => (
           <Card key={i} className="border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
             <CardContent className="p-6 flex items-center gap-5">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                   <stat.icon className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">{stat.label}</p>
                   <div className="text-2xl font-bold text-gray-900 tracking-tight">
                     {stat.value}<span className="text-xs font-normal text-gray-400 ml-1">{stat.suffix}</span>
                   </div>
                </div>
             </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progression Chart */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-900 text-white rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Score Progression</CardTitle>
                      <CardDescription className="text-xs font-medium text-gray-400">Longitudinal performance trend over the last {stats.count} assessments</CardDescription>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-xs font-bold">{stats.avg}% Avg</span>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d30614" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#d30614" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} dy={10} stroke="#9ca3af" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#9ca3af" domain={[0, 100]} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="credits" 
                  stroke="#d30614" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorCredits)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Latest Summary Card */}
        <Card className="border-none shadow-xl bg-gray-900 text-white rounded-[2rem] overflow-hidden flex flex-col justify-between">
           <CardHeader className="p-10 pb-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-[#fffe01] text-black rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                 </div>
                 <CardTitle className="text-xl font-bold uppercase tracking-tight">Latest Evaluation</CardTitle>
              </div>
           </CardHeader>
           <CardContent className="p-10 flex flex-col justify-between flex-1 space-y-10">
              {scores[0] ? (
                <>
                  <p className="text-3xl md:text-4xl font-medium tracking-tight italic leading-tight">
                    "{scores[0].assessment?.msg || 'Excellent performance maintained this week.'}"
                  </p>
                  <div className="space-y-6 pt-6 border-t border-gray-800">
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assigned Team</span>
                           <p className="text-lg font-bold">{scores[0].team?.name || 'General'}</p>
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Score</span>
                           <div className="flex items-center gap-2">
                              <span className="text-4xl font-bold text-[#fffe01]">{scores[0].totalCredits}</span>
                              <span className="text-xs text-gray-500">/100</span>
                           </div>
                        </div>
                     </div>
                     <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#fffe01] transition-all duration-1000" style={{ width: `${scores[0].totalCredits}%` }}></div>
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-600 italic">No assessments yet</div>
              )}
           </CardContent>
        </Card>
      </div>

      {/* History Log Table */}
      <Card className="border-gray-100 shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-gray-50">
           <CardTitle className="text-xl font-bold flex items-center gap-3">
              <Clock className="w-6 h-6 text-[#d30614]" /> Performance Log
           </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="pl-10 h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Week Ending</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Team</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest text-center">Score</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Status</TableHead>
                  <TableHead className="pr-10 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Feedback Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-400">No performance records found</TableCell></TableRow>
                ) : (
                  scores.map((score, i) => (
                    <TableRow key={i} className="hover:bg-gray-50/50 transition-all border-gray-50">
                      <TableCell className="pl-10 py-6 font-bold text-gray-900 whitespace-nowrap">
                        {format(parseISO(score.weekStartDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium text-gray-600">{score.team?.name}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-block py-1.5 px-4 bg-gray-900 text-[#fffe01] font-bold rounded-xl text-lg shadow-sm">
                          {score.totalCredits}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`font-bold text-[9px] uppercase px-3 py-1 rounded-lg ${score.assessment?.color} border-current bg-transparent`}>
                          {score.assessment?.title}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-10 max-w-md">
                        <p className="text-sm text-gray-500 italic line-clamp-2">"{score.feedback || 'No detailed feedback provided.'}"</p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceHistory;
