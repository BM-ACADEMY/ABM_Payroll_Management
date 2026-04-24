import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from "lucide-react";
import { adminMenuItem } from '../pages/utils/adminMenuItem';
import { employeeMenuItem } from '../pages/utils/employeeMenuItem';
import logo from '../assets/logo.png';

const Sidebar = ({ user, isMobile, isCollapsed, setIsCollapsed }) => {
  const getLinks = () => {
    if (user?.role?.name === 'admin') return adminMenuItem;
    if (user?.role?.name === 'subadmin') {
      const employeeLinks = employeeMenuItem;
      const permittedAdminLinks = adminMenuItem.filter(item => {
        if (item.moduleId === 'overview') return true;
        const perms = user.permissions || user.role?.permissions || [];
        return perms.includes(`${item.moduleId}:read`);
      });

      const combinedLinks = [...employeeLinks];
      permittedAdminLinks.forEach(adminLink => {
        if (!combinedLinks.some(empLink => empLink.path === adminLink.path)) {
          combinedLinks.push(adminLink);
        }
      });
      return combinedLinks;
    }
    return employeeMenuItem;
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] animate-in fade-in duration-500"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen transition-all duration-500 ease-in-out bg-black border-r border-white/5 z-30 flex flex-col p-4 shadow-2xl ${isMobile
            ? (isCollapsed ? '-translate-x-full w-64' : 'translate-x-0 w-64')
            : (isCollapsed ? 'w-20' : 'w-64')
          }`}
      >
        <div className="flex items-center justify-between mb-8 px-2 mt-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`flex items-center justify-center transition-all duration-300 ${isCollapsed && !isMobile ? 'w-12 h-12' : 'w-auto h-12'}`}>
              <img 
                src={logo} 
                alt="Logo" 
                className={`h-full w-auto object-contain transition-all duration-500 ${isCollapsed && !isMobile ? 'scale-125' : ''}`} 
              />
            </div>
          </div>
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`absolute -right-3 top-24 w-6 h-6 bg-[#fffe01] rounded-full flex items-center justify-center text-black border-2 border-black hover:scale-110 transition-all shadow-xl z-20`}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 -mr-2">
          {links.map((link, i) => (
            <NavLink
              key={i}
              to={link.path}
              end={link.end || link.path === '/admin' || link.path === '/dashboard'}
              className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative
              ${isActive
                  ? 'bg-[#fffe01] text-black shadow-lg shadow-[#fffe01]/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'}
              ${isCollapsed ? 'justify-center px-0' : ''}
            `}
              title={isCollapsed ? link.name : ''}
            >
              {({ isActive }) => (
                <>
                  <link.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isCollapsed ? 'm-0' : ''}`} />
                  {!isCollapsed && (
                    <span className="text-[13px] font-semibold tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-500">
                      {link.name}
                    </span>
                  )}
                  {!isActive && !isCollapsed && <div className="absolute right-4 w-1 h-1 rounded-full bg-[#fffe01] opacity-0 group-hover:opacity-100 transition-opacity" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <NavLink 
          to={(['admin', 'subadmin'].includes(user?.role?.name)) ? "/admin/profile" : "/dashboard/profile"}
          className={({ isActive }) => `
            p-3 flex items-center gap-3 rounded-xl transition-all duration-300 group
            ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all bg-white/5 text-[#fffe01] group-hover:bg-[#fffe01] group-hover:text-black shrink-0 shadow-inner`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden animate-in fade-in duration-500">
              <p className="text-xs font-bold truncate text-white leading-none mb-1">{user.name}</p>
              <p className="text-[10px] text-slate-500 capitalize truncate font-medium tracking-wider">{user?.role?.name || 'Authorized'}</p>
            </div>
          )}
        </NavLink>
      </div>
      </aside>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </>
  );
};

export default Sidebar;
