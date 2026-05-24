import { JobData, Section, Question } from '../types';
// @ts-ignore - uuid doesn't have typed import
import { v4 as uuidv4 } from 'uuid';

// Simulated AI service - Replace with actual LLM API call (Gemini, Groq, etc.)
export class AIService {
  static async generateQuestions(jobData: JobData): Promise<{ sections: Section[]; answerKey: string[]; timeAllowed: number }> {
    const { title, subject, className, questionTypes, additionalInfo } = jobData;

    // In production, this would call Gemini/Groq API:
    // const response = await llmClient.generate({...})

    // Simulating structured AI response based on inputs
    const sections: Section[] = [];
    const answerKey: string[] = [];

    const sectionNames = ['Section A', 'Section B', 'Section C'];
    const difficultyLevels: Array<'Easy' | 'Moderate' | 'Hard'> = ['Easy', 'Moderate', 'Hard'];

    let questionCounter = 1;

    for (let i = 0; i < questionTypes.length; i++) {
      const qt = questionTypes[i];
      const sectionQuestions: Question[] = [];

      for (let j = 0; j < qt.count; j++) {
        const difficulty = difficultyLevels[Math.floor(Math.random() * 3)];
        const questionText = this.generateQuestionText(qt.type, subject, difficulty, questionCounter);
        const answer = this.generateAnswer(qt.type, subject, questionCounter);

        sectionQuestions.push({
          id: `q-${questionCounter}`,
          text: questionText,
          difficulty,
          marks: qt.marks
        });

        answerKey.push(`${questionCounter}. ${answer}`);
        questionCounter++;
      }

      sections.push({
        title: sectionNames[i] || `Section ${String.fromCharCode(65 + i)}`,
        instruction: this.getInstruction(qt.type),
        questions: sectionQuestions
      });
    }

    const timeAllowed = additionalInfo?.toLowerCase().includes('hour') 
      ? parseInt(additionalInfo.match(/\d+/)?.[0] || '1') * 60 
      : 45;

    return { sections, answerKey, timeAllowed };
  }

  private static generateQuestionText(type: string, subject: string, difficulty: string, num: number): string {
    const templates: Record<string, string[]> = {
      'Multiple Choice Questions': [
        `What is the primary concept discussed in ${subject} regarding topic ${num}?`,
        `Which of the following best describes the fundamental principle of ${subject}?`,
        `Identify the correct statement about ${subject} from the options below.`,
        `What happens when [specific condition] in the context of ${subject}?`
      ],
      'Short Questions': [
        `Define the term related to ${subject} and explain its significance.`,
        `What is the role of [component] in the process of [phenomenon]?`,
        `Why does [observation] occur in ${subject}? Explain briefly.`,
        `Describe one example of [concept] in daily life.`,
        `Explain why [phenomenon] is said to have [property].`
      ],
      'Diagram/Graph-Based Questions': [
        `Draw a labeled diagram of [structure] and explain its parts.`,
        `Plot a graph showing the relationship between [variables] in ${subject}.`,
        `Analyze the given diagram and answer the following questions.`,
        `Construct a [type of diagram] to represent [data/concept].`
      ],
      'Numerical Problems': [
        `Calculate the [quantity] when [conditions are given]. [${difficulty}]`,
        `Solve: If [given data], find the [required quantity].`,
        `A [object] has [properties]. Determine the [result].`,
        `Using the formula [formula], compute the [value] for [scenario].`
      ],
      'Long Answer Questions': [
        `Explain with a diagram how [process] occurs in [context].`,
        `Describe in detail the [phenomenon/process] with relevant examples.`,
        `Compare and contrast [concept A] and [concept B] with proper reasoning.`,
        `Discuss the applications and implications of [topic] in real life.`
      ]
    };

    const typeTemplates = templates[type] || templates['Short Questions'];
    return typeTemplates[num % typeTemplates.length] || `Question ${num} about ${subject}`;
  }

  private static generateAnswer(type: string, subject: string, num: number): string {
    const answers: Record<string, string[]> = {
      'Multiple Choice Questions': [
        'Option (b) is correct. It accurately represents the fundamental principle.',
        'Option (c) is correct. The other options are partially true but incomplete.',
        'Option (a) is correct as per the standard definition.',
        'Option (d) is correct. All other options are factually incorrect.'
      ],
      'Short Questions': [
        'It is defined as [definition]. Its significance lies in [explanation].',
        'The role is to [function], enabling [outcome] in the process.',
        'It occurs due to [reason], which can be verified through [method].',
        'One example is [example], where we observe [phenomenon] clearly.',
        'It shows [property] because [scientific reasoning].'
      ],
      'Diagram/Graph-Based Questions': [
        'The diagram should show [components] with proper labels.',
        'The graph should be a straight line/curve with axes labeled.',
        'The diagram indicates [observation] which leads to [conclusion].',
        'The constructed diagram must include [essential elements].'
      ],
      'Numerical Problems': [
        'Given data: [data]. Using formula: [formula]. Solution: [steps] = [answer].',
        'Step 1: Identify known values. Step 2: Apply formula. Step 3: Calculate = [answer].',
        'Using the relation [equation], we get [answer] as the final result.',
        'By substituting values in [formula], we obtain [answer].'
      ],
      'Long Answer Questions': [
        'Detailed explanation with diagram showing [process]. Key points: [points].',
        'The process involves [steps]. Examples include [examples]. Implications: [details].',
        'Comparison table: [table]. Both differ in [aspects] but share [commonality].',
        'Applications: [list]. Implications: [discussion]. Conclusion: [summary].'
      ]
    };

    const typeAnswers = answers[type] || answers['Short Questions'];
    return typeAnswers[num % typeAnswers.length] || `Answer for question ${num}`;
  }

  private static getInstruction(type: string): string {
    const instructions: Record<string, string> = {
      'Multiple Choice Questions': 'Choose the correct answer from the given options.',
      'Short Questions': 'Attempt all questions. Each question carries the specified marks.',
      'Diagram/Graph-Based Questions': 'Draw neat and labeled diagrams wherever necessary.',
      'Numerical Problems': 'Show all working steps clearly. Use of calculator is permitted.',
      'Long Answer Questions': 'Answer in detail with proper examples and diagrams.'
    };
    return instructions[type] || 'Attempt all questions.';
  }
}
