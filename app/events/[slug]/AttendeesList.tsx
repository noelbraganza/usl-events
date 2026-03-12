import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

const animals = [
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/6231ac0372a11ceb1506b829_Duckorn.avif',
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/5fe0cd2980460ca0bd0d3202_Sharky_USL.avif',
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/5fdbcc6ca026ba567f345368_FrogDestroyer.avif',
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/5fdbcc650d32d44b9d92a4c7_Owlie.avif',
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/5fdbcc67054e8e3ba1e8007f_Kittykat.avif',
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/5fdbcc6a7ac0d8d48593313e_BunnyHoney.avif',
]

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
        {shown.map((rsvp, index) => {
          const firstName = (rsvp.name ?? 'Guest').split(' ')[0]
          const animal = animals[index % animals.length]

          return (
            <div key={rsvp.id} className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={animal}
                  alt={firstName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized
                />
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
