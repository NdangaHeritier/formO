'use client';
import React, { useEffect } from 'react';

import { useSession } from "@/lib/auth-client";
import PrivateRouter from '@/components/Global/privateRouter';
import { useRouter } from 'next/navigation'
import BrandLoader from '@/components/Global/BrandLoader';

export default function Dashboard() {

    const { data: session, isPending } = useSession();
    const currentUser = session?.user ?? null;
    const router = useRouter();
    // Redirect user based on their interest
    useEffect(() => {
        if (isPending) return;
        if (!currentUser) {
            router.push("/login");
            return;
        }
        const fetchUserPreferences = async () => {
            const res = await fetch("/api/auth/workspace");
            if (!res.ok) {
                router.push("/signup/select-interest");
                return;
            }
            const json = (await res.json()) as { user?: { interest?: string } };
            const interest = json.user?.interest;
            if (interest === "developer") {
                router.push("/developer");
            } else if (interest === "non_developer" || interest === "non-developer") {
                router.push("/non-dev");
            } else {
                router.push("/signup/select-interest");
            }
        };
        fetchUserPreferences();
    }, [isPending, currentUser, router]);

    // Optionally, show aaka loader while processing
    return (
        <div className="app-viewport h-dvh overflow-y-auto">
            <PrivateRouter>
                <div className="flex items-center justify-center min-h-full">
                    <BrandLoader />
                </div>
            </PrivateRouter>
        </div>
    );
}