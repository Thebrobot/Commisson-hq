import { Check } from "lucide-react";
import {
  currency,
  formatRelativeDealDate,
  getCommissionStatus,
  getProductById,
  longDateFormat,
  shortDate,
} from "@/lib/commission";
import { handoffProgress, isHandoffComplete } from "@/lib/handoff";
import { payoutConfig } from "@/data/catalog/commission";
import type { DealFeedItem } from "@/types/commission";
import { isSalesPartner } from "@/lib/repRoles";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientCardProps {
  item: DealFeedItem;
  hideCommissionUI?: boolean;
  onClick: () => void;
  onHandoffClick: (e: React.MouseEvent) => void;
  onPaidChange: (paid: boolean) => void;
}

export default function ClientCard({
  item,
  hideCommissionUI = false,
  onClick,
  onHandoffClick,
  onPaidChange,
}: ClientCardProps) {
  const productNames = item.deal.products
    .map((li) => getProductById(li.productId)?.name ?? li.productId)
    .join(", ");
  const isCancelled = item.deal.status === "cancelled";
  const mrr = isCancelled ? -item.summary.mrr : item.summary.mrr;
  const handoffComplete = isHandoffComplete(item.deal.handoff);
  const handoffCount = handoffProgress(item.deal.handoff);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`rounded-xl border border-border bg-card p-4 transition-colors cursor-pointer ${
        item.deal.paidOut
          ? "bg-green-500/5 hover:bg-green-500/5 hover:border-border"
          : "hover:border-primary/30 hover:bg-muted/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="shrink-0 rounded-full p-1.5 hover:bg-muted/50 transition-colors -m-1.5"
          onClick={onHandoffClick}
          title={handoffComplete ? "Handoff complete" : `${handoffCount}/6 complete`}
          aria-label={handoffComplete ? "Handoff complete" : `${handoffCount} of 6 handoff items complete`}
        >
          {handoffComplete ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground">
              {handoffCount}/6
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{item.deal.clientName}</p>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {item.rep.name}
            </span>
            {isSalesPartner(item.rep) && (
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                Partner
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                isCancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              }`}
            >
              {item.deal.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground truncate" title={productNames || "Setup-only"}>
            {productNames || "Setup-only"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{formatRelativeDealDate(item.deal.closeDate)}</span>
            {!hideCommissionUI && (
              <span>Payout {longDateFormat.format(item.summary.payoutDate)}</span>
            )}
            <span className="font-mono-tabular">{currency.format(mrr)} MRR</span>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            {!hideCommissionUI && (
              <p className="font-mono-tabular text-lg font-bold text-primary">
                {currency.format(item.summary.totalCommission)}
              </p>
            )}
            <div className="flex items-center gap-2">
              {!hideCommissionUI && (
                <span className="text-xs text-muted-foreground">
                  {(() => {
                    const status = getCommissionStatus(item.deal, item.summary);
                    if (status === "paid") return "Paid";
                    if (status === "cancelled") return "—";
                    if (status === "trial")
                      return (
                        <span className="text-amber-600 dark:text-amber-500">
                          Trial
                          {item.deal.firstPaymentDate &&
                            ` — ${shortDate.format(new Date(`${item.deal.firstPaymentDate}T12:00:00`))}`}
                        </span>
                      );
                    if (status === "ready") return <span className="font-medium text-primary">Ready</span>;
                    return (
                      <span>
                        In lag — {shortDate.format(item.summary.availableAt)}
                      </span>
                    );
                  })()}
                </span>
              )}
              {!hideCommissionUI && (
                <Select
                  value={item.deal.paidOut ? "paid" : "unpaid"}
                  onValueChange={(value) => onPaidChange(value === "paid")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectTrigger className="h-8 w-[5.5rem]" onClick={(e) => e.stopPropagation()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
