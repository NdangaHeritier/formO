import { Icon, type LucideIconName } from "../Global/Icon";

const capabilities: Array<{
  title: string;
  icon: LucideIconName;
  body: string;
}> = [
  {
    title: "Plug & Play API",
    icon: "PlugZap",
    body: "A generated endpoint accepts JSON or HTML form posts with CORS and idempotency keys built in.",
  },
  {
    title: "Workspace & Collaboration",
    icon: "UsersRound",
    body: "Forms, submissions and delivery live in one workspace, with invitations and role-based access.",
  },
  {
    title: "Developer Tools",
    icon: "Terminal",
    body: "Test submissions, delivery logs, sender management and endpoint rotation from the dashboard.",
  },
];

const requestExample = [
  "POST /api/f/{endpoint}",
  "Accept: application/json",
  "Content-Type: application/json",
  "Idempotency-Key: <uuid>",
  "",
  '{ "email": "visitor@example.com", "message": "Hello" }',
].join("\n");

const responseExample = ['200 OK', '{ "ok": true, "id": "fmo_submission_id" }'].join("\n");

const DeveloperSolutions: React.FC = () => {
  return (
    <section
      id="docs"
      className="bg-zinc-50 px-5 py-20 dark:bg-black sm:px-8 lg:px-12 lg:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          <h2 className="max-w-[18ch] text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Developer-first, always.
          </h2>
          <p className="max-w-[52ch] text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Formo is built with developer love in mind. Plug-and-play endpoints,
            a workspace that keeps the backend work contained, and tools that
            scale with your team and project.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
          <ul className="border-t border-zinc-200 dark:border-zinc-800">
            {capabilities.map((capability) => (
              <li
                key={capability.title}
                className="flex gap-4 border-b border-zinc-200 py-5 dark:border-zinc-800 sm:gap-5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500">
                  <Icon name={capability.icon} size={18} strokeWidth={2} />
                </span>
                <div className="grid min-w-0 grid-cols-1 gap-1.5">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {capability.title}
                  </h3>
                  <p className="max-w-[52ch] text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {capability.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 transition-colors duration-300 ease-out hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-950 dark:hover:border-zinc-700 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              <Icon name="Terminal" size={16} className="text-amber-700 dark:text-amber-500" />
              Public form endpoint
            </div>

            <div className="mt-4 overflow-x-auto rounded-3xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
              <pre className="font-mono text-xs leading-6 text-zinc-700 dark:text-zinc-300">
                <code>{requestExample}</code>
              </pre>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Response
              </span>
              <div className="overflow-x-auto rounded-3xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
                <pre className="font-mono text-xs leading-6 text-zinc-700 dark:text-zinc-300">
                  <code>{responseExample}</code>
                </pre>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Submissions are queued here; the delivery worker sends them on a schedule.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperSolutions;
