export type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export type AuthUser = {
  id: string;
  email: string | null;
};
