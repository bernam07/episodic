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
      <div className="space-y-4 pt-2">
        <div>
          <label className="mb-2 block text-[0.8125rem] font-medium text-mist-400">
            {t("language")}
          </label>
          <div className="flex rounded-[9px] bg-ink-850 p-[2px]">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`tap-none min-h-[34px] flex-1 rounded-[7px] text-[0.8125rem] font-semibold transition-all duration-150 ${
                language === "en"
                  ? "bg-ink-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                  : "text-mist-400 hover:text-mist-200"
              }`}
            >
              {t("english")}
            </button>
            <button
              type="button"
              onClick={() => setLanguage("pt")}
              className={`tap-none min-h-[34px] flex-1 rounded-[7px] text-[0.8125rem] font-semibold transition-all duration-150 ${
                language === "pt"
                  ? "bg-ink-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
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
            className="tap-none mt-3 min-h-[44px] w-full text-[0.9375rem] font-normal text-danger-500 active:opacity-70"
          >
            {t("deleteAccount")}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
