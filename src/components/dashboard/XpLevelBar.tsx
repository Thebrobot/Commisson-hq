import { motion, useReducedMotion } from "framer-motion";
import { CalendarRange, Flag, ShieldCheck, Sparkles } from "lucide-react";
import { payoutConfig, tierConfig } from "@/data/catalog/commission";
import { compactCurrency, currency, longDateFormat } from "@/lib/commission";
import { useDashboard } from "@/providers/DashboardProvider";

const XpLevelBar = () => {
  const reduceMotion = useReducedMotion();
  const { isManagerView, selectedSummary, team } = useDashboard();
  const currentMrr = isManagerView ? team.teamMrr : selectedSummary?.totalMrr ?? 0;
  const currentTier = isManagerView ? null : selectedSummary?.tier ?? null;
  const nextTier = isManagerView
    ? null
    : selectedSummary?.nextTier ?? null;
  const previousTierFloor = currentTier?.mrr ?? 0;
  const nextTierFloor = nextTier?.mrr ?? currentMrr;
  const progressToNext = nextTier
    ? ((currentMrr - previousTierFloor) / (nextTierFloor - previousTierFloor)) * 100
    : 100;
  const nextPayoutDate = isManagerView ? team.nextTeamPayoutDate : selectedSummary?.nextPayoutDate ?? null;
  const barLabel = isManagerView ? "Team momentum" : "Tier progress";
  const summaryLabel = isManagerView
    ? `${team.reps.filter((rep) => rep.availableCommission > 0).length} reps ready for payout`
    : currentTier?.label ?? "Launch";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="obsidian-card p-4 md:p-5"
    >
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/20">
              <span className="font-mono-tabular text-xl font-bold text-primary">
                {isManagerView ? team.repCount : currentTier ? tierConfig.indexOf(currentTier) + 1 : 1}
              </span>
            </div>
            <motion.div
              animate={reduceMotion ? undefined : { scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent"
            >
              <Sparkles className="h-2.5 w-2.5 text-foreground" strokeWidth={3} />
            </motion.div>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{barLabel}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-mono-tabular text-primary">{compactCurrency.format(currentMrr)}</span>
              <span> · {summaryLabel}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[27rem]">
          <div className="rounded-xl border border-border bg-secondary/20 px-3 py-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarRange className="h-4 w-4 text-accent" />
              <span className="text-xs uppercase tracking-[0.2em]">Payout cadence</span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug text-foreground">
              {nextPayoutDate ? longDateFormat.format(nextPayoutDate) : "No open payout"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 px-3 py-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-[0.2em]">Lag rules</span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug text-foreground">
              {payoutConfig.lagDays}-day hold, paid on the 1st and 15th
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={reduceMotion ? false : { width: 0 }}
            animate={reduceMotion ? undefined : { width: `${Math.max(progressToNext, 8)}%` }}
            transition={{ delay: 0.4, duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full rounded-full progress-money"
          />
        </div>
        <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1">
            <Flag className="h-3 w-3" />
            {isManagerView
              ? `${currency.format(team.totalAvailableCommission)} ready now`
              : `${currency.format(currentMrr)} current MRR`}
          </span>
          <span>
            {isManagerView || !nextTier
              ? "Top tier already unlocked"
              : `${currency.format(nextTier.mrr - currentMrr)} to ${nextTier.label}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default XpLevelBar;
