import React from 'react';
import { NavLink } from 'react-router-dom';
import { PieChart } from "lucide-react";
import { adminMenuItem } from '../pages/utils/adminMenuItem';
import { employeeMenuItem } from '../pages/utils/employeeMenuItem';

const Sidebar = ({ user }) => {
  const links = user?.role?.name === 'admin' ? adminMenuItem : employeeMenuItem;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-indigo-950 border-r border-indigo-900 z-50 flex flex-col p-6 shadow-xl">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <PieChart className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tighter text-white">PAYROLL.IO</span>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link, i) => (
          <NavLink
            key={i}
            to={link.path}
            end={link.path === '/admin' || link.path === '/dashboard'}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-200/70 hover:bg-indigo-900/50 hover:text-white'}
            `}
          >
            <link.icon className="w-5 h-5" />
            <span className="font-medium">{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-indigo-900/50">
        {user?.role?.name === 'admin' ? (
          <NavLink 
            to="/admin/profile"
            className={({ isActive }) => `
              px-4 py-3 flex items-center gap-3 rounded-xl transition-all duration-200 group
              ${isActive ? 'bg-indigo-600/50 text-white shadow-sm' : 'text-indigo-200 hover:bg-indigo-900/50 hover:text-white'}
            `}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-bold text-white shadow-inner group-hover:bg-indigo-600 transition-colors">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-indigo-300/80 capitalize truncate font-medium">Profile & Security</p>
            </div>
          </NavLink>
        ) : (
          <div className="px-4 py-3 flex items-center gap-3 text-indigo-200 cursor-default">
            <div className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-indigo-300/80 capitalize truncate">{user?.role?.name || ''}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
