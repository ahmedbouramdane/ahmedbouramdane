import { forwardDashboardRequest, readImageUpload, rejectCrossOriginRequest } from "../_lib";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const parsed = await readImageUpload(request);
  if ("error" in parsed) return parsed.error;
  return forwardDashboardRequest(request, "/certificate-images", "POST", parsed.formData);
}
