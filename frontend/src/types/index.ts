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
  _id: string;
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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sections?: Section[];
  answerKey?: string[];
  timeAllowed?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssignmentDTO {
  title: string;
  subject: string;
  className: string;
  schoolName: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInfo?: string;
  file?: File | null;
}
