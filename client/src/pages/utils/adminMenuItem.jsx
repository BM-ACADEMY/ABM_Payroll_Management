import { LayoutGrid, Users2, CalendarCheck2, Banknote, Settings2, ShieldCheck, CalendarDays, MessageSquareWarning, Users, Trophy, Kanban, Timer, BarChart3 } from "lucide-react";

export const adminMenuItem = [
  { name: 'Overview', path: '/admin', icon: LayoutGrid, moduleId: 'overview' },
  { name: 'Employees', path: '/admin/employees', icon: Users2, moduleId: 'employees' },
  { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck2, moduleId: 'attendance' },
  { name: 'Permissions', path: '/admin/permissions', icon: ShieldCheck, moduleId: 'permissions' },
  { name: 'Leave Calendar', path: '/admin/leave-calendar', icon: CalendarDays, moduleId: 'leaves' },
  { name: 'Payroll', path: '/admin/payroll', icon: Banknote, moduleId: 'payroll' },
  { name: 'Complaints', path: '/admin/complaints', icon: MessageSquareWarning, moduleId: 'complaints' },
  { name: 'Teams', path: '/admin/teams', icon: Users, moduleId: 'teams' },
  { name: 'Weekly Credits', path: '/admin/weekly-credits', icon: Trophy, moduleId: 'credits' },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3, moduleId: 'analytics' },
  { name: 'Daily Board', path: '/admin/kanban/special/daily', icon: LayoutGrid, end: true, moduleId: 'kanban' },
  { name: 'Weekly Board', path: '/admin/kanban/special/weekly', icon: CalendarDays, end: true, moduleId: 'kanban' },
  { name: 'Upcoming Projects', path: '/admin/kanban', icon: Kanban, end: true, moduleId: 'kanban' },
  { name: 'Time Tracker', path: '/admin/time-history', icon: Timer, moduleId: 'time_history' },
  { name: 'Settings', path: '/admin/settings', icon: Settings2, moduleId: 'settings' }
];
