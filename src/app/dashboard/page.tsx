'use client';
import React, { useEffect } from 'react';

import { useAuth } from "@/lib/Auth_context";
import PrivateRouter from '@/components/Global/privateRouter';
import { useRouter } from 'next/navigation'
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Icon } from '@/components/Global/Icon';

export default function Dashboard() {

    const { currentUser } = useAuth();
    const router = useRouter();
    // Redirect user based on their interest
    useEffect(() => {
        if (!currentUser) {
            router.push("/login");
            return;
        }
        const fetchUserPreferences = async () => {
            const userInterestRef = collection(db, "user_preferences");
            const userInterestQuery = query(userInterestRef, where("userId", "==", currentUser.uid));
            const userInterestSnapshot = await getDocs(userInterestQuery);
            if (userInterestSnapshot.empty) {
                router.push("/signup/select-interest"); // go to set interst if not set...
                return; //exit
            }
            const userInterestData = userInterestSnapshot.docs[0].data(); // get first instance of user interest
            const interest = userInterestData.interest;
            if (interest === "developer") {
                router.push("/developer");
            } else if (interest === "non-developer") {
                router.push("/non-dev");
            } else {
                // fallback if interest is not recognized
                router.push("/signup/select-interest");
            }
        };
        fetchUserPreferences();
    }, [currentUser, router]);

    // Optionally, show aaka loader while processing
    return (
        <PrivateRouter>
            <div className="flex items-center justify-center min-h-screen">
                <Icon name="Loader" size={50} className="animate-spin text-zinc-500" />
            </div>
        </PrivateRouter>
    );
}