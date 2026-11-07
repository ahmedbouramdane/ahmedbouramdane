import { forwardDashboardRequest, readJsonBody, rejectCrossOriginRequest } from "../_lib";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardDashboardRequest(request, "/login", "POST", parsed.body);
}
