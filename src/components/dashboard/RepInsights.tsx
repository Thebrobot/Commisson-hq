import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { productCatalog } from "@/data/catalog/commission";
import { currency, getTierForMrr } from "@/lib/commission";
import { useDashboard } from "@/providers/DashboardProvider";

/** Next-tier "almost there" call-to-action */
function NextTierCta() {
  const reduceMotion = useReducedMotion();
  const { selectedSummary } = useDashboard();

  const nextTier = selectedSummary?.nextTier;
  const totalMrr = selectedSummary?.totalMrr ?? 0;
  const nextTierMrr = nextTier?.mrr ?? null;

  if (!nextTier || nextTierMrr == null) return null;

  const mrrToNext = Math.max(nextTierMrr - totalMrr, 0);
  const progressPct = Math.min(100, (totalMrr / nextTierMrr) * 100);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="obsidian-card flex items-center gap-3 p-3 border-l-4 border-l-primary/60"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Target className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          {currency.format(mrrToNext)} to {nextTier.label}
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            initial={reduceMotion ? false : { width: 0 }}
            animate={reduceMotion ? undefined : { width: `${progressPct}%` }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full rounded-full bg-primary"
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          At {nextTier.label}: {(nextTier.rate * 100).toFixed(0)}% residual rate
        </p>
      </div>
    </motion.div>
  );
}

/** "One more deal" insight using top MRR product */
function OneMoreDealInsight() {
  const reduceMotion = useReducedMotion();
  const { selectedSummary } = useDashboard();

  const topProduct = [...productCatalog]
    .filter((p) => !p.perUnit)
    .sort((a, b) => b.commissionableMrr - a.commissionableMrr)[0];

  if (!topProduct || !selectedSummary) return null;

  const currentMrr = selectedSummary.totalMrr;
  const newTotalMrr = currentMrr + topProduct.commissionableMrr;
  const tier = getTierForMrr(newTotalMrr);
  const residualFromDeal = topProduct.commissionableMrr * tier.rate;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="obsidian-card flex items-center gap-3 p-3 border-l-4 border-l-accent/60"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <Sparkles className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          One more {topProduct.name}
        </p>
        <p className="mt-0.5 font-mono-tabular text-sm font-bold text-primary">
          {currency.format(topProduct.commissionableMrr)} upfront
          {residualFromDeal > 0 && (
            <span className="ml-1 text-muted-foreground font-normal">
              + {currency.format(residualFromDeal)}/mo residual
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}

/** Vs last month momentum indicator */
function VsLastMonth() {
  const reduceMotion = useReducedMotion();
  const { selectedSummary } = useDashboard();

  const available = selectedSummary?.availableCommission ?? 0;
  const lastMonth = selectedSummary?.lastMonthPayout ?? 0;

  if (lastMonth === 0) return null;

  const delta = available - lastMonth;
  const pct = lastMonth > 0 ? (delta / lastMonth) * 100 : 0;

  if (Math.abs(delta) < 1) return null;

  const isUp = delta > 0;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="obsidian-card flex items-center gap-3 p-3 border-l-4 border-l-blue-500/60"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
        <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          Vs last month
        </p>
        <p
          className={`mt-0.5 font-mono-tabular text-sm font-bold ${
            isUp ? "text-primary" : "text-amber-500"
          }`}
        >
          {isUp ? "+" : ""}
          {currency.format(delta)}
          {lastMonth > 0 && (
            <span className="ml-1 text-muted-foreground font-normal">
              ({pct > 0 ? "+" : ""}
              {pct.toFixed(0)}%)
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}

/** Product spotlight - highest MRR opportunity */
function ProductSpotlight() {
  const reduceMotion = useReducedMotion();

  const topProduct = [...productCatalog]
    .filter((p) => !p.perUnit)
    .sort((a, b) => b.commissionableMrr - a.commissionableMrr)[0];

  if (!topProduct) return null;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="obsidian-card flex items-center gap-3 p-3"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Zap className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Top MRR opportunity
        </p>
        <p className="mt-0.5 font-mono-tabular text-sm font-bold text-foreground">
          {topProduct.name} — {currency.format(topProduct.commissionableMrr)} MRR
        </p>
      </div>
    </motion.div>
  );
}

const RepInsights = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NextTierCta />
      <OneMoreDealInsight />
      <VsLastMonth />
      <ProductSpotlight />
    </div>
  );
};

export default RepInsights;
