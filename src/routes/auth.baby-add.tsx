import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Plus, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n'
import {
  getCurrentUser,
  createBaby,
} from '@/lib/auth'

export const Route = createFileRoute('/auth/baby-add')({
  head: () => ({
    meta: [
      { title: 'Add Baby — The Villageless Mama' },
      { name: 'description', content: 'Add your baby to your profile.' },
    ],
  }),
  component: AddBabyPage,
})

function AddBabyPage() {
  const t = useT()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'girl' | 'boy' | 'other' | ''>('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [notes, setNotes] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    const user = await getCurrentUser()
    if (!user) {
      navigate({ to: '/auth/login' })
      return
    }
    setUserId(user.id)
    setLoading(false)
  }

  async function handleSave() {
    if (!userId || !name.trim() || !birthDate) {
      toast.error('Please fill in baby name and birth date')
      return
    }

    setSaving(true)
    try {
      await createBaby({
        user_id: userId,
        name: name.trim(),
        birth_date: birthDate,
        gender: (gender || undefined) as 'girl' | 'boy' | 'other' | undefined,
        weight_kg: weight ? parseFloat(weight) : undefined,
        height_cm: height ? parseFloat(height) : undefined,
        notes: notes.trim() || undefined,
      })
      toast.success('Baby added!')
      navigate({ to: '/auth/profile' })
    } catch (err) {
      console.error('❌ Baby creation error:', err)
      toast.error('Could not add baby')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8">
      <Link
        to="/auth/profile"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t('auth.profile')}
      </Link>

      <h1 className="font-serif text-2xl">Add Baby</h1>
      <p className="mt-1 text-sm text-muted-foreground">Record your baby's details and milestones.</p>

      <div className="mt-8 flex items-center gap-6">
        <div className="grid h-28 w-28 place-items-center rounded-2xl bg-secondary text-accent">
          <Heart className="h-12 w-12" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Add baby details to start tracking milestones</p>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Baby's name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
            placeholder="Baby's name"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Birth date *
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as any)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          >
            <option value="">Select gender</option>
            <option value="girl">Girl</option>
            <option value="boy">Boy</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Height (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
              placeholder="0.0"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
            placeholder="Any special notes about your baby..."
          />
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          type="button"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Baby
        </button>
        <Link
          to="/auth/profile"
          className="flex-1 rounded-xl border border-border py-3 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}
