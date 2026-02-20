import type { Client, Stats, Task } from "../../../domain/types";
import type { AuthUser } from "../../../middleware/auth.middleware";
import { ClientModel } from "../../clients/models/Client.model";
import { getClients } from "../../clients/services/clients.service";
import { TaskModel } from "../../tasks/models/Task.model";
import { getTasks, getTaskStatusCounts } from "../../tasks/services/tasks.service";
import { cacheGet, cacheSet, STATS_ALL_KEY } from "../../../redis";

export interface RecentActivitiesResponse {
  clients: Client[];
  tasks: Task[];
}

export async function getRecentActivities(user: AuthUser): Promise<RecentActivitiesResponse> {
  const [clientsResult, tasksResult] = await Promise.all([
    getClients(user, { limit: 5 }),
    getTasks(user, { limit: 5 })
  ]);
  return { clients: clientsResult.items, tasks: tasksResult.items };
}

const STATS_CACHE_PREFIX = "stats:";
const STATS_CACHE_TTL_SECONDS = 3 * 60;

async function getTaskStatusCountsAll(): Promise<Stats["taskStatuses"]> {
  const counts = await TaskModel.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]).exec();
  const map = new Map(counts.map((c) => [c._id, c.count]));
  return [
    { label: "К выполнению", count: map.get("pending") ?? 0, color: "#3B82F6" },
    { label: "В работе", count: map.get("in_progress") ?? 0, color: "#F59E0B" },
    { label: "Выполнено", count: map.get("completed") ?? 0, color: "#10B981" },
  ];
}

export async function getStats(user: AuthUser): Promise<Stats> {
  const key = user.role === "admin" ? STATS_ALL_KEY : STATS_CACHE_PREFIX + user.id;
  const cached = await cacheGet(key);
  if (cached) {
    const parsed = JSON.parse(cached) as Stats;
    if (user.role !== "admin" || parsed.tasks > 0) return parsed;
  }

  if (user.role === "admin") {
    const [clientsCount, tasksCount, taskStatuses] = await Promise.all([
      ClientModel.countDocuments().exec(),
      TaskModel.countDocuments().exec(),
      getTaskStatusCountsAll(),
    ]);
    const stats: Stats = {
      clients: clientsCount,
      tasks: tasksCount,
      taskStatuses,
    };
    await cacheSet(key, JSON.stringify(stats), STATS_CACHE_TTL_SECONDS);
    return stats;
  }

  const [clientsResult, tasksResult, taskStatuses] = await Promise.all([
    getClients(user, { limit: 1 }),
    getTasks(user, { limit: 1 }),
    getTaskStatusCounts(user),
  ]);
  const stats: Stats = {
    clients: clientsResult.total,
    tasks: tasksResult.total,
    taskStatuses,
  };
  await cacheSet(key, JSON.stringify(stats), STATS_CACHE_TTL_SECONDS);
  return stats;
}
