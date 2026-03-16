import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Search, LayoutDashboard, Users, UserCheck, CreditCard, Settings, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const adminLinks = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Attendance', path: '/admin/attendance', icon: UserCheck },
    { name: 'Payroll', path: '/admin/payroll', icon: CreditCard },
    { name: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  const employeeLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Attendance Logs', path: '/dashboard/logs', icon: UserCheck },
    { name: 'Earnings', path: '/dashboard/earnings', icon: CreditCard },
    { name: 'Requests', path: '/dashboard/requests', icon: Settings }
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
    <nav className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between ml-64 transition-all duration-300">
      <div className="relative w-96">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input 
            placeholder="Search pages (Overview, Employees...)" 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="bg-slate-100/50 border-slate-200 pl-10 h-10 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>

        {isOpen && searchTerm && (
          <>
            <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {filteredLinks.length > 0 ? (
                <div className="p-2">
                  <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Navigation</p>
                  {filteredLinks.map((link, i) => (
                    <button
                      key={i}
                      onClick={() => handleNavigate(link.path)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <link.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        <span className="text-sm font-medium">{link.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-500 font-medium">No pages found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white"></span>
        </Button>
        <div className="h-8 w-[1px] bg-slate-200"></div>
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
