import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Navbar = ({ user, setUser }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <nav className="h-20 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between ml-64 transition-all duration-300">
      <div className="relative w-96 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
        <Input 
          placeholder="Search for employees, logs..." 
          className="bg-slate-900/50 border-slate-800 pl-10 h-10 text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-900 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-950"></span>
        </Button>
        <div className="h-8 w-[1px] bg-slate-900"></div>
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
