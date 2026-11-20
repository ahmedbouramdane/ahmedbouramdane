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
  const subjectId = parsePositiveInt(search.get("subject_id"));
  const lessonId = parsePositiveInt(search.get("lesson_id"));
  const subtitleId = parsePositiveInt(search.get("subtitle_id"));
  if (subjectId === null || lessonId === null || subtitleId === null) {
    return invalidResponse("Invalid subject, lesson, or subtitle ID.");
  }

  const limitValue = search.get("limit");
  const offsetValue = search.get("offset");
  const limit = limitValue === null ? 100 : Number(limitValue);
  const offset = offsetValue === null ? 0 : Number(offsetValue);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
    return invalidResponse("The question limit must be between 1 and 1000.");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return invalidResponse("The question offset must be zero or greater.");
  }

  const endpoint = appendQuery("/questions", {
    status: search.get("status") ?? undefined,
    subject_id: subjectId,
    lesson_id: lessonId,
    subtitle_id: subtitleId,
    priority: search.get("priority") ?? undefined,
    teacher: search.get("teacher") ?? undefined,
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
  return forwardStudyRequest(request, "/questions", "POST", parsed.body);
}