import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { toUserMessage } from "@/core/errors/AppError";
import { isValidUsername } from "@/domain/usecases/auth/AuthUseCases";
import { posterUrl } from "@/data/tmdb/images";
import { container } from "@/presentation/di/container";
import { Button } from "@/presentation/components/ui/Button";
import { FullScreenSpinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useTrending } from "@/presentation/hooks/useDiscovery";

type Mode = "signin" | "signup" | "forgot";

const inputClass =
  "w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3.5 text-mist-100 placeholder:text-mist-500 focus:border-accent-500 focus:outline-none";

const iconClass = "size-5";

const FEATURES: { label: string; icon: ReactNode }[] = [
  {
    label: "Track episodes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Rate & review",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <path
          d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Follow friends",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-5.3 6-5.3s6 2 6 5.3" strokeLinecap="round" />
        <path d="M16 5.3a3 3 0 0 1 0 5.6" strokeLinecap="round" />
        <path d="M17.3 14.4c1.9.7 3.2 2.3 3.2 5.1" strokeLinecap="round" />
      </svg>
    ),
  },
];

const WALL_TILE_COUNT = 30;

function PosterWall({ posterPaths }: { posterPaths: string[] }) {
  const tiles = useMemo(
    () =>
      posterPaths.length === 0
        ? []
        : Array.from({ length: WALL_TILE_COUNT }, (_, index) => posterPaths[index % posterPaths.length]),
    [posterPaths]
  );

  if (tiles.length === 0) {
    return <div className="size-full bg-gradient-to-br from-ink-900 via-ink-950 to-ink-900" />;
  }

  return (
    <div className="grid size-full grid-cols-4 gap-1 brightness-[0.45] sm:grid-cols-5 md:grid-cols-6">
      {tiles.map((path, index) => (
        <img
          key={index}
          src={posterUrl(path, "w342") ?? undefined}
          alt=""
          loading={index < 8 ? "eager" : "lazy"}
          decoding="async"
          className="aspect-2/3 size-full object-cover"
        />
      ))}
    </div>
  );
}

function FeatureRow() {
  return (
    <div className="mb-7 flex items-start justify-between gap-3 border-b border-ink-800 pb-6">
      {FEATURES.map((feature) => (
        <div key={feature.label} className="flex flex-1 flex-col items-center gap-2 text-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-ink-800 text-accent-400">
            {feature.icon}
          </span>
          <span className="text-[11px] font-medium leading-tight text-mist-400">{feature.label}</span>
        </div>
      ))}
    </div>
  );
}

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

const FORM_COPY: Record<Mode, { title: string; subtitle: string; cta: string }> = {
  signin: { title: "Sign in", subtitle: "Welcome back.", cta: "Sign In" },
  signup: { title: "Create your account", subtitle: "Start tracking in a minute.", cta: "Create Account" },
  forgot: { title: "Reset your password", subtitle: "We'll email you a reset link.", cta: "Send Reset Link" },
};

export function AuthScreen() {
  const { user, initialising, signIn, signUp, requestPasswordReset } = useAuth();
  const { data: trending } = useTrending();
  const [mode, setMode] = useState<Mode>("signin");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const usernameState = useUsernameCheck(username, mode === "signup");
  const posterPaths = useMemo(
    () => (trending?.results ?? []).map((series) => series.posterPath).filter((path): path is string => !!path),
    [trending]
  );

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
        setIdentifier(email);
        setPassword("");
        setMode("signin");
        setNotice("Account created. Check your email to confirm it, then sign in.");
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
  const copy = FORM_COPY[mode];

  return (
    <div className="relative flex min-h-dvh flex-col md:flex-row">
      <div className="relative h-[42vh] min-h-[260px] w-full shrink-0 overflow-hidden md:h-auto md:min-h-dvh md:w-1/2">
        <PosterWall posterPaths={posterPaths} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/15" />
        <div className="absolute inset-0 hidden md:block md:bg-gradient-to-r md:from-ink-950/20 md:via-transparent md:to-ink-950" />
        <div className="pt-safe absolute inset-x-0 bottom-0 px-6 pb-7 md:inset-0 md:flex md:flex-col md:justify-end md:px-14 md:pb-16">
          <p className="text-[12px] font-bold tracking-[0.2em] text-accent-400 uppercase drop-shadow-md">
            Episodic
          </p>
          <h1 className="mt-2 max-w-md text-[26px] leading-tight font-bold text-mist-100 drop-shadow-md md:max-w-lg md:text-[34px]">
            Track every episode. Rate what you finish.
          </h1>
          <p className="mt-2 max-w-sm text-[14px] text-mist-300 drop-shadow-md md:mt-3 md:text-[16px]">
            A Letterboxd for television. See progress across your whole watchlist, and follow what
            friends are watching.
          </p>
        </div>
      </div>

      <div className="pb-safe flex flex-1 flex-col justify-center px-6 pt-7 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <FeatureRow />

          <h2 className="text-[20px] font-bold text-mist-100">{copy.title}</h2>
          <p className="mt-1 mb-6 text-[13px] text-mist-400">{copy.subtitle}</p>

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
              {copy.cta}
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
    </div>
  );
}
