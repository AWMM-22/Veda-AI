import { JobData, Section, Question } from '../types';
// @ts-ignore - uuid doesn't have typed import
import { v4 as uuidv4 } from 'uuid';

export class AIService {
  private static readonly GROQ_API_KEY = process.env.GROQ_API_KEY;
  private static readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  private static readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate';

  static async generateQuestions(jobData: JobData): Promise<{ sections: Section[]; answerKey: string[]; timeAllowed: number }> {
    const { title, subject, className, questionTypes, additionalInfo, fileUrl } = jobData;

    try {
      // Try to use available AI models (Groq and/or Gemini)
      if ((this.GROQ_API_KEY || this.GEMINI_API_KEY) && additionalInfo) {
        return await this.generateQuestionsWithModels(jobData);
      }
    } catch (error) {
      console.error('AI generation error, falling back to template generation:', error);
    }

    // Fallback to template-based generation
    return this.generateQuestionsFromTemplates(jobData);
  }

  private static async generateQuestionsWithGroq(jobData: JobData): Promise<{ sections: Section[]; answerKey: string[]; timeAllowed: number }> {
    const { title, subject, className, questionTypes, additionalInfo } = jobData;
    const sections: Section[] = [];
    const answerKey: string[] = [];
    let questionCounter = 1;

    for (let i = 0; i < questionTypes.length; i++) {
      const qt = questionTypes[i];
      const sectionQuestions: Question[] = [];

      const prompt = `Generate ${qt.count} unique and well-structured ${qt.type} questions on the subject "${subject}" for class ${className}.
Topic: ${title}
Additional context: ${additionalInfo}

Requirements:
- Create ${qt.count} distinct questions with varied difficulty (Easy/Moderate/Hard)
- Each question should be clear and well-formatted
- Make questions engaging and based on real-world concepts
- Format as JSON array with structure: [{"text": "question", "difficulty": "Easy|Moderate|Hard"}, ...]

Return ONLY valid JSON array, no additional text.`;

      try {
        const response = await fetch(this.GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mixtral-8x7b-32768',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          })
        });

        if (!response.ok) {
          throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = (await response.json()) as any;
        const content = data.choices?.[0]?.message?.content || '';
        
        // Parse JSON response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const generatedQuestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        for (const q of generatedQuestions) {
          sectionQuestions.push({
            id: `q-${questionCounter}`,
            text: q.text || `Question ${questionCounter}`,
            difficulty: q.difficulty || 'Moderate',
            marks: qt.marks
          });

          // Generate answer hint using AI
          const answerHint = await this.generateAnswerWithGroq(q.text, subject);
          answerKey.push(`${questionCounter}. ${answerHint}`);
          questionCounter++;
        }
      } catch (error) {
        console.error(`Error generating questions for section ${i + 1}:`, error);
        // Fallback to template generation for this section
        for (let j = 0; j < qt.count; j++) {
          const questionText = this.generateQuestionText(qt.type, subject, 'Moderate', questionCounter);
          sectionQuestions.push({
            id: `q-${questionCounter}`,
            text: questionText,
            difficulty: 'Moderate',
            marks: qt.marks
          });
          answerKey.push(`${questionCounter}. Sample answer based on course content.`);
          questionCounter++;
        }
      }

      sections.push({
        title: `Section ${String.fromCharCode(65 + i)}`,
        instruction: this.getInstruction(qt.type),
        questions: sectionQuestions
      });
    }

    const timeAllowed = additionalInfo?.toLowerCase().includes('hour')
      ? parseInt(additionalInfo.match(/\d+/)?.[0] || '1') * 60
      : 45;

    return { sections, answerKey, timeAllowed };
  }

  private static async generateAnswerWithGroq(question: string, subject: string): Promise<string> {
    try {
      const prompt = `Given this question about ${subject}:
"${question}"

Provide a concise answer hint (1-2 sentences) that guides toward the correct answer but doesn't give it away completely.
Return ONLY the answer hint, no quotes or formatting.`;

      const response = await fetch(this.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 150,
        })
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        return data.choices?.[0]?.message?.content || 'Refer to course materials for answer.';
      }
    } catch (error) {
      console.error('Error generating answer hint:', error);
    }

    return 'Refer to course materials for answer.';
  }

  // Combined generation using available models (Groq + Gemini) to increase diversity
  private static async generateQuestionsWithModels(jobData: JobData): Promise<{ sections: Section[]; answerKey: string[]; timeAllowed: number }> {
    const { questionTypes } = jobData;
    const sections: Section[] = [];
    const answerKey: string[] = [];
    let qCounter = 1;

    for (let i = 0; i < questionTypes.length; i++) {
      const qt = questionTypes[i];
      const desired = qt.count;
      const results: Question[] = [];

      // Try Groq first
      if (this.GROQ_API_KEY) {
        try {
          const groqRes = await this.generateQuestionsWithGroqSection(jobData, qt);
          results.push(...groqRes);
        } catch (err) {
          console.error('Groq section error:', err);
        }
      }

      // Then Gemini to diversify
      if (this.GEMINI_API_KEY) {
        try {
          const gemRes = await this.generateWithGemini(jobData, qt);
          results.push(...gemRes);
        } catch (err) {
          console.error('Gemini section error:', err);
        }
      }

      // Sanitize and dedupe
      const cleaned = this.dedupeQuestions(results.map((q) => ({
        id: q.id,
        text: this.sanitizeQuestionText(q.text),
        difficulty: q.difficulty || 'Moderate',
        marks: q.marks || qt.marks
      })));

      // If still not enough, fill with template-based
      while (cleaned.length < desired) {
        const text = this.generateQuestionText(qt.type, jobData.subject, 'Moderate', qCounter);
        cleaned.push({ id: `q-${qCounter}`, text, difficulty: 'Moderate', marks: qt.marks });
        qCounter++;
      }

      const final = cleaned.slice(0, desired).map((q, idx) => ({ ...q, id: `q-${i + 1}-${idx + 1}` }));

      // Push to sections and build answer key
      sections.push({ title: `Section ${String.fromCharCode(65 + i)}`, instruction: this.getInstruction(qt.type), questions: final });

      for (const ques of final) {
        // Try model answer hint generation using Groq if available, else generic hint
        const hint = this.GROQ_API_KEY ? await this.generateAnswerWithGroq(ques.text, jobData.subject) : 'Refer to course materials for answer.';
        answerKey.push(`${qCounter}. ${hint}`);
        qCounter++;
      }
    }

    const timeAllowed = jobData.additionalInfo?.toLowerCase().includes('hour')
      ? parseInt(jobData.additionalInfo.match(/\d+/)?.[0] || '1') * 60
      : 45;

    return { sections, answerKey, timeAllowed };
  }

  // Helper: call Groq per-section but return Questions only (used by ensemble)
  private static async generateQuestionsWithGroqSection(jobData: JobData, qt: any): Promise<Question[]> {
    const temp = await this.generateQuestionsWithGroq({ ...jobData, questionTypes: [qt] } as JobData);
    const sec = temp.sections?.[0];
    return sec?.questions || [];
  }

  // Helper: call Gemini model (best-effort parsing similar to Groq)
  private static async generateWithGemini(jobData: JobData, qt: any): Promise<Question[]> {
    const { title, subject, className, additionalInfo } = jobData;
    const prompt = `Generate ${qt.count} original ${qt.type} questions on the subject "${subject}" for class ${className}. Topic: ${title}. Additional context: ${additionalInfo}. Requirements: produce distinct questions, avoid phrasing like \"from the PDF\" or \"based on the uploaded content\". Return a JSON array like [{\"text\": \"...\", \"difficulty\": \"Easy|Moderate|Hard\"}, ...]`;

    try {
      const url = this.GEMINI_API_URL + (this.GEMINI_API_KEY ? `?key=${this.GEMINI_API_KEY}` : '');
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_output_tokens: 1024 })
      });

      if (!resp.ok) throw new Error(`Gemini API error: ${resp.statusText}`);
      const data = (await resp.json()) as any;
      const text = data.candidates?.[0]?.output || data.output?.[0]?.content || JSON.stringify(data);
      const jsonMatch = (text as string).match(/\[[\s\S]*\]/);
      const generated = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      return generated.map((q: any, idx: number) => ({ id: `g-${idx + 1}`, text: q.text || `Question ${idx + 1}`, difficulty: q.difficulty || 'Moderate', marks: qt.marks }));
    } catch (err) {
      console.error('Gemini generation failed:', err);
      return [];
    }
  }

  // Remove boilerplate phrases and short duplicative questions
  private static sanitizeQuestionText(text: string): string {
    if (!text) return text;
    let t = text.replace(/\s+/g, ' ').trim();
    // Remove common unwanted phrases
    t = t.replace(/from the (uploaded )?pdf/ig, '');
    t = t.replace(/based on the (uploaded )?content/ig, '');
    t = t.replace(/according to the (uploaded )?content/ig, '');
    t = t.replace(/as mentioned in the (pdf|document|uploaded content)/ig, '');
    t = t.replace(/in the uploaded content/ig, '');
    t = t.replace(/based on the material/ig, '');
    t = t.replace(/please answer the following question:?/ig, '');
    t = t.replace(/\"/g, '');
    return t.trim();
  }

  private static dedupeQuestions(questions: Question[]): Question[] {
    const seen = new Set<string>();
    const out: Question[] = [];
    for (const q of questions) {
      const key = q.text.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 120);
      if (!seen.has(key) && q.text.trim().length > 15) {
        seen.add(key);
        out.push(q);
      }
    }
    return out;
  }

  private static generateQuestionsFromTemplates(jobData: JobData): { sections: Section[]; answerKey: string[]; timeAllowed: number } {
    const { title, subject, className, questionTypes, additionalInfo } = jobData;
    const sections: Section[] = [];
    const answerKey: string[] = [];

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
        title: `Section ${String.fromCharCode(65 + i)}`,
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
