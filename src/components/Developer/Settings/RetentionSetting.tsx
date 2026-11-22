"use client";
import { useEffect, useState } from "react";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import { useToast } from "@/components/Global/Toast";
import { canManageWorkspace, useWorkspaceRole } from "@/lib/hooks/use-workspace-role";

const OPTIONS = [
  { value: "", label: "Keep forever (use system default)" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "1 year" },
];

/** Workspace submission retention. NULL keeps data until explicitly changed. */
export default function RetentionSetting() {
  const toast = useToast();
  const role = useWorkspaceRole();
  const canManage = canManageWorkspace(role);
  const [value, setValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/settings/retention")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("retention"))))
      .then((data: { retentionDays: number | null }) => setValue(String(data.retentionDays ?? "")))
      .catch(() => setError(true));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/retention", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionDays: value ? Number(value) : null }),
      });
      if (!res.ok) throw new Error("Could not save retention setting");
      toast.success(value ? `Submissions older than ${value} days will be pruned.` : "Retention cleared — submissions are kept.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save retention setting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Choose how long submissions are kept. Leaving this unset keeps every submission until you decide otherwise.
      </p>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">Could not load the retention setting.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Submission retention period"
            value={value ?? ""}
            disabled={!canManage || saving}
            onChange={(event) => setValue(event.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          >
            {OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {canManage && (
            <FormButton variant="secondary" disabled={saving} onClick={save}>
              {saving ? <><Icon name="Loader" size={15} className="animate-spin" /> Saving…</> : "Save retention"}
            </FormButton>
          )}
        </div>
      )}
    </div>
  );
}
