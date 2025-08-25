"use client";
import { Icon } from "@/components/Global/Icon";
import SmallBtn from "@/components/Global/smallBtn";
import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProjectPage (){
    const {name} = useParams();
    return (
        <section className="flex flex-col min-h-screen w-full text-zinc-400">
            <Header />
            <div className="flex h-full flex-1">
                <div className="grid grid-cols-1 sticky bottom-0 p-2 bg-zinc-950 w-20 h-screen overflow-auto border-r border-zinc-800">
                    <div className="items-center justify-start flex-col p-3 flex gap-3">
                        <Link href="/developer/projects" className="text-zinc-500 hover:text-zinc-300 rounded-xl p-2 flex items-center justify-center cursor-pointer gap-2 hover:bg-zinc-900">
                            <Icon name="LayoutDashboard" size={20} strokeWidth={2} />
                        </Link>
                        <Link href={`/developer/${name}/Analytics`} className="text-zinc-500 hover:text-zinc-300">
                            <Icon name="ChartNoAxesColumn" size={20} strokeWidth={2} />
                        </Link>
                    </div>                    
                    <div className="flex self-end items-center justify-end flex-col gap-3 p-3 h-full rounded-full bg-black">
                        <button className="bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-full flex h-12 w-12 flex items-center justify-center cursor-pointer">
                            <Icon name="Plus" strokeWidth={2} size={22} />
                        </button>
                        <button className="bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-full flex h-12 w-12 flex items-center justify-center cursor-pointer">
                            <Icon name="FolderOpen" strokeWidth={2} size={22} />
                        </button>
                        <button className="bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-full flex h-12 w-12 flex items-center justify-center cursor-pointer">
                            <Icon name="Bolt" strokeWidth={2} size={22} />
                        </button>
                         <button className="bg-zinc-900/60 hover:bg-zinc-900 rounded-full flex h-12 w-12 flex items-center justify-center cursor-pointer">
                            <Image
                                src="/Assets/Avatars/Sleep Mode.png"
                                alt=""
                                width={60}
                                height={60}
                                className="rounded-full"
                            />
                        </button>
                    </div>
                </div>
                <div className="re-size relative h-screen">
                    <button className="absolute top-20 -left-3">
                        <Icon name="FlipHorizontal" className="h-6 w-6 p-1 flex items-center justify-center rounded-full bg-black border border-zinc-800 text-zinc-500 hover:text-zinc-300 cursor-col-resize" />
                    </button>
                </div>
                <div className="flex-1 h-screen overflow-auto block">
                    <div className="p-10 grid grid-cols-1">
                        <div className="bg-zinc-950 rounded-2xl p-10">
                            <div className="grid grid-cols-2 gap-1">
                                <div className="title-and-desc">
                                    <Icon name="Code2" strokeWidth={2} className="w-16 h-16 p-4 rounded-full bg-gradient-to-br from-zinc-900 to-transparent shadow-xl"/>
                                    <h2 className="text-zinc-200 fnt-bold text-2xl pt-4 pb-2">
                                        {name}
                                    </h2>
                                    <p className="text-zinc-400 text-base">
                                        {name} is a project focused on improving Lorem Ipsum dore..
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 grid-rows-2 gap-5">
                                    <div className="bg-zinc-900/70 shadow-lg rounded-lg"></div>
                                    <div className="bg-zinc-900/70 shadow-lg rounded-lg"></div>
                                    <div className="bg-zinc-900/70 shadow-lg rounded-lg"></div>
                                    <div className="bg-zinc-900/70 shadow-lg rounded-lg"></div>
                                </div>
                            </div>
                        </div>

                        {/* charts and frequently used forms */}

                        <div className="grid grid-cols-2 gap-5 py-16">
                            <div className="chart flex items-center jutify-center">
                                <div className="flex items-center justify-center gap-5">
                                    <div className="h-50 w-50 bg-zinc-900 overflow-hidden rounded-full grid-cols-2 grid-rows-2 grid gap-0.5 transform">
                                        <div className="bg-zinc-800" />
                                        <div className="bg-red-500/40" />
                                        <div className="bg-green-600/40" />
                                        <div className="bg-yellow-600/30" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-4 h-4 rounded-md bg-green-600/40"></span>
                                            Delivered Successfully.
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-4 h-4 rounded-md bg-yellow-600/30"></span>
                                            Delivered but failed to reach.
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-4 h-4 rounded-md bg-red-500/40"></span>
                                            Spams.
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-4 h-4 rounded-md bg-zinc-800"></span>
                                            Not Delivered
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* frequent activity tab */}

                            <div className="grid grid-cols-1">
                                <div className="title flex items-center justify-start gap-2 py-4 font-bold">
                                    <Icon size={16} strokeWidth={2} name="ClockFading" className="" />
                                    Freqently interacted Forms.
                                </div>
                                <div className="bg-zinc-950 rounded-2xl">
                                    <div className="sort-and-filters p-5 flex items-center justify-end gap-2">
                                        <span className="text-xs p-0.5 px-1 rounded-md border border-dashed border-zinc-800 text-green-600">Filter by</span>
                                        <SmallBtn variant="secondary">
                                            <Icon name="CirclePlus" size={15} className="text-sm"/>
                                            project
                                        </SmallBtn>
                                        <SmallBtn variant="secondary">
                                            <Icon name="CirclePlus" size={15} className="text-sm"/>
                                            status
                                        </SmallBtn>
                                        <SmallBtn variant="secondary">
                                            <Icon name="CirclePlus" size={15} className="text-sm"/>
                                            submissions
                                        </SmallBtn >
                                    </div>
                                    <div className="p-2 h-40 w-full flex items-center justify-center">
                                        No data Found
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent submissions.. */}

                        <div className="rounded-xl bg-zinc-950 overflow-hidden">
                            <div className="head flex items-center bg-zinc-950 border-b border-zinc-800 justify-start gap-2 p-5">
                                <Icon name="FileClock" className="" size={16} />
                                Recent Submissions
                            </div>
                            <div className="bg-zinc-950 p-5 flex items-center justify-center text-zinc-500 h-54">
                                No data found.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}