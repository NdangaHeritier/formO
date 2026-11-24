import LoginForm from "./loginForm";
import { authErrorMessage, type AuthErrorParams } from "@/lib/auth-error";

export const metadata = {
  title: 'Welcome back | Sign in to FormO',
  description: 'Sign in to FormO and continue inventing your email workflows.',
};

export default async function Login({ searchParams }: { searchParams: Promise<AuthErrorParams> }) {
    const message = authErrorMessage(await searchParams);
    return <LoginForm authError={message} />;
}
