import { motion, useReducedMotion } from "framer-motion";
import { CircleDollarSign, Clock3, Layers3, Users } from "lucide-react";
import { currency } from "@/lib/commission";
import { useDashboard } from "@/providers/DashboardProvider";

const StatsRow = () => {
  const reduceMotion = useReducedMotion();
  const { isManagerView, selectedSummary, team } = useDashboard();
  const stats = isManagerView
    ? [
        {
          label: "Available to pay",
          value: currency.format(team.totalAvailableCommission),
          icon: CircleDollarSign,
          tone: "text-primary",
          detail: "Ready for the next 1st / 15th payout",
          emphasis: "primary",
        },
        {
          label: "Team MRR",
          value: currency.format(team.teamMrr),
          icon: Layers3,
          tone: "text-accent",
          detail: "Active recurring revenue on the board",
          emphasis: "secondary",
        },
        {
          label: "Active deals",
          value: `${team.activeDealCount}`,
          icon: Clock3,
          tone: "text-foreground",
          detail: "Excludes cancelled deals from payout math",
          emphasis: "default",
        },
        {
          label: "Rep count",
          value: `${team.repCount}`,
          icon: Users,
          tone: "text-primary",
          detail: "Leaderboard-ready selling seats",
          emphasis: "default",
        },
      ]
    : [
        {
          label: "Available now",
          value: currency.format(selectedSummary?.availableCommission ?? 0),
          icon: CircleDollarSign,
          tone: "text-primary",
          detail: "Commission already inside the payout window",
          emphasis: "primary",
        },
        {
          label: "Pending queue",
          value: currency.format(selectedSummary?.pendingCommission ?? 0),
          icon: Clock3,
          tone: "text-accent",
          detail: "Closed deals still inside the 5-day hold",
          emphasis: "secondary",
        },
        {
          label: "Total MRR",
          value: currency.format(selectedSummary?.totalMrr ?? 0),
          icon: Layers3,
          tone: "text-foreground",
          detail: "Your active recurring book of business",
          emphasis: "default",
        },
        {
          label: "This month earned",
          value: currency.format(selectedSummary?.thisMonthCommission ?? 0),
          icon: Users,
          tone: "text-primary",
          detail: "Closed-won commission booked this month",
          emphasis: "default",
        },
      ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ delay: 0.08 + i * 0.06 }}
          className={`obsidian-card p-4 md:p-5 ${
            stat.emphasis === "primary"
              ? "xl:col-span-4"
              : stat.emphasis === "secondary"
              ? "xl:col-span-3"
              : "xl:col-span-2 xl:min-w-0"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <stat.icon className={`h-4 w-4 ${stat.tone}`} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {stat.label}
            </span>
          </div>
          <span
            className={`font-mono-tabular font-bold text-foreground ${
              stat.emphasis === "primary"
                ? "text-3xl md:text-4xl"
                : stat.emphasis === "secondary"
                ? "text-3xl"
                : "text-2xl"
            }`}
          >
            {stat.value}
          </span>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{stat.detail}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsRow;
