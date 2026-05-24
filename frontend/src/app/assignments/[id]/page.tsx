'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Assignment } from '@/types';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Loader2, 
  Clock, 
  CheckCircle,
  FileText,
  AlertCircle,
  Printer,
  KeyRound
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { sidebarOpen, currentAssignment, setCurrentAssignment, updateAssignment } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeView, setActiveView] = useState<'paper' | 'answer-key'>('paper');

  useEffect(() => {
    if (id) {
      fetchAssignment();
      const cleanup = setupSocket();
      return cleanup;
    }
  }, [id]);

  const setupSocket = () => {
    const socket = getSocket();
    socket.emit('join-assignment', id);

    const handleStatusUpdate = (data: { assignmentId: string; status: string; assignment?: Assignment }) => {
      if (data.assignmentId === id) {
        if (data.assignment) {
          setCurrentAssignment(data.assignment);
        } else {
          updateAssignment(id, { status: data.status as any });
        }
      }
    };

    socket.on('status-update', handleStatusUpdate);

    return () => {
      socket.emit('leave-assignment', id);
      socket.off('status-update', handleStatusUpdate);
    };
  };

  const fetchAssignment = async () => {
    try {
      const res = await api.get(`/assignments/${id}`);
      setCurrentAssignment(res.data.data);
    } catch (error) {
      toast.error('Failed to load assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await api.post(`/assignments/${id}/regenerate`);
      toast.success('Regeneration started');
      updateAssignment(id, { status: 'pending' });
    } catch (error) {
      toast.error('Failed to regenerate');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await api.get(`/assignments/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', (currentAssignment?.title || 'assignment').replace(/\s+/g, '_') + '.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'badge-easy';
      case 'Moderate': return 'badge-moderate';
      case 'Hard': return 'badge-hard';
      default: return 'bg-gray-50 text-gray-600 text-xs font-semibold rounded-full px-2 py-0.5';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-16 lg:pb-0">
        <Loader2 size={40} className="text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!currentAssignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-16 lg:pb-0">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900">Assignment not found</h2>
          <Link href="/assignments" className="btn-primary mt-4 inline-block">
            Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  const { title, subject, className, schoolName, status, sections, answerKey, timeAllowed, totalMarks, totalQuestions, dueDate } = currentAssignment;

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <AppSidebar />

      <main 
        className={`transition-all duration-300 min-h-screen
          ${sidebarOpen ? 'lg:ml-[19rem]' : 'lg:ml-[6.5rem]'}
          pt-20 lg:pt-4
        `}
      >
        <div className="page-container py-3 lg:py-4 max-w-[1160px]">
          {/* Header */}
          <div className="panel-soft px-4 py-4 sm:px-6 sm:py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Link 
                href="/assignments"
                className="p-2.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </Link>
              <div>
                <h1 className="page-title">{title}</h1>
                <p className="page-subtitle mt-1">{subject} &bull; {className}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {status === 'completed' && (
                <>
                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      onClick={() => setActiveView('paper')}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeView === 'paper' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Question Paper
                    </button>
                    <button
                      onClick={() => setActiveView('answer-key')}
                      disabled={!answerKey || answerKey.length === 0}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeView === 'answer-key' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'} ${(!answerKey || answerKey.length === 0) ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      Answer Key
                    </button>
                  </div>

                  <button 
                    onClick={handlePrint}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Printer size={16} />
                    Print
                  </button>
                  <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Download PDF
                  </button>
                </>
              )}
              <button 
                onClick={handleRegenerate}
                disabled={isRegenerating || status === 'processing'}
                className="btn-secondary flex items-center gap-2"
              >
                {isRegenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Regenerate
              </button>
            </div>
          </div>

          {/* Status Banner */}
          {status === 'processing' && (
            <div className="bg-blue-50 border border-blue-200 rounded-[1.25rem] p-4 mb-6 flex items-center gap-3">
              <Loader2 size={20} className="text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-900">Generating questions...</p>
                <p className="text-xs text-blue-600">This may take a few moments. You will be notified when it is ready.</p>
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-[1.25rem] p-4 mb-6 flex items-center gap-3">
              <Clock size={20} className="text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Queued for generation</p>
                <p className="text-xs text-yellow-600">Your assignment is in the queue and will be processed shortly.</p>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-[1.25rem] p-4 mb-6 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Generation failed</p>
                <p className="text-xs text-red-600">Something went wrong. Please try regenerating.</p>
              </div>
              <button 
                onClick={handleRegenerate}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Question Paper / Answer Key Display */}
          {status === 'completed' && sections && activeView === 'paper' && (
            <div className="panel overflow-hidden print:shadow-none print:border-none">
              {/* Paper Header */}
              <div className="p-8 border-b-2 border-double border-slate-800 text-center">
                <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">{schoolName}</h2>
                <div className="mt-3 space-y-1">
                  <p className="text-base font-medium">Subject: {subject} | Class: {className}</p>
                  <p className="text-base font-medium">{title}</p>
                </div>
              </div>

              {/* Meta Info */}
              <div className="px-8 py-4 flex items-center justify-between text-sm border-b border-slate-200">
                <span>Time Allowed: {timeAllowed || 45} minutes</span>
                <span>Maximum Marks: {totalMarks}</span>
              </div>

              <p className="px-8 py-2 text-xs text-gray-500 text-center italic">
                All questions are compulsory unless stated otherwise.
              </p>

              {/* Student Info */}
              <div className="mx-8 my-4 p-4 border border-slate-800 rounded-2xl">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="w-28 text-sm font-semibold">Name:</span>
                    <span className="flex-1 border-b border-gray-400 ml-2"></span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-28 text-sm font-semibold">Roll Number:</span>
                    <span className="flex-1 border-b border-gray-400 ml-2"></span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-28 text-sm font-semibold">Class &amp; Section:</span>
                    <span className="flex-1 border-b border-gray-400 ml-2"></span>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="px-8 py-4">
                {sections.map((section, sIdx) => (
                  <div key={sIdx} className="mb-8">
                    <h3 className="text-lg font-bold text-center uppercase tracking-wide mb-2 text-slate-900">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 text-center italic mb-6">
                      {section.instruction}
                    </p>

                    <div className="space-y-5">
                      {section.questions.map((q, qIdx) => (
                        <div key={q.id} className="pl-4 border-l-[3px] border-slate-200">
                          <div className="flex items-start gap-3 mb-2">
                            <span className="font-bold text-sm mt-0.5">{qIdx + 1}.</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={getDifficultyColor(q.difficulty)}>
                                  {q.difficulty}
                                </span>
                                <span className="text-xs text-gray-500">
                                  [{q.marks} Marks]
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed text-slate-800">{q.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-gray-400 py-6">
                --- End of Question Paper ---
              </p>
            </div>
          )}

          {status === 'completed' && activeView === 'answer-key' && (
            <div className="panel overflow-hidden print:shadow-none print:border-none">
              <div className="p-8 border-b-2 border-double border-slate-800 text-center">
                <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">Answer Key</h2>
                <div className="mt-3 space-y-1">
                  <p className="text-base font-medium">Subject: {subject} | Class: {className}</p>
                  <p className="text-base font-medium">{title}</p>
                </div>
              </div>

              <div className="px-8 py-4 border-b border-slate-200 flex items-center justify-between text-sm">
                <span>Time Allowed: {timeAllowed || 45} minutes</span>
                <span>Maximum Marks: {totalMarks}</span>
              </div>

              <div className="px-8 py-6">
                {answerKey && answerKey.length > 0 ? (
                  <div className="space-y-3">
                    {answerKey.map((ans, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900 mb-1">{idx + 1}</p>
                        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{ans}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-medium text-slate-900">No answer key available yet</p>
                    <p className="mt-1 text-sm text-slate-500">The answer key will appear after generation completes.</p>
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-gray-400 py-6">
                --- End of Answer Key ---
              </p>
            </div>
          )}

          {/* Empty/Processing State for Paper */}
          {(status === 'pending' || status === 'processing') && (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Question paper is being generated</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Our AI is crafting customized questions based on your requirements. 
                This page will update automatically when ready.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
