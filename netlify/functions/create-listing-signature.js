import { ethers } from 'ethers';

// --- Environment Variable and ABI Loading ---
// No change to ABI import, assuming it's correct for your setup.
import ListingManager from '../abi/ListingManager.json' with { type: 'json' };

const {
    SIGNER_PRIVATE_KEY,
    JSON_RPC_URL,
    LISTING_MANAGER_ADDRESS,
} = process.env;


// --- EIP-712 Configuration ---

/**
 * The EIP-712 domain.
 * The `name` must exactly match the name used in your smart contract's constructor.
 */
const getDomain = (chainId, verifyingContract) => ({
    name: 'ListingManager', // Corrected to match the proposed contract name
    version: '1',
    chainId,
    verifyingContract,
});

/**
 * The EIP-712 type definition.
 * This structure now includes all required fields and matches the proposed contract.
 */
const types = {
    Listing: [
        { name: 'listingType', type: 'string' },
        { name: 'dataIdentifier', type: 'string' },
        { name: 'userAddress', type: 'address' },
        { name: 'feeInToken', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
};


// --- Request Validation ---

/**
 * Validates the incoming request body.
 */
const validateRequest = (event) => {
    if (event.httpMethod !== "POST") {
        return { error: { statusCode: 405, body: "Method Not Allowed" } };
    }

    try {
        const body = JSON.parse(event.body);
        // Added checks for feeInToken and deadline
        if (!body.listingType || !body.dataIdentifier || !body.userAddress || !body.feeInToken || !body.deadline) {
            throw new Error("Missing required fields: listingType, dataIdentifier, userAddress, feeInToken, deadline");
        }
        return { body };
    } catch (e) {
        return { error: { statusCode: 400, body: JSON.stringify({ error: `Invalid request body: ${e.message}` }) } };
    }
};


// --- Netlify Handler Function ---

export const handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    // Handle CORS preflight requests
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers, body: "" };
    }

    // Check for server configuration errors
    if (!SIGNER_PRIVATE_KEY || !JSON_RPC_URL || !LISTING_MANAGER_ADDRESS) {
        console.error("Server configuration error: Required environment variables are not set.");
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error." }) };
    }

    const { body, error: validationError } = validateRequest(event);
    if (validationError) {
        return { ...validationError, headers };
    }

    // Destructure all required fields from the body
    const { listingType, dataIdentifier, userAddress, feeInToken, deadline } = body;

    try {
        const provider = new ethers.JsonRpcProvider(JSON_RPC_URL);
        // The signer does not need the provider to sign, only to fetch network info if needed.
        const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY);

        const { chainId } = await provider.getNetwork();

        const domain = getDomain(chainId, LISTING_MANAGER_ADDRESS);

        // The data to be signed, matching the `types` definition.
        const value = {
            listingType,
            dataIdentifier,
            userAddress,
            feeInToken,
            deadline,
        };

        // Sign the EIP-712 typed data payload
        const signature = await signer.signTypedData(domain, types, value);

        return {
            statusCode: 200,
            headers,
            // The signature is the only thing the frontend needs from this function.
            body: JSON.stringify({ signature }),
        };
    } catch (error) {
        console.error("Error generating signature:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Failed to generate signature.", details: error.message }),
        };
    }
};