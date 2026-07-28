import { useEffect, useState } from "react";
import type { SeriesDetail } from "@/domain/entities/Series";
import { ListFormSheet } from "@/presentation/components/lists/ListFormSheet";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useAddToList, useUserLists } from "@/presentation/hooks/useLists";
import { plural } from "@/presentation/utils/plural";

type AddToListSheetProps = {
  open: boolean;
  onClose: () => void;
  tmdbId: number;
  detail?: SeriesDetail;
};

export function AddToListSheet({ open, onClose, tmdbId, detail }: AddToListSheetProps) {
  const { user } = useAuth();
  const { data: lists, isLoading } = useUserLists(user?.id ?? null);
  const addToList = useAddToList();
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setAddedTo(new Set());
    }
  }, [open]);

  async function handleAdd(listId: string) {
    if (addedTo.has(listId)) {
      return;
    }
    await addToList.mutateAsync({ listId, tmdbId, detail });
    setAddedTo((current) => new Set(current).add(listId));
  }

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Add to list">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="tap-none flex w-full items-center gap-3 rounded-xl border border-dashed border-ink-700 px-4 py-3 text-left active:bg-ink-800"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-accent-600/15 text-accent-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-[14px] font-semibold text-mist-100">New list</span>
        </button>

        <div className="mt-3">
          {isLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Spinner />
            </div>
          ) : (lists?.length ?? 0) === 0 ? (
            <p className="py-4 text-center text-[13px] text-mist-500">
              You have no lists yet. Create one above.
            </p>
          ) : (
            <ul className="flex flex-col">
              {(lists ?? []).map((list) => {
                const added = addedTo.has(list.id);
                return (
                  <li key={list.id}>
                    <button
                      type="button"
                      onClick={() => handleAdd(list.id)}
                      disabled={added || addToList.isPending}
                      className="tap-none flex w-full items-center gap-3 py-3 text-left active:opacity-70 disabled:opacity-100"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-mist-100">{list.title}</p>
                        <p className="text-[12px] text-mist-500">
                          {plural(list.itemCount + (added ? 1 : 0), "series", "series")}
                        </p>
                      </div>
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          added ? "border-accent-500 bg-accent-500 text-white" : "border-ink-600 text-mist-500"
                        }`}
                      >
                        {added ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3.5">
                            <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                          </svg>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Sheet>

      <ListFormSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => void handleAdd(id)}
      />
    </>
  );
}
