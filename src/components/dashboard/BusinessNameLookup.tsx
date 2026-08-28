import { useEffect, useRef, useState } from "react";
import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { hitsFromPhoton, type BusinessLookupHit } from "@/lib/businessLookup";
import { cn } from "@/lib/utils";

interface BusinessNameLookupProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (hit: BusinessLookupHit) => void;
  placeholder?: string;
  className?: string;
}

export function BusinessNameLookup({
  id = "client-name",
  value,
  onChange,
  onSelect,
  placeholder = "Start typing a business name…",
  className,
}: BusinessNameLookupProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<BusinessLookupHit[]>([]);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const skipSearch = useRef(false);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setHits([]);
      setOpen(false);
      return;
    }

    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        let next: BusinessLookupHit[] = [];
        try {
          const res = await fetch(`/api/business-search?q=${encodeURIComponent(q)}`, {
            signal: AbortSignal.timeout(2500),
          });
          if (res.ok) {
            const data = (await res.json()) as { suggestions?: BusinessLookupHit[] };
            next = data.suggestions ?? [];
          }
        } catch {
          next = [];
        }
        if (next.length === 0) {
          const photon = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&lat=39.8&lon=-98.5`,
            { signal: AbortSignal.timeout(4000) },
          );
          if (photon.ok) {
            next = hitsFromPhoton(await photon.json());
          }
        }
        setHits(next);
        setActive(0);
        setOpen(next.length > 0);
      } catch {
        setHits([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => window.clearTimeout(handle);
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (hit: BusinessLookupHit) => {
    skipSearch.current = true;
    setOpen(false);
    setHits([]);
    onSelect(hit);
  };

  return (
    <div ref={wrapRef} className="relative">
      <Input
        id={id}
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        className={className}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (hits.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open || hits.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(hits[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {loading ? (
        <p className="mt-1 text-xs text-muted-foreground">Searching businesses…</p>
      ) : null}
      {open && hits.length > 0 ? (
        <ul
          role="listbox"
          className="absolute z-[80] mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md"
        >
          {hits.map((hit, i) => (
            <li key={hit.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 rounded-sm px-2.5 py-2 text-left text-sm",
                  i === active ? "bg-accent text-accent-foreground" : "hover:bg-secondary/80",
                )}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(hit)}
              >
                <span className="font-medium">{hit.name}</span>
                {hit.address ? (
                  <span className="flex items-start gap-1 text-xs text-muted-foreground">
                    <Building2 className="mt-0.5 h-3 w-3 shrink-0" />
                    {hit.address}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
