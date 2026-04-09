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

export interface AddRepResult {
  rep: Rep | null;
  inviteSent: boolean;
  inviteNote?: string;
}

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
  addRep: (
    data: { name: string; email: string; role: "rep" | "manager" | "partner" },
    options?: { sendInvite?: boolean },
  ) => Promise<AddRepResult>;
  markDealPaid: (dealId: string) => Promise<void>;
  cancelDeal: (dealId: string) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  updateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  updateRepProfile: (repId: string, updates: { name?: string; email?: string; avatar?: string; role?: "rep" | "manager" | "partner" }) => Promise<void>;
  /** Managers only. Removes rep row; blocked if they have deals or are the only manager / yourself. */
  deleteRep: (repId: string) => Promise<void>;
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
      // Team board: managers default to first rep (reassign in edit sheet); everyone else uses their own row (rep or partner).
      const repId =
        selectedRepId === "all"
          ? isPortalManagerUser
            ? repsRaw[0].id
            : myRepId ?? repsRaw[0].id
          : selectedRepId;
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
    [tenantId, repsRaw, selectedRepId, isPortalManagerUser, myRepId],
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

  const addRep = useCallback(
    async (
      data: { name: string; email: string; role: "rep" | "manager" | "partner" },
      options?: { sendInvite?: boolean },
    ): Promise<AddRepResult> => {
      if (!tenantId) {
        return { rep: null, inviteSent: false, inviteNote: "No tenant loaded." };
      }
      const row = {
        tenant_id: tenantId,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role,
        avatar: "",
      };
      const { data: inserted, error } = await supabase
        .from("reps")
        .insert(row)
        .select("id, tenant_id, name, email, avatar, role, auth_user_id, created_at")
        .single();
      if (error) {
        console.error("[addRep]", error);
        throw new Error(error.message || "Failed to add rep");
      }
      const newRep: RepWithTenant = {
        ...mapRepRow(inserted),
        tenantId: inserted.tenant_id,
        authUserId: inserted.auth_user_id ?? null,
      };
      setRepsRaw((prev) => [...prev, newRep]);

      const sendInvite = options?.sendInvite !== false;
      if (!sendInvite) {
        return { rep: newRep, inviteSent: false, inviteNote: undefined };
      }

      let inviteSent = false;
      let inviteNote: string | undefined;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        inviteNote = "Invite email was not sent (no session). They can still use Sign up with this email.";
      } else {
        try {
          const res = await fetch("/api/invite-rep", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ email: newRep.email }),
          });
          const payload = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
          if (res.ok) {
            inviteSent = true;
          } else if (res.status === 409) {
            inviteNote =
              payload.error ??
              "This email already has an account — they can sign in with the same address.";
          } else {
            inviteNote = payload.error ?? `Invite failed (${res.status}). Rep was still created.`;
          }
        } catch (e) {
          console.error("[addRep] invite-rep", e);
          inviteNote = "Could not reach invite service. Rep was created — send them the login link manually.";
        }
      }

      return { rep: newRep, inviteSent, inviteNote };
    },
    [tenantId],
  );

  const deleteRep = useCallback(
    async (repId: string) => {
      if (repId === myRepId) {
        throw new Error("You can't remove your own account from the team list.");
      }
      const target = repsRaw.find((r) => r.id === repId);
      if (!target) {
        throw new Error("Rep not found.");
      }
      if (target.role === "manager") {
        const managerCount = repsRaw.filter((r) => r.role === "manager").length;
        if (managerCount <= 1) {
          throw new Error("You can't remove the only manager. Promote someone else to manager first.");
        }
      }
      const dealCount = deals.filter((d) => d.repId === repId).length;
      if (dealCount > 0) {
        throw new Error(
          `This person has ${dealCount} client deal(s). Reassign those clients to another rep or delete the deals first.`,
        );
      }

      const { data, error } = await supabase.from("reps").delete().eq("id", repId).select("id");
      if (error) {
        console.error("[deleteRep]", error);
        if (error.code === "42501" || /row-level security|RLS/i.test(error.message)) {
          throw new Error(
            "Delete blocked by database security. Run supabase-reps-delete-policy.sql in the Supabase SQL Editor.",
          );
        }
        if (/foreign key|violates|referenced/i.test(error.message)) {
          throw new Error("Can't delete: this rep is still linked to other records in the database.");
        }
        throw new Error(error.message || "Failed to delete rep");
      }
      if (!data?.length) {
        throw new Error(
          "Delete blocked or rep was already removed. If this persists, add the rep delete RLS policy in Supabase.",
        );
      }

      setRepsRaw((prev) => prev.filter((r) => r.id !== repId));
      setSelectedRepIdState((prev) => {
        if (prev !== repId) return prev;
        window.localStorage.setItem(STORAGE_KEY, "all");
        return "all";
      });
    },
    [myRepId, repsRaw, deals],
  );

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
      deleteRep,
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
      deleteRep,
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
