'use client';

import { useEffect, useState } from 'react';
import AppSidebar from '@/components/AppSidebar';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import { Assignment } from '@/types';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  CheckCircle, 
  Loader2,
  XCircle,
  Download,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssignmentsPage() {
  const { sidebarOpen, assignments, setAssignments, setIsLoading, isLoading } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data.data);
    } catch (error) {
      toast.error('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         a.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-600" />;
      case 'processing': return <Loader2 size={16} className="text-blue-600 animate-spin" />;
      case 'pending': return <Clock size={16} className="text-yellow-600" />;
      case 'failed': return <XCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Assignment deleted');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to delete');
    }
    setMenuOpen(null);
  };

  const handleDownload = async (id: string, title: string) => {
    try {
      const res = await api.get(`/assignments/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', title.replace(/\s+/g, '_') + '.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
    setMenuOpen(null);
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <AppSidebar />

      <main 
        className={`transition-all duration-300 min-h-screen
          ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
          pt-20 lg:pt-4
        `}
      >
        <div className="page-container py-3 lg:py-4">
          {/* Header */}
          <div className="panel-soft px-4 py-4 sm:px-6 sm:py-5 mb-5 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-emerald-600 font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Assignments
              </div>
              <h1 className="page-title">Assignments</h1>
              <p className="page-subtitle mt-1">Manage and create assignments for your classes</p>
            </div>
            <Link 
              href="/assignments/create"
              className="btn-primary flex items-center justify-center gap-2 self-start"
            >
              <Plus size={18} />
              Create Assignment
            </Link>
          </div>

          {/* Filters */}
          <div className="panel-soft p-3 sm:p-4 flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field sm:w-44"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Empty State */}
          {filteredAssignments.length === 0 && !isLoading && (
            <div className="panel px-5 py-10 sm:px-8 sm:py-12 text-center">
              <div className="mx-auto mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.98),rgba(243,244,246,0.9)_60%,rgba(229,231,235,0.75)_100%)] shadow-inner">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                  <FileText size={52} className="text-slate-300" />
                  <div className="absolute -right-1 -top-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg">
                    <XCircle size={18} className="text-rose-500" />
                  </div>
                </div>
              </div>
              <h3 className="text-[1.15rem] sm:text-xl font-semibold text-slate-900 mb-2">No assignments yet</h3>
              <p className="text-sm sm:text-[0.95rem] text-slate-500 mb-7 max-w-[34rem] mx-auto leading-7">
                Create your first assignment to start collecting and grading student submissions. 
                You can set up rubrics, define marking criteria, and let AI assist with grading.
              </p>
              <Link 
                href="/assignments/create"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
                <Plus size={18} />
                Create Your First Assignment
              </Link>
            </div>
          )}

          {/* Assignments Grid */}
          {filteredAssignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAssignments.map((assignment) => (
                <div 
                  key={assignment._id}
                  className="panel-soft p-5 card-hover relative group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment.status)}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setMenuOpen(menuOpen === assignment._id ? null : assignment._id)}
                        className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>

                      {menuOpen === assignment._id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.14)] border border-slate-100 py-1 z-20 overflow-hidden">
                            <Link 
                              href={`/assignments/${assignment._id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setMenuOpen(null)}
                            >
                              <Eye size={14} />
                              View Assignment
                            </Link>
                            {assignment.status === 'completed' && (
                              <button
                                onClick={() => handleDownload(assignment._id, assignment.title)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                              >
                                <Download size={14} />
                                Download PDF
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(assignment._id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                            >
                              <XCircle size={14} />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <Link href={`/assignments/${assignment._id}`}>
                    <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors tracking-[-0.02em]">
                      {assignment.title}
                    </h3>
                  </Link>

                  <div className="space-y-1.5 text-sm text-slate-500">
                    <p>Subject: <span className="text-slate-700">{assignment.subject}</span></p>
                    <p>Class: <span className="text-slate-700">{assignment.className}</span></p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3 text-xs sm:text-sm">
                      <span>Assigned: {new Date(assignment.createdAt || '').toLocaleDateString()}</span>
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {assignment.status === 'completed' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                      <span className="text-slate-500">{assignment.totalQuestions} Questions</span>
                      <span className="text-slate-500">{assignment.totalMarks} Marks</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-orange-500 animate-spin" />
            </div>
          )}

          <Link
            href="/assignments/create"
            className="hidden lg:inline-flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] ring-1 ring-orange-500/70"
          >
            <Plus size={18} />
            Create Assignment
          </Link>

          <Link
            href="/assignments/create"
            className="lg:hidden fixed right-4 bottom-[5.5rem] z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white text-orange-500 shadow-[0_16px_35px_rgba(15,23,42,0.18)] border border-slate-200"
          >
            <Plus size={22} />
          </Link>
        </div>
      </main>
    </div>
  );
}
