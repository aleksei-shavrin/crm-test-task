import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getStats, getRecentActivities } from "./services/dashboard.service";

const router = Router();

router.use(authMiddleware);

router.get("/api/stats", async (req: Request, res: Response): Promise<void> => {
  const stats = await getStats(req.user!);
  res.json(stats);
});

router.get("/api/recent-activities", async (req: Request, res: Response): Promise<void> => {
  const data = await getRecentActivities(req.user!);
  res.json(data);
});

export const dashboardRouter = router;
