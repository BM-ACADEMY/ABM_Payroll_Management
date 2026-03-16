import React from 'react';
import { NavLink } from 'react-router-dom';
import { PieChart, ChevronRight, ChevronLeft } from "lucide-react";
import { adminMenuItem } from '../pages/utils/adminMenuItem';
import { employeeMenuItem } from '../pages/utils/employeeMenuItem';

const Sidebar = ({ user, isMobile, isCollapsed, setIsCollapsed }) => {
  const links = user?.role?.name === 'admin' ? adminMenuItem : employeeMenuItem;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out bg-indigo-950 border-r border-indigo-900 z-50 flex flex-col p-4 shadow-2xl ${isMobile
            ? (isCollapsed ? '-translate-x-full w-64' : 'translate-x-0 w-64')
            : (isCollapsed ? 'w-20' : 'w-64')
          }`}
      >
        <div className="flex items-center justify-between mb-10 px-2 mt-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            {(!isCollapsed || isMobile) && (
              <span className="text-xl font-bold tracking-tighter text-white whitespace-nowrap animate-in fade-in duration-500">
                PAYROLL.IO
              </span>
            )}
          </div>
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`absolute -right-3 top-20 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-indigo-950 hover:bg-indigo-500 transition-colors shadow-lg`}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {links.map((link, i) => (
            <NavLink
              key={i}
              to={link.path}
              end={link.path === '/admin' || link.path === '/dashboard'}
              className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-200/70 hover:bg-indigo-900/50 hover:text-white'}
              ${isCollapsed ? 'justify-center px-0' : ''}
            `}
              title={isCollapsed ? link.name : ''}
            >
              <link.icon className={`w-5 h-5 shrink-0 ${isCollapsed ? 'm-0' : ''}`} />
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  {link.name}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-indigo-900/50">
          <div className={`flex items-center gap-3 text-indigo-200 ${isCollapsed ? 'justify-center' : 'px-4 py-3'}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-bold text-white shadow-inner shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden animate-in fade-in duration-500">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-indigo-300/80 capitalize truncate">{user?.role?.name || ''}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
