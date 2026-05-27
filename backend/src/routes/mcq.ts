import express, { Request, Response } from 'express';
import multer, { StorageEngine } from 'multer';
import path from 'path';
import { MCQAssignmentModel } from '../models/MCQAssignment';
import { StudentResponseModel } from '../models/StudentResponse';
import { AssignmentModel } from '../models/Assignment';
import { MCQService } from '../services/mcqService';
import { DocumentAgent } from '../services/documentAgent';
import { MCQ, MCQAssignment } from '../types';

// Multer setup for file uploads
const storage: StorageEngine = multer.diskStorage({
  destination: (req: any, file: any, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'uploads/');
  },
  filename: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();
const BASE_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL?.split(',')[0] || 'https://veda-ai-pied.vercel.app';

const buildExamPayload = (mcqAssignment: any) => ({
  _id: mcqAssignment._id,
  title: mcqAssignment.title,
  description: mcqAssignment.description,
  totalQuestions: mcqAssignment.mcqs.length,
  totalMarks: mcqAssignment.totalMarks,
  timeLimit: mcqAssignment.timeLimit,
  examId: mcqAssignment.examId || mcqAssignment.sharingToken,
  questions: mcqAssignment.mcqs.map((mcq: any, idx: number) => ({
    id: idx,
    questionText: mcq.questionText,
    options: mcq.options,
    marks: mcq.marks || 1,
  })),
});

const findExamById = async (examId: string) => {
  return MCQAssignmentModel.findOne({
    $or: [{ examId }, { sharingToken: examId }],
  });
};

const respondWithExam = async (req: Request, res: Response, examId: string) => {
  const mcqAssignment = await findExamById(examId);
  if (!mcqAssignment) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  if (mcqAssignment.status !== 'active') {
    return res.status(403).json({ error: 'This exam is not available' });
  }

  res.json({ success: true, quiz: buildExamPayload(mcqAssignment) });
};

const submitExam = async (req: Request, res: Response, examId: string) => {
  try {
    const { rollNumber, studentName, responses } = req.body;

    if (!rollNumber || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Missing required fields: rollNumber, responses' });
    }

    const mcqAssignment = await findExamById(examId);
    if (!mcqAssignment) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const existingResponse = await StudentResponseModel.findOne({
      examId: mcqAssignment.examId || mcqAssignment.sharingToken,
      rollNumber,
    });

    if (existingResponse) {
      return res.status(400).json({ error: 'You have already submitted this exam' });
    }

    const mcqsArray = mcqAssignment.mcqs.map((mcq: any) => ({
      questionText: mcq.questionText,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer,
      marks: mcq.marks || 1,
      topic: mcq.topic,
      difficulty: mcq.difficulty,
    }));
    const { score, totalMarks, percentage } = MCQService.calculateScore(mcqsArray, responses);

    const studentResponse = new StudentResponseModel({
      mcqAssignmentId: mcqAssignment._id,
      examId: mcqAssignment.examId || mcqAssignment.sharingToken,
      rollNumber,
      studentName: studentName || `Student-${rollNumber}`,
      responses,
      score,
      totalMarks,
      percentage,
    });

    await studentResponse.save();

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      result: {
        score,
        totalMarks,
        percentage,
        rollNumber,
        studentName: studentName || `Student-${rollNumber}`,
      },
    });
  } catch (error: any) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ error: error.message });
  }
};

// ⚠️ IMPORTANT: Keep specific routes BEFORE dynamic routes
// This ensures /mcq/list matches before /mcq/:assignmentId

/**
 * GET /mcq/list
 * Get all MCQ assignments (for ranking page)
 */
router.get('/mcq/list', async (req: Request, res: Response) => {
  try {
    const mcqAssignments = await MCQAssignmentModel.find()
      .sort({ createdAt: -1 })
      .select('_id title description totalMarks status createdAt');

    // Get student count for each MCQ
    const quizzes = await Promise.all(
      mcqAssignments.map(async (mcq) => {
        const studentCount = await StudentResponseModel.countDocuments({
          mcqAssignmentId: mcq._id,
        });
        return {
          _id: mcq._id,
          title: mcq.title,
          description: mcq.description,
          totalMarks: mcq.totalMarks,
          status: mcq.status,
          studentCount,
          createdAt: mcq.createdAt,
        };
      })
    );

    res.json({
      success: true,
      quizzes,
    });
  } catch (error: any) {
    console.error('Error listing MCQs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /exam/:examId
 * Public endpoint for students.
 */
router.get('/exam/:examId', async (req: Request, res: Response) => {
  try {
    await respondWithExam(req, res, req.params.examId);
  } catch (error: any) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /exam/:examId/submit
 * Student submits responses.
 */
router.post('/exam/:examId/submit', async (req: Request, res: Response) => {
  await submitExam(req, res, req.params.examId);
});

/**
 * Backward compatible quiz aliases.
 */
router.get('/quiz/:token', async (req: Request, res: Response) => {
  await respondWithExam(req, res, req.params.token);
});

router.post('/quiz/:token/submit', async (req: Request, res: Response) => {
  await submitExam(req, res, req.params.token);
});

/**
 * POST /mcq/create-from-pdf
 * Create MCQs directly from uploaded PDF without full question paper
 */
router.post('/mcq/create-from-pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { title, description, className, subject, schoolName } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    // Get file URL from upload
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    if (!fileUrl) {
      return res.status(400).json({ error: 'file is required' });
    }

    // Create a temporary assignment first (for organization)
    const assignment = new AssignmentModel({
      title,
      subject: subject || 'General',
      className: className || 'Class',
      schoolName: schoolName || 'School',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      questionTypes: [],
      totalQuestions: 0,
      totalMarks: 0,
      fileUrl,
      status: 'completed',
    });
    await assignment.save();

    // Parse PDF
    const parsedDoc = await DocumentAgent.parseUploadedPdf(fileUrl);

    // Generate MCQs from text (simplified - using first 20 chunks)
    const mcqs: MCQ[] = [];
    const chunks = parsedDoc.chunks.slice(0, 20); // Limit to 20 chunks for MCQ generation
    
    for (const [idx, chunk] of chunks.entries()) {
      const words = chunk.split(' ');
      const questionStart = words.slice(0, Math.min(18, words.length)).join(' ');
      const sourceQuestion = `What is the key idea described in this passage: "${questionStart}..."?`;

      mcqs.push(await MCQService.generateMCQFromText(sourceQuestion, 1, idx));
    }

    // Create exam link and QR code
    const { examId, qrCode, link } = await MCQService.createSharingLink(BASE_URL, undefined, 'exam');

    // Calculate total marks
    const totalMarks = mcqs.length;

    // Create MCQAssignment
    const mcqAssignment = new MCQAssignmentModel({
      assignmentId: assignment._id,
      examId,
      mcqs,
      title: title,
      description: description || `MCQ Quiz from ${title}`,
      sharingToken: examId,
      qrCode,
      qrUrl: link,
      totalMarks,
      status: 'active', // Auto-activate for quick sharing
    });

    await mcqAssignment.save();

    res.json({
      success: true,
      mcqAssignment: {
        _id: mcqAssignment._id,
        title: mcqAssignment.title,
        description: mcqAssignment.description,
        totalQuestions: mcqs.length,
        totalMarks,
        examId,
        sharingToken: examId,
        qrCode,
        quizLink: link,
        qrUrl: link,
        status: 'active',
        assignmentId: assignment._id,
      },
    });
  } catch (error: any) {
    console.error('Error creating MCQ from PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /mcq/:assignmentId/generate
 * Auto-generate MCQs from existing question paper
 */
router.post('/mcq/:assignmentId/generate', async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { title, description } = req.body;

    // Get the assignment with sections
    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Generate MCQs from sections
    const mcqs = await MCQService.generateFromQuestionPaper(assignment.sections || []);

    // Create exam link and QR code
    const { examId, qrCode, link } = await MCQService.createSharingLink(BASE_URL, undefined, 'exam');

    // Calculate total marks (1 mark per question)
    const totalMarks = mcqs.length;

    // Create MCQAssignment
    const mcqAssignment = new MCQAssignmentModel({
      assignmentId,
      examId,
      mcqs,
      title: title || `MCQ Quiz - ${assignment.title}`,
      description,
      sharingToken: examId,
      qrCode,
      qrUrl: link,
      totalMarks,
      status: 'draft',
    });

    await mcqAssignment.save();

    res.json({
      success: true,
      mcqAssignment: {
        _id: mcqAssignment._id,
        title: mcqAssignment.title,
        description: mcqAssignment.description,
        totalQuestions: mcqs.length,
        totalMarks,
        examId,
        sharingToken: examId,
        qrCode,
        quizLink: link,
        qrUrl: link,
        status: 'draft',
      },
    });
  } catch (error: any) {
    console.error('Error generating MCQs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /mcq/:assignmentId/create
 * Manually create MCQs (teacher input)
 */
router.post('/mcq/:assignmentId/create', async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, mcqs } = req.body;

    // Validate MCQs
    const validationErrors: string[] = [];
    for (const mcq of mcqs) {
      const validation = MCQService.validateMCQ(mcq);
      if (!validation.valid) {
        validationErrors.push(...validation.errors);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Invalid MCQs', details: validationErrors });
    }

    // Create exam link and QR code
    const { examId, qrCode, link } = await MCQService.createSharingLink(BASE_URL, undefined, 'exam');

    // Calculate total marks
    const totalMarks = mcqs.reduce((sum: number, mcq: MCQ) => sum + (mcq.marks || 1), 0);

    // Create MCQAssignment
    const mcqAssignment = new MCQAssignmentModel({
      assignmentId,
      examId,
      mcqs,
      title,
      description,
      sharingToken: examId,
      qrCode,
      qrUrl: link,
      totalMarks,
      status: 'draft',
    });

    await mcqAssignment.save();

    res.json({
      success: true,
      mcqAssignment: {
        _id: mcqAssignment._id,
        title: mcqAssignment.title,
        description: mcqAssignment.description,
        totalQuestions: mcqs.length,
        totalMarks,
        examId,
        sharingToken: examId,
        qrCode,
        quizLink: link,
        qrUrl: link,
        status: 'draft',
      },
    });
  } catch (error: any) {
    console.error('Error creating MCQs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /mcq/:assignmentId
 * Get MCQ assignment with all MCQs (teacher view)
 */
router.get('/mcq/:assignmentId', async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const mcqAssignment = await MCQAssignmentModel.findOne({ assignmentId });
    if (!mcqAssignment) {
      return res.status(404).json({ error: 'MCQ Assignment not found' });
    }

    const examId = mcqAssignment.examId || mcqAssignment.sharingToken;
    const quizLink = mcqAssignment.qrUrl || `${BASE_URL}/exam/${examId}`;

    res.json({
      success: true,
      mcqAssignment: {
        _id: mcqAssignment._id,
        title: mcqAssignment.title,
        description: mcqAssignment.description,
        totalQuestions: mcqAssignment.mcqs.length,
        totalMarks: mcqAssignment.totalMarks,
        examId,
        sharingToken: mcqAssignment.sharingToken,
        qrCode: mcqAssignment.qrCode,
        qrUrl: quizLink,
        quizLink,
        status: mcqAssignment.status,
        mcqs: mcqAssignment.mcqs,
        createdAt: mcqAssignment.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching MCQ assignment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /mcq/:mcqAssignmentId/update
 * Update MCQ assignment status or questions
 */
router.patch('/mcq/:mcqAssignmentId/update', async (req: Request, res: Response) => {
  try {
    const { mcqAssignmentId } = req.params;
    const { status, mcqs } = req.body;

    const mcqAssignment = await MCQAssignmentModel.findById(mcqAssignmentId);
    if (!mcqAssignment) {
      return res.status(404).json({ error: 'MCQ Assignment not found' });
    }

    if (status) {
      mcqAssignment.status = status;
    }

    if (mcqs) {
      // Validate new MCQs
      const validationErrors: string[] = [];
      for (const mcq of mcqs) {
        const validation = MCQService.validateMCQ(mcq);
        if (!validation.valid) {
          validationErrors.push(...validation.errors);
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Invalid MCQs', details: validationErrors });
      }

      mcqAssignment.mcqs = mcqs;
      mcqAssignment.totalMarks = mcqs.reduce((sum: number, mcq: MCQ) => sum + (mcq.marks || 1), 0);
    }

    await mcqAssignment.save();

    res.json({
      success: true,
      message: 'MCQ assignment updated',
      mcqAssignment,
    });
  } catch (error: any) {
    console.error('Error updating MCQ assignment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /mcq/:mcqAssignmentId/results
 * Get ranking and results (teacher only)
 */
router.get('/mcq/:mcqAssignmentId/results', async (req: Request, res: Response) => {
  try {
    const { mcqAssignmentId } = req.params;

    const mcqAssignment = await MCQAssignmentModel.findById(mcqAssignmentId);
    if (!mcqAssignment) {
      return res.status(404).json({ error: 'MCQ Assignment not found' });
    }

    // Get all student responses
    const responses = await StudentResponseModel.find({ mcqAssignmentId });

    if (responses.length === 0) {
      return res.json({
        success: true,
        results: {
          totalStudents: 0,
          ranking: [],
          statistics: {
            averageScore: 0,
            averagePercentage: 0,
            highestScore: 0,
            lowestScore: 0,
          },
        },
      });
    }

    // Generate ranking
    const ranking = MCQService.generateRanking(
      responses.map(r => ({
        rollNumber: r.rollNumber,
        studentName: r.studentName || undefined,
        score: r.score,
        percentage: r.percentage,
        submittedAt: r.submittedAt || new Date(),
      }))
    );

    // Calculate statistics
    const scores = responses.map(r => r.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const percentages = responses.map(r => r.percentage);
    const averagePercentage = percentages.reduce((a, b) => a + b, 0) / percentages.length;

    res.json({
      success: true,
      results: {
        totalStudents: responses.length,
        ranking,
        statistics: {
          averageScore: Math.round(averageScore * 100) / 100,
          averagePercentage: Math.round(averagePercentage * 100) / 100,
          highestScore: Math.max(...scores),
          lowestScore: Math.min(...scores),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
