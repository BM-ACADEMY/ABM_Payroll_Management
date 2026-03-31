import { LayoutGrid, Users2, CalendarCheck2, Banknote, Settings2, ShieldCheck, CalendarDays, MessageSquareWarning, Users, Trophy, Kanban, Timer } from "lucide-react";

export const adminMenuItem = [
  { name: 'Overview', path: '/admin', icon: LayoutGrid },
  { name: 'Employees', path: '/admin/employees', icon: Users2 },
  { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck2 },
  { name: 'Permissions', path: '/admin/permissions', icon: ShieldCheck },
  { name: 'Leave Calendar', path: '/admin/leave-calendar', icon: CalendarDays },
  { name: 'Payroll', path: '/admin/payroll', icon: Banknote },
  { name: 'Complaints', path: '/admin/complaints', icon: MessageSquareWarning },
  { name: 'Teams', path: '/admin/teams', icon: Users },
  { name: 'Weekly Credits', path: '/admin/weekly-credits', icon: Trophy },
  { name: 'Boards', path: '/admin/kanban', icon: Kanban },
  { name: 'Time Tracker', path: '/admin/time-history', icon: Timer },
  { name: 'Settings', path: '/admin/settings', icon: Settings2 }
];
