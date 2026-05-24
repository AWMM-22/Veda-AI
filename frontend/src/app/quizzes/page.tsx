'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppSidebar from '@/components/AppSidebar';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import { 
  Zap, 
  BarChart3, 
  Users,
  Calendar,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  totalMarks: number;
  status: 'draft' | 'active' | 'closed';
  studentCount: number;
  createdAt: string;
}

export default function QuizzesPage() {
  const { sidebarOpen } = useStore();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await api.get('/mcq/list');
      if (res.data.success) {
        setQuizzes(res.data.quizzes);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load quizzes');
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'closed':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 lg:pb-10">
        <AppSidebar />
        <main
          className={`transition-all duration-300 min-h-screen ${
            sidebarOpen ? 'lg:ml-[19rem]' : 'lg:ml-[6.5rem]'
          } pt-20 lg:pt-4`}
        >
          <div className="page-container py-3 lg:py-4 max-w-[1160px] flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Loading quizzes...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <AppSidebar />

      <main
        className={`transition-all duration-300 min-h-screen ${
          sidebarOpen ? 'lg:ml-[19rem]' : 'lg:ml-[6.5rem]'
        } pt-20 lg:pt-4`}
      >
        <div className="page-container py-3 lg:py-4 max-w-[1160px]">
          {/* Header */}
          <div className="panel-soft px-4 py-4 sm:px-6 sm:py-5 flex items-center gap-4 mb-6">
            <Link
              href="/assignments"
              className="p-2.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-blue-600 font-semibold mb-1">
                <Zap className="w-4 h-4" />
                Ranking & Quizzes
              </div>
              <h1 className="page-title">All Quizzes</h1>
              <p className="page-subtitle mt-1">View rankings for each quiz</p>
            </div>
          </div>

          {error ? (
            <div className="panel-soft px-4 py-6 sm:px-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-slate-600">{error}</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="panel-soft px-4 py-12 sm:px-6 text-center">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No quizzes created yet</p>
              <Link
                href="/assignments/create"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Zap size={16} />
                Create Your First Quiz
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <Link
                  key={quiz._id}
                  href={`/quizzes/${quiz._id}/ranking`}
                  className="group panel p-6 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {quiz.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getStatusColor(
                        quiz.status
                      )}`}
                    >
                      {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <BarChart3 className="w-4 h-4" />
                      <span>
                        <strong className="text-slate-900">{quiz.totalMarks}</strong> marks
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      <span>
                        <strong className="text-slate-900">{quiz.studentCount}</strong> students
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <time className="text-xs text-slate-500">
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </time>
                    <BarChart3 className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
