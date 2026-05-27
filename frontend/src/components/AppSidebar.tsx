'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Users,
  FileText,
  Wand2,
  BookOpen,
  Settings,
  Plus,
  Menu,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useState } from 'react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Users, label: 'My Groups', href: '/groups' },
  { icon: FileText, label: 'Assignments', href: '/assignments' },
  { icon: Trophy, label: 'Ranking', href: '/quizzes' },
  { icon: Wand2, label: "AI Teacher's Toolkit", href: '/toolkit' },
  { icon: BookOpen, label: 'My Library', href: '/library' },
];

const VedaLogo = ({ compact = false }: { compact?: boolean }) => (
  <Image
    src="/purple_veda_logo_black.png"
    alt="Veda logo"
    width={compact ? 56 : 78}
    height={compact ? 15 : 21}
    priority
    className="block h-auto w-auto select-none"
  />
);

export default function AppSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const avatarStyle = {
    background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
  };

  return (
    <>
      <div className="lg:hidden fixed top-3 left-3 right-3 z-50">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-lg">
          <div className="flex items-center gap-2.5">
            <VedaLogo compact />
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <button className="rounded-full p-2 hover:bg-slate-100" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={avatarStyle}>
              JD
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-full p-2 hover:bg-slate-100" aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/35" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-center border-b border-slate-200 px-3 py-3">
          <VedaLogo />
        </div>

        <div className="px-3 pt-3 pb-2">
          <Link
            href="/assignments/create"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-md ring-1 ring-orange-500/70 transition-colors hover:bg-slate-800"
          >
            <Plus size={18} />
            {sidebarOpen && <span>Create Assignment</span>}
          </Link>
        </div>

        <nav className="scrollbar-hidden flex-1 overflow-y-auto space-y-1 px-2 py-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-item ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <item.icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-slate-200 px-2 py-3 pb-4">
          <Link href="/settings" className={`sidebar-item ${!sidebarOpen ? 'justify-center' : ''}`}>
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
          </Link>

          <div className={`mt-1 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={avatarStyle}>
              JD
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">John Doe</p>
                <p className="truncate text-xs text-slate-500">Delhi Public School</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3 top-20 h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>
    </>
  );
}