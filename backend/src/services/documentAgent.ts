import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas } from '@napi-rs/canvas';
import { recognize } from 'tesseract.js';

import { ParsedDocument } from '../types';

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 160;
const OCR_PAGE_LIMIT = 6;
const OCR_SCALE = 1.5;

export class DocumentAgent {
  static async parseUploadedPdf(fileUrl?: string): Promise<ParsedDocument> {
    if (!fileUrl) {
      return {
        text: '',
        chunks: [],
        pageCount: 0,
        wordCount: 0,
      };
    }

    const fileName = path.basename(fileUrl);
    const filePath = path.resolve(process.cwd(), 'uploads', fileName);

    try {
      const buffer = await fs.readFile(filePath);

      if (path.extname(filePath).toLowerCase() !== '.pdf') {
        return {
          fileName,
          text: '',
          chunks: [],
          pageCount: 0,
          wordCount: 0,
        };
      }

      const parsed = await pdfParse(buffer);
      const text = this.normalizeText(parsed.text);

      if (text) {
        return {
          fileName,
          text,
          chunks: this.chunkText(text),
          pageCount: parsed.numpages ?? 0,
          wordCount: text.split(/\s+/).filter(Boolean).length,
        };
      }

      const ocrText = await this.ocrPdf(buffer);
      const normalizedOcrText = this.normalizeText(ocrText);

      return {
        fileName,
        text: normalizedOcrText,
        chunks: this.chunkText(normalizedOcrText),
        pageCount: parsed.numpages ?? 0,
        wordCount: normalizedOcrText ? normalizedOcrText.split(/\s+/).filter(Boolean).length : 0,
      };
    } catch (error) {
      console.error(`Failed to parse uploaded PDF ${fileName}:`, error);

      return {
        fileName,
        text: '',
        chunks: [],
        pageCount: 0,
        wordCount: 0,
      };
    }
  }

  static chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
    if (!text.trim()) {
      return [];
    }

    const chunks: string[] = [];
    let cursor = 0;

    while (cursor < text.length) {
      const end = Math.min(text.length, cursor + chunkSize);
      const chunk = text.slice(cursor, end).trim();

      if (chunk) {
        chunks.push(chunk);
      }

      if (end >= text.length) {
        break;
      }

      cursor = Math.max(end - overlap, cursor + 1);
    }

    return chunks;
  }

  private static async ocrPdf(buffer: Buffer): Promise<string> {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];
    const pageCount = Math.min(pdf.numPages, OCR_PAGE_LIMIT);

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: OCR_SCALE });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext('2d');

      await page.render({
        canvasContext: context as never,
        viewport,
      }).promise;

      const imageBuffer = canvas.toBuffer('image/png');
      const result = await recognize(imageBuffer, 'eng');
      const recognizedText = this.normalizeText(result.data.text || '');

      if (recognizedText) {
        pageTexts.push(recognizedText);
      }
    }

    return pageTexts.join(' ');
  }

  private static normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}