import Header from "@/components/Header";

type Section = { heading: string; paragraphs: string[] };

export default function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: Section[];
}) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-5 py-12 text-zinc-800 dark:text-zinc-200">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Last updated {updated}</p>
        <div className="mt-10 grid grid-cols-1 gap-8">
          {sections.map((section) => (
            <section key={section.heading} className="grid grid-cols-1 gap-3">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
