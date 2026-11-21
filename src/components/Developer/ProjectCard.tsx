import { FormType, ProjectType } from "@/types/Project";
import { Icon } from "../Global/Icon";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import EditProject from "./Modals/Forms/EditProject";
import ConfirmDialog from "@/components/Global/ConfirmDialog";
import { toast } from "@/components/Global/Toast";

type cardProps = {
    id: ProjectType['id'];
    name:  ProjectType['name'];
    description:  ProjectType['description'];
    created?: ProjectType['created'];
    updated?: ProjectType['updated'];
    user?: ProjectType['user'];
    forms?: FormType[]; // Array of form IDs or titles
    formsCount?: number; // live count of active forms
    submissionsCount?: number; // live total submissions
    endpoint?: string | null; // latest form endpoint
    slug?: string; // project slug used for the card's route
    status: 'active' | 'archived';
    onChanged?: () => void; // refresh the projects list after menu actions
}
export default function ProjectCard ({name, description, forms, formsCount, submissionsCount, endpoint, slug, status, id, created, updated, onChanged}:cardProps) {
    const router = useRouter();
    const projectRoute = `/developer/projects/${encodeURIComponent(slug || name)}`;

    // ellipsis dropdown state
    const [menuOpen, setMenuOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const openProject = () => router.push(projectRoute);

    // Close the dropdown on outside click or Escape
    useEffect(() => {
        if (!menuOpen) return;
        const handleMouseDown = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [menuOpen]);

    const projectPayload: ProjectType = {
        id,
        name,
        slug,
        description: description ?? null,
        created: created ?? new Date().toISOString(),
        updated: updated ?? new Date().toISOString(),
        status,
    };

    const request = async (method: "PATCH" | "DELETE", body?: unknown) => {
        setBusy(true);
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method,
                headers: body ? { "Content-Type": "application/json" } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!res.ok) {
                const json = (await res.json().catch(() => null)) as { error?: string } | null;
                alert(json?.error || "Something went wrong");
                return false;
            }
            onChanged?.();
            return true;
        } catch {
            alert("Network error — please try again");
            return false;
        } finally {
            setBusy(false);
        }
    };

    const toggleArchive = async () => {
        setMenuOpen(false);
        const nextStatus = status === "active" ? "archived" : "active";
        await request("PATCH", { status: nextStatus });
    };

    const [pendingDelete, setPendingDelete] = useState(false);

    const deleteProject = () => {
        setMenuOpen(false);
        setPendingDelete(true);
    };

    const menuItemClass = "flex items-center justify-start gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-200 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

    return (
        <>
        <div
            className="project-card p-card bg-white dark:bg-black border border-zinc-200 dark:border-zinc-900 rounded-3xl shadow-lg grid grid-cols-1 gap-3 cursor-pointer"
            role="link"
            tabIndex={0}
            aria-label={`Open project ${name}`}
            onClick={openProject}
            onKeyDown={(e) => {
                if (e.key === "Enter") openProject();
            }}
        >
            <div className="flex items-start justify-between">
                <div className="details grid grid-cols-1 gap-2">
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{name}</h3>
                    <p className="text-sm text-zinc-700 dark:text-zinc-400">{description}</p>                   
                </div>
                <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        aria-label="Project menu"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        className="flex items-center h-10 w-10 justify-center rounded-full cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                        onClick={() => setMenuOpen((v) => !v)}
                    >
                        <Icon name='MoreHorizontal' size={16} className="" />
                    </button>
                    {menuOpen && (
                        <div
                            ref={menuRef}
                            role="menu"
                            className="absolute right-0 mt-2 w-44 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-20"
                        >
                            <button
                                type="button"
                                role="menuitem"
                                disabled={busy}
                                className={menuItemClass}
                                onClick={() => {
                                    setMenuOpen(false);
                                    openProject();
                                }}
                            >
                                <Icon name="SquareArrowUpRight" size={15} className="text-zinc-600 dark:text-zinc-500" />
                                Open Project
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                disabled={busy}
                                className={menuItemClass}
                                onClick={() => {
                                    setMenuOpen(false);
                                    setEditOpen(true);
                                }}
                            >
                                <Icon name="Settings" size={15} className="text-zinc-600 dark:text-zinc-500" />
                                Edit Project
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                disabled={busy}
                                className={menuItemClass}
                                onClick={toggleArchive}
                            >
                                <Icon
                                    name={status === "active" ? "FolderOpen" : "Folder"}
                                    size={15}
                                    className="text-zinc-600 dark:text-zinc-500"
                                />
                                {status === "active" ? "Archive" : "Restore"}
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                disabled={busy}
                                className="flex items-center justify-start gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 transition text-red-600 dark:text-red-400 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={deleteProject}
                            >
                                <Icon name="X" size={15} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
             {/* <div className="text-sm text-zinc-600 dark:text-zinc-500 flex items-center justify-between gap-1 py-2">
                <div className="">
                    <span className="flex items-center gap-1">
                    <Icon name="UserCircle" size={18} strokeWidth={2} className="text-yellow-600" />
                    {user?.name || 'Unknown'}
                </span>
                </div>
                <div className="text-end">{user?.email}</div>
            </div> */}
            <div className="active-and-created-at flex items-center justify-between py-5">
                <span className="bg-zinc-950 text-zinc-100 px-3 py-1 rounded-full text-xs font-medium dark:bg-zinc-50 dark:text-zinc-950">
                    {status}
                </span>
                <p className="text-xs text-zinc-700 dark:text-zinc-500">
                    Created <span className="text-zinc-200">{new Date().toLocaleDateString()}</span> {/* Replace with actual date */}
                </p>
            </div>
            <div className="form-details grid grid-cols-2 gap-">
                <p className="text-sm text-zinc-700 dark:text-zinc-400">
                    Forms: {formsCount ?? forms?.length ?? 0}
                </p>
                <p className="text-sm text-end text-zinc-700 dark:text-zinc-400">
                    Total Submissions: {submissionsCount ?? 0}
                </p>
            </div>
            <div className="latest-endpoint border-t border-zinc-300 dark:border-zinc-800 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="title-and-copy-endpoint-icon flex items-center justify-between py-3">
                    <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Latest Endpoint</h4>
                    {endpoint && (
                        <button className="flex items-center justify-center h-10 w-10 cursor-pointer rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition">
                            <Icon name="Copy" size={16} className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300 transition" onClick={() => {
                                navigator.clipboard.writeText(endpoint);
                                toast.success("Endpoint copied to clipboard", { duration: 2000 });
                            }} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-900/70 p-3 rounded-lg">
                    {/* <Icon name="Terminal" size={16} className="text-zinc-500" strokeWidth={2} /> */}
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{endpoint ?? 'No endpoint yet — add a form to this project'}</span>
                </div>
            </div>

            {/* Edit Project modal (opened from the ellipsis menu) */}
            {editOpen && (
                <div onClick={(e) => e.stopPropagation()}>
                    <EditProject
                        project={projectPayload}
                        onClick={() => setEditOpen(false)}
                        onSuccess={() => {
                            setEditOpen(false);
                            onChanged?.();
                        }}
                    />
                </div>
            )}
        </div>
        <ConfirmDialog
            open={pendingDelete}
            title={`Delete "${name}"?`}
            description="The project is archived and its forms stop accepting submissions. This cannot be undone from here."
            confirmLabel="Delete project"
            onCancel={() => setPendingDelete(false)}
            onConfirm={async () => {
                await request("DELETE");
                setPendingDelete(false);
            }}
        />
        </>
    )
}