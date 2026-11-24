import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { restoreSession, signIn, signOut } from '../api/auth'
import type { UserResponse } from '../api/auth'

export function useAuthSession() {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isRestoring, setIsRestoring] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    void restoreSession()
      .then((account) => {
        if (active) {
          setUser(account)
        }
      })
      .catch(() => {
        if (active) {
          setErrorMessage('Unable to restore your session. Please sign in.')
        }
      })
      .finally(() => {
        if (active) {
          setIsRestoring(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function submitSignIn(email: string, password: string) {
    if (isRestoring || isSubmitting) {
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const account = await signIn({ email, password })
      setUser(account)
    } catch (error) {
      const invalidCredentials =
        isAxiosError(error) &&
        error.config?.url === '/auth/login' &&
        error.response?.status === 401

      setErrorMessage(
        invalidCredentials
          ? 'Invalid email or password.'
          : 'Unable to sign in right now. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitSignOut() {
    if (isSubmitting) {
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await signOut()
      setUser(null)
    } catch {
      setErrorMessage('Unable to sign out right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    user,
    errorMessage,
    isRestoring,
    isSubmitting,
    submitSignIn,
    submitSignOut,
  }
}

export type AuthSession = ReturnType<typeof useAuthSession>