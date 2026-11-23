"use client";

import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/Developer/Modals/Layout";
import FormButton from "@/components/Global/FormButton";
import { Icon, type LucideIconName } from "@/components/Global/Icon";
import Tooltip from "@/components/Global/Tooltip";

const HELP_LINKS: { href: string; label: string; icon: LucideIconName }[] = [
  { href: "/non-dev/compose", label: "Compose", icon: "Send" },
  { href: "/non-dev/contacts", label: "Contacts", icon: "Users" },
  { href: "/non-dev/messages", label: "Messages", icon: "Mail" },
  { href: "/developer/forms", label: "Forms", icon: "SquareCode" },
  { href: "/privacy", label: "Privacy Policy", icon: "ShieldCheck" },
  { href: "/terms", label: "Terms of Service", icon: "FileText" },
];

export default function AssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <>
      <Tooltip label="FormO assistant" placement="left">
        <button
          type="button"
          aria-label="FormO assistant"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className="flex cursor-pointer items-center justify-center rounded-full bg-yellow-100 p-3 text-yellow-800 transition-colors duration-200 hover:bg-yellow-50 shadow-lg dark:bg-yellow-600/20 dark:text-yellow-500 dark:hover:bg-yellow-600/30"
        >
          <Icon name="Bot" size={25} strokeWidth={2} />
        </button>
      </Tooltip>

      {isOpen ? (
        <Layout onClick={close} label="FormO assistant help">
          <section className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Need a hand?
            </h2>
            <p className="mt-1 pb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Jump to a helpful place, or close this dialog to keep browsing.
            </p>
            <nav className="grid grid-cols-1 gap-1">
              {HELP_LINKS.map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <Icon
                    name={icon}
                    size={17}
                    strokeWidth={2}
                    className="text-zinc-500 dark:text-zinc-400"
                  />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex justify-end">
              <FormButton variant="secondary" onClick={close}>
                Close
              </FormButton>
            </div>
          </section>
        </Layout>
      ) : null}
    </>
  );
}
