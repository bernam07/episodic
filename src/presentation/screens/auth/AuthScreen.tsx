import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { toUserMessage } from "@/core/errors/AppError";
import { Button } from "@/presentation/components/ui/Button";
import { FullScreenSpinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";

type Mode = "signin" | "signup";

const inputClass =
  "w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3.5 text-mist-100 placeholder:text-mist-500 focus:border-accent-500 focus:outline-none";

export function AuthScreen() {
  const { user, initialising, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (initialising) {
    return <FullScreenSpinner />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, username || undefined);
      }
    } catch (caught) {
      setError(toUserMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-safe pb-safe pl-safe pr-safe flex min-h-dvh flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-10">
          <h1 className="text-[34px] font-bold tracking-tight text-mist-100">Episodic</h1>
          <p className="mt-1.5 text-[15px] text-mist-400">Track the series you watch.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            required
          />

          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            required
          />

          {mode === "signup" ? (
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="Username (optional)"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={inputClass}
            />
          ) : null}

          {error ? (
            <p role="alert" className="px-1 text-[13px] text-danger-500">
              {error}
            </p>
          ) : null}

          <Button type="submit" fullWidth loading={submitting} className="mt-2">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="tap-none mt-6 w-full py-3 text-center text-[14px] text-mist-400 active:text-mist-200"
        >
          {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
