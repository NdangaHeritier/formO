"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import PrivateRouter from "@/components/Global/privateRouter";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import DeveloperBreadcrumb from "@/components/Developer/DeveloperBreadcrumb";
import ProjectCard from "@/components/Developer/ProjectCard";
import NewDeveloperForm from "@/components/Developer/Modals/Forms/NewDeveloper";
import EditProject from "@/components/Developer/Modals/Forms/EditProject";
import { Squares } from "@/components/Global/Squares";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import ConfirmDialog from "@/components/Global/ConfirmDialog";
import { SkeletonGrid, SkeletonTableRows } from "@/components/Global/Skeleton";
import { ProjectType } from "@/types/Project";

type StatusTab = "all" | "active" | "archived";
type ViewMode = "grid" | "list";

// "2h ago" style timestamps, absolute date on hover (title attr)
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const Projects = () => {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [view, setView] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");

  // create / edit modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectType | null>(null);

  // row ellipsis menu
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectType | null>(null);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const loadProjects = useCallback(() => {
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { projects?: ProjectType[] } | null) => {
        if (data?.projects) {
          setProjects(data.projects);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // close the row menu on outside click or Escape
  useEffect(() => {
    if (!menuProjectId) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuProjectId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuProjectId(null);
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuProjectId]);

  const counts = useMemo(
    () => ({
      all: projects.length,
      active: projects.filter((p) => p.status === "active").length,
      archived: projects.filter((p) => p.status === "archived").length,
    }),
    [projects]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesTab = tab === "all" || p.status === tab;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [projects, tab, query]);

  const openProject = (project: ProjectType) =>
    router.push(`/developer/projects/${encodeURIComponent(project.slug || project.name)}`);

  const rowRequest = async (
    project: ProjectType,
    method: "PATCH" | "DELETE",
    body?: unknown
  ) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        alert(json?.error || "Something went wrong");
        return false;
      }
      loadProjects();
      return true;
    } catch {
      alert("Network error — please try again");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toggleArchive = (project: ProjectType) => {
    setMenuProjectId(null);
    const nextStatus = project.status === "active" ? "archived" : "active";
    rowRequest(project, "PATCH", { status: nextStatus });
  };

  const deleteProject = (project: ProjectType) => {
    setMenuProjectId(null);
    setPendingDelete(project);
  };

  const tabs: { key: StatusTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "archived", label: "Archived" },
  ];

  const tabClass = (key: StatusTab) =>
    `px-3 py-1 rounded-md text-sm cursor-pointer transition ${
      tab === key
        ? "bg-zinc-950 text-zinc-100 dark:bg-zinc-50 dark:text-zinc-950"
        : "text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-900"
    }`;

  const viewButtonClass = (mode: ViewMode) =>
    `h-8 w-8 flex items-center justify-center rounded-md cursor-pointer transition ${
      view === mode
        ? "bg-zinc-950 text-zinc-100 dark:bg-zinc-50 dark:text-zinc-950"
        : "text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-900"
    }`;

  const menuItemClass =
    "flex items-center justify-start gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-200 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <DeveloperShell>
      <DeveloperBreadcrumb
        navs={[
          { label: "Home", href: "/" },
          { label: "Developer", href: "/developer" },
          { label: "Projects", href: "/developer/projects" },
        ]}
      />

      {/* display createProjectModel */}
      {createOpen && (
        <NewDeveloperForm
          onClick={() => {
            setCreateOpen(false);
            loadProjects();
          }}
        />
      )}

      {/* display EditProject model (from row menu) */}
      {editProject && (
        <EditProject
          project={editProject}
          onClick={() => setEditProject(null)}
          onSuccess={() => {
            setEditProject(null);
            loadProjects();
          }}
        />
      )}

      {/* Page */}
      <section className="dashboard bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 p-5 grid grid-cols-1 gap-y-10">
        <div className="relative rounded-2xl">
          <Squares parLength={100} />
          <div className="projects relative z-10 grid grid-cols-1 gap-card bg-gradient-to-tr from-zinc-100 to-zinc-100/50 dark:from-zinc-950 from-80% to-20% dark:to-zinc-950/50 rounded-card p-panel">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="title text-xl font-bold">Projects</div>
                <span className="text-xs font-medium bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
                  {counts.all}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* search */}
                <div className="relative">
                  <Icon
                    name="Search"
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search projects…"
                    className="h-9 w-52 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 ps-9 pe-3 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-500 transition"
                  />
                </div>

                {/* status tabs */}
                <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 rounded-md p-1">
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      className={tabClass(t.key)}
                    >
                      {t.label} <span className="text-xs opacity-70">{counts[t.key]}</span>
                    </button>
                  ))}
                </div>

                {/* grid / list toggle */}
                <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 rounded-md p-1">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    aria-pressed={view === "grid"}
                    className={viewButtonClass("grid")}
                  >
                    <Icon name="LayoutGrid" size={16} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    aria-label="List view"
                    aria-pressed={view === "list"}
                    className={viewButtonClass("list")}
                  >
                    <Icon name="List" size={16} strokeWidth={2} />
                  </button>
                </div>

                <FormButton type='button' variant='primary' onClick={() => setCreateOpen(true)}>
                  <Icon name="Plus" size={15} className="text-zinc-200 dark:text-zinc-800" />
                  New Project
                </FormButton>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              /* skeletons — shaped like the active view */
              view === "list" ? (
                <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black shadow-lg">
                  <SkeletonTableRows rows={5} />
                </div>
              ) : (
                <SkeletonGrid count={6} />
              )
            ) : loadError ? (
              <div className="text-center text-zinc-500 p-10 flex flex-col items-center gap-4">
                <Icon name="Slash" size={32} className="text-zinc-400" />
                Couldn&apos;t load projects.
                <FormButton type='button' variant='secondary' onClick={loadProjects}>
                  <Icon name="RefreshCcw" size={15} className="text-zinc-700 dark:text-zinc-400" />
                  Retry
                </FormButton>
              </div>
            ) : filtered.length === 0 ? (
              projects.length === 0 ? (
                /* real empty state */
                <div className="text-center text-zinc-500 p-10 flex flex-col items-center gap-4">
                  <span className="h-16 w-16 flex items-center justify-center rounded-full bg-yellow-600/20 text-yellow-600">
                    <Icon name="FolderPlus" size={28} />
                  </span>
                  <div>
                    <div className="font-semibold text-zinc-700 dark:text-zinc-300">No projects yet</div>
                    <p className="text-sm mt-1">Create your first project to start collecting form submissions.</p>
                  </div>
                  <FormButton type='button' variant='primary' onClick={() => setCreateOpen(true)}>
                    <Icon name="Plus" size={15} className="text-zinc-200 dark:text-zinc-800" />
                    Create your first project
                  </FormButton>
                </div>
              ) : (
                /* filtered-empty state */
                <div className="text-center text-zinc-500 p-10 flex flex-col items-center gap-3">
                  <Icon name="Search" size={28} className="text-zinc-400" />
                  No projects match {query ? `"${query}"` : "this filter"}.
                  <FormButton
                    type='button'
                    variant='secondary'
                    onClick={() => {
                      setQuery("");
                      setTab("all");
                    }}
                  >
                    <Icon name="RefreshCcw" size={15} className="text-zinc-700 dark:text-zinc-400" />
                    Reset filters
                  </FormButton>
                </div>
              )
            ) : view === "grid" ? (
              /* Grid view — same cards as the dashboard */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    slug={project.slug}
                    description={project.description}
                    user={project.user}
                    forms={project.forms}
                    formsCount={project.formsCount}
                    submissionsCount={project.submissionsCount}
                    endpoint={project.latestFormEndpoint}
                    created={project.created}
                    updated={project.updated}
                    status={project.status}
                    onChanged={loadProjects}
                  />
                ))}
              </div>
            ) : (
              /* List view — data table */
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black shadow-lg">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide">
                      <th scope="col" className="px-5 py-3 text-start font-semibold">Project</th>
                      <th scope="col" className="px-5 py-3 text-start font-semibold">Status</th>
                      <th scope="col" className="px-5 py-3 text-start font-semibold">Forms</th>
                      <th scope="col" className="px-5 py-3 text-start font-semibold">Submissions</th>
                      <th scope="col" className="px-5 py-3 text-start font-semibold">Updated</th>
                      <th scope="col" className="px-5 py-3 text-end font-semibold"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((project) => (
                      <tr
                        key={project.id}
                        className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition cursor-pointer"
                        onClick={() => openProject(project)}
                      >
                        <td className="px-5 py-4 max-w-xs">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{project.name}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {project.description ?? "No description"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="bg-zinc-950 text-zinc-100 px-3 py-1 rounded-full text-xs font-medium dark:bg-zinc-50 dark:text-zinc-950">
                            {project.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-zinc-700 dark:text-zinc-400 whitespace-nowrap">
                          {project.formsCount ?? project.forms?.length ?? 0}
                        </td>
                        <td className="px-5 py-4 text-zinc-700 dark:text-zinc-400 whitespace-nowrap">
                          {project.submissionsCount ?? 0}
                        </td>
                        <td
                          className="px-5 py-4 text-zinc-700 dark:text-zinc-400 whitespace-nowrap"
                          title={new Date(project.updated).toLocaleString()}
                        >
                          {relativeTime(project.updated)}
                        </td>
                        <td className="px-5 py-4 text-end" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block text-left" ref={menuProjectId === project.id ? menuRef : undefined}>
                            <button
                              type="button"
                              aria-label={`Project menu for ${project.name}`}
                              aria-haspopup="menu"
                              aria-expanded={menuProjectId === project.id}
                              className="h-8 w-8 flex items-center justify-center rounded-full cursor-pointer text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                              onClick={() =>
                                setMenuProjectId((current) => (current === project.id ? null : project.id))
                              }
                            >
                              <Icon name="MoreHorizontal" size={16} />
                            </button>
                            {menuProjectId === project.id && (
                              <div
                                role="menu"
                                className="absolute right-0 mt-2 w-44 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50"
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  disabled={busy}
                                  className={menuItemClass}
                                  onClick={() => {
                                    setMenuProjectId(null);
                                    openProject(project);
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
                                    setMenuProjectId(null);
                                    setEditProject(project);
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
                                  onClick={() => toggleArchive(project)}
                                >
                                  <Icon
                                    name={project.status === "active" ? "FolderOpen" : "Folder"}
                                    size={15}
                                    className="text-zinc-600 dark:text-zinc-500"
                                  />
                                  {project.status === "active" ? "Archive" : "Restore"}
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  disabled={busy}
                                  className="flex items-center justify-start gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 transition text-red-600 dark:text-red-400 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  onClick={() => deleteProject(project)}
                                >
                                  <Icon name="X" size={15} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.name ?? ""}"?`}
        description="The project is archived and its forms stop accepting submissions. This cannot be undone from here."
        confirmLabel="Delete project"
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await rowRequest(pendingDelete, "DELETE");
          setPendingDelete(null);
        }}
      />
    </DeveloperShell>
  );
};

export default Projects;
