"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import ConfirmDialog from "@/components/Global/ConfirmDialog";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import UserAvatar from "@/components/Global/UserAvatar";
import { useToast } from "@/components/Global/Toast";
import { authClient, signOut, useSession } from "@/lib/auth-client";

type SessionView = {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string | Date;
  expiresAt: string | Date;
};

type AuthResult = { error?: { message?: string } | null };
type Tab = "profile" | "security" | "sessions";

const errorMessage = (result: AuthResult | null | undefined, fallback: string) =>
  result?.error?.message ?? fallback;

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security" },
  { key: "sessions", label: "Sessions" },
];

function when(value: string | Date) {
  return new Date(value).toLocaleString();
}

function Busy({ active, label, busyLabel }: { active: boolean; label: string; busyLabel: string }) {
  if (active) {
    return (
      <>
        <Icon name="Loader" size={15} className="animate-spin" />
        {busyLabel}
      </>
    );
  }
  return <>{label}</>;
}

/** Centered, tabbed account controls with visible per-action progress. */
export default function AccountPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [name, setName] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionView[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadSessions = useCallback(() => {
    authClient
      .listSessions()
      .then((result) => {
        if (result.error) {
          toast.error(errorMessage(result, "Could not load sessions."));
          return;
        }
        setSessions((result.data ?? []) as SessionView[]);
      })
      .catch(() => toast.error("Could not load sessions."));
  }, [toast]);

  useEffect(() => {
    if (session) loadSessions();
  }, [session, loadSessions]);

  const profileName = name ?? session?.user?.name ?? "";
  const profileImage = image ?? session?.user?.image ?? "";
  const emailValue = newEmail ?? session?.user?.email ?? "";

  const saveProfile = async () => {
    setBusy("profile");
    try {
      const result = await authClient.updateUser({
        name: profileName.trim(),
        image: profileImage.trim() || undefined,
      });
      if (result.error) {
        toast.error(errorMessage(result, "Could not update profile."));
        return;
      }
      toast.success("Profile updated.");
    } catch {
      toast.error("Could not update profile.");
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async () => {
    setBusy("password");
    try {
      const result = await authClient.changePassword({ currentPassword, newPassword });
      if (result.error) {
        toast.error(errorMessage(result, "Could not change password."));
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed.");
      loadSessions();
    } catch {
      toast.error("Could not change password.");
    } finally {
      setBusy(null);
    }
  };

  const changeEmail = async () => {
    setBusy("email");
    try {
      const result = await authClient.changeEmail({
        newEmail: emailValue.trim(),
        callbackURL: `${window.location.origin}/developer/account`,
      });
      if (result.error) {
        toast.error(errorMessage(result, "Could not change email."));
        return;
      }
      toast.success("Check your inbox to confirm the new email address.");
    } catch {
      toast.error("Could not change email.");
    } finally {
      setBusy(null);
    }
  };

  const revokeSession = async (token: string) => {
    setBusy(`session:${token}`);
    try {
      const result = await authClient.revokeSession({ token });
      if (result.error) {
        toast.error(errorMessage(result, "Could not revoke session."));
        return;
      }
      toast.success("Session revoked.");
      loadSessions();
    } catch {
      toast.error("Could not revoke session.");
    } finally {
      setBusy(null);
    }
  };

  const revokeOthers = async () => {
    setBusy("sessions");
    try {
      const result = await authClient.revokeOtherSessions();
      if (result.error) {
        toast.error(errorMessage(result, "Could not revoke other sessions."));
        return;
      }
      toast.success("Other sessions revoked.");
      loadSessions();
    } catch {
      toast.error("Could not revoke other sessions.");
    } finally {
      setBusy(null);
    }
  };

  const deleteAccount = async () => {
    setBusy("delete");
    try {
      const result = await authClient.deleteUser();
      if (result?.error) {
        toast.error(errorMessage(result, "Could not delete account."));
        return;
      }
      toast.success("Account deleted.");
      await signOut();
      router.push("/login");
    } catch {
      toast.error("Could not delete account.");
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  };

  return (
    <DeveloperShell>
      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-card">
        <div className="flex items-center gap-3">
          <UserAvatar src={session?.user?.image} size={48} className="h-12 w-12" />
          <div className="grid grid-cols-1 gap-0.5">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Account settings</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{session?.user?.email}</p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Account settings sections"
          className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800"
        >
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`cursor-pointer border-b-2 px-4 py-2 text-sm font-medium ${
                tab === item.key
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          {tab === "profile" && (
            <>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Profile</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField type="text" name="name" id="account-name" label="Name" placeholder="Your name" value={profileName} onChange={(e) => setName(e.target.value)} />
                <InputField type="text" name="image" id="account-image" label="Avatar URL" placeholder="https://…" value={profileImage} onChange={(e) => setImage(e.target.value)} />
              </div>
              <div>
                <FormButton variant="primary" disabled={busy !== null} onClick={saveProfile}>
                  <Busy active={busy === "profile"} label="Save profile" busyLabel="Saving…" />
                </FormButton>
              </div>
            </>
          )}

          {tab === "security" && (
            <>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Credentials</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField type="password" name="currentPassword" id="account-current-password" label="Current password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <InputField type="password" name="newPassword" id="account-new-password" label="New password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <FormButton variant="secondary" disabled={busy !== null || !currentPassword || !newPassword} onClick={changePassword}>
                  <Busy active={busy === "password"} label="Change password" busyLabel="Changing…" />
                </FormButton>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField type="email" name="newEmail" id="account-new-email" label="New email" placeholder="you@example.com" value={emailValue} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div>
                <FormButton variant="secondary" disabled={busy !== null || !emailValue.trim() || emailValue.trim() === session?.user?.email} onClick={changeEmail}>
                  <Busy active={busy === "email"} label="Change email" busyLabel="Sending…" />
                </FormButton>
              </div>
            </>
          )}

          {tab === "sessions" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Active sessions</h2>
                <FormButton variant="secondary" disabled={busy !== null} onClick={revokeOthers}>
                  <Busy active={busy === "sessions"} label="Sign out everywhere else" busyLabel="Signing out…" />
                </FormButton>
              </div>
              {sessions.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No sessions found.</p>
              ) : (
                <ul className="grid grid-cols-1 gap-2">
                  {sessions.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/40">
                      <span className="grid grid-cols-1 gap-0.5 text-sm">
                        <span className="text-zinc-800 dark:text-zinc-200">{item.userAgent || "Unknown device"}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {item.ipAddress || "Unknown IP"} · {when(item.createdAt)}
                        </span>
                      </span>
                      <FormButton variant="danger" disabled={busy !== null} onClick={() => revokeSession(item.token)}>
                        <Busy active={busy === `session:${item.token}`} label="Revoke" busyLabel="Revoking…" />
                      </FormButton>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-3xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Delete account</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Permanently remove your account, workspaces and form data. This cannot be undone.
          </p>
          <div>
            <FormButton variant="danger" disabled={busy !== null} onClick={() => setConfirmDelete(true)}>
              Delete account
            </FormButton>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        description="This permanently removes your account and all workspace data. This cannot be undone."
        confirmLabel={busy === "delete" ? "Deleting…" : "Delete account"}
        tone="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={deleteAccount}
      />
    </DeveloperShell>
  );
}
