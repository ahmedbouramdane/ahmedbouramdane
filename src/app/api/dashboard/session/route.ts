import { forwardDashboardRequest } from "../_lib";

export async function GET(request: Request) {
  return forwardDashboardRequest(request, "/session", "GET");
}
