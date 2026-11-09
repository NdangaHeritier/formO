"use client";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import PrivateRouter from "@/components/Global/privateRouter";
import { useAuth } from "@/lib/Auth_context";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addDoc, collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SelectInterest = () => {

    const { currentUser } = useAuth();
    const [interest, setInterest] = useState(currentUser?.interest || "developer");
    const [updateLoading, setUpdateLoading] = useState(false);
    const router = useRouter();

    // update interest in user profile
    const handleInterestChange = async (newInterest: string) => {
        setUpdateLoading(true);
        if (!currentUser){
            console.error("No user is currently logged in.");
            setUpdateLoading(false);
            router.push("/login"); // Redirect to login if no user is logged in..
            return; // Ensure currentUser is defined before proceeding....
        }
        try {
            const userRef = collection(db, "user_preferences");
            const userDocQuery = query(userRef, where("userId", "==", currentUser.uid));
            const userSnapshot = await getDocs(userDocQuery);

            if (userSnapshot.empty) {
                // No document exists for this user, so create one...
                await addDoc(userRef, {
                    userId: currentUser.uid,
                    interest: newInterest,
                });
                console.log("New Interest saved for user.");
            } else {
                // User document found — update it....
                const docRef = userSnapshot.docs[0].ref;
                await updateDoc(docRef, {
                    interest: newInterest,
                });
                console.log("User interest updated.");
            }

            setInterest(newInterest);
            console.log("Interest updated successfully.");
            setUpdateLoading(false);
        } catch (error) {
            console.error("Failed to update interest in user profile:", error);
        }
    };
    return (
        <PrivateRouter>
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 py-16 px-4">
                <div className="flex absolute top-10 left-10">
                    <Image
                        src="/Assets/formo.png"
                        alt="Formo Logo"
                        className="w-10 h-10"
                        height={50}
                        width={50}
                    />
                </div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text from-yellow-600 to-yellow-800 bg-gradient-to-br mb-4">Welcome, {currentUser?.displayName || currentUser?.email}</h1>
                <h1 className="text-3xl font-bold text-white mb-4">Select Your Interests</h1>
                <p className="text-gray-400 mb-8">Choose the topics you are interested in to personalize your experience.</p>
                {/* Add your interest selection UI here... */}
                <div className="mx-auto grid grid-cols-1 gap-4 max-w-md">
                    <button
                        onClick={() => handleInterestChange("developer")}
                        className={`${interest === "developer" ? `border-yellow-800 bg-yellow-950/10 hover:bg-yellow-950/20` : `border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-zinc-600`} border-2 flex items-center justify-start gap-4 text-zinc-300 px-4 py-2 rounded-md mb-4 transition-colors cursor-pointer`}
                        >
                        <div className="select">
                            <div className="rounded-full w-4 h-4 border-zinc-600 border-2 flex-items-center p-0.5">
                                {interest === "developer" ? (
                                    <span className="h-full w-full bg-zinc-400 flex h-3 w-3 rounded-full"></span>
                                ) : ``}
                            </div>                        
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-start">
                            <h1 className="text-base">Developer</h1>
                            <p className="text-sm text-zinc-500">Integrate powerful email backend services into your apps with zero hassle.</p>
                        </div>
                    </button>
                    <button
                        onClick={() => handleInterestChange("non-developer")}
                        className={`${interest === "non-developer" ? `border-yellow-800 bg-yellow-950/10 hover:bg-yellow-950/20` : `border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-zinc-600`} border-2 flex items-center justify-start gap-4 text-zinc-300 px-4 py-2 rounded-md mb-4 transition-colors cursor-pointer`}
                        >
                        <div className="select">
                            <div className="rounded-full w-4 h-4 border-zinc-600 border-2 flex-items-center p-0.5">
                                {interest === "non-developer" ? (
                                    <span className="h-full w-full bg-zinc-400 flex h-3 w-3 rounded-full"></span>
                                ) : ``}
                            </div>                        
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-start">
                            <h1 className="text-base">Non-Developer</h1>
                            <p className="text-sm text-zinc-500">Easily set up and manage email forms without writing any code.</p>
                        </div>
                    </button>
                </div>
                <div className="flex items-center justify-end py-5 w-full max-w-md">
                    <FormButton
                        onClick={() => {
                            // Handle the next step after interest selection
                            // For example, redirect to the dashboard or another page
                            router.push("/dashboard");
                        }}
                        disabled={updateLoading}
                        variant="primary"
                    >
                        Continue
                        <Icon name="ArrowRight" size={20} />
                    </FormButton>
                </div>
                <p className="text-gray-500 mt-10 italic">Your selection will help us tailor the app content to your interests.</p>
            </div>
        </PrivateRouter>
    );
}
export default SelectInterest