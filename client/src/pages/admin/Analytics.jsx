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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Analytics & Reports</h1>
          <p className="text-zinc-500 font-medium mt-1">Deep insights into employee performance and external project status.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'internal' ? 'bg-black text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            Internal Performance
          </button>
          <button 
            onClick={() => setActiveTab('external')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'external' ? 'bg-black text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            Google Sheets
          </button>
        </div>
      </div>

      {activeTab === 'internal' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <CheckCircle2 className="w-12 h-12 absolute -right-2 -bottom-2 opacity-10" />
                <div className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Total Completed</div>
                <div className="text-4xl font-black">{performanceData.reduce((acc, curr) => acc + curr.totalCompleted, 0)}</div>
                <p className="text-xs mt-2 opacity-70">Across all boards and teams</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <Clock className="w-12 h-12 absolute -right-2 -bottom-2 opacity-10" />
                <div className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">On-Time Completion</div>
                <div className="text-4xl font-black">
                  {Math.round((performanceData.reduce((acc, curr) => acc + curr.onTime, 0) / performanceData.reduce((acc, curr) => acc + curr.totalCompleted, 0) || 0) * 100)}%
                </div>
                <p className="text-xs mt-2 opacity-70">Average efficiency rate</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-[#fffe01] text-black overflow-hidden relative border-b-4 border-yellow-500">
              <CardContent className="p-6">
                <Layers className="w-12 h-12 absolute -right-2 -bottom-2 opacity-10" />
                <div className="text-sm font-bold opacity-60 uppercase tracking-widest mb-1">Daily Tasks Met</div>
                <div className="text-4xl font-black">
                  {performanceData.reduce((acc, curr) => acc + curr.dailyCompletions, 0)}
                </div>
                <p className="text-xs mt-2 opacity-60">Tasks closed from daily boards</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-zinc-100 bg-white p-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-xl font-black">Employee Performance Comparison</CardTitle>
                </div>
                <CardDescription className="text-zinc-500 font-medium">Breakdown of on-time vs. delayed task completions by person.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-10 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 700}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 700}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                      cursor={{fill: '#f8fafc'}}
                    />
                    <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{fontWeight: 'bold', fontSize: '12px'}} />
                    <Bar dataKey="onTime" name="On Time" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="delayed" name="Delayed" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar for Sources */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-zinc-200 shadow-sm rounded-2xl bg-white sticky top-6">
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      Sources
                    </CardTitle>
                    {!isAddingSource && (
                      <Button size="icon" variant="ghost" onClick={() => setIsAddingSource(true)} className="h-8 w-8 rounded-full hover:bg-emerald-50 text-emerald-600">
                        <Plus className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {isAddingSource && (
                    <form onSubmit={handleAddSource} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3 mb-4">
                      <Input 
                        placeholder="Report Name (e.g., Marketing Tracker)" 
                        value={newSource.title} 
                        onChange={e => setNewSource({...newSource, title: e.target.value})} 
                        className="bg-white" required
                      />
                      <Input 
                        placeholder="Google Sheet Link" 
                        value={newSource.url} 
                        onChange={e => setNewSource({...newSource, url: e.target.value})} 
                        className="bg-white" required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="Status Col (e.g., F)" 
                          value={newSource.statusCol} 
                          onChange={e => setNewSource({...newSource, statusCol: e.target.value})} 
                          className="bg-white" required
                        />
                        <Input 
                          placeholder="Handler Col (e.g., H)" 
                          value={newSource.handlerCol} 
                          onChange={e => setNewSource({...newSource, handlerCol: e.target.value})} 
                          className="bg-white" required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs">Save</Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingSource(false)} className="flex-1 h-9 text-xs">Cancel</Button>
                      </div>
                    </form>
                  )}

                  {sources.length === 0 ? (
                    <div className="text-center py-10">
                      <FileSpreadsheet className="w-10 h-10 text-zinc-200 mx-auto mb-2" />
                      <p className="text-sm font-bold text-zinc-400 italic">No sources added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {sources.map(source => (
                        <div 
                          key={source._id}
                          className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeSourceId === source._id ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-transparent hover:bg-zinc-50 text-zinc-600'}`}
                          onClick={() => fetchSourceData(source._id)}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-2 h-2 rounded-full ${activeSourceId === source._id ? 'bg-emerald-600 animate-pulse' : 'bg-zinc-300'}`} />
                            <span className="text-sm font-bold truncate">{source.title}</span>
                          </div>
                          <Button 
                            variant="ghost" size="icon" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSource(source._id); }}
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 text-zinc-400 transition-all"
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
            <div className="lg:col-span-8">
              {!activeSourceId ? (
                <Card className="h-full min-h-[500px] border-zinc-200 shadow-sm flex flex-col items-center justify-center bg-white rounded-2xl border-dashed border-2">
                  <div className="text-center space-y-3">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                      <BarChart3 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900">Select a Source</h3>
                    <p className="text-zinc-500 font-medium max-w-xs mx-auto">Click on a Google Sheet source from the left to load its analytics and visualization.</p>
                  </div>
                </Card>
              ) : (
                <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <CardHeader className="border-b border-zinc-100 bg-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-black">{sources.find(s => s._id === activeSourceId)?.title}</CardTitle>
                        <CardDescription className="text-zinc-500 font-medium flex items-center gap-1">
                          Mapped to Status ({sources.find(s => s._id === activeSourceId)?.statusCol}) and Handler ({sources.find(s => s._id === activeSourceId)?.handlerCol})
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={sourceLoading} 
                        onClick={() => fetchSourceData(activeSourceId)}
                        className="h-8 font-black text-xs gap-2 rounded-lg"
                      >
                        {sourceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {sourceLoading ? (
                      <div className="h-[400px] flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
                          <p className="text-sm font-bold text-zinc-400">Gleaning insights from the spreadsheet...</p>
                        </div>
                      </div>
                    ) : activeSourceData ? (
                      <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {activeSourceData.statuses?.slice(0, 4).map((status, i) => (
                            <div key={status} className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{status}</div>
                              <div className="text-2xl font-black">
                                {activeSourceData.chartData.reduce((acc, curr) => acc + (curr[status] || 0), 0)}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="h-[400px] pt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activeSourceData.chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis dataKey="handler" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 700}} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 700}} />
                              <Tooltip 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                                cursor={{fill: '#f8fafc'}}
                              />
                              <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{fontWeight: 'bold', fontSize: '12px'}} />
                              {activeSourceData.statuses.map((status, i) => (
                                <Bar 
                                  key={status} 
                                  stackId="a" 
                                  dataKey={status} 
                                  fill={COLORS[i % COLORS.length]} 
                                  radius={i === activeSourceData.statuses.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-2">
                        <AlertCircle className="w-10 h-10 text-amber-500" />
                        <h4 className="text-lg font-black text-zinc-900">Unable to load data</h4>
                        <p className="text-sm text-zinc-500 font-medium max-w-xs">Please verify the link is a valid public Google Sheet and columns are correctly identified.</p>
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
