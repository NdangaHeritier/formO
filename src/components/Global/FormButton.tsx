type Props = {
    type?: "button" | "submit",
    variant?: "primary" | "secondary" | "danger",
    onClick?: () => void,
    children: React.ReactNode,
    disabled?: boolean,
};

const FormButton = ({variant="primary",type="button",onClick, children, disabled = false}:Props) => {
    const variation ={
         primary:"dark:bg-white dark:hover:bg-white/70 dark:text-zinc-900 bg-black hover:bg-black/80 text-zinc-100",
        secondary: "bg-white hover:bg-zinc-200/8 text-zinc-900 border border-zinc-300 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 dark:border-none",
        danger: "bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/20"
    }
    return(
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${variation[variant]} ${disabled ? `opacity-40 cursor-not-allowed`: `cursor-pointer`} font-semibold duration-300 px-4 max-sm:px-3 py-2 rounded-md text-sm flex items-center justify-center gap-2`}
        >
            {children}                    
        </button>
    )
}

export default FormButton;