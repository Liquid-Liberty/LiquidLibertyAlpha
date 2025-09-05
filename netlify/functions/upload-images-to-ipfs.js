import axios from "axios";
import { Readable } from "stream";
import process from "process";
import FormData from "form-data";
import { Buffer } from "buffer";
import { Filter } from "content-checker";
import { array as badwordsArray } from "badwords-list";
import { bannedWords } from "./banned-words.js";

const { PINATA_JWT, OPEN_MODERATOR_API_KEY, DISABLE_MODERATION } = process.env;

const defaultWords = badwordsArray || [];

// ✅ Initialize filter
const filter = new Filter({
  openModeratorAPIKey: OPEN_MODERATOR_API_KEY,
});

// ✅ Extend filter with default + custom banned words
if (defaultWords.length > 0) filter.addWords(...defaultWords);
if (bannedWords.length > 0) filter.addWords(...bannedWords);

console.log(
  "🔑 API Key value (first 8 chars):",
  OPEN_MODERATOR_API_KEY?.slice(0, 8)
);
console.log("🔎 Default banned words count IPFS:", defaultWords.length);
console.log("🔎 Custom banned words count IPFS:", bannedWords.length);

// ---------------- Normalize Text ----------------
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

// ---------------- Safe Moderation Wrappers ----------------
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

  // 3. AI moderation on the original input
  try {
    console.log("🚀 Sending to OpenModerator:", {
      prompt: originalText,
      config: { provider: "google-perspective-api", checkManualProfanityList: true },
    });
    const result = await filter.isProfaneAI(originalText, {
      provider: "google-perspective-api",
      checkManualProfanityList: true,
    });
    console.log("✅ OpenModerator JSON result:", result);
    return result;
  } catch (err) {
    // Instead of just err.message, dump raw text
    if (err.response) {
      const raw = await err.response.text();
      console.error("❌ Raw response from OpenModerator:", raw);
    } else {
      console.error("❌ OpenModerator error:", err);
    }

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
    console.error("⚠️ OpenModerator image check failed:", err.message);
    return { nsfw: false, type: ["fallback"] }; // fail safe
  }
}

// ---------------- Main Handler ----------------
export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
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
    const { images = [], listingData } = body;

    if (!listingData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Listing data is required." }),
      };
    }

    // ✅ Moderation
    if (DISABLE_MODERATION !== "true") {
      if (listingData.title) {
        const titleCheck = await safeTextCheck(listingData.title);
        if (titleCheck.profane) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: "Title rejected",
              type: titleCheck.type,
            }),
          };
        }
      }

      if (listingData.description) {
        const descCheck = await safeTextCheck(listingData.description);
        if (descCheck.profane) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: "Description rejected",
              type: descCheck.type,
            }),
          };
        }
      }

      if (Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (!img.data || !img.type || !img.name) continue;

          const imageCheck = await safeImageCheck(img);
          if (imageCheck.nsfw) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                error: `Image ${i + 1} rejected`,
                type: imageCheck.type,
              }),
            };
          }
        }
      }
    }

    // ⚡ Mock mode (no Pinata key set)
    if (!PINATA_JWT) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          listingMetadataHash: "bafyMockMetadataCid12345",
          listingMetadataUrl: "ipfs://bafyMockMetadataCid12345",
          images: [],
          isMock: true,
        }),
      };
    }

    // ✅ Upload images to Pinata
    const uploadedImages = [];
    const errors = [];

    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        try {
          const imageData = images[i];
          const imageBuffer = Buffer.from(
            imageData.data.split(",")[1],
            "base64"
          );

          const formData = new FormData();
          const stream = Readable.from(imageBuffer);
          formData.append("file", stream, { filename: imageData.name });

          const metadata = {
            name: imageData.name,
            keyvalues: {
              listingType: listingData.listingType || "unknown",
              userAddress: listingData.userAddress || "unknown",
              timestamp: new Date().toISOString(),
            },
          };
          formData.append("pinataMetadata", JSON.stringify(metadata));

          const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            formData,
            {
              headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${PINATA_JWT}`,
              },
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
            }
          );

          const result = response.data;
          uploadedImages.push({
            originalName: imageData.name,
            ipfsHash: result.IpfsHash,
            ipfsUrl: `ipfs://${result.IpfsHash}`,
            gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
            size: imageBuffer.length,
            isMock: false,
          });
        } catch (err) {
          errors.push(`Image ${i + 1}: ${err.message}`);
        }
      }
    }

    // ✅ Upload metadata JSON
    const listingMetadata = {
      ...listingData,
      images: uploadedImages,
      uploadedAt: new Date().toISOString(),
      totalImages: uploadedImages.length,
    };

    const metadataResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      listingMetadata,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );

    const metadataResult = metadataResponse.data;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        listingMetadataHash: metadataResult.IpfsHash,
        listingMetadataUrl: `ipfs://${metadataResult.IpfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`,
        images: uploadedImages,
        errors: errors.length > 0 ? errors : undefined,
        isMock: false,
      }),
    };
  } catch (error) {
    console.error("❌ Top-level function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Server crashed",
        details: error.message || String(error),
      }),
    };
  }
};
