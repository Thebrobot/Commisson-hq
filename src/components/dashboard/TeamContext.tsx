import { motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, Clock3, UserCheck } from "lucide-react";
import { useDashboard } from "@/providers/DashboardProvider";

const TeamContext = () => {
  const reduceMotion = useReducedMotion();
  const { isManagerView, selectedSummary, team } = useDashboard();

  const items = isManagerView
    ? [
        {
          label: "Active clients",
          value: `${team.activeClientCount}`,
          detail: "Paying clients over the lifetime of the company",
          icon: UserCheck,
          accent: "primary" as const,
        },
        {
          label: "Closed this month",
          value: `${team.closedThisMonthCount}`,
          detail: "New deals signed this month",
          icon: CalendarCheck,
          accent: "blue" as const,
        },
        {
          label: "On trial",
          value: `${team.onTrialCount}`,
          detail: "Clients in trial, not yet paying",
          icon: Clock3,
          accent: "accent" as const,
        },
      ]
    : [
        {
          label: "Active clients",
          value: `${selectedSummary?.payingClientCount ?? 0}`,
          detail: "Your paying clients",
          icon: UserCheck,
          accent: "primary" as const,
        },
        {
          label: "Closed this month",
          value: `${selectedSummary?.closedThisMonthCount ?? 0}`,
          detail: "Deals you signed this month",
          icon: CalendarCheck,
          accent: "blue" as const,
        },
        {
          label: "On trial",
          value: `${selectedSummary?.onTrialCount ?? 0}`,
          detail: "Your clients in trial",
          icon: Clock3,
          accent: "accent" as const,
        },
      ];

  const accentStyles = {
    primary: "border-l-primary/60 bg-primary/5 dark:bg-primary/10",
    blue: "border-l-blue-500/60 bg-blue-500/5 dark:bg-blue-500/10",
    accent: "border-l-accent/60 bg-accent/5 dark:bg-accent/10",
  };

  const iconStyles = {
    primary: "bg-primary/15 text-primary dark:bg-primary/20",
    blue: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    accent: "bg-accent/15 text-accent dark:bg-accent/20",
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 ${isManagerView ? "gap-3" : "gap-2"}`}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
          className={`flex items-center rounded-xl border border-border border-l-4 shadow-sm transition-shadow hover:shadow-md ${accentStyles[item.accent]} ${isManagerView ? "gap-3 px-4 py-3" : "gap-2 px-3 py-2.5"}`}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconStyles[item.accent]}`}>
            <item.icon className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-0.5 font-mono-tabular text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {item.value}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.detail}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TeamContext;
