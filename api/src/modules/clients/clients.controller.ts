import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler, handleValidationErrors, createError } from "../../middleware/errorHandler";
import { createClientValidator, updateClientValidator, clientIdValidator } from "../../middleware/validators";
import { getClients, getRandomClientPayload, deleteClient, createClient, updateClient } from "./services/clients.service";

const router = Router();

router.use(authMiddleware);

router.get(
  "/api/clients",
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const managerId = req.query.managerId as string | undefined;
    const search = req.query.search as string | undefined;
    const result = await getClients(req.user!, { page, limit }, { status, managerId, search });
    res.json(result);
  })
);

router.post(
  "/api/clients",
  createClientValidator,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const client = await createClient(req.body, req.user!);
    res.status(201).json(client);
  })
);

router.put(
  "/api/clients/:id",
  updateClientValidator,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    const client = await updateClient(id, req.body, req.user!);
    if (!client) {
      throw createError(req.user!.role === "manager" ? "Forbidden" : "Client not found", req.user!.role === "manager" ? 403 : 404);
    }
    res.json(client);
  })
);

router.get(
  "/api/clients/random-payload",
  asyncHandler(async (req: Request, res: Response) => {
    const payload = await getRandomClientPayload(req.user!);
    res.json(payload);
  })
);

router.delete(
  "/api/clients/:id",
  clientIdValidator,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    const deleted = await deleteClient(id, req.user!);
    if (!deleted) {
      throw createError(req.user!.role === "manager" ? "Forbidden" : "Client not found", req.user!.role === "manager" ? 403 : 404);
    }
    res.status(204).send();
  })
);

export const clientsRouter = router;
export { getClients, getRandomClientPayload, deleteClient, createClient, updateClient } from "./services/clients.service";
