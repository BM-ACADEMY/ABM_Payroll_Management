import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from "lucide-react";
import { adminMenuItem } from '../pages/utils/adminMenuItem';
import { employeeMenuItem } from '../pages/utils/employeeMenuItem';
import logo from '../assets/logo.png';

const Sidebar = ({ user, isMobile, isCollapsed, setIsCollapsed }) => {
  const links = user?.role?.name === 'admin' ? adminMenuItem : employeeMenuItem;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out bg-black border-r border-zinc-800 z-50 flex flex-col p-4 shadow-sm ${isMobile
            ? (isCollapsed ? '-translate-x-full w-64' : 'translate-x-0 w-64')
            : (isCollapsed ? 'w-20' : 'w-64')
          }`}
      >
        <div className="flex items-center justify-between mb-10 px-2 mt-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`flex items-center justify-center transition-all duration-300 ${isCollapsed && !isMobile ? 'w-12 h-12' : 'w-auto h-10'}`}>
              <img 
                src={logo} 
                alt="Logo" 
                className={`h-full w-auto object-contain transition-all duration-300 ${isCollapsed && !isMobile ? 'scale-110' : ''}`} 
              />
            </div>
          </div>
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`absolute -right-3 top-20 w-6 h-6 bg-[#fffe01] rounded-full flex items-center justify-center text-black border-2 border-black hover:bg-yellow-400 transition-colors shadow-md`}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 -mr-2">
          {links.map((link, i) => (
            <NavLink
              key={i}
              to={link.path}
              end={link.path === '/admin' || link.path === '/dashboard'}
              className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive
                  ? 'bg-[#fffe01] text-black shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-[#fffe01]'}
              ${isCollapsed ? 'justify-center px-0' : ''}
            `}
              title={isCollapsed ? link.name : ''}
            >
              <link.icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isCollapsed ? 'm-0' : ''}`} />
              {!isCollapsed && (
                <span className="font-normal tracking-wide whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  {link.name}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

      <div className="mt-auto pt-6 border-t border-zinc-800">
        {user?.role?.name === 'admin' ? (
          <NavLink 
            to="/admin/profile"
            className={({ isActive }) => `
              px-4 py-3 flex items-center gap-3 rounded-xl transition-all duration-200 group
              ${isActive ? 'bg-[#fffe01]/10 text-[#fffe01]' : 'text-zinc-400 hover:bg-zinc-800 hover:text-[#fffe01]'}
            `}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shadow-inner transition-colors bg-zinc-800 text-[#fffe01] group-hover:bg-zinc-700`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-normal truncate text-[#fffe01]">{user.name}</p>
              <p className="text-xs text-zinc-500 capitalize truncate font-normal">Profile & Security</p>
            </div>
          </NavLink>
        ) : (
          <div className="px-4 py-3 flex items-center gap-3 text-zinc-400 cursor-default">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-[#fffe01] shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-normal text-[#fffe01] truncate">{user.name}</p>
              <p className="text-xs text-zinc-500 capitalize truncate">{user?.role?.name || ''}</p>
            </div>
          </div>
        )}
      </div>
      </aside>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
