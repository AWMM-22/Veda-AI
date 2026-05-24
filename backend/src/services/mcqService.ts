import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { MCQ, MCQOption, Section, Question } from '../types';

/**
 * MCQ Service - Handles MCQ generation, conversion, and sharing
 */

export class MCQService {
  /**
   * Generate MCQs from existing question paper sections
   */
  static generateFromQuestionPaper(sections: Section[]): MCQ[] {
    const mcqs: MCQ[] = [];
    let questionIndex = 0;

    for (const section of sections) {
      for (const question of section.questions) {
        const mcq = this.convertQuestionToMCQ(question, questionIndex);
        if (mcq) {
          mcqs.push(mcq);
          questionIndex++;
        }
      }
    }

    return mcqs;
  }

  /**
   * Convert a question to MCQ format with auto-generated options
   */
  private static convertQuestionToMCQ(question: Question, index: number): MCQ {
    const options = this.generateOptions(question.text);

    return {
      questionText: question.text,
      options,
      correctAnswer: 'A', // Will be set by teacher during review
      marks: question.marks || 1,
      difficulty: question.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
      topic: `Question ${index + 1}`,
    };
  }

  /**
   * Generate plausible MCQ options from a question
   */
  private static generateOptions(questionText: string): MCQOption[] {
    // This is a template - in real implementation, AI would generate these
    const defaultOptions = [
      { label: 'A', text: 'Option A (To be edited)' },
      { label: 'B', text: 'Option B (To be edited)' },
      { label: 'C', text: 'Option C (To be edited)' },
      { label: 'D', text: 'Option D (To be edited)' },
    ];

    return defaultOptions;
  }

  /**
   * Create a sharing token and QR code
   */
  static async createSharingLink(baseUrl: string, token?: string): Promise<{ token: string; qrCode: string; link: string }> {
    const sharingToken = token || uuidv4();
    const quizLink = `${baseUrl}/quiz/${sharingToken}`;

    // Generate QR code as data URL (PNG)
    const qrCode = await QRCode.toDataURL(quizLink, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    return {
      token: sharingToken,
      qrCode,
      link: quizLink,
    };
  }

  /**
   * Calculate score from student responses
   */
  static calculateScore(
    mcqs: MCQ[],
    responses: Array<{ questionIndex: number; selectedAnswer: string }>
  ): { score: number; totalMarks: number; percentage: number } {
    let score = 0;
    let totalMarks = 0;

    // Create a map for quick lookup
    const responseMap = new Map(responses.map(r => [r.questionIndex, r.selectedAnswer]));

    for (let i = 0; i < mcqs.length; i++) {
      const mcq = mcqs[i];
      totalMarks += mcq.marks || 1;

      const selectedAnswer = responseMap.get(i);
      if (selectedAnswer && selectedAnswer === mcq.correctAnswer) {
        score += mcq.marks || 1;
      }
    }

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

    return {
      score: Math.round(score * 100) / 100,
      totalMarks,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  /**
   * Generate ranking from student responses
   */
  static generateRanking(
    responses: Array<{
      rollNumber: string;
      studentName?: string;
      score: number;
      percentage: number;
      submittedAt: Date;
    }>
  ) {
    return responses
      .sort((a, b) => {
        // Sort by score descending, then by submission time
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      })
      .map((response, rank) => ({
        rank: rank + 1,
        rollNumber: response.rollNumber,
        studentName: response.studentName || 'Anonymous',
        score: response.score,
        percentage: response.percentage,
        submittedAt: response.submittedAt,
      }));
  }

  /**
   * Validate MCQ structure
   */
  static validateMCQ(mcq: MCQ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!mcq.questionText || mcq.questionText.trim().length === 0) {
      errors.push('Question text is required');
    }

    if (!mcq.options || mcq.options.length !== 4) {
      errors.push('Must have exactly 4 options (A, B, C, D)');
    }

    if (!mcq.correctAnswer || !['A', 'B', 'C', 'D'].includes(mcq.correctAnswer)) {
      errors.push('Correct answer must be A, B, C, or D');
    }

    const validLabels = ['A', 'B', 'C', 'D'];
    if (mcq.options && !mcq.options.every((opt, idx) => opt.label === validLabels[idx])) {
      errors.push('Options must be labeled A, B, C, D in order');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
