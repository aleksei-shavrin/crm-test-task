import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler, handleValidationErrors, createError } from "../../middleware/errorHandler";
import { createTaskValidator, updateTaskValidator, taskIdValidator } from "../../middleware/validators";
import { getTasks, getRandomTaskPayload, deleteTask, createTask, updateTask } from "./services/tasks.service";

const router = Router();

router.use(authMiddleware);

router.get(
  "/api/tasks",
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const assigneeId = req.query.assigneeId as string | undefined;
    const result = await getTasks(req.user!, { page, limit }, { status, assigneeId });
    res.json(result);
  })
);

router.post(
  "/api/tasks",
  createTaskValidator,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const task = await createTask(req.body, req.user!);
    res.status(201).json(task);
  })
);

router.put(
  "/api/tasks/:id",
  updateTaskValidator,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const task = await updateTask(id ?? "", req.body, req.user!);
    if (!task) {
      throw createError(req.user!.role === "manager" ? "Forbidden" : "Task not found", req.user!.role === "manager" ? 403 : 404);
    }
    res.json(task);
  })
);

router.get(
  "/api/tasks/random-payload",
  asyncHandler(async (req: Request, res: Response) => {
    const payload = await getRandomTaskPayload(req.user!);
    res.json(payload);
  })
);

router.delete(
  "/api/tasks/:id",
  taskIdValidator,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await deleteTask(id ?? "", req.user!);
    if (!deleted) {
      throw createError(req.user!.role === "manager" ? "Forbidden" : "Task not found", req.user!.role === "manager" ? 403 : 404);
    }
    res.status(204).send();
  })
);

export const tasksRouter = router;
export { getTasks, getTaskStatusCounts } from "./services/tasks.service";
