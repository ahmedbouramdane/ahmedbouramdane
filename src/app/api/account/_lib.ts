import { portfolioBackendUrl } from "../_backend";

const userCookieName = "portfolio_user_session";
const maximumRegistrationBytes = 5 * 1024 * 1024 + 64 * 1024;
const maximumImageBytes = 5 * 1024 * 1024;

export async function readAccountRegistration(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return { error: Response.json({ detail: "Submit the account form as multipart form data." }, { status: 415 }) };
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maximumRegistrationBytes) {
    return { error: Response.json({ detail: "The account form or image is too large." }, { status: 413 }) };
  }

  const reader = request.body?.getReader();
  if (!reader) return { error: Response.json({ detail: "The account form was empty." }, { status: 400 }) };
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maximumRegistrationBytes) {
      await reader.cancel();
      return { error: Response.json({ detail: "The account form or image is too large." }, { status: 413 }) };
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let formData: FormData;
  try {
    formData = await new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body,
    }).formData();
  } catch (error) {
    if (error instanceof TypeError) {
      return { error: Response.json({ detail: "The account form could not be read." }, { status: 400 }) };
    }
    throw error;
  }

  const expectedFields = new Set(["full_name", "username", "email", "password", "phone", "image"]);
  const fields = Array.from(formData.keys());
  if (fields.some((field) => !expectedFields.has(field))
    || ["full_name", "username", "email", "password", "phone"].some((field) => {
      const values = formData.getAll(field);
      return values.length !== 1 || typeof values[0] !== "string";
    })
    || formData.getAll("image").length > 1) {
    return { error: Response.json({ detail: "The account form contains invalid fields." }, { status: 400 }) };
  }
  const image = formData.get("image");
  if (image !== null && (typeof image === "string" || image.size > maximumImageBytes)) {
    return { error: Response.json({ detail: "Choose an image file up to 5 MB." }, { status: 413 }) };
  }
  return { formData };
}

export async function forwardAccountRequest(
  request: Request,
  endpoint: string,
  method: "GET" | "POST" | "DELETE",
  body?: string | FormData,
) {
  const headers = new Headers({ Accept: "application/json" });
  const sessionCookie = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${userCookieName}=`));
  if (sessionCookie) headers.set("Cookie", sessionCookie);
  if (typeof body === "string") headers.set("Content-Type", "application/json");

  try {
    const backendResponse = await fetch(portfolioBackendUrl(endpoint), {
      method,
      headers,
      ...(body === undefined ? {} : { body }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(35_000),
    });
    if (backendResponse.status === 404 && endpoint === "/api/v1/account/register") {
      return Response.json(
        { detail: "Account registration is not available on the configured backend yet. Deploy the latest backend and try again." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    const contentType = backendResponse.headers.get("content-type");
    const setCookie = backendResponse.headers.get("set-cookie");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    if (setCookie) responseHeaders.set("Set-Cookie", setCookie);
    const responseBody = backendResponse.status === 204 ? null : await backendResponse.text();
    return new Response(responseBody, { status: backendResponse.status, headers: responseHeaders });
  } catch (error) {
    console.error("Portfolio account API request failed", error);
    return Response.json(
      { detail: "The account service is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
