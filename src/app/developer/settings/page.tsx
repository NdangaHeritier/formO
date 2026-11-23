"use client";
import { useEffect, useState } from "react";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import { Squares } from "@/components/Global/Squares";
import { Icon, type LucideIconName } from "@/components/Global/Icon";
import { relativeTime } from "@/lib/format";
import { Skeleton, SkeletonListRows } from "@/components/Global/Skeleton";
import FormButton from "@/components/Global/FormButton";
import ConfirmDialog from "@/components/Global/ConfirmDialog";
import NewSenderModal from "@/components/Developer/Modals/Settings/NewSenderModal";
import DeliveryLogs from "@/components/Developer/Settings/DeliveryLogs";
import RetentionSetting from "@/components/Developer/Settings/RetentionSetting";
import NewApiKeyModal from "@/components/Developer/Modals/Settings/NewApiKeyModal";
import LinkButton from "@/components/Global/LinkButton";
import { useToast } from "@/components/Global/Toast";

type SmtpConfig = {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  isVerified: boolean;
  isSystemDefault: boolean;
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
        {loading ? (
          <Skeleton className="h-5 w-8 rounded-full" />
        ) : (
          <span className="text-xs font-medium bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <div className="p-3">
        {loading ? (
          <SkeletonListRows rows={2} />
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
  "flex flex-wrap items-center justify-between gap-3 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-transparent rounded-lg px-4 py-3";

const pillClass =
  "text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";

const SettingsPage = () => {
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([]);
  const [defaultSenderId, setDefaultSenderId] = useState("");
  const [canManageSenders, setCanManageSenders] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [pendingRevoke, setPendingRevoke] = useState<ApiKey | null>(null);
  const [pendingSmtpDelete, setPendingSmtpDelete] = useState<SmtpConfig | null>(null);
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [editingSender, setEditingSender] = useState<SmtpConfig | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  const reload = () => {
    Promise.all([
      fetch("/api/settings/smtp").then((res) => {
        setCanManageSenders(res.ok);
        return res.ok ? res.json() : null;
      }),
      fetch("/api/settings/api-keys").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/templates").then((res) => (res.ok ? res.json() : null)),
    ]).then(([smtp, keys, tpl]) => {
      if (smtp?.smtpConfigs) {
        setSmtpConfigs(smtp.smtpConfigs);
        setDefaultSenderId(smtp.smtpConfigs.find((config: SmtpConfig) => config.isSystemDefault)?.id ?? "");
      }
      if (keys?.apiKeys) setApiKeys(keys.apiKeys);
      if (tpl?.templates) setTemplates(tpl.templates);
    }).catch(() => toast.error("Could not reload settings."));
  };

  const revokeKey = async () => {
    if (!pendingRevoke) return;
    try {
      const res = await fetch(`/api/settings/api-keys/${pendingRevoke.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not revoke API key");
      toast.success("API key revoked.");
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke API key");
    } finally {
      setPendingRevoke(null);
    }
  };

  const saveDefaultSender = async () => {
    try {
      const res = await fetch("/api/settings/smtp/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtpConfigId: defaultSenderId || null }),
      });
      if (!res.ok) throw new Error("Could not update workspace default sender");
      toast.success("Workspace default sender updated.");
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update workspace default sender");
    }
  };

  const deleteSmtp = async () => {
    if (!pendingSmtpDelete) return;
    try {
      const res = await fetch(`/api/settings/smtp/${pendingSmtpDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete SMTP sender");
      toast.success("SMTP sender deleted.");
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete SMTP sender");
    } finally {
      setPendingSmtpDelete(null);
    }
  };

  const verifySmtp = async (config: SmtpConfig) => {
    setVerifyingId(config.id);
    try {
      const res = await fetch(`/api/settings/smtp/${config.id}/test`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "SMTP verification failed");
      // Update the row immediately, then re-sync with the server.
      setSmtpConfigs((current) =>
        current.map((item) => (item.id === config.id ? { ...item, isVerified: true } : item))
      );
      toast.success(`"${config.name}" verified`);
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "SMTP verification failed", {
        description: "Check the host, port, credentials and TLS setting, then try again.",
        duration: 8000,
      });
    } finally {
      setVerifyingId(null);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/smtp").then((res) => {
        setCanManageSenders(res.ok);
        return res.ok ? res.json() : null;
      }),
      fetch("/api/settings/api-keys").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/templates").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([smtp, keys, tpl]) => {
        if (smtp?.smtpConfigs) {
          setSmtpConfigs(smtp.smtpConfigs);
          setDefaultSenderId(smtp.smtpConfigs.find((config: SmtpConfig) => config.isSystemDefault)?.id ?? "");
        }
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
        <div className="projects relative z-10 grid grid-cols-1 gap-card bg-gradient-to-tr from-zinc-100 to-zinc-100/50 dark:from-zinc-950 from-80% to-20% dark:to-zinc-950/50 rounded-card p-panel">
          <div className="flex items-center gap-2">
            <div className="title text-xl font-bold text-black">Settings</div>
            <span className="text-xs font-medium bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
              Workspace
            </span>
          </div>

          {/* Developer-only transport configuration. Non-admins never reach
              this data: the SMTP API requires workspace admin. */}
          {canManageSenders && (
            <div className="flex justify-end">
              <FormButton variant="secondary" onClick={() => setShowSenderModal(true)}>
                <Icon name="Plus" size={14} /> Add sender
              </FormButton>
            </div>
          )}
          {canManageSenders && (
            <div className={rowClass}>
              <span className="flex flex-col min-w-0">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Workspace default sender</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Used when a form has no sender selected. Falls back to system SMTP when unset.
                </span>
              </span>
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <select
                  aria-label="Workspace default sender"
                  value={defaultSenderId}
                  onChange={(event) => setDefaultSenderId(event.target.value)}
                  className="min-w-0 max-w-full text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2"
                >
                  <option value="">System SMTP (fallback)</option>
                  {smtpConfigs.map((config) => (
                    <option key={config.id} value={config.id} disabled={!config.isVerified}>
                      {config.name} — {config.fromEmail}{config.isVerified ? "" : " (unverified)"}
                    </option>
                  ))}
                </select>
                <FormButton variant="secondary" onClick={saveDefaultSender}>Save</FormButton>
              </span>
            </div>
          )}
          {canManageSenders && smtpConfigs.some((config) => !config.isVerified) && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-2">
              Verify a sender before assigning it as the workspace default or a form sender.
            </p>
          )}
          <Section
            title="SMTP senders"
            icon="Server"
            count={smtpConfigs.length}
            loading={loading}
            emptyText="No custom senders configured. Forms fall back to the workspace default, then system SMTP."
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
                <span className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                  {config.isSystemDefault && <span className={pillClass}>Workspace default</span>}
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
                  {!config.isVerified && (
                    <FormButton
                      variant="secondary"
                      disabled={verifyingId === config.id}
                      onClick={() => verifySmtp(config)}
                    >
                      {verifyingId === config.id ? (
                        <>
                          <Icon name="Loader" size={14} className="animate-spin" aria-hidden="true" />
                          Verifying…
                        </>
                      ) : (
                        <>
                          <Icon name="ShieldCheck" size={14} aria-hidden="true" />
                          Verify
                        </>
                      )}
                    </FormButton>
                  )}
                  <FormButton variant="secondary" onClick={() => setEditingSender(config)}>
                    <Icon name="Settings" size={14} aria-hidden="true" />
                    Edit
                  </FormButton>
                  <FormButton variant="danger" onClick={() => setPendingSmtpDelete(config)}>
                    Delete
                  </FormButton>
                </span>
              </li>
            ))}
          </Section>

          {/* Delivery logs */}
          <div className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Delivery logs</h2>
            <DeliveryLogs />
          </div>

          {/* Retention */}
          <div className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Retention</h2>
            <RetentionSetting />
          </div>

          {/* API keys — listing and management are admin-only. */}
          {canManageSenders ? (
            <>
              <div className="flex justify-end">
                <FormButton onClick={() => setShowKeyModal(true)}>
                  <Icon name="Plus" size={14} /> Create key
                </FormButton>
              </div>
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
                <span className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                  {key.revokedAt ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-600 dark:text-red-400">
                      Revoked
                    </span>
                  ) : (
                    <span className={pillClass}>
                      {key.lastUsedAt ? `Used ${relativeTime(key.lastUsedAt)}` : "Never used"}
                    </span>
                  )}
                  {!key.revokedAt && (
                    <FormButton variant="danger" onClick={() => setPendingRevoke(key)}>
                      Revoke
                    </FormButton>
                  )}
                </span>
              </li>
            ))}
              </Section>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">API Keys</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                API keys are managed by workspace admins.
              </p>
            </div>
          )}

          {/* Email templates */}
          <div className="flex justify-end">
            <LinkButton href="/developer/templates" variant="secondary">
              Open template studio
            </LinkButton>
          </div>
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
            SMTP senders and API keys are managed here. Template editing happens in the
            template studio. Keys are shown once at creation.
          </p>
        </div>
      </div>
      <ConfirmDialog
        open={pendingRevoke !== null}
        title={`Revoke "${pendingRevoke?.name ?? ""}"?`}
        description="This key stops working immediately. Any integration using it will need a replacement."
        confirmLabel="Revoke key"
        onCancel={() => setPendingRevoke(null)}
        onConfirm={revokeKey}
      />
      <ConfirmDialog
        open={pendingSmtpDelete !== null}
        title={`Delete "${pendingSmtpDelete?.name ?? ""}"?`}
        description="Forms using this sender will fall back to the system SMTP configuration."
        confirmLabel="Delete sender"
        onCancel={() => setPendingSmtpDelete(null)}
        onConfirm={deleteSmtp}
      />
      {showSenderModal && (
        <NewSenderModal
          onClose={() => setShowSenderModal(false)}
          onCreated={reload}
        />
      )}
      {editingSender && (
        <NewSenderModal
          sender={editingSender}
          onClose={() => setEditingSender(null)}
          onCreated={reload}
        />
      )}
      {showKeyModal && (
        <NewApiKeyModal
          onClose={() => setShowKeyModal(false)}
          onCreated={reload}
        />
      )}
    </DeveloperShell>
  );
};

export default SettingsPage;
