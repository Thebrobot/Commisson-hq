import { useMemo, useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currency } from "@/lib/commission";
import {
  getStripePackageById,
  getStripeRow,
  stripeCheckoutPackages,
  type StripeMatrixPackageId,
} from "@/data/stripeCheckoutMatrix";

export interface MatrixLineApplyPayload {
  catalogProductId: string;
  quantity: number;
  overrideMrr: number;
  monthlyTotal: number;
}

export function lineItemFromMatrixSelection(
  packageId: StripeMatrixPackageId,
  lines: number,
): MatrixLineApplyPayload | null {
  const row = getStripeRow(packageId, lines);
  const pkg = getStripePackageById(packageId);
  if (!row || !pkg) return null;
  const perUnit = row.monthlyTotal / row.lines;
  return {
    catalogProductId: pkg.catalogProductId,
    quantity: lines,
    overrideMrr: perUnit,
    monthlyTotal: row.monthlyTotal,
  };
}

interface StripeCheckoutControlsProps {
  /** Optional: append / update deal line from matrix */
  onApplyToLine?: (payload: MatrixLineApplyPayload) => void;
  applyTargetLabel?: string;
  className?: string;
}

export function StripeCheckoutControls({
  onApplyToLine,
  applyTargetLabel,
  className = "",
}: StripeCheckoutControlsProps) {
  const [packageId, setPackageId] = useState<StripeMatrixPackageId | "">("");
  const [lines, setLines] = useState<number | "">("");

  const pkg = packageId ? getStripePackageById(packageId) : undefined;
  const lineOptions = pkg?.lineOptions ?? [];

  const selectedRow =
    packageId && lines !== ""
      ? getStripeRow(packageId, Number(lines))
      : undefined;

  const checkoutUrl = selectedRow?.url;

  const canOpen = Boolean(checkoutUrl);

  const lineSelectDisabled = !packageId;

  const applyPayload = useMemo(() => {
    if (!packageId || lines === "") return null;
    return lineItemFromMatrixSelection(packageId, Number(lines));
  }, [packageId, lines]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Package</Label>
          <Select
            value={packageId || undefined}
            onValueChange={(v) => {
              setPackageId(v as StripeMatrixPackageId);
              setLines("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select package" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[200]">
              {stripeCheckoutPackages.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Lines</Label>
          <Select
            value={lines === "" ? undefined : String(lines)}
            onValueChange={(v) => setLines(Number(v))}
            disabled={lineSelectDisabled}
          >
            <SelectTrigger disabled={lineSelectDisabled}>
              <SelectValue placeholder={packageId ? "Line count" : "Pick package first"} />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[200]">
              {lineOptions.map((o) => (
                <SelectItem key={o.lines} value={String(o.lines)}>
                  {o.lines} {o.lines === 1 ? "line" : "lines"} — {currency.format(o.monthlyTotal)}
                  /mo
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {canOpen ? (
          <Button variant="default" size="sm" className="gap-2 rounded-lg" asChild>
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
              <CreditCard className="h-4 w-4 shrink-0" />
              Open Stripe checkout
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" className="rounded-lg" disabled>
            Open Stripe checkout
          </Button>
        )}
        {onApplyToLine && applyPayload && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => onApplyToLine(applyPayload)}
          >
            {applyTargetLabel ?? "Apply to deal"}
          </Button>
        )}
      </div>
    </div>
  );
}
