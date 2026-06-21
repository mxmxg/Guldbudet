export type Role = 'customer' | 'dealer' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  company_name?: string
  approved: boolean
  created_at: string
}

export interface Item {
  id: string
  owner_id: string
  title: string
  description: string
  weight_grams: number
  karat: string
  min_price?: number
  status: 'pending' | 'approved' | 'active' | 'closed' | 'rejected'
  image_urls: string[]
  created_at: string
  auction_ends_at?: string
  profiles?: Profile
}

export interface Bid {
  id: string
  item_id: string
  dealer_id: string
  amount: number
  created_at: string
  profiles?: Profile
}
