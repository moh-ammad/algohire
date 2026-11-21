import "dotenv/config";
import { startWhatsAppWorker } from "./queues/whatsapp.js";

console.log("Starting CertiFlow workers…");
startWhatsAppWorker();
