import mongoose, { Schema } from 'mongoose';
import { Assignment } from '../types';

const QuestionSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  marks: { type: Number, required: true }
});

const SectionSchema = new Schema({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema]
});

const QuestionTypeSchema = new Schema({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 }
});

const AssignmentSchema = new Schema<Assignment>({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  schoolName: { type: String, required: true },
  dueDate: { type: String, required: true },
  questionTypes: { type: [QuestionTypeSchema], required: true },
  totalQuestions: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  additionalInfo: { type: String },
  fileUrl: { type: String },
  sourceText: { type: String },
  sourceChunks: { type: [String] },
  sourceSummary: { type: String },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  sections: { type: [SectionSchema] },
  answerKey: { type: [String] },
  timeAllowed: { type: Number, default: 45 }
}, {
  timestamps: true
});

export const AssignmentModel = mongoose.model<Assignment>('Assignment', AssignmentSchema);
