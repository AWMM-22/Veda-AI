import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { MCQAssignmentModel } from '../models/MCQAssignment';
import { MCQService } from '../services/mcqService';

dotenv.config();

async function run() {
  const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:3002';

  console.log('Connecting to DB...');
  await connectDB();

  try {
    const assignments = await MCQAssignmentModel.find();
    console.log(`Found ${assignments.length} MCQ assignments`);

    for (const a of assignments) {
      try {
        const examId = a.examId || a.sharingToken;
        if (!examId) {
          console.log(`Skipping ${a._id} (no sharingToken)`);
          continue;
        }

        const { qrCode, link } = await MCQService.createSharingLink(FRONTEND_URL, examId, 'exam');
        a.examId = examId;
        a.qrCode = qrCode;
        a.qrUrl = link;
        await a.save();
        console.log(`Updated ${a._id} -> ${link}`);
      } catch (err: any) {
        console.error('Error updating assignment', a._id, err.message || err);
      }
    }

    console.log('Done updating QR codes.');
    process.exit(0);
  } catch (err: any) {
    console.error('Script error:', err.message || err);
    process.exit(1);
  }
}

run();
