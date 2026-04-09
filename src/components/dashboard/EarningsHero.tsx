import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CalendarClock, Clock3, Crown, Sparkles, Target, TrendingUp, Wallet, Zap } from "lucide-react";
import { payoutConfig } from "@/data/catalog/commission";
import type { TierConfig } from "@/types/commission";
import {
  compactCurrency,
  currency,
  getDaysUntil,
  longDateFormat,
} from "@/lib/commission";
import { useDashboard } from "@/providers/DashboardProvider";
import DealFeed from "@/components/dashboard/DealFeed";
import RepPayoutSummary from "@/components/dashboard/RepPayoutSummary";
import TeamContext from "@/components/dashboard/TeamContext";
import MonthlyProductChart from "@/components/dashboard/MonthlyProductChart";
import Rolling90DayChart from "@/components/dashboard/Rolling90DayChart";

const EarningsHero = () => {
  const reduceMotion = useReducedMotion();
  const { isManagerView, selectedSummary, selectedRep, team, deals } = useDashboard();
  const target = payoutConfig.monthlyGoal;
  const currentValue = isManagerView
    ? team.totalAvailableCommission
    : selectedSummary?.thisMonthCommission ?? 0;
  const progress = Math.min((currentValue / target) * 100, 100);
  const nextPayoutDate = isManagerView ? team.nextTeamPayoutDate : selectedSummary?.nextPayoutDate;
  const deltaToGoal = Math.max(target - currentValue, 0);
  const heading = isManagerView ? "Team payout board" : "Commission available to you";
  const heroValue = isManagerView
    ? team.totalAvailableCommission
    : selectedSummary?.availableCommission ?? 0;
  const supportingValue = isManagerView
    ? team.totalPendingCommission
    : selectedSummary?.pendingCommission ?? 0;
  const topLabel = isManagerView
    ? team.topPerformer?.rep.name ?? "No rep data"
    : selectedSummary?.tier.label ?? "Launch";
  const topPerformerAvatar = team.topPerformer?.rep.avatar ?? "?";
  const managerBoardProps = {
    heroValue,
    progress,
    target,
    deltaToGoal,
    nextPayoutDate,
    supportingValue,
    topLabel,
    topPerformerAvatar,
    topPerformerName: team.topPerformer?.rep.name,
    topPerformerValue: team.topPerformer?.thisMonthCommission ?? 0,
    teamMrr: team.teamMrr,
    lastMonthPayout: team.lastMonthPayout,
    reduceMotion,
    deals,
  };

  if (isManagerView) {
    return <ManagerSpotlightBoard {...managerBoardProps} />;
  }

  const repDeals = deals.filter((d) => selectedRep && d.repId === selectedRep.id);
  const rate = (selectedSummary?.tier.rate ?? 0) * 100;
  const residualMonthly = selectedSummary?.residualMonthly ?? 0;
  const totalMrr = selectedSummary?.totalMrr ?? 0;
  const tierMrr = selectedSummary?.tier.mrr ?? 0;
  const nextTierMrr = selectedSummary?.nextTier?.mrr ?? null;
  const atMaxTier = nextTierMrr === null;
  const progressToNext = atMaxTier
    ? 100
    : Math.min(100, Math.max(0, ((totalMrr - tierMrr) / (nextTierMrr - tierMrr)) * 100));

  return (
    <>
      {/* Top: Payout summary + Residual side by side, then stats row */}
      <div className="mb-3 sm:mb-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] gap-4 items-stretch">
        <RepPayoutSummary />
        <ResidualCircleCard
          residualMonthly={residualMonthly}
          rate={rate}
          totalMrr={totalMrr}
          topLabel={topLabel}
          nextTier={selectedSummary?.nextTier ?? null}
          nextTierMrr={nextTierMrr}
          progressToNext={progressToNext}
          atMaxTier={atMaxTier}
          payingClientCount={selectedSummary?.payingClientCount ?? 0}
          lastMonthPayout={selectedSummary?.lastMonthPayout ?? 0}
          availableCommission={heroValue}
          reduceMotion={reduceMotion}
          deals={repDeals}
        />
        <div className="lg:col-span-2">
          <TeamContext />
        </div>
      </div>
      {/* Commission queue full width */}
      <div className="mt-0">
        <DealFeed
          nextPayoutDate={nextPayoutDate}
          supportingValue={supportingValue}
        />
      </div>
    </>
  );
};

export default EarningsHero;

function ResidualCircleCard({
  residualMonthly,
  rate,
  totalMrr,
  topLabel,
  nextTierMrr,
  nextTier,
  progressToNext,
  atMaxTier,
  payingClientCount,
  lastMonthPayout,
  availableCommission,
  reduceMotion,
  deals,
}: {
  residualMonthly: number;
  rate: number;
  totalMrr: number;
  topLabel: string;
  nextTierMrr: number | null;
  nextTier: { mrr: number; rate: number; label: string } | null;
  progressToNext: number;
  atMaxTier: boolean;
  payingClientCount: number;
  lastMonthPayout: number;
  availableCommission: number;
  reduceMotion: boolean | null;
  deals?: import("@/types/commission").Deal[];
}) {
  const size = 160;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (progressToNext / 100) * circumference;
  const commissionDelta = availableCommission - lastMonthPayout;
  const pctChange = lastMonthPayout > 0 ? (commissionDelta / lastMonthPayout) * 100 : 0;
  const mrrtToUnlock = !atMaxTier && nextTierMrr != null ? Math.max(nextTierMrr - totalMrr, 0) : 0;

  return (
    <div
      className={`obsidian-card overflow-hidden p-5 flex flex-col items-center justify-center w-full relative ${
        residualMonthly > 0 ? "border-l-4 border-l-primary/50" : "border-l-4 border-l-primary/30"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <div className="relative z-10 w-full flex flex-col items-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-foreground mb-3">
          Monthly revenue share
        </p>

        {/* Circle gauge - dollar amount in center, progress ring */}
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              className="text-secondary"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="url(#residualGradient)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={reduceMotion ? undefined : { strokeDashoffset: circumference }}
              animate={reduceMotion ? undefined : { strokeDashoffset: dashOffset }}
              transition={{ delay: 0.3, duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
            />
            <defs>
              <linearGradient id="residualGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="font-mono-tabular text-2xl md:text-3xl font-bold tracking-tight money-gradient leading-none"
            >
              {currency.format(residualMonthly)}
            </motion.span>
            <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">/mo</span>
          </div>
        </div>

        {/* Current MRR - so user can verify the system has the right number */}
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          Current MRR: {currency.format(totalMrr)}
        </p>

        {/* Percentage to next tier - below circle */}
        {!atMaxTier ? (
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {progressToNext.toFixed(0)}% to {nextTier?.label ?? "Foundation"}
          </p>
        ) : (
          <p className="mt-1 text-sm font-semibold text-primary">Max tier</p>
        )}

        {/* Last 90 days trend - compact bar + line with vs last month integrated */}
        <Rolling90DayChart
          residualMonthly={residualMonthly}
          lastMonthPayout={lastMonthPayout}
          commissionDelta={commissionDelta}
          pctChange={pctChange}
          deals={deals}
        />

        {/* MRR to unlock next tier */}
        {!atMaxTier && (
          <p className="mt-3 text-sm font-semibold text-foreground">
            {currency.format(mrrtToUnlock)} more MRR to unlock
          </p>
        )}
      </div>
    </div>
  );
}

function ResidualShareCard({
  tierLabel,
  rate,
  totalMrr,
  tierMrr,
  nextTierMrr,
  residualMonthly,
  reduceMotion,
}: {
  tierLabel: string;
  rate: number;
  totalMrr: number;
  tierMrr: number;
  nextTierMrr: number | null;
  residualMonthly: number;
  reduceMotion: boolean | null;
}) {
  const atMaxTier = nextTierMrr === null;
  const progressToNext =
    atMaxTier
      ? 100
      : Math.min(
          100,
          Math.max(0, ((totalMrr - tierMrr) / (nextTierMrr - tierMrr)) * 100),
        );

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border border-l-4 border-l-primary/60 bg-primary/5 p-3.5 shadow-sm transition-shadow hover:shadow-md dark:bg-primary/10">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary dark:bg-primary/20">
        <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Revenue share
        </p>
        <p className="mt-0.5 font-mono-tabular text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {rate > 0 ? `${rate}% · ${tierLabel}` : tierLabel}
        </p>
        {rate > 0 ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {currency.format(residualMonthly)}/mo in residuals
          </p>
        ) : (
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Unlock at {currency.format(nextTierMrr ?? 10000)} MRR
          </p>
        )}
        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={reduceMotion ? false : { width: 0 }}
            animate={reduceMotion ? undefined : { width: `${progressToNext}%` }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </div>
    </div>
  );
}

interface ManagerBoardProps {
  heroValue: number;
  progress: number;
  target: number;
  deltaToGoal: number;
  nextPayoutDate: Date | null;
  supportingValue: number;
  topLabel: string;
  topPerformerAvatar: string;
  topPerformerName?: string;
  topPerformerValue: number;
  teamMrr: number;
  lastMonthPayout: number;
  reduceMotion: boolean | null;
  deals: import("@/types/commission").Deal[];
}

const ManagerSpotlightBoard = ({
  heroValue,
  progress,
  deltaToGoal,
  target,
  nextPayoutDate,
  teamMrr,
  topLabel,
  topPerformerAvatar,
  topPerformerName,
  topPerformerValue,
  lastMonthPayout,
  reduceMotion,
  deals,
}: ManagerBoardProps) => {
  const deltaVsLastMonth = heroValue - lastMonthPayout;
  const pctVsLastMonth = lastMonthPayout > 0 ? (deltaVsLastMonth / lastMonthPayout) * 100 : 0;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="rounded-2xl border border-primary/20 bg-card p-5"
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 md:gap-5 items-end">
          <div className="min-w-0">
            <div className="mb-2 flex gap-1.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/12">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Ready to pay out</span>
            </div>
            <p className="font-mono-tabular text-5xl font-bold tracking-tight md:text-6xl xl:text-7xl money-gradient">
              {currency.format(heroValue)}
            </p>
          </div>
          <div className="min-w-0 flex flex-col gap-0.5 overflow-hidden items-end text-right shrink-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-xs">
              Vs last month
            </p>
            <p className="min-w-0 break-words font-mono-tabular text-lg font-semibold text-foreground md:text-2xl xl:text-3xl">
              {currency.format(lastMonthPayout)}
            </p>
            {deltaVsLastMonth !== 0 && (
              <p className={`min-w-0 break-words text-sm font-medium md:text-base ${deltaVsLastMonth > 0 ? "text-primary" : "text-amber-500"}`}>
                {deltaVsLastMonth > 0 ? "+" : ""}
                {currency.format(deltaVsLastMonth)}
                {lastMonthPayout > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    ({pctVsLastMonth > 0 ? "+" : ""}{pctVsLastMonth.toFixed(0)}%)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-shrink-0">
          <MonthlyProductChart deals={deals} monthLabel="Team sales this month" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "MRR",
              value: currency.format(teamMrr),
              detail: "",
              variant: "primary" as const,
              icon: TrendingUp,
            },
            {
              label: "Next payout",
              value: nextPayoutDate ? longDateFormat.format(nextPayoutDate) : "Pending",
              detail: "",
              variant: "primary" as const,
              icon: CalendarClock,
            },
            {
              label: "Top rep",
              value: currency.format(topPerformerValue),
              detail: "",
              avatar: topPerformerAvatar,
              avatarName: topPerformerName,
              variant: "yellow" as const,
              icon: Crown,
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.4 }}
            >
              <StatCard {...card} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const statCardVariants = {
  primary: {
    card: "border-l-primary/60 bg-primary/5 dark:bg-primary/10",
    icon: "bg-primary/15 text-primary dark:bg-primary/20",
  },
  accent: {
    card: "border-l-accent/60 bg-accent/5 dark:bg-accent/10",
    icon: "bg-accent/15 text-accent dark:bg-accent/20",
  },
  yellow: {
    card: "border-l-yellow-500/60 bg-yellow-500/10 dark:bg-yellow-500/15",
    icon: "bg-yellow-500/20 text-yellow-600 dark:bg-yellow-400/30 dark:text-yellow-400",
  },
};

const StatCard = ({
  label,
  value,
  detail,
  avatar,
  icon: Icon,
  variant = "primary",
}: {
  label?: string;
  value: string;
  detail: string;
  avatar?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "primary" | "accent" | "yellow";
}) => {
  const styles = statCardVariants[variant ?? "primary"];
  return (
    <div className={`rounded-2xl border border-border border-l-4 p-3.5 shadow-sm transition-shadow hover:shadow-md ${styles.card}`}>
      <div className="flex items-center gap-3">
        {Icon && !avatar && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
            <Icon className="h-4 w-4" strokeWidth={2.5} />
          </div>
        )}
        <div className="min-w-0 flex-1 flex flex-col">
          {label && <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</p>}
          <p className="mt-0.5 font-mono-tabular text-lg font-semibold tracking-tight text-foreground sm:text-xl">{value}</p>
          {!avatar && detail && <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{detail}</p>}
        </div>
        {avatar && (
          <div className="flex shrink-0 items-center gap-2 ml-auto">
            {Icon && (
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
                <Icon className="h-4 w-4" strokeWidth={2.5} />
              </div>
            )}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-yellow-500/20 text-sm font-bold text-yellow-700 dark:bg-yellow-400/25 dark:text-yellow-400">
              {avatar && (avatar.startsWith("http") || avatar.startsWith("data:")) ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                avatar
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
