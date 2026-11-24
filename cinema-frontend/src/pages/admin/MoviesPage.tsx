import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { deleteMovie, listMovies } from '../../api/movies'
import type { MovieSummary } from '../../api/movies'
import MovieForm from './MovieForm'
import './MoviesPage.css'

function getLoadError(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status

    if (status === 401) {
      return 'Your session has expired. Reload the page to continue.'
    }

    if (status === 403) {
      return 'You do not have permission to view movies.'
    }
  }

  return 'Unable to load movies. Reload the page to try again.'
}

function getDeleteError(error: unknown): string {
  if (isAxiosError<{ detail?: string }>(error)) {
    const status = error.response?.status

    if (status === 409) {
      return error.response?.data?.detail || 'This movie cannot be deleted.'
    }

    if (status === 404) {
      return 'This movie no longer exists. Reload the page to continue.'
    }

    if (status === 401) {
      return 'Your session has expired. Reload the page to continue.'
    }

    if (status === 403) {
      return 'The request was denied. Reload the page and try again.'
    }
  }

  return 'Unable to delete the movie. Please try again.'
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<MovieSummary[] | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [movieToDelete, setMovieToDelete] = useState<MovieSummary | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const rowActionsLocked = editingId !== null || movieToDelete !== null

  useEffect(() => {
    const controller = new AbortController()

    void listMovies(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setMovies(items)
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setErrorMessage(getLoadError(error))
        }
      })

    return () => controller.abort()
  }, [])

  function handleMovieSaved(saved: MovieSummary) {
    setMovies((current) => {
      const otherMovies = (current ?? []).filter((movie) => movie.id !== saved.id)

      return [...otherMovies, saved].sort(
        (first, second) =>
          first.title.localeCompare(second.title, 'en') || first.id - second.id,
      )
    })

    setSuccessMessage(
      editingId === saved.id
        ? `${saved.title} was updated.`
        : `${saved.title} was added as a draft.`,
    )
    setEditingId((current) => current === saved.id ? null : current)
  }

  function startDeleting(movie: MovieSummary) {
    setMovieToDelete(movie)
    setDeleteError('')
    setSuccessMessage('')
  }

  function cancelDeleting() {
    setMovieToDelete(null)
    setDeleteError('')
  }

  async function confirmDeletion() {
    if (movieToDelete === null || isDeleting) {
      return
    }

    const { id, title } = movieToDelete
    setDeleteError('')
    setIsDeleting(true)

    try {
      await deleteMovie(id)
      setMovies((current) => current?.filter((movie) => movie.id !== id) ?? [])
      setMovieToDelete(null)
      setSuccessMessage(`${title} was deleted.`)
    } catch (error) {
      setDeleteError(getDeleteError(error))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="movies-page">
      <h1>Movies</h1>

      {successMessage && <p role="status">{successMessage}</p>}
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {!errorMessage && movies === null && <p role="status">Loading movies…</p>}

      {movies !== null && (
        <div className="movies-grid">
          <section className="movies-panel" aria-labelledby="movie-list-heading">
            <h2 id="movie-list-heading">Movie list</h2>

            {movies.length === 0 ? (
              <p>No movies found.</p>
            ) : (
              <div className="movies-table-scroll">
                <table className="movies-table" aria-labelledby="movie-list-heading">
                  <thead>
                    <tr>
                      <th scope="col">Title</th>
                      <th scope="col">Duration</th>
                      <th scope="col">Release date</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies.map((movie) => (
                      <tr key={movie.id}>
                        <th scope="row">{movie.title}</th>
                        <td>{movie.duration} min</td>
                        <td>{movie.releaseDate ?? '—'}</td>
                        <td><span className="movie-status">{movie.status}</span></td>
                        <td>
                          <div className="movie-actions">
                            <button
                              type="button"
                              aria-label={`Edit ${movie.title}`}
                              disabled={rowActionsLocked}
                              onClick={() => {
                                setSuccessMessage('')
                                setEditingId(movie.id)
                              }}
                            >
                              Edit
                            </button>

                            {movie.status === 'DRAFT' && (
                              <button
                                type="button"
                                aria-label={`Delete ${movie.title}`}
                                disabled={rowActionsLocked}
                                onClick={() => startDeleting(movie)}
                              >
                                Delete
                              </button>
                            )}
                          </div>

                          {movieToDelete?.id === movie.id && (
                            <div
                              className="movie-delete-confirmation"
                              role="group"
                              aria-label={`Confirm deletion of ${movie.title}`}
                            >
                              <p>Delete {movie.title}?</p>
                              <div className="movie-actions">
                                <button
                                  className="movie-delete-button"
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={() => void confirmDeletion()}
                                >
                                  {isDeleting ? 'Deleting…' : 'Confirm deletion'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={cancelDeleting}
                                >
                                  Cancel
                                </button>
                              </div>
                              {deleteError && <p role="alert">{deleteError}</p>}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="movies-panel movies-form-panel">
            <MovieForm
              key={editingId ?? 'new'}
              movieId={editingId}
              onSaved={handleMovieSaved}
              onCancel={() => setEditingId(null)}
              disabled={movieToDelete !== null}
            />
          </div>
        </div>
      )}
    </section>
  )
}