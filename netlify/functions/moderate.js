import { Filter } from "content-checker";
import process from "process";
import { Buffer } from "buffer";
import { Readable } from "stream";
import { bannedWords } from "./banned-words.js";
import {array as badwordsArray} from "badwords-list";

const filter = new Filter({
  openModeratorAPIKey: process.env.OPEN_MODERATOR_API_KEY,
});

const defaultWords = badwordsArray || [];

// ✅ Load custom + default banned words into the filter
if (defaultWords.length > 0) filter.addWords(...defaultWords);
if (bannedWords.length > 0) filter.addWords(...bannedWords);

console.log("🔎 Default words:", defaultWords.length);
console.log("🔎 Custom words:", bannedWords.length);

// 🔥 Normalize obfuscated/leet text before moderation
function normalizeText(text) {
  if (!text) return "";
  text = text.replace(/(\b\w\s+)+\w\b/g, (match) => match.replace(/\s+/g, ""));
  return text
    .replace(/@/g, "a")
    .replace(/4/g, "a")
    .replace(/3/g, "e")
    .replace(/1/g, "i")
    .replace(/0/g, "o")
    .replace(/\$/g, "s")
    .replace(/µ/g, "u")
    .replace(/¡/g, "i")
    .replace(/5/g, "s")
    .replace(/\*/g, "")
    .toLowerCase();
}

// ---------------- Manual banned word check ----------------
function containsBannedWord(text) {
  if (!text) return false;
  const normalized = normalizeText(text);
  return bannedWords.some((word) => normalized.includes(word.toLowerCase()));
}

// ---------------- Safe Wrappers ----------------
async function safeTextCheck(originalText) {
  const normalized = normalizeText(originalText);
  // 1. Manual check first
  if (containsBannedWord(normalized)) {
    return { profane: true, type: ["custom-banned"] };
  }

  // 2. Skip AI check if original text is empty
  if (!originalText || !originalText.trim()) {
    return { profane: false, type: ["empty"] };
  }

  // 3. AI moderation on raw text
  try {
    console.log("🚀 Sending to OpenModerator:", {
      prompt: originalText,
      config: { provider: "google-perspective-api", checkManualProfanityList: true },
    });
    return await filter.isProfaneAI(originalText, {
      provider: "google-perspective-api",
      checkManualProfanityList: true,
    });
  } catch (err) {
    console.error("⚠️ Text moderation failed:", err.message);
    return { profane: false, type: ["fallback"] };
  }
}

async function safeImageCheck(img) {
  try {
    const buffer = Buffer.from(img.data.split(",")[1], "base64");

    // 👇 Convert Buffer to Blob (fix)
    const blob = new Blob([buffer], { type: img.type });
    return await filter.isImageNSFW(blob);
  } catch (err) {
    console.error("⚠️ Image moderation failed:", err.message);
    return { nsfw: false, type: ["fallback"] };
  }
}

// ---------------- Main Handler ----------------
export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { text, image } = body;

    // Case 1: Text Moderation
    if (text) {
      const result = await safeTextCheck(text);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          type: "text",
          input: text,
          ...result,
        }),
      };
    }

    // Case 2: Image Moderation
    if (Array.isArray(image) && image.length > 0) {
      const results = [];
      for (const img of image) {
        if (!img.data) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Image data missing." }),
          };
        }
        const result = await safeImageCheck(img);
        results.push({ input: img.name || "upload.jpg", ...result });
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          type: "image",
          results,
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "No text or image provided." }),
    };
  } catch (err) {
    console.error("❌ Moderation error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Moderation failed",
        details: err.message,
      }),
    };
  }
};
