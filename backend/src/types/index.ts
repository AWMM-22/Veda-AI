export interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface Assignment {
  _id?: string;
  title: string;
  subject: string;
  className: string;
  schoolName: string;
  dueDate: string;
  questionTypes: QuestionType[];
  totalQuestions: number;
  totalMarks: number;
  additionalInfo?: string;
  fileUrl?: string;
  sourceText?: string;
  sourceChunks?: string[];
  sourceSummary?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sections?: Section[];
  answerKey?: string[];
  timeAllowed?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAssignmentDTO {
  title: string;
  subject: string;
  className: string;
  schoolName: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInfo?: string;
  fileUrl?: string;
}

export interface ParsedDocument {
  fileName?: string;
  text: string;
  chunks: string[];
  pageCount: number;
  wordCount: number;
}

export interface GeneratedPaperDraft {
  sections: Section[];
  answerKey: string[];
  timeAllowed: number;
}

export interface RetrievedContext {
  chunkIndex: number;
  text: string;
  score: number;
}

export interface JobData {
  assignmentId: string;
  title: string;
  subject: string;
  className: string;
  schoolName: string;
  questionTypes: QuestionType[];
  additionalInfo?: string;
  fileUrl?: string;
}

export interface MCQOption {
  label: string; // A, B, C, D
  text: string;
}

export interface MCQ {
  _id?: string;
  questionText: string;
  options: MCQOption[];
  correctAnswer: string; // A, B, C, or D
  marks: number;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface MCQAssignment {
  _id?: string;
  assignmentId: string;
  examId?: string;
  mcqs: MCQ[];
  title: string;
  description?: string;
  sharingToken: string;
  qrCode?: string;
  qrUrl?: string;
  totalMarks: number;
  timeLimit?: number;
  status: 'draft' | 'active' | 'closed';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentResponseData {
  questionIndex: number;
  selectedAnswer: string;
}

export interface StudentResponse {
  _id?: string;
  mcqAssignmentId: string;
  examId: string;
  rollNumber: string;
  studentName?: string;
  responses: StudentResponseData[];
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt?: Date;
  createdAt?: Date;
}
