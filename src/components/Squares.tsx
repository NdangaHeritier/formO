type Props = {
    parLength: number;
};
export const Squares = ({parLength}: Props) => {
    
    return (
        <div className={`bg-transparent w-full h-full absolute right-0 top-0 z-0 grid grid-cols-12 max-sm:grid-cols-4 p-0 overflow-hidden`}>
            {Array.from({length: parLength}, (_, i) => (
                <span className="bg-transparent border border-white/5" key={i}></span>
            ))}
        </div>    
)
}
