import { Assignment, GeneratedPaperDraft, ParsedDocument } from '../types';

export class PaperAgent {
  static assemblePaper(
    assignment: Assignment,
    document: ParsedDocument,
    draft: GeneratedPaperDraft
  ): Partial<Assignment> {
    const totalQuestions = draft.sections.reduce((sum, section) => sum + section.questions.length, 0);
    const totalMarks = draft.sections.reduce(
      (sum, section) => sum + section.questions.reduce((marks, question) => marks + question.marks, 0),
      0
    );

    return {
      sourceText: document.text,
      sourceChunks: document.chunks,
      sourceSummary: document.chunks[0]?.slice(0, 300) ?? document.text.slice(0, 300),
      sections: draft.sections,
      answerKey: draft.answerKey,
      timeAllowed: draft.timeAllowed,
      totalQuestions,
      totalMarks,
      status: 'completed',
    };
  }
}