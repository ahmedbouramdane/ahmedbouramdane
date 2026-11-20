import {
  appendQuery,
  forwardStudyRequest,
  parsePositiveInt,
  readJsonBody,
  rejectCrossOriginRequest,
} from "../_lib";

const invalidResponse = (detail: string) =>
  Response.json({ detail }, { status: 400, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const lessonId = parsePositiveInt(search.get("lesson_id"));
  if (lessonId === null) return invalidResponse("Invalid lesson ID.");

  const limitValue = search.get("limit");
  const offsetValue = search.get("offset");
  const limit = limitValue === null ? 200 : Number(limitValue);
  const offset = offsetValue === null ? 0 : Number(offsetValue);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
    return invalidResponse("The homework limit must be between 1 and 1000.");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return invalidResponse("The homework offset must be zero or greater.");
  }

  const endpoint = appendQuery("/homeworks", {
    status: search.get("status") ?? undefined,
    subject: search.get("subject") ?? undefined,
    priority: search.get("priority") ?? undefined,
    lesson_id: lessonId,
    q: search.get("q") ?? undefined,
    limit,
    offset,
  });
  return forwardStudyRequest(request, endpoint, "GET");
}

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return forwardStudyRequest(request, "/homeworks", "POST", parsed.body);
}