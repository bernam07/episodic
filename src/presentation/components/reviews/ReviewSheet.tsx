import { useState } from "react";
import { toUserMessage } from "@/core/errors/AppError";
import type { Review } from "@/domain/entities/Review";
import { Button } from "@/presentation/components/ui/Button";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { useSubmitReview } from "@/presentation/hooks/useReviews";
import { useI18n } from "@/presentation/i18n/I18nProvider";

type ReviewSheetProps = {
  open: boolean;
  onClose: () => void;
  seriesId: string | null;
  seriesName: string;
  existing: Review | null;
};

const MAX_BODY = 2000;

function ReviewForm({
  onClose,
  seriesId,
  seriesName,
  existing,
}: {
  onClose: () => void;
  seriesId: string | null;
  seriesName: string;
  existing: Review | null;
}) {
  const { t } = useI18n();
  const [body, setBody] = useState(existing?.body ?? "");
  const [spoilers, setSpoilers] = useState(existing?.containsSpoilers ?? false);
  const [error, setError] = useState<string | null>(null);

  const submit = useSubmitReview(seriesId);

  async function handleSubmit() {
    setError(null);

    try {
      await submit.mutateAsync({ body, containsSpoilers: spoilers });
      onClose();
    } catch (caught) {
      setError(toUserMessage(caught));
    }
  }

  return (
    <>
      <p className="mb-5 truncate text-[13px] text-mist-400">{seriesName}</p>

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value.slice(0, MAX_BODY))}
        placeholder={t("reviewPlaceholder")}
        rows={5}
        className="w-full resize-none rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-[15px] text-mist-100 placeholder:text-mist-500 focus:border-accent-500 focus:outline-none"
      />

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSpoilers(!spoilers)}
          aria-pressed={spoilers}
          className="tap-none flex min-h-[44px] items-center gap-2 text-[13px] text-mist-400 active:text-mist-200"
        >
          <span
            className={`flex size-[18px] items-center justify-center rounded border-2 ${
              spoilers ? "border-accent-500 bg-accent-500 text-white" : "border-ink-600 text-transparent"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-2.5">
              <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {t("containsSpoilers")}
        </button>
        <span className="text-[11px] tabular-nums text-mist-500">
          {body.length}/{MAX_BODY}
        </span>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-danger-500">
          {error}
        </p>
      ) : null}

      <Button
        fullWidth
        className="mt-4"
        disabled={!body.trim()}
        loading={submit.isPending}
        onClick={handleSubmit}
      >
        {existing?.body ? t("updateReview") : t("postReview")}
      </Button>
    </>
  );
}

export function ReviewSheet({ open, onClose, seriesId, seriesName, existing }: ReviewSheetProps) {
  const { t } = useI18n();

  return (
    <Sheet open={open} onClose={onClose} title={existing?.body ? t("editReview") : t("writeReview")}>
      {open ? (
        <ReviewForm
          onClose={onClose}
          seriesId={seriesId}
          seriesName={seriesName}
          existing={existing}
        />
      ) : null}
    </Sheet>
  );
}
