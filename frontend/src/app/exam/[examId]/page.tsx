'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BarChart3, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface MCQOption {
  label: string;
  text: string;
}

interface Question {
  id: number;
  questionText: string;
  options: MCQOption[];
  marks: number;
}

interface Exam {
  _id: string;
  title: string;
  description: string;
  totalQuestions: number;
  totalMarks: number;
  timeLimit?: number;
  questions: Question[];
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://veda-ai-jzpz.onrender.com/api';

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [rollNumber, setRollNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [responses, setResponses] = useState<Map<number, string>>(new Map());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  const fetchJsonWithFallback = async (primaryUrl: string, fallbackUrl: string, init?: RequestInit) => {
    const tryFetch = async (url: string) => {
      const response = await fetch(url, init);
      const raw = await response.text();
      try {
        return { response, data: JSON.parse(raw) };
      } catch {
        return { response, data: { success: false, error: raw || `Request failed with ${response.status}` } };
      }
    };

    const first = await tryFetch(primaryUrl);
    if (first.response.ok) return first;

    const second = await tryFetch(fallbackUrl);
    return second;
  };

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await fetchJsonWithFallback(
          `${apiBase}/exam/${examId}`,
          `${apiBase}/quiz/${examId}`
        );

        if (!data.success) {
          setError(data.error || 'Failed to load exam');
          return;
        }

        setExam(data.quiz);
        if (data.quiz.timeLimit) {
          setTimeLeft(data.quiz.timeLimit * 60);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load exam');
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExam();
    }
  }, [examId]);

  useEffect(() => {
    if (!started || !timeLeft) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev > 0) return prev - 1;
        handleSubmit();
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    const next = new Map(responses);
    next.set(questionId, answer);
    setResponses(next);
  };

  const handleSubmit = async () => {
    if (!rollNumber.trim()) {
      alert('Please enter your roll number');
      return;
    }

    if (responses.size === 0) {
      alert('Please answer at least one question');
      return;
    }

    try {
      const formattedResponses = Array.from(responses.entries()).map(([questionIndex, selectedAnswer]) => ({
        questionIndex,
        selectedAnswer,
      }));

      const payload = {
        rollNumber,
        studentName: studentName || `Student-${rollNumber}`,
        responses: formattedResponses,
      };

      const { data } = await fetchJsonWithFallback(
        `${apiBase}/exam/${examId}/submit`,
        `${apiBase}/quiz/${examId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!data.success) {
        setError(data.error || 'Failed to submit exam');
        return;
      }

      setResult(data.result);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit exam');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Exam Submitted!</h1>
          <p className="text-slate-600 mb-6">Your responses have been recorded.</p>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-600">Score</p>
              <p className="text-4xl font-bold text-blue-600">{result.score}</p>
              <p className="text-sm text-slate-500">out of {result.totalMarks}</p>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Percentage</p>
                <p className="text-2xl font-bold text-indigo-600">{result.percentage.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Roll Number</p>
                <p className="text-lg font-bold text-slate-900">{result.rollNumber}</p>
              </div>
            </div>
          </div>
          <button onClick={() => router.push('/thank-you')} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition">
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{exam.title}</h1>
            {exam.description && <p className="text-slate-600">{exam.description}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-blue-50 rounded-xl">
            <div className="text-center"><BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" /><p className="text-sm text-slate-600">Questions</p><p className="text-2xl font-bold text-slate-900">{exam.totalQuestions}</p></div>
            <div className="text-center"><CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" /><p className="text-sm text-slate-600">Total Marks</p><p className="text-2xl font-bold text-slate-900">{exam.totalMarks}</p></div>
            {exam.timeLimit && <div className="text-center"><Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" /><p className="text-sm text-slate-600">Time Limit</p><p className="text-2xl font-bold text-slate-900">{exam.timeLimit} mins</p></div>}
          </div>
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Roll Number *</label>
              <input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="Enter your roll number" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Name *</label>
              <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Enter your name" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <button onClick={() => setStarted(true)} disabled={!rollNumber.trim() || !studentName.trim()} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 text-white px-6 py-3 rounded-lg font-bold transition text-lg">
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
            <p className="text-sm text-slate-600">Name: {studentName}</p>
            <p className="text-sm text-slate-600">Roll: {rollNumber}</p>
          </div>
          {timeLeft !== null && (
            <div className={`text-center px-4 py-2 rounded-lg font-bold ${timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              <Clock className="w-4 h-4 inline-block mr-2" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {exam.questions.map((question, idx) => (
            <div key={question.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-4 flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900">Q{idx + 1}. {question.questionText}</h3>
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label key={option.label} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition ${responses.get(idx) === option.label ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name={`question-${idx}`} value={option.label} checked={responses.get(idx) === option.label} onChange={() => handleAnswerChange(idx, option.label)} className="w-4 h-4 text-blue-600" />
                    <span className="ml-3 font-medium text-slate-900">{option.label}. {option.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button onClick={handleSubmit} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-bold transition text-lg">
            Submit Exam
          </button>
          <p className="text-xs text-slate-500 mt-2">Questions answered: {responses.size} / {exam.totalQuestions}</p>
        </div>
      </div>
    </div>
  );
}
