"use client"
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PrivateRouter ({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: authLoading } = useSession();
  const currentUser = session?.user ?? null;
    const router = useRouter();

    // check if user is authenticated
     useEffect(() => {
      if (!currentUser && !authLoading) {
        router.push('/login');
      }
    }, [currentUser, authLoading, router]);
    
    return (
        <>
            {!authLoading ? children : <div className="flex items-center justify-center h-screen">Loading...</div>}
        </>
    );
}