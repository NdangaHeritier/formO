import { ChangeEventHandler } from "react"

type InputXTics= {
    name: string,
    value: string | number,
    placeholder: string,
    cols?: number,
    rows?: number,
    onChange: ChangeEventHandler<HTMLTextAreaElement>
}

export const TextAreaField = ({name, value, placeholder, cols = 4, rows = 4, onChange}:InputXTics) =>{
    return (
        <textarea
         className="border border-zinc-700 bg-zinc-800/50 py-2 px-4 rounded-md w-full outline-0 focus:ring-3 focus:ring-zinc-300/50"
         name={name}
         placeholder={placeholder}
         value={value}
         cols={cols}
         rows={rows}
         onChange={onChange}
        >
        </textarea>
    )
}