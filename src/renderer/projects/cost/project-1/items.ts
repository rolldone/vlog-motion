import type { CostItem } from './types'

export const INITIAL_ITEMS: CostItem[] = [
  { id: 'parkir',    label: 'Parkir',      icon: '🅿️', amount: 10000,  category: 'transport' },
  { id: 'tiket',     label: 'Tiket Masuk', icon: '🎫', amount: 25000,  category: 'tiket' },
  { id: 'makan',     label: 'Makan',       icon: '🍜', amount: 35000,  category: 'food' },
  { id: 'minum',     label: 'Minum',       icon: '🥤', amount: 10000,  category: 'food' },
  { id: 'transport', label: 'Transport',   icon: '🚗', amount: 50000,  category: 'transport' },
  { id: 'souvenir',  label: 'Souvenir',    icon: '🎁', amount: 50000,  category: 'other' },
  { id: 'camping',   label: 'Camping',     icon: '⛺', amount: 40000,  category: 'other' },
]
