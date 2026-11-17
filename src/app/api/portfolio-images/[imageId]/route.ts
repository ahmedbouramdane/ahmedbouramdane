import { portfolioBackendUrl } from "../../_backend";

type RouteContext = { params: Promise<{ imageId: string }> };
const userCookieName = "portfolio_user_session";
const adminCookieName = "portfolio_admin_session";

export async function GET(request: Request, context: RouteContext) {
  const { imageId } = await context.params;
  if (!/^[A-Za-z0-9_-]{24,48}$/.test(imageId)) {
    return Response.json({ detail: "Image not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const cookies = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${userCookieName}=`) || part.startsWith(`${adminCookieName}=`)) ?? [];

  try {
    const backendResponse = await fetch(portfolioBackendUrl(`/api/v1/media/${imageId}`), {
      headers: cookies.length > 0 ? { Cookie: cookies.join("; ") } : undefined,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const headers = new Headers();
    for (const name of ["content-type", "cache-control", "x-content-type-options"]) {
      const value = backendResponse.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(backendResponse.body, { status: backendResponse.status, headers });
  } catch (error) {
    console.error("Portfolio image request failed", error);
    return Response.json(
      { detail: "The image could not be loaded." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
