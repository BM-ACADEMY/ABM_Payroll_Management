import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  Info,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Star,
  Zap,
  Target
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import Loader from "@/components/ui/Loader";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 backdrop-blur-md p-4 border border-zinc-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-medium text-[#fffe01]">
          {payload[0].value} <span className="text-xs text-zinc-400 font-normal">Credits</span>
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
    if (scores.length === 0) return { avg: 0, total: 0, best: 0 };
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
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Compiling Performance History...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 bg-background min-h-screen pb-32">
      <header className="flex flex-col space-y-3">
        <div className="flex items-center gap-3">
           <div className="h-10 w-2 bg-[#fffe01] rounded-full shadow-sm"></div>
           <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-gray-900 uppercase italic">
             Performance <span className="text-[#d30614]">Credits</span>
           </h1>
        </div>
        <p className="text-gray-500 text-lg font-normal max-w-2xl leading-relaxed">
          Track your <span className="text-black font-medium">weekly growth</span> and professional milestones.
        </p>
      </header>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Average Score', value: stats.avg, suffix: '/100', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
           { label: 'Best Week', value: stats.best, suffix: ' Credits', icon: Trophy, color: 'text-[#d30614]', bg: 'bg-red-50' },
           { label: 'Total Credits', value: stats.total, suffix: '', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
           { label: 'Assessment Cycles', value: stats.count, suffix: ' Weeks', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-sm transition-all hover:shadow-md group overflow-hidden bg-white">
             <CardContent className="p-6 flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                   <stat.icon className="w-7 h-7" />
                </div>
                <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                   <div className="text-2xl font-bold text-gray-900 tracking-tight">
                     {stat.value}<span className="text-sm font-normal text-gray-400">{stat.suffix}</span>
                   </div>
                </div>
             </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* PROGRESSION CHART */}
        <Card className="xl:col-span-2 border-none shadow-sm overflow-hidden bg-black text-white relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
            <TrendingUp className="w-48 h-48" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-xl flex items-center gap-2 text-[#fffe01] font-medium uppercase italic tracking-wider">
              <TrendingUp className="w-5 h-5" />
              Efficiency Progression
            </CardTitle>
            <CardDescription className="text-zinc-500">Visualizing your credit trends over the course of time</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fffe01" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fffe01" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                  domain={[0, 100]}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="credits" 
                  stroke="#fffe01" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCredits)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* FEEDBACK QUOTE */}
        <Card className="border-none shadow-sm bg-[#fffe01] text-black overflow-hidden relative group h-full">
           <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Star className="w-64 h-64 fill-black" />
           </div>
           <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-medium uppercase italic flex items-center gap-2">
                 <MessageSquare className="w-5 h-5" />
                 Latest Evaluation
              </CardTitle>
           </CardHeader>
           <CardContent className="p-8 space-y-8 relative z-10">
              {scores[0] ? (
                <>
                  <div className="text-4xl font-bold tracking-tighter leading-tight italic">
                    "{scores[0].assessment?.msg || 'Keep up the good work!'}"
                  </div>
                  <div className="space-y-4 pt-4 border-t border-black/10">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">Team</span>
                        <span className="text-sm font-bold uppercase italic">{scores[0].team?.name}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">Score</span>
                        <Badge className="bg-black text-[#fffe01] hover:bg-zinc-800 border-none px-3 font-bold italic">
                           {scores[0].totalCredits}/100
                        </Badge>
                     </div>
                  </div>
                </>
              ) : (
                <div className="text-xl font-medium opacity-40">No assessments recorded yet.</div>
              )}
           </CardContent>
        </Card>
      </div>

      {/* HISTORY TABLE */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-gray-100">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-3 text-gray-900 font-medium uppercase italic">
              <Calendar className="w-6 h-6 text-[#d30614]" />
              Chronological Log
            </CardTitle>
            <CardDescription className="text-gray-500 font-normal">Every credit counts. Review your journey below.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-gray-100">
                  <TableHead className="pl-10 h-16 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Assessment Week</TableHead>
                  <TableHead className="font-bold text-gray-500 text-[11px] uppercase tracking-wider">Functional Team</TableHead>
                  <TableHead className="font-bold text-gray-500 text-[11px] uppercase tracking-wider text-center">Score Index</TableHead>
                  <TableHead className="font-bold text-gray-500 text-[11px] uppercase tracking-wider">Assessment Status</TableHead>
                  <TableHead className="pr-10 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Admin Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-32 text-gray-400 font-normal italic">
                      No performance credit history found. Your journey begins with your first weekly assessment.
                    </TableCell>
                  </TableRow>
                ) : (
                  scores.map((score, i) => (
                    <TableRow key={i} className="group hover:bg-gray-50/60 transition-all border-gray-50">
                      <TableCell className="font-bold text-gray-900 pl-10 py-8 tracking-tight whitespace-nowrap">
                        <div className="flex flex-col">
                           <span className="text-xs text-zinc-400 font-bold uppercase mb-1">Week Ending</span>
                           {format(parseISO(score.weekStartDate), 'MMMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold uppercase italic text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
                          {score.team?.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="relative inline-flex items-center justify-center">
                           <div className="text-2xl font-black italic tracking-tighter">{score.totalCredits}</div>
                           <div className="text-[10px] font-bold text-zinc-400 uppercase -rotate-90 ml-2">PTS</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`font-black text-[10px] uppercase border-2 px-4 py-1.5 rounded-xl shadow-sm ${score.assessment?.bg} ${score.assessment?.color} ${score.assessment?.border} group-hover:scale-105 transition-transform`} 
                          variant="outline"
                        >
                          {score.assessment?.title}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-10 py-8 min-w-[300px]">
                        <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 relative max-w-lg">
                           <div className="absolute top-4 left-4 opacity-5 group-hover:opacity-10 transition-opacity">
                              <MessageSquare className="w-10 h-10" />
                           </div>
                           <p className="text-xs text-gray-600 font-medium leading-relaxed italic relative z-10">
                              {score.feedback || 'System evaluation based on weekly metrics.'}
                           </p>
                        </div>
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
