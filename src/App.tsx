import { AppRouter } from "@/presentation/router/AppRouter";
import { AuthProvider } from "@/presentation/providers/AuthProvider";
import { QueryProvider } from "@/presentation/providers/QueryProvider";

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryProvider>
  );
}
