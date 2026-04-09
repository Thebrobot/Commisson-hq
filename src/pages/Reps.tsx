import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Handshake, Plus, Shield, ShieldCheck, Users } from "lucide-react";
import { currency } from "@/lib/commission";
import { useDashboard } from "@/providers/DashboardProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Rep } from "@/types/commission";

interface EditRepState {
  repId: string;
  name: string;
  email: string;
  avatar: string;
  role: "rep" | "manager" | "partner";
}

interface AddRepState {
  name: string;
  email: string;
  role: "rep" | "manager" | "partner";
}

export default function Reps() {
  const reduceMotion = useReducedMotion();
  const { reps, team, updateRepProfile, addRep, isPortalManager } = useDashboard();
  const [editState, setEditState] = useState<EditRepState | null>(null);
  const [addState, setAddState] = useState<AddRepState | null>(null);
  const [saving, setSaving] = useState(false);

  const repStats = team.reps.reduce(
    (acc, r) => {
      acc[r.rep.id] = {
        mrr: r.totalMrr,
        clients: r.payingClientCount,
        thisMonthCommission: r.thisMonthCommission,
        closedThisMonth: r.closedThisMonthCount,
        tier: r.tier.label,
        cancelledCount: r.cancelledCount,
      };
      return acc;
    },
    {} as Record<
      string,
      {
        mrr: number;
        clients: number;
        thisMonthCommission: number;
        closedThisMonth: number;
        tier: string;
        cancelledCount: number;
      }
    >,
  );

  const openEdit = (rep: Rep) => {
    setEditState({
      repId: rep.id,
      name: rep.name,
      email: rep.email,
      avatar: rep.avatar ?? "",
      role: rep.role ?? "rep",
    });
  };

  const handleSaveEdit = async () => {
    if (!editState) return;
    setSaving(true);
    try {
      await updateRepProfile(editState.repId, {
        name: editState.name,
        email: editState.email,
        avatar: editState.avatar,
        role: editState.role,
      });
      toast.success("Rep profile updated");
      setEditState(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update rep");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRep = async () => {
    if (!addState || !addState.name.trim() || !addState.email.trim()) return;
    setSaving(true);
    try {
      const { rep, inviteSent, inviteNote } = await addRep({
        name: addState.name.trim(),
        email: addState.email.trim().toLowerCase(),
        role: addState.role,
      });
      if (!rep) {
        toast.error(inviteNote ?? "Could not add rep");
        return;
      }
      const roleLabel =
        addState.role === "partner" ? "sales partner" : addState.role === "manager" ? "manager" : "rep";
      if (inviteSent) {
        toast.success(`${addState.name} added as ${roleLabel}. An invite email was sent to ${addState.email}.`);
      } else if (inviteNote) {
        toast.message(`${addState.name} added as ${roleLabel}`, {
          description: inviteNote,
        });
      } else {
        toast.success(`${addState.name} added as ${roleLabel}.`);
      }
      setAddState(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add rep");
    } finally {
      setSaving(false);
    }
  };

  if (!isPortalManager) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Manager access required</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Only managers can add or edit team members and roles.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
            <Users className="h-5 w-5 text-primary" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl leading-none">
              <span className="dashboard-title-primary">YOUR </span>
              <span className="dashboard-title-accent">TEAM</span>
            </h1>
            <div className="mt-2 h-0.5 w-10 rounded-full bg-primary" />
          </div>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setAddState({ name: "", email: "", role: "rep" })}
        >
          <Plus className="h-4 w-4" />
          Add Rep
        </Button>
      </div>

      {/* Rep Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {reps.map((rep) => {
          const stats = repStats[rep.id];
          const isManager = rep.role === "manager";
          const isPartner = rep.role === "partner";
          return (
            <motion.div
              key={rep.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              {/* Avatar + name + role */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/20 text-primary font-bold text-lg flex items-center justify-center overflow-hidden">
                  {rep.avatar && (rep.avatar.startsWith("http") || rep.avatar.startsWith("data:")) ? (
                    <img src={rep.avatar} alt={rep.name} className="h-full w-full object-cover" />
                  ) : (
                    (rep.name.charAt(0) || "?").toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{rep.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{rep.email}</p>
                </div>
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${
                    isManager
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : isPartner
                        ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  {isManager ? (
                    <ShieldCheck className="h-3 w-3" />
                  ) : isPartner ? (
                    <Handshake className="h-3 w-3" />
                  ) : (
                    <Shield className="h-3 w-3" />
                  )}
                  {isManager ? "Manager" : isPartner ? "Sales partner" : "Rep"}
                </span>
              </div>

              {/* Stats grid */}
              {stats ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">MRR</p>
                    <p className="font-mono-tabular text-sm font-bold text-foreground mt-0.5">{currency.format(stats.mrr)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {isPartner ? "Closed (mo)" : "This Month"}
                    </p>
                    <p className="font-mono-tabular text-sm font-bold text-primary mt-0.5">
                      {isPartner ? stats.closedThisMonth : currency.format(stats.thisMonthCommission)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active Clients</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{stats.clients}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {isPartner ? "Book" : "Tier"}
                    </p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {isPartner ? "MRR only" : stats.tier}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  No deal data yet.
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-auto"
                onClick={() => openEdit(rep)}
              >
                Edit Profile
              </Button>
            </motion.div>
          );
        })}
      </div>

      {reps.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No reps yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first rep to get started.</p>
          <Button className="mt-4 gap-2" onClick={() => setAddState({ name: "", email: "", role: "rep" })}>
            <Plus className="h-4 w-4" />
            Add Rep
          </Button>
        </div>
      )}

      {/* Edit Rep Dialog */}
      <Dialog open={editState !== null} onOpenChange={(open) => !open && setEditState(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rep Profile</DialogTitle>
          </DialogHeader>
          {editState && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editState.name}
                  onChange={(e) => setEditState((s) => s && ({ ...s, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editState.email}
                  onChange={(e) => setEditState((s) => s && ({ ...s, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-avatar">Avatar URL (optional)</Label>
                <Input
                  id="edit-avatar"
                  value={editState.avatar}
                  onChange={(e) => setEditState((s) => s && ({ ...s, avatar: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editState.role}
                  onValueChange={(v) => setEditState((s) => s && ({ ...s, role: v as "rep" | "manager" | "partner" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rep">Rep</SelectItem>
                    <SelectItem value="partner">Sales partner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditState(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rep Dialog */}
      <Dialog open={addState !== null} onOpenChange={(open) => !open && setAddState(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Rep</DialogTitle>
          </DialogHeader>
          {addState && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Creates their profile and sends an email invite so they can set a password. If they already have an
                account, they&apos;ll see a note to sign in instead.
              </p>
              <div className="space-y-2">
                <Label htmlFor="add-name">Name</Label>
                <Input
                  id="add-name"
                  value={addState.name}
                  onChange={(e) => setAddState((s) => s && ({ ...s, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={addState.email}
                  onChange={(e) => setAddState((s) => s && ({ ...s, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={addState.role}
                  onValueChange={(v) => setAddState((s) => s && ({ ...s, role: v as "rep" | "manager" | "partner" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rep">Rep</SelectItem>
                    <SelectItem value="partner">Sales partner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddState(null)}>Cancel</Button>
            <Button
              onClick={handleAddRep}
              disabled={saving || !addState?.name.trim() || !addState?.email.trim()}
            >
              {saving ? "Adding..." : "Add Rep"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
