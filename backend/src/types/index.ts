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
