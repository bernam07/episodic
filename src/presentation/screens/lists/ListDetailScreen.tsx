import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ListItem } from "@/domain/entities/List";
import { ListFormSheet } from "@/presentation/components/lists/ListFormSheet";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { Avatar } from "@/presentation/components/social/Avatar";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { Button } from "@/presentation/components/ui/Button";
import { FullScreenSpinner, Spinner } from "@/presentation/components/ui/Spinner";
import {
  useDeleteList,
  useList,
  useListItems,
  useListSaveInfo,
  useRemoveFromList,
  useToggleListSave,
} from "@/presentation/hooks/useLists";
import { plural } from "@/presentation/utils/plural";

function ItemCard({
  item,
  listId,
  editing,
}: {
  item: ListItem;
  listId: string;
  editing: boolean;
}) {
  const remove = useRemoveFromList(listId);

  return (
    <div className="relative">
      <Link to={`/series/${item.tmdbId}`} className="tap-none block active:opacity-75">
        <SeriesPoster path={item.posterPath} alt={item.seriesName} />
        <p className="mt-2 truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-white">{item.seriesName}</p>
      </Link>
      {editing ? (
        <button
          type="button"
          onClick={() => remove.mutate(item.seriesId)}
          disabled={remove.isPending}
          aria-label={`Remove ${item.seriesName}`}
          className="tap-none absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border-2 border-ink-950 bg-danger-500 text-white active:opacity-80 disabled:opacity-50"
        >
          {remove.isPending ? (
            <span className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          )}
        </button>
      ) : null}
    </div>
  );
}

export function ListDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: list, isLoading } = useList(id ?? null);
  const { data: items } = useListItems(id ?? null);
  const { data: saveInfo } = useListSaveInfo(id ?? null);
  const toggleSave = useToggleListSave(id ?? "");
  const deleteList = useDeleteList();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return <FullScreenSpinner />;
  }

  if (!list) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+3rem)] text-center">
        <p className="text-[1.0625rem] font-semibold text-white">List not found</p>
        <p className="mt-1 text-[0.875rem] text-mist-500">It may be private or no longer exist.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="tap-none mt-5 inline-flex min-h-[44px] items-center rounded-[12px] bg-ink-800 px-5 text-[1.0625rem] font-semibold text-white active:bg-ink-700"
        >
          Go back
        </button>
      </div>
    );
  }

  async function handleDelete() {
    await deleteList.mutateAsync(list!.id);
    navigate("/profile", { replace: true });
  }

  return (
    <>
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="tap-none -ml-2 flex size-9 items-center justify-center rounded-full border border-white/10 bg-ink-850 text-white transition-colors hover:bg-ink-800 active:opacity-70"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <header className="px-5 pt-3 pb-4">
        <div className="flex items-center gap-1.5">
          {list.isPrivate ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 shrink-0 text-mist-500">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
            </svg>
          ) : null}
          <h1 className="text-[1.5rem] leading-[1.15] font-bold tracking-[-0.022em] text-white">{list.title}</h1>
        </div>

        <Link
          to={list.isOwn ? "/profile" : `/user/${list.ownerUsername}`}
          className="tap-none mt-3 inline-flex items-center gap-2 active:opacity-70"
        >
          <Avatar username={list.ownerUsername} displayName={list.ownerDisplayName} avatarUrl={list.ownerAvatarUrl} size="sm" />
          <span className="text-[0.8125rem] text-mist-400">
            {list.isOwn ? "You" : list.ownerDisplayName || list.ownerUsername}
          </span>
        </Link>

        {list.description ? (
          <p className="mt-3 text-[0.9375rem] whitespace-pre-wrap text-mist-300">{list.description}</p>
        ) : null}

        <p className="mt-3 text-[0.75rem] text-mist-500">
          {plural(list.itemCount, "series", "series")}
          {saveInfo && saveInfo.saveCount > 0
            ? ` · Saved by ${plural(saveInfo.saveCount, "person", "people")}`
            : ""}
        </p>

        {!list.isOwn ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => toggleSave.mutate()}
              disabled={toggleSave.isPending}
              aria-pressed={saveInfo?.saved ?? false}
              className={`tap-none inline-flex min-h-[38px] items-center gap-1.5 rounded-[10px] px-4 text-[0.8125rem] font-semibold transition-colors disabled:opacity-50 ${
                saveInfo?.saved
                  ? "border border-white/10 bg-ink-850 text-white active:bg-ink-800"
                  : "bg-accent-500 text-white active:opacity-80"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill={saveInfo?.saved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                className="size-4"
              >
                <path d="M6 4h12v16l-6-4-6 4z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {saveInfo?.saved ? "Saved" : "Save list"}
            </button>
          </div>
        ) : null}

        {list.isOwn ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              className={`tap-none min-h-[38px] flex-1 rounded-[10px] text-[0.8125rem] font-semibold transition-colors ${
                editing ? "bg-accent-500 text-white" : "border border-white/10 bg-ink-850 text-white hover:bg-ink-800 active:opacity-80"
              }`}
            >
              {editing ? "Done" : "Manage series"}
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="tap-none min-h-[38px] flex-1 rounded-[10px] border border-white/10 bg-ink-850 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-ink-800 active:opacity-80"
            >
              Edit details
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete list"
              className="tap-none flex size-[38px] shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-ink-850 text-danger-500 transition-colors hover:bg-ink-800 active:opacity-80"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]">
                <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : null}
      </header>

      <div className="px-5">
        {!items ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="pt-6 text-center text-[0.9375rem] text-mist-500">
            {list.isOwn ? "Add series from any series page." : "This list is empty."}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {items.map((item) => (
              <ItemCard key={item.seriesId} item={item} listId={list.id} editing={editing} />
            ))}
          </div>
        )}
      </div>

      <ListFormSheet open={editOpen} onClose={() => setEditOpen(false)} existing={list} />

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete list">
        <p className="pt-3 text-[0.9375rem] text-mist-300">
          Delete “{list.title}”? This can’t be undone. The series stay in your library.
        </p>
        <Button
          fullWidth
          variant="danger"
          className="mt-5"
          loading={deleteList.isPending}
          onClick={handleDelete}
        >
          Delete list
        </Button>
        <Button
          fullWidth
          variant="secondary"
          className="mt-2.5"
          onClick={() => setDeleteOpen(false)}
        >
          Cancel
        </Button>
      </Sheet>
    </>
  );
}
