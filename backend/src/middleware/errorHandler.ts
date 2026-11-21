import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = "APP_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({
    error: "Not found",
    code: "NOT_FOUND",
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      requestId,
    });
    return;
  }

  console.error(`[${requestId ?? "no-id"}]`, err);

  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    requestId,
  });
}
