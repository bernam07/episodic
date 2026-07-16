import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/presentation/layout/AppShell";
import { AuthScreen } from "@/presentation/screens/auth/AuthScreen";
import { ResetPasswordScreen } from "@/presentation/screens/auth/ResetPasswordScreen";
import { SeriesDetailScreen } from "@/presentation/screens/details/SeriesDetailScreen";
import { FriendsScreen } from "@/presentation/screens/friends/FriendsScreen";
import { HomeScreen } from "@/presentation/screens/home/HomeScreen";
import { LibraryScreen } from "@/presentation/screens/library/LibraryScreen";
import { ProfileScreen } from "@/presentation/screens/profile/ProfileScreen";
import { UserProfileScreen } from "@/presentation/screens/profile/UserProfileScreen";
import { SearchScreen } from "@/presentation/screens/search/SearchScreen";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/library" element={<LibraryScreen />} />
            <Route path="/friends" element={<FriendsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/user/:username" element={<UserProfileScreen />} />
            <Route path="/series/:tmdbId" element={<SeriesDetailScreen />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
