export async function handler(event) {
  try {
    const response = await fetch(
      "https://index-api.onfinality.io/sq/Liquid-Liberty/lmkt-chart/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: event.body,
      }
    );

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
