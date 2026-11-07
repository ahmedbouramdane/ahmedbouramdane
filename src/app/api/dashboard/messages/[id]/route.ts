import { forwardDashboardRequest, readJsonBody, rejectCrossOriginRequest } from "../../_lib";

type RouteContext = { params: Promise<{ id: string }> };

async function messageEndpoint(context: RouteContext) {
  const { id } = await context.params;
  return /^\d+$/.test(id) ? `/messages/${id}` : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const endpoint = await messageEndpoint(context);
  if (!endpoint) {
    return Response.json(
      { detail: "Invalid message ID." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardDashboardRequest(request, endpoint, "PATCH", parsed.body);
}

export async function DELETE(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const endpoint = await messageEndpoint(context);
  if (!endpoint) {
    return Response.json(
      { detail: "Invalid message ID." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  return forwardDashboardRequest(request, endpoint, "DELETE");
}
