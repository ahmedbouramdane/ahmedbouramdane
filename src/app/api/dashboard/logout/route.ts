import { forwardDashboardRequest, rejectCrossOriginRequest } from "../_lib";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  return forwardDashboardRequest(request, "/logout", "POST", "{}");
}
