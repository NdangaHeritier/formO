import Link from "next/link";
import { ChevronRight, User2 } from "lucide-react";
import DeveloperSubMenu from "./DeveloperSubMenu";
import { useState } from "react";
import NewDeveloperForm from "./Modals/Forms/NewDeveloper";
import NewForm from "./Modals/Forms/NewForm";
    

export default function DeveloperBreadcrumb({
  navs
}: {
  navs: { label: string; href?: string }[];
  onCreate?: () => void;
  createLabel?: string;
}) {

  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  return (
    <div className="w-full sticky top-0 z-40 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 py-3 px-4 grid grid-cols-2 gap-5">
      <nav className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 text-sm">
        <div className="first p-1">
          <span className="h-10 w-10 border-zinc-700/70 bg-zinc-200 dark:bg-zinc-900 rounded-full flex items-center justify-center">
              <User2 className="text-zinc-700 dark:text-zinc-300" />
          </span>
        </div>
        {navs.map((nav, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-4 h-4 text-zinc-400" />}
            {nav.href ? (
              <Link href={nav.href} className="hover:underline text-zinc-900 dark:text-zinc-100 font-medium">{nav.label}</Link>
            ) : (
              <span className="text-zinc-500">{nav.label}</span>
            )}
          </span>
        ))}
      </nav>
      <DeveloperSubMenu
        navs={[
          { label: "Projects", href: "/developer/projects" },
          { label: "Forms", href: "/developer/forms" },
          { label: "Analytics", href: "/developer/analytics" },
          { label: "Settings", href: "/developer/settings" },
        ]}
        onSelect={(value) => {
          if (value === "project") {
            setShowProjectModal(true);
            setShowFormModal(false);
          } else {
            setShowProjectModal(false);
            setShowFormModal(true);
          }
        }}
      />
      {showProjectModal && (        
        <NewDeveloperForm onClick={() => setShowProjectModal(false)} />
      )}
      {showFormModal && (        
        <NewForm onClick={() => setShowFormModal(false)} />
      )}
    </div>
  );
}
