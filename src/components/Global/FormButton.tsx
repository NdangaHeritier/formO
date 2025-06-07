type Props = {
    type?: "button" | "submit",
    variant?: "primary" | "secondary",
    onClick?: () => void,
    children: React.ReactNode,
};

const FormButton = ({variant="primary",type="button",onClick, children}:Props) => {
    const variation ={
         primary:"dark:bg-white dark:hover:bg-white/70 dark:text-zinc-900 bg-black hover:bg-black/80 text-zinc-100",
        secondary: "bg-white hover:bg-zinc-200/8 text-zinc-900 border border-zinc-300 dark:bg-black dark:hover:bg-zinc-200/5 dark:text-zinc-200 dark:border-zinc-700"
    }
    return(
        <button
            type={type}
            onClick={onClick}
            className={`${variation[variant]} font-semibold duration-300 px-4 py-2 rounded-md text-sm flex items-center justify-center gap-2 cursor-pointer`}
        >
            {children}                    
        </button>
    )
}

export default FormButton;