import { HeroSection } from "@/components/Non-Developer/HeroSection";
import Solutions from "@/components/Non-Developer/Solutions";
import Features from "@/components/Global/Features";
import WhyChooseus from "@/components/Non-Developer/WhyChooseus";
import Header from "@/components/Header";
import PrivateRouter from "@/components/Global/privateRouter";



export default function NonDev() {
  return (
    <PrivateRouter>
      <Header />
      <div className="px-5">
        <HeroSection  />
        <Features />
        <Solutions />
        <WhyChooseus />        
      </div>
    </PrivateRouter>
  );
}
