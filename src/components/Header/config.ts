import type { LucideIconName } from "@/components/Global/Icon";

/**
 * Audience-specific header content. The server layout selects the audience;
 * the client header only renders what this map allows. No developer destination
 * is reachable from the non-developer configuration.
 */
export type HeaderAudience = "developer" | "nonDeveloper" | "public";

export type HeaderLink = {
  label: string;
  href: string;
  icon: LucideIconName;
  strokeWidth: number;
  adminOnly?: boolean;
};

export type HeaderCta = {
  label: string;
  href: string;
  icon: LucideIconName;
  variant: "primary" | "secondary";
};

export type HeaderConfig = {
  workspaceLinks: HeaderLink[];
  ctas: HeaderCta[];
  accountSettingsHref: string | null;
};

export const headerConfig: Record<HeaderAudience, HeaderConfig> = {
  developer: {
    workspaceLinks: [
      { label: "Overview", href: "/developer", icon: "LayoutDashboard", strokeWidth: 2 },
      { label: "Projects", href: "/developer/projects", icon: "FolderOpen", strokeWidth: 2 },
      { label: "Forms", href: "/developer/forms", icon: "SquareCode", strokeWidth: 2 },
      { label: "Submissions", href: "/developer/submissions", icon: "Activity", strokeWidth: 2 },
      { label: "Templates", href: "/developer/templates", icon: "FileText", strokeWidth: 2 },
      { label: "Analytics", href: "/developer/analytics", icon: "ChartNoAxesColumn", strokeWidth: 2 },
      {
        label: "Settings",
        href: "/developer/settings",
        icon: "Settings",
        strokeWidth: 2,
        adminOnly: true,
      },
    ],
    ctas: [
      { label: "Get API", href: "/developer", icon: "Webhook", variant: "primary" },
    ],
    accountSettingsHref: "/developer/account",
  },
  nonDeveloper: {
    workspaceLinks: [
      { label: "Overview", href: "/non-dev", icon: "LayoutDashboard", strokeWidth: 2 },
      { label: "Contacts", href: "/non-dev/contacts", icon: "Users", strokeWidth: 2 },
      { label: "Lists", href: "/non-dev/lists", icon: "List", strokeWidth: 2 },
      { label: "Messages", href: "/non-dev/messages", icon: "Mail", strokeWidth: 2 },
      { label: "Compose", href: "/non-dev/compose", icon: "Plus", strokeWidth: 2 },
      { label: "Analytics", href: "/non-dev/analytics", icon: "ChartNoAxesColumn", strokeWidth: 2 },
    ],
    ctas: [
      { label: "Compose message", href: "/non-dev/compose", icon: "Plus", variant: "primary" },
    ],
    accountSettingsHref: "/non-dev/account",
  },
  public: {
    workspaceLinks: [],
    ctas: [
      { label: "Go to dashboard", href: "/dashboard", icon: "ArrowRight", variant: "primary" },
    ],
    accountSettingsHref: "/dashboard",
  },
};
