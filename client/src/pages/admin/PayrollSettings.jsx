import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Save, 
  Clock, 
  Calendar, 
  Briefcase,
  TrendingDown, 
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Home,
  Pencil,
  X
} from "lucide-react";
import axios from 'axios';
import Loader from "@/components/ui/Loader";

const PayrollSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [settings, setSettings] = useState({
    monthlyPermissionHours: 3,
    casualLeaveLimit: 1,
    monthlyWorkingDays: 30,
    halfDaySalaryRateLimit: 0.5,
    fullDaySalaryRateLimit: 1.0,
    saturdayRule: 'full-day'
  });
  const [originalSettings, setOriginalSettings] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings`, {
        headers: { 'x-auth-token': token }
      });
      setSettings(res.data);
      setOriginalSettings(res.data);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setMessage({ type: 'error', text: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.name === 'saturdayRule' ? e.target.value : (parseFloat(e.target.value) || 0);
    setSettings({ ...settings, [e.target.name]: value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, settings, {
        headers: { 'x-auth-token': token }
      });
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      setOriginalSettings(settings);
      setIsEditing(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error("Error updating settings:", err);
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to update settings.' });
    } finally {
      setSaveLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader size="md" color="red" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in duration-700 bg-background min-h-screen pb-24">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-black">
            <div className="p-2 bg-[#fffe01] rounded-xl shadow-sm">
              <Settings className="w-5 h-5 text-black" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">System Parameters</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900 leading-tight">
            Payroll <span className="text-[#d30614]">Architecture</span>
          </h1>
          <p className="text-gray-500 font-normal max-w-2xl text-sm md:text-base leading-relaxed">Configure global computational logic, operational limits, and financial disbursement protocols.</p>
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto">
          {isEditing ? (
            <Button 
              variant="outline" 
              onClick={() => {
                setSettings(originalSettings);
                setIsEditing(false);
              }}
              className="flex-1 sm:flex-none h-14 md:h-16 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] border-2 border-zinc-100 text-zinc-400 hover:text-black hover:border-black transition-all"
            >
              <X className="w-4 h-4 mr-3" />
              Discard edits
            </Button>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)}
              className="flex-1 sm:flex-none h-14 md:h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-black hover:bg-zinc-800 text-[#fffe01] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <Pencil className="w-4 h-4" />
              Modify Protocol
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="border-0 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-6 md:p-10 pb-6 border-b border-zinc-50 bg-zinc-50/30">
                <CardTitle className="text-2xl font-bold flex items-center gap-4 text-zinc-900 tracking-tight">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-5 h-5 text-[#fffe01]" />
                  </div>
                  Allowance Thresholds
                </CardTitle>
                <CardDescription className="font-bold text-zinc-400 uppercase tracking-widest text-[10px] mt-1 pl-14">Temporal boundary specifications for personnel</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                        Tier 1 Permission Limit (HRS)
                      </Label>
                      <div className="relative group">
                        <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-black transition-colors" />
                        <Input
                          type="number"
                          name="monthlyPermissionHours"
                          value={settings.monthlyPermissionHours}
                          onChange={handleChange}
                          step="0.5"
                          disabled={!isEditing}
                          className="pl-14 h-14 md:h-16 bg-zinc-50 border-zinc-100 rounded-2xl font-black text-zinc-900 text-lg shadow-inner focus-visible:ring-black"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider ml-1">Maximum bandwidth before primary deduction.</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                        Tier 1 LOP Deduction (Percent)
                      </Label>
                      <div className="relative group">
                        <TrendingDown className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-black transition-colors" />
                        <Input
                          type="number"
                          name="permissionTier1Deduction"
                          value={settings.permissionTier1Deduction}
                          onChange={handleChange}
                          step="0.1"
                          disabled={!isEditing}
                          className="pl-14 h-14 md:h-16 bg-zinc-50 border-zinc-100 rounded-2xl font-black text-zinc-900 text-lg shadow-inner focus-visible:ring-black"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider ml-1">Compensational reduction upon limit violation.</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                        Tier 2 Permission Ceiling (HRS)
                      </Label>
                      <div className="relative group">
                        <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-black transition-colors" />
                        <Input
                          type="number"
                          name="permissionTier2Limit"
                          value={settings.permissionTier2Limit}
                          onChange={handleChange}
                          step="0.5"
                          disabled={!isEditing}
                          className="pl-14 h-14 md:h-16 bg-zinc-50 border-zinc-100 rounded-2xl font-black text-zinc-900 text-lg shadow-inner focus-visible:ring-black"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider ml-1">Secondary threshold for critical violations.</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                        Tier 2 Critical Deduction (Days)
                      </Label>
                      <div className="relative group">
                        <TrendingDown className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-black transition-colors" />
                        <Input
                          type="number"
                          name="permissionTier2Deduction"
                          value={settings.permissionTier2Deduction}
                          onChange={handleChange}
                          step="0.1"
                          disabled={!isEditing}
                          className="pl-14 h-14 md:h-16 bg-zinc-50 border-zinc-100 rounded-2xl font-black text-zinc-900 text-lg shadow-inner focus-visible:ring-black"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider ml-1">Severe unit reduction for Tier 2 violations.</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                        Casual Privilege Limit
                      </Label>
                      <div className="relative group">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-black transition-colors" />
                        <Input
                          type="number"
                          name="casualLeaveLimit"
                          value={settings.casualLeaveLimit}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="pl-14 h-14 md:h-16 bg-zinc-50 border-zinc-100 rounded-2xl font-black text-zinc-900 text-lg shadow-inner focus-visible:ring-black"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider ml-1">Allocated monthly leave authorization units.</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                        Base Operational Cycle (Days)
                      </Label>
                      <div className="relative group">
                        <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-black transition-colors" />
                        <Input
                          type="number"
                          name="monthlyWorkingDays"
                          value={settings.monthlyWorkingDays}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="pl-14 h-14 md:h-16 bg-zinc-50 border-zinc-100 rounded-2xl font-black text-zinc-900 text-lg shadow-inner focus-visible:ring-black"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider ml-1">Standardized divisor for per-unit salary computation.</p>
                    </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-6 md:p-10 pb-6 border-b border-zinc-50 bg-zinc-50/30">
                <CardTitle className="text-2xl font-bold flex items-center gap-4 text-zinc-900 tracking-tight">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-5 h-5 text-[#fffe01]" />
                  </div>
                  Cycle Modification
                </CardTitle>
                <CardDescription className="font-bold text-zinc-400 uppercase tracking-widest text-[10px] mt-1 pl-14">Weekend operational status protocol</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10">
                <div className="space-y-6">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                    Saturday Protocol Definition
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { id: 'holiday', label: 'Operational Rest', icon: Home, desc: 'Zero engagement cycle' },
                      { id: 'half-day', label: 'Partial Deployment', icon: Clock, desc: '0.5 operational shift' },
                      { id: 'full-day', label: 'Full Deployment', icon: Calendar, desc: 'Standard shift protocol' }
                    ].map((rule) => (
                      <div 
                        key={rule.id}
                        onClick={() => isEditing && setSettings({ ...settings, saturdayRule: rule.id })}
                        className={`relative p-8 rounded-[2rem] border-2 transition-all cursor-pointer group flex flex-col items-center text-center gap-4 ${
                          settings.saturdayRule === rule.id 
                            ? 'border-black bg-zinc-900 text-white shadow-2xl -translate-y-2' 
                            : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-300 text-zinc-800'
                        } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <div className={`p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110 ${
                          settings.saturdayRule === rule.id ? 'bg-[#fffe01] text-black' : 'bg-white text-zinc-400'
                        }`}>
                          <rule.icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <span className={`font-black uppercase tracking-wider text-xs transition-colors`}>
                            {rule.label}
                          </span>
                          <p className={`text-[10px] font-bold uppercase transition-colors ${
                            settings.saturdayRule === rule.id ? 'text-zinc-500' : 'text-zinc-400'
                          }`}>{rule.desc}</p>
                        </div>
                        {settings.saturdayRule === rule.id && (
                          <div className="absolute top-4 right-4 text-[#fffe01]">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-6 md:p-10 pb-6 border-b border-zinc-50 bg-zinc-50/30">
                <CardTitle className="text-2xl font-bold flex items-center gap-4 text-zinc-900 tracking-tight">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-5 h-5 text-[#fffe01]" />
                  </div>
                  Coefficient Mapping
                </CardTitle>
                <CardDescription className="font-bold text-zinc-400 uppercase tracking-widest text-[10px] mt-1 pl-14">Algorithmic multipliers for financial synthesis</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      Partial Day Coefficient
                    </Label>
                    <div className="relative group">
                      <TrendingDown className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-black transition-colors" />
                      <Input
                        type="number"
                        name="halfDaySalaryRateLimit"
                        value={settings.halfDaySalaryRateLimit}
                        onChange={handleChange}
                        step="0.01"
                        disabled={!isEditing}
                        className="pl-14 h-14 md:h-16 bg-zinc-50 border-zinc-100 rounded-2xl font-black text-zinc-900 text-lg shadow-inner focus-visible:ring-black"
                      />
                    </div>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider ml-1">Multiplier for partial operational cycles.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      Full Cycle Coefficient
                    </Label>
                    <div className="relative group">
                      <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-black transition-colors" />
                      <Input
                        type="number"
                        name="fullDaySalaryRateLimit"
                        value={settings.fullDaySalaryRateLimit}
                        onChange={handleChange}
                        step="0.01"
                        disabled={!isEditing}
                        className="pl-14 h-14 md:h-16 bg-zinc-50 border-zinc-100 rounded-2xl font-black text-zinc-900 text-lg shadow-inner focus-visible:ring-black"
                      />
                    </div>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider ml-1">Denominator multiplier for standard deployment.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isEditing && (
              <Button 
                type="submit" 
                disabled={saveLoading}
                className="w-full h-16 md:h-20 bg-black hover:bg-zinc-800 text-[#fffe01] rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-zinc-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-bottom-8 duration-700 flex items-center justify-center gap-4"
              >
                {saveLoading ? (
                  <Loader size="md" color="white" />
                ) : (
                  <Save className="w-6 h-6" />
                )}
                {saveLoading ? 'ARCHIVING...' : 'Sync Global Architecture'}
              </Button>
            )}
          </form>
        </div>

        <div className="space-y-8">
          <Card className="border-0 shadow-2xl shadow-zinc-900/20 rounded-[2.5rem] bg-zinc-900 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#fffe01]/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-[#fffe01]/20 transition-all duration-1000"></div>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-4 text-xl font-black uppercase tracking-tight">
                <AlertCircle className="w-6 h-6 text-[#fffe01]" />
                Critical Directive
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
                Modifications to these parameters will immediately refactor <strong>all cross-system payroll computations</strong> for future operational cycles.
              </p>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  Mathematical integrity is paramount. Multiplier errors may cause critical financial disbursement anomalies.
                </p>
              </div>
            </CardContent>
          </Card>

          {message.text && (
            <div className={`p-8 rounded-[2.5rem] flex items-center gap-5 transition-all animate-in slide-in-from-top-6 shadow-xl ${
              message.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-[#d30614] text-white shadow-[#d30614]/20'
            }`}>
              <div className="bg-white/20 p-3 rounded-2xl">
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Status Notification</p>
                <p className="font-black uppercase tracking-tight text-lg leading-tight">{message.text}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollSettings;

