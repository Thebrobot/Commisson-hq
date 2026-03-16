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
      className="flex h-full flex-col rounded-2xl border border-primary/20 bg-card p-5 md:p-6"
    >
      <div className="flex flex-1 flex-col justify-between gap-4 min-h-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 md:gap-5 items-end">
          <div className="min-w-0">
            <div className="mb-2 flex gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/12">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
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

        <div className="min-h-0 flex-shrink-0">
          <MonthlyProductChart deals={selectedSummary?.deals ?? []} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center gap-4 rounded-xl border border-border border-l-4 border-l-primary/60 bg-primary/5 p-4 shadow-sm dark:bg-primary/10"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary dark:bg-primary/20">
              <CalendarClock className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Next payout
              </p>
              <p className="mt-1 font-mono-tabular text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {nextPayoutDate ? longDateFormat.format(nextPayoutDate) : "Pending"}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.4 }}
            className="flex items-center gap-4 rounded-xl border border-border border-l-4 border-l-accent/60 bg-accent/5 p-4 shadow-sm dark:bg-accent/10"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent dark:bg-accent/20">
              <Clock3 className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Pending commission
              </p>
              <p className="mt-1 font-mono-tabular text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {currency.format(pendingCommission)}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.4 }}
            className="flex items-center gap-4 rounded-xl border border-border border-l-4 border-l-blue-500/60 bg-blue-500/5 p-4 shadow-sm dark:bg-blue-500/10"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Wallet className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Ready to pay
              </p>
              <p className="mt-1 font-mono-tabular text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {currency.format(availableCommission)}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default RepPayoutSummary;
