import { ChangeEventHandler, ReactNode } from "react"

type InputXTics= {
    name: string,
    id?: string,
    value: string | number,
    options: ReactNode,
    onChange: ChangeEventHandler<HTMLSelectElement>,
    label?: string,
}

export const SelectField = ({name, id, value, options, onChange, label}:InputXTics) =>{
    return (
        <div className="grid grid-cols-1 gap-1">
            {label && (
                <label htmlFor={id} className="text-zinc-900 dark:text-zinc-100 font-semibold capitalize">
                    {label}
                </label>
            )}
            <select
            className="border border-zinc-300 bg-zinc-200/50 dark:border-zinc-700 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 py-2 px-4 rounded-md w-full outline-0 focus:border-zinc-900 focus:ring-zinc-600/50 dark:focus:border-zinc-100 focus:ring-3 dark:focus:ring-zinc-300/40"
            name={name}
            value={value}
            onChange={onChange}
            >
                {options}
            </select>
        </div>
    )
}