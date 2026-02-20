import Queue from "bull";
import { getRedisClient } from "../redis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const REMINDERS_QUEUE_NAME = "reminders";
const REMINDERS_SORTED_SET_KEY = "reminders:due";

const remindersQueue = new Queue(REMINDERS_QUEUE_NAME, REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 1,
  },
});

export async function addReminderJob(title: string, dueDate: string): Promise<void> {
  const dueTime = new Date(dueDate).getTime();
  if (Number.isNaN(dueTime)) return;
  const payload = JSON.stringify({ title, dueDate });
  await getRedisClient().zadd(REMINDERS_SORTED_SET_KEY, dueTime, payload);
}

export function getRemindersQueue(): Queue.Queue {
  return remindersQueue;
}

export { REMINDERS_SORTED_SET_KEY };
