import { forwardStudyRequest, readJsonBody, rejectCrossOriginRequest } from "../../_lib";

type RouteContext = { params: Promise<{ id: string }> };

async function homeworkEndpoint(context: RouteContext) {
  const { id } = await context.params;
  return /^[1-9]\d*$/.test(id) ? `/homeworks/${id}` : null;
}

const invalidId = () =>
  Response.json(
    { detail: "Invalid homework ID." },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );

export async function GET(request: Request, context: RouteContext) {
  const endpoint = await homeworkEndpoint(context);
  if (!endpoint) return invalidId();
  return forwardStudyRequest(request, endpoint, "GET");
}

export async function PATCH(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const endpoint = await homeworkEndpoint(context);
  if (!endpoint) return invalidId();
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardStudyRequest(request, endpoint, "PATCH", parsed.body);
}

export async function DELETE(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const endpoint = await homeworkEndpoint(context);
  if (!endpoint) return invalidId();
  return forwardStudyRequest(request, endpoint, "DELETE");
}