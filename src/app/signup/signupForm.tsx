"use client";
import { useState } from "react";
import { useEffect } from "react";
import { Icon } from "@/components/Global/Icon";
import FormButton from "@/components/Global/FormButton";
import { InputField } from "@/components/Global/InputField";
import Header from "@/components/Header";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import LoadingSpinner from "@/components/Global/LoadingSpinner";
import { useToast } from "@/components/Global/Toast";

const SignupForm = ({ authError }: { authError?: string }) => {

    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const toast = useToast();
    const [signupLoading, setSignupLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (authError) toast.error(authError);
    }, [authError, toast]);

    const signUpWithGoogle = async () => {
        const res = await signIn.social({ provider: "google", callbackURL: "/signup/select-interest", errorCallbackURL: "/signup" });
        if (res?.error) {
            toast.error(res.error.message || "Google Sign-In is not configured yet.");
        }
    };

    const signUpWithGithub = async () => {
        const res = await signIn.social({ provider: "github", callbackURL: "/signup/select-interest", errorCallbackURL: "/signup" });
        if (res?.error) {
            toast.error(res.error.message || "GitHub Sign-In is not configured yet.");
        }
    };

    // A crazy loading effect in the beginning of mounting login..
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSignupLoading(true);
        if (form.password !== form.confirmPassword) {
            toast.error("Passwords do not match.");
            setSignupLoading(false);
            return;
        }

        try {
            const result = await signUp.email({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
            });
            if (result.error) {
                setSignupLoading(false);
                if (result.error.code === "USER_ALREADY_EXISTS" || result.error.message?.toLowerCase().includes("already")) {
                    toast.error("This email is already registered. Please log in instead.");
                } else {
                    toast.error(result.error.message || "Signup failed. Please try again.");
                }
                return;
            }
            setSignupLoading(false);
            // Redirect to the dashboard or home page after successful sign-in
            router.push("/signup/select-interest");
        }
        catch (err) {
            setSignupLoading(false);
            console.error("Unexpected error:", err);
            toast.error("An unknown error occurred.");
        }
    };

    if (isLoading) {
        return (
            <div className="app-viewport h-dvh overflow-y-auto">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="app-viewport h-dvh overflow-y-auto">
            <Header />
            <section className="grid grid-cols-1 place-items-center min-h-[80vh] my-6">
                <div className="flex w-full max-w-md flex-col gap-5 overflow-hidden rounded-3xl bg-white p-5 dark:bg-zinc-950 sm:p-8">
                    <div className="w-full flex p-5 items-start justify-start border-b-zinc-200 dark:border-b-zinc-700 gap-4">
                        <div className="">
                            <Image
                                src="/Assets/formo-coloured.png"
                                alt="Formo"
                                className="h-10 w-auto border-2 rounded-md border-yellow-500/30 dark:border-yellow-200/20"
                                height={60}
                                width={60} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-200">Register Free Account</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Welcome back! Please sign in to continue.</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="text-zinc-900 dark:text-zinc-200 flex flex-col gap-4 p-8">
                        <div className="flex flex-col gap-4 my-2 py-2">
                            <FormButton
                                type="button"
                                onClick={signUpWithGoogle}
                                variant="primary"
                                disabled={signupLoading}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 48 48"
                                    className="inline-block h-5 w-5 shrink-0"
                                >
                                    <g>
                                        <path
                                            fill="#4285F4"
                                            d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.3-5.7 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c2.6 0 5 .8 7 2.3l5.7-5.7C33.5 6.5 28.9 4.5 24 4.5 13.5 4.5 5 13 5 23.5S13.5 42.5 24 42.5c10.2 0 18.5-8.3 18.5-18.5 0-1.2-.1-2.1-.3-3z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M6.3 14.7l6.6 4.8C14.3 16.1 18.8 13 24 13c2.6 0 5 .8 7 2.3l5.7-5.7C33.5 6.5 28.9 4.5 24 4.5c-7.2 0-13.2 4.1-16.2 10.2z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M24 42.5c5.4 0 10.1-1.8 13.5-4.9l-6.2-5.1c-1.8 1.3-4.1 2.1-7.3 2.1-5.6 0-10.3-3.7-12-8.7l-6.6 5.1C10.8 39.1 16.9 42.5 24 42.5z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M43.6 20.5h-1.9V20H24v8h11.3c-0.7 2-2.1 3.7-4.1 4.9l6.2 5.1c3.6-3.3 5.6-8.1 5.6-13.5 0-1.2-.1-2.1-.3-3z"
                                        />
                                    </g>
                                </svg>
                                Continue with Google
                            </FormButton>

                            <FormButton
                                type="button"
                                onClick={signUpWithGithub}
                                variant="primary"
                                disabled={signupLoading}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    className="inline-block h-5 w-5 shrink-0"
                                >
                                    <g
                                        fill="none"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                    >
                                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5c.08-1.25-.27-2.48-1-3.5c.28-1.15.28-2.35 0-3.5c0 0-1 0-3 1.5c-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5c-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4" />
                                        <path d="M9 18c-4.51 2-5-2-7-2" />
                                    </g>
                                </svg>
                                Continue with Github
                            </FormButton>
                        </div>

                        <div className="flex items-center gap-2 my-2">
                            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">or</span>
                            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                        </div>

                        <InputField
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your Name"
                            autoComplete="name"
                        />
                        <InputField
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Email address"
                            autoComplete="email"
                        />
                        <InputField
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Password"
                            autoComplete="current-password"
                        />
                        <InputField
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="re-enter Password"
                            autoComplete="confirm-password"
                        />
                        <FormButton
                            type="submit"
                            variant="secondary"
                            disabled={signupLoading || !form.email || !form.name}
                        >
                            {signupLoading ? (
                                <Icon name="Loader" size={20} className="animate-spin" />
                            ) : (
                                "Sign Up"
                            )}
                        </FormButton>
                    </form>
                    <div className="grid grid-cols-2 gap-3 border-t border-b border-zinc-200 dark:border-zinc-700 p-4">
                        <div className="flex items-center text-xs justify-center gap-1 text-zinc-500 dark:text-zinc-400">
                            <Link href="/login" className="text-zinc-700 dark:text-gray-300 hover:underline">Have Account?</Link>
                        </div>

                        {/* forgot password */}
                        <div className="flex items-center text-xs justify-center gap-1 text-zinc-500 dark:text-zinc-400 border-l pl-3 border-l-zinc-200 dark:border-l-zinc-700">
                            <Link href="/#about" className="text-zinc-700 dark:text-gray-300 hover:underline">Why choose formo?</Link>
                        </div>
                    </div>

                    <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center pt-5">
                        By signing up, you agree to our <Link href="/terms" className="text-zinc-700 dark:text-gray-300 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-zinc-700 dark:text-gray-300 hover:underline">Privacy Policy</Link>.
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SignupForm;

