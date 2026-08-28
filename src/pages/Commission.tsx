import { motion } from "framer-motion";
import { Info, User } from "lucide-react";
import { Navigate } from "react-router-dom";
import ResidualTiers from "@/components/commission/ResidualTiers";
import ProductCommissionGrid from "@/components/commission/ProductCommissionGrid";
import NonCommissionable from "@/components/commission/NonCommissionable";
import InteractiveCalc from "@/components/commission/InteractiveCalc";
import RepAvatar from "@/components/dashboard/RepAvatar";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/providers/DashboardProvider";

const Commission = () => {
  const {
    isManagerView,
    reps,
    selectedRep,
    selectedSummary,
    team,
    setSelectedRepId,
    hideCommissionUI,
    isPortalManager,
    myRepId,
  } = useDashboard();
  const currentMrr = isManagerView ? team.teamMrr : selectedSummary?.totalMrr ?? 0;
  const currentTier = isManagerView ? "Team view" : selectedSummary?.tier.label ?? "Launch";

  if (hideCommissionUI) {
    return <Navigate to="/" replace />;
  }

  if (isManagerView && !isPortalManager) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">Earnings Lab</h1>
        <p className="text-sm text-muted-foreground">
          Commission tools are available for your own book. Switch from Team board to your name in the
          header, or open your view directly below.
        </p>
        {myRepId ? (
          <Button className="mt-2" onClick={() => setSelectedRepId(myRepId)}>
            Open my Earnings Lab
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Link your account to a rep profile to continue.</p>
        )}
      </div>
    );
  }

  if (isManagerView) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <h1 className="text-3xl sm:text-4xl leading-none">
            <span className="dashboard-title-primary">EARNINGS </span>
            <span className="dashboard-title-accent">LAB</span>
          </h1>
          <div className="mt-2 mb-1 h-0.5 w-10 rounded-full bg-primary" />
          <p className="mt-2 text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Model a deal — see your payout
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Select a rep to see how a deal affects their commission, residual tier, and payout timing.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {reps.map((rep) => (
            <button
              key={rep.id}
              type="button"
              onClick={() => setSelectedRepId(rep.id)}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <RepAvatar
                avatar={rep.avatar}
                name={rep.name}
                className="h-12 w-12 rounded-lg bg-primary/10 text-lg text-primary"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{rep.name}</p>
                <p className="text-sm text-muted-foreground">Model deal for this rep</p>
              </div>
              <User className="h-5 w-5 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
            Rep calculator
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Commission <span className="text-primary">simulator</span>
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Model how a proposed deal affects upfront payout, residual tiers, and payout timing for{" "}
            {selectedRep?.name}.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Current MRR</p>
            <p className="mt-1 font-mono-tabular text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              ${currentMrr.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 px-4 py-3">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Current tier</p>
            <p className="mt-1 text-xl font-bold text-primary">{currentTier}</p>
          </div>
        </div>
      </motion.div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          These figures are before Stripe processing fees. Fees are usually around 4% of MRC; we build
          that into the listed price to protect our pricing.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4">
        <div className="w-full">
          <ResidualTiers currentMRR={currentMrr} variant="compact" />
        </div>
        <div className="w-full min-w-0">
          <InteractiveCalc currentMRR={currentMrr} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductCommissionGrid />
        </div>
        <div className="lg:col-span-1">
          <NonCommissionable />
        </div>
      </div>
    </div>
  );
};

export default Commission;
