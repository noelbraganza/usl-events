import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="bg-white border-b border-zinc-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-zinc-900 text-sm">USL Events</span>
            <div className="flex items-center gap-1">
              <Link
                href="/admin/dashboard"
                className="text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 px-3 py-1.5 rounded-md transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/events"
                className="text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 px-3 py-1.5 rounded-md transition-colors"
              >
                Events
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user.email}</span>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
