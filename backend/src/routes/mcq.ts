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
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination?: string) => void) => {
    cb(null, 'uploads/');
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename?: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3002';

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
    
    chunks.forEach((chunk, idx) => {
      // Create a simple MCQ from each chunk
      const words = chunk.split(' ');
      const questionStart = words.slice(0, Math.min(10, words.length)).join(' ');
      
      mcqs.push({
        questionText: `What is mentioned about: "${questionStart}..."?`,
        options: [
          { label: 'A', text: 'It is important and relevant' },
          { label: 'B', text: 'It is secondary information' },
          { label: 'C', text: 'It is mentioned in passing' },
          { label: 'D', text: 'It is not clearly stated' },
        ],
        correctAnswer: 'A',
        marks: 1,
        topic: `Topic ${idx + 1}`,
        difficulty: 'medium',
      });
    });

    // Create sharing link and QR code
    const { token, qrCode, link } = await MCQService.createSharingLink(BASE_URL);

    // Calculate total marks
    const totalMarks = mcqs.length;

    // Create MCQAssignment
    const mcqAssignment = new MCQAssignmentModel({
      assignmentId: assignment._id,
      mcqs,
      title: title,
      description: description || `MCQ Quiz from ${title}`,
      sharingToken: token,
      qrCode,
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
        sharingToken: token,
        qrCode,
        quizLink: link,
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
    const mcqs = MCQService.generateFromQuestionPaper(assignment.sections || []);

    // Create sharing link and QR code
    const { token, qrCode, link } = await MCQService.createSharingLink(BASE_URL);

    // Calculate total marks (1 mark per question)
    const totalMarks = mcqs.length;

    // Create MCQAssignment
    const mcqAssignment = new MCQAssignmentModel({
      assignmentId,
      mcqs,
      title: title || `MCQ Quiz - ${assignment.title}`,
      description,
      sharingToken: token,
      qrCode,
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
        sharingToken: token,
        qrCode,
        quizLink: link,
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

    // Create sharing link and QR code
    const { token, qrCode, link } = await MCQService.createSharingLink(BASE_URL);

    // Calculate total marks
    const totalMarks = mcqs.reduce((sum: number, mcq: MCQ) => sum + (mcq.marks || 1), 0);

    // Create MCQAssignment
    const mcqAssignment = new MCQAssignmentModel({
      assignmentId,
      mcqs,
      title,
      description,
      sharingToken: token,
      qrCode,
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
        sharingToken: token,
        qrCode,
        quizLink: link,
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

    const quizLink = `${BASE_URL}/quiz/${mcqAssignment.sharingToken}`;

    res.json({
      success: true,
      mcqAssignment: {
        _id: mcqAssignment._id,
        title: mcqAssignment.title,
        description: mcqAssignment.description,
        totalQuestions: mcqAssignment.mcqs.length,
        totalMarks: mcqAssignment.totalMarks,
        sharingToken: mcqAssignment.sharingToken,
        qrCode: mcqAssignment.qrCode,
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
 * GET /quiz/:token
 * Public endpoint - get quiz data for students (no auth required)
 */
router.get('/quiz/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const mcqAssignment = await MCQAssignmentModel.findOne({ sharingToken: token });
    if (!mcqAssignment) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (mcqAssignment.status !== 'active') {
      return res.status(403).json({ error: 'This quiz is not available' });
    }

    // Return quiz without correct answers
    res.json({
      success: true,
      quiz: {
        _id: mcqAssignment._id,
        title: mcqAssignment.title,
        description: mcqAssignment.description,
        totalQuestions: mcqAssignment.mcqs.length,
        totalMarks: mcqAssignment.totalMarks,
        timeLimit: mcqAssignment.timeLimit,
        questions: mcqAssignment.mcqs.map((mcq, idx) => ({
          id: idx,
          questionText: mcq.questionText,
          options: mcq.options,
          marks: mcq.marks || 1,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /quiz/:token/submit
 * Student submits their responses
 */
router.post('/quiz/:token/submit', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { rollNumber, studentName, responses } = req.body;

    if (!rollNumber || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Missing required fields: rollNumber, responses' });
    }

    const mcqAssignment = await MCQAssignmentModel.findOne({ sharingToken: token });
    if (!mcqAssignment) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if student already submitted
    const existingResponse = await StudentResponseModel.findOne({
      mcqAssignmentId: mcqAssignment._id,
      rollNumber,
    });

    if (existingResponse) {
      return res.status(400).json({ error: 'You have already submitted this quiz' });
    }

    // Calculate score
    const mcqsArray = mcqAssignment.mcqs.map((mcq: any) => ({
      questionText: mcq.questionText,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer,
      marks: mcq.marks || 1,
      topic: mcq.topic,
      difficulty: mcq.difficulty,
    }));
    const { score, totalMarks, percentage } = MCQService.calculateScore(mcqsArray, responses);

    // Save student response
    const studentResponse = new StudentResponseModel({
      mcqAssignmentId: mcqAssignment._id,
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
      message: 'Quiz submitted successfully',
      result: {
        score,
        totalMarks,
        percentage,
        rollNumber,
        studentName,
      },
    });
  } catch (error: any) {
    console.error('Error submitting quiz:', error);
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
