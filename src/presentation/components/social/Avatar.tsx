import { initials } from "@/domain/entities/Social";

type AvatarProps = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  ring?: boolean;
};

const SIZES = {
  sm: "size-9 text-[11px]",
  md: "size-11 text-[13px]",
  lg: "size-20 text-[22px]",
};

export function Avatar({
  username,
  displayName = null,
  avatarUrl = null,
  size = "md",
  ring = false,
}: AvatarProps) {
  const ringStyle = ring
    ? "ring-2 ring-accent-500 ring-offset-2 ring-offset-ink-950"
    : "ring-1 ring-white/15";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${SIZES[size]} shrink-0 rounded-full object-cover ${ringStyle} shadow-sm`}
        loading="lazy"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-600/35 to-ink-800 font-bold text-mist-100 ${ringStyle} shadow-sm`}
    >
      {initials({ username, displayName })}
    </span>
  );
}
