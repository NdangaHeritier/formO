import Link from "next/link";
import { ChevronRight, User2 } from "lucide-react";
import DeveloperSubMenu from "./DeveloperSubMenu";
import { useState } from "react";
    

export default function DeveloperBreadcrumb({
  navs
}: {
  navs: { label: string; href?: string }[];
  onCreate?: () => void;
  createLabel?: string;
}) {

  
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="w-full sticky top-0 z-50 bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 py-3 px-4 grid grid-cols-2 gap-5">
      <nav className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 text-sm">
        <div className="first p-1">
          <span className="h-10 w-10 border-zinc-700/70 bg-zinc-900 rounded-full flex items-center justify-center">
              <User2 className="text-zinc-300" />
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
          if (value === "project") setShowModal(true);
          // else route to create form if needed
        }}
      />
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-400 dark:border-zinc-700 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Create New Project</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Coming soon! This feature is under development.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-zinc-900 dark:bg-zinc-100 font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg px-4 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
