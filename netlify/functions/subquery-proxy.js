export async function handler(event) {
  try {
    const body = JSON.parse(event.body);
    const { query, variables, chainId: incomingChainId } = body;

    const chainId = incomingChainId || 11155111;

    // Map chainId → SubQuery URL
    const subqueryUrls = {
      11155111: "https://index-api.onfinality.io/sq/Liquid-Liberty/lmkt-chart",
      943: "https://index-api.onfinality.io/sq/Liquid-Liberty/lmkt_chart_pulse",
    };

    const targetUrl = subqueryUrls[chainId];
    if (!targetUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Unsupported chainId: ${chainId}` }),
      };
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    console.error("Proxy error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Proxy request failed",
        details: error.message,
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  }
}
