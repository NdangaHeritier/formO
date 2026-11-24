import { Icon, type LucideIconName } from "../Global/Icon";

const reasons: Array<{ title: string; icon: LucideIconName; body: string }> = [
  {
    title: "Self-hosted control",
    icon: "Server",
    body: "Run Formo on your own infrastructure. Manage senders, recipients and delivery from one workspace, with credentials encrypted at rest.",
  },
  {
    title: "Built for developers and teams",
    icon: "Code",
    body: "Generate a form endpoint with no backend to maintain, or compose and send from the workspace without writing code.",
  },
  {
    title: "Scalable and secure",
    icon: "Lock",
    body: "Partitioned storage, rate limits and a single delivery queue keep submissions and email moving as volume grows.",
  },
];

const WhyChooseFormo: React.FC = () => {
  return (
    <section
      id="about"
      className="bg-zinc-50 px-5 py-20 dark:bg-black sm:px-8 lg:px-12 lg:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          <h2 className="max-w-[18ch] text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Why go with Formo?
          </h2>
          <p className="max-w-[52ch] text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Formo is a win-to-win solution for teams that want form data collected
            and email delivered without the usual backend work. One workspace,
            two audiences, and transport you control.
          </p>
        </div>

        <ul className="mt-14 border-t border-zinc-200 dark:border-zinc-800">
          {reasons.map((reason) => (
            <li
              key={reason.title}
              className="group flex gap-5 border-b border-zinc-200 py-7 dark:border-zinc-800 sm:gap-8"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-200/70 text-amber-700 transition-colors duration-300 ease-out group-hover:bg-amber-100 dark:bg-zinc-900 dark:text-amber-500 dark:group-hover:bg-amber-500/10">
                <Icon name={reason.icon} size={18} strokeWidth={2} />
              </span>
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)] sm:gap-8">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {reason.title}
                </h3>
                <p className="max-w-[62ch] text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {reason.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default WhyChooseFormo;
