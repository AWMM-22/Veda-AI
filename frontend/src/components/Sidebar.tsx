'use client';

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
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useState } from 'react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Users, label: 'My Groups', href: '/groups' },
  { icon: FileText, label: 'Assignments', href: '/assignments' },
  { icon: Wand2, label: "AI Teacher's Toolkit", href: '/toolkit' },
  { icon: BookOpen, label: 'My Library', href: '/library' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoStyle = {
    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
  };

  const accentStyle = {
    background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
  };

  return (
    <>
      <div className="lg:hidden fixed top-3 left-3 right-3 z-50">
        <div className="flex items-center justify-between rounded-[1.15rem] border border-white/80 bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm" style={logoStyle}>
              <span className="text-sm font-bold">V</span>
            </div>
            <span className="font-semibold tracking-[-0.02em] text-slate-900">VedaAI</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <button className="rounded-full p-2 transition-colors hover:bg-slate-100" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm" style={accentStyle}>
              JD
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-full p-2 transition-colors hover:bg-slate-100"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200/90 bg-white/92 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-[5.75rem]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/80 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)]" style={logoStyle}>
            <span className="font-bold tracking-tight">V</span>
          </div>
          {sidebarOpen && (
            <div>
              <span className="block text-lg font-semibold tracking-[-0.03em] text-slate-900">VedaAI</span>
              <span className="-mt-0.5 block text-[11px] text-slate-500">Assessment Studio</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <Link
            href="/assignments/create"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3.5 text-sm font-medium text-white shadow-[0_14px_24px_rgba(15,23,42,0.18)] ring-1 ring-orange-500/70 transition-all duration-200 active:scale-95 hover:bg-slate-800"
          >
            <Plus size={18} />
            {sidebarOpen && <span>Create Assignment</span>}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
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
                {sidebarOpen && <span className="tracking-[-0.01em]">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-slate-200/80 p-3">
          <Link href="/settings" className={`sidebar-item ${!sidebarOpen ? 'justify-center' : ''}`}>
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
          </Link>

          <div className={`flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm" style={accentStyle}>
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
          className="absolute -right-3 top-20 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-slate-900 lg:flex"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>
    </>
  );
}
