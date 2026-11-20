import { forwardStudyRequest } from "../_lib";

export async function GET(request: Request) {
  return forwardStudyRequest(request, "/session", "GET");
}