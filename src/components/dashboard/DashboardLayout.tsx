import { Outlet } from "react-router-dom";
import { useDashboard } from "@/providers/DashboardProvider";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";

const DashboardLayout = () => {
  const { loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      <div className="flex w-full max-w-full min-w-0 flex-col gap-1 px-4 pt-2 pb-24 sm:gap-1.5 sm:px-6 sm:pt-3 sm:pb-28 lg:gap-2 lg:px-8 lg:pt-4 lg:pb-[max(8rem,calc(2rem+env(safe-area-inset-bottom)))]">
        <DashboardHeader />
        <main className="min-w-0 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
