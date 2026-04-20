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
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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
    <div className="p-8 space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-black font-medium mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-xs tracking-widest uppercase">System Config</span>
          </div>
          <h1 className="text-4xl font-medium tracking-tight text-gray-900">
            Payroll <span className="text-[#d30614]">Settings</span>
          </h1>
          <p className="text-gray-500 font-medium">Manage global limits and salary rate calculation rules.</p>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <Button 
              variant="outline" 
              onClick={() => {
                setSettings(originalSettings);
                setIsEditing(false);
              }}
              className="h-14 px-8 rounded-2xl font-medium tracking-widest uppercase text-xs border-2 border-slate-100 hover:bg-slate-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel Changes
            </Button>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)}
              className="h-14 px-8 rounded-2xl font-medium tracking-widest uppercase text-xs bg-black hover:bg-zinc-900 text-[#fffe01] shadow-lg flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit Settings
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-slate-800">
                  <Clock className="w-5 h-5 text-black" />
                  Permission & Leave Limits
                </CardTitle>
                <CardDescription className="font-medium">Define monthly allowances for employees.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                      Monthly Permission Hours (Tier 1)
                    </Label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-black transition-colors" />
                      <Input
                        type="number"
                        name="monthlyPermissionHours"
                        value={settings.monthlyPermissionHours}
                        onChange={handleChange}
                        step="0.5"
                        disabled={!isEditing}
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Maximum allowed permission hours before first deduction.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                      Tier 1 LOP Deduction (Days)
                    </Label>
                    <div className="relative group">
                      <TrendingDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-black transition-colors" />
                      <Input
                        type="number"
                        name="permissionTier1Deduction"
                        value={settings.permissionTier1Deduction}
                        onChange={handleChange}
                        step="0.1"
                        disabled={!isEditing}
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Salary days deducted when Tier 1 limit is exceeded.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                      Tier 2 Permission Limit (Hrs)
                    </Label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-black transition-colors" />
                      <Input
                        type="number"
                        name="permissionTier2Limit"
                        value={settings.permissionTier2Limit}
                        onChange={handleChange}
                        step="0.5"
                        disabled={!isEditing}
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Higher threshold for severe deduction.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                      Tier 2 LOP Deduction (Days)
                    </Label>
                    <div className="relative group">
                      <TrendingDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-black transition-colors" />
                      <Input
                        type="number"
                        name="permissionTier2Deduction"
                        value={settings.permissionTier2Deduction}
                        onChange={handleChange}
                        step="0.1"
                        disabled={!isEditing}
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Salary days deducted when Tier 2 limit is exceeded.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                      Casual Leave Limit
                    </Label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-black transition-colors" />
                      <Input
                        type="number"
                        name="casualLeaveLimit"
                        value={settings.casualLeaveLimit}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Number of casual leaves granted per month.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                      Monthly Working Days
                    </Label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-black transition-colors" />
                      <Input
                        type="number"
                        name="monthlyWorkingDays"
                        value={settings.monthlyWorkingDays}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Fixed days used for per-day salary calculation (e.g., 30).</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-slate-800">
                  <Calendar className="w-5 h-5 text-black" />
                  Weekend Configuration
                </CardTitle>
                <CardDescription className="font-medium">Define how Saturdays are treated in the system.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                    Saturday Work Rule
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'holiday', label: 'Holiday', icon: Home, desc: 'Non-working day' },
                      { id: 'half-day', label: 'Half Day', icon: Clock, desc: '4 hours session' },
                      { id: 'full-day', label: 'Full Day', icon: Calendar, desc: 'Normal working day' }
                    ].map((rule) => (
                      <div 
                        key={rule.id}
                        onClick={() => isEditing && setSettings({ ...settings, saturdayRule: rule.id })}
                        className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
                          settings.saturdayRule === rule.id 
                            ? 'border-black bg-gray-50' 
                            : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                        } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            settings.saturdayRule === rule.id ? 'bg-black text-[#fffe01]' : 'bg-white text-slate-400'
                          }`}>
                            <rule.icon className="w-4 h-4" />
                          </div>
                          <span className={`font-medium transition-colors ${
                            settings.saturdayRule === rule.id ? 'text-black' : 'text-slate-600'
                          }`}>
                            {rule.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{rule.desc}</p>
                        {settings.saturdayRule === rule.id && (
                          <div className="absolute top-4 right-4 text-black">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-slate-800">
                  <TrendingUp className="w-5 h-5 text-black" />
                  Salary Rate Multipliers
                </CardTitle>
                <CardDescription className="font-medium">Configure calculation rules for attendance types.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                      Half-Day Salary Multiplier
                    </Label>
                    <div className="relative group">
                      <TrendingDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-black transition-colors" />
                      <Input
                        type="number"
                        name="halfDaySalaryRateLimit"
                        value={settings.halfDaySalaryRateLimit}
                        onChange={handleChange}
                        step="0.01"
                        disabled={!isEditing}
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Multiplier applied to basic salary for half-days.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                      Full-Day Salary Multiplier
                    </Label>
                    <div className="relative group">
                      <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-black transition-colors" />
                      <Input
                        type="number"
                        name="fullDaySalaryRateLimit"
                        value={settings.fullDaySalaryRateLimit}
                        onChange={handleChange}
                        step="0.01"
                        disabled={!isEditing}
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Default multiplier for regular working days.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isEditing && (
              <Button 
                type="submit" 
                disabled={saveLoading}
                className="w-full h-16 bg-black hover:bg-zinc-900 text-[#fffe01] rounded-[1.5rem] font-medium text-lg shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] animate-in slide-in-from-bottom-4 duration-500"
              >
                {saveLoading ? (
                  <Loader size="md" color="black" />
                ) : (
                  <Save className="w-6 h-6 mr-2" />
                )}
                Save Global Settings
              </Button>
            )}
          </form>
        </div>

        <div className="space-y-8">
          <Card className="border-0 shadow-lg rounded-[2rem] bg-black text-[#fffe01] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Usage Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                Changes made here will affect <strong>all future payroll calculations</strong> across the entire system.
              </p>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                Ensure multipliers are mathematically correct to avoid incorrect salary disbursements.
              </p>
            </CardContent>
          </Card>

          {message.text && (
            <div className={`p-6 rounded-[2rem] flex items-center gap-4 transition-all animate-in slide-in-from-top-4 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 shrink-0" />
              )}
              <p className="font-bold">{message.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollSettings;

