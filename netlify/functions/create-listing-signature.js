import { ethers } from 'ethers';

// --- Environment Variable and ABI Loading ---
const {
    SIGNER_PRIVATE_KEY,
    JSON_RPC_URL,
    LISTING_MANAGER_ADDRESS,
} = process.env;

// --- Request Validation ---

const validateRequest = (event) => {
    if (event.httpMethod !== "POST") {
        return { error: { statusCode: 405, body: "Method Not Allowed" } };
    }

    try {
        const body = JSON.parse(event.body);
        console.log("Received request body:", body);
        
        // Validate all required fields
        if (body.listingType === undefined || body.listingType === null || 
            !body.dataIdentifier || !body.userAddress || !body.feeInToken || 
            !body.deadline || !body.chainId || !body.verifyingContract) {
            console.error("Missing fields:", {
                listingType: body.listingType !== undefined && body.listingType !== null,
                dataIdentifier: !!body.dataIdentifier,
                userAddress: !!body.userAddress,
                feeInToken: !!body.feeInToken,
                deadline: !!body.deadline,
                chainId: !!body.chainId,
                verifyingContract: !!body.verifyingContract
            });
            throw new Error("Missing required fields: listingType, dataIdentifier, userAddress, feeInToken, deadline, chainId, verifyingContract");
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
    const { listingType, dataIdentifier, userAddress, feeInToken, deadline, chainId, verifyingContract } = body;

    try {
        // Create provider and signer
        const provider = new ethers.JsonRpcProvider(JSON_RPC_URL);
        const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY);
        
        console.log("=== SIGNATURE GENERATION DEBUG ===");
        console.log("Signer address:", await signer.getAddress());
        console.log("Contract address from request:", verifyingContract);
        console.log("Contract address from env:", LISTING_MANAGER_ADDRESS);
        console.log("ChainId from request:", chainId);
        console.log("Raw feeInToken from request:", feeInToken);
        console.log("Raw feeInToken type:", typeof feeInToken);
        
        // CRITICAL CHECK: Ensure the signer address matches the contract's trustedSigner
        console.log("IMPORTANT: The signer address above MUST match the contract's trustedSigner address!");
        
        // CRITICAL CHECK: Ensure contract addresses match
        if (verifyingContract.toLowerCase() !== LISTING_MANAGER_ADDRESS.toLowerCase()) {
            console.error("CONTRACT ADDRESS MISMATCH!");
            console.error("Frontend contract address:", verifyingContract);
            console.error("Environment contract address:", LISTING_MANAGER_ADDRESS);
            throw new Error("Contract address mismatch between frontend and environment");
        }
        
        // Get the actual network chainId from the provider
        const network = await provider.getNetwork();
        console.log("Provider network chainId:", network.chainId);
        
        // IMPORTANT: Use the provider's chainId, not the frontend's chainId
        // This ensures we match the contract's deployed network
        const actualChainId = Number(network.chainId);
        
        // Create EIP-712 domain using the actual network chainId
        const domain = {
            name: 'ListingManager',
            version: '1',
            chainId: actualChainId,
            verifyingContract: verifyingContract,
        };
        
        // EIP-712 types
        const types = {
            Listing: [
                { name: 'listingType', type: 'uint256' },
                { name: 'dataIdentifier', type: 'string' },
                { name: 'userAddress', type: 'address' },
                { name: 'feeInToken', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        };
        
        // Prepare the value object with correct types
        const value = {
            listingType: parseInt(listingType),           // uint256
            dataIdentifier: dataIdentifier,               // string
            userAddress: userAddress,                     // address
            feeInToken: ethers.parseEther(feeInToken),   // uint256 - Use the actual fee from request
            deadline: parseInt(deadline),                 // uint256
        };
        
        console.log("Domain:", domain);
        console.log("Types:", types);
        console.log("Value to sign:", value);
        console.log("Value types:", {
            listingType: typeof value.listingType,
            dataIdentifier: typeof value.dataIdentifier,
            userAddress: typeof value.userAddress,
            feeInToken: typeof value.feeInToken,
            deadline: typeof value.deadline
        });

        // Sign the EIP-712 typed data payload
        const signature = await signer.signTypedData(domain, types, value);
        
        console.log("Generated signature:", signature);
        
        // CRITICAL: Ensure the signature format matches what the contract expects
        // The contract uses ECDSA.recover() which expects a specific signature format
        const signatureObj = ethers.Signature.from(signature);
        console.log("Signature components:", {
            r: signatureObj.r,
            s: signatureObj.s,
            v: signatureObj.v,
            yParity: signatureObj.yParity
        });
        
        // Verify the signature locally to ensure it's valid
        try {
            const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
            console.log("Locally recovered address:", recoveredAddress);
            console.log("Expected signer address:", await signer.getAddress());
            console.log("Local verification successful:", recoveredAddress === await signer.getAddress());
            
            // Also test ECDSA.recover directly (what the contract does)
            const messageHash = ethers.TypedDataEncoder.hash(domain, types, value);
            const ecdsaRecovered = ethers.recoverAddress(messageHash, signature);
            console.log("ECDSA.recover result:", ecdsaRecovered);
            console.log("ECDSA verification:", ecdsaRecovered === await signer.getAddress());
            
        } catch (verifyError) {
            console.error("Local verification failed:", verifyError);
        }

        console.log("=== END DEBUG ===");

        return {
            statusCode: 200,
            headers,
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