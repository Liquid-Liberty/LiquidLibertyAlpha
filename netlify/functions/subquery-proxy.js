// /netlify/functions/subquery-proxy.js
export async function handler(event) {
  try {
    // Forward body from frontend → OnFinality
    const response = await fetch(
      "https://index-api.onfinality.io/sq/liquid-liberty/lmkt-chart/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: event.body,
      }
    );

    const data = await response.text();

    return {
      statusCode: 200,
      body: data,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow dApp frontend
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
    };
  }
}
