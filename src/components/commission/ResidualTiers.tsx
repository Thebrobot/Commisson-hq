import { motion, useReducedMotion } from "framer-motion";
import { Crown, Flame, Lock, Rocket, Unlock } from "lucide-react";
import { tierConfig } from "@/data/catalog/commission";
import { currency } from "@/lib/commission";

const icons = [Lock, Flame, Rocket, Crown];

interface ResidualTiersProps {
  currentMRR?: number;
  variant?: "default" | "compact";
}

const ResidualTiers = ({ currentMRR = 12400, variant = "default" }: ResidualTiersProps) => {
  const reduceMotion = useReducedMotion();
  const nextTier = tierConfig.find((tier) => currentMRR < tier.mrr) ?? null;
  const currentTier = [...tierConfig].reverse().find((tier) => currentMRR >= tier.mrr) ?? tierConfig[0];

  if (variant === "compact") {
    const currentIdx = tierConfig.findIndex((t) => t.label === currentTier.label);

    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="obsidian-card px-4 py-3"
      >
        <p className="mb-2 text-sm text-muted-foreground">
          Stack active MRR to unlock higher residual commission rates.
        </p>
        <div className="flex items-end gap-3">
          {/* Each tier: label at start + bar in same column so they align */}
          <div className="min-w-0 flex-1 flex gap-1.5">
            {tierConfig.map((tier, i) => {
              const isComplete = currentIdx > i;
              const isCurrent = currentTier.label === tier.label;
              const fill =
                !tierConfig[i + 1]
                  ? 100
                  : currentMRR >= tierConfig[i + 1].mrr
                  ? 100
                  : currentMRR >= tier.mrr
                  ? ((currentMRR - tier.mrr) / (tierConfig[i + 1].mrr - tier.mrr)) * 100
                  : 0;
              return (
                <div key={tier.label} className="flex min-w-0 flex-1 flex-col gap-1">
                  <span
                    className={`text-left text-sm font-medium ${
                      currentTier.label === tier.label ? "font-semibold text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {tier.label} {(tier.rate * 100).toFixed(0)}%
                  </span>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      initial={reduceMotion ? false : { width: 0 }}
                      animate={reduceMotion ? undefined : { width: isComplete ? "100%" : isCurrent ? `${fill}%` : "0%" }}
                      transition={{ delay: 0.2 + i * 0.06, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                      className={`h-full rounded-full ${
                        isComplete ? "bg-primary" : isCurrent ? "bg-primary/80" : "bg-transparent"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {nextTier && (
            <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-primary">
              {currency.format(nextTier.mrr - currentMRR)} to {nextTier.label}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="obsidian-card p-5"
    >
      <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Residual Tiers
        </h3>
        <span className="text-sm text-muted-foreground">
          Current MRR:{" "}
          <span className="font-mono-tabular text-primary font-bold">
            ${currentMRR.toLocaleString()}
          </span>
        </span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        Stack active MRR to unlock higher residual percentages.
      </p>

      {/* Progress bar across all tiers */}
      <div className="relative mb-6">
        <div className="flex gap-1">
          {tierConfig.map((tier, i) => {
            const fillPercent =
              !tierConfig[i + 1]
                ? 100
                : currentMRR >= tierConfig[i + 1].mrr
                ? 100
                : currentMRR >= tier.mrr
                ? ((currentMRR - tier.mrr) / (tierConfig[i + 1].mrr - tier.mrr)) * 100
                : 0;

            return (
              <div key={tier.label} className="flex-1">
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={reduceMotion ? false : { width: 0 }}
                    animate={reduceMotion ? undefined : { width: `${fillPercent}%` }}
                    transition={{ delay: 0.5 + i * 0.15, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                    className={`h-full rounded-full ${
                      i <= 1
                        ? "bg-primary"
                        : i === 2
                        ? "bg-accent"
                        : "bg-yellow-400"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tierConfig.map((tier, i) => {
          const isCurrentTier = currentTier.label === tier.label;
          const isUnlocked = currentMRR >= tier.mrr;
          const Icon = isUnlocked && i === 0 ? Unlock : icons[i] ?? Lock;
          const upperBound = tierConfig[i + 1]?.mrr;

          return (
            <motion.div
              key={tier.label}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className={`relative rounded-lg border p-3.5 snap-transition ${
                isCurrentTier
                  ? i === 3
                    ? "border-yellow-400/40 bg-secondary/50"
                    : i === 2
                    ? "border-accent/40 bg-secondary/50"
                    : "border-primary/40 bg-secondary/50"
                  : isUnlocked
                  ? "border-border bg-secondary/20"
                  : "border-border/50 bg-background/30 opacity-50"
              }`}
            >
              {isCurrentTier && (
                <div className="absolute -top-2 left-3 bg-background px-2">
                  <span className="text-sm font-bold uppercase tracking-widest text-primary">
                    You're here
                  </span>
                </div>
              )}
              <Icon
                className={`mb-2 h-5 w-5 ${
                  isUnlocked
                    ? i === 3
                      ? "text-yellow-400"
                      : i === 2
                      ? "text-accent"
                      : "text-primary"
                    : "text-muted-foreground/40"
                }`}
                strokeWidth={2.5}
              />
              <p className={`mb-1 text-sm font-bold uppercase tracking-wider ${
                isUnlocked ? "text-foreground" : "text-muted-foreground/40"
              }`}>
                {tier.label}
              </p>
              <p className="font-mono-tabular text-xl font-bold text-foreground">
                {(tier.rate * 100).toFixed(0)}%
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {upperBound ? `${currency.format(tier.mrr)} - ${currency.format(upperBound - 1)}` : `${currency.format(tier.mrr)}+`}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground/70">
                {tier.rate === 0
                  ? "Build your active MRR base before residuals unlock."
                  : `Residuals pay ${(tier.rate * 100).toFixed(0)}% of active recurring revenue.`}
              </p>
            </motion.div>
          );
        })}
      </div>

      {nextTier && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 rounded-lg bg-accent/10 border border-accent/20 px-4 py-3"
        >
          <p className="text-sm leading-relaxed text-accent font-medium">
            {currency.format(nextTier.mrr - currentMRR)} more MRR to unlock{" "}
            <span className="font-bold">{nextTier.label}</span> and move to {(nextTier.rate * 100).toFixed(0)}%
            residuals.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ResidualTiers;
