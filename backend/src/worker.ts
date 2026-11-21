import "dotenv/config";
import { startStuckWorker } from "./queues/stuck.js";
import { startWhatsAppWorker } from "./queues/whatsapp.js";

console.log("Starting CertiFlow workers…");
startWhatsAppWorker();
startStuckWorker();
