import axios from "axios";
import { Readable } from "stream";
import process from "process";
import FormData from "form-data";
import { Buffer } from "buffer";

const { PINATA_JWT, NODE_ENV } = process.env;

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle CORS preflight
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

    // ⚡ MOCK MODE for local dev
if (!PINATA_JWT) {
  console.log("⚡ Mocking IPFS upload (no Pinata JWT set).");

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      listingMetadataHash: "bafyMockMetadataCid12345",
      listingMetadataUrl: "ipfs://bafyMockMetadataCid12345",
      images: [], // no actual uploads in mock
      isMock: true,
    }),
  };
}

    // -------------------------------
    // ✅ Production flow using Pinata
    // -------------------------------

    const uploadedImages = [];
    const errors = [];

    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        try {
          const imageData = images[i];
          if (!imageData.data || !imageData.name || !imageData.type) {
            errors.push(`Image ${i + 1}: Invalid image data format`);
            continue;
          }

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

          console.log(`Image ${i + 1} uploaded successfully:`, result.IpfsHash);
        } catch (error) {
          console.error(`Error uploading image ${i + 1}:`, error);
          if (error.response) {
            console.error("Pinata API Error:", {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers,
            });
          }
          errors.push(`Image ${i + 1}: ${error.message}`);
        }
      }
    } else {
      console.log("⚠️ No images provided — skipping image upload.");
    }

    const listingMetadata = {
      ...listingData,
      images: uploadedImages,
      uploadedAt: new Date().toISOString(),
      totalImages: uploadedImages.length,
    };

    let metadataResult;
    try {
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
      metadataResult = metadataResponse.data;
      console.log(
        "Listing metadata uploaded to IPFS successfully:",
        metadataResult.IpfsHash
      );
    } catch (metadataError) {
      console.error("Failed to upload metadata:", metadataError);
      if (metadataError.response) {
        console.error("Metadata API Error:", {
          status: metadataError.response.status,
          data: metadataError.response.data,
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
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`,
        images: uploadedImages,
        errors: errors.length > 0 ? errors : undefined,
        isMock: false,
      }),
    };
  } catch (error) {
    console.error("Error in upload-images-to-ipfs:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to upload images/metadata to IPFS",
        details: error.message,
      }),
    };
  }
};
