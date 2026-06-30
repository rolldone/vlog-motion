import type { InventoryItem } from './types'

export const INITIAL_ITEMS: InventoryItem[] = [
  { id: 'senter',     label: 'Senter',     icon: '🔦', durability: 100, maxDurability: 100, useMode: 'single' },
  { id: 'p3k',        label: 'P3K',        icon: '🩹', durability: 100, maxDurability: 100 },
  { id: 'makanan',    label: 'Makanan',    icon: '🍞', durability: 100, maxDurability: 100 },
  { id: 'minuman',    label: 'Minuman',    icon: '💧', durability: 100, maxDurability: 100 },
  { id: 'camera',     label: 'Camera',     icon: '📷', durability: 100, maxDurability: 100 },
  { id: 'powerbank',  label: 'Powerbank',  icon: '🔋', durability: 100, maxDurability: 100 },
  { id: 'jas-hujan',  label: 'Jas Hujan',  icon: '🧥', durability: 100, maxDurability: 100, useMode: 'single' },
]
