import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Crown, Star } from "lucide-react";
import { currency } from "@/lib/commission";
import { useDashboard } from "@/providers/DashboardProvider";
import RepAvatar from "@/components/dashboard/RepAvatar";

const Leaderboard = () => {
  const reduceMotion = useReducedMotion();
  const { leaderboard, selectedRepId, setSelectedRepId, isManagerView } = useDashboard();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className={`obsidian-card h-full ${isManagerView ? "p-5" : "p-4"}`}
    >
      <div className={`flex items-center gap-2 ${isManagerView ? "mb-4" : "mb-3"}`}>
        <Crown className="h-5 w-5 text-yellow-400" strokeWidth={2.5} />
        <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">Who's Winning</h3>
      </div>

      <div className="space-y-1.5">
        {leaderboard.map((entry, i) => {
          const isActive = selectedRepId === entry.rep.id;
          return (
            <motion.div
              key={entry.rep.id}
              initial={reduceMotion ? false : { opacity: 0, x: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="rounded-lg"
            >
              <button
                type="button"
                onClick={() => setSelectedRepId(entry.rep.id)}
                className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left snap-transition ${
                  isActive
                    ? "border border-primary/20 bg-primary/10"
                    : "hover:bg-secondary/50"
                }`}
              >
                <div className="flex w-7 items-center justify-center text-center">
                  {entry.rank === 1 ? (
                    <Crown className="h-4 w-4 text-yellow-400" />
                  ) : (
                    <span className="font-mono-tabular text-sm text-muted-foreground">{entry.rank}</span>
                  )}
                </div>
                <RepAvatar
                  avatar={entry.rep.avatar}
                  name={entry.rep.name}
                  className={`h-8 w-8 ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                  <p className={`truncate text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                      {entry.rep.name}
                    </p>
                    {entry.rank <= 3 && <Star className="h-3 w-3 fill-primary/60 text-primary/60" />}
                  </div>
                  <p className="font-mono-tabular text-sm font-medium text-foreground">
                    {currency.format(entry.thisMonthCommission)} this month
                  </p>
                  <p className="font-mono-tabular text-sm font-medium text-muted-foreground">
                    {currency.format(entry.totalMrr)} MRR
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </motion.div>
          );
        })}
      </div>

    </motion.div>
  );
};

export default Leaderboard;
