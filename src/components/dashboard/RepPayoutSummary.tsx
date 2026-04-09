import { motion, useReducedMotion } from "framer-motion";
import { CalendarClock, Clock3, Wallet } from "lucide-react";
import MonthlyProductChart from "@/components/dashboard/MonthlyProductChart";
import { currency, longDateFormat } from "@/lib/commission";
import { useDashboard } from "@/providers/DashboardProvider";

const RepPayoutSummary = () => {
  const reduceMotion = useReducedMotion();
  const { selectedSummary } = useDashboard();

  const thisMonthCommission = selectedSummary?.thisMonthCommission ?? 0;
  const availableCommission = selectedSummary?.availableCommission ?? 0;
  const pendingCommission = selectedSummary?.pendingCommission ?? 0;
  const lastMonthPayout = selectedSummary?.lastMonthPayout ?? 0;
  const nextPayoutDate = selectedSummary?.nextPayoutDate ?? null;

  const deltaVsLastMonth = thisMonthCommission - lastMonthPayout;
  const pctVsLastMonth = lastMonthPayout > 0 ? (deltaVsLastMonth / lastMonthPayout) * 100 : 0;
  const showVs = lastMonthPayout > 0 && Math.abs(deltaVsLastMonth) >= 1;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm"
    >
      <div className="flex flex-1 flex-col justify-between gap-4 min-h-0">
        {/* Hero number */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 md:gap-5 items-end">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Commission this month
              </span>
            </div>
            <p className="font-mono-tabular text-5xl font-bold tracking-tight md:text-6xl xl:text-7xl money-gradient">
              {currency.format(thisMonthCommission)}
            </p>
          </div>
          {showVs && (
            <div className="min-w-0 flex flex-col gap-0.5 overflow-hidden items-end text-right shrink-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-xs">
                Vs last month
              </p>
              <p className="min-w-0 break-words font-mono-tabular text-lg font-semibold text-foreground md:text-2xl xl:text-3xl">
                {currency.format(lastMonthPayout)}
              </p>
              <p
                className={`min-w-0 break-words text-sm font-medium md:text-base ${
                  deltaVsLastMonth > 0 ? "text-primary" : "text-amber-500"
                }`}
              >
                {deltaVsLastMonth > 0 ? "+" : ""}
                {currency.format(deltaVsLastMonth)}
                {lastMonthPayout > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    ({pctVsLastMonth > 0 ? "+" : ""}{pctVsLastMonth.toFixed(0)}%)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="min-h-0 flex-shrink-0">
          <MonthlyProductChart deals={selectedSummary?.deals ?? []} />
        </div>

        {/* Stat tiles — unified style, no mixed colors */}
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            {
              icon: CalendarClock,
              label: "Next payout",
              value: nextPayoutDate ? longDateFormat.format(nextPayoutDate) : "Pending",
              delay: 0.2,
            },
            {
              icon: Clock3,
              label: "Pending commission",
              value: currency.format(pendingCommission),
              delay: 0.26,
            },
            {
              icon: Wallet,
              label: "Ready to pay",
              value: currency.format(availableCommission),
              delay: 0.32,
              highlight: availableCommission > 0,
            },
          ].map((tile) => (
            <motion.div
              key={tile.label}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: tile.delay, duration: 0.4 }}
              className={`stat-card ${tile.highlight ? "border-primary/30 bg-primary/5 dark:bg-primary/10" : ""}`}
            >
              <div className="stat-card-icon">
                <tile.icon className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {tile.label}
                </p>
                <p className={`mt-1 font-mono-tabular text-base font-semibold tracking-tight sm:text-lg ${tile.highlight ? "text-primary" : "text-foreground"}`}>
                  {tile.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default RepPayoutSummary;
