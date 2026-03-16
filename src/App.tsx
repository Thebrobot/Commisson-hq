import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabase";
import { DashboardProvider } from "@/providers/DashboardProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { Toaster } from "@/components/ui/sonner";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Index from "@/pages/Index";
import Clients from "@/pages/Clients";
import HandoffKit from "@/pages/HandoffKit";
import HandoffList from "@/pages/HandoffList";
import Commission from "@/pages/Commission";
import Login from "@/pages/Login";

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const [repReady, setRepReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const maxRetries = 3;
    const retryDelayMs = 1000;

    async function ensureRepWithRetry(session: { access_token: string }) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const res = await fetch("/api/signup-complete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          if (res.ok) return true;
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
          } else {
            console.error("[signup-complete] Failed after retries:", res.status, await res.text());
          }
        } catch (err) {
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
          } else {
            console.error("[signup-complete] Network error:", err);
          }
        }
      }
      return false;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled || !session) {
        setRepReady(true);
        return;
      }
      await ensureRepWithRetry(session);
      if (!cancelled) setRepReady(true);
    });
    return () => { cancelled = true; };
  }, [user]);

  if (loading || (user && !repReady)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <DashboardProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Index />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:dealId/handoff" element={<HandoffKit />} />
            <Route path="handoff" element={<HandoffList />} />
            <Route path="commissions" element={<Commission />} />
          </Route>
        </Routes>
      </NotificationProvider>
    </DashboardProvider>
  );
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="commission-hq-theme"
    >
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
