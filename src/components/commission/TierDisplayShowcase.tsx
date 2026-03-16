import { motion } from "framer-motion";
import { ArrowRight, Award, Target, TrendingUp } from "lucide-react";
import { tierConfig } from "@/data/catalog/commission";
import { currency } from "@/lib/commission";

interface TierDisplayShowcaseProps {
  currentMRR: number;
}

export const TierDisplayShowcase = ({ currentMRR }: TierDisplayShowcaseProps) => {
  const nextTier = tierConfig.find((tier) => currentMRR < tier.mrr) ?? null;
  const currentTier =
    [...tierConfig].reverse().find((tier) => currentMRR >= tier.mrr) ?? tierConfig[0];
  const currentIdx = tierConfig.findIndex((t) => t.label === currentTier.label);
  const progressToNext = nextTier
    ? Math.min(
        100,
        ((currentMRR - currentTier.mrr) / (nextTier.mrr - currentTier.mrr)) * 100,
      )
    : 100;

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold text-muted-foreground">
        Tier display options — pick your favorite
      </h2>

      {/* Option 1: You're Here Hero */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Option 1: You&apos;re here hero
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">You&apos;re in</p>
              <p className="text-2xl font-bold text-primary">{currentTier.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(currentTier.rate * 100).toFixed(0)}% residuals
              </p>
            </div>
            {nextTier && (
              <div className="min-w-0 flex-1 sm:max-w-xs sm:pl-6">
                <p className="text-sm font-medium text-muted-foreground">
                  {currency.format(nextTier.mrr - currentMRR)} to {nextTier.label}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    animate={{ width: `${progressToNext}%` }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Option 2: Journey Path */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Option 2: Journey path
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex items-center justify-between gap-2">
            {tierConfig.map((tier, i) => {
              const isCurrent = currentTier.label === tier.label;
              const isPassed = currentMRR >= tier.mrr;
              const isLast = i === tierConfig.length - 1;
              return (
                <div key={tier.label} className="flex flex-1 items-center">
                  <div
                    className={`flex flex-col items-center rounded-lg px-3 py-2 ${
                      isCurrent
                        ? "border-2 border-primary bg-primary/10"
                        : isPassed
                        ? "border border-border bg-secondary/30"
                        : "border border-dashed border-border/50 bg-muted/20 opacity-60"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        isCurrent ? "text-primary" : isPassed ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {tier.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(tier.rate * 100).toFixed(0)}%
                    </span>
                  </div>
                  {!isLast && (
                    <ArrowRight className="mx-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                </div>
              );
            })}
          </div>
          {nextTier && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {currency.format(nextTier.mrr - currentMRR)} to reach {nextTier.label}
            </p>
          )}
        </div>
      </div>

      {/* Option 3: Circle Gauge */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Option 3: Circle gauge
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-secondary"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${progressToNext}, 100`}
                  className="text-primary transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xl font-bold text-foreground">{currentTier.label}</p>
              <p className="text-sm text-muted-foreground">
                {(currentTier.rate * 100).toFixed(0)}% residuals
              </p>
              {nextTier && (
                <p className="mt-2 text-sm font-medium text-primary">
                  {currency.format(nextTier.mrr - currentMRR)} to {nextTier.label}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Option 4: Tier Badges with Rewards */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Option 4: Tier badges with rewards
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tierConfig.map((tier, i) => {
              const isCurrent = currentTier.label === tier.label;
              const isUnlocked = currentMRR >= tier.mrr;
              const upperBound = tierConfig[i + 1]?.mrr;
              return (
                <div
                  key={tier.label}
                  className={`rounded-xl border p-4 ${
                    isCurrent
                      ? "border-primary bg-primary/10"
                      : isUnlocked
                      ? "border-border bg-card"
                      : "border-border/50 bg-muted/30 opacity-60"
                  }`}
                >
                  <p
                    className={`font-bold ${
                      isCurrent ? "text-primary" : isUnlocked ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tier.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {(tier.rate * 100).toFixed(0)}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {upperBound
                      ? `At ${currency.format(tier.mrr)}+`
                      : `${currency.format(tier.mrr)}+`}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {tier.rate === 0
                      ? "Build your MRR base"
                      : `Earn ${(tier.rate * 100).toFixed(0)}% of MRR`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Option 5: Gamified XP Bar */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Option 5: Gamified XP bar
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">{currentTier.label}</span>
            {nextTier && (
              <span className="text-sm text-muted-foreground">
                {progressToNext.toFixed(0)}% to {nextTier.label}
              </span>
            )}
          </div>
          <div className="relative mt-2">
            <div className="flex overflow-hidden rounded-full bg-secondary">
              {tierConfig.map((tier, i) => {
                const fill =
                  !tierConfig[i + 1]
                    ? 100
                    : currentMRR >= tierConfig[i + 1].mrr
                    ? 100
                    : currentMRR >= tier.mrr
                    ? ((currentMRR - tier.mrr) / (tierConfig[i + 1].mrr - tier.mrr)) * 100
                    : 0;
                return (
                  <div key={tier.label} className="h-3 flex-1 min-w-0">
                    <div
                      className={`h-full ${i <= 1 ? "bg-primary" : "bg-accent"}`}
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="absolute inset-x-0 top-full mt-1 flex justify-between px-0.5 text-xs text-muted-foreground">
              {tierConfig.map((t) => (
                <span key={t.label}>{t.label}</span>
              ))}
            </div>
          </div>
          {nextTier && (
            <p className="mt-4 text-center text-sm font-medium text-primary">
              <Target className="mr-1 inline h-4 w-4" />
              {currency.format(nextTier.mrr - currentMRR)} to level up
            </p>
          )}
        </div>
      </div>

      {/* Option 6: What's Next Focus */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Option 6: What&apos;s next focus
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current</p>
              <p className="text-xl font-bold text-foreground">{currentTier.label}</p>
              <p className="text-sm text-muted-foreground">
                {(currentTier.rate * 100).toFixed(0)}% residuals
              </p>
            </div>
            {nextTier ? (
              <div className="flex-1 sm:max-w-xs">
                <p className="text-sm font-medium text-primary">Next up</p>
                <p className="text-lg font-bold">{nextTier.label}</p>
                <p className="text-sm text-muted-foreground">
                  {currency.format(nextTier.mrr - currentMRR)} to go
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <p className="flex items-center gap-2 font-semibold text-primary">
                  <Award className="h-5 w-5" />
                  Max tier reached
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Option 7: Revenue Impact Focus */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Option 7: Revenue impact focus
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">At {currentTier.label}</span>
              <span className="font-mono font-bold text-primary">
                ~{currency.format(currentMRR * currentTier.rate)}/mo
              </span>
            </div>
            {nextTier && (
              <>
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <span className="text-sm font-medium">At {nextTier.label}</span>
                  <span className="font-mono font-bold text-primary">
                    ~{currency.format(nextTier.mrr * nextTier.rate)}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    {currency.format(nextTier.mrr - currentMRR)} more MRR to unlock
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ——— Gamified Bar Variations ——— */}
      <h2 className="pt-8 text-lg font-bold text-muted-foreground">
        Gamified bar variations — pick one
      </h2>

      {/* Gamified A: RPG Level Style */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Gamified A: RPG level style
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-bold text-primary">
              LVL {currentIdx + 1}
            </span>
            {nextTier && (
              <span className="text-sm text-muted-foreground">
                → LVL {currentIdx + 2} {nextTier.label}
              </span>
            )}
          </div>
          <div className="mt-2 h-4 overflow-hidden rounded-lg bg-secondary/80">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-lg bg-gradient-to-r from-primary to-primary/80"
            />
          </div>
          {nextTier && (
            <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
              {currency.format(nextTier.mrr - currentMRR)} XP to level up
            </p>
          )}
        </div>
      </div>

      {/* Gamified B: Block segments */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Gamified B: Block segments
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex gap-1">
            {tierConfig.map((tier, i) => {
              const isComplete = currentMRR >= (tierConfig[i + 1]?.mrr ?? tier.mrr + 1);
              const isCurrent =
                currentTier.label === tier.label &&
                nextTier &&
                currentMRR < (tierConfig[i + 1]?.mrr ?? Infinity);
              const fill =
                !tierConfig[i + 1]
                  ? 100
                  : currentMRR >= tierConfig[i + 1].mrr
                  ? 100
                  : currentMRR >= tier.mrr
                  ? ((currentMRR - tier.mrr) / (tierConfig[i + 1].mrr - tier.mrr)) * 100
                  : 0;
              return (
                <div key={tier.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className="h-3 w-full overflow-hidden rounded bg-secondary">
                    <div
                      className={`h-full transition-all ${
                        isComplete ? "bg-primary" : isCurrent ? "bg-primary/60" : "bg-secondary"
                      }`}
                      style={{ width: isComplete ? "100%" : isCurrent ? `${fill}%` : "0%" }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>
          {nextTier && (
            <p className="mt-3 text-center text-sm text-primary">
              {currency.format(nextTier.mrr - currentMRR)} to unlock {nextTier.label}
            </p>
          )}
        </div>
      </div>

      {/* Gamified C: Milestone markers */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Gamified C: Milestone markers
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="relative">
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentIdx + progressToNext / 100) / tierConfig.length) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full bg-primary"
              />
            </div>
            <div className="absolute inset-x-0 top-full mt-2 flex justify-between">
              {tierConfig.map((tier, i) => {
                const isReached = currentIdx >= i;
                const isCurrent = currentTier.label === tier.label;
                return (
                  <div
                    key={tier.label}
                    className="flex flex-col items-center"
                    style={{ marginLeft: i === 0 ? 0 : "-20%" }}
                  >
                    <div
                      className={`mb-1 h-2 w-2 rounded-full ${
                        isReached
                          ? isCurrent
                            ? "bg-primary ring-2 ring-primary/40"
                            : "bg-primary"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isCurrent ? "text-primary" : isReached ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {tier.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {nextTier && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {progressToNext.toFixed(0)}% to {nextTier.label} ·{" "}
              <span className="font-semibold text-primary">
                {currency.format(nextTier.mrr - currentMRR)} to go
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Gamified D: Minimal slim */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Gamified D: Minimal slim
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">{currentTier.label}</span>
              {nextTier && (
                <span className="text-muted-foreground">
                  {progressToNext.toFixed(0)}% → {nextTier.label}
                </span>
              )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                className="h-full rounded-full bg-primary"
              />
            </div>
            {nextTier && (
              <p className="text-right text-xs text-muted-foreground">
                {currency.format(nextTier.mrr - currentMRR)} more
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Gamified E: Stepper style */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Gamified E: Stepper style
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex items-center gap-0">
            {tierConfig.map((tier, i) => {
              const isComplete = currentIdx > i;
              const isCurrent = currentTier.label === tier.label;
              const isLast = i === tierConfig.length - 1;
              return (
                <div key={tier.label} className="flex flex-1 items-center">
                  <div className="flex flex-1 flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        isComplete
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "border-2 border-primary bg-primary/10 text-primary"
                          : "border border-border bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {isComplete ? "✓" : i + 1}
                    </div>
                    <span
                      className={`mt-1 text-xs font-medium ${
                        isCurrent ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {tier.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`h-0.5 flex-1 ${
                        isComplete ? "bg-primary" : "bg-secondary"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {nextTier && (
            <p className="mt-4 text-center text-sm">
              Step {currentIdx + 1} of {tierConfig.length} ·{" "}
              <span className="font-semibold text-primary">
                {currency.format(nextTier.mrr - currentMRR)} to next
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Gamified F: Chunky Duolingo-style */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Gamified F: Chunky streak style
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex items-center gap-1">
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
                <div
                  key={tier.label}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 ${
                    isCurrent ? "bg-primary/10 ring-1 ring-primary/30" : ""
                  }`}
                >
                  <div
                    className={`h-4 w-full min-w-[2rem] overflow-hidden rounded-md ${
                      isComplete ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    {!isComplete && isCurrent && (
                      <div
                        className="h-full rounded-md bg-primary"
                        style={{ width: `${fill}%` }}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isCurrent ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>
          {nextTier && (
            <p className="mt-3 text-center text-sm font-semibold text-primary">
              🎯 {currency.format(nextTier.mrr - currentMRR)} to {nextTier.label}
            </p>
          )}
        </div>
      </div>

      {/* ——— Block Segment Variations ——— */}
      <h2 className="pt-8 text-lg font-bold text-muted-foreground">
        Block segment variations
      </h2>

      {/* Block A: Vertical blocks */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Block A: Vertical blocks
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex gap-2">
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
                <div key={tier.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="h-16 w-full min-h-[4rem] overflow-hidden rounded-lg bg-secondary">
                    <div
                      className={`w-full transition-all ${
                        isComplete ? "bg-primary" : isCurrent ? "bg-primary/70" : "bg-transparent"
                      }`}
                      style={{
                        height: isComplete ? "100%" : isCurrent ? `${fill}%` : "0%",
                        minHeight: isComplete || isCurrent ? "4px" : 0,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>
          {nextTier && (
            <p className="mt-3 text-center text-sm text-primary">
              {currency.format(nextTier.mrr - currentMRR)} to unlock {nextTier.label}
            </p>
          )}
        </div>
      </div>

      {/* Block B: Rounded pills */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Block B: Rounded pills
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex gap-1.5">
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
                <div key={tier.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isComplete ? "bg-primary" : isCurrent ? "bg-primary/80" : "bg-transparent"
                      }`}
                      style={{ width: isComplete ? "100%" : isCurrent ? `${fill}%` : "0%" }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>
          {nextTier && (
            <p className="mt-3 text-center text-sm text-primary">
              {currency.format(nextTier.mrr - currentMRR)} to {nextTier.label}
            </p>
          )}
        </div>
      </div>

      {/* Block C: Mini cards with bar */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Block C: Mini cards with bar
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="grid grid-cols-4 gap-2">
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
                <div
                  key={tier.label}
                  className={`rounded-lg border p-2.5 ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : isComplete
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="mb-2 h-2 overflow-hidden rounded bg-secondary">
                    <div
                      className={`h-full transition-all ${
                        isComplete ? "bg-primary" : isCurrent ? "bg-primary/70" : "bg-transparent"
                      }`}
                      style={{ width: isComplete ? "100%" : isCurrent ? `${fill}%` : "0%" }}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tier.label}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {(tier.rate * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
          {nextTier && (
            <p className="mt-3 text-center text-sm font-medium text-primary">
              {currency.format(nextTier.mrr - currentMRR)} to unlock {nextTier.label}
            </p>
          )}
        </div>
      </div>

      {/* Block D: Connected/segmented bar */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Block D: Connected segments
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex gap-0.5">
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
              const isLast = i === tierConfig.length - 1;
              return (
                <div key={tier.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={`h-4 w-full overflow-hidden ${
                      i === 0 ? "rounded-l-full" : isLast ? "rounded-r-full" : ""
                    } bg-secondary`}
                  >
                    <div
                      className={`h-full transition-all ${
                        isComplete ? "bg-primary" : isCurrent ? "bg-primary/80" : "bg-transparent"
                      } ${i === 0 ? "rounded-l-full" : ""}`}
                      style={{ width: isComplete ? "100%" : isCurrent ? `${fill}%` : "0%" }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>
          {nextTier && (
            <p className="mt-3 text-center text-sm text-primary">
              {currency.format(nextTier.mrr - currentMRR)} to {nextTier.label}
            </p>
          )}
        </div>
      </div>

      {/* Block E: Thick chunks with % */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Block E: Thick chunks with %
        </p>
        <div className="obsidian-card overflow-hidden p-5">
          <div className="flex gap-1">
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
                <div key={tier.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-8 w-full items-center overflow-hidden rounded-md bg-secondary">
                    <div
                      className={`flex h-full items-center justify-end pr-1 transition-all ${
                        isComplete ? "min-w-full bg-primary" : isCurrent ? "bg-primary/70" : "min-w-0 bg-transparent"
                      }`}
                      style={{ width: isComplete ? "100%" : isCurrent ? `${Math.max(fill, 4)}%` : "0%" }}
                    >
                      {(isComplete || isCurrent) && fill > 15 && (
                        <span className="text-[10px] font-bold text-primary-foreground">
                          {Math.round(fill)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>
          {nextTier && (
            <p className="mt-3 text-center text-sm text-primary">
              {currency.format(nextTier.mrr - currentMRR)} to {nextTier.label}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
