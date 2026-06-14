import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/auth/callback')({
  component: CallbackPage,
})

function CallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash
      if (!hash) {
        navigate({ to: '/' })
        return
      }

      const params = new URLSearchParams(hash.replace('#', '?'))
      const type = params.get('type')
      const code = params.get('code')

      if (type === 'email_change' || type === 'recovery') {
        setTimeout(() => {
          navigate({ to: '/auth/update-password' })
        }, 2000)
      } else if (type === 'signup') {
        setTimeout(() => {
          navigate({ to: '/auth/login' })
        }, 2000)
      } else {
        setTimeout(() => {
          navigate({ to: '/' })
        }, 2000)
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Confirming your email...</p>
      </div>
    </div>
  )
}
