import {
  Clapperboard,
  GraduationCap,
  Heart,
  MoreHorizontal,
  Plane,
  Receipt,
  ShoppingBag,
  User,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import type { Category } from '../types/expense'

export const CATEGORY_META: Record<
  Category,
  { icon: LucideIcon; tint: string; chip: string }
> = {
  'Food & Drinks': { icon: UtensilsCrossed, tint: 'bg-[#FCE8E8]', chip: 'bg-[#FCE8E8] text-[#8B6F61]' },
  Travel: { icon: Plane, tint: 'bg-[#EFE6DC]', chip: 'bg-[#EFE6DC] text-[#8B6F61]' },
  Shopping: { icon: ShoppingBag, tint: 'bg-[#F6E4DC]', chip: 'bg-[#F6E4DC] text-[#8B6F61]' },
  'Bills & Utilities': { icon: Receipt, tint: 'bg-[#F3E6EA]', chip: 'bg-[#F3E6EA] text-[#8B6F61]' },
  Education: { icon: GraduationCap, tint: 'bg-[#E9EFE4]', chip: 'bg-[#E9EFE4] text-[#6F7D68]' },
  Health: { icon: Heart, tint: 'bg-[#F8E3E5]', chip: 'bg-[#F8E3E5] text-[#8B6F61]' },
  Entertainment: { icon: Clapperboard, tint: 'bg-[#F4E8F0]', chip: 'bg-[#F4E8F0] text-[#8B6F61]' },
  Personal: { icon: User, tint: 'bg-[#EEE7E1]', chip: 'bg-[#EEE7E1] text-[#8B6F61]' },
  Other: { icon: MoreHorizontal, tint: 'bg-[#F0E7E2]', chip: 'bg-[#F0E7E2] text-[#8B6F61]' },
}

export const CHART_COLORS = [
  '#D98C91',
  '#8B6F61',
  '#A5B99C',
  '#E3B7B4',
  '#C4A494',
  '#B7C6AE',
  '#D4A5A5',
  '#9B8B83',
  '#E8C4B8',
]
