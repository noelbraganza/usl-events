import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RSVPForm from '@/app/events/[slug]/RSVPForm'

const mockSignInWithOtp = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
    },
  }),
}))

describe('RSVPForm', () => {
  beforeEach(() => {
    mockSignInWithOtp.mockReset()
  })

  it('renders name and email fields with submit button', () => {
    render(<RSVPForm eventId="evt-1" eventSlug="test-event" isFull={false} />)
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get my free spot/i })).toBeInTheDocument()
  })

  it('shows "Join waitlist" label when event is full', () => {
    render(<RSVPForm eventId="evt-1" eventSlug="test-event" isFull={true} />)
    expect(screen.getByRole('button', { name: /join waitlist/i })).toBeInTheDocument()
  })

  it('disables button while loading and shows sending state', async () => {
    mockSignInWithOtp.mockReturnValue(new Promise(() => {})) // never resolves
    const user = userEvent.setup()
    render(<RSVPForm eventId="evt-1" eventSlug="test-event" isFull={false} />)

    await user.type(screen.getByLabelText(/your name/i), 'Noel')
    await user.type(screen.getByLabelText(/email address/i), 'noel@example.com')
    await user.click(screen.getByRole('button', { name: /get my free spot/i }))

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
  })

  it('shows success state after OTP sent', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    render(<RSVPForm eventId="evt-1" eventSlug="test-event" isFull={false} />)

    await user.type(screen.getByLabelText(/your name/i), 'Noel')
    await user.type(screen.getByLabelText(/email address/i), 'noel@example.com')
    await user.click(screen.getByRole('button', { name: /get my free spot/i }))

    await waitFor(() =>
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    )
  })

  it('shows error message on failure', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: { message: 'Email rate limit exceeded' } })
    const user = userEvent.setup()
    render(<RSVPForm eventId="evt-1" eventSlug="test-event" isFull={false} />)

    await user.type(screen.getByLabelText(/your name/i), 'Noel')
    await user.type(screen.getByLabelText(/email address/i), 'noel@example.com')
    await user.click(screen.getByRole('button', { name: /get my free spot/i }))

    await waitFor(() =>
      expect(screen.getByText(/email rate limit exceeded/i)).toBeInTheDocument()
    )
  })
})
