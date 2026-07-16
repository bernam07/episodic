import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, Profile } from "@/domain/entities/Profile";
import { container } from "@/presentation/di/container";

type AuthContextValue = {
  user: AuthUser | null;
  profile: Profile | null;
  initialising: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
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

  const signIn = useCallback(async (email: string, password: string) => {
    await container.usecases.signIn.execute({ email, password });
  }, []);

  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    await container.usecases.signUp.execute({ email, password, username });
  }, []);

  const signOut = useCallback(async () => {
    await container.usecases.signOut.execute();
  }, []);

  const value = useMemo(
    () => ({ user, profile, initialising, signIn, signUp, signOut }),
    [user, profile, initialising, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
