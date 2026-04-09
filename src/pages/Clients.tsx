import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowUpDown, Check, Download, Info, Search, Users } from "lucide-react";
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
import { isSalesPartner } from "@/lib/repRoles";
import { useDashboard } from "@/providers/DashboardProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type AvailabilityFilter = "all" | "trial" | "in_lag" | "ready" | "cancelled";
type SortKey = "closeDate" | "clientName" | "commission" | "mrr" | "payoutDate";
type SortDir = "asc" | "desc";

function exportToCSV(items: DealFeedItem[], includeCommission: boolean) {
  const headers = includeCommission
    ? [
        "Client Name",
        "Rep",
        "Services",
        "Status",
        "Close Date",
        "First Payment",
        "Payout Date",
        "MRR",
        "Commission",
        "Paid",
      ]
    : [
        "Client Name",
        "Rep",
        "Services",
        "Status",
        "Close Date",
        "First Payment",
        "MRR",
      ];
  const rows = items.map((item) => {
    const productNames = item.deal.products
      .map((li) => getProductById(li.productId)?.name ?? li.productId)
      .join(" | ");
    const isCancelled = item.deal.status === "cancelled";
    const summary = calcDealCommission(item.deal);
    const base = [
      item.deal.clientName,
      item.rep.name,
      productNames || "Setup-only",
      item.deal.status,
      item.deal.closeDate,
      item.deal.firstPaymentDate ?? "",
    ];
    const rest = includeCommission
      ? [
          summary.payoutDate.toISOString().slice(0, 10),
          isCancelled ? `-${summary.mrr}` : String(summary.mrr),
          String(summary.totalCommission),
          item.deal.paidOut ? "Yes" : "No",
        ]
      : [isCancelled ? `-${summary.mrr}` : String(summary.mrr)];
    return [...base, ...rest].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const Clients = () => {
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    deals,
    reps,
    selectedRepId,
    setSelectedRepId,
    team,
    selectedSummary,
    selectedRep,
    updateDeal,
    addDeal,
    cancelDeal,
    deleteDeal,
    loading,
    hideCommissionUI,
    isPortalManager,
    myRepId,
  } = useDashboard();
  const [selectedItem, setSelectedItem] = useState<DealFeedItem | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("closeDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
      else setSortDir("desc");
      return key;
    });
  }, []);

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
          if (isPortalManager || deal.repId === myRepId) {
            setSelectedRepId(deal.repId);
          }
          setSelectedItem({
            deal,
            rep,
            summary: calcDealCommission(deal),
          });
        }
      }
    }
  }, [
    location.state,
    navigate,
    addDeal,
    reps,
    deals,
    setSelectedRepId,
    loading,
    isPortalManager,
    myRepId,
  ]);

  useEffect(() => {
    if (
      hideCommissionUI &&
      (availabilityFilter === "in_lag" || availabilityFilter === "ready")
    ) {
      setAvailabilityFilter("all");
    }
  }, [hideCommissionUI, availabilityFilter]);

  const clientItems = useMemo(() => {
    const scopedDeals =
      selectedRepId === "all"
        ? deals
        : deals.filter((deal) => deal.repId === selectedRepId);
    return getDealFeedItems(reps, scopedDeals);
  }, [deals, reps, selectedRepId]);

  const filteredItems = useMemo(() => {
    let items = clientItems;

    // Filter by status
    if (availabilityFilter !== "all") {
      if (availabilityFilter === "cancelled") {
        items = items.filter((item) => item.deal.status === "cancelled");
      } else {
        items = items.filter((item) => {
          if (item.deal.status === "cancelled") return false;
          const status = getCommissionStatus(item.deal, item.summary);
          return status === availabilityFilter;
        });
      }
    }

    // Filter by search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.deal.clientName.toLowerCase().includes(q) ||
          item.rep.name.toLowerCase().includes(q) ||
          (item.deal.clientEmail ?? "").toLowerCase().includes(q) ||
          (item.deal.clientPhone ?? "").toLowerCase().includes(q) ||
          item.deal.products.some((li) =>
            (getProductById(li.productId)?.name ?? li.productId).toLowerCase().includes(q),
          ),
      );
    }

    // Sort
    items = [...items].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      switch (sortKey) {
        case "closeDate":
          aVal = a.deal.closeDate;
          bVal = b.deal.closeDate;
          break;
        case "clientName":
          aVal = a.deal.clientName.toLowerCase();
          bVal = b.deal.clientName.toLowerCase();
          break;
        case "commission":
          aVal = a.summary.totalCommission;
          bVal = b.summary.totalCommission;
          break;
        case "mrr":
          aVal = a.summary.mrr;
          bVal = b.summary.mrr;
          break;
        case "payoutDate":
          aVal = a.summary.payoutDate.getTime();
          bVal = b.summary.payoutDate.getTime();
          break;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [clientItems, availabilityFilter, search, sortKey, sortDir]);

  const pendingHandoffCount = useMemo(() => {
    const scopedDeals =
      selectedRepId === "all"
        ? deals.filter((d) => d.status === "active")
        : deals.filter((d) => d.status === "active" && d.repId === selectedRepId);
    return scopedDeals.filter(
      (d) => !isHandoffComplete(d.handoff ?? defaultHandoff),
    ).length;
  }, [deals, selectedRepId]);

  const SortHeader = ({ label, colKey }: { label: string; colKey: SortKey }) => (
    <TableHead
      className="font-semibold cursor-pointer select-none hover:text-foreground"
      onClick={() => handleSort(colKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3.5 w-3.5 transition-colors ${sortKey === colKey ? "text-primary" : "text-muted-foreground/50"}`} />
      </div>
    </TableHead>
  );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3 md:space-y-4"
    >
      {/* Page title */}
      <div className="pt-1 mb-1">
        <h1 className="text-3xl sm:text-4xl leading-none">
          <span className="dashboard-title-primary">ACTIVE </span>
          <span className="dashboard-title-accent">CLIENTS</span>
        </h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-primary" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <Users className="h-4 w-4 text-primary" strokeWidth={2.5} />
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} client{filteredItems.length !== 1 ? "s" : ""}{search ? ` matching "${search}"` : ""} · <span className="hidden lg:inline">Click a row to edit</span><span className="lg:hidden">Tap card to edit</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-auto rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 sm:px-4">
            {hideCommissionUI ? (
              selectedRepId === "all" ? (
                <>
                  <p className="text-sm font-semibold text-primary">Team MRR</p>
                  <p className="font-mono-tabular text-lg font-bold text-foreground">
                    {currency.format(team.teamMrr)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {team.activeClientCount} paying clients
                  </p>
                </>
              ) : selectedSummary ? (
                <>
                  <p className="text-sm font-semibold text-primary">
                    MRR for {selectedRep?.name ?? "rep"}
                  </p>
                  <p className="font-mono-tabular text-lg font-bold text-foreground">
                    {currency.format(selectedSummary.totalMrr)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedSummary.payingClientCount} paying clients
                  </p>
                </>
              ) : null
            ) : selectedRepId === "all" ? (
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
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => exportToCSV(filteredItems, !hideCommissionUI)}
            title="Export to CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
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

      {!hideCommissionUI && (
        <div className="hidden md:flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Commission has a 5-day hold after close. Trial deals don&apos;t pay commission until the client&apos;s first payment. &quot;Paid&quot; means we&apos;ve sent the payment.
            </p>
          </div>
        </div>
      )}

      {/* Search + Filter row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client, rep, product, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(hideCommissionUI
            ? (["all", "trial", "cancelled"] as AvailabilityFilter[])
            : (["all", "trial", "in_lag", "ready", "cancelled"] as AvailabilityFilter[])
          ).map((f) => (
            <Button
              key={f}
              variant={availabilityFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setAvailabilityFilter(f)}
            >
              {f === "in_lag" ? "In lag" : f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile/tablet: card layout */}
      <div className="space-y-3 lg:hidden">
        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm">No clients match your search.</p>
          </div>
        ) : filteredItems.map((item) => (
          <ClientCard
            key={item.deal.id}
            item={item}
            hideCommissionUI={hideCommissionUI}
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

      {/* Desktop: table with horizontal scroll */}
      <div className="hidden lg:block rounded-xl border border-border bg-card overflow-x-auto min-w-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold w-12 text-center">Handoff</TableHead>
              <SortHeader label="Client" colKey="clientName" />
              <TableHead className="font-semibold">Rep</TableHead>
              <TableHead className="font-semibold">Services</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <SortHeader label="Close Date" colKey="closeDate" />
              <TableHead className="font-semibold">First Payment</TableHead>
              {!hideCommissionUI && (
                <>
                  <SortHeader label="Payout Date" colKey="payoutDate" />
                  <TableHead className="font-semibold">Commission Status</TableHead>
                </>
              )}
              <SortHeader label="MRR" colKey="mrr" />
              {!hideCommissionUI && (
                <>
                  <SortHeader label="Commission" colKey="commission" />
                  <TableHead className="font-semibold text-center">Paid</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hideCommissionUI ? 8 : 12} className="py-10 text-center text-muted-foreground">
                  No clients match your search.
                </TableCell>
              </TableRow>
            ) : filteredItems.map((item) => {
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
                  <TableCell className="text-muted-foreground">
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      <span>{item.rep.name}</span>
                      {isSalesPartner(item.rep) && (
                        <span className="rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0 text-[10px] font-semibold uppercase text-primary">
                          Partner
                        </span>
                      )}
                    </span>
                  </TableCell>
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
                      : "\u2014"}
                  </TableCell>
                  {!hideCommissionUI && (
                    <>
                      <TableCell className="text-muted-foreground">
                        {longDateFormat.format(item.summary.payoutDate)}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const status = getCommissionStatus(item.deal, item.summary);
                          if (status === "paid") return <span className="text-muted-foreground">Paid</span>;
                          if (status === "cancelled") return <span className="text-muted-foreground">\u2014</span>;
                          if (status === "trial")
                            return (
                              <span className="text-amber-600 dark:text-amber-500">
                                Trial \u2014 {item.deal.firstPaymentDate && shortDate.format(new Date(`${item.deal.firstPaymentDate}T12:00:00`))}
                              </span>
                            );
                          if (status === "ready") return <span className="font-medium text-primary">Ready</span>;
                          return (
                            <span className="text-muted-foreground" title={`Clears ${payoutConfig.lagDays}-day hold`}>
                              In lag \u2014 {shortDate.format(item.summary.availableAt)}
                            </span>
                          );
                        })()}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="font-mono-tabular text-right">
                    {currency.format(mrr)}
                  </TableCell>
                  {!hideCommissionUI && (
                    <>
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
                    </>
                  )}
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
