import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { sendInviteEmail } from '@/lib/sendInvite'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const isRsvp = searchParams.get('rsvp') === 'true'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  if (isRsvp) {
    // Extract event slug from next param e.g. /events/ai-for-non-dummies
    const match = next.match(/\/events\/([^/?]+)/)
    const eventSlug = match?.[1]
    const name = user.user_metadata?.full_name ?? null

    if (eventSlug) {
      const { data: event } = await supabase
        .from('events')
        .select('id, capacity')
        .eq('slug', eventSlug)
        .single()

      if (event) {
        const { count } = await supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'confirmed')

        const isFull = event.capacity ? (count ?? 0) >= event.capacity : false
        const rsvpStatus = isFull ? 'waitlist' : 'confirmed'

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

        return NextResponse.redirect(`${origin}${next}?rsvp=${rsvpStatus}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
