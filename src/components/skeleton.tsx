type SkeletonTypes ={
    customStyle?: string,
    shown?: boolean
}

function SkeletonBox ({customStyle= "w-full h-full rounded-md", shown= true}: SkeletonTypes){
    if (!shown) return;
    return(
        <div className={`bg-zinc-200 dark:bg-zinc-800 animate-pulse flex ${customStyle}`}></div>
    )
}

export default SkeletonBox;