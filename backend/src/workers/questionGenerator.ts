import { connectDB } from '../config/db';
import { AssignmentModel } from '../models/Assignment';
import { RetrievalAgent } from '../services/retrievalAgent';
import {
  QueuedQuestionJob,
  publishQuestionQueueEvent,
  startQuestionQueueWorker
} from '../services/questionQueue';
import { DocumentAgent } from '../services/documentAgent';
import { QuestionAgent } from '../services/questionAgent';
import { PaperAgent } from '../services/paperAgent';

const processQuestionJob = async (job: QueuedQuestionJob): Promise<void> => {
  const { assignmentId } = job;

  try {
    const assignment = await AssignmentModel.findById(assignmentId);

    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'processing' });
    await publishQuestionQueueEvent({
      assignmentId,
      status: 'processing',
      stage: 'document',
      message: 'Parsing uploaded PDF and splitting it into chunks...'
    });

    const document = await DocumentAgent.parseUploadedPdf(assignment.fileUrl);

    await RetrievalAgent.storeChunks(assignmentId, document.chunks);

    const retrievedContexts = await RetrievalAgent.retrieveRelevantContexts(
      assignmentId,
      `${assignment.title} ${assignment.subject} ${assignment.className} ${assignment.additionalInfo ?? ''}`,
      6
    );

    await publishQuestionQueueEvent({
      assignmentId,
      status: 'processing',
      stage: 'question',
      message: 'Generating questions from the uploaded content...'
    });

    const draft = await QuestionAgent.generatePaper({
      ...job,
      fileUrl: assignment.fileUrl
    }, document, retrievedContexts);

    await publishQuestionQueueEvent({
      assignmentId,
      status: 'processing',
      stage: 'paper',
      message: 'Assembling the final question paper...'
    });

    const paper = PaperAgent.assemblePaper(assignment, document, draft);

    const updated = await AssignmentModel.findByIdAndUpdate(
      assignmentId,
      paper,
      { new: true }
    );

    await publishQuestionQueueEvent({
      assignmentId,
      status: 'completed',
      assignment: updated
    });

    console.log(`✅ Job completed for assignment ${assignmentId}`);
  } catch (error) {
    console.error(`❌ Job failed for assignment ${assignmentId}:`, error);
    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'failed' });
    await publishQuestionQueueEvent({ assignmentId, status: 'failed' });

    throw error;
  }
};

void (async () => {
  await connectDB();
  await startQuestionQueueWorker(processQuestionJob);
})();
