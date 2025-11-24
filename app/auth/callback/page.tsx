'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { tokenManager, sessionManager } from '@/lib/auth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token')
      const error = searchParams.get('error')
      const details = searchParams.get('details')

      console.log('Auth callback:', { token: token ? 'present' : 'missing', error, details })

      if (error) {
        const errorMsg = details ? `${error}: ${details}` : error
        router.push(`/login?error=${encodeURIComponent(errorMsg)}`)
        return
      }

      if (token) {
        // Store token securely
        tokenManager.setToken(token, 7 * 24 * 60 * 60) // 7 days
        
        // Fetch user data to create session
        try {
          const { get } = await import('@/lib/api')
          const response = await get('/users/me')
          
          if (response.data?.user) {
            sessionManager.createSession(response.data.user)
          }
        } catch (error) {
          console.error('Error fetching user:', error)
        }
        
        console.log('Token stored, redirecting to dashboard')
        router.push('/dashboard')
      } else {
        console.error('No token received in callback')
        router.push('/login?error=no_token')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}

