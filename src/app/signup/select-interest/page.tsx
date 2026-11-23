"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import PrivateRouter from "@/components/Global/privateRouter";
import { useToast } from "@/components/Global/Toast";

type Interest = "developer" | "non_developer";

type Onboarding = {
  role?: string;
  goals?: string[];
  teamSize?: string;
};

const VIEW_OPTIONS = [
  {
    value: "developer",
    title: "Developer",
    description: "Integrate email into your apps with a generated API endpoint.",
    icon: "Code",
  },
  {
    value: "non_developer",
    title: "Non-Developer",
    description: "Build an audience, use templates and send without writing code.",
    icon: "Mail",
  },
] as const;

const ROLE_OPTIONS: Record<Interest, string[]> = {
  developer: [
    "Frontend developer",
    "Backend developer",
    "Full-stack developer",
    "DevOps / Platform",
    "Engineering lead",
    "Founder / CTO",
  ],
  non_developer: [
    "Marketing",
    "Operations",
    "Customer success",
    "Sales",
    "Educator",
    "Founder / Owner",
  ],
};

const GOAL_OPTIONS = [
  "Send form confirmations",
  "Send newsletters",
  "Organize contacts",
  "Send notifications",
  "Replace another email tool",
  "Just exploring",
];

const TEAM_OPTIONS = ["Just me", "2–5 people", "6–20 people", "21–100 people", "100+ people"];

const STEPS = ["View", "Role", "Goals", "Team"] as const;

const optionClass = (selected: boolean) =>
  `flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
    selected
      ? "border-yellow-500 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/20"
      : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
  }`;

const radioClass = (selected: boolean) =>
  `flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
    selected ? "border-zinc-600 dark:border-zinc-300" : "border-zinc-400 dark:border-zinc-600"
  }`;

/** Four short, skippable steps. Answers are stored under stable onboarding keys. */
export default function SelectInterest() {
  const toast = useToast();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [interest, setInterest] = useState<Interest>("developer");
  const [role, setRole] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/workspace")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: { interest?: Interest; onboarding?: Onboarding | null } } | null) => {
        const user = data?.user;
        if (user?.interest === "non_developer" || user?.interest === "developer") {
          setInterest(user.interest);
        }
        if (user?.onboarding) {
          setRole(user.onboarding.role ?? "");
          setGoals(user.onboarding.goals ?? []);
          setTeamSize(user.onboarding.teamSize ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const toggleGoal = (goal: string) =>
    setGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal]
    );

  const finish = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interest,
          onboarding: {
            ...(role ? { role } : {}),
            ...(goals.length > 0 ? { goals } : {}),
            ...(teamSize ? { teamSize } : {}),
          },
        }),
      });
      const data = (await res.json().catch(() => null)) as { redirectTo?: string } | null;
      if (!res.ok) throw new Error("Could not save your preferences");
      toast.success("Your workspace is ready.");
      router.push(data?.redirectTo ?? "/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your preferences");
      setSaving(false);
    }
  };

  const advance = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else void finish();
  };

  return (
    <div className="app-viewport h-dvh overflow-y-auto">
      <PrivateRouter>
        <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/Assets/formo.png" alt="FormO" className="h-10 w-10" height={50} width={50} />
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">FormO setup</span>
          </div>

          <header className="grid grid-cols-1 gap-2">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text from-yellow-500 to-yellow-700 dark:from-yellow-600 dark:to-yellow-800 bg-gradient-to-br sm:text-3xl">
              Let&apos;s tailor FormO for you
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Four quick questions. You can skip any of them and change your answers later.
            </p>
          </header>

          <ol className="flex items-center gap-2" aria-label="Setup progress">
            {STEPS.map((label, index) => (
              <li key={label} className="flex min-w-0 flex-1 flex-col gap-1">
                <span
                  className={`h-1 rounded-full ${index <= step ? "bg-yellow-500" : "bg-zinc-200 dark:bg-zinc-800"}`}
                />
                <span className={`truncate text-[11px] font-medium ${index === step ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-400"}`}>
                  {label}
                </span>
              </li>
            ))}
          </ol>

          <section className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            {step === 0 && (
              <>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">How will you use FormO?</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">This decides which workspace you land in.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {VIEW_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={interest === option.value}
                      onClick={() => setInterest(option.value)}
                      className={optionClass(interest === option.value)}
                    >
                      <span className={radioClass(interest === option.value)}>
                        {interest === option.value && <span className="h-2 w-2 rounded-full bg-zinc-600 dark:bg-zinc-300" />}
                      </span>
                      <span className="grid grid-cols-1 gap-1">
                        <span className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                          <Icon name={option.icon} size={16} className="text-zinc-500" /> {option.title}
                        </span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">{option.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">What best describes your role?</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ROLE_OPTIONS[interest].map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={role === option}
                      onClick={() => setRole(option)}
                      className={optionClass(role === option)}
                    >
                      <span className={radioClass(role === option)}>
                        {role === option && <span className="h-2 w-2 rounded-full bg-zinc-600 dark:bg-zinc-300" />}
                      </span>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{option}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">What do you want to do first?</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Choose as many as you like.</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {GOAL_OPTIONS.map((goal) => {
                    const selected = goals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleGoal(goal)}
                        className={optionClass(selected)}
                      >
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${selected ? "border-zinc-600 bg-zinc-600 dark:border-zinc-300 dark:bg-zinc-300" : "border-zinc-400 dark:border-zinc-600"}`}>
                          {selected && <Icon name="Check" size={12} className="text-white dark:text-zinc-900" />}
                        </span>
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{goal}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">How big is your team?</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TEAM_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={teamSize === option}
                      onClick={() => setTeamSize(option)}
                      className={optionClass(teamSize === option)}
                    >
                      <span className={radioClass(teamSize === option)}>
                        {teamSize === option && <span className="h-2 w-2 rounded-full bg-zinc-600 dark:bg-zinc-300" />}
                      </span>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{option}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {step > 0 && (
                <FormButton variant="secondary" disabled={saving} onClick={() => setStep(step - 1)}>
                  Back
                </FormButton>
              )}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={advance}
                  disabled={saving}
                  className="cursor-pointer text-sm font-medium text-zinc-500 underline disabled:opacity-50 dark:text-zinc-400"
                >
                  Skip
                </button>
              )}
              <FormButton variant="primary" disabled={saving || !ready} onClick={advance}>
                {saving ? <><Icon name="Loader" size={16} className="animate-spin" /> Saving…</> : (
                  <>{step === STEPS.length - 1 ? "Finish setup" : "Continue"} <Icon name="ArrowRight" size={16} /></>
                )}
              </FormButton>
            </div>
          </div>

          <p className="text-sm italic text-zinc-500 dark:text-zinc-500">
            Your answers help us tailor the workspace. They are saved to your account, not shared with your audience.
          </p>
        </main>
      </PrivateRouter>
    </div>
  );
}
