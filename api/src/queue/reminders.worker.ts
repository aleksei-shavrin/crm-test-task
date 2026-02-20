import type { Job } from "bull";
import { getRedisClient } from "../redis";
import { getRemindersQueue, REMINDERS_SORTED_SET_KEY } from "./reminders.queue";

const CHECK_REMINDERS_JOB_NAME = "check-due-reminders";
const FIVE_MINUTES_MS = 5 * 60 * 1000;

async function processDueReminders(): Promise<void> {
  const redis = getRedisClient();
  const now = Date.now();
  const due = await redis.zrangebyscore(REMINDERS_SORTED_SET_KEY, 0, now);

  for (const payload of due) {
    try {
      const { title, dueDate } = JSON.parse(payload) as { title: string; dueDate: string };
      console.log(`📢 Напоминание: задача «${title}» до ${dueDate}`);
    } catch {
    }
  }

  if (due.length > 0) {
    await redis.zrem(REMINDERS_SORTED_SET_KEY, ...due);
  }
}

export async function startRemindersWorker(): Promise<void> {
  const queue = getRemindersQueue();

  queue.process(async (job: Job) => {
    console.log('job.name', job.name);
    if (job.name !== CHECK_REMINDERS_JOB_NAME) return;
    try {
      await processDueReminders();
    } catch (err) {
      console.error("Reminders check error:", err);
    }
  });

  await queue.clean(0, "failed");
  await queue.clean(0, "completed");

  const repeatable = await queue.getRepeatableJobs();
  for (const job of repeatable) {
    if (job.name === CHECK_REMINDERS_JOB_NAME) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  await queue.add(
    CHECK_REMINDERS_JOB_NAME,
    {},
    {
      repeat: { every: FIVE_MINUTES_MS, key: "reminders-check" },
    }
  );

  try {
    await processDueReminders();
  } catch (err) {
    console.error("Reminders initial check error:", err);
  }

  console.log("Reminders worker started (every 5 min)");
}
