import { portfolioBackendUrl } from "../_backend";

const studyApiUrl =
  process.env.PORTFOLIO_STUDY_API_URL ?? portfolioBackendUrl("/api/v1/study");
const maximumRequestBytes = 32_768;
const studyCookieName = "portfolio_study_session";

export function rejectCrossOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const requestHost = forwardedHost ?? request.headers.get("host") ?? requestUrl.host;
  const requestProtocol = forwardedProtocol ?? requestUrl.protocol.slice(0, -1);
  const expectedOrigin = `${requestProtocol}://${requestHost}`;
  const referer = request.headers.get("referer");
  let isSameOrigin = origin === expectedOrigin;
  if (!origin && referer) {
    try {
      isSameOrigin = new URL(referer).origin === expectedOrigin;
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
  }
  if (!isSameOrigin) {
    return Response.json(
      { detail: "This request must come from the study app origin." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return null;
}

export async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { error: Response.json({ detail: "Send the study request as JSON." }, { status: 415 }) };
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumRequestBytes) {
    return { error: Response.json({ detail: "The study request is too large." }, { status: 413 }) };
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maximumRequestBytes) {
    return { error: Response.json({ detail: "The study request is too large." }, { status: 413 }) };
  }

  try {
    return { body: JSON.stringify(JSON.parse(body) as unknown) };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { error: Response.json({ detail: "The study request is not valid JSON." }, { status: 400 }) };
    }
    throw error;
  }
}

export function appendQuery(
  endpoint: string,
  params: Record<string, string | number | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${endpoint}?${query}` : endpoint;
}

export function parsePositiveInt(value: string | null) {
  if (value === null || value === "") return undefined;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function forwardStudyRequest(
  request: Request,
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: string,
) {
  const headers = new Headers({ Accept: "application/json" });
  const sessionCookie = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${studyCookieName}=`));
  if (sessionCookie) headers.set("Cookie", sessionCookie);
  if (typeof body === "string") headers.set("Content-Type", "application/json");

  try {
    const backendResponse = await fetch(`${studyApiUrl}${endpoint}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    const contentType = backendResponse.headers.get("content-type");
    const setCookie = backendResponse.headers.get("set-cookie");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    if (setCookie) responseHeaders.set("Set-Cookie", setCookie);
    const responseBody = backendResponse.status === 204 ? null : await backendResponse.text();
    return new Response(responseBody, { status: backendResponse.status, headers: responseHeaders });
  } catch (error) {
    console.error("Portfolio study API request failed", error);
    return Response.json(
      { detail: "The study service is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}