"use client";
import React, { useState } from 'react';
import SmallBtn from './smallBtn';

type InputXTics= {
    type: string,
    name: string,
    id?: string,
    value: string | number,
    placeholder: string,
    autoComplete?: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>)=>void,
    label?: string
}

export const InputField = ({type, name, id, value, placeholder, autoComplete, onChange, label}:InputXTics) =>{
    const isPasswordField = type === 'password' ? true : false;
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="grid grid-cols-1 gap-1">
            {label && (
                <label htmlFor={id} className="text-zinc-900 dark:text-zinc-100 font-semibold capitalize">
                    {label}
                </label>
            )}
            
            {/* check if is password field */}
            {isPasswordField ? (
                <div className="relative">
                <input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    className="border border-zinc-300 bg-zinc-100/80 dark:border-zinc-700 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 py-2 px-4 rounded-md w-full outline-0 focus:border-zinc-900 focus:ring-zinc-600/40 dark:focus:border-zinc-100 focus:ring-3 dark:focus:ring-zinc-300/40"
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                />
                <div className="absolute top-0 right-0 bottom-0 flex items-center p-2">
                    <SmallBtn type="button" variant="secondary" onClick={() => setShowPassword(!showPassword)}>
                        {isPasswordField && (showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-zinc-600 dark:text-zinc-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-zinc-600 dark:text-zinc-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178a1.012 1.012 0 010 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        ))}
                    </SmallBtn>
                </div>
            </div>):(
                <input
                    id={id}
                    type={type}
                    className="border border-zinc-300 bg-zinc-100/80 dark:border-zinc-700 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 py-2 px-4 rounded-md w-full outline-0 focus:border-zinc-900 focus:ring-zinc-600/40 dark:focus:border-zinc-100 focus:ring-3 dark:focus:ring-zinc-300/40"
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                />
            )}
        </div>
    )
}