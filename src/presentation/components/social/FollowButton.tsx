import { useToggleFollow } from "@/presentation/hooks/useSocial";

type FollowButtonProps = {
  userId: string;
  isFollowing: boolean;
  size?: "sm" | "md";
};

export function FollowButton({ userId, isFollowing, size = "sm" }: FollowButtonProps) {
  const toggle = useToggleFollow();

  const height =
    size === "sm"
      ? "min-h-[34px] rounded-[9px] px-3.5 text-[0.8125rem]"
      : "min-h-[38px] rounded-[10px] px-4 text-[0.8125rem]";

  return (
    <button
      type="button"
      disabled={toggle.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle.mutate({ userId, follow: !isFollowing });
      }}
      className={`tap-none shrink-0 font-bold transition-all disabled:opacity-50 ${height} ${
        isFollowing
          ? "border border-white/15 bg-ink-800 text-white hover:bg-ink-700 active:opacity-80"
          : "bg-accent-500 text-white shadow-[0_2px_10px_rgba(239,51,64,0.3)] hover:bg-accent-400 active:opacity-85"
      }`}
    >
      {toggle.isPending ? "…" : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
