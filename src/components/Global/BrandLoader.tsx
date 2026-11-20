import Image from "next/image";

type Props = {
  size?: number;
  className?: string;
  label?: string;
};

/** Full-page loading state: the FormO logo inside a spinning progress ring. */
export default function BrandLoader({ size = 56, className = "", label = "Loading FormO" }: Props) {
  return (
    <div
      role="status"
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-zinc-200 border-t-yellow-500 dark:border-zinc-800 dark:border-t-yellow-400" />
      <Image
        src="/Assets/formo-coloured.png"
        alt=""
        width={size}
        height={size}
        priority
        className="object-contain"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
