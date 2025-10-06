import { Filter } from "content-checker";
import { bannedWords } from "../../lib/banned-words.js";
import { array as badwordsArray } from "badwords-list";

const filter = new Filter({ openModeratorAPIKey: process.env.OPEN_MODERATOR_API_KEY });
if (badwordsArray?.length) filter.addWords(...badwordsArray);
if (bannedWords?.length)  filter.addWords(...bannedWords);

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const normalizeText = (t="") =>
  t.replace(/(\b\w\s+)+\w\b/g, m => m.replace(/\s+/g, ""))
   .replace(/@|4/g,"a").replace(/3/g,"e").replace(/1|¡/g,"i")
   .replace(/0/g,"o").replace(/\$|5/g,"s").replace(/µ/g,"u")
   .replace(/\*/g,"").toLowerCase();

const containsBannedWord = (t) => {
  const n = normalizeText(t);
  return (bannedWords||[]).some(w => n.includes(String(w).toLowerCase()));
};

async function safeTextCheck(text) {
  if (!text?.trim()) return { profane:false, type:["empty"] };
  if (containsBannedWord(text)) return { profane:true, type:["custom-banned"] };
  try {
    return await filter.isProfaneAI(text, { provider:"google-perspective-api", checkManualProfanityList:true });
  } catch (e) {
    console.error("Text moderation failed:", e?.message);
    return { profane:false, type:["fallback"] };
  }
}

async function safeImageCheck(img) {
  try {
    const [, b64] = String(img.data).split(",");
    if (!b64) throw new Error("dataURL missing comma separator");
    const blob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: img.type || "image/jpeg" });
    return await filter.isImageNSFW(blob); // { nsfw:boolean, type?: string[] }
  } catch (e) {
    console.error("Image moderation failed:", e?.message);
    return { nsfw:false, type:["fallback"] };
  }
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode:204, headers:H, body:"" };
  if (event.httpMethod !== "POST")   return { statusCode:405, headers:H, body:JSON.stringify({ error:"Method Not Allowed" }) };

  try {
    const body = JSON.parse(event.body || "{}");
    const { text, image } = body;

    if (text) {
      const result = await safeTextCheck(text);
      return { statusCode:200, headers:H, body:JSON.stringify({ type:"text", input:text, ...result }) };
    }

    if (image) {
      // accept single or array; validate carefully and give explicit 4xx reasons
      const imgs = Array.isArray(image) ? image : [image];
      const results = [];
      for (const img of imgs) {
        if (!img || typeof img !== "object")
          return { statusCode:400, headers:H, body:JSON.stringify({ error:"Invalid image payload" }) };
        if (typeof img.data !== "string" || !img.data.includes(","))
          return { statusCode:400, headers:H, body:JSON.stringify({ error:"image.data must be a dataURL string" }) };
        if (img.data.length > 6_000_000)
          return { statusCode:413, headers:H, body:JSON.stringify({ error:"Image too large for moderation (>~6MB dataURL)" }) };
        results.push({ input: img.name || "upload.jpg", ...(await safeImageCheck(img)) });
      }
      if (!Array.isArray(image)) {
        const { nsfw, type = [], input } = results[0] || {};
        return { statusCode:200, headers:H, body:JSON.stringify({ type:"image", input, nsfw, categories:type }) };
      }
      return { statusCode:200, headers:H, body:JSON.stringify({ type:"image", results }) };
    }

    return { statusCode:400, headers:H, body:JSON.stringify({ error:"No text or image provided" }) };
  } catch (e) {
    return { statusCode:500, headers:H, body:JSON.stringify({ error:"Moderation failed", details:e?.message }) };
  }
};
