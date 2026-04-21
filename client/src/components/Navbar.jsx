import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Search, LayoutGrid, Users2, UserCheck2, Banknote, Settings2, ChevronRight, FileText, Menu, CalendarDays, CalendarCheck2, ShieldCheck, MessageSquareWarning, Trash2, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import socket from '@/services/socket';

import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const Navbar = ({ user, setUser, isSidebarCollapsed, isMobile, setIsSidebarCollapsed }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, isUnread: false });

  useEffect(() => {
    socket.on('notification', (data) => {
      if (data.type === 'work_off') {
        toast({
          title: "System Update",
          description: data.message,
          className: "bg-black text-white border-none rounded-xl shadow-2xl"
        });
        fetchNotifUnread();
      }
      
      const currentUserId = sessionStorage.getItem('userId') || (user?.id);
      if (data.userId === currentUserId) {
        toast({
          title: "New Alert",
          description: data.message,
          className: "bg-black text-[#fffe01] border-none rounded-xl shadow-2xl"
        });
        fetchNotifUnread();
      }
    });

    fetchNotifUnread();

    if (user?.role?.name === 'admin' || user?.role?.name === 'subadmin') {
      fetchUnreadCount();
      socket.on('new_request', () => fetchUnreadCount());
      socket.on('requests_read', () => setUnreadCount(0));
    }

    return () => {
      socket.off('notification');
      if (user?.role?.name === 'admin' || user?.role?.name === 'subadmin') {
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
      console.error("Error:", err);
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
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {}, {
        headers: { 'x-auth-token': token }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setNotifUnread(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleDeleteNotification = async (id, isUnread) => {
    setConfirmDelete({ isOpen: true, id, isUnread });
  };

  const confirmDeleteAction = async () => {
    const { id, isUnread } = confirmDelete;
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/notifications/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (isUnread) {
        setNotifUnread(prev => Math.max(0, prev - 1));
      }
      setConfirmDelete({ isOpen: false, id: null, isUnread: false });
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {}, {
        headers: { 'x-auth-token': token }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setNotifUnread(0);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications) fetchNotifications();
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
      console.error("Error:", err);
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
    { name: 'Review', path: '/admin/permissions', icon: ShieldCheck },
    { name: 'Calendar', path: '/admin/leave-calendar', icon: CalendarDays },
    { name: 'Payroll', path: '/admin/payroll', icon: Banknote },
    { name: 'Settings', path: '/admin/settings', icon: Settings2 }
  ];

  const employeeLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { name: 'Attendance', path: '/dashboard/logs', icon: CalendarCheck2 },
    { name: 'Earnings', path: '/dashboard/earnings', icon: Banknote },
    { name: 'Review', path: '/dashboard/permissions', icon: ShieldCheck }
  ];

  const links = ['admin', 'subadmin'].includes(user?.role?.name) ? adminLinks : employeeLinks;
  const filteredLinks = links.filter(link => link.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleNavigate = (path) => {
    navigate(path);
    setSearchTerm('');
    setIsOpen(false);
  };

  const [showSearch, setShowSearch] = useState(false);

  return (
    <nav className="h-16 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-4 flex-1">
        {(isMobile || showSearch) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (showSearch) {
                setShowSearch(false);
                setSearchTerm('');
              } else {
                setIsSidebarCollapsed(!isSidebarCollapsed);
              }
            }}
            className="text-slate-500 hover:bg-slate-50 rounded-lg"
          >
            {showSearch ? <ChevronRight className="w-5 h-5 rotate-180" /> : <Menu className="w-5 h-5" />}
          </Button>
        )}

        <div className={`relative w-full max-w-sm ${showSearch ? 'block' : 'hidden sm:block'}`}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search platform..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="bg-slate-50 border-slate-100 pl-10 h-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#fffe01] transition-all rounded-lg select-none"
            />
          </div>

          {isOpen && searchTerm && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                {filteredLinks.length > 0 ? (
                  <div className="p-1.5">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Navigation</p>
                    {filteredLinks.map((link, i) => (
                      <button
                        key={i}
                        onClick={() => handleNavigate(link.path)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <link.icon className="w-4 h-4 text-slate-400 group-hover:text-[#fffe01]" />
                          <span className="text-xs font-semibold">{link.name}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">No results found</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`flex items-center gap-2 md:gap-3 ${showSearch ? 'hidden' : 'flex'}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSearch(true)}
          className="text-slate-500 hover:bg-slate-50 sm:hidden rounded-lg"
        >
          <Search className="w-5 h-5" />
        </Button>

        {(['admin', 'subadmin'].includes(user?.role?.name)) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/permissions')}
            className="text-slate-500 hover:bg-slate-50 relative rounded-lg"
          >
            <ShieldCheck className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-[#fffe01] rounded-full border-2 border-white text-[7px] font-bold text-black flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </Button>
        )}

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNotifications}
            className="text-slate-500 hover:bg-slate-50 relative rounded-lg"
          >
            <Bell className="w-5 h-5" />
            {notifUnread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-[#fffe01] rounded-full border-2 border-white text-[7px] font-bold text-black flex items-center justify-center shadow-sm">
                {notifUnread}
              </span>
            )}
          </Button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute top-full right-0 mt-2 w-[85vw] sm:w-80 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Security Notifications</h3>
                  <Badge variant="secondary" className="text-[9px] font-bold bg-[#fffe01] text-black px-1.5 py-0 rounded">{notifUnread} NEW</Badge>
                </div>
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {notifLoading ? (
                    <div className="p-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Gathering stream...</div>
                  ) : notifications.length > 0 ? (
                    notifications.map((n, i) => (
                      <div key={i} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group/notif ${!n.isRead ? 'bg-[#fffe01]/10' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-[#fffe01]' : 'bg-slate-200'}`}></div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold text-slate-900 leading-tight">{n.title}</p>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{n.message}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase pt-1 tracking-tighter">{format(new Date(n.createdAt), 'MMM dd, HH:mm')}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 opacity-0 group-hover/notif:opacity-100 transition-opacity">
                            {!n.isRead && (
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n._id); }}
                                 className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                 title="Mark as read"
                               >
                                 <CheckCheck className="w-3.5 h-3.5" />
                               </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n._id, !n.isRead); }}
                              className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active notifications</div>
                  )}
                </div>
                <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-2">
                   <button 
                     onClick={handleMarkAllRead} 
                     className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.2em] hover:bg-emerald-50 px-4 py-1.5 rounded-full transition-all"
                   >
                     Clear All Read
                   </button>
                   <button 
                     onClick={() => navigate((['admin', 'subadmin'].includes(user?.role?.name)) ? '/admin' : '/dashboard')} 
                     className="text-[9px] font-bold text-slate-900 uppercase tracking-[0.2em] hover:bg-[#fffe01] hover:text-black px-4 py-1.5 rounded-full transition-all"
                   >
                     Portal
                   </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
        
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2 font-medium text-xs rounded-lg px-2 sm:px-4 py-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>

      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, isUnread: false })}
        onConfirm={confirmDeleteAction}
        title="Remove Notification"
        description="Are you sure you want to discard this record? This action cannot be reversed."
      />
    </nav>
  );
};

export default Navbar;


