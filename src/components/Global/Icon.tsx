// components/Global/Icon.tsx
import * as LucideIcons from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";

function createBrandIcon(paths: React.ReactNode): LucideIcon {
  const BrandIcon = ({
    size = 24,
    strokeWidth = 1.5,
    className,
    ...props
  }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths}
    </svg>
  );
  return BrandIcon as unknown as LucideIcon;
}

const BRAND_ICONS = {
  Facebook: createBrandIcon(
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  ),
  Twitter: createBrandIcon(
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  ),
  Linkedin: createBrandIcon(
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  Instagram: createBrandIcon(
    <>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </>
  ),
} as const;

type BrandIconName = keyof typeof BRAND_ICONS;
export type LucideIconName = keyof typeof LucideIcons | BrandIconName;

interface IconProps extends LucideProps {
  /** Must match a Lucide icon name or supported brand icon name. */
  name: LucideIconName;
  strokeWidth?: number;
}

export function Icon({ name, strokeWidth = 1.5, ...props }: IconProps) {
  const Component = (
    name in BRAND_ICONS
      ? BRAND_ICONS[name as BrandIconName]
      : LucideIcons[name as keyof typeof LucideIcons]
  ) as LucideIcon | undefined;

  if (!Component) return null;
  return <Component {...props} strokeWidth={strokeWidth} />;
}
