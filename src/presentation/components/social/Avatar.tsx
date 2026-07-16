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
        className={`${SIZES[size]} shrink-0 rounded-full object-cover`}
        loading="lazy"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full bg-ink-700 font-semibold text-mist-300`}
    >
      {initials({ username, displayName })}
    </span>
  );
}
