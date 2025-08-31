import { ethers } from 'ethers';
import 'dotenv/config';
import process from 'process';

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

    // EIP-712 domain
    const domain = {
      name: "ListingManager",
      version: "1",
      chainId: chainId,
      verifyingContract: verifyingContract,
    };

    // Types (must exactly match ListingManager.sol)
    const types = {
      ListingAuthorization: [
        { name: "user", type: "address" },
        { name: "dataIdentifier", type: "string" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const value = {
      user,
      dataIdentifier,
      nonce,
      deadline,
    };

    // Sign typed data (ethers v6)
    const signature = await signer.signTypedData(domain, types, value);

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
