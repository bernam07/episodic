import { useId, useState } from "react";
import { toUserMessage } from "@/core/errors/AppError";
import {
  MAX_LIST_DESCRIPTION,
  MAX_LIST_TITLE,
  type ListDetail,
  type ListInput,
} from "@/domain/entities/List";
import { Button } from "@/presentation/components/ui/Button";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { useCreateList, useUpdateList } from "@/presentation/hooks/useLists";

const inputClass =
  "w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-[15px] text-mist-100 placeholder:text-mist-500 focus:border-accent-500 focus:outline-none";

type ListFormSheetProps = {
  open: boolean;
  onClose: () => void;
  existing?: ListDetail | null;
  onCreated?: (listId: string) => void;
};

function ListFormContent({
  onClose,
  existing,
  onCreated,
}: {
  onClose: () => void;
  existing?: ListDetail | null;
  onCreated?: (listId: string) => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [isPrivate, setIsPrivate] = useState(existing?.isPrivate ?? false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const createList = useCreateList();
  const updateList = useUpdateList(existing?.id ?? "");
  const pending = createList.isPending || updateList.isPending;

  async function handleSubmit() {
    setError(null);
    const input: ListInput = { title, description: description || null, isPrivate };

    try {
      if (existing) {
        await updateList.mutateAsync(input);
      } else {
        const id = await createList.mutateAsync(input);
        onCreated?.(id);
      }
      onClose();
    } catch (caught) {
      setError(toUserMessage(caught));
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor={titleId} className="mb-1.5 block text-[12px] font-medium text-mist-400">
            Title
          </label>
          <input
            id={titleId}
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, MAX_LIST_TITLE))}
            placeholder="e.g. Best sci-fi"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={descriptionId} className="mb-1.5 block text-[12px] font-medium text-mist-400">
            Description
          </label>
          <textarea
            id={descriptionId}
            value={description}
            onChange={(event) => setDescription(event.target.value.slice(0, MAX_LIST_DESCRIPTION))}
            placeholder="What ties these together?"
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <p className="mt-1 text-right text-[11px] tabular-nums text-mist-500">
            {description.length}/{MAX_LIST_DESCRIPTION}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isPrivate}
          aria-label="Private list"
          onClick={() => setIsPrivate((value) => !value)}
          className="tap-none flex items-center justify-between rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-left active:bg-ink-800"
        >
          <span>
            <span className="block text-[14px] font-semibold text-mist-100">Private list</span>
            <span className="block text-[12px] text-mist-500">Only you can see it</span>
          </span>
          <span
            className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
              isPrivate ? "bg-accent-600" : "bg-ink-700"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
                isPrivate ? "translate-x-[18px]" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-danger-500">
          {error}
        </p>
      ) : null}

      <Button fullWidth className="mt-5" loading={pending} onClick={handleSubmit}>
        {existing ? "Save Changes" : "Create List"}
      </Button>
    </>
  );
}

export function ListFormSheet({ open, onClose, existing, onCreated }: ListFormSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={existing ? "Edit List" : "New List"}>
      {open ? (
        <ListFormContent
          onClose={onClose}
          existing={existing}
          onCreated={onCreated}
        />
      ) : null}
    </Sheet>
  );
}
