// MIGRATED TO SECURE SYSTEM - Import secure handler
import { handler as secureHandler } from './secure-subquery-proxy.js';

// BACKWARD COMPATIBILITY: Route to secure handler
export async function handler(event) {
  console.log("🔄 Legacy proxy called - routing to secure handler");

  // Add migration warning in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn("⚠️ Using legacy subquery-proxy.js - consider migrating to secure-subquery-proxy.js directly");
  }

  try {
    return await secureHandler(event);
  } catch (error) {
    console.error("🚨 Secure handler error:", error);

    // Enhanced error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Secure proxy request failed",
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff"
      }
    };
  }
}
