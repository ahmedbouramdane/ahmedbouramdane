import { appendQuery, forwardStudyRequest, parsePositiveInt } from "../_lib";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const subjectId = parsePositiveInt(search.get("subject_id"));
  if (subjectId === null) {
    return Response.json(
      { detail: "Invalid subject ID." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const endpoint = appendQuery("/lessons", {
    subject_id: subjectId,
    status: search.get("status") ?? undefined,
    q: search.get("q") ?? undefined,
  });
  return forwardStudyRequest(request, endpoint, "GET");
}