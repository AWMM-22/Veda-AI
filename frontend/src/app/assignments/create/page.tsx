'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import { QuestionType } from '@/types';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  Minus,
  Calendar,
  FileText,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const QUESTION_TYPE_OPTIONS = [
  'Multiple Choice Questions',
  'Short Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Long Answer Questions',
  'Fill in the Blanks',
  'True/False',
  'Match the Following'
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { sidebarOpen } = useStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    className: '',
    schoolName: 'Delhi Public School',
    dueDate: '',
    additionalInfo: '',
    questionTypes: [{ type: 'Multiple Choice Questions', count: 4, marks: 1 }] as QuestionType[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.className.trim()) newErrors.className = 'Class is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (formData.questionTypes.length === 0) {
      newErrors.questionTypes = 'At least one question type is required';
    }
    formData.questionTypes.forEach((qt, i) => {
      if (qt.count < 1) newErrors[`qt-${i}-count`] = 'Must be at least 1';
      if (qt.marks < 1) newErrors[`qt-${i}-marks`] = 'Must be at least 1';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const addQuestionType = () => {
    setFormData(prev => ({
      ...prev,
      questionTypes: [...prev.questionTypes, { type: 'Short Questions', count: 3, marks: 2 }]
    }));
  };

  const removeQuestionType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questionTypes: prev.questionTypes.filter((_, i) => i !== index)
    }));
  };

  const updateQuestionType = (index: number, field: keyof QuestionType, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      questionTypes: prev.questionTypes.map((qt, i) => 
        i === index ? { ...qt, [field]: value } : qt
      )
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append('title', formData.title);
      formPayload.append('subject', formData.subject);
      formPayload.append('className', formData.className);
      formPayload.append('schoolName', formData.schoolName);
      formPayload.append('dueDate', formData.dueDate);
      formPayload.append('questionTypes', JSON.stringify(formData.questionTypes));
      if (formData.additionalInfo) {
        formPayload.append('additionalInfo', formData.additionalInfo);
      }
      if (file) {
        formPayload.append('file', file);
      }

      const res = await api.post('/assignments', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Assignment created successfully!');
      router.push(`/assignments/${res.data.data._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuestions = formData.questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const totalMarks = formData.questionTypes.reduce((sum, qt) => sum + (qt.count * qt.marks), 0);

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <AppSidebar />

      <main 
        className={`transition-all duration-300 min-h-screen
          ${sidebarOpen ? 'lg:ml-[19rem]' : 'lg:ml-[6.5rem]'}
          pt-20 lg:pt-4
        `}
      >
        <div className="page-container py-3 lg:py-4 max-w-[1080px]">
          {/* Header */}
          <div className="panel-soft px-4 py-4 sm:px-6 sm:py-5 flex items-center gap-4 mb-5 lg:mb-6">
            <Link 
              href="/assignments"
              className="p-2.5 rounded-full hover:bg-slate-100 transition-colors shrink-0"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-orange-600 font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Create Assignment
              </div>
              <h1 className="page-title">Create Assignment</h1>
              <p className="page-subtitle mt-1">Setup a new assignment for your students</p>
            </div>
          </div>

          {/* Progress */}
          <div className="panel-soft p-3 sm:p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-slate-900' : 'bg-slate-200'}`} />
              <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-slate-900' : 'bg-slate-200'}`} />
            </div>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="panel px-4 py-5 sm:px-6 sm:py-7 lg:px-8 space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-[-0.02em]">Assignment Details</h2>
                <p className="text-sm text-slate-500 mt-1">Basic information about your assignment</p>
              </div>

              {/* File Upload */}
              <div 
                className={`border-2 border-dashed rounded-[1.5rem] p-6 sm:p-8 text-center transition-colors ${
                  dragActive ? 'border-orange-500 bg-orange-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200">
                  <Upload size={24} className="text-slate-500" />
                </div>
                <p className="text-sm text-slate-700 mb-1">
                  {file ? file.name : 'Choose a file or drag & drop it here'}
                </p>
                <p className="text-xs text-slate-400 mb-4">JPEG, PNG, PDF formats</p>
                {file && (
                  <button 
                    onClick={() => setFile(null)}
                    className="text-xs text-rose-500 hover:text-rose-600 mb-3 inline-flex items-center gap-1"
                  >
                    <X size={12} /> Remove file
                  </button>
                )}
                <div>
                  <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer">
                    <FileText size={16} />
                    Browse Files
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Quiz on Electricity"
                    className={`input-field ${errors.title ? 'border-red-300 focus:border-red-500' : ''}`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Science"
                    className={`input-field ${errors.subject ? 'border-red-300 focus:border-red-500' : ''}`}
                  />
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Class *</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
                    placeholder="e.g., 8th Grade"
                    className={`input-field ${errors.className ? 'border-red-300 focus:border-red-500' : ''}`}
                  />
                  {errors.className && <p className="text-xs text-red-500 mt-1">{errors.className}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date *</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className={`input-field pl-10 ${errors.dueDate ? 'border-red-300 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">School Name</label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Question Types */}
          {step === 2 && (
            <div className="panel px-4 py-5 sm:px-6 sm:py-7 lg:px-8 space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-[-0.02em]">Question Configuration</h2>
                <p className="text-sm text-slate-500 mt-1">Define question types, count, and marks</p>
              </div>

              <div className="space-y-4">
                {formData.questionTypes.map((qt, index) => (
                  <div key={index} className="flex flex-col gap-3 p-4 bg-slate-50/70 rounded-[1.25rem] border border-slate-200/70">
                    <div className="flex-1 min-w-0">
                      <select
                        value={qt.type}
                        onChange={(e) => updateQuestionType(index, 'type', e.target.value)}
                        className="input-field mb-2"
                      >
                        {QUESTION_TYPE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 whitespace-nowrap">No. of Questions:</span>
                          <div className="flex items-center">
                            <button 
                              onClick={() => updateQuestionType(index, 'count', Math.max(1, qt.count - 1))}
                              className="p-1.5 rounded-l-xl border border-slate-200 hover:bg-slate-100 bg-white"
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              value={qt.count}
                              onChange={(e) => updateQuestionType(index, 'count', parseInt(e.target.value) || 1)}
                              className="w-12 text-center border-y border-slate-200 py-1.5 text-sm bg-white"
                              min={1}
                            />
                            <button 
                              onClick={() => updateQuestionType(index, 'count', qt.count + 1)}
                              className="p-1.5 rounded-r-xl border border-slate-200 hover:bg-slate-100 bg-white"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 whitespace-nowrap">Marks:</span>
                          <div className="flex items-center">
                            <button 
                              onClick={() => updateQuestionType(index, 'marks', Math.max(1, qt.marks - 1))}
                              className="p-1.5 rounded-l-xl border border-slate-200 hover:bg-slate-100 bg-white"
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              value={qt.marks}
                              onChange={(e) => updateQuestionType(index, 'marks', parseInt(e.target.value) || 1)}
                              className="w-12 text-center border-y border-slate-200 py-1.5 text-sm bg-white"
                              min={1}
                            />
                            <button 
                              onClick={() => updateQuestionType(index, 'marks', qt.marks + 1)}
                              className="p-1.5 rounded-r-xl border border-slate-200 hover:bg-slate-100 bg-white"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {formData.questionTypes.length > 1 && (
                      <button 
                        onClick={() => removeQuestionType(index)}
                        className="self-end p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={addQuestionType}
                className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                <Plus size={18} />
                Add Question Type
              </button>

              {/* Totals */}
              <div className="flex items-center justify-end gap-6 text-sm text-slate-600 pt-4 border-t border-slate-100">
                <span>Total Questions: <strong className="text-slate-900">{totalQuestions}</strong></span>
                <span>Total Marks: <strong className="text-slate-900">{totalMarks}</strong></span>
              </div>

              {/* Additional Info */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Additional Information <span className="text-slate-400 font-normal">(For better output)</span>
                </label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  placeholder="e.g., Generate a question paper for 1 hour exam duration..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <button 
                  onClick={() => setStep(1)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Assignment
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
