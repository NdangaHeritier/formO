import Image from "next/image";
import { Icon } from "../Global/Icon";
import Link from "next/link";
import LinkButton from "../Global/LinkButton";

const MeetTeam: React.FC = () => {
    return (
        <>
            <section className="relative bg-zinc-50 dark:bg-black p-10 max-sm:p-5 flex max-sm:flex-col items-center justify-center">
                <div className="sm:flex-2/3">
                    <h1 className="text-4xl font-extrabold dark:text-zinc-300 text-zinc-900 pb-5 tracking-tight text-center">
                        Meet The Team Behind Formo.
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 text-xl py-7 text-center">
                        Formo is built with <span className="text-yellow-200 font-mono">developer love</span> in mind by <span className="underline decoration-dotted">Ndanga and Samuel</span>
                    </p>
                    <div className="flex items-center justify-center">
                        <LinkButton href="https://github.com/NdangaHeritier/formo">
                            <Icon name="GitPullRequest" size={16} />
                            Visit on Github
                        </LinkButton>
                    </div>
                </div>
                <div className="grid mx-auto grid-cols-1 md:grid-cols-2 gap-5 p-3 min-w-4xl">
                    {/* Contributor 1 */}
                    <div className="bg-zinc-950 p-2 pt-10 rounded-xl flex items-center justify-center gap-3 flex-col">
                        <Image
                            src={`/Assets/Avatars/Live Photos.png`}
                            alt=""
                            width={100}
                            height={100}
                            className="bg-zinc-900 border-zinc-800 border-2 rounded-full w-15 h-15 flex"
                        />
                        <h2 className="font-bold text-base text-zinc-200 pt-3 px-5">
                            Ndanga Heritier
                        </h2>
                        <p className="text-xs text-zinc-500 uppercase px-5">The Real Projectoo-er</p>
                        <Link href="https://ndanga-heritier.vercel.app" className="text-sm flex items-center gap-1 text-zinc-200 hover:text-zinc-50 hover:underline">
                            Visit Page
                            <Icon name= "ArrowUpRightSquare" size={15} />
                        </Link>
                        <div className="stats flex items-center justify-start gap-3 pt-3 w-full">
                            <div className="contributions text-xs font-semibold grid grid-rows-2 border rounded-lg border-zinc-800 w-full overflow-hidden">
                                <div className="p-3 bg-transparent text-gray-400 flex items-center justify-center gap-2 flex-col">
                                    <Icon name="GitCommit" size={24} strokeWidth={2} className="text-green-400" />
                                    Contributions
                                </div>
                                <div className="font-bold text-2xl text-white bg-zinc-800 p-3 flex items-center justify-center">
                                    50
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* contributor two */}                       
                    <div className="bg-zinc-950 p-2 pt-7 rounded-xl flex items-center justify-center gap-3 flex-col">
                        <Image
                            src={`/Assets/Avatars/Sports Man.png`}
                            alt=""
                            width={100}
                            height={100}
                            className="bg-zinc-900 border-zinc-800 border-2 rounded-full w-15 h-15 flex"
                        />
                        <h2 className="font-bold text-base text-zinc-200 pt-5 px-5">
                            Samuel Altone
                        </h2>
                        <p className="text-xs text-zinc-500 uppercase px-5">Software Developer</p>
                        <Link href="https://umuhoza-samuel.vercel.app" className="text-sm flex items-center gap-1 text-zinc-200 hover:text-zinc-50 hover:underline">
                            Visit Page
                            <Icon name= "ArrowUpRightSquare" size={15} />
                        </Link>
                        <div className="stats flex items-center justify-start gap-3 pt-3 w-full">
                            <div className="contributions text-xs font-semibold grid grid-rows-2 border rounded-lg border-zinc-800 w-full overflow-hidden">
                                <div className="p-3 bg-transparent text-gray-400 flex items-center justify-center gap-2 flex-col">
                                    <Icon name="GitCommit" size={24} strokeWidth={2} className="text-green-400" />
                                    Contributions
                                </div>
                                <div className="font-bold text-2xl text-white bg-zinc-800 p-3 flex items-center justify-center">
                                    6
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default MeetTeam;