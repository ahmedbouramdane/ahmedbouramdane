import { forwardDashboardRequest, readJsonBody, rejectCrossOriginRequest } from "../../_lib";

type RouteContext = { params: Promise<{ certificateId: string }> };

async function getCertificateEndpoint(context: RouteContext): Promise<string | Response> {
  const { certificateId } = await context.params;
  if (!/^[1-9]\d{0,8}$/.test(certificateId)) {
    return Response.json({ detail: "Invalid certificate id." }, { status: 400 });
  }
  return `/certificates/${certificateId}`;
}

export async function PATCH(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const endpoint = await getCertificateEndpoint(context);
  if (endpoint instanceof Response) return endpoint;
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardDashboardRequest(request, endpoint, "PATCH", parsed.body);
}

export async function DELETE(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const endpoint = await getCertificateEndpoint(context);
  if (endpoint instanceof Response) return endpoint;
  return forwardDashboardRequest(request, endpoint, "DELETE");
}
