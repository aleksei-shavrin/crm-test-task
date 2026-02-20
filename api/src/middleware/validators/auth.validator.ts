import { body } from "express-validator";

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Введите email")
    .isEmail()
    .withMessage("Некорректный email"),
  body("password")
    .notEmpty()
    .withMessage("Введите пароль")
];

export const registerValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Введите email")
    .isEmail()
    .withMessage("Некорректный email"),
  body("password")
    .notEmpty()
    .withMessage("Введите пароль")
    .isLength({ min: 4 })
    .withMessage("Пароль должен быть не менее 4 символов"),
  body("name")
    .optional()
    .trim(),
  body("role")
    .optional()
    .isIn(["admin", "manager"])
    .withMessage("Роль должна быть admin или manager"),
  body("avatar")
    .optional()
    .trim()
    .isURL()
    .withMessage("Некорректный URL аватара")
];

export const updateMeValidator = [
  body("name")
    .optional()
    .trim(),
  body("avatar")
    .optional()
    .trim()
];
