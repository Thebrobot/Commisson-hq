import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * GET /api/business-search?q=Acme+Dental
 * Google Places Text Search when GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) is set.
 * Otherwise OpenStreetMap Nominatim.
 *
 * Keep this file self-contained: Vercel Node ESM cannot resolve relative src/ imports.
 */

const ALLOWED_ORIGINS = new Set([
  "https://brobot-order-handoff.vercel.app",
  "https://commisson-hq.vercel.app",
]);

function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (typeof origin === "string") {
    const allowed =
      ALLOWED_ORIGINS.has(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (allowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

interface BusinessLookupHit {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  industry: string | null;
  source: "google" | "openstreetmap";
}

const GOOGLE_TYPE_TO_INDUSTRY: Array<{ types: string[]; industry: string }> = [
  { types: ["dentist", "doctor", "hospital", "physiotherapist", "pharmacy", "medical_lab"], industry: "Healthcare" },
  { types: ["lawyer", "attorney"], industry: "Legal / Law Firm" },
  { types: ["real_estate_agency"], industry: "Real Estate" },
  { types: ["plumber", "electrician", "roofing_contractor", "general_contractor", "locksmith", "painter"], industry: "Home Services" },
  { types: ["restaurant", "cafe", "bar", "meal_takeaway", "bakery"], industry: "Restaurant / Food & Bev" },
  { types: ["clothing_store", "store", "shopping_mall", "furniture_store"], industry: "Retail / eCommerce" },
  { types: ["car_dealer", "car_repair", "car_wash"], industry: "Automotive" },
  { types: ["bank", "accounting", "insurance_agency", "atm"], industry: "Financial Services" },
  { types: ["church", "place_of_worship"], industry: "Nonprofit" },
];

function industryFromGoogleTypes(types: string[] | undefined): string | null {
  if (!types?.length) return null;
  const set = new Set(types.map((t) => t.toLowerCase()));
  for (const row of GOOGLE_TYPE_TO_INDUSTRY) {
    if (row.types.some((t) => set.has(t))) return row.industry;
  }
  return "Professional Services";
}

function formatNominatimAddress(item: {
  display_name?: string;
  address?: Record<string, string>;
}): string {
  const a = item.address;
  if (!a) return item.display_name?.trim() || "";
  const line1 = [a.house_number, a.road].filter(Boolean).join(" ");
  const line2 = [a.city || a.town || a.village || a.hamlet, a.state, a.postcode].filter(Boolean).join(", ");
  return [line1, line2].filter(Boolean).join(", ") || item.display_name?.trim() || "";
}

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
