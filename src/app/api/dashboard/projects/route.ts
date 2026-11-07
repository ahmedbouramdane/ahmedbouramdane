import { forwardDashboardRequest, readJsonBody, rejectCrossOriginRequest } from "../_lib";

export async function GET(request: Request) {
  return forwardDashboardRequest(request, "/projects", "GET");
}

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardDashboardRequest(request, "/projects", "POST", parsed.body);
}

export async function PUT(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardDashboardRequest(request, "/projects/order", "PUT", parsed.body);
}
