export type ClientStatus = "active" | "inactive" | "lead";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ClientStatus;
  managerId: string;
  managerName?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  clientId: string;
  assigneeId: string;
  assigneeName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStatusCount {
  label: string;
  count: number;
  color: string;
}

export interface Stats {
  clients: number;
  tasks: number;
  taskStatuses: TaskStatusCount[];
}
