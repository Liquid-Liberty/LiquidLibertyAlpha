import axios from 'axios';
import { Readable } from 'stream';

const { PINATA_JWT } = process.env;

export const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    // Check for server configuration errors
    if (!PINATA_JWT) {
        console.error("Server configuration error: Pinata JWT is not set.");
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: "Server configuration error: Pinata JWT missing." }) 
        };
    }

    // Validate request method
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers, 
            body: JSON.stringify({ error: "Method Not Allowed" }) 
        };
    }

    try {
        const body = JSON.parse(event.body);

        // Validate required fields
        if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Images array is required and must contain at least one image." })
            };
        }

        if (!body.listingData) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Listing data is required." })
            };
        }

        const { images, listingData } = body;
        const uploadedImages = [];
        const errors = [];

        // Upload each image to Pinata using JWT API
        for (let i = 0; i < images.length; i++) {
            try {
                const imageData = images[i];
                
                // Validate image data
                if (!imageData.data || !imageData.name || !imageData.type) {
                    errors.push(`Image ${i + 1}: Invalid image data format`);
                    continue;
                }

                // Convert base64 to buffer
                const imageBuffer = Buffer.from(imageData.data.split(',')[1], 'base64');
                
                // Create FormData for Pinata API
                const FormData = require('form-data');
                const formData = new FormData();
                
                // Create a readable stream from buffer
                const stream = Readable.from(imageBuffer);
                formData.append('file', stream, { filename: imageData.name });

                // Add metadata
                const metadata = {
                    name: imageData.name,
                    keyvalues: {
                        listingType: listingData.listingType || 'unknown',
                        userAddress: listingData.userAddress || 'unknown',
                        timestamp: new Date().toISOString()
                    }
                };
                formData.append('pinataMetadata', JSON.stringify(metadata));

                // Upload to Pinata using JWT API
                const response = await axios.post(
                    "https://api.pinata.cloud/pinning/pinFileToIPFS",
                    formData,
                    {
                        headers: {
                            ...formData.getHeaders(),
                            'Authorization': `Bearer ${PINATA_JWT}`
                        },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity
                    }
                );

                const result = response.data;
                
                uploadedImages.push({
                    originalName: imageData.name,
                    ipfsHash: result.IpfsHash,
                    ipfsUrl: `ipfs://${result.IpfsHash}`,
                    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
                    size: imageBuffer.length,
                    isMock: false
                });

                console.log(`Image ${i + 1} uploaded successfully:`, result.IpfsHash);

            } catch (error) {
                console.error(`Error uploading image ${i + 1}:`, error);
                if (error.response) {
                    console.error('Pinata API Error:', {
                        status: error.response.status,
                        data: error.response.data,
                        headers: error.response.headers
                    });
                }
                errors.push(`Image ${i + 1}: ${error.message}`);
            }
        }

        // If no images were uploaded successfully, return error
        if (uploadedImages.length === 0) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: "Failed to upload any images", 
                    details: errors 
                })
            };
        }

        console.log(`Upload summary: ${uploadedImages.length} images uploaded successfully`);

        // Create listing metadata object
        const listingMetadata = {
            ...listingData,
            images: uploadedImages,
            uploadedAt: new Date().toISOString(),
            totalImages: uploadedImages.length
        };

        // Upload listing metadata to IPFS using JWT API
        let metadataResult;
        try {
            const metadataResponse = await axios.post(
                "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                listingMetadata,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${PINATA_JWT}`
                    }
                }
            );
            
            metadataResult = metadataResponse.data;
            console.log("Listing metadata uploaded to IPFS successfully:", metadataResult.IpfsHash);
            
        } catch (metadataError) {
            console.error("Failed to upload metadata:", metadataError);
            if (metadataError.response) {
                console.error('Metadata API Error:', {
                    status: metadataError.response.status,
                    data: metadataError.response.data
                });
            }
            throw new Error(`Metadata upload failed: ${metadataError.message}`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                listingMetadataHash: metadataResult.IpfsHash,
                listingMetadataUrl: `ipfs://${metadataResult.IpfsHash}`,
                images: uploadedImages,
                errors: errors.length > 0 ? errors : undefined,
                isMock: false
            })
        };

    } catch (error) {
        console.error("Error in upload-images-to-ipfs:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: "Failed to upload images to IPFS", 
                details: error.message 
            })
        };
    }
};
