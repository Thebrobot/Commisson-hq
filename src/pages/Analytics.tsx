import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  AlertCircle,
  BarChart2,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { calcDealCommission, currency, getProductById, longDateFormat } from "@/lib/commission";
import { useDashboard } from "@/providers/DashboardProvider";

const PRODUCT_COLORS = [
  "hsl(var(--primary))",
  "#6366f1",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
];

function getMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default function Analytics() {
  const reduceMotion = useReducedMotion();
  const { deals, reps, team, isManagerView } = useDashboard();

  // --- MRR Waterfall: last 6 months ---
  const mrrWaterfall = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return months.map((m) => {
      const monthDeals = deals.filter((d) => {
        const [y, mo] = d.closeDate.split("-").map(Number);
        return y === m.year && mo === m.month + 1;
      });
      const newMrr = monthDeals
        .filter((d) => d.status === "active")
        .reduce((sum, d) => sum + calcDealCommission(d).mrr, 0);
      const churnedMrr = monthDeals
        .filter((d) => d.status === "cancelled")
        .reduce((sum, d) => sum + calcDealCommission(d).mrr, 0);
      return {
        label: getMonthLabel(m.year, m.month),
        newMrr: Math.round(newMrr),
        churnedMrr: Math.round(churnedMrr),
        net: Math.round(newMrr - churnedMrr),
      };
    });
  }, [deals]);

  // --- Product Mix ---
  const productMix = useMemo(() => {
    const byProduct: Record<string, number> = {};
    deals
      .filter((d) => d.status === "active")
      .forEach((deal) => {
        deal.products.forEach((li) => {
          if (!li.productId) return;
          const mrr = calcDealCommission({ ...deal, products: [li], setupFees: [] }).mrr;
          byProduct[li.productId] = (byProduct[li.productId] ?? 0) + mrr;
        });
      });
    return Object.entries(byProduct)
      .map(([id, mrr]) => ({
        name: getProductById(id)?.name ?? id,
        mrr: Math.round(mrr),
        id,
      }))
      .sort((a, b) => b.mrr - a.mrr);
  }, [deals]);

  // --- Commission Liability (what's owed to reps) ---
  const liabilityByRep = useMemo(() => {
    return team.reps
      .filter((r) => r.availableCommission > 0 || r.pendingCommission > 0)
      .sort((a, b) => b.availableCommission - a.availableCommission)
      .map((r) => ({
        name: r.rep.name,
        ready: r.availableCommission,
        pending: r.pendingCommission,
        total: r.availableCommission + r.pendingCommission,
      }));
  }, [team]);

  const totalLiability = team.totalAvailableCommission + team.totalPendingCommission;
  const totalReady = team.totalAvailableCommission;
  const totalPending = team.totalPendingCommission;

  // --- Payout Calendar (upcoming payout dates) ---
  const upcomingPayouts = useMemo(() => {
    const now = new Date();
    const entries: { repName: string; clientName: string; payoutDate: Date; amount: number }[] = [];
    deals
      .filter((d) => d.status === "active" && !d.paidOut)
      .forEach((deal) => {
        const rep = reps.find((r) => r.id === deal.repId);
        if (!rep) return;
        const summary = calcDealCommission(deal);
        if (summary.payoutDate >= now) {
          entries.push({
            repName: rep.name,
            clientName: deal.clientName,
            payoutDate: summary.payoutDate,
            amount: summary.totalCommission,
          });
        }
      });
    return entries
      .sort((a, b) => a.payoutDate.getTime() - b.payoutDate.getTime())
      .slice(0, 20);
  }, [deals, reps]);

  // --- Rep Performance ---
  const repPerformance = useMemo(() => {
    return [...team.reps]
      .sort((a, b) => b.totalMrr - a.totalMrr)
      .map((r) => ({
        name: r.rep.name,
        avatar: r.rep.avatar,
        mrr: r.totalMrr,
        clients: r.payingClientCount,
        closedThisMonth: r.closedThisMonthCount,
        cancelledCount: r.cancelledCount,
        thisMonthCommission: r.thisMonthCommission,
        tier: r.tier.label,
        churnRate:
          r.dealCount + r.cancelledCount > 0
            ? ((r.cancelledCount / (r.dealCount + r.cancelledCount)) * 100).toFixed(1)
            : "0.0",
      }));
  }, [team]);

  // --- Churn by Month ---
  const churnByMonth = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return months.map((m) => {
      const cancelled = deals.filter((d) => {
        if (d.status !== "cancelled") return false;
        const [y, mo] = d.closeDate.split("-").map(Number);
        return y === m.year && mo === m.month + 1;
      });
      return {
        label: getMonthLabel(m.year, m.month),
        count: cancelled.length,
        mrr: cancelled.reduce((sum, d) => sum + calcDealCommission(d).mrr, 0),
      };
    });
  }, [deals]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
          <BarChart2 className="h-5 w-5 text-primary" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground">Team performance, MRR, product mix, and payout pipeline</p>
        </div>
      </div>

      {/* Row 1: Commission Liability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-l-4 border-l-primary/60 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total liability</p>
          </div>
          <p className="font-mono-tabular text-2xl font-bold text-foreground">{currency.format(totalLiability)}</p>
          <p className="text-xs text-muted-foreground mt-1">All unpaid commissions owed to reps</p>
        </div>
        <div className="rounded-2xl border border-l-4 border-l-green-500/60 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ready to pay</p>
          </div>
          <p className="font-mono-tabular text-2xl font-bold text-foreground">{currency.format(totalReady)}</p>
          <p className="text-xs text-muted-foreground mt-1">Commission cleared the lag window</p>
        </div>
        <div className="rounded-2xl border border-l-4 border-l-amber-500/60 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In hold period</p>
          </div>
          <p className="font-mono-tabular text-2xl font-bold text-foreground">{currency.format(totalPending)}</p>
          <p className="text-xs text-muted-foreground mt-1">Still in lag window or on trial</p>
        </div>
      </div>

      {/* Row 2: MRR Waterfall */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">MRR — Last 6 Months</h3>
          <span className="text-xs text-muted-foreground ml-auto">New vs Churned vs Net</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mrrWaterfall} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "12px" }}
              formatter={(value: number, name: string) => [
                currency.format(value),
                name === "newMrr" ? "New MRR" : name === "churnedMrr" ? "Churned MRR" : "Net MRR",
              ]}
            />
            <Bar dataKey="newMrr" fill="hsl(var(--primary) / 0.8)" radius={[4, 4, 0, 0]} name="newMrr" maxBarSize={32} />
            <Bar dataKey="churnedMrr" fill="hsl(var(--destructive) / 0.7)" radius={[4, 4, 0, 0]} name="churnedMrr" maxBarSize={32} />
            <Bar dataKey="net" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="net" maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm inline-block bg-primary/80" />New MRR</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm inline-block bg-destructive/70" />Churned</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm inline-block bg-primary" />Net</span>
        </div>
      </div>

      {/* Row 3: Product Mix + Commission Liability by Rep */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Mix */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Product Mix (Active MRR)</h3>
          </div>
          {productMix.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No active deals with products.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={productMix}
                    dataKey="mrr"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                  >
                    {productMix.map((_, i) => (
                      <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "12px" }}
                    formatter={(value: number) => [currency.format(value), "MRR"]}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {productMix.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full inline-block shrink-0" style={{ background: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }} />
                      <span className="text-foreground">{p.name}</span>
                    </div>
                    <span className="font-mono-tabular font-semibold text-primary">{currency.format(p.mrr)}/mo</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Commission Liability by Rep */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Commission Owed by Rep</h3>
          </div>
          {liabilityByRep.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No pending commissions.</p>
          ) : (
            <div className="space-y-3">
              {liabilityByRep.map((r) => (
                <div key={r.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">{r.name}</span>
                    <span className="font-mono-tabular text-primary font-semibold">{currency.format(r.total)}</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                    <div
                      className="bg-primary h-full transition-all"
                      style={{ width: `${totalLiability > 0 ? (r.ready / totalLiability) * 100 : 0}%` }}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all"
                      style={{ width: `${totalLiability > 0 ? (r.pending / totalLiability) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />{currency.format(r.ready)} ready</span>
                    {r.pending > 0 && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />{currency.format(r.pending)} pending</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Payout Calendar */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Upcoming Payout Schedule</h3>
          <span className="text-xs text-muted-foreground ml-auto">Next 20 unpaid commissions</span>
        </div>
        {upcomingPayouts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No upcoming payouts.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Payout Date</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Client</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Rep</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {upcomingPayouts.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 font-medium text-foreground">{longDateFormat.format(p.payoutDate)}</td>
                    <td className="py-2.5 text-muted-foreground">{p.clientName}</td>
                    <td className="py-2.5 text-muted-foreground">{p.repName}</td>
                    <td className="py-2.5 font-mono-tabular font-semibold text-primary text-right">{currency.format(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 5: Rep Performance Table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Rep Performance</h3>
        </div>
        {repPerformance.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No reps found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Rep</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide text-right">MRR</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide text-right">Clients</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide text-right">This Month</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide text-right">Cancelled</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide text-right">Churn%</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {repPerformance.map((r) => (
                  <tr key={r.name} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 shrink-0 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center overflow-hidden">
                          {r.avatar && (r.avatar.startsWith("http") || r.avatar.startsWith("data:")) ? (
                            <img src={r.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (r.name.charAt(0) || "?").toUpperCase()
                          )}
                        </div>
                        <span className="font-medium text-foreground">{r.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 font-mono-tabular text-right font-semibold text-foreground">{currency.format(r.mrr)}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{r.clients}</td>
                    <td className="py-2.5 font-mono-tabular text-right text-primary font-semibold">{currency.format(r.thisMonthCommission)}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{r.cancelledCount}</td>
                    <td className="py-2.5 text-right">
                      <span className={`font-semibold ${parseFloat(r.churnRate) > 15 ? "text-destructive" : parseFloat(r.churnRate) > 8 ? "text-amber-500" : "text-primary"}`}>
                        {r.churnRate}%
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{r.tier}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 6: Churn Tracker */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="h-4 w-4 text-destructive" />
          <h3 className="font-semibold text-foreground">Churn Tracker — Last 6 Months</h3>
        </div>
        {churnByMonth.every((m) => m.count === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-6">No cancellations in the last 6 months.</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={churnByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "12px" }}
                formatter={(value: number, name: string) => [
                  name === "count" ? `${value} cancelled` : currency.format(value),
                  name === "count" ? "Cancelled deals" : "Churned MRR",
                ]}
              />
              <Bar dataKey="count" fill="hsl(var(--destructive) / 0.7)" radius={[4, 4, 0, 0]} maxBarSize={28} name="count" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
