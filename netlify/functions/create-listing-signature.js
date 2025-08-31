import { ethers } from 'ethers';
import 'dotenv/config';

// Load the private key from Netlify's environment variables
const { SIGNER_PRIVATE_KEY } = process.env;

// --- Request Validation ---
const validateRequest = (event) => {
  if (event.httpMethod !== "POST") {
    return { error: { statusCode: 405, body: "Method Not Allowed" } };
  }
  try {
    const body = JSON.parse(event.body);
    if (!body.userAddress || !body.dataIdentifier || !body.nonce || !body.deadline || !body.chainId || !body.verifyingContract) {
      throw new Error("Missing required fields for signature.");
    }
    return { body };
  } catch (e) {
    return { error: { statusCode: 400, body: JSON.stringify({ error: `Invalid request body: ${e.message}` }) } };
  }
};

// --- Netlify Handler Function ---
export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*", // Or your specific domain for production
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (!SIGNER_PRIVATE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error: Signer key not set." }) };
  }

  const { body, error: validationError } = validateRequest(event);
  if (validationError) {
    return { ...validationError, headers };
  }

  const { userAddress, dataIdentifier, nonce, deadline, chainId, verifyingContract } = body;

  try {
    const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY);
    
    const domain = {
      name: 'ListingManager',
      version: '1',
      chainId: chainId,
      verifyingContract: verifyingContract,
    };
    
    const types = {
      CreateListing: [
        { name: 'user', type: 'address' },
        { name: 'dataIdentifier', type: 'string' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };
    
    const value = {
      user: userAddress,
      dataIdentifier: dataIdentifier,
      nonce: nonce,
      deadline: deadline,
    };
    
    const signature = await signer.signTypedData(domain, types, value);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ signature, nonce, deadline }),
    };
  } catch (error) {
    console.error("Error generating signature:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to generate signature.", details: error.message }),
    };
  }
}