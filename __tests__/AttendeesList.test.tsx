import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// AttendeesList is a server component — we test the rendered output by
// mocking Supabase and calling the component as an async function.
const mockSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: mockSelect,
          }),
        }),
      }),
    }),
  }),
}))

// Dynamic import after mock is set up
async function renderAttendeesList(eventId: string) {
  const { default: AttendeesList } = await import('@/app/events/[slug]/AttendeesList')
  const jsx = await AttendeesList({ eventId })
  if (!jsx) return null
  return render(jsx)
}

describe('AttendeesList', () => {
  it('returns null when no attendees', async () => {
    mockSelect.mockResolvedValue({ data: [] })
    const result = await renderAttendeesList('evt-1')
    expect(result).toBeNull()
  })

  it('renders attendee names and count heading', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { id: '1', name: 'Alice Smith' },
        { id: '2', name: 'Bob Jones' },
      ],
    })
    await renderAttendeesList('evt-1')
    expect(screen.getByText(/people going \(2\)/i)).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows overflow chip when attendees exceed 24', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      name: `Person ${i}`,
    }))
    mockSelect.mockResolvedValue({ data: many })
    await renderAttendeesList('evt-1')
    expect(screen.getByText('+6')).toBeInTheDocument()
    expect(screen.getByText('more')).toBeInTheDocument()
  })
})
