'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Zap, Copy, QrCode, Download, AlertCircle, Loader2, Settings, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface MCQAssignment {
  _id: string;
  title: string;
  description?: string;
  totalQuestions: number;
  totalMarks: number;
  sharingToken: string;
  qrCode?: string;
  quizLink?: string;
  status: 'draft' | 'active' | 'closed';
  mcqs?: any[];
}

export default function MCQManagementPage() {
  const params = useParams();
  const assignmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [mcqAssignment, setMCQAssignment] = useState<MCQAssignment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStatus, setShowStatus] = useState<'active' | 'draft' | 'closed' | null>(null);

  useEffect(() => {
    fetchMCQ();
  }, [assignmentId]);

  const fetchMCQ = async () => {
    try {
      const res = await api.get(`/mcq/${assignmentId}`);
      if (res.data.success) {
        setMCQAssignment(res.data.mcqAssignment);
      } else {
        setError(res.data.error || 'No MCQ found');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No MCQ created yet. Click "Create MCQ" to get started.');
      } else {
        setError(err.message || 'Failed to load MCQ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMCQ = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post(`/mcq/${assignmentId}/generate`, {
        title: `MCQ Quiz`,
        description: 'Auto-generated MCQ quiz from question paper',
      });

      if (res.data.success) {
        setMCQAssignment(res.data.mcqAssignment);
        toast.success('MCQs generated successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate MCQs');
    } finally {
      setIsGenerating(false);
    }
  };

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
      link.download = `mcq-qr-${assignmentId}.png`;
      link.click();
    }
  };

  const handleUpdateStatus = async (newStatus: 'active' | 'draft' | 'closed') => {
    try {
      const res = await api.patch(`/mcq/${mcqAssignment?._id}/update`, {
        status: newStatus,
      });

      if (res.data.success) {
        setMCQAssignment(prev => prev ? { ...prev, status: newStatus } : null);
        toast.success(`Quiz status changed to ${newStatus}`);
        setShowStatus(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading MCQ assignment...</p>
        </div>
      </div>
    );
  }

  if (error && !mcqAssignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Create MCQ Quiz</h2>
            <p className="text-slate-600 mb-6">{error}</p>

            <button
              onClick={handleGenerateMCQ}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 transition flex items-center gap-2 mx-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Auto-Generate from Question Paper
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {mcqAssignment?.title || 'MCQ Quiz Management'}
              </h1>
              {mcqAssignment?.description && (
                <p className="text-slate-600">{mcqAssignment.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                mcqAssignment?.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : mcqAssignment?.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {mcqAssignment?.status?.toUpperCase()}
              </span>

              {/* Analytics Button */}
              {mcqAssignment?._id && (
                <Link
                  href={`/quizzes/${mcqAssignment._id}/ranking`}
                  className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600"
                  title="View Rankings & Analytics"
                >
                  <BarChart3 className="w-5 h-5" />
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowStatus(showStatus === 'active' ? null : mcqAssignment?.status || 'active')}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <Settings className="w-5 h-5 text-slate-600" />
                </button>

                {showStatus && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 overflow-hidden">
                    {(['draft', 'active', 'closed'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(status)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 transition capitalize font-medium text-slate-900"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-xs text-slate-600 mb-1">Total Questions</p>
              <p className="text-2xl font-bold text-slate-900">{mcqAssignment?.totalQuestions}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Total Marks</p>
              <p className="text-2xl font-bold text-slate-900">{mcqAssignment?.totalMarks}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Sharing Token</p>
              <p className="text-sm font-mono font-bold text-slate-900">
                {mcqAssignment?.sharingToken?.substring(0, 8)}...
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Quiz Status</p>
              <p className="text-sm font-bold text-slate-900 capitalize">
                {mcqAssignment?.status}
              </p>
            </div>
          </div>
        </div>

        {/* Sharing Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-blue-600" />
            Share with Students
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <p className="text-sm text-slate-600 mb-3 font-medium">QR Code</p>
              {mcqAssignment?.qrCode && (
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <img
                    src={mcqAssignment.qrCode}
                    alt="QR Code"
                    className="w-64 h-64 object-contain"
                  />
                </div>
              )}
              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Print this QR code and share with students
              </p>
            </div>

            {/* Direct Link */}
            <div className="flex flex-col justify-center">
              <p className="text-sm text-slate-600 mb-3 font-medium">Direct Link</p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mcqAssignment?.quizLink || ''}
                    readOnly
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Share this link directly with students via email or messaging
                </p>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Instructions for Students:</p>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>Scan the QR code or click the direct link</li>
                  <li>Enter your roll number</li>
                  <li>Answer all questions carefully</li>
                  <li>Click Submit to see your score</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Preview */}
        {mcqAssignment?.mcqs && mcqAssignment.mcqs.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Questions Preview</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {mcqAssignment.mcqs.map((mcq, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                  <p className="font-medium text-slate-900 mb-2">
                    Q{idx + 1}. {mcq.questionText}
                  </p>
                  <div className="space-y-1 ml-4">
                    {mcq.options?.map((opt: any) => (
                      <p
                        key={opt.label}
                        className={`text-sm ${
                          opt.label === mcq.correctAnswer
                            ? 'text-green-600 font-medium'
                            : 'text-slate-600'
                        }`}
                      >
                        {opt.label}. {opt.text}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
