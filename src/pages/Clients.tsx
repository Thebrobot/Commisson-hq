import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, Info, Users } from "lucide-react";
import {
  calcDealCommission,
  currency,
  formatRelativeDealDate,
  getCommissionStatus,
  getDealFeedItems,
  getProductById,
  isDealOnTrial,
  longDateFormat,
  shortDate,
} from "@/lib/commission";
import {
  defaultHandoff,
  HANDOFF_ITEMS,
  handoffProgress,
  isHandoffComplete,
} from "@/lib/handoff";
import { payoutConfig } from "@/data/catalog/commission";
import { useDashboard } from "@/providers/DashboardProvider";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientEditSheet from "@/components/dashboard/ClientEditSheet";
import ClientCard from "@/components/dashboard/ClientCard";
import type { DealFeedItem } from "@/types/commission";

type AvailabilityFilter = "all" | "trial" | "in_lag" | "ready";

const Clients = () => {
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const { deals, reps, selectedRepId, setSelectedRepId, team, selectedSummary, selectedRep, updateDeal, addDeal, cancelDeal, deleteDeal, loading } = useDashboard();
  const [selectedItem, setSelectedItem] = useState<DealFeedItem | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");

  useEffect(() => {
    const state = location.state as { openNewClient?: boolean; openDealId?: string } | null;
    if (state?.openNewClient && !loading && reps.length > 0) {
      navigate(".", { replace: true, state: {} });
      addDeal().then((newDeal) => {
        if (newDeal) {
          const rep = reps.find((r) => r.id === newDeal.repId);
          if (rep) {
            setSelectedItem({
              deal: newDeal,
              rep,
              summary: calcDealCommission(newDeal),
            });
          }
        }
      });
      return;
    }
    if (state?.openDealId) {
      navigate(".", { replace: true, state: {} });
      const deal = deals.find((d) => d.id === state.openDealId);
      if (deal) {
        const rep = reps.find((r) => r.id === deal.repId);
        if (rep) {
          setSelectedRepId(deal.repId);
          setSelectedItem({
            deal,
            rep,
            summary: calcDealCommission(deal),
          });
        }
      }
    }
  }, [location.state, navigate, addDeal, reps, deals, setSelectedRepId, loading]);

  const clientItems = useMemo(() => {
    const scopedDeals =
      selectedRepId === "all"
        ? deals
        : deals.filter((deal) => deal.repId === selectedRepId);
    return getDealFeedItems(reps, scopedDeals);
  }, [deals, reps, selectedRepId]);

  const filteredItems = useMemo(() => {
    if (availabilityFilter === "all") return clientItems;
    return clientItems.filter((item) => {
      const status = getCommissionStatus(item.deal, item.summary);
      return status === availabilityFilter;
    });
  }, [clientItems, availabilityFilter]);

  const pendingHandoffCount = useMemo(() => {
    const scopedDeals =
      selectedRepId === "all"
        ? deals.filter((d) => d.status === "active")
        : deals.filter((d) => d.status === "active" && d.repId === selectedRepId);
    return scopedDeals.filter(
      (d) => !isHandoffComplete(d.handoff ?? defaultHandoff),
    ).length;
  }, [deals, selectedRepId]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
            <Users className="h-5 w-5 text-primary" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Active Clients
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} client{filteredItems.length !== 1 ? "s" : ""} · <span className="hidden lg:inline">Click a row to edit</span><span className="lg:hidden">Tap card to edit</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Commission summary: team total or rep-specific */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
            {selectedRepId === "all" ? (
              <>
                <p className="text-sm font-semibold text-primary">
                  Team commission this cycle
                </p>
                <p className="font-mono-tabular text-lg font-bold text-foreground">
                  {currency.format(team.totalAvailableCommission)}
                </p>
                {team.totalPendingCommission > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    +{currency.format(team.totalPendingCommission)} pending
                  </p>
                )}
              </>
            ) : selectedSummary ? (
              <>
                <p className="text-sm font-semibold text-primary">
                  Commission for {selectedRep?.name ?? "rep"}
                </p>
                <p className="font-mono-tabular text-lg font-bold text-foreground">
                  {currency.format(selectedSummary.availableCommission)}
                </p>
                {selectedSummary.pendingCommission > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    +{currency.format(selectedSummary.pendingCommission)} pending
                  </p>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {pendingHandoffCount > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <p className="text-sm font-medium text-foreground">
              {pendingHandoffCount} client{pendingHandoffCount !== 1 ? "s" : ""} {pendingHandoffCount !== 1 ? "have" : "has"} pending handoff{pendingHandoffCount !== 1 ? "s" : ""}.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/handoff">View in Handoff Hub</Link>
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Commission has a 5-day hold after close. Trial deals don&apos;t pay commission until the client&apos;s first payment. &quot;Paid&quot; means we&apos;ve sent the payment.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={availabilityFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setAvailabilityFilter("all")}
        >
          All
        </Button>
        <Button
          variant={availabilityFilter === "trial" ? "default" : "outline"}
          size="sm"
          onClick={() => setAvailabilityFilter("trial")}
        >
          Trial
        </Button>
        <Button
          variant={availabilityFilter === "in_lag" ? "default" : "outline"}
          size="sm"
          onClick={() => setAvailabilityFilter("in_lag")}
        >
          In lag
        </Button>
        <Button
          variant={availabilityFilter === "ready" ? "default" : "outline"}
          size="sm"
          onClick={() => setAvailabilityFilter("ready")}
        >
          Ready
        </Button>
      </div>

      {/* Mobile/tablet: card layout */}
      <div className="space-y-3 lg:hidden">
        {filteredItems.map((item) => (
          <ClientCard
            key={item.deal.id}
            item={item}
            onClick={() => setSelectedItem(item)}
            onHandoffClick={(e) => {
              e.stopPropagation();
              navigate(`/clients/${item.deal.id}/handoff`);
            }}
            onPaidChange={(paid) =>
              updateDeal(item.deal.id, {
                paidOut: paid,
                paidOutAt: paid ? new Date().toISOString() : null,
              })
            }
          />
        ))}
      </div>

      {/* Desktop: table with horizontal scroll for tablet */}
      <div className="hidden lg:block rounded-xl border border-border bg-card overflow-x-auto min-w-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold w-12 text-center">Handoff</TableHead>
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="font-semibold">Rep</TableHead>
              <TableHead className="font-semibold">Services</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Close Date</TableHead>
              <TableHead className="font-semibold">First Payment</TableHead>
              <TableHead className="font-semibold">Payout Date</TableHead>
              <TableHead className="font-semibold">Commission</TableHead>
              <TableHead className="font-semibold text-right">MRR</TableHead>
              <TableHead className="font-semibold text-right">Commission</TableHead>
              <TableHead className="font-semibold text-center">Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const productNames = item.deal.products
                .map((li) => getProductById(li.productId)?.name ?? li.productId)
                .join(", ");
              const isCancelled = item.deal.status === "cancelled";
              const mrr = isCancelled ? -item.summary.mrr : item.summary.mrr;
              const handoffComplete = isHandoffComplete(item.deal.handoff);
              const handoffCount = handoffProgress(item.deal.handoff);

              return (
                <TableRow
                  key={item.deal.id}
                  className={`cursor-pointer transition-colors ${
                    item.deal.paidOut
                      ? "bg-green-500/10 hover:bg-green-500/10"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedItem(item);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <TableCell
                    className="text-center cursor-pointer hover:bg-muted/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/clients/${item.deal.id}/handoff`);
                    }}
                    title={handoffComplete ? "Handoff complete" : `${handoffCount}/${HANDOFF_ITEMS.length} complete`}
                  >
                    {handoffComplete ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground">
                        {handoffCount}/{HANDOFF_ITEMS.length}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.deal.clientName}</TableCell>
                  <TableCell className="text-muted-foreground">{item.rep.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground" title={productNames || "Setup-only"}>
                    {productNames || "Setup-only"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                        isCancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {item.deal.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeDealDate(item.deal.closeDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.deal.firstPaymentDate
                      ? longDateFormat.format(new Date(`${item.deal.firstPaymentDate}T12:00:00`))
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {longDateFormat.format(item.summary.payoutDate)}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const status = getCommissionStatus(item.deal, item.summary);
                      if (status === "paid") return <span className="text-muted-foreground">Paid</span>;
                      if (status === "cancelled") return <span className="text-muted-foreground">—</span>;
                      if (status === "trial")
                        return (
                          <span className="text-amber-600 dark:text-amber-500">
                            Trial — {item.deal.firstPaymentDate && shortDate.format(new Date(`${item.deal.firstPaymentDate}T12:00:00`))}
                          </span>
                        );
                      if (status === "ready") return <span className="font-medium text-primary">Ready</span>;
                      return (
                        <span className="text-muted-foreground" title={`Clears ${payoutConfig.lagDays}-day hold`}>
                          In lag — {shortDate.format(item.summary.availableAt)}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="font-mono-tabular text-right">
                    {currency.format(mrr)}
                  </TableCell>
                  <TableCell className="font-mono-tabular text-right font-semibold text-primary">
                    {currency.format(item.summary.totalCommission)}
                  </TableCell>
                  <TableCell
                    className="text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Select
                      value={item.deal.paidOut ? "paid" : "unpaid"}
                      onValueChange={(value) => {
                        const paid = value === "paid";
                        updateDeal(item.deal.id, {
                          paidOut: paid,
                          paidOutAt: paid ? new Date().toISOString() : null,
                        });
                      }}
                    >
                      <SelectTrigger className="h-9 w-[6.5rem]" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ClientEditSheet
        item={selectedItem}
        reps={reps}
        open={selectedItem != null}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        onSave={updateDeal}
        onCancelDeal={cancelDeal}
        onDelete={async (dealId) => {
          await deleteDeal(dealId);
          setSelectedItem(null);
        }}
      />
    </motion.div>
  );
};

export default Clients;
