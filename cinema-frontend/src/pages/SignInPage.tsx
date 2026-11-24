import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import type { AuthSession } from '../auth/useAuthSession'

type SignInPageProps = {
  session: AuthSession
}

export default function SignInPage({ session }: SignInPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const {
    user,
    errorMessage,
    isRestoring,
    isSubmitting,
    submitSignIn,
    submitSignOut,
  } = session

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitSignIn(email.trim(), password)
    setPassword('')
  }

  if (isRestoring) {
    return <p role="status">Checking your session…</p>
  }

  if (user) {
    return (
      <section>
        <h1>Signed in</h1>
        <p>Welcome, {user.fullName}.</p>
        <p>Role: {user.role}</p>

        {errorMessage && <p role="alert">{errorMessage}</p>}

        <button
          type="button"
          onClick={() => void submitSignOut()}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing out…' : 'Sign out'}
        </button>

        <p><Link to="/">Back to home</Link></p>
      </section>
    )
  }

  return (
    <section>
      <h1>Sign in</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="sign-in-email">Email address</label>
          <input
            id="sign-in-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="sign-in-password">Password</label>
          <input
            id="sign-in-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {errorMessage && <p role="alert">{errorMessage}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}