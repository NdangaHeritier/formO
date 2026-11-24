import Image from "next/image";
import Link from "next/link";
import LinkButton from "../Global/LinkButton";
import { Icon } from "../Global/Icon";

const people = [
  {
    name: "Ndanga Heritier",
    role: "The Real Projectoo-er",
    image: "/Assets/Avatars/Live Photos.png",
    href: "https://ndanga-heritier.vercel.app",
  },
  {
    name: "Alituan Famous",
    role: "Software Developer",
    image: "/Assets/Avatars/Sports Man.png",
    href: "https://alituan.me",
  },
] as const;

const MeetTeam: React.FC = () => {
  return (
    <section
      id="team"
      className="bg-zinc-50 px-5 py-20 dark:bg-black sm:px-8 lg:px-12 lg:py-28"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <div className="grid content-start gap-6">
          <h2 className="max-w-[16ch] text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Meet the team behind Formo.
          </h2>
          <p className="max-w-[46ch] text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Formo is built with{" "}
            <span className="font-medium text-amber-700 dark:text-amber-500">
              developer love
            </span>{" "}
            in mind by{" "}
            <span className="underline decoration-dotted decoration-zinc-400 underline-offset-4 dark:decoration-zinc-600">
              Ndanga and Samuel
            </span>
            .
          </p>
          <div className="pt-2">
            <LinkButton
              href="https://github.com/NdangaHeritier/formo"
              variant="secondary"
            >
              <Icon name="GitPullRequest" size={16} />
              Visit on GitHub
            </LinkButton>
          </div>
        </div>

        <ul className="grid grid-cols-1">
          {people.map((person, index) => (
            <li
              key={person.name}
              className={`group flex items-center gap-5 py-7 ${
                index === 0
                  ? "border-b border-zinc-200 dark:border-zinc-800"
                  : ""
              }`}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-zinc-200 ring-1 ring-zinc-200 transition duration-300 ease-out group-hover:ring-2 group-hover:ring-amber-600 dark:bg-zinc-800 dark:ring-zinc-700 dark:group-hover:ring-amber-500">
                <Image
                  src={person.image}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-1">
                <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {person.name}
                </h3>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  {person.role}
                </p>
              </div>
              <Link
                href={person.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Visit ${person.name}'s page`}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
              >
                <Icon name="ArrowUpRight" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default MeetTeam;
