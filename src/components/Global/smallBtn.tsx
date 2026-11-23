type Props = {
    type?: "button" | "submit",
    variant?: "primary" | "secondary" | "ghost",
    onClick?: () => void,
    children: React.ReactNode,
    disabled?: boolean,
};

const SmallBtn = ({variant="primary",type="button",onClick, children, disabled = false}:Props) => {
    const variation ={
         primary:"dark:bg-white dark:hover:bg-white/70 dark:text-zinc-900 bg-black hover:bg-black/80 text-zinc-100",
        secondary: "bg-white hover:bg-zinc-200/8 text-zinc-900 border border-zinc-200 dark:bg-black/25 dark:hover:bg-zinc-200/5 dark:text-zinc-200 dark:border-zinc-900",
        ghost: "bg-transparent text-zinc-500 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    }
    return(
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${variation[variant]} ${disabled ? `opacity-40 cursor-not-allowed`: `cursor-pointer`} font-semibold duration-300 px-1.5 py-1 rounded-lg text-sm flex items-center justify-center gap-1 max-sm:min-h-10 max-sm:px-3`}
        >
            {children}                    
        </button>
    )
}

export default SmallBtn;