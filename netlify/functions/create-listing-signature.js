import { ethers } from 'ethers';
import 'dotenv/config';
import process from 'process';
import signListing from '../../scripts/signListing.js';

// Load the private key from Netlify's environment variables
const { SIGNER_PRIVATE_KEY } = process.env;

// --- Request Validation ---
const validateRequest = (event) => {
  if (event.httpMethod !== "POST") {
    return { error: { statusCode: 405, body: "Method Not Allowed" } };
  }
  try {
    const body = JSON.parse(event.body);
    if (
      !body.user ||
      !body.dataIdentifier ||
      !body.nonce ||
      !body.deadline ||
      !body.chainId ||
      !body.verifyingContract
    ) {
      throw new Error("Missing required fields for signature.");
    }
    return { body };
  } catch (e) {
    return {
      error: {
        statusCode: 400,
        body: JSON.stringify({ error: `Invalid request body: ${e.message}` }),
      },
    };
  }
};

// --- Netlify Handler Function ---
export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*", // Or restrict to your domain in prod
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (!SIGNER_PRIVATE_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Server configuration error: Signer key not set.",
      }),
    };
  }

  const { body, error: validationError } = validateRequest(event);
  if (validationError) {
    return { ...validationError, headers };
  }

  const { user, dataIdentifier, nonce, deadline, chainId, verifyingContract } = body;

  try {
    const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY);

    // ✅ Reuse centralized signListing util
    const { signature } = await signListing({
      signer,
      user,
      dataIdentifier,
      nonce,
      deadline,
      chainId,
      verifyingContract,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ signature, nonce, deadline, dataIdentifier }),
    };
  } catch (error) {
    console.error("Error generating signature:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to generate signature.",
        details: error.message,
      }),
    };
  }
}
