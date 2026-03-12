import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id, name, email, status = 'confirmed' } = await request.json()
  if (!event_id || !email) {
    return NextResponse.json({ error: 'event_id and email are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('rsvps')
    .insert({ event_id, name: name || null, email, status, user_id: null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
