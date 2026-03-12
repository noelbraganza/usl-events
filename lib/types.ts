export type Event = {
  id: string
  title: string
  slug: string
  tagline: string | null
  description: string | null
  start_date: string
  end_date: string
  location: string
  location_url: string | null
  capacity: number | null
  published: boolean
  status: 'upcoming' | 'live' | 'past' | 'cancelled'
  cover_image: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export type Speaker = {
  id: string
  event_id: string
  name: string
  title: string | null
  bio: string | null
  avatar_url: string | null
  display_order: number
  created_at: string
}

export type RSVP = {
  id: string
  event_id: string
  user_id: string | null
  email: string
  name: string | null
  status: 'confirmed' | 'waitlist' | 'cancelled'
  notes: string | null
  invite_sent: boolean
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  updated_at: string
}
