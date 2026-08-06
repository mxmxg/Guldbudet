export type Role = 'customer' | 'dealer' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  company_name?: string
  approved: boolean
  phone?: string
  personal_number?: string
  address?: string
  postal_code?: string
  city?: string
  org_number?: string
  created_at: string
}

export interface Item {
  id: string
  owner_id: string
  title: string
  description: string
  category?: string
  weight_grams: number
  karat: string
  diamond_carat?: number
  gemstone?: string
  min_price?: number
  status: 'pending' | 'approved' | 'active' | 'closed' | 'rejected'
  image_urls: string[]
  created_at: string
  auction_ends_at?: string
  accepted_bid_id?: string
  accepted_at?: string
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

export interface Notification {
  id: string
  user_id: string
  title: string
  message?: string
  item_id?: string
  read: boolean
  created_at: string
}
