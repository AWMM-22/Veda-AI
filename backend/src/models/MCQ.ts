import mongoose from 'mongoose';

export interface IMCQOption {
  label: string; // A, B, C, D
  text: string;
}

export interface IMCQ {
  _id?: string;
  questionText: string;
  options: IMCQOption[];
  correctAnswer: string; // A, B, C, or D
  marks: number;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const mcqSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: [
      {
        label: String, // A, B, C, D
        text: String,
      },
    ],
    correctAnswer: { type: String, required: true }, // A, B, C, D
    marks: { type: Number, default: 1 },
    topic: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  },
  { timestamps: true }
);

export const MCQModel = mongoose.model('MCQ', mcqSchema);
