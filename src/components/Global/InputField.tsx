import { ChangeEventHandler } from "react"

type InputXTics= {
    type: string,
    name: string,
    value: string | number,
    placeholder: string,
    autoComplete?: string,
    onChange: ChangeEventHandler<HTMLInputElement>
}

export const InputField = ({type, name, value, placeholder, autoComplete, onChange}:InputXTics) =>{
    return (
        <input
         type={type}
         className="border border-zinc-700 bg-zinc-800/50 py-2 px-4 rounded-md w-full outline-0 focus:ring-3 focus:ring-zinc-300/50"
         name={name}
         placeholder={placeholder}
         value={value}
         onChange={onChange}
         autoComplete={autoComplete}
        />
    )
}