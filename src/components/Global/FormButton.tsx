type Props = {
    type?: "button" | "submit",
    variant?: "primary" | "secondary",
    onClick?: () => void,
    children: React.ReactNode,
};

const FormButton = ({variant="primary",type="button",onClick, children}:Props) => {
    const variation ={
        primary:"bg-white hover:bg-white/70 text-zinc-900",
        secondary: "bg-black hover:bg-zinc-200/5 text-zinc-200 border border-zinc-700"
    }
    return(
        <button
            type={type}
            onClick={onClick}
            className={`${variation[variant]} font-semibold duration-300 px-4 py-2 rounded-md text-sm flex items-center justify-center gap-4 cursor-pointer`}
        >
            {children}                    
        </button>
    )
}

export default FormButton;