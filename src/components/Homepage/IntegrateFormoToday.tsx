import { BackGraphicsLayout } from "@/app/login/BackGraphicsLayout";
import { Icon } from "../Global/Icon";
import LinkButton from "../Global/LinkButton";

const IntegrateFormoToday: React.FC = () => {
    return (
        <section className="relative bg-zinc-50 dark:bg-zinc-950 p-10 max-sm:px-4 flex items-center justify-center overflow-hidden">
            {/* Subtle background graphics */}
            <div className="absolute inset-0 grid grid-cols-2 gap-2 pointer-events-none opacity-40 z-0">
                <BackGraphicsLayout />
                <BackGraphicsLayout />
                <BackGraphicsLayout />
                <BackGraphicsLayout />
            </div>
            <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center gap-8">
                <h2 className="text-4xl font-extrabold dark:text-zinc-200 text-zinc-900 pb-3 tracking-tight text-center">
                    Integrate Formo Today
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg md:text-center max-w-xl">
                    Supercharge your workflow by integrating <span className="text-violet-500 font-semibold">Formo</span> into your stack. 
                    Whether you are a developer or not, Formo makes it easy to collect, manage, and automate your forms and emails.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {/* Developer Integration Card */}
                    <div className="bg-zinc-950 p-6 rounded-xl flex flex-col items-center gap-4 shadow-lg border border-zinc-800">
                        <Icon name="Webhook" size={40} className="text-violet-400" />
                        <h3 className="font-bold text-lg text-zinc-200">For Developers</h3>
                        <p className="text-zinc-400 md:text-center">
                            Use our API to integrate forms directly into your apps and automate your data collection.
                        </p>
                        <LinkButton href="/developer" variant="primary">
                            <Icon name="Code" size={18} />
                            Get Started
                        </LinkButton>
                    </div>
                    {/* Non-Developer Integration Card */}
                    <div className="bg-zinc-950 p-6 rounded-xl flex flex-col items-center gap-4 shadow-lg border border-zinc-800">
                        <Icon name="Text" size={40} className="text-yellow-300" />
                        <h3 className="font-bold text-lg text-zinc-200">For Everyone</h3>
                        <p className="text-zinc-400 md:text-center">
                            No code? No problem! Easily create forms and send emails with our intuitive dashboard.
                        </p>
                        <LinkButton href="/non-dev" variant="secondary">
                            <Icon name="Send" size={18} />
                            Try Now
                        </LinkButton>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default IntegrateFormoToday;
