"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Header from "@/components/Header";
import PrivateRouter from "@/components/Global/privateRouter";
import { Icon } from "@/components/Global/Icon";
import Tooltip from "@/components/Global/Tooltip";
import NewForm from "@/components/Developer/Modals/Forms/NewForm";
import AccountSettingsModal from "@/components/Developer/Modals/Settings/AccountSettingsModal";
import ProjectPickerModal from "@/components/Developer/Modals/Settings/ProjectPickerModal";

const RAIL_LINK =
  "flex cursor-pointer items-center justify-center gap-2 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200";
const RAIL_BUTTON =
  "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

/** Shared developer shell: left icon rail + drag grip + main scrollable column. */
export default function DeveloperShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pickingProject, setPickingProject] = useState(false);
  const [formProject, setFormProject] = useState<string | undefined>();
  const [accountOpen, setAccountOpen] = useState(false);

  // FolderOpen only makes sense outside a specific project.
  const insideProject = /^\/developer\/projects\/[^/]+/.test(pathname);

  return (
    <PrivateRouter>
      <section className="flex min-h-screen w-full flex-col text-zinc-700 dark:text-zinc-400">
        <Header />
        <div className="flex h-full flex-1">
          <div className="grid grid-cols-1 sticky bottom-0 h-screen w-20 grid-cols-1 overflow-auto border-r border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="items-center justify-start flex-col p-3 flex gap-3">
              <Tooltip label="Projects">
                <Link href="/developer/projects" className={RAIL_LINK}>
                  <Icon name="LayoutDashboard" size={20} strokeWidth={2} />
                </Link>
              </Tooltip>
              <Tooltip label="Analytics">
                <Link href="/developer/analytics" className={RAIL_LINK}>
                  <Icon name="ChartNoAxesColumn" size={20} strokeWidth={2} />
                </Link>
              </Tooltip>
              <Tooltip label="Forms">
                <Link href="/developer/forms" className={RAIL_LINK}>
                  <Icon name="SquareCode" size={20} strokeWidth={2} />
                </Link>
              </Tooltip>
              <Tooltip label="Templates">
                <Link href="/developer/templates" className={RAIL_LINK}>
                  <Icon name="Mail" size={20} strokeWidth={2} />
                </Link>
              </Tooltip>
              <Tooltip label="Settings">
                <Link href="/developer/settings" className={RAIL_LINK}>
                  <Icon name="Settings" size={20} strokeWidth={2} />
                </Link>
              </Tooltip>
            </div>
            <div className="flex h-full flex-col items-center justify-end gap-2 self-end p-2">
              <Tooltip label="New form">
                <button type="button" className={RAIL_BUTTON} onClick={() => setPickingProject(true)}>
                  <Icon name="Plus" strokeWidth={2} size={22} />
                </button>
              </Tooltip>
              {!insideProject && (
                <Tooltip label="Browse projects">
                  <button type="button" className={RAIL_BUTTON} onClick={() => router.push("/developer/projects")}>
                    <Icon name="FolderOpen" strokeWidth={2} size={22} />
                  </button>
                </Tooltip>
              )}
              <Tooltip label="Project settings">
                <button type="button" className={RAIL_BUTTON} onClick={() => router.push("/developer/settings")}>
                  <Icon name="Bolt" strokeWidth={2} size={22} />
                </button>
              </Tooltip>
              <Tooltip label="Account settings">
                <button type="button" className={RAIL_BUTTON} onClick={() => setAccountOpen(true)}>
                  <Image
                    src="/Assets/Avatars/Sleep Mode.png"
                    alt=""
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                </button>
              </Tooltip>
            </div>
          </div>
          <div className="re-size relative h-screen">
            <button className="absolute top-20 -left-3" aria-label="Resize panel">
              <Icon name="FlipHorizontal" className="flex h-6 w-6 cursor-col-resize items-center justify-center rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-700 dark:bg-zinc-900 dark:hover:text-zinc-200" />
            </button>
          </div>
          <div className="flex-1 h-screen overflow-auto block">
            <div className="p-10 grid grid-cols-1">{children}</div>
          </div>
        </div>
      </section>
      {pickingProject && (
        <ProjectPickerModal
          onClose={() => setPickingProject(false)}
          onPick={(projectId) => {
            setPickingProject(false);
            setFormProject(projectId);
          }}
        />
      )}
      {formProject && (
        <NewForm
          project={formProject}
          onClick={() => setFormProject(undefined)}
          onSuccess={() => setFormProject(undefined)}
        />
      )}
      {accountOpen && <AccountSettingsModal onClose={() => setAccountOpen(false)} />}
    </PrivateRouter>
  );
}
