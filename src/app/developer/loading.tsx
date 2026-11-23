import {
  Skeleton,
  SkeletonLine,
  SkeletonListRows,
  SkeletonMetricCard,
  SkeletonTableRows,
} from "@/components/Global/Skeleton";

/** Lightweight fallback for the developer content area; the shell lives in page.tsx. */
export default function Loading() {
  return (
    <section className="grid grid-cols-1 gap-card p-4 sm:p-6 lg:p-10" aria-busy="true">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <SkeletonMetricCard key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-card rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <SkeletonLine width="w-32" className="h-4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="overflow-hidden">
          <SkeletonTableRows rows={5} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <SkeletonLine width="w-28" className="h-4" />
        </div>
        <SkeletonListRows rows={3} />
      </div>
    </section>
  );
}
