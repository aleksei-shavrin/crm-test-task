import express from "express";
import { connectDb, disconnectDb } from "./db";
import { connectRedis, disconnectRedis } from "./redis";
import { startRemindersWorker } from "./queue/reminders.worker";
import { getRemindersQueue } from "./queue/reminders.queue";
import { clientsRouter } from "./modules/clients";
import { tasksRouter } from "./modules/tasks";
import { dashboardRouter } from "./modules/dashboard";
import { authRouter } from "./modules/users";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.use(express.json());

app.use(authRouter);
app.use(clientsRouter);
app.use(tasksRouter);
app.use(dashboardRouter);

app.use(errorHandler);

async function start(): Promise<void> {
  await connectDb();
  await connectRedis();
  await startRemindersWorker();
  app.listen(Number(PORT), HOST, () => {
    console.log(`API server listening on ${HOST}:${PORT}`);
  });
}

function shutdown(): void {
  Promise.all([
    disconnectDb(),
    disconnectRedis(),
    getRemindersQueue().close(),
  ])
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Shutdown error:", err);
      process.exit(1);
    });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
