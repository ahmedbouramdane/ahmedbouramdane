import { forwardDashboardRequest } from "../_lib";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const limit = search.get("limit") ?? "50";
  const offset = search.get("offset") ?? "0";
  if (!/^\d+$/.test(limit) || !/^\d+$/.test(offset)) {
    return Response.json(
      { detail: "Invalid message page." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  return forwardDashboardRequest(request, `/messages?limit=${limit}&offset=${offset}`, "GET");
}
