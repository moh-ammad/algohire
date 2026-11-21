import type { NextFunction, Request, Response } from "express";
import type { Role } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { AppError } from "./errorHandler.js";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "Missing or invalid Authorization header", "UNAUTHORIZED");
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw new AppError(401, "Missing token", "UNAUTHORIZED");
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError(401, "Invalid or expired token", "UNAUTHORIZED");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        centreId: true,
        districtId: true,
      },
    });

    if (!user) {
      throw new AppError(401, "User no longer exists", "UNAUTHORIZED");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, "Unauthorized", "UNAUTHORIZED"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new AppError(
          403,
          "You cannot act at this step with your role",
          "FORBIDDEN",
        ),
      );
      return;
    }

    next();
  };
}
