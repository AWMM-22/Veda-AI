// @ts-ignore - qrcode doesn't have @types package
import QRCode from 'qrcode';
// @ts-ignore - uuid doesn't have typed import
import { v4 as uuidv4 } from 'uuid';
import { MCQ, MCQOption, Section, Question } from '../types';

/**
 * MCQ Service - Handles MCQ generation, conversion, and sharing
 */

export class MCQService {
  /**
   * Generate MCQs from existing question paper sections
   */
  static async generateFromQuestionPaper(sections: Section[]): Promise<MCQ[]> {
    const mcqs: MCQ[] = [];
    let questionIndex = 0;

    for (const section of sections) {
      for (const question of section.questions) {
        const mcq = await this.convertQuestionToMCQ(question, questionIndex);
        if (mcq) {
          mcqs.push(mcq);
          questionIndex++;
        }
      }
    }

    return mcqs;
  }

  /**
   * Generate a single MCQ directly from source text.
   */
  static async generateMCQFromText(questionText: string, marks = 1, index = 0): Promise<MCQ> {
    return this.convertQuestionToMCQ(
      {
        text: questionText,
        marks,
        difficulty: 'Moderate',
      } as Question,
      index
    );
  }

  /**
   * Convert a question to MCQ format with auto-generated options
   */
  private static async convertQuestionToMCQ(question: Question, index: number): Promise<MCQ> {
    const generated = await this.generateMCQFromModels(question.text, question.marks || 1);
    const options = generated.options ?? this.generateOptions(question.text);

    return {
      questionText: generated.questionText || question.text,
      options,
      correctAnswer: generated.correctAnswer || options[0].label,
      marks: question.marks || 1,
      difficulty: (generated.difficulty || question.difficulty || 'moderate').toLowerCase() as 'easy' | 'medium' | 'hard',
      topic: `Question ${index + 1}`,
    };
  }

  private static readonly GROQ_API_KEY = process.env.GROQ_API_KEY;
  private static readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  private static readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate';

  private static async generateMCQFromModels(questionText: string, marks: number): Promise<{
    questionText?: string;
    options?: MCQOption[];
    correctAnswer?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }> {
    const sources = [
      this.GROQ_API_KEY ? await this.generateMCQWithGroq(questionText, marks).catch(() => null) : null,
      this.GEMINI_API_KEY ? await this.generateMCQWithGemini(questionText, marks).catch(() => null) : null,
    ].filter(Boolean) as Array<{
      questionText?: string;
      options?: MCQOption[];
      correctAnswer?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
    }>;

    for (const source of sources) {
      const normalized = this.normalizeMCQPayload(source, questionText);
      if (normalized.options.length === 4) {
        return normalized;
      }
    }

    return this.generateFallbackMCQ(questionText);
  }

  private static async generateMCQWithGroq(questionText: string, marks: number): Promise<any> {
    const prompt = `Create one strong multiple-choice question from the following source passage or topic.

Source text:
${questionText}

Return ONLY valid JSON in this exact shape:
{
  "questionText": "clear, concise question ending with ?",
  "options": [
    {"label": "A", "text": "..."},
    {"label": "B", "text": "..."},
    {"label": "C", "text": "..."},
    {"label": "D", "text": "..."}
  ],
  "correctAnswer": "A|B|C|D",
  "difficulty": "easy|medium|hard"
}

Rules:
- Make all 4 options distinct.
- Only one option should be correct.
- The question should test understanding of the passage, not quote it.
- Avoid filler phrases like "what is mentioned about" or copying long passages.
- Keep the question clear and exam-like.`;

    const response = await fetch(this.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  }

  private static async generateMCQWithGemini(questionText: string, marks: number): Promise<any> {
    const prompt = `Create one strong multiple-choice question from the following source passage or topic.

Source text:
${questionText}

Return ONLY valid JSON with fields questionText, options, correctAnswer, difficulty. Ensure the options are distinct and only one is correct.`;

    const url = `${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_output_tokens: 1200,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const content = data.candidates?.[0]?.output || data.output?.[0]?.content || JSON.stringify(data);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  }

  private static normalizeMCQPayload(payload: any, fallbackQuestionText: string): { questionText: string; options: MCQOption[]; correctAnswer: string; difficulty: 'easy' | 'medium' | 'hard' } {
    const options = Array.isArray(payload?.options)
      ? payload.options
          .map((option: any, index: number) => ({
            label: String(option.label || String.fromCharCode(65 + index)).toUpperCase(),
            text: String(option.text || '').trim(),
          }))
          .filter((option: MCQOption) => option.text.length > 0)
      : [];

    const unique = new Map<string, MCQOption>();
    for (const option of options) {
      const key = option.text.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, option);
      }
    }

    const deduped = [...unique.values()].slice(0, 4);
    if (deduped.length < 4) {
      return this.generateFallbackMCQ(fallbackQuestionText);
    }

    const texts = deduped.map((option) => option.text.toLowerCase());
    if (new Set(texts).size < 4) {
      return this.generateFallbackMCQ(fallbackQuestionText);
    }

    const labels = ['A', 'B', 'C', 'D'];
    const finalOptions = deduped.map((option, index) => ({
      label: labels[index],
      text: option.text,
    }));

    const correctAnswer = labels.includes(String(payload?.correctAnswer).toUpperCase())
      ? String(payload.correctAnswer).toUpperCase()
      : 'A';

    const difficulty = ['easy', 'medium', 'hard'].includes(String(payload?.difficulty).toLowerCase())
      ? String(payload.difficulty).toLowerCase() as 'easy' | 'medium' | 'hard'
      : 'medium';

    const questionText = String(payload?.questionText || fallbackQuestionText).trim();
    if (!questionText || questionText.length < 12 || questionText.includes('What is mentioned about:')) {
      return this.generateFallbackMCQ(fallbackQuestionText);
    }

    return {
      questionText: questionText.endsWith('?') ? questionText : `${questionText}?`,
      options: finalOptions,
      correctAnswer,
      difficulty,
    };
  }

  /**
   * Generate plausible MCQ options from a question
   */
  private static generateOptions(questionText: string): MCQOption[] {
    const normalized = questionText.replace(/\s+/g, ' ').trim();
    const tokens = normalized.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? [];

    const stopWords = new Set([
      'what', 'which', 'when', 'where', 'why', 'how', 'does', 'do', 'is', 'are', 'was', 'were',
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'about', 'according', 'based',
      'uploaded', 'content', 'pdf', 'question', 'option', 'options', 'passage', 'idea', 'main', 'best',
      'describe', 'explain', 'write', 'short', 'note', 'significance', 'context', 'following', 'statement'
    ]);

    const focusTerms = tokens.filter((word) => !stopWords.has(word));
    const keyPhrase = focusTerms.slice(0, 3).join(' ') || 'the concept discussed';
    const alternatePhrase = focusTerms.slice(3, 6).join(' ') || 'a related detail';
    const theme = keyPhrase.charAt(0).toUpperCase() + keyPhrase.slice(1);
    const alternateTheme = alternatePhrase.charAt(0).toUpperCase() + alternatePhrase.slice(1);

    const hashSeed = tokens.reduce((sum, word) => sum + word.charCodeAt(0), 0);
    const styleIndex = hashSeed % 3;

    const optionGroups: Record<number, string[]> = {
      0: [
        `The main idea is ${theme}.`,
        `It is a supporting detail connected to ${alternateTheme}, not the main idea.`,
        `It describes a different concept that is only loosely related to ${theme}.`,
        `It refers to an unrelated point rather than ${theme}.`,
      ],
      1: [
        `${theme} is the central concept being discussed.`,
        `The passage focuses on a similar but different idea about ${alternateTheme}.`,
        `It highlights an example, not the core definition of ${theme}.`,
        `It is a distractor option about an unrelated topic.`,
      ],
      2: [
        `It explains ${theme} directly and clearly.`,
        `It partially relates to ${alternateTheme} but does not answer the question fully.`,
        `It gives a broader background, not the exact answer about ${theme}.`,
        `It points to a separate idea outside the scope of ${theme}.`,
      ],
    };

    const options = optionGroups[styleIndex];
    const uniqueOptions = Array.from(new Set(options.map((option) => option.trim()))).slice(0, 4);

    while (uniqueOptions.length < 4) {
      uniqueOptions.push(`A related but different interpretation of ${theme}.`);
    }

    return [
      { label: 'A', text: uniqueOptions[0] },
      { label: 'B', text: uniqueOptions[1] },
      { label: 'C', text: uniqueOptions[2] },
      { label: 'D', text: uniqueOptions[3] },
    ];
  }

  private static generateFallbackMCQ(sourceText: string): { questionText: string; options: MCQOption[]; correctAnswer: string; difficulty: 'easy' | 'medium' | 'hard' } {
    const cleaned = sourceText.replace(/\s+/g, ' ').trim();
    const tokens = cleaned.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? [];
    const stopWords = new Set([
      'what', 'which', 'when', 'where', 'why', 'how', 'does', 'do', 'is', 'are', 'was', 'were',
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'about', 'according', 'based',
      'uploaded', 'content', 'pdf', 'question', 'option', 'options', 'passage', 'idea', 'main', 'best',
      'describe', 'explain', 'write', 'short', 'note', 'significance', 'context', 'following', 'statement',
      'mentioned', 'mentioned', 'about', 'system', 'state', 'process', 'thread'
    ]);

    const focusTerms = Array.from(new Set(tokens.filter((word) => !stopWords.has(word)))).slice(0, 6);
    const primary = focusTerms.slice(0, 2).join(' ') || 'the topic';
    const secondary = focusTerms.slice(2, 4).join(' ') || 'a related concept';
    const tertiary = focusTerms.slice(4, 6).join(' ') || 'a supporting detail';
    const keyword = primary.charAt(0).toUpperCase() + primary.slice(1);
    const related = secondary.charAt(0).toUpperCase() + secondary.slice(1);
    const support = tertiary.charAt(0).toUpperCase() + tertiary.slice(1);

    const questionText = `Which statement best describes the main topic of the passage?`;
    const options = Array.from(new Set([
      `The passage mainly discusses ${keyword}.`,
      `The passage mainly discusses ${related}.`,
      `The passage mainly discusses ${support}.`,
      `The passage mainly discusses an unrelated topic.`,
    ]));

    while (options.length < 4) {
      options.push(`A different but related idea from the passage.`);
    }

    return {
      questionText,
      options: [
        { label: 'A', text: options[0] },
        { label: 'B', text: options[1] },
        { label: 'C', text: options[2] },
        { label: 'D', text: options[3] },
      ],
      correctAnswer: 'A',
      difficulty: 'medium',
    };
  }

  /**
   * Create a sharing token and QR code
   */
  static async createSharingLink(
    baseUrl: string,
    examId?: string,
    routePath: 'exam' | 'quiz' = 'exam'
  ): Promise<{ examId: string; qrCode: string; link: string }> {
    const resolvedExamId = examId || uuidv4();
    const quizLink = `${baseUrl}/${routePath}/${resolvedExamId}`;

    // Generate QR code as data URL (PNG)
    const qrCode = await QRCode.toDataURL(quizLink, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    return {
      examId: resolvedExamId,
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
