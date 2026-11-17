"use client";
import { useEffect, useState } from "react";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import { Squares } from "@/components/Global/Squares";
import { Icon, type LucideIconName } from "@/components/Global/Icon";
import { relativeTime } from "@/lib/format";

type SmtpConfig = {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  isVerified: boolean;
  createdAt: string;
};

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type EmailTemplate = {
  id: string;
  name: string;
  subjectTemplate: string;
  isDefault: boolean;
  createdAt: string;
};

type SectionProps = {
  title: string;
  icon: LucideIconName;
  count: number;
  loading: boolean;
  emptyText: string;
  children: React.ReactNode;
};

function Section({ title, icon, count, loading, emptyText, children }: SectionProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black shadow-lg">
      <div className="head flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
          <Icon name={icon} size={16} className="text-yellow-600" />
          {title}
        </div>
        <span className="text-xs font-medium bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
          {loading ? "…" : count}
        </span>
      </div>
      <div className="p-3">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 p-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-zinc-200/60 dark:bg-zinc-900 rounded-lg" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="text-center text-zinc-500 py-8">{emptyText}</div>
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {children}
          </ul>
        )}
      </div>
    </div>
  );
}

const rowClass =
  "flex items-center justify-between gap-3 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-transparent rounded-lg px-4 py-3";

const pillClass =
  "text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";

const SettingsPage = () => {
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/smtp").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/settings/api-keys").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/templates").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([smtp, keys, tpl]) => {
        if (smtp?.smtpConfigs) setSmtpConfigs(smtp.smtpConfigs);
        if (keys?.apiKeys) setApiKeys(keys.apiKeys);
        if (tpl?.templates) setTemplates(tpl.templates);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DeveloperShell>
      <div className="relative rounded-2xl">
        <Squares parLength={100} />
        <div className="projects relative z-10 grid grid-cols-1 gap-5 bg-gradient-to-tr from-zinc-100 to-zinc-100/50 dark:from-zinc-950 from-80% to-20% dark:to-zinc-950/50 rounded-2xl p-8">
          <div className="flex items-center gap-2">
            <div className="title text-xl font-bold">Settings</div>
            <span className="text-xs font-medium bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
              Workspace
            </span>
          </div>

          {/* SMTP senders */}
          <Section
            title="SMTP Senders"
            icon="Server"
            count={smtpConfigs.length}
            loading={loading}
            emptyText="No SMTP senders configured yet."
          >
            {smtpConfigs.map((config) => (
              <li key={config.id} className={rowClass}>
                <span className="flex items-center gap-2 min-w-0">
                  <Icon name="Server" size={15} className="text-zinc-400 shrink-0" />
                  <span className="flex flex-col min-w-0">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{config.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {config.host}:{config.port} · {config.fromEmail}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className={pillClass}>{config.secure ? "SSL" : "STARTTLS"}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                      config.isVerified
                        ? "bg-green-600/15 text-green-600 dark:text-green-500"
                        : "bg-yellow-600/15 text-yellow-600 dark:text-yellow-500"
                    }`}
                  >
                    {config.isVerified ? "Verified" : "Unverified"}
                  </span>
                </span>
              </li>
            ))}
          </Section>

          {/* API keys */}
          <Section
            title="API Keys"
            icon="Key"
            count={apiKeys.length}
            loading={loading}
            emptyText="No API keys created yet."
          >
            {apiKeys.map((key) => (
              <li key={key.id} className={rowClass}>
                <span className="flex items-center gap-2 min-w-0">
                  <Icon name="Key" size={15} className="text-zinc-400 shrink-0" />
                  <span className="flex flex-col min-w-0">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{key.name}</span>
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">
                      {key.keyPrefix}•••••••• · {key.scopes.join(", ")}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {key.revokedAt ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-600 dark:text-red-400">
                      Revoked
                    </span>
                  ) : (
                    <span className={pillClass}>
                      {key.lastUsedAt ? `Used ${relativeTime(key.lastUsedAt)}` : "Never used"}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </Section>

          {/* Email templates */}
          <Section
            title="Email Templates"
            icon="FileText"
            count={templates.length}
            loading={loading}
            emptyText="No email templates yet."
          >
            {templates.map((template) => (
              <li key={template.id} className={rowClass}>
                <span className="flex items-center gap-2 min-w-0">
                  <Icon name="FileText" size={15} className="text-zinc-400 shrink-0" />
                  <span className="flex flex-col min-w-0">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{template.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {template.subjectTemplate}
                    </span>
                  </span>
                </span>
                {template.isDefault && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-zinc-950 text-zinc-100 dark:bg-zinc-50 dark:text-zinc-950">
                    Default
                  </span>
                )}
              </li>
            ))}
          </Section>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Management actions (create, edit, revoke, test) live behind the{" "}
            <span className="font-mono">/api/settings/*</span> and{" "}
            <span className="font-mono">/api/templates</span> endpoints — full UI controls coming soon.
          </p>
        </div>
      </div>
    </DeveloperShell>
  );
};

export default SettingsPage;
