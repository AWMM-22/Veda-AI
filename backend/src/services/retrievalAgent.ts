import { pipeline } from '@xenova/transformers';
import mongoose from 'mongoose';

import { DocumentChunkModel } from '../models/DocumentChunk';
import { RetrievedContext } from '../types';

type EmbeddingPipeline = Awaited<ReturnType<typeof pipeline>>;

let embeddingPipelinePromise: Promise<EmbeddingPipeline> | null = null;

export class RetrievalAgent {
  private static getEmbeddingPipeline(): Promise<EmbeddingPipeline> {
    if (!embeddingPipelinePromise) {
      embeddingPipelinePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      }) as Promise<EmbeddingPipeline>;
    }

    return embeddingPipelinePromise;
  }

  static async storeChunks(assignmentId: string, chunks: string[]): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId) || chunks.length === 0) {
      return;
    }

    await DocumentChunkModel.deleteMany({ assignmentId });

    const embedder = await this.getEmbeddingPipeline();

    for (let index = 0; index < chunks.length; index++) {
      const text = chunks[index].trim();
      if (!text) {
        continue;
      }

      const embedding = await this.embedText(embedder, text);

      await DocumentChunkModel.create({
        assignmentId,
        chunkIndex: index,
        text,
        embedding,
        tokenCount: text.split(/\s+/).filter(Boolean).length,
      });
    }
  }

  static async retrieveRelevantContexts(
    assignmentId: string,
    query: string,
    topK = 3
  ): Promise<RetrievedContext[]> {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return [];
    }

    const allChunks = await DocumentChunkModel.find({ assignmentId }).sort({ chunkIndex: 1 }).lean();

    if (allChunks.length === 0) {
      return [];
    }

    const embedder = await this.getEmbeddingPipeline();
    const queryEmbedding = await this.embedText(embedder, query);

    return allChunks
      .map((chunk) => ({
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, topK);
  }

  private static async embedText(embedder: EmbeddingPipeline, text: string): Promise<number[]> {
    const output = await embedder(text, {
      pooling: 'mean',
      normalize: true,
    }) as { data: Float32Array | number[] };

    return Array.from(output.data as ArrayLike<number>);
  }

  private static cosineSimilarity(left: number[], right: number[]): number {
    const length = Math.min(left.length, right.length);
    let dotProduct = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;

    for (let index = 0; index < length; index++) {
      const leftValue = left[index];
      const rightValue = right[index];
      dotProduct += leftValue * rightValue;
      leftMagnitude += leftValue * leftValue;
      rightMagnitude += rightValue * rightValue;
    }

    const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}