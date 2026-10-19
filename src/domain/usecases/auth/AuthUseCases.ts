import { AppError } from "@/core/errors/AppError";
import type { AuthUser, Profile } from "@/domain/entities/Profile";
import type {
  IAuthRepository,
  SignInInput,
  SignUpInput,
} from "@/domain/repositories/IAuthRepository";
import type { ISocialRepository } from "@/domain/repositories/ISocialRepository";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_DISPLAY_NAME_LENGTH = 40;
export const MAX_BIO_LENGTH = 160;
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isValidAvatarFile(type: string, size: number): boolean {
  return ALLOWED_AVATAR_TYPES.has(type) && size > 0 && size <= MAX_AVATAR_BYTES;
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username.trim());
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export class SignIn {
  constructor(private readonly auth: IAuthRepository) {}

  async execute(input: SignInInput): Promise<AuthUser> {
    const identifier = input.identifier.trim();

    if (!identifier) {
      throw new AppError("validation", "Enter your username or email.");
    }

    if (!input.password) {
      throw new AppError("validation", "Enter your password.");
    }

    return this.auth.signIn({ identifier, password: input.password });
  }
}

export class SignUp {
  constructor(
    private readonly auth: IAuthRepository,
    private readonly social: ISocialRepository
  ) {}

  async execute(input: SignUpInput): Promise<AuthUser | null> {
    const email = input.email.trim();
    const username = input.username.trim();

    if (!isValidEmail(email)) {
      throw new AppError("validation", "Enter a valid email address.");
    }

    if (!username) {
      throw new AppError("validation", "Choose a username.");
    }

    if (!isValidUsername(username)) {
      throw new AppError(
        "validation",
        "Username must be 3-24 characters: letters, numbers or underscore."
      );
    }

    if (input.password.length < MIN_PASSWORD_LENGTH) {
      throw new AppError("validation", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    const available = await this.social.isUsernameAvailable(username);

    if (!available) {
      throw new AppError("validation", `Username "${username}" is already taken.`);
    }

    return this.auth.signUp({ email, password: input.password, username });
  }
}

export class SignOut {
  constructor(private readonly auth: IAuthRepository) {}

  async execute(): Promise<void> {
    return this.auth.signOut();
  }
}

export class RequestPasswordReset {
  constructor(private readonly auth: IAuthRepository) {}

  async execute(email: string): Promise<void> {
    const trimmed = email.trim();

    if (!isValidEmail(trimmed)) {
      throw new AppError("validation", "Enter a valid email address.");
    }

    return this.auth.requestPasswordReset(trimmed);
  }
}

export class UpdatePassword {
  constructor(private readonly auth: IAuthRepository) {}

  async execute(password: string): Promise<void> {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AppError("validation", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    return this.auth.updatePassword(password);
  }
}

export class CheckUsernameAvailable {
  constructor(private readonly social: ISocialRepository) {}

  async execute(username: string): Promise<boolean> {
    if (!isValidUsername(username)) {
      return false;
    }

    return this.social.isUsernameAvailable(username.trim());
  }
}

export class UpdateProfile {
  constructor(private readonly auth: IAuthRepository) {}

  async execute(
    userId: string,
    input: { displayName: string; bio: string; bannerUrl?: string | null }
  ): Promise<Profile> {
    const displayName = input.displayName.trim();
    const bio = input.bio.trim();

    if (!displayName) {
      throw new AppError("validation", "Enter a display name.");
    }

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      throw new AppError("validation", `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`);
    }

    if (bio.length > MAX_BIO_LENGTH) {
      throw new AppError("validation", `Bio must be ${MAX_BIO_LENGTH} characters or fewer.`);
    }

    return this.auth.updateProfile(userId, {
      displayName,
      bio: bio || null,
      ...(input.bannerUrl !== undefined ? { bannerUrl: input.bannerUrl } : {}),
    });
  }
}

export class UploadAvatar {
  constructor(private readonly auth: IAuthRepository) {}

  async execute(userId: string, file: File): Promise<string> {
    if (!isValidAvatarFile(file.type, file.size)) {
      throw new AppError("validation", "Choose a JPG, PNG or WEBP image under 5MB.");
    }

    return this.auth.uploadAvatar(userId, file);
  }
}

export class UploadBanner {
  constructor(private readonly auth: IAuthRepository) {}

  async execute(userId: string, file: File): Promise<string> {
    if (!isValidAvatarFile(file.type, file.size)) {
      throw new AppError("validation", "Choose a JPG, PNG or WEBP image under 5MB.");
    }

    return this.auth.uploadBanner(userId, file);
  }
}

export class DeleteAccount {
  constructor(private readonly auth: IAuthRepository) {}

  async execute(): Promise<void> {
    return this.auth.deleteAccount();
  }
}
