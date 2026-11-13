import { portfolioBackendUrl } from "../../_backend";

type RouteContext = { params: Promise<{ imageId: string }> };
const userCookieName = "portfolio_user_session";

export async function GET(request: Request, context: RouteContext) {
  const { imageId } = await context.params;
  if (!/^[A-Za-z0-9_-]{24,48}$/.test(imageId)) {
    return Response.json({ detail: "Image not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const cookie = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${userCookieName}=`));

  try {
    const backendResponse = await fetch(portfolioBackendUrl(`/api/v1/media/${imageId}`), {
      headers: cookie ? { Cookie: cookie } : undefined,
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
