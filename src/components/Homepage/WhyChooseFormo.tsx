import FeatureCard from "../Global/FeatureCard";
import YellowBorderedSpan from "../Global/YellowBorderedSpan";

const WhyChooseFormo: React.FC = () => {
    return (
        <>
            <section className="relative bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-300 dark:border-zinc-900 border-t-0 p-10 max-sm:px-4">
                <div className="flex items-center justify-center flex-col gap-y-6">
                    <YellowBorderedSpan title="Your Go-to solution" />
                    <div className="min-md:w-2/3">
                        <h1 className="text-6xl max-sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-300 pb-5 tracking-tight text-center">
                            Why Go with Formo ?
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400 text-xl max-sm:text-lg py-7">
                            Formo is a <span className="text-green-600 ">Win-to-Win</span> solutions brought just for you to release all your daily battlenecks and give you an easy and simple solution teilored for any of your industry.
                        </p>
                    </div>
                </div>
                <div className="cards py-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <FeatureCard title="Self-Hosted Control" icon="Server" desc="Get control of all your actions through formo." subDesc="Formo gives you a custom workspace to customize, manage and send emails to your destinations in secured and end-to-end encrypted manner." />
                        <FeatureCard title="Dual Power" icon="Code" desc="Make your Development super fast with formo" subDesc="Formo isn't just about delivering emails for you but make your development 10X super fast by handling your backend logic. " />
                        <FeatureCard title="Scalable & Secure" icon="Lock" desc="Whatever you're building or Emailing for. Formo is just here for you" subDesc="Make your work done and recommended within few minutes. With formo you can send unlimited emails to your audience in just fewer clicks." />
                    </div>
                </div>
            </section>
        </>
    );
}

export default WhyChooseFormo;
