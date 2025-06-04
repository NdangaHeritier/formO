import { ChangeEventHandler } from "react"

type InputXTics= {
    type: string,
    name: string,
    id?: string,
    value: string | number,
    placeholder: string,
    autoComplete?: string,
    onChange: ChangeEventHandler<HTMLInputElement>,
    label?: string
}

export const InputField = ({type, name, id, value, placeholder, autoComplete, onChange, label}:InputXTics) =>{
    return (
        <div className="grid grid-cols-1 gap-1">
            {label && (
                <label htmlFor={id} className="text-zinc-900 dark:text-zinc-100 font-semibold capitalize">
                    {label}
                </label>
            )}
            <input
                id={id}
                type={type}
                className="border border-zinc-300 bg-zinc-200/50 dark:border-zinc-700 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 py-2 px-4 rounded-md w-full outline-0 focus:border-zinc-900 focus:ring-zinc-600/50 dark:focus:border-zinc-100 focus:ring-3 dark:focus:ring-zinc-300/40"
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                />
        </div>
    )
}