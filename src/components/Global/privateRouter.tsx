"use client"
import { useAuth } from "@/lib/Auth_context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PrivateRouter ({ children }: { children: React.ReactNode }) {
  const { currentUser, authLoading } = useAuth();
    const router = useRouter();
    const [checkAuth, setCheckAuth] = useState(true);

    // check if user is authenticated
     useEffect(() => {
      if (!currentUser && !authLoading) {
        router.push('/login');
      }
    }, [currentUser, authLoading, router]);
    
    return (
        <>
            {checkAuth && !authLoading ? children : <div className="flex items-center justify-center h-screen">Loading...</div>}
        </>
    );
}