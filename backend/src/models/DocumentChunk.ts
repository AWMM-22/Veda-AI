import mongoose, { Schema } from 'mongoose';

export interface DocumentChunkRecord {
  assignmentId: mongoose.Types.ObjectId;
  chunkIndex: number;
  text: string;
  embedding: number[];
  tokenCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const DocumentChunkSchema = new Schema<DocumentChunkRecord>({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  tokenCount: { type: Number, required: true },
}, {
  timestamps: true
});

DocumentChunkSchema.index({ assignmentId: 1, chunkIndex: 1 }, { unique: true });

export const DocumentChunkModel = mongoose.model<DocumentChunkRecord>('DocumentChunk', DocumentChunkSchema);