import { Link, NavLink, Outlet } from 'react-router'
import './AdminLayout.css'

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin">
          CineSpot
        </Link>

        <nav className="admin-nav" aria-label="Admin navigation">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/movies">Movies</NavLink>
          <NavLink to="/admin/genres">Genres</NavLink>
          <NavLink to="/admin/cinemas">Cinemas</NavLink>
          <NavLink to="/admin/rooms">Rooms</NavLink>
          <NavLink to="/admin/showtimes">Showtimes</NavLink>
        </nav>

        <Link className="admin-back-link" to="/">
          Back to website
        </Link>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}