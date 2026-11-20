export const BackGraphicsLayout = () => {
    return (
        <div className="w-full h-[90vh] flex items-center flex-col gap-5 p-4 bg-transparent z-0 my-auto">
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 w-full">
                <div className="grid grid-cols-2 gap-2 p-2">
                    <div className="h-6 flex rounded-lg shadow-sm w-full bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700" />
                    <div className="h-6 flex rounded-lg shadow-sm w-full bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700" />
                </div>
                <div className="mt-1 rounded-lg bg-zinc-100 shadow-sm dark:bg-zinc-900 h-32 w-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 w-full">
                <div className="grid grid-cols-2 gap-5">
                    <div className="h-6 bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 shadow-sm rounded-lg"/>
                    <div className="h-6 bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 shadow-sm rounded-lg"/>
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <div className="h-6 bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 shadow-sm rounded-lg"/>
                    <div className="h-6 bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 shadow-sm rounded-lg flex items-center justify-center gap-2">
                        <div className="bg-zinc-800 h-3 w-3 rounded-full dark:bg-black flex" />
                        <div className="bg-zinc-800 h-3 w-3 rounded-full dark:bg-black flex" />
                        <div className="bg-zinc-800 h-3 w-3 rounded-full dark:bg-black flex" />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 w-full">
                <div className="grid grid-cols-2 gap-2 p-2">
                    <div className="h-6 flex rounded-lg shadow-sm w-full bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700" />
                    <div className="h-6 flex rounded-lg shadow-sm w-full bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700" />
                </div>
                <div className="py-3 grid grid-cols-2 gap-3 h-32 w-full">
                    <div className="rounded-lg bg-zinc-100 shadow-sm dark:bg-zinc-900 grid grid-cols-2 gap-3 p-3">
                        <div className="bg-zinc-200 shadow-sm dark:bg-zinc-800" />
                        <div className="bg-zinc-200 shadow-sm dark:bg-zinc-800" />
                    </div>
                    <div className="rounded-lg bg-zinc-200 shadow-sm dark:bg-zinc-800" />
                    <div className="rounded-lg bg-zinc-200 shadow-sm dark:bg-zinc-800"/>
                    <div className="rounded-lg bg-zinc-200 shadow-sm dark:bg-zinc-800"/>
                </div>
            </div>
        </div>
    )
}