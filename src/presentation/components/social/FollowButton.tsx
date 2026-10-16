import { useToggleFollow } from "@/presentation/hooks/useSocial";

type FollowButtonProps = {
  userId: string;
  isFollowing: boolean;
  size?: "sm" | "md";
};

export function FollowButton({ userId, isFollowing, size = "sm" }: FollowButtonProps) {
  const toggle = useToggleFollow();

  const height = size === "sm" ? "min-h-[34px] px-4 text-[0.8125rem]" : "min-h-[40px] px-5 text-[0.9375rem]";

  return (
    <button
      type="button"
      disabled={toggle.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle.mutate({ userId, follow: !isFollowing });
      }}
      className={`tap-none shrink-0 rounded-full font-semibold transition-colors disabled:opacity-50 ${height} ${
        isFollowing
          ? "bg-ink-700 text-white active:bg-ink-600"
          : "bg-accent-500 text-white active:opacity-80"
      }`}
    >
      {toggle.isPending ? "…" : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
