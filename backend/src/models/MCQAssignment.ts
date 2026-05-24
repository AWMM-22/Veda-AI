import mongoose, { Types } from 'mongoose';
import { IMCQ } from './MCQ';

export interface IMCQAssignment {
  _id?: string;
  assignmentId: Types.ObjectId;
  mcqs: IMCQ[];
  title: string;
  description?: string;
  sharingToken: string; // unique token for QR code/link
  qrCode?: string; // base64 encoded QR code image
  totalMarks: number;
  timeLimit?: number; // in minutes
  status: 'draft' | 'active' | 'closed';
  createdAt?: Date;
  updatedAt?: Date;
}

const mcqAssignmentSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    mcqs: [
      {
        questionText: String,
        options: [
          {
            label: String,
            text: String,
          },
        ],
        correctAnswer: String,
        marks: Number,
        topic: String,
        difficulty: String,
      },
    ],
    title: { type: String, required: true },
    description: String,
    sharingToken: { type: String, unique: true, required: true, index: true },
    qrCode: String, // base64 encoded PNG
    totalMarks: Number,
    timeLimit: Number,
    status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' },
  },
  { timestamps: true }
);

mcqAssignmentSchema.index({ assignmentId: 1 });

export const MCQAssignmentModel = mongoose.model('MCQAssignment', mcqAssignmentSchema);
