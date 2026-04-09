import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  aggregateRepDeals,
  aggregateTeam,
  getDealFeedItems,
  getLeaderboard,
} from "@/lib/commission";
import { defaultHandoff } from "@/lib/handoff";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { dealToSupabase, mapDealRow, mapRepRow } from "@/lib/supabase-mappers";
import { hideCommissionUI, isPortalManager } from "@/lib/repRoles";
import type { Deal, Rep, ViewScope } from "@/types/commission";

const STORAGE_KEY = "commission-current-user";

interface RepWithTenant extends Rep {
  tenantId?: string;
  authUserId?: string | null;
}

interface DashboardContextValue {
  reps: Rep[];
  deals: Deal[];
  selectedRepId: ViewScope;
  selectedRep: Rep | null;
  setSelectedRepId: (value: ViewScope) => void;
  addDeal: (partial?: Partial<Omit<Deal, "id">>) => Promise<Deal | null>;
  addRep: (data: { name: string; email: string; role: "rep" | "manager" | "partner" }) => Promise<Rep | null>;
  markDealPaid: (dealId: string) => Promise<void>;
  cancelDeal: (dealId: string) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  updateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  updateRepProfile: (repId: string, updates: { name?: string; email?: string; avatar?: string; role?: "rep" | "manager" | "partner" }) => Promise<void>;
  myRepId: string | null;
  team: ReturnType<typeof aggregateTeam>;
  selectedSummary: ReturnType<typeof aggregateRepDeals> | null;
  leaderboard: ReturnType<typeof getLeaderboard>;
  feedItems: ReturnType<typeof getDealFeedItems>;
  isManagerView: boolean;
  /** Logged-in user's rep row (from auth / email match). */
  myRep: Rep | null;
  /** True when the logged-in user is a manager (full rep switcher, Reps admin, commission tools). */
  isPortalManager: boolean;
  /** Sales partner: show MRR/clients only; hide commission and payout UI. */
  hideCommissionUI: boolean;
  loading: boolean;
  error: string | null;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedRepId, setSelectedRepIdState] = useState<ViewScope>("all");
  const [repsRaw, setRepsRaw] = useState<RepWithTenant[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantId = repsRaw[0]?.tenantId ?? null;
  const myRepId = useMemo(() => {
    const byAuth = repsRaw.find((r) => (r as RepWithTenant).authUserId === user?.id)?.id;
    if (byAuth) return byAuth;
    // Fallback: match by email (for manually-created rep rows without auth_user_id)
    const byEmail = repsRaw.find((r) => r.email === user?.email)?.id;
    return byEmail ?? null;
  }, [repsRaw, user?.id, user?.email]);

  const myRep = useMemo(
    () => (myRepId != null ? repsRaw.find((r) => r.id === myRepId) ?? null : null),
    [repsRaw, myRepId],
  );
  const isPortalManagerUser = isPortalManager(myRep);
  const hideCommissionUIUser = hideCommissionUI(myRep);

  // Fetch reps and deals from Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [repsRes, dealsRes] = await Promise.all([
        supabase.from("reps").select("id, tenant_id, name, email, avatar, role, auth_user_id"),
        supabase.from("deals").select("*").order("close_date", { ascending: false }),
      ]);

      if (repsRes.error) throw repsRes.error;
      if (dealsRes.error) throw dealsRes.error;

      const repsWithTenant: RepWithTenant[] = (repsRes.data ?? []).map((r) => ({
        ...mapRepRow(r),
        tenantId: r.tenant_id,
        authUserId: r.auth_user_id ?? null,
      }));
      setRepsRaw(repsWithTenant);
      setDeals((dealsRes.data ?? []).map(mapDealRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recovery: if user is logged in but has no rep row, retry signup-complete and refetch
  useEffect(() => {
    if (!user || loading || myRepId != null || repsRaw.length === 0) return;
    const hasRepForUser = repsRaw.some(
      (r) => (r as RepWithTenant).authUserId === user.id || r.email === user.email,
    );
    if (hasRepForUser) return;

    let cancelled = false;
    const maxRetries = 3;
    const retryDelayMs = 800;

    async function recover() {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session) return;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const res = await fetch("/api/signup-complete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          if (res.ok) {
            loadData();
            return;
          }
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
          }
        } catch {
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
          }
        }
      }
    }
    recover();
    return () => { cancelled = true; };
  }, [user, loading, myRepId, repsRaw.length, loadData]);

  // Restore selectedRepId from localStorage (validate against loaded reps)
  useEffect(() => {
    if (repsRaw.length === 0) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "all") {
      setSelectedRepIdState("all");
      return;
    }
    if (stored && repsRaw.some((r) => r.id === stored)) {
      setSelectedRepIdState(stored);
    }
  }, [repsRaw]);

  // Non-managers may only use Team board or their own rep scope.
  useEffect(() => {
    if (repsRaw.length === 0 || myRepId == null) return;
    if (isPortalManagerUser) return;
    if (selectedRepId === "all" || selectedRepId === myRepId) return;
    setSelectedRepIdState("all");
    window.localStorage.setItem(STORAGE_KEY, "all");
  }, [repsRaw.length, myRepId, selectedRepId, isPortalManagerUser]);

  const setSelectedRepId = useCallback(
    (value: ViewScope) => {
      if (!isPortalManagerUser && value !== "all" && value !== myRepId) {
        return;
      }
      setSelectedRepIdState(value);
      window.localStorage.setItem(STORAGE_KEY, value);
    },
    [isPortalManagerUser, myRepId],
  );

  const addDeal = useCallback(
    async (partial?: Partial<Omit<Deal, "id">>) => {
      if (!tenantId || repsRaw.length === 0) return null;
      const repId = selectedRepId === "all" ? repsRaw[0].id : selectedRepId;
      const today = new Date().toISOString().slice(0, 10);
      const defaults: Omit<Deal, "id"> = {
        repId,
        clientName: "New client",
        clientEmail: null,
        clientPhone: null,
        ghlContactId: null,
        products: [{ productId: "", quantity: 1, overrideMrr: null }],
        setupFees: [{ type: "", actualAmount: 0 }],
        closeDate: today,
        firstPaymentDate: null,
        status: "active",
        paidOut: false,
        paidOutAt: null,
        handoff: defaultHandoff,
      };
      const full: Omit<Deal, "id"> = { ...defaults, ...partial };
      const row = dealToSupabase({ ...full, repId }, tenantId);

      const { data, error: insertError } = await supabase.from("deals").insert(row).select("id").single();

      if (insertError) {
        console.error("[addDeal]", insertError);
        return null;
      }

      const newDeal: Deal = { ...full, id: data.id };
      setDeals((prev) => [newDeal, ...prev]);
      return newDeal;
    },
    [tenantId, repsRaw, selectedRepId],
  );

  const markDealPaid = useCallback(async (dealId: string) => {
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("deals")
      .update({ paid_out: true, paid_out_at: now })
      .eq("id", dealId);

    if (updateError) {
      console.error("[markDealPaid]", updateError);
      return;
    }

    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, paidOut: true, paidOutAt: now } : d,
      ),
    );
  }, []);

  const cancelDeal = useCallback(async (dealId: string) => {
    const { error: updateError } = await supabase
      .from("deals")
      .update({ status: "cancelled", paid_out: false, paid_out_at: null })
      .eq("id", dealId);

    if (updateError) {
      console.error("[cancelDeal]", updateError);
      return;
    }

    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? { ...d, status: "cancelled" as const, paidOut: false, paidOutAt: null }
          : d,
      ),
    );
  }, []);

  const deleteDeal = useCallback(async (dealId: string) => {
    const { data, error: deleteError } = await supabase
      .from("deals")
      .delete()
      .eq("id", dealId)
      .select("id");

    if (deleteError) {
      console.error("[deleteDeal]", deleteError);
      toast.error("Could not delete. " + (deleteError.message || "Try again."));
      return;
    }

    if (!data || data.length === 0) {
      toast.error(
        "Delete blocked. Run the SQL in supabase-deals-delete-policy.sql in your Supabase SQL Editor to enable deletes."
      );
      return;
    }

    setDeals((prev) => prev.filter((d) => d.id !== dealId));
  }, []);

  const updateDeal = useCallback(async (dealId: string, updates: Partial<Deal>) => {
    if (!tenantId) return;
    const row: Record<string, unknown> = {};
    if (updates.repId != null) row.rep_id = updates.repId;
    if (updates.clientName != null) row.client_name = updates.clientName;
    if (updates.clientEmail !== undefined) row.client_email = updates.clientEmail;
    if (updates.clientPhone !== undefined) row.client_phone = updates.clientPhone;
    if (updates.ghlContactId !== undefined) row.ghl_contact_id = updates.ghlContactId;
    if (updates.products != null) row.products = updates.products;
    if (updates.setupFees != null) row.setup_fees = updates.setupFees;
    if (updates.closeDate != null) row.close_date = updates.closeDate;
    if (updates.firstPaymentDate !== undefined) row.first_payment_date = updates.firstPaymentDate;
    if (updates.status != null) row.status = updates.status;
    if (updates.paidOut !== undefined) row.paid_out = updates.paidOut;
    if (updates.paidOutAt !== undefined) row.paid_out_at = updates.paidOutAt;
    if (updates.handoff !== undefined) row.handoff = updates.handoff ?? {};
    if (updates.notes !== undefined) row.notes = updates.notes ?? null;

    const { error: updateError } = await supabase.from("deals").update(row).eq("id", dealId);

    if (updateError) {
      console.error("[updateDeal]", updateError);
      return;
    }

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, ...updates } : d)),
    );
  }, [tenantId]);

  const updateRepProfile = useCallback(async (repId: string, updates: { name?: string; email?: string; avatar?: string; role?: "rep" | "manager" | "partner" }) => {
    const row: Record<string, unknown> = {};
    if (updates.name != null && updates.name.trim()) row.name = updates.name.trim();
    if (updates.email != null && updates.email.trim()) row.email = updates.email.trim();
    if (updates.avatar !== undefined) row.avatar = updates.avatar?.trim() || null;
    if (updates.role === "rep" || updates.role === "manager" || updates.role === "partner") {
      row.role = updates.role;
    }

    if (Object.keys(row).length === 0) return;

    const newEmail = updates.email?.trim();
    const isOwnEmailChange = repId === myRepId && newEmail;

    // When changing your own email, update Supabase Auth first (login credentials)
    if (isOwnEmailChange) {
      const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
      if (authError) {
        console.error("[updateRepProfile] auth", authError);
        throw authError;
      }
    }

    const { error: updateError } = await supabase
      .from("reps")
      .update(row)
      .eq("id", repId);

    if (updateError) {
      console.error("[updateRepProfile]", updateError);
      throw new Error(updateError.message || "Update failed");
    }

    setRepsRaw((prev) =>
      prev.map((r) =>
        r.id === repId
          ? {
              ...r,
              ...(row.name != null && { name: row.name as string }),
              ...(row.email != null && { email: row.email as string }),
              ...(row.avatar !== undefined && { avatar: (row.avatar as string | null) ?? "" }),
              ...(row.role != null && { role: row.role as "rep" | "manager" | "partner" }),
            }
          : r,
      ),
    );
  }, [myRepId]);

  const addRep = useCallback(async (data: { name: string; email: string; role: "rep" | "manager" | "partner" }) => {
    if (!tenantId) return null;
    const row = {
      tenant_id: tenantId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role,
      avatar: "",
    };
    const { data: inserted, error } = await supabase.from("reps").insert(row).select("id, tenant_id, name, email, avatar, role, auth_user_id, created_at").single();
    if (error) {
      console.error("[addRep]", error);
      throw new Error(error.message || "Failed to add rep");
    }
    const newRep: RepWithTenant = { ...mapRepRow(inserted), tenantId: inserted.tenant_id, authUserId: inserted.auth_user_id ?? null };
    setRepsRaw((prev) => [...prev, newRep]);
    return newRep;
  }, [tenantId]);

  const reps = useMemo(() => repsRaw, [repsRaw]);

  const team = useMemo(() => aggregateTeam(reps, deals), [reps, deals]);
  const selectedRep = useMemo(
    () => reps.find((rep) => rep.id === selectedRepId) ?? null,
    [reps, selectedRepId],
  );
  const selectedSummary = useMemo(() => {
    if (!selectedRep) return null;
    return aggregateRepDeals(
      selectedRep,
      deals.filter((deal) => deal.repId === selectedRep.id),
    );
  }, [deals, selectedRep]);
  const leaderboard = useMemo(() => getLeaderboard(team.reps), [team.reps]);
  const feedItems = useMemo(() => {
    const scopedDeals =
      selectedRepId === "all"
        ? deals
        : deals.filter((deal) => deal.repId === selectedRepId);
    return getDealFeedItems(reps, scopedDeals);
  }, [deals, selectedRepId, reps]);

  const value = useMemo(
    () => ({
      reps,
      deals,
      selectedRepId,
      selectedRep,
      setSelectedRepId,
      addDeal,
      markDealPaid,
      cancelDeal,
      deleteDeal,
      updateDeal,
      updateRepProfile,
      addRep,
      myRepId,
      team,
      selectedSummary,
      leaderboard,
      feedItems,
      isManagerView: selectedRepId === "all",
      myRep,
      isPortalManager: isPortalManagerUser,
      hideCommissionUI: hideCommissionUIUser,
      loading,
      error,
    }),
    [
      addDeal,
      addRep,
      cancelDeal,
      deleteDeal,
      deals,
      error,
      feedItems,
      hideCommissionUIUser,
      isPortalManagerUser,
      leaderboard,
      loading,
      markDealPaid,
      myRep,
      myRepId,
      reps,
      selectedRep,
      selectedRepId,
      selectedSummary,
      setSelectedRepId,
      team,
      updateDeal,
      updateRepProfile,
    ],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
