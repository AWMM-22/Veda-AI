'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import {
  ArrowLeft,
  Trophy,
  Users,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Loader2,
  Download,
  Copy,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface RankingEntry {
  rank: number;
  rollNumber: string;
  studentName: string;
  score: number;
  percentage: number;
  submittedAt: string;
}

interface Statistics {
  averageScore: number;
  averagePercentage: number;
  highestScore: number;
  lowestScore: number;
}

interface ResultsData {
  totalStudents: number;
  ranking: RankingEntry[];
  statistics: Statistics;
}

export default function QuizRankingPage() {
  const params = useParams();
  const router = useRouter();
  const { sidebarOpen } = useStore();
  const quizId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (quizId) {
      fetchResults();
    }
  }, [quizId]);

  const fetchResults = async () => {
    try {
      const res = await api.get(`/mcq/${quizId}/results`);
      if (res.data.success) {
        setResults(res.data.results);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load ranking');
      toast.error('Failed to load ranking');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    // In a real app, you'd get the quiz link from the backend
    const quizLink = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(quizLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <p className="text-slate-600">Loading ranking...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-24 lg:pb-10">
        <AppSidebar />
        <main
          className={`transition-all duration-300 min-h-screen ${
            sidebarOpen ? 'lg:ml-[19rem]' : 'lg:ml-[6.5rem]'
          } pt-20 lg:pt-4`}
        >
          <div className="page-container py-3 lg:py-4 max-w-[1160px]">
            <div className="panel-soft px-4 py-6 sm:px-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">{error}</p>
              <Link href="/quizzes" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft size={16} />
                Back to Quizzes
              </Link>
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
        <div className="page-container py-3 lg:py-4 max-w-[1160px] space-y-6">
          {/* Header */}
          <div className="panel-soft px-4 py-4 sm:px-6 sm:py-5 flex items-center gap-4">
            <Link
              href="/quizzes"
              className="p-2.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-yellow-600 font-semibold mb-1">
                <Trophy className="w-4 h-4" />
                Quiz Ranking
              </div>
              <h1 className="page-title">Student Rankings</h1>
              <p className="page-subtitle mt-1">Performance leaderboard for this quiz</p>
            </div>
          </div>

          {/* Statistics Cards */}
          {results && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="panel p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Total Students</p>
                      <p className="text-3xl font-bold text-slate-900">{results.totalStudents}</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-200" />
                  </div>
                </div>

                <div className="panel p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Avg. Score</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {results.statistics.averageScore}
                      </p>
                    </div>
                    <BarChart3 className="w-10 h-10 text-green-200" />
                  </div>
                </div>

                <div className="panel p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Highest Score</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {results.statistics.highestScore}
                      </p>
                    </div>
                    <Trophy className="w-10 h-10 text-yellow-200" />
                  </div>
                </div>

                <div className="panel p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Avg. %</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {results.statistics.averagePercentage.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-indigo-200" />
                  </div>
                </div>
              </div>

              {/* Ranking Table */}
              <div className="panel overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    Leaderboard
                  </h2>
                </div>

                {results.ranking.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No submissions yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                            Roll Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                            Percentage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                            Submitted
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.ranking.map((entry, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-200 hover:bg-slate-50 transition"
                          >
                            <td className="px-6 py-4">
                              {entry.rank === 1 ? (
                                <span className="flex items-center gap-1">
                                  <Trophy className="w-5 h-5 text-yellow-500" />
                                  <span className="font-bold text-slate-900">1</span>
                                </span>
                              ) : entry.rank === 2 ? (
                                <span className="flex items-center gap-1">
                                  <Trophy className="w-5 h-5 text-gray-400" />
                                  <span className="font-bold text-slate-900">2</span>
                                </span>
                              ) : entry.rank === 3 ? (
                                <span className="flex items-center gap-1">
                                  <Trophy className="w-5 h-5 text-amber-600" />
                                  <span className="font-bold text-slate-900">3</span>
                                </span>
                              ) : (
                                <span className="font-semibold text-slate-600">{entry.rank}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900">
                              {entry.rollNumber}
                            </td>
                            <td className="px-6 py-4 text-slate-600">{entry.studentName}</td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-blue-600">{entry.score}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 bg-slate-200 rounded-full w-16">
                                  <div
                                    className="h-2 bg-gradient-to-r from-green-400 to-blue-600 rounded-full"
                                    style={{
                                      width: `${Math.min(entry.percentage, 100)}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">
                                  {entry.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {new Date(entry.submittedAt).toLocaleDateString()}{' '}
                              {new Date(entry.submittedAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
