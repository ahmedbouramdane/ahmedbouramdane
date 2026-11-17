import { forwardAccountRequest, readAccountProfile, readAccountRegistration } from "../_lib";
import { readJsonBody, rejectCrossOriginRequest } from "../../dashboard/_lib";

type RouteContext = { params: Promise<{ segments: string[] }> };

async function getSegments(context: RouteContext) {
  return (await context.params).segments;
}

function isConversationId(value: string) {
  return /^[A-Za-z0-9_-]{24,48}$/.test(value);
}

function noRoute() {
  return Response.json({ detail: "Account route not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request, context: RouteContext) {
  const segments = await getSegments(context);
  if (segments.length === 1 && segments[0] === "session") {
    return forwardAccountRequest(request, "/api/v1/account/session", "GET");
  }
  if (segments.length === 1 && segments[0] === "username-availability") {
    const username = new URL(request.url).searchParams.get("username");
    if (!username) return Response.json({ detail: "Enter a username to check." }, { status: 400 });
    const query = new URLSearchParams({ username });
    return forwardAccountRequest(request, `/api/v1/account/username-availability?${query}`, "GET");
  }
  if (segments.length === 1 && segments[0] === "conversations") {
    const url = new URL(request.url);
    const params = new URLSearchParams();
    if (url.searchParams.has("limit")) params.set("limit", url.searchParams.get("limit")!);
    if (url.searchParams.has("offset")) params.set("offset", url.searchParams.get("offset")!);
    const qs = params.toString();
    return forwardAccountRequest(request, `/api/v1/account/conversations${qs ? `?${qs}` : ""}`, "GET");
  }
  if (segments.length === 1 && segments[0] === "messages") {
    const url = new URL(request.url);
    const params = new URLSearchParams();
    if (url.searchParams.has("limit")) params.set("limit", url.searchParams.get("limit")!);
    if (url.searchParams.has("before")) params.set("before", url.searchParams.get("before")!);
    const qs = params.toString();
    return forwardAccountRequest(request, `/api/v1/account/messages${qs ? `?${qs}` : ""}`, "GET");
  }
  if (segments.length === 2 && segments[0] === "conversations" && isConversationId(segments[1])) {
    const url = new URL(request.url);
    const params = new URLSearchParams();
    if (url.searchParams.has("limit")) params.set("limit", url.searchParams.get("limit")!);
    if (url.searchParams.has("offset")) params.set("offset", url.searchParams.get("offset")!);
    if (url.searchParams.has("before")) params.set("before", url.searchParams.get("before")!);
    const qs = params.toString();
    return forwardAccountRequest(request, `/api/v1/account/conversations/${segments[1]}${qs ? `?${qs}` : ""}`, "GET");
  }
  return noRoute();
}

export async function POST(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const segments = await getSegments(context);
  if (segments.length !== 1) return noRoute();
  if (segments[0] === "register") {
    const parsed = await readAccountRegistration(request);
    if ("error" in parsed) return parsed.error;
    return forwardAccountRequest(request, "/api/v1/account/register", "POST", parsed.formData);
  }
  if (segments[0] === "login") {
    const parsed = await readJsonBody(request);
    if ("error" in parsed) return parsed.error;
    return forwardAccountRequest(request, "/api/v1/account/login", "POST", parsed.body);
  }
  if (segments[0] === "logout" || segments[0] === "conversations") {
    return forwardAccountRequest(request, `/api/v1/account/${segments[0]}`, "POST");
  }
  if (segments[0] === "messages") {
    const parsed = await readJsonBody(request);
    if ("error" in parsed) return parsed.error;
    return forwardAccountRequest(request, "/api/v1/account/messages", "POST", parsed.body);
  }
  return noRoute();
}

export async function PATCH(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const segments = await getSegments(context);
  if (segments.length === 1 && segments[0] === "profile") {
    const parsed = await readAccountProfile(request);
    if ("error" in parsed) return parsed.error;
    return forwardAccountRequest(request, "/api/v1/account/profile", "PATCH", parsed.formData);
  }
  return noRoute();
}

export async function DELETE(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const segments = await getSegments(context);
  if (segments.length === 2 && segments[0] === "conversations" && isConversationId(segments[1])) {
    return forwardAccountRequest(request, `/api/v1/account/conversations/${segments[1]}`, "DELETE");
  }
  return noRoute();
}
