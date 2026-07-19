import { PushToggle } from "@/presentation/components/social/PushToggle";
import { Button } from "@/presentation/components/ui/Button";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { useAuth } from "@/presentation/hooks/useAuth";

type SettingsSheetProps = {
  open: boolean;
  onClose: () => void;
  onDeleteAccount: () => void;
};

export function SettingsSheet({ open, onClose, onDeleteAccount }: SettingsSheetProps) {
  const { signOut } = useAuth();

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <PushToggle />

      <div className="mt-5">
        <Button variant="secondary" fullWidth onClick={() => void signOut()}>
          Sign Out
        </Button>
        <button
          type="button"
          onClick={onDeleteAccount}
          className="tap-none mt-3 min-h-[44px] w-full text-[13px] font-medium text-mist-500 active:text-danger-500"
        >
          Delete account
        </button>
      </div>
    </Sheet>
  );
}
