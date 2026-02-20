import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { isBlacklisted } from "../redis";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

export type UserRole = "admin" | "manager";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    if (await isBlacklisted(token)) {
      res.status(401).json({ error: "Token revoked" });
      return;
    }
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string; email?: string; role?: UserRole };
    if (!payload.sub || !payload.email) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role ?? "manager",
    };
    req.token = token;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
