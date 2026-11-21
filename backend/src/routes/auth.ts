import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";
import { verifyPassword } from "../lib/password.js";
import { AppError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { publicRateLimiter } from "../middleware/rateLimit.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post("/login", publicRateLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        400,
        "Invalid email or password payload",
        "VALIDATION_ERROR",
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        centreId: user.centreId,
        districtId: user.districtId,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/** Demo personas for F2 role switcher (no passwords). */
authRouter.get("/demo-users", requireAuth, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        centreId: true,
        districtId: true,
      },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

/** Role-guard smoke route — STATE only (used in PowerShell 403 checks). */
authRouter.get(
  "/state-only",
  requireAuth,
  requireRole("STATE"),
  (req, res) => {
    res.json({ ok: true, as: req.user?.email });
  },
);
