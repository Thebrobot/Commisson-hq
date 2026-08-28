export interface BusinessLookupHit {
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

export function industryFromGoogleTypes(types: string[] | undefined): string | null {
  if (!types?.length) return null;
  const set = new Set(types.map((t) => t.toLowerCase()));
  for (const row of GOOGLE_TYPE_TO_INDUSTRY) {
    if (row.types.some((t) => set.has(t))) return row.industry;
  }
  return "Professional Services";
}

export function hitsFromPhoton(data: {
  features?: Array<{ properties?: Record<string, string | number | undefined> }>;
}): BusinessLookupHit[] {
  return (data.features ?? []).map((feature, index) => {
    const p = feature.properties ?? {};
    const name = String(p.name || p.osm_value || "Business");
    const line1 = [p.housenumber, p.street].filter(Boolean).join(" ");
    const line2 = [p.city, p.state, p.postcode].filter(Boolean).join(", ");
    const address = [line1, line2].filter(Boolean).join(", ");
    return {
      id: `photon:${p.osm_id ?? index}`,
      name,
      address,
      phone: null,
      website: null,
      industry: null,
      source: "openstreetmap" as const,
    };
  });
}

export function formatNominatimAddress(item: {
  display_name?: string;
  address?: Record<string, string>;
}): string {
  const a = item.address;
  if (!a) return item.display_name?.trim() || "";
  const line1 = [a.house_number, a.road].filter(Boolean).join(" ");
  const line2 = [a.city || a.town || a.village || a.hamlet, a.state, a.postcode].filter(Boolean).join(", ");
  return [line1, line2].filter(Boolean).join(", ") || item.display_name?.trim() || "";
}
