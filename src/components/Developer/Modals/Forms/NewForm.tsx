"use client";
import FormButton from "@/components/Global/FormButton";
import Layout from "../Layout";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import React, { useState } from "react";
import { TextAreaField } from "@/components/Global/TextAreaField";
import { SelectField } from "@/components/Global/SelectField";

// declare types
type Props= {
    project?: string,
    onClick : () => void
};
export default function NewForm ({project, onClick}:Props) {

    const [FormData, setFormData] = useState({
        project: '',
        title: '',
        description: 'hey there'
    });
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...FormData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!FormData.title || !FormData.description) {
            setError("Please fill in all fields.");
            return;
        }
        // TODO: Add authentication logic here
        alert("Email/Password sign-in not implemented. Connect your auth provider here.");
    };
    return(
        <Layout onClick={onClick}>
            <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Create New Form</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                    <b>Formo</b> forms are nothing but a block that specify where your real project forms will submit data to. take it as backend for your project form.
                </p>

                {/* form goes here */}
                <form onSubmit={handleSubmit} method="post" className="pt-5 grid grid-cols-1 gap-5">

                    {/* check for selected project */}
                    {project != undefined ? (
                        <SelectField name="project" value={FormData.project} onChange={handleChange} id="project" label="Select Project">
                            <option value={project}>{project}</option>
                        </SelectField>
                    ):(
                        <SelectField name="project" value={FormData.project} onChange={handleChange} id="project" label="Select Project">
                            <option value="Formo1">Formo 1</option>
                            <option value="Formo2">Formo 2</option>
                            <option value="Formo3">Formo 3</option>
                            <option value="Formo4">Formo 4</option>
                        </SelectField>
                    )}                    
                    <InputField
                        type="text"
                        name="title"
                        id="title"
                        value={FormData.title}
                        placeholder="Form Title"
                        onChange={handleChange}
                        label="Title"
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
                        <FormButton variant="primary">
                            <Icon name="Plus" size={16} strokeWidth={2} />
                            Add Form
                        </FormButton>
                    </div>
                </form>                
            </div>
        </Layout>
    )
}