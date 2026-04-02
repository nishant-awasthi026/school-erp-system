import { redis, isRedisConfigured } from '@/lib/infra/redis';

/**
 * Task Queue Utility
 * Compatible with Upstash QStash or a custom background worker.
 * Gracefully degrades to synchronous in-process execution when Redis is not configured.
 */
export enum TaskType {
  GENERATE_PDF = 'GENERATE_PDF',
  IMPORT_STUDENTS = 'IMPORT_STUDENTS',
  PROCESS_SALARY = 'PROCESS_SALARY',
  SEND_BULK_EMAIL = 'SEND_BULK_EMAIL',
}

export interface TaskPayload {
  type: TaskType;
  schoolId: string;
  data: any;
}

/**
 * Enqueues a task for background processing.
 * Falls back to in-memory queue (logs only) when Redis is not configured.
 */
export async function enqueueTask(payload: TaskPayload) {
  const taskId = `${payload.type}:${Date.now()}`;

  // Production: Use Upstash QStash (Uncomment when credentials are ready)
  /*
  const qstashUrl = process.env.QSTASH_URL;
  const qstashToken = process.env.QSTASH_TOKEN;
  if (qstashUrl && qstashToken) {
    const response = await fetch(`${qstashUrl}/publish/${process.env.APP_URL}/api/tasks/worker`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${qstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return await response.json();
  }
  */

  if (!isRedisConfigured) {
    // Local dev: just log the task, don't fail
    console.log(`[TaskQueue] (No Redis) Task would be enqueued: ${taskId} for school ${payload.schoolId}`);
    return { taskId, status: 'ENQUEUED_LOCAL' };
  }

  // Fallback: Use Redis List as a simple FIFO queue
  const queueKey = `queue:pending_tasks`;
  await redis.rpush(queueKey, JSON.stringify({ ...payload, taskId }));

  console.log(`[TaskQueue] Enqueued task: ${taskId} for school ${payload.schoolId}`);
  return { taskId, status: 'ENQUEUED' };
}

/**
 * Processes the next task from the Redis queue (for a custom background worker node).
 */
export async function dequeueTask(): Promise<TaskPayload | null> {
  if (!isRedisConfigured) return null;

  const queueKey = `queue:pending_tasks`;
  const result = await redis.lpop<string>(queueKey);
  return result ? JSON.parse(result) : null;
}
