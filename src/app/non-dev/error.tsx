"use client";

import { useEffect } from "react";
import FormButton from "@/components/Global/FormButton";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="grid grid-cols-1 gap-card p-4 sm:p-6 lg:p-10">
      <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-4 rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid grid-cols-1 gap-1">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Something went wrong
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This view could not load. Your data is safe — try again.
          </p>
        </div>
        <div className="flex justify-center">
          <FormButton onClick={retry}>Try again</FormButton>
        </div>
      </div>
    </section>
  );
}
