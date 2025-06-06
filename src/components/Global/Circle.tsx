type Props = {
   angle?: string;
   color?: string;
};
export const CircleBlur = ({angle= "top-0 left-0", color="yellow-600"}: Props) => {
    
    return (
        <div className={`bg-transparent w-full h-full absolute ${angle} z-0 p-0 overflow-hidden`}>
            <div
                className={`${color} w-40 h-40 rounded-full gap-0.5`}
            />
        </div>    
)
}
