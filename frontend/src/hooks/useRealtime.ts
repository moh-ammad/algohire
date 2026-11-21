import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";

type Handler = (payload: Record<string, unknown>) => void;

/**
 * Subscribe to Socket.IO batch events. Reconnects when token changes.
 */
export function useRealtime(
  events: string[],
  onEvent: Handler,
  opts?: { batchId?: string; enabled?: boolean },
) {
  const { token } = useAuth();
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;
  const enabled = opts?.enabled !== false;

  useEffect(() => {
    if (!enabled) return;

    const socket: Socket = io(API_URL, {
      auth: token ? { token } : {},
      transports: ["websocket", "polling"],
    });

    for (const ev of events) {
      socket.on(ev, (payload: Record<string, unknown>) => {
        handlerRef.current(payload);
      });
    }

    if (opts?.batchId) {
      socket.emit("batch:subscribe", opts.batchId);
    }

    return () => {
      if (opts?.batchId) {
        socket.emit("batch:unsubscribe", opts.batchId);
      }
      socket.disconnect();
    };
  }, [token, enabled, opts?.batchId, events.join("|")]);
}
