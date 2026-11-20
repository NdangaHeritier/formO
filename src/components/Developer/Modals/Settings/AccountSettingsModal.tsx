"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import Layout from "@/components/Developer/Modals/Layout";
import { Icon } from "@/components/Global/Icon";
import FormButton from "@/components/Global/FormButton";

/** Account dialog opened from the shell avatar. */
export default function AccountSettingsModal({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const logout = async () => {
    await signOut();
    onClose();
    router.push("/login");
    router.refresh();
  };

  return (
    <Layout onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-950 sm:p-6"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600/20 text-yellow-600">
            <Icon name="User" size={16} strokeWidth={2} aria-hidden="true" />
          </span>
          <h2 id="account-settings-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Account settings
          </h2>
        </div>
        <dl className="mt-5 grid grid-cols-1 gap-3 text-sm">
          <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Name</dt>
            <dd className="font-medium text-zinc-800 dark:text-zinc-200">{user?.name ?? "—"}</dd>
          </div>
          <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="font-medium text-zinc-800 dark:text-zinc-200">{user?.email ?? "—"}</dd>
          </div>
        </dl>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <FormButton type="button" variant="secondary" onClick={onClose}>Close</FormButton>
          <FormButton type="button" variant="danger" onClick={() => void logout()}>Sign out</FormButton>
        </div>
      </section>
    </Layout>
  );
}
