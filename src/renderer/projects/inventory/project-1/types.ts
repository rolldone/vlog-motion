export type ItemId =
  | 'senter'
  | 'p3k'
  | 'makanan'
  | 'minuman'
  | 'camera'
  | 'powerbank'
  | 'jas-hujan'
  | 'tongkat'
  | 'smartphone'

export interface InventoryItem {
  id: ItemId
  label: string
  icon: string        // emoji / icon
  durability: number  // 0–100
  maxDurability: number
  useMode?: 'single'  // optional — if set, shows single "Use" button instead of % buttons
}

export interface InventoryState {
  items: InventoryItem[]
}
