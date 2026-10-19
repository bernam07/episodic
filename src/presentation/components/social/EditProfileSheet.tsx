import { useId, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toUserMessage } from "@/core/errors/AppError";
import { backdropUrl } from "@/data/tmdb/images";
import { MAX_BIO_LENGTH } from "@/domain/usecases/auth/AuthUseCases";
import { Avatar } from "@/presentation/components/social/Avatar";
import { Button } from "@/presentation/components/ui/Button";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { Spinner } from "@/presentation/components/ui/Spinner";
import {
  useAuth,
  useUpdateProfile,
  useUploadAvatar,
  useUploadBanner,
} from "@/presentation/hooks/useAuth";
import { useLibrary } from "@/presentation/hooks/useTracking";

type EditProfileSheetProps = {
  open: boolean;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-[12px] border border-white/[0.08] bg-ink-850 px-4 py-3 text-[0.9375rem] text-white placeholder:text-mist-500 transition-colors focus:border-accent-500 focus:bg-ink-800 focus:outline-none";

function EditProfileForm({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const { data: library } = useLibrary();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [bannerUrl, setBannerUrl] = useState<string | null>(profile?.bannerUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const displayNameId = useId();
  const bioId = useId();

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const uploadBanner = useUploadBanner();

  const backdropOptions = useMemo(() => {
    if (!library) return [];
    const seen = new Set<string>();
    const options: { id: string; name: string; fullUrl: string; thumbUrl: string }[] = [];
    for (const item of library) {
      if (!item.backdropPath || seen.has(item.backdropPath)) continue;
      const fullUrl = backdropUrl(item.backdropPath, "w1280");
      const thumbUrl = backdropUrl(item.backdropPath, "w300");
      if (fullUrl && thumbUrl) {
        seen.add(item.backdropPath);
        options.push({ id: item.seriesId, name: item.name, fullUrl, thumbUrl });
      }
      if (options.length >= 12) break;
    }
    return options;
  }, [library]);

  const fallbackBanner = backdropOptions[0]?.fullUrl ?? null;
  const activeBannerPreview = bannerUrl || fallbackBanner;

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);

    try {
      await uploadAvatar.mutateAsync(file);
    } catch (caught) {
      setError(toUserMessage(caught));
    }
  }

  async function handleBannerFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);

    try {
      const uploadedUrl = await uploadBanner.mutateAsync(file);
      setBannerUrl(uploadedUrl);
    } catch (caught) {
      setError(toUserMessage(caught));
    }
  }

  async function handleSubmit() {
    setError(null);

    try {
      await updateProfile.mutateAsync({ displayName, bio, bannerUrl });
      onClose();
    } catch (caught) {
      setError(toUserMessage(caught));
    }
  }

  return (
    <div className="pt-3">
      <div className="relative">
        <div className="relative h-28 w-full overflow-hidden rounded-[14px] border border-white/10 bg-gradient-to-br from-accent-600/25 via-ink-900 to-ink-950">
          {activeBannerPreview ? (
            <img src={activeBannerPreview} alt="" className="size-full object-cover opacity-75" />
          ) : null}
          <div className="hero-scrim absolute inset-0" />
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {bannerUrl ? (
              <button
                type="button"
                onClick={() => setBannerUrl(null)}
                className="ios-material tap-none rounded-full border border-white/15 px-2.5 py-1 text-[0.6875rem] font-semibold text-mist-200 transition-colors hover:text-white active:opacity-75"
              >
                Reset
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadBanner.isPending}
              className="ios-material tap-none inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[0.75rem] font-semibold text-white transition-colors hover:bg-ink-800 active:opacity-75"
            >
              {uploadBanner.isPending ? (
                <Spinner className="size-3.5 border-white/40 border-t-white" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                  <path
                    d="M4 8.5a2 2 0 0 1 2-2h1.2l.9-1.5h5.8l.9 1.5H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12.5" r="3" />
                </svg>
              )}
              <span>Upload cover</span>
            </button>
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleBannerFileChange}
          />
        </div>

        <div className="-mt-9 flex items-end justify-between px-3.5">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="tap-none relative"
            aria-label="Change profile photo"
          >
            <Avatar
              username={profile?.username ?? "?"}
              displayName={profile?.displayName}
              avatarUrl={profile?.avatarUrl}
              size="lg"
              ring
            />
            <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border-2 border-ink-950 bg-accent-500 text-white">
              {uploadAvatar.isPending ? (
                <Spinner className="size-3.5 border-white/40 border-t-white" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                  <path
                    d="M4 8.5a2 2 0 0 1 2-2h1.2l.9-1.5h5.8l.9 1.5H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12.5" r="3" />
                </svg>
              )}
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <p className="pb-1 text-[0.8125rem] font-medium text-mist-400">@{profile?.username}</p>
        </div>
      </div>

      {backdropOptions.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-[0.75rem] font-semibold text-mist-400">Or pick a cover from your series</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {backdropOptions.map((option) => {
              const selected = bannerUrl === option.fullUrl;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setBannerUrl(option.fullUrl)}
                  title={option.name}
                  className={`tap-none relative h-12 w-21 shrink-0 overflow-hidden rounded-[8px] border transition-all ${
                    selected ? "border-accent-500 ring-2 ring-accent-500/40" : "border-white/10 opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={option.thumbUrl} alt={option.name} className="size-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor={displayNameId} className="mb-1.5 block text-[0.75rem] font-semibold text-mist-400">
            Display name
          </label>
          <input
            id={displayNameId}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value.slice(0, 40))}
            placeholder="Your name"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={bioId} className="mb-1.5 block text-[0.75rem] font-semibold text-mist-400">
            Bio
          </label>
          <textarea
            id={bioId}
            value={bio}
            onChange={(event) => setBio(event.target.value.slice(0, MAX_BIO_LENGTH))}
            placeholder="Tell people what you're watching"
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <p className="mt-1 text-right text-[0.6875rem] tabular-nums text-mist-500">
            {bio.length}/{MAX_BIO_LENGTH}
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[0.8125rem] text-danger-500">
          {error}
        </p>
      ) : null}

      <Button fullWidth className="mt-5" loading={updateProfile.isPending} onClick={handleSubmit}>
        Save Changes
      </Button>
    </div>
  );
}

export function EditProfileSheet({ open, onClose }: EditProfileSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Edit Profile">
      {open ? <EditProfileForm onClose={onClose} /> : null}
    </Sheet>
  );
}
