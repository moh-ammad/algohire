import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "../middleware/errorHandler.js";

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new AppError(
      503,
      "Gemini is not configured. Set GEMINI_API_KEY in backend/.env",
      "AI_NOT_CONFIGURED",
    );
  }

  const genAI = new GoogleGenerativeAI(key);
  const modelName = process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash";
  return genAI.getGenerativeModel({ model: modelName });
}

export async function explainSpreadsheetErrors(
  errors: Array<{ row: number; field?: string; message: string }>,
): Promise<string> {
  const model = getModel();
  const prompt = `You help training-centre staff fix certificate batch spreadsheets for CertiFlow (Indian skilling certificates).

Given these validation errors JSON, write a short, friendly checklist in plain English:
- What went wrong
- Exactly how to fix each issue in Excel/CSV
- Remind them: fixing ALL rows is required — nothing saves until the file is clean

Keep it under 120 words. No markdown tables. Use short bullets.

Errors:
${JSON.stringify(errors, null, 2)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text()?.trim();
  if (!text) {
    throw new AppError(502, "Gemini returned an empty response", "AI_EMPTY");
  }
  return text;
}

export async function briefBatchForOfficer(input: {
  reference: string;
  status: string;
  centreName: string;
  candidateCount: number;
  requiresQuality: boolean;
  candidates: Array<{ fullName: string; phone: string; courseName: string }>;
  approvals: Array<{ name: string; decision: string; stage: string }>;
}): Promise<string> {
  const model = getModel();
  const sample = input.candidates.slice(0, 8);
  const prompt = `You assist district/quality/state officers reviewing CertiFlow certificate batches.

Write a crisp review brief (max 100 words):
1) What this batch is
2) Anything odd to double-check (duplicate-looking phones, missing IDs, mixed courses)
3) Where it sits in the approval chain

Be neutral and factual. No inventing candidates not listed.

Batch: ${input.reference}
Centre: ${input.centreName}
Status: ${input.status}
Candidates: ${input.candidateCount} (quality gate ≥50: ${input.requiresQuality})
Prior decisions: ${JSON.stringify(input.approvals)}
Sample rows: ${JSON.stringify(sample)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text()?.trim();
  if (!text) {
    throw new AppError(502, "Gemini returned an empty response", "AI_EMPTY");
  }
  return text;
}
