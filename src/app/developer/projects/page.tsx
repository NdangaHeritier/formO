import { Icon } from "@/components/Global/Icon";
import Header from "@/components/Header";
import Link from "next/link";

export default function Projects () {
    return (
        <div className="grid grid-cols-1 gap-0 p-0 m-0 min-h-120">
            <Header />
            <div className="bg-black text-white text-3xl min-h-screen flex items-center justify-center p-10 flex-col gap-7">
                hey this is projects list page! visit it soon enough..

                <div className="p-10 flex items-center justify-center">
                    <Link href="/developer/projects/formo-feedback" className= "text-yellow-200 flex items-center justify-center hover:underline font-bold text-lg" >
                        <Icon name="ArrowRight" className="pe-1" /> Go to Default test project.
                    </Link>
                </div>
            </div>
        </div>
    )
}