import { portfolioBackendUrl } from "../_backend";

const dashboardApiUrl =
  process.env.PORTFOLIO_ADMIN_API_URL ?? portfolioBackendUrl("/api/v1/admin");
const maximumRequestBytes = 16_384;
const maximumImageBytes = 5 * 1024 * 1024;
const maximumMultipartBytes = maximumImageBytes + 64 * 1024;
const adminCookieName = "portfolio_admin_session";

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
      { detail: "This request must come from the dashboard origin." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return null;
}

export async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { error: Response.json({ detail: "Send the dashboard request as JSON." }, { status: 415 }) };
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumRequestBytes) {
    return { error: Response.json({ detail: "The dashboard request is too large." }, { status: 413 }) };
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maximumRequestBytes) {
    return { error: Response.json({ detail: "The dashboard request is too large." }, { status: 413 }) };
  }

  try {
    return { body: JSON.stringify(JSON.parse(body) as unknown) };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { error: Response.json({ detail: "The dashboard request is not valid JSON." }, { status: 400 }) };
    }
    throw error;
  }
}

export async function readImageUpload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return { error: Response.json({ detail: "Choose an image file to upload." }, { status: 415 }) };
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maximumMultipartBytes) {
    return { error: Response.json({ detail: "Images must be 5 MB or smaller." }, { status: 413 }) };
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return { error: Response.json({ detail: "The image upload was empty." }, { status: 400 }) };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maximumMultipartBytes) {
      await reader.cancel();
      return { error: Response.json({ detail: "Images must be 5 MB or smaller." }, { status: 413 }) };
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const parsedRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body,
    });
    const formData = await parsedRequest.formData();
    const image = formData.get("image");
    const formKeys = Array.from(formData.keys());
    if (formKeys.length !== 1 || formKeys[0] !== "image" || formData.getAll("image").length !== 1 || typeof image === "string" || image === null) {
      return { error: Response.json({ detail: "Upload one image file." }, { status: 400 }) };
    }
    if (image.size > maximumImageBytes) {
      return { error: Response.json({ detail: "Images must be 5 MB or smaller." }, { status: 413 }) };
    }
    return { formData };
  } catch (error) {
    if (error instanceof TypeError) {
      return { error: Response.json({ detail: "The image upload could not be read." }, { status: 400 }) };
    }
    throw error;
  }
}

export async function forwardDashboardRequest(
  request: Request,
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: string | FormData,
) {
  const headers = new Headers({ Accept: "application/json" });
  const sessionCookie = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${adminCookieName}=`));
  if (sessionCookie) headers.set("Cookie", sessionCookie);
  if (typeof body === "string") headers.set("Content-Type", "application/json");

  try {
    const backendResponse = await fetch(`${dashboardApiUrl}${endpoint}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    const contentType = backendResponse.headers.get("content-type");
    const setCookie = backendResponse.headers.get("set-cookie");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    if (setCookie) responseHeaders.set("Set-Cookie", setCookie);
    const responseBody = backendResponse.status === 204 ? null : await backendResponse.text();
    return new Response(responseBody, { status: backendResponse.status, headers: responseHeaders });
  } catch (error) {
    console.error("Portfolio dashboard API request failed", error);
    return Response.json(
      { detail: "The dashboard service is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
