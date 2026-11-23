"use client";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import PrivateRouter from "@/components/Global/privateRouter";
import { useSession } from "@/lib/auth-client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SelectInterest = () => {

    const { data: session } = useSession();
    const currentUser = session?.user as { name?: string; email?: string; interest?: string } | undefined;
    const [interest, setInterest] = useState(
        currentUser?.interest === "non_developer" ? "non-developer" : (currentUser?.interest || "developer")
    );
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
            const dbInterest = newInterest === "non-developer" ? "non_developer" : "developer";
            const res = await fetch("/api/auth/workspace", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interest: dbInterest }),
            });
            if (!res.ok) {
                throw new Error("Failed to update interest in user profile");
            }

            setInterest(newInterest);
            console.log("Interest updated successfully.");
            setUpdateLoading(false);
        } catch (error) {
            setUpdateLoading(false);
            console.error("Failed to update interest in user profile:", error);
        }
    };
    return (
        <div className="app-viewport h-dvh overflow-y-auto">
            <PrivateRouter>
                <div className="flex flex-col items-center justify-center min-h-full bg-background py-16 px-4">
                    <div className="flex absolute top-10 left-10">
                        <Image
                            src="/Assets/formo.png"
                            alt="Formo Logo"
                            className="w-10 h-10"
                            height={50}
                            width={50}
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text from-yellow-500 to-yellow-700 dark:from-yellow-600 dark:to-yellow-800 bg-gradient-to-br mb-4 break-all sm:text-3xl">Welcome, {currentUser?.name || currentUser?.email}</h1>
                    <h1 className="text-2xl font-bold text-zinc-900 mb-4 dark:text-white sm:text-3xl">Select Your Interests</h1>
                    <p className="text-zinc-600 mb-8 dark:text-gray-400">Choose the topics you are interested in to personalize your experience.</p>
                    {/* Add your interest selection UI here... */}
                    <div className="mx-auto grid grid-cols-1 gap-4 max-w-md">
                        <button
                            onClick={() => handleInterestChange("developer")}
                            className={`${interest === "developer" ? `border-yellow-500 bg-yellow-100 hover:bg-yellow-200 dark:border-yellow-800 dark:bg-yellow-950/10 dark:hover:bg-yellow-950/20` : `border-zinc-300 bg-white hover:bg-zinc-100 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 dark:hover:border-zinc-600`} border-2 flex items-center justify-start gap-4 text-zinc-900 px-4 dark:text-zinc-300 py-2 rounded-md mb-4 transition-colors cursor-pointer`}
                            >
                            <div className="select">
                                <div className="rounded-full w-4 h-4 border-zinc-400 border-2 flex-items-center dark:border-zinc-600 p-0.5">
                                    {interest === "developer" ? (
                                        <span className="h-full w-full bg-zinc-600 flex h-3 w-3 dark:bg-zinc-400 rounded-full"></span>
                                    ) : ``}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-1 text-start">
                                <h1 className="text-base">Developer</h1>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Integrate powerful email backend services into your apps with zero hassle.</p>
                            </div>
                        </button>
                        <button
                            onClick={() => handleInterestChange("non-developer")}
                            className={`${interest === "non-developer" ? `border-yellow-500 bg-yellow-100 hover:bg-yellow-200 dark:border-yellow-800 dark:bg-yellow-950/10 dark:hover:bg-yellow-950/20` : `border-zinc-300 bg-white hover:bg-zinc-100 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 dark:hover:border-zinc-600`} border-2 flex items-center justify-start gap-4 text-zinc-900 px-4 dark:text-zinc-300 py-2 rounded-md mb-4 transition-colors cursor-pointer`}
                            >
                            <div className="select">
                                <div className="rounded-full w-4 h-4 border-zinc-400 border-2 flex-items-center dark:border-zinc-600 p-0.5">
                                    {interest === "non-developer" ? (
                                        <span className="h-full w-full bg-zinc-600 flex h-3 w-3 dark:bg-zinc-400 rounded-full"></span>
                                    ) : ``}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-1 text-start">
                                <h1 className="text-base">Non-Developer</h1>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Easily set up and manage email forms without writing any code.</p>
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
                    <p className="text-zinc-500 mt-10 italic dark:text-gray-500">Your selection will help us tailor the app content to your interests.</p>
                </div>
            </PrivateRouter>
        </div>
    );
}
export default SelectInterest
