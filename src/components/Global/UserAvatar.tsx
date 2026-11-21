"use client";
import Image from "next/image";
import { useState } from "react";

const FALLBACK = "/Assets/Avatars/Sleep Mode.png";

type Props = {
  src?: string | null;
  size?: number;
  className?: string;
  alt?: string;
};

/** Renders a user's avatar, falling back to a bundled image if it can't load. */
export default function UserAvatar({ src, size = 40, className = "", alt = "Profile picture" }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(src) && failedSrc === src;

  return (
    <Image
      src={src && !failed ? src : FALLBACK}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailedSrc(src ?? null)}
      className={`rounded-full object-cover ${className}`}
    />
  );
}
