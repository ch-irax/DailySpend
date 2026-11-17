import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className={`rounded-[24px] border border-line bg-white p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </motion.div>
  )
}
