export type AuthErrorParams = {
  error?: string | string[];
  error_description?: string | string[];
};

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Turns Better Auth's redirect error params into a message we can display. */
export function authErrorMessage(params: AuthErrorParams): string | undefined {
  const description = first(params.error_description);
  if (description) return description;

  const code = first(params.error);
  if (code === "account_not_linked") {
    return "An account with this email already exists. Please sign in with the method you used originally.";
  }
  if (code) return "We couldn't complete sign-in with that provider. Please try another method.";
  return undefined;
}
