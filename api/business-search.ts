import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors } from "../src/lib/apiCors";
import {
  formatNominatimAddress,
  industryFromGoogleTypes,
  type BusinessLookupHit,
} from "../src/lib/businessLookup";

/**
 * GET /api/business-search?q=Acme+Dental
 * Google Places Text Search when GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) is set.
 * Otherwise OpenStreetMap Nominatim.
 */

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  types?: string[];
}

async function searchGoogle(query: string, apiKey: string): Promise<BusinessLookupHit[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.types",
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: 6,
      languageCode: "en",
      regionCode: "US",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text.trim() || `Google Places returned ${res.status}`);
  }

  const data = (await res.json()) as { places?: GooglePlace[] };
  return (data.places ?? []).map((place, index) => ({
    id: place.id || `google-${index}`,
    name: place.displayName?.text?.trim() || query,
    address: place.formattedAddress?.trim() || "",
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
    website: place.websiteUri || null,
    industry: industryFromGoogleTypes(place.types),
    source: "google" as const,
  }));
}

async function searchNominatim(query: string): Promise<BusinessLookupHit[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "us");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "CommissionHQ/1.0 (business lookup; info@thebrobot.com)",
    },
  });

  if (!res.ok) {
    throw new Error(`Places search returned ${res.status}`);
  }

  const rows = (await res.json()) as Array<{
    place_id?: number;
    name?: string;
    display_name?: string;
    address?: Record<string, string>;
  }>;

  return rows.map((row, index) => {
    const name =
      row.name?.trim() ||
      row.address?.amenity ||
      row.address?.office ||
      row.display_name?.split(",")[0]?.trim() ||
      query;
    return {
      id: row.place_id != null ? `osm:${row.place_id}` : `osm-${index}`,
      name,
      address: formatNominatimAddress(row),
      phone: null,
      website: null,
      industry: null,
      source: "openstreetmap" as const,
    };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const raw = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  const q = String(raw ?? "").trim();
  if (q.length < 3) {
    return res.status(200).json({ suggestions: [] as BusinessLookupHit[] });
  }

  const googleKey =
    process.env.GOOGLE_PLACES_API_KEY?.trim() || process.env.GOOGLE_MAPS_API_KEY?.trim();

  try {
    const suggestions = googleKey ? await searchGoogle(q, googleKey) : await searchNominatim(q);
    return res.status(200).json({ suggestions, provider: googleKey ? "google" : "openstreetmap" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[business-search]", msg);
    return res.status(502).json({ error: "Business lookup failed", details: msg });
  }
}
