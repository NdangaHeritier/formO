import { Icon } from "./Icon";

export default function LoadingSpinner({customs="h-screen", size}: {customs?: string, size?: number}) {
    return (
        <div className={`flex items-center justify-center ${customs || ""}`}>
            <Icon name="Loader" size={size || 50} className="animate-spin text-zinc-500" />
        </div>
    );
}