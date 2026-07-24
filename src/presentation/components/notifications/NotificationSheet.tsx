import { useEffect } from "react";
import { Link } from "react-router-dom";
import { posterUrl } from "@/data/tmdb/images";
import type { AppNotification } from "@/domain/entities/Notification";
import { Avatar } from "@/presentation/components/social/Avatar";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useMarkNotificationsRead, useNotifications } from "@/presentation/hooks/useNotifications";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function NotificationItem({ notification }: { notification: AppNotification }) {
  const isEpisode = notification.type === "new_episode";
  const href =
    (notification.type === "review" || isEpisode) && notification.seriesTmdbId
      ? `/series/${notification.seriesTmdbId}`
      : notification.actorUsername
        ? `/user/${notification.actorUsername}`
        : "/";

  const poster = posterUrl(notification.seriesPosterPath, "w154");
  const episodeLabel =
    notification.seasonNumber && notification.episodeNumber
      ? ` · S${notification.seasonNumber} E${notification.episodeNumber}`
      : "";

  return (
    <Link
      to={href}
      className={`tap-none flex items-start gap-3 rounded-xl px-3 py-3 active:bg-ink-800 ${
        notification.read ? "" : "bg-ink-850"
      }`}
    >
      {isEpisode ? (
        <div className="h-12 w-8 shrink-0 overflow-hidden rounded-md bg-ink-800">
          {poster ? <img src={poster} alt="" loading="lazy" className="size-full object-cover" /> : null}
        </div>
      ) : (
        <Avatar
          username={notification.actorUsername ?? "?"}
          displayName={notification.actorDisplayName}
          avatarUrl={notification.actorAvatarUrl}
          size="sm"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-mist-200">
          {isEpisode ? (
            <>
              New episode of{" "}
              <span className="font-semibold">{notification.seriesName ?? "a series"}</span>
              {episodeLabel}
            </>
          ) : notification.type === "follow" ? (
            <>
              <span className="font-semibold">
                {notification.actorDisplayName || notification.actorUsername}
              </span>{" "}
              started following you
            </>
          ) : (
            <>
              <span className="font-semibold">
                {notification.actorDisplayName || notification.actorUsername}
              </span>{" "}
              reviewed {notification.seriesName ?? "a series"}
            </>
          )}
        </p>
        <p className="mt-0.5 text-[11px] text-mist-500">{timeAgo(notification.createdAt)}</p>
      </div>
    </Link>
  );
}

type NotificationSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function NotificationSheet({ open, onClose }: NotificationSheetProps) {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    if (open && notifications && notifications.some((n) => !n.read)) {
      markRead.mutate();
    }
  }, [open, notifications, markRead]);

  return (
    <Sheet open={open} onClose={onClose} title="Notifications">
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-mist-500">No notifications yet.</p>
      ) : (
        <div className="max-h-[60dvh] space-y-1 overflow-y-auto">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </Sheet>
  );
}
