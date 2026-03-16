import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import {
  currency,
  formatRelativeDealDate,
  getDaysUntil,
  getProductById,
  longDateFormat,
} from "@/lib/commission";
import type { DealFeedItem } from "@/types/commission";
import { useDashboard } from "@/providers/DashboardProvider";
import ClientProfileSheet from "@/components/dashboard/ClientProfileSheet";
import RepAvatar from "@/components/dashboard/RepAvatar";

interface DealFeedProps {
  nextPayoutDate?: Date | null;
  supportingValue?: number;
}

const DealFeed = ({ nextPayoutDate, supportingValue }: DealFeedProps) => {
  const reduceMotion = useReducedMotion();
  const { feedItems, isManagerView } = useDashboard();
  const [selectedItem, setSelectedItem] = useState<DealFeedItem | null>(null);
  const visibleItems = feedItems.slice(0, 6);
  const isEmpty = visibleItems.length === 0;
  const daysToPayout = nextPayoutDate != null ? Math.max(getDaysUntil(nextPayoutDate), 0) : null;
  const isPayoutSoon = daysToPayout != null && daysToPayout <= 14;

  return (
    <>
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={`obsidian-card h-full ${isManagerView ? "p-5" : "p-4"}`}
    >
      <div className={`flex flex-col gap-1 ${isManagerView ? "mb-4" : "mb-3"}`}>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-accent" strokeWidth={2.5} />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">
            {isManagerView ? "Latest deal activity" : "Commission queue"}
          </h3>
          <motion.div
            animate={reduceMotion ? undefined : { opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-2 w-2 rounded-full bg-primary ml-auto"
          />
        </div>
        {!isManagerView && (nextPayoutDate != null || supportingValue != null) && (
          <p className={`text-xs ${isPayoutSoon && isEmpty ? "font-medium text-primary" : "text-muted-foreground"}`}>
            {nextPayoutDate
              ? `Next payout: ${longDateFormat.format(nextPayoutDate)} (${daysToPayout} days)`
              : ""}
            {nextPayoutDate && supportingValue != null && " · "}
            {supportingValue != null ? `${currency.format(supportingValue)} in 5-day hold` : ""}
            {isPayoutSoon && isEmpty && " — Add a prospect to stay on track"}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        {!isManagerView && isEmpty && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg border border-dashed border-border bg-secondary/10 p-4 text-center"
          >
            <p className="text-sm font-medium text-muted-foreground">
              No deals in the queue yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Close a deal to see it here. Your next payout is the goal.
            </p>
          </motion.div>
        )}
        <AnimatePresence>
          {visibleItems.map((item, i) => {
            const productNames = item.deal.products
              .map((lineItem) => getProductById(lineItem.productId)?.name ?? lineItem.productId)
              .join(", ");
            const isCancelled = item.deal.status === "cancelled";
            const mrr = isCancelled ? -item.summary.mrr : item.summary.mrr;
            const total = isCancelled ? mrr : item.summary.totalCommission;
            const upfront = item.summary.upfrontCommission;
            const setup = item.summary.setupCommission;

            return (
              <motion.div
                key={item.deal.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedItem(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedItem(item);
                  }
                }}
                initial={reduceMotion ? false : { opacity: 0, x: -20 }}
                animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={`cursor-pointer rounded-lg border snap-transition transition-colors hover:border-primary/30 hover:bg-secondary/40 ${isManagerView ? "p-3.5" : "p-2.5"} ${
                  item.deal.status === "cancelled"
                    ? "border-border/50 bg-background/30"
                    : "border-border bg-secondary/20"
                }`}
              >
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
                  <div className="flex flex-1 items-start gap-3">
                    <RepAvatar
                      avatar={item.rep.avatar}
                      name={item.rep.name}
                      className="mt-0.5 h-8 w-8 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{item.deal.clientName}</p>
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {item.rep.name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            item.deal.status === "cancelled"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {item.deal.status === "cancelled" ? "Cancelled" : "Active"}
                        </span>
                      </div>
                      {/* Mobile: commission prominent directly under name */}
                      <p className={`mt-1 font-mono-tabular text-xl font-bold lg:hidden ${isCancelled ? "text-destructive" : "text-primary"}`}>
                        {currency.format(total)}
                      </p>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground lg:mt-1">
                        {productNames || "Setup-only deal"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-sm font-medium text-muted-foreground">
                        <span>{formatRelativeDealDate(item.deal.closeDate)}</span>
                        <span>{longDateFormat.format(item.summary.payoutDate)} payout</span>
                        <span>{currency.format(mrr)} MRR</span>
                      </div>
                      {/* Desktop: upfront/setup breakdown shown in right column */}
                      <p className="mt-0.5 text-sm text-muted-foreground hidden lg:block">
                        {currency.format(upfront)} upfront + {currency.format(setup)} setup
                      </p>
                    </div>
                  </div>

                  {/* Desktop: commission in right column */}
                  <div className="hidden flex-col items-start gap-2.5 lg:flex lg:items-end">
                    <div className="text-left lg:text-right">
                      <p className={`font-mono-tabular text-xl font-bold ${isCancelled ? "text-destructive" : "text-primary"}`}>
                        {currency.format(total)}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {currency.format(upfront)} upfront + {currency.format(setup)} setup
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
    <ClientProfileSheet
      item={selectedItem}
      open={selectedItem != null}
      onOpenChange={(open) => !open && setSelectedItem(null)}
    />
    </>
  );
};

export default DealFeed;
