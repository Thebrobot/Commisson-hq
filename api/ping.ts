import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Minimal health check - confirms API routes work. */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true, msg: "pong" });
}
