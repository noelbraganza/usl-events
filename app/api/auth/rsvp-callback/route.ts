import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { sendInviteEmail } from '@/lib/sendInvite'

export async function POST(request: NextRequest) {
  const { next } = await request.json()
  const origin = new URL(request.url).origin

  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ redirect: '/auth/login?error=auth_failed' })
  }

  const match = (next as string)?.match(/\/events\/([^/?]+)/)
  const eventSlug = match?.[1]

  if (!eventSlug) {
    return NextResponse.json({ redirect: next ?? '/' })
  }

  const { data: event } = await supabase
    .from('events')
    .select('id, capacity')
    .eq('slug', eventSlug)
    .single()

  if (!event) {
    return NextResponse.json({ redirect: next ?? '/' })
  }

  const { count } = await supabase
    .from('rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .eq('status', 'confirmed')

  const isFull = event.capacity ? (count ?? 0) >= event.capacity : false
  const rsvpStatus = isFull ? 'waitlist' : 'confirmed'
  const name = user.user_metadata?.full_name ?? null

  const { data: rsvp } = await supabase
    .from('rsvps')
    .upsert(
      {
        event_id: event.id,
        user_id: user.id,
        email: user.email!,
        name,
        status: rsvpStatus,
      },
      { onConflict: 'event_id,user_id' }
    )
    .select()
    .single()

  if (rsvp && rsvpStatus === 'confirmed' && !rsvp.invite_sent) {
    await sendInviteEmail({ userId: user.id, eventId: event.id, origin })
  }

  if (rsvpStatus === 'confirmed') {
    return NextResponse.json({ redirect: `/events/${eventSlug}/confirmed` })
  }
  return NextResponse.json({ redirect: `${next}?rsvp=waitlist` })
}
