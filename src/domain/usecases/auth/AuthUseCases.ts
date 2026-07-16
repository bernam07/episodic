import { AppError } from "@/core/errors/AppError";
import type { AuthUser } from "@/domain/entities/Profile";
import type { Credentials, IAuthRepository, SignUpInput } from "@/domain/repositories/IAuthRepository";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function assertCredentials(input: Credentials): void {
  if (!EMAIL_PATTERN.test(input.email.trim())) {
    throw new AppError("validation", "Enter a valid email address.");
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError("validation", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
}

export class SignIn {
  constructor(private readonly auth: IAuthRepository) {}

  async execute(input: Credentials): Promise<AuthUser> {
    assertCredentials(input);
    return this.auth.signIn({ email: input.email.trim(), password: input.password });
  }
}

export class SignUp {
  constructor(private readonly auth: IAuthRepository) {}

  async execute(input: SignUpInput): Promise<AuthUser | null> {
    assertCredentials(input);

    const username = input.username?.trim();

    if (username && !/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      throw new AppError(
        "validation",
        "Username must be 3-24 characters, letters, numbers or underscore."
      );
    }

    return this.auth.signUp({ email: input.email.trim(), password: input.password, username });
  }
}

export class SignOut {
  constructor(private readonly auth: IAuthRepository) {}

  async execute(): Promise<void> {
    return this.auth.signOut();
  }
}
