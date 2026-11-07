import { portfolioBackendUrl } from "../_backend";

const backendContactUrl =
  process.env.PORTFOLIO_API_URL ?? portfolioBackendUrl("/api/v1/contact");
const maximumRequestBytes = 16_384;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return Response.json({ detail: "Send the contact form as JSON." }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumRequestBytes) {
    return Response.json({ detail: "The contact form submission is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return Response.json({ detail: "The contact form submission is not valid JSON." }, { status: 400 });
    }
    throw error;
  }

  try {
    const backendResponse = await fetch(backendContactUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const responseBody: unknown = await backendResponse.json();
    return Response.json(responseBody, {
      status: backendResponse.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Portfolio contact API request failed", error);
    return Response.json(
      { detail: "The contact service is temporarily unavailable. Please use one of the direct contact links." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
