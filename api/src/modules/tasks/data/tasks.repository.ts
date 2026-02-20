import { fakerRU } from "@faker-js/faker";
import { TaskStatus, TaskPriority } from "../models/Task.model";

export interface SeedTaskDoc {
  title: string;
  description: string;
  clientId: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

const STATUSES: TaskStatus[] = [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED];
const PRIORITIES: TaskPriority[] = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH];

const TASK_TITLES = [
  "Внести нового клиента в CRM",
  "Обновить статус лида",
  "Напомнить о встрече",
  "Выставить счет",
  "Заполнить карточку клиента",
  "Сегментировать клиентов",
  "Подготовить отчет по сделкам",
  "Настроить автоматическое напоминание",
  "Обновить договор в системе",
  "Импортировать клиентов из Excel",
];

export interface RandomTaskData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

export function generateRandomTaskData(): RandomTaskData {
  return {
    title: fakerRU.helpers.arrayElement([...TASK_TITLES, fakerRU.lorem.sentence()]),
    description: fakerRU.lorem.sentence(),
    status: fakerRU.helpers.arrayElement(STATUSES),
    priority: fakerRU.helpers.arrayElement(PRIORITIES),
    dueDate: fakerRU.date.soon({ days: 60 }).toISOString().slice(0, 10),
  };
}

export function generateSeedTasks(
  assigneeId: string,
  clientIds: string[],
  count = 10
): SeedTaskDoc[] {
  fakerRU.seed(43);
  const docs: SeedTaskDoc[] = [];
  for (let i = 0; i < count; i++) {
    const clientId = clientIds.length > 0
      ? fakerRU.helpers.arrayElement(clientIds)
      : assigneeId;
    const taskData = generateRandomTaskData();
    docs.push({
      ...taskData,
      clientId,
      assigneeId,
    });
  }
  return docs;
}
