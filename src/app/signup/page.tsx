import SignupForm from "./signupForm";
import { authErrorMessage, type AuthErrorParams } from "@/lib/auth-error";

export const metadata = {
  title: 'Create Free Account | Sign up to FormO',
  description: 'Sign up to FormO and simplify your email workflows.',
};

export default async function Signup({ searchParams }: { searchParams: Promise<AuthErrorParams> }) {
    const message = authErrorMessage(await searchParams);
    return <SignupForm authError={message} />;
}
