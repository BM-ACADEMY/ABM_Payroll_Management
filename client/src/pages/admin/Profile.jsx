import React, { useState ,useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User,
  Shield, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import axios from 'axios';
import Loader from "@/components/ui/Loader";

const Profile = ({ setUser }) => {
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth`, {
        headers: { 'x-auth-token': token }
      });
      setUserData({
        name: res.data.name || '',
        email: res.data.email || '',
        phoneNumber: res.data.phoneNumber || ''
      });
      // Sync names just in case
      sessionStorage.setItem('userName', res.data.name);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setMessage({ type: 'error', text: 'Failed to load profile data.' });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    // Hard restriction for phoneNumber
    if (name === 'phoneNumber') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length <= 10) {
        setUserData({ ...userData, [name]: numericValue });
      }
      return;
    }

    // Force lowercase for email
    if (name === 'email') {
      setUserData({ ...userData, [name]: value.toLowerCase() });
      return;
    }
    
    setUserData({ ...userData, [name]: value });
  };

  const handlePasswordChangeInput = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    // Email normalization (lowercase)
    const normalizedEmail = userData.email.toLowerCase();
    
    // Phone validation (exactly 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (userData.phoneNumber && !phoneRegex.test(userData.phoneNumber)) {
      setMessage({ type: 'error', text: 'Phone number must be exactly 10 digits.' });
      return;
    }

    setProfileLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        ...userData,
        email: normalizedEmail
      }, {
        headers: { 'x-auth-token': token }
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Update sessionStorage to reflect new name/email
      sessionStorage.setItem('userName', res.data.name);
      
      // Update App state for instant sync
      if (setUser) {
        setUser({
          ...res.data,
          role: res.data.role // res.data already has populated role name
        });
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }

    setPasswordLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { 'x-auth-token': token }
      });
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error("Error updating password:", err);
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader size="md" color="red" />
      </div>
    );
  }

  const userRole = sessionStorage.getItem('userRole') || 'admin';

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-24 bg-background min-h-screen">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-black font-black">
            <div className="w-10 h-10 rounded-2xl bg-[#fffe01] flex items-center justify-center shadow-lg shadow-[#fffe01]/20">
              <User className="w-5 h-5 text-black" />
            </div>
            <span className="text-[10px] tracking-[0.4em] uppercase text-zinc-400">Account Governance</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-gray-900 leading-tight">
            Security <span className="text-[#d30614]">& Profile</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl text-sm md:text-base leading-relaxed text-zinc-400 uppercase tracking-widest text-[10px]">Configure your administrative vector and cryptographic credentials.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-8 space-y-12">
          {/* Identity Info Card */}
          <form onSubmit={handleProfileSubmit} className="space-y-8">
            <Card className="border-0 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] bg-white overflow-hidden group">
              <div className="h-2 bg-black w-1/4 group-hover:w-full transition-all duration-1000"></div>
              <CardHeader className="p-8 md:p-12 pb-6">
                <CardTitle className="text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-4 text-slate-800">
                  <div className="p-3 bg-zinc-50 rounded-2xl group-hover:bg-[#fffe01] group-hover:text-black transition-all">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  Basic Identity
                </CardTitle>
                <CardDescription className="font-bold text-zinc-400 uppercase tracking-widest text-[10px] mt-2">Adjust your public identification parameters.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 md:p-12 pt-0 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      Full Legal Name
                    </Label>
                    <Input
                      type="text"
                      name="name"
                      value={userData.name}
                      onChange={handleProfileChange}
                      required
                      className="h-16 bg-zinc-50 border-2 border-zinc-50 rounded-[1.5rem] font-bold text-zinc-900 px-8 focus:bg-white focus:border-black transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      Phone Coordinate
                    </Label>
                    <Input
                      type="text"
                      name="phoneNumber"
                      value={userData.phoneNumber}
                      onChange={handleProfileChange}
                      maxLength={10}
                      placeholder="10-digit numeric ID"
                      className="h-16 bg-zinc-50 border-2 border-zinc-50 rounded-[1.5rem] font-bold text-zinc-900 px-8 focus:bg-white focus:border-black transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                    Verified Email Index
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleProfileChange}
                    required
                    className="h-16 bg-zinc-50 border-2 border-zinc-50 rounded-[1.5rem] font-bold text-zinc-900 px-8 focus:bg-white focus:border-black transition-all shadow-inner"
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              disabled={profileLoading}
              className="w-full h-20 bg-black hover:bg-zinc-900 text-[#fffe01] rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
              {profileLoading ? (
                <Loader size="md" color="red" />
              ) : (
                <div className="flex items-center gap-3">
                  <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Update Profile Parameters</span>
                </div>
              )}
            </Button>
          </form>

          {/* Security Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-8">
            <Card className="border-0 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] bg-white overflow-hidden group">
              <div className="h-2 bg-[#d30614] w-1/4 group-hover:w-full transition-all duration-1000"></div>
              <CardHeader className="p-8 md:p-12 pb-6">
                <CardTitle className="text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-4 text-slate-800">
                  <div className="p-3 bg-zinc-50 rounded-2xl group-hover:bg-[#d30614] group-hover:text-white transition-all">
                    <Lock className="w-6 h-6" />
                  </div>
                  Cipher Manifest
                </CardTitle>
                <CardDescription className="font-bold text-zinc-400 uppercase tracking-widest text-[10px] mt-2">Adjust your administrative cryptographic keys.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 md:p-12 pt-0 space-y-10">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                    Current Key
                  </Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChangeInput}
                      placeholder="••••••••••••"
                      required
                      className="h-16 bg-zinc-50 border-2 border-zinc-50 rounded-[1.5rem] font-bold text-zinc-900 px-8 pr-16 focus:bg-white focus:border-black transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors p-2 rounded-xl"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      Initialization Vector
                    </Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChangeInput}
                        placeholder="••••••••••••"
                        required
                        className="h-16 bg-zinc-50 border-2 border-zinc-50 rounded-[1.5rem] font-bold text-zinc-900 px-8 pr-16 focus:bg-white focus:border-black transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors p-2 rounded-xl"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      Verify Vector
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChangeInput}
                        placeholder="••••••••••••"
                        required
                        className="h-16 bg-zinc-50 border-2 border-zinc-50 rounded-[1.5rem] font-bold text-zinc-900 px-8 pr-16 focus:bg-white focus:border-black transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors p-2 rounded-xl"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              disabled={passwordLoading}
              className="w-full h-20 bg-zinc-900 hover:bg-black text-[#fffe01] rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
              {passwordLoading ? (
                <Loader size="md" color="red" />
              ) : (
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Seal New Cryptographic Key</span>
                </div>
              )}
            </Button>
          </form>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* Status Card */}
          <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-zinc-900 text-[#fffe01] overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#fffe01]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
            <CardHeader className="p-8 pb-4 relative z-10">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-[#fffe01]/60">
                <Shield className="w-4 h-4 text-[#fffe01]" />
                Operational Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-white/10 flex items-center justify-center text-3xl font-black border-4 border-white/5 shadow-2xl">
                  {userData.name.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="text-xl font-black tracking-tight">{userData.name || 'Administrator'}</p>
                  <Badge className="mt-2 bg-[#fffe01] text-black hover:bg-[#fffe01] font-black uppercase tracking-widest text-[8px] px-3 py-1 rounded-lg">{userRole}</Badge>
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-[1.5rem] border border-white/5 space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                  <span>Last Synchronization</span>
                  <span>Encryption State</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold font-mono">20 APR 2026</span>
                  <span className="text-[10px] font-black tracking-widest text-emerald-400 flex items-center gap-2 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    AES-256 ACTIVE
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {message.text && (
            <div className={`p-8 rounded-[2.5rem] flex items-start gap-5 transition-all animate-in slide-in-from-top-6 shadow-2xl ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-100/50' 
                : 'bg-rose-50 text-rose-800 border-2 border-rose-100/50'
            }`}>
              <div className={`p-3 rounded-2xl ${message.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">System Notification</p>
                <p className="text-sm font-black leading-relaxed">{message.text}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

