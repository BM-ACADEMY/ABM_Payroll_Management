import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  BarChart3, FileSpreadsheet, Plus, Trash2, Loader2, AlertCircle, 
  CheckCircle2, Clock, Users, ArrowRight, RefreshCw, Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Loader from "@/components/ui/Loader";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('internal');
  const [performanceData, setPerformanceData] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState(null);
  const [activeSourceData, setActiveSourceData] = useState(null);

  // New Source Form
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSource, setNewSource] = useState({
    title: '',
    url: '',
    statusCol: '',
    handlerCol: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const [perfRes, sourcesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/performance`, { headers: { 'x-auth-token': token } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/sources`, { headers: { 'x-auth-token': token } })
      ]);
      setPerformanceData(perfRes.data);
      setSources(sourcesRes.data);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch analytics data" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/analytics/sources`, newSource, {
        headers: { 'x-auth-token': token }
      });
      setSources([...sources, res.data]);
      setIsAddingSource(false);
      setNewSource({ title: '', url: '', statusCol: '', handlerCol: '' });
      toast({ title: "Success", description: "Analytics source added" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add source" });
    }
  };

  const handleDeleteSource = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/analytics/sources/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setSources(sources.filter(s => s._id !== id));
      if (activeSourceId === id) {
        setActiveSourceId(null);
        setActiveSourceData(null);
      }
      toast({ title: "Removed", description: "Source deleted successfully" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete source" });
    }
  };

  const fetchSourceData = async (id) => {
    setSourceLoading(true);
    setActiveSourceId(id);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/data/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setActiveSourceData(res.data);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch sheet data. Ensure the sheet is public." });
    } finally {
      setSourceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader size="lg" color="red" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in duration-700 bg-background min-h-screen pb-24">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-2">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-black">
            <div className="p-2 bg-[#fffe01] rounded-xl shadow-sm">
              <BarChart3 className="w-5 h-5 text-black" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Intelligence Bureau</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900 leading-tight">
            Advanced <span className="text-[#d30614]">Analytics</span>
          </h1>
          <p className="text-gray-500 font-normal max-w-2xl text-sm md:text-base leading-relaxed">Synthesizing operational velocity, performance vectors, and cross-platform synchronization metadata.</p>
        </div>

        <div className="flex bg-white p-1.5 md:p-2 rounded-[1.5rem] border-2 border-zinc-50 shadow-xl shadow-zinc-200/50 w-full xl:w-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('internal')}
            className={`flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'internal' ? 'bg-black text-[#fffe01] shadow-2xl scale-105 z-10' : 'text-zinc-400 hover:text-black hover:bg-zinc-50'}`}
          >
            Internal Performance
          </button>
          <button 
            onClick={() => setActiveTab('external')}
            className={`flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'external' ? 'bg-black text-[#fffe01] shadow-2xl scale-105 z-10' : 'text-zinc-400 hover:text-black hover:bg-zinc-50'}`}
          >
            External Sync
          </button>
        </div>
      </header>

      {activeTab === 'internal' ? (
        <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="border-0 shadow-2xl shadow-indigo-500/20 bg-indigo-600 text-white overflow-hidden relative group rounded-[2.5rem] h-48 md:h-56">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-1000"></div>
              <CardContent className="p-8 h-full flex flex-col justify-between relative">
                <div>
                  <div className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">Cumulative Throughput</div>
                  <div className="text-5xl md:text-6xl font-black tracking-tighter">
                    {performanceData.reduce((acc, curr) => acc + curr.totalCompleted, 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Total Validated Units</p>
                  <CheckCircle2 className="w-8 h-8 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl shadow-emerald-500/20 bg-emerald-600 text-white overflow-hidden relative group rounded-[2.5rem] h-48 md:h-56">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-1000"></div>
              <CardContent className="p-8 h-full flex flex-col justify-between relative">
                <div>
                  <div className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">Operational Velocity</div>
                  <div className="text-5xl md:text-6xl font-black tracking-tighter">
                    {Math.round((performanceData.reduce((acc, curr) => acc + curr.onTime, 0) / performanceData.reduce((acc, curr) => acc + curr.totalCompleted, 0) || 0) * 100)}%
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold opacity-60 uppercase tracking-widest">On-Time Accuracy Rate</p>
                  <Clock className="w-8 h-8 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl shadow-zinc-200/50 bg-[#fffe01] text-black overflow-hidden relative group rounded-[2.5rem] h-48 md:h-56">
               <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-black/10 transition-all duration-1000"></div>
              <CardContent className="p-8 h-full flex flex-col justify-between relative">
                <div>
                  <div className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-1">Dynamic Engagement</div>
                  <div className="text-5xl md:text-6xl font-black tracking-tighter">
                    {performanceData.reduce((acc, curr) => acc + curr.dailyCompletions, 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Daily Anomalies Resolved</p>
                  <Layers className="w-8 h-8 opacity-10" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 md:p-10 border-b border-zinc-50 bg-zinc-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-4">
                   <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  Performance Vectors
                </CardTitle>
                <CardDescription className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] pl-14">Comparative analysis of personnel execution efficacy</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-10 h-[400px] md:h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    dy={10} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900', fontSize: '12px', padding: '16px'}}
                    cursor={{fill: '#f8fafc', radius: 10}}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    height={60} 
                    iconType="circle" 
                    wrapperStyle={{fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8'}} 
                  />
                  <Bar dataKey="onTime" name="Validated On-Time" fill="#10b981" radius={[8, 8, 0, 0]} barSize={24} />
                  <Bar dataKey="delayed" name="Delayed Units" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Sidebar for Sources */}
            <div className="xl:col-span-4 space-y-8">
              <Card className="border-0 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] bg-white overflow-hidden xl:sticky xl:top-10">
                <CardHeader className="p-8 border-b border-zinc-50 bg-zinc-50/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold flex items-center gap-4 tracking-tight">
                      <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <FileSpreadsheet className="w-5 h-5 text-white" />
                      </div>
                      Sync Channels
                    </CardTitle>
                    {!isAddingSource && (
                      <Button size="icon" onClick={() => setIsAddingSource(true)} className="h-10 w-10 rounded-2xl bg-black hover:bg-zinc-800 text-[#fffe01] shadow-xl active:scale-95 transition-all">
                        <Plus className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-zinc-400 font-bold uppercase tracking-widest text-[9px] mt-2 pl-14">External synchronization pipelines</CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-4">
                  {isAddingSource && (
                    <form onSubmit={handleAddSource} className="p-6 bg-zinc-50 rounded-[2rem] border-2 border-zinc-100 space-y-4 mb-4 animate-in zoom-in-95 duration-300">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Channel Identifier</Label>
                        <Input 
                          placeholder="E.g. Marketing Dashboard" 
                          value={newSource.title} 
                          onChange={e => setNewSource({...newSource, title: e.target.value})} 
                          className="bg-white h-12 rounded-xl border-zinc-200 font-bold shadow-inner" required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Archive URL (CSV EXPORT)</Label>
                        <Input 
                          placeholder="Public Google Sheet URL" 
                          value={newSource.url} 
                          onChange={e => setNewSource({...newSource, url: e.target.value})} 
                          className="bg-white h-12 rounded-xl border-zinc-200 font-bold shadow-inner" required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Status COL</Label>
                          <Input 
                            placeholder="E.g. F" 
                            value={newSource.statusCol} 
                            onChange={e => setNewSource({...newSource, statusCol: e.target.value})} 
                            className="bg-white h-12 rounded-xl border-zinc-200 font-bold text-center uppercase shadow-inner" required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Handler COL</Label>
                          <Input 
                            placeholder="E.g. H" 
                            value={newSource.handlerCol} 
                            onChange={e => setNewSource({...newSource, handlerCol: e.target.value})} 
                            className="bg-white h-12 rounded-xl border-zinc-200 font-bold text-center uppercase shadow-inner" required
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button type="submit" className="flex-1 bg-black hover:bg-zinc-800 text-[#fffe01] font-black uppercase tracking-widest h-12 rounded-xl shadow-xl active:scale-95 transition-all text-[10px]">Initialize</Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingSource(false)} className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-zinc-400">Abort</Button>
                      </div>
                    </form>
                  )}

                  {sources.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                      <div className="w-20 h-20 bg-zinc-50 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-inner border border-zinc-100 opacity-50">
                        <FileSpreadsheet className="w-8 h-8 text-zinc-300" />
                      </div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Zero active pipelines found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {sources.map(source => (
                        <div 
                          key={source._id}
                          className={`group flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all border-2 ${activeSourceId === source._id ? 'bg-zinc-900 border-black text-white shadow-2xl translate-x-2' : 'bg-white border-zinc-50 hover:border-zinc-200 text-zinc-600 shadow-sm'}`}
                          onClick={() => fetchSourceData(source._id)}
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className={`w-3 h-3 rounded-full shadow-lg ${activeSourceId === source._id ? 'bg-[#fffe01] animate-pulse' : 'bg-zinc-200'}`} />
                            <span className="text-xs font-black uppercase tracking-widest truncate">{source.title}</span>
                          </div>
                          <Button 
                            variant="ghost" size="icon" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSource(source._id); }}
                            className={`h-10 w-10 rounded-xl transition-all ${activeSourceId === source._id ? 'hover:bg-white/10 text-zinc-500 hover:text-white' : 'opacity-0 group-hover:opacity-100 hover:text-[#d30614] hover:bg-rose-50 text-zinc-300'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Graph Content */}
            <div className="xl:col-span-8">
              {!activeSourceId ? (
                <Card className="h-full min-h-[500px] border-0 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] flex flex-col items-center justify-center bg-white border-2 border-dashed border-zinc-100">
                  <div className="text-center space-y-6">
                    <div className="w-32 h-32 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner relative group">
                      <div className="absolute inset-0 bg-emerald-500/10 rounded-[2.5rem] scale-90 group-hover:scale-110 transition-transform duration-700"></div>
                      <BarChart3 className="w-12 h-12 text-emerald-600 relative z-10" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Deployment Pending</h3>
                       <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] max-w-xs mx-auto">Select a synchronization pipeline from the registry to initialize visualization.</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border-0 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] overflow-hidden bg-white animate-in zoom-in-95 duration-500">
                  <CardHeader className="p-8 md:p-10 border-b border-zinc-50 bg-zinc-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-black rounded-xl shadow-lg">
                          <Layers className="w-5 h-5 text-[#fffe01]" />
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight">{sources.find(s => s._id === activeSourceId)?.title}</CardTitle>
                      </div>
                      <CardDescription className="text-zinc-400 font-bold uppercase tracking-widest text-[9px] pl-16">
                        Mapped Vectors: STATUS ({sources.find(s => s._id === activeSourceId)?.statusCol}) &bull; HANDLER ({sources.find(s => s._id === activeSourceId)?.handlerCol})
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => fetchSourceData(activeSourceId)}
                      disabled={sourceLoading}
                      className="h-14 px-8 rounded-2xl border-2 border-zinc-100 font-black uppercase tracking-[0.2em] text-[10px] hover:text-black hover:border-black transition-all bg-white shadow-xl active:scale-95"
                    >
                      {sourceLoading ? <Loader size="sm" color="red" /> : <RefreshCw className="w-4 h-4 mr-3" />}
                      Sync Cache
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6 md:p-10">
                    {sourceLoading ? (
                      <div className="h-[500px] flex flex-col items-center justify-center gap-6">
                        <Loader size="xl" color="red" />
                        <div className="text-center">
                          <p className="text-xs font-black text-zinc-900 uppercase tracking-widest animate-pulse">Extracting Intelligence</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Cross-referencing spreadsheet metadata architecture...</p>
                        </div>
                      </div>
                    ) : activeSourceData ? (
                      <div className="space-y-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                          {activeSourceData.statuses?.slice(0, 4).map((status, i) => (
                            <div key={status} className="bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] p-6 shadow-inner hover:bg-white hover:border-zinc-200 hover:shadow-xl transition-all duration-500 group">
                              <div className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 group-hover:text-black transition-colors">{status}</div>
                              <div className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
                                {activeSourceData.chartData.reduce((acc, curr) => acc + (curr[status] || 0), 0)}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="h-[400px] md:h-[500px] pt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activeSourceData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="handler" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                dy={10} 
                              />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                              <Tooltip 
                                contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900', fontSize: '12px', padding: '16px'}}
                                cursor={{fill: '#f8fafc', radius: 10}}
                              />
                              <Legend 
                                verticalAlign="top" 
                                align="right" 
                                height={60} 
                                iconType="circle" 
                                wrapperStyle={{fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8'}} 
                              />
                              {activeSourceData.statuses.map((status, i) => (
                                <Bar 
                                  key={status} 
                                  stackId="a" 
                                  dataKey={status} 
                                  fill={COLORS[i % COLORS.length]} 
                                  radius={i === activeSourceData.statuses.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]} 
                                  barSize={28}
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-700">
                        <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center shadow-inner relative group">
                          <AlertCircle className="w-10 h-10 text-[#d30614]" />
                        </div>
                        <div className="space-y-2">
                           <h4 className="text-2xl font-black text-zinc-900 tracking-tight">Sync Failure</h4>
                           <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] max-w-xs mx-auto leading-loose">The requested spreadsheet architecture is inaccessible. Verify public permissions and column mapping integrity.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
