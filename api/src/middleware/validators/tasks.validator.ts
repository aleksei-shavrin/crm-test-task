import { body, param } from "express-validator";

export const createTaskValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Введите название задачи"),
  body("description")
    .optional()
    .trim(),
  body("clientId")
    .notEmpty()
    .withMessage("Укажите клиента"),
  body("status")
    .notEmpty()
    .withMessage("Укажите статус")
    .isIn(["pending", "in_progress", "completed"])
    .withMessage("Статус должен быть pending, in_progress или completed"),
  body("priority")
    .notEmpty()
    .withMessage("Укажите приоритет")
    .isIn(["low", "medium", "high"])
    .withMessage("Приоритет должен быть low, medium или high"),
  body("dueDate")
    .notEmpty()
    .withMessage("Укажите срок выполнения")
];

export const updateTaskValidator = [
  param("id")
    .notEmpty()
    .withMessage("ID задачи обязателен"),
  ...createTaskValidator
];

export const taskIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("ID задачи обязателен")
];
