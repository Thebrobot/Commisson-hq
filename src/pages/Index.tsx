import EarningsHero from "@/components/dashboard/EarningsHero";
import Leaderboard from "@/components/dashboard/Leaderboard";
import DealFeed from "@/components/dashboard/DealFeed";
import TeamContext from "@/components/dashboard/TeamContext";
import { useDashboard } from "@/providers/DashboardProvider";

const Index = () => {
  const { isManagerView } = useDashboard();

  return (
    <div className={isManagerView ? "space-y-2 sm:space-y-6 lg:space-y-8" : "space-y-3 sm:space-y-4"}>
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
