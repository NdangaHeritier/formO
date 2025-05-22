import MeetTeam from "@/components/Homepage/Contributors";
import CustomizeTemplates from "@/components/Homepage/CustomizeTemplate";
import DeveloperSolutions from "@/components/Homepage/DeveloperSolution";
import Features from "@/components/Homepage/Features";
import { Hero } from "@/components/Homepage/Hero";
import IntegrateFormoToday from "@/components/Homepage/IntegrateFormoToday";
import NonDevSolutions from "@/components/Homepage/NonDevSolutions";
import QuickActionSection from "@/components/Homepage/QuickActionSection";
import UseCase from "@/components/Homepage/UseCases";
import WhyChooseFormo from "@/components/Homepage/WhyChooseFormo";


export default function Home() {
  return (
    <div className="w-full flex flex-col justify-start gap-5">

        <div className="px-5">
          <Hero  />
          <WhyChooseFormo />
          <DeveloperSolutions />
          <NonDevSolutions />
          <IntegrateFormoToday />
          <CustomizeTemplates />
          <Features />
          <UseCase />
          <MeetTeam />
          <QuickActionSection />
        </div>
    </div>
  );
}
