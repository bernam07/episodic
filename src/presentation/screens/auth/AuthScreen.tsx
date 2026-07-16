import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { toUserMessage } from "@/core/errors/AppError";
import { isValidUsername } from "@/domain/usecases/auth/AuthUseCases";
import { container } from "@/presentation/di/container";
import { Button } from "@/presentation/components/ui/Button";
import { FullScreenSpinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";

type Mode = "signin" | "signup" | "forgot";

const inputClass =
  "w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3.5 text-mist-100 placeholder:text-mist-500 focus:border-accent-500 focus:outline-none";

type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid";

function useUsernameCheck(username: string, active: boolean): UsernameState {
  const [state, setState] = useState<UsernameState>("idle");

  useEffect(() => {
    const trimmed = username.trim();

    if (!active || trimmed.length === 0) {
      setState("idle");
      return;
    }

    if (!isValidUsername(trimmed)) {
      setState("invalid");
      return;
    }

    setState("checking");
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const available = await container.usecases.checkUsernameAvailable.execute(trimmed);
        if (!cancelled) {
          setState(available ? "available" : "taken");
        }
      } catch {
        if (!cancelled) {
          setState("idle");
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, active]);

  return state;
}

const USERNAME_HINTS: Record<UsernameState, { text: string; className: string } | null> = {
  idle: null,
  checking: { text: "Checking availability…", className: "text-mist-500" },
  available: { text: "Available", className: "text-accent-400" },
  taken: { text: "Already taken", className: "text-danger-500" },
  invalid: { text: "3-24 characters: letters, numbers or underscore", className: "text-mist-500" },
};

export function AuthScreen() {
  const { user, initialising, signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const usernameState = useUsernameCheck(username, mode === "signup");

  if (initialising) {
    return <FullScreenSpinner />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      if (mode === "signin") {
        await signIn(identifier, password);
      } else if (mode === "signup") {
        await signUp(email, password, username);
      } else {
        await requestPasswordReset(email);
        setNotice("If that email has an account, a reset link is on its way.");
      }
    } catch (caught) {
      setError(toUserMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  const hint = USERNAME_HINTS[usernameState];
  const signupBlocked = mode === "signup" && usernameState !== "available";

  return (
    <div className="pt-safe pb-safe pl-safe pr-safe flex min-h-dvh flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-9">
          <h1 className="text-[34px] font-bold tracking-tight text-mist-100">Episodic</h1>
          <p className="mt-1.5 text-[15px] text-mist-400">
            {mode === "forgot" ? "Reset your password." : "Track the series you watch."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signin" ? (
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Username or email"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className={inputClass}
              required
            />
          ) : (
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
          )}

          {mode === "signup" ? (
            <div>
              <input
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={inputClass}
                required
              />
              {hint ? <p className={`mt-1.5 px-1 text-[12px] ${hint.className}`}>{hint.text}</p> : null}
            </div>
          ) : null}

          {mode !== "forgot" ? (
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              required
            />
          ) : null}

          {error ? (
            <p role="alert" className="px-1 text-[13px] text-danger-500">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p role="status" className="px-1 text-[13px] text-accent-400">
              {notice}
            </p>
          ) : null}

          <Button type="submit" fullWidth loading={submitting} disabled={signupBlocked} className="mt-2">
            {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
          </Button>
        </form>

        {mode === "signin" ? (
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            className="tap-none mt-4 w-full py-2 text-center text-[13px] text-mist-500 active:text-mist-300"
          >
            Forgot your password?
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
          className="tap-none mt-3 w-full py-3 text-center text-[14px] text-mist-400 active:text-mist-200"
        >
          {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
