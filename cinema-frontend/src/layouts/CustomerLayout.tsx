import type { FormEvent } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import './CustomerLayout.css'

type CustomerLayoutProps = {
  accountRole: string | null
}

export default function CustomerLayout({ accountRole }: CustomerLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search).get('q') ?? ''

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const searchTerm = String(form.get('q') ?? '').trim()

    navigate(searchTerm ? `/?${new URLSearchParams({ q: searchTerm })}` : '/')
  }

  return (
    <div className="customer-layout">
      <header className="customer-header">
        <nav className="customer-nav" aria-label="Điều hướng chính">
          <Link className="customer-brand" to="/">
            <svg
              className="customer-brand-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7Z" />
              <path d="M14 9v1m0 2v1m0 2v1" />
            </svg>
            <span className="customer-wordmark">Cine<strong>Spot</strong></span>
          </Link>

          <ul className="customer-nav-links">
            <li><Link to="/">Movies</Link></li>
            <li><span aria-disabled="true">Showtimes</span></li>
            <li><span aria-disabled="true">Cinemas</span></li>
            <li><span aria-disabled="true">Offers</span></li>
            <li><span aria-disabled="true">Membership</span></li>
            {accountRole === 'ADMIN' && (
              <li><Link to="/admin">Quản trị</Link></li>
            )}
          </ul>

          <form className="customer-search" role="search" onSubmit={handleSearch}>
            <input
              key={query}
              name="q"
              type="search"
              aria-label="Search movies by title"
              placeholder="Search movies"
              defaultValue={query}
            />
            <button type="submit" aria-label="Search movies">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6" />
                <path d="m15 15 4 4" />
              </svg>
            </button>
          </form>

          <Link className="customer-sign-in" to="/login">
            {accountRole ? 'Tài khoản' : 'Đăng nhập'}
          </Link>
        </nav>
      </header>

      <main className="customer-main">
        <Outlet />
      </main>
    </div>
  )
}