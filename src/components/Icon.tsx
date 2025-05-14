// components/Icon.tsx
import * as LucideIcons from 'lucide-react'
import type { LucideProps, LucideIcon } from 'lucide-react'

type LucideIconName = keyof typeof LucideIcons;
interface IconProps extends LucideProps {
  /** must match one of the icon names, e.g. "Car" */
  name: LucideIconName
}

export function Icon({ name, ...props }: IconProps) {
  const Component = LucideIcons[name] as LucideIcon
  if (!Component) return null
  return <Component {...props} strokeWidth={1.5} />
}
