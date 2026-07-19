import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { posterUrl } from "@/data/tmdb/images";
import type { ListSummary } from "@/domain/entities/List";
import { ListFormSheet } from "@/presentation/components/lists/ListFormSheet";
import { plural } from "@/presentation/utils/plural";
import { useUserLists } from "@/presentation/hooks/useLists";

function PosterStrip({ posters }: { posters: string[] }) {
  const slots = Array.from({ length: 4 }, (_, index) => posters[index] ?? null);

  return (
    <div className="flex h-20 gap-0.5 overflow-hidden rounded-card bg-ink-800">
      {slots.map((path, index) => {
        const url = posterUrl(path, "w154");
        return (
          <div key={index} className="h-full flex-1 bg-ink-800">
            {url ? <img src={url} alt="" loading="lazy" className="size-full object-cover" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function ListCard({ list }: { list: ListSummary }) {
  return (
    <Link to={`/list/${list.id}`} className="tap-none block active:opacity-70">
      <PosterStrip posters={list.posterPaths} />
      <div className="mt-2 flex items-center gap-1.5">
        {list.isPrivate ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5 shrink-0 text-mist-500">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
          </svg>
        ) : null}
        <p className="truncate text-[14px] font-semibold text-mist-100">{list.title}</p>
      </div>
      <p className="mt-0.5 text-[12px] text-mist-500">{plural(list.itemCount, "series", "series")}</p>
    </Link>
  );
}

export function ListsSection({ userId, isOwn }: { userId: string | null; isOwn: boolean }) {
  const { data } = useUserLists(userId);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const lists = data ?? [];

  if (!isOwn && lists.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 px-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
          Lists
          {lists.length > 0 ? <span className="ml-1.5 text-mist-600">{lists.length}</span> : null}
        </h2>
        {isOwn ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="tap-none text-[13px] font-semibold text-accent-400 active:text-accent-300"
          >
            New list
          </button>
        ) : null}
      </div>

      {lists.length === 0 ? (
        <p className="rounded-card border border-dashed border-ink-700 py-6 text-center text-[13px] text-mist-500">
          No lists yet. Group series into a collection.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}

      <ListFormSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => navigate(`/list/${id}`)}
      />
    </section>
  );
}
