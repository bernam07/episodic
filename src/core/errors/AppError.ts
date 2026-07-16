export type AppErrorKind =
  | "auth"
  | "network"
  | "not_found"
  | "validation"
  | "permission"
  | "unknown";

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly cause?: unknown;

  constructor(kind: AppErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.cause = cause;
  }

  static from(cause: unknown, fallback = "Something went wrong."): AppError {
    if (cause instanceof AppError) {
      return cause;
    }

    const message = cause instanceof Error ? cause.message : fallback;
    return new AppError("unknown", message, cause);
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.kind) {
      case "auth":
        return error.message;
      case "network":
        return "Connection problem. Check your network and try again.";
      case "not_found":
        return "We could not find what you were looking for.";
      case "validation":
        return error.message;
      case "permission":
        return "You do not have access to this.";
      default:
        return error.message;
    }
  }

  return "Something went wrong.";
}
