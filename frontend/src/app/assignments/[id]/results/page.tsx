'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Trophy,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Copy,
  QrCode as QrCodeIcon,
  Download,
  AlertCircle,
} from 'lucide-react';

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

export default function MCQResultsPage() {
  const params = useParams();
  const assignmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [mcqAssignment, setMcqAssignment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch MCQ assignment
        const mcqRes = await fetch(`/api/mcq/${assignmentId}`);
        const mcqData = await mcqRes.json();

        if (mcqData.success) {
          setMcqAssignment(mcqData.mcqAssignment);

          // Fetch results
          const resultsRes = await fetch(`/api/mcq/${mcqData.mcqAssignment._id}/results`);
          const resultsData = await resultsRes.json();

          if (resultsData.success) {
            setResults(resultsData.results);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchData();
    }
  }, [assignmentId]);

  const handleCopyLink = () => {
    if (mcqAssignment?.quizLink) {
      navigator.clipboard.writeText(mcqAssignment.quizLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (mcqAssignment?.qrCode) {
      const link = document.createElement('a');
      link.href = mcqAssignment.qrCode;
      link.download = `quiz-qr-${assignmentId}.png`;
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Error</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {mcqAssignment?.title || 'Quiz Results'}
          </h1>
          {mcqAssignment?.description && (
            <p className="text-slate-600 mb-4">{mcqAssignment.description}</p>
          )}

          {/* Sharing Section */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <QrCodeIcon className="w-5 h-5" />
              Share with Students
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                {mcqAssignment?.qrCode && (
                  <div className="bg-white p-2 rounded-lg">
                    <img
                      src={mcqAssignment.qrCode}
                      alt="QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                )}
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </button>
              </div>

              {/* Direct Link */}
              <div className="flex flex-col justify-center">
                <p className="text-sm text-slate-600 mb-2">Direct Link:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mcqAssignment?.quizLink || ''}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {results && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total Students</p>
                    <p className="text-3xl font-bold text-slate-900">{results.totalStudents}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Avg. Score</p>
                    <p className="text-3xl font-bold text-slate-900">{results.statistics.averageScore}</p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-green-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Highest Score</p>
                    <p className="text-3xl font-bold text-slate-900">{results.statistics.highestScore}</p>
                  </div>
                  <Trophy className="w-10 h-10 text-yellow-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
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
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Student Rankings
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
                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            {entry.rank === 1 ? (
                              <span className="flex items-center gap-1">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                <span className="font-bold text-slate-900">{entry.rank}</span>
                              </span>
                            ) : entry.rank === 2 ? (
                              <span className="flex items-center gap-1">
                                <Trophy className="w-5 h-5 text-gray-400" />
                                <span className="font-bold text-slate-900">{entry.rank}</span>
                              </span>
                            ) : entry.rank === 3 ? (
                              <span className="flex items-center gap-1">
                                <Trophy className="w-5 h-5 text-amber-600" />
                                <span className="font-bold text-slate-900">{entry.rank}</span>
                              </span>
                            ) : (
                              <span className="font-semibold text-slate-600">{entry.rank}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">{entry.rollNumber}</td>
                          <td className="px-6 py-4 text-slate-600">{entry.studentName}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-blue-600">{entry.score}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 bg-slate-200 rounded-full w-16">
                                <div
                                  className="h-2 bg-gradient-to-r from-green-400 to-blue-600 rounded-full"
                                  style={{ width: `${Math.min(entry.percentage, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-slate-900">
                                {entry.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(entry.submittedAt).toLocaleDateString()} {new Date(entry.submittedAt).toLocaleTimeString()}
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
    </div>
  );
}
