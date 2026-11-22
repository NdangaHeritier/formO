/**
 * Single source of truth for sender selection.
 *
 * Resolution order: form-specific sender → workspace default sender → null,
 * where null means the delivery worker uses system SMTP from the environment.
 */
export function selectDeliverySender<T>(
  formSender: T | null | undefined,
  workspaceDefault: T | null | undefined
): T | null {
  return formSender ?? workspaceDefault ?? null;
}
