export const BackGraphicsLayout = () => {
    return (
        <div className="w-full h-full flex items-center flex-col gap-5 p-4 bg-transparent z-0 transform rotate-30">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 w-full">
                <div className="grid grid-cols-2 gap-2 p-2">
                    <div className="h-6 flex rounded-lg shadow-sm w-full bg-zinc-900 border border-zinc-700" />
                    <div className="h-6 flex rounded-lg shadow-sm w-full bg-zinc-900 border border-zinc-700" />
                </div>
                <div className="mt-1 rounded-lg bg-zinc-900 shadow-sm h-32 w-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 w-full">
                <div className="grid grid-cols-2 gap-5">
                    <div className="h-6 bg-zinc-900 border border-zinc-700 shadow-sm rounded-lg"/>
                    <div className="h-6 bg-zinc-900 border border-zinc-700 shadow-sm rounded-lg"/>
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <div className="h-6 bg-zinc-900 border border-zinc-700 shadow-sm rounded-lg"/>
                    <div className="h-6 bg-zinc-900 border border-zinc-700 shadow-sm rounded-lg flex items-center justify-center gap-2">
                        <div className="bg-black h-3 w-3 rounded-full flex" />
                        <div className="bg-black h-3 w-3 rounded-full flex" />
                        <div className="bg-black h-3 w-3 rounded-full flex" />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 w-full">
                <div className="grid grid-cols-2 gap-2 p-2">
                    <div className="h-6 flex rounded-lg shadow-sm w-full bg-zinc-900 border border-zinc-700" />
                    <div className="h-6 flex rounded-lg shadow-sm w-full bg-zinc-900 border border-zinc-700" />
                </div>
                <div className="py-3 grid grid-cols-2 gap-3 h-32 w-full">
                    <div className="rounded-lg bg-zinc-900 shadow-sm grid grid-cols-2 gap-3 p-3">
                        <div className="bg-zinc-800 shadow-sm" />
                        <div className="bg-zinc-800 shadow-sm" />
                    </div>
                    <div className="rounded-lg bg-zinc-800 shadow-sm" />
                    <div className="rounded-lg bg-zinc-800 shadow-sm"/>
                    <div className="rounded-lg bg-zinc-800 shadow-sm"/>
                </div>
            </div>
        </div>
    )
}