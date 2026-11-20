import { Icon } from "@/components/Global/Icon";

// declaring types for props..
type LayoutProps = {
    children: React.ReactNode,
    onClick?: () => void;
}

const Layout = ({children, onClick}:LayoutProps) => {
    return (
        <section className="fixed top-0 bottom-0 left-0 right-0 p-3 z-50 overflow-auto sm:p-5 bg-white/90 dark:bg-black/90 flex flex-col items-center justify-center">
            <div className="closeLink inline-flex absolute top-4 right-4 p-2 sm:top-10 sm:right-10 sm:p-5">
                <button
                  className="bg-zinc-100 p-3 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 rounded-full cursor-pointer border border-zinc-300 dark:border-zinc-700"
                  onClick={onClick}
                >
                    <Icon className="text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white" size={18} name="X" strokeWidth={2} />
                </button>
            </div>
            {children}
        </section>
    )
}

export default Layout;