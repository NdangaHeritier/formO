import Header from "@/components/Header";
import PrivateRouter from "@/components/Global/privateRouter";
import DashboardOverview from "@/components/Non-Developer/DashboardOverview";

export default function NonDev() {
  return (
    <PrivateRouter>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5">
        <DashboardOverview />
      </main>
    </PrivateRouter>
  );
}
