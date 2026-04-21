import { LayoutGrid, CalendarCheck2, Settings2, CalendarDays, ShieldCheck, MessageSquareWarning, Kanban, Timer, Trophy } from "lucide-react";

export const employeeMenuItem = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
  { name: 'Attendance', path: '/dashboard/logs', icon: CalendarCheck2 },
  { name: 'Performance Credits', path: '/dashboard/performance-history', icon: Trophy },
  { name: 'Weekly Board', path: '/dashboard/kanban/special/weekly', icon: CalendarDays, end: true },
  { name: 'Upcoming Projects', path: '/dashboard/kanban', icon: Kanban, end: true },
  { name: 'Time Tracker', path: '/dashboard/time-history', icon: Timer },
  { name: 'Leave Request', path: '/dashboard/leave', icon: CalendarDays },
  { name: 'Permissions', path: '/dashboard/permissions', icon: ShieldCheck },
  { name: 'Complaints', path: '/dashboard/complaints', icon: MessageSquareWarning }
];
