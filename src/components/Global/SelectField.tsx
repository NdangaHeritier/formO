import { ChangeEventHandler, ReactNode } from "react"

type InputXTics= {
    name: string,
    value: string | number,
    options: ReactNode,
    onChange: ChangeEventHandler<HTMLSelectElement>
}

export const SelectField = ({name, value, options, onChange}:InputXTics) =>{
    return (
        <select
         className="border border-zinc-700 bg-zinc-800/50 py-2 px-4 rounded-md w-full outline-0 focus:ring-3 focus:ring-zinc-300/50"
         name={name}
         value={value}
         onChange={onChange}
        >
            {options}
        </select>
    )
}