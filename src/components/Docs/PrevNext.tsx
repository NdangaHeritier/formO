import Link from "next/link";
import { Icon } from "@/components/Global/Icon";
import { docsNeighbours } from "@/lib/docs/manifest";

export default function PrevNext({ href }: { href: string }) {
  const { previous, next } = docsNeighbours(href);
  if (!previous && !next) return null;

  return (
    <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {previous ? (
        <Link
          href={previous.href}
          className="grid grid-cols-1 gap-1 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
        >
          <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Icon name="ChevronRight" size={13} className="rotate-180" /> Previous
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          href={next.href}
          className="grid justify-items-end gap-1 rounded-xl border border-zinc-200 p-4 text-right transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
        >
          <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            Next <Icon name="ArrowRight" size={13} />
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{next.title}</span>
        </Link>
      )}
    </div>
  );
}
