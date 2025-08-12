"use client";
import FormButton from "@/components/Global/FormButton";
import Layout from "../Layout";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import React, { useState } from "react";
import { TextAreaField } from "@/components/Global/TextAreaField";
import { useAuth } from "@/lib/Auth_context";
import { useRouter } from "next/navigation";
// import {db} from "@/lib/firebase";

// declare types
type onClick= {onClick : () => void};
export default function NewDeveloperForm ({onClick}:onClick) {

    const [FormData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [error, setError] = useState("");
    const [notification, setNotification] = useState<string>('');
    setError("null");
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...FormData, [e.target.name]: e.target.value });
    };

    const { currentUser, authLogin } = useAuth();
    const router = useRouter();

    if (!currentUser) {
        return null;
    }
    return(
        <Layout onClick={onClick}>

            {notification && (
                <div className="fixed top-5 z-50 p-3 rounded-lg right-5 inline-flex justify-start items-center gap-2 bg-white border border-zinc-300 shadow-lg dark:bg-black backdrop-blur-2xl dark:border-green-800">
                    <span className="" onClick={() => setNotification('')}>
                        <Icon name="CheckCircle" size={16} className="inline-flex self-center text-green-500"/>
                    </span>
                    <div className="text-green-500">
                        {notification}
                    </div>
                </div>
            )}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Create New Project</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                Projects Let&apos;s you organize your forms well based on your real project for which you&apos;re adding forms to.
                </p>

                {/* form goes here */}
                <form method="post" className="pt-5 grid grid-cols-1 gap-5">
                    <InputField
                        type="text"
                        name="name"
                        id="name"
                        value={FormData.name}
                        placeholder="Project name"
                        onChange={handleChange}
                        label="Project Name"
                     />

                     <TextAreaField
                        name="description"
                        cols={5}
                        id="desc"
                        label="Description"
                        placeholder="Description.."
                        value={FormData.description}
                        onChange={handleChange}
                    />
                     {error && (
                        <div className="text-red-500 text-xs">{error}</div>
                    )}
                    <div className="actions grid grid-cols-2 gap-3">
                        <FormButton
                            onClick={onClick}
                            variant="secondary"
                        >
                            Close
                        </FormButton>
                        <FormButton type="submit" variant="primary">
                            <Icon name="Plus" size={16} strokeWidth={2} />
                            Add Project
                        </FormButton>
                    </div>
                </form>                
            </div>
        </Layout>
    )
}