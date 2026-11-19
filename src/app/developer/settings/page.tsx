"use client";
import { useEffect, useState } from "react";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import { Squares } from "@/components/Global/Squares";
import { Icon, type LucideIconName } from "@/components/Global/Icon";
import { relativeTime } from "@/lib/format";
import { Skeleton, SkeletonListRows } from "@/components/Global/Skeleton";
import FormButton from "@/components/Global/FormButton";
import { InputField } from "@/components/Global/InputField";
import ConfirmDialog from "@/components/Global/ConfirmDialog";
import LinkButton from "@/components/Global/LinkButton";

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
  "flex items-center justify-between gap-3 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-transparent rounded-lg px-4 py-3";

const pillClass =
  "text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";

const SettingsPage = () => {
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [rawKey, setRawKey] = useState("");
  const [pendingRevoke, setPendingRevoke] = useState<ApiKey | null>(null);
  const [pendingSmtpDelete, setPendingSmtpDelete] = useState<SmtpConfig | null>(null);
  const [showSmtpForm, setShowSmtpForm] = useState(false);
  const [newSmtp, setNewSmtp] = useState({
    name: "",
    host: "",
    port: "587",
    username: "",
    password: "",
    fromEmail: "",
  });

  const reload = () => {
    Promise.all([
      fetch("/api/settings/smtp").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/settings/api-keys").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/templates").then((res) => (res.ok ? res.json() : null)),
    ]).then(([smtp, keys, tpl]) => {
      if (smtp?.smtpConfigs) setSmtpConfigs(smtp.smtpConfigs);
      if (keys?.apiKeys) setApiKeys(keys.apiKeys);
      if (tpl?.templates) setTemplates(tpl.templates);
    }).catch(() => setActionError("Could not reload settings."));
  };

  const createKey = async () => {
    setActionError("");
    setRawKey("");
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = (await res.json().catch(() => null)) as {
        apiKey?: { rawKey?: string };
        error?: string;
      } | null;
      if (!res.ok || !data?.apiKey) throw new Error(data?.error ?? "Could not create API key");
      setRawKey(data.apiKey.rawKey ?? "");
      setNewKeyName("");
      reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not create API key");
    }
  };

  const revokeKey = async () => {
    if (!pendingRevoke) return;
    try {
      const res = await fetch(`/api/settings/api-keys/${pendingRevoke.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not revoke API key");
      setNotice("API key revoked.");
      reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not revoke API key");
    } finally {
      setPendingRevoke(null);
    }
  };

  const createSmtp = async () => {
    setActionError("");
    try {
      const res = await fetch("/api/settings/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSmtp,
          port: Number(newSmtp.port),
          secure: false,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Could not add SMTP sender");
      setShowSmtpForm(false);
      setNewSmtp({ name: "", host: "", port: "587", username: "", password: "", fromEmail: "" });
      setNotice("SMTP sender added.");
      reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not add SMTP sender");
    }
  };

  const deleteSmtp = async () => {
    if (!pendingSmtpDelete) return;
    try {
      const res = await fetch(`/api/settings/smtp/${pendingSmtpDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete SMTP sender");
      setNotice("SMTP sender deleted.");
      reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not delete SMTP sender");
    } finally {
      setPendingSmtpDelete(null);
    }
  };

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
            <div className="title text-xl font-bold text-black">Settings</div>
            <span className="text-xs font-medium bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
              Workspace
            </span>
          </div>

          {(actionError || notice) && (
            <p
              role="status"
              className={`text-xs rounded-lg px-3 py-2 ${
                actionError
                  ? "text-red-600 bg-red-500/10"
                  : "text-green-600 bg-green-600/10"
              }`}
            >
              {actionError || notice}
            </p>
          )}

          {rawKey && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Copy this key now — it will not be shown again.
              </p>
              <code className="block break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {rawKey}
              </code>
            </div>
          )}

          {/* SMTP senders */}
          <div className="flex justify-end">
            <FormButton variant="secondary" onClick={() => setShowSmtpForm((open) => !open)}>
              <Icon name="Plus" size={14} /> Add sender
            </FormButton>
          </div>
          {showSmtpForm && (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2">
              <InputField type="text" name="smtpName" id="smtp-name" label="Label" placeholder="Primary sender" value={newSmtp.name} onChange={(e) => setNewSmtp({ ...newSmtp, name: e.target.value })} />
              <InputField type="text" name="smtpHost" id="smtp-host" label="Host" placeholder="smtp.example.com" value={newSmtp.host} onChange={(e) => setNewSmtp({ ...newSmtp, host: e.target.value })} />
              <InputField type="number" name="smtpPort" id="smtp-port" label="Port" placeholder="587" value={newSmtp.port} onChange={(e) => setNewSmtp({ ...newSmtp, port: e.target.value })} />
              <InputField type="email" name="smtpFrom" id="smtp-from" label="From address" placeholder="noreply@example.com" value={newSmtp.fromEmail} onChange={(e) => setNewSmtp({ ...newSmtp, fromEmail: e.target.value })} />
              <InputField type="text" name="smtpUser" id="smtp-user" label="Username" placeholder="username" value={newSmtp.username} onChange={(e) => setNewSmtp({ ...newSmtp, username: e.target.value })} />
              <InputField type="password" name="smtpPass" id="smtp-pass" label="Password" placeholder="••••••••" value={newSmtp.password} onChange={(e) => setNewSmtp({ ...newSmtp, password: e.target.value })} />
              <div className="sm:col-span-2 flex justify-end gap-2">
                <FormButton variant="secondary" onClick={() => setShowSmtpForm(false)}>Cancel</FormButton>
                <FormButton onClick={() => void createSmtp()}>Save sender</FormButton>
              </div>
            </div>
          )}

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
                  <FormButton variant="danger" onClick={() => setPendingSmtpDelete(config)}>
                    Delete
                  </FormButton>
                </span>
              </li>
            ))}
          </Section>

          {/* API keys */}
          <div className="flex items-center justify-end gap-2">
            <InputField
              type="text"
              name="newKeyName"
              id="new-key-name"
              label=""
              placeholder="Key label"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <FormButton onClick={() => void createKey()} disabled={!newKeyName.trim()}>
              Create key
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
                  {!key.revokedAt && (
                    <FormButton variant="danger" onClick={() => setPendingRevoke(key)}>
                      Revoke
                    </FormButton>
                  )}
                </span>
              </li>
            ))}
          </Section>

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
    </DeveloperShell>
  );
};

export default SettingsPage;
