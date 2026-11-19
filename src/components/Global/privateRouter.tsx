"use client";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PrivateRouter({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: authLoading } = useSession();
  const currentUser = session?.user ?? null;
  const router = useRouter();

  useEffect(() => {
    if (!currentUser && !authLoading) {
      router.push("/login");
    }
  }, [currentUser, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1eee6] dark:bg-[#130b00]">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-600/20">
            <Image
              src="/Assets/formo-coloured.png"
              alt="FormO"
              width={52}
              height={52}
              priority
              className="h-12 w-12 object-contain"
            />
          </span>
          <span className="sr-only">Loading FormO</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
