// netlify/functions/secure-subquery-proxy.js - Enhanced security proxy
const { getAddress, isAddress } = require('ethers');

// Secure network configuration (server-side validation)
const SECURE_SERVER_CONFIG = Object.freeze({
  11155111: Object.freeze({
    name: "sepolia",
    treasury: "0x002144A5B56b6b3774774499B7AB04ED9E872dB9",
    subqueryUrl: "https://index-api.onfinality.io/sq/Liquid-Liberty/lmkt-chart",
    rateLimitPerMinute: 100
  }),
  943: Object.freeze({
    name: "pulse",
    treasury: "0xe12538Ab1990A3318395B7Cb0cE682741e68194E",
    subqueryUrl: "https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart",
    rateLimitPerMinute: 100
  }),
  31337: Object.freeze({
    name: "local",
    treasury: "0x0000000000000000000000000000000000000000",
    subqueryUrl: "http://localhost:3000",
    rateLimitPerMinute: 1000
  })
});

/**
 * Validate Ethereum address with checksum
 */
function validateAddress(address) {
  if (!address || !isAddress(address)) {
    return false;
  }
  try {
    getAddress(address); // Validates checksum
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate GraphQL query for safety
 */
function validateGraphQLQuery(query) {
  if (!query || typeof query !== 'string') {
    return { valid: false, reason: 'Query must be a string' };
  }

  // Basic GraphQL injection prevention
  const suspiciousPatterns = [
    /__schema/i,
    /__type/i,
    /mutation/i,
    /subscription/i,
    /introspection/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(query)) {
      return { valid: false, reason: `Suspicious pattern detected: ${pattern}` };
    }
  }

  // Ensure query is read-only (only allows query operations)
  if (!query.trim().toLowerCase().startsWith('query') && !query.includes('{')) {
    return { valid: false, reason: 'Only query operations allowed' };
  }

  return { valid: true };
}

/**
 * Main handler with enhanced security
 */
export async function handler(event) {
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
    }

    // Parse and validate request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      };
    }

    const { query, variables, chainId: incomingChainId } = body;

    // Validate chain ID
    const chainId = parseInt(incomingChainId) || 11155111;
    const config = SECURE_SERVER_CONFIG[chainId];

    if (!config) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Unsupported chainId: ${chainId}`,
          supportedChains: Object.keys(SECURE_SERVER_CONFIG)
        }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      };
    }

    // Validate GraphQL query
    const queryValidation = validateGraphQLQuery(query);
    if (!queryValidation.valid) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid query',
          reason: queryValidation.reason
        }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      };
    }

    // Validate variables if present
    if (variables) {
      // Check for suspicious pairId values
      if (variables.pairId && !validateAddress(variables.pairId)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid pairId format' }),
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
      }

      // Ensure pairId matches expected treasury for this chain
      if (variables.pairId) {
        const expectedTreasury = config.treasury.toLowerCase();
        const providedPairId = variables.pairId.toLowerCase();

        if (providedPairId !== expectedTreasury) {
          console.warn(`⚠️ PairId mismatch for chain ${chainId}: expected ${expectedTreasury}, got ${providedPairId}`);
          // Don't fail here - just log the warning in case of legitimate cross-chain queries
        }
      }
    }

    // Make the actual request to SubQuery
    const targetUrl = config.subqueryUrl;
    console.log(`🔗 Proxying to ${config.name} (${chainId}): ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LiquidLiberty-SecureProxy/1.0'
      },
      body: JSON.stringify({ query, variables }),
      // Add timeout for security
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error(`SubQuery error: ${response.status} ${response.statusText}`);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'SubQuery request failed',
          status: response.status
        }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      };
    }

    const data = await response.json();

    // Add security headers to response
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Cache-Control': 'no-store, max-age=0'
      }
    };

  } catch (error) {
    console.error('Secure proxy error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal proxy error',
        details: error.name // Don't expose full error details
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
}