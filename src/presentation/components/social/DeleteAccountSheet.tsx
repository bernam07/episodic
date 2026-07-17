import { useState } from "react";
import { toUserMessage } from "@/core/errors/AppError";
import { Button } from "@/presentation/components/ui/Button";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { useAuth } from "@/presentation/hooks/useAuth";

type DeleteAccountSheetProps = {
  open: boolean;
  onClose: () => void;
  username: string;
};

export function DeleteAccountSheet({ open, onClose, username }: DeleteAccountSheetProps) {
  const { deleteAccount } = useAuth();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmed = confirmation.trim().toLowerCase() === username.toLowerCase();

  async function handleDelete() {
    setError(null);
    setDeleting(true);

    try {
      await deleteAccount();
    } catch (caught) {
      setError(toUserMessage(caught));
      setDeleting(false);
    }
  }

  function handleClose() {
    if (deleting) {
      return;
    }
    setConfirmation("");
    setError(null);
    onClose();
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Delete account">
      <p className="text-[14px] leading-relaxed text-mist-300">
        This permanently deletes your account, library, reviews and follows. It cannot be undone.
      </p>

      <label className="mt-4 block text-[13px] font-medium text-mist-400">
        Type <span className="font-semibold text-mist-200">{username}</span> to confirm
      </label>
      <input
        type="text"
        autoCapitalize="none"
        autoCorrect="off"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        className="mt-2 w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3.5 text-mist-100 placeholder:text-mist-500 focus:border-danger-500 focus:outline-none"
        placeholder={username}
      />

      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-danger-500">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!confirmed || deleting}
        onClick={handleDelete}
        className="tap-none mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-danger-500 px-5 text-[15px] font-semibold text-white transition-colors duration-150 active:bg-danger-500/80 disabled:bg-ink-700 disabled:text-mist-500"
      >
        {deleting ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        Delete my account
      </button>

      <Button variant="ghost" fullWidth className="mt-2" disabled={deleting} onClick={handleClose}>
        Cancel
      </Button>
    </Sheet>
  );
}
