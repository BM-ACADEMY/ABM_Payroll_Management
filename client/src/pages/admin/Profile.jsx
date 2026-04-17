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
    <div className="p-8 space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-black font-medium mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs tracking-widest uppercase">Account Settings</span>
          </div>
          <h1 className="text-4xl font-medium tracking-tight text-gray-900">
            Admin <span className="text-[#d30614]">Profile</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage your personal security and administrative identity.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Identity Info Card */}
          <form onSubmit={handleProfileSubmit} className="space-y-8">
            <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-black" />
                  Basic Information
                </CardTitle>
                <CardDescription className="font-medium">Update your public profile details.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                      Full Name
                    </Label>
                    <Input
                      type="text"
                      name="name"
                      value={userData.name}
                      onChange={handleProfileChange}
                      required
                      className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 px-6"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                      Phone Number
                    </Label>
                    <Input
                      type="text"
                      name="phoneNumber"
                      value={userData.phoneNumber}
                      onChange={handleProfileChange}
                      maxLength={10}
                      placeholder="10-digit phone number"
                      className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 px-6"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleProfileChange}
                    required
                    className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 px-6"
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              disabled={profileLoading}
              className="w-full h-16 bg-black hover:bg-zinc-900 text-[#fffe01] rounded-[1.5rem] font-medium text-lg shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {profileLoading ? (
                <Loader size="md" color="red" />
              ) : (
                <Save className="w-6 h-6 mr-2" />
              )}
              Update Profile Details
            </Button>
          </form>

          {/* Security Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-8">
            <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-slate-800">
                  <Lock className="w-5 h-5 text-black" />
                  Security & Password
                </CardTitle>
                <CardDescription className="font-medium">Update your administrative credentials here.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChangeInput}
                        placeholder="••••••••"
                        required
                        className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 px-6 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors duration-200 focus:outline-none p-1 rounded-md"
                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                        New Password
                      </Label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChangeInput}
                            placeholder="••••••••"
                            required
                            className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 px-6 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors duration-200 focus:outline-none p-1 rounded-md"
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">
                        Confirm New Password
                      </Label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChangeInput}
                            placeholder="••••••••"
                            required
                            className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-700 px-6 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors duration-200 focus:outline-none p-1 rounded-md"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              disabled={passwordLoading}
              className="w-full h-16 bg-slate-900 hover:bg-black text-[#fffe01] rounded-[1.5rem] font-medium text-lg shadow-xl shadow-slate-100 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {passwordLoading ? (
                <Loader size="md" color="red" />
              ) : (
                <Save className="w-6 h-6 mr-2" />
              )}
              Save New Password
            </Button>
          </form>
        </div>

        <div className="space-y-8">
          {/* Status Card */}
          <Card className="border-0 shadow-lg rounded-[2rem] bg-black text-[#fffe01] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#fffe01]" />
                SYSTEM STATUS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-medium">
                  {userData.name.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-medium">{userData.name || 'Administrator'}</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">{userRole}</p>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between text-[10px] font-medium uppercase tracking-widest opacity-60">
                  <span>Last Updated</span>
                  <span>IP Security</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span>Today</span>
                  <span className="text-emerald-400 tracking-tighter flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ENCRYPTED
                  </span>
                </div>
              </div>
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

export default Profile;

