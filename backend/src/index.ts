import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initRealtime } from "./lib/realtime.js";

const app = createApp();
const server = createServer(app);
initRealtime(server);

server.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
