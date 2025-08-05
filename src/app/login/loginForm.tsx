"use client";
import { useState } from "react";
import { useEffect } from "react";
import { Icon } from "@/components/Global/Icon";
import FormButton from "@/components/Global/FormButton";
import { InputField } from "@/components/Global/InputField";
import Header from "@/components/Header";
import { useAuth } from "@/lib/Auth_context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginForm() {
    const { signin, currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [signinLoading, setSigninLoading] = useState(false);

    const router = useRouter();
    // Redirect to dashboard if user is already logged in
    useEffect(() => {
        if (currentUser) {
            router.push("/dashboard");
        }
    }, [currentUser, router]);

    // Dummy Google sign-in handler
    const signInWithGoogle = async () => {
        // This function should handle Google sign-in logic
        // For now, it just alerts the user
        alert("Google Sign-In not implemented. Connect your auth provider here.");
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

        try{
            await signin(form.email, form.password);
            setSigninLoading(false);
            // Redirect to the dashboard or home page after successful sign-in
            router.push("/dashboard");            
        }
        catch (err) {
            setSigninLoading(false);
            if (err instanceof Error) {
                setError("Incorrect email or password. Please try again.");
                console.info(err);
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Icon name="Loader" size={50} className="animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="">
            <title>Login</title>
            <Header />
            <section className="grid grid-cols-1 grid-row-1 sm:grid-cols-3 min-h-screen">
                <div className="hidden sm:block"></div>
                <div className="border-r border-l overflow-hidden border-zinc-700 bg-zinc-950 flex-col gap-5 p-5 sm:p-8">
                    <div className="w-full flex p-5 items-start justify-start border-b-zinc-700 gap-4">
                        <div className="">
                            <Image
                                src="/Assets/formo-coloured.png"
                                alt="Formo"
                                className="h-10 w-auto border-2 rounded-md border-yellow-200/20"
                                height={60}
                                width={60} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-semibold text-zinc-200">Sign In</h1>
                            <p className="text-sm text-zinc-500">Welcome back! Please sign in to continue.</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="text-zinc-200 flex flex-col gap-4 p-8">
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
                        {error && (
                            <div className="text-red-500 text-xs">{error}</div>
                        )}
                        <FormButton
                            type="submit"
                            variant="secondary"
                            disabled={signinLoading || !form.email || !form.password}
                        >
                            {signinLoading ? (
                                <Icon name="Loader" size={20} className="animate-spin" />
                            ) : (
                                "Sign In"
                            )}
                        </FormButton>
                        <div className="flex items-center gap-2 my-2">
                            <div className="flex-1 h-px bg-zinc-700" />
                            <span className="text-xs text-zinc-500">or</span>
                            <div className="flex-1 h-px bg-zinc-700" />
                        </div>
                        <FormButton
                            type="button"
                            onClick={signInWithGoogle}
                            variant="primary"
                            disabled={signinLoading}
                        >
                            <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block">
                                <g>
                                    <path fill="#4285F4" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.3-5.7 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c2.6 0 5 .8 7 2.3l5.7-5.7C33.5 6.5 28.9 4.5 24 4.5 13.5 4.5 5 13 5 23.5S13.5 42.5 24 42.5c10.2 0 18.5-8.3 18.5-18.5 0-1.2-.1-2.1-.3-3z"/>
                                    <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.3 16.1 18.8 13 24 13c2.6 0 5 .8 7 2.3l5.7-5.7C33.5 6.5 28.9 4.5 24 4.5c-7.2 0-13.2 4.1-16.2 10.2z"/>
                                    <path fill="#FBBC05" d="M24 42.5c5.4 0 10.1-1.8 13.5-4.9l-6.2-5.1c-1.8 1.3-4.1 2.1-7.3 2.1-5.6 0-10.3-3.7-12-8.7l-6.6 5.1C10.8 39.1 16.9 42.5 24 42.5z"/>
                                    <path fill="#EA4335" d="M43.6 20.5h-1.9V20H24v8h11.3c-0.7 2-2.1 3.7-4.1 4.9l6.2 5.1c3.6-3.3 5.6-8.1 5.6-13.5 0-1.2-.1-2.1-.3-3z"/>
                                </g>
                            </svg>
                            Sign in with Google
                        </FormButton>
                    </form>
                    <div className="grid grid-cols-2 gap-3 border-t border-b border-zinc-700 p-4">
                        <div className="flex items-center text-xs justify-center gap-1 text-zinc-500">
                            <Link href="/signup" className="text-gray-300 hover:underline">Sign Up for free</Link>
                        </div>

                        {/* forgot password */}
                        <div className="flex items-center text-xs justify-center gap-1 text-zinc-500 border-l pl-3 border-l-zinc-700">
                            <Link href="/#" className="text-gray-300 hover:underline">Forgot your password?</Link>
                        </div>
                    </div>

                    <div className="text-xs text-zinc-500 text-center pt-5">
                        By signing in, you agree to our <Link href="/terms" className="text-gray-300 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-gray-300 hover:underline">Privacy Policy</Link>.
                    </div>
                </div>
                <div className="hidden sm:block"></div>
            </section>
        </div>
    );
}