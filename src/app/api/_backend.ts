const backendBaseUrl = process.env.PORTFOLIO_BACKEND_URL ?? "http://127.0.0.1:8000";

export function portfolioBackendUrl(path: string): string {
  return new URL(path, `${backendBaseUrl.replace(/\/+$/, "")}/`).toString();
}
