import { AppRouter } from "@/presentation/router/AppRouter";
import { I18nProvider } from "@/presentation/i18n/I18nProvider";
import { AuthProvider } from "@/presentation/providers/AuthProvider";
import { QueryProvider } from "@/presentation/providers/QueryProvider";
import { ToastProvider } from "@/presentation/providers/ToastProvider";

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <I18nProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
