import { forwardStudyRequest, readJsonBody, rejectCrossOriginRequest } from "../_lib";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardStudyRequest(request, "/password", "POST", parsed.body);
}