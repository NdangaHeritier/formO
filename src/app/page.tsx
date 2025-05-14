import { Hero } from "@/components/Homepage/Hero";

export default function Home() {
  return (
    <div className="w-full flex flex-col justify-start gap-5">

        <div className="px-5">
          <Hero />
        </div>

        {/* About The FOrmo Features
        <div className="about-section p-10 h-full w-full bg-zinc-200/10">
            <h2 className="text-4xl font-bold text-zinc-900 pb-5">About FormO</h2>
            <p className="text-lg text-zinc-700">FormO is a powerful email integration solution that makes sending emails easy and efficient.</p>
            <p className="text-lg text-zinc-700">We provide a simple API that allows you to send emails with just a few lines of code.</p>
            <p className="text-lg text-zinc-700">Our goal is to make your coding experience faster and more enjoyable.</p>
            <p className="text-lg text-zinc-700">With FormO, you can send emails in just a few lines of code, making your coding experience faster and more enjoyable.</p>
        </div>
        <div className="company-section p-10 h-full w-full bg-zinc-300/10">
            <h2 className="text-4xl font-bold text-zinc-900 pb-5">Our Team</h2>
            <p className="text-lg text-zinc-700">We are a team of passionate developers who love coding and building amazing products.</p>
            <p className="text-lg text-zinc-700">We believe that coding should be fun and enjoyable, and we strive to make that a reality with FormO.</p>
            <p className="text-lg text-zinc-700">Our team is dedicated to providing the best email integration solution for developers.</p>
            <p className="text-lg text-zinc-700">We are constantly working to improve our API and make it even easier to use.</p>
            <p className="text-lg text-zinc-700">We are always looking for feedback and suggestions from our users, so please feel free to reach out to us.</p>
        </div> */}
    </div>
  );
}
