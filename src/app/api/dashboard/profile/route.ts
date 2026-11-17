import { forwardAccountRequest } from "../_lib";

export async function GET(request: Request) {
  return forwardAccountRequest(request, "/api/v1/account/session", "GET");
}

export async function PATCH(request: Request) {
  const { rejectCrossOriginRequest, readProfileUpdate } = await import("../_lib");
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const parsed = await readProfileUpdate(request);
  if ("error" in parsed) return parsed.error;
  return forwardAccountRequest(request, "/api/v1/account/profile", "PATCH", parsed.formData);
}