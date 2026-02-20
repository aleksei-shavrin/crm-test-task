import { Router, Request, Response } from "express";
import { register, login, getMe, updateMe, logout, getUsers } from "./services/auth.service";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler, handleValidationErrors } from "../../middleware/errorHandler";
import { loginValidator, registerValidator, updateMeValidator } from "../../middleware/validators";

const router = Router();

router.post(
  "/api/login",
  loginValidator,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await login(req.body);
    res.json(result);
  })
);

router.post(
  "/api/register",
  registerValidator,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await register(req.body);
    res.status(201).json(user);
  })
);

router.get(
  "/api/me",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await getMe(req.user!.id);
    res.json(user);
  })
);

router.put(
  "/api/me",
  authMiddleware,
  updateMeValidator,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await updateMe(req.user!.id, req.body);
    res.json(user);
  })
);

router.post(
  "/api/logout",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    await logout(req.token!);
    res.json({ message: "Logged out" });
  })
);

router.get(
  "/api/users",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const users = await getUsers();
    res.json(users);
  })
);

export const authRouter = router;
