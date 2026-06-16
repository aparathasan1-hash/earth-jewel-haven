import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/auth/update-password')({
  head: () => ({
    meta: [
      { title: 'Update Password — The Villageless Mama' },
      { name: 'description', content: 'Set your new password.' },
    ],
  }),
  component: UpdatePasswordPage,
})

function UpdatePasswordPage() {
  const t = useT()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) {
      toast.error('Invalid reset link')
      navigate({ to: '/auth/reset-password' })
    }
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!password.trim()) {
      toast.error(t('auth.passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'))
      return
    }

    if (password.length < 6) {
      toast.error(t('auth.passwordTooShort'))
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      })

      if (error) {
        console.error('❌ Password update error:', error)
        toast.error(t('auth.passwordUpdateError'))
        return
      }

      toast.success(t('auth.passwordUpdated'))
      setTimeout(() => {
        navigate({ to: '/auth/login' })
      }, 1000)
    } catch (err) {
      console.error('❌ Update password error:', err)
      toast.error(t('auth.passwordUpdateError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5">
      <div className="w-full">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
            <Lock className="h-5 w-5" />
          </div>
        </div>

        <h1 className="font-serif text-2xl">{t('auth.updatePassword')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('auth.updatePasswordDesc')}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
              placeholder="••••••"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t('auth.confirmPassword')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
              placeholder="••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> {t('auth.pleaseWait')}
              </span>
            ) : (
              t('auth.updatePassword')
            )}
          </button>
        </form>

        <div className="mt-6">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t('auth.login')}
          </Link>
        </div>
      </div>
    </div>
  )
}
