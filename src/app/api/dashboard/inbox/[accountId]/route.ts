import { forwardDashboardRequest, readJsonBody, rejectCrossOriginRequest } from "../../_lib";

type RouteContext = { params: Promise<{ accountId: string }> };

async function getAccountId(context: RouteContext) {
  const { accountId } = await context.params;
  return /^\d{1,12}$/.test(accountId) ? accountId : null;
}

export async function GET(request: Request, context: RouteContext) {
  const accountId = await getAccountId(context);
  if (!accountId) return Response.json({ detail: "Invalid account ID." }, { status: 400 });
  return forwardDashboardRequest(request, `/inbox/${accountId}`, "GET");
}

export async function POST(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const accountId = await getAccountId(context);
  if (!accountId) return Response.json({ detail: "Invalid account ID." }, { status: 400 });
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardDashboardRequest(request, `/inbox/${accountId}`, "POST", parsed.body);
}
