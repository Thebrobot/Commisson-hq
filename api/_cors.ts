import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = new Set([
  "https://brobot-order-handoff.vercel.app",
  "https://commisson-hq.vercel.app",
]);

export function corsOrigin(req: VercelRequest): string | null {
  const origin = req.headers.origin;
  if (!origin || typeof origin !== "string") return null;
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return null;
}

export function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = corsOrigin(req);
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
