import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CircleDollarSign,
  Pencil,
  ShieldCheck,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import { payoutConfig } from "@/data/catalog/commission";
import { currency } from "@/lib/commission";
import { useDashboard } from "@/providers/DashboardProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TARGET_STORAGE_KEY = "rep-target";

function getStoredTarget(repId: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${TARGET_STORAGE_KEY}-${repId}`);
  if (raw == null) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

function setStoredTarget(repId: string, value: number): void {
  window.localStorage.setItem(`${TARGET_STORAGE_KEY}-${repId}`, String(Math.round(value)));
}

/** Rep view: customizable target + 2 meaningful milestones */
function RepMilestones() {
  const reduceMotion = useReducedMotion();
  const { selectedRepId, selectedSummary } = useDashboard();
  const defaultTarget = payoutConfig.monthlyGoal;
  const repId = selectedRepId === "all" ? "" : selectedRepId;

  const [target, setTarget] = useState<number>(() => {
    const stored = repId ? getStoredTarget(repId) : null;
    return stored ?? defaultTarget;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(target));

  useEffect(() => {
    if (!repId) return;
    const stored = getStoredTarget(repId);
    setTarget(stored ?? defaultTarget);
    setEditValue(String(stored ?? defaultTarget));
  }, [repId, defaultTarget]);

  const saveTarget = useCallback(() => {
    const n = parseInt(editValue.replace(/[^0-9]/g, ""), 10);
    if (Number.isNaN(n) || n < 1) {
      setEditValue(String(target));
      setIsEditing(false);
      return;
    }
    const clamped = Math.min(Math.max(n, 100), 1_000_000);
    setTarget(clamped);
    setEditValue(String(clamped));
    if (repId) setStoredTarget(repId, clamped);
    setIsEditing(false);
  }, [editValue, target, repId]);

  const current = selectedSummary?.thisMonthCommission ?? 0;
  const progress = Math.min(100, (current / target) * 100);
  const hitTarget = current >= target;

  const firstClose = (selectedSummary?.closedThisMonthCount ?? 0) >= 1;
  const bookBuilder = (selectedSummary?.payingClientCount ?? 0) >= 5;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="obsidian-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" strokeWidth={2.5} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Rep milestones
          </h3>
        </div>
      </div>

      {/* Customizable target – main card */}
      <div
        className={`rounded-xl border p-4 mb-4 ${
          hitTarget ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/5"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            My target
          </p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                type="text"
                inputMode="numeric"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ""))}
                onBlur={saveTarget}
                onKeyDown={(e) => e.key === "Enter" && saveTarget()}
                className="h-8 w-24 font-mono text-sm"
                autoFocus
              />
              <Button variant="ghost" size="sm" onClick={saveTarget} className="text-xs">
                Save
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(true);
                setEditValue(String(target));
              }}
              className="text-xs text-muted-foreground gap-1"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono-tabular text-3xl font-bold tracking-tight text-foreground money-gradient">
            {currency.format(current)}
          </span>
          <span className="text-muted-foreground text-sm">/ {currency.format(target)}</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            initial={reduceMotion ? false : { width: 0 }}
            animate={reduceMotion ? undefined : { width: `${progress}%` }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className={`h-full rounded-full ${hitTarget ? "bg-primary" : "bg-primary/70"}`}
          />
        </div>
        {hitTarget ? (
          <p className="mt-2 text-xs font-medium text-primary">Target hit. Keep going.</p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            {currency.format(Math.max(target - current, 0))} to go
          </p>
        )}
      </div>

      {/* Two additional milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className={`flex items-center gap-3 rounded-xl border p-3.5 ${
            firstClose ? "border-primary/20 bg-primary/5" : "border-border/30 bg-background/20"
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              firstClose ? "bg-primary/20" : "bg-secondary"
            }`}
          >
            <Target
              className={`h-4 w-4 ${firstClose ? "text-primary" : "text-muted-foreground/60"}`}
              strokeWidth={2.5}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              First close this month
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {firstClose
                ? "You're on the board"
                : "Close your first deal to get started"}
            </p>
          </div>
          {firstClose && (
            <span className="ml-auto rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Done
            </span>
          )}
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className={`flex items-center gap-3 rounded-xl border p-3.5 ${
            bookBuilder ? "border-primary/20 bg-primary/5" : "border-border/30 bg-background/20"
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              bookBuilder ? "bg-primary/20" : "bg-secondary"
            }`}
          >
            <UserRound
              className={`h-4 w-4 ${bookBuilder ? "text-primary" : "text-muted-foreground/60"}`}
              strokeWidth={2.5}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Book builder
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {bookBuilder
                ? `${selectedSummary?.payingClientCount ?? 0} paying clients`
                : "Hit 5 paying clients"}
            </p>
          </div>
          {bookBuilder && (
            <span className="ml-auto rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Done
            </span>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

const Achievements = () => {
  const reduceMotion = useReducedMotion();
  const { isManagerView, leaderboard, team } = useDashboard();

  if (!isManagerView) {
    return <RepMilestones />;
  }

  const items = [
    {
      id: "payroll-ready",
      icon: CircleDollarSign,
      label: "Payroll ready",
      desc: `${team.reps.filter((rep) => rep.availableCommission > 0).length} reps have commission ready now.`,
      unlocked: team.totalAvailableCommission > 0,
      detail: currency.format(team.totalAvailableCommission),
    },
    {
      id: "mvp",
      icon: Trophy,
      label: "MVP this month",
      desc: team.topPerformer
        ? `${team.topPerformer.rep.name} is leading the board this month.`
        : "No rep activity yet this month.",
      unlocked: Boolean(team.topPerformer),
      detail: team.topPerformer
        ? currency.format(team.topPerformer.thisMonthCommission)
        : "Waiting",
    },
    {
      id: "leaderboard-depth",
      icon: UserRound,
      label: "Leaderboard depth",
      desc: `${leaderboard.filter((entry) => entry.thisMonthCommission > 0).length} reps are on the board this month.`,
      unlocked: leaderboard.filter((entry) => entry.thisMonthCommission > 0).length >= 3,
      detail: `${leaderboard.length} reps`,
    },
    {
      id: "pending-review",
      icon: ShieldCheck,
      label: "Pending review",
      desc: "Deals still inside the availability hold before payroll.",
      unlocked: team.totalPendingCommission > 0,
      detail: currency.format(team.totalPendingCommission),
    },
  ];
  const unlockedCount = items.filter((item) => item.unlocked).length;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="obsidian-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" strokeWidth={2.5} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Payout watch
          </h3>
        </div>
        <span className="font-mono-tabular text-xs text-muted-foreground">
          <span className="text-primary font-bold">{unlockedCount}</span>/{items.length} active
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className={`relative rounded-lg border p-3.5 snap-transition ${
              item.unlocked
                ? "border-primary/20 bg-primary/5"
                : "border-border/30 bg-background/20"
            }`}
          >
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${
              item.unlocked ? "bg-primary/20" : "bg-secondary"
            }`}>
              <item.icon
                className={`h-4 w-4 ${item.unlocked ? "text-primary" : "text-muted-foreground/60"}`}
                strokeWidth={2.5}
              />
            </div>
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${
                item.unlocked ? "text-foreground" : "text-muted-foreground"
              }`}>
                {item.label}
              </p>
              <p className="font-mono-tabular text-base font-bold text-foreground md:text-lg">{item.detail}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
            {!item.unlocked && (
              <div className="mt-2.5 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Not active yet
              </div>
            )}
            {item.unlocked && (
              <div className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs uppercase tracking-[0.2em] text-primary">
                Live
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Achievements;
