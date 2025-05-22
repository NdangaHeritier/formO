import { HeroSection } from "@/components/Global/HeroSection";
import Solutions from "@/components/Global/Solutions";
import Features from "@/components/Global/Features";



export default function NonDev() {
  return (
    <div className="w-full flex flex-col justify-start gap-5">

        <div className="px-5">
          <HeroSection  />
          <Solutions />
          <Features />
          
        </div>
    </div>
  );
}
