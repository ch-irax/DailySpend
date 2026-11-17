import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'soft'

interface Props {
  variant?: Variant
  icon?: ReactNode
  className?: string
  children?: ReactNode
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}

const styles: Record<Variant, string> = {
  primary:
    'bg-rose text-white shadow-[var(--shadow-soft)] hover:brightness-95 disabled:opacity-50',
  ghost: 'bg-white text-coffee border border-line hover:bg-cream',
  danger: 'bg-white text-[#B46B6B] border border-line hover:bg-blush',
  soft: 'bg-blush text-coffee hover:bg-[#f8dede]',
}

export function Button({
  variant = 'primary',
  icon,
  className = '',
  children,
  type = 'button',
  disabled,
  onClick,
}: Props) {
  const reduce = useReducedMotion()
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-medium transition ${styles[variant]} ${className}`}
    >
      {icon}
      {children}
    </motion.button>
  )
}
