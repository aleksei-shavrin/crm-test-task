import { body, param } from "express-validator";

export const createClientValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Введите имя клиента"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Введите email")
    .isEmail()
    .withMessage("Некорректный email"),
  body("phone")
    .optional()
    .trim(),
  body("company")
    .optional()
    .trim(),
  body("status")
    .notEmpty()
    .withMessage("Укажите статус")
    .isIn(["active", "inactive", "lead"])
    .withMessage("Статус должен быть active, inactive или lead"),
  body("notes")
    .optional()
    .trim()
];

export const updateClientValidator = [
  param("id")
    .notEmpty()
    .withMessage("ID клиента обязателен"),
  ...createClientValidator
];

export const clientIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("ID клиента обязателен")
];
