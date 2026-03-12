'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Speaker } from '@/lib/types'

interface Props {
  eventId: string
  initialSpeakers: Speaker[]
}

interface FormState {
  name: string
  title: string
  bio: string
  avatar_url: string
  file: File | null
  preview: string | null
}

const emptyForm = (): FormState => ({
  name: '',
  title: '',
  bio: '',
  avatar_url: '',
  file: null,
  preview: null,
})

export default function SpeakerManager({ eventId, initialSpeakers }: Props) {
  const supabase = createClient()
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers)
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<FormState>(emptyForm())
  const [editForms, setEditForms] = useState<Record<string, FormState>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadAvatar(file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${eventId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('speaker-avatars').upload(path, file)
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('speaker-avatars').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleAdd() {
    if (!addForm.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      let avatar_url = addForm.avatar_url
      if (addForm.file) avatar_url = await uploadAvatar(addForm.file)
      const { data, error } = await supabase
        .from('event_speakers')
        .insert({
          event_id: eventId,
          name: addForm.name.trim(),
          title: addForm.title.trim() || null,
          bio: addForm.bio.trim() || null,
          avatar_url: avatar_url || null,
          display_order: speakers.length,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      setSpeakers((prev) => [...prev, data])
      setAddForm(emptyForm())
      setAddOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add speaker')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(id: string) {
    const f = editForms[id]
    if (!f?.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      let avatar_url = f.avatar_url
      if (f.file) avatar_url = await uploadAvatar(f.file)
      const { data, error } = await supabase
        .from('event_speakers')
        .update({
          name: f.name.trim(),
          title: f.title.trim() || null,
          bio: f.bio.trim() || null,
          avatar_url: avatar_url || null,
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      setSpeakers((prev) => prev.map((s) => (s.id === id ? data : s)))
      setEditingId(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update speaker')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this speaker?')) return
    const { error } = await supabase.from('event_speakers').delete().eq('id', id)
    if (error) { setError(error.message); return }
    setSpeakers((prev) => prev.filter((s) => s.id !== id))
  }

  function openEdit(speaker: Speaker) {
    setEditingId(speaker.id)
    setEditForms((prev) => ({
      ...prev,
      [speaker.id]: {
        name: speaker.name,
        title: speaker.title ?? '',
        bio: speaker.bio ?? '',
        avatar_url: speaker.avatar_url ?? '',
        file: null,
        preview: speaker.avatar_url ?? null,
      },
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-zinc-900">Speakers</h2>
        {!addOpen && (
          <button
            onClick={() => setAddOpen(true)}
            className="text-sm px-3 py-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-700 transition-colors"
          >
            + Add speaker
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {speakers.map((speaker) =>
          editingId === speaker.id ? (
            <SpeakerForm
              key={speaker.id}
              form={editForms[speaker.id]}
              onChange={(patch) =>
                setEditForms((prev) => ({ ...prev, [speaker.id]: { ...prev[speaker.id], ...patch } }))
              }
              onSave={() => handleEdit(speaker.id)}
              onCancel={() => setEditingId(null)}
              saving={saving}
              label="Save changes"
            />
          ) : (
            <div key={speaker.id} className="flex items-start gap-4 p-4 border border-zinc-200 rounded-lg">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 flex-shrink-0 flex items-center justify-center">
                {speaker.avatar_url ? (
                  <Image
                    src={speaker.avatar_url}
                    alt={speaker.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-zinc-400 text-lg font-semibold">{speaker.name[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900">{speaker.name}</p>
                {speaker.title && <p className="text-sm text-zinc-500">{speaker.title}</p>}
                {speaker.bio && <p className="text-sm text-zinc-600 mt-1 line-clamp-2">{speaker.bio}</p>}
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={() => openEdit(speaker)}
                  className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(speaker.id)}
                  className="text-sm text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {addOpen && (
        <div className="mt-4">
          <SpeakerForm
            form={addForm}
            onChange={(patch) => setAddForm((prev) => ({ ...prev, ...patch }))}
            onSave={handleAdd}
            onCancel={() => { setAddOpen(false); setAddForm(emptyForm()) }}
            saving={saving}
            label="Add speaker"
          />
        </div>
      )}
    </div>
  )
}

interface SpeakerFormProps {
  form: FormState
  onChange: (patch: Partial<FormState>) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  label: string
}

function SpeakerForm({ form, onChange, onSave, onCancel, saving, label }: SpeakerFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(file: File | undefined) {
    if (!file) return
    const preview = URL.createObjectURL(file)
    onChange({ file, preview })
  }

  return (
    <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50 space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-200 flex-shrink-0 flex items-center justify-center">
          {form.preview ? (
            <Image src={form.preview} alt="Preview" width={56} height={56} className="w-full h-full object-cover" unoptimized />
          ) : (
            <span className="text-zinc-400 text-xs text-center leading-tight">No photo</span>
          )}
        </div>
        <div>
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm text-zinc-500 underline hover:text-zinc-900 transition-colors"
          >
            {form.preview ? 'Change photo' : 'Upload photo'}
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Name *"
        value={form.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
      />
      <input
        type="text"
        placeholder="Title (e.g. CEO at ACME)"
        value={form.title}
        onChange={(e) => onChange({ title: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
      />
      <textarea
        placeholder="Bio"
        value={form.bio}
        onChange={(e) => onChange({ bio: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
      />

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={saving || !form.name.trim()}
          className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-md hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : label}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
