import { initials } from "@/domain/entities/Social";

type AvatarProps = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: "size-9 text-[11px]",
  md: "size-11 text-[13px]",
  lg: "size-20 text-[22px]",
};

export function Avatar({ username, displayName = null, avatarUrl = null, size = "md" }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${SIZES[size]} shrink-0 rounded-full object-cover ring-1 ring-white/20 shadow-sm`}
        loading="lazy"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-600/30 to-ink-800 font-bold text-mist-100 ring-1 ring-white/15 shadow-sm`}
    >
      {initials({ username, displayName })}
    </span>
  );
}
