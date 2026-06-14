import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, Edit2, Loader2, Trash2, Plus, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n'
import {
  getBaby,
  getMilestones,
  createMilestone,
  deleteMilestone,
  calculateBabyAge,
  type Baby,
  type BabyMilestone,
} from '@/lib/auth'

export const Route = createFileRoute('/auth/baby/$id')({
  head: () => ({
    meta: [
      { title: 'Baby Profile — The Villageless Mama' },
      { name: 'description', content: 'Your baby\'s milestones and memories.' },
    ],
  }),
  component: BabyProfilePage,
})

function BabyProfilePage() {
  const t = useT()
  const navigate = useNavigate()
  const { id } = Route.useParams()

  const [baby, setBaby] = useState<Baby | null>(null)
  const [milestones, setMilestones] = useState<BabyMilestone[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [milestoneType, setMilestoneType] = useState('')
  const [milestoneDate, setMilestoneDate] = useState('')
  const [milestoneNote, setMilestoneNote] = useState('')

  useEffect(() => {
    loadBaby()
  }, [id])

  async function loadBaby() {
    try {
      const b = await getBaby(id)
      if (b) {
        setBaby(b)
        const m = await getMilestones(id)
        setMilestones(m)
      }
    } catch (err) {
      console.error('❌ Error loading baby:', err)
      toast.error('Could not load baby profile')
      navigate({ to: '/auth/profile' })
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMilestone() {
    if (!baby || !milestoneType.trim() || !milestoneDate) {
      toast.error('Please fill in type and date')
      return
    }
    try {
      await createMilestone({
        baby_id: baby.id,
        type: milestoneType.trim(),
        date: milestoneDate,
        note: milestoneNote.trim() || undefined,
      })
      setShowAddMilestone(false)
      setMilestoneType('')
      setMilestoneDate('')
      setMilestoneNote('')
      loadBaby()
      toast.success('Milestone added!')
    } catch (err) {
      console.error('❌ Error creating milestone:', err)
      toast.error('Could not add milestone')
    }
  }

  async function handleDeleteMilestone(milestoneId: string) {
    if (!confirm('Delete this milestone?')) return
    try {
      await deleteMilestone(milestoneId)
      loadBaby()
      toast.success('Milestone deleted')
    } catch (err) {
      console.error('❌ Error deleting milestone:', err)
      toast.error('Could not delete milestone')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!baby) {
    return (
      <div className="mx-auto max-w-md px-5 pt-12 text-center">
        <p className="text-muted-foreground">Baby not found</p>
        <Link
          to="/auth/profile"
          className="mt-4 inline-block rounded-full bg-primary px-6 py-3 text-primary-foreground"
        >
          Back to profile
        </Link>
      </div>
    )
  }

  const age = calculateBabyAge(baby.birth_date)

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8">
      <Link
        to="/auth/profile"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t('auth.profile')}
      </Link>

      {/* Baby header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {baby.photo_url ? (
              <img
                src={baby.photo_url}
                alt={baby.name}
                className="h-24 w-24 rounded-2xl object-cover"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-2xl bg-secondary text-accent">
                <Heart className="h-10 w-10" />
              </div>
            )}
            <div>
              <h1 className="font-serif text-xl">{baby.name}</h1>
              <p className="text-sm text-muted-foreground">
                {age.years}y {age.months}m {age.days}d old
              </p>
              {baby.gender && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {baby.gender === 'girl' ? '👧 Girl' : baby.gender === 'boy' ? '👦 Boy' : '🧒 Other'}
                </p>
              )}
            </div>
          </div>
          <button className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
            <Edit2 className="h-4 w-4" />
          </button>
        </div>

        {(baby.weight_kg || baby.height_cm) && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {baby.weight_kg && <span>Weight: {baby.weight_kg}kg</span>}
            {baby.height_cm && <span>Height: {baby.height_cm}cm</span>}
          </div>
        )}

        {baby.notes && <p className="mt-4 text-sm text-muted-foreground">{baby.notes}</p>}
      </div>

      {/* Milestones */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-lg">
            <Heart className="h-5 w-5 text-accent" /> Milestones
          </h2>
          <button
            onClick={() => setShowAddMilestone(!showAddMilestone)}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Add milestone
          </button>
        </div>

        {showAddMilestone && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <input
              type="text"
              value={milestoneType}
              onChange={(e) => setMilestoneType(e.target.value)}
              placeholder="Type (e.g., First smile, First tooth)"
              className="mb-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <input
              type="date"
              value={milestoneDate}
              onChange={(e) => setMilestoneDate(e.target.value)}
              className="mb-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <textarea
              value={milestoneNote}
              onChange={(e) => setMilestoneNote(e.target.value)}
              placeholder="Notes..."
              rows={2}
              className="mb-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={handleAddMilestone}
              className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
            >
              Add milestone
            </button>
          </div>
        )}

        {milestones.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No milestones yet. Record special moments!</p>
        ) : (
          <div className="mt-3 space-y-3">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium">{m.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.date).toLocaleDateString()}
                  </p>
                  {m.note && <p className="mt-1 text-sm text-muted-foreground">{m.note}</p>}
                </div>
                <button
                  onClick={() => handleDeleteMilestone(m.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 text-center">
        <Link
          to="/auth/profile"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>
      </div>
    </div>
  )
}
