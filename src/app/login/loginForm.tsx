"use client";
import { useState } from "react";
import { useEffect } from "react";
import { Icon } from "@/components/Global/Icon";
import BrandLoader from "@/components/Global/BrandLoader";
import { useToast } from "@/components/Global/Toast";
import FormButton from "@/components/Global/FormButton";
import { InputField } from "@/components/Global/InputField";
import Header from "@/components/Header";
import { signIn, useSession } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";
import { BackGraphicsLayout } from "./BackGraphicsLayout";
import { useRouter } from "next/navigation";


async function resolveWorkspaceRoute(): Promise<string> {
    try {
        const res = await fetch("/api/auth/workspace");
        if (!res.ok) return "/dashboard";
        const data = (await res.json()) as { user?: { interest?: string } };
        if (data.user?.interest === "developer") return "/developer";
        if (data.user?.interest === "non_developer") return "/non-dev";
        return "/signup/select-interest";
    } catch {
        return "/dashboard";
    }
}

export default function LoginForm({ authError }: { authError?: string }) {
    const { data: session } = useSession();
    const currentUser = session?.user ?? null;
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({ email: "", password: "" });
    const toast = useToast();
    const [signinLoading, setSigninLoading] = useState(false);
    const [signedIn, setSignedIn] = useState(false);
    const isSignedIn = signedIn || Boolean(currentUser);
    const router = useRouter();

    // Redirect to dashboard if user is already logged in
    useEffect(() => {
        if (currentUser) {
            const run = async () => {
                const route = await resolveWorkspaceRoute(); // wait for DB result
                router.push(route);
            };

            run();
        }
    }, [currentUser, router]);

    useEffect(() => {
        if (authError) toast.error(authError);
    }, [authError, toast]);

    const signInWithGoogle = async () => {
        const res = await signIn.social({ provider: "google", callbackURL: "/dashboard", errorCallbackURL: "/login" });
        if (res?.error) {
            toast.error(res.error.message || "Google Sign-In is not configured yet.");
        }
    };

    const signInWithGithub = async () => {
        const res = await signIn.social({ provider: "github", callbackURL: "/dashboard", errorCallbackURL: "/login" });
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
        setSigninLoading(true);

        try {
            const result = await signIn.email({
                email: form.email.trim(),
                password: form.password,
            });
            if (result.error) {
                setSigninLoading(false);
                setSignedIn(false);
                toast.error(result.error.message || "Incorrect email or password. Please try again.");
                return;
            }
            setSigninLoading(false);
            setSignedIn(true);
            // Redirect to the dashboard or home page after successful sign-in
            const route = await resolveWorkspaceRoute(); // wait for DB result
            router.push(route);

        }
        catch (err) {
            setSigninLoading(false);
            setSignedIn(false);
            if (err instanceof Error) {
                toast.error("Incorrect email or password. Please try again.");
                console.info(err);
            } else {
                toast.error("An unexpected error occurred. Please try again.");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="app-viewport flex h-dvh items-center justify-center overflow-y-auto">
                <BrandLoader />
            </div>
        );
    }

    return (
        <div className="app-viewport h-dvh overflow-y-auto">
            <title>Login</title>
            <Header />
            <section className="grid grid-cols-1 grid-row-1 sm:grid-cols-3 min-h-[80vh] my-6 ">
                <div className="hidden sm:flex relative -z-1">
                    <div className="absolute inset-0 bg-linear-to-r from-white to-white dark:from-black dark:to-black via-transparent z-1"></div>
                    <BackGraphicsLayout />
                </div>
                {isSignedIn ? (
                    <div className="flex items-center justify-center sm:col-span-2">
                        <div
                            role="status"
                            aria-live="polite"
                            className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-white px-5 py-12 text-center dark:bg-zinc-950 sm:px-8 sm:py-16"
                        >
                            <Image
                                src="/Assets/forms/checked.svg"
                                alt=""
                                width={80}
                                height={80}
                                priority
                            />
                            <div className="grid grid-cols-1 gap-2">
                                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                                    Successfully Signed In!
                                </h1>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Redirecting to your dashboard...
                                </p>
                            </div>
                            <BrandLoader size={32} label="Redirecting to your dashboard" />
                        </div>
                    </div>
                ) : (
                    <div className="border-none overflow-hidden bg-white flex-col dark:bg-zinc-950 gap-5 p-5 sm:p-8 rounded-3xl">
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
                                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-200">Sign In</h1>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Welcome back! Please sign in to continue.</p>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="text-zinc-900 dark:text-zinc-200 flex flex-col gap-4 p-8">
                            <div className="flex flex-col gap-4 my-2 py-2">
                                <FormButton
                                    type="button"
                                    onClick={signInWithGoogle}
                                    variant="primary"
                                    disabled={signinLoading}
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

                                    Sign in with Google
                                </FormButton>

                                <FormButton
                                    type="button"
                                    onClick={signInWithGithub}
                                    variant="primary"
                                    disabled={signinLoading}
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

                                    Sign in with Github
                                </FormButton>

                            </div>
                            <div className="flex items-center gap-2 my-2">
                                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">or</span>
                                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                            </div>
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

                            <FormButton
                                type="submit"
                                variant="secondary"
                                disabled={signinLoading || !form.email || !form.password}
                            >
                                {signinLoading ? (
                                    <>
                                        <Icon name="Loader" size={20} className="animate-spin" />
                                        <p>Sign In</p>
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </FormButton>


                        </form>
                        <div className="grid grid-cols-2 gap-3 border-t border-b border-zinc-200 dark:border-zinc-700 p-4">
                            <div className="flex items-center text-xs justify-center gap-1 text-zinc-500 dark:text-zinc-400">
                                <Link href="/signup" className="text-zinc-700 dark:text-gray-300 hover:underline">Sign Up for free</Link>
                            </div>

                            {/* forgot password */}
                            <div className="flex items-center text-xs justify-center gap-1 text-zinc-500 dark:text-zinc-400 border-l pl-3 border-l-zinc-200 dark:border-l-zinc-700">
                                <Link href="/#" className="text-zinc-700 dark:text-gray-300 hover:underline">Forgot your password?</Link>
                            </div>
                        </div>

                        <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center pt-5">
                            By signing in, you agree to our <Link href="/terms" className="text-zinc-700 dark:text-gray-300 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-zinc-700 dark:text-gray-300 hover:underline">Privacy Policy</Link>.
                        </div>
                    </div>
                )}
                <div className="hidden sm:flex items-center justify-center">
                    <div className="w-full text-7xl text-zinc-200 dark:text-zinc-700 uppercase font-extralight transform rotate-90 opacity-50">
                        <span className="text-yellow-500 dark:text-yellow-200">All</span> Beautful.
                    </div>
                </div>
            </section>
        </div>
    );
}
