import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationError } from "express-validator";

export interface ApiError extends Error {
  statusCode?: number;
  errors?: ValidationError[];
}

export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Ошибка валидации",
      details: errors.array().map((e) => ({
        field: e.type === "field" ? e.path : undefined,
        message: e.msg
      }))
    });
    return;
  }
  next();
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Внутренняя ошибка сервера";

  if (process.env.NODE_ENV !== "production") {
    console.error("Error:", err);
  }

  res.status(statusCode).json({
    error: message,
    ...(err.errors && { details: err.errors })
  });
}

export function createError(message: string, statusCode = 400): ApiError {
  const err = new Error(message) as ApiError;
  err.statusCode = statusCode;
  return err;
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
