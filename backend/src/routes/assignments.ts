import { Router, Request, Response } from 'express';
import { AssignmentModel } from '../models/Assignment';
import { PDFService } from '../services/pdfService';
import { CreateAssignmentDTO } from '../types';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { enqueueQuestionJob } from '../services/questionQueue';

const router = Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Validation Schema
const QuestionTypeSchema = z.object({
  type: z.string().min(1),
  count: z.number().int().min(1),
  marks: z.number().int().min(1)
});

const CreateAssignmentSchema = z.object({
  title: z.string().min(3).max(200),
  subject: z.string().min(1),
  className: z.string().min(1),
  schoolName: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  questionTypes: z.array(QuestionTypeSchema).min(1),
  additionalInfo: z.string().optional(),
  fileUrl: z.string().optional()
});

// Create Assignment
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (typeof body.questionTypes === 'string') {
      body.questionTypes = JSON.parse(body.questionTypes);
    }

    const validated = CreateAssignmentSchema.parse(body);
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const totalQuestions = validated.questionTypes.reduce((sum, qt) => sum + qt.count, 0);
    const totalMarks = validated.questionTypes.reduce((sum, qt) => sum + (qt.count * qt.marks), 0);

    const assignment = await AssignmentModel.create({
      ...validated,
      fileUrl,
      totalQuestions,
      totalMarks,
      status: 'pending'
    });

    await enqueueQuestionJob({
      assignmentId: assignment._id!.toString(),
      title: assignment.title,
      subject: assignment.subject,
      className: assignment.className,
      schoolName: assignment.schoolName,
      questionTypes: assignment.questionTypes,
      additionalInfo: assignment.additionalInfo,
      fileUrl: assignment.fileUrl
    }, {
      attempts: 3,
      backoff: { type: 'exponential' as any, delay: 2000 }
    });

    res.status(201).json({
      success: true,
      message: 'Assignment created and queued for generation',
      data: assignment
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    } else {
      console.error('Create assignment error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
});

// Get All Assignments
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};

    const assignments = await AssignmentModel.find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const total = await AssignmentModel.countDocuments(query);

    res.json({
      success: true,
      data: assignments,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
  }
});

// Get Single Assignment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await AssignmentModel.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assignment' });
  }
});

// Delete Assignment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await AssignmentModel.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete assignment' });
  }
});

// Regenerate Questions
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assignment = await AssignmentModel.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    await AssignmentModel.findByIdAndUpdate(req.params.id, { status: 'pending' });

    await enqueueQuestionJob({
      assignmentId: assignment._id!.toString(),
      title: assignment.title,
      subject: assignment.subject,
      className: assignment.className,
      schoolName: assignment.schoolName,
      questionTypes: assignment.questionTypes,
      additionalInfo: assignment.additionalInfo,
      fileUrl: assignment.fileUrl
    }, {
      attempts: 3
    });

    res.json({ success: true, message: 'Regeneration queued' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to regenerate' });
  }
});

// Download PDF
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const assignment = await AssignmentModel.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Assignment not yet generated' });
    }

    const pdfBuffer = await PDFService.generateQuestionPaperPDF(assignment);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${assignment.title.replace(/\s+/g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
});

export default router;
