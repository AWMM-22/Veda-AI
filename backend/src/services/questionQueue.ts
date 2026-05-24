import { redis } from '../config/redis';
import { JobData } from '../types';

export interface QueuedQuestionJob extends JobData {
  attempts: number;
  attempt: number;
}

export interface QuestionQueueStatusEvent {
  assignmentId: string;
  status: 'processing' | 'completed' | 'failed';
  assignment?: unknown;
  stage?: 'document' | 'question' | 'paper';
  message?: string;
}

const QUEUE_KEY = 'question-generation:queue';
const EVENTS_CHANNEL = 'question-generation:events';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const enqueueQuestionJob = async (
  jobData: JobData,
  options: { attempts?: number; delay?: number; attempt?: number; backoff?: { delay?: number } } = {}
): Promise<void> => {
  const payload: QueuedQuestionJob = {
    ...jobData,
    attempts: options.attempts ?? 1,
    attempt: options.attempt ?? 1
  };

  const serialized = JSON.stringify(payload);

  const delay = options.delay ?? options.backoff?.delay ?? 0;

  if (delay > 0) {
    setTimeout(() => {
      void redis.lpush(QUEUE_KEY, serialized);
    }, delay);
    return;
  }

  await redis.lpush(QUEUE_KEY, serialized);
}

export const startQuestionQueueWorker = async (
  handler: (job: QueuedQuestionJob) => Promise<void>
): Promise<void> => {
  const blockingRedis = redis.duplicate();

  console.log('🚀 Question generation Redis worker started...');

  while (true) {
    const result = await blockingRedis.brpop(QUEUE_KEY, 0);

    if (!result) {
      continue;
    }

    const [, rawJob] = result;

    try {
      const job = JSON.parse(rawJob) as QueuedQuestionJob;
      await handler(job);
    } catch (error) {
      console.error('Job processing error:', error);

      try {
        const job = JSON.parse(rawJob) as QueuedQuestionJob;
        if ((job.attempt ?? 1) < (job.attempts ?? 1)) {
          const nextAttempt = (job.attempt ?? 1) + 1;
          const backoffDelay = Math.min(2000 * Math.pow(2, nextAttempt - 2), 15000);

          setTimeout(() => {
            void redis.lpush(
              QUEUE_KEY,
              JSON.stringify({
                ...job,
                attempt: nextAttempt
              })
            );
          }, backoffDelay);
        }
      } catch (parseError) {
        console.error('Failed to reschedule job:', parseError);
      }

      await sleep(0);
    }
  }
};

export const publishQuestionQueueEvent = async (
  event: QuestionQueueStatusEvent
): Promise<void> => {
  await redis.publish(EVENTS_CHANNEL, JSON.stringify(event));
};

export const startQuestionQueueEventForwarder = async (
  onEvent: (event: QuestionQueueStatusEvent) => void
): Promise<void> => {
  const subscriber = redis.duplicate();

  await subscriber.subscribe(EVENTS_CHANNEL, (message) => {
    try {
      onEvent(JSON.parse(message) as QuestionQueueStatusEvent);
    } catch (error) {
      console.error('Failed to parse queue event:', error);
    }
  });
};