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
          detail: "Paying clients, all time",
          icon: UserCheck,
        },
        {
          label: "Closed this month",
          value: `${team.closedThisMonthCount}`,
          detail: "New deals signed this month",
          icon: CalendarCheck,
        },
        {
          label: "On trial",
          value: `${team.onTrialCount}`,
          detail: "Clients in trial, not yet paying",
          icon: Clock3,
        },
      ]
    : [
        {
          label: "Active clients",
          value: `${selectedSummary?.payingClientCount ?? 0}`,
          detail: "Your paying clients",
          icon: UserCheck,
        },
        {
          label: "Closed this month",
          value: `${selectedSummary?.closedThisMonthCount ?? 0}`,
          detail: "Deals you signed this month",
          icon: CalendarCheck,
        },
        {
          label: "On trial",
          value: `${selectedSummary?.onTrialCount ?? 0}`,
          detail: "Your clients in trial",
          icon: Clock3,
        },
      ];

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
          className={`stat-card ${isManagerView ? "px-4 py-3.5" : "px-3 py-3"}`}
        >
          <div className="stat-card-icon">
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
