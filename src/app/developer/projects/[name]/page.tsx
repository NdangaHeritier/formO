"use client";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import { Icon } from "@/components/Global/Icon";
import SmallBtn from "@/components/Global/smallBtn";



import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProjectType } from "@/types/Project";

export default function ProjectPage (){
    const {name} = useParams();
    const [project, setProject] = useState<ProjectType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!name) return;
        fetch(`/api/projects/slug/${name}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { project?: ProjectType } | null) => {
                if (data?.project) {
                    setProject(data.project);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [name]);

    const stats = project?.submissionsStats;
    const topForms = [...(project?.forms ?? [])]
        .sort((a, b) => (b.submissionsCount ?? 0) - (a.submissionsCount ?? 0))
        .slice(0, 4);
    const recentSubmissions = project?.recentSubmissions ?? [];

    return (
        <DeveloperShell>
                    <div className="grid grid-cols-1 p-panel">
                        <div className="rounded-card bg-white p-panel dark:bg-zinc-950">
                            <div className="grid grid-cols-2 gap-1">
                                <div className="title-and-desc">
                                    <Icon name="Code2" strokeWidth={2} className="h-14 w-14 rounded-full bg-zinc-100 p-3 dark:bg-zinc-900"/>
                                    <h2 className="pt-3 pb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-200">
                                        {project?.name ?? name}
                                    </h2>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {project?.description ?? (loading ? "" : "No description provided yet.")}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 grid-rows-2 gap-5">
                                    <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">{project?.formsCount ?? project?.forms?.length ?? 0}</span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Forms</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">{stats?.total ?? 0}</span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Submissions</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">{stats?.sent ?? 0}</span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Delivered</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">{stats?.spam ?? 0}</span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Spam</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* charts and frequently used forms */}

                        <div className="grid grid-cols-2 gap-5 py-16">
                            <div className="chart flex items-center jutify-center">
                                <div className="flex items-center justify-center gap-5">
                                    <div className="h-40 w-40 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-900 grid-cols-2 grid-rows-2 grid gap-0.5 transform">
                                        <div className="bg-zinc-300 dark:bg-zinc-800" />
                                        <div className="bg-red-500/40" />
                                        <div className="bg-green-600/40" />
                                        <div className="bg-yellow-600/30" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-4 h-4 rounded-md bg-green-600/40"></span>
                                            Delivered Successfully. ({stats?.sent ?? 0})
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-4 h-4 rounded-md bg-yellow-600/30"></span>
                                            Delivered but failed to reach. ({stats?.failed ?? 0})
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-4 h-4 rounded-md bg-red-500/40"></span>
                                            Spams. ({stats?.spam ?? 0})
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-4 h-4 rounded-md bg-zinc-800"></span>
                                            Not Delivered ({stats?.pending ?? 0})
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* frequent activity tab */}

                            <div className="grid grid-cols-1">
                                <div className="title flex items-center justify-start gap-2 py-4 font-bold">
                                    <Icon size={16} strokeWidth={2} name="ClockFading" className="" />
                                    Freqently interacted Forms.
                                </div>
                                <div className="rounded-card bg-white dark:bg-zinc-950">
                                    <div className="sort-and-filters p-5 flex items-center justify-end gap-2">
                                        <span className="text-xs p-0.5 px-1 rounded-md border border-dashed border-zinc-300 text-green-600 dark:border-zinc-700">Filter by</span>
                                        <SmallBtn variant="secondary">
                                            <Icon name="CirclePlus" size={15} className="text-sm"/>
                                            project
                                        </SmallBtn>
                                        <SmallBtn variant="secondary">
                                            <Icon name="CirclePlus" size={15} className="text-sm"/>
                                            status
                                        </SmallBtn>
                                        <SmallBtn variant="secondary">
                                            <Icon name="CirclePlus" size={15} className="text-sm"/>
                                            submissions
                                        </SmallBtn >
                                    </div>
                                    <div className="p-2 h-40 w-full flex items-center justify-center">
                                        {topForms.length === 0 ? (
                                            "No data Found"
                                        ) : (
                                            <ul className="w-full flex flex-col gap-2 px-3">
                                                {topForms.map((form) => (
                                                    <li key={form.id} className="flex items-center justify-between text-sm rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-900">
                                                        <span className="truncate text-zinc-800 dark:text-zinc-300">{form.title}</span>
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{form.submissionsCount ?? 0} submissions</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent submissions.. */}

                        <div className="overflow-hidden rounded-card bg-white dark:bg-zinc-950">
                            <div className="head flex items-center border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 justify-start gap-2 p-5">
                                <Icon name="FileClock" className="" size={16} />
                                Recent Submissions
                            </div>
                            <div className="flex h-48 items-center justify-center bg-white p-card text-zinc-500 dark:bg-zinc-950">
                                {recentSubmissions.length === 0 ? (
                                    "No data found."
                                ) : (
                                    <ul className="w-full flex flex-col gap-2">
                                        {recentSubmissions.map((submission) => (
                                            <li key={submission.id} className="flex items-center justify-between text-sm rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-900">
                                                <span className="truncate text-zinc-800 dark:text-zinc-300">{submission.formTitle}</span>
                                                <span className="flex items-center gap-3">
                                                    <span className={
                                                        submission.status === "sent"
                                                            ? "text-green-500 text-xs"
                                                            : submission.status === "failed"
                                                                ? "text-red-500 text-xs"
                                                                : submission.status === "spam"
                                                                    ? "text-yellow-600 text-xs"
                                                                    : "text-zinc-500 text-xs"
                                                    }>
                                                        {submission.status}
                                                    </span>
                                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        {new Date(submission.createdAt).toLocaleString()}
                                                    </span>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
        </DeveloperShell>
    )
}


