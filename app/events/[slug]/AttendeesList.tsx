import { createClient } from '@/lib/supabase/server'

interface Props {
  eventId: string
}

export default async function AttendeesList({ eventId }: Props) {
  const supabase = createClient()

  const { data: rsvps } = await supabase
    .from('rsvps')
    .select('id, name')
    .eq('event_id', eventId)
    .eq('status', 'confirmed')
    .order('created_at')

  if (!rsvps || rsvps.length === 0) return null

  const displayMax = 24
  const shown = rsvps.slice(0, displayMax)
  const overflow = rsvps.length - displayMax

  return (
    <div className="mt-8 pt-8 border-t border-zinc-100">
      <h2 className="text-base font-semibold text-zinc-900 mb-5">
        People going ({rsvps.length})
      </h2>
      <div className="flex flex-wrap gap-4">
        {shown.map((rsvp) => {
          const firstName = (rsvp.name ?? 'Guest').split(' ')[0]
          const initials = (rsvp.name ?? 'G')
            .split(' ')
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()

          return (
            <div key={rsvp.id} className="flex flex-col items-center gap-1.5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #905AC0, #D03B6E)' }}
              >
                {initials}
              </div>
              <span className="text-xs text-zinc-500 max-w-[48px] text-center truncate">
                {firstName}
              </span>
            </div>
          )
        })}
        {overflow > 0 && (
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: 'rgba(144,90,192,0.1)', color: '#905AC0' }}
            >
              +{overflow}
            </div>
            <span className="text-xs text-zinc-400">more</span>
          </div>
        )}
      </div>
    </div>
  )
}
