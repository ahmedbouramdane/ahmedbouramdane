import { forwardAccountRequest } from "../../account/_lib";
import { readJsonBody, rejectCrossOriginRequest } from "../../dashboard/_lib";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardAccountRequest(request, "/api/v1/assistant/chat", "POST", parsed.body);
}
