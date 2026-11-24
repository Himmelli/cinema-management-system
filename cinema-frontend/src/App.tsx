import { Link, Navigate, Outlet, Route, Routes } from 'react-router'
import { useAuthSession } from './auth/useAuthSession'
import type { AuthSession } from './auth/useAuthSession'
import AdminLayout from './layouts/AdminLayout'
import CustomerLayout from './layouts/CustomerLayout'
import CinemasPage from './pages/admin/CinemasPage'
import GenresPage from './pages/admin/GenresPage'
import MoviesPage from './pages/admin/MoviesPage'
import RoomsPage from './pages/admin/RoomsPage'
import RoomSeatsPage from './pages/admin/RoomSeatsPage'
import ShowtimesPage from './pages/admin/ShowtimesPage'
import HomePage from './pages/customer/HomePage'
import SignInPage from './pages/SignInPage'
import MovieDetailPage from './pages/customer/MovieDetailPage'

function RequireAdmin({ session }: { session: AuthSession }) {
  if (session.isRestoring) {
    return <p role="status">Checking your session&hellip;</p>
  }

  if (!session.user) {
    return <Navigate to="/login" replace />
  }

  if (session.user.role !== 'ADMIN') {
    return (
      <main>
        <h1>Access denied</h1>
        <p>You need an administrator account to view this page.</p>
        <Link to="/">Back to home</Link>
      </main>
    )
  }

  return <Outlet />
}

export default function App() {
  const session = useAuthSession()

  return (
    <Routes>
      <Route element={<CustomerLayout accountRole={session.user?.role ?? null} />}>
        <Route index element={<HomePage />} />
        <Route path="movies/:movieId" element={<MovieDetailPage />} />
        <Route path="login" element={<SignInPage session={session} />} />
        <Route
          path="*"
          element={
            <>
              <h1>404 &mdash; Page not found</h1>
              <Link to="/">Back to home</Link>
            </>
          }
        />
      </Route>

      <Route element={<RequireAdmin session={session} />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<h1>Admin Dashboard</h1>} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="genres" element={<GenresPage />} />
          <Route path="cinemas" element={<CinemasPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="rooms/:roomId/seats" element={<RoomSeatsPage />} />
          <Route path="showtimes" element={<ShowtimesPage />} />
        </Route>
      </Route>
    </Routes>
  )
}