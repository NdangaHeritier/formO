import Link from "next/link";
import LinkButton from "../Global/LinkButton";
import { Icon } from "../Global/Icon";

const journey = [
  {
    step: "01",
    title: "Pick a template",
    body: "Start from a workspace template or write your own subject and message.",
  },
  {
    step: "02",
    title: "Choose your audience",
    body: "Select contacts, lists, or add individual addresses. Duplicates are removed automatically.",
  },
  {
    step: "03",
    title: "Queue the send",
    body: "Submit once. Delivery runs on a schedule and outcomes appear in your workspace.",
  },
] as const;

const audiences = ["Marketers", "Influencers", "Teachers", "Business Owners"] as const;

const NonDevSolutions: React.FC = () => {
  return (
    <section
      id="community"
      className="bg-zinc-50 px-5 py-20 dark:bg-black sm:px-8 lg:px-12 lg:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          <h2 className="max-w-[18ch] text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Easy for everyone.
          </h2>
          <div className="grid content-start gap-5">
            <p className="max-w-[52ch] text-base leading-7 text-zinc-600 dark:text-zinc-400">
              Whether you&rsquo;re a marketer, teacher, or business owner, Formo
              is made for you. No backend, no code, no transport to configure.
            </p>
            <ul className="flex flex-wrap gap-2">
              {audiences.map((audience) => (
                <li
                  key={audience}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                >
                  {audience}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          <span
            aria-hidden="true"
            className="absolute left-6 right-6 top-4 hidden h-px bg-zinc-200 dark:bg-zinc-800 md:block"
          />
          {journey.map((item) => (
            <div key={item.step} className="relative grid content-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-zinc-50 font-mono text-[11px] text-amber-700 dark:border-zinc-700 dark:bg-black dark:text-amber-500">
                {item.step}
              </span>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {item.title}
              </h3>
              <p className="max-w-[40ch] text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-5 transition-colors duration-300 ease-out hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              <Icon name="Send" size={16} className="text-amber-700 dark:text-amber-500" />
              Queued message
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
              Example
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Subject</dt>
              <dd className="min-w-0 break-words font-medium text-zinc-800 dark:text-zinc-200">
                Your August update
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Audience</dt>
              <dd className="flex flex-wrap gap-1.5">
                {["Contacts", "Newsletter", "+1"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    {chip}
                  </span>
                ))}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Status</dt>
              <dd>
                <span className="rounded-full bg-yellow-600/15 px-2 py-0.5 text-[11px] font-medium text-yellow-700 dark:text-yellow-400">
                  Queued for delivery
                </span>
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Outcomes appear in your workspace once delivery runs.
            </p>
            <LinkButton href="/non-dev/analytics" variant="secondary">
              View delivery outcomes
            </LinkButton>
          </div>

          <Link
            href="/non-dev/compose"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-700 underline dark:text-zinc-200"
          >
            Compose a message <Icon name="ArrowRight" size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NonDevSolutions;
