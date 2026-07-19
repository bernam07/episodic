import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, Profile } from "@/domain/entities/Profile";
import { container } from "@/presentation/di/container";

type AuthContextValue = {
  user: AuthUser | null;
  profile: Profile | null;
  initialising: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    let active = true;

    container.repositories.auth
      .getCurrentUser()
      .then((current) => {
        if (active) {
          setUser(current);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setInitialising(false);
        }
      });

    const unsubscribe = container.repositories.auth.onAuthChange((next) => {
      setUser(next);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!user) {
      setProfile(null);
      return;
    }

    container.repositories.auth
      .getProfile(user.id)
      .then((next) => {
        if (active) {
          setProfile(next);
        }
      })
      .catch(() => {
        if (active) {
          setProfile(null);
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const next = await container.usecases.signIn.execute({ identifier, password });
    setUser(next);
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    await container.usecases.signUp.execute({ email, password, username });
  }, []);

  const signOut = useCallback(async () => {
    await container.usecases.signOut.execute();
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await container.usecases.requestPasswordReset.execute(email);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    await container.usecases.updatePassword.execute(password);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      return;
    }

    const next = await container.repositories.auth.getProfile(user.id);
    setProfile(next);
  }, [user]);

  const completeOnboarding = useCallback(async () => {
    if (!user) {
      return;
    }

    await container.repositories.auth.completeOnboarding(user.id);
    setProfile((current) => (current ? { ...current, onboarded: true } : current));
  }, [user]);

  const deleteAccount = useCallback(async () => {
    await container.usecases.deleteAccount.execute();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      initialising,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
      refreshProfile,
      completeOnboarding,
      deleteAccount,
    }),
    [
      user,
      profile,
      initialising,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
      refreshProfile,
      completeOnboarding,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
