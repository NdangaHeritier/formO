
import Link from "next/link"
type Props = {
    variant?: "primary" | "secondary",
    children: React.ReactNode,
    href: string
};

export default function LinkButton ({variant="primary", children, href}:Props) {
    const variation ={
        primary:"bg-white hover:bg-white/70 text-zinc-900",
        secondary: "bg-black hover:bg-zinc-200/5 text-zinc-200 border border-zinc-700"
    }
    return(
        <Link
            href={href}
            className={`${variation[variant]} font-semibold duration-300 px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2`}
        >
            {children}                    
        </Link>
    )
}