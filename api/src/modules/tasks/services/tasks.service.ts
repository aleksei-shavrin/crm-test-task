import mongoose from "mongoose";
import type { Task, TaskStatusCount } from "../../../domain/types";
import type { AuthUser } from "../../../middleware/auth.middleware";
import { invalidateStatsForAll } from "../../../redis";
import { addReminderJob } from "../../../queue/reminders.queue";
import { ClientModel } from "../../clients/models/Client.model";
import { TaskModel } from "../models/Task.model";
import { TaskStatus, TaskPriority } from "../models/Task.model";
import { generateRandomTaskData } from "../data/tasks.repository";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  clientId: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

function refToString(ref: unknown): string {
  return ref != null && typeof (ref as { toString?: () => string }).toString === "function"
    ? (ref as { toString(): string }).toString()
    : String(ref);
}

function assigneeDisplayName(assignee: unknown): string | undefined {
  if (assignee == null) return undefined;
  const o = assignee as { name?: string; email?: string };
  const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : null;
  const email = typeof o.email === "string" && o.email.trim() ? o.email.trim() : null;
  return name ?? email ?? undefined;
}

function assigneeIdString(assignee: unknown): string {
  if (assignee == null) return refToString(assignee);
  const o = assignee as { _id?: unknown };
  if (o._id != null) return refToString(o._id);
  return refToString(assignee);
}

function docToTask(d: {
  _id: { toString(): string };
  title: string;
  description?: string;
  clientId: unknown;
  assigneeId: unknown;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt?: Date;
  updatedAt?: Date;
}): Task {
  const assigneeIdRef = d.assigneeId;
  return {
    id: d._id.toString(),
    title: d.title,
    description: d.description ?? "",
    clientId: refToString(d.clientId),
    assigneeId: assigneeIdString(assigneeIdRef),
    assigneeName: assigneeDisplayName(assigneeIdRef),
    status: d.status,
    priority: d.priority,
    dueDate: d.dueDate,
    createdAt: d.createdAt?.toISOString() ?? "",
    updatedAt: d.updatedAt?.toISOString() ?? "",
  };
}

export async function createTask(payload: CreateTaskPayload, user: AuthUser): Promise<Task> {
  const doc = await TaskModel.create({
    title: payload.title,
    description: payload.description ?? "",
    clientId: payload.clientId,
    assigneeId: user.id,
    status: payload.status,
    priority: payload.priority,
    dueDate: payload.dueDate,
  });
  await invalidateStatsForAll();
  if (payload.dueDate) {
    await addReminderJob(payload.title, payload.dueDate).catch(() => {});
  }
  return docToTask(doc.toObject() as Parameters<typeof docToTask>[0]);
}

export async function updateTask(id: string, payload: CreateTaskPayload, user: AuthUser): Promise<Task | null> {
  if (user.role === "manager") {
    const existing = await TaskModel.findById(id).lean().exec();
    if (!existing) return null;
    if (refToString((existing as { assigneeId: unknown }).assigneeId) !== user.id) return null;
  }
  const doc = await TaskModel.findByIdAndUpdate(
    id,
    {
      title: payload.title,
      description: payload.description ?? "",
      clientId: payload.clientId,
      assigneeId: user.id,
      status: payload.status,
      priority: payload.priority,
      dueDate: payload.dueDate,
    },
    { new: true, runValidators: true }
  )
    .lean()
    .exec();
  if (!doc) return null;
  await invalidateStatsForAll();
  return docToTask(doc as Parameters<typeof docToTask>[0]);
}

export async function getRandomTaskPayload(user: AuthUser): Promise<Omit<CreateTaskPayload, "assigneeId">> {
  const client = await ClientModel.findOne().lean().exec();
  const clientId = client?._id?.toString() ?? "";
  const taskData = generateRandomTaskData();
  return {
    ...taskData,
    clientId,
  };
}

export async function deleteTask(id: string, user: AuthUser): Promise<boolean> {
  if (user.role === "manager") return false;
  const result = await TaskModel.findByIdAndDelete(id).exec();
  if (result) await invalidateStatsForAll();
  return result != null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface TaskFilters {
  status?: string;
  assigneeId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getTasks(user: AuthUser, pagination?: PaginationParams, filters?: TaskFilters): Promise<PaginatedResult<Task>> {
  const page = Math.max(1, pagination?.page ?? 1);
  const limit = Math.min(100, Math.max(1, pagination?.limit ?? 10));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> =
    user.role === "admin" ? {} : { assigneeId: new mongoose.Types.ObjectId(user.id) };

  if (filters?.status) {
    query.status = filters.status;
  }
  if (filters?.assigneeId && user.role === "admin") {
    query.assigneeId = new mongoose.Types.ObjectId(filters.assigneeId);
  }

  const [docs, total] = await Promise.all([
    TaskModel.find(query)
      .populate("assigneeId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    TaskModel.countDocuments(query).exec()
  ]);

  const items = docs.map((d) => docToTask(d as Parameters<typeof docToTask>[0]));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getTaskStatusCounts(user: AuthUser): Promise<TaskStatusCount[]> {
  const match =
    user.role === "admin" ? {} : { assigneeId: new mongoose.Types.ObjectId(user.id) };
  const counts = await TaskModel.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]).exec();
  const map = new Map(counts.map((c) => [c._id, c.count]));
  return [
    { label: "К выполнению", count: map.get("pending") ?? 0, color: "#3B82F6" },
    {
      label: "В работе",
      count: map.get("in_progress") ?? 0,
      color: "#F59E0B",
    },
    { label: "Выполнено", count: map.get("completed") ?? 0, color: "#10B981" },
  ];
}
