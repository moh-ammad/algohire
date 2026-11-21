import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { verifyAccessToken } from "./jwt.js";

let io: Server | null = null;

export function initRealtime(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.query?.token as string | undefined);

    if (!token) {
      // Public connections allowed — they only get public rooms if we add any.
      next();
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const role = socket.data.role as string | undefined;
    if (role) {
      void socket.join(`role:${role}`);
    }

    socket.on("batch:subscribe", (batchId: string) => {
      if (typeof batchId === "string" && batchId.length > 0) {
        void socket.join(`batch:${batchId}`);
      }
    });

    socket.on("batch:unsubscribe", (batchId: string) => {
      if (typeof batchId === "string") {
        void socket.leave(`batch:${batchId}`);
      }
    });
  });

  console.log("Socket.IO ready");
  return io;
}

export function getIO() {
  return io;
}

export function broadcastBatchEvent(
  event: string,
  payload: Record<string, unknown> & { batchId?: string },
) {
  if (!io) return;

  io.emit(event, payload);

  if (payload.batchId) {
    io.to(`batch:${payload.batchId}`).emit(event, payload);
  }

  // State officers care about stuck + pipeline changes
  io.to("role:STATE").emit(event, payload);
  io.to("role:DISTRICT").emit(event, payload);
  io.to("role:QUALITY").emit(event, payload);
  io.to("role:CENTRE").emit(event, payload);
}
