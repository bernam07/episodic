import { Link } from "react-router-dom";
import { Avatar } from "@/presentation/components/social/Avatar";
import { FollowButton } from "@/presentation/components/social/FollowButton";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useFollowers, useFollowing } from "@/presentation/hooks/useSocial";
import { pluralize } from "@/presentation/utils/plural";

type FollowListMode = "followers" | "following";

type FollowListSheetProps = {
  open: boolean;
  onClose: () => void;
  username: string | null;
  mode: FollowListMode;
};

const EMPTY_MESSAGE: Record<FollowListMode, string> = {
  followers: "No followers yet.",
  following: "Not following anyone yet.",
};

export function FollowListSheet({ open, onClose, username, mode }: FollowListSheetProps) {
  const { user } = useAuth();
  const followers = useFollowers(mode === "followers" && open ? username : null);
  const following = useFollowing(mode === "following" && open ? username : null);
  const { data, isLoading } = mode === "followers" ? followers : following;

  return (
    <Sheet open={open} onClose={onClose} title={mode === "followers" ? "Followers" : "Following"}>
      <div className="-mx-5 max-h-[60vh] overflow-y-auto px-5">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-mist-500">{EMPTY_MESSAGE[mode]}</p>
        ) : (
          <ul className="divide-y divide-ink-800">
            {data.map((profile) => (
              <li key={profile.id}>
                <Link
                  to={`/user/${profile.username}`}
                  onClick={onClose}
                  className="tap-none flex items-center gap-3 py-3 active:opacity-70"
                >
                  <Avatar
                    username={profile.username}
                    displayName={profile.displayName}
                    avatarUrl={profile.avatarUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-mist-100">
                      {profile.displayName || profile.username}
                    </p>
                    <p className="truncate text-[12px] text-mist-500">
                      @{profile.username} · {profile.followersCount}{" "}
                      {pluralize(profile.followersCount, "follower")}
                    </p>
                  </div>
                  {profile.id !== user?.id ? (
                    <FollowButton userId={profile.id} isFollowing={profile.isFollowing} />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
