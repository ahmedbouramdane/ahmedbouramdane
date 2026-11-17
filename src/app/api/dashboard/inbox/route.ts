import { forwardDashboardRequest } from "../_lib";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return forwardDashboardRequest(request, `/inbox${search}`, "GET");
}
