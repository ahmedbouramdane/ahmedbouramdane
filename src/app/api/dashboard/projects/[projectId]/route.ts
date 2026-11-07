import { forwardDashboardRequest, readJsonBody, rejectCrossOriginRequest } from "../../_lib";

type RouteContext = { params: Promise<{ projectId: string }> };

async function getProjectEndpoint(context: RouteContext): Promise<string | Response> {
  const { projectId } = await context.params;
  if (!/^[1-9]\d{0,8}$/.test(projectId)) {
    return Response.json({ detail: "Invalid project id." }, { status: 400 });
  }
  return `/projects/${projectId}`;
}

export async function PATCH(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const endpoint = await getProjectEndpoint(context);
  if (endpoint instanceof Response) return endpoint;
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardDashboardRequest(request, endpoint, "PATCH", parsed.body);
}

export async function DELETE(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const endpoint = await getProjectEndpoint(context);
  if (endpoint instanceof Response) return endpoint;
  return forwardDashboardRequest(request, endpoint, "DELETE");
}
