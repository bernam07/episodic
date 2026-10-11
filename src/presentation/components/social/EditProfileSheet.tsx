import { useId, useRef, useState, type ChangeEvent } from "react";
import { toUserMessage } from "@/core/errors/AppError";
import { MAX_BIO_LENGTH } from "@/domain/usecases/auth/AuthUseCases";
import { Avatar } from "@/presentation/components/social/Avatar";
import { Button } from "@/presentation/components/ui/Button";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useAuth, useUpdateProfile, useUploadAvatar } from "@/presentation/hooks/useAuth";

type EditProfileSheetProps = {
  open: boolean;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-[15px] text-mist-100 placeholder:text-mist-500 focus:border-accent-500 focus:outline-none";

function EditProfileForm({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayNameId = useId();
  const bioId = useId();

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

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

  async function handleSubmit() {
    setError(null);

    try {
      await updateProfile.mutateAsync({ displayName, bio });
      onClose();
    } catch (caught) {
      setError(toUserMessage(caught));
    }
  }

  return (
    <>
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="tap-none relative"
          aria-label="Change profile photo"
        >
          <Avatar
            username={profile?.username ?? "?"}
            displayName={profile?.displayName}
            avatarUrl={profile?.avatarUrl}
            size="lg"
          />
          <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border-2 border-ink-900 bg-accent-600 text-white">
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
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <p className="mt-2 text-[13px] text-mist-500">@{profile?.username}</p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor={displayNameId} className="mb-1.5 block text-[12px] font-medium text-mist-400">
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
          <label htmlFor={bioId} className="mb-1.5 block text-[12px] font-medium text-mist-400">
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
          <p className="mt-1 text-right text-[11px] tabular-nums text-mist-500">
            {bio.length}/{MAX_BIO_LENGTH}
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-danger-500">
          {error}
        </p>
      ) : null}

      <Button fullWidth className="mt-5" loading={updateProfile.isPending} onClick={handleSubmit}>
        Save Changes
      </Button>
    </>
  );
}

export function EditProfileSheet({ open, onClose }: EditProfileSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Edit Profile">
      {open ? <EditProfileForm onClose={onClose} /> : null}
    </Sheet>
  );
}
