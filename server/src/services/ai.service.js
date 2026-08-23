import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ApiError } from "../utils/ApiError.js";

/**
 * AI Service — Gemini-backed study summarization.
 *
 * Design: rather than asking the model to "please return JSON" in prose
 * (fragile — models drift, wrap output in markdown fences, add commentary),
 * this uses Gemini's schema-constrained structured output
 * (generationConfig.responseMimeType + responseSchema). The system
 * instruction only needs to describe *content* quality; the SDK enforces
 * the *shape* at decode time. The response is still defensively
 * parsed/validated below — schema-constrained decoding narrows failure
 * modes, it doesn't eliminate them.
 */

let genAI = null;

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(503, "AI service is not configured (missing GEMINI_API_KEY)");
  }
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
};

const SYSTEM_INSTRUCTION = [
  "You are Orbit's study assistant, helping students review their own notes.",
  "Given a student's note, produce:",
  "- summary: a concise 2-4 sentence paragraph capturing the core idea.",
  "- keyPoints: 3-6 short, self-contained bullet-style takeaways.",
  "- studyQuestions: 2-3 review questions a student could use to test their own understanding.",
  "Base everything strictly on the provided text — never invent facts not present or implied in it.",
  "If the note is short or unclear, still produce your best-effort structured output.",
].join(" ");

const SUMMARY_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    keyPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    studyQuestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["summary", "keyPoints", "studyQuestions"],
};

/**
 * generateStudySummary — runs a note's text through Gemini and returns a
 * validated {summary, keyPoints, studyQuestions} structure.
 *
 * @param {string} content
 * @returns {Promise<{summary: string, keyPoints: string[], studyQuestions: string[]}>}
 */
export const generateStudySummary = async (content) => {
  const client = getClient();

  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: SUMMARY_SCHEMA,
      temperature: 0.4,
    },
  });

  let result;
  try {
    result = await model.generateContent(content);
  } catch (error) {
    throw new ApiError(502, `AI summarization failed: ${error.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(result.response.text());
  } catch {
    throw new ApiError(502, "AI service returned an unreadable response");
  }

  if (
    typeof parsed?.summary !== "string" ||
    !Array.isArray(parsed.keyPoints) ||
    !Array.isArray(parsed.studyQuestions)
  ) {
    throw new ApiError(502, "AI service returned an unexpected response shape");
  }

  return {
    summary: parsed.summary.trim(),
    keyPoints: parsed.keyPoints.map((point) => String(point).trim()).filter(Boolean),
    studyQuestions: parsed.studyQuestions.map((q) => String(q).trim()).filter(Boolean),
  };
};
