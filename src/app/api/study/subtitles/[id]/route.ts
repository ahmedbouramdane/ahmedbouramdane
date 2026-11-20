import { forwardStudyRequest, readJsonBody, rejectCrossOriginRequest } from "../../_lib";

type RouteContext = { params: Promise<{ id: string }> };

async function subtitleEndpoint(context: RouteContext) {
  const { id } = await context.params;
  return /^[1-9]\d*$/.test(id) ? `/subtitles/${id}` : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const endpoint = await subtitleEndpoint(context);
  if (!endpoint) {
    return Response.json(
      { detail: "Invalid subtitle ID." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardStudyRequest(request, endpoint, "PATCH", parsed.body);
}