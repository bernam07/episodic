import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toUserMessage } from "@/core/errors/AppError";
import { Button } from "@/presentation/components/ui/Button";
import { useAuth } from "@/presentation/hooks/useAuth";

const inputClass =
  "w-full rounded-[12px] border border-white/[0.08] bg-ink-850 px-4 py-3.5 text-[1.0625rem] text-white placeholder:text-mist-500 transition-colors focus:border-accent-500 focus:bg-ink-800 focus:outline-none";

export function ResetPasswordScreen() {
  const { user, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await updatePassword(password);
      navigate("/", { replace: true });
    } catch (caught) {
      setError(toUserMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-safe pb-safe pl-safe pr-safe flex min-h-dvh flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-9">
          <h1 className="text-[1.75rem] leading-[1.12] font-bold tracking-[-0.022em] text-white">Choose a new password</h1>
          <p className="mt-1.5 text-[0.9375rem] text-mist-400">
            {user
              ? "Pick something you have not used before."
              : "Open the reset link from your email to continue."}
          </p>
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={inputClass}
              required
            />

            {error ? (
              <p role="alert" className="px-1 text-[0.8125rem] text-danger-500">
                {error}
              </p>
            ) : null}

            <Button type="submit" fullWidth loading={submitting} className="mt-2">
              Update Password
            </Button>
          </form>
        ) : (
          <Button variant="secondary" fullWidth onClick={() => navigate("/auth", { replace: true })}>
            Back to sign in
          </Button>
        )}
      </div>
    </div>
  );
}
