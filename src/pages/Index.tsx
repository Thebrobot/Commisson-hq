import { motion, useReducedMotion } from "framer-motion";
import EarningsHero from "@/components/dashboard/EarningsHero";
import Leaderboard from "@/components/dashboard/Leaderboard";
import DealFeed from "@/components/dashboard/DealFeed";
import TeamContext from "@/components/dashboard/TeamContext";
import { useDashboard } from "@/providers/DashboardProvider";

const Index = () => {
  const reduceMotion = useReducedMotion();
  const { isManagerView, selectedRep } = useDashboard();

  const titlePrimary = isManagerView ? "TEAM" : (selectedRep?.name?.split(" ")[0]?.toUpperCase() ?? "MY");
  const titleAccent = isManagerView ? "COMMAND CENTER" : "DASHBOARD";

  return (
    <div className={isManagerView ? "space-y-2 sm:space-y-6 lg:space-y-8" : "space-y-3 sm:space-y-4"}>

      {/* Bold hero title — matches the reference dashboard aesthetic */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="pt-1"
      >
        <h1 className="text-3xl sm:text-4xl xl:text-5xl leading-none">
          <span className="dashboard-title-primary">{titlePrimary} </span>
          <span className="dashboard-title-accent">{titleAccent}</span>
        </h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-primary" />
      </motion.div>

      <div className={`grid grid-cols-1 lg:grid-cols-12 ${isManagerView ? "gap-4 sm:gap-6 lg:gap-8" : "gap-3 sm:gap-4"}`}>
        <div className={`flex flex-col ${isManagerView ? "gap-4 sm:gap-6 lg:col-span-7" : "gap-3 sm:gap-4 lg:col-span-12"}`}>
          <EarningsHero />
          {isManagerView && (
            <div className="flex flex-col gap-6">
              <TeamContext />
              <div className="mt-6">
                <Leaderboard />
              </div>
            </div>
          )}
        </div>
        {isManagerView && (
          <div className="lg:col-span-5">
            <DealFeed />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
