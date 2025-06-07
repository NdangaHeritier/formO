import { HeroSection } from "@/components/Non-Developer/HeroSection";
import Solutions from "@/components/Non-Developer/Solutions";
import Features from "@/components/Global/Features";
import WhyChooseus from "@/components/Non-Developer/WhyChooseus";
import Header from "@/components/Header";



export default function NonDev() {
  return (
    <div className="w-full flex flex-col justify-start gap-5">
      <Header />

        <div className="px-5">
          <HeroSection  />
          <Features />
          <Solutions />
          <WhyChooseus />
          
        </div>
    </div>
  );
}
