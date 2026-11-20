import { APIError } from "better-auth/api";

export const SOCIAL_SIGNIN_EXISTING_ACCOUNT = "social_signin_existing_account";

const METHOD_LABELS: Record<string, string> = {
  credential: "email and password",
  google: "Google",
  github: "GitHub",
};

export function methodLabel(providerId: string): string {
  return METHOD_LABELS[providerId] ?? providerId;
}

/** Message shown when a social provider matches an account that already exists. */
export function existingAccountMessage(providerIds: string[]): string {
  const methods = [...new Set(providerIds.map(methodLabel))];
  const existing = methods.length > 0 ? methods.join(" or ") : "your existing sign-in method";
  return `An account with this email already exists. Please sign in with ${existing} instead.`;
}

/** Thrown from the account-create hook so Better Auth redirects with our message. */
export function rejectSocialSignIn(providerIds: string[]): never {
  throw new APIError("BAD_REQUEST", {
    code: SOCIAL_SIGNIN_EXISTING_ACCOUNT,
    message: existingAccountMessage(providerIds),
  });
}
