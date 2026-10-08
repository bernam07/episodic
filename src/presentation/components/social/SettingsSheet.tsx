import { PushToggle } from "@/presentation/components/social/PushToggle";
import { Button } from "@/presentation/components/ui/Button";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { usePwaInstall } from "@/presentation/hooks/usePwaInstall";

type SettingsSheetProps = {
  open: boolean;
  onClose: () => void;
  onDeleteAccount: () => void;
};

export function SettingsSheet({ open, onClose, onDeleteAccount }: SettingsSheetProps) {
  const { signOut } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { canInstall, promptInstall } = usePwaInstall();

  return (
    <Sheet open={open} onClose={onClose} title={t("settings")}>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-mist-300">
            {t("language")}
          </label>
          <div className="flex rounded-xl border border-white/[0.06] bg-ink-900/60 p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`tap-none min-h-[38px] flex-1 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                language === "en"
                  ? "bg-gradient-to-r from-accent-600 to-indigo-600 text-white shadow-md shadow-accent-600/30"
                  : "text-mist-400 hover:text-mist-200"
              }`}
            >
              {t("english")}
            </button>
            <button
              type="button"
              onClick={() => setLanguage("pt")}
              className={`tap-none min-h-[38px] flex-1 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                language === "pt"
                  ? "bg-gradient-to-r from-accent-600 to-indigo-600 text-white shadow-md shadow-accent-600/30"
                  : "text-mist-400 hover:text-mist-200"
              }`}
            >
              {t("portuguese")}
            </button>
          </div>
        </div>

        {canInstall ? (
          <div>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => void promptInstall()}
            >
              {t("installApp")}
            </Button>
          </div>
        ) : null}

        <PushToggle />

        <div className="pt-2">
          <Button variant="secondary" fullWidth onClick={() => void signOut()}>
            {t("signOut")}
          </Button>
          <button
            type="button"
            onClick={onDeleteAccount}
            className="tap-none mt-3 min-h-[44px] w-full text-[13px] font-medium text-mist-500 active:text-danger-500"
          >
            {t("deleteAccount")}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
