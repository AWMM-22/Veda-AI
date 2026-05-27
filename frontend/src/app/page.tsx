'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, FileText, Loader2, Wand2 } from 'lucide-react';

import AppSidebar from '@/components/AppSidebar';
import api from '@/lib/api';
import { useStore } from '@/store/useStore';
import { Assignment } from '@/types';

type StatCard = {
  label: string;
  value: number;
  icon: typeof FileText;
  color: string;
};

const safeDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildStats = (assignments: Assignment[]): StatCard[] => {
  const totalAssignments = assignments.length;
  const completed = assignments.filter((assignment) => assignment.status === 'completed').length;
  const pending = assignments.filter((assignment) => assignment.status === 'pending').length;
  const processing = assignments.filter((assignment) => assignment.status === 'processing').length;

  return [
    { label: 'Total Assignments', value: totalAssignments, icon: FileText, color: 'bg-blue-50 text-blue-600' },
    { label: 'AI Generated', value: completed, icon: Wand2, color: 'bg-purple-50 text-purple-600' },
    { label: 'Pending', value: pending, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Completed', value: completed + processing, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
  ];
};

export default function Home() {
  const { sidebarOpen, assignments, setAssignments, isLoading, setIsLoading } = useStore();

  useEffect(() => {
    let mounted = true;

    const fetchAssignments = async () => {
      setIsLoading(true);

      try {
        const response = await api.get('/assignments?limit=100');

        if (mounted) {
          setAssignments(response.data.data || []);
        }
      } catch (error) {
        if (mounted) {
          setAssignments([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchAssignments();

    return () => {
      mounted = false;
    };
  }, [setAssignments, setIsLoading]);

  const stats = buildStats(assignments);
  const recentAssignments = [...assignments]
    .sort((left, right) => {
      const leftTime = safeDate(left.createdAt)?.getTime() ?? 0;
      const rightTime = safeDate(right.createdAt)?.getTime() ?? 0;
      return rightTime - leftTime;
    })
    .slice(0, 5);

  const welcomeName = 'John';

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <AppSidebar />

      <main className={`min-h-screen pt-20 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} lg:pt-4`}>
        <div className="page-container max-w-[1400px] py-3 lg:py-4">
          <div className="panel-soft mb-4 px-4 py-4 sm:px-5 sm:py-4 lg:mb-5">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Dashboard
            </div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle mt-1">Welcome back, {welcomeName}. Here is your latest overview.</p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2.5 lg:mb-5 xl:grid-cols-4 lg:gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="panel-soft card-hover px-4 py-3.5 sm:px-5 sm:py-4">
                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon size={19} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[1.5rem] leading-none font-semibold tracking-[-0.04em] text-slate-900 sm:text-[1.65rem]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel-soft mb-4 px-4 py-4 sm:px-5 sm:py-5 lg:mb-5">
            <h2 className="mb-3 text-base font-semibold tracking-[-0.02em] text-slate-900 sm:text-lg">Quick Actions</h2>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              <Link href="/assignments/create" className="btn-primary flex items-center gap-2">
                <Wand2 size={18} />
                Create New Assignment
              </Link>
              <Link href="/assignments" className="btn-secondary flex items-center gap-2">
                <FileText size={18} />
                View All Assignments
              </Link>
            </div>
          </div>

          <div className="panel-soft px-4 py-4 sm:px-5 sm:py-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-[-0.02em] text-slate-900 sm:text-lg">Recent Activity</h2>
              <Link href="/assignments" className="text-sm font-medium text-orange-600 hover:text-orange-700">
                View all
              </Link>
            </div>

            {isLoading && recentAssignments.length === 0 ? (
              <div className="flex justify-center py-10 text-slate-400">
                <Loader2 size={24} className="animate-spin text-orange-500" />
              </div>
            ) : recentAssignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-7 text-center">
                <p className="text-sm font-medium text-slate-900">No activity yet</p>
                <p className="mt-1 text-sm text-slate-500">Create an assignment to see recent updates here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAssignments.map((assignment) => {
                  const statusTone =
                    assignment.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : assignment.status === 'processing'
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : assignment.status === 'failed'
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700';

                  const createdAt = safeDate(assignment.createdAt)?.toLocaleDateString() ?? 'Just now';

                  return (
                    <Link
                      key={assignment._id}
                      href={`/assignments/${assignment._id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                        <FileText size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-slate-900">{assignment.title}</p>
                          <span className="hidden rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline-flex">
                            {assignment.subject}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {assignment.className} &bull; {createdAt}
                        </p>
                      </div>

                      <span className={`ml-auto flex-shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone}`}>
                        {assignment.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
