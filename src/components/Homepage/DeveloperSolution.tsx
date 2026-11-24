import { Icon, type LucideIconName } from "../Global/Icon";

const solutions: Array<{
  title: string;
  icon: LucideIconName;
  desc: string;
  detail: string;
}> = [
  {
    title: "Plug & Play API",
    icon: "PlugZap",
    desc: "Integrate in minutes with a generated form endpoint and a documented JSON API.",
    detail: "Clear responses, idempotency keys and CORS support are built in.",
  },
  {
    title: "Workspace & Collaboration",
    icon: "Users",
    desc: "Team dashboards for forms, submissions and delivery.",
    detail: "Invite members and manage roles from one workspace.",
  },
  {
    title: "Developer Tools",
    icon: "Terminal",
    desc: "Test submissions, delivery logs and API keys in one place.",
    detail: "Rotate endpoints and manage senders without leaving the dashboard.",
  },
];

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

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((solution) => (
            <article
              key={solution.title}
              className="grid content-start gap-3 rounded-xl border border-zinc-200 bg-white p-5 transition-colors duration-300 ease-out hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500">
                <Icon name={solution.icon} size={18} strokeWidth={2} />
              </span>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {solution.title}
              </h3>
              <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {solution.desc}
              </p>
              <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {solution.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DeveloperSolutions;
