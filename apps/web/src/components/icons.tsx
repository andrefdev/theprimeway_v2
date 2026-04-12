import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function defaults(size: number, props: SVGProps<SVGSVGElement>) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    ...props,
  }
}

export function PlusIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function TrashIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}

export function EditIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function CheckIcon({ size = 10, strokeWidth = 3, ...props }: IconProps) {
  return (
    <svg {...defaults(size, { strokeWidth, ...props })}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function ChevronLeftIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function ChevronRightIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function PinIcon({ size = 14, filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...defaults(size, { fill: filled ? 'currentColor' : 'none', ...props })}>
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  )
}

export function TargetIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

export function MoreVerticalIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SearchIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function TagIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

export function FilterIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

export function WarningIcon({ size = 32, strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <svg {...defaults(size, { strokeWidth, ...props })}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
