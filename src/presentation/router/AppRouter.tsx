import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/presentation/layout/AppShell";
import { AuthScreen } from "@/presentation/screens/auth/AuthScreen";
import { SeriesDetailScreen } from "@/presentation/screens/details/SeriesDetailScreen";
import { HomeScreen } from "@/presentation/screens/home/HomeScreen";
import { LibraryScreen } from "@/presentation/screens/library/LibraryScreen";
import { ProfileScreen } from "@/presentation/screens/profile/ProfileScreen";
import { SearchScreen } from "@/presentation/screens/search/SearchScreen";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthScreen />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/library" element={<LibraryScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/series/:tmdbId" element={<SeriesDetailScreen />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
