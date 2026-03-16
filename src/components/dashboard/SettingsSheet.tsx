import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDashboard } from "@/providers/DashboardProvider";
import { useAuth } from "@/providers/AuthProvider";
import RepAvatar from "@/components/dashboard/RepAvatar";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
  const { reps, selectedRepId, updateRepProfile, myRepId } = useDashboard();
  const { signOut, user } = useAuth();
  const [editingRepId, setEditingRepId] = useState<string>("");
  const rep = reps.find((r) => r.id === editingRepId);
  const myRep = reps.find((r) => r.id === myRepId);
  const isEditingSelf = editingRepId === myRepId || (myRepId === null && rep?.email === user?.email);
  const isManager = myRep?.role === "manager";
  const canChangeRole = isManager && editingRepId && editingRepId !== myRepId;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [role, setRole] = useState<"rep" | "manager">("rep");

  // When opening or when scope changes: if viewing a specific rep, edit that rep; otherwise default to first
  useEffect(() => {
    if (!open || reps.length === 0) return;
    const resolved =
      selectedRepId !== "all"
        ? selectedRepId
        : reps.find((r) => r.role === "manager")?.id ?? reps[0]?.id ?? "";
    setEditingRepId(resolved);
  }, [open, selectedRepId, reps]);

  useEffect(() => {
    if (rep) {
      setName(rep.name);
      setEmail(rep.email);
      setRole(rep.role);
      const isUrl =
        rep.avatar &&
        (rep.avatar.startsWith("http") || rep.avatar.startsWith("data:"));
      setAvatar(isUrl ? rep.avatar : "");
    }
  }, [rep, open]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editingRepId) return;
    setSaveError(null);
    setSaving(true);
    try {
      const updates: { name?: string; email?: string; avatar?: string; role?: "rep" | "manager" } = {
        name: name.trim(),
        email: email.trim(),
        avatar: avatar.trim(),
      };
      if (canChangeRole) updates.role = role;
      const emailChanged = isEditingSelf && email.trim() !== rep.email;
      await updateRepProfile(editingRepId, updates);
      if (emailChanged) {
        toast.info(
          "Check your new email for a confirmation link. You’ll need to verify it before you can log in with the new address.",
          { duration: 8000 },
        );
      }
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setSaveError(msg);
      toast.error(msg, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  if (!rep) return null;

  const hasChanges =
    name.trim() !== rep.name ||
    email.trim() !== rep.email ||
    avatar.trim() !== rep.avatar ||
    (canChangeRole && role !== rep.role);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col overflow-hidden w-full max-w-full sm:h-screen sm:max-h-screen sm:w-[min(95vw,1400px)] sm:max-w-[min(95vw,1400px)]">
        <SheetHeader>
          <SheetTitle>Profile settings</SheetTitle>
          <SheetDescription>
            {selectedRepId === "all"
              ? isManager
                ? "Select a team member to edit their profile. Choose someone else to promote them to manager."
                : "Select a team member to edit their profile."
              : "Editing profile for the currently selected view. Changes appear across the dashboard."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label>Team member</Label>
            <Select value={editingRepId} onValueChange={setEditingRepId}>
              <SelectTrigger>
                <SelectValue placeholder="Select who to edit" />
              </SelectTrigger>
              <SelectContent>
                {reps.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <div className="flex items-center gap-2">
                      <RepAvatar avatar={r.avatar} name={r.name} className="h-6 w-6 text-xs" />
                      {r.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col items-center gap-4">
            <RepAvatar
              avatar={avatar}
              name={name}
              className="h-20 w-20 rounded-full text-lg"
            />
            <div className="w-full space-y-2">
              <Label htmlFor="settings-avatar">Profile photo URL</Label>
              <Input
                id="settings-avatar"
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste an image URL, or leave blank to use initials.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-name">Name</Label>
            <Input
              id="settings-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            {canChangeRole ? (
              <>
                <Select value={role} onValueChange={(v) => setRole(v as "rep" | "manager")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rep">Rep</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Managers can see all team deals and edit any rep&apos;s profile.
                </p>
              </>
            ) : (
              <>
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm capitalize">
                  {rep.role}
                </div>
                {isEditingSelf && rep.role === "manager" && (
                  <p className="text-xs text-muted-foreground">
                    The system recognizes your login as a manager.
                  </p>
                )}
              </>
            )}
          </div>

          {saveError && (
            <p className="text-sm text-destructive" role="alert">
              {saveError}
            </p>
          )}
        </div>

        <SheetFooter className="mt-8 flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            className="order-last w-full text-muted-foreground sm:order-first sm:mr-auto sm:w-auto"
            onClick={() => {
              signOut();
              onOpenChange(false);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
