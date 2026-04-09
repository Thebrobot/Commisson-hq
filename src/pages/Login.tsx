import { useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

async function ensureRepExists() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return;
  await fetch("/api/signup-complete", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}

const Login = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const appBase =
        (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") ||
        window.location.origin;
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

  const handleSubmit = mode === "signin" ? handleSignIn : handleSignUp;

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
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
                ? "Sign in"
                : "Sign up"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
