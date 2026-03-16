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
import { dealToSupabase, mapDealRow, mapRepRow } from "@/lib/supabase-mappers";
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
  markDealPaid: (dealId: string) => Promise<void>;
  cancelDeal: (dealId: string) => Promise<void>;
  updateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  updateRepProfile: (repId: string, updates: { name?: string; email?: string; avatar?: string; role?: "rep" | "manager" }) => Promise<void>;
  myRepId: string | null;
  team: ReturnType<typeof aggregateTeam>;
  selectedSummary: ReturnType<typeof aggregateRepDeals> | null;
  leaderboard: ReturnType<typeof getLeaderboard>;
  feedItems: ReturnType<typeof getDealFeedItems>;
  isManagerView: boolean;
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

  // Fetch reps and deals from Supabase
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [repsRes, dealsRes] = await Promise.all([
          supabase.from("reps").select("id, tenant_id, name, email, avatar, role, auth_user_id"),
          supabase.from("deals").select("*").order("close_date", { ascending: false }),
        ]);

        if (!mounted) return;

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
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

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

  const setSelectedRepId = useCallback((value: ViewScope) => {
    setSelectedRepIdState(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  }, []);

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

    const { error: updateError } = await supabase.from("deals").update(row).eq("id", dealId);

    if (updateError) {
      console.error("[updateDeal]", updateError);
      return;
    }

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, ...updates } : d)),
    );
  }, [tenantId]);

  const updateRepProfile = useCallback(async (repId: string, updates: { name?: string; email?: string; avatar?: string; role?: "rep" | "manager" }) => {
    const row: Record<string, unknown> = {};
    if (updates.name != null && updates.name.trim()) row.name = updates.name.trim();
    if (updates.email != null && updates.email.trim()) row.email = updates.email.trim();
    if (updates.avatar !== undefined) row.avatar = updates.avatar?.trim() || null;
    if (updates.role === "rep" || updates.role === "manager") row.role = updates.role;

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

    const { data, error: updateError } = await supabase
      .from("reps")
      .update(row)
      .eq("id", repId)
      .select("id")
      .single();

    if (updateError) {
      console.error("[updateRepProfile]", updateError);
      throw updateError;
    }
    if (!data) {
      throw new Error(
        "Profile update blocked. Run the RLS policies in supabase-reps-update-policies.sql in Supabase.",
      );
    }

    setRepsRaw((prev) =>
      prev.map((r) =>
        r.id === repId
          ? {
              ...r,
              ...(row.name != null && { name: row.name as string }),
              ...(row.email != null && { email: row.email as string }),
              ...(row.avatar !== undefined && { avatar: (row.avatar as string | null) ?? "" }),
              ...(row.role != null && { role: row.role as "rep" | "manager" }),
            }
          : r,
      ),
    );
  }, [myRepId]);

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
      updateDeal,
      updateRepProfile,
      myRepId,
      team,
      selectedSummary,
      leaderboard,
      feedItems,
      isManagerView: selectedRepId === "all",
      loading,
      error,
    }),
    [
      addDeal,
      cancelDeal,
      deals,
      error,
      feedItems,
      leaderboard,
      loading,
      markDealPaid,
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
