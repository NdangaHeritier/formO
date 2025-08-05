import { useAuth } from "@/lib/Auth_context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PrivateRouter ({ children }: { children: React.ReactNode }) {
  const { currentUser, authLoading } = useAuth();
    const router = useRouter();

    // check if user is authenticated
     useEffect(() => {
        if (!currentUser && !authLoading) {
        router.push('/login');
        }
    }, [currentUser, router]);
    return (
        <>
           {children}
        </>
    );
}