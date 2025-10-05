import pinataSDK from '@pinata/sdk';

// --- Environment Variables ---
// These must be set in your Netlify project's build & deploy settings
// and in your local .env file for testing.
const { PINATA_API_KEY, PINATA_API_SECRET } = process.env;

export async function handler(event) {
    // Configure CORS
    const headers = {
        'Access-Control-Allow-Origin': '*', // In production, restrict this
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    // --- Validate Request ---
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
        console.error("Server config error: Pinata API keys not set.");
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error." }) };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: "Method Not Allowed" };
    }

    try {
        const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);
        const data = JSON.parse(event.body);

        // We can add more data to the object before pinning
        const objectToPin = {
            submittedAt: new Date().toISOString(),
            ...data
        };

        const options = {
            pinataMetadata: {
                name: `Vendor Simulation: ${data.name || 'Custom Vendor'}`,
                keyvalues: {
                    wallet: data.wallet || 'unknown'
                }
            },
        };

        const result = await pinata.pinJSONToIPFS(objectToPin, options);

        return { statusCode: 200, headers, body: JSON.stringify({ ipfsHash: result.IpfsHash }) };

    } catch (error) {
        console.error("Error pinning to Pinata:", error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to submit simulation." }) };
    }
}
