import { connection } from "next/server";
import { portfolioBackendUrl } from "../_backend";

const projectsApiUrl = process.env.PORTFOLIO_PROJECTS_API_URL
  ?? portfolioBackendUrl("/api/v1/projects");

export async function GET() {
  await connection();
  try {
    const backendResponse = await fetch(projectsApiUrl, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const headers = new Headers({ "Cache-Control": "no-store" });
    const contentType = backendResponse.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    return new Response(backendResponse.body, { status: backendResponse.status, headers });
  } catch (error) {
    console.error("Portfolio project API request failed", error);
    return Response.json(
      { detail: "Projects are temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
