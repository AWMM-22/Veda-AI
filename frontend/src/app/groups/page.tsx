'use client';

import Link from 'next/link';
import AppSidebar from '@/components/AppSidebar';
import { useStore } from '@/store/useStore';
import { Users, Plus, MessageSquare, CalendarDays, Files, Sparkles } from 'lucide-react';

const groupIdeas = [
  {
    title: 'Create class groups',
    description: 'Organize students by class, section, or subject to keep assignments targeted.',
    icon: Users,
  },
  {
    title: 'Share assignments fast',
    description: 'Push one assignment to several groups without re-creating the paper.',
    icon: Files,
  },
  {
    title: 'Track group progress',
    description: 'See which groups have active assignments, pending reviews, or low completion.',
    icon: CalendarDays,
  },
  {
    title: 'Collaborate with teachers',
    description: 'Keep teacher notes and discussions attached to each class group.',
    icon: MessageSquare,
  },
];

export default function GroupsPage() {
  const { sidebarOpen } = useStore();

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <AppSidebar />

      <main className={`min-h-screen pt-20 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} lg:pt-4`}>
        <div className="page-container py-3 lg:py-4">
          <div className="panel-soft mb-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Groups
            </div>
            <h1 className="page-title">My Groups</h1>
            <p className="page-subtitle mt-1">Set up class groups and route assignments to the right students.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {groupIdeas.map((item) => (
              <div key={item.title} className="panel-soft card-hover p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-900/12 bg-slate-50 text-slate-900">
                  <item.icon size={20} />
                </div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="panel mt-4 px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Suggested next step</h2>
                <p className="mt-1 text-sm text-slate-500">Create a class group, assign a teacher, and attach one assignment.</p>
              </div>
              <Link href="/assignments/create" className="btn-primary inline-flex items-center gap-2 self-start">
                <Plus size={18} />
                Create Assignment
              </Link>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Sparkles size={16} className="text-orange-500" />
            You can extend this page later with real class roster, student counts, and group filters.
          </div>
        </div>
      </main>
    </div>
  );
}