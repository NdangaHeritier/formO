import Link from "next/link";
import { Icon } from "@/components/Global/Icon";

/**
 * Server-rendered access denial. Used by the audience layouts so a developer
 * account can never render the non-dev workbench and vice versa.
 */
export default function ForbiddenView({
  title = "Access restricted",
  message,
  href,
  linkLabel,
}: {
  title?: string;
  message: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <section className="grid w-full max-w-md grid-cols-1 gap-4 rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <Icon name="Lock" size={22} className="text-red-600 dark:text-red-400" />
        </div>
        <div className="grid grid-cols-1 gap-1">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {linkLabel} <Icon name="ArrowRight" size={15} />
        </Link>
      </section>
    </main>
  );
}
