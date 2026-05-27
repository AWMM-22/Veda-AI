'use client';

import Link from 'next/link';
import AppSidebar from '@/components/AppSidebar';
import { useStore } from '@/store/useStore';
import { Wand2, Brain, ShieldCheck, TimerReset, FileText, ArrowRight, Layers3, BookOpen, Sparkles, Target, BarChart3, ClipboardList } from 'lucide-react';

const toolkitCards = [
  {
    title: 'Generate question papers',
    description: 'Build worksheet and exam sets from class, subject, and difficulty inputs.',
    icon: FileText,
  },
  {
    title: 'Smart question mixing',
    description: 'Blend easy, moderate, and hard questions into balanced papers automatically.',
    icon: Brain,
  },
  {
    title: 'Marking assistance',
    description: 'Use AI to help speed up grading and reduce repetitive review work.',
    icon: ShieldCheck,
  },
  {
    title: 'Timed practice sets',
    description: 'Create quick revision papers for last-minute practice and revision sessions.',
    icon: TimerReset,
  },
];

const toolkitIdeas = [
  {
    title: 'Question bank builder',
    description: 'Save generated questions by topic, class, and difficulty for reuse later.',
    icon: Layers3,
  },
  {
    title: 'Syllabus planner',
    description: 'Turn a syllabus into weekly paper plans and revision sets.',
    icon: BookOpen,
  },
  {
    title: 'Rubric assistant',
    description: 'Auto-build marking rubrics and point breakdowns for long answers.',
    icon: ClipboardList,
  },
  {
    title: 'Exam blueprint',
    description: 'Plan marks, sections, and difficulty balance before generation starts.',
    icon: Target,
  },
  {
    title: 'Paper analytics',
    description: 'See how many easy, medium, and hard questions are being created over time.',
    icon: BarChart3,
  },
  {
    title: 'Revision booster',
    description: 'Generate quick practice sheets from the same uploaded content.',
    icon: Sparkles,
  },
];

export default function ToolkitPage() {
  const { sidebarOpen } = useStore();

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <AppSidebar />

      <main className={`min-h-screen pt-20 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} lg:pt-4`}>
        <div className="page-container py-3 lg:py-4">
          <div className="panel-soft mb-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              AI Teacher's Toolkit
            </div>
            <h1 className="page-title">AI Teacher's Toolkit</h1>
            <p className="page-subtitle mt-1">Tools and helpers for generating papers, reviewing work, and saving time.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {toolkitCards.map((item) => (
              <div key={item.title} className="panel-soft card-hover p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-900/12 bg-slate-50 text-slate-900">
                  <item.icon size={20} />
                </div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="panel-soft mt-4 px-4 py-5 sm:px-5 sm:py-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              More ideas for the toolkit
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {toolkitIdeas.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-900 border border-slate-900/10">
                    <item.icon size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel mt-4 px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">What to add here next</h2>
                <p className="mt-1 text-sm text-slate-500">Add question generation presets, paper settings, reusable templates, and progress dashboards.</p>
              </div>
              <Link href="/assignments/create" className="btn-primary inline-flex items-center gap-2 self-start">
                <Wand2 size={18} />
                Start Creating
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}