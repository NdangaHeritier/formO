import FeatureCard from "../Global/FeatureCard";
import YellowBorderedSpan from "../Global/YellowBorderedSpan";

const DeveloperSolutions: React.FC = () => {
    return (
    <section className="relative bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-900 border-t-0 p-10">
      <div className="flex items-center justify-center flex-col gap-y-6">
        <YellowBorderedSpan title="Built for Developers and Teams" />
        <div className="min-md:w-2/3">
          <h1 className="text-6xl font-extrabold text-zinc-300 pb-5 tracking-tight text-center">
            Developer-First, Always
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-xl py-7 text-center">
            Formo is built with <span className="text-green-600">developer love</span> in mind. Easily plug-and-play APIs, workspaces designed to reduce backend stress, and tools that scale with your team and project.
          </p>
        </div>
      </div>
      <div className="cards py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard 
            title="Plug & Play API" 
            icon="PlugZap" 
            desc="Integrate in minutes with our simple, robust developer-first API." 
            subDesc="You get clear docs, predictable responses, and instant delivery. Your devs will thank you." 
          />
          <FeatureCard 
            title="Workspace & Collaboration" 
            icon="Users" 
            desc="Team-friendly dashboards for managing forms, emails, and flows together." 
            subDesc="Invite team members, manage roles, and work in sync across departments." 
          />
          <FeatureCard 
            title="Developer Tools" 
            icon="Terminal" 
            desc="Debug logs, testing environments, and version control out of the box." 
            subDesc="We handle all the backend stress so you can focus on building the next big thing." 
          />
        </div>
      </div>
    </section>
    );
}

export default DeveloperSolutions;