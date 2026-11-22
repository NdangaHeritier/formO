"use client";
import FormButton from "@/components/Global/FormButton";
import Layout from "../Layout";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import { useToast } from "@/components/Global/Toast";
import React, { useEffect, useState } from "react";
import { TextAreaField } from "@/components/Global/TextAreaField";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

// declare types
type onClick= {onClick : () => void};
export default function NewDeveloperForm ({onClick}:onClick) {

    const [FormData, setFormData] = useState({
        name: '',
        description: ''
    });
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...FormData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!FormData.name.trim()) {
                toast.error("Project name is required");
                setLoading(false);
                return;
            }
            if (!currentUser) {
                toast.error("Please sign in to create a project");
                setLoading(false);
                return;
            }
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: FormData.name,
                    description: FormData.description,
                }),
            });
            const json = (await res.json()) as { error?: string };
            if (!res.ok) {
                toast.error(json.error || "Failed to create project");
                setLoading(false);
                return;
            }
            toast.success("Project created successfully");
            setFormData({
                name: '',
                description: ''
            });
            setLoading(false);
            router.refresh();
            onClick();
        }
        catch {
            toast.error("Failed to create project");
            setLoading(false);
        }
    }

    const { data: session, isPending } = useSession();
    const currentUser = session?.user ?? null;
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !currentUser) {
            router.push("/login");
        }
    }, [isPending, currentUser, router]);
    return(
        <Layout onClick={onClick} label="Create project">

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-3xl shadow-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Create New Project</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                Projects Let&apos;s you organize your forms well based on your real project for which you&apos;re adding forms to.
                </p>

                {/* form goes here */}
                <form method="post" onSubmit={handleSubmit} className="pt-5 grid grid-cols-1 gap-5">
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
                    <div className="actions grid grid-cols-2 gap-3">
                        <FormButton
                            onClick={onClick}
                            variant="danger"
                        >
                            Close
                        </FormButton>
                        <FormButton type="submit" variant="primary" disabled={loading}>
                            {loading ? <><Icon name="Loader" size={20} className="animate-spin" /> <span>Add Project</span></> : (
                                <>
                                    <Icon name="Plus" size={16} strokeWidth={2} />
                                    Add Project
                                </>
                            )}
                            
                        </FormButton>
                    </div>
                </form>                
            </div>
        </Layout>
    )
}