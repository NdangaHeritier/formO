import type { ReactNode } from "react";

/** Base loading block. No shimmer, no gradient — see DESIGN.md. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800 ${className}`}
    />
  );
}

export function SkeletonLine({
  width = "w-full",
  className = "",
}: {
  width?: string;
  className?: string;
}) {
  return <Skeleton className={`h-3 ${width} ${className}`} />;
}

/** Metric card matching AnalyticCard's silhouette so nothing shifts on load. */
export function SkeletonMetricCard() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-card rounded-card border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <SkeletonLine width="w-3/4" />
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <SkeletonLine width="w-2/3" />
      </div>
    </div>
  );
}

/** List rows used by settings and the template library (48px row). */
export function SkeletonListRows({ rows = 2 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-2 p-2">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-3 rounded-lg border border-transparent bg-zinc-50 px-4 py-3 dark:bg-zinc-900/40"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <SkeletonLine width="w-32" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Table body rows matching the forms table (five columns). */
export function SkeletonTableRows({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="divide-y divide-zinc-100 dark:divide-zinc-900">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 px-5 py-5">
          <div className="grid grid-cols-1 gap-2">
            <SkeletonLine width="w-28" />
            <SkeletonLine width="w-36" className="h-2" />
          </div>
          <SkeletonLine width="w-24" />
          <SkeletonLine width="w-32" />
          <SkeletonLine width="w-8" />
          <SkeletonLine width="w-16" />
        </div>
      ))}
    </div>
  );
}

/** Project card silhouette. */
export function SkeletonProjectCard() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <SkeletonLine width="w-32" />
      </div>
      <SkeletonLine width="w-full" />
      <SkeletonLine width="w-4/5" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-5">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonProjectCard key={index} />
      ))}
    </div>
  );
}

/** Generic panel section with a header and two rows. */
export function SkeletonSection({ children }: { children?: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-card rounded-card border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <SkeletonLine width="w-32" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      <div className="p-3">{children ?? <SkeletonListRows />}</div>
    </div>
  );
}

/**
 * Backward-compatible wrapper around the older SkeletonBox API.
 * Prefer the purpose-built skeletons above for new UI.
 */
export default function SkeletonBox({
  customStyle = "w-full h-full rounded-md",
  shown = true,
}: {
  customStyle?: string;
  shown?: boolean;
}) {
  if (!shown) return <div />;
  return <Skeleton className={customStyle} />;
}
