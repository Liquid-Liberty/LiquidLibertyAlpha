import axios from 'axios';
import FormData from 'form-data';

const { PINATA_JWT } = process.env;

export const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (!PINATA_JWT) {
        console.error("Server config error: Pinata JWT not set.");
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error." }) };
    }
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        
        // Determine submission type
        const hasFile = data.file && data.file.buffer && data.file.originalname;
        
        if (hasFile) {
            // File Upload Mode - Upload file to IPFS
            return await handleFileUpload(data, headers);
        } else {
            // Data Only Mode - Upload JSON data to IPFS
            return await handleDataOnly(data, headers);
        }

    } catch (error) {
        console.error("Error processing vendor simulation:", error);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ 
                error: "Failed to process vendor simulation",
                details: error.message 
            }) 
        };
    }
};

// Handle file upload to IPFS
async function handleFileUpload(data, headers) {
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', Buffer.from(data.file.buffer), { 
            filename: data.file.originalname 
        });

        // Add metadata if provided
        if (data.metadata) {
            formData.append('pinataMetadata', JSON.stringify({
                name: data.metadata.name || `Vendor Simulation: ${data.name || 'Custom Vendor'}`,
                keyvalues: {
                    ...data.metadata.keyvalues,
                    wallet: data.wallet || 'unknown',
                    submittedAt: new Date().toISOString()
                }
            }));
        }

        // Upload file to Pinata IPFS using JWT API
        const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS", 
            formData, 
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${PINATA_JWT}`
                }
            }
        );

        const result = response.data;
        
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
                ipfsHash: result.IpfsHash,
                message: "Vendor simulation file uploaded successfully to IPFS",
                type: "file_upload"
            }) 
        };

    } catch (error) {
        console.error("Error uploading file to Pinata IPFS:", error);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ 
                error: "Failed to upload vendor simulation file to IPFS",
                details: error.message 
            }) 
        };
    }
}

// Handle data-only submission to IPFS
async function handleDataOnly(data, headers) {
    try {
        // Prepare JSON data for IPFS
        const objectToPin = {
            submittedAt: new Date().toISOString(),
            name: data.name || 'Custom Vendor',
            wallet: data.wallet || 'unknown',
            totalRevenue: data.totalRevenue || 0,
            annualSales: data.annualSales || 0,
            cardPercentage: data.cardPercentage || 0,
            logo: data.logo || '',
            // Add any other vendor data
            ...data
        };

        // Upload JSON data to Pinata IPFS using JWT API
        const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinJSONToIPFS",
            objectToPin,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${PINATA_JWT}`
                }
            }
        );

        const result = response.data;
        
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
                ipfsHash: result.IpfsHash,
                message: "Vendor simulation data uploaded successfully to IPFS",
                type: "data_only"
            }) 
        };

    } catch (error) {
        console.error("Error uploading data to Pinata IPFS:", error);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ 
                error: "Failed to upload vendor simulation data to IPFS",
                details: error.message 
            }) 
        };
    }
}
