import multer from "multer";
import { AppError } from "./errorHandler.js";

const storage = multer.memoryStorage();

export const spreadsheetUpload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const ok =
      name.endsWith(".csv") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      file.mimetype === "text/csv" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!ok) {
      cb(new AppError(400, "Only CSV or Excel (.xlsx) files are allowed", "INVALID_FILE"));
      return;
    }
    cb(null, true);
  },
}).single("file");
