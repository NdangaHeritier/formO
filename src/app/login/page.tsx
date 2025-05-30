"use client";
import { useState } from "react";
import { useEffect } from "react";
import { Icon } from "@/components/Global/Icon";
import FormButton from "@/components/Global/FormButton";
import { InputField } from "@/components/Global/InputField";

// Dummy Google sign-in handler (replace with real auth logic)
const signInWithGoogle = async () => {
    // TODO: Integrate with your auth provider (e.g., Firebase, NextAuth, etc.)
    alert("Google Sign-In not implemented. Connect your auth provider here.");
};

const Login = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        if (!form.email || !form.password) {
            setError("Please fill in all fields.");
            return;
        }
        // TODO: Add authentication logic here
        alert("Email/Password sign-in not implemented. Connect your auth provider here.");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Icon name="Loader" size={50} className="animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <section className="flex items-center justify-center">
            <div className="border overflow-hidden border-zinc-700 rounded-md bg-zinc-950 shadow-2xl flex flex-col gap-5">
                <div className="bg-zinc-900/30 w-full flex p-8 items-center justify-center border-b border-b-zinc-700 gap-4">
                    <Icon name="User" size={40} className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800 shadow-lg text-yellow-600" />
                    <h2 className="text-xl text-zinc-100 font-bold">Sign in to Formo</h2>
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
                    >
                        Sign In
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
            </div>
        </section>
    );
};

export default Login;