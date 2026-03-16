const STORAGE_KEY = "commission-rep-overrides";

export interface RepProfileOverride {
  name?: string;
  email?: string;
  avatar?: string;
}

export function getRepOverrides(): Record<string, RepProfileOverride> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, RepProfileOverride>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function setRepOverride(repId: string, override: Partial<RepProfileOverride>): void {
  const overrides = getRepOverrides();
  const current = overrides[repId] ?? {};
  const merged: RepProfileOverride = {};
  for (const key of ["name", "email", "avatar"] as const) {
    const val = override[key] !== undefined ? override[key] : current[key];
    if (val != null && val !== "") {
      merged[key] = val;
    }
  }
  if (Object.keys(merged).length === 0) {
    const next = { ...overrides };
    delete next[repId];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    overrides[repId] = merged;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }
}
