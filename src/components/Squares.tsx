type Props = {
    parLength: number;
    cols: number;
};
export const Squares = ({parLength, cols}: Props) => {
    
    return (
        <div className={`bg-yellow-600/10 w-full h-full absolute right-0 top-0 gap-0.5 z-0 grid grid-cols-12 max-sm:grid-cols-4 p-0 overflow-hidden`}>
            {Array.from({length: parLength}, (_, i) => (
                <span className="bg-zinc-600/10" key={i}></span>
            ))}
        </div>    
)
}
