import { useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

function appBaseUrl() {
  return (
    (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") ||
    window.location.origin
  );
}

async function ensureRepExists() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return;
  await fetch("/api/signup-complete", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}

const Login = () => {
  const { passwordRecovery, clearPasswordRecovery } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await ensureRepExists();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const appBase = appBaseUrl();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() || email.split("@")[0] },
          emailRedirectTo: `${appBase}/`,
        },
      });
      if (error) throw error;
      if (data.session) {
        await ensureRepExists();
      }
      setSuccess(
        data.session
          ? "Account created! Taking you in…"
          : "Account created! Check your email to confirm, then sign in."
      );
      setMode("signin");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const appBase = appBaseUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appBase}/login`,
      });
      if (error) throw error;
      setSuccess(
        "If an account exists for that email, you will receive a reset link shortly."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      clearPasswordRecovery();
      setNewPassword("");
      setConfirmPassword("");
      await ensureRepExists();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit =
    passwordRecovery
      ? handleSetNewPassword
      : mode === "forgot"
        ? handleForgotPassword
        : mode === "signin"
          ? handleSignIn
          : handleSignUp;

  if (passwordRecovery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
              <Flame className="h-6 w-6 text-primary" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Set new password
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Choose a new password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
            <Flame className="h-6 w-6 text-primary" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Commission<span className="text-primary">HQ</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "forgot"
              ? "Reset your password"
              : mode === "signin"
                ? "Sign in to your account"
                : "Create your account"}
          </p>
        </div>

        {mode !== "forgot" && (
          <div className="flex gap-2 p-1 rounded-lg border border-border bg-muted/50">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === "signin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={loading}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setSuccess(null);
                    }}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                disabled={loading}
              />
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400" role="status">
              {success}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? mode === "forgot"
                ? "Sending…"
                : mode === "signin"
                  ? "Signing in…"
                  : "Creating account…"
              : mode === "forgot"
                ? "Send reset link"
                : mode === "signin"
                  ? "Sign in"
                  : "Sign up"}
          </Button>
          {mode === "forgot" && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={loading}
              onClick={() => {
                setMode("signin");
                setError(null);
                setSuccess(null);
              }}
            >
              Back to sign in
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
