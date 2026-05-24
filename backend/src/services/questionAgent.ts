import { GeneratedPaperDraft, JobData, ParsedDocument, Question, RetrievedContext, Section } from '../types';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'were', 'have', 'has', 'had', 'into', 'onto',
  'your', 'you', 'their', 'they', 'them', 'there', 'what', 'when', 'where', 'which', 'who', 'whom', 'why', 'how',
  'about', 'into', 'over', 'under', 'between', 'among', 'within', 'without', 'subject', 'chapter', 'lesson', 'class',
  'student', 'students', 'teacher', 'school', 'paper', 'question', 'questions', 'pdf'
]);

export class QuestionAgent {
  static async generatePaper(
    jobData: JobData,
    document: ParsedDocument,
    contexts: RetrievedContext[]
  ): Promise<GeneratedPaperDraft> {
    const keywords = this.extractKeywords(document.text, jobData.subject);
    const sourceThemes = this.pickThemes(contexts, keywords, jobData.subject);

    const sections: Section[] = jobData.questionTypes.map((qt, index) => {
      const sectionTheme = sourceThemes[index] || keywords[index] || jobData.subject;
      const questions: Question[] = [];

      for (let i = 0; i < qt.count; i++) {
        const questionNumber = questions.length + 1;
        const difficulty = this.pickDifficulty(index, i, document.wordCount);
        const questionContext = contexts[(index * 7 + i) % Math.max(contexts.length, 1)]?.text || sectionTheme;
        const text = this.buildQuestionText(qt.type, sectionTheme, questionContext, jobData, questionNumber, i);

        questions.push({
          id: `q-${index + 1}-${questionNumber}`,
          text,
          difficulty,
          marks: qt.marks,
        });
      }

      return {
        title: `Section ${String.fromCharCode(65 + index)}`,
        instruction: this.getInstruction(qt.type),
        questions,
      };
    });

    const answerKey = sections.flatMap((section, sectionIndex) =>
      section.questions.map((question, questionIndex) => {
        const source = sourceThemes[sectionIndex] || keywords[0] || jobData.subject;
        const answerContext = contexts[(sectionIndex * 7 + questionIndex) % Math.max(contexts.length, 1)]?.text || source;
        return `${sectionIndex + 1}.${questionIndex + 1} ${this.answerHint(question.text, source, answerContext)}`;
      })
    );

    const timeAllowed = this.estimateTime(document.wordCount, jobData.additionalInfo);

    return { sections, answerKey, timeAllowed };
  }

  private static getInstruction(type: string): string {
    const instructions: Record<string, string> = {
      'Multiple Choice Questions': 'Choose the correct answer from the uploaded content.',
      'Short Questions': 'Attempt all questions using the uploaded PDF as the source.',
      'Diagram/Graph-Based Questions': 'Draw neat and labeled diagrams based on the uploaded content.',
      'Numerical Problems': 'Show all working steps clearly and use the given data from the PDF.',
      'Long Answer Questions': 'Answer in detail with examples taken from the uploaded content.',
      'Fill in the Blanks': 'Use the important terms and facts from the uploaded content.',
      'True/False': 'Mark each statement true or false and justify briefly.',
      'Match the Following': 'Match the items using the uploaded content as the reference.',
    };

    return instructions[type] || 'Attempt all questions using the uploaded content.';
  }

  private static extractKeywords(text: string, subject: string): string[] {
    const words = text
      .toLowerCase()
      .match(/[a-z]{4,}/g) || [];

    const counts = new Map<string, number>();

    for (const word of words) {
      if (STOP_WORDS.has(word)) {
        continue;
      }

      counts.set(word, (counts.get(word) ?? 0) + 1);
    }

    const ranked = [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([word]) => word);

    const subjectTokens = subject
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.replace(/[^a-z]/g, ''))
      .filter(Boolean);

    return [...new Set([...subjectTokens, ...ranked])].slice(0, 10);
  }

  private static pickThemes(contexts: RetrievedContext[], keywords: string[], subject: string): string[] {
    if (contexts.length === 0) {
      return keywords.length > 0 ? keywords : [subject];
    }

    return contexts.map((context, index) => {
      const snippet = context.text
        .split(/(?<=[.!?])\s+/)
        .slice(0, 2)
        .join(' ')
        .trim();

      if (snippet) {
        return snippet.length > 110 ? `${snippet.slice(0, 107)}...` : snippet;
      }

      return keywords[index] || subject;
    }).slice(0, 8);
  }

  private static pickDifficulty(sectionIndex: number, questionIndex: number, wordCount: number): 'Easy' | 'Moderate' | 'Hard' {
    const pattern: Array<'Easy' | 'Moderate' | 'Hard'> = wordCount > 1500
      ? ['Easy', 'Moderate', 'Moderate', 'Hard']
      : ['Easy', 'Easy', 'Moderate', 'Hard'];

    return pattern[(sectionIndex + questionIndex) % pattern.length];
  }

  private static buildQuestionText(
    type: string,
    theme: string,
    contextText: string,
    jobData: JobData,
    number: number,
    index: number
  ): string {
    const contentRef = theme || jobData.subject;
    const contextSnippet = contextText
      .split(/(?<=[.!?])\s+/)
      .slice(0, 2)
      .join(' ')
      .trim();

    const templates: Record<string, string[]> = {
      'Multiple Choice Questions': [
        `According to the uploaded content, which statement best describes ${contentRef}?`,
        `What is the main idea of the passage about ${contentRef}?`,
        `Which option best matches the idea discussed in the PDF about ${contentRef}?`,
      ],
      'Short Questions': [
        `Explain ${contentRef} in your own words using the uploaded content as reference.`,
        `What is the significance of ${contentRef} in the context of ${jobData.subject}?`,
        `Write a short note on ${contentRef} based on the PDF passage.`,
      ],
      'Diagram/Graph-Based Questions': [
        `Draw a neat labeled diagram to represent ${contentRef} from the uploaded material.`,
        `Create a graph/flowchart that summarizes ${contentRef} mentioned in the PDF.`,
      ],
      'Numerical Problems': [
        `Using the values and ideas from the uploaded content, solve a numerical problem related to ${contentRef}.`,
        `Calculate an answer based on the example linked to ${contentRef} in the PDF.`,
      ],
      'Long Answer Questions': [
        `Discuss ${contentRef} in detail with examples taken from the uploaded content.`,
        `Explain the concept of ${contentRef} and connect it to the broader lesson in the PDF.`,
      ],
      'Fill in the Blanks': [
        `Fill in the blanks using the key terms from the uploaded content about ${contentRef}.`,
      ],
      'True/False': [
        `State whether the following statement about ${contentRef} is true or false and justify your answer.`,
      ],
      'Match the Following': [
        `Match the following terms and descriptions based on the PDF section about ${contentRef}.`,
      ],
    };

    const pool = templates[type] || templates['Short Questions'];
    const baseQuestion = pool[(number + index) % pool.length] || `Question on ${contentRef} from the uploaded content.`;

    if (!contextSnippet) {
      return baseQuestion;
    }

    return `${baseQuestion} Hint: ${contextSnippet}`;
  }

  private static answerHint(questionText: string, source: string, contextText: string): string {
    const lowerQuestion = questionText.toLowerCase();
    const extracted = this.extractRelevantSentence(questionText, contextText);

    if (/mcq|option|which/i.test(questionText)) {
      return extracted || `The best answer should directly match the key idea about ${source}.`;
    }

    if (/diagram|graph|flowchart/i.test(questionText)) {
      return extracted || `The response should show the main parts of ${source} clearly and label them properly.`;
    }

    if (/numerical|calculate|solve/i.test(questionText)) {
      return extracted || `Show the formula, steps, and final value related to ${source}.`;
    }

    if (lowerQuestion.includes('true or false')) {
      return extracted || `State whether it is true or false and justify with one line from the source about ${source}.`;
    }

    return extracted || `Write a concise answer based on the source content about ${source}.`;
  }

  private static extractRelevantSentence(questionText: string, contextText: string): string {
    if (!contextText.trim()) {
      return '';
    }

    const questionKeywords = questionText
      .toLowerCase()
      .match(/[a-z]{4,}/g)
      ?.filter((word) => !STOP_WORDS.has(word)) ?? [];

    const sentences = contextText
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    let bestSentence = '';
    let bestScore = 0;

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const score = questionKeywords.reduce((total, keyword) => total + (lowerSentence.includes(keyword) ? 1 : 0), 0);

      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence;
      }
    }

    if (!bestSentence) {
      bestSentence = sentences[0] || '';
    }

    if (!bestSentence) {
      return '';
    }

    return bestSentence.length > 220 ? `${bestSentence.slice(0, 217)}...` : bestSentence;
  }

  private static estimateTime(wordCount: number, additionalInfo?: string): number {
    if (additionalInfo?.toLowerCase().includes('hour')) {
      return parseInt(additionalInfo.match(/\d+/)?.[0] || '1', 10) * 60;
    }

    if (wordCount > 2000) {
      return 90;
    }

    if (wordCount > 1000) {
      return 60;
    }

    return 45;
  }
}