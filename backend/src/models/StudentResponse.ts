import mongoose, { Types } from 'mongoose';

export interface IStudentResponse {
  _id?: string;
  mcqAssignmentId: Types.ObjectId;
  examId?: string;
  rollNumber: string;
  studentName?: string;
  responses: Array<{
    questionIndex: number;
    selectedAnswer: string; // A, B, C, or D
  }>;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt?: Date;
  createdAt?: Date;
}

const studentResponseSchema = new mongoose.Schema(
  {
    mcqAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MCQAssignment', required: true },
    examId: { type: String, required: true, index: true },
    rollNumber: { type: String, required: true },
    studentName: String,
    responses: [
      {
        questionIndex: Number,
        selectedAnswer: String,
      },
    ],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

studentResponseSchema.index({ mcqAssignmentId: 1 });
studentResponseSchema.index({ examId: 1 });
studentResponseSchema.index({ rollNumber: 1 });
studentResponseSchema.index({ mcqAssignmentId: 1, rollNumber: 1 }, { unique: true });
studentResponseSchema.index({ examId: 1, rollNumber: 1 }, { unique: true });

export const StudentResponseModel = mongoose.model('StudentResponse', studentResponseSchema);
