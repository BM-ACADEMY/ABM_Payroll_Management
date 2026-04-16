import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Search, LayoutGrid, Users2, UserCheck2, Banknote, Settings2, ChevronRight, FileText, Menu, CalendarDays, CalendarCheck2, ShieldCheck, MessageSquareWarning } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import socket from '@/services/socket';

import { useToast } from "@/hooks/use-toast";

const Navbar = ({ user, setUser, isSidebarCollapsed, isMobile, setIsSidebarCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);

  useEffect(() => {
    // Socket handled via shared service
    socket.on('notification', (data) => {
      // 1. Common system notifications (like work off)
      if (data.type === 'work_off') {
        toast({
          title: "Important Update",
          description: data.message,
          variant: "default",
          className: "bg-black text-[#fffe01] border-none rounded-2xl shadow-2xl"
        });
        fetchNotifUnread();
      }
      
      // 2. Direct notifications (like mentions)
      const currentUserId = sessionStorage.getItem('userId') || (user?.id);
      if (data.userId === currentUserId) {
        toast({
          title: "New Alert",
          description: data.message,
          variant: "default",
          className: "bg-black text-[#fffe01] border-none rounded-2xl shadow-2xl"
        });
        fetchNotifUnread();
      }
    });

    fetchNotifUnread();

    if (user?.role?.name === 'admin') {
      fetchUnreadCount();

      socket.on('new_request', () => {
        fetchUnreadCount();
      });

      socket.on('requests_read', () => {
        setUnreadCount(0);
      });
    }

    return () => {
      socket.off('notification');
      if (user?.role?.name === 'admin') {
        socket.off('new_request');
        socket.off('requests_read');
      }
    };
  }, [user, toast]);

  const fetchNotifUnread = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications/unread-count`, {
        headers: { 'x-auth-token': token }
      });
      setNotifUnread(res.data.count);
    } catch (err) {
      console.error("Error fetching notif unread:", err);
    }
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { 'x-auth-token': token }
      });
      setNotifications(res.data);
      if (showNotifications) {
        // Mark all as read when opening if they hasn't been already
        await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {}, {
          headers: { 'x-auth-token': token }
        });
        setNotifUnread(0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setNotifLoading(false);
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const fetchUnreadCount = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/requests/unread-count`, {
        headers: { 'x-auth-token': token }
      });
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const adminLinks = [
    { name: 'Overview', path: '/admin', icon: LayoutGrid },
    { name: 'Employees', path: '/admin/employees', icon: Users2 },
    { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck2 },
    { name: 'Permission Review', path: '/admin/permissions', icon: ShieldCheck },
    { name: 'Leave Calendar', path: '/admin/leave-calendar', icon: CalendarDays },
    { name: 'Payroll', path: '/admin/payroll', icon: Banknote },
    { name: 'Settings', path: '/admin/settings', icon: Settings2 }
  ];

  const employeeLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { name: 'Attendance Logs', path: '/dashboard/logs', icon: CalendarCheck2 },
    { name: 'Earnings', path: '/dashboard/earnings', icon: Banknote },
    { name: 'Permissions', path: '/dashboard/permissions', icon: ShieldCheck }
  ];

  const links = user?.role?.name === 'admin' ? adminLinks : employeeLinks;

  const filteredLinks = links.filter(link =>
    link.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNavigate = (path) => {
    navigate(path);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <nav
      className="h-16 border-b border-gray-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-all duration-300 ease-in-out"
    >
      <div className="flex items-center gap-4 flex-1">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-gray-500 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </Button>
        )}

        <div className="relative w-full max-w-md hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
            <Input
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="bg-gray-50 border-gray-200 pl-10 h-10 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-black transition-all shadow-sm w-full rounded-xl"
            />
          </div>

          {isOpen && searchTerm && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {filteredLinks.length > 0 ? (
                  <div className="p-2">
                    <p className="px-3 py-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Quick Navigation</p>
                    {filteredLinks.map((link, i) => (
                      <button
                        key={i}
                        onClick={() => handleNavigate(link.path)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-black transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <link.icon className="w-4 h-4 text-gray-400 group-hover:text-black" />
                          <span className="text-sm font-normal">{link.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-400 font-normal">No pages found matching "{searchTerm}"</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user?.role?.name === 'admin' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/permissions')}
            className="text-gray-500 hover:text-black hover:bg-gray-100 relative"
            title="Admin Requests"
          >
            <ShieldCheck className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#fffe01] rounded-full border-2 border-white text-[8px] font-medium text-black flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </Button>
        )}

        {/* User Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNotifications}
            className="text-gray-500 hover:text-black hover:bg-gray-100 relative"
          >
            <Bell className="w-5 h-5" />
            {notifUnread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-black rounded-full border-2 border-white text-[8px] font-medium text-[#fffe01] flex items-center justify-center">
                {notifUnread}
              </span>
            )}
          </Button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-black">Notifications</h3>
                  {notifUnread > 0 && <span className="text-[10px] text-gray-400 font-medium">{notifUnread} New</span>}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifLoading ? (
                    <div className="p-8 text-center text-xs text-gray-400 uppercase tracking-widest animate-pulse">Loading Alerts...</div>
                  ) : notifications.length > 0 ? (
                    notifications.map((n, i) => (
                      <div key={i} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-[#fffe01]/5' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-[#fffe01]' : 'bg-gray-200'}`}></div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-black leading-snug">{n.title}</p>
                            <p className="text-[11px] text-gray-500 font-normal leading-relaxed">{n.message}</p>
                            <p className="text-[9px] text-gray-400 font-normal pt-1">{new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-xs text-gray-400 font-normal">All clear! No alerts.</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                   <button 
                     onClick={() => navigate(user?.role?.name === 'admin' ? '/admin' : '/dashboard')} 
                     className="text-[10px] font-bold text-black uppercase tracking-widest hover:underline"
                   >
                     View Control Center
                   </button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-gray-500 hover:text-black hover:bg-gray-100 flex items-center gap-2 font-normal text-sm rounded-xl px-4 py-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;

