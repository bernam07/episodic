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
import { useI18n } from "@/presentation/i18n/I18nProvider";

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
  const { t } = useI18n();
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
        <p className="text-[1.0625rem] font-semibold text-white">{t("listNotFound")}</p>
        <p className="mt-1 text-[0.875rem] text-mist-500">{t("listPrivateOrRemoved")}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="tap-none mt-5 inline-flex min-h-[44px] items-center rounded-full bg-ink-800 px-5 text-[0.875rem] font-semibold text-white active:bg-ink-700"
        >
          {t("close")}
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
      <header className="ios-material sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 pt-[calc(env(safe-area-inset-top)+0.625rem)] pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="tap-none flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-ink-850 text-white transition-colors hover:bg-ink-800 active:opacity-70"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="truncate text-[1.1875rem] font-extrabold tracking-[-0.025em] text-white">
            {list.title}
          </h1>
        </div>

        <span className="shrink-0 rounded-full border border-white/10 bg-ink-850 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-mist-400">
          {list.isPrivate ? t("privateBadge") : t("publicBadge")}
        </span>
      </header>

      <div className="px-5 pt-4 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={list.isOwn ? "/profile" : `/user/${list.ownerUsername}`}
            className="tap-none inline-flex items-center gap-2 active:opacity-70"
          >
            <Avatar username={list.ownerUsername} displayName={list.ownerDisplayName} avatarUrl={list.ownerAvatarUrl} size="sm" />
            <span className="text-[0.8125rem] font-semibold text-white">
              {list.ownerDisplayName || list.ownerUsername}
            </span>
            <span className="text-[0.75rem] text-mist-500">
              · {list.itemCount} {t("series").toLowerCase()}
            </span>
          </Link>

          {!list.isOwn ? (
            <button
              type="button"
              onClick={() => toggleSave.mutate()}
              disabled={toggleSave.isPending}
              aria-pressed={saveInfo?.saved ?? false}
              className={`tap-none inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3.5 text-[0.75rem] font-semibold transition-colors disabled:opacity-50 ${
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
                className="size-3.5"
              >
                <path d="M6 4h12v16l-6-4-6 4z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {saveInfo?.saved ? t("savedList") : t("saveList")}
              {saveInfo && saveInfo.saveCount > 0 ? <span className="opacity-70">· {saveInfo.saveCount}</span> : null}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing((value) => !value)}
                className={`tap-none min-h-[34px] rounded-full px-3.5 text-[0.75rem] font-semibold transition-colors ${
                  editing ? "bg-accent-500 text-white" : "border border-white/10 bg-ink-850 text-white hover:bg-ink-800 active:opacity-80"
                }`}
              >
                {editing ? t("done") : t("manageSeries")}
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="tap-none min-h-[34px] rounded-full border border-white/10 bg-ink-850 px-3.5 text-[0.75rem] font-semibold text-white transition-colors hover:bg-ink-800 active:opacity-80"
              >
                {t("editDetails")}
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                aria-label={t("delete")}
                className="tap-none flex size-[34px] shrink-0 items-center justify-center rounded-full border border-white/10 bg-ink-850 text-danger-500 transition-colors hover:bg-ink-800 active:opacity-80"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                  <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {list.description ? (
          <p className="mt-3 text-[0.875rem] whitespace-pre-wrap text-mist-300">{list.description}</p>
        ) : null}
      </div>

      <div className="px-5">
        {!items ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="pt-6 text-center text-[0.9375rem] text-mist-500">
            {list.isOwn ? t("emptyListOwner") : t("emptyListVisitor")}
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

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t("confirmDelete")}>
        <p className="pt-3 text-[0.9375rem] text-mist-300">
          {t("delete")} “{list.title}”?
        </p>
        <Button
          fullWidth
          variant="danger"
          className="mt-5"
          loading={deleteList.isPending}
          onClick={handleDelete}
        >
          {t("delete")}
        </Button>
        <Button
          fullWidth
          variant="secondary"
          className="mt-2.5"
          onClick={() => setDeleteOpen(false)}
        >
          {t("close")}
        </Button>
      </Sheet>
    </>
  );
}
