export interface CostItem {
  id: string
  label: string
  icon: string
  amount: number
  category?: string
}

export interface CostEntry {
  id: string
  itemId: string
  label: string
  icon: string
  amount: number
  type: 'expense' | 'income'
}
