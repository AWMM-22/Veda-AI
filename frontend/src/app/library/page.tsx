'use client';

import Link from 'next/link';
import AppSidebar from '@/components/AppSidebar';
import { useStore } from '@/store/useStore';
import { BookOpen, Plus, Bookmark, FileText, GraduationCap } from 'lucide-react';

const libraryCards = [
  {
    title: 'Saved papers',
    description: 'Store frequently used question papers for quick reuse.',
    icon: Bookmark,
  },
  {
    title: 'Reference notes',
    description: 'Keep notes, guides, and syllabus references in one place.',
    icon: FileText,
  },
  {
    title: 'Subject resources',
    description: 'Organize material by subject so teachers can find things faster.',
    icon: GraduationCap,
  },
];

export default function LibraryPage() {
  const { sidebarOpen } = useStore();

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <AppSidebar />

      <main className={`min-h-screen pt-20 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} lg:pt-4`}>
        <div className="page-container py-3 lg:py-4">
          <div className="panel-soft mb-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-900" />
              Library
            </div>
            <h1 className="page-title">My Library</h1>
            <p className="page-subtitle mt-1">Keep your reusable teaching material and saved papers organized here.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {libraryCards.map((item) => (
              <div key={item.title} className="panel-soft card-hover p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-900/10 bg-slate-50 text-slate-900">
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
                <h2 className="text-base font-semibold text-slate-900">What to add here next</h2>
                <p className="mt-1 text-sm text-slate-500">Add folders, tags, search, and a quick upload area for papers or notes.</p>
              </div>
              <Link href="/assignments/create" className="btn-primary inline-flex items-center gap-2 self-start">
                <Plus size={18} />
                Create Assignment
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}