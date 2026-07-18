import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/presentation/layout/AppShell";
import { FullScreenSpinner } from "@/presentation/components/ui/Spinner";
import { ProtectedRoute } from "./ProtectedRoute";

const AuthScreen = lazy(() =>
  import("@/presentation/screens/auth/AuthScreen").then((m) => ({ default: m.AuthScreen }))
);
const ResetPasswordScreen = lazy(() =>
  import("@/presentation/screens/auth/ResetPasswordScreen").then((m) => ({ default: m.ResetPasswordScreen }))
);
const HomeScreen = lazy(() =>
  import("@/presentation/screens/home/HomeScreen").then((m) => ({ default: m.HomeScreen }))
);
const SearchScreen = lazy(() =>
  import("@/presentation/screens/search/SearchScreen").then((m) => ({ default: m.SearchScreen }))
);
const LibraryScreen = lazy(() =>
  import("@/presentation/screens/library/LibraryScreen").then((m) => ({ default: m.LibraryScreen }))
);
const FriendsScreen = lazy(() =>
  import("@/presentation/screens/friends/FriendsScreen").then((m) => ({ default: m.FriendsScreen }))
);
const ProfileScreen = lazy(() =>
  import("@/presentation/screens/profile/ProfileScreen").then((m) => ({ default: m.ProfileScreen }))
);
const UserProfileScreen = lazy(() =>
  import("@/presentation/screens/profile/UserProfileScreen").then((m) => ({ default: m.UserProfileScreen }))
);
const SeriesDetailScreen = lazy(() =>
  import("@/presentation/screens/details/SeriesDetailScreen").then((m) => ({ default: m.SeriesDetailScreen }))
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullScreenSpinner />}>
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
      </Suspense>
    </BrowserRouter>
  );
}
