import puppeteer from 'puppeteer';
import { Assignment } from '../types';

export class PDFService {
  static async generateQuestionPaperPDF(assignment: Assignment): Promise<Buffer> {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    const html = this.generateHTML(assignment);
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      scale: 0.92,
      preferCSSPageSize: true,
    });

    await browser.close();
    return pdf;
  }

  private static generateHTML(assignment: Assignment): string {
    const { schoolName, title, subject, className, timeAllowed = 45, totalMarks, sections } = assignment;

    const sectionsHTML = sections?.map((section, idx) => {
      const questionsHTML = section.questions.map((q, qIdx) => `
        <div class="question-item">
          <div class="question-header">
            <span class="question-num">${qIdx + 1}.</span>
            <span class="difficulty-badge difficulty-${q.difficulty.toLowerCase()}">${q.difficulty}</span>
            <span class="marks">[${q.marks} Marks]</span>
          </div>
          <p class="question-text">${q.text}</p>
        </div>
      `).join('');

      return `
        <div class="section">
          <h2 class="section-title">${section.title}</h2>
          <p class="section-instruction"><em>${section.instruction}</em></p>
          <div class="questions">${questionsHTML}</div>
        </div>
      `;
    }).join('') || '';

    const answerKeyHTML = '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A4; margin: 8mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.45; color: #111827; font-size: 12px; }
          .paper-container { max-width: 100%; margin: 0 auto; padding: 0; }
          .header { text-align: center; border-bottom: 2px double #111827; padding-bottom: 10px; margin-bottom: 12px; }
          .school-name { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
          .paper-title { font-size: 14px; margin: 6px 0; }
          .meta-info { display: flex; justify-content: space-between; margin: 12px 0 8px; font-size: 11px; }
          .student-info { margin: 12px 0; border: 1px solid #111827; padding: 10px; }
          .info-row { display: flex; margin: 6px 0; }
          .info-label { width: 96px; font-weight: bold; }
          .info-value { flex: 1; border-bottom: 1px solid #6b7280; margin-left: 8px; }
          .section { margin: 16px 0; page-break-inside: avoid; }
          .section-title { font-size: 14px; font-weight: bold; text-align: center; margin: 12px 0 6px; text-transform: uppercase; }
          .section-instruction { text-align: center; margin-bottom: 10px; color: #4b5563; font-size: 11px; }
          .question-item { margin: 10px 0; padding: 10px 12px; border-left: 2px solid #d1d5db; page-break-inside: avoid; }
          .question-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
          .question-num { font-weight: bold; font-size: 13px; }
          .difficulty-badge { padding: 1px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
          .difficulty-easy { background: #dcfce7; color: #166534; }
          .difficulty-moderate { background: #fef9c3; color: #854d0e; }
          .difficulty-hard { background: #fee2e2; color: #991b1b; }
          .marks { margin-left: auto; font-weight: bold; color: #374151; }
          .question-text { font-size: 12px; line-height: 1.55; }
          .note { margin-top: 10px; font-size: 10px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="paper-container">
          <div class="header">
            <div class="school-name">${schoolName}</div>
            <div class="paper-title">Subject: ${subject} | Class: ${className}</div>
            <div class="paper-title">${title}</div>
          </div>

          <div class="meta-info">
            <span>Time Allowed: ${timeAllowed} minutes</span>
            <span>Maximum Marks: ${totalMarks}</span>
          </div>

          <p class="note">All questions are compulsory unless stated otherwise.</p>

          <div class="student-info">
            <div class="info-row"><span class="info-label">Name:</span><span class="info-value"></span></div>
            <div class="info-row"><span class="info-label">Roll Number:</span><span class="info-value"></span></div>
            <div class="info-row"><span class="info-label">Class & Section:</span><span class="info-value"></span></div>
          </div>

          ${sectionsHTML}

          <p class="note" style="margin-top: 30px;">--- End of Question Paper ---</p>
        </div>
      </body>
      </html>
    `;
  }
}
