import { forwardStudyRequest, rejectCrossOriginRequest } from "../_lib";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  return forwardStudyRequest(request, "/logout", "POST");
}