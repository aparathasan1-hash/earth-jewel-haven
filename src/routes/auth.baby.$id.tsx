import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, Edit2, Loader2, Trash2, Plus, Heart, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n'
import {
  getBaby,
  getMilestones,
  createMilestone,
  deleteMilestone,
  getBabyMeasurements,
  saveBabyMeasurement,
  deleteBabyMeasurement,
  calculateBabyAge,
  type Baby,
  type BabyMilestone,
  type BabyMeasurement,
} from '@/lib/auth'
import { GrowthChart } from '@/components/villa/GrowthChart'

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
  const [measurements, setMeasurements] = useState<BabyMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [milestoneType, setMilestoneType] = useState('')
  const [milestoneDate, setMilestoneDate] = useState('')
  const [milestoneNote, setMilestoneNote] = useState('')
  const [showAddMeasure, setShowAddMeasure] = useState(false)
  const [measureDate, setMeasureDate] = useState(new Date().toISOString().slice(0, 10))
  const [measureWeight, setMeasureWeight] = useState('')
  const [measureHeight, setMeasureHeight] = useState('')
  const [measureHead, setMeasureHead] = useState('')

  useEffect(() => {
    loadBaby()
  }, [id])

  async function loadBaby() {
    try {
      const b = await getBaby(id)
      if (b) {
        setBaby(b)
        const [m, meas] = await Promise.all([getMilestones(id), getBabyMeasurements(id)])
        setMilestones(m)
        setMeasurements(meas)
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

  async function handleAddMeasurement() {
    if (!baby) return
    const w = measureWeight ? parseFloat(measureWeight) : null
    const h = measureHeight ? parseFloat(measureHeight) : null
    const hc = measureHead ? parseFloat(measureHead) : null
    if (!measureDate || (w == null && h == null && hc == null)) {
      toast.error(t('baby.measureMissing') || 'Add a date and at least one value')
      return
    }
    try {
      await saveBabyMeasurement({
        baby_id: baby.id,
        date: measureDate,
        weight_kg: w,
        height_cm: h,
        head_circumference_cm: hc,
      })
      setShowAddMeasure(false)
      setMeasureWeight('')
      setMeasureHeight('')
      setMeasureHead('')
      loadBaby()
      toast.success(t('baby.measureAdded') || 'Measurement added')
    } catch (err) {
      console.error('❌ Error adding measurement:', err)
      toast.error(t('baby.measureError') || 'Could not add measurement')
    }
  }

  async function handleDeleteMeasurement(measurementId: string) {
    if (!confirm(t('baby.measureDeleteConfirm') || 'Delete this measurement?')) return
    try {
      await deleteBabyMeasurement(measurementId)
      loadBaby()
      toast.success(t('baby.measureDeleted') || 'Measurement deleted')
    } catch (err) {
      console.error('❌ Error deleting measurement:', err)
      toast.error(t('baby.measureError') || 'Could not delete')
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

      {/* Growth tracking */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-lg">
            <TrendingUp className="h-5 w-5 text-accent" /> {t('baby.growth') || 'Growth'}
          </h2>
          <button
            onClick={() => setShowAddMeasure(!showAddMeasure)}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> {t('baby.addMeasurement') || 'Add measurement'}
          </button>
        </div>

        {showAddMeasure && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <label className="mb-3 block text-xs text-muted-foreground">
              {t('baby.measureDate') || 'Date'}
              <input
                type="date"
                value={measureDate}
                onChange={(e) => setMeasureDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="block text-xs text-muted-foreground">
                {t('baby.weight') || 'Weight'} (kg)
                <input
                  type="number" step="0.01" inputMode="decimal"
                  value={measureWeight}
                  onChange={(e) => setMeasureWeight(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                {t('baby.height') || 'Height'} (cm)
                <input
                  type="number" step="0.1" inputMode="decimal"
                  value={measureHeight}
                  onChange={(e) => setMeasureHeight(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                {t('baby.head') || 'Head'} (cm)
                <input
                  type="number" step="0.1" inputMode="decimal"
                  value={measureHead}
                  onChange={(e) => setMeasureHead(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>
            </div>
            <button
              onClick={handleAddMeasurement}
              className="mt-3 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
            >
              {t('baby.addMeasurement') || 'Add measurement'}
            </button>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <GrowthChart birthDate={baby.birth_date} sex={baby.gender} measurements={measurements} />
        </div>

        {measurements.length > 0 && (
          <div className="mt-3 space-y-2">
            {[...measurements].reverse().map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
              >
                <div className="flex flex-wrap items-center gap-x-3">
                  <span className="text-muted-foreground">{new Date(m.date).toLocaleDateString()}</span>
                  {m.weight_kg != null && <span>{m.weight_kg} kg</span>}
                  {m.height_cm != null && <span>{m.height_cm} cm</span>}
                  {m.head_circumference_cm != null && (
                    <span className="text-muted-foreground">{t('baby.head') || 'Head'} {m.head_circumference_cm} cm</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteMeasurement(m.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

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
