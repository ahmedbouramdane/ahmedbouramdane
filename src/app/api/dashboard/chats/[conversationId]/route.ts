import { forwardDashboardRequest, rejectCrossOriginRequest } from "../../_lib";

type RouteContext = { params: Promise<{ conversationId: string }> };

async function getEndpoint(context: RouteContext) {
  const { conversationId } = await context.params;
  return /^[A-Za-z0-9_-]{24,48}$/.test(conversationId) ? `/chats/${conversationId}` : null;
}

export async function GET(request: Request, context: RouteContext) {
  const endpoint = await getEndpoint(context);
  if (!endpoint) return Response.json({ detail: "Invalid conversation ID." }, { status: 400 });
  return forwardDashboardRequest(request, endpoint, "GET");
}

export async function DELETE(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const endpoint = await getEndpoint(context);
  if (!endpoint) return Response.json({ detail: "Invalid conversation ID." }, { status: 400 });
  return forwardDashboardRequest(request, endpoint, "DELETE");
}
