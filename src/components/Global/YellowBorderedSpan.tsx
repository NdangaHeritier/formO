import { Icon } from "./Icon";

type Props = {
    title: string
}
const YellowBorderedSpan = ({title}: Props) => {
    return (
        <>
            <div className="bg-gradient-to-l from-yellow-700 from-20% to-yellow-700/5 rounded-full p-1">
                <div className="dark:bg-black bg-white rounded-full">
                    <div className="bg-yellow-700/10 rounded-full font-semibold p-2 flex items-center justify-center gap-1 text-sm">
                        <span className="text-zinc-600 dark:text-zinc-500 px-2">{title}</span>
                        <Icon name="ArrowUpRight" size={25} className="rounded-full text-yellow-600 p-1 bg-yellow-700/10" />
                                              
                    </div>
                </div>
            </div>
        </>
    );
}

export default YellowBorderedSpan;